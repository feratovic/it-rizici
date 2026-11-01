/**
 * Izvoz izvještaja u Excel (UC-A7, scenario S6).
 *
 * Fajl se generiše na serveru pri svakom zahtjevu — bez keširanja.
 * [V2] kandidat za keširanje zaključenih procjena (one se više ne mijenjaju).
 */
import ExcelJS from 'exceljs';

import { DOMENI, NAZIV_DOMENA } from '@/lib/cobit';
import {
  broj2,
  nazivFajla,
  oznakaOdgovora,
  provjeriPristupIzvozu,
  zaglavljaPreuzimanja,
} from '@/lib/izvoz';
import type { Izvjestaj } from '@/lib/podaci';
import {
  COBIT_NAZIV_NIVOA,
  NAZIV_DIJELA,
  nazivOcjeneSekcije,
  prosjek,
  type DioUpitnika,
} from '@/lib/skale';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NASLOV = { bold: true, size: 14 } as const;
const ZAGLAVLJE: Partial<ExcelJS.Style> = {
  font: { bold: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } },
};

function zaglavljeTabele(list: ExcelJS.Worksheet, red: ExcelJS.Row) {
  red.eachCell((celija) => {
    celija.style = ZAGLAVLJE;
  });
  list.views = [{ state: 'frozen', ySplit: red.number }];
}

function listPodataka(knjiga: ExcelJS.Workbook, izvjestaj: Izvjestaj) {
  const { procjena } = izvjestaj;
  const list = knjiga.addWorksheet('Procjena');
  list.columns = [{ width: 24 }, { width: 60 }];

  list.addRow(['Izvještaj o samoprocjeni']).font = NASLOV;
  list.addRow([]);
  list.addRow(['Institucija', procjena.institucija.naziv]);
  list.addRow(['Godina', procjena.godina]);
  list.addRow(['Tip procjene', procjena.tip === 'COBIT' ? 'COBIT samoprocjena' : 'IT upitnik']);
  list.addRow(['Status', procjena.status === 'ZAKLJUCENA' ? 'Zaključena' : 'U toku']);
  list.addRow(['Kreirao', procjena.kreirao.ime]);
  list.addRow(['Kreirano', procjena.kreiranoDana.toLocaleDateString('sr-ME')]);
  if (procjena.zakljucenoDana) {
    list.addRow(['Zaključeno', procjena.zakljucenoDana.toLocaleDateString('sr-ME')]);
  }
  list.addRow(['Izvezeno', new Date().toLocaleString('sr-ME')]);

  return list;
}

function listoviCobit(knjiga: ExcelJS.Workbook, izvjestaj: Izvjestaj, uvod: ExcelJS.Worksheet) {
  const { rezultat, procesi } = izvjestaj.cobit!;

  uvod.addRow([]);
  uvod.addRow(['Prosječan nivo zrelosti', broj2(rezultat.prosjek)]);
  if (rezultat.prosjek !== null) {
    uvod.addRow(['Opis nivoa', COBIT_NAZIV_NIVOA[Math.round(rezultat.prosjek)]]);
  }
  uvod.addRow(['Odgovoreno izjava', `${rezultat.odgovoreno} / ${rezultat.ukupno}`]);
  uvod.addRow(['Skala', '0–5, veća vrijednost znači veću zrelost']);

  // Rezultati po procesima i domenima
  const rez = knjiga.addWorksheet('Rezultati');
  rez.columns = [{ width: 10 }, { width: 60 }, { width: 10 }, { width: 14 }, { width: 14 }];
  zaglavljeTabele(rez, rez.addRow(['Proces', 'Naziv', 'Domen', 'Nivo zrelosti', 'Odgovoreno']));
  for (const p of rezultat.procesi) {
    rez.addRow([p.kod, p.naziv, p.domen, p.nivo, `${p.odgovoreno}/${p.ukupno}`]);
  }
  rez.addRow([]);
  rez.addRow(['Domen', 'Naziv', '', 'Prosjek']).font = { bold: true };
  for (const d of DOMENI) {
    const nivoi = rezultat.procesi
      .filter((p) => p.domen === d)
      .map((p) => p.nivo)
      .filter((n): n is number => n !== null);
    rez.addRow([d, NAZIV_DOMENA[d], '', prosjek(nivoi)]);
  }
  rez.getColumn(4).numFmt = '0.00';

  // Pojedinačni odgovori
  const odg = knjiga.addWorksheet('Odgovori');
  odg.columns = [{ width: 14 }, { width: 8 }, { width: 8 }, { width: 90 }, { width: 14 }];
  zaglavljeTabele(odg, odg.addRow(['Izjava', 'Proces', 'Nivo', 'Tekst izjave', 'Odgovor']));
  for (const p of procesi) {
    for (const i of p.izjave) {
      const red = odg.addRow([i.kod, p.kod, i.nivoZrelosti, i.tekst, oznakaOdgovora(i.odgovor)]);
      red.getCell(4).alignment = { wrapText: true, vertical: 'top' };
    }
  }
}

function listoviUpitnik(knjiga: ExcelJS.Workbook, izvjestaj: Izvjestaj, uvod: ExcelJS.Worksheet) {
  const { rezultat, sekcije } = izvjestaj.upitnik!;

  uvod.addRow([]);
  uvod.addRow(['Ukupna ocjena IT rizika (dio B)', broj2(rezultat.dioB.ukupno)]);
  uvod.addRow(['Ukupna zrelost IT kontrola (dio C)', broj2(rezultat.dioC.ukupno)]);
  uvod.addRow(['Odgovoreno pitanja', `${rezultat.odgovoreno} / ${rezultat.ukupnoPitanja}`]);
  uvod.addRow(['Ocijenjeno sekcija', `${rezultat.ocijenjeno} / ${rezultat.ukupnoOcjena}`]);
  uvod.addRow(['Skala', '1–4, veća vrijednost znači veći rizik, odnosno slabije kontrole']);

  const rez = knjiga.addWorksheet('Rezultati');
  rez.columns = [{ width: 10 }, { width: 10 }, { width: 60 }, { width: 10 }, { width: 60 }];
  zaglavljeTabele(rez, rez.addRow(['Dio', 'Oznaka', 'Naziv', 'Ocjena', 'Značenje']));
  for (const k of rezultat.dioB.kategorije) {
    rez.addRow(['B', k.kod, k.naziv, k.ocjena, k.ocjena === null ? '' : nazivOcjeneSekcije('B', Math.round(k.ocjena))]);
  }
  for (const o of rezultat.dioC.oblasti) {
    rez.addRow(['C', o.kod, o.naziv, o.ocjena, o.ocjena === null ? '' : nazivOcjeneSekcije('C', Math.round(o.ocjena))]).font = { bold: true };
    for (const p of o.podoblasti) {
      rez.addRow(['C', p.kod, p.naziv, p.ocjena, p.ocjena === null ? '' : nazivOcjeneSekcije('C', p.ocjena)]);
    }
  }
  rez.getColumn(4).numFmt = '0.00';

  // Jedan list po dijelu upitnika sa svim odgovorima.
  for (const dio of ['A', 'B', 'C'] as DioUpitnika[]) {
    const list = knjiga.addWorksheet(`Dio ${dio}`);
    list.columns = [{ width: 14 }, { width: 80 }, { width: 24 }, { width: 50 }];
    list.addRow([`Dio ${dio} — ${NAZIV_DIJELA[dio]}`]).font = NASLOV;
    zaglavljeTabele(list, list.addRow(['Oznaka', 'Pitanje', 'Odgovor', dio === 'C' ? '' : 'Objašnjenje']));

    for (const s of sekcije.filter((x) => x.dio === dio)) {
      const naslov = list.addRow([s.kod, s.naziv]);
      naslov.font = { bold: true };

      for (const p of s.pitanja) {
        const red = list.addRow([p.kod, p.tekst, oznakaOdgovora(p.vrijednost), dio === 'C' ? '' : (p.objasnjenje ?? '')]);
        red.getCell(2).alignment = { wrapText: true, vertical: 'top' };
        red.getCell(4).alignment = { wrapText: true, vertical: 'top' };
      }

      if (s.ocjena !== null) {
        list.addRow(['', `Ocjena ${s.kod}: ${s.ocjena} — ${nazivOcjeneSekcije(dio, s.ocjena)}`]).font = { italic: true };
      }
      if (s.prednosti) list.addRow(['', `Prednosti: ${s.prednosti}`]).getCell(2).alignment = { wrapText: true };
      if (s.slabosti) list.addRow(['', `Slabosti: ${s.slabosti}`]).getCell(2).alignment = { wrapText: true };
    }
  }
}

export async function GET(
  _zahtjev: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pristup = await provjeriPristupIzvozu(id);
  if (!pristup.ok) return pristup.odgovor;

  const { izvjestaj } = pristup;
  const knjiga = new ExcelJS.Workbook();
  knjiga.creator = 'Samoprocjena IT rizika';
  knjiga.created = new Date();

  const uvod = listPodataka(knjiga, izvjestaj);
  if (izvjestaj.cobit) listoviCobit(knjiga, izvjestaj, uvod);
  if (izvjestaj.upitnik) listoviUpitnik(knjiga, izvjestaj, uvod);

  const sadrzaj = await knjiga.xlsx.writeBuffer();

  return new Response(sadrzaj as ArrayBuffer, {
    headers: zaglavljaPreuzimanja(
      nazivFajla(izvjestaj, 'xlsx'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ),
  });
}

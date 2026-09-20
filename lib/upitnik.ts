/**
 * Agregacija IT upitnika.
 *
 * Formule su preuzete doslovno iz bloka `Rezultat samoprocjene` izvornog
 * Excel fajla (redovi 485–534). Vidi VERIFIKACIJA.md, sekcija 4.
 *
 *   ocjena kategorije B1..B5  = vrijednost unesena uz kategoriju
 *   ukupno dio B              = ROUND(AVERAGE(B1..B5), 2)
 *
 *   ocjena podoblasti         = vrijednost unesena uz podoblast
 *   ocjena oblasti C1..C8     = ROUND(AVERAGE(ocjene podoblasti), 2)
 *   ocjena oblasti C9, C10    = vrijednost unesena uz oblast (nemaju podoblasti)
 *   ukupno dio C              = ROUND(AVERAGE(C1..C10), 2)
 *
 * ⚠ Ukupna ocjena dijela C je prosjek VEĆ ZAOKRUŽENIH ocjena oblasti, a ne
 *   prosjek svih podoblasti. Redoslijed zaokruživanja mijenja rezultat.
 *
 * ⚠ Skale dijelova B i C su 1–4 i VEĆE JE GORE — suprotno od COBIT nivoa
 *   zrelosti. Bojenje ide isključivo kroz `bojaOcjene1do4` iz lib/skale.ts.
 */
import { zaokruzi2 } from '@/lib/skale';

export type PitanjeZaRacun = {
  kod: string;
};

export type SekcijaZaRacun = {
  kod: string;
  naziv: string;
  dio: string;
  roditeljKod: string | null;
  redniBroj: number;
  pitanja: PitanjeZaRacun[];
};

/**
 * Nosi li sekcija ocjenu. U izvornom fajlu je to spojena ćelija kolone H
 * preko svih redova sekcije — postoji u dijelu B (sve kategorije) i u dijelu C
 * (podoblasti, te oblasti C9 i C10 koje podoblasti nemaju). Dio A se ne ocjenjuje.
 */
export function ocjenjivaSekcija(sekcija: SekcijaZaRacun): boolean {
  if (sekcija.dio === 'B') return true;
  if (sekcija.dio === 'C') return sekcija.pitanja.length > 0;
  return false;
}

/** AVERAGE u Excelu preskače prazne ćelije — neocijenjene sekcije ne ulaze u prosjek. */
function prosjekUnesenih(vrijednosti: (number | null)[]): number | null {
  const unesene = vrijednosti.filter((v): v is number => v !== null);
  if (unesene.length === 0) return null;
  return zaokruzi2(unesene.reduce((a, b) => a + b, 0) / unesene.length);
}

// --- Dio B -----------------------------------------------------------------

export type RedKategorije = {
  kod: string;
  naziv: string;
  ocjena: number | null;
};

export type RezultatDijelaB = {
  kategorije: RedKategorije[];
  /** ROUND(AVERAGE(B1..B5), 2); bez ijedne ocjene je `null` */
  ukupno: number | null;
};

export function rezultatDijelaB(
  sekcije: SekcijaZaRacun[],
  ocjene: Map<string, number>,
): RezultatDijelaB {
  const kategorije = sekcije
    .filter((s) => s.dio === 'B')
    .sort((a, b) => a.redniBroj - b.redniBroj)
    .map((s) => ({
      kod: s.kod,
      naziv: s.naziv,
      ocjena: ocjene.get(s.kod) ?? null,
    }));

  return {
    kategorije,
    ukupno: prosjekUnesenih(kategorije.map((k) => k.ocjena)),
  };
}

// --- Dio C -----------------------------------------------------------------

export type RedOblasti = {
  kod: string;
  naziv: string;
  /** ROUND(AVERAGE(podoblasti), 2), odnosno unesena ocjena kod C9 i C10 */
  ocjena: number | null;
  /** ocjena je unesena direktno, ne izračunata iz podoblasti */
  unesena: boolean;
  podoblasti: RedKategorije[];
};

export type RezultatDijelaC = {
  oblasti: RedOblasti[];
  /** ROUND(AVERAGE(C1..C10), 2) nad već zaokruženim ocjenama oblasti */
  ukupno: number | null;
};

export function rezultatDijelaC(
  sekcije: SekcijaZaRacun[],
  ocjene: Map<string, number>,
): RezultatDijelaC {
  const uDijelu = sekcije
    .filter((s) => s.dio === 'C')
    .sort((a, b) => a.redniBroj - b.redniBroj);

  const oblasti: RedOblasti[] = uDijelu
    .filter((s) => s.roditeljKod === null)
    .map((oblast) => {
      const podoblasti = uDijelu
        .filter((s) => s.roditeljKod === oblast.kod)
        .map((s) => ({
          kod: s.kod,
          naziv: s.naziv,
          ocjena: ocjene.get(s.kod) ?? null,
        }));

      // C9 i C10 nemaju podoblasti — ocjena se unosi uz samu oblast.
      const unesena = podoblasti.length === 0;

      return {
        kod: oblast.kod,
        naziv: oblast.naziv,
        ocjena: unesena
          ? (ocjene.get(oblast.kod) ?? null)
          : prosjekUnesenih(podoblasti.map((p) => p.ocjena)),
        unesena,
        podoblasti,
      };
    });

  return {
    oblasti,
    ukupno: prosjekUnesenih(oblasti.map((o) => o.ocjena)),
  };
}

// --- Popunjenost -----------------------------------------------------------

export type Popunjenost = {
  odgovoreno: number;
  ukupnoPitanja: number;
  ocijenjeno: number;
  ukupnoOcjena: number;
};

/**
 * Brojači za indikator u bočnoj navigaciji. Pitanje se računa kao odgovoreno
 * kada ima nepraznu vrijednost u koloni odgovora — objašnjenje je opciono.
 */
export function popunjenost(
  sekcije: SekcijaZaRacun[],
  odgovoreniKodovi: Set<string>,
  ocijenjeneSekcije: Set<string>,
): Popunjenost {
  let odgovoreno = 0;
  let ukupnoPitanja = 0;
  let ocijenjeno = 0;
  let ukupnoOcjena = 0;

  for (const sekcija of sekcije) {
    ukupnoPitanja += sekcija.pitanja.length;
    for (const pitanje of sekcija.pitanja) {
      if (odgovoreniKodovi.has(pitanje.kod)) odgovoreno += 1;
    }

    if (ocjenjivaSekcija(sekcija)) {
      ukupnoOcjena += 1;
      if (ocijenjeneSekcije.has(sekcija.kod)) ocijenjeno += 1;
    }
  }

  return { odgovoreno, ukupnoPitanja, ocijenjeno, ukupnoOcjena };
}

'use client';

import { useState, useTransition } from 'react';

import {
  snimiUpitnikOcjenu,
  snimiUpitnikOdgovor,
} from '@/app/(app)/procjene/[id]/upitnik/akcije';
import {
  OCJENE_RIZIKA,
  OPCIJE_DA_NE,
  OPCIJE_KONTROLE,
  bojaOcjene1do4,
  nazivOcjeneSekcije,
  type DioUpitnika,
} from '@/lib/skale';
import { rezultatDijelaB, rezultatDijelaC } from '@/lib/upitnik';

export type Pitanje = {
  kod: string;
  redniBroj: number;
  tekst: string;
  uputstvo: string;
  tipOdgovora: 'BROJ' | 'TEKST' | 'DA_NE' | 'IZBOR' | 'DA_NE_DJELIMICNO';
  opcije: string[];
};

export type Sekcija = {
  kod: string;
  naziv: string;
  dio: DioUpitnika;
  roditeljKod: string | null;
  redniBroj: number;
  ocjenjiva: boolean;
  pitanja: Pitanje[];
};

export type Odgovor = { vrijednost: string; objasnjenje: string };
export type Ocjena = { ocjena: number | null; prednosti: string; slabosti: string };

type Props = {
  procjenaId: string;
  dio: DioUpitnika;
  /** Oblasti dijela C dolaze zajedno sa svojim podoblastima, redom iz kataloga. */
  sekcije: Sekcija[];
  pocetniOdgovori: Record<string, Odgovor>;
  pocetneOcjene: Record<string, Ocjena>;
  zakljucena: boolean;
};

type Stanje = 'mirno' | 'snimanje' | 'sacuvano' | 'greska';

const PRAZAN_ODGOVOR: Odgovor = { vrijednost: '', objasnjenje: '' };
const PRAZNA_OCJENA: Ocjena = { ocjena: null, prednosti: '', slabosti: '' };

/**
 * Popunjavanje jednog dijela IT upitnika.
 *
 * [V2] kandidat za virtualizaciju — dio C ima 227 pitanja i sva se renderuju
 *      odjednom (vidi NAPOMENE.md, P6).
 */
export default function ListaPitanja({
  procjenaId,
  dio,
  sekcije,
  pocetniOdgovori,
  pocetneOcjene,
  zakljucena,
}: Props) {
  const [odgovori, setOdgovori] =
    useState<Record<string, Odgovor>>(pocetniOdgovori);
  const [ocjene, setOcjene] = useState<Record<string, Ocjena>>(pocetneOcjene);
  const [stanje, setStanje] = useState<Stanje>('mirno');
  const [poruka, setPoruka] = useState('');
  const [, startTransition] = useTransition();

  function prijaviIshod(
    ishod: { ok: boolean; greska?: string },
    vrati: () => void,
  ) {
    if (ishod.ok) {
      setStanje('sacuvano');
      setPoruka('');
    } else {
      // Vraćanje na prethodno stanje ako snimanje nije uspjelo.
      vrati();
      setStanje('greska');
      setPoruka(ishod.greska ?? 'Snimanje nije uspjelo.');
    }
  }

  function promijeniOdgovor(
    pitanjeKod: string,
    polje: keyof Odgovor,
    sadrzaj: string,
  ) {
    if (zakljucena) return;

    const prethodno = odgovori[pitanjeKod] ?? PRAZAN_ODGOVOR;
    if (prethodno[polje] === sadrzaj) return;

    // Optimistički upis — bez dugmeta „sačuvaj".
    setOdgovori((stari) => ({
      ...stari,
      [pitanjeKod]: { ...prethodno, [polje]: sadrzaj },
    }));
    setStanje('snimanje');

    startTransition(async () => {
      const ishod = await snimiUpitnikOdgovor({
        procjenaId,
        pitanjeKod,
        polje,
        sadrzaj,
      });

      prijaviIshod(ishod, () =>
        setOdgovori((stari) => ({ ...stari, [pitanjeKod]: prethodno })),
      );
    });
  }

  function promijeniOcjenu(
    sekcijaKod: string,
    polje: keyof Ocjena,
    sadrzaj: string,
  ) {
    if (zakljucena) return;

    const prethodno = ocjene[sekcijaKod] ?? PRAZNA_OCJENA;
    const novo: Ocjena =
      polje === 'ocjena'
        ? { ...prethodno, ocjena: Number(sadrzaj) }
        : { ...prethodno, [polje]: sadrzaj };

    setOcjene((stari) => ({ ...stari, [sekcijaKod]: novo }));
    setStanje('snimanje');

    startTransition(async () => {
      const ishod = await snimiUpitnikOcjenu({
        procjenaId,
        sekcijaKod,
        polje,
        sadrzaj,
      });

      prijaviIshod(ishod, () =>
        setOcjene((stari) => ({ ...stari, [sekcijaKod]: prethodno })),
      );
    });
  }

  const oblasti = sekcije.filter((s) => s.roditeljKod === null);

  return (
    <>
      <div className="mb-4 flex h-6 items-center text-sm">
        {zakljucena && (
          <span className="text-gray-500">
            Procjena je zaključena — odgovori se ne mogu mijenjati.
          </span>
        )}
        {!zakljucena && stanje === 'snimanje' && (
          <span className="text-gray-500">Snimanje…</span>
        )}
        {!zakljucena && stanje === 'sacuvano' && (
          <span className="text-green-700">Sačuvano</span>
        )}
        {!zakljucena && stanje === 'greska' && (
          <span className="text-red-700">{poruka}</span>
        )}
      </div>

      <div className="space-y-8">
        {oblasti.map((oblast) => {
          const podoblasti = sekcije.filter((s) => s.roditeljKod === oblast.kod);

          return (
            <section key={oblast.kod} id={oblast.kod}>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">
                {oblast.kod} — {oblast.naziv}
              </h2>

              {/* Oblast sa sopstvenim pitanjima: A1–A4, B1–B5, C9 i C10. */}
              {oblast.pitanja.length > 0 && (
                <SekcijaPitanja
                  dio={dio}
                  sekcija={oblast}
                  odgovori={odgovori}
                  ocjena={ocjene[oblast.kod] ?? PRAZNA_OCJENA}
                  zakljucena={zakljucena}
                  naOdgovor={promijeniOdgovor}
                  naOcjenu={promijeniOcjenu}
                />
              )}

              {podoblasti.length > 0 && (
                <div className="space-y-6">
                  {podoblasti.map((podoblast) => (
                    <div key={podoblast.kod} id={podoblast.kod}>
                      <h3 className="mb-2 text-sm font-medium text-gray-700">
                        {podoblast.kod} {podoblast.naziv}
                      </h3>
                      <SekcijaPitanja
                        dio={dio}
                        sekcija={podoblast}
                        odgovori={odgovori}
                        ocjena={ocjene[podoblast.kod] ?? PRAZNA_OCJENA}
                        zakljucena={zakljucena}
                        naOdgovor={promijeniOdgovor}
                        naOcjenu={promijeniOcjenu}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Dio A se ne ocjenjuje, pa nema ni rezultat. */}
      {dio !== 'A' && <RezultatDijela dio={dio} sekcije={sekcije} ocjene={ocjene} />}
    </>
  );
}

// --- Rezultat dijela -------------------------------------------------------

/**
 * Agregacija se računa iz istog stanja koje se prikazuje, pa se rezultat
 * mijenja odmah po unosu ocjene — bez osvježavanja stranice. Formule su u
 * `lib/upitnik.ts`, iste koje koristi i ekran rezultata procjene.
 */
function RezultatDijela({
  dio,
  sekcije,
  ocjene,
}: {
  dio: DioUpitnika;
  sekcije: Sekcija[];
  ocjene: Record<string, Ocjena>;
}) {
  const unesene = new Map<string, number>();
  for (const [kod, o] of Object.entries(ocjene)) {
    if (o.ocjena !== null && o.ocjena >= 1) unesene.set(kod, o.ocjena);
  }

  const redovi: { kod: string; naziv: string; ocjena: number | null; uvuceno: boolean }[] =
    [];
  let ukupno: number | null;

  if (dio === 'B') {
    const rezultat = rezultatDijelaB(sekcije, unesene);
    for (const k of rezultat.kategorije) {
      redovi.push({ ...k, uvuceno: false });
    }
    ukupno = rezultat.ukupno;
  } else {
    const rezultat = rezultatDijelaC(sekcije, unesene);
    for (const oblast of rezultat.oblasti) {
      // Podoblasti stoje iznad svoje oblasti, kao u bloku „Rezultat samoprocjene".
      for (const p of oblast.podoblasti) {
        redovi.push({ ...p, uvuceno: true });
      }
      redovi.push({
        kod: oblast.kod,
        naziv: oblast.naziv,
        ocjena: oblast.ocjena,
        uvuceno: false,
      });
    }
    ukupno = rezultat.ukupno;
  }

  const boja = bojaOcjene1do4(ukupno === null ? null : Math.round(ukupno));
  const naslov =
    dio === 'B' ? 'Indikatori IT rizika — rezultat' : 'IT kontrole — rezultat';

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-gray-900">{naslov}</h2>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Sekcija</th>
              <th className="w-28 px-4 py-2 text-right font-medium">Ocjena</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {redovi.map((r) => (
              <tr
                key={r.kod}
                className={
                  'border-b border-gray-100 last:border-0 ' +
                  (r.uvuceno ? '' : 'font-medium')
                }
              >
                <td className={'py-2 text-gray-900 ' + (r.uvuceno ? 'pl-8 pr-4' : 'px-4')}>
                  {r.kod} {r.naziv}
                </td>
                <td className="px-4 py-2 text-right">
                  {r.ocjena === null ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    r.ocjena.toFixed(2)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          className={
            'flex items-center justify-between border-t border-gray-200 px-4 py-3 ' +
            boja.pozadina
          }
        >
          <span className="text-sm font-medium text-gray-900">
            Ukupna ocjena dijela {dio}
          </span>
          <span className={'text-lg font-bold tabular-nums ' + boja.tekst}>
            {ukupno === null ? '—' : ukupno.toFixed(2)}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {dio === 'B'
          ? 'Prosjek ocjena kategorija B1–B5. Skala 1–4, veća vrijednost znači veći rizik.'
          : 'Ocjena oblasti je prosjek njenih podoblasti; ukupna ocjena je prosjek već zaokruženih ocjena oblasti. Skala 1–4, veća vrijednost znači slabije kontrole.'}{' '}
        Neocijenjene sekcije ne ulaze u prosjek.
      </p>
    </section>
  );
}

// --- Jedna sekcija ---------------------------------------------------------

function SekcijaPitanja({
  dio,
  sekcija,
  odgovori,
  ocjena,
  zakljucena,
  naOdgovor,
  naOcjenu,
}: {
  dio: DioUpitnika;
  sekcija: Sekcija;
  odgovori: Record<string, Odgovor>;
  ocjena: Ocjena;
  zakljucena: boolean;
  naOdgovor: (pitanjeKod: string, polje: keyof Odgovor, sadrzaj: string) => void;
  naOcjenu: (sekcijaKod: string, polje: keyof Ocjena, sadrzaj: string) => void;
}) {
  const pitanja = [...sekcija.pitanja].sort((a, b) => a.redniBroj - b.redniBroj);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Pitanje</th>
            <th className="w-64 px-4 py-2 text-left font-medium">Odgovor</th>
            {dio !== 'C' && (
              <th className="w-64 px-4 py-2 text-left font-medium">Objašnjenje</th>
            )}
          </tr>
        </thead>
        <tbody>
          {pitanja.map((pitanje) => {
            const odgovor = odgovori[pitanje.kod] ?? PRAZAN_ODGOVOR;

            return (
              <tr
                key={pitanje.kod}
                className="border-b border-gray-100 align-top last:border-0"
              >
                <td className="px-4 py-2">
                  <span className="text-gray-900">{pitanje.tekst}</span>
                  {pitanje.uputstvo !== '' && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {pitanje.uputstvo}
                    </span>
                  )}
                </td>

                <td className="px-4 py-2">
                  <PoljeOdgovora
                    pitanje={pitanje}
                    vrijednost={odgovor.vrijednost}
                    zakljucena={zakljucena}
                    naPromjenu={(sadrzaj) =>
                      naOdgovor(pitanje.kod, 'vrijednost', sadrzaj)
                    }
                  />
                </td>

                {dio !== 'C' && (
                  <td className="px-4 py-2">
                    <PoljeTeksta
                      vrijednost={odgovor.objasnjenje}
                      zakljucena={zakljucena}
                      oznaka={`Objašnjenje uz pitanje: ${pitanje.tekst}`}
                      naPromjenu={(sadrzaj) =>
                        naOdgovor(pitanje.kod, 'objasnjenje', sadrzaj)
                      }
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {sekcija.ocjenjiva && (
        <OcjenaSekcije
          dio={dio}
          sekcija={sekcija}
          ocjena={ocjena}
          zakljucena={zakljucena}
          naOcjenu={naOcjenu}
        />
      )}
    </div>
  );
}

// --- Kontrole odgovora -----------------------------------------------------

function PoljeOdgovora({
  pitanje,
  vrijednost,
  zakljucena,
  naPromjenu,
}: {
  pitanje: Pitanje;
  vrijednost: string;
  zakljucena: boolean;
  naPromjenu: (sadrzaj: string) => void;
}) {
  if (
    pitanje.tipOdgovora === 'DA_NE' ||
    pitanje.tipOdgovora === 'DA_NE_DJELIMICNO'
  ) {
    const opcije =
      pitanje.tipOdgovora === 'DA_NE' ? OPCIJE_DA_NE : OPCIJE_KONTROLE;

    return (
      <div className="flex gap-4">
        {opcije.map((o) => (
          <label key={o.vrijednost} className="flex items-center gap-1.5">
            <input
              type="radio"
              name={pitanje.kod}
              value={o.vrijednost}
              checked={vrijednost === o.vrijednost}
              disabled={zakljucena}
              onChange={() => naPromjenu(o.vrijednost)}
              aria-label={`${pitanje.tekst} — ${o.oznaka}`}
              className="h-4 w-4 cursor-pointer accent-gray-900 disabled:cursor-not-allowed"
            />
            <span className="text-gray-700">{o.oznaka}</span>
          </label>
        ))}
      </div>
    );
  }

  if (pitanje.tipOdgovora === 'IZBOR') {
    return (
      <select
        value={vrijednost}
        disabled={zakljucena}
        onChange={(e) => naPromjenu(e.target.value)}
        aria-label={pitanje.tekst}
        className="polje w-full"
      >
        <option value="">—</option>
        {pitanje.opcije.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  // BROJ i TEKST se snimaju na napuštanje polja, ne na svaki pritisak tastera.
  return (
    <PoljeTeksta
      vrijednost={vrijednost}
      zakljucena={zakljucena}
      oznaka={pitanje.tekst}
      brojcano={pitanje.tipOdgovora === 'BROJ'}
      naPromjenu={naPromjenu}
    />
  );
}

/**
 * Tekstualni unos sa lokalnim stanjem — snima se na napuštanje polja, da svaki
 * pritisak tastera ne bi bio jedan zahtjev prema serveru.
 */
function PoljeTeksta({
  vrijednost,
  zakljucena,
  oznaka,
  brojcano = false,
  naPromjenu,
}: {
  vrijednost: string;
  zakljucena: boolean;
  oznaka: string;
  brojcano?: boolean;
  naPromjenu: (sadrzaj: string) => void;
}) {
  const [tekst, setTekst] = useState(vrijednost);
  const [prikazano, setPrikazano] = useState(vrijednost);

  // Sinhronizacija kada roditelj vrati vrijednost (neuspjelo snimanje).
  if (prikazano !== vrijednost) {
    setPrikazano(vrijednost);
    setTekst(vrijednost);
  }

  const zajednicko = {
    value: tekst,
    disabled: zakljucena,
    'aria-label': oznaka,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setTekst(e.target.value),
    onBlur: () => naPromjenu(tekst),
    className: 'polje w-full',
  };

  return brojcano ? (
    <input type="number" min={0} step="any" {...zajednicko} />
  ) : (
    <textarea rows={2} {...zajednicko} />
  );
}

// --- Ocjena sekcije --------------------------------------------------------

function OcjenaSekcije({
  dio,
  sekcija,
  ocjena,
  zakljucena,
  naOcjenu,
}: {
  dio: DioUpitnika;
  sekcija: Sekcija;
  ocjena: Ocjena;
  zakljucena: boolean;
  naOcjenu: (sekcijaKod: string, polje: keyof Ocjena, sadrzaj: string) => void;
}) {
  const boja = bojaOcjene1do4(ocjena.ocjena);
  const naslov = dio === 'B' ? 'Ocjena rizika' : 'Ocjena nivoa zrelosti';

  return (
    <div className={'border-t border-gray-200 px-4 py-3 ' + boja.pozadina}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm font-medium text-gray-900">
          {naslov} — {sekcija.kod}
        </span>

        <div className="flex gap-3">
          {OCJENE_RIZIKA.map((o) => (
            <label key={o} className="flex items-center gap-1.5">
              <input
                type="radio"
                name={`ocjena-${sekcija.kod}`}
                value={o}
                checked={ocjena.ocjena === o}
                disabled={zakljucena}
                onChange={() => naOcjenu(sekcija.kod, 'ocjena', String(o))}
                aria-label={`${naslov} ${sekcija.kod} — ${o}, ${nazivOcjeneSekcije(dio, o)}`}
                className="h-4 w-4 cursor-pointer accent-gray-900 disabled:cursor-not-allowed"
              />
              <span className="text-sm tabular-nums text-gray-700">{o}</span>
            </label>
          ))}
        </div>

        {ocjena.ocjena !== null && (
          <span className={'text-sm ' + boja.tekst}>
            {nazivOcjeneSekcije(dio, ocjena.ocjena)}
          </span>
        )}
      </div>

      {/* Obrazloženja postoje samo u dijelu C (kolone F i G izvornog fajla). */}
      {dio === 'C' && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-gray-600">
              Prednosti koje dovode do ove ocjene
            </span>
            <PoljeTeksta
              vrijednost={ocjena.prednosti}
              zakljucena={zakljucena}
              oznaka={`Prednosti — ${sekcija.kod}`}
              naPromjenu={(sadrzaj) => naOcjenu(sekcija.kod, 'prednosti', sadrzaj)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-gray-600">
              Slabosti koje dovode do ove ocjene
            </span>
            <PoljeTeksta
              vrijednost={ocjena.slabosti}
              zakljucena={zakljucena}
              oznaka={`Slabosti — ${sekcija.kod}`}
              naPromjenu={(sadrzaj) => naOcjenu(sekcija.kod, 'slabosti', sadrzaj)}
            />
          </label>
        </div>
      )}
    </div>
  );
}

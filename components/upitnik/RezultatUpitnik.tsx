/**
 * Rezultat IT upitnika na ekranu pregleda — ukupne ocjene dijelova B i C,
 * ocjena svake oblasti dijela C i popunjenost sva tri dijela.
 *
 * Serverska komponenta bez ijednog klijentskog bajta: trake su obične `div`
 * širine u procentima. Grafička biblioteka (recharts) namjerno se ne uvodi
 * ovdje — ona ulazi tek u M5, vidi NAPOMENE.md (P4).
 *
 * ⚠ Skala je 1–4 i VEĆE JE GORE — suprotno od COBIT nivoa zrelosti. Boja se
 *   uzima isključivo iz `bojaOcjene1do4`; komponenta sama ne tumači smjer skale.
 */
import Link from 'next/link';

import type { RezultatUpitnik as Rezultat } from '@/lib/podaci';
import type { RedKategorije, RedOblasti } from '@/lib/upitnik';
import {
  NAZIV_DIJELA,
  bojaOcjene1do4,
  nazivOcjeneSekcije,
  type DioUpitnika,
} from '@/lib/skale';

/** Traka 1–4. Neocijenjena sekcija nema ispunu, da se ne bi čitala kao 1. */
function Traka({ ocjena }: { ocjena: number | null }) {
  const boja = bojaOcjene1do4(ocjena === null ? null : Math.round(ocjena));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      {ocjena !== null && (
        <div
          className="h-full rounded-full"
          style={{ width: `${(ocjena / 4) * 100}%`, backgroundColor: boja.hex }}
        />
      )}
    </div>
  );
}

function Ocjena({ ocjena }: { ocjena: number | null }) {
  const boja = bojaOcjene1do4(ocjena === null ? null : Math.round(ocjena));

  if (ocjena === null) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <span className={'text-sm font-semibold tabular-nums ' + boja.tekst}>
      {ocjena.toFixed(2)}
    </span>
  );
}

/** Ukupna ocjena jednog dijela — dio B i dio C imaju odvojene skale i prosjeke. */
function UkupnaOcjena({
  dio,
  ocjena,
  ocijenjeno,
  ukupnoOcjena,
}: {
  dio: DioUpitnika;
  ocjena: number | null;
  ocijenjeno: number;
  ukupnoOcjena: number;
}) {
  const boja = bojaOcjene1do4(ocjena === null ? null : Math.round(ocjena));
  const naslov =
    dio === 'B' ? 'Ukupna ocjena IT rizika' : 'Ukupna zrelost IT kontrola';

  return (
    <div className="kartica">
      <h2 className="text-sm font-semibold text-gray-900">{naslov}</h2>

      <div className="mt-2 flex items-baseline gap-3">
        <span className={'text-4xl font-bold tabular-nums ' + boja.tekst}>
          {ocjena === null ? '—' : ocjena.toFixed(2)}
        </span>
        <span className="text-sm text-gray-500">od 4.00</span>
      </div>

      <p className="mt-1 text-sm text-gray-600">
        {ocjena === null
          ? `Dio ${dio} još nije ocijenjen.`
          : nazivOcjeneSekcije(dio, Math.round(ocjena))}
      </p>

      <div className="mt-5">
        <Traka ocjena={ocjena} />
        <div className="mt-1 flex justify-between text-xs tabular-nums text-gray-400">
          {[1, 2, 3, 4].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Ocijenjeno {ocijenjeno} od {ukupnoOcjena}{' '}
        {dio === 'B' ? 'kategorija' : 'sekcija'}. Neocijenjene ne ulaze u prosjek.
      </p>
    </div>
  );
}

function KarticaOblasti({
  procjenaId,
  oblast,
}: {
  procjenaId: string;
  oblast: RedOblasti;
}) {
  const boja = bojaOcjene1do4(
    oblast.ocjena === null ? null : Math.round(oblast.ocjena),
  );

  return (
    <Link
      href={`/procjene/${procjenaId}/upitnik/c#${oblast.kod}`}
      className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {oblast.kod}
        </span>
        <span className={'text-lg font-bold tabular-nums ' + boja.tekst}>
          {oblast.ocjena === null ? '—' : oblast.ocjena.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 truncate text-xs text-gray-500" title={oblast.naziv}>
        {oblast.naziv}
      </div>
      <div className="mt-2">
        <Traka ocjena={oblast.ocjena} />
      </div>
    </Link>
  );
}

function RedTabele({
  procjenaId,
  dio,
  red,
  uvuceno = false,
}: {
  procjenaId: string;
  dio: DioUpitnika;
  red: RedKategorije;
  uvuceno?: boolean;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td
        className={
          'py-2 font-medium text-gray-900 ' + (uvuceno ? 'pl-8 pr-4' : 'px-4')
        }
      >
        {red.kod}
      </td>
      <td className="px-4 py-2">
        <Link
          href={`/procjene/${procjenaId}/upitnik/${dio.toLowerCase()}#${red.kod}`}
          className="text-gray-900 hover:underline"
        >
          {red.naziv}
        </Link>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Traka ocjena={red.ocjena} />
          </div>
          <Ocjena ocjena={red.ocjena} />
        </div>
      </td>
    </tr>
  );
}

function Tabela({
  naslov,
  napomena,
  children,
}: {
  naslov: string;
  napomena: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-gray-900">{naslov}</h2>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-20 px-4 py-2 text-left font-medium">Oznaka</th>
              <th className="px-4 py-2 text-left font-medium">Naziv</th>
              <th className="w-56 px-4 py-2 text-left font-medium">Ocjena</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-500">{napomena}</p>
    </section>
  );
}

export default function RezultatUpitnik({
  procjenaId,
  rezultat,
  zakljucena,
}: {
  procjenaId: string;
  rezultat: Rezultat;
  zakljucena: boolean;
}) {
  const {
    dioB,
    dioC,
    popunjenostDijelova,
    odgovoreno,
    ukupnoPitanja,
    ocijenjeno,
    ukupnoOcjena,
  } = rezultat;

  if (odgovoreno === 0 && ocijenjeno === 0) {
    return (
      <div className="kartica">
        <h2 className="text-sm font-semibold text-gray-900">
          Rezultat samoprocjene
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Nema unesenih odgovora. Ocjena se prikazuje čim se ocijeni prva
          kategorija dijela B ili prva podoblast dijela C.
        </p>
      </div>
    );
  }

  const nepotpuna = ocijenjeno < ukupnoOcjena;

  return (
    <div className="space-y-6">
      {/* Ukupne ocjene — dio B i dio C imaju odvojene skale i ne sabiraju se. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <UkupnaOcjena
          dio="B"
          ocjena={dioB.ukupno}
          ocijenjeno={popunjenostDijelova.find((p) => p.dio === 'B')?.ocijenjeno ?? 0}
          ukupnoOcjena={
            popunjenostDijelova.find((p) => p.dio === 'B')?.ukupnoOcjena ?? 0
          }
        />
        <UkupnaOcjena
          dio="C"
          ocjena={dioC.ukupno}
          ocijenjeno={popunjenostDijelova.find((p) => p.dio === 'C')?.ocijenjeno ?? 0}
          ukupnoOcjena={
            popunjenostDijelova.find((p) => p.dio === 'C')?.ukupnoOcjena ?? 0
          }
        />
      </div>

      {/* Popunjenost po dijelovima */}
      <div className="kartica">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Popunjenost</h2>

        <dl className="grid gap-4 sm:grid-cols-3">
          {popunjenostDijelova.map((p) => {
            const procenat =
              p.ukupnoPitanja > 0
                ? Math.round((p.odgovoreno / p.ukupnoPitanja) * 100)
                : 0;
            const gotovo =
              p.odgovoreno === p.ukupnoPitanja && p.ocijenjeno === p.ukupnoOcjena;

            return (
              <div key={p.dio}>
                <dt className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/procjene/${procjenaId}/upitnik/${p.dio.toLowerCase()}`}
                    className="truncate text-sm text-gray-900 hover:underline"
                  >
                    Dio {p.dio} — {NAZIV_DIJELA[p.dio]}
                  </Link>
                  <span className="shrink-0 text-xs tabular-nums text-gray-500">
                    {p.odgovoreno}/{p.ukupnoPitanja}
                  </span>
                </dt>
                <dd className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={'h-full ' + (gotovo ? 'bg-green-600' : 'bg-gray-500')}
                      style={{ width: `${procenat}%` }}
                    />
                  </div>
                  <span className="mt-1 block text-xs text-gray-500">
                    {p.ukupnoOcjena > 0
                      ? `ocijenjeno ${p.ocijenjeno}/${p.ukupnoOcjena}`
                      : 'ne ocjenjuje se'}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>

        <p className="mt-4 text-xs text-gray-500">
          Odgovoreno {odgovoreno} od {ukupnoPitanja} pitanja · ocijenjeno{' '}
          {ocijenjeno} od {ukupnoOcjena} sekcija · procjena je{' '}
          {zakljucena ? 'zaključena' : 'u toku'}.
          {nepotpuna &&
            ' Prosjeci obuhvataju samo ocijenjene sekcije i mijenjaće se dok ocjenjivanje traje.'}
        </p>
      </div>

      {/* Oblasti dijela C */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {dioC.oblasti.map((oblast) => (
          <KarticaOblasti
            key={oblast.kod}
            procjenaId={procjenaId}
            oblast={oblast}
          />
        ))}
      </div>

      <Tabela
        naslov="Indikatori IT rizika po kategorijama (dio B)"
        napomena="Skala 1–4, veća vrijednost znači veći rizik. Neocijenjena kategorija ne ulazi u prosjek."
      >
        {dioB.kategorije.map((k) => (
          <RedTabele key={k.kod} procjenaId={procjenaId} dio="B" red={k} />
        ))}
      </Tabela>

      <Tabela
        naslov="Zrelost IT kontrola po oblastima (dio C)"
        napomena="Skala 1–4, veća vrijednost znači slabije kontrole. Ocjena oblasti je prosjek njenih podoblasti; ukupna ocjena je prosjek već zaokruženih ocjena oblasti."
      >
        {dioC.oblasti.map((oblast) => (
          <RedTabele
            key={oblast.kod}
            procjenaId={procjenaId}
            dio="C"
            red={oblast}
          />
        ))}
      </Tabela>
    </div>
  );
}

/**
 * Tri najslabije ocijenjene sekcije. Zaseban izvoz, jer na ekranu pregleda
 * stoji u istom redu sa karticom podataka o procjeni.
 *
 * ⚠ Najslabija je sekcija sa NAJVEĆOM ocjenom — skala 1–4 je obrnuta u odnosu
 *   na COBIT.
 */
export function NajslabijeSekcije({
  procjenaId,
  rezultat,
  koliko = 3,
}: {
  procjenaId: string;
  rezultat: Rezultat;
  koliko?: number;
}) {
  type Red = RedKategorije & { dio: DioUpitnika };

  const sve: Red[] = [
    ...rezultat.dioB.kategorije.map((k) => ({ ...k, dio: 'B' as const })),
    // Podoblasti, ne oblasti: ocjena se unosi na nivou podoblasti.
    ...rezultat.dioC.oblasti.flatMap((o) =>
      o.podoblasti.length > 0
        ? o.podoblasti.map((p) => ({ ...p, dio: 'C' as const }))
        : [{ kod: o.kod, naziv: o.naziv, ocjena: o.ocjena, dio: 'C' as const }],
    ),
  ];

  const najslabije = sve
    .filter((r): r is Red & { ocjena: number } => r.ocjena !== null)
    .sort((a, b) => b.ocjena - a.ocjena)
    .slice(0, koliko);

  if (najslabije.length === 0) return null;

  return (
    <div className="kartica">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        Najslabije ocijenjene sekcije
      </h2>
      <ul className="space-y-2">
        {najslabije.map((r) => (
          <li
            key={r.kod}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <Link
              href={`/procjene/${procjenaId}/upitnik/${r.dio.toLowerCase()}#${r.kod}`}
              className="truncate text-gray-900 hover:underline"
            >
              <span className="font-medium">{r.kod}</span> — {r.naziv}
            </Link>
            <Ocjena ocjena={r.ocjena} />
          </li>
        ))}
      </ul>
    </div>
  );
}

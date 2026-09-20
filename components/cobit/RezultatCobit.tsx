/**
 * Rezultat COBIT samoprocjene na ekranu pregleda — ukupna ocjena, prosjek po
 * domenima i nivo zrelosti svakog od 15 procesa.
 *
 * Serverska komponenta bez ijednog klijentskog bajta: trake su obične `div`
 * širine u procentima. Grafička biblioteka (recharts) namjerno se ne uvodi
 * ovdje — ona ulazi tek u M5, vidi NAPOMENE.md (P4).
 *
 * ⚠ Skala je 0–5 i VEĆE JE BOLJE. Boja se uzima isključivo iz
 *   `bojaNivoaZrelosti` — komponenta sama ne tumači smjer skale.
 */
import Link from 'next/link';

import { DOMENI, NAZIV_DOMENA } from '@/lib/cobit';
import type { RezultatCobit as Rezultat, RezultatProcesa } from '@/lib/podaci';
import {
  COBIT_NAZIV_NIVOA,
  bojaNivoaZrelosti,
  prosjek as prosjekVrijednosti,
} from '@/lib/skale';

/** Traka 0–5. Prazan proces nema ispunu, da se ne bi čitao kao ocjena 0.00. */
function Traka({ nivo }: { nivo: number | null }) {
  const boja = bojaNivoaZrelosti(nivo);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      {nivo !== null && (
        <div
          className="h-full rounded-full"
          style={{ width: `${(nivo / 5) * 100}%`, backgroundColor: boja.hex }}
        />
      )}
    </div>
  );
}

function Ocjena({ nivo }: { nivo: number | null }) {
  const boja = bojaNivoaZrelosti(nivo);

  if (nivo === null) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <span className={'text-sm font-semibold tabular-nums ' + boja.tekst}>
      {nivo.toFixed(2)}
    </span>
  );
}

function KarticaDomena({
  procjenaId,
  domen,
  procesi,
}: {
  procjenaId: string;
  domen: string;
  procesi: RezultatProcesa[];
}) {
  const nivoi = procesi
    .map((p) => p.nivo)
    .filter((n): n is number => n !== null);
  const vrijednost = prosjekVrijednosti(nivoi);
  const boja = bojaNivoaZrelosti(vrijednost);

  return (
    <Link
      href={`/procjene/${procjenaId}/cobit/domen/${domen.toLowerCase()}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {domen}
        </span>
        <span className={'text-lg font-bold tabular-nums ' + boja.tekst}>
          {vrijednost === null ? '—' : vrijednost.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 truncate text-xs text-gray-500" title={NAZIV_DOMENA[domen]}>
        {NAZIV_DOMENA[domen]}
      </div>
      <div className="mt-2">
        <Traka nivo={vrijednost} />
      </div>
    </Link>
  );
}

export default function RezultatCobit({
  procjenaId,
  rezultat,
  zakljucena,
}: {
  procjenaId: string;
  rezultat: Rezultat;
  zakljucena: boolean;
}) {
  const { procesi, prosjek, odgovoreno, ukupno, popunjenihProcesa } = rezultat;

  if (odgovoreno === 0) {
    return (
      <div className="kartica">
        <h2 className="text-sm font-semibold text-gray-900">
          Rezultat samoprocjene
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Nema unesenih odgovora. Ocjena se prikazuje čim se popuni prvi proces.
        </p>
      </div>
    );
  }

  const boja = bojaNivoaZrelosti(prosjek);
  const nazivNivoa =
    prosjek === null ? '' : COBIT_NAZIV_NIVOA[Math.round(prosjek)];
  const nepotpuna = odgovoreno < ukupno;

  return (
    <div className="space-y-6">
      {/* Ukupna ocjena */}
      <div className="kartica">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Prosječan nivo zrelosti
            </h2>
            <div className="mt-2 flex items-baseline gap-3">
              <span className={'text-4xl font-bold tabular-nums ' + boja.tekst}>
                {prosjek === null ? '—' : prosjek.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">od 5.00</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{nazivNivoa}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <dt className="text-gray-500">Odgovoreno izjava</dt>
            <dd className="tabular-nums text-gray-900">
              {odgovoreno} / {ukupno}
            </dd>
            <dt className="text-gray-500">Popunjenih procesa</dt>
            <dd className="tabular-nums text-gray-900">
              {popunjenihProcesa} / {procesi.length}
            </dd>
            <dt className="text-gray-500">Status</dt>
            <dd className="text-gray-900">
              {zakljucena ? 'Zaključena' : 'U toku'}
            </dd>
          </dl>
        </div>

        <div className="mt-5">
          <Traka nivo={prosjek} />
          <div className="mt-1 flex justify-between text-xs tabular-nums text-gray-400">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>

        {nepotpuna && (
          <p className="mt-4 text-xs text-gray-500">
            Procjena nije popunjena do kraja — prosjek obuhvata samo procese sa
            unesenim odgovorima i mijenjaće se dok popunjavanje traje.
          </p>
        )}
      </div>

      {/* Domeni */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {DOMENI.map((domen) => (
          <KarticaDomena
            key={domen}
            procjenaId={procjenaId}
            domen={domen}
            procesi={procesi.filter((p) => p.domen === domen)}
          />
        ))}
      </div>

      {/* Procesi */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-900">
          Nivo zrelosti po procesima
        </h2>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-16 px-4 py-2 text-left font-medium">Proces</th>
                <th className="px-4 py-2 text-left font-medium">Naziv</th>
                <th className="w-56 px-4 py-2 text-left font-medium">Zrelost</th>
                <th className="w-28 px-4 py-2 text-right font-medium">
                  Odgovoreno
                </th>
              </tr>
            </thead>
            <tbody>
              {procesi.map((p) => (
                <tr key={p.kod} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">{p.kod}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/procjene/${procjenaId}/cobit/${p.kod}`}
                      className="text-gray-900 hover:underline"
                    >
                      {p.naziv}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <Traka nivo={p.nivo} />
                      </div>
                      <Ocjena nivo={p.nivo} />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-xs tabular-nums text-gray-500">
                    {p.odgovoreno}/{p.ukupno}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Skala 0–5, veća vrijednost znači veću zrelost. Proces bez odgovora
          nema ocjenu i ne ulazi u prosjek.
        </p>
      </section>

    </div>
  );
}

/**
 * Tri procesa sa najnižom zrelošću. Zaseban izvoz, jer na ekranu pregleda
 * stoji u istom redu sa karticom podataka o procjeni.
 */
export function NajslabijiProcesi({
  procjenaId,
  procesi,
  koliko = 3,
}: {
  procjenaId: string;
  procesi: RezultatProcesa[];
  koliko?: number;
}) {
  // Slabiji procesi prvi — na njima je fokus revizije.
  const najslabiji = procesi
    .filter((p): p is RezultatProcesa & { nivo: number } => p.nivo !== null)
    .sort((a, b) => a.nivo - b.nivo)
    .slice(0, koliko);

  if (najslabiji.length === 0) return null;

  return (
    <div className="kartica">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        Procesi sa najnižom zrelošću
      </h2>
      <ul className="space-y-2">
        {najslabiji.map((p) => (
          <li
            key={p.kod}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <Link
              href={`/procjene/${procjenaId}/cobit/${p.kod}`}
              className="truncate text-gray-900 hover:underline"
            >
              <span className="font-medium">{p.kod}</span> — {p.naziv}
            </Link>
            <Ocjena nivo={p.nivo} />
          </li>
        ))}
      </ul>
    </div>
  );
}

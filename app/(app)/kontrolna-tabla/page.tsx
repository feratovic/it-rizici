import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import { brojaciKontrolneTable, posljednjeProcjene } from '@/lib/podaci';
import { zahtijevajKorisnika } from '@/lib/ovlascenja';

export const metadata = { title: 'Kontrolna tabla' };

function Kartica({ oznaka, broj }: { oznaka: string; broj: number }) {
  return (
    <div className="kartica">
      <div className="text-3xl font-bold text-gray-900">{broj}</div>
      <div className="mt-1 text-sm text-gray-500">{oznaka}</div>
    </div>
  );
}

export default async function KontrolnaTabla() {
  const korisnik = await zahtijevajKorisnika();
  const [brojaci, procjene] = await Promise.all([
    brojaciKontrolneTable(korisnik),
    posljednjeProcjene(korisnik),
  ]);

  return (
    <>
      <Breadcrumbs stavke={[{ oznaka: 'Kontrolna tabla' }]} />
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        Dobrodošli, {korisnik.ime}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kartica oznaka="Institucija" broj={brojaci.institucija} />
        <Kartica oznaka="Ukupno procjena" broj={brojaci.ukupnoProcjena} />
        <Kartica oznaka="Procjena u toku" broj={brojaci.uToku} />
        <Kartica oznaka="Zaključenih procjena" broj={brojaci.zakljucenih} />
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold text-gray-900">
        Posljednje procjene
      </h2>

      {procjene.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nema unesenih procjena.{' '}
          <Link href="/procjene/nova" className="underline">
            Kreirajte prvu procjenu.
          </Link>
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Institucija</th>
                <th className="px-4 py-2 font-medium">Godina</th>
                <th className="px-4 py-2 font-medium">Tip</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {procjene.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2">{p.institucija.naziv}</td>
                  <td className="px-4 py-2">{p.godina}</td>
                  <td className="px-4 py-2">
                    {p.tip === 'COBIT' ? 'COBIT samoprocjena' : 'IT upitnik'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        'rounded px-2 py-0.5 text-xs ' +
                        (p.status === 'ZAKLJUCENA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800')
                      }
                    >
                      {p.status === 'ZAKLJUCENA' ? 'Zaključena' : 'U toku'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/procjene/${p.id}`}
                      className="text-gray-600 underline hover:text-gray-900"
                    >
                      Otvori
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import { dohvatiProcjene } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeOcjenjivati } from '@/lib/ovlascenja';

export const metadata = { title: 'Procjene' };

export default async function StranicaProcjena() {
  const korisnik = await zahtijevajKorisnika();
  const procjene = await dohvatiProcjene(korisnik);

  return (
    <>
      <Breadcrumbs stavke={[{ oznaka: 'Procjene' }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Procjene</h1>
        {mozeOcjenjivati(korisnik.uloga) && (
          <Link href="/procjene/nova" className="dugme">
            Nova procjena
          </Link>
        )}
      </div>

      {procjene.length === 0 ? (
        <p className="text-sm text-gray-500">Nema unesenih procjena.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Institucija</th>
                <th className="px-4 py-2 font-medium">Godina</th>
                <th className="px-4 py-2 font-medium">Tip</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Kreirao</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {procjene.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {p.institucija.naziv}
                  </td>
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
                  <td className="px-4 py-2 text-gray-500">{p.kreirao.ime}</td>
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

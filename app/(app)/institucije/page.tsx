import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import { dohvatiInstitucije } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeOcjenjivati } from '@/lib/ovlascenja';

export const metadata = { title: 'Institucije' };

export default async function StranicaInstitucija() {
  const korisnik = await zahtijevajKorisnika();
  const institucije = await dohvatiInstitucije(korisnik);

  return (
    <>
      <Breadcrumbs stavke={[{ oznaka: 'Institucije' }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Institucije</h1>
        {mozeOcjenjivati(korisnik.uloga) && (
          <Link href="/institucije/nova" className="dugme">
            Nova institucija
          </Link>
        )}
      </div>

      {institucije.length === 0 ? (
        <p className="text-sm text-gray-500">Nema unesenih institucija.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Naziv</th>
                <th className="px-4 py-2 font-medium">Kontakt osoba</th>
                <th className="px-4 py-2 font-medium">E-pošta</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium">Procjena</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {institucije.map((i) => (
                <tr key={i.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">{i.naziv}</td>
                  <td className="px-4 py-2">{i.kontaktOsoba}</td>
                  <td className="px-4 py-2">{i.email}</td>
                  <td className="px-4 py-2">{i.telefon}</td>
                  <td className="px-4 py-2">{i._count.procjene}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/institucije/${i.id}`}
                      className="text-gray-600 underline hover:text-gray-900"
                    >
                      Detalji
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

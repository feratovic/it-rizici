import Link from 'next/link';
import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import { dohvatiInstituciju } from '@/lib/podaci';
import {
  zahtijevajKorisnika,
  mozeVidjetiInstituciju,
  NAZIV_ULOGE,
} from '@/lib/ovlascenja';

export default async function DetaljiInstitucije({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const korisnik = await zahtijevajKorisnika();
  const institucija = await dohvatiInstituciju(id);

  if (!institucija) notFound();
  if (!mozeVidjetiInstituciju(korisnik, institucija.id)) notFound();

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Institucije', putanja: '/institucije' },
          { oznaka: institucija.naziv },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-gray-900">{institucija.naziv}</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="kartica lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Osnovni podaci</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Kontakt osoba</dt>
              <dd className="text-gray-900">{institucija.kontaktOsoba}</dd>
            </div>
            <div>
              <dt className="text-gray-500">E-pošta</dt>
              <dd className="text-gray-900">{institucija.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Telefon</dt>
              <dd className="text-gray-900">{institucija.telefon}</dd>
            </div>
          </dl>

          <h2 className="mb-2 mt-5 text-sm font-semibold text-gray-900">Korisnici</h2>
          {institucija.korisnici.length === 0 ? (
            <p className="text-sm text-gray-500">Nema vezanih korisnika.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {institucija.korisnici.map((k) => (
                <li key={k.id}>
                  {k.ime}{' '}
                  <span className="text-gray-500">({NAZIV_ULOGE[k.uloga]})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="kartica lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Procjene</h2>
          {institucija.procjene.length === 0 ? (
            <p className="text-sm text-gray-500">Nema procjena za ovu instituciju.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2 font-medium">Godina</th>
                  <th className="py-2 font-medium">Tip</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {institucija.procjene.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2">{p.godina}</td>
                    <td className="py-2">
                      {p.tip === 'COBIT' ? 'COBIT samoprocjena' : 'IT upitnik'}
                    </td>
                    <td className="py-2">
                      {p.status === 'ZAKLJUCENA' ? 'Zaključena' : 'U toku'}
                    </td>
                    <td className="py-2 text-right">
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
          )}
        </div>
      </div>
    </>
  );
}

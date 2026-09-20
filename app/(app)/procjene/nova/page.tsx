import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import FormaProcjene from '@/components/FormaProcjene';
import { dohvatiInstitucije } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeOcjenjivati } from '@/lib/ovlascenja';

export const metadata = { title: 'Nova procjena' };

export default async function NovaProcjena() {
  const korisnik = await zahtijevajKorisnika();
  if (!mozeOcjenjivati(korisnik.uloga)) notFound();

  const institucije = await dohvatiInstitucije(korisnik);
  const tekuca = new Date().getFullYear();
  const godine = [tekuca, tekuca - 1, tekuca - 2, tekuca - 3];

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Procjene', putanja: '/procjene' },
          { oznaka: 'Nova procjena' },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-gray-900">Nova procjena</h1>

      {institucije.length === 0 ? (
        <p className="text-sm text-gray-500">
          Prvo unesite bar jednu instituciju.
        </p>
      ) : (
        <FormaProcjene
          institucije={institucije.map((i) => ({ id: i.id, naziv: i.naziv }))}
          godine={godine}
        />
      )}
    </>
  );
}

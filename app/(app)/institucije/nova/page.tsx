import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import FormaInstitucije from '@/components/FormaInstitucije';
import { zahtijevajKorisnika, mozeOcjenjivati } from '@/lib/ovlascenja';

export const metadata = { title: 'Nova institucija' };

export default async function NovaInstitucija() {
  const korisnik = await zahtijevajKorisnika();
  if (!mozeOcjenjivati(korisnik.uloga)) notFound();

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Institucije', putanja: '/institucije' },
          { oznaka: 'Nova institucija' },
        ]}
      />
      <h1 className="mb-6 text-xl font-bold text-gray-900">Nova institucija</h1>
      <FormaInstitucije />
    </>
  );
}

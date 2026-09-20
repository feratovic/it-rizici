import Breadcrumbs from '@/components/Breadcrumbs';
import { dohvatiKorisnika } from '@/lib/podaci';
import { zahtijevajKorisnika, NAZIV_ULOGE } from '@/lib/ovlascenja';

export const metadata = { title: 'Podešavanja' };

export default async function Podesavanja() {
  const sesija = await zahtijevajKorisnika();
  const korisnik = await dohvatiKorisnika(sesija.id);

  return (
    <>
      <Breadcrumbs stavke={[{ oznaka: 'Podešavanja' }]} />
      <h1 className="mb-6 text-xl font-bold text-gray-900">Podešavanja</h1>

      <div className="kartica max-w-lg">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Korisnički nalog</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Ime i prezime</dt>
            <dd className="text-gray-900">{sesija.ime}</dd>
          </div>
          <div>
            <dt className="text-gray-500">E-pošta</dt>
            <dd className="text-gray-900">{sesija.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Uloga</dt>
            <dd className="text-gray-900">{NAZIV_ULOGE[sesija.uloga]}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Institucija</dt>
            <dd className="text-gray-900">
              {korisnik?.institucija?.naziv ?? 'Nije vezan za instituciju'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="kartica mt-4 max-w-lg">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">O okruženju</h2>
        <p className="text-sm text-gray-600">
          Ovo je testno (staging) okruženje. Svi podaci u bazi su sintetički i ne
          odnose se ni na jednu stvarnu instituciju.
        </p>
      </div>
    </>
  );
}

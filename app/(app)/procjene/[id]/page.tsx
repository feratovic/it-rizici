import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import { dohvatiProcjenu } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeVidjetiInstituciju, mozeOcjenjivati } from '@/lib/ovlascenja';
import { promijeniStatus } from '../akcije';

export default async function PregledProcjene({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const korisnik = await zahtijevajKorisnika();
  const procjena = await dohvatiProcjenu(id);

  if (!procjena) notFound();
  if (!mozeVidjetiInstituciju(korisnik, procjena.institucijaId)) notFound();

  const naslov = `${procjena.institucija.naziv} — ${procjena.godina}`;
  const tipOznaka =
    procjena.tip === 'COBIT' ? 'COBIT samoprocjena' : 'IT upitnik';

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Procjene', putanja: '/procjene' },
          { oznaka: naslov },
        ]}
      />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{naslov}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {tipOznaka} · kreirao {procjena.kreirao.ime} ·{' '}
            {procjena.kreiranoDana.toLocaleDateString('sr-ME')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={
              'rounded px-2 py-1 text-xs ' +
              (procjena.status === 'ZAKLJUCENA'
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800')
            }
          >
            {procjena.status === 'ZAKLJUCENA' ? 'Zaključena' : 'U toku'}
          </span>

          {mozeOcjenjivati(korisnik.uloga) && (
            <form action={promijeniStatus}>
              <input type="hidden" name="id" value={procjena.id} />
              <input
                type="hidden"
                name="akcija"
                value={procjena.status === 'ZAKLJUCENA' ? 'otkljucaj' : 'zakljuci'}
              />
              <button type="submit" className="dugme-sporedno py-1.5">
                {procjena.status === 'ZAKLJUCENA' ? 'Otključaj' : 'Zaključi'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="kartica max-w-2xl">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Podaci o procjeni
        </h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Institucija</dt>
            <dd className="text-gray-900">{procjena.institucija.naziv}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Godina</dt>
            <dd className="text-gray-900">{procjena.godina}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Tip</dt>
            <dd className="text-gray-900">{tipOznaka}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Kontakt osoba</dt>
            <dd className="text-gray-900">{procjena.institucija.kontaktOsoba}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-gray-500">
          Popunjavanje se otvara kroz module u bočnoj navigaciji. Odgovori se
          snimaju automatski, bez posebnog potvrđivanja.
        </p>
      </div>
    </>
  );
}

import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import RezultatCobit from '@/components/cobit/RezultatCobit';
import RezultatUpitnik from '@/components/upitnik/RezultatUpitnik';
// [V2] kandidat za dynamic() — grafici se uvoze statički (NAPOMENE.md, P4).
import GrafikCobit from '@/components/grafici/GrafikCobit';
import GrafikUpitnik from '@/components/grafici/GrafikUpitnik';
import { DOMENI, NAZIV_DOMENA } from '@/lib/cobit';
import { dohvatiProcjenu, rezultatCobit, rezultatUpitnik } from '@/lib/podaci';
import {
  zahtijevajKorisnika,
  mozeOcjenjivati,
  mozeVidjetiInstituciju,
} from '@/lib/ovlascenja';
import { prosjek } from '@/lib/skale';

/**
 * Rezultati procjene — grafici, tabele i izvoz izvještaja (mjerna tačka M5).
 * Ovo je ekran scenarija S5 (najveći JavaScript paket) i polazna tačka
 * scenarija S6 (izvoz).
 */
export default async function RezultatiProcjene({
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
  const zakljucena = procjena.status === 'ZAKLJUCENA';

  const cobit = procjena.tip === 'COBIT' ? await rezultatCobit(id) : null;
  const upitnik = procjena.tip === 'IT_UPITNIK' ? await rezultatUpitnik(id) : null;

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Procjene', putanja: '/procjene' },
          { oznaka: naslov, putanja: `/procjene/${id}` },
          { oznaka: 'Rezultati' },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rezultati</h1>
          <p className="mt-1 text-sm text-gray-500">
            {procjena.tip === 'COBIT' ? 'COBIT samoprocjena' : 'IT upitnik'} ·{' '}
            {naslov} · {zakljucena ? 'zaključena' : 'u toku — rezultati su privremeni'}
          </p>
        </div>

        {mozeOcjenjivati(korisnik.uloga) && (
          <div className="flex gap-2">
            <a href={`/procjene/${id}/rezultati/excel`} className="dugme-sporedno" download>
              Izvoz u Excel
            </a>
            <a href={`/procjene/${id}/rezultati/pdf`} className="dugme-sporedno" download>
              Izvoz u PDF
            </a>
          </div>
        )}
      </div>

      {cobit && (
        <div className="space-y-6">
          <GrafikCobit
            procesi={cobit.procesi.map((p) => ({ kod: p.kod, naziv: p.naziv, nivo: p.nivo }))}
            domeni={DOMENI.map((d) => ({
              domen: d,
              naziv: NAZIV_DOMENA[d],
              nivo: prosjek(
                cobit.procesi
                  .filter((p) => p.domen === d)
                  .map((p) => p.nivo)
                  .filter((n): n is number => n !== null),
              ),
            }))}
          />
          <RezultatCobit procjenaId={id} rezultat={cobit} zakljucena={zakljucena} />
        </div>
      )}

      {upitnik && (
        <div className="space-y-6">
          <GrafikUpitnik
            kategorije={upitnik.dioB.kategorije}
            oblasti={upitnik.dioC.oblasti.map((o) => ({
              kod: o.kod,
              naziv: o.naziv,
              ocjena: o.ocjena,
            }))}
          />
          <RezultatUpitnik procjenaId={id} rezultat={upitnik} zakljucena={zakljucena} />
        </div>
      )}
    </>
  );
}

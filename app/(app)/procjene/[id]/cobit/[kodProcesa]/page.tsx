import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import IzjaveProcesa from '@/components/cobit/IzjaveProcesa';
import {
  dohvatiCobitOdgovore,
  dohvatiCobitProces,
  dohvatiProcjenu,
} from '@/lib/podaci';
import { zahtijevajKorisnika, mozeVidjetiInstituciju } from '@/lib/ovlascenja';
import { NAZIV_DOMENA } from '@/lib/cobit';
import type { CobitVrijednost } from '@/lib/skale';

export default async function StranicaProcesa({
  params,
}: {
  params: Promise<{ id: string; kodProcesa: string }>;
}) {
  const { id, kodProcesa } = await params;
  const korisnik = await zahtijevajKorisnika();

  const [procjena, proces] = await Promise.all([
    dohvatiProcjenu(id),
    dohvatiCobitProces(kodProcesa),
  ]);

  if (!procjena || !proces) notFound();
  if (!mozeVidjetiInstituciju(korisnik, procjena.institucijaId)) notFound();

  const sviOdgovori = await dohvatiCobitOdgovore(id);

  const kodoviIzjava = new Set(proces.izjave.map((i) => i.kod));
  const pocetniOdgovori: Record<string, CobitVrijednost> = {};
  for (const o of sviOdgovori) {
    if (kodoviIzjava.has(o.izjavaKod)) {
      pocetniOdgovori[o.izjavaKod] = o.vrijednost;
    }
  }

  const izjave = proces.izjave.map((i) => ({
    kod: i.kod,
    nivoZrelosti: i.nivoZrelosti,
    redniBroj: i.redniBroj,
    tekst: i.tekst,
  }));

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Procjene', putanja: '/procjene' },
          {
            oznaka: `${procjena.institucija.naziv} — ${procjena.godina}`,
            putanja: `/procjene/${id}`,
          },
          { oznaka: 'COBIT', putanja: `/procjene/${id}/cobit` },
          { oznaka: proces.kod },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {proces.kod} — {proces.naziv}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {proces.domen} · {NAZIV_DOMENA[proces.domen] ?? ''} ·{' '}
          {proces.izjave.length} izjava
        </p>
      </div>

      <IzjaveProcesa
        procjenaId={id}
        izjave={izjave}
        pocetniOdgovori={pocetniOdgovori}
        zakljucena={procjena.status === 'ZAKLJUCENA'}
      />
    </>
  );
}

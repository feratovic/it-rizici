import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import ListaPitanja, {
  type Ocjena,
  type Odgovor,
  type Sekcija,
} from '@/components/upitnik/ListaPitanja';
import {
  dohvatiProcjenu,
  dohvatiUpitnikOcjene,
  dohvatiUpitnikOdgovore,
  dohvatiUpitnikSekcije,
} from '@/lib/podaci';
import { zahtijevajKorisnika, mozeVidjetiInstituciju } from '@/lib/ovlascenja';
import { ocjenjivaSekcija } from '@/lib/upitnik';
import {
  DIJELOVI_UPITNIKA,
  NAZIV_DIJELA,
  OPIS_DIJELA,
  type DioUpitnika,
} from '@/lib/skale';

/** `/procjene/:id/upitnik/a` → dio `A`. */
function prepoznajDio(segment: string): DioUpitnika | null {
  const oznaka = segment.toUpperCase();
  return DIJELOVI_UPITNIKA.find((d) => d === oznaka) ?? null;
}

export default async function StranicaDijela({
  params,
}: {
  params: Promise<{ id: string; dio: string }>;
}) {
  const { id, dio: segment } = await params;
  const dio = prepoznajDio(segment);
  if (!dio) notFound();

  const korisnik = await zahtijevajKorisnika();
  const procjena = await dohvatiProcjenu(id);

  if (!procjena) notFound();
  if (!mozeVidjetiInstituciju(korisnik, procjena.institucijaId)) notFound();
  if (procjena.tip !== 'IT_UPITNIK') notFound();

  const [sveSekcije, odgovori, ocjene] = await Promise.all([
    dohvatiUpitnikSekcije(dio),
    dohvatiUpitnikOdgovore(id),
    dohvatiUpitnikOcjene(id),
  ]);

  const sekcije: Sekcija[] = sveSekcije.map((s) => ({
    kod: s.kod,
    naziv: s.naziv,
    dio,
    roditeljKod: s.roditeljKod,
    redniBroj: s.redniBroj,
    ocjenjiva: ocjenjivaSekcija(s),
    pitanja: s.pitanja.map((p) => ({
      kod: p.kod,
      redniBroj: p.redniBroj,
      tekst: p.tekst,
      uputstvo: p.uputstvo,
      tipOdgovora: p.tipOdgovora,
      opcije: p.opcije,
    })),
  }));

  // Odgovori i ocjene se čitaju za cijelu procjenu, pa se ovdje sužavaju na
  // kodove ovog dijela — jedan upit po kolekciji umjesto upita po sekciji.
  const kodoviPitanja = new Set(
    sekcije.flatMap((s) => s.pitanja.map((p) => p.kod)),
  );
  const kodoviSekcija = new Set(sekcije.map((s) => s.kod));

  const pocetniOdgovori: Record<string, Odgovor> = {};
  for (const o of odgovori) {
    if (!kodoviPitanja.has(o.pitanjeKod)) continue;
    pocetniOdgovori[o.pitanjeKod] = {
      vrijednost: o.vrijednost ?? '',
      objasnjenje: o.objasnjenje ?? '',
    };
  }

  const pocetneOcjene: Record<string, Ocjena> = {};
  for (const o of ocjene) {
    if (!kodoviSekcija.has(o.sekcijaKod)) continue;
    pocetneOcjene[o.sekcijaKod] = {
      // Ocjena 0 je zapis nastao unosom obrazloženja prije ocjene.
      ocjena: o.ocjena >= 1 ? o.ocjena : null,
      prednosti: o.prednosti ?? '',
      slabosti: o.slabosti ?? '',
    };
  }

  const brojPitanja = sekcije.reduce((a, s) => a + s.pitanja.length, 0);

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Procjene', putanja: '/procjene' },
          {
            oznaka: `${procjena.institucija.naziv} — ${procjena.godina}`,
            putanja: `/procjene/${id}`,
          },
          { oznaka: `IT upitnik — dio ${dio}` },
        ]}
      />

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          Dio {dio} — {NAZIV_DIJELA[dio]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {brojPitanja} pitanja · {OPIS_DIJELA[dio]}
        </p>
      </div>

      {sekcije.length === 0 ? (
        <p className="text-sm text-gray-500">
          Katalog IT upitnika nije učitan. Pokrenite <code>npm run db:seed</code>.
        </p>
      ) : (
        <ListaPitanja
          procjenaId={id}
          dio={dio}
          sekcije={sekcije}
          pocetniOdgovori={pocetniOdgovori}
          pocetneOcjene={pocetneOcjene}
          zakljucena={procjena.status === 'ZAKLJUCENA'}
        />
      )}
    </>
  );
}

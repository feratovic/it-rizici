import { notFound } from 'next/navigation';

import NavigacijaModula, {
  type StavkaModula,
} from '@/components/NavigacijaModula';
import {
  dohvatiProcjenu,
  popunjenostCobit,
  popunjenostUpitnika,
} from '@/lib/podaci';
import { zahtijevajKorisnika, mozeVidjetiInstituciju } from '@/lib/ovlascenja';
import { DOMENI, NAZIV_DOMENA } from '@/lib/cobit';
import { NAZIV_DIJELA } from '@/lib/skale';

export default async function LayoutProcjene({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const korisnik = await zahtijevajKorisnika();
  const procjena = await dohvatiProcjenu(id);

  if (!procjena) notFound();
  if (!mozeVidjetiInstituciju(korisnik, procjena.institucijaId)) notFound();

  const moduli: StavkaModula[] = [
    { putanja: `/procjene/${id}`, oznaka: 'Pregled' },
  ];

  if (procjena.tip === 'COBIT') {
    // Svaki domen je zaseban ekran, kao što je svaki dio upitnika zaseban —
    // 15 procesa na jednoj listi ne pokazuje dokle se stiglo po fazama.
    const popunjenost = await popunjenostCobit(id);

    for (const domen of DOMENI) {
      const uDomenu = popunjenost.filter((p) => p.domen === domen);
      if (uDomenu.length === 0) continue;

      moduli.push({
        putanja: `/procjene/${id}/cobit/domen/${domen.toLowerCase()}`,
        oznaka: `${domen} — ${NAZIV_DOMENA[domen]}`,
        popunjeno: `${uDomenu.reduce((a, p) => a + p.odgovoreno, 0)}/${uDomenu.reduce((a, p) => a + p.ukupno, 0)}`,
        // Ekran procesa je ispod domena po smislu, ali ne i po putanji.
        podputanje: uDomenu.map((p) => `/procjene/${id}/cobit/${p.kod}`),
      });
    }
  }

  if (procjena.tip === 'IT_UPITNIK') {
    // Svaki dio upitnika je zaseban ekran — dio C ima 227 pitanja, pa bi sva
    // tri dijela na jednoj stranici bila neupotrebljiva.
    for (const dio of await popunjenostUpitnika(id)) {
      // Dio A se ne ocjenjuje, pa se popunjenost mjeri samo odgovorima.
      const popunjeno =
        dio.ukupnoOcjena > 0
          ? `${dio.odgovoreno}/${dio.ukupnoPitanja} · ${dio.ocijenjeno}/${dio.ukupnoOcjena}`
          : `${dio.odgovoreno}/${dio.ukupnoPitanja}`;

      moduli.push({
        putanja: `/procjene/${id}/upitnik/${dio.dio.toLowerCase()}`,
        oznaka: `Dio ${dio.dio} — ${NAZIV_DIJELA[dio.dio]}`,
        popunjeno,
      });
    }
  }

  return (
    <div className="flex gap-6">
      <div className="w-56 shrink-0">
        <NavigacijaModula stavke={moduli} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

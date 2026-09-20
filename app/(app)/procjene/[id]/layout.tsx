import { notFound } from 'next/navigation';

import NavigacijaModula from '@/components/NavigacijaModula';
import { dohvatiProcjenu, popunjenostCobit } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeVidjetiInstituciju } from '@/lib/ovlascenja';

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

  const moduli: { putanja: string; oznaka: string; popunjeno?: string }[] = [
    { putanja: `/procjene/${id}`, oznaka: 'Pregled' },
  ];

  if (procjena.tip === 'COBIT') {
    const popunjenost = await popunjenostCobit(id);
    const odgovoreno = popunjenost.reduce((a, p) => a + p.odgovoreno, 0);
    const ukupno = popunjenost.reduce((a, p) => a + p.ukupno, 0);

    moduli.push({
      putanja: `/procjene/${id}/cobit`,
      oznaka: 'COBIT samoprocjena',
      popunjeno: `${odgovoreno}/${ukupno}`,
    });
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

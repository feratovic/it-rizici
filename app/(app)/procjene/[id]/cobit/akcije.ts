'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { dohvatiProcjenu, sacuvajCobitOdgovor } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeVidjetiInstituciju } from '@/lib/ovlascenja';

const sema = z.object({
  procjenaId: z.string().min(1),
  izjavaKod: z.string().min(1),
  vrijednost: z.enum(['NE', 'UGLAVNOM_NE', 'UGLAVNOM_DA', 'DA']),
});

export type IshodSnimanja = { ok: boolean; greska?: string };

/**
 * Automatsko snimanje jednog odgovora. Poziva se pri svakoj promjeni, bez
 * dugmeta „sačuvaj" — zato mora biti jeftino: jedan `upsert`.
 */
export async function snimiCobitOdgovor(
  ulaz: z.input<typeof sema>,
): Promise<IshodSnimanja> {
  const provjera = sema.safeParse(ulaz);
  if (!provjera.success) {
    return { ok: false, greska: 'Neispravan odgovor.' };
  }

  const { procjenaId, izjavaKod, vrijednost } = provjera.data;

  const korisnik = await zahtijevajKorisnika();
  const procjena = await dohvatiProcjenu(procjenaId);

  if (!procjena) {
    return { ok: false, greska: 'Procjena ne postoji.' };
  }
  if (!mozeVidjetiInstituciju(korisnik, procjena.institucijaId)) {
    return { ok: false, greska: 'Nemate pristup ovoj procjeni.' };
  }
  if (procjena.status === 'ZAKLJUCENA') {
    return { ok: false, greska: 'Procjena je zaključena i ne može se mijenjati.' };
  }

  await sacuvajCobitOdgovor(procjenaId, izjavaKod, vrijednost);

  // Osvježava indikator popunjenosti u bočnoj navigaciji i na listi procesa.
  revalidatePath(`/procjene/${procjenaId}/cobit`);

  return { ok: true };
}

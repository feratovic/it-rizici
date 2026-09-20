'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { kreirajProcjenu, zakljuciProcjenu, otkljucajProcjenu } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeOcjenjivati } from '@/lib/ovlascenja';

const sema = z.object({
  institucijaId: z.string().min(1, 'Izaberite instituciju.'),
  godina: z.coerce.number().int().min(2000).max(2100),
  tip: z.enum(['COBIT', 'IT_UPITNIK']),
});

export type StanjeProcjene = { greska?: string };

export async function sacuvajProcjenu(
  _prethodno: StanjeProcjene,
  formular: FormData,
): Promise<StanjeProcjene> {
  const korisnik = await zahtijevajKorisnika();
  if (!mozeOcjenjivati(korisnik.uloga)) {
    return { greska: 'Nemate ovlašćenje za kreiranje procjena.' };
  }

  const provjera = sema.safeParse({
    institucijaId: formular.get('institucijaId'),
    godina: formular.get('godina'),
    tip: formular.get('tip'),
  });

  if (!provjera.success) {
    return { greska: provjera.error.issues[0].message };
  }

  let novaId: string;
  try {
    const procjena = await kreirajProcjenu({
      ...provjera.data,
      kreiraoId: korisnik.id,
    });
    novaId = procjena.id;
  } catch {
    return {
      greska:
        'Procjena tog tipa za izabranu instituciju i godinu već postoji.',
    };
  }

  revalidatePath('/procjene');
  redirect(`/procjene/${novaId}`);
}

export async function promijeniStatus(formular: FormData) {
  const korisnik = await zahtijevajKorisnika();
  if (!mozeOcjenjivati(korisnik.uloga)) return;

  const id = String(formular.get('id') ?? '');
  const akcija = String(formular.get('akcija') ?? '');
  if (!id) return;

  if (akcija === 'zakljuci') {
    await zakljuciProcjenu(id);
  } else if (akcija === 'otkljucaj') {
    await otkljucajProcjenu(id);
  }

  revalidatePath(`/procjene/${id}`);
  revalidatePath('/procjene');
}

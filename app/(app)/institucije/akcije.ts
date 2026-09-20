'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { kreirajInstituciju } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeOcjenjivati } from '@/lib/ovlascenja';

const sema = z.object({
  naziv: z.string().min(2, 'Naziv mora imati bar dva znaka.'),
  kontaktOsoba: z.string().min(2, 'Unesite kontakt osobu.'),
  email: z.string().email('Neispravna e-pošta.'),
  telefon: z.string().min(3, 'Unesite telefon.'),
});

export type StanjeInstitucije = { greska?: string };

export async function sacuvajInstituciju(
  _prethodno: StanjeInstitucije,
  formular: FormData,
): Promise<StanjeInstitucije> {
  const korisnik = await zahtijevajKorisnika();
  if (!mozeOcjenjivati(korisnik.uloga)) {
    return { greska: 'Nemate ovlašćenje za dodavanje institucija.' };
  }

  const provjera = sema.safeParse({
    naziv: formular.get('naziv'),
    kontaktOsoba: formular.get('kontaktOsoba'),
    email: formular.get('email'),
    telefon: formular.get('telefon'),
  });

  if (!provjera.success) {
    return { greska: provjera.error.issues[0].message };
  }

  try {
    await kreirajInstituciju(provjera.data);
  } catch {
    return { greska: 'Institucija s tim nazivom već postoji.' };
  }

  revalidatePath('/institucije');
  redirect('/institucije');
}

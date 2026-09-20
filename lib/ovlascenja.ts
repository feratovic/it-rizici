import { redirect } from 'next/navigation';
import type { Uloga } from '@prisma/client';

import { auth } from '@/auth';

export type Sesija = {
  id: string;
  ime: string;
  email: string;
  uloga: Uloga;
  institucijaId: string | null;
};

/** Vraća prijavljenog korisnika ili preusmjerava na prijavu. */
export async function zahtijevajKorisnika(): Promise<Sesija> {
  const sesija = await auth();
  if (!sesija?.user) redirect('/prijava');

  return {
    id: sesija.user.id,
    ime: sesija.user.ime,
    email: sesija.user.email ?? '',
    uloga: sesija.user.uloga,
    institucijaId: sesija.user.institucijaId,
  };
}

/** ADMIN i REVIZOR ocjenjuju i zaključuju; KONTAKT_OSOBA samo popunjava. */
export function mozeOcjenjivati(uloga: Uloga): boolean {
  return uloga === 'ADMIN' || uloga === 'REVIZOR';
}

export function mozeUpravljatiKorisnicima(uloga: Uloga): boolean {
  return uloga === 'ADMIN';
}

/** KONTAKT_OSOBA vidi isključivo procjene svoje institucije. */
export function mozeVidjetiInstituciju(
  korisnik: Sesija,
  institucijaId: string,
): boolean {
  if (korisnik.uloga === 'ADMIN' || korisnik.uloga === 'REVIZOR') return true;
  return korisnik.institucijaId === institucijaId;
}

export const NAZIV_ULOGE: Record<Uloga, string> = {
  ADMIN: 'Administrator',
  REVIZOR: 'Revizor',
  KONTAKT_OSOBA: 'Kontakt osoba',
};

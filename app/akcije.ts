'use server';

import { signIn, signOut } from '@/auth';
import { ispravanCsrf, PORUKA_CSRF } from '@/lib/csrf';

export async function odjava(formular: FormData) {
  if (!(await ispravanCsrf(formular))) return;
  await signOut({ redirectTo: '/prijava' });
}

export type StanjePrijave = { greska?: string };

export async function prijava(
  _prethodno: StanjePrijave,
  formular: FormData,
): Promise<StanjePrijave> {
  if (!(await ispravanCsrf(formular))) return { greska: PORUKA_CSRF };

  try {
    await signIn('credentials', {
      email: String(formular.get('email') ?? ''),
      lozinka: String(formular.get('lozinka') ?? ''),
      redirectTo: '/kontrolna-tabla',
    });
    return {};
  } catch (greska) {
    // NextAuth signalizira uspješno preusmjerenje bacanjem NEXT_REDIRECT —
    // to nije greška i mora se proslijediti dalje.
    if (
      greska &&
      typeof greska === 'object' &&
      'digest' in greska &&
      String((greska as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
    ) {
      throw greska;
    }
    return { greska: 'Pogrešna e-pošta ili lozinka.' };
  }
}

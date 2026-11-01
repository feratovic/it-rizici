/**
 * Zajednička logika izvoza izvještaja (Excel i PDF): provjera pristupa,
 * naziv fajla i tekstualni prikaz odgovora.
 */
import { auth } from '@/auth';
import { mozeOcjenjivati, mozeVidjetiInstituciju, type Sesija } from '@/lib/ovlascenja';
import { podaciIzvjestaja, type Izvjestaj } from '@/lib/podaci';
import { COBIT_OPCIJE, OPCIJE_DA_NE, OPCIJE_KONTROLE } from '@/lib/skale';

export type IshodPristupa =
  | { ok: true; izvjestaj: Izvjestaj }
  | { ok: false; odgovor: Response };

/**
 * Izvoz je dozvoljen ulogama koje ocjenjuju (UC-A7). Route handler ne smije
 * preusmjeravati na prijavu kao stranica, nego vraća statusni kod.
 */
export async function provjeriPristupIzvozu(procjenaId: string): Promise<IshodPristupa> {
  const sesija = await auth();
  if (!sesija?.user) {
    return { ok: false, odgovor: new Response('Niste prijavljeni.', { status: 401 }) };
  }

  const korisnik: Sesija = {
    id: sesija.user.id,
    ime: sesija.user.ime,
    email: sesija.user.email ?? '',
    uloga: sesija.user.uloga,
    institucijaId: sesija.user.institucijaId,
  };

  if (!mozeOcjenjivati(korisnik.uloga)) {
    return { ok: false, odgovor: new Response('Nemate ovlašćenje za izvoz.', { status: 403 }) };
  }

  const izvjestaj = await podaciIzvjestaja(procjenaId);
  if (!izvjestaj || !mozeVidjetiInstituciju(korisnik, izvjestaj.procjena.institucijaId)) {
    return { ok: false, odgovor: new Response('Procjena ne postoji.', { status: 404 }) };
  }

  return { ok: true, izvjestaj };
}

/** `Institucija Alfa`, 2026, COBIT → `procjena-institucija-alfa-2026-cobit` */
export function nazivFajla(izvjestaj: Izvjestaj, ekstenzija: string): string {
  const { procjena } = izvjestaj;
  const slug = procjena.institucija.naziv
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'dj')
    .replace(/Đ/g, 'Dj')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const tip = procjena.tip === 'COBIT' ? 'cobit' : 'it-upitnik';
  return `procjena-${slug}-${procjena.godina}-${tip}.${ekstenzija}`;
}

export function zaglavljaPreuzimanja(nazivFajla: string, tipSadrzaja: string): HeadersInit {
  return {
    'Content-Type': tipSadrzaja,
    'Content-Disposition': `attachment; filename="${nazivFajla}"`,
    'Cache-Control': 'no-store',
  };
}

const OZNAKE_ODGOVORA: Record<string, string> = Object.fromEntries([
  ...COBIT_OPCIJE.map((o) => [o.vrijednost, o.oznaka]),
  ...OPCIJE_DA_NE.map((o) => [o.vrijednost, o.oznaka]),
  ...OPCIJE_KONTROLE.map((o) => [o.vrijednost, o.oznaka]),
]);

/** Šifra odgovora (`UGLAVNOM_DA`, `DJELIMICNO`…) u čitljiv tekst. */
export function oznakaOdgovora(vrijednost: string | null): string {
  if (vrijednost === null || vrijednost === '') return '';
  return OZNAKE_ODGOVORA[vrijednost] ?? vrijednost;
}

export function broj2(vrijednost: number | null): string {
  return vrijednost === null ? '—' : vrijednost.toFixed(2);
}

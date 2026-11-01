/**
 * Zaštita formi od CSRF napada — obrazac „double-submit cookie“.            [V2]
 *
 * Uvedeno u V2 na osnovu preporuke alata (ZAP: Absence of Anti-CSRF Tokens).
 * Klijentska komponenta `CsrfPolje` pri prvom prikazu forme generiše nasumičan
 * token, upisuje ga u kolačić i u skriveno polje `csrf_token`. Server akcija
 * prihvata zahtjev samo ako se vrijednost iz polja poklapa sa kolačićem.
 * Napadač sa drugog sajta može natjerati preglednik da pošalje kolačić, ali ne
 * može ni pročitati ni postaviti njegovu vrijednost u polje forme.
 *
 * Next.js server akcije već porede zaglavlja Origin i Host; token je dodatni,
 * nezavisni sloj zaštite i čini zaštitu vidljivom u samoj formi.
 */
import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const CSRF_POLJE = 'csrf_token';
export const CSRF_KOLACIC = 'csrf';

export async function ispravanCsrf(formular: FormData): Promise<boolean> {
  const izForme = formular.get(CSRF_POLJE);
  const izKolacica = (await cookies()).get(CSRF_KOLACIC)?.value;

  if (typeof izForme !== 'string' || !izKolacica) return false;
  if (izForme.length < 32 || izForme.length !== izKolacica.length) return false;

  return timingSafeEqual(Buffer.from(izForme), Buffer.from(izKolacica));
}

export const PORUKA_CSRF =
  'Sesija forme je istekla ili zahtjev nije poslan iz aplikacije. Osvježite stranicu i pokušajte ponovo.';

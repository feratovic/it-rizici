'use client';

/**
 * Skriveno polje sa CSRF tokenom (vidi lib/csrf.ts).                         [V2]
 *
 * Token se čita iz kolačića ili, ako ga nema, generiše i upisuje. Kolačić je
 * vezan za ovaj sajt (SameSite=Strict) i namjerno nije HttpOnly — skripta ga
 * mora pročitati da bi ga prepisala u formu, što je suština obrasca
 * „double-submit cookie“. Ime polja je standardno, pa ga prepoznaju i alati
 * za sigurnosno skeniranje.
 */
import { useEffect, useState } from 'react';

const POLJE = 'csrf_token';
const KOLACIC = 'csrf';

function procitaj(): string | null {
  const red = document.cookie.split('; ').find((r) => r.startsWith(KOLACIC + '='));
  return red ? decodeURIComponent(red.slice(KOLACIC.length + 1)) : null;
}

function napravi(): string {
  const bajtovi = new Uint8Array(32);
  crypto.getRandomValues(bajtovi);
  const token = Array.from(bajtovi, (b) => b.toString(16).padStart(2, '0')).join('');
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${KOLACIC}=${token}; Path=/; SameSite=Strict; Max-Age=86400${secure}`;
  return token;
}

export default function CsrfPolje() {
  const [token, setToken] = useState('');

  useEffect(() => {
    setToken(procitaj() ?? napravi());
  }, []);

  return <input type="hidden" name={POLJE} value={token} />;
}

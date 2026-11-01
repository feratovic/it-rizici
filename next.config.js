/**
 * V2 — sigurnosna zaglavlja i preusmjerenje početne adrese, uvedeni na osnovu
 * preporuka alata nad verzijom V1 (skeniranje #9, vidi NAPOMENE.md).
 *
 * Namjerno NIJE dodato ono što alat nije preporučio: Strict-Transport-Security
 * (postavlja ga platforma Vercel) i `poweredByHeader: false` (nalaz se nije
 * pojavio). V2 primjenjuje isključivo preporuke alata.
 */

const razvoj = process.env.NODE_ENV !== 'production';

// Next.js App Router umeće skripte sa RSC podacima direktno u HTML, a
// komponente koriste `style` atribute (trake, grafici). Bez 'unsafe-inline'
// aplikacija ne radi; alternativa za skripte je nonce, koji prisiljava
// dinamičko renderovanje svih strana, a `style` atributi se nonceom ne mogu
// pokriti. Zato je CSP restriktivan po izvorima, ali sa 'unsafe-inline'.
// 'unsafe-eval' treba samo razvojnom serveru (React Refresh).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${razvoj ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Vercel statičkim resursima dodaje `Access-Control-Allow-Origin: *`
// (ZAP: Cross-Domain Misconfiguration). Aplikacija nema razloga da svoje
// resurse dijeli sa drugim domenima, pa se zaglavlje sužava na sopstveni domen.
const sopstveniDomen = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const zaglavlja = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
      },
    ];
    if (sopstveniDomen) {
      zaglavlja.push({ key: 'Access-Control-Allow-Origin', value: sopstveniDomen });
    }
    return [{ source: '/:path*', headers: zaglavlja }];
  },

  // ZAP: Big Redirect Detected — preusmjerenje iz `app/page.tsx` vraćalo je
  // cijeli HTML dokument uz status 307. Preusmjerenje na nivou konfiguracije
  // odgovara bez tijela strane, prije renderovanja.
  async redirects() {
    return [{ source: '/', destination: '/kontrolna-tabla', permanent: false }];
  },
};

module.exports = nextConfig;

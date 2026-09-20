/** @type {import('next').NextConfig} */
const nextConfig = {
  // [V2] ovdje ulaze sigurnosni headeri:
  //      async headers() { return [{ source: '/:path*', headers: [ CSP, HSTS,
  //      X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  //      Permissions-Policy ] }] }
  // [V2] ovdje ulazi poweredByHeader: false
  //
  // V1 baseline je namjerno prazan — vidi NAPOMENE.md i SPEC sekciju 8.
};

module.exports = nextConfig;

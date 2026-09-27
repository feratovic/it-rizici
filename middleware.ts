import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Samo provjera sesije. Uvozi se `authConfig` bez providera, jer middleware
// radi u edge runtimeu gdje Prisma i bcrypt nisu dostupni.
//
// [V2] ovdje ulazi rate limiting (npr. brojač po IP adresi nad /api i /prijava)

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // `.well-known` mora ostati izvan provjere sesije: tu stoji datoteka kojom
  // se dokazuje vlasništvo nad domenom, a provjera je nenajavljen anonimni
  // zahtjev. Da je obuhvaćena matcherom, vratila bi redirect na /prijava
  // umjesto sadržaja i provjera ne bi prošla.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|\\.well-known|.*\\.png$|.*\\.svg$).*)',
  ],
};

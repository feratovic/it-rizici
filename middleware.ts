import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Samo provjera sesije. Uvozi se `authConfig` bez providera, jer middleware
// radi u edge runtimeu gdje Prisma i bcrypt nisu dostupni.
//
// [V2] ovdje ulazi rate limiting (npr. brojač po IP adresi nad /api i /prijava)

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\.png$|.*\.svg$).*)'],
};

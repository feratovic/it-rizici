import type { NextAuthConfig } from 'next-auth';
import type { Uloga } from '@prisma/client';

/**
 * Osnovna konfiguracija bez providera. Razdvojena je od `auth.ts` da bi je
 * middleware mogao uvesti bez povlačenja Prisme i bcrypta u edge runtime.
 */
export const authConfig = {
  pages: {
    signIn: '/prijava',
  },

  // [V2] ovdje ulazi eksplicitno podešavanje kolačića:
  //      cookies: { sessionToken: { options: { secure: true, sameSite: 'lax',
  //      httpOnly: true } } }
  //      U V1 se oslanjamo isključivo na NextAuth podrazumijevane vrijednosti.

  session: { strategy: 'jwt' },

  callbacks: {
    authorized({ auth, request }) {
      const prijavljen = !!auth?.user;
      const putanja = request.nextUrl.pathname;

      if (putanja === '/prijava') {
        if (prijavljen) {
          return Response.redirect(new URL('/kontrolna-tabla', request.nextUrl));
        }
        return true;
      }

      return prijavljen;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.ime = user.ime;
        token.uloga = user.uloga;
        token.institucijaId = user.institucijaId;
      }
      return token;
    },

    session({ session, token }) {
      // Augmentacija tipa JWT u next-auth v5 beta nije pouzdana, pa se
      // polja koja sami upisujemo u `jwt` callbacku ovdje čitaju eksplicitno.
      const podaci = token as unknown as {
        id: string;
        ime: string;
        uloga: Uloga;
        institucijaId: string | null;
      };

      session.user.id = podaci.id;
      session.user.ime = podaci.ime;
      session.user.uloga = podaci.uloga;
      session.user.institucijaId = podaci.institucijaId;
      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;

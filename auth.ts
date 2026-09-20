import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { authConfig } from './auth.config';
import { prisma } from './lib/prisma';

const semaPrijave = z.object({
  email: z.string().email(),
  lozinka: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-pošta', type: 'email' },
        lozinka: { label: 'Lozinka', type: 'password' },
      },
      async authorize(podaci) {
        const provjera = semaPrijave.safeParse(podaci);
        if (!provjera.success) return null;

        const { email, lozinka } = provjera.data;

        const korisnik = await prisma.korisnik.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!korisnik) return null;

        // Lozinke se hešuju i u baseline verziji — to nije mjerljivo spolja
        // i nije dio eksperimenta (vidi SPEC sekciju 2).
        const ispravna = await bcrypt.compare(lozinka, korisnik.lozinkaHash);
        if (!ispravna) return null;

        return {
          id: korisnik.id,
          email: korisnik.email,
          ime: korisnik.ime,
          uloga: korisnik.uloga,
          institucijaId: korisnik.institucijaId,
        };
      },
    }),
  ],
});

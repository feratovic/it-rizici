import type { Uloga } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    ime: string;
    uloga: Uloga;
    institucijaId: string | null;
  }

  interface Session {
    user: {
      id: string;
      ime: string;
      uloga: Uloga;
      institucijaId: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    ime: string;
    uloga: Uloga;
    institucijaId: string | null;
  }
}

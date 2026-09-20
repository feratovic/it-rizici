import { PrismaClient } from '@prisma/client';

// Keširanje klijenta u globalnoj promjenljivoj. U serverless okruženju (Vercel)
// bez ovoga se otvara nova konekcija po pozivu funkcije i besplatni Atlas M0
// klaster brzo udari u limit istovremenih konekcija.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Jedina tačka pristupa bazi. Komponente ne uvoze `prisma` direktno.
 *
 * [V2] ovdje ulazi keširanje — `unstable_cache` / `revalidate` nad funkcijama
 *      koje čitaju katalog (on je praktično nepromjenljiv), i revalidacija po
 *      tagu nad odgovorima. U V1 svaki poziv ide do baze.
 */
import { prisma } from '@/lib/prisma';
import type { Sesija } from '@/lib/ovlascenja';

// --- Institucije -----------------------------------------------------------

export async function dohvatiInstitucije(korisnik: Sesija) {
  const filter =
    korisnik.uloga === 'KONTAKT_OSOBA' && korisnik.institucijaId
      ? { id: korisnik.institucijaId }
      : {};

  return prisma.institucija.findMany({
    where: filter,
    orderBy: { naziv: 'asc' },
    include: { _count: { select: { procjene: true } } },
  });
}

export async function dohvatiInstituciju(id: string) {
  return prisma.institucija.findUnique({
    where: { id },
    include: {
      procjene: { orderBy: [{ godina: 'desc' }, { tip: 'asc' }] },
      korisnici: { orderBy: { ime: 'asc' } },
    },
  });
}

export async function kreirajInstituciju(podaci: {
  naziv: string;
  kontaktOsoba: string;
  email: string;
  telefon: string;
}) {
  return prisma.institucija.create({ data: podaci });
}

// --- Procjene --------------------------------------------------------------

export async function dohvatiProcjene(korisnik: Sesija) {
  const filter =
    korisnik.uloga === 'KONTAKT_OSOBA' && korisnik.institucijaId
      ? { institucijaId: korisnik.institucijaId }
      : {};

  return prisma.procjena.findMany({
    where: filter,
    orderBy: [{ godina: 'desc' }, { kreiranoDana: 'desc' }],
    include: { institucija: true, kreirao: { select: { ime: true } } },
  });
}

export async function dohvatiProcjenu(id: string) {
  return prisma.procjena.findUnique({
    where: { id },
    include: { institucija: true, kreirao: { select: { ime: true } } },
  });
}

export async function kreirajProcjenu(podaci: {
  institucijaId: string;
  godina: number;
  tip: 'COBIT' | 'IT_UPITNIK';
  kreiraoId: string;
}) {
  return prisma.procjena.create({ data: podaci });
}

export async function zakljuciProcjenu(id: string) {
  return prisma.procjena.update({
    where: { id },
    data: { status: 'ZAKLJUCENA', zakljucenoDana: new Date() },
  });
}

export async function otkljucajProcjenu(id: string) {
  return prisma.procjena.update({
    where: { id },
    data: { status: 'U_TOKU', zakljucenoDana: null },
  });
}

// --- Kontrolna tabla -------------------------------------------------------

export async function brojaciKontrolneTable(korisnik: Sesija) {
  const filterProcjena =
    korisnik.uloga === 'KONTAKT_OSOBA' && korisnik.institucijaId
      ? { institucijaId: korisnik.institucijaId }
      : {};
  const filterInstitucija =
    korisnik.uloga === 'KONTAKT_OSOBA' && korisnik.institucijaId
      ? { id: korisnik.institucijaId }
      : {};

  const [institucija, ukupnoProcjena, uToku, zakljucenih] = await Promise.all([
    prisma.institucija.count({ where: filterInstitucija }),
    prisma.procjena.count({ where: filterProcjena }),
    prisma.procjena.count({ where: { ...filterProcjena, status: 'U_TOKU' } }),
    prisma.procjena.count({ where: { ...filterProcjena, status: 'ZAKLJUCENA' } }),
  ]);

  return { institucija, ukupnoProcjena, uToku, zakljucenih };
}

export async function posljednjeProcjene(korisnik: Sesija, koliko = 5) {
  const filter =
    korisnik.uloga === 'KONTAKT_OSOBA' && korisnik.institucijaId
      ? { institucijaId: korisnik.institucijaId }
      : {};

  return prisma.procjena.findMany({
    where: filter,
    orderBy: { kreiranoDana: 'desc' },
    take: koliko,
    include: { institucija: true },
  });
}

// --- Korisnici -------------------------------------------------------------

export async function dohvatiKorisnika(id: string) {
  return prisma.korisnik.findUnique({
    where: { id },
    include: { institucija: true },
  });
}

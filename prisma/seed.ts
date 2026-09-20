/**
 * Seed baze. MORA biti idempotentan — pokreće se više puta tokom razvoja,
 * na svakoj mjernoj tački. Sve ide kroz `upsert` po stabilnim ključevima.
 *
 * Svi podaci su sintetički. Nijedan naziv ne odgovara stvarnoj instituciji.
 *
 * Pokretanje: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- Institucije -----------------------------------------------------------

const INSTITUCIJE = [
  {
    naziv: 'Institucija Alfa',
    kontaktOsoba: 'Marko Marković',
    email: 'kontakt@alfa.test',
    telefon: '+382 20 000 001',
  },
  {
    naziv: 'Institucija Beta',
    kontaktOsoba: 'Jelena Jelić',
    email: 'kontakt@beta.test',
    telefon: '+382 20 000 002',
  },
];

// --- Korisnici -------------------------------------------------------------
// Lozinke su sintetičke i namjerno iste, radi lakšeg testiranja.

const LOZINKA = 'lozinka123';

const KORISNICI: {
  email: string;
  ime: string;
  uloga: 'ADMIN' | 'REVIZOR' | 'KONTAKT_OSOBA';
  institucija?: string;
}[] = [
  { email: 'admin@revizija.test', ime: 'Ana Adminović', uloga: 'ADMIN' },
  { email: 'revizor@revizija.test', ime: 'Rade Revizović', uloga: 'REVIZOR' },
  {
    email: 'kontakt@alfa.test',
    ime: 'Marko Marković',
    uloga: 'KONTAKT_OSOBA',
    institucija: 'Institucija Alfa',
  },
];

async function seedInstitucije() {
  const mapa = new Map<string, string>();

  for (const i of INSTITUCIJE) {
    const zapis = await prisma.institucija.upsert({
      where: { naziv: i.naziv },
      update: {
        kontaktOsoba: i.kontaktOsoba,
        email: i.email,
        telefon: i.telefon,
      },
      create: i,
    });
    mapa.set(i.naziv, zapis.id);
  }

  console.log(`  institucije: ${INSTITUCIJE.length}`);
  return mapa;
}

async function seedKorisnike(institucije: Map<string, string>) {
  const lozinkaHash = await bcrypt.hash(LOZINKA, 10);

  for (const k of KORISNICI) {
    const institucijaId = k.institucija
      ? (institucije.get(k.institucija) ?? null)
      : null;

    await prisma.korisnik.upsert({
      where: { email: k.email },
      update: { ime: k.ime, uloga: k.uloga, institucijaId },
      create: {
        email: k.email,
        ime: k.ime,
        uloga: k.uloga,
        institucijaId,
        lozinkaHash,
      },
    });
  }

  console.log(`  korisnici: ${KORISNICI.length} (lozinka za sve: ${LOZINKA})`);
}

async function main() {
  console.log('Seed baze — start');

  const institucije = await seedInstitucije();
  await seedKorisnike(institucije);

  console.log('Seed baze — gotovo');
}

main()
  .catch((greska) => {
    console.error(greska);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

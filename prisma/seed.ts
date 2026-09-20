/**
 * Seed baze. MORA biti idempotentan — pokreće se više puta tokom razvoja,
 * na svakoj mjernoj tački. Sve ide kroz `upsert` po stabilnim ključevima.
 *
 * Svi podaci su sintetički. Nijedan naziv ne odgovara stvarnoj instituciji.
 *
 * Pokretanje: npm run db:seed
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PODACI = join(__dirname, 'podaci');

function ucitaj<T>(naziv: string): T {
  return JSON.parse(readFileSync(join(PODACI, naziv), 'utf-8')) as T;
}

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

// --- COBIT katalog ---------------------------------------------------------
// Tekstovi se čuvaju u prisma/podaci/cobit.json i generišu se iz izvornog
// Excel fajla skriptom alati/izvuci-cobit.py, da bi se mogli regenerisati
// bez diranja koda.

type CobitIzjavaJson = {
  kod: string;
  nivoZrelosti: number;
  redniBroj: number;
  tekst: string;
};

type CobitProcesJson = {
  kod: string;
  naziv: string;
  domen: string;
  redniBroj: number;
  izjave: CobitIzjavaJson[];
};

async function seedCobit() {
  const procesi = ucitaj<CobitProcesJson[]>('cobit.json');

  for (const p of procesi) {
    const izjave = p.izjave.map((i) => ({
      kod: i.kod,
      nivoZrelosti: i.nivoZrelosti,
      redniBroj: i.redniBroj,
      tekst: i.tekst,
    }));

    await prisma.cobitProces.upsert({
      where: { kod: p.kod },
      update: {
        naziv: p.naziv,
        domen: p.domen,
        redniBroj: p.redniBroj,
        izjave,
      },
      create: {
        kod: p.kod,
        naziv: p.naziv,
        domen: p.domen,
        redniBroj: p.redniBroj,
        izjave,
      },
    });
  }

  const ukupnoIzjava = procesi.reduce((a, p) => a + p.izjave.length, 0);
  console.log(`  COBIT: ${procesi.length} procesa, ${ukupnoIzjava} izjava`);
}

// --- IT upitnik, katalog ---------------------------------------------------
// Tekstovi se čuvaju u prisma/podaci/upitnik.json i generišu se iz izvornog
// Excel fajla skriptom alati/izvuci-upitnik.py.

type UpitnikPitanjeJson = {
  kod: string;
  redniBroj: number;
  tekst: string;
  uputstvo: string;
  tipOdgovora: 'BROJ' | 'TEKST' | 'DA_NE' | 'IZBOR' | 'DA_NE_DJELIMICNO';
  opcije: string[];
};

type UpitnikSekcijaJson = {
  kod: string;
  naziv: string;
  dio: 'A' | 'B' | 'C';
  roditeljKod: string | null;
  redniBroj: number;
  pitanja: UpitnikPitanjeJson[];
};

async function seedUpitnik() {
  const sekcije = ucitaj<UpitnikSekcijaJson[]>('upitnik.json');

  for (const s of sekcije) {
    const pitanja = s.pitanja.map((p) => ({
      kod: p.kod,
      redniBroj: p.redniBroj,
      tekst: p.tekst,
      uputstvo: p.uputstvo,
      tipOdgovora: p.tipOdgovora,
      opcije: p.opcije,
    }));

    const podaci = {
      naziv: s.naziv,
      dio: s.dio,
      roditeljKod: s.roditeljKod,
      redniBroj: s.redniBroj,
      pitanja,
    };

    await prisma.upitnikSekcija.upsert({
      where: { kod: s.kod },
      update: podaci,
      create: { kod: s.kod, ...podaci },
    });
  }

  const poDijelu = (dio: string) =>
    sekcije
      .filter((s) => s.dio === dio)
      .reduce((a, s) => a + s.pitanja.length, 0);

  console.log(
    `  IT upitnik: ${sekcije.length} sekcija, ` +
      `${poDijelu('A')} + ${poDijelu('B')} + ${poDijelu('C')} pitanja (A + B + C)`,
  );
}

async function main() {
  console.log('Seed baze — start');

  const institucije = await seedInstitucije();
  await seedKorisnike(institucije);
  await seedCobit();
  await seedUpitnik();

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

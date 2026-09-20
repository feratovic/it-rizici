/**
 * Demo podaci — puni procjene i COBIT odgovore, da bi se aplikacija mogla
 * razgledati sa realističnim sadržajem umjesto praznih ekrana.
 *
 * NIJE dio redovnog seeda. Redovni seed (`npm run db:seed`) unosi samo ono
 * bez čega aplikacija ne radi: institucije, korisnike i COBIT katalog. Ovaj
 * skript se pokreće posebno i pretpostavlja da je redovni seed već prošao:
 *
 *     npm run db:seed        (prvo — katalog mora postojati)
 *     npm run db:seed:demo
 *
 * Sa `npm run db:seed:demo -- --dry` ništa se ne upisuje: katalog se čita iz
 * prisma/podaci/cobit.json, a ispiše se samo šta bi seed napravio i koji bi
 * nivo zrelosti iz toga ispao. Korisno kada baza nije dostupna.
 *
 * Idempotentan je: institucije, korisnici i procjene idu kroz `upsert` po
 * stabilnim ključevima, a odgovori se za svaku procjenu obrišu pa ponovo
 * upišu. Vrijednosti nisu slučajne između pokretanja — generator je
 * determinističan (mulberry32 sa sjemenom izvedenim iz naziva), pa dva
 * pokretanja daju isti sadržaj i isti nivo zrelosti.
 *
 * Svi podaci su sintetički. Nijedan naziv ne odgovara stvarnoj instituciji.
 *
 * Ne pokretati nad bazom sa stvarnim unosima — briše postojeće COBIT
 * odgovore za procjene koje generiše.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { profilZrelosti, prosjecanNivoOrganizacije } from '@/lib/cobit';
import type { CobitVrijednost } from '@/lib/skale';

const prisma = new PrismaClient();

const SUHO = process.argv.includes('--dry');

const LOZINKA = 'lozinka123';

const GODINA_RANIJA = 2024;
const GODINA_TEKUCA = 2025;

// --- Profili institucija ---------------------------------------------------
// `zrelost` je ciljani nivo oko kojeg se generišu odgovori (0–5, veće = bolje).
// Namjerno je raspoređen od slabog do jakog: pet skoro istih institucija ne bi
// pokazalo ništa ni na kontrolnoj tabli ni u poređenju procesa.

type ProfilInstitucije = {
  naziv: string;
  kontaktOsoba: string;
  email: string;
  telefon: string;
  /** ciljani nivo zrelosti za raniju godinu */
  zrelost: number;
  /** pomak naredne godine — Epsilon je namjerno nazadovao */
  napredak: number;
};

const INSTITUCIJE: ProfilInstitucije[] = [
  {
    naziv: 'Institucija Alfa',
    kontaktOsoba: 'Marko Marković',
    email: 'kontakt@alfa.test',
    telefon: '+382 20 000 001',
    zrelost: 3.2,
    napredak: 0.4,
  },
  {
    naziv: 'Institucija Beta',
    kontaktOsoba: 'Jelena Jelić',
    email: 'kontakt@beta.test',
    telefon: '+382 20 000 002',
    zrelost: 2.4,
    napredak: 0.5,
  },
  {
    naziv: 'Institucija Gama',
    kontaktOsoba: 'Nikola Nikolić',
    email: 'kontakt@gama.test',
    telefon: '+382 20 000 003',
    zrelost: 4.1,
    napredak: 0.2,
  },
  {
    naziv: 'Institucija Delta',
    kontaktOsoba: 'Sanja Savić',
    email: 'kontakt@delta.test',
    telefon: '+382 20 000 004',
    zrelost: 1.5,
    napredak: 0.6,
  },
  {
    naziv: 'Institucija Epsilon',
    kontaktOsoba: 'Vuk Vukić',
    email: 'kontakt@epsilon.test',
    telefon: '+382 20 000 005',
    zrelost: 2.9,
    napredak: -0.2,
  },
];

// Odstupanje po procesu — bez njega bi svih 15 procesa ispalo praktično
// jednako, pa se na pregledu ne bi vidjelo gdje je slabo. Sigurnost i podaci
// su tipično jači, upravljanje projektima i nadzor slabiji.
const ODSTUPANJE_PROCESA: Record<string, number> = {
  PO1: 0.0,
  PO3: -0.2,
  PO5: -0.4,
  PO9: 0.3,
  PO10: -0.6,
  AI1: -0.2,
  AI2: 0.1,
  AI5: 0.2,
  AI6: 0.3,
  DS1: -0.1,
  DS4: 0.2,
  DS5: 0.7,
  DS10: 0.4,
  DS11: 0.5,
  ME1: -0.5,
};

// --- Determinističan generator --------------------------------------------

function sjeme(tekst: string): number {
  let h = 2166136261;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — mali PRNG, dovoljan za demo podatke i ponovljiv. */
function generator(tekst: string): () => number {
  let a = sjeme(tekst);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ogranici(broj: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, broj));
}

/**
 * Vjerovatnoća da se institucija sa ciljanim nivoom `cilj` složi sa izjavom
 * datog nivoa zrelosti.
 *
 * Izjave nivoa 0 su u katalogu negativne („Strateško planiranje informatike se
 * ne sprovodi"), pa im je smjer obrnut: sa njima se slaže samo institucija
 * koja je zaista na dnu. Od nivoa 1 naviše saglasnost opada kako nivo izjave
 * prelazi ciljani nivo.
 */
function saglasnost(nivo: number, cilj: number): number {
  if (nivo === 0) return ogranici(1 - cilj / 1.4);
  return 1 / (1 + Math.exp((nivo - cilj) / 0.55));
}

const PRAGOVI: { granica: number; vrijednost: CobitVrijednost }[] = [
  { granica: 0.2, vrijednost: 'NE' },
  { granica: 0.45, vrijednost: 'UGLAVNOM_NE' },
  { granica: 0.75, vrijednost: 'UGLAVNOM_DA' },
  { granica: Infinity, vrijednost: 'DA' },
];

function odgovor(nivo: number, cilj: number, rnd: () => number): CobitVrijednost {
  // Šum drži odgovore nejednakim unutar istog nivoa — bez njega bi svih pet
  // izjava nivoa 1 imalo istu vrijednost i tabela bi izgledala mašinski.
  const p = ogranici(saglasnost(nivo, cilj) + (rnd() - 0.5) * 0.4);
  return PRAGOVI.find((x) => p < x.granica)!.vrijednost;
}

// --- Plan popunjenosti -----------------------------------------------------
// Ranija godina je zaključena i popunjena do kraja. Tekuća je u toku: prvih
// devet procesa je gotovo, deseti je započet, ostali prazni — tako se vidi
// kako izgleda indikator popunjenosti i djelimično popunjen modul.

type PlanProcjene = {
  godina: number;
  status: 'U_TOKU' | 'ZAKLJUCENA';
  /** koliko je procesa popunjeno do kraja; `svi` = cijela procjena */
  gotovihProcesa: number | 'svi';
  /** udio popunjenih izjava u prvom sljedećem, započetom procesu */
  udioZapocetog: number;
};

const PLAN: PlanProcjene[] = [
  {
    godina: GODINA_RANIJA,
    status: 'ZAKLJUCENA',
    gotovihProcesa: 'svi',
    udioZapocetog: 0,
  },
  {
    godina: GODINA_TEKUCA,
    status: 'U_TOKU',
    gotovihProcesa: 9,
    udioZapocetog: 0.55,
  },
];

// --- Čitanje kataloga ------------------------------------------------------
// Generatoru trebaju samo kod procesa i nivoi izjava, pa je tip strukturalan:
// isti kod radi i nad zapisima iz baze i nad sadržajem cobit.json.

type Proces = {
  kod: string;
  redniBroj: number;
  izjave: { kod: string; nivoZrelosti: number; redniBroj: number }[];
};

async function ucitajKatalog(): Promise<Proces[]> {
  if (SUHO) {
    const putanja = join(__dirname, 'podaci', 'cobit.json');
    return JSON.parse(readFileSync(putanja, 'utf-8')) as Proces[];
  }

  const procesi = await prisma.cobitProces.findMany({
    orderBy: { redniBroj: 'asc' },
  });

  if (procesi.length === 0) {
    throw new Error(
      'COBIT katalog je prazan. Pokrenite prvo `npm run db:seed`, pa onda ovaj skript.',
    );
  }

  return procesi;
}

// --- Upis ------------------------------------------------------------------

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
      create: {
        naziv: i.naziv,
        kontaktOsoba: i.kontaktOsoba,
        email: i.email,
        telefon: i.telefon,
      },
    });
    mapa.set(i.naziv, zapis.id);
  }

  console.log(`  institucije: ${INSTITUCIJE.length}`);
  return mapa;
}

/** Svaka institucija dobija svoju kontakt osobu — tako se može provjeriti da
 *  KONTAKT_OSOBA zaista vidi samo procjene svoje institucije. */
async function seedKontaktOsobe(institucije: Map<string, string>) {
  const lozinkaHash = await bcrypt.hash(LOZINKA, 10);

  for (const i of INSTITUCIJE) {
    await prisma.korisnik.upsert({
      where: { email: i.email },
      update: {
        ime: i.kontaktOsoba,
        uloga: 'KONTAKT_OSOBA',
        institucijaId: institucije.get(i.naziv)!,
      },
      create: {
        email: i.email,
        ime: i.kontaktOsoba,
        uloga: 'KONTAKT_OSOBA',
        institucijaId: institucije.get(i.naziv)!,
        lozinkaHash,
      },
    });
  }

  console.log(`  kontakt osobe: ${INSTITUCIJE.length} (lozinka: ${LOZINKA})`);
}

async function dohvatiAutora() {
  const autor =
    (await prisma.korisnik.findFirst({ where: { uloga: 'REVIZOR' } })) ??
    (await prisma.korisnik.findFirst({ where: { uloga: 'ADMIN' } }));

  if (!autor) {
    throw new Error(
      'Nema korisnika sa ulogom REVIZOR ili ADMIN. Pokrenite prvo `npm run db:seed`.',
    );
  }

  return autor;
}

async function upsertProcjenu(
  institucijaId: string,
  godina: number,
  tip: 'COBIT' | 'IT_UPITNIK',
  status: 'U_TOKU' | 'ZAKLJUCENA',
  kreiraoId: string,
) {
  const zakljucenoDana =
    status === 'ZAKLJUCENA' ? new Date(`${godina}-12-31T12:00:00.000Z`) : null;

  return prisma.procjena.upsert({
    where: { institucijaId_godina_tip: { institucijaId, godina, tip } },
    update: { status, zakljucenoDana },
    create: { institucijaId, godina, tip, status, kreiraoId, zakljucenoDana },
  });
}

/** Odgovori za jednu procjenu, po planu popunjenosti. */
function generisiOdgovore(
  procesi: Proces[],
  profil: ProfilInstitucije,
  plan: PlanProcjene,
) {
  const ciljBazni =
    profil.zrelost + (plan.godina === GODINA_TEKUCA ? profil.napredak : 0);

  const gotovih =
    plan.gotovihProcesa === 'svi' ? procesi.length : plan.gotovihProcesa;

  const odgovori: { izjavaKod: string; vrijednost: CobitVrijednost }[] = [];

  procesi.forEach((proces, indeks) => {
    if (indeks > gotovih) return;

    const rnd = generator(`${profil.naziv}|${plan.godina}|${proces.kod}`);
    const cilj = ogranici(
      ciljBazni + (ODSTUPANJE_PROCESA[proces.kod] ?? 0),
      0.2,
      5,
    );

    // Izjave se popunjavaju redom kojim ih korisnik i vidi na ekranu, da
    // započet proces bude prekinut na sredini, a ne nasumično prošaran.
    const izjave = [...proces.izjave].sort(
      (a, b) => a.nivoZrelosti - b.nivoZrelosti || a.redniBroj - b.redniBroj,
    );

    const koliko =
      indeks < gotovih
        ? izjave.length
        : Math.round(izjave.length * plan.udioZapocetog);

    for (const izjava of izjave.slice(0, koliko)) {
      odgovori.push({
        izjavaKod: izjava.kod,
        vrijednost: odgovor(izjava.nivoZrelosti, cilj, rnd),
      });
    }
  });

  return odgovori;
}

/** Nivoi zrelosti popunjenih procesa — računato istom funkcijom koju koristi
 *  i aplikacija (`lib/cobit.ts`), da ispis seeda ne bi tvrdio nešto drugo. */
function nivoiProcesa(
  procesi: Proces[],
  odgovori: { izjavaKod: string; vrijednost: CobitVrijednost }[],
) {
  const mapa = new Map(odgovori.map((o) => [o.izjavaKod, o.vrijednost]));

  return procesi
    .map((p) => profilZrelosti(p.izjave, mapa))
    .filter((p) => p.ukupnoOdgovoreno > 0)
    .map((p) => p.ukupno);
}

type Odgovor = { izjavaKod: string; vrijednost: CobitVrijednost };

/** Jedan red ispisa — isti za suvi prolaz i za stvarni upis. */
function redSazetka(
  procesi: Proces[],
  profil: ProfilInstitucije,
  plan: PlanProcjene,
  odgovori: Odgovor[],
) {
  const ukupnoIzjava = procesi.reduce((a, p) => a + p.izjave.length, 0);
  const nivoi = nivoiProcesa(procesi, odgovori);
  const prosjek = prosjecanNivoOrganizacije(nivoi);

  return (
    `  ${profil.naziv} ${plan.godina} COBIT — ` +
    `${odgovori.length}/${ukupnoIzjava} odgovora, ` +
    `prosječan nivo ${prosjek.toFixed(2)} ` +
    `(po procesima ${Math.min(...nivoi).toFixed(2)}–${Math.max(...nivoi).toFixed(2)}), ` +
    `${plan.status === 'ZAKLJUCENA' ? 'zaključena' : 'u toku'}`
  );
}

/** Suvi prolaz: generiše i ispisuje, bez ijednog upisa u bazu. */
function ispisiPregled(procesi: Proces[]) {
  for (const profil of INSTITUCIJE) {
    for (const plan of PLAN) {
      const odgovori = generisiOdgovore(procesi, profil, plan);
      console.log(redSazetka(procesi, profil, plan, odgovori));
    }
  }
}

async function seedProcjene(
  procesi: Proces[],
  institucije: Map<string, string>,
  kreiraoId: string,
) {

  for (const profil of INSTITUCIJE) {
    const institucijaId = institucije.get(profil.naziv)!;

    for (const plan of PLAN) {
      const procjena = await upsertProcjenu(
        institucijaId,
        plan.godina,
        'COBIT',
        plan.status,
        kreiraoId,
      );

      const odgovori = generisiOdgovore(procesi, profil, plan);

      // Brisanje pa ponovni upis: jeftinije od 390 pojedinačnih upserta i
      // čini skript idempotentnim bez obzira na raniji sadržaj.
      await prisma.cobitOdgovor.deleteMany({
        where: { procjenaId: procjena.id },
      });
      await prisma.cobitOdgovor.createMany({
        data: odgovori.map((o) => ({ ...o, procjenaId: procjena.id })),
      });

      console.log(redSazetka(procesi, profil, plan, odgovori));
    }

    // IT upitnik: procjena se kreira prazna — demo odgovori se ne generišu,
    // jer dio A traži brojčane podatke o instituciji koji nemaju smisleno
    // sintetičko punjenje. Modul je dostupan i popunjava se ručno.
    await upsertProcjenu(
      institucijaId,
      GODINA_TEKUCA,
      'IT_UPITNIK',
      'U_TOKU',
      kreiraoId,
    );
  }

  console.log(
    `  IT upitnik: ${INSTITUCIJE.length} procjena (prazne — popunjavaju se ručno)`,
  );
}

async function main() {
  const procesi = await ucitajKatalog();

  if (SUHO) {
    console.log('Demo podaci — suvi prolaz, ništa se ne upisuje');
    ispisiPregled(procesi);
    return;
  }

  console.log('Demo podaci — start');

  const institucije = await seedInstitucije();
  await seedKontaktOsobe(institucije);
  const autor = await dohvatiAutora();
  await seedProcjene(procesi, institucije, autor.id);

  console.log('Demo podaci — gotovo');
}

main()
  .catch((greska) => {
    console.error(greska);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

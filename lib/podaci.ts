/**
 * Jedina tačka pristupa bazi. Komponente ne uvoze `prisma` direktno.
 *
 * [V2] ovdje ulazi keširanje — `unstable_cache` / `revalidate` nad funkcijama
 *      koje čitaju katalog (on je praktično nepromjenljiv), i revalidacija po
 *      tagu nad odgovorima. U V1 svaki poziv ide do baze.
 */
import { prisma } from '@/lib/prisma';
import type { CobitVrijednost, DioUpitnika } from '@prisma/client';

import { profilZrelosti, prosjecanNivoOrganizacije } from '@/lib/cobit';
import {
  popunjenost,
  rezultatDijelaB,
  rezultatDijelaC,
  type Popunjenost,
  type RezultatDijelaB,
  type RezultatDijelaC,
} from '@/lib/upitnik';
import { DIJELOVI_UPITNIKA } from '@/lib/skale';
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

// --- COBIT modul -----------------------------------------------------------
// [V2] katalog je praktično nepromjenljiv — kandidat za `unstable_cache`

export async function dohvatiCobitProcese() {
  return prisma.cobitProces.findMany({ orderBy: { redniBroj: 'asc' } });
}

export async function dohvatiCobitProces(kod: string) {
  return prisma.cobitProces.findUnique({ where: { kod } });
}

export async function dohvatiCobitOdgovore(procjenaId: string) {
  return prisma.cobitOdgovor.findMany({ where: { procjenaId } });
}

export async function sacuvajCobitOdgovor(
  procjenaId: string,
  izjavaKod: string,
  vrijednost: CobitVrijednost,
) {
  // Jedan upsert po promjeni — zato su odgovori zasebna kolekcija sa
  // složenim jedinstvenim indeksom, a ne ugniježđeni niz u Procjeni.
  return prisma.cobitOdgovor.upsert({
    where: { procjenaId_izjavaKod: { procjenaId, izjavaKod } },
    update: { vrijednost },
    create: { procjenaId, izjavaKod, vrijednost },
  });
}

export type RezultatProcesa = {
  kod: string;
  naziv: string;
  domen: string;
  /** ukupan nivo zrelosti procesa (0–5); bez ijednog odgovora je `null` */
  nivo: number | null;
  odgovoreno: number;
  ukupno: number;
};

export type RezultatCobit = {
  procesi: RezultatProcesa[];
  /** prosjek nivoa procesa koji imaju bar jedan odgovor */
  prosjek: number | null;
  odgovoreno: number;
  ukupno: number;
  /** koliko je procesa popunjeno do kraja */
  popunjenihProcesa: number;
};

/**
 * Rezultat cijele COBIT samoprocjene — nivo zrelosti po procesu i prosjek
 * organizacije. Računa se funkcijama iz `lib/cobit.ts`, istim kojima i ekran
 * pojedinačnog procesa, da bi brojevi na pregledu i u procesu bili isti.
 *
 * Proces bez ijednog odgovora nosi `nivo: null` i ne ulazi u prosjek —
 * agregacija bi mu inače dala 0.00, što se ne smije prikazati kao ocjena.
 */
export async function rezultatCobit(procjenaId: string): Promise<RezultatCobit> {
  const [procesi, odgovori] = await Promise.all([
    dohvatiCobitProcese(),
    dohvatiCobitOdgovore(procjenaId),
  ]);

  const mapa = new Map(odgovori.map((o) => [o.izjavaKod, o.vrijednost]));

  const redovi: RezultatProcesa[] = procesi.map((p) => {
    const profil = profilZrelosti(p.izjave, mapa);

    return {
      kod: p.kod,
      naziv: p.naziv,
      domen: p.domen,
      nivo: profil.ukupnoOdgovoreno > 0 ? profil.ukupno : null,
      odgovoreno: profil.ukupnoOdgovoreno,
      ukupno: profil.ukupnoIzjava,
    };
  });

  const nivoi = redovi
    .map((r) => r.nivo)
    .filter((n): n is number => n !== null);

  return {
    procesi: redovi,
    prosjek: nivoi.length > 0 ? prosjecanNivoOrganizacije(nivoi) : null,
    odgovoreno: redovi.reduce((a, r) => a + r.odgovoreno, 0),
    ukupno: redovi.reduce((a, r) => a + r.ukupno, 0),
    popunjenihProcesa: redovi.filter((r) => r.odgovoreno === r.ukupno).length,
  };
}

/** Broj odgovorenih izjava po procesu — za indikator popunjenosti. */
export async function popunjenostCobit(procjenaId: string) {
  const [procesi, odgovori] = await Promise.all([
    dohvatiCobitProcese(),
    dohvatiCobitOdgovore(procjenaId),
  ]);

  const odgovoreni = new Set(odgovori.map((o) => o.izjavaKod));

  return procesi.map((p) => ({
    kod: p.kod,
    naziv: p.naziv,
    domen: p.domen,
    ukupno: p.izjave.length,
    odgovoreno: p.izjave.filter((i) => odgovoreni.has(i.kod)).length,
  }));
}

// --- IT upitnik ------------------------------------------------------------
// [V2] katalog je praktično nepromjenljiv — kandidat za `unstable_cache`

export async function dohvatiUpitnikSekcije(dio?: DioUpitnika) {
  return prisma.upitnikSekcija.findMany({
    where: dio ? { dio } : {},
    orderBy: { redniBroj: 'asc' },
  });
}

export async function dohvatiUpitnikOdgovore(procjenaId: string) {
  return prisma.upitnikOdgovor.findMany({ where: { procjenaId } });
}

export async function dohvatiUpitnikOcjene(procjenaId: string) {
  return prisma.upitnikOcjena.findMany({ where: { procjenaId } });
}

/**
 * Snimanje jednog polja odgovora — jedan `upsert`, kao kod COBIT-a.
 * Prosljeđuju se samo polja koja se mijenjaju, jer odgovor i objašnjenje
 * stižu iz dvije nezavisne kontrole na ekranu.
 */
export async function sacuvajUpitnikOdgovor(
  procjenaId: string,
  pitanjeKod: string,
  izmjene: { vrijednost?: string | null; objasnjenje?: string | null },
) {
  return prisma.upitnikOdgovor.upsert({
    where: { procjenaId_pitanjeKod: { procjenaId, pitanjeKod } },
    update: izmjene,
    create: { procjenaId, pitanjeKod, ...izmjene },
  });
}

/** Ocjena sekcije i pripadajuća obrazloženja — takođe polje po polje. */
export async function sacuvajUpitnikOcjenu(
  procjenaId: string,
  sekcijaKod: string,
  izmjene: { ocjena?: number; prednosti?: string | null; slabosti?: string | null },
) {
  return prisma.upitnikOcjena.upsert({
    where: { procjenaId_sekcijaKod: { procjenaId, sekcijaKod } },
    update: izmjene,
    // `ocjena` je obavezna u šemi: obrazloženje uneseno prije ocjene dobija 0,
    // što nije validna ocjena (1–4) pa se nigdje ne prikazuje ni ne agregira.
    create: { procjenaId, sekcijaKod, ocjena: 0, ...izmjene },
  });
}

export type PopunjenostDijela = Popunjenost & { dio: DioUpitnika };

export type RezultatUpitnik = {
  /** ocjene rizika po kategorijama B1–B5 i njihov prosjek */
  dioB: RezultatDijelaB;
  /** ocjene zrelosti po oblastima C1–C10 i njihov prosjek */
  dioC: RezultatDijelaC;
  popunjenostDijelova: PopunjenostDijela[];
  odgovoreno: number;
  ukupnoPitanja: number;
  ocijenjeno: number;
  ukupnoOcjena: number;
};

/**
 * Rezultat cijelog IT upitnika. Dio A prikuplja podatke i nema ocjenu, pa
 * ulazi samo u popunjenost. Računa se istim funkcijama kojima i ekrani
 * dijelova, da bi brojevi na pregledu i u modulu bili isti.
 */
export async function rezultatUpitnik(
  procjenaId: string,
): Promise<RezultatUpitnik> {
  const [sekcije, odgovori, ocjene] = await Promise.all([
    dohvatiUpitnikSekcije(),
    dohvatiUpitnikOdgovore(procjenaId),
    dohvatiUpitnikOcjene(procjenaId),
  ]);

  // Ocjena 0 je zapis nastao unosom obrazloženja bez ocjene — nije validna.
  const mapa = new Map(
    ocjene.filter((o) => o.ocjena >= 1).map((o) => [o.sekcijaKod, o.ocjena]),
  );

  const popunjenostDijelova = DIJELOVI_UPITNIKA.map((dio) => ({
    dio,
    ...popunjenost(
      sekcije.filter((s) => s.dio === dio),
      odgovoreniKodovi(odgovori),
      new Set(mapa.keys()),
    ),
  }));

  const zbir = (uzmi: (p: Popunjenost) => number) =>
    popunjenostDijelova.reduce((a, p) => a + uzmi(p), 0);

  return {
    dioB: rezultatDijelaB(sekcije, mapa),
    dioC: rezultatDijelaC(sekcije, mapa),
    popunjenostDijelova,
    odgovoreno: zbir((p) => p.odgovoreno),
    ukupnoPitanja: zbir((p) => p.ukupnoPitanja),
    ocijenjeno: zbir((p) => p.ocijenjeno),
    ukupnoOcjena: zbir((p) => p.ukupnoOcjena),
  };
}

/** Pitanje se računa kao odgovoreno kada ima nepraznu vrijednost odgovora. */
function odgovoreniKodovi(
  odgovori: { pitanjeKod: string; vrijednost: string | null }[],
): Set<string> {
  return new Set(
    odgovori
      .filter((o) => o.vrijednost !== null && o.vrijednost.trim() !== '')
      .map((o) => o.pitanjeKod),
  );
}

/** Popunjenost po dijelovima — za indikator u bočnoj navigaciji. */
export async function popunjenostUpitnika(procjenaId: string) {
  const [sekcije, odgovori, ocjene] = await Promise.all([
    dohvatiUpitnikSekcije(),
    dohvatiUpitnikOdgovore(procjenaId),
    dohvatiUpitnikOcjene(procjenaId),
  ]);

  const odgovoreni = odgovoreniKodovi(odgovori);
  const ocijenjene = new Set(
    ocjene.filter((o) => o.ocjena >= 1).map((o) => o.sekcijaKod),
  );

  return DIJELOVI_UPITNIKA.map((dio) => ({
    dio,
    ...popunjenost(
      sekcije.filter((s) => s.dio === dio),
      odgovoreni,
      ocijenjene,
    ),
  }));
}

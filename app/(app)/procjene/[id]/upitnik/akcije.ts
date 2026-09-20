'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  dohvatiProcjenu,
  sacuvajUpitnikOcjenu,
  sacuvajUpitnikOdgovor,
} from '@/lib/podaci';
import { prisma } from '@/lib/prisma';
import { zahtijevajKorisnika, mozeVidjetiInstituciju } from '@/lib/ovlascenja';
import { ocjenjivaSekcija } from '@/lib/upitnik';
import { OPCIJE_DA_NE, OPCIJE_KONTROLE } from '@/lib/skale';

export type IshodSnimanja = { ok: boolean; greska?: string };

/** Kod pitanja je `${kodSekcije}-${broj}`, a kod sekcije nikad ne sadrži crticu. */
function kodSekcijeIzPitanja(pitanjeKod: string): string {
  const crtica = pitanjeKod.indexOf('-');
  return crtica === -1 ? pitanjeKod : pitanjeKod.slice(0, crtica);
}

/** Prazan unos briše odgovor, umjesto da snimi prazan string. */
function praznoUNull(sadrzaj: string): string | null {
  const ocisceno = sadrzaj.trim();
  return ocisceno === '' ? null : ocisceno;
}

/**
 * Zajednička provjera prije svakog snimanja: procjena postoji, korisnik joj
 * ima pristup i nije zaključena.
 */
async function provjeriPristup(procjenaId: string): Promise<string | null> {
  const korisnik = await zahtijevajKorisnika();
  const procjena = await dohvatiProcjenu(procjenaId);

  if (!procjena) return 'Procjena ne postoji.';
  if (!mozeVidjetiInstituciju(korisnik, procjena.institucijaId)) {
    return 'Nemate pristup ovoj procjeni.';
  }
  if (procjena.tip !== 'IT_UPITNIK') {
    return 'Ova procjena nije IT upitnik.';
  }
  if (procjena.status === 'ZAKLJUCENA') {
    return 'Procjena je zaključena i ne može se mijenjati.';
  }
  return null;
}

// --- Odgovor na pitanje ----------------------------------------------------

const semaOdgovora = z.object({
  procjenaId: z.string().min(1),
  pitanjeKod: z.string().min(1),
  polje: z.enum(['vrijednost', 'objasnjenje']),
  sadrzaj: z.string().max(5000, 'Unos je predugačak.'),
});

/**
 * Automatsko snimanje jednog polja odgovora. Poziva se pri svakoj promjeni,
 * bez dugmeta „sačuvaj" — zato mora biti jeftino: jedan `upsert`.
 */
export async function snimiUpitnikOdgovor(
  ulaz: z.input<typeof semaOdgovora>,
): Promise<IshodSnimanja> {
  const provjera = semaOdgovora.safeParse(ulaz);
  if (!provjera.success) {
    return { ok: false, greska: provjera.error.issues[0].message };
  }

  const { procjenaId, pitanjeKod, polje, sadrzaj } = provjera.data;

  const greska = await provjeriPristup(procjenaId);
  if (greska) return { ok: false, greska };

  const sekcija = await prisma.upitnikSekcija.findUnique({
    where: { kod: kodSekcijeIzPitanja(pitanjeKod) },
  });
  const pitanje = sekcija?.pitanja.find((p) => p.kod === pitanjeKod);

  if (!sekcija || !pitanje) {
    return { ok: false, greska: 'Pitanje ne postoji.' };
  }

  const vrijednost = praznoUNull(sadrzaj);

  // Vrijednost odgovora se provjerava prema tipu pitanja iz kataloga;
  // objašnjenje je slobodan tekst i provjerava ga samo dužina iz šeme.
  if (polje === 'vrijednost' && vrijednost !== null) {
    const dozvoljene =
      pitanje.tipOdgovora === 'DA_NE'
        ? OPCIJE_DA_NE.map((o) => o.vrijednost)
        : pitanje.tipOdgovora === 'DA_NE_DJELIMICNO'
          ? OPCIJE_KONTROLE.map((o) => o.vrijednost)
          : pitanje.tipOdgovora === 'IZBOR'
            ? pitanje.opcije
            : null;

    if (dozvoljene !== null && !dozvoljene.includes(vrijednost)) {
      return { ok: false, greska: 'Neponuđen odgovor.' };
    }

    if (pitanje.tipOdgovora === 'BROJ') {
      const broj = Number(vrijednost.replace(',', '.'));
      if (!Number.isFinite(broj) || broj < 0) {
        return { ok: false, greska: 'Očekuje se nenegativan broj.' };
      }
    }
  }

  await sacuvajUpitnikOdgovor(procjenaId, pitanjeKod, { [polje]: vrijednost });

  // Osvježava indikator popunjenosti u bočnoj navigaciji.
  revalidatePath(`/procjene/${procjenaId}/upitnik/${sekcija.dio.toLowerCase()}`);

  return { ok: true };
}

// --- Ocjena sekcije --------------------------------------------------------

const semaOcjene = z.object({
  procjenaId: z.string().min(1),
  sekcijaKod: z.string().min(1),
  polje: z.enum(['ocjena', 'prednosti', 'slabosti']),
  sadrzaj: z.string().max(5000, 'Unos je predugačak.'),
});

export async function snimiUpitnikOcjenu(
  ulaz: z.input<typeof semaOcjene>,
): Promise<IshodSnimanja> {
  const provjera = semaOcjene.safeParse(ulaz);
  if (!provjera.success) {
    return { ok: false, greska: provjera.error.issues[0].message };
  }

  const { procjenaId, sekcijaKod, polje, sadrzaj } = provjera.data;

  const greska = await provjeriPristup(procjenaId);
  if (greska) return { ok: false, greska };

  const sekcija = await prisma.upitnikSekcija.findUnique({
    where: { kod: sekcijaKod },
  });

  if (!sekcija || !ocjenjivaSekcija(sekcija)) {
    return { ok: false, greska: 'Ova sekcija se ne ocjenjuje.' };
  }
  // Obrazloženja prednosti i slabosti postoje samo u dijelu C (kolone F i G);
  // u dijelu B je objašnjenje vezano za pojedinačno pitanje.
  if (polje !== 'ocjena' && sekcija.dio !== 'C') {
    return { ok: false, greska: 'Obrazloženje se unosi samo u dijelu C.' };
  }

  if (polje === 'ocjena') {
    // Skala je ista za dio B (rizik) i dio C (zrelost kontrola) — 1–4.
    const ocjena = Number(sadrzaj);
    if (!Number.isInteger(ocjena) || ocjena < 1 || ocjena > 4) {
      return { ok: false, greska: 'Ocjena mora biti 1, 2, 3 ili 4.' };
    }
    await sacuvajUpitnikOcjenu(procjenaId, sekcijaKod, { ocjena });
  } else {
    await sacuvajUpitnikOcjenu(procjenaId, sekcijaKod, {
      [polje]: praznoUNull(sadrzaj),
    });
  }

  revalidatePath(`/procjene/${procjenaId}/upitnik/${sekcija.dio.toLowerCase()}`);

  return { ok: true };
}

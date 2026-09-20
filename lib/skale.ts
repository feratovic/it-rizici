/**
 * Skale ocjenjivanja.
 *
 * ⚠ SKALE SU SUPROTNO ORIJENTISANE — ovo je jedino mjesto gdje se smjer
 * skale tumači. Komponente ne smiju same računati boju ni „dobro/loše".
 *
 *   COBIT nivo zrelosti   0–5   VEĆE = BOLJE
 *   IT upitnik, dio B     1–4   VEĆE = GORE   (rizik)
 *   IT upitnik, dio C     1–4   VEĆE = GORE   (nezrelost kontrola)
 */

// --- COBIT ----------------------------------------------------------------

/** Nivoi zrelosti COBIT procesa. Veće je bolje. */
export const COBIT_NIVOI = [0, 1, 2, 3, 4, 5] as const;
export type CobitNivo = (typeof COBIT_NIVOI)[number];

export const COBIT_NAZIV_NIVOA: Record<number, string> = {
  0: 'Ne postoji',
  1: 'Početni / ad hoc',
  2: 'Ponovljiv, ali intuitivan',
  3: 'Definisan proces',
  4: 'Upravljan i mjerljiv',
  5: 'Optimizovan',
};

/** Odgovor na COBIT izjavu i njegova numerička vrijednost. */
export const COBIT_VRIJEDNOSTI = {
  NE: 0,
  UGLAVNOM_NE: 0.33,
  UGLAVNOM_DA: 0.66,
  DA: 1,
} as const;

export type CobitVrijednost = keyof typeof COBIT_VRIJEDNOSTI;

export const COBIT_OPCIJE: { vrijednost: CobitVrijednost; oznaka: string }[] = [
  { vrijednost: 'NE', oznaka: 'Ne' },
  { vrijednost: 'UGLAVNOM_NE', oznaka: 'Uglavnom ne' },
  { vrijednost: 'UGLAVNOM_DA', oznaka: 'Uglavnom da' },
  { vrijednost: 'DA', oznaka: 'Da' },
];

export function cobitBroj(v: CobitVrijednost): number {
  return COBIT_VRIJEDNOSTI[v];
}

// --- Dio B: ocjena rizika 1–4, VEĆE = GORE --------------------------------

export const OCJENE_RIZIKA = [1, 2, 3, 4] as const;
export type OcjenaRizika = (typeof OCJENE_RIZIKA)[number];

export const NAZIV_OCJENE_RIZIKA: Record<number, string> = {
  1: 'Nizak rizik',
  2: 'Nizak do umjeren rizik',
  3: 'Umjeren do visok rizik',
  4: 'Visok rizik',
};

// --- Dio C: ocjena zrelosti kontrola 1–4, VEĆE = GORE ---------------------

export const OCJENE_KONTROLA = [1, 2, 3, 4] as const;
export type OcjenaKontrole = (typeof OCJENE_KONTROLA)[number];

export const NAZIV_OCJENE_KONTROLE: Record<number, string> = {
  1: 'Kontrole su dokumentovane, testirane i optimizovane',
  2: 'Kontrole su dokumentovane, testirane i kontinuirano se unapređuju',
  3: 'Kontrole su dokumentovane i testirane, ali puna primjena još nije zaživjela',
  4: 'Kontrole ne postoje',
};

// --- Odgovori na pitanja dijela C -----------------------------------------

export const OPCIJE_KONTROLE: { vrijednost: string; oznaka: string }[] = [
  { vrijednost: 'DA', oznaka: 'Da' },
  { vrijednost: 'DJELIMICNO', oznaka: 'Djelimično' },
  { vrijednost: 'NE', oznaka: 'Ne' },
];

// --- Nazivi dijelova upitnika ---------------------------------------------
// Preuzeti iz izvornog fajla (red zaglavlja svakog dijela, kolona B).

export const DIJELOVI_UPITNIKA = ['A', 'B', 'C'] as const;
export type DioUpitnika = (typeof DIJELOVI_UPITNIKA)[number];

export const NAZIV_DIJELA: Record<DioUpitnika, string> = {
  A: 'Opšti podaci',
  B: 'Indikatori IT rizika',
  C: 'IT kontrole',
};

/** Kratak opis šta se u dijelu ocjenjuje — za podnaslov ekrana. */
export const OPIS_DIJELA: Record<DioUpitnika, string> = {
  A: 'Prikupljanje podataka o instituciji. Dio A se ne ocjenjuje.',
  B: 'Ocjena rizika 1–4 po kategoriji. Veća vrijednost znači veći rizik.',
  C: 'Ocjena nivoa zrelosti 1–4 po podoblasti. Veća vrijednost znači slabije kontrole.',
};

/** Naziv ocjene sekcije — zavisi od dijela, jer skale nisu iste. */
export function nazivOcjeneSekcije(dio: DioUpitnika, ocjena: number): string {
  return dio === 'B'
    ? (NAZIV_OCJENE_RIZIKA[ocjena] ?? '')
    : (NAZIV_OCJENE_KONTROLE[ocjena] ?? '');
}

// --- Odgovori na pitanja dijelova A i B -----------------------------------

export const OPCIJE_DA_NE: { vrijednost: string; oznaka: string }[] = [
  { vrijednost: 'DA', oznaka: 'Da' },
  { vrijednost: 'NE', oznaka: 'Ne' },
];

// --- Bojenje ---------------------------------------------------------------
// Jedina tačka u kojoj se inverzija skale pretvara u boju.

type Boje = { tekst: string; pozadina: string; ivica: string; hex: string };

const ZELENA: Boje = { tekst: 'text-green-800', pozadina: 'bg-green-100', ivica: 'border-green-300', hex: '#15803d' };
const SVIJETLOZELENA: Boje = { tekst: 'text-lime-800', pozadina: 'bg-lime-100', ivica: 'border-lime-300', hex: '#65a30d' };
const NARANDZASTA: Boje = { tekst: 'text-orange-800', pozadina: 'bg-orange-100', ivica: 'border-orange-300', hex: '#ea580c' };
const CRVENA: Boje = { tekst: 'text-red-800', pozadina: 'bg-red-100', ivica: 'border-red-300', hex: '#b91c1c' };
const SIVA: Boje = { tekst: 'text-gray-600', pozadina: 'bg-gray-100', ivica: 'border-gray-300', hex: '#6b7280' };

/** Ocjena 1–4 gdje je VEĆE GORE (dio B i dio C). */
export function bojaOcjene1do4(ocjena: number | null | undefined): Boje {
  switch (ocjena) {
    case 1: return ZELENA;
    case 2: return SVIJETLOZELENA;
    case 3: return NARANDZASTA;
    case 4: return CRVENA;
    default: return SIVA;
  }
}

/** COBIT nivo zrelosti 0–5 gdje je VEĆE BOLJE — smjer je obrnut od 1–4 skale. */
export function bojaNivoaZrelosti(nivo: number | null | undefined): Boje {
  if (nivo === null || nivo === undefined) return SIVA;
  if (nivo >= 4) return ZELENA;
  if (nivo >= 3) return SVIJETLOZELENA;
  if (nivo >= 2) return NARANDZASTA;
  return CRVENA;
}

/** Zaokruživanje na dvije decimale — koristi se u svim agregacijama. */
export function zaokruzi2(broj: number): number {
  return Math.round(broj * 100) / 100;
}

export function prosjek(vrijednosti: number[]): number | null {
  if (vrijednosti.length === 0) return null;
  const suma = vrijednosti.reduce((a, b) => a + b, 0);
  return zaokruzi2(suma / vrijednosti.length);
}

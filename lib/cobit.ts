/**
 * Agregacija COBIT samoprocjene.
 *
 * Formula je preuzeta doslovno iz izvornog Excel fajla (kolone M–R svakog
 * sheeta). Vidi VERIFIKACIJA.md za dokaz poklapanja i za popis defekata
 * izvornog fajla.
 *
 *   A(n) = suma numeričkih vrijednosti odgovora na izjavama nivoa n
 *   B(n) = ukupan broj izjava nivoa n
 *   C(n) = A(n) / B(n)            saglasnost nivoa zrelosti
 *   D(n) = C(n) / Σ C             normalizovana vrijednost
 *   E(n) = n × D(n)               doprinos nivoa
 *   ukupno = Σ E
 *
 * ⚠ Skala je 0–5 i VEĆE JE BOLJE — suprotno od skala dijelova B i C
 *   IT upitnika. Bojenje ide isključivo kroz `bojaNivoaZrelosti` iz lib/skale.ts.
 */
import { COBIT_NIVOI, cobitBroj, zaokruzi2, type CobitVrijednost } from '@/lib/skale';

export type IzjavaZaRacun = {
  kod: string;
  nivoZrelosti: number;
};

export type RedNivoa = {
  nivo: number;
  /** A — suma vrijednosti odgovora na tom nivou */
  suma: number;
  /** B — ukupan broj izjava na tom nivou */
  brojIzjava: number;
  /** broj izjava na kojima je odgovor unesen */
  odgovoreno: number;
  /** C = A / B */
  saglasnost: number;
  /** D = C / Σ C */
  normalizovano: number;
  /** E = nivo × D */
  doprinos: number;
};

export type ProfilZrelosti = {
  nivoi: RedNivoa[];
  /** Σ E — ukupan nivo zrelosti procesa, zaokružen na dvije decimale */
  ukupno: number;
  ukupnoIzjava: number;
  ukupnoOdgovoreno: number;
  popunjeno: boolean;
};

export function profilZrelosti(
  izjave: IzjavaZaRacun[],
  odgovori: Map<string, CobitVrijednost>,
): ProfilZrelosti {
  const suma = new Map<number, number>();
  const brojIzjava = new Map<number, number>();
  const odgovoreno = new Map<number, number>();

  for (const nivo of COBIT_NIVOI) {
    suma.set(nivo, 0);
    brojIzjava.set(nivo, 0);
    odgovoreno.set(nivo, 0);
  }

  for (const izjava of izjave) {
    const nivo = izjava.nivoZrelosti;
    brojIzjava.set(nivo, (brojIzjava.get(nivo) ?? 0) + 1);

    const odgovor = odgovori.get(izjava.kod);
    if (odgovor !== undefined) {
      suma.set(nivo, (suma.get(nivo) ?? 0) + cobitBroj(odgovor));
      odgovoreno.set(nivo, (odgovoreno.get(nivo) ?? 0) + 1);
    }
  }

  // C(n) = A(n) / B(n)
  const saglasnost = new Map<number, number>();
  for (const nivo of COBIT_NIVOI) {
    const b = brojIzjava.get(nivo) ?? 0;
    saglasnost.set(nivo, b > 0 ? (suma.get(nivo) ?? 0) / b : 0);
  }

  const ukupnaSaglasnost = [...saglasnost.values()].reduce((a, b) => a + b, 0);

  const nivoi: RedNivoa[] = COBIT_NIVOI.map((nivo) => {
    const c = saglasnost.get(nivo) ?? 0;
    const d = ukupnaSaglasnost > 0 ? c / ukupnaSaglasnost : 0;
    return {
      nivo,
      suma: suma.get(nivo) ?? 0,
      brojIzjava: brojIzjava.get(nivo) ?? 0,
      odgovoreno: odgovoreno.get(nivo) ?? 0,
      saglasnost: c,
      normalizovano: d,
      doprinos: nivo * d,
    };
  });

  const ukupno = nivoi.reduce((a, r) => a + r.doprinos, 0);
  const ukupnoIzjava = izjave.length;
  const ukupnoOdgovoreno = nivoi.reduce((a, r) => a + r.odgovoreno, 0);

  return {
    nivoi,
    ukupno: zaokruzi2(ukupno),
    ukupnoIzjava,
    ukupnoOdgovoreno,
    popunjeno: ukupnoIzjava > 0 && ukupnoOdgovoreno === ukupnoIzjava,
  };
}

/**
 * Prosječan nivo zrelosti organizacije — aritmetička sredina ukupnih nivoa
 * svih procesa (izvorni Excel: Sheet1, ćelija C17).
 */
export function prosjecanNivoOrganizacije(nivoiProcesa: number[]): number {
  if (nivoiProcesa.length === 0) return 0;
  const suma = nivoiProcesa.reduce((a, b) => a + b, 0);
  return zaokruzi2(suma / nivoiProcesa.length);
}

/** Domeni (faze) COBIT-a, redom kojim se prikazuju. */
export const DOMENI = ['PO', 'AI', 'DS', 'ME'] as const;
export type Domen = (typeof DOMENI)[number];

export const NAZIV_DOMENA: Record<string, string> = {
  PO: 'Planiranje i organizacija',
  AI: 'Nabavka i implementacija',
  DS: 'Isporuka i podrška',
  ME: 'Nadzor i evaluacija',
};

export function jeDomen(vrijednost: string): vrijednost is Domen {
  return (DOMENI as readonly string[]).includes(vrijednost);
}

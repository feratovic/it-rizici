/**
 * Regresioni test za lib/cobit.ts.
 *
 * Ulazi su prepisani iz izvornog Excel fajla (sheet PO1 i PO9), a očekivane
 * vrijednosti su one koje izračuna sam Excel u ćeliji R14. Time se potvrđuje
 * da TypeScript implementacija daje identičan rezultat kao izvorna tabela.
 *
 * Pokretanje:  npx tsx alati/provjeri-cobit-ts.ts
 */
import { profilZrelosti, type IzjavaZaRacun } from '../lib/cobit';
import type { CobitVrijednost } from '../lib/skale';

type Slucaj = {
  naziv: string;
  /** odgovori po nivou zrelosti, redom kako stoje u izvornom sheetu */
  poNivou: CobitVrijednost[][];
  ocekivano: number;
};

const NE: CobitVrijednost = 'NE';
const UN: CobitVrijednost = 'UGLAVNOM_NE';
const UD: CobitVrijednost = 'UGLAVNOM_DA';
const DA: CobitVrijednost = 'DA';

const SLUCAJEVI: Slucaj[] = [
  {
    // PO1 — svih 26 izjava odgovoreno. Excel PO1!R14 = 2.5260
    naziv: 'PO1 (potpuno popunjen)',
    poNivou: [
      [UN, UN],                 // nivo 0: suma 0.66
      [NE, DA, UN, NE, UD],     // nivo 1: suma 1.99
      [DA, DA, UD, UN],         // nivo 2: suma 2.99
      [DA, UD, DA, DA, UD],     // nivo 3: suma 4.32
      [NE, UN, UD, UD],         // nivo 4: suma 1.65
      [UN, NE, UN, UN, UN, UD], // nivo 5: suma 1.98
    ],
    ocekivano: 2.53,
  },
  {
    // PO9 — odgovoreni samo nivoi 0 i 1. Excel PO9!R14 = 0.2101
    naziv: 'PO9 (djelimično popunjen)',
    poNivou: [
      [DA, DA],                 // nivo 0: suma 2
      [NE, UN, DA],             // nivo 1: suma 1.33
      [NE, NE, NE],             // nivo 2: suma 0
      [NE, NE, NE, NE, NE],     // nivo 3: suma 0
      [NE, NE, NE, NE],         // nivo 4: suma 0
      [NE, NE, NE, NE, NE, NE], // nivo 5: suma 0
    ],
    ocekivano: 0.21,
  },
];

/** Broj izjava po nivou je isti za sve procese osim PO3 (2,5,4,5,4,6). */
const BROJ_IZJAVA_PO_NIVOU = [2, 5, 4, 5, 4, 6];

function pripremi(slucaj: Slucaj) {
  const izjave: IzjavaZaRacun[] = [];
  const odgovori = new Map<string, CobitVrijednost>();

  for (let nivo = 0; nivo <= 5; nivo++) {
    for (let i = 0; i < BROJ_IZJAVA_PO_NIVOU[nivo]; i++) {
      const kod = `X-N${nivo}-${i + 1}`;
      izjave.push({ kod, nivoZrelosti: nivo });

      const odgovor = slucaj.poNivou[nivo]?.[i];
      if (odgovor !== undefined) odgovori.set(kod, odgovor);
    }
  }

  return { izjave, odgovori };
}

let greske = 0;

console.log('  provjera lib/cobit.ts\n');

for (const slucaj of SLUCAJEVI) {
  const { izjave, odgovori } = pripremi(slucaj);
  const profil = profilZrelosti(izjave, odgovori);
  const prolazi = Math.abs(profil.ukupno - slucaj.ocekivano) < 0.005;

  if (!prolazi) greske++;

  console.log(
    `  ${prolazi ? 'OK  ' : 'PAD '} ${slucaj.naziv.padEnd(28)} ` +
      `dobijeno ${profil.ukupno.toFixed(2)}  očekivano ${slucaj.ocekivano.toFixed(2)}`,
  );
  console.log(
    '       sume po nivou: ' +
      profil.nivoi.map((n) => n.suma.toFixed(2)).join(', '),
  );
}

// Granični slučaj: nijedan odgovor ne smije izazvati dijeljenje nulom.
const prazan = profilZrelosti(
  [{ kod: 'X-N0-1', nivoZrelosti: 0 }],
  new Map(),
);
if (prazan.ukupno !== 0 || Number.isNaN(prazan.ukupno)) {
  greske++;
  console.log('  PAD  prazan profil — očekivano 0, dobijeno', prazan.ukupno);
} else {
  console.log('  OK   prazan profil (bez odgovora)      dobijeno 0.00');
}

console.log();
if (greske > 0) {
  console.log(`  NEUSPJEH: ${greske} provjera nije prošla.`);
  process.exit(1);
}
console.log('  Sve provjere prošle.');

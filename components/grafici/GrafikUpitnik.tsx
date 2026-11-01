'use client';

/**
 * Grafici IT upitnika — ocjena rizika po kategorijama dijela B i zrelost
 * kontrola po oblastima dijela C.
 *
 * [V2] kandidat za dynamic() — recharts se ovdje uvozi statički, pa cijela
 *      biblioteka ulazi u JavaScript paket ekrana rezultata (NAPOMENE.md, P4).
 *      U V2 se ova komponenta učitava preko `next/dynamic` sa `ssr: false`.
 *
 * ⚠ Skala je 1–4 i VEĆE JE GORE — suprotno od COBIT nivoa zrelosti. Boja se
 *   uzima isključivo iz `bojaOcjene1do4`.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { bojaOcjene1do4 } from '@/lib/skale';

export type TackaSekcije = { kod: string; naziv: string; ocjena: number | null };

const SIVA_MREZA = '#e5e7eb';
const SIVI_TEKST = '#6b7280';

function Stubici({
  naslov,
  napomena,
  podaci,
}: {
  naslov: string;
  napomena: string;
  podaci: TackaSekcije[];
}) {
  const redovi = podaci.map((p) => ({ ...p, vrijednost: p.ocjena ?? 0 }));

  return (
    <div className="kartica">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">{naslov}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={redovi} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={SIVA_MREZA} vertical={false} />
            <XAxis dataKey="kod" tick={{ fontSize: 11, fill: SIVI_TEKST }} interval={0} />
            <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 11, fill: SIVI_TEKST }} />
            <Tooltip
              formatter={(_v, _n, stavka) => {
                const ocjena = (stavka?.payload as TackaSekcije | undefined)?.ocjena;
                return [ocjena === null || ocjena === undefined ? 'nije ocijenjeno' : ocjena.toFixed(2), 'Ocjena'];
              }}
              labelFormatter={(kod) => {
                const s = podaci.find((x) => x.kod === kod);
                return s ? `${s.kod} — ${s.naziv}` : String(kod);
              }}
            />
            <Bar dataKey="vrijednost" radius={[3, 3, 0, 0]}>
              {redovi.map((r) => (
                <Cell
                  key={r.kod}
                  fill={bojaOcjene1do4(r.ocjena === null ? null : Math.round(r.ocjena)).hex}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-gray-500">{napomena}</p>
    </div>
  );
}

export default function GrafikUpitnik({
  kategorije,
  oblasti,
}: {
  kategorije: TackaSekcije[];
  oblasti: TackaSekcije[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Stubici
        naslov="Indikatori IT rizika (dio B)"
        napomena="Skala 1–4, veća vrijednost znači veći rizik."
        podaci={kategorije}
      />
      <Stubici
        naslov="Zrelost IT kontrola po oblastima (dio C)"
        napomena="Skala 1–4, veća vrijednost znači slabije kontrole."
        podaci={oblasti}
      />
    </div>
  );
}

'use client';

/**
 * Grafici COBIT samoprocjene — nivo zrelosti po procesima i profil po domenima.
 *
 * [V2] kandidat za dynamic() — recharts se ovdje uvozi statički, pa cijela
 *      biblioteka ulazi u JavaScript paket ekrana rezultata (NAPOMENE.md, P4).
 *      U V2 se ova komponenta učitava preko `next/dynamic` sa `ssr: false`.
 *
 * ⚠ Skala je 0–5 i VEĆE JE BOLJE. Boja se uzima isključivo iz
 *   `bojaNivoaZrelosti` — komponenta sama ne tumači smjer skale.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { bojaNivoaZrelosti } from '@/lib/skale';

export type TackaProcesa = { kod: string; naziv: string; nivo: number | null };
export type TackaDomena = { domen: string; naziv: string; nivo: number | null };

const SIVA_MREZA = '#e5e7eb';
const SIVI_TEKST = '#6b7280';

export default function GrafikCobit({
  procesi,
  domeni,
}: {
  procesi: TackaProcesa[];
  domeni: TackaDomena[];
}) {
  // Proces bez odgovora se crta kao prazan stub, ne kao nivo 0.
  const podaciProcesa = procesi.map((p) => ({ ...p, vrijednost: p.nivo ?? 0 }));
  const podaciDomena = domeni.map((d) => ({ ...d, vrijednost: d.nivo ?? 0 }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="kartica lg:col-span-2">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Nivo zrelosti po procesima
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={podaciProcesa} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={SIVA_MREZA} vertical={false} />
              <XAxis dataKey="kod" tick={{ fontSize: 11, fill: SIVI_TEKST }} interval={0} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: SIVI_TEKST }} />
              <Tooltip
                formatter={(_v, _n, stavka) => {
                  const nivo = (stavka?.payload as TackaProcesa | undefined)?.nivo;
                  return [nivo === null || nivo === undefined ? 'bez odgovora' : nivo.toFixed(2), 'Nivo'];
                }}
                labelFormatter={(kod) => {
                  const p = procesi.find((x) => x.kod === kod);
                  return p ? `${p.kod} — ${p.naziv}` : String(kod);
                }}
              />
              <Bar dataKey="vrijednost" radius={[3, 3, 0, 0]}>
                {podaciProcesa.map((p) => (
                  <Cell key={p.kod} fill={bojaNivoaZrelosti(p.nivo).hex} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Skala 0–5, veća vrijednost znači veću zrelost.
        </p>
      </div>

      <div className="kartica">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Profil po domenima
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={podaciDomena} outerRadius="70%">
              <PolarGrid stroke={SIVA_MREZA} />
              <PolarAngleAxis dataKey="domen" tick={{ fontSize: 12, fill: SIVI_TEKST }} />
              <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: SIVI_TEKST }} />
              <Tooltip
                formatter={(_v, _n, stavka) => {
                  const nivo = (stavka?.payload as TackaDomena | undefined)?.nivo;
                  return [nivo === null || nivo === undefined ? 'bez odgovora' : nivo.toFixed(2), 'Prosjek'];
                }}
              />
              <Radar dataKey="vrijednost" stroke="#111827" fill="#111827" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Prosjek nivoa procesa u domenu.
        </p>
      </div>
    </div>
  );
}

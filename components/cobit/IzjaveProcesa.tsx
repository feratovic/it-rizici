'use client';

import { useState, useTransition } from 'react';

import { snimiCobitOdgovor } from '@/app/(app)/procjene/[id]/cobit/akcije';
import { profilZrelosti, type IzjavaZaRacun } from '@/lib/cobit';
import {
  COBIT_NIVOI,
  COBIT_NAZIV_NIVOA,
  COBIT_OPCIJE,
  bojaNivoaZrelosti,
  type CobitVrijednost,
} from '@/lib/skale';

type Izjava = IzjavaZaRacun & {
  redniBroj: number;
  tekst: string;
};

type Props = {
  procjenaId: string;
  izjave: Izjava[];
  pocetniOdgovori: Record<string, CobitVrijednost>;
  zakljucena: boolean;
};

type Stanje = 'mirno' | 'snimanje' | 'sacuvano' | 'greska';

export default function IzjaveProcesa({
  procjenaId,
  izjave,
  pocetniOdgovori,
  zakljucena,
}: Props) {
  const [odgovori, setOdgovori] =
    useState<Record<string, CobitVrijednost>>(pocetniOdgovori);
  const [stanje, setStanje] = useState<Stanje>('mirno');
  const [poruka, setPoruka] = useState('');
  const [, startTransition] = useTransition();

  function promijeni(izjavaKod: string, vrijednost: CobitVrijednost) {
    if (zakljucena) return;

    const prethodno = odgovori[izjavaKod];

    // Optimistički upis — bez dugmeta „sačuvaj".
    setOdgovori((stari) => ({ ...stari, [izjavaKod]: vrijednost }));
    setStanje('snimanje');

    startTransition(async () => {
      const ishod = await snimiCobitOdgovor({
        procjenaId,
        izjavaKod,
        vrijednost,
      });

      if (ishod.ok) {
        setStanje('sacuvano');
        setPoruka('');
      } else {
        // Vraćanje na prethodno stanje ako snimanje nije uspjelo.
        setOdgovori((stari) => {
          const vraceno = { ...stari };
          if (prethodno === undefined) delete vraceno[izjavaKod];
          else vraceno[izjavaKod] = prethodno;
          return vraceno;
        });
        setStanje('greska');
        setPoruka(ishod.greska ?? 'Snimanje nije uspjelo.');
      }
    });
  }

  const odgovoriMapa = new Map<string, CobitVrijednost>(
    Object.entries(odgovori),
  );
  const profil = profilZrelosti(izjave, odgovoriMapa);
  const boja = bojaNivoaZrelosti(profil.ukupno);

  return (
    <>
      <div className="mb-4 flex h-6 items-center text-sm">
        {zakljucena && (
          <span className="text-gray-500">
            Procjena je zaključena — odgovori se ne mogu mijenjati.
          </span>
        )}
        {!zakljucena && stanje === 'snimanje' && (
          <span className="text-gray-500">Snimanje…</span>
        )}
        {!zakljucena && stanje === 'sacuvano' && (
          <span className="text-green-700">Sačuvano</span>
        )}
        {!zakljucena && stanje === 'greska' && (
          <span className="text-red-700">{poruka}</span>
        )}
      </div>

      <div className="space-y-6">
        {COBIT_NIVOI.map((nivo) => {
          const zaNivo = izjave
            .filter((i) => i.nivoZrelosti === nivo)
            .sort((a, b) => a.redniBroj - b.redniBroj);
          if (zaNivo.length === 0) return null;

          return (
            <section key={nivo}>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">
                Nivo {nivo} — {COBIT_NAZIV_NIVOA[nivo]}
              </h2>

              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Izjava</th>
                      {COBIT_OPCIJE.map((o) => (
                        <th
                          key={o.vrijednost}
                          className="w-24 px-2 py-2 text-center font-medium"
                        >
                          {o.oznaka}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zaNivo.map((izjava) => (
                      <tr
                        key={izjava.kod}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-4 py-2 align-top text-gray-900">
                          {izjava.tekst}
                        </td>
                        {COBIT_OPCIJE.map((o) => (
                          <td key={o.vrijednost} className="px-2 py-2 text-center">
                            <input
                              type="radio"
                              name={izjava.kod}
                              value={o.vrijednost}
                              checked={odgovori[izjava.kod] === o.vrijednost}
                              disabled={zakljucena}
                              onChange={() => promijeni(izjava.kod, o.vrijednost)}
                              aria-label={`${izjava.tekst} — ${o.oznaka}`}
                              className="h-4 w-4 cursor-pointer accent-gray-900 disabled:cursor-not-allowed"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {/* Profil zrelosti — prikazuje se na dnu ekrana procesa. */}
      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">
          Profil zrelosti procesa
        </h2>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nivo</th>
                <th className="px-4 py-2 text-right font-medium">Suma (A)</th>
                <th className="px-4 py-2 text-right font-medium">Broj izjava (B)</th>
                <th className="px-4 py-2 text-right font-medium">Saglasnost (A/B)</th>
                <th className="px-4 py-2 text-right font-medium">Normalizovano</th>
                <th className="px-4 py-2 text-right font-medium">Doprinos</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {profil.nivoi.map((r) => (
                <tr key={r.nivo} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-900">{r.nivo}</td>
                  <td className="px-4 py-2 text-right">{r.suma.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{r.brojIzjava}</td>
                  <td className="px-4 py-2 text-right">{r.saglasnost.toFixed(4)}</td>
                  <td className="px-4 py-2 text-right">
                    {r.normalizovano.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right">{r.doprinos.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className={
              'flex items-center justify-between border-t border-gray-200 px-4 py-3 ' +
              boja.pozadina
            }
          >
            <span className="text-sm font-medium text-gray-900">
              Ukupan nivo zrelosti procesa
            </span>
            <span className={'text-lg font-bold tabular-nums ' + boja.tekst}>
              {profil.ukupno.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Odgovoreno {profil.ukupnoOdgovoreno} od {profil.ukupnoIzjava} izjava.
          Skala 0–5, veća vrijednost znači veću zrelost.
        </p>
      </section>
    </>
  );
}

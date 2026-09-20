'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type StavkaModula = {
  putanja: string;
  oznaka: string;
  /** indikator popunjenosti, npr. "142/226" */
  popunjeno?: string;
};

export default function NavigacijaModula({
  stavke,
}: {
  stavke: StavkaModula[];
}) {
  const putanja = usePathname();

  return (
    <nav className="rounded-lg border border-gray-200 bg-white p-2">
      <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Moduli
      </div>
      <ul className="mt-1 space-y-0.5">
        {stavke.map((s) => {
          const aktivna =
            putanja === s.putanja ||
            (s.putanja !== stavke[0]?.putanja &&
              putanja.startsWith(s.putanja + '/'));

          return (
            <li key={s.putanja}>
              <Link
                href={s.putanja}
                className={
                  'flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm ' +
                  (aktivna
                    ? 'bg-gray-900 font-medium text-white'
                    : 'text-gray-700 hover:bg-gray-100')
                }
              >
                <span className="truncate">{s.oznaka}</span>
                {s.popunjeno && (
                  <span
                    className={
                      'shrink-0 text-xs tabular-nums ' +
                      (aktivna ? 'text-gray-300' : 'text-gray-400')
                    }
                  >
                    {s.popunjeno}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

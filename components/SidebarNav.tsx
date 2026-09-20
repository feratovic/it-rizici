'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Uloga } from '@prisma/client';

const STAVKE: { putanja: string; oznaka: string; samoZa?: Uloga[] }[] = [
  { putanja: '/kontrolna-tabla', oznaka: 'Kontrolna tabla' },
  { putanja: '/procjene', oznaka: 'Procjene' },
  { putanja: '/institucije', oznaka: 'Institucije' },
  { putanja: '/podesavanja', oznaka: 'Podešavanja' },
];

export default function SidebarNav({ uloga }: { uloga: Uloga }) {
  const putanja = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {STAVKE.filter((s) => !s.samoZa || s.samoZa.includes(uloga)).map((s) => {
        const aktivna =
          putanja === s.putanja || putanja.startsWith(s.putanja + '/');
        return (
          <Link
            key={s.putanja}
            href={s.putanja}
            className={
              'rounded px-3 py-2 text-sm transition-colors ' +
              (aktivna
                ? 'bg-gray-900 font-medium text-white'
                : 'text-gray-700 hover:bg-gray-100')
            }
          >
            {s.oznaka}
          </Link>
        );
      })}
    </nav>
  );
}

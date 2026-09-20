import Link from 'next/link';

export type Mrvica = { oznaka: string; putanja?: string };

export default function Breadcrumbs({ stavke }: { stavke: Mrvica[] }) {
  return (
    <nav aria-label="Putanja" className="mb-4 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {stavke.map((s, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {s.putanja ? (
              <Link href={s.putanja} className="hover:text-gray-900 hover:underline">
                {s.oznaka}
              </Link>
            ) : (
              <span className="text-gray-900">{s.oznaka}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

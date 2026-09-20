import Link from 'next/link';
import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import { dohvatiProcjenu, popunjenostCobit } from '@/lib/podaci';
import { zahtijevajKorisnika, mozeVidjetiInstituciju } from '@/lib/ovlascenja';
import { NAZIV_DOMENA, jeDomen } from '@/lib/cobit';

export default async function StranicaDomena({
  params,
}: {
  params: Promise<{ id: string; domen: string }>;
}) {
  const { id, domen } = await params;
  const oznaka = domen.toUpperCase();

  if (!jeDomen(oznaka)) notFound();

  const korisnik = await zahtijevajKorisnika();
  const procjena = await dohvatiProcjenu(id);

  if (!procjena) notFound();
  if (!mozeVidjetiInstituciju(korisnik, procjena.institucijaId)) notFound();

  const procesi = (await popunjenostCobit(id)).filter(
    (p) => p.domen === oznaka,
  );

  const ukupno = procesi.reduce((a, p) => a + p.ukupno, 0);
  const odgovoreno = procesi.reduce((a, p) => a + p.odgovoreno, 0);

  return (
    <>
      <Breadcrumbs
        stavke={[
          { oznaka: 'Procjene', putanja: '/procjene' },
          {
            oznaka: `${procjena.institucija.naziv} — ${procjena.godina}`,
            putanja: `/procjene/${id}`,
          },
          { oznaka: `${oznaka} — ${NAZIV_DOMENA[oznaka]}` },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {oznaka} — {NAZIV_DOMENA[oznaka]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {procesi.length} {procesi.length === 1 ? 'proces' : 'procesa'} ·
          odgovoreno {odgovoreno} od {ukupno} izjava
        </p>
      </div>

      {procesi.length === 0 ? (
        <p className="text-sm text-gray-500">
          Katalog COBIT procesa nije učitan. Pokrenite <code>npm run db:seed</code>.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <tbody>
              {procesi.map((p) => {
                const procenat =
                  p.ukupno > 0 ? Math.round((p.odgovoreno / p.ukupno) * 100) : 0;
                const gotovo = p.odgovoreno === p.ukupno;

                return (
                  <tr
                    key={p.kod}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="w-16 px-4 py-2 font-medium text-gray-900">
                      {p.kod}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/procjene/${id}/cobit/${p.kod}`}
                        className="text-gray-900 hover:underline"
                      >
                        {p.naziv}
                      </Link>
                    </td>
                    <td className="w-48 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={
                              'h-full ' +
                              (gotovo ? 'bg-green-600' : 'bg-gray-500')
                            }
                            style={{ width: `${procenat}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-500">
                          {p.odgovoreno}/{p.ukupno}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

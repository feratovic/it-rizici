import { redirect } from 'next/navigation';

import { DOMENI } from '@/lib/cobit';

/**
 * COBIT modul više nema svoju listu — procesi se popunjavaju po domenima
 * (fazama), a pregled svih 15 procesa sa ocjenama stoji na ekranu pregleda
 * procjene. Putanja ostaje da bi stariji linkovi i dalje vodili nekuda.
 */
export default async function ModulCobit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/procjene/${id}/cobit/domen/${DOMENI[0].toLowerCase()}`);
}

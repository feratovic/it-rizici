'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { sacuvajProcjenu, type StanjeProcjene } from '@/app/(app)/procjene/akcije';

function Dugme() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dugme" disabled={pending}>
      {pending ? 'Kreiranje…' : 'Kreiraj procjenu'}
    </button>
  );
}

export default function FormaProcjene({
  institucije,
  godine,
}: {
  institucije: { id: string; naziv: string }[];
  godine: number[];
}) {
  const [stanje, akcija] = useActionState<StanjeProcjene, FormData>(
    sacuvajProcjenu,
    {},
  );

  return (
    <form action={akcija} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="institucijaId" className="oznaka-polja">Institucija</label>
        <select id="institucijaId" name="institucijaId" required className="polje">
          <option value="">— izaberite —</option>
          {institucije.map((i) => (
            <option key={i.id} value={i.id}>{i.naziv}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="godina" className="oznaka-polja">Godina</label>
        <select id="godina" name="godina" required className="polje" defaultValue={godine[0]}>
          {godine.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tip" className="oznaka-polja">Tip procjene</label>
        <select id="tip" name="tip" required className="polje">
          <option value="COBIT">COBIT samoprocjena</option>
          <option value="IT_UPITNIK">IT upitnik</option>
        </select>
      </div>

      {stanje.greska && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {stanje.greska}
        </p>
      )}

      <Dugme />
    </form>
  );
}

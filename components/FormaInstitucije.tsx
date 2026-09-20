'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  sacuvajInstituciju,
  type StanjeInstitucije,
} from '@/app/(app)/institucije/akcije';

function Dugme() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dugme" disabled={pending}>
      {pending ? 'Snimanje…' : 'Sačuvaj'}
    </button>
  );
}

export default function FormaInstitucije() {
  const [stanje, akcija] = useActionState<StanjeInstitucije, FormData>(
    sacuvajInstituciju,
    {},
  );

  return (
    <form action={akcija} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="naziv" className="oznaka-polja">Naziv institucije</label>
        <input id="naziv" name="naziv" required className="polje" />
      </div>
      <div>
        <label htmlFor="kontaktOsoba" className="oznaka-polja">Kontakt osoba</label>
        <input id="kontaktOsoba" name="kontaktOsoba" required className="polje" />
      </div>
      <div>
        <label htmlFor="email" className="oznaka-polja">E-pošta</label>
        <input id="email" name="email" type="email" required className="polje" />
      </div>
      <div>
        <label htmlFor="telefon" className="oznaka-polja">Telefon</label>
        <input id="telefon" name="telefon" required className="polje" />
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

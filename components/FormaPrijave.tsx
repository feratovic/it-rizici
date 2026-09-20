'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { prijava, type StanjePrijave } from '@/app/akcije';

function Dugme() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dugme w-full" disabled={pending}>
      {pending ? 'Prijava u toku…' : 'Prijavi se'}
    </button>
  );
}

export default function FormaPrijave() {
  const [stanje, akcija] = useActionState<StanjePrijave, FormData>(prijava, {});

  return (
    <form action={akcija} className="space-y-4">
      <div>
        <label htmlFor="email" className="oznaka-polja">
          E-pošta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="polje"
        />
      </div>

      <div>
        <label htmlFor="lozinka" className="oznaka-polja">
          Lozinka
        </label>
        <input
          id="lozinka"
          name="lozinka"
          type="password"
          autoComplete="current-password"
          required
          className="polje"
        />
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

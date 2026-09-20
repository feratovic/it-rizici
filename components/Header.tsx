import { odjava } from '@/app/akcije';
import { NAZIV_ULOGE, type Sesija } from '@/lib/ovlascenja';

export default function Header({ korisnik }: { korisnik: Sesija }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="text-sm font-semibold text-gray-900">
        Samoprocjena IT rizika i zrelosti IT kontrola
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-gray-900">{korisnik.ime}</div>
          <div className="text-xs text-gray-500">{NAZIV_ULOGE[korisnik.uloga]}</div>
        </div>
        <form action={odjava}>
          <button type="submit" className="dugme-sporedno py-1.5">
            Odjava
          </button>
        </form>
      </div>
    </header>
  );
}

import Header from '@/components/Header';
import SidebarNav from '@/components/SidebarNav';
import { zahtijevajKorisnika } from '@/lib/ovlascenja';

export default async function LayoutAplikacije({
  children,
}: {
  children: React.ReactNode;
}) {
  const korisnik = await zahtijevajKorisnika();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center border-b border-gray-200 px-5 text-sm font-bold tracking-tight">
          IT rizici
        </div>
        <SidebarNav uloga={korisnik.uloga} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header korisnik={korisnik} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

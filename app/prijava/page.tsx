import FormaPrijave from '@/components/FormaPrijave';

export const metadata = { title: 'Prijava' };

export default function StranicaPrijave() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-gray-900">
            Samoprocjena IT rizika i zrelosti IT kontrola
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Prijavite se za nastavak rada.
          </p>
        </div>

        <div className="kartica">
          <FormaPrijave />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Testno okruženje. Svi podaci su sintetički.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Samoprocjena IT rizika i zrelosti IT kontrola',
  description:
    'Aplikacija za samoprocjenu IT rizika i zrelosti IT kontrola. Staging okruženje.',
  // Aplikacija je isključivo staging — ne smije se indeksirati.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr-ME">
      <body>{children}</body>
    </html>
  );
}

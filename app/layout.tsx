import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'Samoprocjena IT rizika i zrelosti IT kontrola',
  description:
    'Aplikacija za samoprocjenu IT rizika i zrelosti IT kontrola. Staging okruženje.',
  // Aplikacija je isključivo staging — ne smije se indeksirati.
  robots: { index: false, follow: false },
};

// V2: preporuka alata „odložiti učitavanje resursa koji blokiraju prikaz“ —
// next/font preuzima font pri buildu i poslužuje ga sa sopstvenog domena.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-osnovni',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr-ME" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

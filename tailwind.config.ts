import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Font se učitava preko @import u globals.css, ne preko next/font.
        // Vidi NAPOMENE.md — [V2] kandidat za next/font/google.
        osnovni: ['var(--font-osnovni)'],
      },
      colors: {
        ocjena: {
          1: '#15803d',
          2: '#65a30d',
          3: '#ea580c',
          4: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
};

export default config;

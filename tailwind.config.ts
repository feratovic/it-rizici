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
        // V2: font se učitava preko next/font u app/layout.tsx.
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

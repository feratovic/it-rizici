# Aplikacija za samoprocjenu IT rizika i zrelosti IT kontrola

Mjerni objekat u okviru master rada o razvoju alata za analizu web aplikacija
sa aspekta performansi i nivoa sigurnosti.

> **Testno okruženje.** Svi podaci su sintetički. Aplikacija se ne deployuje u
> produkciju i ne indeksira se.

## Stack

Next.js 15 (App Router, TypeScript) · MongoDB Atlas · Prisma · NextAuth v5 ·
Tailwind CSS · Zod · Recharts · ExcelJS · @react-pdf/renderer

## Pokretanje

1. Kreirati besplatan MongoDB Atlas M0 klaster.
   Prisma MongoDB konektor zahtijeva replica set — Atlas ga podrazumijevano
   obezbjeđuje, lokalni samostalni `mongod` ne.
2. U Atlas **Network Access** dodati `0.0.0.0/0` (Vercel funkcije nemaju fiksne
   IP adrese).
3. Popuniti `.env` prema `.env.example`.
4. Instalacija i priprema baze:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Nalozi iz seed skripte

| E-pošta | Uloga | Institucija |
|---|---|---|
| `admin@revizija.test` | ADMIN | — |
| `revizor@revizija.test` | REVIZOR | — |
| `kontakt@alfa.test` | KONTAKT_OSOBA | Institucija Alfa |

Lozinka za sve naloge: `lozinka123`

## Skripte

| Komanda | Namjena |
|---|---|
| `npm run dev` | razvojni server |
| `npm run build` | produkcioni build |
| `npm run db:push` | primjena Prisma šeme na bazu |
| `npm run db:seed` | punjenje baze (idempotentno) |

## Prateći dokumenti

- [`SEMA.md`](SEMA.md) — evolucija šeme baze po mjernim tačkama
  (zamjena za migracionu istoriju)
- [`NAPOMENE.md`](NAPOMENE.md) — spisak namjerno izostavljenih optimizacionih i
  sigurnosnih praksi u V1 baseline verziji

## Mjerne tačke

| Tačka | Stanje | Git oznaka |
|---|---|---|
| M1 | skeleton, autentikacija, layout, model podataka, seed | `m1` |
| M2 | modul COBIT samoprocjene | `m2` |
| M3 | IT upitnik, dijelovi A i B | `m3` |
| M4 | IT upitnik, dio C | `m4` |
| M5 | rezultati, grafici, izvoz → **V1** | `v1-baseline` |

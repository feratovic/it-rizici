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

## Demo podaci

Redovni seed ostavlja procjene prazne. Za razgledanje aplikacije sa popunjenim
sadržajem:

```bash
npm run db:seed:demo
```

Skripta dodaje pet institucija sa kontakt osobama (`kontakt@alfa.test`,
`…@beta`, `…@gama`, `…@delta`, `…@epsilon`, ista lozinka) i po dvije COBIT
procjene za svaku: **2024** zaključena i popunjena do kraja, **2025** u toku sa
devet popunjenih procesa i desetim započetim. Odgovori se generišu
deterministički oko ciljanog nivoa zrelosti po instituciji, pa se rezultati ne
mijenjaju između pokretanja. Institucije su namjerno različite (Delta najslabija,
Gama najjača), a Epsilon je jedina koja je nazadovala u odnosu na prethodnu
godinu.

Suvi prolaz — ispis bez upisa u bazu, radi i kada baza nije dostupna:

```bash
npm run db:seed:demo -- --dry
```

Procjene tipa **IT upitnik** kreiraju se prazne. Dio A traži brojčane podatke o
instituciji koji nemaju smisleno sintetičko punjenje, pa se upitnik popunjava
ručno kroz aplikaciju.

## Skripte

| Komanda | Namjena |
|---|---|
| `npm run dev` | razvojni server |
| `npm run build` | produkcioni build |
| `npm run db:push` | primjena Prisma šeme na bazu |
| `npm run db:seed` | punjenje baze (idempotentno) |
| `npm run db:seed:demo` | demo procjene i COBIT odgovori (idempotentno) |

## Prateći dokumenti

- [`SEMA.md`](SEMA.md) — evolucija šeme baze po mjernim tačkama
  (zamjena za migracionu istoriju)
- [`NAPOMENE.md`](NAPOMENE.md) — spisak namjerno izostavljenih optimizacionih i
  sigurnosnih praksi u V1 baseline verziji
- [`VERIFIKACIJA.md`](VERIFIKACIJA.md) — provjera agregacije prema izvornim
  Excel fajlovima i popis utvrđenih defekata izvora
- [`PROTOKOL-MJERENJA.md`](PROTOKOL-MJERENJA.md) — commit hash, URL i datum po
  mjernoj tački

## Katalozi

Tekstovi izjava i pitanja čuvaju se kao JSON u `prisma/podaci/` i učitavaju iz
seed skripte, da bi se mogli regenerisati bez diranja koda. Generišu se
skriptama u `alati/` iz izvornih Excel fajlova (Python 3 + `openpyxl`):

```bash
python alati/izvuci-cobit.py "putanja/do/2.1 COBIT.xlsx"
python alati/izvuci-upitnik.py "putanja/do/3.Samoprocjena nivoa IT rizika.xlsx"
```

Provjera agregacije:

```bash
python alati/provjeri-agregaciju-cobit.py "putanja/do/2.1 COBIT.xlsx"
npx tsx alati/provjeri-cobit-ts.ts
```

`alati/` je build-time alat — ne ulazi u JS bundle aplikacije i ne utiče na
mjerenja.

## Mjerne tačke

| Tačka | Stanje | Git oznaka |
|---|---|---|
| M1 | skeleton, autentikacija, layout, model podataka, seed | `m1` |
| M2 | modul COBIT samoprocjene | `m2` |
| M3 | IT upitnik, dijelovi A i B | `m3` |
| M4 | IT upitnik, dio C | `m4` |
| M5 | rezultati, grafici, izvoz → **V1** | `v1-baseline` |

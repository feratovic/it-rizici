# Evolucija šeme baze

Prisma nad MongoDB **nema migracije** (`prisma migrate` nije podržan za
MongoDB konektor). Šema se primjenjuje sa `npm run db:push`, a ovaj fajl
zamjenjuje migracionu istoriju: za svaku mjernu tačku bilježi se šta je
dodato ili promijenjeno.

---

## M1 — osnovni entiteti

**Dodato**

| Objekat | Tip | Napomena |
|---|---|---|
| `Uloga` | enum | `ADMIN`, `REVIZOR`, `KONTAKT_OSOBA` |
| `TipProcjene` | enum | `COBIT`, `IT_UPITNIK` |
| `StatusProcjene` | enum | `U_TOKU`, `ZAKLJUCENA` |
| `Institucija` | kolekcija | `naziv` je `@unique` — služi kao stabilan ključ za idempotentan seed |
| `Korisnik` | kolekcija | `email` je `@unique`; `institucijaId` je opcion (ADMIN i REVIZOR nisu vezani za instituciju) |
| `Procjena` | kolekcija | `@@unique([institucijaId, godina, tip])` — jedna procjena po tipu, instituciji i godini |

**Odluke**

- `Institucija.naziv` i `Korisnik.email` su jedinstveni namjerno: seed radi
  `upsert` po njima, pa je ponovno pokretanje bezbjedno.
- `Procjena.zakljucenoDana` je nullable — postavlja se pri zaključivanju,
  briše pri otključavanju.
- Relacija `Korisnik → Procjena` nosi ime `KreiraoProcjenu`, jer bi se inače
  sudarila s budućim relacijama prema `Procjena`.

**Primjena**

```
npm run db:push
npm run db:seed
```

---

## M2 — COBIT modul

**Dodato**

| Objekat | Tip | Napomena |
|---|---|---|
| `CobitVrijednost` | enum | `NE`=0, `UGLAVNOM_NE`=0.33, `UGLAVNOM_DA`=0.66, `DA`=1 |
| `CobitIzjava` | composite tip | ugnježđuje se u `CobitProces`, nema sopstvenu kolekciju |
| `CobitProces` | kolekcija | `kod` je `@unique` (PO1, DS5, ME1…) |
| `CobitOdgovor` | kolekcija | `@@unique([procjenaId, izjavaKod])` + `@@index([procjenaId])` |

**Odluke**

- Izjave su **ugniježđene** u proces: katalog je nepromjenljiv i uvijek se čita
  u cjelini, pa je jedan upit po ekranu bolji od spajanja kolekcija.
- Odgovori su **zasebna kolekcija**: snimanje je automatsko pri svakoj promjeni,
  a Prisma nad MongoDB nema pozicioni upis u ugniježđeni niz. Sa složenim
  jedinstvenim indeksom svaka promjena je jedan `upsert`, umjesto prepisivanja
  dokumenta od ~390 stavki.
- `@@index([procjenaId])` je dodat jer se svi odgovori procjene čitaju odjednom
  pri otvaranju modula.
- `izmijenjeno` (`@updatedAt`) služi kao trag posljednje izmjene odgovora.

**Katalog**

15 procesa, **388 izjava** ukupno. Generisano iz izvornog Excel fajla:

```bash
python alati/izvuci-cobit.py "putanja/do/2.1 COBIT.xlsx"
npm run db:push
npm run db:seed
```

Agregacija je verifikovana prema izvornom fajlu — vidi `VERIFIKACIJA.md`.

---

## M3 — IT upitnik, dijelovi A i B

_(još nije primijenjeno)_

---

## M4 — IT upitnik, dio C

_(još nije primijenjeno)_

---

## M5 — rezultati i izvoz

_(ne očekuje se promjena šeme)_

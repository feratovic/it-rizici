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

_(još nije primijenjeno)_

---

## M3 — IT upitnik, dijelovi A i B

_(još nije primijenjeno)_

---

## M4 — IT upitnik, dio C

_(još nije primijenjeno)_

---

## M5 — rezultati i izvoz

_(ne očekuje se promjena šeme)_

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

**Dodato**

| Objekat | Tip | Napomena |
|---|---|---|
| `DioUpitnika` | enum | `A` (Opšti podaci), `B` (Indikatori IT rizika), `C` (IT kontrole) |
| `TipOdgovora` | enum | `BROJ`, `TEKST`, `DA_NE`, `IZBOR`, `DA_NE_DJELIMICNO` |
| `UpitnikPitanje` | composite tip | ugnježđuje se u `UpitnikSekcija`, nema sopstvenu kolekciju |
| `UpitnikSekcija` | kolekcija | `kod` je `@unique` (A1, B3, C4.7…) + `@@index([dio])` |
| `UpitnikOdgovor` | kolekcija | `@@unique([procjenaId, pitanjeKod])` + `@@index([procjenaId])` |
| `UpitnikOcjena` | kolekcija | `@@unique([procjenaId, sekcijaKod])` + `@@index([procjenaId])` |

Sva tri dijela dijele iste modele, pa je šema primijenjena odjednom; M4 dodaje
samo ekran dijela C i njegovu agregaciju.

**Odluke**

- Pitanja su **ugniježđena** u sekciju, odgovori i ocjene su **zasebne
  kolekcije** — isti razlog kao kod COBIT-a (`CobitIzjava` vs `CobitOdgovor`).
- `roditeljKod` je kod nadređene oblasti, **ne relacija**: katalog se uvijek
  čita cijeli po ekranu dijela, pa spajanje kolekcija ne bi ništa donijelo.
- **Ocjena stoji uz sekciju, ne uz pitanje.** U izvornom fajlu je kolona `H`
  jedna spojena ćelija preko svih redova sekcije (npr. `H132:H145` za B1,
  `H209:H218` za C1.1). Isto važi za obrazloženja dijela C — kolone `F` i `G`
  su takođe spojene po sekciji (`F209:F218`, `G209:G218`).
- Objašnjenje uz pojedinačno pitanje (`UpitnikOdgovor.objasnjenje`) postoji
  samo u dijelovima A i B, gdje kolona `F` **nije** spojena.
- `UpitnikOdgovor.vrijednost` je `String?`, a ne tipizovana kolona: pitanja
  imaju pet različitih tipova odgovora, a nijedan se ne agregira numerički.
  Ispravnost prema `tipOdgovora` provjerava server akcija uz katalog.
- `UpitnikOcjena.ocjena` je obavezna. Obrazloženje uneseno prije ocjene kreira
  zapis sa `ocjena: 0` — vrijednost van skale 1–4, koja se nigdje ne prikazuje
  ni ne agregira.
- Dio A nema ocjenu; dio B ocjenjuje svih pet kategorija; dio C ocjenjuje
  podoblasti, te oblasti `C9` i `C10` koje podoblasti nemaju.

**Katalog**

52 sekcije, **402 pitanja** (107 + 68 + 227). Generisano iz izvornog Excel fajla:

```bash
python alati/izvuci-upitnik.py "putanja/do/3.Samoprocjena nivoa IT rizika.xlsx"
npm run db:push
npm run db:seed
```

Agregacija prati blok `Rezultat samoprocjene` izvornog fajla — vidi
`VERIFIKACIJA.md`, sekcija 4.

---

## M4 — IT upitnik, dio C

**Dodato**

Bez promjene šeme — dio C koristi iste modele kao M3.

---

## M5 — rezultati i izvoz

_(ne očekuje se promjena šeme)_

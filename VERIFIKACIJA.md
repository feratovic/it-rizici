# Verifikacija agregacije prema izvornim Excel fajlovima

Specifikacija (6.8) zahtijeva da agregacija u aplikaciji daje iste vrijednosti
kao izvorni Excel na istim ulazima. Ovaj dokument bilježi kako je to
provjereno i šta je pritom utvrđeno.

Provjera se pokreće skriptom:

```bash
python alati/provjeri-agregaciju-cobit.py "putanja/do/2.1 COBIT.xlsx"
```

---

## 1. COBIT — formula za nivo zrelosti procesa

Specifikacija u sekciji 5.2 opisuje samo prvi korak agregacije („suma
vrijednosti odgovora po nivou"). Izvorni Excel računa **ponderisani ukupan
nivo zrelosti**, u pet koraka (kolone `M`–`R` svakog sheeta):

| Korak | Oznaka u Excelu | Formula |
|---|---|---|
| Suma vrijednosti odgovora na nivou *n* | `A` (kolona N) | `SUM` odgovora nivoa *n* |
| Broj izjava na nivou *n* | `B` (kolona O) | konstanta po procesu |
| Saglasnost nivoa zrelosti | `C` (kolona P) | `A / B` |
| Normalizovana vrijednost | `D` (kolona Q) | `C / Σ C` |
| Doprinos nivoa | `E` (kolona R) | `n × D` |
| **Ukupan nivo zrelosti procesa** | `R14` | `Σ E` |

Prosječan nivo zrelosti organizacije = aritmetička sredina ukupnih nivoa
za svih 15 procesa.

Ova formula je implementirana u `lib/cobit.ts`.

## 2. Rezultat provjere

Poređenje izračunate vrijednosti sa ćelijom `R14` svakog sheeta:

| Proces | Aplikacija | Excel `R14` | Poklapa se |
|---|---|---|---|
| PO1 | 2.53 | 2.53 | da |
| PO3 | 2.47 | 2.47 | da |
| PO5 | 2.01 | 2.01 | da |
| PO9 | 0.21 | 0.21 | da |
| PO10 | 1.04 | 1.04 | da |
| AI1 | 1.79 | 1.79 | da |
| AI2 | 0.87 | 0.87 | da |
| AI5 | 1.23 | 2.36 | **ne** |
| AI6 | 0.79 | 1.10 | **ne** |
| DS1 | 0.00 | 0.00 | da |
| DS4 | 1.38 | 1.38 | da |
| DS5 | 1.25 | 2.06 | **ne** |
| DS10 | 0.37 | 1.00 | **ne** |
| DS11 | 0.82 | 2.11 | **ne** |
| ME1 | 0.81 | 0.81 | da |

**Poklapa se 10 od 15 procesa.** Svih pet odstupanja ima isti, utvrđeni uzrok
u izvornom fajlu — opisan niže.

## 3. Utvrđeni defekti izvornih fajlova

### 3.1 Zbirni red bez formule (AI5, AI6, DS5, DS10, DS11)

Tabela agregacije ne čita odgovore direktno, nego zbirne redove
(`Broj izjava` / `Suma (nivo zrelosti)`) — npr. `N7 = SUM(E4:H4)`.

U pet sheetova ćelije `E4`, `G4` i `H4` (zbirni red nivoa 0) sadrže **ukucanu
nulu umjesto formule** `=SUM(...)`. U tim sheetovima postoje odgovoreni iskazi
nivoa 0 upisani u kolone `E`, `G` ili `H`, ali ih zbirni red ne pokupi, pa
Excel računa sa sumom 0 za nivo 0.

Posljedica: `Σ C` je manja nego što treba, pa su svi normalizovani doprinosi
proporcionalno uvećani, a ukupan nivo zrelosti **precijenjen**.

Kontrolni primjer, AI5:

| | Excel (kakav jeste) | Ispravno |
|---|---|---|
| `C` nivoa 0 | 0 (zbirni red daje 0) | 1.0 (dvije izjave, obje „Da") |
| `Σ C` | 1.0965 | 2.0965 |
| Ukupan nivo | 2.36 | **1.23** |

Vrijednost koju daje aplikacija (1.23) jednaka je onome što bi Excel izračunao
da zbirni red sadrži formulu. Formula agregacije je, dakle, ispravna —
netačan je ulaz u izvornom fajlu.

### 3.2 Dva označena odgovora na jednoj izjavi (PO9, DS1)

U PO9 red 8 ima istovremeno popunjeno `E8 = 0` i `H8 = 1`, a u DS1 redovi 2 i 3
imaju po dva označena odgovora. Excel ih sabira (`SUM` po redu), pa jedna
izjava doprinosi dva puta.

U aplikaciji je ovo **nemoguće**: složeni jedinstveni indeks
`@@unique([procjenaId, izjavaKod])` dozvoljava tačno jedan odgovor po izjavi.

### 3.3 Zbirni sheet `Sheet1` nije formula

U fajlu `2.1 COBIT.xlsx` sheet `Sheet1` sadrži **ručno ukucane vrijednosti**
nivoa zrelosti po procesima (jedina formula je `C17`, prosjek). Te vrijednosti
su zastarjele u odnosu na `R14` pojedinačnih sheetova i nisu mjerodavne.

Primjer: `Sheet1` za PO1 navodi 2.52, dok `PO1!R14` daje 2.5260 → 2.53.

## 4. IT upitnik — agregacija

Izvorni fajl `3.Samoprocjena nivoa IT rizika.xlsx` je **prazan šablon**: ne
sadrži nijedan popunjen odgovor, pa numeričko poređenje nije moguće. Umjesto
toga je preuzeta struktura formula iz bloka `Rezultat samoprocjene`
(redovi 485–534), koja je jednoznačna:

```
ocjena kategorije B1..B5   = vrijednost unesena uz kategoriju
ukupno dio B               = ROUND(AVERAGE(B1..B5), 2)

ocjena podoblasti          = vrijednost unesena uz podoblast
ocjena oblasti C1..C8      = ROUND(AVERAGE(ocjene podoblasti), 2)
ocjena oblasti C9, C10     = vrijednost unesena uz oblast (nemaju podoblasti)
ukupno dio C               = ROUND(AVERAGE(C1..C10), 2)
```

Bitno: ukupna ocjena dijela C je prosjek **već zaokruženih ocjena oblasti**, a
ne prosjek svih podoblasti. Redoslijed zaokruživanja utiče na rezultat i
implementiran je tačno ovako u `lib/upitnik.ts`.

## 5. Odstupanja strukture od specifikacije

Utvrđeno pri izvlačenju kataloga iz izvornih fajlova:

| Nalaz | Specifikacija | Izvorni fajl | Postupak |
|---|---|---|---|
| Broj pitanja dijela C | „oko 226" | 227 redova, numeracija ide do 226 | Broj **117 se pojavljuje dvaput** — posljednje pitanje u C4.7 i prvo u C4.8. Zadržana su oba pitanja; kodovi su vezani za sekciju (`C4.7-117`, `C4.8-117`) pa nema sudara. |
| Broj pitanja dijela A | „oko 49" | 49 glavnih + 58 podpitanja (1a, 1b, …) | Zadržana sva 107. |
| Broj pitanja dijela B | 42 | 42 glavna + 26 podpitanja | Zadržano svih 68. |
| Naziv sekcije A3 | „IT nadzor i revizija" | „Nadzor" | Korišten naziv iz izvora. |
| Broj izjava PO3 | — | 24 (ostali procesi po 26) | Korišteno stanje iz izvora. |

Nazivi oblasti i podoblasti preuzeti su iz bloka `Rezultat samoprocjene`, jer
su tamo ispravno napisani (u tijelu upitnika C4.1 je zapisan kao
„Polike i procedure").

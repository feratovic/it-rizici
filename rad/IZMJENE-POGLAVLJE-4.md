# Izmjene za Poglavlje 4 master rada

Dokument sadrži pregled utvrđenih neslaganja između teksta rada i stvarne
implementacije testne aplikacije, te **gotov tekst za zamjenu** koji se može
direktno prenijeti u `Master_Rad.docx`.

Izvor činjenica: repozitorijum `feratovic/it-rizici`, oznake `m1`, `m2`, grana
`main`, uz `SEMA.md`, `NAPOMENE.md` i `VERIFIKACIJA.md`.

---

## 0. Sažetak nalaza

| # | Nalaz | Gdje | Ozbiljnost |
|---|---|---|---|
| 1 | Tekst opisuje **aplikaciju za praćenje revizorskih preporuka**, a napravljena je aplikacija za samoprocjenu IT rizika i zrelosti kontrola. Riječ „preporuk" javlja se 13 puta u poglavljima 4–6 | §4.1, §4.3, §4.4 | kritično |
| 2 | Tvrdnja „razvijena kao moderna SPA koristeći React biblioteku" — aplikacija je Next.js sa server komponentama (22 od 29 komponenti se renderuje na serveru) | §4.1 | kritično |
| 3 | Metodologija **V1/V2 i mjerne tačke M1–M5 uopšte se ne pominju** u radu, iako je cijela aplikacija građena po njoj | cijeli rad | kritično |
| 4 | Brojevi u poglavlju 5 (2.3 s → 1.8 s, 6–8 h → 2–3 h, broj ranjivosti) nisu izmjereni — `PROTOKOL-MJERENJA.md` je prazan, V2 ne postoji | §5.3, §5.4, Tabela 5.1 | ozbiljno |
| 5 | §4.5 i §4.6 opisuju module i slučajeve upotrebe **alata**, a ne testne aplikacije — duplikat §3.4 i §3.5 | §4.5, §4.6 | ozbiljno |
| 6 | §4.3 tvrdi da je COBIT primijenjen na „upravljanje revizorskim preporukama"; COBIT je zapravo sadržaj testne aplikacije. Formula agregacije nigdje nije opisana | §4.3 | ozbiljno |
| 7 | „tri scenarija" u tekstu vs „četiri scenarija" u potpisu Slike 5.1 | §5.1 | sitno |
| 8 | „6.5 Komparativna analiza" stoji kao običan tekst usred poglavlja 5 — pogrešan broj i nivo, ne ulazi u sadržaj | §5.4 | sitno |
| 9 | Tabela 3.9 i Tabela 5.1 imaju identičan naziv | §7.1 | sitno |
| 10 | Uvodni pasus poglavlja 6 (o performansama) pripada poglavlju 2 | §6 | sitno |

**Zaključak:** neslaganja su gotovo isključivo u tekstu rada. Implementacija
prati specifikaciju; tekst je zaostao iz ranije verzije rada.

---

## 1. Činjenice o aplikaciji (provjereno u kodu)

| Stavka | Vrijednost |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Renderovanje | server komponente podrazumijevano; 7 od 29 `.tsx` ima `"use client"` |
| Baza | MongoDB Atlas M0, Prisma (MongoDB konektor) |
| Autentikacija | NextAuth v5, Credentials provider, sesija u kolačiću |
| Uloge | `ADMIN`, `REVIZOR`, `KONTAKT_OSOBA` |
| Stilizovanje | Tailwind CSS, bez UI biblioteka komponenata |
| COBIT katalog | 15 procesa, **388 izjava**, nivoi zrelosti 0–5 |
| Katalog upitnika | 52 sekcije, **402 pitanja** |
| — dio A | 4 sekcije, 107 pitanja (49 glavnih + 58 podpitanja) |
| — dio B | 5 kategorija, 68 pitanja (42 glavna + 26 podpitanja) |
| — dio C | 10 oblasti, 33 podoblasti, 227 pitanja |
| Verifikacija agregacije | 10/15 COBIT procesa poklapa se sa izvornim Excelom |

---

## 2. Novi tekst za Poglavlje 4

Predložena struktura ima **sedam** umjesto dosadašnjih šest sekcija. Mapiranje:

| Bilo | Postaje |
|---|---|
| 4.1 Opis aplikacije | 4.1 Opis testne aplikacije *(prepisano)* |
| 4.2 Plan internog revizora | 4.2 Domenski sadržaj i model podataka *(novo; stari sadržaj prelazi u 4.5)* |
| 4.3 Mjerenje nivoa zrelosti po COBIT metodologiji | 4.3 *(zadržan naslov, prepisan sadržaj)* |
| — | **4.4 Baseline verzija V1 i optimizovana verzija V2** *(novo)* |
| 4.4 Upotreba aplikacije i integracija alata | 4.5 *(prepisano)* |
| 4.5 Use case-ovi i dijagrami | 4.6 Slučajevi upotrebe testne aplikacije *(prepisano)* |
| 4.6 Moduli aplikacije u praksi | 4.7 Moduli testne aplikacije *(prepisano)* |

> Pošto se numeracija od 4.5 pomjera, provjeriti unakrsne reference na
> Sliku 4.3 i Sliku 4.4 nakon izmjene.

---

### 4. Razvoj testne aplikacije

#### 4.1 Opis testne aplikacije

Za potrebe primjene razvijenog softverskog alata izrađena je web aplikacija za
samoprocjenu IT rizika i zrelosti IT kontrola. Aplikacija je istovremeno mjerni
objekat eksperimenta: ona nije predmet ovog rada, nego kontrolisano okruženje
nad kojim se pokreće razvijeni alat.

Aplikacija podržava dvije metodološki različite vrste procjene. Prva je
samoprocjena zrelosti IT procesa prema COBIT metodologiji, a druga je
strukturirani IT upitnik podijeljen na tri dijela, preuzet iz regulatornog
upitnika za kreditne institucije. Obje procjene vode se po instituciji i
godini, a jedna institucija može imati najviše jednu procjenu određenog tipa
po godini.

Ključne funkcionalnosti aplikacije su:

- evidencija institucija koje se procjenjuju i kontakt podataka za svaku od njih,
- kreiranje procjene za izabranu instituciju, godinu i tip procjene,
- popunjavanje COBIT samoprocjene po procesima i nivoima zrelosti,
- popunjavanje IT upitnika kroz dijelove A, B i C, uz unos ocjena rizika i
  ocjena zrelosti kontrola sa obrazloženjima,
- automatsko snimanje svakog odgovora pri promjeni, bez posebne potvrde,
- agregiranje unesenih odgovora u ocjene po kategorijama, oblastima i ukupno,
- prikaz rezultata i izvoz izvještaja u formate Excel i PDF,
- upravljanje korisničkim nalozima i razlikovanje pristupnih prava po ulogama.

Definisane su tri uloge. Administrator ima pun pristup i upravlja korisnicima.
Revizor pristupa svim procjenama, ocjenjuje ih i zaključuje. Kontakt osoba
institucije pristupa isključivo procjenama svoje institucije i može ih
popunjavati, ali ne i ocjenjivati.

Aplikacija je razvijena u okviru **Next.js 15** sa App Router pristupom i
jezikom TypeScript. Podrazumijevani način renderovanja su server komponente;
oznaka `"use client"` upotrijebljena je samo tamo gdje je interaktivnost
stvarno neophodna, u sedam od ukupno dvadeset devet komponenti. Podaci se
čuvaju u bazi MongoDB Atlas, kojoj se pristupa preko sloja Prisma. Autentikacija
je riješena bibliotekom NextAuth v5 sa provajderom zasnovanim na korisničkom
imenu i lozinki. Za stilizovanje je upotrijebljen Tailwind CSS, bez uvođenja
gotovih biblioteka UI komponenti, budući da se veličina JavaScript paketa mjeri
i mora biti pripisiva sopstvenom kodu.

Na slici 4.1 prikazana je podjela upitnika na tri dijela, kao i način na koji
se pojedinačne ocjene agregiraju u ukupnu ocjenu rizika i zrelosti.

**Slika 4.1. Struktura IT upitnika i logika agregacije ocjena**

---

#### 4.2 Domenski sadržaj i model podataka

Domenski sadržaj aplikacije nije izmišljen za potrebe eksperimenta. Katalog
COBIT procesa i izjava, kao i katalog pitanja IT upitnika, izvučeni su
programski iz izvornih dokumenata metodologije interne IT revizije i
regulatornog IT upitnika, pa učitani u bazu kroz idempotentnu seed skriptu.
Obim kataloga prikazan je u tabeli 4.1.

**Tabela 4.1. Obim domenskog kataloga testne aplikacije**

| Dio | Struktura | Broj pitanja/izjava |
|---|---|---|
| COBIT samoprocjena | 15 procesa u četiri domena (PO, AI, DS, ME), nivoi zrelosti 0–5 | 388 izjava |
| IT upitnik, dio A — opšti podaci | 4 sekcije (A1–A4) | 107 |
| IT upitnik, dio B — indikatori IT rizika | 5 kategorija (B1–B5) | 68 |
| IT upitnik, dio C — IT kontrole | 10 oblasti, 33 podoblasti | 227 |
| **Ukupno upitnik** | **52 sekcije** | **402** |

Svi podaci kojima se aplikacija puni su sintetički. Institucije nose izmišljene
nazive („Institucija Alfa", „Institucija Beta"), a nijedan stvarni odgovor iz
izvornih dokumenata nije prenesen u aplikaciju.

Model podataka je namjerno hibridan. Katalog se **ugnježđuje**: COBIT izjave
unutar procesa, pitanja upitnika unutar sekcije. Razlog je što je katalog
praktično nepromjenljiv i uvijek se čita u cjelini, pa je jedan upit po ekranu
povoljniji od spajanja kolekcija. Odgovori i ocjene, nasuprot tome, čuvaju se u
**zasebnim kolekcijama**. Upitnik se snima automatski pri svakoj promjeni, a
Prisma nad bazom MongoDB nema pozicioni upis u ugniježđeni niz, pa bi izmjena
jednog odgovora značila prepisivanje cijelog dokumenta od više stotina stavki.
Sa zasebnom kolekcijom i složenim jedinstvenim indeksom, snimanje jednog
odgovora svodi se na jednu `upsert` operaciju.

Sve stavke kataloga imaju stabilan čitljiv kod umjesto oslanjanja na interni
identifikator zapisa: `PO1-N2-3` označava COBIT izjavu u procesu PO1, na nivou
zrelosti 2, rednog broja 3; `B1-7` označava sedmo pitanje u kategoriji B1;
`C4.5-101` označava pitanje 101 u podoblasti C4.5. Ti kodovi koriste se kao
strani ključevi u odgovorima, čime seed postaje idempotentan, a rezultati
mjerenja ostaju uporedivi između verzija aplikacije.

Na slici 4.2 prikazani su entiteti testne aplikacije i način na koji su katalog
pitanja i odgovori razdvojeni u modelu podataka.

**Slika 4.2. Model podataka testne aplikacije**

---

#### 4.3 Mjerenje nivoa zrelosti po COBIT metodologiji

COBIT (Control Objectives for Information and Related Technologies) je
međunarodno priznat okvir za upravljanje i kontrolu informacionih sistema. U
testnoj aplikaciji COBIT nije upotrijebljen kao mjerilo kvaliteta same
aplikacije, nego čini njen domenski sadržaj: aplikacija sprovodi samoprocjenu
zrelosti petnaest COBIT procesa raspoređenih u četiri domena — planiranje i
organizacija (PO), nabavka i implementacija (AI), isporuka i podrška (DS) te
nadzor i evaluacija (ME).

Svaki proces opisan je skupom izjava razvrstanih po nivoima zrelosti od 0 do 5.
Korisnik za svaku izjavu bira jedan od četiri stepena saglasnosti, kojima
odgovaraju numeričke vrijednosti: *ne* = 0, *uglavnom ne* = 0,33,
*uglavnom da* = 0,66, *da* = 1.

Ukupan nivo zrelosti procesa ne dobija se prostim prosjekom, nego ponderisanim
postupkom u pet koraka, preuzetim iz izvorne metodologije:

| Korak | Oznaka | Formula |
|---|---|---|
| Suma vrijednosti odgovora na nivou *n* | A(n) | zbir odgovora izjava nivoa *n* |
| Broj izjava na nivou *n* | B(n) | konstanta po procesu |
| Saglasnost nivoa zrelosti | C(n) | A(n) / B(n) |
| Normalizovana vrijednost | D(n) | C(n) / ΣC |
| Doprinos nivoa | E(n) | n × D(n) |
| **Ukupan nivo zrelosti procesa** | — | **ΣE** |

Prosječan nivo zrelosti organizacije izračunava se kao aritmetička sredina
ukupnih nivoa svih petnaest procesa. Skala je 0–5, pri čemu **veća vrijednost
znači veću zrelost**.

Ovdje je bitno istaći metodološku zamku koja je u implementaciji posebno
tretirana: skale u aplikaciji su suprotno orijentisane. COBIT nivo zrelosti
kreće se od 0 do 5 i veća vrijednost je povoljnija, dok se ocjena rizika u
dijelu B i ocjena zrelosti kontrola u dijelu C kreću od 1 do 4, gdje je veća
vrijednost nepovoljnija. Da se inverzija ne bi ponavljala i pogrešno primijenila
po komponentama, tumačenje smjera skale i mapiranje ocjene u boju centralizovani
su na jedno mjesto u kodu.

Ispravnost implementirane agregacije provjerena je poređenjem sa izvornim
proračunom za svih petnaest procesa. Za deset procesa rezultat se poklapa
potpuno. Kod preostalih pet utvrđeno je da odstupanje potiče iz **greške u
izvornom dokumentu**, a ne iz implementacije: u zbirnim redovima nivoa 0 tih
listova umjesto formule sabiranja upisane su konstantne nule, pa izvorni
proračun ne obuhvata date odgovore i nivo zrelosti prikazuje kao viši nego što
jeste. Dodatno je utvrđeno da pojedine izjave u izvornom dokumentu imaju
istovremeno označena dva odgovora, što izvorni proračun sabira dvostruko. U
aplikaciji je to onemogućeno složenim jedinstvenim indeksom, koji dozvoljava
tačno jedan odgovor po izjavi.

---

#### 4.4 Baseline verzija V1 i optimizovana verzija V2

Da bi se efekat primjene razvijenog alata mogao pripisati samom alatu, testna
aplikacija razvijena je u dvije verzije identičnog funkcionalnog obima.

**Verzija V1** je funkcionalno kompletna, ali namjerno neoptimizovana, i —
što je metodološki ključno — **razvijena je bez upotrebe razvijenog alata za
analizu**. Ona predstavlja kontrolnu grupu eksperimenta. Alat se prvi put
pokreće tek nad završenom verzijom V1.

**Verzija V2** nastaje isključivo primjenom preporuka koje generiše alat nad
verzijom V1. V2 ne dodaje nijednu novu funkcionalnost, rutu ni ekran, ne mijenja
model podataka, niti mijenja tekst, broj ili redoslijed pitanja. Obim
funkcionalnosti mora ostati identičan, jer se u suprotnom razlika u izmjerenim
metrikama ne bi mogla pripisati preporukama alata.

U verziji V1 namjerno su izostavljene optimizacione i sigurnosne prakse
navedene u tabeli 4.2. Riječ je o **dokumentovanoj metodološkoj odluci, a ne o
propustu**: referentno stanje mora odražavati naivno implementiranu aplikaciju.
Pritom u aplikaciju nije ubačena nijedna eksploatabilna ranjivost niti
biblioteka sa poznatim propustom — baseline se postiže *izostankom hardeninga*,
ne *ubacivanjem propusta*.

**Tabela 4.2. Prakse namjerno izostavljene u verziji V1**

| Aspekt | Izostavljeno u V1 | Mjesto izmjene u V2 | Ciljana metrika |
|---|---|---|---|
| Performanse | font se učitava CSS direktivom `@import`, ne mehanizmom `next/font` | `app/layout.tsx` | FCP, LCP, resursi koji blokiraju renderovanje |
| Performanse | obične `<img>` oznake umjesto komponente `next/image` | `components/Slika.tsx` | LCP, ukupan prenešeni bajt |
| Performanse | bez dijeljenja koda i dinamičkih uvoza | mjesta označena markerom `[V2]` | TBT, veličina JS paketa |
| Performanse | biblioteka za grafike u glavnom paketu | `components/grafici/` | TBT, veličina JS paketa |
| Performanse | bez keširanja i revalidacije | `lib/podaci.ts` | TTFB |
| Performanse | bez virtualizacije dugih lista — svih 227 pitanja dijela C renderuje se odjednom | komponenta liste pitanja | TBT, CLS, vrijeme renderovanja |
| Sigurnost | bez sigurnosnih zaglavlja (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | `next.config.js` | sigurnosni skor, pasivna pravila alata ZAP |
| Sigurnost | zaglavlje `X-Powered-By` se ne uklanja | `next.config.js` | otkrivanje informacija |
| Sigurnost | kolačići se ne podešavaju eksplicitno | `auth.config.ts` | nalaz o atributima kolačića |
| Sigurnost | bez ograničavanja učestalosti zahtjeva | `middleware.ts` | otpornost na automatizovane zahtjeve |

Neke prakse primijenjene su i u baseline verziji, jer nisu predmet mjerenja i
njihovo izostavljanje ne bi bilo mjerljivo spolja: lozinke se hešuju algoritmom
bcrypt, ulazi se validiraju, ovlašćenja se provjeravaju na svakoj zaštićenoj
ruti, a klijent baze keširan je u globalnoj promjenljivoj kako besplatni klaster
ne bi iscrpio dozvoljeni broj konekcija i time onemogućio samo mjerenje.

Kod je od početka organizovan tako da intervencije u verziji V2 budu izmjene u
malom broju fajlova, a ne prepisivanje aplikacije. Svako mjesto predviđeno za
kasniju intervenciju označeno je komentarom `[V2]`, pa se u fazi optimizacije
repozitorijum jednostavno pretraži po toj oznaci.

Razvoj verzije V1 vođen je kroz pet **mjernih tačaka** — razvojnih prekretnica
na kojima se snima stanje metrika, kako bi se dobio trend kroz razvojni ciklus,
a ne samo jedno mjerenje na kraju:

**Tabela 4.3. Mjerne tačke razvoja verzije V1**

| Tačka | Stanje aplikacije | Oznaka u repozitorijumu |
|---|---|---|
| M1 | skeleton, autentikacija, layout, navigacija, model podataka, seed | `m1` |
| M2 | modul COBIT samoprocjene | `m2` |
| M3 | IT upitnik, dijelovi A i B | `m3` |
| M4 | IT upitnik, dio C | `m4` |
| M5 | rezultati, grafici, izvoz izvještaja — ovo je verzija V1 | `v1-baseline` |

Na svakoj mjernoj tački aplikacija se postavlja na zaseban staging projekat, a
bilježe se identifikator commita, adresa postavljene aplikacije i datum. Tokom
razvoja verzije V1 nije uvedena nijedna automatska provjera u razvojnom
procesu — ni statička analiza koda, ni skeniranje, ni razvijeni alat — jer je
V1 kontrolna grupa i mora nastati bez njih.

---

#### 4.5 Upotreba aplikacije i integracija alata

Plan primjene alata nad testnom aplikacijom obuhvata ispitivanje performansi u
pogledu vremena odziva i veličine prenesenih resursa, evaluaciju sigurnosne
higijene kroz provjere predviđene modelom iz poglavlja 3, te analizu rezultata
radi utvrđivanja mogućnosti za unapređenje.

Budući da je testna aplikacija u vlasništvu autora rada, nad njom su dostupne i
aktivne provjere, u skladu sa okvirom iz dijela 3.6. Vlasništvo nad domenom
dokazano je postavljanjem datoteke sa zadatim sadržajem na unaprijed dogovorenu
putanju, čime su, pored pasivnih, omogućene i provjere koje podrazumijevaju
slanje neočekivanih ulaza.

Mjerenje se sprovodi nad sljedećim scenarijima korišćenja, izabranim tako da
pokriju bitno različite obrasce opterećenja:

**Tabela 4.4. Scenariji mjerenja**

| Oznaka | Scenario | Zašto je izabran |
|---|---|---|
| S1 | prijava korisnika | ulazna tačka, statična strana, mjeri osnovno vrijeme odziva |
| S2 | kontrolna tabla | agregatni upiti nad bazom, mjeri TTFB |
| S3 | popunjavanje jednog COBIT procesa | interaktivni ekran sa automatskim snimanjem |
| S4 | popunjavanje dijela C IT upitnika | najteži ekran — 227 pitanja renderovanih odjednom, bez virtualizacije |
| S5 | ekran rezultata sa graficima | najveći JavaScript paket, biblioteka za grafike u glavnom paketu |
| S6 | izvoz izvještaja u PDF i Excel | obrada na serveru, mjeri vrijeme odgovora pod opterećenjem |

Scenario S4 posebno je značajan, jer izostanak virtualizacije duge liste
predstavlja jednu od unaprijed dokumentovanih slabosti baseline verzije i
očekuje se da bude prepoznat među preporukama alata.

Na slici 4.3 prikazano je okruženje u kojem je testna aplikacija postavljena i
način na koji je razvijeni alat usmjeren na njeno mjerenje.

**Slika 4.3. Testno okruženje i tok mjerenja**

---

#### 4.6 Slučajevi upotrebe testne aplikacije

Slučajevi upotrebe navedeni u ovom dijelu odnose se na **testnu aplikaciju**.
Slučajevi upotrebe razvijenog alata opisani su u dijelu 3.4 i ovdje se ne
ponavljaju.

| Oznaka | Slučaj upotrebe | Uloga |
|---|---|---|
| UC-A1 | Evidentiranje institucije i njenih kontakt podataka | administrator, revizor |
| UC-A2 | Kreiranje procjene za instituciju, godinu i tip procjene | administrator, revizor |
| UC-A3 | Popunjavanje COBIT samoprocjene po procesima i nivoima zrelosti | revizor, kontakt osoba |
| UC-A4 | Popunjavanje IT upitnika, dijelovi A, B i C | revizor, kontakt osoba |
| UC-A5 | Unos ocjene rizika i ocjene zrelosti kontrola sa obrazloženjima | revizor |
| UC-A6 | Pregled agregiranih rezultata i grafika | administrator, revizor, kontakt osoba |
| UC-A7 | Izvoz izvještaja u formate Excel i PDF | revizor |
| UC-A8 | Zaključivanje procjene uz provjeru potpunosti | revizor |

Zaključivanje procjene uslovljeno je provjerom da su sva pitanja odgovorena i
sve ocjene unesene, čime se sprječava agregiranje nepotpunih podataka.

Na slici 4.4 prikazani su slučajevi upotrebe testne aplikacije iz ugla revizora
i kontakt osobe institucije.

**Slika 4.4. Use case dijagram testne aplikacije**

---

#### 4.7 Moduli testne aplikacije

Aplikacija je organizovana u module prikazane u tabeli 4.5. Modularna struktura
razvijenog **alata** opisana je u dijelu 3.5 i ne ponavlja se ovdje.

**Tabela 4.5. Moduli testne aplikacije**

| Modul | Sadržaj | Rute |
|---|---|---|
| Autentikacija i ovlašćenja | prijava, odjava, razlikovanje tri uloge, zaštita ruta | `/prijava` |
| Kontrolna tabla | kartice sa brojačima i lista posljednjih procjena | `/kontrolna-tabla` |
| Institucije | evidencija institucija i njihovih procjena | `/institucije` |
| Procjene | kreiranje i pregled procjene, zaključivanje | `/procjene` |
| COBIT samoprocjena | popunjavanje izjava po procesima i nivoima, prikaz profila zrelosti | `/procjene/[id]/cobit` |
| IT upitnik | popunjavanje dijelova A, B i C, unos ocjena sa obrazloženjima | `/procjene/[id]/upitnik/[dio]` |
| Rezultati i izvoz | agregirani rezultati, grafici, izvoz u Excel i PDF | `/procjene/[id]/rezultati` |

Unutar svake procjene dostupna je navigacija po modulima sa indikatorom
popunjenosti, koji u svakom trenutku pokazuje odnos odgovorenih i ukupnih
pitanja, odnosno unesenih i ukupnih ocjena.

---

## 3. Poglavlje 5 — šta treba povući

Sekcije 5.3 i 5.4 navode konkretne izmjerene vrijednosti. Te vrijednosti nisu
proizvod sprovedenog mjerenja: protokol mjerenja je prazan, verzija V2 još ne
postoji, a mjerna tačka M5 nije dovršena.

Konkretno treba ukloniti ili označiti kao ilustrativne:

- „prosječno vrijeme odziva oko 2.3 sekunde" (§5.3),
- „4 niskorizične i 2 srednjorizične ranjivosti" (§5.3),
- „prosječno vrijeme odziva **smanjeno na 1.8 sekundi** zahvaljujući
  optimizacijama uočenim kroz direktna mjerenja" (§5.4) — ova formulacija tvrdi
  da je optimizacija sprovedena i izmjerena,
- „detekcija 6 ranjivosti" (§5.4),
- „6–8 sati" i „2–3 sata" (§5.3, §5.4, Tabela 5.1),
- sve brojčane vrijednosti u Tabeli 5.1.

Uz to, poređenje u poglavlju 5 ne poklapa se sa sprovedenim eksperimentom. Rad
poredi tri scenarija (*bez alata / postojeći alati / razvijeni alat*), dok je
eksperiment osmišljen kao poređenje verzija (*V1 baseline / V2 optimizovano*),
uz trend kroz pet mjernih tačaka. Potrebno je odlučiti koje poređenje nosi
dokaz hipoteze i uskladiti poglavlje 5 sa tom odlukom. Preporuka je zadržati
oba, ali jasno razdvojena: poređenje alata kao mjeru **efikasnosti procesa
evaluacije**, a poređenje V1/V2 kao mjeru **efekta preporuka na sam proizvod**.

---

## 4. Sitnije ispravke

- [ ] §5.1 — uskladiti „tri scenarija" u tekstu sa potpisom Slike 5.1 koji
      pominje četiri scenarija.
- [ ] §5.4 — „6.5 Komparativna analiza" preimenovati u ispravan broj unutar
      poglavlja 5 i primijeniti stil naslova, da uđe u automatski sadržaj.
- [ ] §7.1 — Tabela 3.9 i Tabela 5.1 imaju identičan naziv „Uporedni prikaz
      rezultata po scenarijima"; razlikovati ih.
- [ ] §6 — uvodni pasus o performansama premjestiti u poglavlje 2 ili ukloniti;
      poglavlje 6 treba da počne sumiranjem istraživanja.
- [ ] §6.3 — tvrdnja „pretežno razvijenih u React ekosistemu" tačna je utoliko
      što je Next.js zasnovan na Reactu, ali treba precizirati da je riječ o
      renderovanju na serveru, a ne o jednostraničnoj aplikaciji.
- [ ] Cijelo poglavlje 4 — pretražiti i ukloniti preostala pominjanja
      „revizorskih preporuka" kao predmeta testne aplikacije.
- [ ] Ažurirati listu tabela i slika u Dodatku A novim stavkama (Tabele
      4.1–4.5, eventualna Slika 4.5).

---

## 5. Slike

Uz ovaj dokument pripremljene su dvije slike, u direktorijumu `rad/slike/`:

| Fajl | Slika u radu |
|---|---|
| `slika-4-1-struktura-upitnika.svg` | Slika 4.1. Struktura IT upitnika i logika agregacije ocjena |
| `slika-4-2-model-podataka.svg` | Slika 4.2. Model podataka testne aplikacije |

Format je SVG, pa se u Word ubacuju bez gubitka oštrine i mogu se skalirati na
širinu strane. U LibreOffice Writeru: *Insert → Image*, pa po potrebi
*Format → Image → Properties* za širinu.

Preporučuje se dodavanje još jedne slike:

- **Slika 4.5. Mjerne tačke M1–M5 i tok eksperimenta** — dijagram koji prikazuje
  razvoj V1 kroz pet tačaka, pokretanje alata nad V1, nastanak V2 na osnovu
  preporuka, i ponovno mjerenje. Bez nje dio 4.4 ostaje samo tekstualan.

Slike 4.3 i 4.4 već postoje u radu; Sliku 4.3 treba dopuniti prikazom obje
verzije (V1 i V2), a ne samo jednog okruženja.

---

## 6. Stanje aplikacije u odnosu na tekst

Provjereno u kodu na dan pisanja ovog dokumenta:

| Mjerna tačka | Sadržaj | Stanje |
|---|---|---|
| M1 | skeleton, autentikacija, layout, model podataka, seed | dovršeno, oznaka `m1` |
| M2 | modul COBIT samoprocjene | dovršeno, oznaka `m2` |
| M3 | IT upitnik, dijelovi A i B | dovršeno, oznaka još nije postavljena |
| M4 | IT upitnik, dio C | dovršeno, oznaka još nije postavljena |
| M5 | rezultati, grafici, izvoz izvještaja | **nije započeto** |

Sva tri dijela upitnika popunjavaju se kroz zajedničku rutu
`/procjene/[id]/upitnik/[dio]`, uključujući unos ocjena rizika i ocjena
zrelosti sa obrazloženjima prednosti i slabosti.

**Nedostaje za V1:**

- ruta `/procjene/[id]/rezultati` sa agregiranim rezultatima i graficima,
- izvoz u Excel — biblioteka `exceljs` je instalirana, ali se nigdje ne koristi,
- izvoz u PDF — biblioteka `@react-pdf/renderer` je instalirana, ali se nigdje
  ne koristi,
- oznake `m3` i `m4` u repozitorijumu,
- popunjen `PROTOKOL-MJERENJA.md` (identifikatori commita, adrese, datumi).

Dio 4.7 gore opisuje i modul rezultata i izvoza. Dok se M5 ne dovrši, treba
ili taj red ukloniti iz tabele 4.5, ili u tekstu jasno naznačiti dokle je
razvoj doveden. Opis funkcionalnosti koja ne postoji najlakše je mjesto za
primjedbu komisije.

**Redoslijed posla koji predlažem:** dovršiti M5 → postaviti oznake `m3`, `m4`,
`v1-baseline` → sprovesti mjerenja i popuniti protokol → napraviti V2 →
tek onda pisati brojeve u poglavlje 5.

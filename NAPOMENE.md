# Namjerno izostavljene prakse u verziji V1 (baseline)

Verzija V1 je **kontrolna grupa** eksperimenta. Razvijena je bez upotrebe alata
za analizu i bez primjene optimizacionih i sigurnosnih praksi, da bi referentno
mjerenje odražavalo naivno implementiranu aplikaciju.

**Ovo je dokumentovana metodološka odluka, ne propust.** U aplikaciju nije
ubačena nijedna eksploatabilna ranjivost — baseline se postiže *izostankom
hardeninga*, ne *ubacivanjem propusta*.

Svaka stavka ima unaprijed predviđeno mjesto izmjene u V2. U kodu je to mjesto
označeno komentarom `// [V2]`, pa se u V2 fazi repozitorijum pretražuje po tom
stringu.

---

## Performanse

| # | Izostavljeno | Mjesto izmjene u V2 | Ciljana metrika | Status |
|---|---|---|---|---|
| P1 | Font se učitava preko `@import` u CSS-u (render-blocking), ne preko `next/font` | `app/globals.css` → `app/layout.tsx` (`next/font/google`) | FCP, LCP, render-blocking resursi | izostavljeno |
| P2 | Obične `<img>` oznake umjesto `next/image` | `components/Slika.tsx` | LCP, ukupan prenešeni bajt | izostavljeno |
| P3 | Bez code splittinga i `dynamic()` uvoza | mjesta označena `// [V2] kandidat za dynamic()` | TBT, veličina JS bundlea | izostavljeno |
| P4 | Biblioteka za grafike u glavnom bundleu — `recharts` se statički uvozi na ekranu rezultata | `components/grafici/`, `app/(app)/procjene/[id]/rezultati/page.tsx` | TBT, veličina JS bundlea | izostavljeno |
| P5 | Bez keširanja i revalidacije | `lib/podaci.ts` | TTFB | izostavljeno |
| P6 | Bez virtualizacije dugih lista — svih 227 pitanja dijela C renderuje se odjednom | `components/upitnik/ListaPitanja.tsx` | TBT, CLS, vrijeme renderovanja | izostavljeno |
| P7 | Slike u `public/` nisu optimizovane | `public/` | LCP, prenešeni bajt | izostavljeno |
| P8 | Izvoz u Excel i PDF generiše se pri svakom zahtjevu, bez keširanja zaključenih procjena | `app/(app)/procjene/[id]/rezultati/excel`, `.../pdf` | vrijeme odgovora (S6) | izostavljeno |

## Sigurnost

| # | Izostavljeno | Mjesto izmjene u V2 | Ciljana metrika | Status |
|---|---|---|---|---|
| S1 | Bez sigurnosnih headera (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | `next.config.js` → `headers()` | sigurnosni skor, ZAP pasivna pravila | izostavljeno |
| S2 | `X-Powered-By` zaglavlje se ne uklanja | `next.config.js` → `poweredByHeader: false` | otkrivanje informacija | izostavljeno |
| S3 | Kolačići se ne podešavaju eksplicitno (`Secure`, `SameSite`) — oslanjanje na NextAuth podrazumijevane vrijednosti | `auth.config.ts` → `cookies` | ZAP nalaz o kolačićima | izostavljeno |
| S4 | Bez rate limitinga | `middleware.ts` | otpornost na automatizovane zahtjeve | izostavljeno |

## Procesno

| # | Izostavljeno | Obrazloženje |
|---|---|---|
| X1 | Bez CI provjera (linter u pipelineu, skeniranje, alat za analizu) | V1 mora nastati bez njih — to je uslov kontrolne grupe |

---

## Šta NIJE izostavljeno

Ove prakse su primijenjene i u baseline verziji, jer nisu predmet mjerenja:

- **Lozinke se hešuju** (bcrypt, 10 rundi). Nije mjerljivo spolja.
- **Validacija ulaza kroz Zod** na server akcijama.
- **Provjera ovlašćenja** u `lib/ovlascenja.ts` na svakoj zaštićenoj ruti.
- **Prisma klijent keširan u globalnoj promjenljivoj** — bez toga besplatni
  Atlas M0 klaster udari u limit konekcija, pa mjerenje ne bi bilo moguće.
- **`metadata.robots = { index: false, follow: false }`** — staging okruženje
  se ne smije indeksirati.

---

## Poznate tranzitivne ranjivosti zavisnosti

Nijedna biblioteka nije izabrana zbog poznatog CVE-a. Sljedeće prijave dolaze
iz **tranzitivnih zavisnosti build alata** i ne mogu se ukloniti bez izlaska iz
verzija koje specifikacija propisuje (Next.js 15, ExcelJS 4, Prisma 6):

| Paket | Preko | Prijava | Zašto ostaje |
|---|---|---|---|
| `postcss` | `next` | GHSA-qx2v-qp2m-jg93 i dr. | Popravka traži Next.js 16 (breaking) |
| `uuid` | `exceljs` | GHSA-w5hq-g745-h8pq | Popravka traži ExcelJS 3 (breaking) |
| `deepmerge-ts` | `prisma` → `@prisma/config` | GHSA-ggr8-5vv4-36mx | Build-time alat, nije u runtime bundleu |

Sve tri su build-time, ne izvršavaju se u serverskom runtimeu aplikacije.
Bilježe se ovdje radi potpunosti — ako ih alat za analizu prijavi, nalaz je
tačan, ali nije posljedica namjerne odluke o baseline stanju.

---

## Fontovi u PDF izvozu

`lib/fontovi/Inter-Regular.ttf` i `Inter-Bold.ttf` — font Inter (Rasmus
Andersson), licenca SIL Open Font License 1.1. Ugrađeni PDF fontovi nemaju
slova č, ć i đ, pa se Inter registruje u `@react-pdf/renderer`.

---

## V2 — preporuke alata nad V1 i šta je primijenjeno

Izvor: izvještaj alata, skeniranje #9 (autentifikovani režim, 01.11.2026,
https://it-rizici.vercel.app/, oznaka `v1-baseline`). Rezultat V1:
KI = 82,88 · P = 97,00 · S = 68,75.

| # | Preporuka alata | U | N | Izmjena u V2 | Status |
|---|---|---|---|---|---|
| 1 | Dodati Content-Security-Policy | 3,33 | 1 | `next.config.js` | primijenjeno, ali sa `'unsafe-inline'` → alat ga ocjenjuje kao „slabo“ (vidi ispod) |
| 2 | Dodati X-Frame-Options / frame-ancestors | 2,08 | 1 | `next.config.js` (oba) | primijenjeno |
| 3 | Dodati X-Content-Type-Options: nosniff | 1,67 | 1 | `next.config.js` | primijenjeno |
| 4 | Dodati Referrer-Policy | 1,67 | 1 | `next.config.js` | primijenjeno |
| 5 | Dodati Permissions-Policy | 1,25 | 1 | `next.config.js` | primijenjeno |
| 6 | ZAP: Cross-Domain Misconfiguration (`Access-Control-Allow-Origin: *`) | 2,08 | 2 | `next.config.js` — zaglavlje suženo na sopstveni domen | primijenjeno |
| 7 | ZAP: Absence of Anti-CSRF Tokens | 2,08 | 2 | `lib/csrf.ts`, `components/CsrfPolje.tsx`, svih pet formi i njihove akcije | primijenjeno |
| 8 | ZAP: Big Redirect Detected | 0,83 | 2 | `next.config.js` → `redirects()` umjesto `redirect()` u `app/page.tsx` | primijenjeno |
| 9 | ZAP: Retrieved from Cache | 0,21 | 2 | — | nije primijenjeno: informativni nalaz o CDN kešu statičkih resursa; uklanjanje bi pogoršalo performanse |
| 10 | ZAP: Modern Web Application | 0,21 | 2 | — | nije primjenjivo: informativni nalaz („aplikacija koristi JavaScript“), nema šta da se otkloni |
| 11 | ZAP: Session Management Response Identified | 0,21 | 2 | — | nije primjenjivo: informativni nalaz (prepoznat kolačić sesije), ne opisuje slabost |
| 12 | Odložiti učitavanje resursa koji blokiraju prikaz | 0,00 | 2 | `app/layout.tsx` + `next/font`, uklonjen `@import` iz `globals.css` (P1) | primijenjeno |

**Nije dirano jer alat to nije preporučio:** keširanje podataka (P5),
virtualizacija (P6), dinamički uvoz grafika (P3/P4), `next/image` (P2 —
komponenta se nigdje ne koristi), HSTS (postavlja Vercel), `poweredByHeader`,
kolačići (NextAuth podrazumijevano postavlja HttpOnly, Secure, SameSite),
rate limiting (S4).

**CSP i 'unsafe-inline'.** Next.js App Router umeće RSC podatke kao inline
skripte, a komponente koriste `style` atribute. Bez `'unsafe-inline'` aplikacija
ne radi. Nonce bi riješio skripte, ali prisiljava dinamičko renderovanje svih
strana (lošiji TTFB) i ne pokriva `style` atribute. Posljedica: alat zaglavlje
ocjenjuje kao „slabo“ (4 umjesto 8 kaznenih bodova), a ZAP može prijaviti
pravilo 10055 (CSP: unsafe-inline), koje model trenutno ne isključuje kao
duplikat sopstvene provjere CSP-a.

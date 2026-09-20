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
| P4 | Biblioteka za grafike u glavnom bundleu | `components/grafici/` | TBT, veličina JS bundlea | čeka M5 |
| P5 | Bez keširanja i revalidacije | `lib/podaci.ts` | TTFB | izostavljeno |
| P6 | Bez virtualizacije dugih lista — svih 227 pitanja dijela C renderuje se odjednom | `components/upitnik/ListaPitanja.tsx` | TBT, CLS, vrijeme renderovanja | izostavljeno |
| P7 | Slike u `public/` nisu optimizovane | `public/` | LCP, prenešeni bajt | izostavljeno |

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

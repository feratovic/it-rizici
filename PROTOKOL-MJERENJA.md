# Protokol mjerenja

Na svakoj mjernoj tački bilježe se commit hash, URL deploya i datum. Bez toga
se trend kroz razvojni ciklus ne može rekonstruisati.

| Tačka | Datum | Commit hash | URL deploya |
|---|---|---|---|
| M1 | | | |
| M2 | | | |
| M3 | | | |
| M4 | | | |
| M5 (`v1-baseline`) | | | |
| V2 (`v2-optimizovano`) | | | |

Postupak na svakoj tački:

```bash
npm run build          # mora proći bez grešaka TypeScripta
git add -A
git commit -m "M<n>: <opis>"
git tag m<n>
git push && git push --tags
```

Zatim deploy na Vercel i upis hasha, URL-a i datuma u tabelu iznad.

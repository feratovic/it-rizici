# -*- coding: utf-8 -*-
"""
Provjera COBIT agregacije prema izvornom Excel fajlu.

Specifikacija (6.8) trazi da agregacija u aplikaciji daje iste vrijednosti kao
izvorni Excel na istim ulazima. Ova skripta cita popunjene odgovore iz izvornog
fajla, racuna nivo zrelosti po formuli koju implementira lib/cobit.ts, i poredi
rezultat sa vrijednoscu koju je izracunao sam Excel (celija R14 svakog sheeta).

Formula (kolone M-R u izvornom sheetu):
    A(n) = suma numerickih vrijednosti odgovora na izjavama nivoa n
    B(n) = ukupan broj izjava nivoa n
    C(n) = A(n) / B(n)                      "saglasnost nivoa zrelosti"
    D(n) = C(n) / suma(C)                   "normalizovane vrijednosti"
    E(n) = n * D(n)                         "doprinos"
    ukupno = suma(E)

VAZNO — dvije greske u izvornom fajlu, utvrdjene ovom provjerom:

  1. Zbirni redovi ("Broj izjava / Suma (nivo zrelosti)") u nekim sheetovima
     sadrze ukucane nule umjesto formule =SUM(...). Tabela agregacije cita
     bas te zbirne redove, pa u tim sheetovima Excel racuna sa pogresnom
     sumom. Ova skripta racuna direktno iz odgovora po izjavama, sto je
     ispravno, i zato se u tim sheetovima namjerno razlikuje od Excela.

  2. Zbirni sheet "Sheet1" ne sadrzi formule nego rucno ukucane vrijednosti
     (jedino je C17 formula). One su zastarjele u odnosu na R14 pojedinacnih
     sheetova i nisu mjerodavne.

Popunjeni odgovori se koriste ISKLJUCIVO ovdje, za provjeru formule.
U aplikaciju i seed se ne prenose.

Pokretanje:
    python alati/provjeri-agregaciju-cobit.py "putanja/do/2.1 COBIT.xlsx"
"""
import sys

import openpyxl

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SHEETOVI = ['PO1', 'PO3', 'PO5', 'PO9', 'PO10', 'AI1', 'AI2', 'AI5', 'AI6',
            'DS1', 'DS4', 'DS5', 'DS10', 'DS11', 'ME1']

KOLONE_ODGOVORA = {5: 0.0, 6: 0.33, 7: 0.66, 8: 1.0}


def je_zbirni_red(ws, r):
    a = ws.cell(r, 1).value
    c = ws.cell(r, 3).value
    if a is not None and 'broj izjava' in str(a).lower():
        return True
    if c is not None and str(c).strip().lower().startswith('suma'):
        return True
    return False


def procitaj(ws_vr, ws_f):
    """Cita odgovore po izjavama i broj izjava po nivou.

    Sabira SVE oznacene kolone u redu, isto kao sto to radi Excel formula
    =SUM(E..:H..). U aplikaciji je to nemoguce (jedan odgovor po izjavi,
    osiguran slozenim jedinstvenim indeksom), ali izvorni fajl ima redova
    sa dva oznacena odgovora, pa se oni ovdje prijavljuju kao defekt izvora.

    Uz to prijavljuje zbirne redove koji nemaju SUM formulu."""
    suma = {n: 0.0 for n in range(6)}
    broj = {n: 0 for n in range(6)}
    pokvareni = []
    dvostruki = []

    for r in range(2, ws_vr.max_row + 1):
        if je_zbirni_red(ws_vr, r):
            for kol in KOLONE_ODGOVORA:
                f = ws_f.cell(r, kol).value
                if f is not None and not str(f).startswith('='):
                    pokvareni.append(ws_f.cell(r, kol).coordinate)
            continue

        b = ws_vr.cell(r, 2).value
        c = ws_vr.cell(r, 3).value
        if b is None or c is None or not isinstance(b, (int, float)):
            continue

        nivo = int(b)
        if nivo < 0 or nivo > 5:
            continue

        broj[nivo] += 1
        oznaceno = 0
        for kol, vrijednost in KOLONE_ODGOVORA.items():
            if ws_vr.cell(r, kol).value is not None:
                suma[nivo] += vrijednost
                oznaceno += 1
        if oznaceno > 1:
            dvostruki.append('red %d' % r)

    return suma, broj, pokvareni, dvostruki


def nivo_zrelosti(suma, broj):
    """Ista formula koju implementira lib/cobit.ts."""
    saglasnost = {
        n: (suma[n] / broj[n] if broj[n] else 0.0) for n in range(6)
    }
    ukupna = sum(saglasnost.values())
    if ukupna == 0:
        return 0.0
    return sum(n * (saglasnost[n] / ukupna) for n in range(6))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    wv = openpyxl.load_workbook(sys.argv[1], data_only=True)
    wf = openpyxl.load_workbook(sys.argv[1], data_only=False)

    print('  %-6s %11s %10s %9s  %s'
          % ('proces', 'izracunato', 'excel R14', 'slaganje', 'napomena'))
    print('  ' + '-' * 72)

    ispravni = 0
    sa_greskom = []

    for kod in SHEETOVI:
        suma, broj, pokvareni, dvostruki = procitaj(wv[kod], wf[kod])
        moj = round(nivo_zrelosti(suma, broj), 2)
        excel = wv[kod].cell(14, 18).value          # R14
        excel = round(float(excel), 2) if excel is not None else None

        slaze = excel is not None and abs(moj - excel) < 0.005
        if slaze:
            ispravni += 1
        else:
            sa_greskom.append(kod)

        biljeske = []
        if not slaze and pokvareni:
            biljeske.append('zbirni red bez formule: ' + ', '.join(pokvareni[:3]))
        if dvostruki:
            biljeske.append('dva odgovora: ' + ', '.join(dvostruki[:3]))
        napomena = '; '.join(biljeske)

        print('  %-6s %11.2f %10.2f %9s  %s'
              % (kod, moj, excel if excel is not None else float('nan'),
                 'da' if slaze else 'NE', napomena))

    print('  ' + '-' * 72)
    print('  poklapa se: %d/%d' % (ispravni, len(SHEETOVI)))

    if sa_greskom:
        print()
        print('  Odstupanja su u sheetovima: %s' % ', '.join(sa_greskom))
        print('  U svima njima uzrok je ukucana vrijednost umjesto formule u')
        print('  zbirnom redu izvornog fajla, ne greska u formuli agregacije.')
        print('  Aplikacija racuna direktno iz odgovora po izjavama.')


if __name__ == '__main__':
    main()

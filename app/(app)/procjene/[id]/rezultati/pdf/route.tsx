/**
 * Izvoz izvještaja u PDF (UC-A7, scenario S6).
 *
 * PDF se renderuje na serveru bibliotekom @react-pdf/renderer pri svakom
 * zahtjevu. Pojedinačni odgovori nisu dio PDF-a — nalaze se u Excel izvozu;
 * PDF je sažet izvještaj o rezultatima.
 *
 * [V2] kandidat za keširanje zaključenih procjena (one se više ne mijenjaju).
 */
import path from 'node:path';

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

import { DOMENI, NAZIV_DOMENA } from '@/lib/cobit';
import { broj2, nazivFajla, provjeriPristupIzvozu, zaglavljaPreuzimanja } from '@/lib/izvoz';
import type { Izvjestaj } from '@/lib/podaci';
import {
  COBIT_NAZIV_NIVOA,
  bojaNivoaZrelosti,
  bojaOcjene1do4,
  nazivOcjeneSekcije,
  prosjek,
} from '@/lib/skale';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ugrađeni PDF fontovi (Helvetica) nemaju slova č, ć i đ. Putanja je
// `path.join(process.cwd(), …)` da bi je praćenje fajlova pri buildu uključilo.
Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(process.cwd(), 'lib/fontovi/Inter-Regular.ttf'), fontWeight: 400 },
    { src: path.join(process.cwd(), 'lib/fontovi/Inter-Bold.ttf'), fontWeight: 700 },
  ],
});
// Bez rastavljanja riječi na slogove — pravila su za engleski jezik.
Font.registerHyphenationCallback((rijec) => [rijec]);

const s = StyleSheet.create({
  strana: { fontFamily: 'Inter', fontSize: 9, padding: 36, color: '#111827' },
  naslov: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  podnaslov: { fontSize: 10, color: '#6b7280', marginBottom: 16 },
  sekcija: { fontSize: 11, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  podaci: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  podatak: { width: '50%', marginBottom: 4 },
  oznaka: { color: '#6b7280' },
  kartice: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kartica: { flex: 1, border: '1pt solid #e5e7eb', borderRadius: 4, padding: 8 },
  velikiBroj: { fontSize: 20, fontWeight: 700 },
  red: { flexDirection: 'row', borderBottom: '0.5pt solid #e5e7eb', paddingVertical: 3 },
  zaglavlje: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 3, fontWeight: 700 },
  kolKod: { width: 50, paddingHorizontal: 4 },
  kolNaziv: { flex: 1, paddingHorizontal: 4 },
  kolTraka: { width: 90, paddingHorizontal: 4, justifyContent: 'center' },
  kolBroj: { width: 44, paddingHorizontal: 4, textAlign: 'right' },
  traka: { height: 5, backgroundColor: '#e5e7eb', borderRadius: 2 },
  napomena: { fontSize: 8, color: '#6b7280', marginTop: 4 },
  podnozje: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 7, color: '#9ca3af', flexDirection: 'row', justifyContent: 'space-between' },
  obrazlozenje: { marginLeft: 54, marginBottom: 4, fontSize: 8, color: '#374151' },
});

function Traka({ udio, boja }: { udio: number | null; boja: string }) {
  return (
    <View style={s.traka}>
      {udio !== null && (
        <View style={{ height: 5, width: `${Math.max(0, Math.min(1, udio)) * 100}%`, backgroundColor: boja, borderRadius: 2 }} />
      )}
    </View>
  );
}

function RedOcjene({
  kod,
  naziv,
  vrijednost,
  maksimum,
  boja,
  uvuceno = false,
  podebljano = false,
}: {
  kod: string;
  naziv: string;
  vrijednost: number | null;
  maksimum: number;
  boja: string;
  uvuceno?: boolean;
  podebljano?: boolean;
}) {
  return (
    <View style={s.red} wrap={false}>
      <Text style={[s.kolKod, uvuceno ? { paddingLeft: 12 } : {}, podebljano ? { fontWeight: 700 } : {}]}>{kod}</Text>
      <Text style={[s.kolNaziv, podebljano ? { fontWeight: 700 } : {}]}>{naziv}</Text>
      <View style={s.kolTraka}>
        <Traka udio={vrijednost === null ? null : vrijednost / maksimum} boja={boja} />
      </View>
      <Text style={[s.kolBroj, { color: boja, fontWeight: 700 }]}>{broj2(vrijednost)}</Text>
    </View>
  );
}

function Zaglavlje({ prva, ocjena }: { prva: string; ocjena: string }) {
  return (
    <View style={s.zaglavlje}>
      <Text style={s.kolKod}>{prva}</Text>
      <Text style={s.kolNaziv}>Naziv</Text>
      <Text style={s.kolTraka}> </Text>
      <Text style={s.kolBroj}>{ocjena}</Text>
    </View>
  );
}

function SadrzajCobit({ izvjestaj }: { izvjestaj: Izvjestaj }) {
  const { rezultat } = izvjestaj.cobit!;
  const boja = bojaNivoaZrelosti(rezultat.prosjek).hex;

  return (
    <>
      <View style={s.kartice}>
        <View style={s.kartica}>
          <Text style={s.oznaka}>Prosječan nivo zrelosti</Text>
          <Text style={[s.velikiBroj, { color: boja }]}>{broj2(rezultat.prosjek)} <Text style={{ fontSize: 9, color: '#6b7280' }}>od 5.00</Text></Text>
          <Text>{rezultat.prosjek === null ? 'Nema odgovora.' : COBIT_NAZIV_NIVOA[Math.round(rezultat.prosjek)]}</Text>
        </View>
        <View style={s.kartica}>
          <Text style={s.oznaka}>Odgovoreno izjava</Text>
          <Text style={s.velikiBroj}>{rezultat.odgovoreno} / {rezultat.ukupno}</Text>
          <Text>Popunjenih procesa: {rezultat.popunjenihProcesa} / {rezultat.procesi.length}</Text>
        </View>
      </View>

      <Text style={s.sekcija}>Prosjek po domenima</Text>
      <Zaglavlje prva="Domen" ocjena="Nivo" />
      {DOMENI.map((d) => {
        const nivo = prosjek(
          rezultat.procesi.filter((p) => p.domen === d).map((p) => p.nivo).filter((n): n is number => n !== null),
        );
        return <RedOcjene key={d} kod={d} naziv={NAZIV_DOMENA[d]} vrijednost={nivo} maksimum={5} boja={bojaNivoaZrelosti(nivo).hex} />;
      })}

      <Text style={s.sekcija}>Nivo zrelosti po procesima</Text>
      <Zaglavlje prva="Proces" ocjena="Nivo" />
      {rezultat.procesi.map((p) => (
        <RedOcjene key={p.kod} kod={p.kod} naziv={`${p.naziv} (${p.odgovoreno}/${p.ukupno})`} vrijednost={p.nivo} maksimum={5} boja={bojaNivoaZrelosti(p.nivo).hex} />
      ))}
      <Text style={s.napomena}>
        Skala 0–5, veća vrijednost znači veću zrelost. Proces bez odgovora nema ocjenu i ne ulazi u prosjek.
      </Text>
    </>
  );
}

function SadrzajUpitnik({ izvjestaj }: { izvjestaj: Izvjestaj }) {
  const { rezultat, sekcije } = izvjestaj.upitnik!;
  const obrazlozenja = new Map(sekcije.map((x) => [x.kod, x]));
  const bojaZa = (o: number | null) => bojaOcjene1do4(o === null ? null : Math.round(o)).hex;

  return (
    <>
      <View style={s.kartice}>
        <View style={s.kartica}>
          <Text style={s.oznaka}>Ukupna ocjena IT rizika (dio B)</Text>
          <Text style={[s.velikiBroj, { color: bojaZa(rezultat.dioB.ukupno) }]}>{broj2(rezultat.dioB.ukupno)} <Text style={{ fontSize: 9, color: '#6b7280' }}>od 4.00</Text></Text>
          <Text>{rezultat.dioB.ukupno === null ? 'Nije ocijenjeno.' : nazivOcjeneSekcije('B', Math.round(rezultat.dioB.ukupno))}</Text>
        </View>
        <View style={s.kartica}>
          <Text style={s.oznaka}>Ukupna zrelost IT kontrola (dio C)</Text>
          <Text style={[s.velikiBroj, { color: bojaZa(rezultat.dioC.ukupno) }]}>{broj2(rezultat.dioC.ukupno)} <Text style={{ fontSize: 9, color: '#6b7280' }}>od 4.00</Text></Text>
          <Text>{rezultat.dioC.ukupno === null ? 'Nije ocijenjeno.' : nazivOcjeneSekcije('C', Math.round(rezultat.dioC.ukupno))}</Text>
        </View>
      </View>
      <Text style={s.napomena}>
        Odgovoreno {rezultat.odgovoreno} od {rezultat.ukupnoPitanja} pitanja · ocijenjeno {rezultat.ocijenjeno} od {rezultat.ukupnoOcjena} sekcija.
      </Text>

      <Text style={s.sekcija}>Indikatori IT rizika po kategorijama (dio B)</Text>
      <Zaglavlje prva="Oznaka" ocjena="Ocjena" />
      {rezultat.dioB.kategorije.map((k) => (
        <RedOcjene key={k.kod} kod={k.kod} naziv={k.naziv} vrijednost={k.ocjena} maksimum={4} boja={bojaZa(k.ocjena)} />
      ))}
      <Text style={s.napomena}>Skala 1–4, veća vrijednost znači veći rizik.</Text>

      <Text style={s.sekcija} break>Zrelost IT kontrola po oblastima (dio C)</Text>
      <Zaglavlje prva="Oznaka" ocjena="Ocjena" />
      {rezultat.dioC.oblasti.map((o) => (
        <View key={o.kod}>
          <RedOcjene kod={o.kod} naziv={o.naziv} vrijednost={o.ocjena} maksimum={4} boja={bojaZa(o.ocjena)} podebljano />
          {(o.podoblasti.length > 0 ? o.podoblasti : []).map((p) => {
            const ob = obrazlozenja.get(p.kod);
            return (
              <View key={p.kod}>
                <RedOcjene kod={p.kod} naziv={p.naziv} vrijednost={p.ocjena} maksimum={4} boja={bojaZa(p.ocjena)} uvuceno />
                {ob?.prednosti && <Text style={s.obrazlozenje}>Prednosti: {ob.prednosti}</Text>}
                {ob?.slabosti && <Text style={s.obrazlozenje}>Slabosti: {ob.slabosti}</Text>}
              </View>
            );
          })}
          {o.podoblasti.length === 0 && obrazlozenja.get(o.kod)?.prednosti && (
            <Text style={s.obrazlozenje}>Prednosti: {obrazlozenja.get(o.kod)!.prednosti}</Text>
          )}
          {o.podoblasti.length === 0 && obrazlozenja.get(o.kod)?.slabosti && (
            <Text style={s.obrazlozenje}>Slabosti: {obrazlozenja.get(o.kod)!.slabosti}</Text>
          )}
        </View>
      ))}
      <Text style={s.napomena}>
        Skala 1–4, veća vrijednost znači slabije kontrole. Ocjena oblasti je prosjek njenih podoblasti;
        ukupna ocjena je prosjek već zaokruženih ocjena oblasti.
      </Text>
    </>
  );
}

function DokumentIzvjestaja({ izvjestaj }: { izvjestaj: Izvjestaj }) {
  const { procjena } = izvjestaj;
  const tip = procjena.tip === 'COBIT' ? 'COBIT samoprocjena' : 'IT upitnik';

  return (
    <Document title={`${tip} — ${procjena.institucija.naziv} ${procjena.godina}`} language="sr-ME">
      <Page size="A4" style={s.strana}>
        <Text style={s.naslov}>Izvještaj o samoprocjeni</Text>
        <Text style={s.podnaslov}>{tip} · {procjena.institucija.naziv} · {procjena.godina}</Text>

        <View style={s.podaci}>
          <View style={s.podatak}><Text style={s.oznaka}>Institucija</Text><Text>{procjena.institucija.naziv}</Text></View>
          <View style={s.podatak}><Text style={s.oznaka}>Kontakt osoba</Text><Text>{procjena.institucija.kontaktOsoba}</Text></View>
          <View style={s.podatak}><Text style={s.oznaka}>Status</Text><Text>{procjena.status === 'ZAKLJUCENA' ? `Zaključena ${procjena.zakljucenoDana?.toLocaleDateString('sr-ME') ?? ''}` : 'U toku — rezultati su privremeni'}</Text></View>
          <View style={s.podatak}><Text style={s.oznaka}>Kreirao</Text><Text>{procjena.kreirao.ime}, {procjena.kreiranoDana.toLocaleDateString('sr-ME')}</Text></View>
        </View>

        {izvjestaj.cobit && <SadrzajCobit izvjestaj={izvjestaj} />}
        {izvjestaj.upitnik && <SadrzajUpitnik izvjestaj={izvjestaj} />}

        <View style={s.podnozje} fixed>
          <Text>Izvezeno {new Date().toLocaleString('sr-ME')}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function GET(
  _zahtjev: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pristup = await provjeriPristupIzvozu(id);
  if (!pristup.ok) return pristup.odgovor;

  const sadrzaj = await renderToBuffer(<DokumentIzvjestaja izvjestaj={pristup.izvjestaj} />);

  return new Response(new Uint8Array(sadrzaj), {
    headers: zaglavljaPreuzimanja(nazivFajla(pristup.izvjestaj, 'pdf'), 'application/pdf'),
  });
}

/**
 * Dagitim sonrasi tarayici duman testi.
 *
 * Sunucunun 200 donmesi sayfanin CALISTIGI anlamina gelmiyor. Gecen hafta
 * yasananlar tam olarak bu bosluktan gecti:
 *
 *   - Videolar siyah kare goruntulendi: CSP `media-src` CDN'i icermiyordu.
 *     API 200 donuyordu, sayfa aciliyordu, HTML dogruydu — yalnizca tarayici
 *     medyayi engelliyordu. Sunucu tarafli hicbir kontrol bunu goremezdi.
 *
 *   - Google Fonts stylesheet'i bloklandi: yine CSP, yine yalnizca tarayicida
 *     gorulebilir.
 *
 * Bu script gercek bir tarayici acip sayfayi yukluyor ve CSP ihlallerini,
 * konsol hatalarini ve basarisiz istekleri topluyor.
 *
 * Kullanim: node scripts/tarayici-duman-testi.mjs <adres>
 */
import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('Kullanim: node scripts/tarayici-duman-testi.mjs <adres>');
  process.exit(1);
}

// Uygulamayla ilgisi olmayan gurultuyu ele. Liste canliya karsi calistirilarak
// ayarlandi — her madde gercekten gorulmus bir yanlis pozitif.
const YOKSAY = [
  /favicon/i,
  /ERR_BLOCKED_BY_CLIENT/i,
  /chrome-extension:/i,
  /Download the React DevTools/i,

  // Bassiz tarayicida konum izni/donanimi yok; uygulama hatasi degil.
  /GeolocationPositionError/i,

  // ERR_ABORTED istemcinin kendi iptali — <video> elemanlarinin standart
  // davranisi (metadata alinip yukleme kesiliyor). Sunucu hatasi ile
  // karistirilmamali; gercek sorunlar ERR_CONNECTION_*, ERR_NAME_NOT_RESOLVED
  // ya da CSP engellemesi olarak gorunur.
  /ERR_ABORTED/i,
];

const gurultu = (metin) => YOKSAY.some((k) => k.test(metin));

const cspIhlalleri = [];
const konsolHatalari = [];
const basarisizIstekler = [];
const hataliYanitlar = [];

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage();

// CSP ihlalleri konsola da dusuyor ama olay dinleyicisi daha guvenilir:
// engellenen kaynagin adresini ve hangi direktifin engelledigini veriyor.
await sayfa.addInitScript(() => {
  window.__cspIhlalleri = [];
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__cspIhlalleri.push({
      direktif: e.effectiveDirective,
      engellenen: e.blockedURI,
    });
  });
});

sayfa.on('console', (m) => {
  if (m.type() === 'error' && !gurultu(m.text())) konsolHatalari.push(m.text());
});

sayfa.on('requestfailed', (r) => {
  const metin = `${r.url()} — ${r.failure()?.errorText ?? 'bilinmiyor'}`;
  if (!gurultu(metin)) basarisizIstekler.push(metin);
});

// 4xx/5xx yanitlar: istek "basarili" sayilir (baglanti kuruldu) ama icerik
// gelmez. Kirik gorsel ve cokmus API cagrilari buradan yakalanir.
sayfa.on('response', (r) => {
  if (r.status() >= 400 && !gurultu(r.url())) {
    hataliYanitlar.push(`HTTP ${r.status()}  ${r.url()}`);
  }
});

console.log(`Aciliyor: ${url}\n`);

let gecti = 0;
let kaldi = 0;
const sonuc = (ok, ad, detay = '') => {
  if (ok) { gecti++; console.log(`  ✓ ${ad}${detay ? '  ' + detay : ''}`); }
  else { kaldi++; console.log(`  ✗ ${ad}${detay ? '  ' + detay : ''}`); }
};

try {
  const yanit = await sayfa.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  sonuc(yanit?.ok() === true, 'Sayfa yuklendi', `HTTP ${yanit?.status()}`);

  // Uygulama gercekten mount oldu mu? Bos bir <div id="root"> de 200 doner.
  const icerik = await sayfa.evaluate(
    () => document.getElementById('root')?.innerHTML.length ?? 0,
  );
  sonuc(icerik > 200, 'Uygulama render edildi', `${icerik} karakter`);

  cspIhlalleri.push(...(await sayfa.evaluate(() => window.__cspIhlalleri ?? [])));

  sonuc(
    cspIhlalleri.length === 0,
    'CSP ihlali yok',
    cspIhlalleri.length ? `${cspIhlalleri.length} adet` : '',
  );
  for (const i of cspIhlalleri.slice(0, 5)) {
    console.log(`      ${i.direktif} engelledi: ${i.engellenen}`);
  }

  sonuc(
    konsolHatalari.length === 0,
    'Konsol hatasi yok',
    konsolHatalari.length ? `${konsolHatalari.length} adet` : '',
  );
  for (const h of konsolHatalari.slice(0, 5)) {
    console.log(`      ${h.slice(0, 140)}`);
  }

  sonuc(
    basarisizIstekler.length === 0,
    'Basarisiz istek yok',
    basarisizIstekler.length ? `${basarisizIstekler.length} adet` : '',
  );
  for (const i of basarisizIstekler.slice(0, 5)) {
    console.log(`      ${i.slice(0, 140)}`);
  }

  sonuc(
    hataliYanitlar.length === 0,
    'HTTP hata yaniti yok',
    hataliYanitlar.length ? `${hataliYanitlar.length} adet` : '',
  );
  for (const y of hataliYanitlar.slice(0, 5)) {
    console.log(`      ${y.slice(0, 140)}`);
  }
} finally {
  await tarayici.close();
}

console.log(`\ngecti: ${gecti}   kaldi: ${kaldi}`);
process.exit(kaldi === 0 ? 0 : 1);

/**
 * Derleme ciktisindaki staticwebapp.config.json'i hedef ortama gore ayarlar.
 *
 * Neden gerekli: CSP `connect-src` yalnizca canli API'ye izin veriyor. Test
 * ortami farkli bir kokenden servis edildigi icin, ayni yapilandirmayla
 * derlenen test surumunde her API cagrisi tarayici tarafindan engellenirdi —
 * ve bu, gecen hafta videolarda yasadigimiz hatanin birebir aynisi olurdu.
 *
 * Kaynak dosyaya DOKUNULMAZ: yalnizca dist/ altindaki kopya degistirilir.
 * Boylece depodaki yapilandirma canli icin dogru kalir ve dev sunucusunun
 * okudugu tek kaynak bozulmaz.
 *
 * Kullanim: node scripts/ortam-yapilandir.mjs <api-kokeni>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const apiOrigin = process.argv[2];
if (!apiOrigin) {
  console.error('Kullanim: node scripts/ortam-yapilandir.mjs <api-kokeni>');
  process.exit(1);
}

const path = 'dist/staticwebapp.config.json';
const config = JSON.parse(readFileSync(path, 'utf8'));
const headers = config.globalHeaders ?? {};
const csp = headers['Content-Security-Policy'];

if (!csp) {
  console.error(`${path} icinde Content-Security-Policy yok.`);
  process.exit(1);
}

/** Bir direktife kaynak ekler; zaten varsa dokunmaz. */
const ekle = (csp, direktif, kaynak) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) =>
      d.split(/\s+/)[0] === direktif && !d.includes(kaynak) ? `${d} ${kaynak}` : d,
    )
    .join('; ');

headers['Content-Security-Policy'] = ekle(csp, 'connect-src', apiOrigin);

// Test ortami arama motorlarina dusmemeli: kendi icerigimizle rekabet eder
// ve kullanicilar yanlislikla test surumune yonlenir.
headers['X-Robots-Tag'] = 'noindex, nofollow';

config.globalHeaders = headers;
writeFileSync(path, JSON.stringify(config, null, 2) + '\n');

console.log(`✓ ${path} guncellendi`);
console.log(`  connect-src   += ${apiOrigin}`);
console.log(`  X-Robots-Tag   = noindex, nofollow`);

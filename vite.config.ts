import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Dev sunucusuna canlidaki CSP'nin aynisini konusturur.
 *
 * Tek kaynak `public/staticwebapp.config.json` — Azure'a fiilen giden dosya o.
 * Burada onu okuyup sadece dev'e ozgu kaynaklari ekliyoruz; boylece prod CSP'si
 * degistiginde dev otomatik takip eder, ikisi birbirinden kayamaz.
 *
 * Amac: bir CSP ihlalinin canliya cikmadan once dev konsolunda gorunmesi.
 * (Google Fonts stylesheet'inin bloklanmasi tam olarak boyle kacmisti.)
 *
 * Not: bu dosya ya da staticwebapp.config.json degistiginde dev sunucusu
 * yeniden baslatilmali. Ayrica tarayici index.html'i cache'lerse eski CSP
 * gecerli kalir — test ederken hard reload gerekiyor.
 */
function devCsp(apiOrigin: string, hmrOrigin: string): string {
  const cfgPath = fileURLToPath(new URL('./public/staticwebapp.config.json', import.meta.url))
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'))
  const prodCsp: string = cfg.globalHeaders['Content-Security-Policy']

  // Dev'de ek olarak gerekenler — prod'a ASLA sizmaz, sadece dev server header'i.
  const devExtras: Record<string, string[]> = {
    // Vite HMR websocket'i + lokal API (farkli origin oldugu icin 'self' yetmiyor)
    'connect-src': [hmrOrigin, apiOrigin],
    // Vite dev client'i eval kullaniyor
    'script-src': ["'unsafe-eval'"]
  }

  return prodCsp
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean)
    .map((directive) => {
      const name = directive.split(/\s+/)[0]
      const extras = devExtras[name]
      return extras ? `${directive} ${extras.join(' ')}` : directive
    })
    .join('; ')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = new URL(env.VITE_API_BASE_URL || 'http://localhost:5124/api').origin
  const port = 5173

  return {
    plugins: [react()],
    build: {
      sourcemap: false
    },
    server: {
      port,
      headers: {
        'Content-Security-Policy': devCsp(apiOrigin, `ws://localhost:${port}`)
      }
    }
  }
})

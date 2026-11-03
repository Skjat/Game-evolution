// Service worker: offline-кэш. При изменении файлов увеличивай VERSION (и APP_VERSION в app.js).
const VERSION = 'lvlup-v25';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './achievements-db.js',
  './sound.js',
  './ai.js',
  './league.js',
  './vendor/anthropic-sdk.mjs',
  './manifest.webmanifest',
  './fonts.css',
  './fonts/Exo2-cyrillic-0.woff2',
  './fonts/Exo2-latin-1.woff2',
  './fonts/JetBrainsMono-cyrillic-2.woff2',
  './fonts/JetBrainsMono-latin-3.woff2',
  './fonts/Unbounded-cyrillic-4.woff2',
  './fonts/Unbounded-latin-5.woff2',
  './fonts/CormorantSC-cyrillic-700.woff2',
  './fonts/CormorantSC-latin-700.woff2',
  './fonts/Jura-cyrillic-600.woff2',
  './fonts/Jura-latin-600.woff2',
  './fonts/RuslanDisplay-cyrillic-400.woff2',
  './fonts/RuslanDisplay-latin-400.woff2',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Сначала сеть (чтобы обновления приходили), при отсутствии сети — кэш.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // no-cache: всегда сверяемся с сервером, а не с HTTP-кэшем браузера (GitHub Pages кэширует на 10 минут).
    (req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req, { cache: 'no-cache' }))
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});

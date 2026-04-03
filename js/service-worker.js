const CACHE_NAME = 'conecta2026-v2';
const STATIC_ASSETS = [
  'manifest.json',
  '../icons/icon-192.png',
  '../icons/icon-512.png',
  '../icons/inteia-logo.svg',
  '../icons/favicon.svg'
];

// Paginas HTML para cache offline (network-first)
const APP_PAGES = [
  '../CONECTA.html',
  '../Logistica Campanha.html',
  '../login.html',
  '../conta.html',
  '../cadastro-apoiador.html',
  '../Coordenadores Regionais.html',
  '../qrcode-cartao.html'
];

// Scripts locais para cache
const APP_SCRIPTS = [
  'supabase-config.js',
  'conecta-db.js',
  'elexion-client.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([...STATIC_ASSETS, ...APP_PAGES, ...APP_SCRIPTS])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) return;

  // Paginas HTML: network-first (mostra versao mais recente, fallback para cache)
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request).then(response => {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Assets estaticos e scripts: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});

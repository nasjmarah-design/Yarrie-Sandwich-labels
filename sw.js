const CACHE = 'yarrie-sandwich-offline-v1';
const APP = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './favicon.png', './icon-192.png', './icon-512.png'];
const PDF_LIB = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP);
    try { await cache.add(new Request(PDF_LIB, {mode:'cors'})); } catch (e) { console.warn('PDF library will be cached when first loaded online', e); }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE && key.startsWith('yarrie-sandwich-')) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin && request.url !== PDF_LIB) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()); }
      return response;
    } catch (err) {
      if (request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      throw err;
    }
  })());
});

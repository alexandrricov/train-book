const CACHE = 'idb-local-cache-v1';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null))))
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Network-first for dev assets; cache-first for listed ASSETS
  if (ASSETS.includes(new URL(request.url).pathname)) {
    e.respondWith(caches.match(request).then(resp => resp || fetch(request)));
  }
});
// Network-first shell: online always gets the latest files; offline falls back
// to whatever was last successfully fetched. No manual cache version bumps.
const CACHE = 'kairos';
const SHELL = ['./', './index.html', './app.js', './react.js', './react-dom.js',
               './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png',
               './icon-192-maskable.png', './icon-512-maskable.png',
               './favicon-16.png', './favicon-32.png', './apple-touch-icon-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});

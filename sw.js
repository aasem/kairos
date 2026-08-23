// Network-first shell: online always gets the latest files; offline falls back
// to whatever was last successfully fetched. Bump CACHE when assets change.
const CACHE = 'kairos-v6';
const SHELL = ['./', './index.html', './app.js?v=6', './react.js', './react-dom.js',
               './manifest.webmanifest?v=5', './icon.svg?v=5', './icon-dark.svg?v=5',
               './icon-192.png?v=5', './icon-512.png?v=5',
               './icon-192-maskable.png?v=5', './icon-512-maskable.png?v=5',
               './favicon-16.png?v=5', './favicon-32.png?v=5',
               './favicon-16-dark.png?v=5', './favicon-32-dark.png?v=5',
               './apple-touch-icon-180.png?v=5'];

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

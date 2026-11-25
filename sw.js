/* sovereign. — service worker: caches the app files so it opens offline.
   Your curriculum data lives in localStorage, not here.
   When you change any app file, bump CACHE so installed copies pick up the update. */
const CACHE = 'sovereign-v3-17';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'css/courses.css', 'css/ai.css', 'css/design.css', 'css/themes.css',
  'js/config.js', 'js/store.js', 'js/components.js', 'js/ai-client.js', 'js/files.js', 'js/views-work.js', 'js/views-ai.js', 'js/views-course.js', 'js/views-dash.js', 'js/app.js',
  'fonts/inter-tight-latin-700-normal.woff2', 'fonts/inter-tight-latin-800-normal.woff2', 'fonts/playfair-display-latin-400-normal.woff2', 'fonts/playfair-display-latin-400-italic.woff2',
  'fonts/instrument-serif-latin-400-normal.woff2', 'fonts/instrument-serif-latin-400-italic.woff2', 'fonts/cinzel-latin-500-normal.woff2', 'fonts/cinzel-latin-600-normal.woff2',
  'fonts/cormorant-garamond-latin-400-italic.woff2', 'fonts/cormorant-garamond-latin-500-italic.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

// Network first, so a new version shows up on the next open; the cache is the fallback that makes it work offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => { // revalidate with the server so a stale browser copy is never used
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});

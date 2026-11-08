// Fish Log service worker
// Bump CACHE_NAME on EVERY deploy (keep it in step with VERSION / CACHE_VERSION
// in fishing-tracker.html) so home-screen apps pick up the new version.
const CACHE_NAME = 'fishlog-v3.1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the app page (always the newest version when online,
// last good copy when offline). Only same-origin GET requests are handled:
// Worker calls (POST) and Supabase photo requests go straight to the network.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('fishing-tracker.html')))
  );
});
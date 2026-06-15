// Network-first service worker.
// Online  -> always serve fresh content (never stale code while you have signal).
// Offline -> fall back to the last cached copy so the app shell still opens.
const CACHE = 'vaanya-shell-v1';

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                               .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                         // never touch Supabase writes
  if (new URL(req.url).origin !== location.origin) return;  // skip CDN / Supabase API
  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () { return caches.match(req); })     // offline fallback
  );
});

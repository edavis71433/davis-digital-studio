const CACHE_NAME = 'dds-v3';
const PRECACHE = [
  '/about',
  '/services',
  '/work',
  '/contact',
  '/manifest.json',
  '/404.html'
];

// Pages that must always load fresh (have live API calls or dynamic content)
const NETWORK_FIRST = ['/audit', '/tools', '/report-card', '/speed-test', '/local-visibility', '/pricing-estimator', '/roi-calculator', '/'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/portal') || url.pathname.includes('supabase')) return;

  // Network-first for dynamic/tool pages — always fetch fresh, fall back to cache
  var isNetworkFirst = NETWORK_FIRST.some(function(p) { return url.pathname === p || url.pathname === p + '.html'; });
  if (isNetworkFirst) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Cache-first for everything else (static assets, other pages)
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var networkFetch = fetch(e.request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});

// ==============================================================================
// BallR (ProspekBola) Service Worker — Version 2
// Security & Privacy: Never caches authenticated sessions or children's personal data.
// ==============================================================================

// On localhost / dev: skip interception and unregister
if (typeof self !== 'undefined' && (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1')) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.registration.unregister())
    );
  });
}

const CACHE_VERSION = 'ballr-v2';
const STATIC_CACHE_NAME = `ballr-static-${CACHE_VERSION}`;

// Only cache immutable application shell assets
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Sensitive endpoints & patterns that MUST NEVER be stored in CacheStorage
const SENSITIVE_PATTERNS = [
  /\/auth\//i,
  /\/rest\/v1\//i,
  /\/storage\/v1\//i,
  /\/realtime\/v1\//i,
  /\/profiles/i,
  /\/players/i,
  /\/consents/i,
  /\/guardians/i,
  /\/player_assessments/i,
  /\/fitness_records/i,
  /\/access_log/i
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. NEVER cache cross-origin API calls (Supabase API, OAuth, external storage)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. NEVER cache sensitive endpoints or routes containing minor personal data
  const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isSensitive) {
    return; // Pass through directly to network, no cache interception
  }

  // 3. Navigation requests (HTML Pages): Network-First
  // Ensures security policy updates and auth redirects are fresh
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 4. Static Asset Caching (JS, CSS, Images, Manifest)
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});

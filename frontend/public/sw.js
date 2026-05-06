// frontend/public/sw.js
// Minimal service worker — caches static assets for performance
// Previously: killed itself on every load (bad)
// Now: caches hashed static JS/CSS, network-first for HTML/API

const CACHE_NAME    = 'xmaster-v1';
const STATIC_CACHE  = 'xmaster-static-v1';

// Assets to cache immediately on SW install
const PRECACHE_URLS = [
  '/',
  '/logo.jpg',
  '/logo.svg',
];

// ── Install: precache core assets ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: smart caching strategy ─────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls — always network
  if (url.hostname === 'api.xmaster.guru') return;

  // Skip ad networks — always network
  if (
    url.hostname.includes('highperformanceformat') ||
    url.hostname.includes('effectivegatecpm') ||
    url.hostname.includes('abyss.to')
  ) return;

  // Hashed static assets (JS/CSS) — Cache First
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // HTML pages — Network First (stale-while-revalidate)
  if (
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname === '/'
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Everything else — Network First with fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
// EduWonderLab Family Connections Service Worker
const CACHE_NAME = 'family-connections-v1';
const PRECACHE_URLS = [
  '/curriculum/family-connections/',
  '/curriculum/family-connections/family-app.js',
  '/curriculum/family-connections/shared/model.js',
  '/curriculum/family-connections/shared/render.js',
  '/curriculum/family-connections/shared/copy-defaults.js',
  '/assets/fonts/outfit-hanken-grotesk-56e206.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Cache family homework pages and static assets
  if (url.pathname.includes('/homework.html') || url.pathname.startsWith('/curriculum/family-connections/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

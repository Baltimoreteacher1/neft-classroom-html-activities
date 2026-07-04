/* Monster Math Academy — service worker (offline app shell) */
const CACHE = "mma-v1";

/* Stable shell assets. Hashed Vite build files (JS/CSS) are intentionally
   NOT listed here — they change every build. The runtime fetch handler
   cache-first-populates them on first load instead. */
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./art/char-sprout.png",
  "./art/char-ember.png",
  "./art/char-frost.png",
  "./art/world-bg.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations; fall back to cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match("./index.html")
          .then((cached) => cached || caches.match("./")),
      ),
    );
    return;
  }

  // Cache-first for other same-origin static assets; populate cache on miss.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful, basic (same-origin) responses.
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

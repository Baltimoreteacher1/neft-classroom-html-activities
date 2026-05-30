/* Noam School — service worker.
 * Offline-first app shell: precache core files, serve them cache-first,
 * fall back to the cached app for navigations when offline. */
const VERSION = "noam-school-v11";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        // Tolerate any single missing asset so install never fails outright.
        Promise.allSettled(CORE.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache the sync API — it must hit the network (and is fine to fail offline).
  if (url.pathname.startsWith("/api/")) return;

  // Same-origin only; let cross-origin (e.g. Gmail links) pass through untouched.
  if (url.origin !== self.location.origin) return;

  // Navigations: try network, fall back to cached app shell so the app opens offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("index.html").then((r) => r || caches.match("./")),
      ),
    );
    return;
  }

  // Static assets: cache-first, then update the cache in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        // On a cache miss + offline, return a real error Response (never
        // resolve respondWith to undefined, which would throw).
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});

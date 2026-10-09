/* Monster Math Academy — service worker (offline app shell) */
const CACHE = "mma-studio-v4";

/* Stable shell assets. Hashed Vite build files (JS/CSS) are intentionally
   NOT listed here — they change every build. The runtime fetch handler
   cache-first-populates them on first load instead ("cache teach assets"
   below just means: everything the shell loads gets cached opportunistically
   the first time it's fetched, so a full teach session works offline after
   one online visit). */
const SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./rematch.js",
  "./rematch.css",
  "./manifest.webmanifest",
  "/assets/game-studio.js?v=20261003",
  "/assets/game-studio.css?v=20261002",
  "/assets/fonts/atkinson-hyperlegible-fredoka-bba435.css",
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
          keys
            .filter((key) => key.startsWith("mma-") && key !== CACHE)
            .map((key) => caches.delete(key)),
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

  // Save-code sync is network-only — never cache or intercept API responses.
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for navigations; fall back to the cached app shell offline,
  // and to a friendly static offline page if even that isn't cached yet
  // (a corrupted/never-populated cache shouldn't dead-end into a browser
  // error page).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = (await caches.match("./index.html")) || (await caches.match("./"));
        return shell || (await caches.match("./offline.html"));
      }),
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

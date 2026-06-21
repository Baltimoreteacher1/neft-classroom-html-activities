/* ==========================================================================
   Neft Teacher — Math Intervention service worker
   Offline-first for the intervention stations: once a page is visited it keeps
   working without wifi. Scope: /math/intervention/ only (does not touch the
   rest of the site). Bump CACHE to ship new asset versions.
   ========================================================================== */
const CACHE = "nt-int-v1";
const SCOPE = "/math/intervention/";
const HUB = SCOPE;

// Core shell precached on install so the hub + engine load offline immediately.
const CORE = [
  SCOPE,
  SCOPE + "index.html",
  SCOPE + "assets/intervention.css",
  SCOPE + "assets/intervention-engine.js",
  SCOPE + "assets/hub.js",
  SCOPE + "assets/quiz-render.js",
  SCOPE + "assets/forms-links.js",
  SCOPE + "manifest.webmanifest",
  "/assets/favicon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Tolerate any single 404 so install never fails as a whole.
      await Promise.all(
        CORE.map((url) =>
          cache.add(url).catch(() => {
            /* skip missing */
          }),
        ),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Same-origin only; never intercept Google Forms, fonts, analytics, etc.
  if (url.origin !== self.location.origin) return;
  // Only manage our own scope + the shared favicon.
  if (!url.pathname.startsWith(SCOPE) && url.pathname !== "/assets/favicon.svg")
    return;

  // HTML navigations: network-first (fresh content), fall back to cache, then
  // to the cached hub so students never hit a dead page offline.
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (err) {
          return (
            (await caches.match(req)) ||
            (await caches.match(HUB)) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Assets: cache-first, then network (and cache a copy for next time).
  e.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200 && fresh.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        return Response.error();
      }
    })(),
  );
});

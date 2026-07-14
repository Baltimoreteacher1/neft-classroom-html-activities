/* ==========================================================================
   Neft Teacher — Lessons offline service worker
   Offline-first for the Reveal Math lesson launchers: once a lesson is
   visited it keeps working without wifi. Scope: /lessons/ only (does not
   touch the rest of the site). Content updates flow through automatically (network-first); bump CACHE only when this worker itself changes.
   Modeled on math/intervention/sw.js.
   ========================================================================== */
const CACHE = "nt-lessons-v3";
const SCOPE = "/lessons/";
// Shared multi-day Save/Resume widget injected on every lesson launcher. It
// lives outside SCOPE (at /shared/), so it must be explicitly precached +
// intercepted or the save/resume UI breaks on an offline reload.
const SR_PREFIX = "/shared/save-resume/";
// Lesson launchers load their engine bundles and shared layers from /assets/
// (Vite content-hashed bundles + stable-named injected scripts).
const ASSETS_PREFIX = "/assets/";
// Never intercept the progress API or the results worker: they are live
// endpoints (POST/idempotent writes) that must always hit the network.
const SKIP_PREFIXES = ["/api/", "/results"];

// Core shell precached on install so save/resume + shared chrome load offline
// immediately. Lesson pages + their hashed bundles populate on first visit.
const CORE = [
  "/assets/favicon.svg",
  SR_PREFIX + "save-resume-styles.css",
  SR_PREFIX + "save-resume-engine.js",
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
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Same-origin only; never intercept Google Fonts, analytics, etc.
  if (url.origin !== self.location.origin) return;
  // Live endpoints are never cached or intercepted.
  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p))) return;
  // Only manage our own scope, the shared favicon, the engine assets, and the
  // shared Save/Resume assets injected on the lesson launchers.
  if (
    !url.pathname.startsWith(SCOPE) &&
    !url.pathname.startsWith(SR_PREFIX) &&
    !url.pathname.startsWith(ASSETS_PREFIX) &&
    url.pathname !== "/assets/favicon.svg"
  )
    return;

  // HTML navigations: network-first (fresh content), fall back to the cached
  // copy so students never hit a dead page offline.
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (err) {
          return (await caches.match(req)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Assets & subresources: NETWORK-FIRST, cache fallback. The site's caching
  // model is instant updates (max-age=0, must-revalidate), so a conditional
  // GET is a cheap 304 — online this costs exactly what the page cost before
  // the SW existed. Cache-first here would pin stable-named scripts and
  // lesson content (lesson.js, config.json, /assets/*.js) to whatever version
  // the student saw first, forever — deploys would never reach them.
  e.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200 && fresh.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        return (await caches.match(req)) || Response.error();
      }
    })(),
  );
});

/* ==========================================================================
   Neft Teacher — Practice Arcade offline service worker
   Offline-first for the per-lesson practice arcade: once the arcade is
   visited it keeps working without wifi (including the vendored Phaser
   runtime and per-lesson config fetches). Scope: /math/games/practice-arcade/
   only. Content updates flow through automatically (network-first); bump CACHE only when this worker itself changes.
   Modeled on math/intervention/sw.js.
   ========================================================================== */
const CACHE = "pa-off-v2";
const SCOPE = "/math/games/practice-arcade/";
// Shared multi-day Save/Resume widget injected on the arcade page. It lives
// outside SCOPE (at /shared/), so it must be explicitly precached +
// intercepted or the save/resume UI breaks on an offline reload.
const SR_PREFIX = "/shared/save-resume/";
// Shared layers (game-fx, hint ladder, calm access, juice, edupulse bridge).
const ASSETS_PREFIX = "/assets/";
// Vendored Phaser runtime.
const VENDOR_PREFIX = "/games/vendor/";
// The arcade fetches /lessons/<id>/config.json for per-lesson rounds.
const LESSONS_PREFIX = "/lessons/";
// Never intercept the progress/scores APIs or the results worker: they are
// live endpoints (POST/idempotent writes) that must always hit the network.
const SKIP_PREFIXES = ["/api/", "/results"];

// Core shell precached on install so the arcade boots offline immediately.
const CORE = [
  SCOPE,
  SCOPE + "index.html",
  "/games/vendor/phaser/phaser-3.80.1.min.js",
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
  // Same-origin only; never intercept CDNs, fonts, analytics, etc.
  if (url.origin !== self.location.origin) return;
  // Live endpoints are never cached or intercepted.
  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p))) return;
  // Only manage our own scope plus the shared assets the arcade loads.
  if (
    !url.pathname.startsWith(SCOPE) &&
    !url.pathname.startsWith(SR_PREFIX) &&
    !url.pathname.startsWith(ASSETS_PREFIX) &&
    !url.pathname.startsWith(VENDOR_PREFIX) &&
    !url.pathname.startsWith(LESSONS_PREFIX) &&
    url.pathname !== "/assets/favicon.svg"
  )
    return;

  // HTML navigations: network-first (fresh content), fall back to cache, then
  // to the cached arcade shell so students never hit a dead page offline.
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (err) {
          return (await caches.match(req)) || (await caches.match(SCOPE)) || Response.error();
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

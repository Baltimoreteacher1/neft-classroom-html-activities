/* =============================================================================
 * EduWonderLab Service Worker — PWA & Offline Chromebook Cache
 * Strategy: NETWORK-FIRST for HTML/navigations (a deploy is seen on the very
 * next load — no stale first paint, no double refresh), Stale-While-Revalidate
 * for versioned static assets, cache as offline fallback only.
 * Bump CACHE on any deploy that must purge the precached shell.
 * ========================================================================== */

const CACHE = "eduwonderlab-vmsaoy7gp";
const USER_OFFLINE_CACHE = "eduwonderlab-user-offline-v1";
const PRECACHE_URLS = [
  "/curriculum/",
  "/curriculum/arcade/",
  "/curriculum/student-launch/",
  "/curriculum/data-privacy/",
  "/math/games/",
  "/data/curriculum-manifest.json",
  "/data/curriculum-launch-manifest.json",
  "/assets/game-access.js",
  "/assets/game-fx.js",
  "/assets/game-fx.css",
  "/assets/game-access.css",
  "/assets/curriculum-enhancements.css",
  "/assets/curriculum-sidebar.css",
  "/assets/curriculum-polish.css",
  "/assets/curriculum-top1.css",
  "/assets/curriculum-teacher-workflow.css",
  "/assets/curriculum-guided-path.css",
  "/assets/curriculum-studio-journey.css",
  "/assets/curriculum-product-upgrades.css",
  "/assets/curriculum-student-launch.css",
  "/assets/mobile-access.css",
  "/assets/nt-signal.js",
  "/assets/curriculum-progress-bridge.js",
  "/assets/curriculum-enhancements.js",
  "/assets/curriculum-audit-badges.js",
  "/assets/curriculum-sidebar.js",
  "/assets/curriculum-top1.js",
  "/assets/curriculum-teacher-planning.js",
  "/assets/curriculum-teacher-workflow.js",
  "/assets/curriculum-guided-path.js",
  "/assets/curriculum-studio-journey.js",
  "/assets/curriculum-product-upgrades.js",
  "/assets/curriculum-student-launch.js",
  "/assets/curriculum-live-signal.js",
  "/assets/curriculum-next-move.js",
  "/assets/curriculum-lesson-merge.js",
  "/assets/interactive-live-sim.js",
  "/assets/interactive-live-sim.css",
  "/assets/process-telemetry.js",
  "/assets/process-telemetry.css",
  "/assets/ink-native-math.js",
  "/assets/ink-native-math.css",
  "/assets/voice-native-lesson.js",
  "/assets/voice-native-lesson.css",
  "/assets/reasoning-replay.js",
  "/assets/reasoning-replay.css",
  "/assets/convince-skeptic.js",
  "/assets/convince-skeptic.css",
  "/assets/edge-tuned-twins.js",
  "/assets/edge-tuned-twins.css",
  "/assets/class-board-strip.js",
  "/assets/vendor/minisearch-7.1.2.min.js",
  "/assets/favicon.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE && key !== USER_OFFLINE_CACHE) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => {
        // Broadcast update to all open tabs
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => client.postMessage({ type: "SW_UPDATED", cache: CACHE }));
        });
      }),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin or API POST requests from cache forcing
  if (url.origin !== self.location.origin) return;

  // API calls are dynamic and must never be served stale from cache — a
  // teacher-set warmup time, roster, or progress read has to be live. Let them
  // go straight to the network (the SW does not intercept them).
  if (url.pathname.startsWith("/api/")) return;

  const accept = req.headers.get("accept") || "";
  const isNavigation = req.mode === "navigate" || accept.includes("text/html");

  // HTML / navigations and curriculum assets: NETWORK-FIRST. Always fetch live page
  // and curriculum assets so a deploy appears immediately on the next load with no
  // stale first paint or double refresh. Fall back to cache only when offline.
  // game-score.js and edupulse-bridge.js are the reporting path: a stale copy
  // silently mis-records or drops student scores, so they are never served from
  // the stale-while-revalidate branch below.
  const isCurriculumAsset =
    url.pathname.startsWith("/curriculum") ||
    url.pathname.startsWith("/assets/curriculum") ||
    url.pathname === "/assets/game-score.js" ||
    url.pathname === "/assets/edupulse-bridge.js" ||
    url.pathname.includes("routes.json");

  if (isNavigation || isCurriculumAsset) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        })
        // Offline. The precache stores these URLs unversioned, but the hub
        // requests them with ?v=<stamp>, and a cache key includes the query
        // string -- so an exact match never hit and the whole curriculum
        // precache was downloaded on install and never once served.
        // ignoreSearch fixes that. It is safe HERE and only here: this branch
        // runs after the network already failed, so a stamp-mismatched cache
        // entry is strictly better than nothing. The SWR branch below must NOT
        // do this -- there it would serve last deploy's asset to an online user.
        //
        // The /curriculum/ fallback is gated behind isNavigation because it
        // returns an HTML document: handing that to a <script src> request
        // makes the browser refuse it on MIME type, which took down every hub
        // script offline instead of just the ones genuinely missing.
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((cached) => {
            if (cached) return cached;
            return isNavigation ? caches.match("/curriculum/") : undefined;
          }),
        ),
    );
    return;
  }

  // Other static assets (versioned CSS/JS/img): stale-while-revalidate for speed.
  // A ?v= bump changes the URL, so updated assets are a fresh cache key and
  // fetch immediately; unchanged assets get a cheap background refresh.
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    }),
  );
});

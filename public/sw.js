/* =============================================================================
 * EduWonderLab Service Worker — PWA & Offline Chromebook Cache
 * Strategy: Cache-first for core assets, Stale-While-Revalidate for HTML pages.
 * ========================================================================== */

const CACHE = "eduwonderlab-v1";
const PRECACHE_URLS = [
  "/curriculum/",
  "/assets/curriculum-enhancements.css",
  "/assets/curriculum-sidebar.css",
  "/assets/curriculum-polish.css",
  "/assets/curriculum-top1.css",
  "/assets/curriculum-teacher-workflow.css",
  "/assets/curriculum-guided-path.css",
  "/assets/curriculum-studio-journey.css",
  "/assets/mobile-access.css",
  "/assets/nt-signal.js",
  "/assets/curriculum-api-loader.js",
  "/assets/curriculum-progress-bridge.js",
  "/assets/curriculum-enhancements.js",
  "/assets/curriculum-audit-badges.js",
  "/assets/curriculum-sidebar.js",
  "/assets/curriculum-top1.js",
  "/assets/curriculum-teacher-planning.js",
  "/assets/curriculum-teacher-workflow.js",
  "/assets/curriculum-guided-path.js",
  "/assets/curriculum-studio-journey.js",
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
            if (key !== CACHE) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin or API POST requests from cache forcing
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background for next visit (stale-while-revalidate)
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE).then((cache) => cache.put(req, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is HTML navigation, fallback to /curriculum/
          if (req.headers.get("accept") && req.headers.get("accept").includes("text/html")) {
            return caches.match("/curriculum/");
          }
        });
    }),
  );
});

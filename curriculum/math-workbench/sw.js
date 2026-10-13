/* Math Workbench — offline service worker.
 *
 * NETWORK-FIRST by design: the Workbench HTML is intentionally served
 * no-cache so fixes go live instantly, and this worker preserves that — every
 * request tries the network and only falls back to the last good cached copy
 * when the student is offline (school wifi drop, bus, home without internet).
 * Never intercepts /api/ calls or non-GET requests, so the optional reasoning
 * coach and Live Board always use current network responses.
 */
const CACHE = "mwb-v3";
// GeoGebra's web app is large but fully static+versioned: cache-first means
// the Graphing calculator keeps working offline after one online use.
const GGB_CACHE = "mwb-ggb-v1";
const PRECACHE = [
  "./",
  "./index.html",
  "./reasoning-data.js",
  "./reasoning-tags.js",
  "./reasoning-exemplars.js",
  "./reasoning-i18n.js",
  "./reasoning-messages.js",
  "./reasoning-analyze.js",
  "./reasoning-store.js",
  "./reasoning-tools.js",
  "./reasoning-stamp.js",
  "./reasoning-state.js",
  "./reasoning-coach.js",
  "./reasoning-panels.js",
  "./reasoning-teacher.js",
  "./reasoning-studio.js",
  "./reasoning-studio.css",
  // Board extensions (index.html loads these before its own script).
  "./wb-core.js",
  "./wb-math.js",
  "./wb-history.js",
  "./wb-storage.js",
  "./wb-tools-grids.js",
  "./wb-tools-number.js",
  "./wb-tools-geo.js",
  "./wb-tools-linked.js",
  "./wb-stats.js",
  "./wb-explain.js",
  "./wb-edit.js",
  "./wb-draw.js",
  "./wb-mathtext.js",
  "./wb-export.js",
  "./wb-saves.js",
  "./wb-tools.css",
  "./wb-shell.css",
  "./wb-extras.css",
  "./wb-shell.js",
  "./wb-teacher.js",
  "./wb-i18n-es.js",
  "./wb-i18n-es-panels.js",
  "./wb-i18n.js",
  "./wb-reference-es.js",
  "./wb-reference.js",
  "./wb-access.js",
  "./wb-calc.js",
  "./wb-lesson.js",
  "/assets/mobile-access.css",
  "/assets/favicon.svg",
  // Loaded by the page itself: keep the offline first load looking right.
  "/assets/fonts/hub-curriculum.css",
  "/assets/math-workbench-launcher.js",
  "/assets/formula-popup.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE && k !== GGB_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Live data must never be served stale.
  if (url.pathname.startsWith("/api/")) return;

  // GeoGebra (Graphing calculator): cache-first so it works offline after the
  // first online use. Assets are versioned/immutable, so stale is safe.
  if (url.hostname === "www.geogebra.org" || url.hostname === "cdn.geogebra.org") {
    e.respondWith(
      caches.open(GGB_CACHE).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()).catch(() => {});
              return res;
            }),
        ),
      ),
    );
    return;
  }
  // Web fonts: cache-first (immutable files, and the offline page looks right).
  if (url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com") {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches
              .open(CACHE)
              .then((c) => c.put(req, copy))
              .catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // Everything same-origin: network first, refresh the cache on success,
  // fall back to the cached copy offline. Navigations fall back to the app
  // shell so the Workbench opens with the student's locally saved notebook.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(req, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          if (req.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        }),
      ),
  );
});

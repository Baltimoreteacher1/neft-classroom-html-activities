/* Math Workbench — offline service worker.
 *
 * NETWORK-FIRST by design: the Workbench HTML is intentionally served
 * no-cache so fixes go live instantly, and this worker preserves that — every
 * request tries the network and only falls back to the last good cached copy
 * when the student is offline (school wifi drop, bus, home without internet).
 * Never intercepts /api/ calls or non-GET requests, so the optional reasoning
 * coach and Live Board always use current network responses.
 */
const CACHE = "mwb-v2";
// GeoGebra's web app is large but fully static+versioned: cache-first means
// the Graphing calculator keeps working offline after one online use.
const GGB_CACHE = "mwb-ggb-v1";
const PRECACHE = [
  "./",
  "./index.html",
  "./reasoning-data.js",
  "./reasoning-studio.js",
  "./reasoning-studio.css",
  "/assets/mobile-access.css",
  "/assets/favicon.svg",
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

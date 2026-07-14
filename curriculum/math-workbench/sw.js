/* Math Workbench — offline service worker.
 *
 * NETWORK-FIRST by design: the Workbench HTML is intentionally served
 * no-cache so fixes go live instantly, and this worker preserves that — every
 * request tries the network and only falls back to the last good cached copy
 * when the student is offline (school wifi drop, bus, home without internet).
 * Never intercepts /api/ calls or non-GET requests, so Turn In, the Math
 * Coach, and Live Board behave exactly as before.
 */
const CACHE = "mwb-v1";
const PRECACHE = ["./", "./index.html", "/assets/mobile-access.css", "/assets/favicon.svg"];

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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Live data must never be served stale.
  if (url.pathname.startsWith("/api/")) return;

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

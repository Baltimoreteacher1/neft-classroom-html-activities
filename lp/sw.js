// Offline support for The Language Page front layer. Registered with scope "/" (the page is served with
// Service-Worker-Allowed: /), but it only ever answers front-layer URLs; every other request (the Practice Lab, the
// Teacher Hub, /api/...) goes to the network untouched because this worker does not call respondWith for it.
// Pages: network first, cached copy when offline. Assets and fonts: cached copy first, refreshed in the background.
const CACHE = "lp-front-v4";
const FRONT = /^\/(?:$|practice\/|tools\/|content\/|access-guide\/|about\/|search\/|styleguide\/)/;
const ASSET = /^\/(?:lp\/assets\/|assets\/fonts\/)/;
const PRECACHE = [
  "/",
  "/practice/",
  "/tools/",
  "/content/",
  "/access-guide/",
  "/lp/assets/site.css",
  "/lp/assets/prefs.js",
  "/lp/assets/site.js",
  "/lp/assets/lib.js",
  "/lp/assets/practice.js",
  "/lp/assets/search-core.js",
  "/lp/assets/palette.js",
  "/lp/assets/class-profile.js",
  "/lp/assets/icons.svg",
  "/lp/assets/game/runtime.js",
  "/lp/assets/game/game.css",
  "/lp/assets/activity/runtime.js",
  "/lp/assets/activity/activity.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith("lp-front-") && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (ASSET.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      }),
    );
    return;
  }
  if (req.mode === "navigate" && FRONT.test(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(
          async () =>
            (await caches.match(req, { ignoreSearch: true })) ||
            (await caches.match("/")) ||
            Response.error(),
        ),
    );
  }
});

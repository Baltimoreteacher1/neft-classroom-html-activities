/* Math Fluency Lab — offline worker. Scope: /math/fluency-lab/.
   Once a device has opened the lab online, practice keeps working without Wi-Fi. Every same-origin GET the lab makes
   (its own files plus the shared /assets and /shared files it loads) is saved as it is used, network-first so a deploy
   is seen as soon as the network answers. /api/ and /results are live endpoints and are never touched.
   Bump CACHE only when this worker itself changes. */
const CACHE = "fluency-off-v1";
const SCOPE = "/math/fluency-lab/";
const SKIP_PREFIXES = ["/api/", "/results"];
const CORE = [
  SCOPE,
  SCOPE + "manifest.json",
  SCOPE + "icons/icon-192.png",
  SCOPE + "icons/icon-512.png",
  "/assets/favicon.svg",
  "/assets/fonts/small-group.css",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fluency-off-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p))) return;
  if (url.pathname === SCOPE + "sw.js") return;
  e.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.status === 200 && fresh.type === "basic") (await caches.open(CACHE)).put(req, fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(req, { ignoreSearch: req.mode === "navigate" })) || (req.mode === "navigate" && (await caches.match(SCOPE))) || Response.error();
      }
    })(),
  );
});

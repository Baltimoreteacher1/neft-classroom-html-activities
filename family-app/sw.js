/* EduWonderLab Family — home-screen app worker. Scope: /family-app/ only.
   Keeps the family home screen openable offline. The three practice areas each own their own worker:
   /math/fluency-lab/sw.js, /access-practice-lab/sw.js, /curriculum/family-connections/sw.js.
   Network-first, so a deploy shows up as soon as the network answers; bump CACHE only when this file changes. */
const CACHE = "ewl-family-v1";
const CORE = [
  "/family-app/",
  "/family-app/manifest.webmanifest",
  "/family-app/icons/icon-192.png",
  "/family-app/icons/icon-512.png",
  "/assets/favicon.svg",
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
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ewl-family-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/family-app/") && url.pathname !== "/assets/favicon.svg") return;
  e.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok && fresh.type === "basic") (await caches.open(CACHE)).put(req, fresh.clone());
        return fresh;
      } catch (err) {
        return (await caches.match(req, { ignoreSearch: true })) || (req.mode === "navigate" && (await caches.match("/family-app/"))) || Response.error();
      }
    })(),
  );
});

/* Focus School — service worker.
 * Offline-first app shell: precache core files, serve them cache-first,
 * fall back to the cached app for navigations when offline. */
const VERSION = "focus-school-v75";
const CORE = [
  // Cloudflare Pages serves clean URLs — a request for "index.html" or
  // "unit-1.html" 308-redirects to the extensionless path, and cache.add()
  // REJECTS a redirected response. Because install() uses allSettled, such an
  // entry fails SILENTLY and is simply never precached. Always list the URL
  // Pages actually serves. ("./" is the shell; "index.html" was the same file
  // and had been failing this way.)
  "./",
  "styles.css?v=58",
  "sports.js?v=4",
  "needoh-studio.js?v=1",
  "planner-core.js?v=1",
  "app.js?v=65",
  "manifest.webmanifest",
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "assets/mobile-access.css",
  // Nightly Hebrew is used at bedtime, sometimes on a dead hotel/car connection
  // — precache the whole thing so all nine innings work fully offline.
  "hebrew/",
  "hebrew/hebrew.css",
  "hebrew/data.js",
  "hebrew/units.js",
  "hebrew/engine.js",
  "hebrew/activities/warmup.js",
  "hebrew/activities/letters.js",
  "hebrew/activities/vowels.js",
  "hebrew/activities/blend.js",
  "hebrew/activities/fluency.js",
  "hebrew/activities/words.js",
  "hebrew/activities/read.js",
  "hebrew/activities/prove.js",
  "hebrew/unit-1",
  "hebrew/unit-2",
  "hebrew/unit-3",
  "hebrew/unit-4",
  "hebrew/unit-5",
  "hebrew/unit-6",
  "hebrew/unit-7",
  "hebrew/unit-8",
  "hebrew/unit-9",
  "hebrew/games/unit-1.js",
  "hebrew/games/unit-2.js",
  "hebrew/games/unit-3.js",
  "hebrew/games/unit-4.js",
  "hebrew/games/unit-5.js",
  "hebrew/games/unit-6.js",
  "hebrew/games/unit-7.js",
  "hebrew/games/unit-8.js",
  "hebrew/games/unit-9.js",
];

// Focus (or open) the app when a reminder/briefing notification is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    }),
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        // Tolerate any single missing asset so install never fails outright.
        // Use cache:"reload" so precaching bypasses the HTTP cache — otherwise a
        // long zone Browser Cache TTL could make a new SW store a stale app.js.
        Promise.allSettled(CORE.map((url) => cache.add(new Request(url, { cache: "reload" })))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache the sync API — it must hit the network (and is fine to fail offline).
  if (url.pathname.startsWith("/api/")) return;

  // Cross-origin: cache-first for the immutable CDN assets the app depends on
  // (webfonts + KaTeX), so an installed PWA keeps its typography and math
  // rendering offline. Everything else (e.g. Gmail links) passes through.
  if (url.origin !== self.location.origin) {
    const CDN_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net"];
    if (CDN_HOSTS.includes(url.hostname)) {
      event.respondWith(
        caches.match(req).then(
          (cached) =>
            cached ||
            fetch(req).then((res) => {
              // Opaque (no-cors) responses report status 0 but are still servable.
              if (res && (res.ok || res.type === "opaque")) {
                const copy = res.clone();
                caches.open(VERSION).then((cache) => cache.put(req, copy));
              }
              return res;
            }),
        ),
      );
    }
    return;
  }

  // Navigations: try network, fall back to cached app shell so the app opens
  // offline. Race the network against a short timeout so a connected-but-dead
  // network (captive portal, stalled school wifi) can't hang app launch — the
  // fetch only *rejects* when it fails outright, never when it merely stalls.
  if (req.mode === "navigate") {
    // Prefer the exact page we cached (so /hebrew/unit-3.html opens offline as
    // itself), and only fall back to the planner shell for anything unknown.
    const shell = () =>
      caches
        .match(req, { ignoreSearch: true })
        .then((r) => r || caches.match("index.html"))
        .then((r) => r || caches.match("./"));
    event.respondWith(
      Promise.race([fetch(req), new Promise((resolve) => setTimeout(() => resolve(null), 3500))])
        .then((res) => res || shell().then((s) => s || fetch(req)))
        .catch(() => shell()),
    );
    return;
  }

  // Static assets: cache-first, then update the cache in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        // On a cache miss + offline, return a real error Response (never
        // resolve respondWith to undefined, which would throw).
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});

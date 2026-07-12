/* Focus School — service worker.
 * Offline-first app shell: precache core files, serve them cache-first,
 * fall back to the cached app for navigations when offline. */
const VERSION = "focus-school-v46";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "assets/mobile-access.css",
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
    const shell = () => caches.match("index.html").then((r) => r || caches.match("./"));
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

// BCPSS Teacher Studio Service Worker — offline unit pinning & shell caching.
// Same-origin only: refuses any cross-origin URL, never caches non-GET or auth/write endpoints.
const SHELL_CACHE = "ewl-bcpss-shell-v1";
const UNIT_CACHE_PREFIX = "ewl-bcpss-offline-";

const SHELL_URLS = [
  "/bcpss-teachers/",
  "/bcpss-teachers/index.html",
  "/bcpss-teachers/bcpss-teachers.css",
  "/bcpss-teachers/bcpss-teachers.js",
  "/bcpss-teachers/offline-mode.js",
  "/bcpss-teachers/provenance-live.js",
  "/bcpss-teachers/provenance.css",
  "/bcpss-teachers/studio-tab.js",
  "/bcpss-teachers/overview-tab.js",
  "/bcpss-teachers/overview.css",
  "/bcpss-teachers/vocab-studio.js",
  "/bcpss-teachers/vocab-reader.js",
  "/bcpss-teachers/vocab-reader.css",
  "/bcpss-teachers/vocab-reader-text.js",
  "/bcpss-teachers/vocab-visuals.js",
  "/bcpss-teachers/vocab-word-parts.js",
  "/bcpss-teachers/esol-pack.css",
  "/bcpss-teachers/family-tips.js",
  "/bcpss-teachers/family-tips.css",
  "/bcpss-teachers/keep-view.js",
  "/bcpss-teachers/assign-dialog.js",
  "/bcpss-teachers/assign.css",
  "/bcpss-teachers/assigned-bar.js",
  "/bcpss-teachers/assigned-bar.css",
  "/shared/bcpss-provenance.js",
  "/shared/bcpss-reveal.js",
  "/shared/bcpss-family-tips.js",
];

const NEVER_CACHE_RE = /^\/api\/(?:review|class|bcpss\/telemetry|bcpss\/plans|flags|health)/;

function isSafeSameOrigin(urlStr) {
  try {
    const u = new URL(urlStr, self.location.origin);
    if (u.origin !== self.location.origin) return false;
    if (NEVER_CACHE_RE.test(u.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function unitCacheName(unitId) {
  const safe = String(unitId || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return `${UNIT_CACHE_PREFIX}${safe}`;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.allSettled(
          SHELL_URLS.map((u) =>
            fetch(u, { credentials: "same-origin" }).then((r) => (r.ok ? cache.put(u, r) : null)),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("ewl-bcpss-shell-") && k !== SHELL_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  const port = event.ports?.[0];
  if (data.type === "pin-unit") {
    const unitId = String(data.unitId || "").trim();
    const urls = Array.isArray(data.urls) ? data.urls : [];
    event.waitUntil(
      (async () => {
        if (!unitId) {
          port?.postMessage({ type: "pin-error", message: "missing-unit-id" });
          return;
        }
        const cache = await caches.open(unitCacheName(unitId));
        let saved = 0;
        let failed = 0;
        let refused = 0;
        let bytes = 0;
        for (const rawUrl of urls) {
          if (!isSafeSameOrigin(rawUrl)) {
            refused += 1;
            continue;
          }
          try {
            const res = await fetch(rawUrl, { credentials: "same-origin" });
            if (res.ok) {
              const clone = res.clone();
              const buf = await res.clone().arrayBuffer();
              bytes += buf.byteLength;
              await cache.put(rawUrl, clone);
              saved += 1;
            } else {
              failed += 1;
            }
          } catch {
            failed += 1;
          }
        }
        const manifest = {
          unitId,
          saved,
          failed,
          refused,
          bytes,
          at: new Date().toISOString(),
        };
        await cache.put(
          `/bcpss-teachers/__offline-unit-${encodeURIComponent(unitId)}.json`,
          new Response(JSON.stringify(manifest), {
            headers: { "Content-Type": "application/json" },
          }),
        );
        port?.postMessage({ type: "pin-done", ...manifest });
      })(),
    );
  } else if (data.type === "unpin-unit") {
    const unitId = String(data.unitId || "").trim();
    event.waitUntil(
      caches.delete(unitCacheName(unitId)).then((deleted) => {
        port?.postMessage({ type: "unpin-done", unitId, deleted });
      }),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (!isSafeSameOrigin(req.url)) return;
  const url = new URL(req.url);
  const inScope =
    url.pathname.startsWith("/bcpss-teachers/") ||
    url.pathname.startsWith("/api/bcpss/") ||
    url.pathname.startsWith("/shared/") ||
    url.pathname.startsWith("/assets/");
  if (!inScope) return;

  event.respondWith(
    (async () => {
      try {
        const net = await fetch(req);
        if (net.ok && !url.pathname.startsWith("/api/")) {
          const shell = await caches.open(SHELL_CACHE);
          shell.put(req, net.clone()).catch(() => {});
        }
        return net;
      } catch {
        const exact = await caches.match(req, { ignoreVary: true });
        if (exact) return exact;
        if (req.mode === "navigate" && url.pathname.startsWith("/bcpss-teachers")) {
          const shell =
            (await caches.match("/bcpss-teachers/index.html")) ||
            (await caches.match("/bcpss-teachers/"));
          if (shell) return shell;
        }
        return new Response(JSON.stringify({ ok: false, error: "offline-not-cached" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    })(),
  );
});

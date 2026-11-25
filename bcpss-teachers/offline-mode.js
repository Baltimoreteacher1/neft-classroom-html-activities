// BCPSS Teacher Studio — Offline Unit Pinning & Low-Bandwidth Helpers.
// Same-origin only: pins a unit's JSON + shell assets via /bcpss-teachers/sw.js so teachers can
// open a pinned unit with the network disabled. Never writes to server or sends data off-device.

export const UNIT_CACHE_PREFIX = "ewl-bcpss-offline-";

export function unitCacheName(unitId) {
  const safe = String(unitId || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return `${UNIT_CACHE_PREFIX}${safe}`;
}

/** Same-origin URLs required to render one BCPSS unit offline. Pure. */
export function unitPinUrls(unitId, { grade = "", subject = "" } = {}) {
  const id = encodeURIComponent(String(unitId || "").trim());
  if (!id) return [];
  const urls = [
    "/bcpss-teachers/",
    "/bcpss-teachers/index.html",
    `/api/bcpss/units/${id}`,
    `/api/bcpss/units/${id}/lessons`,
  ];
  if (grade && subject) {
    urls.push(
      `/api/bcpss/units?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`,
    );
  }
  return urls;
}

export function formatBytes(n) {
  const b = Math.max(0, Number(n) || 0);
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(b / 1024))} KB`;
}

export async function registerOfflineWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/bcpss-teachers/sw.js", {
      scope: "/bcpss-teachers/",
    });
  } catch {
    return null;
  }
}

export async function getPinnedUnitManifest(unitId) {
  if (!unitId || typeof caches === "undefined") return null;
  try {
    const name = unitCacheName(unitId);
    if (!(await caches.has(name))) return null;
    const cache = await caches.open(name);
    const hit = await cache.match(
      `/bcpss-teachers/__offline-unit-${encodeURIComponent(unitId)}.json`,
    );
    return hit ? await hit.json() : { unitId, saved: 1, bytes: 0 };
  } catch {
    return null;
  }
}

export async function listPinnedUnits() {
  if (typeof caches === "undefined") return [];
  try {
    const keys = await caches.keys();
    return keys
      .filter((k) => k.startsWith(UNIT_CACHE_PREFIX))
      .map((k) => k.slice(UNIT_CACHE_PREFIX.length));
  } catch {
    return [];
  }
}

async function waitForController(timeoutMs = 3000) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  const reg = await registerOfflineWorker();
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  if (reg?.active) return reg.active;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(navigator.serviceWorker.controller || null), timeoutMs);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        clearTimeout(timer);
        resolve(navigator.serviceWorker.controller || null);
      },
      { once: true },
    );
  });
}

export async function pinUnitOffline(unitId, opts = {}) {
  const baseUrls = unitPinUrls(unitId, opts);
  if (!baseUrls.length) throw new Error("missing-unit-id");
  const loadedAssets = [];
  if (typeof performance !== "undefined" && typeof window !== "undefined") {
    for (const entry of performance.getEntriesByType("resource") || []) {
      try {
        const u = new URL(entry.name, window.location.origin);
        if (
          u.origin === window.location.origin &&
          /\.(?:js|mjs|css)(?:\?.*)?$/.test(u.pathname) &&
          !u.pathname.startsWith("/api/")
        ) {
          loadedAssets.push(u.pathname + u.search);
        }
      } catch {
        // Ignore malformed resource entries
      }
    }
  }
  const urls = [...new Set([...baseUrls, ...loadedAssets])];
  const worker = await waitForController();
  if (worker) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = ({ data }) => {
        if (data?.type === "pin-done") resolve(data);
        else if (data?.type === "pin-error") reject(new Error(data.message || "pin-failed"));
      };
      worker.postMessage({ type: "pin-unit", unitId, urls }, [channel.port2]);
    });
  }
  // Direct Cache API fallback when SW has not yet claimed the initial page load
  if (typeof caches === "undefined") throw new Error("caches-unavailable");
  const cache = await caches.open(unitCacheName(unitId));
  let saved = 0;
  let failed = 0;
  let bytes = 0;
  for (const u of urls) {
    try {
      const res = await fetch(u, { credentials: "same-origin" });
      if (res.ok) {
        const buf = await res.clone().arrayBuffer();
        bytes += buf.byteLength;
        await cache.put(u, res);
        saved += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }
  const manifest = { unitId, saved, failed, refused: 0, bytes, at: new Date().toISOString() };
  await cache.put(
    `/bcpss-teachers/__offline-unit-${encodeURIComponent(unitId)}.json`,
    new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } }),
  );
  return manifest;
}

export async function unpinUnitOffline(unitId) {
  if (!unitId || typeof caches === "undefined") return false;
  return caches.delete(unitCacheName(unitId));
}

export function initOfflineBanner(bannerEl) {
  if (!bannerEl || typeof window === "undefined") return;
  const sync = () => {
    const offline = navigator.onLine === false;
    bannerEl.hidden = !offline;
  };
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  sync();
}

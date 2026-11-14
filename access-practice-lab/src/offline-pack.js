// Offline week packs for the Road to ACCESS: "Save this week for offline" collects one week's activity pages, the
// content files those activities read and the pictures or audio files they reference, and asks the offline worker
// (sw.js, message "cache-urls") to save them in a cache of their own. The worker refuses anything off this site.
// Pages (navigations) are answered by the app shell the worker already keeps; the pack holds the data they need.
// Listening read-alouds use the device's own speech voice, so they need no files; that is said on the page.
import { BASE } from "./util.js";

/** Must match sw.js PACK_PREFIX. Not "ewl-access-": that prefix is cleared on every deploy. */
export const PACK_PREFIX = "ewl-offline-";
export const MANIFEST = `${BASE}/__offline-pack.json`;
/** Content files every activity page reads (src/views/activity.js and the Road page). */
const SHARED_CONTENT = [
  "index.json",
  "road.json",
  "shared.json",
  "glossary.json",
  "lesson-learn.json",
  "es-guide.json",
  "es-strings.json",
  "family-coach.json",
];
const MEDIA_RE = /^(?:pictures|audio)\/[\w./-]+\.(?:svg|png|jpe?g|webp|gif|mp3|m4a|ogg|wav)$/i;

/** Cache-safe name for one band's week, e.g. "road-3-5-w4". */
export const packName = (band, week) =>
  `road-${String(band)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")}-w${Math.max(0, Math.floor(Number(week) || 0))}`;

/** Every lab-relative picture or audio path inside a value (any depth). */
export function mediaPaths(value, out = new Set()) {
  if (typeof value === "string") {
    if (MEDIA_RE.test(value) && !value.includes("..")) out.add(value);
  } else if (Array.isArray(value)) for (const v of value) mediaPaths(v, out);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) mediaPaths(v, out);
  return out;
}

/**
 * The URLs one week needs offline. Pure.
 * @param {{band: string, week: {n: number, activities: string[]}, rows: {id: string, domain: string, level: string}[],
 *   activities: object[], hrefOf: (row: object) => string}} o activities = the full authored activity objects of the week
 * @returns {{routes: string[], content: string[], media: string[], urls: string[]}}
 */
export function weekPackUrls({ band, week, rows, activities, hrefOf }) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const acts = week.activities.map((id) => byId.get(id)).filter(Boolean);
  const q = `?grades=${encodeURIComponent(band)}`;
  const routes = [`${BASE}/road/${week.n}${q}`, ...acts.map((a) => `${hrefOf(a)}${q}`)];
  const content = [
    ...SHARED_CONTENT.map((f) => `${BASE}/content/${f}`),
    ...[...new Set(acts.map((a) => a.domain))].map(
      (d) => `${BASE}/content/g${band}/${encodeURIComponent(d)}.json`,
    ),
  ];
  const media = [...mediaPaths(activities)].sort().map((p) => `${BASE}/${p}`);
  return { routes, content, media, urls: [...new Set([...routes, ...content, ...media])] };
}

/** "1.4 MB" / "820 KB": the size shown next to a saved pack. */
export function formatBytes(n) {
  const b = Math.max(0, Number(n) || 0);
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(b / 1024))} KB`;
}

const hasCaches = () => typeof caches !== "undefined";

/** The saved pack's manifest ({ name, saved, bytes, at }) or null when this week is not saved. */
export async function packStatus(name) {
  if (!hasCaches()) return null;
  try {
    if (!(await caches.has(PACK_PREFIX + name))) return null;
    const hit = await (await caches.open(PACK_PREFIX + name)).match(MANIFEST);
    return hit ? await hit.json() : null;
  } catch {
    return null;
  }
}

export async function removePack(name) {
  if (!hasCaches()) return false;
  return caches.delete(PACK_PREFIX + name);
}

/** True when this page has an active offline worker to talk to. */
export const canSavePacks = () =>
  typeof navigator !== "undefined" && Boolean(navigator.serviceWorker?.controller) && hasCaches();

/**
 * Ask the worker to save `urls` as pack `name`. `onProgress({done, total, bytes})` runs as files land.
 * Resolves with the worker's summary ({ saved, failed, refused, bytes, pages }) or rejects with an Error.
 */
export function savePack(name, urls, onProgress = () => {}) {
  const worker = navigator.serviceWorker?.controller;
  if (!worker) return Promise.reject(new Error("no-worker"));
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = ({ data }) => {
      if (data?.type === "cache-progress") onProgress(data);
      else if (data?.type === "cache-done") resolve(data);
      else if (data?.type === "cache-error") reject(new Error(data.message || "save failed"));
    };
    worker.postMessage({ type: "cache-urls", name, urls }, [channel.port2]);
  });
}

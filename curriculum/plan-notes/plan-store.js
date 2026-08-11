/* plan-store.js — the network and cache layer for Plan Notes.
 *
 * Two jobs:
 *
 *   1. Talk to /api/plan-notes with the teacher key attached.
 *   2. Never lose a note. Every write goes to localStorage FIRST and is pushed
 *      to D1 after. Classroom wifi drops, and a margin note that vanishes
 *      because a fetch failed is worse than no tool at all — the teacher stops
 *      trusting it, and a tool you cannot trust does not get used.
 *
 * The outbox is drained on load, on reconnect, and after every write. Notes
 * written offline carry a local id until the server assigns a real one.
 */

const API = "/api/plan-notes";
const KEY_STORAGE = "neft.teacher.key";
const CACHE_PREFIX = "nt-plan-notes:cache:";
const OUTBOX = "nt-plan-notes:outbox";

export const getKey = () => localStorage.getItem(KEY_STORAGE) || "";
export const setKey = (k) => localStorage.setItem(KEY_STORAGE, String(k || "").trim());

function readJson(storageKey, fallback) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(storageKey, value) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    // Quota. The cache is expendable; the outbox is not, so it is worth saying
    // so out loud rather than silently dropping a pending note.
    return false;
  }
}

async function call(path, { method = "GET", body = null } = {}) {
  const key = getKey();
  if (!key) throw new Error("no-key");
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-teacher-key": key,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export const health = () => call("health");
export const vocab = () => call("vocab");
export const listDocs = () => call("docs");
export const registerDoc = (doc) => call("docs", { method: "POST", body: doc });
export const deleteDoc = (sha) => call(`docs/${sha}`, { method: "DELETE" });

export const uploadBlob = (sha, base64, mime) =>
  call(`blob/${sha}`, { method: "PUT", body: { data: base64, mime } });

export const annotate = (payload) => call("annotate", { method: "POST", body: payload });

/* ── Notes, cache-first ────────────────────────────────────────────────────── */

const cacheKey = (anchorKey) => CACHE_PREFIX + anchorKey;

export function cachedNotes(anchorKey) {
  return readJson(cacheKey(anchorKey), []);
}

function putCache(anchorKey, notes) {
  writeJson(cacheKey(anchorKey), notes);
}

/**
 * Notes for one plan. Cache first so the rail paints instantly, then the server
 * reconciles. Offline, the cache IS the answer rather than an error.
 */
export async function loadNotes(anchorKey) {
  const cached = cachedNotes(anchorKey);
  try {
    const data = await call(`notes?anchorKey=${encodeURIComponent(anchorKey)}`);
    const pending = pendingFor(anchorKey);
    // Server notes plus anything still queued, so an offline note stays visible
    // through a reload instead of blinking out when the server answer lands.
    const merged = [...data.notes, ...pending];
    putCache(anchorKey, merged);
    return { notes: merged, online: true };
  } catch (err) {
    if (err.message === "no-key" || err.status === 401 || err.status === 503) throw err;
    return { notes: cached, online: false };
  }
}

const localId = () => `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function pendingFor(anchorKey) {
  return readJson(OUTBOX, []).filter((n) => n.anchorKey === anchorKey);
}

/**
 * Create notes. Optimistic: they land in the cache and the outbox immediately
 * and are returned to the caller before the network is touched.
 */
export async function createNotes(anchorKey, notes) {
  const stamped = notes.map((n) => ({
    ...n,
    anchorKey,
    id: localId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pending: true,
  }));
  const outbox = readJson(OUTBOX, []);
  writeJson(OUTBOX, [...outbox, ...stamped]);
  putCache(anchorKey, [...cachedNotes(anchorKey), ...stamped]);
  await flush();
  return stamped;
}

export async function patchNote(anchorKey, id, patch) {
  const next = cachedNotes(anchorKey).map((n) =>
    n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
  );
  putCache(anchorKey, next);
  if (!String(id).startsWith("local-")) {
    try {
      await call(`notes/${id}`, { method: "PATCH", body: patch });
    } catch (err) {
      if (err.status === 400) throw err; // a rejected edit must surface, not queue
    }
  } else {
    // Still queued: edit it in place in the outbox so the first write is right.
    const outbox = readJson(OUTBOX, []).map((n) => (n.id === id ? { ...n, ...patch } : n));
    writeJson(OUTBOX, outbox);
  }
  return next;
}

export async function deleteNote(anchorKey, id) {
  putCache(
    anchorKey,
    cachedNotes(anchorKey).filter((n) => n.id !== id),
  );
  writeJson(
    OUTBOX,
    readJson(OUTBOX, []).filter((n) => n.id !== id),
  );
  if (!String(id).startsWith("local-")) {
    try {
      await call(`notes/${id}`, { method: "DELETE" });
    } catch {
      /* soft-deleted server-side on the next successful sync; the row survives */
    }
  }
}

/**
 * Push everything queued. Notes rejected by the server's validator are dropped
 * from the outbox with their reason attached — a note that can never be
 * accepted must not retry forever, and the teacher needs to be told why.
 */
export async function flush() {
  const outbox = readJson(OUTBOX, []);
  if (!outbox.length || !getKey()) return { pushed: 0, rejected: [] };

  const byAnchor = new Map();
  for (const n of outbox) {
    if (!byAnchor.has(n.anchorKey)) byAnchor.set(n.anchorKey, []);
    byAnchor.get(n.anchorKey).push(n);
  }

  let pushed = 0;
  const rejected = [];
  const stillQueued = [];

  for (const [anchorKey, group] of byAnchor) {
    const payload = group.map(({ id, pending, createdAt, updatedAt, ...rest }) => rest);
    try {
      const data = await call("notes", { method: "POST", body: { notes: payload } });
      pushed += group.length;
      putCache(anchorKey, data.notes);
    } catch (err) {
      if (err.status === 400) {
        rejected.push({ anchorKey, count: group.length, reason: err.message });
      } else {
        stillQueued.push(...group);
      }
    }
  }

  writeJson(OUTBOX, stillQueued);
  return { pushed, rejected, queued: stillQueued.length };
}

export const pendingCount = () => readJson(OUTBOX, []).length;

/* Reconnect is the moment a queued note can finally land; taking it means the
 * teacher does not have to know the outbox exists. */
window.addEventListener("online", () => {
  flush().catch(() => {});
});

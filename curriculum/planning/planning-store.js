/* planning-store.js — data and network for the Live Pacing Planner.
 *
 * Modelled directly on curriculum/plan-notes/plan-store.js, for the same reason
 * that file gives: classroom wifi drops, and an edit that vanishes because a
 * fetch failed costs the teacher's trust in the whole tool. Every write lands in
 * localStorage FIRST and is pushed to D1 after; the outbox drains on load, on
 * reconnect, and after every write.
 *
 * The one thing this must never do is report Saved before the server has the
 * edit. `state.save` distinguishes saved / saving / pending / failed, and only
 * a 2xx from /api/pacing moves it to saved.
 */

const API = "/api/pacing";
const KEY_STORAGE = "neft.teacher.key";
const OUTBOX = "nt-pacing:outbox";
const OVERLAY_CACHE = "nt-pacing:overlay";

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
    return false;
  }
}

async function call(path, { method = "GET", body = null } = {}) {
  const key = getKey();
  if (!key) {
    const err = new Error("no-key");
    err.status = 401;
    throw err;
  }
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-teacher-key": key },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ── Reference data ────────────────────────────────────────────────────────── */

/** The baseline and the curriculum, fetched once each. Both are static files. */
export async function loadReference() {
  const [baseline, launch] = await Promise.all([
    fetch("/data/pacing-baseline-2026-27.json").then((r) => r.json()),
    fetch("/data/curriculum-launch-manifest.json").then((r) => r.json()),
  ]);
  return { baseline, launch };
}

/* ── Overlay ───────────────────────────────────────────────────────────────── */

/**
 * The live overlay. Cache-first so the planner opens instantly and still opens
 * at all when the endpoint is unreachable; the server copy replaces it as soon
 * as it arrives.
 */
export function cachedOverlay() {
  return readJson(OVERLAY_CACHE, {});
}

export async function fetchState() {
  const data = await call("state");
  writeJson(OVERLAY_CACHE, data.overlay || {});
  return data;
}

/* ── Outbox ────────────────────────────────────────────────────────────────── */

const readOutbox = () => readJson(OUTBOX, []);
const writeOutbox = (q) => writeJson(OUTBOX, q);

export const pendingCount = () => readOutbox().length;

/**
 * Queue one operation and try to push it. The local overlay is updated
 * synchronously either way, so the UI reflects the edit immediately and a failed
 * push leaves the work on screen rather than reverting it under the teacher.
 *
 * @returns {Promise<{status: "saved"|"pending", error?: string}>}
 */
export async function enqueue(op) {
  const overlay = cachedOverlay();
  for (const w of op.writes) {
    const prior = overlay[w.date] || {};
    const merged = { ...prior, updatedAt: Date.now() };
    if ("plan" in w) {
      if (w.plan) merged.plan = w.plan;
      else delete merged.plan;
    }
    if ("actual" in w) {
      if (w.actual) merged.actual = w.actual;
      else delete merged.actual;
    }
    if ("note" in w) {
      if (w.note) merged.note = w.note;
      else delete merged.note;
    }
    if ("locked" in w) {
      if (w.locked) merged.locked = true;
      else delete merged.locked;
    }
    overlay[w.date] = merged;
  }
  writeJson(OVERLAY_CACHE, overlay);

  const queue = readOutbox();
  queue.push({ ...op, queuedAt: Date.now(), id: `${Date.now()}-${queue.length}` });
  writeOutbox(queue);
  return drain();
}

/** Push everything queued. Stops at the first failure, keeping order. */
export async function drain() {
  let queue = readOutbox();
  if (queue.length === 0) return { status: "saved" };

  while (queue.length) {
    const op = queue[0];
    try {
      await call("writes", {
        method: "POST",
        body: { writes: op.writes, inverse: op.inverse || [], kind: op.kind, summary: op.summary },
      });
      queue = readOutbox().slice(1);
      writeOutbox(queue);
    } catch (err) {
      return {
        status: "pending",
        error:
          err.status === 401
            ? "Enter your teacher key to save."
            : `Not saved yet — ${err.message}. Your edits are kept on this device and will retry.`,
      };
    }
  }
  return { status: "saved" };
}

export async function undoLast() {
  if (readOutbox().length) {
    const drained = await drain();
    if (drained.status !== "saved") {
      throw new Error("There are unsaved changes still waiting to send. Undo after they save.");
    }
  }
  const result = await call("undo", { method: "POST", body: {} });
  await fetchState();
  return result;
}

export async function resetDay(date) {
  const result = await call(`day/${date}`, { method: "DELETE" });
  await fetchState();
  return result;
}

export const changesFor = (date) => call(`changes?date=${encodeURIComponent(date)}`);

/** Retry the outbox whenever the browser says the network came back. */
export function watchConnectivity(onResult) {
  const retry = () =>
    drain()
      .then(onResult)
      .catch(() => {});
  window.addEventListener("online", retry);
  return retry;
}

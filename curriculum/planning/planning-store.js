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

import { effectiveOverlay, normalizeSection, SHARED } from "/shared/pacing/sections.js";

const API = "/api/pacing";
const KEY_STORAGE = "neft.teacher.key";
const OUTBOX = "nt-pacing:outbox";

/* CACHE KEYS ARE PER LAYER. One `nt-pacing:overlay` key held the whole planner
 * before classes existed; keeping it would mean 601's cached plan being served
 * to 602 on the next open, offline, with no way to tell. The shared plan gets
 * its own key too, because it is a real layer and not "601's leftovers". */
const overlayKey = (section) => `nt-pacing:overlay:${section || "shared"}`;

/* The active class, remembered across sessions and shared with the rest of the
 * teacher surfaces through the key the hub picker already writes. */
const TEACHER_STATE_KEY = "curriculumTeacherWorkflow:v1";

export function activeSection() {
  try {
    const raw = JSON.parse(localStorage.getItem(TEACHER_STATE_KEY) || "{}");
    return normalizeSection(raw?.section);
  } catch {
    return SHARED;
  }
}

/** Persist the active class where every other teacher surface reads it, so
 *  picking 602 in the planner and picking 602 on the hub are the same act. */
export function setActiveSection(section) {
  const next = normalizeSection(section);
  try {
    const raw = JSON.parse(localStorage.getItem(TEACHER_STATE_KEY) || "{}");
    raw.section = next;
    localStorage.setItem(TEACHER_STATE_KEY, JSON.stringify(raw));
  } catch {
    /* storage blocked — the section still applies for this page view */
  }
  return next;
}

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

async function call(path, { method = "GET", body = null, section = null } = {}) {
  /* The teacher key still comes from localStorage here. The unified sign-in that
   * replaces it (functions/_lib/teacher-auth.js) is a separate, still-unshipped
   * commit waiting on its production secrets, and the planner must not wait for
   * it — so this keeps the credential mechanism production already has and adds
   * only the section scoping on top. When auth lands it replaces these six lines
   * and nothing else in this file. */
  const key = getKey();
  if (!key) {
    const err = new Error("no-key");
    err.status = 401;
    throw err;
  }
  /* The section travels on the QUERY STRING, not in the body, so it is present
   * on GET and DELETE too and there is exactly one place the server reads it. */
  const scope = section == null ? activeSection() : normalizeSection(section);
  const join = path.includes("?") ? "&" : "?";
  const url = `${API}/${path}${scope ? `${join}section=${encodeURIComponent(scope)}` : ""}`;
  const res = await fetch(url, {
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
/** The EFFECTIVE overlay for a class: the cached shared layer with the cached
 *  class layer composed over it. Composed on read rather than stored merged, so
 *  switching class is instant and never needs the network. */
export function cachedOverlay(section = null) {
  const scope = section == null ? activeSection() : normalizeSection(section);
  const shared = readJson(overlayKey(SHARED), {});
  if (!scope) return shared;
  return effectiveOverlay(shared, readJson(overlayKey(scope), {}));
}

/** The two layers separately, for the UI to say which one a value came from. */
export function cachedLayers(section = null) {
  const scope = section == null ? activeSection() : normalizeSection(section);
  return {
    section: scope,
    shared: readJson(overlayKey(SHARED), {}),
    class: scope ? readJson(overlayKey(scope), {}) : {},
  };
}

export async function fetchState(section = null) {
  const scope = section == null ? activeSection() : normalizeSection(section);
  const data = await call("state", { section: scope });
  /* Cache each LAYER under its own key. Caching only the merged result would
   * make the shared plan unrecoverable once a class had overridden a day. */
  writeJson(overlayKey(SHARED), data.sharedOverlay || {});
  if (scope) writeJson(overlayKey(scope), data.classOverlay || {});
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
export async function enqueue(op, section = null) {
  /* The operation is STAMPED with the class it belongs to, at queue time. This
   * is what stops an offline 601 edit replaying into 602: drain() sends each
   * entry to the section recorded on it, not to whichever class happens to be
   * selected when the network comes back. */
  const scope = section == null ? activeSection() : normalizeSection(section);
  const key = overlayKey(scope);
  const overlay = readJson(key, {});
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
  writeJson(key, overlay);

  const queue = readOutbox();
  queue.push({ ...op, section: scope, queuedAt: Date.now(), id: `${Date.now()}-${queue.length}` });
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
        section: op.section ?? SHARED,
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

export async function undoLast(section = null) {
  if (readOutbox().length) {
    const drained = await drain();
    if (drained.status !== "saved") {
      throw new Error("There are unsaved changes still waiting to send. Undo after they save.");
    }
  }
  const scope = section == null ? activeSection() : normalizeSection(section);
  const result = await call("undo", { method: "POST", body: {}, section: scope });
  await fetchState(scope);
  return result;
}

export async function resetDay(date, section = null) {
  const scope = section == null ? activeSection() : normalizeSection(section);
  const result = await call(`day/${date}`, { method: "DELETE", section: scope });
  await fetchState(scope);
  return result;
}

export const changesFor = (date, section = null) =>
  call(`changes?date=${encodeURIComponent(date)}`, { section });

/** Retry the outbox whenever the browser says the network came back. */
export function watchConnectivity(onResult) {
  const retry = () =>
    drain()
      .then(onResult)
      .catch(() => {});
  window.addEventListener("online", retry);
  return retry;
}

// Vocabulary Academy — progress storage (SPEC §4, §10). Core-owned.
//
// One JSON record under VA_KEY, written through the lab's `storage` (util.js: localStorage with an in-tab fallback).
// The save state is reported truthfully: "saving" while a write runs, "saved" when the browser accepted it, and
// "error-recoverable" when it did not (private mode, blocked or full storage): the work is then held in this tab only,
// and the UI tells the learner to export a Passport code. The Passport export/import and Start Fresh paths already
// cover every `accessPracticeLab:v1:*` key; src/store.js merges this record with mergeProgress() on import.
import { audienceRecord, AUDIENCE_KEY } from "../audience.js";
import { loadLink } from "../class/link.js";
import { safeJson, storage } from "../util.js";
import { VA_KEY } from "./contract.js";
import { blankProgress, cleanProgress, mergeProgress } from "./model.js";

/** An unreadable record is copied here once before it can be overwritten, so nothing is silently destroyed. */
export const CORRUPT_KEY = `${VA_KEY}:corrupt`;
const SITE_KEY = "accessPracticeLabClass:v1:site-key";

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** This device's progress (always a valid object; unreadable storage yields a blank record and keeps a copy). */
export function loadProgress() {
  const raw = storage.get(VA_KEY);
  if (raw == null) return blankProgress();
  const parsed = safeJson(raw, undefined);
  if (isObject(parsed) && parsed.v === 1) return cleanProgress(parsed);
  if (storage.get(CORRUPT_KEY) == null) storage.set(CORRUPT_KEY, String(raw).slice(0, 2_000_000));
  return blankProgress();
}

// ── save state ──────────────────────────────────────────────────────────────────────────────
const listeners = new Set();
let current = { state: "saved", reason: "" };
function emit(next) {
  current = next;
  for (const fn of [...listeners])
    try {
      fn({ ...next });
    } catch {
      // a broken listener never breaks a save
    }
  try {
    globalThis.dispatchEvent?.(new CustomEvent("va:savestate", { detail: { ...next } }));
  } catch {
    // non-browser host
  }
}
/** Latest save state: { state: "saved" | "saving" | "error-recoverable", reason }. */
export const getSaveState = () => ({ ...current });
/** Subscribe to save-state changes. Returns the unsubscribe function. */
export function onSaveState(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Persist progress. Returns { state, reason } synchronously ("saving" is announced to listeners first). */
export function saveProgress(progress) {
  emit({ state: "saving", reason: "" });
  let result;
  try {
    const data = isObject(progress) ? { ...progress, v: 1 } : blankProgress();
    const stored = storage.set(VA_KEY, JSON.stringify(data));
    result = stored
      ? { state: "saved", reason: "" }
      : { state: "error-recoverable", reason: "storage-unavailable" };
  } catch (error) {
    result = {
      state: "error-recoverable",
      reason: error?.name === "TypeError" ? "unserializable" : "write-failed",
    };
  }
  emit(result);
  return { ...result };
}

// ── export / import ─────────────────────────────────────────────────────────────────────────
/** A plain, JSON-safe copy of this device's progress (what a backup file or teacher export carries). */
export const exportProgress = () => cleanProgress(loadProgress());

/**
 * Merge a backup into this device's progress and save. Throws a plain-language Error for something that is not a
 * Vocabulary Academy record (nothing is changed). Returns { state, reason, words }.
 */
export function importProgress(obj) {
  if (!isObject(obj) || obj.v !== 1)
    throw new Error("That file is not a Vocabulary Academy backup. Nothing was loaded.");
  const merged = mergeProgress(loadProgress(), obj);
  const result = saveProgress(merged);
  return { ...result, words: Object.keys(merged.words).length };
}

// ── teacher mode ────────────────────────────────────────────────────────────────────────────
/**
 * Whether teacher-only surfaces may render on this device. This is the lab's existing mechanism and nothing new:
 * the audience memory (src/audience.js — set by the Teacher Hub or the Teachers link, replaced when the Student Hub
 * opens) or the site teacher key typed in this tab (src/class/roster-panel.js) — and never on a device that is linked
 * to a class as a student (src/class/link.js). It is a convenience for hiding teacher content from learners, not
 * authentication; real gating of teacher URLs is the server's password gate.
 */
export function isTeacherMode() {
  try {
    if (loadLink()) return false;
  } catch {
    // an unreadable link record is treated as no link
  }
  try {
    if (audienceRecord(storage.get(AUDIENCE_KEY)).audience === "teacher") return true;
  } catch {
    // unreadable audience record: treat as a student
  }
  try {
    return Boolean(globalThis.sessionStorage?.getItem(SITE_KEY));
  } catch {
    return false;
  }
}

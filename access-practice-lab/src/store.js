// Progress + preferences, on this device only (no accounts, no uploads).
//
// Storage keys are a compatibility contract with every student who used the
// pre-2026-10 lab: grades 6–8 progress stays at `accessPracticeLab:v1:<Domain>:<Level>`
// and tests at `accessPracticeLab:v1:test:<id>`. Grades 3–5 progress is
// namespaced `accessPracticeLab:v1:g3-5:<Domain>:<Level>`. Older records stored
// answers in per-type maps (selected/multi/cloze/hot/order/sortAnswers); they are
// read transparently and new answers are written to `answers`.
import { safeJson, storage, todayISO } from "./util.js";

export const PREFIX = "accessPracticeLab:v1";
const PREFS_KEY = `${PREFIX}:prefs`;
const LEGACY_MAPS = ["selected", "multi", "cloze", "hot", "order", "sortAnswers"];

export const progressKey = (band, domain, level) =>
  band === "3-5" ? `${PREFIX}:g3-5:${domain}:${level}` : `${PREFIX}:${domain}:${level}`;
export const testKey = (id) => `${PREFIX}:test:${id}`;

// ── preferences ───────────────────────────────────────────────────────────────
const DEFAULT_PREFS = { band: "", tiers: {}, rate: 0.9, textSize: 1, lang: "en", focus: "" };
export function getPrefs() {
  const saved = safeJson(storage.get(PREFS_KEY), {}) || {};
  const prefs = { ...DEFAULT_PREFS, ...saved, tiers: { ...(saved.tiers || {}) } };
  // The old lab's single "pathway" (A/B/C) becomes every domain's starting tier.
  const legacyPathway = storage.get(`${PREFIX}:pathway`);
  if (legacyPathway && !saved.tiersMigrated) {
    for (const d of ["Listening", "Reading", "Speaking", "Writing"])
      prefs.tiers[d] ||= ["A", "B", "C"].includes(legacyPathway) ? legacyPathway : "A";
    prefs.tiersMigrated = true;
  }
  return prefs;
}
export function setPrefs(patch) {
  const next = { ...getPrefs(), ...patch };
  storage.set(PREFS_KEY, JSON.stringify(next));
  return next;
}

export const getStudentName = () => storage.get(`${PREFIX}:studentName`) || "";
export const setStudentName = (name) =>
  storage.set(`${PREFIX}:studentName`, String(name || "").slice(0, 60));

export function needsReview(result) {
  return Boolean(result && (
    result.ok === false || result.meaningful === false || result.words === 0 ||
    result.practiced === false || ["draft", "attempted"].includes(result.evidence)
  ));
}

export function isActivityComplete(record, id) {
  return Boolean(record.complete?.includes(id) && !needsReview(record.results?.[id]));
}

// ── per-level progress records ────────────────────────────────────────────────
export function loadRecord(band, domain, level) {
  const r = safeJson(storage.get(progressKey(band, domain, level)), {}) || {};
  return {
    ...r,
    complete: Array.isArray(r.complete) ? r.complete.filter((id) => !needsReview(r.results?.[id])) : [],
    answers: r.answers || {},
    notes: r.notes || {},
    results: r.results || {},
    selfChecks: r.selfChecks || {},
    practiced: r.practiced || {},
    attempts: r.attempts || {},
    drafts: r.drafts || {},
    reflections: r.reflections || {},
    evidence: r.evidence || {},
  };
}
export function saveRecord(band, domain, level, record) {
  return storage.set(progressKey(band, domain, level), JSON.stringify(record));
}

/** The stored answer for one activity, including answers saved by the old lab. */
export function answerOf(record, id) {
  if (id in record.answers) return record.answers[id];
  for (const map of LEGACY_MAPS) if (record[map] && id in record[map]) return record[map][id];
  return undefined;
}

// ── tests ─────────────────────────────────────────────────────────────────────
export const loadTestRecord = (id) => safeJson(storage.get(testKey(id)), {}) || {};
export const saveTestRecord = (id, record) => storage.set(testKey(id), JSON.stringify(record));
export const clearTestRecord = (id) => storage.remove(testKey(id));

// ── whole-device views (passport, export) ─────────────────────────────────────
/** Every saved level record: [{band, domain, level, record}]. */
export function allRecords() {
  const out = [];
  for (const key of storage.keys()) {
    if (!key.startsWith(`${PREFIX}:`)) continue;
    const rest = key.slice(PREFIX.length + 1).split(":");
    let band = "6-8";
    if (rest[0] === "g3-5") {
      band = "3-5";
      rest.shift();
    }
    if (rest.length !== 2 || ["test", "prefs", "studentName", "pathway"].includes(rest[0]))
      continue;
    const [domain, level] = rest;
    out.push({ band, domain, level, record: loadRecord(band, domain, level) });
  }
  return out;
}

/** Days with any saved result, newest first (ISO dates). */
export function practiceDays() {
  const days = new Set();
  for (const { record } of allRecords())
    for (const r of Object.values(record.results))
      if (r?.date && r.meaningful !== false && r.words !== 0 && r.practiced !== false) days.add(todayISO(new Date(r.date)));
  for (const key of storage.keys())
    if (key.startsWith(`${PREFIX}:test:`)) {
      const t = loadTestRecord(key.slice(`${PREFIX}:test:`.length));
      if (t.results?.date && (t.results.meaningful ?? t.results.sections?.some((s) => s.openDone > 0 || s.attempted > 0 || s.correct > 0))) days.add(todayISO(new Date(t.results.date)));
    }
  return [...days].sort().reverse();
}

/** Consecutive practice WEEKS (Mon-start) ending this week or last week. */
export function weekStreak(days = practiceDays()) {
  const weekOf = (iso) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return todayISO(d);
  };
  const weeks = new Set(days.map(weekOf));
  let cursor = new Date();
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  if (!weeks.has(todayISO(cursor))) cursor.setDate(cursor.getDate() - 7);
  let n = 0;
  while (weeks.has(todayISO(cursor))) {
    n++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return n;
}

// ── portable progress code (move between devices without an account) ────────
export function exportCode() {
  const data = {};
  for (const key of storage.keys()) if (key.startsWith(`${PREFIX}:`)) data[key] = storage.get(key);
  const json = JSON.stringify({ v: 1, data });
  return `ACCESS1.${btoa(unescape(encodeURIComponent(json)))}`;
}
const RECORD_MAPS = ["answers", ...LEGACY_MAPS, "notes", "results", "selfChecks", "practiced",
  "attempts", "drafts", "reflections", "evidence", "supportUsed", "attemptHistory"];
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isProgressKey = (key) => /^(?:g3-5:)?(?:Listening|Reading|Speaking|Writing|Model-Test):[ABC]$/.test(key.slice(PREFIX.length + 1));

/** Keep each existing activity intact. Import only activities absent on this device.
 * No timestamp comparison: older lab versions did not timestamp every edit.
 */
function mergeRecord(local, incoming) {
  const localIds = new Set([
    ...(local.complete || []),
    ...RECORD_MAPS.flatMap((map) => Object.keys(local[map] || {})),
  ]);
  const merged = { ...incoming, ...local };
  for (const map of RECORD_MAPS) {
    merged[map] = Object.fromEntries([
      ...Object.entries(incoming[map] || {}).filter(([id]) => !localIds.has(id)),
      ...Object.entries(local[map] || {}),
    ]);
  }
  merged.complete = [...new Set([
    ...(local.complete || []),
    ...(incoming.complete || []).filter((id) => !localIds.has(id)),
  ])];
  return merged;
}

/** Shared by Passport and site Save/Resume. Validate before changing any storage. */
export function importProgressData(data) {
  if (!isObject(data)) throw new Error("That backup does not contain valid progress.");
  const writes = [];
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(`${PREFIX}:`) || typeof value !== "string") continue;
    const suffix = key.slice(PREFIX.length + 1);
    const progress = isProgressKey(key);
    if (!progress && !/^(?:prefs|studentName|pathway|test:[a-zA-Z0-9_-]+)$/.test(suffix)) continue;
    const current = storage.get(key);
    if (progress || suffix === "prefs" || suffix.startsWith("test:")) {
      const incoming = safeJson(value, null);
      if (!isObject(incoming)) throw new Error("That backup has an invalid progress record. Nothing was loaded.");
      if (progress && ((incoming.complete !== undefined && (!Array.isArray(incoming.complete) || incoming.complete.some((id) => typeof id !== "string"))) ||
        RECORD_MAPS.some((map) => incoming[map] !== undefined && !isObject(incoming[map])))) {
        throw new Error("That backup has an invalid activity record. Nothing was loaded.");
      }
      if (current !== null) {
        const local = safeJson(current, null);
        // Unreadable local data must also be preserved, not silently replaced.
        if (!progress || !isObject(local)) continue;
        const merged = JSON.stringify(mergeRecord(local, incoming));
        if (merged !== current) writes.push([key, merged]);
        continue;
      }
    } else if (current !== null) continue;
    writes.push([key, value]);
  }
  for (const [key, value] of writes) storage.set(key, value);
  return writes.length;
}

export function importCode(code) {
  let parsed;
  try {
    const text = String(code || "").trim();
    if (!text.startsWith("ACCESS1.")) throw new Error();
    parsed = JSON.parse(decodeURIComponent(escape(atob(text.slice(8)))));
  } catch {
    throw new Error("That code is not a progress code. Paste the full ACCESS1 code.");
  }
  if (!parsed || parsed.v !== 1) throw new Error("That code is not a progress code.");
  return importProgressData(parsed.data);
}
export function clearAll() {
  for (const key of storage.keys()) if (key.startsWith(`${PREFIX}:`)) storage.remove(key);
}

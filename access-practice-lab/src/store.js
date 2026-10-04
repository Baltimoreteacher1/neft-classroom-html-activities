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

// ── per-level progress records ────────────────────────────────────────────────
export function loadRecord(band, domain, level) {
  const r = safeJson(storage.get(progressKey(band, domain, level)), {}) || {};
  return {
    ...r,
    complete: Array.isArray(r.complete) ? r.complete : [],
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
export function importCode(code) {
  const body = String(code || "")
    .trim()
    .replace(/^ACCESS1\./, "");
  const parsed = safeJson(decodeURIComponent(escape(atob(body))), null);
  if (!parsed || parsed.v !== 1 || typeof parsed.data !== "object")
    throw new Error("That code is not a progress code.");
  let n = 0;
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!key.startsWith(`${PREFIX}:`) || typeof value !== "string") continue;
    storage.set(key, value);
    n++;
  }
  return n;
}
export function clearAll() {
  for (const key of storage.keys()) if (key.startsWith(`${PREFIX}:`)) storage.remove(key);
}

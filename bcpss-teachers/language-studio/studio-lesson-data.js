// Language Studio Player — lessons: data loading, URL/route helpers and on-device records.
// Everything a student earns (stars, ratings, last step, home-language choice) stays in localStorage under the
// `bcpss-lesson:` prefix. Nothing here sends student data anywhere.
import { storeGet, storeSet } from "./studio-core.js";

export const DRAFT_SOURCE = "draft_standards_based";
export const DRAFT_TEXT = "Draft: align to your pacing guide";
export const ARC_LABELS = {
  warm_up: "Warm Up",
  input: "Input",
  notice: "Notice",
  interact: "Interact",
  produce: "Produce",
  check: "Check",
};
const LESSON_ID = /^[a-z0-9-]{6,40}$/;
const cache = new Map();

/** Language-demand band: low < 0.45, medium < 0.6, high >= 0.6. */
export function demandLevel(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return "medium";
  return s < 0.45 ? "low" : s < 0.6 ? "medium" : "high";
}

// ---------- API ----------
async function getJson(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}
/** Resolves to `{lessons, draft_notice, source}`, null when the unit has no lessons; rejects on network/server errors. */
export const loadUnitLessons = (unitId) =>
  getJson(`/api/bcpss/units/${encodeURIComponent(unitId)}/lessons`);
/** Resolves to the full lesson, null when it does not exist; rejects on network/server errors. */
export const loadLessonById = (lessonId) =>
  getJson(`/api/bcpss/lessons/${encodeURIComponent(lessonId)}`);

// ---------- route ----------
/** `?lesson=` route (or null). `lesson` is "" when the id is malformed. */
export function lessonRoute(search = window.location.search) {
  const p = new URLSearchParams(search);
  if (!p.has("lesson")) return null;
  const lesson = (p.get("lesson") || "").toLowerCase();
  return {
    lesson: LESSON_ID.test(lesson) ? lesson : "",
    step: p.get("step") || "",
    track: p.get("track") === "newcomer" ? "newcomer" : "",
    view: p.get("view") === "student" ? "student" : "teacher",
  };
}

/** Lesson params to carry across a level change; null outside a lesson. */
export function lessonKeep() {
  const r = lessonRoute();
  if (!r) return null;
  const keep = { lesson: r.lesson };
  if (r.step) keep.step = r.step;
  if (r.track) keep.track = r.track;
  if (r.view === "student") keep.view = "student";
  return keep;
}

function lessonParams(app, { lesson, step, track, view }, withLevel) {
  const p = new URLSearchParams();
  p.set("unit", app.unitId);
  p.set("lesson", lesson);
  if (step) p.set("step", String(step));
  if (track === "newcomer") p.set("track", "newcomer");
  if (view === "student") p.set("view", "student");
  if (withLevel) p.set("level", app.level);
  return p;
}
export const lessonHref = (app, route) =>
  `${window.location.pathname}?${lessonParams(app, route, true)}`;
/** Absolute link for a student device (no level: the student picks their own). */
export const studentUrl = (app, route) =>
  `${window.location.origin}${window.location.pathname}?${lessonParams(app, { ...route, view: "student" }, false)}`;
export const unitHref = (app) =>
  `${window.location.pathname}?unit=${encodeURIComponent(app.unitId)}&level=${app.level}`;

/** Update the address bar without re-rendering. */
export function replaceLessonUrl(app, route) {
  try {
    window.history.replaceState(null, "", lessonHref(app, route));
  } catch {
    /* address bar stays as it was */
  }
}
/** Push (or replace) a lesson URL and re-run the router. */
export function goLesson(app, route, { replace = false } = {}) {
  const url = lessonHref(app, route);
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  app.route();
  if (!replace) window.scrollTo?.(0, 0);
}

// ---------- steps ----------
/** The steps a lesson shows for a track: the six-step arc, or the newcomer path. */
export function buildSteps(lesson, track) {
  if (track === "newcomer")
    return (lesson.newcomer_path || []).map((activity, i) => ({
      key: `n${i + 1}`,
      id: String(i + 1),
      label: activity.title,
      activity,
    }));
  return (lesson.arc || []).map((s, i) => ({
    key: `arc${i + 1}`,
    id: String(i + 1),
    label: ARC_LABELS[s.step] || s.step,
    activity: s.activity,
  }));
}
export const extensionStep = (lesson) =>
  lesson.extension
    ? { key: "ext", id: "ext", label: "Extension", activity: lesson.extension }
    : null;

// ---------- on-device records ----------
const recordKey = (lessonId) => `bcpss-lesson:${lessonId}`;
export const stateKey = (lessonId, stepKey) => `bcpss-lesson:state:${lessonId}:${stepKey}`;
const PREFS_KEY = "bcpss-lesson:prefs";

const isObj = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
/** `{ last: "<step id>", done: { <stepKey>: { stars, rating } } }` */
export function readRecord(lessonId) {
  const saved = storeGet(recordKey(lessonId));
  return { last: "", ...(isObj(saved) ? saved : {}), done: isObj(saved?.done) ? saved.done : {} };
}
export function writeRecord(lessonId, patch) {
  const next = { ...readRecord(lessonId), ...patch };
  storeSet(recordKey(lessonId), next);
  return next;
}
export const readPrefs = () => {
  const saved = storeGet(PREFS_KEY);
  return { es: isObj(saved) && saved.es === true };
};
export const writePrefs = (patch) => storeSet(PREFS_KEY, { ...readPrefs(), ...patch });

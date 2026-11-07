// Thematic units: progress on this device and the pure rules the unit views share. No DOM.
//
// One key (`accessPracticeLab:v1:units`, versioned) holds every unit's progress so the Passport export carries it.
// Shape per unit id:
//   steps   { "<lesson>": [stepIndex, ...] }          steps the learner finished (read/listen steps finish by answering)
//   ans     { "<text>:<q>" | "v:<term>": { pick, ok, tries, miss } }   comprehension and vocabulary answers
//   text    { "<taskId>" | "reflect:<lesson>:<i>": "..." }  drafts and reflections, saved as they type
//   checks  { "<taskId>": [checkIndex, ...] }          self-checks ticked on a speaking or writing task
//   task    { steps: [i, ...], rubric: { "<i>": 0|1|2 }, done: bool }   the performance task
//   level   "easier" | "on" | "richer"                 which version of the anchor text the learner reads
//   cert    { name, at }                               the certificate, once earned
// Nothing here is a score or a level: it is the learner's own record of what they did.
import { isActivityComplete } from "../store.js";

export const UNITS_KEY = "accessPracticeLab:v1:units";
export const UNITS_VERSION = 1;
export const TEXT_LEVELS = ["easier", "on", "richer"];
export const LESSON_IDS = ["1", "2", "3", "4", "5"];

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const ints = (v, max = 40) =>
  Array.isArray(v)
    ? [...new Set(v.filter((n) => Number.isInteger(n) && n >= 0 && n < max))].sort((a, b) => a - b)
    : [];

function normalizeUnit(raw) {
  const u = isObj(raw) ? raw : {};
  const steps = {};
  for (const [k, v] of Object.entries(isObj(u.steps) ? u.steps : {}))
    if (LESSON_IDS.includes(k)) steps[k] = ints(v);
  const ans = {};
  for (const [k, v] of Object.entries(isObj(u.ans) ? u.ans : {}))
    if (/^[a-z0-9]+:\d+$/.test(k) && isObj(v) && Number.isInteger(v.pick))
      ans[k] = {
        pick: v.pick,
        ok: v.ok === true,
        tries: Math.max(1, Math.min(9, Number(v.tries) || 1)),
        miss: ints(v.miss, 8),
      };
  const text = {};
  for (const [k, v] of Object.entries(isObj(u.text) ? u.text : {}))
    if (typeof v === "string" && /^[\w:-]{1,40}$/.test(k)) text[k] = v.slice(0, 4000);
  const checks = {};
  for (const [k, v] of Object.entries(isObj(u.checks) ? u.checks : {}))
    if (/^[\w-]{1,40}$/.test(k)) checks[k] = ints(v, 12);
  const t = isObj(u.task) ? u.task : {};
  const rubric = {};
  for (const [k, v] of Object.entries(isObj(t.rubric) ? t.rubric : {}))
    if (/^[0-3]$/.test(k) && [0, 1, 2].includes(v)) rubric[k] = v;
  const cert =
    isObj(u.cert) && typeof u.cert.at === "string"
      ? { name: String(u.cert.name || "").slice(0, 40), at: u.cert.at.slice(0, 10) }
      : null;
  return {
    steps,
    ans,
    text,
    checks,
    task: { steps: ints(t.steps, 12), rubric, done: t.done === true },
    level: TEXT_LEVELS.includes(u.level) ? u.level : "on",
    cert,
  };
}

/** Saved progress, read defensively: anything unreadable becomes an empty record, never an exception. */
export function normalizeUnits(raw) {
  const units = {};
  for (const [id, v] of Object.entries(isObj(raw?.units) ? raw.units : {}))
    if (/^[a-z0-9-]{1,40}$/.test(id)) units[id] = normalizeUnit(v);
  return { v: UNITS_VERSION, units };
}

export function loadUnitsState(storage = globalThis.localStorage) {
  try {
    return normalizeUnits(JSON.parse(storage?.getItem(UNITS_KEY) || "null"));
  } catch {
    return normalizeUnits(null);
  }
}

export function saveUnitsState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(UNITS_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** One unit's record (a fresh one when the learner has not started it). Mutating it mutates `state`. */
export function unitRecord(state, id) {
  state.units[id] ||= normalizeUnit(null);
  return state.units[id];
}

export function setStep(rec, lessonId, index, on) {
  const list = new Set(rec.steps[lessonId] || []);
  if (on) list.add(index);
  else list.delete(index);
  rec.steps[lessonId] = [...list].sort((a, b) => a - b);
}

export function setTaskStep(rec, index, on) {
  const list = new Set(rec.task.steps);
  if (on) list.add(index);
  else list.delete(index);
  rec.task.steps = [...list].sort((a, b) => a - b);
}

export const textOf = (unit, key) => unit.texts[key];

/** A text's questions all answered correctly (a text with no questions counts as read once opened). */
export function textDone(unit, rec, key) {
  const qs = textOf(unit, key)?.questions || [];
  return qs.length > 0 && qs.every((_, i) => rec.ans[`${key}:${i}`]?.ok);
}

/** The activities index row for an id, from content/index.json: { band, domain, level, title, type, minutes }. */
export function activityLocator(index, band) {
  const map = new Map();
  for (const [domain, d] of Object.entries(index?.bands?.[band]?.domains || {}))
    for (const [level, L] of Object.entries(d.levels || {}))
      for (const [id, title, type, , minutes] of L.activities || [])
        map.set(id, { band, domain, level, title, type, minutes });
  return map;
}

/** Is one lesson step finished? `activityDone(id)` reads the lab's own activity record. */
export function stepDone(unit, rec, lesson, i, activityDone = () => false) {
  const s = lesson.steps[i];
  if (rec.steps[lesson.id]?.includes(i)) return true;
  if (s.t === "read" || s.t === "listen") return textDone(unit, rec, s.text);
  if (s.t === "activity") return activityDone(s.id);
  if (s.t === "vocab") return s.terms.every((i) => rec.ans[`v:${i}`]?.ok || !vocabCloze(unit.vocab[i]));
  return false;
}

/** The example sentence of a vocabulary word with the word blanked: { before, after } (or null when it is not in the sentence). */
export function vocabCloze(entry) {
  const base = String(entry?.term || "").trim();
  const sentence = String(entry?.ex?.en || "");
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`\\b${escaped}(?:s|es|ed|d|ing|ly)?\\b`, "i").exec(sentence);
  return m ? { before: sentence.slice(0, m.index), after: sentence.slice(m.index + m[0].length) } : null;
}

export function lessonProgress(unit, rec, lesson, activityDone) {
  const total = lesson.steps.length;
  const done = lesson.steps.filter((_, i) => stepDone(unit, rec, lesson, i, activityDone)).length;
  return { done, total, complete: total > 0 && done === total };
}

export const taskProgress = (unit, rec) => ({
  done: rec.task.steps.length,
  total: unit.task.steps.length,
  complete: rec.task.done === true,
});

/** Progress across the five lessons and the performance task. `pct` is a share of finished stops, not a score. */
export function unitProgress(unit, rec, activityDone) {
  const lessons = unit.lessons.map((l) => ({
    id: l.id,
    ...lessonProgress(unit, rec, l, activityDone),
  }));
  const task = taskProgress(unit, rec);
  const stops = lessons.length + 1;
  const finished = lessons.filter((l) => l.complete).length + (task.complete ? 1 : 0);
  const next = lessons.find((l) => !l.complete)?.id || (task.complete ? null : "task");
  const started = finished > 0 || lessons.some((l) => l.done > 0) || task.done > 0;
  return {
    lessons,
    task,
    finished,
    stops,
    pct: Math.round((finished / stops) * 100),
    next,
    started,
    complete: finished === stops,
  };
}

/** App-relative link to one stop of a unit. */
export const lessonRoute = (unitId, lessonId, band, base = "/access-practice-lab") =>
  `${base}/units/${unitId}/${lessonId}?grades=${band}`;

/** Activity-completion reader bound to the loaded index: (id) => boolean. */
export function activityDoneReader(locator, loadRecordFn) {
  const records = new Map();
  return (id) => {
    const loc = locator.get(id);
    if (!loc) return false;
    const key = `${loc.band}:${loc.domain}:${loc.level}`;
    if (!records.has(key)) records.set(key, loadRecordFn(loc.band, loc.domain, loc.level));
    return isActivityComplete(records.get(key), id);
  };
}

/** One tappable-term segmentation of `text`: [{ text }, { text, term: vocabIndex }, ...]. Longest terms win; whole words only. */
export function highlightTerms(text, vocab = []) {
  const entries = vocab
    .map((v, i) => ({
      i,
      base: String(v.term || "")
        .toLowerCase()
        .trim(),
    }))
    .filter((e) => e.base.length >= 3)
    .sort((a, b) => b.base.length - a.base.length);
  if (!entries.length) return [{ text }];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alternation = entries.map((e) => esc(e.base)).join("|");
  const re = new RegExp(`\\b(${alternation})(?:s|es|ed|d|ing|ly)?\\b`, "gi");
  const out = [];
  let at = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    const i = entries.find((e) => e.base === m[1].toLowerCase())?.i;
    out.push({ text: m[0], term: i });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

/** The class-platform assignment for one unit lesson (same shape as class/assign.js toAssignment). Ids stay under 40 characters. */
export function unitAssignment(unit, lesson, band, base = "/access-practice-lab") {
  const id = `u-${unit.id}-${lesson.id}`.slice(0, 40);
  return {
    id,
    title: `${unit.title.en}: ${lesson.title.en}`.slice(0, 80),
    path: lessonRoute(unit.id, lesson.id, band, base),
    due: null,
  };
}

export const taskAssignment = (unit, band, base = "/access-practice-lab") => ({
  id: `u-${unit.id}-task`.slice(0, 40),
  title: `${unit.title.en}: ${unit.task.title.en}`.slice(0, 80),
  path: `${base}/units/${unit.id}/task?grades=${band}`,
  due: null,
});

/** Every assignable stop of a band's units as class-assignment rows (5 lessons and the task per unit). */
export function unitAssignmentRows(units, band) {
  return units.flatMap((u) => [
    ...u.lessons.map((l) => ({ ...unitAssignment(u, l, band), unit: u.id })),
    { ...taskAssignment(u, band), unit: u.id },
  ]);
}

/** Minutes a lesson plan asks for (the sum of nothing invented: the authored lesson length). */
export const unitMinutes = (unit) => unit.lessons.reduce((n, l) => n + l.minutes, 0);

/** Share of finished stops across several units, for the hub header. */
export function bandProgress(units, state, activityDone) {
  let finished = 0;
  let stops = 0;
  for (const u of units) {
    const p = unitProgress(u, state.units[u.id] || normalizeUnit(null), activityDone);
    finished += p.finished;
    stops += p.stops;
  }
  return { finished, stops, pct: stops ? Math.round((finished / stops) * 100) : 0 };
}

/** Units this learner finished (certificate earned), for the Passport. */
export const earnedUnits = (units, state) => units.filter((u) => state.units[u.id]?.cert);

/** Record one choice on a question. Returns the answer record; a right answer is final, a miss is remembered so it stays crossed out. */
export function recordAnswer(rec, key, pick, ok) {
  const a = (rec.ans[key] ||= { pick, ok: false, tries: 0, miss: [] });
  if (a.ok) return a;
  a.pick = pick;
  a.tries = Math.min(9, a.tries + 1);
  if (ok) a.ok = true;
  else if (!a.miss.includes(pick)) a.miss.push(pick);
  return a;
}

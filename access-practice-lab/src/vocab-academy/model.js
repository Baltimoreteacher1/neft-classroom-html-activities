// Vocabulary Academy — learning model (SPEC §4, §10). Core-owned. Pure: no storage, no DOM, injectable clock.
//
// The progress object is open (unknown keys are preserved everywhere). Known shape:
//   { v:1, grade, pathway:"grade"|"support", words:{ [wordId]: entry }, units:{ [unitId]: unitRec }, last, prefs, daily }
// entry   = { ev:{ [dim]:{ c, n, last, cw, r, q } }, seen, first, lastDay, at, due, step, lapses, lapseDay, pend, rn, u, g }
//   ev[dim].c/n  correct / attempts; cw weighted correct credit (a correct answer with heavy support adds 0.5);
//   r the last three attempts ("1" correct, "h" correct with heavy support, "0" miss); q credit earned when the
//   word had not been seen for 7+ days (delayed retrieval). A word's state is DERIVED from this, never stored.
// The mutating functions (recordResult, markSeen, setUnitStage, recordAssessment, set*) change the progress object they
// are given and return it, so callers may ignore the return value or reassign it.
import { cleanReadingMap, mergeReadingMaps } from "./reading/marks.js";
import { DIMS, GRADES, HEAVY_SUPPORTS, LESSONS, REVIEW_PER_DAY, STATES } from "./contract.js";
import {
  INTERVAL_DAYS,
  addDays,
  clampReviewPerDay,
  daysBetween,
  dayKey,
  dueEntries,
  nextReview,
  reviewPerDay,
  reviewedToday,
  toDate,
} from "./srs.js";

const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const LETTERS = LESSONS.map((l) => l.id);
const HEAVY = new Set(HEAVY_SUPPORTS);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const num = (v, lo, hi, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const int = (v, lo, hi, fallback = 0) => Math.trunc(num(v, lo, hi, fallback));
const iso = (v) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) && v.length <= 40 ? v : null;
const day = (v) => (typeof v === "string" && DAY_RE.test(v) ? v : null);
const round2 = (n) => Math.round(n * 100) / 100;
/** Copy own, non-dangerous keys (so an imported object can never set a prototype). */
const passthrough = (o) => {
  const out = {};
  if (isObj(o)) for (const [k, v] of Object.entries(o)) if (!BAD_KEYS.has(k)) out[k] = v;
  return out;
};

export const blankProgress = () => ({
  v: 1,
  grade: "",
  pathway: "grade",
  words: {},
  units: {},
  last: null,
  prefs: {},
  daily: { day: "", words: [] },
});

// ── word state ──────────────────────────────────────────────────────────────────────────────
/** 1 for a normal correct answer, 0.5 when a heavy support (word bank, model, read-aloud, chunking) was used. */
export const supportWeight = (sup) =>
  Array.isArray(sup) && sup.some((k) => HEAVY.has(k)) ? 0.5 : 1;

const recentCredit = (d) =>
  [...(d?.r || "")].reduce((s, ch) => s + (ch === "1" ? 1 : ch === "h" ? 0.5 : 0), 0);
const lastWasMiss = (d) => (d?.r || "").endsWith("0");

/**
 * Derived state of a stored entry (or of wordEntry()'s result):
 *   new         no exposure and no answers
 *   learning    first exposure
 *   developing  a correct Meaning answer, OR Recognition correct in 2 of the last 3 (heavy-support answers count half)
 *   applying    developing, plus a correct In-context answer and at least one Using-it attempt
 *   secure      applying, plus delayed retrieval correct after 7+ days and 2+ dimensions correct in their latest attempts
 *   review-needed  a miss on a secure/applying word after its due date (cleared by the next correct answer on a due date)
 * One answer can never move a word past developing.
 */
export function wordState(entry) {
  if (!isObj(entry)) return "new";
  const ev = isObj(entry.ev) ? entry.ev : {};
  const attempts = DIMS.reduce((s, k) => s + (Number(ev[k]?.n) || 0), 0);
  if (!(Number(entry.seen) > 0) && attempts === 0) return "new";
  if (entry.rn) return "review-needed";
  const credit = (k) => Number(ev[k]?.cw) || 0;
  if (!(credit("mean") >= 1 || recentCredit(ev.rec) >= 2)) return "learning";
  if (!(credit("ctx") >= 1 && (Number(ev.prod?.n) || 0) > 0)) return "developing";
  const delayed = (Number(ev.delay?.q) || 0) >= 1 && !lastWasMiss(ev.delay);
  const independent = DIMS.filter((k) => recentCredit(ev[k]) >= 1 && !lastWasMiss(ev[k])).length;
  return delayed && independent >= 2 ? "secure" : "applying";
}

/** Read-only view of one word: { state, ev, due, step, lapses, seen } (all defaults for a word never met). */
export function wordEntry(progress, wordId) {
  const e = progress?.words?.[wordId];
  if (!isObj(e)) return { state: "new", ev: {}, due: null, step: 0, lapses: 0, seen: 0 };
  return {
    state: wordState(e),
    ev: JSON.parse(JSON.stringify(isObj(e.ev) ? e.ev : {})),
    due: e.due ?? null,
    step: Number(e.step) || 0,
    lapses: Number(e.lapses) || 0,
    seen: Number(e.seen) || 0,
  };
}

function ensureEntry(progress, wordId, when, meta = {}) {
  if (typeof wordId !== "string" || !ID_RE.test(wordId) || BAD_KEYS.has(wordId))
    throw new TypeError("recordResult needs a valid wordId");
  if (!isObj(progress)) throw new TypeError("progress must be an object");
  progress.words = isObj(progress.words) ? progress.words : {};
  let e = progress.words[wordId];
  const fresh = !isObj(e);
  if (fresh) {
    const d = dayKey(when);
    e = progress.words[wordId] = {
      ev: {},
      seen: 0,
      first: d,
      lastDay: d,
      at: toDate(when).toISOString(),
      due: addDays(d, INTERVAL_DAYS[0]),
      step: 0,
      lapses: 0,
      rn: false,
    };
  }
  if (typeof meta.unit === "string") e.u = meta.unit;
  if (meta.grade != null && GRADES.includes(String(meta.grade))) e.g = String(meta.grade);
  return { e, fresh };
}

/** First exposure (the word was shown or heard): the word becomes "learning" and is scheduled for tomorrow. */
export function markSeen(progress, wordId, { now, unit, grade } = {}) {
  const when = toDate(now);
  const { e, fresh } = ensureEntry(progress, wordId, when, { unit, grade });
  if (fresh) {
    e.seen = 1;
    progress.lastActive = toDate(when).toISOString();
  }
  return progress;
}

const dimRecord = (ev, dim) =>
  (ev[dim] = isObj(ev[dim]) ? ev[dim] : { c: 0, n: 0, last: null, cw: 0, r: "", q: 0 });
function addAttempt(d, ok, weight, gap, when) {
  d.n += 1;
  d.last = when;
  d.r = `${d.r || ""}${!ok ? "0" : weight < 1 ? "h" : "1"}`.slice(-3);
  if (ok) {
    d.c += 1;
    d.cw = round2((d.cw || 0) + weight);
    if (gap >= 7) d.q = round2((d.q || 0) + weight);
  }
}

/**
 * Record one answer as evidence about one word along one dimension.
 *  { wordId, dim, ok, sup:[support keys used], type, now, unit?, grade? }
 * A correct answer with a heavy support counts at half weight toward advancing state and the review step; it never
 * counts against the student. A result of type "review" also counts as delayed retrieval when the word had not been
 * seen since an earlier day, so review sessions advance a word whichever dimension their items test.
 */
export function recordResult(
  progress,
  { wordId, dim, ok, sup = [], type = "", now, unit, grade } = {},
) {
  if (!DIMS.includes(dim)) throw new RangeError(`Unknown evidence dimension "${dim}"`);
  const when = toDate(now);
  const stamp = when.toISOString();
  const today = dayKey(when);
  const correct = Boolean(ok);
  const weight = correct ? supportWeight(sup) : 0;
  const { e, fresh } = ensureEntry(progress, wordId, when, { unit, grade });
  e.ev = isObj(e.ev) ? e.ev : {};
  const before = wordState(e);
  const wasDue = !fresh && Boolean(e.due) && today >= e.due;
  const gap = fresh || !e.lastDay ? 0 : Math.max(0, daysBetween(e.lastDay, today));

  addAttempt(dimRecord(e.ev, dim), correct, weight, gap, stamp);
  if (type === "review" && dim !== "delay" && gap >= 1)
    addAttempt(dimRecord(e.ev, "delay"), correct, weight, gap, stamp);

  if (!correct && wasDue && (before === "secure" || before === "applying")) e.rn = true;
  else if (correct && wasDue && e.rn) e.rn = false;

  const { advanced, lapsed, ...schedule } = nextReview(e, correct, when, weight || 1);
  Object.assign(e, schedule);

  if (wasDue) {
    const daily =
      isObj(progress.daily) && progress.daily.day === today
        ? progress.daily
        : { day: today, words: [] };
    if (!daily.words.includes(wordId)) daily.words.push(wordId);
    progress.daily = daily;
  }
  e.seen = (Number(e.seen) || 0) + 1;
  e.lastDay = today;
  e.at = stamp;
  progress.lastActive = stamp;
  return progress;
}

/**
 * Words due on or before `now`, most overdue first. `limit` defaults to what is left of today's reviewPerDay (3–20,
 * default 8) after the words already reviewed today. Pass `grade` (+ optional `gradeOf(id)`) to restrict to one grade.
 */
export function dueWords(progress, { now, limit, grade, gradeOf } = {}) {
  const when = toDate(now);
  const cap =
    limit == null
      ? Math.max(0, reviewPerDay(progress) - reviewedToday(progress, when))
      : Math.max(0, Math.trunc(limit));
  return dueEntries(progress, when, { grade, gradeOf })
    .slice(0, cap)
    .map((x) => x.id);
}

// ── preferences ─────────────────────────────────────────────────────────────────────────────
export function setReviewPerDay(progress, n) {
  progress.prefs = isObj(progress.prefs) ? progress.prefs : {};
  progress.prefs.reviewPerDay = clampReviewPerDay(n);
  return progress;
}
export function setGrade(progress, grade) {
  const g = String(grade ?? "").toUpperCase();
  progress.grade = GRADES.includes(g) ? g : "";
  return progress;
}
export function setPathway(progress, pathway) {
  progress.pathway = pathway === "support" ? "support" : "grade";
  return progress;
}
export { reviewPerDay };

// ── units ───────────────────────────────────────────────────────────────────────────────────
function unitRec(progress, unitId) {
  if (typeof unitId !== "string" || !ID_RE.test(unitId) || BAD_KEYS.has(unitId))
    throw new TypeError("A valid unitId is required");
  progress.units = isObj(progress.units) ? progress.units : {};
  const u = (progress.units[unitId] = isObj(progress.units[unitId]) ? progress.units[unitId] : {});
  u.lessons = isObj(u.lessons) ? u.lessons : {};
  u.assess = isObj(u.assess) ? u.assess : {};
  return u;
}

/**
 * Patch one lesson of a unit ("a"–"h"): { done?, at?, now?, …any extra resume data such as pos or step }.
 * Also moves the resume pointer (progress.last) to this lesson, which is how Continue learning finds its place.
 */
export function setUnitStage(progress, unitId, lessonLetter, patch = {}) {
  const letter = String(lessonLetter ?? "").toLowerCase();
  if (!LETTERS.includes(letter)) throw new RangeError(`Unknown lesson "${lessonLetter}"`);
  const u = unitRec(progress, unitId);
  const { now, at, ...rest } = isObj(patch) ? patch : {};
  const stamp = iso(at) || toDate(now).toISOString();
  const prev = isObj(u.lessons[letter]) ? u.lessons[letter] : { done: false, at: null };
  const next = { ...prev, ...passthrough(rest) };
  next.done = rest.done === undefined ? Boolean(prev.done) : Boolean(rest.done);
  next.at = next.done ? (rest.done ? stamp : prev.at || stamp) : prev.at || null;
  next.seenAt = prev.seenAt || stamp;
  u.lessons[letter] = next;
  progress.last = { unit: unitId, lesson: letter, at: stamp };
  progress.lastActive = stamp;
  return progress;
}

/**
 * Status of a unit: { lessons:{a:{done,at}…h}, doneCount, assess:{A,B}, wordStates:{state:count} }.
 * `wordIds` (the unit's word ids) is optional; without it the counts cover words recorded with that unit id.
 */
export function unitStatus(progress, unitId, wordIds) {
  const u = isObj(progress?.units?.[unitId]) ? progress.units[unitId] : {};
  const lessons = {};
  let doneCount = 0;
  for (const letter of LETTERS) {
    const l = isObj(u.lessons?.[letter]) ? u.lessons[letter] : {};
    lessons[letter] = { ...l, done: Boolean(l.done), at: l.at || null };
    if (l.done) doneCount += 1;
  }
  const ids = Array.isArray(wordIds)
    ? wordIds
    : Object.entries(progress?.words || {})
        .filter(([, e]) => e?.u === unitId)
        .map(([id]) => id);
  const wordStates = Object.fromEntries(STATES.map((s) => [s, 0]));
  for (const id of ids) wordStates[wordState(progress?.words?.[id])] += 1;
  const assess = { A: u.assess?.A || null, B: u.assess?.B || null };
  return { lessons, doneCount, assess, wordStates };
}

/**
 * Store one assessment attempt for form "A" or "B":
 *  { score, total, perWord:{ [wordId]:{ ok } } }. Attempts are kept (latest 10) so parallel attempts can be compared.
 */
export function recordAssessment(progress, unitId, form, { score, total, perWord = {}, now } = {}) {
  const f = String(form ?? "").toUpperCase();
  if (f !== "A" && f !== "B") throw new RangeError(`Unknown assessment form "${form}"`);
  const u = unitRec(progress, unitId);
  const stamp = toDate(now).toISOString();
  const t = int(total, 0, 500);
  const attempt = {
    score: int(score, 0, Math.max(t, 0)),
    total: t,
    at: stamp,
    perWord: Object.fromEntries(
      Object.entries(isObj(perWord) ? perWord : {})
        .filter(([id]) => ID_RE.test(id) && !BAD_KEYS.has(id))
        .map(([id, v]) => [id, { ok: Boolean(v?.ok) }]),
    ),
  };
  const attempts = [
    ...(isObj(u.assess[f]) && Array.isArray(u.assess[f].attempts) ? u.assess[f].attempts : []),
    attempt,
  ].slice(-10);
  u.assess[f] = {
    ...attempt,
    attempts: attempts.map(({ score: s, total: tt, at }) => ({ score: s, total: tt, at })),
  };
  progress.lastActive = stamp;
  return progress;
}

/** Totals for a dashboard or teacher view: words by state, units begun/finished, dimension totals, review queue. */
export function studentSummary(progress, { now, gradeOf } = {}) {
  const when = toDate(now);
  const byState = Object.fromEntries(STATES.map((s) => [s, 0]));
  const dims = Object.fromEntries(DIMS.map((d) => [d, { c: 0, n: 0 }]));
  const words = Object.values(progress?.words || {});
  for (const e of words) {
    byState[wordState(e)] += 1;
    for (const d of DIMS) {
      dims[d].c += Number(e?.ev?.[d]?.c) || 0;
      dims[d].n += Number(e?.ev?.[d]?.n) || 0;
    }
  }
  const unitIds = Object.keys(progress?.units || {});
  const statuses = unitIds.map((id) => unitStatus(progress, id, []));
  const due = dueEntries(progress, when, { gradeOf }).length;
  return {
    grade: progress?.grade || "",
    pathway: progress?.pathway === "support" ? "support" : "grade",
    words: { total: words.length, byState },
    learned: byState.applying + byState.secure,
    dims,
    units: {
      started: unitIds.filter((id) => Object.keys(progress.units[id]?.lessons || {}).length > 0).length,
      completed: statuses.filter((st) => st.doneCount === LETTERS.length).length,
    },
    due,
    reviewPerDay: reviewPerDay(progress),
    lastActive: progress?.lastActive || null,
  };
}

// ── clean + merge (storage, import/export) ──────────────────────────────────────────────────
function cleanDim(d) {
  if (!isObj(d)) return null;
  const n = int(d.n, 0, 1e6);
  const c = Math.min(n, int(d.c, 0, 1e6));
  const r = typeof d.r === "string" && /^[01h]{0,3}$/.test(d.r) ? d.r : "";
  return {
    ...passthrough(d),
    c,
    n,
    last: iso(d.last),
    cw: Math.min(c, round2(num(d.cw, 0, 1e6))),
    r,
    q: round2(num(d.q, 0, 1e6)),
  };
}
function cleanEntry(e) {
  if (!isObj(e)) return null;
  const ev = {};
  for (const k of DIMS) {
    const d = cleanDim(e.ev?.[k]);
    if (d) ev[k] = d;
  }
  const out = {
    ...passthrough(e),
    ev,
    seen: int(e.seen, 0, 1e6),
    first: day(e.first),
    lastDay: day(e.lastDay),
    at: iso(e.at),
    due: day(e.due),
    step: int(e.step, 0, INTERVAL_DAYS.length - 1),
    lapses: int(e.lapses, 0, 1e6),
    lapseDay: day(e.lapseDay),
    pend: round2(num(e.pend, 0, 1)),
    rn: e.rn === true,
  };
  if (!(out.seen > 0) && !Object.keys(ev).length) out.seen = 0;
  if (e.u !== undefined) out.u = typeof e.u === "string" && ID_RE.test(e.u) ? e.u : undefined;
  if (e.g !== undefined) out.g = GRADES.includes(String(e.g)) ? String(e.g) : undefined;
  for (const k of ["u", "g", "first", "lastDay", "at", "due", "lapseDay"])
    if (out[k] == null) delete out[k];
  return out;
}
function cleanLessons(l) {
  const out = {};
  if (!isObj(l)) return out;
  for (const letter of LETTERS) {
    if (!isObj(l[letter])) continue;
    out[letter] = {
      ...passthrough(l[letter]),
      done: l[letter].done === true,
      at: iso(l[letter].at),
    };
  }
  return out;
}
function cleanAssess(a) {
  const out = {};
  if (!isObj(a)) return out;
  for (const f of ["A", "B"]) {
    const x = a[f];
    if (!isObj(x)) continue;
    const total = int(x.total, 0, 500);
    out[f] = {
      ...passthrough(x),
      score: int(x.score, 0, total),
      total,
      at: iso(x.at),
      perWord: Object.fromEntries(
        Object.entries(isObj(x.perWord) ? x.perWord : {})
          .filter(([id]) => ID_RE.test(id) && !BAD_KEYS.has(id))
          .map(([id, v]) => [id, { ok: v?.ok === true }]),
      ),
      attempts: (Array.isArray(x.attempts) ? x.attempts : [])
        .filter(isObj)
        .slice(-10)
        .map((t) => ({ score: int(t.score, 0, 500), total: int(t.total, 0, 500), at: iso(t.at) })),
    };
  }
  return out;
}

/** Normalise anything read from storage or an import into a valid progress object. Never throws; keeps unknown keys. */
export function cleanProgress(raw) {
  if (!isObj(raw)) return blankProgress();
  const out = { ...passthrough(raw), v: 1 };
  const g = String(raw.grade ?? "").toUpperCase();
  out.grade = GRADES.includes(g) ? g : "";
  out.pathway = raw.pathway === "support" ? "support" : "grade";
  out.words = {};
  if (isObj(raw.words))
    for (const [id, e] of Object.entries(raw.words)) {
      if (!ID_RE.test(id) || BAD_KEYS.has(id)) continue;
      const clean = cleanEntry(e);
      if (clean) out.words[id] = clean;
    }
  out.units = {};
  if (isObj(raw.units))
    for (const [id, u] of Object.entries(raw.units)) {
      if (!ID_RE.test(id) || BAD_KEYS.has(id) || !isObj(u)) continue;
      out.units[id] = {
        ...passthrough(u),
        lessons: cleanLessons(u.lessons),
        assess: cleanAssess(u.assess),
      };
    }
  const last = raw.last;
  out.last =
    isObj(last) &&
    typeof last.unit === "string" &&
    ID_RE.test(last.unit) &&
    LETTERS.includes(last.lesson)
      ? { unit: last.unit, lesson: last.lesson, at: iso(last.at) }
      : null;
  out.prefs = passthrough(raw.prefs);
  if (out.prefs.reviewPerDay !== undefined)
    out.prefs.reviewPerDay = clampReviewPerDay(out.prefs.reviewPerDay);
  const daily = raw.daily;
  out.daily =
    isObj(daily) && day(daily.day) && Array.isArray(daily.words)
      ? {
          day: daily.day,
          words: daily.words
            .filter((id) => typeof id === "string" && ID_RE.test(id))
            .slice(0, REVIEW_PER_DAY.max * 5),
        }
      : { day: "", words: [] };
  out.lastActive = iso(raw.lastActive) || undefined;
  if (out.lastActive === undefined) delete out.lastActive;
  // The interactive reader's saved marks, notes and retells (reading/marks.js): bounded and cleaned like everything else.
  if (raw.reading !== undefined) out.reading = cleanReadingMap(raw.reading);
  return out;
}

const later = (a, b) => ((a || "") >= (b || "") ? 0 : 1); // 0 → keep a (local), 1 → take b (incoming)
/**
 * Merge a backup into this device's progress without losing anything. Per word, the more recently updated record wins
 * (never a mix of two devices' counters, so importing twice changes nothing). Lessons done on either device stay done.
 * Unknown keys: this device wins, plain objects merge shallowly.
 */
export function mergeProgress(localRaw, incomingRaw) {
  const local = cleanProgress(localRaw);
  const incoming = cleanProgress(incomingRaw);
  const out = { ...incoming, ...local, v: 1 };
  for (const k of Object.keys(incoming))
    if (
      isObj(incoming[k]) &&
      isObj(local[k]) &&
      !["words", "units", "last", "prefs", "daily", "reading"].includes(k)
    )
      out[k] = { ...incoming[k], ...local[k] };
  const useLocalSetup = Boolean(local.grade);
  out.grade = local.grade || incoming.grade;
  out.pathway = useLocalSetup ? local.pathway : incoming.pathway;
  out.words = { ...incoming.words };
  for (const [id, e] of Object.entries(local.words))
    out.words[id] =
      incoming.words[id] && later(e.at, incoming.words[id].at) ? incoming.words[id] : e;
  out.units = { ...incoming.units };
  for (const [id, u] of Object.entries(local.units)) {
    const other = incoming.units[id];
    if (!other) {
      out.units[id] = u;
      continue;
    }
    const lessons = {};
    for (const letter of LETTERS) {
      const a = u.lessons[letter];
      const b = other.lessons[letter];
      if (!a || !b) lessons[letter] = a || b;
      else if (a.done !== b.done) lessons[letter] = a.done ? a : b;
      else lessons[letter] = later(a.at, b.at) ? b : a;
      if (!lessons[letter]) delete lessons[letter];
    }
    const assess = {};
    for (const f of ["A", "B"]) {
      const a = u.assess[f];
      const b = other.assess[f];
      if (!a || !b) assess[f] = a || b;
      else {
        const pick = later(a.at, b.at) ? b : a;
        const seen = new Map(
          [...(b.attempts || []), ...(a.attempts || [])].map((t) => [
            `${t.at}|${t.score}|${t.total}`,
            t,
          ]),
        );
        assess[f] = {
          ...pick,
          attempts: [...seen.values()]
            .sort((x, y) => (x.at || "").localeCompare(y.at || ""))
            .slice(-10),
        };
      }
      if (!assess[f]) delete assess[f];
    }
    out.units[id] = { ...other, ...u, lessons, assess };
  }
  out.last =
    local.last && incoming.last
      ? later(local.last.at, incoming.last.at)
        ? incoming.last
        : local.last
      : local.last || incoming.last;
  out.prefs = { ...incoming.prefs, ...local.prefs };
  out.daily = later(local.daily.day, incoming.daily.day) ? incoming.daily : local.daily;
  if (local.reading || incoming.reading) out.reading = mergeReadingMaps(local.reading, incoming.reading);
  const active = [local.lastActive, incoming.lastActive].filter(Boolean).sort().pop();
  if (active) out.lastActive = active;
  return out;
}

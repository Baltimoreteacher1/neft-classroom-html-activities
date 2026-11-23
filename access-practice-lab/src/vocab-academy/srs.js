// Vocabulary Academy — spaced review scheduling. Core-owned (SPEC §4, §10). Pure: the clock is always an argument.
//
// A word's schedule is { step, due, lapses }: `step` indexes INTERVAL_DAYS, `due` is a local calendar day
// ("YYYY-MM-DD", so "due tomorrow" never depends on the time of day a student practised).
//   correct on/after due → step + 1, due = today + INTERVAL_DAYS[step]
//   correct before due   → step and due stay
//   miss                 → step − 2 (min 0), lapses + 1, due tomorrow
// Two honest refinements, both covered by tests:
//   * a miss on the day a word is first met is learning, not forgetting: no lapse, no step change;
//   * a correct answer given WITH heavy support carries half weight, so two of them are needed to advance a step.
import { INTERVAL_DAYS, REVIEW_PER_DAY } from "./contract.js";

export { INTERVAL_DAYS };

const pad = (n) => String(n).padStart(2, "0");
export function toDate(now) {
  const d = now instanceof Date ? now : new Date(now ?? Date.now());
  if (Number.isNaN(d.getTime())) throw new RangeError("Invalid clock value");
  return d;
}
/** Local calendar day of a clock value: "2026-11-20". */
export const dayKey = (now) => {
  const d = toDate(now);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const parts = (key) => key.split("-").map(Number);
export const addDays = (key, n) => {
  const [y, m, d] = parts(key);
  return dayKey(new Date(y, m - 1, d + n, 12));
};
export const daysBetween = (a, b) => {
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
};

/** Teacher-configurable daily review size, clamped to 3–20 (default 8). */
export function clampReviewPerDay(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return REVIEW_PER_DAY.default;
  return Math.min(REVIEW_PER_DAY.max, Math.max(REVIEW_PER_DAY.min, v));
}
export const reviewPerDay = (progress) =>
  clampReviewPerDay(progress?.prefs?.reviewPerDay ?? REVIEW_PER_DAY.default);

/**
 * The schedule after one answer. Returns the new fields; never mutates `entry`.
 * `weight` is 1 for a normal correct answer and 0.5 for one given with heavy support (ignored for a miss).
 */
export function nextReview(entry = {}, ok, now = new Date(), weight = 1) {
  const today = dayKey(now);
  const top = INTERVAL_DAYS.length - 1;
  let step = Math.min(top, Math.max(0, Math.trunc(Number(entry.step)) || 0));
  let lapses = Math.max(0, Math.trunc(Number(entry.lapses)) || 0);
  let lapseDay = entry.lapseDay || null;
  let pend = Number(entry.pend) || 0;
  let due = entry.due || null;
  let advanced = false;
  let lapsed = false;
  if (!due) {
    step = 0;
    due = addDays(today, INTERVAL_DAYS[0]);
  }
  if (ok) {
    if (today >= due) {
      pend += Math.min(1, Math.max(0.0001, Number(weight) || 1));
      if (pend >= 1 - 1e-9) {
        step = Math.min(step + 1, top);
        pend = 0;
        advanced = true;
      }
      due = addDays(today, INTERVAL_DAYS[step]);
    }
  } else {
    pend = 0;
    if (entry.first === today || lapseDay === today) {
      // Met today, or already counted as a lapse today: due tomorrow, no further penalty.
      due = addDays(today, 1);
    } else {
      step = Math.max(0, step - 2);
      lapses += 1;
      lapseDay = today;
      due = addDays(today, 1);
      lapsed = true;
    }
  }
  return { step, due, lapses, lapseDay, pend: Math.round(pend * 100) / 100, advanced, lapsed };
}

/** Words due on or before `now`, most overdue first: due day, then review-needed, weakest step, most lapses, id. */
export function dueEntries(progress, now = new Date(), { grade, gradeOf } = {}) {
  const today = dayKey(now);
  const out = [];
  for (const [id, e] of Object.entries(progress?.words || {})) {
    if (!e?.due || e.due > today) continue;
    if (grade) {
      const g = e.g || gradeOf?.(id);
      if (g && String(g) !== String(grade)) continue;
    }
    out.push({ id, due: e.due, rn: e.rn ? 1 : 0, step: e.step | 0, lapses: e.lapses | 0 });
  }
  return out.sort(
    (a, b) =>
      (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) ||
      b.rn - a.rn ||
      a.step - b.step ||
      b.lapses - a.lapses ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

/** Words already reviewed today (they left the due list when their new date was set). */
export const reviewedToday = (progress, now = new Date()) =>
  progress?.daily?.day === dayKey(now) && Array.isArray(progress.daily.words)
    ? progress.daily.words.length
    : 0;

/** What the review queue looks like today: totals, the daily cap, how many remain under it, what is next. */
export function reviewLoad(progress, now = new Date()) {
  const today = dayKey(now);
  const horizon = addDays(today, 7);
  let due = 0;
  let overdue = 0;
  let upcoming7 = 0;
  let next = null;
  for (const e of Object.values(progress?.words || {})) {
    if (!e?.due) continue;
    if (e.due <= today) {
      due += 1;
      if (e.due < today) overdue += 1;
    } else {
      if (!next || e.due < next) next = e.due;
      if (e.due <= horizon) upcoming7 += 1;
    }
  }
  const cap = reviewPerDay(progress);
  const done = reviewedToday(progress, now);
  return {
    due,
    overdue,
    upcoming7,
    next,
    cap,
    doneToday: done,
    today: Math.min(due, Math.max(0, cap - done)),
  };
}

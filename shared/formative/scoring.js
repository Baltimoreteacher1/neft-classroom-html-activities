// Scoring state and the class distribution. Pure: every function returns new data and never touches a clock or DOM.
// A score set is { teacher: { [studentId]: level }, self: { [studentId]: level } }.
import { isLevel, LEVELS } from "./constants.js";

export const emptyScores = () => ({ teacher: {}, self: {} });

/** Build a score set from API rows [{ studentId, level, by }]; rows that are not valid are dropped. */
export function scoresFromRows(rows) {
  const out = emptyScores();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (r && isLevel(r.level) && (r.by === "teacher" || r.by === "self"))
      out[r.by][r.studentId] = r.level;
  }
  return out;
}

/**
 * One tap on one alias. Tapping a level sets it; tapping the level that is already set clears it (the fix-up for a
 * mis-tap). Exactly one tap, one student, one change.
 * @returns {{ scores, op: "set" | "clear", level: string | null }}
 */
export function tap(scores, studentId, level, by = "teacher") {
  if (!isLevel(level)) throw new RangeError(`unknown rubric level: ${level}`);
  const next = { ...scores, [by]: { ...scores[by] } };
  if (next[by][studentId] === level) {
    delete next[by][studentId];
    return { scores: next, op: "clear", level: null };
  }
  next[by][studentId] = level;
  return { scores: next, op: "set", level };
}

/** Largest-remainder rounding so the percentages of a non-empty set always add to exactly 100. */
function percents(counts, scored) {
  if (!scored) return Object.fromEntries(LEVELS.map((l) => [l, 0]));
  const raw = LEVELS.map((l, i) => ({ l, i, exact: (counts[l] * 100) / scored }));
  const out = Object.fromEntries(raw.map((r) => [r.l, Math.floor(r.exact)]));
  let left = 100 - Object.values(out).reduce((a, b) => a + b, 0);
  for (const r of [...raw].sort(
    (a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) || a.i - b.i,
  )) {
    if (left-- <= 0) break;
    out[r.l] += 1;
  }
  return out;
}

/**
 * The class distribution for one scorer. Only students on the roster count (a score for someone who has left
 * the class is ignored), so the bars always add up to the class the teacher sees.
 * @param {{ studentId: string }[]} roster
 */
export function distribution(roster, levels) {
  const ids = new Set(roster.map((s) => s.studentId));
  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  for (const [id, level] of Object.entries(levels || {}))
    if (ids.has(id) && isLevel(level)) counts[level] += 1;
  const scored = LEVELS.reduce((n, l) => n + counts[l], 0);
  return {
    counts,
    scored,
    total: ids.size,
    unscored: ids.size - scored,
    percent: percents(counts, scored),
  };
}

/** How many students gave themselves the same level the teacher gave. Only students with both scores count. */
export function agreement(scores) {
  const both = Object.keys(scores.self).filter((id) => scores.teacher[id]);
  return {
    both: both.length,
    same: both.filter((id) => scores.self[id] === scores.teacher[id]).length,
  };
}

// Vocabulary Academy — what a teacher can truthfully know about word-level learning.
//
// The class platform returns each student's progress summary to the teacher (counts, assigned work done, last seen) but
// NEVER word-level evidence: the full document is readable only with the student's own key. So word-level needs come
// from two real sources only, aggregated here on the teacher's device: (1) progress files students export (Core's
// exportProgress) and (2) the learning on this device. With neither there is nothing to show and the dashboard says so;
// a clearly labelled SAMPLE can be shown to demonstrate the report. Nothing here is sent anywhere.
import { DIMS } from "../contract.js";
import { cleanProgress, unitStatus, wordEntry } from "../model.js";
import { rngFor } from "../rng.js";

/** A word counts as a class need for a student when it needs review, or it has 2+ attempts at under 60% correct. */
export const WEAK_ACCURACY = 0.6;
const tally = (ev) => DIMS.reduce((t, d) => ({ c: t.c + (Number(ev?.[d]?.c) || 0), n: t.n + (Number(ev?.[d]?.n) || 0) }), { c: 0, n: 0 });

/** One student's standing on one word: { state, attempts, accuracy|null, weak }. */
export function standing(progress, wordId) {
  const e = wordEntry(progress, wordId);
  const { c, n } = tally(e.ev);
  const accuracy = n ? c / n : null;
  return { state: e.state, attempts: n, accuracy, weak: e.state === "review-needed" || (n >= 2 && accuracy < WEAK_ACCURACY) };
}

/**
 * Class-wide word needs. students: [{ label, progress }]; wordIds: the words to report on (default: every word met).
 * Rows are sorted weakest first: { id, met, weak, accuracy|null, attempts, states }.
 */
export function wordNeeds(students, wordIds = null) {
  const ids = wordIds || [...new Set(students.flatMap((s) => Object.keys(s.progress?.words || {})))];
  return ids
    .map((id) => {
      const states = {};
      let met = 0;
      let weak = 0;
      let c = 0;
      let n = 0;
      for (const s of students) {
        const st = standing(s.progress, id);
        if (st.state === "new" && !st.attempts) continue;
        met += 1;
        weak += st.weak ? 1 : 0;
        states[st.state] = (states[st.state] || 0) + 1;
        const t = tally(wordEntry(s.progress, id).ev);
        c += t.c;
        n += t.n;
      }
      return { id, met, weak, accuracy: n ? c / n : null, attempts: n, states };
    })
    .filter((r) => r.met > 0)
    .sort((a, b) => b.weak - a.weak || (a.accuracy ?? 1) - (b.accuracy ?? 1) || a.id.localeCompare(b.id));
}

/** Per-student unit progress: lessons done of 8, assessment forms A/B (latest score/total), word states. */
export function unitRows(students, unitId, wordIds) {
  return students.map((s) => {
    const u = unitStatus(s.progress, unitId, wordIds);
    const score = (a) => (a ? { score: a.score, total: a.total } : null);
    return { label: s.label, lessons: u.doneCount, assess: { A: score(u.assess.A), B: score(u.assess.B) }, wordStates: u.wordStates };
  });
}

/** Parse a student's exported progress file. Throws a plain-language Error when it is not one. */
export function studentFromFile(text, label) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("That file is not a Vocabulary Academy progress file.");
  }
  if (!obj || obj.v !== 1 || typeof obj.words !== "object") throw new Error("That file is not a Vocabulary Academy progress file.");
  return { label: String(label || "Student").replace(/\.[a-z]+$/i, "").slice(0, 24), progress: cleanProgress(obj) };
}

// ── class-platform summaries (what the server really returns to a teacher) ────
/** Assigned-work completion per Vocabulary Academy assignment: [{ id, title, done, total }] from roster summaries. */
export function assignmentCompletion(roster, assignments) {
  const students = roster?.students || [];
  return assignments.map((a) => ({
    id: a.id,
    title: a.title || a.id,
    done: students.filter((s) => (s.docs?.language?.summary?.assignmentsDone || []).includes(a.id)).length,
    total: students.length,
  }));
}
/** One row per student: nickname, VA assignments done of assigned, this week's practice evidence, last seen (ms). */
export function studentRows(roster, assignments) {
  const ids = assignments.map((a) => a.id);
  return (roster?.students || []).map((s) => {
    const sum = s.docs?.language?.summary || {};
    return { alias: s.alias, done: (sum.assignmentsDone || []).filter((id) => ids.includes(id)).length, of: ids.length, weekEvidence: sum.weekEvidence ?? 0, lastSeen: s.lastSeen || 0 };
  });
}

// ── labelled sample ───────────────────────────────────────────────────────────
/** Six invented students on a unit's words, deterministic from the unit id. Always shown with a "sample" label. */
export function sampleStudents(unit) {
  const rng = rngFor(`sample:${unit.id}`);
  const hard = new Set(unit.words.slice(0, 3).map((w) => w.id));
  return Array.from({ length: 6 }, (_, i) => {
    const words = {};
    for (const w of unit.words) {
      const p = hard.has(w.id) ? 0.35 : 0.85;
      const n = 3 + rng.int(3);
      let c = 0;
      let r = "";
      for (let k = 0; k < n; k += 1) {
        const ok = rng.next() < p;
        c += ok ? 1 : 0;
        r = `${r}${ok ? "1" : "0"}`.slice(-3);
      }
      const dim = { c, n, cw: c, r };
      words[w.id] = { ev: { mean: dim, ctx: { ...dim } }, seen: 1, rn: hard.has(w.id) && c / n < 0.4 && i % 2 === 0 };
    }
    const done = ["a", "b", "c", "d", "e", "f", "g", "h"].slice(0, 3 + rng.int(6));
    return { label: `Sample ${i + 1}`, sample: true, progress: { v: 1, words, units: { [unit.id]: { lessons: Object.fromEntries(done.map((l) => [l, { done: true }])), assess: {} } } } };
  });
}

// Pure helpers for the ELA module facts: splitting a guide's "Module:" line, and suggesting which module week each
// lesson companion fits. No I/O: the build tool feeds it data/ela-modules.json and the unit's lesson companions.
//
// Nothing here invents a district fact. A week is only ever one the guide printed; the lesson->week placement is a
// SUGGESTION and says why (`terms`: the lesson's words appear in that week's cells; `order`: nothing matched, so it
// keeps the lessons' own order across the weeks).
import { stem } from "./bcpss-activity-lessons.mjs";

const QUESTION_START =
  /\s(?:What|How|Why|Who|Where|When|Which|Is|Are|Does|Do|Can|Should|Would)\b[^?]*\?/;

/**
 * "Outer Space How do people learn about space? Opinion Writing" -> { title, essential_question, writing }.
 * The guide prints the three run together, so this only splits when the question is unambiguous (one question mark,
 * a title before it, and pieces that rejoin to the printed line); otherwise only the printed line is kept.
 */
export function splitModuleLine(line) {
  if (!line) return null;
  const q = QUESTION_START.exec(` ${line}`);
  const whole = { title: null, essential_question: null, writing: null, line };
  if (!q || (line.match(/\?/g) || []).length !== 1) {
    // No question: the line is just the module title (Module 3 guides print only that).
    return { ...whole, title: /\?/.test(line) ? null : line.replace(/\s*[-–—]\s*$/, "") };
  }
  const idx = q.index; // offset inside ` ${line}` is the offset inside `line` of the space before the question
  const title = line
    .slice(0, idx)
    .replace(/\s*[-–—:]\s*$/, "")
    .trim();
  const question = q[0].trim();
  const writing = line
    .slice(idx + q[0].length)
    .replace(/^[\s—–-]+/, "")
    .trim();
  if (!title) return whole;
  return { title, essential_question: question, writing: writing || null, line };
}

const wordStems = (text) =>
  String(text)
    .toLowerCase()
    .split(/[^a-z']+/)
    .map(stem)
    .filter((w) => w.length > 2);

/** Does the week's word list use this vocabulary term (every word of it, by stem)? */
function weekUses(weekStems, term) {
  const parts = wordStems(term);
  return parts.length > 0 && parts.every((p) => weekStems.has(p));
}

const MIN_EVIDENCE = 1.5; // a new word in one week, or a few review words, is enough to say "the week uses these words"
const ORDER_WEIGHT = 0.6; // how strongly the lessons' own order pulls toward an even spread over the weeks

/**
 * lessons: the unit's lesson companions ({ id, sequence, title, vocab: [{ term, new_or_review }] }).
 * weeks: the module's weeks ({ n, terms: "space separated words" }); eligible: the week numbers lessons may land in.
 * Returns [{ id, sequence, week, how: "terms" | "order", terms? }], weeks never decreasing as the sequence rises.
 */
export function placeLessons({ lessons, weeks, eligible }) {
  const pool = weeks.filter((w) => eligible.includes(w.n));
  if (!pool.length || !lessons.length) return [];
  const stems = pool.map((w) => new Set(wordStems(w.terms)));
  // A word that every week uses says nothing about any one of them.
  const termWeeks = new Map();
  for (const l of lessons)
    for (const v of l.vocab || [])
      if (!termWeeks.has(v.term))
        termWeeks.set(v.term, stems.filter((s) => weekUses(s, v.term)).length);
  const idf = (term) => Math.log(1 + pool.length / Math.max(1, termWeeks.get(term) || 1));

  const ordered = [...lessons].sort((a, b) => a.sequence - b.sequence);
  const score = ordered.map((lesson, i) => {
    const target = ((i + 0.5) / ordered.length) * pool.length;
    return pool.map((_, wi) => {
      const hits = (lesson.vocab || []).filter((v) => weekUses(stems[wi], v.term));
      const evidence = hits.reduce(
        (sum, v) => sum + (v.new_or_review === "new" ? 3 : 1) * idf(v.term),
        0,
      );
      const closeness = 1 - Math.abs(wi + 0.5 - target) / pool.length;
      return {
        points: evidence + ORDER_WEIGHT * closeness * 4,
        hits: hits.map((v) => v.term),
        evidence,
      };
    });
  });

  // Best non-decreasing assignment (dynamic programming over lessons x weeks).
  const W = pool.length;
  const best = ordered.map(() => new Array(W).fill(-Infinity));
  const from = ordered.map(() => new Array(W).fill(0));
  for (let wi = 0; wi < W; wi++) best[0][wi] = score[0][wi].points;
  for (let i = 1; i < ordered.length; i++) {
    for (let wi = 0; wi < W; wi++) {
      let bestPrev = -Infinity;
      let arg = 0;
      for (let pj = 0; pj <= wi; pj++)
        if (best[i - 1][pj] > bestPrev) {
          bestPrev = best[i - 1][pj];
          arg = pj;
        }
      best[i][wi] = bestPrev + score[i][wi].points;
      from[i][wi] = arg;
    }
  }
  let wi = best[ordered.length - 1].indexOf(Math.max(...best[ordered.length - 1]));
  const chosen = new Array(ordered.length);
  for (let i = ordered.length - 1; i >= 0; i--) {
    chosen[i] = wi;
    wi = from[i][wi];
  }
  return ordered.map((lesson, i) => {
    const cell = score[i][chosen[i]];
    return {
      id: lesson.id,
      sequence: lesson.sequence,
      week: pool[chosen[i]].n,
      how: cell.evidence >= MIN_EVIDENCE ? "terms" : "order",
      ...(cell.evidence >= MIN_EVIDENCE ? { terms: cell.hits } : {}),
    };
  });
}

/**
 * The publisher lessons a week covers, as [first, last]. A week's cells also cite lessons from elsewhere ("display the
 * anchor chart from Module 1, Lesson 20"), so only the longest run of consecutive numbers counts; no run of two or
 * more means the guide gave no clear range and nothing is shown.
 */
export function lessonRange(numbers) {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  let best = [];
  let run = [];
  for (const n of sorted) {
    run = run.length && n - run.at(-1) <= 1 ? [...run, n] : [n];
    if (run.length >= best.length) best = run;
  }
  return best.length >= 2 && best.length <= 7 ? [best[0], best.at(-1)] : null;
}

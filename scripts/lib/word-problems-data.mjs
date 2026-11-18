// Contract checks for data/word-problems/unit-<n>.json: 2–3 authored application problems per lesson,
// shown on /math/word-problems/<lesson>/ after a practice studio's last step.
// Pure functions: validateWordProblems(byLesson, lessonIds) -> string[] of problems (empty = clean).

const PICTURE_WORDS =
  /\b(the (picture|diagram|graph|figure|image|table|plot|number line|box plot|histogram|dot plot|net)\b|shown (above|below)|see (above|below)|in the (picture|diagram|graph|figure))/i;
const TIMER_WORDS =
  /\b(timer|countdown|count down|beat the clock|seconds left|race against the clock|against the clock)\b/i;

import { parseAnswer, sameValue } from "../../assets/studio/word-problems-answer.mjs";

export { parseAnswer };

const str = (/** @type {any} */ v, min = 2) => typeof v === "string" && v.trim().length >= min;

/** Evaluates a plain arithmetic expression (digits, + − * / parentheses, decimal points) or returns NaN. */
export function evalCalc(/** @type {any} */ expr) {
  const s = String(expr ?? "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  if (!s.trim() || !/^[\d+\-*/().\s]+$/.test(s)) return Number.NaN;
  try {
    const v = Function(`"use strict";return (${s});`)();
    return typeof v === "number" && Number.isFinite(v) ? v : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

const close = sameValue;

function problemIssues(/** @type {any} */ p, /** @type {string} */ where) {
  const out = [];
  for (const k of ["title", "titleEs"]) if (!str(p[k], 3)) out.push(`${where}.${k} is required`);
  for (const k of ["q", "qEs", "x", "xEs"])
    if (!str(p[k], 30)) out.push(`${where}.${k} (30+ chars) is required`);
  if (str(p.q) && PICTURE_WORDS.test(p.q))
    out.push(`${where}.q refers to a picture or table the page does not show`);
  if (TIMER_WORDS.test(`${p.q} ${p.x}`)) out.push(`${where}: no timed language`);
  for (const k of ["h", "hEs"])
    if (!Array.isArray(p[k]) || p[k].length !== 3 || !p[k].every((s) => str(s, 8)))
      out.push(`${where}.${k} must be exactly 3 hints`);
  if (p.kind === "num") {
    const a = parseAnswer(p.a);
    if (!Number.isFinite(a)) out.push(`${where}.a must be a number, got ${JSON.stringify(p.a)}`);
    const c = evalCalc(p.calc);
    if (!Number.isFinite(c)) out.push(`${where}.calc must be an arithmetic expression`);
    else if (Number.isFinite(a) && !close(c, a))
      out.push(`${where}: calc ${p.calc} = ${c}, but the answer is ${p.a}`);
    if (p.unit !== undefined && (!str(p.unit, 1) || !str(p.unitEs, 1)))
      out.push(`${where}: unit needs unitEs`);
    if (!Array.isArray(p.fw) || p.fw.length < 2)
      out.push(`${where}.fw needs 2+ common wrong answers`);
    else
      p.fw.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
        if (!Number.isFinite(parseAnswer(w.v))) out.push(`${where}.fw[${i}].v must be a number`);
        else if (Number.isFinite(a) && close(parseAnswer(w.v), a))
          out.push(`${where}.fw[${i}].v equals the answer`);
        if (!str(w.f, 15) || !str(w.fEs, 15)) out.push(`${where}.fw[${i}] needs f and fEs`);
      });
  } else if (p.kind === "mc") {
    const n = Array.isArray(p.c) ? p.c.length : 0;
    if (n < 3 || n > 4) out.push(`${where}.c needs 3–4 choices`);
    if (!Array.isArray(p.cEs) || p.cEs.length !== n) out.push(`${where}.cEs must match c`);
    if (!Number.isInteger(p.ai) || p.ai < 0 || p.ai >= n) out.push(`${where}.ai out of range`);
    if (n && new Set(p.c.map((/** @type {any} */ s) => String(s).trim().toLowerCase())).size !== n)
      out.push(`${where}.c has duplicate choices`);
    for (const k of ["f", "fEs"])
      if (!Array.isArray(p[k]) || p[k].length !== n)
        out.push(`${where}.${k} must give feedback for every choice`);
      else
        p[k].forEach((/** @type {any} */ s, /** @type {number} */ i) => {
          if (i !== p.ai && !str(s, 15)) out.push(`${where}.${k}[${i}] feedback is required`);
        });
    if (p.calc !== undefined) {
      const c = evalCalc(p.calc);
      const nums =
        String(p.c?.[p.ai] ?? "").match(/-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?/g) || [];
      if (!nums.some((s) => close(parseAnswer(s), c)))
        out.push(`${where}: calc ${p.calc} = ${c} does not appear in the correct choice`);
    }
  } else out.push(`${where}.kind must be "num" or "mc"`);
  return out;
}

/**
 * @param {Record<string, any>} byLesson lesson id -> { problems: [...] }
 * @param {string[]} lessonIds every lesson that must have word problems
 */
export function validateWordProblems(byLesson, lessonIds) {
  const out = [];
  for (const id of lessonIds) {
    const set = byLesson[id];
    if (!set) {
      out.push(`${id}: no word problems`);
      continue;
    }
    if (!Array.isArray(set.problems) || set.problems.length < 2 || set.problems.length > 3) {
      out.push(`${id}: needs 2–3 problems`);
      continue;
    }
    if (!set.problems.some((/** @type {any} */ p) => p.kind === "num"))
      out.push(`${id}: at least one problem must ask for a typed number`);
    set.problems.forEach((/** @type {any} */ p, /** @type {number} */ i) =>
      out.push(...problemIssues(p, `${id}.problems[${i}]`)),
    );
  }
  for (const id of Object.keys(byLesson))
    if (!lessonIds.includes(id)) out.push(`${id}: not a curriculum practice lesson`);
  return out;
}

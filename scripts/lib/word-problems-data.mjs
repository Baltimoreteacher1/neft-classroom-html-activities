// Contract checks for data/word-problems/unit-<n>.json: 2–3 authored application problems per lesson,
// shown on /math/word-problems/<lesson>/ after a practice studio's last step.
// Pure functions: validateWordProblems(byLesson, lessonIds) -> string[] of problems (empty = clean).

const PICTURE_WORDS =
  /\b(the (picture|diagram|graph|figure|image|table|plot|number line|box plot|histogram|dot plot|net)\b|shown (above|below)|see (above|below)|in the (picture|diagram|graph|figure))/i;
const TIMER_WORDS =
  /\b(timer|countdown|count down|beat the clock|seconds left|race against the clock|against the clock)\b/i;

import { parseAnswer, sameValue } from "../../assets/studio/word-problems-answer.mjs";
import { buildKey, sameBuild } from "../../assets/studio/word-problems-card.mjs";

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
  } else if (p.kind === "build") {
    // tap tiles to assemble the answer: every accepted answer must be buildable from the tiles given
    const tiles = Array.isArray(p.tiles) ? p.tiles.map(String) : [];
    if (tiles.length < 3 || tiles.length > 12) out.push(`${where}.tiles needs 3-12 tiles`);
    if (!Array.isArray(p.a) || !p.a.length || !p.a.every((seq) => Array.isArray(seq) && seq.length))
      out.push(`${where}.a must list accepted tile sequences`);
    else
      p.a.forEach((/** @type {string[]} */ seq, /** @type {number} */ i) => {
        const pool = [...tiles];
        for (const t of seq) {
          const k = pool.indexOf(String(t));
          if (k < 0) out.push(`${where}.a[${i}] uses "${t}", which is not a spare tile`);
          else pool.splice(k, 1);
        }
      });
    const keys = new Set((p.a || []).map((/** @type {string[]} */ seq) => buildKey(seq)));
    if (tiles.length && keys.size && tiles.length <= Math.max(...(p.a || []).map((x) => x.length)))
      out.push(`${where}.tiles need at least one extra (distractor) tile`);
    if (!Array.isArray(p.fw) || p.fw.length < 1)
      out.push(`${where}.fw needs 1+ common wrong builds`);
    else
      p.fw.forEach((/** @type {any} */ w, /** @type {number} */ i) => {
        if (
          !str(w.v, 1) ||
          keys.has(buildKey([w.v])) ||
          (!p.exact &&
            (p.a || []).some((/** @type {string[]} */ seq) => sameBuild(seq.join(" "), w.v)))
        )
          out.push(`${where}.fw[${i}].v is empty or equivalent to a correct build`);
        if (!str(w.f, 15) || !str(w.fEs, 15)) out.push(`${where}.fw[${i}] needs f and fEs`);
      });
    for (const h of p.h || [])
      for (const k of keys)
        if (k.length >= 3 && buildKey([h]).includes(k))
          out.push(`${where}: a hint shows the answer`);
  } else if (p.kind === "table") {
    const n = Array.isArray(p.hd) ? p.hd.length : 0;
    if (n < 2) out.push(`${where}.hd needs 2+ headers`);
    if (!Array.isArray(p.hdEs) || p.hdEs.length !== n) out.push(`${where}.hdEs must match hd`);
    let blanks = 0;
    if (!Array.isArray(p.rows) || p.rows.length < 2) out.push(`${where}.rows needs 2+ rows`);
    else
      p.rows.forEach((/** @type {any[]} */ row, /** @type {number} */ r) => {
        if (!Array.isArray(row) || row.length !== n)
          return out.push(`${where}.rows[${r}] must have ${n} cells`);
        row.forEach((cell, c) => {
          if (cell && typeof cell === "object") {
            blanks++;
            const a = parseAnswer(cell.a);
            const v = evalCalc(cell.calc);
            if (!Number.isFinite(a) || !Number.isFinite(v) || !close(v, a))
              out.push(
                `${where}.rows[${r}][${c}]: calc ${cell.calc} must equal the answer ${cell.a}`,
              );
          } else if (!str(String(cell ?? ""), 1)) out.push(`${where}.rows[${r}][${c}] is empty`);
        });
      });
    if (blanks < 2 || blanks > 8) out.push(`${where}: a table needs 2-8 blank cells`);
  } else out.push(`${where}.kind must be "num", "mc", "build" or "table"`);
  return out;
}

/** Per lesson: the Word problems page, its scenario, and the in-step "Real-world check" cards (studio steps 2, 3, 5). */
export const PROBLEMS = 7;
export const STEPS = 3;

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
    const P = Array.isArray(set.problems) ? set.problems : [];
    if (P.length !== PROBLEMS)
      out.push(`${id}: needs exactly ${PROBLEMS} problems (has ${P.length})`);
    if (P.filter((p) => p.kind === "num").length < 2)
      out.push(`${id}: at least two problems must ask for a typed number`);
    if (!P.some((p) => p.kind === "build"))
      out.push(`${id}: at least one problem must be a build task`);
    P.forEach((p, i) => out.push(...problemIssues(p, `${id}.problems[${i}]`)));
    const sc = set.scenario;
    if (
      !sc ||
      !str(sc.title, 3) ||
      !str(sc.titleEs, 3) ||
      !str(sc.setup, 40) ||
      !str(sc.setupEs, 40)
    )
      out.push(`${id}.scenario needs title, titleEs and a 40+ character setup in both languages`);
    else if (PICTURE_WORDS.test(sc.setup))
      out.push(`${id}.scenario.setup refers to a picture or table`);
    const parts = Array.isArray(sc?.parts) ? sc.parts : [];
    if (parts.length !== 3) out.push(`${id}.scenario needs exactly 3 linked parts`);
    parts.forEach((p, i) => out.push(...problemIssues(p, `${id}.scenario.parts[${i}]`)));
    const steps = Array.isArray(set.steps) ? set.steps : [];
    if (steps.length !== STEPS)
      out.push(`${id}.steps needs exactly ${STEPS} in-step real-world checks`);
    steps.forEach((p, i) => out.push(...problemIssues(p, `${id}.steps[${i}]`)));
    const seen = new Set();
    for (const p of [...P, ...parts, ...steps]) {
      const key = String(p.q || "")
        .trim()
        .toLowerCase();
      if (seen.has(key)) out.push(`${id}: the question "${key.slice(0, 50)}…" appears twice`);
      seen.add(key);
    }
  }
  for (const id of Object.keys(byLesson))
    if (!lessonIds.includes(id)) out.push(`${id}: not a curriculum practice lesson`);
  return out;
}

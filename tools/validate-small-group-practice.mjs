#!/usr/bin/env node
/**
 * validate-small-group-practice.mjs — gate for data/small-group-practice/*.json,
 * the authored practice of every small-group studio (Practice together, On my
 * own, Talk, Check, Challenge). Contract: docs/specs/small-group-practice-v1.md.
 *
 * It enforces the countable half — shape, counts, Spanish siblings, word limits,
 * notation, arithmetic, that every answer box accepts its own answer, that
 * multiple-choice feedback lines up with its choices, and that no two problems
 * in a lesson repeat — so a reviewer only has to judge the teaching.
 *
 *   node tools/validate-small-group-practice.mjs            # every base lesson must have one
 *   node tools/validate-small-group-practice.mjs 2-3 5-4    # just these lessons
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { numericValue } from "@eduwonderlab/engine/core/small-group-build-figure-kit.js";
import { checkFigure } from "./lib/small-group-build-figure-rules.mjs";
import {
  arithmeticErrors,
  baseLessons,
  checkMath,
  checkMathEs,
  checkText,
  LIMITS,
} from "./validate-small-group-build.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "data/small-group-practice");
const BUILD_DIR = join(ROOT, "data/small-group-build");

const isStr = (s) => typeof s === "string" && s.trim().length > 0;
const words = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/**
 * The problem's numbers (fractions and mixed numbers as one value each). Three
 * or more numbers compare as a sorted multiset — a 9 × 5 × 4 box and a
 * 4 × 9 × 5 box are one problem. One or two keep their order, because (−5, 4)
 * and (4, −5) are different points.
 */
export const numberSignature = (text) => {
  const values = (
    String(text || "")
      .replace(/(\d),(\d{3})/g, "$1$2")
      .replace(/−/g, "-")
      .replace(/(\d+)\{(\d+)\/(\d+)\}/g, (_, w, n, d) => ` ${+w + n / d} `)
      .replace(/\{(\d+)\/(\d+)\}/g, (_, n, d) => ` ${n / d} `)
      .match(/-?\d+(?:\.\d+)?/g) || []
  ).map((v) => Number(Number(v).toFixed(6)));
  return (values.length >= 3 ? values.sort((x, y) => x - y) : values).join(" ");
};

function checkModelSteps(err, path, steps, { min = 2, max = 4 } = {}) {
  if (!Array.isArray(steps) || steps.length < min || steps.length > max)
    return err(`${path} must have ${min}–${max} steps (has ${steps?.length ?? 0})`);
  steps.forEach((s, i) => {
    const p = `${path}[${i}]`;
    checkText(err, `${p}.do`, s.do, { limit: LIMITS.do, obj: s });
    if (s.math !== undefined) {
      checkMath(err, `${p}.math`, s.math);
      checkMathEs(err, `${p}.math`, s.math, s.mathEs);
    }
    if (s.ask) err(`${p} uses "ask" — solution steps use do/math`);
  });
}

/** The typed answer's leading number must be one the box accepts. */
function checkAccept(err, path, answer, accept) {
  if (!Array.isArray(accept) || !accept.length || !accept.every(isStr))
    return err(`${path}.accept must be a non-empty string array`);
  const lead = String(answer).match(/[−-]?\$?\d[\d,]*(?:\.\d+)?(?:\{\d+\/\d+\}|\s\d+\/\d+|\/\d+)?/);
  const want = lead ? numericValue(lead[0].replace("$", "")) : null;
  if (
    want !== null &&
    !accept.some((a) => {
      const n = numericValue(String(a).replace(/^\$/, ""));
      return n !== null && Math.abs(n - want) < 1e-9;
    })
  )
    err(`${path}.accept has no entry equal to the answer's number "${lead[0]}"`);
  const bad = accept.filter(
    (a) =>
      /^[−-]?\$?\d/.test(a) && numericValue(a.replace(/^\$/, "")) === null && !/[a-z]/i.test(a),
  );
  if (bad.length) err(`${path}.accept entries are not numbers the box can read: ${bad.join(", ")}`);
}

export function checkItem(err, path, it, { explainAllowed }) {
  if (!it || typeof it !== "object") return err(`${path} missing`);
  checkText(err, `${path}.problem`, it.problem, { limit: LIMITS.problem, obj: it });
  for (const e of arithmeticErrors(it.problem || "")) err(`${path}.problem ${e}`);
  if (it.figure) checkFigure(err, `${path}.figure`, it.figure);
  const mc = Array.isArray(it.choices);
  if (mc) {
    if (it.choices.length < 3 || it.choices.length > 4) err(`${path}.choices must have 3–4`);
    if (!it.choices.every(isStr)) err(`${path}.choices has an empty choice`);
    if (!Array.isArray(it.choicesEs) || it.choicesEs.length !== it.choices.length)
      err(`${path}.choicesEs must match choices`);
    if (!Number.isInteger(it.correct) || it.correct < 0 || it.correct >= it.choices.length)
      err(`${path}.correct must index a choice`);
    if (new Set(it.choices.map((c) => String(c).trim().toLowerCase())).size !== it.choices.length)
      err(`${path}.choices repeat`);
    for (const key of ["choiceWhy", "choiceWhyEs"]) {
      const why = it[key];
      if (!Array.isArray(why) || why.length !== it.choices.length)
        err(`${path}.${key} must have one entry per choice`);
      else
        why.forEach((w, i) => {
          if (i === it.correct) {
            if (w) err(`${path}.${key}[${i}] must be "" (the correct choice)`);
          } else if (!isStr(w)) err(`${path}.${key}[${i}] missing (name the mistake)`);
          else if (words(w) > 25) err(`${path}.${key}[${i}] is ${words(w)} words (max 25)`);
        });
    }
    if (it.accept || it.answer) err(`${path} mixes choices with answer/accept`);
  } else {
    if (!isStr(it.answer)) err(`${path}.answer missing`);
    else {
      for (const e of arithmeticErrors(it.answer)) err(`${path}.answer ${e}`);
      if (
        /[A-Za-z]{3,}/.test(
          it.answer.replace(
            /\b(ft|in|cm|mm|km|mi|yd|oz|lb|lbs|kg|mL|L|gal|min|sec|hr|hrs|mph|sq|cu)\b/g,
            "",
          ),
        ) &&
        !isStr(it.answerEs)
      )
        err(`${path}.answerEs missing (the answer has words)`);
      checkAccept(err, path, it.answer, it.accept);
    }
  }
  checkText(err, `${path}.hint`, it.hint, { limit: 30, obj: it });
  checkModelSteps(err, `${path}.steps`, it.steps);
  if (it.explain || it.modelExplanation) {
    if (!explainAllowed) err(`${path} has explain fields (group2 only)`);
    checkText(err, `${path}.explain`, it.explain, { limit: 25, obj: it });
    checkText(err, `${path}.modelExplanation`, it.modelExplanation, { limit: 45, obj: it });
    for (const e of arithmeticErrors(it.modelExplanation || ""))
      err(`${path}.modelExplanation ${e}`);
  }
}

function checkTogether(err, path, t) {
  if (!t || typeof t !== "object") return err(`${path} missing`);
  checkText(err, `${path}.problem`, t.problem, { limit: LIMITS.problem, obj: t });
  for (const e of arithmeticErrors(t.problem || "")) err(`${path}.problem ${e}`);
  checkText(err, `${path}.answer`, t.answer, { obj: t });
  for (const e of arithmeticErrors(t.answer || "")) err(`${path}.answer ${e}`);
  if (t.figure) checkFigure(err, `${path}.figure`, t.figure);
  const steps = t.steps;
  if (!Array.isArray(steps) || steps.length < 2 || steps.length > 4)
    return err(`${path}.steps must have 2–4 steps (has ${steps?.length ?? 0})`);
  let typed = 0;
  steps.forEach((s, i) => {
    const p = `${path}.steps[${i}]`;
    checkText(err, `${p}.ask`, s.ask, { limit: LIMITS.ask, obj: s });
    if (!isStr(s.answer)) err(`${p}.answer missing`);
    else for (const e of arithmeticErrors(s.answer)) err(`${p}.answer ${e}`);
    if (isStr(s.answer) && /[A-Za-z]{3,}/.test(s.answer) && !isStr(s.answerEs))
      err(`${p}.answerEs missing (the answer has words)`);
    if (s.accept !== undefined) {
      typed++;
      checkAccept(err, p, s.answer, s.accept);
    }
    if (s.do) err(`${p} uses "do" — together steps use ask/answer`);
  });
  if (!typed) err(`${path} has no typed step — give at least one step an accept list`);
}

function checkTalk(err, path, t) {
  if (!t || typeof t !== "object") return err(`${path} missing`);
  checkText(err, `${path}.prompt`, t.prompt, { limit: 30, obj: t });
  for (const key of ["frames", "framesEs"]) {
    const f = t[key];
    if (!Array.isArray(f) || f.length !== 2 || !f.every(isStr))
      err(`${path}.${key} must be exactly 2 frames`);
    else
      f.forEach((frame, i) => {
        if (!frame.includes("___")) err(`${path}.${key}[${i}] needs a ___ blank`);
      });
  }
}

const COUNTS = { together: 2, onMyOwn: 4, check: 2 };

function checkGroup(err, path, g, { group2 }) {
  if (!g || typeof g !== "object") return err(`${path} missing`);
  for (const [key, n] of Object.entries(COUNTS))
    if (!Array.isArray(g[key]) || g[key].length !== n)
      err(`${path}.${key} must have exactly ${n} (has ${g[key]?.length ?? 0})`);
  (g.together || []).forEach((t, i) => checkTogether(err, `${path}.together[${i}]`, t));
  (g.onMyOwn || []).forEach((it, i) =>
    checkItem(err, `${path}.onMyOwn[${i}]`, it, { explainAllowed: group2 }),
  );
  (g.check || []).forEach((it, i) =>
    checkItem(err, `${path}.check[${i}]`, it, { explainAllowed: false }),
  );
  checkItem(err, `${path}.stretch`, g.stretch, { explainAllowed: group2 });
  checkTalk(err, `${path}.talk`, g.talk);
  if (group2) {
    const explained = (g.onMyOwn || []).filter((it) => it?.explain).length;
    if (explained < 2) err(`${path}.onMyOwn needs explain on at least 2 items (has ${explained})`);
  }
}

/**
 * The problems ONE student meets, studio by studio: a Group 1 student sees the
 * Group 1 Build and Group 1 practice, never Group 2's. Repeats only matter
 * inside a studio.
 */
function studios(data, build) {
  const list = (where, text) => (typeof text === "string" && text.trim() ? [{ where, text }] : []);
  const out = [];
  for (const g of ["group1", "group2"]) {
    const p = data[g] || {};
    const b = build?.[g] || {};
    out.push({
      built: [
        ...(b.examples || []).flatMap((e, i) => list(`build ${g}.examples[${i}]`, e?.problem)),
        ...list(`build ${g}.together`, b.together?.problem),
        ...list(`build ${g}.tryIt`, b.tryIt?.problem),
      ],
      practice: [
        ...(p.together || []).flatMap((t, i) => list(`${g}.together[${i}]`, t?.problem)),
        ...(p.onMyOwn || []).flatMap((t, i) => list(`${g}.onMyOwn[${i}]`, t?.problem)),
        ...(p.check || []).flatMap((t, i) => list(`${g}.check[${i}]`, t?.problem)),
        ...list(`${g}.stretch`, p.stretch?.problem),
      ],
    });
  }
  const c = data.catchup || {};
  out.push({
    built: [
      ...list("build catchup", build?.catchup?.problem),
      ...list("build catchup.check", build?.catchup?.check?.problem),
    ],
    practice: [
      ...(c.practice || []).flatMap((t, i) => list(`catchup.practice[${i}]`, t?.problem)),
      ...list("catchup.check", c.check?.problem),
    ],
  });
  return out;
}

/**
 * ratioTableModel — Joel, 2026-10-06 (data/product-decisions.json): ratio,
 * rate and conversion problems are set up as equivalent-ratio tables. A lesson
 * whose practice says `"model": "ratioTable"` must draw one on every problem it
 * shows — practice AND the Build examples — unless the item records why not
 * (`modelException`, 8+ words).
 */
function ratioTableModel(err, data, build) {
  if (data.model === undefined) return;
  if (data.model !== "ratioTable") return err(`model must be "ratioTable" when present`);
  const check = (path, it) => {
    if (!it || typeof it !== "object") return;
    if (it.figure?.kind === "ratioTable") return;
    if (words(it.modelException) >= 8) return;
    err(`${path} needs a ratioTable figure (lesson model is ratioTable) or a modelException`);
  };
  for (const g of ["group1", "group2"]) {
    const p = data[g] || {};
    (p.together || []).forEach((t, i) => check(`${g}.together[${i}]`, t));
    (p.onMyOwn || []).forEach((t, i) => check(`${g}.onMyOwn[${i}]`, t));
    (p.check || []).forEach((t, i) => check(`${g}.check[${i}]`, t));
    check(`${g}.stretch`, p.stretch);
    const b = build?.[g];
    if (b) {
      (b.examples || []).forEach((e, i) => check(`build ${g}.examples[${i}]`, e));
      check(`build ${g}.together`, b.together);
      check(`build ${g}.tryIt`, b.tryIt);
    }
  }
  (data.catchup?.practice || []).forEach((t, i) => check(`catchup.practice[${i}]`, t));
  check("catchup.check", data.catchup?.check);
  if (build?.catchup) {
    check("build catchup", build.catchup);
    check("build catchup.check", build.catchup.check);
  }
}

export function validatePractice(data, lesson, build = null) {
  const problems = [];
  const err = (m) => problems.push(m);
  ratioTableModel(err, data, build);
  if (data.lesson !== lesson) err(`lesson is "${data.lesson}", file is ${lesson}`);
  // Optional: keep the base lesson's Reveal Apply problem out of the studio,
  // with the reason recorded where the next author will read it.
  if (data.apply !== undefined) {
    if (data.apply?.use !== false) err('apply must be { "use": false, "why": "…" } when present');
    if (words(data.apply?.why) < 12) err("apply.why must explain the decision (12+ words)");
  }
  checkGroup(err, "group1", data.group1, { group2: false });
  checkGroup(err, "group2", data.group2, { group2: true });
  const c = data.catchup;
  if (!c) err("catchup missing");
  else {
    if (!Array.isArray(c.practice) || c.practice.length !== 2)
      err(`catchup.practice must have exactly 2 (has ${c.practice?.length ?? 0})`);
    (c.practice || []).forEach((it, i) =>
      checkItem(err, `catchup.practice[${i}]`, it, { explainAllowed: false }),
    );
    checkItem(err, "catchup.check", c.check, { explainAllowed: false });
  }
  // Inside one studio, no problem repeats another or one Build already worked.
  for (const { built, practice } of studios(data, build)) {
    const bySig = new Map();
    for (const p of [...built, ...practice]) {
      const sig = numberSignature(p.text);
      if (sig.split(" ").length < 2) continue;
      const prior = bySig.get(sig);
      if (prior && !p.where.startsWith("build")) err(`${p.where} repeats the numbers of ${prior}`);
      else if (!prior) bySig.set(sig, p.where);
    }
  }
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const lessons = args.length
    ? args.map((a) =>
        a
          .replace(/\.json$/, "")
          .split("/")
          .pop(),
      )
    : baseLessons();
  let failed = 0;
  for (const lesson of lessons) {
    const file = join(DIR, `${lesson}.json`);
    if (!existsSync(file)) {
      console.log(`✗ ${lesson}: missing ${file.replace(`${ROOT}/`, "")}`);
      failed++;
      continue;
    }
    let data;
    try {
      data = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      console.log(`✗ ${lesson}: invalid JSON — ${e.message}`);
      failed++;
      continue;
    }
    const buildFile = join(BUILD_DIR, `${lesson}.json`);
    const build = existsSync(buildFile) ? JSON.parse(readFileSync(buildFile, "utf8")) : null;
    const problems = validatePractice(data, lesson, build);
    if (problems.length) {
      failed++;
      console.log(`✗ ${lesson} (${problems.length})`);
      for (const p of problems) console.log(`    ${p}`);
    }
  }
  console.log(
    failed
      ? `FAIL validate:small-group-practice — ${failed}/${lessons.length} lesson(s)`
      : `PASS validate:small-group-practice — ${lessons.length} lesson(s)`,
  );
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

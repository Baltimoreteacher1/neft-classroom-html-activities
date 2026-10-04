#!/usr/bin/env node
/**
 * validate-small-group-build.mjs — gate for data/small-group-build/*.json, the
 * authored "Build the idea" content of every small-group studio. The contract
 * is docs/specs/small-group-build-v2.md; this file enforces the countable half
 * of it (shape, Spanish siblings, length limits, banned references, notation,
 * arithmetic, figure geometry) so a reviewer only has to judge the teaching.
 *
 *   node tools/validate-small-group-build.mjs            # every file, and every base lesson must have one
 *   node tools/validate-small-group-build.mjs 2-3 5-4    # just these lessons
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { numericValue } from "@eduwonderlab/engine/core/small-group-build-figure-kit.js";
import { CORE_ID_RE, lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";
import { checkFigure } from "./lib/small-group-build-figure-rules.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "data/small-group-build");

export const LIMITS = {
  do: 10,
  why: 18,
  ask: 16,
  problem: 45,
  todayIdea: 22,
  bigIdea: 28,
  caption: 12,
  title: 9,
};
const BANNED = [
  [/\bthe book\b/i, 'mentions "the book"'],
  [/\b(below|above)\b/i, 'says "below"/"above" (the card owns layout)'],
  [/\bthe picture\b/i, 'refers to "the picture"'],
  [/\bFormula:/, 'uses "Formula:"'],
  [/\.\.(\s|$)/, "double period"],
  [/\s{2,}/, "double space"],
];

const words = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const isStr = (s) => typeof s === "string" && s.trim().length > 0;

/** Evaluate every "expr = value" the line states and report the false ones. */
export function arithmeticErrors(text) {
  const errors = [];
  const src = String(text)
    .replace(/(\d)\{(\d+)\/(\d+)\}/g, "($1+$2/$3)")
    .replace(/\{(\d+)\/(\d+)\}/g, "($1/$2)")
    .replace(/(\d),(\d{3})(?!\d)/g, "$1$2")
    .replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (m) => `^${[...m].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("")}`)
    // Q1, Q3, x2: a letter carrying a digit is a name, not the number.
    .replace(/[A-Za-z]+\d+/g, "V")
    .replace(/(\d+(?:\.\d+)?)%\s*of\s*/g, "($1/100)*")
    .replace(/\$/g, "")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  // A chain "a = b = c": compare each evaluable side to the next.
  const re = /[\d.()+\-*/^\s]+(?:=[\d.()+\-*/^\s]+)+/g;
  for (const hit of src.matchAll(re)) {
    const m = hit[0];
    // "… of 80 = 20": the left side starts mid-phrase, so its first number is
    // not the whole expression. Skip that comparison rather than guess.
    const before = src.slice(0, hit.index).trimEnd();
    // "n + 8 = 20": a lone variable (n, 3x) owns the left side too, so its
    // number fragment is not the whole expression.
    const partialLeft =
      /(\b(of|by|times|from|and|than|minus|plus)|[%(]|(?:^|[^A-Za-z])\d*[A-Za-z])$/i.test(before);
    const raw = m.split("=").map((s) => s.trim());
    // "A = 6 × 5 = 30" starts at "=": no left fragment, so nothing to skip.
    const leading = raw[0] === "";
    const sides = raw.filter(Boolean);
    if (sides.length < 2) continue;
    const vals = sides.map((s) => {
      if (!/\d/.test(s) || /[+\-*/^]\s*$|^\s*[*/^]/.test(s)) return null;
      try {
        const v = Function(`"use strict";return (${s.replace(/\^/g, "**")});`)();
        return Number.isFinite(v) ? v : null;
      } catch {
        return null;
      }
    });
    for (let i = partialLeft && !leading ? 1 : 0; i + 1 < vals.length; i++) {
      const [a, b] = [vals[i], vals[i + 1]];
      if (a === null || b === null) continue;
      if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a), Math.abs(b)) && Math.abs(a - b) > 0.006)
        errors.push(`"${sides[i]} = ${sides[i + 1]}" is false (${+a.toFixed(6)} ≠ ${b})`);
    }
  }
  return errors;
}

function checkText(err, path, value, { limit, es = true, obj } = {}) {
  if (!isStr(value)) return err(`${path} missing`);
  if (limit && words(value) > limit) err(`${path} is ${words(value)} words (max ${limit})`);
  for (const [re, msg] of BANNED) if (re.test(value)) err(`${path} ${msg}`);
  if (es && obj) {
    const key = path
      .split(".")
      .pop()
      .replace(/\[\d+\]$/, "");
    if (!isStr(obj[`${key}Es`])) err(`${path}Es missing`);
    else
      for (const [re, msg] of BANNED.slice(3))
        if (re.test(obj[`${key}Es`])) err(`${path}Es ${msg}`);
  }
}

// Unit abbreviations read the same in Spanish; any other word needs mathEs.
const UNITS = new Set(
  "ft in cm mm km mi yd oz lb lbs kg mL ml L gal qt pt sq cu h hr hrs min sec s mph g m".split(" "),
);
export const mathHasWords = (line) =>
  (String(line).match(/[A-Za-z]{2,}/g) || []).some((w) => !UNITS.has(w));

function checkMathEs(err, path, math, mathEs) {
  const lines = Array.isArray(math) ? math : [math];
  if (!lines.some(mathHasWords)) {
    if (mathEs !== undefined) err(`${path}Es is set but the math has no words to translate`);
    return;
  }
  const es = Array.isArray(mathEs) ? mathEs : mathEs === undefined ? [] : [mathEs];
  if (es.length !== lines.length)
    return err(`${path} has words — mathEs must match it line for line`);
  lines.forEach((l, i) => {
    const digits = (s) => (String(s).match(/\d+/g) || []).join(" ");
    if (digits(l) !== digits(es[i])) err(`${path}Es[${i}] changes the numbers: "${es[i]}"`);
  });
}

function checkMath(err, path, math) {
  const lines = Array.isArray(math) ? math : [math];
  for (const line of lines) {
    if (!isStr(line)) return err(`${path} empty`);
    if (/\d\s*[x*]\s*\d/.test(line)) err(`${path} uses x/* for multiplication: "${line}"`);
    if (/\d\s*-\s*\d/.test(line) && !/\d-\d{2}\b/.test(line))
      err(`${path} uses "-" for minus — use "−": "${line}"`);
    if (words(line.replace(/[\d.,(){}/×÷−+=<>≤≥·⟶$%°:;]+/g, " ")) > 8)
      err(`${path} reads like a sentence — math only: "${line}"`);
    for (const e of arithmeticErrors(line)) err(`${path} ${e}`);
  }
}

function checkExample(err, path, ex, { together = false } = {}) {
  if (!ex || typeof ex !== "object") return err(`${path} missing`);
  checkText(err, `${path}.title`, ex.title, { limit: LIMITS.title, obj: ex });
  checkText(err, `${path}.problem`, ex.problem, { limit: LIMITS.problem, obj: ex });
  for (const e of arithmeticErrors(ex.problem || "")) err(`${path}.problem ${e}`);
  checkText(err, `${path}.answer`, ex.answer, { obj: ex });
  if (ex.figure) checkFigure(err, `${path}.figure`, ex.figure);
  const steps = ex.steps;
  if (!Array.isArray(steps) || steps.length < 2 || steps.length > 5)
    return err(`${path}.steps must have 2–5 steps (has ${steps?.length ?? 0})`);
  steps.forEach((s, i) => {
    const p = `${path}.steps[${i}]`;
    if (together) {
      checkText(err, `${p}.ask`, s.ask, { limit: LIMITS.ask, obj: s });
      if (!isStr(s.answer)) err(`${p}.answer missing (every together step needs one)`);
      else for (const e of arithmeticErrors(s.answer)) err(`${p}.answer ${e}`);
      if (s.do) err(`${p} uses "do" — together steps use ask/answer`);
    } else {
      checkText(err, `${p}.do`, s.do, { limit: LIMITS.do, obj: s });
      if (s.math !== undefined) {
        checkMath(err, `${p}.math`, s.math);
        checkMathEs(err, `${p}.math`, s.math, s.mathEs);
      }
      if (s.why !== undefined) checkText(err, `${p}.why`, s.why, { limit: LIMITS.why, obj: s });
      if (s.ask) err(`${p} uses "ask" — worked steps use do/math/why`);
    }
  });
}

function checkTryIt(err, path, t, { explain }) {
  if (!t || typeof t !== "object") return err(`${path} missing`);
  checkText(err, `${path}.problem`, t.problem, { limit: LIMITS.problem, obj: t });
  checkText(err, `${path}.hint`, t.hint, { limit: 30, obj: t });
  if (!isStr(t.answer)) err(`${path}.answer missing`);
  if (!Array.isArray(t.accept) || !t.accept.length || !t.accept.every(isStr))
    err(`${path}.accept must be a non-empty string array`);
  else {
    // The answer box grades by VALUE (3.5 = 7/2 = 3 1/2), so the displayed
    // answer's leading number must be one of the accepted values.
    const lead = String(t.answer).match(
      /[−-]?\d[\d,]*(?:\.\d+)?(?:\{\d+\/\d+\}|\s\d+\/\d+|\/\d+)?/,
    );
    const want = lead ? numericValue(lead[0]) : null;
    if (
      want !== null &&
      !t.accept.some(
        (a) => numericValue(a) === want || Math.abs((numericValue(a) ?? NaN) - want) < 1e-9,
      )
    )
      err(`${path}.accept has no entry equal to the answer's number "${lead[0]}"`);
    const bad = t.accept.filter(
      (a) => /^[−-]?\d/.test(a) && numericValue(a) === null && !/[a-z]/i.test(a),
    );
    if (bad.length)
      err(`${path}.accept entries are not numbers the box can read: ${bad.join(", ")}`);
  }
  if (t.figure) checkFigure(err, `${path}.figure`, t.figure);
  if (explain) {
    checkText(err, `${path}.explain`, t.explain, { limit: 25, obj: t });
    checkText(err, `${path}.modelExplanation`, t.modelExplanation, { limit: 45, obj: t });
  } else if (t.explain || t.modelExplanation) err(`${path} has explain fields (group2 only)`);
}

function checkGroup(err, path, g, { explain }) {
  if (!g || typeof g !== "object") return err(`${path} missing`);
  checkText(err, `${path}.todayIdea`, g.todayIdea, { limit: LIMITS.todayIdea, obj: g });
  checkText(err, `${path}.bigIdea`, g.bigIdea, { limit: LIMITS.bigIdea, obj: g });
  if (/\b\d\.\s/.test(g.bigIdea || "")) err(`${path}.bigIdea has a numbered list`);
  if (!Array.isArray(g.examples) || g.examples.length < 1 || g.examples.length > 2)
    err(`${path}.examples must have 1–2 examples`);
  else g.examples.forEach((ex, i) => checkExample(err, `${path}.examples[${i}]`, ex));
  checkExample(err, `${path}.together`, g.together, { together: true });
  checkTryIt(err, `${path}.tryIt`, g.tryIt, { explain });
  const figures = [...(g.examples || []), g.together].filter((e) => e?.figure).length;
  if (!figures) err(`${path} has no figure on any example`);
}

export function validateBuild(data, lesson) {
  const problems = [];
  const err = (m) => problems.push(m);
  if (data.lesson !== lesson) err(`lesson is "${data.lesson}", file is ${lesson}`);
  checkGroup(err, "group1", data.group1, { explain: false });
  checkGroup(err, "group2", data.group2, { explain: true });
  const c = data.catchup;
  if (!c) err("catchup missing");
  else {
    checkText(err, "catchup.title", c.title, { limit: LIMITS.title, obj: c });
    checkText(err, "catchup.problem", c.problem, { limit: LIMITS.problem, obj: c });
    checkText(err, "catchup.answer", c.answer, { obj: c });
    if (c.figure) checkFigure(err, "catchup.figure", c.figure);
    if (!Array.isArray(c.steps) || c.steps.length < 2 || c.steps.length > 4)
      err("catchup.steps must have 2–4 steps");
    else
      c.steps.forEach((s, i) => {
        checkText(err, `catchup.steps[${i}].do`, s.do, { limit: LIMITS.do, obj: s });
        if (s.math !== undefined) {
          checkMath(err, `catchup.steps[${i}].math`, s.math);
          checkMathEs(err, `catchup.steps[${i}].math`, s.math, s.mathEs);
        }
        if (s.why !== undefined)
          checkText(err, `catchup.steps[${i}].why`, s.why, { limit: LIMITS.why, obj: s });
      });
    checkTryIt(err, "catchup.check", c.check, { explain: false });
  }
  if (data.vocab !== undefined) {
    for (const [term, v] of Object.entries(data.vocab || {})) {
      const ex = v?.examples;
      if (!Array.isArray(ex) || ex.length < 2) err(`vocab["${term}"].examples needs ≥ 2`);
      else
        ex.forEach((e, i) => {
          if (!isStr(e.text) || words(e.text) > 14)
            err(`vocab["${term}"].examples[${i}].text missing or > 14 words`);
          if (typeof e.isExample !== "boolean")
            err(`vocab["${term}"].examples[${i}].isExample must be boolean`);
          if (!isStr(e.why) || words(e.why) > 18)
            err(`vocab["${term}"].examples[${i}].why missing or > 18 words`);
        });
    }
  }
  return problems;
}

/** Every base lesson that has small-group studios — each one needs Build content. */
export function baseLessons() {
  return listLessonDirs({ filter: CORE_ID_RE }).filter((id) =>
    existsSync(lessonPath(`${id}-group1`)),
  );
}

function main() {
  const args = process.argv.slice(2);
  const all = !args.length;
  const lessons = all
    ? baseLessons()
    : args.map((a) =>
        a
          .replace(/\.json$/, "")
          .split("/")
          .pop(),
      );
  let failed = 0;
  for (const lesson of lessons) {
    const file = join(DIR, `${lesson}.json`);
    if (!existsSync(file)) {
      console.log(`✗ ${lesson}: missing ${file.replace(ROOT + "/", "")}`);
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
    const problems = validateBuild(data, lesson);
    if (problems.length) {
      failed++;
      console.log(`✗ ${lesson} (${problems.length})`);
      for (const p of problems) console.log(`    ${p}`);
    }
  }
  console.log(
    failed
      ? `FAIL validate:small-group-build — ${failed}/${lessons.length} lesson(s)`
      : `PASS validate:small-group-build — ${lessons.length} lesson(s)`,
  );
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

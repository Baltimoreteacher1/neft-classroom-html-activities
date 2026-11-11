#!/usr/bin/env node
/**
 * validate-small-group-investigations.mjs — gate for data/small-group-investigations/*.json,
 * the Group 2 (Challenge) investigation of every small-group studio: a conjecture to judge,
 * an error to find and two strategies to compare. Contract:
 * docs/specs/small-group-investigations-v1.md.
 *
 * Countable half only (shape, bilingual siblings, word limits, notation, arithmetic, verdict
 * spread, duplicate claims). Whether the mathematics is the lesson's own is a reading task.
 *
 *   node tools/validate-small-group-investigations.mjs            # every base lesson must have one
 *   node tools/validate-small-group-investigations.mjs 3-1 4-2    # just these lessons
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  arithmeticErrors,
  baseLessons,
  checkMath,
  checkText,
} from "./validate-small-group-build.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DIR = join(ROOT, "data/small-group-investigations");
export const VERDICTS = ["always", "sometimes", "never"];
export const MAX_VERDICT_SHARE = 0.45;

const LIMIT = {
  claim: 28,
  evidence: 40,
  frame: 16,
  scenario: 22,
  problem: 45,
  line: 22,
  flaw: 30,
  fix: 35,
  name: 5,
  ask: 24,
  insight: 40,
};

/** Units 1 and 10 are not taught (Joel 2026-10-07, 2026-11-11): no authored investigation required. */
export const SKIPPED_UNITS = /^(1|10)-/;

const isStr = (s) => typeof s === "string" && s.trim().length > 0;
const digits = (s) => (String(s).match(/\d+/g) || []).join(" ");
const sentenceLike = (line) => /[A-Za-z]{3,}/.test(String(line).replace(/\b[A-Za-z]\b/g, ""));

/** Lines that are pure mathematics get the full math check; lines with words get notation only. */
function checkLine(err, path, line, lineEs, { arithmetic }) {
  if (!isStr(line)) return err(`${path} missing`);
  if (!isStr(lineEs)) return err(`${path}Es missing`);
  if (digits(line) !== digits(lineEs)) err(`${path}Es changes the numbers: "${lineEs}"`);
  if (/\d\s*[x*]\s*\d/.test(line)) err(`${path} uses x/* for multiplication: "${line}"`);
  if (/\d\s*-\s*\d/.test(line) && !/\d-\d{2}\b/.test(line))
    err(`${path} uses "-" for minus — use "−": "${line}"`);
  if (arithmetic) for (const e of arithmeticErrors(line)) err(`${path} ${e}`);
  if (line.split(/\s+/).length > LIMIT.line) err(`${path} is longer than ${LIMIT.line} words`);
}

function checkConjecture(err, c) {
  if (!c || typeof c !== "object") return err("conjecture missing");
  checkText(err, "conjecture.claim", c.claim, { limit: LIMIT.claim, obj: c });
  checkText(err, "conjecture.evidence", c.evidence, { limit: LIMIT.evidence, obj: c });
  if (!VERDICTS.includes(c.verdict)) err(`conjecture.verdict must be one of ${VERDICTS}`);
  for (const f of ["frames", "framesEs"])
    if (!Array.isArray(c[f]) || c[f].length < 2 || c[f].length > 3 || !c[f].every(isStr))
      err(`conjecture.${f} must be 2–3 non-empty strings`);
  if (Array.isArray(c.frames) && Array.isArray(c.framesEs)) {
    if (c.frames.length !== c.framesEs.length) err("conjecture.framesEs must match frames");
    c.frames.forEach((f, i) => {
      if (f.split(/\s+/).length > LIMIT.frame) err(`conjecture.frames[${i}] is too long`);
      if (!/___/.test(f)) err(`conjecture.frames[${i}] needs a blank (___)`);
    });
  }
  for (const e of arithmeticErrors(c.evidence || "")) err(`conjecture.evidence ${e}`);
}

function checkError(err, e) {
  if (!e || typeof e !== "object") return err("errorAnalysis missing");
  checkText(err, "errorAnalysis.scenario", e.scenario, { limit: LIMIT.scenario, obj: e });
  checkText(err, "errorAnalysis.problem", e.problem, { limit: LIMIT.problem, obj: e });
  checkText(err, "errorAnalysis.flaw", e.flaw, { limit: LIMIT.flaw, obj: e });
  checkText(err, "errorAnalysis.fix", e.fix, { limit: LIMIT.fix, obj: e });
  if (!Array.isArray(e.work) || e.work.length < 3 || e.work.length > 5)
    return err(`errorAnalysis.work must have 3–5 lines (has ${e.work?.length ?? 0})`);
  if (!Number.isInteger(e.flawed) || e.flawed < 0 || e.flawed >= e.work.length)
    err("errorAnalysis.flawed must be a 0-based index into work");
  e.work.forEach((w, i) =>
    // The flawed line may state a false equation on purpose — everything else may not.
    checkLine(err, `errorAnalysis.work[${i}].line`, w.line, w.lineEs, {
      arithmetic: i !== e.flawed && !sentenceLike(w.line),
    }),
  );
  for (const x of arithmeticErrors(e.fix || "")) err(`errorAnalysis.fix ${x}`);
}

function checkCompare(err, c) {
  if (!c || typeof c !== "object") return err("compare missing");
  checkText(err, "compare.problem", c.problem, { limit: LIMIT.problem, obj: c });
  checkText(err, "compare.ask", c.ask, { limit: LIMIT.ask, obj: c });
  checkText(err, "compare.insight", c.insight, { limit: LIMIT.insight, obj: c });
  if (!Array.isArray(c.methods) || c.methods.length !== 2)
    return err("compare.methods must have exactly 2 methods");
  const names = c.methods.map((m) => String(m.name).toLowerCase());
  if (names[0] === names[1]) err("compare.methods must be different strategies");
  c.methods.forEach((m, i) => {
    const p = `compare.methods[${i}]`;
    checkText(err, `${p}.name`, m.name, { limit: LIMIT.name, obj: m });
    if (!Array.isArray(m.lines) || m.lines.length < 2 || m.lines.length > 4)
      return err(`${p}.lines must have 2–4 lines`);
    if (!Array.isArray(m.linesEs) || m.linesEs.length !== m.lines.length)
      return err(`${p}.linesEs must match lines`);
    m.lines.forEach((line, j) =>
      checkLine(err, `${p}.lines[${j}]`, line, m.linesEs[j], { arithmetic: !sentenceLike(line) }),
    );
  });
  for (const x of arithmeticErrors(c.insight || "")) err(`compare.insight ${x}`);
}

/** Pure per-file check; returns the list of errors. */
export function checkInvestigation(lesson, d) {
  const errors = [];
  const err = (m) => errors.push(`${lesson}: ${m}`);
  if (!d || typeof d !== "object") return [`${lesson}: not an object`];
  if (d.lesson !== lesson) err(`"lesson" must be "${lesson}"`);
  checkConjecture(err, d.conjecture);
  checkError(err, d.errorAnalysis);
  checkCompare(err, d.compare);
  return errors;
}

/** Cross-file rules: verdict spread and repeated claims/scenarios. */
export function checkSet(all) {
  const errors = [];
  const verdicts = {};
  const seen = new Map();
  for (const [lesson, d] of Object.entries(all)) {
    verdicts[d.conjecture?.verdict] = (verdicts[d.conjecture?.verdict] || 0) + 1;
    for (const [kind, text] of [
      ["claim", d.conjecture?.claim],
      ["scenario", d.errorAnalysis?.scenario],
      ["problem", d.errorAnalysis?.problem],
      ["compare problem", d.compare?.problem],
    ]) {
      const key = `${kind}:${String(text).toLowerCase().replace(/\W+/g, " ").trim()}`;
      if (seen.has(key)) errors.push(`${lesson}: repeats ${kind} from ${seen.get(key)}`);
      else seen.set(key, lesson);
    }
  }
  const total = Object.keys(all).length;
  for (const v of VERDICTS)
    if (total >= 20 && (verdicts[v] || 0) / total > MAX_VERDICT_SHARE)
      errors.push(`verdict "${v}" is ${verdicts[v]} of ${total} (max ${MAX_VERDICT_SHARE * 100}%)`);
  return { errors, verdicts };
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
    : baseLessons().filter((id) => !SKIPPED_UNITS.test(id));
  const errors = [];
  const all = {};
  for (const id of lessons) {
    const file = join(DIR, `${id}.json`);
    if (!existsSync(file)) {
      errors.push(`${id}: no data/small-group-investigations/${id}.json`);
      continue;
    }
    let d;
    try {
      d = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      errors.push(`${id}: invalid JSON (${e.message})`);
      continue;
    }
    all[id] = d;
    errors.push(...checkInvestigation(id, d));
  }
  const set = checkSet(all);
  if (!args.length) errors.push(...set.errors);
  if (!lessons.length) errors.push("swept zero lessons");
  if (errors.length) {
    console.error(`FAIL validate:small-group-investigations (${errors.length})`);
    for (const e of errors.slice(0, 80)) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(
    `PASS validate:small-group-investigations — ${lessons.length} lessons; verdicts ${JSON.stringify(set.verdicts)}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

// checkMath is re-exported for authoring tools that want the same notation rules.
export { checkMath };

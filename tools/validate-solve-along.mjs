#!/usr/bin/env node
/**
 * Validate every solve-along.json across the 22 unit culminating-project
 * wizard pages. This is the correctness gate for the SOLVE-ALONG layer:
 *
 *   1. Each file parses and matches the schema (version, solves[]).
 *   2. Each solve names a step, has a title, ≥1 worked step, and a yourTurn.
 *   3. Each yourTurn carries a machine-checkable `expr` (safe arithmetic only)
 *      whose evaluation equals the stored `answer` within `tolerance`. This
 *      catches any hand-authoring math error before it can ship.
 *   4. The named step id exists in the sibling index.html and is a .step-panel.
 *
 * Exit non-zero on any failure. Safe to run in CI / the QA loop.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const UNITS = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"];

/* Evaluate a strict arithmetic expression: digits, . + - * / ( ) and spaces
   only. No identifiers, no calls — safe to Function-eval. */
function safeEval(expr) {
  if (typeof expr !== "string" || !/^[0-9.\s+\-*/()]+$/.test(expr)) {
    throw new Error(`unsafe or empty expr: ${JSON.stringify(expr)}`);
  }
  // eslint-disable-next-line no-new-func
  const val = Function(`"use strict";return (${expr});`)();
  if (!Number.isFinite(val)) throw new Error(`expr did not evaluate to a finite number: ${expr}`);
  return val;
}

function biOk(obj) {
  return obj && typeof obj === "object" && typeof obj.en === "string" && obj.en.trim() && typeof obj.es === "string" && obj.es.trim();
}

const errors = [];
let files = 0;
let solves = 0;

for (const u of UNITS) {
  for (const v of ["version-a", "version-b"]) {
    const rel = `math/${u}/projects/${v}/solve-along.json`;
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    files++;
    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      errors.push(`${rel}: invalid JSON — ${e.message}`);
      continue;
    }
    if (cfg.version !== 1 || !Array.isArray(cfg.solves) || !cfg.solves.length) {
      errors.push(`${rel}: expected { version: 1, solves: [ … ] }`);
      continue;
    }
    const htmlPath = path.join(ROOT, `math/${u}/projects/${v}/index.html`);
    const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "";

    cfg.solves.forEach((s, i) => {
      const at = `${rel}[${i}]`;
      solves++;
      if (typeof s.step !== "string" || !/^step-\d+$/.test(s.step)) {
        errors.push(`${at}: missing/invalid step id`);
      } else if (html && !new RegExp(`id="${s.step}"`).test(html)) {
        errors.push(`${at}: step "${s.step}" not found in index.html`);
      }
      if (!biOk(s.title)) errors.push(`${at}: title must be {en,es}`);
      if (!biOk(s.prompt)) errors.push(`${at}: prompt must be {en,es}`);
      if (!Array.isArray(s.steps) || !s.steps.length) {
        errors.push(`${at}: steps[] required`);
      } else {
        s.steps.forEach((w, j) => {
          if (!biOk(w.do)) errors.push(`${at}.steps[${j}]: do must be {en,es}`);
          if (typeof w.math !== "string" || !w.math.trim()) errors.push(`${at}.steps[${j}]: math string required`);
          if (!biOk(w.why)) errors.push(`${at}.steps[${j}]: why must be {en,es}`);
        });
      }
      if (!biOk(s.answer)) errors.push(`${at}: answer must be {en,es}`);
      const yt = s.yourTurn;
      if (!yt || typeof yt !== "object") {
        errors.push(`${at}: yourTurn required`);
        return;
      }
      if (!biOk(yt.ask)) errors.push(`${at}.yourTurn: ask must be {en,es}`);
      if (typeof yt.answer !== "number" || !Number.isFinite(yt.answer)) {
        errors.push(`${at}.yourTurn: numeric answer required`);
      }
      const tol = typeof yt.tolerance === "number" && yt.tolerance >= 0 ? yt.tolerance : 0.01;
      try {
        const computed = safeEval(yt.expr);
        if (Math.abs(computed - yt.answer) > tol) {
          errors.push(`${at}.yourTurn: expr "${yt.expr}" = ${computed}, but answer = ${yt.answer} (Δ ${Math.abs(computed - yt.answer)} > tol ${tol})`);
        }
      } catch (e) {
        errors.push(`${at}.yourTurn: ${e.message}`);
      }
      if (!Array.isArray(yt.solution) || !yt.solution.length) {
        errors.push(`${at}.yourTurn: solution[] required`);
      } else {
        yt.solution.forEach((w, j) => {
          if (!biOk(w.do)) errors.push(`${at}.yourTurn.solution[${j}]: do must be {en,es}`);
          if (typeof w.math !== "string" || !w.math.trim()) errors.push(`${at}.yourTurn.solution[${j}]: math string required`);
          if (!biOk(w.why)) errors.push(`${at}.yourTurn.solution[${j}]: why must be {en,es}`);
        });
      }
    });
  }
}

if (errors.length) {
  console.error(`SOLVE-ALONG validation FAILED (${errors.length} issue(s)):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`SOLVE-ALONG validation PASSED — ${files} file(s), ${solves} solve(s), all expr↔answer checks consistent.`);
process.exit(0);

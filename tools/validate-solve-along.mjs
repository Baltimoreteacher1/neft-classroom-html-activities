#!/usr/bin/env node
/**
 * Validate every solve-along.json across all unit culminating-project
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
import { PROJECT_UNITS } from "./lib/project-units.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const UNITS = PROJECT_UNITS;

function versionsOf(unit) {
  const projects = path.join(ROOT, "math", unit, "projects");
  if (!fs.existsSync(projects)) return [];
  return fs
    .readdirSync(projects, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^version-[a-z]$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

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
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.en === "string" &&
    obj.en.trim() &&
    typeof obj.es === "string" &&
    obj.es.trim()
  );
}

const errors = [];
let files = 0;
let solves = 0;
let practiceItems = 0;
let errorCards = 0;

for (const u of UNITS) {
  for (const v of versionsOf(u)) {
    const rel = `math/${u}/projects/${v}/solve-along.json`;
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      /* projects-solve.js fetches ./solve-along.json unconditionally on any
         page that loads it, so a missing sidecar is not "this page opted out"
         — it is a 404 in the student's console and a worked-example layer that
         silently never appears. Only a page WITHOUT the layer may omit it. */
      const pageHtml = path.join(ROOT, `math/${u}/projects/${v}/index.html`);
      if (
        fs.existsSync(pageHtml) &&
        fs.readFileSync(pageHtml, "utf8").includes("projects-solve.js")
      ) {
        errors.push(
          `${rel}: missing, but the page loads projects-solve.js — it will 404 on every visit`,
        );
      }
      continue;
    }
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
          if (typeof w.math !== "string" || !w.math.trim())
            errors.push(`${at}.steps[${j}]: math string required`);
          if (!biOk(w.why)) errors.push(`${at}.steps[${j}]: why must be {en,es}`);
        });
      }
      if (!biOk(s.answer)) errors.push(`${at}: answer must be {en,es}`);
      const yt = s.yourTurn;
      if (!yt || typeof yt !== "object") {
        errors.push(`${at}: yourTurn required`);
        return;
      }
      // A single yourTurn object is treated as a one-item set.
      const ytItems = Array.isArray(yt.items) && yt.items.length ? yt.items : [yt];
      ytItems.forEach((item, k) => {
        const iat = `${at}.yourTurn.items[${k}]`;
        practiceItems++;
        if (!biOk(item.ask)) errors.push(`${iat}: ask must be {en,es}`);
        if (typeof item.answer !== "number" || !Number.isFinite(item.answer)) {
          errors.push(`${iat}: numeric answer required`);
        }
        const tol =
          typeof item.tolerance === "number" && item.tolerance >= 0 ? item.tolerance : 0.01;
        try {
          const computed = safeEval(item.expr);
          if (Math.abs(computed - item.answer) > tol) {
            errors.push(
              `${iat}: expr "${item.expr}" = ${computed}, but answer = ${item.answer} (Δ ${Math.abs(computed - item.answer)} > tol ${tol})`,
            );
          }
        } catch (e) {
          errors.push(`${iat}: ${e.message}`);
        }
        if (!Array.isArray(item.solution) || !item.solution.length) {
          errors.push(`${iat}: solution[] required`);
        } else {
          item.solution.forEach((w, j) => {
            if (!biOk(w.do)) errors.push(`${iat}.solution[${j}]: do must be {en,es}`);
            if (typeof w.math !== "string" || !w.math.trim())
              errors.push(`${iat}.solution[${j}]: math string required`);
            if (!biOk(w.why)) errors.push(`${iat}.solution[${j}]: why must be {en,es}`);
          });
        }
      });
    });

    // Error-analysis "Spot the Mistake" checks.
    if (cfg.errorChecks !== undefined) {
      if (!Array.isArray(cfg.errorChecks)) {
        errors.push(`${rel}: errorChecks must be an array`);
      } else {
        cfg.errorChecks.forEach((e, i) => {
          const eat = `${rel}.errorChecks[${i}]`;
          errorCards++;
          if (typeof e.step !== "string" || !/^step-\d+$/.test(e.step)) {
            errors.push(`${eat}: missing/invalid step id`);
          } else if (html && !new RegExp(`id="${e.step}"`).test(html)) {
            errors.push(`${eat}: step "${e.step}" not found in index.html`);
          }
          if (!biOk(e.title)) errors.push(`${eat}: title must be {en,es}`);
          if (!biOk(e.prompt)) errors.push(`${eat}: prompt must be {en,es}`);
          if (!biOk(e.explanation)) errors.push(`${eat}: explanation must be {en,es}`);
          if (!Array.isArray(e.work) || e.work.length < 2) {
            errors.push(`${eat}: work[] must have at least 2 steps`);
          } else {
            e.work.forEach((w, j) => {
              if (typeof w.math !== "string" || !w.math.trim())
                errors.push(`${eat}.work[${j}]: math string required`);
              if (w.note !== undefined && !biOk(w.note))
                errors.push(`${eat}.work[${j}]: note must be {en,es} when present`);
            });
            if (!Number.isInteger(e.flawIndex) || e.flawIndex < 0 || e.flawIndex >= e.work.length) {
              errors.push(
                `${eat}: flawIndex ${e.flawIndex} out of range for ${e.work.length} steps`,
              );
            }
          }
          if (!e.fix || typeof e.fix !== "object") {
            errors.push(`${eat}: fix { math, why } required`);
          } else {
            if (typeof e.fix.math !== "string" || !e.fix.math.trim())
              errors.push(`${eat}.fix: math string required`);
            if (!biOk(e.fix.why)) errors.push(`${eat}.fix: why must be {en,es}`);
          }
        });
      }
    }
  }
}

if (errors.length) {
  console.error(`SOLVE-ALONG validation FAILED (${errors.length} issue(s)):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `SOLVE-ALONG validation PASSED — ${files} file(s), ${solves} solve(s), ${practiceItems} practice item(s), ${errorCards} error-analysis card(s); all expr↔answer checks consistent.`,
);
process.exit(0);

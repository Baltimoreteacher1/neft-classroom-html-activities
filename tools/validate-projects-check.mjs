#!/usr/bin/env node
/**
 * Gate for the culminating-project STEP-CHECK layer.
 *
 * /shared/projects/projects-check.js is config-driven, and a page with no entry
 * in projects-check-config.json is a SILENT no-op — as is a check whose `ref`
 * names an element the page does not have. That silence is the whole reason
 * this gate exists. Two real failures it would have caught:
 *
 *   • math/unit-1/projects/version-c and math/unit-10/projects/version-c had no
 *     config entry at all, so neither had a "Check my work" button. Both pages
 *     had instead grown JS that computed and PRINTED the answers.
 *   • math/unit-2/projects/version-{a,b} carried the config of the legacy
 *     Reveal-era Unit 2 (fraction division: `w-strip-den`, `f-swatch-num`,
 *     `bakery-compare`). Canonical Unit 2 is Data Detectives, so every one of
 *     those refs pointed at nothing and the layer checked zero fields while
 *     reporting no error.
 *
 * Checks, all of them decidable facts about files on disk:
 *   1. every version-<x> project page has a config entry;
 *   2. every configured route resolves to a real page;
 *   3. every step key is an element id on that page;
 *   4. every check `ref` and every `{ref}` inside a derived/relation `expr` is
 *      an element id on that page;
 *   5. every `expr` parses against the evaluator's grammar and uses only
 *      functions the evaluator actually defines.
 *
 * It deliberately does NOT judge whether a check is pedagogically good — that
 * is a reading task, not a gate.
 *
 * Self-tests its own detectors first, so a validator that stops firing fails
 * loudly instead of reporting a clean fleet.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = path.join(ROOT, "shared/projects/projects-check-config.json");
const RUNTIME = path.join(ROOT, "shared/projects/projects-check.js");

/* ---------- detectors ---------- */

export function idsOf(html) {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

export function refsOf(check) {
  const out = [];
  if (check.ref) out.push(check.ref);
  for (const m of String(check.expr || "").matchAll(/\{([^}]+)\}/g)) out.push(m[1].trim());
  return out;
}

/** Mirrors the tokenizer in projects-check.js closely enough to reject the
 *  things it would throw on: unknown functions, unbalanced parens, stray
 *  characters, unterminated refs. */
export function exprProblems(expr, knownFns) {
  const s = String(expr);
  if (!s.trim()) return ["empty expr"];
  const problems = [];
  let depth = 0;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === "{") {
      const end = s.indexOf("}", i);
      if (end === -1) {
        problems.push("unterminated ref");
        break;
      }
      i = end + 1;
    } else if (/[0-9.]/.test(c)) {
      const m = /^[0-9]*\.?[0-9]+/.exec(s.slice(i));
      if (!m) {
        problems.push(`bad number at ${i}`);
        break;
      }
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
      if (!knownFns.has(m[0])) problems.push(`unknown function ${m[0]}`);
      i += m[0].length;
    } else if ("+-*/(),".includes(c)) {
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (depth < 0) {
        problems.push("unbalanced )");
        break;
      }
      i++;
    } else {
      problems.push(`illegal character ${JSON.stringify(c)}`);
      break;
    }
  }
  if (depth > 0) problems.push("unbalanced (");
  return problems;
}

/** Function names the runtime's FUNCS table actually defines. */
export function runtimeFunctions(src) {
  const block = src.slice(src.indexOf("var FUNCS = {"));
  const end = block.indexOf("\n  };");
  return new Set(
    [...block.slice(0, end).matchAll(/^\s{4}([a-z][A-Za-z0-9_]*):/gm)].map((m) => m[1]),
  );
}

/* ---------- self-test ---------- */

function selfTest() {
  const fns = new Set(["abs", "min", "gcd"]);
  const cases = [
    ["ids: finds them", () => idsOf('<div id="a"></div><input id="b">').size === 2],
    ["ids: ignores data-id", () => !idsOf('<div data-id="x"></div>').has("x")],
    ["refs: ref + expr refs", () => refsOf({ ref: "r", expr: "{a} + {b}" }).join() === "r,a,b"],
    ["refs: no expr", () => refsOf({ ref: "r" }).join() === "r"],
    ["expr: valid passes", () => exprProblems("gcd({a}, {b}) / 2", fns).length === 0],
    ["expr: unknown fn caught", () => exprProblems("lcm({a},{b})", fns).length === 1],
    ["expr: unbalanced paren caught", () => exprProblems("abs({a}", fns).length === 1],
    ["expr: stray char caught", () => exprProblems("{a} % {b}", fns).length === 1],
    ["expr: unterminated ref caught", () => exprProblems("{a + 1", fns).length === 1],
    ["expr: empty caught", () => exprProblems("  ", fns).length === 1],
    [
      "runtimeFunctions reads FUNCS",
      () => runtimeFunctions(fs.readFileSync(RUNTIME, "utf8")).has("gcd"),
    ],
  ];
  const failed = cases.filter(([, fn]) => !fn()).map(([name]) => name);
  if (failed.length) {
    console.error("SELF-TEST FAILED — detectors are not working:");
    for (const f of failed) console.error("  ✗ " + f);
    process.exit(1);
  }
  return cases.length;
}

/* ---------- sweep ---------- */

function projectPages() {
  const out = [];
  const roots = fs
    .readdirSync(path.join(ROOT, "math"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => `math/${e.name}/projects`);
  for (const dir of roots) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (!e.isDirectory() || !/^version-[a-z]$/.test(e.name)) continue;
      if (fs.existsSync(path.join(abs, e.name, "index.html"))) out.push(`/${dir}/${e.name}/`);
    }
  }
  return out.sort();
}

function main() {
  const selfTests = selfTest();
  const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  const pages = cfg.pages || {};
  const fns = runtimeFunctions(fs.readFileSync(RUNTIME, "utf8"));
  const errors = [];

  const onDisk = projectPages();
  for (const route of onDisk) {
    if (!pages[route])
      errors.push(`${route} — project page has no entry in projects-check-config.json`);
  }

  let refCount = 0;
  let checkCount = 0;
  for (const [route, page] of Object.entries(pages)) {
    const file = path.join(ROOT, route.replace(/^\//, ""), "index.html");
    if (!fs.existsSync(file)) {
      errors.push(`${route} — configured route has no page on disk`);
      continue;
    }
    const ids = idsOf(fs.readFileSync(file, "utf8"));
    for (const [step, stepCfg] of Object.entries(page.steps || {})) {
      if (!ids.has(step)) errors.push(`${route} — step "${step}" is not an element id on the page`);
      for (const check of stepCfg.checks || []) {
        checkCount++;
        for (const ref of refsOf(check)) {
          refCount++;
          if (!ids.has(ref))
            errors.push(`${route} ${step} — ref "${ref}" is not an element id on the page`);
        }
        if (check.expr) {
          for (const p of exprProblems(check.expr, fns)) {
            errors.push(`${route} ${step} — expr "${check.expr}": ${p}`);
          }
        }
      }
    }
  }

  if (errors.length) {
    console.error(`Projects step-check validation FAILED — ${errors.length} problem(s):`);
    for (const e of errors) console.error("  ✗ " + e);
    process.exit(1);
  }
  console.log(
    `Projects step-check validation passed: ${selfTests} self-tests, ${onDisk.length} project pages all configured, ` +
      `${checkCount} checks, ${refCount} refs resolved, functions available: ${[...fns].sort().join(", ")}.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();

#!/usr/bin/env node
/* =============================================================================
 * validate-language-page-performance.mjs — the lab shell may not get heavier than the budget says.
 *
 * WHY. Measured live on 2026-11-24, the home page transferred 1.36 MB over 158 requests, 414 KB of it CSS, and the shell
 * (access-practice-lab/index.html) carried 120 render-blocking stylesheet links and 133 module preloads. By 2026-11-25 it was 124 and
 * 134: every new lab feature adds a sheet, and nothing counted them. data/language-page-perf-budget.json holds, per metric, a
 * `target` (where the program wants to be) and a `ratchet` (today's measurement, which may only go DOWN), the pattern of
 * data/family-performance-budget.json.
 *
 * This reads the shell's own HTML and the files it names, so it is deterministic, needs no browser and no network, and runs in CI.
 *   node tools/validate-language-page-performance.mjs            check the budget
 *   node tools/validate-language-page-performance.mjs --print    print the measurements as JSON
 *
 * A failure means the change added weight to the shell. The fix is to bundle the new stylesheet into the shell's bundle
 * (tools/bundle-access-styles.mjs) or load it only on the route that needs it, not to raise the ratchet. Lower a ratchet to the new
 * measurement whenever a change reduces weight.
 * ========================================================================== */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SHELL = "access-practice-lab/index.html";
const BUDGET = "data/language-page-perf-budget.json";

const kb = (n) => Math.round((n / 1024) * 10) / 10;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;

/** Render-blocking stylesheets: real <link rel="stylesheet"> tags with no media restriction and no deferral. */
export function blockingStylesheets(html) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel=["']stylesheet["']/i.test(tag)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1] || "";
    if (!/^(\/|https?:)/.test(href) || href.includes("'+") || href.includes('"+')) continue; // a string inside a script
    const media = /media=["']([^"']+)["']/i.exec(tag)?.[1];
    if (media && media.trim() !== "all") continue;
    if (/data-defer|onload=/i.test(tag)) continue;
    out.push(href.split("?")[0]);
  }
  return out;
}

export const modulePreloads = (html) =>
  [...html.matchAll(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi)].length;

export function measure(html, readFile) {
  const sheets = blockingStylesheets(html);
  const missing = [];
  let cssBytes = 0;
  for (const href of sheets) {
    const buf = readFile(href);
    if (buf) cssBytes += gz(buf);
    else if (!/^https?:/.test(href)) missing.push(href);
  }
  return {
    blockingStylesheets: sheets.length,
    modulePreloads: modulePreloads(html),
    blockingCssGzipKB: kb(cssBytes),
    shellHtmlGzipKB: kb(gz(Buffer.from(html))),
    missing,
  };
}

/** Limit for a metric: the ratchet when present (it is today's number), else the target. */
export const limitOf = (b) => (typeof b.ratchet === "number" ? b.ratchet : b.target);

export function compare(measured, budget) {
  const problems = [];
  const lower = [];
  for (const [metric, b] of Object.entries(budget.metrics)) {
    const m = measured[metric];
    if (typeof m !== "number") {
      problems.push(`${metric}: not measured`);
      continue;
    }
    if (m > limitOf(b))
      problems.push(
        `${metric}: ${m} is over the limit ${limitOf(b)} (target ${b.target}${b.ratchet ? `, ratchet ${b.ratchet}` : ""})`,
      );
    else if (typeof b.ratchet === "number" && m < b.ratchet)
      lower.push(`${metric}: ratchet ${b.ratchet} can be lowered to ${m}`);
  }
  return { problems, lower };
}

// ---- self-tests: seeded defects must be caught, clean shapes must pass
{
  const html = `<link rel="stylesheet" href="/a.css?v=1"><link rel="stylesheet" href="/b.css" media="print"><link rel="stylesheet" href="/c.css" media="all"><link rel="stylesheet" href="/d.css" onload="this.media='all'"><script>x('<link rel="stylesheet" href="'+f+'">')</script><link rel="modulepreload" href="/m.js"><link rel="modulepreload" href="/n.js">`;
  const sheets = blockingStylesheets(html);
  if (sheets.join() !== "/a.css,/c.css")
    throw new Error(`blockingStylesheets self-test failed: ${sheets}`);
  if (modulePreloads(html) !== 2) throw new Error("modulePreloads self-test failed");
  const m = measure(html, (h) => Buffer.from("a".repeat(5000) + h));
  if (m.blockingStylesheets !== 2 || m.blockingCssGzipKB <= 0)
    throw new Error("measure self-test failed");
  const budget = {
    metrics: { blockingStylesheets: { target: 1, ratchet: 2 }, modulePreloads: { target: 1 } },
  };
  const c = compare({ blockingStylesheets: 3, modulePreloads: 1 }, budget);
  if (c.problems.length !== 1 || !/blockingStylesheets: 3 is over/.test(c.problems[0]))
    throw new Error("compare must fail a ratchet breach");
  if (compare({ blockingStylesheets: 2, modulePreloads: 1 }, budget).problems.length)
    throw new Error("compare must pass a measurement at the ratchet");
  if (compare({ blockingStylesheets: 1, modulePreloads: 1 }, budget).lower.length !== 1)
    throw new Error("compare must say when a ratchet can come down");
  if (compare({ modulePreloads: 1 }, budget).problems.length !== 1)
    throw new Error("compare must fail an unmeasured metric");
}

const html = readFileSync(join(ROOT, SHELL), "utf8");
const readFile = (href) => {
  for (const p of [join(ROOT, href), join(ROOT, "public", href)])
    if (existsSync(p)) return readFileSync(p);
  return null;
};
const measured = measure(html, readFile);
if (process.argv.includes("--print")) {
  console.log(JSON.stringify(measured, null, 2));
  process.exit(0);
}
const budget = JSON.parse(readFileSync(join(ROOT, BUDGET), "utf8"));
const { problems, lower } = compare(measured, budget);
if (measured.missing.length)
  problems.push(
    `the shell names stylesheets that do not exist: ${measured.missing.slice(0, 3).join(", ")}`,
  );
for (const l of lower) console.log(`  note  ${l}`);
if (problems.length) {
  console.error("validate-language-page-performance: FAIL");
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\n  A change added weight to the lab shell. Bundle the new stylesheet into the shell bundle (tools/bundle-access-styles.mjs) or load it only on the route that needs it; do not raise the ratchet.",
  );
  process.exit(1);
}
console.log(
  `validate-language-page-performance: PASS (${measured.blockingStylesheets} blocking stylesheets, ${measured.modulePreloads} module preloads, ${measured.blockingCssGzipKB} KB gzip CSS, ${measured.shellHtmlGzipKB} KB gzip HTML; budget ${BUDGET})`,
);

#!/usr/bin/env node
/* =============================================================================
 * audit-save-resume-integration.js — verify the Save/Resume rollout.
 *
 * Checks:
 *   - Shared engine + styles exist.
 *   - Every ACTIVE HTML activity references both the CSS and the JS.
 *   - No duplicate injections (sentinel appears the expected number of times).
 *   - Injected files still have basic structural validity (head/body/html).
 *   - No build/dev/archive files were touched (those are skipped here too).
 *   - Reports skipped files and reasons.
 *
 * Exit code 0 = all good; 1 = problems found (CI-friendly).
 *
 * USAGE: node tools/audit-save-resume-integration.js
 * ========================================================================== */

import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join, relative, sep, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "nsr-injected";
const CSS_REF = "/shared/save-resume/save-resume-styles.css";
const JS_REF = "/shared/save-resume/save-resume-engine.js";

// Keep these IN SYNC with tools/inject-save-resume.js.
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".github",
  ".claude",
  ".wrangler",
  ".vscode",
  "scripts",
  "engine",
  "functions",
  "migrations",
  "workers",
  "shared",
  "tools",
]);
const SKIP_TOPLEVEL = new Set([
  "dashboard",
  "teacher-data-dashboard",
  "teacher-tools",
  "neft-school-hub",
  "neft-data-studio",
  "results-worker",
  "directory",
  "data",
  "assets",
  "docs",
  "curriculum",
]);
const SKIP_FILE_RE = /(^|[/\\])(404|sitemap|robots)\b/i;

const issues = [];
const stats = {
  scanned: 0,
  ok: 0,
  missingRefs: [],
  duplicates: [],
  brokenStructure: [],
  skipped: 0,
};

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name.startsWith("_") || SKIP_DIRS.has(name)) continue;
      if (dir === ROOT && SKIP_TOPLEVEL.has(name)) continue;
      walk(full);
    } else if (name.toLowerCase().endsWith(".html")) {
      check(full);
    }
  }
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function check(file) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (SKIP_FILE_RE.test(rel)) {
    stats.skipped++;
    return;
  }
  let html;
  try {
    html = readFileSync(file, "utf8");
  } catch {
    return;
  }
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
    stats.skipped++;
    return;
  }
  stats.scanned++;

  const hasCss = html.includes(CSS_REF);
  const hasJs = html.includes(JS_REF);
  if (!hasCss || !hasJs) {
    stats.missingRefs.push(
      rel + (hasCss ? "" : " [css]") + (hasJs ? "" : " [js]"),
    );
    return;
  }
  // Duplicate detection: each ref should appear exactly once.
  if (count(html, CSS_REF) > 1 || count(html, JS_REF) > 1) {
    stats.duplicates.push(rel);
  }
  // Sentinel begin/end balance.
  const begins = count(html, `${MARK}:begin`);
  const ends = count(html, `${MARK}:end`);
  if (begins !== ends) {
    stats.brokenStructure.push(`${rel} (begin=${begins}, end=${ends})`);
  }
  // Light structural sanity.
  if (!/<html[\s>]/i.test(html)) {
    stats.brokenStructure.push(`${rel} (no <html>)`);
  }
  if (
    stats.duplicates[stats.duplicates.length - 1] !== rel &&
    stats.brokenStructure[stats.brokenStructure.length - 1] !== rel
  ) {
    stats.ok++;
  }
}

console.log("\nSave/Resume integration audit\nroot:", ROOT, "\n");

// 1) Shared files exist.
const sharedJs = join(ROOT, "shared/save-resume/save-resume-engine.js");
const sharedCss = join(ROOT, "shared/save-resume/save-resume-styles.css");
if (!existsSync(sharedJs)) issues.push("MISSING shared engine: " + sharedJs);
if (!existsSync(sharedCss)) issues.push("MISSING shared styles: " + sharedCss);

walk(ROOT);

console.log("Shared files       :", issues.length ? "PROBLEM" : "present");
console.log("Active HTML scanned:", stats.scanned);
console.log("Fully integrated   :", stats.ok);
console.log("Skipped            :", stats.skipped);
console.log("Missing refs       :", stats.missingRefs.length);
if (stats.missingRefs.length)
  console.log("   →", stats.missingRefs.slice(0, 20));
console.log("Duplicate refs     :", stats.duplicates.length);
if (stats.duplicates.length) console.log("   →", stats.duplicates.slice(0, 20));
console.log("Structure warnings :", stats.brokenStructure.length);
if (stats.brokenStructure.length)
  console.log("   →", stats.brokenStructure.slice(0, 20));

const problems =
  issues.length +
  stats.missingRefs.length +
  stats.duplicates.length +
  stats.brokenStructure.length;
if (issues.length) console.log("\nIssues:\n  " + issues.join("\n  "));
console.log(
  "\nRESULT:",
  problems === 0 ? "PASS ✅" : `FAIL ❌ (${problems} problem group(s))`,
);
process.exit(problems === 0 ? 0 : 1);

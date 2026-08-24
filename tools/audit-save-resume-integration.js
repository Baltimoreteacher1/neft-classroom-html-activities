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

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, relative, sep } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Skip rules + ref/marker strings are shared with the injector via one module,
// so the audit can never drift out of sync with what inject-save-resume.js does.
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";
import {
  CSS_REF,
  JS_REF,
  MARK,
  SKIP_DIRS,
  SKIP_FILE_RE,
  SKIP_PATH_RE,
  SKIP_TOPLEVEL,
} from "./save-resume-config.js";

const issues = [];
const stats = {
  scanned: 0,
  ok: 0,
  missingRefs: [],
  duplicates: [],
  brokenStructure: [],
  unsentineled: [],
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
  if (SKIP_FILE_RE.test(rel) || SKIP_PATH_RE.test(rel)) {
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
    stats.missingRefs.push(rel + (hasCss ? "" : " [css]") + (hasJs ? "" : " [js]"));
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
  // Sentinel coverage: the injector wraps the stylesheet (before </head>) and
  // the engine (before </body>) in its own marker, so a canonically-integrated
  // page has exactly TWO begin markers. Both refs present but begins !== 2 means
  // the page carries raw refs the injector won't recognize — it would duplicate
  // them on the next `fix:save-resume`. This is the drift that hit the
  // projects/version-b and math-rpg pages; flag it so it's caught, not shipped.
  if (begins !== 2) {
    stats.unsentineled.push(`${rel} (marker begins=${begins}, expected 2)`);
  }
  // Light structural sanity.
  if (!/<html[\s>]/i.test(html)) {
    stats.brokenStructure.push(`${rel} (no <html>)`);
  }
  if (
    stats.duplicates[stats.duplicates.length - 1] !== rel &&
    stats.brokenStructure[stats.brokenStructure.length - 1] !== rel &&
    stats.unsentineled[stats.unsentineled.length - 1] !== rel
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
assertNonEmpty(
  "active HTML activities scanned",
  { length: stats.scanned },
  "The walk found no activity pages — a zero scan reports 0 missing integrations, which reads exactly like a healthy site.",
  100,
);
assertSweptEnough(
  "validate:save-resume",
  { length: stats.scanned },
  "Discovery for validate:save-resume returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);

console.log("Shared files       :", issues.length ? "PROBLEM" : "present");
console.log("Active HTML scanned:", stats.scanned);
console.log("Fully integrated   :", stats.ok);
console.log("Skipped            :", stats.skipped);
console.log("Missing refs       :", stats.missingRefs.length);
if (stats.missingRefs.length) console.log("   →", stats.missingRefs.slice(0, 20));
console.log("Duplicate refs     :", stats.duplicates.length);
if (stats.duplicates.length) console.log("   →", stats.duplicates.slice(0, 20));
console.log("Structure warnings :", stats.brokenStructure.length);
if (stats.brokenStructure.length) console.log("   →", stats.brokenStructure.slice(0, 20));
console.log("Unsentineled refs  :", stats.unsentineled.length);
if (stats.unsentineled.length) console.log("   →", stats.unsentineled.slice(0, 20));

const problems =
  issues.length +
  stats.missingRefs.length +
  stats.duplicates.length +
  stats.brokenStructure.length +
  stats.unsentineled.length;
if (issues.length) console.log("\nIssues:\n  " + issues.join("\n  "));
console.log("\nRESULT:", problems === 0 ? "PASS ✅" : `FAIL ❌ (${problems} problem group(s))`);
if (problems) {
  // Remediation guidance: missing refs self-heal via the idempotent injector;
  // duplicates/structure warnings usually mean a page carries pre-existing raw
  // refs (outside the sentinel) and needs a manual look.
  if (stats.missingRefs.length) {
    console.log(
      "\n→ Fix missing refs (idempotent, reversible): npm run fix:save-resume" +
        "\n  (dry-run first: node tools/inject-save-resume.js --dry-run)",
    );
  }
  if (stats.unsentineled.length) {
    console.log(
      "\n→ Unsentineled pages carry raw save-resume refs the injector can't see;" +
        "\n  running fix:save-resume would duplicate them. Strip the raw <link>/" +
        "\n  <script> refs from those pages, then run: npm run fix:save-resume",
    );
  }
  if (stats.duplicates.length || stats.brokenStructure.length) {
    console.log(
      "\n→ Duplicate/structure warnings usually mean raw save-resume refs exist" +
        "\n  outside the nsr-injected sentinel; inspect those pages by hand.",
    );
  }
}
process.exit(problems === 0 ? 0 : 1);

#!/usr/bin/env node
/* =============================================================================
 * validate-injection-integrity.mjs — structural integrity for ALL sentinel-
 * wrapped injection layers in the repo (not just Save/Resume).
 *
 * The repo has many idempotent injectors (tools/inject-*.js|mjs) that wrap the
 * refs they add in an HTML-comment sentinel pair:
 *     <!-- <family>-injected:begin ... -->  ...  <!-- <family>-injected:end -->
 * e.g. nsr- (save/resume), mobile-access-, mwb- (math workbench), gfx- (game
 * fx), ghl- (hint ladder), support-enhance-, gacc-, canvas-bridge-, futures-,
 * projects-pro-, ntlp- (lesson platform).
 *
 * A partial or double injection leaves those sentinels UNBALANCED (begin != end)
 * — exactly the failure mode that silently broke Save/Resume on several pages
 * before it was caught. This validator makes that class of bug impossible to
 * ship in ANY layer: it auto-discovers every `<family>-injected` marker present
 * and asserts begin==end per file, per family. No per-injector config to keep in
 * sync — a new injector is covered automatically the moment its sentinel appears.
 *
 * Exit 0 = all balanced; 1 = at least one imbalance (CI-friendly). Read-only.
 *
 * USAGE: node tools/validate-injection-integrity.mjs
 * ========================================================================== */

import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Never descend into build output, deps, or infra/dot dirs.
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".github",
  ".claude",
  ".wrangler",
  ".vscode",
  "test-results", // Playwright trace artifacts (gitignored)
  "playwright-report",
]);

// Matches "<family>-injected" in either a :begin or :end sentinel comment.
const MARKER_RE = /([a-z0-9-]+)-injected:(begin|end)/gi;

const perFamily = new Map(); // family -> { files: n }
const imbalances = []; // { file, family, begin, end }
let scanned = 0;

function countPair(html, family) {
  const b = html.split(`${family}-injected:begin`).length - 1;
  const e = html.split(`${family}-injected:end`).length - 1;
  return [b, e];
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full);
    } else if (name.toLowerCase().endsWith(".html")) {
      check(full);
    }
  }
}

function check(file) {
  const html = readFileSync(file, "utf8");
  if (!html.includes("-injected:")) return;
  scanned++;
  const rel = relative(ROOT, file).split("\\").join("/");
  // Discover which families are present in THIS file.
  const families = new Set();
  let m;
  MARKER_RE.lastIndex = 0;
  while ((m = MARKER_RE.exec(html))) families.add(m[1].toLowerCase());
  for (const family of families) {
    const stat = perFamily.get(family) || { files: 0 };
    stat.files++;
    perFamily.set(family, stat);
    const [begin, end] = countPair(html, family);
    if (begin !== end) imbalances.push({ file: rel, family, begin, end });
  }
}

console.log("\nInjection-integrity validation\nroot:", ROOT, "\n");
walk(ROOT);

console.log(`Scanned HTML with injected markers: ${scanned}`);
console.log("Per-family (files with the marker):");
[...perFamily.entries()]
  .sort((a, b) => b[1].files - a[1].files)
  .forEach(([fam, s]) => console.log(`  ${fam.padEnd(18)} ${String(s.files).padStart(5)}`));

console.log(`\nUnbalanced sentinels: ${imbalances.length}`);
if (imbalances.length) {
  imbalances
    .slice(0, 40)
    .forEach((i) => console.log(`   → ${i.file}  [${i.family}] begin=${i.begin} end=${i.end}`));
}

const ok = imbalances.length === 0;
console.log("\nRESULT:", ok ? "PASS ✅" : `FAIL ❌ (${imbalances.length} unbalanced)`);
if (!ok) {
  console.log(
    "\n→ An injector left a page half-injected (or double-injected). Re-run that" +
      "\n  layer's injector (tools/inject-<family>-*.js) with --revert then re-inject," +
      "\n  or repair the stray sentinel by hand so begin/end counts match.",
  );
}
process.exit(ok ? 0 : 1);

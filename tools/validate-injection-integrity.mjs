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
 * SECOND CHECK — a layer that VANISHED. Balance alone cannot see the worse bug:
 * a generator (generate-notes, generate-homework, the support-page builders …)
 * renders a page from config.json and overwrites it whole, deleting every
 * injected block on it. Zero blocks balance perfectly, so this validator used to
 * pass while Save/Resume, the mobile a11y layer, the Math Workbench launcher and
 * the canonical/OG head were being stripped off 74 lessons at a time.
 *
 * So every tracked HTML file is also compared against its committed version: if
 * HEAD carried a family and the working tree no longer does, that is a
 * regression, reported by name. No manifest to maintain — git already knows what
 * the page used to have, and a deliberate removal is one `git commit` away from
 * becoming the new baseline.
 *
 * Exit 0 = all balanced and nothing lost; 1 = otherwise (CI-friendly). Read-only.
 *
 * USAGE: node tools/validate-injection-integrity.mjs
 * ========================================================================== */

import { execFileSync } from "child_process";
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

/* ---------- did any page LOSE a layer since its last commit? ---------- */

const familiesIn = (html) => {
  const out = new Set();
  MARKER_RE.lastIndex = 0;
  let m;
  while ((m = MARKER_RE.exec(html))) out.add(m[1].toLowerCase());
  return out;
};

const git = (args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });

// Only modified-but-uncommitted files can have lost something since HEAD, so
// this stays fast no matter how large the site gets.
function findLostLayers() {
  const lost = [];
  let changed;
  try {
    changed = git(["diff", "--name-only", "--diff-filter=M", "HEAD", "--", "*.html"])
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return null; // not a git checkout (or no HEAD yet) — skip, do not fail
  }
  for (const rel of changed) {
    let before;
    let after;
    try {
      before = git(["show", `HEAD:${rel}`]);
      after = readFileSync(join(ROOT, rel), "utf8");
    } catch {
      continue;
    }
    if (!before.includes("-injected:")) continue;
    const had = familiesIn(before);
    const has = familiesIn(after);
    const gone = [...had].filter((f) => !has.has(f));
    if (gone.length) lost.push({ file: rel, gone });
  }
  return lost;
}

console.log("\nInjection-integrity validation\nroot:", ROOT, "\n");
walk(ROOT);

const lost = findLostLayers();

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

if (lost === null) {
  console.log("Layers lost since HEAD: (not a git checkout — skipped)");
} else {
  console.log(`Layers lost since HEAD: ${lost.length}`);
  lost.slice(0, 40).forEach((l) => console.log(`   → ${l.file}  lost [${l.gone.join(", ")}]`));
}

const ok = imbalances.length === 0 && (lost === null || lost.length === 0);
console.log(
  "\nRESULT:",
  ok
    ? "PASS ✅"
    : `FAIL ❌ (${imbalances.length} unbalanced, ${lost ? lost.length : 0} page(s) lost a layer)`,
);
if (imbalances.length) {
  console.log(
    "\n→ An injector left a page half-injected (or double-injected). Re-run that" +
      "\n  layer's injector (tools/inject-<family>-*.js) with --revert then re-inject," +
      "\n  or repair the stray sentinel by hand so begin/end counts match.",
  );
}
if (lost && lost.length) {
  console.log(
    "\n→ A generator overwrote a page and deleted its injected layers. Route that" +
      "\n  generator's writes through writeGenerated() (scripts/lib/preserve-injected.mjs)" +
      "\n  instead of writeFileSync, then re-run it. If the removal was deliberate," +
      "\n  commit it — HEAD is the baseline.",
  );
}
process.exit(ok ? 0 : 1);

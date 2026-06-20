/* Inject the shared Lesson Platform (assets/lesson-platform.css +
 * assets/lesson-platform.js) into interactive math lesson HTML pages.
 *
 * Mirrors tools/inject-game-fx.js: walks the math unit roots, injects a single
 * stylesheet before </head> and a single <script defer> before </body>, guarded
 * by an idempotent sentinel marker. The single platform tag boots the whole
 * shared lesson-platform stack (telemetry, a11y, adaptive, juice, ai-tutor).
 *
 * Targeting: ONLY leaf lesson folders under math/unit-* whose index.html
 * actually contains interactive graded items (per the integration contract's
 * selector vocabulary). It deliberately EXCLUDES:
 *   - the unit hub page (math/unit-N/index.html)
 *   - any games/ , projects/ , supplemental/ subtrees
 *   - named game/study-guide folders that carry no graded items
 *
 * Usage:
 *   node tools/inject-lesson-platform.js            # inject (writes files)
 *   node tools/inject-lesson-platform.js --dry-run  # report only
 *   node tools/inject-lesson-platform.js --revert   # remove the injected blocks
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "ntlp-injected";
const LINK_TAG = '<link rel="stylesheet" href="/assets/lesson-platform.css">';
const SCRIPT_TAG = '<script src="/assets/lesson-platform.js" defer></script>';
const BEGIN = `<!-- ${MARK}:begin (shared lesson platform — tools/inject-lesson-platform.js) -->`;
const END = `<!-- ${MARK}:end -->`;

// Roots to scan: the math unit folders only.
const ROOTS = [
  "math/unit-1",
  "math/unit-2",
  "math/unit-3",
  "math/unit-4",
  "math/unit-5",
  "math/unit-6",
  "math/unit-7",
  "math/unit-8",
  "math/unit-9",
  "math/unit-10",
];

const SKIP_DIRS = new Set(["node_modules", "dist", "vendor", "engine3d", ".git"]);

// Leaf subfolders inside a unit that are never graded lessons.
const SKIP_LEAF = new Set(["games", "projects", "supplemental"]);

// An index.html qualifies as an interactive lesson if it uses the contract's
// graded-item selector vocabulary (q-card/data-q item grouping with at least one
// gradeable control). This is intentionally content-driven, not a hardcoded
// folder list, so new lessons are picked up automatically.
const ITEM_RE = /class="q-card"|data-q=/;
const CONTROL_RE = /class="(check-btn|mc-btn|fill-input|tf-btn|drag-item|drag-zone)"/;

function isInteractiveLesson(html) {
  return (ITEM_RE.test(html) && CONTROL_RE.test(html)) || CONTROL_RE.test(html);
}

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  injected: 0,
  already: 0,
  reverted: 0,
  skippedNoTags: [],
  skippedNoItems: [],
  matched: [],
};

// Collect candidate lesson index.html files: the immediate `index.html` of each
// leaf folder directly under a unit root (depth 1), excluding skip-leaf folders
// and the unit hub index.html itself.
function collectLessons(unitDir, out) {
  let entries;
  try {
    entries = readdirSync(unitDir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name) || SKIP_LEAF.has(name)) continue;
    const full = join(unitDir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue; // unit hub index.html (a file) is skipped here
    const idx = join(full, "index.html");
    if (existsSync(idx)) out.push(idx);
  }
}

function revert(html) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*${esc(BEGIN)}[\\s\\S]*?${esc(END)}`, "g");
  return html.replace(re, "");
}

function processFile(file) {
  report.scanned++;
  let html = readFileSync(file, "utf8");

  if (REVERT) {
    if (html.includes(BEGIN)) {
      const out = revert(html);
      if (!DRY) writeFileSync(file, out);
      report.reverted++;
    }
    return;
  }

  if (html.includes(`${MARK}:begin`)) {
    report.already++;
    return;
  }
  if (!isInteractiveLesson(html)) {
    report.skippedNoItems.push(file);
    return;
  }
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
    report.skippedNoTags.push(file);
    return;
  }

  html = html.replace(/<\/head>/i, `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n</head>`);
  html = html.replace(/<\/body>/i, `  ${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n</body>`);
  if (!DRY) writeFileSync(file, html);
  report.injected++;
  report.matched.push(file);
}

const files = [];
for (const r of ROOTS) {
  const abs = join(ROOT, r);
  if (existsSync(abs)) collectLessons(abs, files);
}
files.forEach(processFile);

console.log(`Lesson Platform injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  candidate lessons :", report.scanned);
if (REVERT) {
  console.log("  reverted          :", report.reverted);
} else {
  console.log("  injected          :", report.injected);
  console.log("  already injected  :", report.already);
  console.log("  skipped (no items):", report.skippedNoItems.length);
  console.log("  skipped (no tags) :", report.skippedNoTags.length);
  if (DRY && report.matched.length) {
    console.log("  --- would inject into:");
    for (const f of report.matched) {
      console.log("    " + f.replace(ROOT + "/", ""));
    }
  }
}

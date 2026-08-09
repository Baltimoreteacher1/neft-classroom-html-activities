/* Inject the Math Workbench launcher (assets/math-workbench-launcher.js) into
 * student-facing lesson / activity / game HTML pages, so a floating "✱ Math
 * Workbench" button is available at any point in a lesson.
 *
 * Mirrors tools/inject-save-resume.js: walks the repo for *.html, skips the same
 * non-student-facing dirs (curriculum/, personal/, teacher-tools/, assets/, …),
 * and injects a single deferred <script> before </body>, guarded by an
 * idempotent sentinel marker. The launcher self-hides on the Workbench page.
 *
 * Usage:
 *   node tools/inject-math-workbench.js            # inject (writes files)
 *   node tools/inject-math-workbench.js --dry-run  # report only
 *   node tools/inject-math-workbench.js --revert   # remove the injected blocks
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative, sep } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "mwb-injected";
const LAUNCHER_SRC = "/assets/math-workbench-launcher.js";
const SCRIPT_TAG = `<script src="${LAUNCHER_SRC}" defer></script>`;
const BEGIN = `<!-- ${MARK}:begin (Math Workbench launcher — tools/inject-math-workbench.js) -->`;
const END = `<!-- ${MARK}:end -->`;

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "vendor",
  "engine", // bundled by vite, not standalone pages
  ".git",
  ".claude",
  ".wrangler",
]);

// Non-student-facing top-level dirs (kept in sync with inject-save-resume.js).
// curriculum/ is skipped — that is where the Workbench itself lives.
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
  "personal",
  "futures",
  "access-teacher",
  // focus-school (Noam planner) offers the Workbench only inside its Academic
  // Help view, so it opts out of the global floating launcher.
  "focus-school",
  // Adult professional-learning worksheets, not student math activities — a
  // scratch-space launcher floating over a PD case study is noise. (Fix-It had
  // to have a stray launcher tag removed by hand for exactly this reason; these
  // entries stop it being re-injected.)
  "fix-it-design-challenge",
  "osamr-case-clinic",
]);

// student-board is a teacher-authored class display (not a lesson/activity), so
// it opts out of the global floating launcher — Joel asked to keep it link-free.
const SKIP_FILE_RE = /(^|[/\\])(404|sitemap|robots)\b|(^|[/\\])math[/\\]student-board[/\\]/i;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  injected: 0,
  alreadyInjected: 0,
  alreadyPresent: 0,
  reverted: 0,
  skippedNoBody: [],
  skippedFile: [],
};

function walk(dir, topLevel) {
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
      walk(full, topLevel || name);
    } else if (name.toLowerCase().endsWith(".html")) {
      handleFile(full);
    }
  }
}

function handleFile(file) {
  const rel = relative(ROOT, file).split(sep).join("/");
  report.scanned++;
  if (SKIP_FILE_RE.test(rel)) {
    report.skippedFile.push(rel);
    return;
  }
  let html;
  try {
    html = readFileSync(file, "utf8");
  } catch {
    report.skippedFile.push(rel + " (read-error)");
    return;
  }

  if (REVERT) {
    if (html.includes(MARK)) {
      if (!DRY) writeFileSync(file, stripInjection(html));
      report.reverted++;
    }
    return;
  }

  if (html.includes(MARK)) {
    report.alreadyInjected++;
    return;
  }
  // The sentinel alone cannot decide this. The launcher reached these pages by
  // more than one route over time, so the committed HTML carries it in three
  // shapes: inside a current sentinel block; inside an EMPTY sentinel block
  // with the tag outside it; and, on ~140 pages, with no sentinel at all.
  // Keying only on the marker treats that last group as uninjected and appends
  // a SECOND launcher tag, so the script is fetched twice and its floating
  // button mounted twice. The tag itself is the proof that matters.
  if (html.includes(LAUNCHER_SRC)) {
    report.alreadyPresent++;
    return;
  }
  if (!/<\/body>/i.test(html)) {
    report.skippedNoBody.push(rel);
    return;
  }

  // Inject before the LAST </body> — the document's real body close. Pages with
  // a print/report generator embed a literal "</body>" inside a JS template
  // string; injecting at the first match would land inside that string and the
  // injected </script> would terminate the page's main inline script early.
  const bodies = [...html.matchAll(/<\/body>/gi)];
  const at = bodies[bodies.length - 1].index;
  const out = html.slice(0, at) + `${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n  ` + html.slice(at);
  if (!DRY) writeFileSync(file, out);
  report.injected++;
}

function stripInjection(html) {
  const re = new RegExp(`\\s*${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}`, "g");
  return html.replace(re, "");
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log(
  `\nMath Workbench launcher injector — mode: ${
    REVERT ? "REVERT" : "INJECT"
  }${DRY ? " (dry-run)" : ""}\nroot: ${ROOT}\n`,
);
walk(ROOT, null);
console.log(
  `scanned:${report.scanned} injected:${report.injected} already:${report.alreadyInjected} alreadyUnmarked:${report.alreadyPresent} reverted:${report.reverted} skippedNoBody:${report.skippedNoBody.length} skippedFile:${report.skippedFile.length}`,
);

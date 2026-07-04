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
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, relative, sep, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "mwb-injected";
const SCRIPT_TAG = '<script src="/assets/math-workbench-launcher.js" defer></script>';
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
]);

const SKIP_FILE_RE = /(^|[/\\])(404|sitemap|robots)\b/i;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  injected: 0,
  alreadyInjected: 0,
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
  `scanned:${report.scanned} injected:${report.injected} already:${report.alreadyInjected} reverted:${report.reverted} skippedNoBody:${report.skippedNoBody.length} skippedFile:${report.skippedFile.length}`,
);

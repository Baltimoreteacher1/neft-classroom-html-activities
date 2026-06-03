#!/usr/bin/env node
/* =============================================================================
 * inject-save-resume.js — safely add the shared Save/Resume CSS + JS references
 * to every ACTIVE HTML lesson/activity, idempotently and reversibly.
 *
 * WHAT IT DOES
 *   - Walks the repo for *.html files.
 *   - Skips build/dev/dependency dirs and clearly non-activity surfaces.
 *   - Injects, just before </head>:
 *        <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
 *     and just before </body>:
 *        <script src="/shared/save-resume/save-resume-engine.js" defer></script>
 *   - Uses ABSOLUTE paths. On Cloudflare Pages this repo's top-level `shared/`
 *     dir is copied to dist root by vite.config.js (copyStandaloneHtml), so
 *     `/shared/...` resolves for lessons at ANY nesting depth.
 *   - Is fully idempotent: a sentinel marker prevents double injection.
 *
 * USAGE
 *   node tools/inject-save-resume.js            # inject (writes files)
 *   node tools/inject-save-resume.js --dry-run  # report only, write nothing
 *   node tools/inject-save-resume.js --revert   # remove previously injected refs
 *
 * SAFETY
 *   - Never touches node_modules, dist, .git, build output, vendored code.
 *   - Only edits files that contain both </head> and </body>.
 *   - Reversible: --revert strips exactly what was injected; git diff shows all.
 * ========================================================================== */

import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, relative, sep } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "nsr-injected"; // sentinel in an HTML comment
const LINK_TAG =
  '<link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">';
const SCRIPT_TAG =
  '<script src="/shared/save-resume/save-resume-engine.js" defer></script>';
const BEGIN = `<!-- ${MARK}:begin (multi-day save/resume — tools/inject-save-resume.js) -->`;
const END = `<!-- ${MARK}:end -->`;

// Directories never to enter (build, deps, dev, generated, infra).
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".github",
  ".claude",
  ".wrangler",
  ".vscode",
  "scripts", // build scripts, not lessons
  "engine", // bundled by vite, not standalone pages
  "functions", // backend
  "migrations",
  "workers",
  "shared", // the engine itself
  "tools",
]);

// Top-level surfaces that are NOT student activities (teacher/admin/infra).
// These get skipped to avoid showing a student "save your work" widget where it
// makes no sense. Adjust here if a surface should be included.
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
  "curriculum", // curriculum hub/index pages, not activities
]);

// Filename patterns that are not student-facing activities.
const SKIP_FILE_RE = /(^|[/\\])(404|sitemap|robots)\b/i;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  injected: 0,
  alreadyInjected: 0,
  reverted: 0,
  skippedNoTags: [],
  skippedDir: 0,
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
      if (name.startsWith("_") || SKIP_DIRS.has(name)) {
        report.skippedDir++;
        continue;
      }
      // At repo top level, also skip non-activity surfaces.
      const tl = topLevel || name;
      if (dir === ROOT && SKIP_TOPLEVEL.has(name)) {
        report.skippedDir++;
        continue;
      }
      walk(full, tl);
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
      const cleaned = stripInjection(html);
      if (!DRY) writeFileSync(file, cleaned);
      report.reverted++;
    }
    return;
  }

  if (html.includes(MARK)) {
    report.alreadyInjected++;
    return;
  }
  const hasHead = /<\/head>/i.test(html);
  const hasBody = /<\/body>/i.test(html);
  if (!hasHead || !hasBody) {
    report.skippedNoTags.push(rel);
    return;
  }

  // Inject the stylesheet before </head> and the script before </body>.
  let out = html.replace(
    /<\/head>/i,
    `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n</head>`,
  );
  out = out.replace(
    /<\/body>/i,
    `  ${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n</body>`,
  );
  if (!DRY) writeFileSync(file, out);
  report.injected++;
}

// Remove exactly the blocks we injected (BEGIN..END), leaving everything else.
function stripInjection(html) {
  const re = new RegExp(
    `\\s*${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}`,
    "g",
  );
  return html.replace(re, "");
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log(
  `\nSave/Resume injector — mode: ${
    REVERT ? "REVERT" : "INJECT"
  }${DRY ? " (dry-run)" : ""}\nroot: ${ROOT}\n`,
);
walk(ROOT, null);

console.log("Summary");
console.log("  HTML files scanned :", report.scanned);
if (REVERT) {
  console.log("  reverted           :", report.reverted);
} else {
  console.log("  newly injected     :", report.injected);
  console.log("  already injected   :", report.alreadyInjected);
}
console.log("  skipped (dirs)     :", report.skippedDir);
console.log(
  "  skipped (no head/body):",
  report.skippedNoTags.length,
  report.skippedNoTags.slice(0, 10),
);
console.log(
  "  skipped (filename) :",
  report.skippedFile.length,
  report.skippedFile.slice(0, 10),
);
if (DRY) console.log("\n(dry-run: no files were written)");

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

// Shared skip rules + ref/marker strings live in ONE module so the injector and
// the audit (tools/audit-save-resume-integration.js) can never drift apart.
// The injector applies SKIP_PATH_RE to injection only (revert stays allowed).
import {
  MARK,
  LINK_TAG,
  SCRIPT_TAG,
  BEGIN,
  END,
  SKIP_DIRS,
  SKIP_TOPLEVEL,
  SKIP_FILE_RE,
  SKIP_PATH_RE as SKIP_INJECT_PATH_RE,
} from "./save-resume-config.js";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");
// Optional path-substring filter (e.g. --match=living-school/neft-city-) that
// limits BOTH inject and revert to matching files instead of every page.
const MATCH = [...args].find((a) => a.startsWith("--match="))?.slice("--match=".length) || null;

const report = {
  scanned: 0,
  injected: 0,
  alreadyInjected: 0,
  reverted: 0,
  skippedNoTags: [],
  skippedDir: 0,
  skippedFile: [],
};


// Find the real closing tag: skip occurrences inside <script> blocks (vendored
// libs / print-template string literals contain "</head>" text; injecting
// there corrupts the page's inline script — see inject-game-access.js).
function realCloseIndex(html, closeTag) {
  const lower = html.toLowerCase();
  const candidates = [];
  let i = lower.indexOf(closeTag);
  while (i !== -1) {
    const before = lower.slice(0, i);
    const opens = (before.match(/<script\b/g) || []).length;
    const closes = (before.match(/<\\?\/script>/g) || []).length;
    if (opens === closes) candidates.push(i);
    i = lower.indexOf(closeTag, i + 1);
  }
  return candidates.length ? candidates[candidates.length - 1] : -1;
}

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
  // Path-substring filter (applies to BOTH inject and revert). Checked before
  // any disk read so non-matching files cost no I/O in a large repo.
  if (MATCH && !rel.includes(MATCH)) return;
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

  // Inject-only path exclusions (revert above is intentionally exempt).
  if (SKIP_INJECT_PATH_RE.test(rel)) {
    report.skippedFile.push(rel);
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

  // Inject the stylesheet before </head> (first/real head) and the script before
  // the LAST </body> — the real document close. The first </body> can be a literal
  // inside a JS template string (print/report generators); injecting there would
  // put the </script> inside the page's main inline script and terminate it early.
  const headAt = realCloseIndex(html, "</head>");
  if (headAt === -1) {
    report.skippedNoTags.push(rel);
    return;
  }
  let out = html.slice(0, headAt) + `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n` + html.slice(headAt);
  const bodies = [...out.matchAll(/<\/body>/gi)];
  const at = bodies[bodies.length - 1].index;
  out = out.slice(0, at) + `${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n  ` + out.slice(at);
  if (!DRY) writeFileSync(file, out);
  report.injected++;
}

// Remove exactly the blocks we injected (BEGIN..END), leaving everything else.
function stripInjection(html) {
  const re = new RegExp(`\\s*${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}`, "g");
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
console.log("  skipped (filename) :", report.skippedFile.length, report.skippedFile.slice(0, 10));
if (DRY) console.log("\n(dry-run: no files were written)");

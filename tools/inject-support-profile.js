/* Inject the persistent Support Profile layer into every student-facing page.
 *
 * Adds two references, sentinel-wrapped and idempotent:
 *   <head>   /shared/support/support-profile.css   (passive presentation)
 *   </body>  /shared/support/support-profile.js    (the versioned record)
 *
 * WHY THIS IS SAFE TO PUT EVERYWHERE
 *   The stylesheet only matches `:root[data-ewl-*]` attributes, which exist
 *   solely when a learner has turned a support ON. On a page whose visitor has
 *   chosen nothing, every rule is inert — it cannot change an existing layout.
 *   The script reads and writes exactly one localStorage key
 *   (`ewl:support-profile:v1`) and seeds itself from the in-lesson supports
 *   store WITHOUT modifying it. Neither file registers a global handler,
 *   intercepts input, or touches activity state.
 *
 * WHY IT HAS TO BE EVERYWHERE
 *   The whole promise of the support profile is that a learner sets their
 *   supports once and they follow them — into a lesson, a game, Number Realm, a
 *   project, the workbench, their progress view. A profile that applies on four
 *   pages is a demo, not a support system.
 *
 * Target set and skip rules mirror tools/inject-mobile-access.js, whose job is
 * the same sweep ("every student-facing HTML page"), so the two layers stay on
 * the same pages instead of drifting apart.
 *
 * Usage:
 *   node tools/inject-support-profile.js            # inject (writes files)
 *   node tools/inject-support-profile.js --dry-run  # report only
 *   node tools/inject-support-profile.js --revert   # remove the injected blocks
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "support-profile-injected";
const CSS_TAG = '<link rel="stylesheet" href="/shared/support/support-profile.css">';
const JS_TAG = '<script src="/shared/support/support-profile.js" defer></script>';
const BEGIN = `<!-- ${MARK}:begin (persistent support profile — tools/inject-support-profile.js) -->`;
const END = `<!-- ${MARK}:end -->`;

// Non-student / build / tooling dirs we never touch.
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".claude",
  ".codex",
  "scripts",
  "tools",
  "docs",
  "reports",
  "data",
  "canvas-packages",
  "night-shift",
  ".qa-logs",
  "vendor",
  "templates",
  ".playwright-mcp",
]);

/* Files that are not a screen surface a learner works on.
 *
 * `printable.html` is the generated per-lesson paper packet (see
 * scripts/generate-printable-lesson.mjs). Screen supports do not apply to
 * paper — support-profile.css deliberately reverts larger-text and the
 * directions variants under @media print — and the file is regenerated on every
 * build, so an injected block there would be stripped and re-added forever.
 * tools/save-resume-config.js skips it for the same reason. */
const SKIP_FILE = (name) =>
  /(^|[._-])(template|partial|fragment)\b/i.test(name) || /^printable\.html$/i.test(name);

/* Paths this layer must never touch.
 *
 * Monster Math Academy is out of scope for the award-portfolio work by explicit
 * instruction: its code is not to be modified. The support profile is passive
 * and backward-compatible, so injecting it would not have changed the visible
 * experience — but "do not modify its code" is unambiguous, and honouring it
 * literally is the only version of that instruction that cannot be argued with.
 *
 * The cost is real and worth naming: a learner who turns on larger text will
 * not get it inside Monster Math Academy. That is a deliberate consequence of
 * the exclusion, not an oversight.
 *
 * tools/validate-public-security.mjs asserts this stays true. */
const SKIP_PATH_RE = /(^|[/\\])curriculum[/\\]monster-math-academy([/\\]|$)/i;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  injected: 0,
  already: 0,
  reverted: 0,
  skippedNoTags: [],
};

/* Find the real closing tag: skip occurrences that sit inside a <script> block.
 * Vendored libraries and print-template string literals contain the literal
 * text "</head>" / "</body>"; injecting there terminates the page's inline
 * script early. This is the same guard inject-mobile-access.js carries, added
 * after exactly that corrupted neft-data-studio and reveal-evidence-studio. */
function realCloseIndex(html, closeTag) {
  const lower = html.toLowerCase();
  const candidates = [];
  let i = lower.indexOf(closeTag);
  while (i !== -1) {
    const before = lower.slice(0, i);
    const opens = (before.match(/<script\b/g) || []).length;
    const closes = (before.match(/<\/script>/g) || []).length;
    if (opens === closes) candidates.push(i);
    i = lower.indexOf(closeTag, i + 1);
  }
  return candidates.length ? candidates[candidates.length - 1] : -1;
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (
      name.toLowerCase().endsWith(".html") &&
      !SKIP_FILE(name) &&
      !SKIP_PATH_RE.test(full.slice(ROOT.length))
    ) {
      out.push(full);
    }
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
    if (html.includes(`${MARK}:begin`)) {
      if (!DRY) writeFileSync(file, revert(html));
      report.reverted++;
    }
    return;
  }

  if (html.includes(`${MARK}:begin`)) {
    report.already++;
    return;
  }

  /* The two references are checked INDEPENDENTLY.
   *
   * The award-portfolio hub pages hand-author some of these refs, and they do
   * not all author both — teacher-studio, for instance, links the stylesheet in
   * its own <head> but has no script tag. A single combined guard therefore
   * either duplicates the stylesheet or silently skips the script. Each ref is
   * matched on its full path, which also keeps the sentinel comment (it names
   * `tools/inject-support-profile.js`) from matching as a false positive. */
  const hasCss = html.includes("/shared/support/support-profile.css");
  const hasJs = html.includes('src="/shared/support/support-profile.js"');
  if (hasCss && hasJs) {
    report.already++;
    return;
  }

  const headAt = hasCss ? -1 : realCloseIndex(html, "</head>");
  const bodyAt = hasJs ? -1 : realCloseIndex(html, "</body>");
  if ((!hasCss && headAt === -1) || (!hasJs && bodyAt === -1)) {
    report.skippedNoTags.push(file);
    return;
  }

  // Insert the LATER offset first so the earlier one stays valid.
  if (!hasJs) {
    html = html.slice(0, bodyAt) + `  ${BEGIN}\n  ${JS_TAG}\n  ${END}\n` + html.slice(bodyAt);
  }
  if (!hasCss) {
    html = html.slice(0, headAt) + `  ${BEGIN}\n  ${CSS_TAG}\n  ${END}\n` + html.slice(headAt);
  }

  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

const files = [];
walk(ROOT, files);
files.forEach(processFile);

console.log(`Support-profile injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  HTML scanned     :", report.scanned);
if (REVERT) {
  console.log("  reverted         :", report.reverted);
} else {
  console.log("  newly injected   :", report.injected);
  console.log("  already injected :", report.already);
  if (report.skippedNoTags.length) {
    console.log("  skipped (no head/body):", report.skippedNoTags.length);
  }
}

/* Wire the IEP Learning-Supports layer into the small-group / catch-up pathways.
 *
 * WHY THIS EXISTS
 * scripts/generate-lesson-shells.mjs gates the supports layer on
 * `isCanonical = /^\d+-\d+$/`, which excludes every differentiated pathway. So
 * `1-1` shipped the highlighter / directions / organizer dock and adaptations,
 * while `1-1-group1`, `1-1-group2` and `1-3-catchup` shipped none of it — the
 * students most likely to need those accommodations were the ones without them.
 *
 * THE ID MAPPING IS THE WHOLE TRICK
 * learning-supports.js reads `data-ewl-supports-lesson` off <html>, then does
 * `manifestData = data[activeLessonId]` and bails with a console warning if the
 * key is missing. assets/learning-supports/manifest.json is keyed by CANONICAL
 * ids (`1-1`), so stamping the pathway's own id (`1-1-group1`) would load the
 * dock and then silently skip every adaptation. Each pathway therefore points at
 * its BASE lesson: 1-1-group1 -> 1-1, 1-3-catchup -> 1-3. That is also correct on
 * the merits — a pathway teaches the same lesson's objective and vocabulary, so
 * the base lesson's adaptations are the right ones. Verified: all 148 pathways
 * resolve to one of the 64 manifest entries, 0 misses.
 *
 * Uses the same `ewl-supports-injected` sentinel family and the same tag text as
 * the canonical shells emit, so validate:injection accounts for these pages too.
 *
 * Usage:
 *   node tools/inject-supports-pathways.js            # inject (writes files)
 *   node tools/inject-supports-pathways.js --dry-run  # report only
 *   node tools/inject-supports-pathways.js --revert   # remove attribute + blocks
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const MANIFEST = join(ROOT, "assets", "learning-supports", "manifest.json");

const MARK = "ewl-supports-injected";
const BEGIN = `<!-- ${MARK}:begin -->`;
const END = `<!-- ${MARK}:end -->`;
const LINK_TAG = '<link rel="stylesheet" href="/assets/learning-supports/learning-supports.css" />';
const SCRIPT_TAG = '<script src="/assets/learning-supports/learning-supports.js" defer></script>';

const PATHWAY_RE = /^(\d+-\d+)-(?:group\d+|catchup)$/;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

const report = { scanned: 0, injected: 0, already: 0, reverted: 0, noManifest: [], noAnchor: [] };

// Find a closing tag that is not inside a <script> block. Mirrors
// tools/inject-mobile-access.js — vendored libs embed literal "</head>" text.
function realCloseIndex(html, closeTag) {
  const lower = html.toLowerCase();
  const found = [];
  let i = lower.indexOf(closeTag);
  while (i !== -1) {
    const before = lower.slice(0, i);
    if ((before.match(/<script\b/g) || []).length === (before.match(/<\/script>/g) || []).length)
      found.push(i);
    i = lower.indexOf(closeTag, i + 1);
  }
  return found.length ? found[found.length - 1] : -1;
}

function revert(html) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html
    .replace(new RegExp(`\\s*${esc(BEGIN)}[\\s\\S]*?${esc(END)}`, "g"), "")
    .replace(/(<html\b[^>]*?)\s+data-ewl-supports-lesson="[^"]*"/i, "$1");
}

function processFile(id, base, file) {
  report.scanned++;
  let html = readFileSync(file, "utf8");

  if (REVERT) {
    if (html.includes(`${MARK}:begin`) || /data-ewl-supports-lesson=/i.test(html)) {
      if (!DRY) writeFileSync(file, revert(html));
      report.reverted++;
    }
    return;
  }

  if (html.includes(`${MARK}:begin`)) {
    report.already++;
    return;
  }

  // 1. Stamp the base lesson id on <html> so learning-supports.js can resolve a
  //    manifest entry. Without this the script loads and immediately returns.
  const htmlTag = /<html\b[^>]*>/i.exec(html);
  if (!htmlTag) {
    report.noAnchor.push(file);
    return;
  }
  if (!/data-ewl-supports-lesson=/i.test(htmlTag[0])) {
    const patched = htmlTag[0].replace(/^<html\b/i, `<html data-ewl-supports-lesson="${base}"`);
    html = html.slice(0, htmlTag.index) + patched + html.slice(htmlTag.index + htmlTag[0].length);
  }

  // 2. Stylesheet in <head>, 3. script before </body> — same tags the canonical
  //    shells carry, so the two paths stay comparable.
  const headAt = realCloseIndex(html, "</head>");
  const bodyAt = realCloseIndex(html, "</body>");
  if (headAt === -1 || bodyAt === -1) {
    report.noAnchor.push(file);
    return;
  }
  html = html.slice(0, headAt) + `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n` + html.slice(headAt);
  const bodyAt2 = realCloseIndex(html, "</body>");
  html = html.slice(0, bodyAt2) + `  ${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n` + html.slice(bodyAt2);

  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

for (const d of readdirSync(LESSONS, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!d.isDirectory()) continue;
  const m = PATHWAY_RE.exec(d.name);
  if (!m) continue;
  const file = join(LESSONS, d.name, "index.html");
  if (!existsSync(file)) continue;
  const base = m[1];
  if (!REVERT && !manifest[base]) {
    report.scanned++;
    report.noManifest.push(`${d.name} -> ${base}`);
    continue;
  }
  processFile(d.name, base, file);
}

console.log(`Learning-supports pathway injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  pathway shells scanned :", report.scanned);
if (REVERT) {
  console.log("  reverted               :", report.reverted);
} else {
  console.log("  injected               :", report.injected);
  console.log("  already injected       :", report.already);
  console.log("  no manifest entry      :", report.noManifest.length);
  console.log("  no <html>/<head>/<body>:", report.noAnchor.length);
}
for (const x of report.noManifest) console.log("    ! missing manifest:", x);
for (const x of report.noAnchor) console.log("    ! no anchor:", x);
if (report.noManifest.length || report.noAnchor.length) process.exitCode = 1;

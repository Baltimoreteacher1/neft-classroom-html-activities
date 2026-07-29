/* Inject assets/canvas-bridge.js into the assignable standalone activities
 * listed in tools/scorm/activity-catalog.json, giving each the same Canvas
 * grading the engine lessons have: a SCORM score postMessage when launched in a
 * SCORM package, or a completion code otherwise. The bridge is defer + fully
 * defensive (a failure can never break the host activity) and reads progress
 * from the save/resume engine already present on these pages.
 *
 * Usage:
 *   node tools/inject-canvas-bridge.js            # inject
 *   node tools/inject-canvas-bridge.js --dry-run  # report only
 *   node tools/inject-canvas-bridge.js --revert   # remove injected blocks
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MARK = "canvas-bridge-injected";
const TAG = '<script src="/assets/canvas-bridge.js" defer></script>';
const BEGIN = `<!-- ${MARK}:begin (Canvas grade bridge — tools/inject-canvas-bridge.js) -->`;
const END = `<!-- ${MARK}:end -->`;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const catalog = JSON.parse(
  readFileSync(resolve(ROOT, "tools/scorm/activity-catalog.json"), "utf8"),
);
// A catalog path is either a directory (inject its index.html) or a direct
// .html file (pre/post tests). Query-string variants (practice-arcade?unit=N)
// share one file, so dedupe on the resolved file, not the raw entry.
const toFile = (p) => (/\.html?$/i.test(p) ? p : `${p.replace(/\/+$/, "")}/index.html`);
const files = new Set(catalog.activities.map((a) => toFile(a.path)));
// injectOnly: pages that need the bridge but ship no package of their own
// (e.g. the -level-0/1/2 variants of pre/post tests a student may be moved to).
for (const p of catalog.injectOnly || []) files.add(toFile(p));
// Interactive homework pages are derived from the curriculum manifest — every
// lesson's homework.html is assignable in Canvas, so each gets the bridge.
const manifest = JSON.parse(readFileSync(resolve(ROOT, "data/curriculum-manifest.json"), "utf8"));
const manifestLessons = Array.isArray(manifest.lessons)
  ? manifest.lessons
  : Object.values(manifest.lessons);
for (const l of manifestLessons) {
  if (l && l.id && existsSync(join(ROOT, "lessons", l.id, "homework.html")))
    files.add(`lessons/${l.id}/homework.html`);
}
const paths = [...files];

const report = {
  scanned: 0,
  injected: 0,
  already: 0,
  reverted: 0,
  missing: [],
};

function revert(html) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(`\\s*${esc(BEGIN)}[\\s\\S]*?${esc(END)}`, "g"), "");
}

for (const p of paths) {
  const file = join(ROOT, p); // paths are already resolved to concrete .html files
  if (!existsSync(file)) {
    report.missing.push(p);
    continue;
  }
  report.scanned++;
  let html = readFileSync(file, "utf8");

  if (REVERT) {
    if (html.includes(`${MARK}:begin`)) {
      if (!DRY) writeFileSync(file, revert(html));
      report.reverted++;
    }
    continue;
  }
  if (html.includes(`${MARK}:begin`)) {
    report.already++;
    continue;
  }
  if (!/<\/body>/i.test(html)) {
    report.missing.push(p + " (no </body>)");
    continue;
  }
  // Inject before the LAST </body> — the real page body close. Some pages
  // contain an earlier </body> inside a document.write() template literal
  // (e.g. a print-report popup); injecting a <script> there would embed a
  // literal </script> inside an inline script and prematurely terminate it.
  const lastBody = html.toLowerCase().lastIndexOf("</body>");
  html = html.slice(0, lastBody) + `  ${BEGIN}\n  ${TAG}\n  ${END}\n` + html.slice(lastBody);
  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

console.log(`Canvas-bridge injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  activities :", paths.length);
console.log("  scanned    :", report.scanned);
if (REVERT) console.log("  reverted   :", report.reverted);
else {
  console.log("  injected   :", report.injected);
  console.log("  already    :", report.already);
}
if (report.missing.length) console.log("  missing    :", report.missing.join(", "));

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
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
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
// Dedupe by path; one index.html per activity.
const paths = [...new Set(catalog.activities.map((a) => a.path))];

const report = {
  scanned: 0,
  injected: 0,
  already: 0,
  reverted: 0,
  missing: [],
};

function revert(html) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`\\s*${esc(BEGIN)}[\\s\\S]*?${esc(END)}`, "g"),
    "",
  );
}

for (const p of paths) {
  const file = join(ROOT, p, "index.html");
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
  html = html.replace(/<\/body>/i, `  ${BEGIN}\n  ${TAG}\n  ${END}\n</body>`);
  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

console.log(
  `Canvas-bridge injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`,
);
console.log("  activities :", paths.length);
console.log("  scanned    :", report.scanned);
if (REVERT) console.log("  reverted   :", report.reverted);
else {
  console.log("  injected   :", report.injected);
  console.log("  already    :", report.already);
}
if (report.missing.length)
  console.log("  missing    :", report.missing.join(", "));

/* Inject the shared Game FX kit (assets/game-fx.css + assets/game-fx.js) into
 * interactive game/activity HTML pages.
 *
 * Mirrors tools/inject-save-resume.js: walks an allow-list of game/activity
 * roots, injects a stylesheet before </head> and a script before </body>,
 * guarded by an idempotent sentinel marker. The kit is gameplay-neutral visual
 * polish only (see assets/game-fx.js).
 *
 * Usage:
 *   node tools/inject-game-fx.js            # inject (writes files)
 *   node tools/inject-game-fx.js --dry-run  # report only
 *   node tools/inject-game-fx.js --revert   # remove the injected blocks
 */
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "gfx-injected";
const LINK_TAG = '<link rel="stylesheet" href="/assets/game-fx.css">';
const SCRIPT_TAG = '<script src="/assets/game-fx.js" defer></script>';
const BEGIN = `<!-- ${MARK}:begin (shared game polish — tools/inject-game-fx.js) -->`;
const END = `<!-- ${MARK}:end -->`;

// Allow-list of interactive game/activity roots (relative to repo root).
const ROOTS = [
  "games",
  "math/games",
  "cartesian-odyssey",
  "correlation-playground",
  "cosmic-gravity-lab",
  "fractions-soccer",
  "mad-balance-sandbox",
  "ratiolab",
  "spectral-waves-lab",
  "sports-analytics",
  "netfold-pro",
  "world-architect-math-project",
  "fix-it-design-challenge",
  "misconception-lab",
  "misconception-museum",
  "math-lab-missions",
  "reveal-evidence-studio",
  "number-system",
  "ratios-proportions",
  "surface-area-review",
];

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "vendor",
  "engine3d",
  ".git",
]);

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

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (name.toLowerCase().endsWith(".html")) out.push(full);
  }
}

function revert(html) {
  const re = new RegExp(
    `\\s*${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "g",
  );
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
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
    report.skippedNoTags.push(file);
    return;
  }

  html = html.replace(
    /<\/head>/i,
    `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n</head>`,
  );
  html = html.replace(
    /<\/body>/i,
    `  ${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n</body>`,
  );
  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

const files = [];
for (const r of ROOTS) {
  const abs = join(ROOT, r);
  if (existsSync(abs)) walk(abs, files);
}
files.forEach(processFile);

console.log(
  `Game FX injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`,
);
console.log("  HTML scanned     :", report.scanned);
if (REVERT) {
  console.log("  reverted         :", report.reverted);
} else {
  console.log("  injected         :", report.injected);
  console.log("  already injected :", report.already);
  console.log("  skipped (no tags):", report.skippedNoTags.length);
}

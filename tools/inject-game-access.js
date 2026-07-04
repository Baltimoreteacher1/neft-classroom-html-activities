/* Inject the Neft Calm & Accessible Games layer (assets/game-access.css +
 * assets/game-access.js) into interactive game/activity HTML pages.
 *
 * Mirrors tools/inject-game-fx.js: walks an allow-list of game/activity roots,
 * injects a stylesheet before </head> and a script before </body>, guarded by
 * an idempotent sentinel marker. The layer is accessibility + calm-mode polish
 * only (TTS read-aloud, calm/reduce-motion, tap targets, growth-mindset toast)
 * and is gameplay-neutral — see assets/game-access.js.
 *
 * Usage:
 *   node tools/inject-game-access.js            # inject (writes files)
 *   node tools/inject-game-access.js --dry-run  # report only
 *   node tools/inject-game-access.js --revert   # remove the injected blocks
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "gacc-injected";
const LINK_TAG = '<link rel="stylesheet" href="/assets/game-access.css">';
const SCRIPT_TAG = '<script src="/assets/game-access.js" defer></script>';
const BEGIN = `<!-- ${MARK}:begin (calm & accessible games — tools/inject-game-access.js) -->`;
const END = `<!-- ${MARK}:end -->`;

// Allow-list of interactive game/activity roots (relative to repo root).
// Mirrors tools/inject-game-fx.js — a proven set of real game pages.
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
  // Flagship per-unit 2D games + standard-coded game pages (2026-07 games
  // audit): the calm/a11y layer was missing from every game outside the
  // canonical math/games arcade. Game folders only — never whole unit dirs.
  "math/unit-1/games",
  "math/unit-2/games",
  "math/unit-3/games",
  "math/unit-4/games",
  "math/unit-5/games",
  "math/unit-6/games",
  "math/unit-7/games",
  "math/unit-8/games",
  "math/unit-9/games",
  "math/unit-10/games",
  "math/statistics/games",
  "math/mcap-review-game",
  "math/unit-1/6-ns-b-2game",
  "math/unit-1/6-ns-b-3game",
  "math/unit-1/supplemental/6-1game",
  "math/unit-2/6-ns-a-1game",
  "math/unit-3/6-rp-1game",
  "math/unit-4/6-rp-a-2game",
  "math/unit-4/6-rp-a-3game",
  "math/unit-5/supplemental/parallelogramandrhombusgame",
  "math/unit-7/6-ns-c-5game",
  "math/unit-7/6-ns-c-6game",
  "math/unit-7/6-ns-c-8game",
  "math/unit-8/game-equations-quest",
  "math/unit-9/6-ee-9gamereview",
  "math/unit-9/6-ee-c-9martiangame",
  "math/unit-9/6-ee-c-9variablevelocitygame",
  "math/unit-9/cloudflare-pages-game-for-6-ee-9",
  "math/unit-9/game-variable-voyage",
  "math/unit-9/variablecomparisongame",
  "math/statistics/6-sp-a-1game",
  "math/statistics/6-sp-a-1game-2",
  "math/statistics/6-sp-b-5-data-detective-game",
  "math/statistics/mean-median-mode-game",
];

const SKIP_DIRS = new Set(["node_modules", "dist", "vendor", "engine3d", ".git"]);

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

  html = html.replace(/<\/head>/i, `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n</head>`);
  html = html.replace(/<\/body>/i, `  ${BEGIN}\n  ${SCRIPT_TAG}\n  ${END}\n</body>`);
  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

const files = [];
for (const r of ROOTS) {
  const abs = join(ROOT, r);
  if (existsSync(abs)) walk(abs, files);
}
files.forEach(processFile);

console.log(`Game Access injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  HTML scanned     :", report.scanned);
if (REVERT) {
  console.log("  reverted         :", report.reverted);
} else {
  console.log("  injected         :", report.injected);
  console.log("  already injected :", report.already);
  console.log("  skipped (no tags):", report.skippedNoTags.length);
}

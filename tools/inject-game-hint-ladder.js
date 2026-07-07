/* Inject the Socratic hint-ladder (assets/game-hint-ladder.{css,js}) into the
 * unit math games and wire each one to its problem via NeftHintLadder.watch().
 *
 * These Phaser games (same author) all mirror the live problem into a
 * screen-reader status region (srSay -> #<xx>-sr). watch() observes that region
 * and publishes each new problem to the ladder — so no game-logic/closure edits
 * are needed, just the two asset includes + a one-line init per game.
 *
 * u3-ratio-rush is intentionally EXCLUDED: it has a bespoke setProblem() hook
 * with kind-aware static hints already (the reference implementation).
 *
 * Live AI (Claude Haiku via /api/tutor) is the primary hint source; the static
 * hints below are the offline/degraded fallback and are authored answer-free.
 *
 * Usage:
 *   node tools/inject-game-hint-ladder.js            # inject
 *   node tools/inject-game-hint-ladder.js --dry-run  # report only
 *   node tools/inject-game-hint-ladder.js --revert   # remove injected blocks
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "ghl-injected";
const BEGIN_HEAD = `<!-- ${MARK}:begin (Socratic hint ladder — tools/inject-game-hint-ladder.js) -->`;
const BEGIN_BODY = BEGIN_HEAD;
const END = `<!-- ${MARK}:end -->`;
const LINK = '<link rel="stylesheet" href="/assets/game-hint-ladder.css">';
const SCRIPT = '<script src="/assets/game-hint-ladder.js" defer></script>';

// Per-game config: SR-region selector + standard + 3 answer-free static rungs
// (notice -> strategy -> set-up-the-step). AI is primary; these are fallback.
const GAMES = {
  "math/games/u1-decimal-dash": {
    sr: "#dd-sr",
    standard: "6.NOS.3",
    hints: [
      "Look at the place values. Which two whole numbers does this decimal sit between?",
      "Line up the decimal points, then compare digit by digit from the left (tenths, then hundredths).",
      "Set it up: count how many tenths/hundredths past the smaller whole number, then place your marker there.",
    ],
  },
  "math/games/u1-factor-frenzy": {
    sr: "#ff-sr",
    standard: "6.NOS.4",
    hints: [
      "What factors do these numbers share? Start by listing the factors of each.",
      "GCF is the biggest factor they share; LCM is the smallest multiple they share. Which does the task ask for?",
      "Set it up: compare your lists (or prime factors) and pick the shared value — you name the final one.",
    ],
  },
  "math/games/u2-fraction-frenzy": {
    sr: "#fr-sr",
    standard: "6.NOS.1",
    hints: [
      "Dividing by a fraction asks: how many of that fraction fit inside the other number?",
      "Use keep–change–flip: keep the first fraction, change ÷ to ×, flip the second.",
      "Set it up: rewrite it as a multiplication problem, then you do the multiplying.",
    ],
  },
  "math/games/u4-percent-power": {
    sr: "#pp-sr",
    standard: "6.AT.4",
    hints: [
      "Percent means 'per 100'. What is the whole (the 100%) in this problem?",
      "Set up part/whole = percent/100, and see which piece is missing.",
      "Set it up: write the proportion (or find 1% first), then solve for the missing part.",
    ],
  },
  "math/games/u5-area-attack": {
    sr: "#aa-sr",
    standard: "6.GR.1",
    hints: [
      "Can you break this shape into rectangles or triangles you already know how to measure?",
      "Recall the area rules: rectangle = base × height; triangle = ½ × base × height.",
      "Set it up: find each piece's area with the formula, then add (or subtract) — you finish the arithmetic.",
    ],
  },
  "math/games/u6-expression-express": {
    sr: "#ee-sr",
    standard: "6.AT.5",
    hints: [
      "What is the expression asking you to do first? Look for exponents and grouping.",
      "Follow order of operations (PEMDAS); remember an exponent is repeated multiplication.",
      "Set it up: substitute the values and write each step, then compute the last one yourself.",
    ],
  },
  "math/games/u7-equation-quest": {
    sr: "#eq-sr",
    standard: "6.AT.8",
    hints: [
      "What is being done to the variable — is it added to, or multiplied?",
      "Do the inverse operation to BOTH sides to get the variable alone.",
      "Set it up: apply the inverse step to both sides, then you finish the last calculation.",
    ],
  },
  "math/games/u8-data-dash": {
    sr: "#dd-sr",
    standard: "6.DS.6",
    hints: [
      "Is the question about the center of the data (mean/median) or the spread (range)?",
      "Recall the measure: mean = add then divide; median = middle of the ordered list; range = max − min.",
      "Set it up: order the data or set up the sum, then do the final step yourself.",
    ],
  },
  "math/games/u9-coordinate-quest": {
    sr: "#cq-sr",
    standard: "6.NOS.6",
    hints: [
      "Which number is the x (across) and which is the y (up/down)? Check the signs too.",
      "Move along the x-axis first, then up or down for y; negatives go left/down.",
      "Set it up: find the tick mark for each coordinate, then place the point yourself.",
    ],
  },
  "math/games/u10-volume-blast": {
    sr: "#vb-sr",
    standard: "6.GR.2",
    hints: [
      "What three measurements build a volume? Picture filling the solid with unit cubes.",
      "Volume = length × width × height (for fractional edges, multiply the fractions).",
      "Set it up: write length × width × height with the numbers, then do the multiplying.",
    ],
  },
  // Universal per-lesson engine (?unit=/lesson) with several mini-game modes.
  // Standard varies by lesson, so leave it blank (the tutor reads the problem
  // text). `accept` restricts ingestion to genuine problem announcements — each
  // mode carries a marker (Round N / Options: / Left cards: / Steps:) that the
  // interaction chatter and intro never do. Hints are topic-agnostic.
  "math/games/practice-arcade": {
    sr: "#pa-sr",
    standard: "",
    accept: "(^Round \\d|\\bOptions:|\\bLeft cards:|\\bSteps:)",
    hints: [
      "Read the problem again slowly. What is it giving you, and what is it asking you to find?",
      "What one idea or rule from this lesson connects what you have to what you need?",
      "Set it up: write the first step using that rule, then work it through — you finish the last part.",
    ],
  },
};

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  injected: 0,
  already: 0,
  reverted: 0,
  missing: [],
  noTags: [],
};

function revert(html) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*${esc(BEGIN_HEAD)}[\\s\\S]*?${esc(END)}`, "g");
  return html.replace(re, "");
}

function initScript(cfg) {
  const hints = JSON.stringify(cfg.hints);
  const acceptLine = cfg.accept ? `          accept: ${JSON.stringify(cfg.accept)},\n` : "";
  return (
    "<script>\n" +
    "      window.addEventListener('DOMContentLoaded', function () {\n" +
    "        if (window.NeftHintLadder) window.NeftHintLadder.watch({\n" +
    `          sourceSelector: ${JSON.stringify(cfg.sr)},\n` +
    `          standard: ${JSON.stringify(cfg.standard)},\n` +
    acceptLine +
    `          staticHints: ${hints}\n` +
    "        });\n" +
    "      });\n" +
    "    </script>"
  );
}

for (const [rel, cfg] of Object.entries(GAMES)) {
  const file = join(ROOT, rel, "index.html");
  if (!existsSync(file)) {
    report.missing.push(rel);
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
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
    report.noTags.push(rel);
    continue;
  }

  html = html.replace(/<\/head>/i, `  ${BEGIN_HEAD}\n  ${LINK}\n  ${END}\n</head>`);
  html = html.replace(
    /<\/body>/i,
    `  ${BEGIN_BODY}\n  ${SCRIPT}\n  ${initScript(cfg)}\n  ${END}\n</body>`,
  );
  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

console.log(`Hint-ladder injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  games matched   :", report.scanned);
if (REVERT) {
  console.log("  reverted        :", report.reverted);
} else {
  console.log("  injected        :", report.injected);
  console.log("  already injected:", report.already);
}
if (report.missing.length) console.log("  MISSING dirs    :", report.missing.join(", "));
if (report.noTags.length) console.log("  no head/body    :", report.noTags.join(", "));

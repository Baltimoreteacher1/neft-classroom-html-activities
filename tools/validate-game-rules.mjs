#!/usr/bin/env node
/**
 * validate-game-rules — Joel's three standing rules for student games, as a gate.
 *
 * Each detector enforces a decision recorded in data/product-decisions.json
 * (who decided it, when, and the words they used). Until 2026-10-04 these held
 * only because someone remembered them: the 2026-10-03 games audit found hub
 * links in all 11 legacy unit-folder games, a racing game behind a project's
 * "Play the Unit Game" button, and a shared panel that printed the full solution
 * on any wrong pick across 13 flagship games.
 *
 *   HUB_LINK          games are self-contained — no link (or scripted jump) back
 *                     to a unit hub, the games catalog, or the curriculum hub.
 *                     The runtime "← Games" button from assets/game-studio.js is
 *                     not in page source and is allowed by that decision.
 *   COUNTDOWN         no countdown timers or beat-the-clock language. Also swept
 *                     over COUNTDOWN_ONLY_DIRS (non-game practice surfaces).
 *   SOLUTION_ON_MISS  a wrong pick must not print the worked solution. NARROW BY
 *                     DESIGN: it matches the exact shapes that shipped (a "Review: "
 *                     + explanation concatenation, and a pick wrapper that reports
 *                     the explanation whether or not the pick was correct).
 *                     "Shows the answer before a miss" in general is a reading
 *                     task, not a string fact; play-throughs cover the rest.
 *
 * A legitimate exception (e.g. a teacher-facing link inside a projector page)
 * lives in data/game-rules-review.json with a written reason of 40+ characters;
 * an entry whose finding no longer fires FAILS so the file cannot collect stale
 * absolutions. The detectors self-test against known-bad and known-good
 * fixtures BEFORE sweeping, and a sweep that finds zero game files FAILS.
 *
 * Usage: node tools/validate-game-rules.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const REVIEW_FILE = join(ROOT, "data/game-rules-review.json");

/** Student game surfaces. Directories are scanned for .html/.js (one level). */
const GAME_DIRS = [
  "math/games/u1-decimal-dash",
  "math/games/u1-factor-frenzy",
  "math/games/u2-fraction-frenzy",
  "math/games/u3-ratio-rush",
  "math/games/u4-percent-power",
  "math/games/u5-area-attack",
  "math/games/u6-expression-express",
  "math/games/u7-equation-quest",
  "math/games/u8-data-dash",
  "math/games/u9-coordinate-quest",
  "math/games/u10-volume-blast",
  "math/games/placement-quest",
  "math/games/shared",
  "math/unit-3/6-rp-1game",
  "math/statistics/games",
  "curriculum/class-boss",
  "curriculum/division-foundry",
  "curriculum/ratio-quest",
  "curriculum/unit-rate-market-mission",
  "curriculum/ratio-rate-review-mission",
  "curriculum/unit-3-test-review",
  "curriculum/teach-the-machine",
  "games/3d/boss-battle-3d",
  "games/3d/boss-battle-3d/play",
];
const GAME_FILES = ["math/games/practice-arcade/index.html"];
/**
 * Student practice surfaces that are not games but fall under the same no-timer
 * decision. Swept for COUNTDOWN only: their navigation back to a hub is normal
 * site chrome, so HUB_LINK does not apply. math/fluency-lab shipped a
 * "60-second sprint" mode on every skill until 2026-10-08.
 */
const COUNTDOWN_ONLY_DIRS = ["math/fluency-lab"];
/** Every math/unit-N/games/ folder, discovered so a new unit game is covered. */
function unitGameDirs() {
  const base = join(ROOT, "math");
  return readdirSync(base)
    .filter((d) => /^unit-\d+$/.test(d) && existsSync(join(base, d, "games")))
    .map((d) => `math/${d}/games`);
}
function missionDirs() {
  const base = join(ROOT, "curriculum/almost-right-lab/equations");
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((d) => /^mission-\d+$/.test(d))
    .map((d) => `curriculum/almost-right-lab/equations/${d}`);
}

// ── detectors ──────────────────────────────────────────────────────────────
const HUB_TARGET = String.raw`\/(?:curriculum\/?|math\/?|math\/games\/?|math\/games\/index\.html|math\/unit-\d+\/?|math\/unit-\d+\/index\.html)`;
const HUB_PATTERNS = [
  new RegExp(String.raw`href\s*=\s*["']${HUB_TARGET}["']`, "g"),
  new RegExp(String.raw`location(?:\.href)?\s*=\s*["']${HUB_TARGET}["']`, "g"),
  new RegExp(String.raw`location\.(?:assign|replace)\(\s*["']${HUB_TARGET}["']`, "g"),
];
const COUNTDOWN_PATTERNS = [
  /\b(?:timeLeft|timeRemaining|secondsLeft|secsLeft|countdown|countDown|timesUp|timeIsUp)\b/g,
  /\b(?:time'?s up|seconds? left|time left|beat the clock|before time runs out)\b/gi,
  /\b\d+[- ](?:second|minute) (?:sprint|challenge|round|blitz|dash)\b/gi,
];
const SOLUTION_PATTERNS = [
  /["']Review: ["']\s*\+\s*\(?\s*[\w.?]*explain/g,
  /track\(\s*!*[\w.[\]]*correct\s*,\s*this\.current\.explain\s*\)/g,
];

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}
function findAll(text, patterns) {
  const hits = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m = re.exec(text);
    while (m) {
      hits.push({ match: m[0], line: lineOf(text, m.index) });
      m = re.exec(text);
    }
  }
  return hits;
}
/** Phrases that state the rule being followed ("No timer") are not violations. */
function negated(text, hit) {
  const lines = text.split("\n");
  const line = lines[hit.line - 1] || "";
  const at = line.toLowerCase().indexOf(hit.match.toLowerCase());
  const before = line.slice(Math.max(0, at - 24), at).toLowerCase();
  return /\b(no|never|without|not)\b[^.]*$/.test(before);
}
export function scan(text, { countdownOnly = false } = {}) {
  const out = [];
  if (!countdownOnly)
    for (const h of findAll(text, HUB_PATTERNS)) out.push({ detector: "HUB_LINK", ...h });
  for (const h of findAll(text, COUNTDOWN_PATTERNS))
    if (!negated(text, h)) out.push({ detector: "COUNTDOWN", ...h });
  if (!countdownOnly)
    for (const h of findAll(text, SOLUTION_PATTERNS))
      out.push({ detector: "SOLUTION_ON_MISS", ...h });
  return out;
}

// ── self-test (runs before the sweep) ──────────────────────────────────────
let selfTestCount = 0;
function selfTest() {
  const bad = [
    ["HUB_LINK", '<a class="back" href="/curriculum/">← Back</a>'],
    ["HUB_LINK", '<a href="/math/unit-7/">Unit 7</a>'],
    ["HUB_LINK", "location.href = '/math/games/';"],
    ["COUNTDOWN", "let timeLeft = 30;"],
    ["COUNTDOWN", "<p>Beat the clock!</p>"],
    ["COUNTDOWN", '["sprint", "60-second sprint"],'],
    ["SOLUTION_ON_MISS", "track(ok, ok ? 'Correct. ' : 'Review: '+(q.explain||'x'))"],
    ["SOLUTION_ON_MISS", "track(!!this.current.choices[i].correct,this.current.explain);"],
  ];
  const good = [
    '<a href="/math/games/u3-ratio-rush/">Ratio Rush</a>',
    "<p>No timer — take your time.</p>",
    "<span>No time limit</span>",
    "track(ok, ok ? q.explain : 'Not yet — try another choice.')",
    '<a href="/curriculum/projects/">Projects</a>',
  ];
  const failures = [];
  for (const [det, src] of bad)
    if (!scan(src).some((f) => f.detector === det)) failures.push(`missed ${det}: ${src}`);
  for (const src of good) if (scan(src).length) failures.push(`false positive: ${src}`);
  // COUNTDOWN-only scope: still catches a clock, ignores ordinary hub navigation.
  if (
    !scan("state.timeLeft -= 1;", { countdownOnly: true }).some((f) => f.detector === "COUNTDOWN")
  )
    failures.push("countdown-only scope missed COUNTDOWN");
  if (scan('<a href="/math/">Math</a>', { countdownOnly: true }).length)
    failures.push("countdown-only scope reported a hub link");
  selfTestCount = bad.length + good.length + 2;
  return failures;
}

// ── sweep ──────────────────────────────────────────────────────────────────
function filesIn(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => /\.(html|js)$/.test(f) && !/\.test\.|\.min\./.test(f))
    .map((f) => join(abs, f))
    .filter((f) => statSync(f).isFile());
}
function loadReview() {
  if (!existsSync(REVIEW_FILE)) return [];
  const data = JSON.parse(readFileSync(REVIEW_FILE, "utf8"));
  return Array.isArray(data.entries) ? data.entries : [];
}

function main() {
  const st = selfTest();
  if (st.length) {
    console.error("validate-game-rules: SELF-TEST FAILED — a detector stopped firing:");
    for (const f of st) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  const files = [
    ...[...GAME_DIRS, ...unitGameDirs(), ...missionDirs()].flatMap(filesIn),
    ...GAME_FILES.map((f) => join(ROOT, f)).filter(existsSync),
  ];
  const countdownOnlyFiles = COUNTDOWN_ONLY_DIRS.flatMap(filesIn);
  if (countdownOnlyFiles.length === 0) {
    console.error(
      "validate-game-rules: FAIL — the countdown-only practice scope swept zero files; the list is stale.",
    );
    process.exit(1);
  }
  const countdownOnly = new Set(countdownOnlyFiles);
  files.push(...countdownOnlyFiles);
  if (!files.length) {
    console.error("validate-game-rules: FAIL — swept zero game files; the scope list is stale.");
    process.exit(1);
  }
  const review = loadReview();
  const problems = [];
  for (const e of review)
    if (!e.reason || e.reason.trim().length < 40)
      problems.push(`review entry ${e.file} ${e.detector}: reason under 40 characters`);
  const used = new Set();
  const findings = [];
  for (const abs of files) {
    const rel = relative(ROOT, abs);
    for (const f of scan(readFileSync(abs, "utf8"), { countdownOnly: countdownOnly.has(abs) })) {
      const idx = review.findIndex(
        (e) => e.file === rel && e.detector === f.detector && f.match.includes(e.match),
      );
      if (idx >= 0) {
        used.add(idx);
        continue;
      }
      findings.push(`${rel}:${f.line}  ${f.detector}  ${f.match}`);
    }
  }
  review.forEach((e, i) => {
    if (!used.has(i))
      problems.push(`review entry no longer fires — delete it: ${e.file} ${e.detector} ${e.match}`);
  });
  if (findings.length || problems.length) {
    console.error("validate-game-rules: FAIL");
    for (const f of findings) console.error(`  ✗ ${f}`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    console.error(
      "  Rules and who decided them: data/product-decisions.json (games-*). A real exception goes in data/game-rules-review.json with a reason.",
    );
    process.exit(1);
  }
  console.log(
    `validate-game-rules: ${files.length} game files clean — no hub links, no countdowns, no solution-on-miss (${review.length} reviewed exceptions, ${selfTestCount} self-tests; ${countdownOnlyFiles.length} practice files swept for countdowns only).`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();

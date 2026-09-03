#!/usr/bin/env node
/* =============================================================================
 * audit-score-writers — separate "nobody played it" from "it never could report".
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * game_scores holds ~98 rows from exactly three game_ids, against ~117 game
 * pages on disk. The tempting read is "students only played three games". That
 * read is wrong and expensive: it makes a wiring gap look like a content
 * preference, and it has silently shaped the build backlog for months.
 *
 * A game can be absent from the scores table for two very different reasons:
 *   SILENT        — it has score-reporting wiring that has never produced a
 *                   row. That is a broken integration. Go fix it.
 *   UNINSTRUMENTED— it has no scoring wiring at all, so its absence carries no
 *                   information whatsoever. It is not unpopular; it is mute.
 * Those two must never again be summed into one number.
 *
 * Discovery mirrors scripts/usage-report.mjs: a "game page" is an index.html
 * that loads assets/game-fx.js (the shared FX kit every game uses), plus the
 * engine3d titles under games/3d/. The id is the directory name, which is what
 * game-base.js defaults game_id to.
 *
 *   node scripts/audit-score-writers.mjs            # human summary
 *   node scripts/audit-score-writers.mjs --json     # machine-readable
 *   node scripts/audit-score-writers.mjs --strict   # exit 1 on SILENT/orphans
 *
 * --strict is for the nightly job, not the pre-push gate: a brand-new game may
 * legitimately have no plays yet, so this informs rather than blocks a merge.
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { skipExit } from "../tools/lib/skip-exit.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const AS_JSON = process.argv.includes("--json");
const STRICT = process.argv.includes("--strict");
const DB = "neft-student-progress";

/**
 * Markers meaning "this page can report a score".
 * engine3d pages import game-base.js (which calls reportScore -> /api/scores);
 * others post directly or go through the edupulse bridge.
 */
const WIRING = [
  /engine3d\/game-base\.js/,
  /game-score\.js/,
  /reportScore\s*\(/,
  /\/api\/scores/,
  /edupulse-bridge\.js/,
  /grade-emit\.js/,
];

/**
 * Does this page judge answers at all? Only a page that can tell right from
 * wrong has a score worth reporting — the vocabulary varies per game (one
 * counts `correct`, another tracks `wrong`, another just a `Score`), so match
 * the idioms rather than a single house style. Deliberately loose: a false
 * positive lands a page on the backlog for a human to look at, while a false
 * negative silently excuses it forever.
 */
const GRADING = [/\bincorrect\b/i, /\bcorrect\b/i, /\bwrong\b/i, /\bscore\b/i, /\bstreak\b/i];

function d1(sql) {
  try {
    const out = execFileSync(
      "npx",
      ["wrangler", "d1", "execute", DB, "--remote", "--command", sql, "--json"],
      {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    const match = out.match(/\[[\s\S]*\]/);
    if (!match) return null;
    return JSON.parse(match[0])[0]?.results ?? [];
  } catch {
    return null; // offline / unauthenticated — reported as skipped, not failed
  }
}

/**
 * Redirect stubs left behind by past reorganisations (games/3d/unit-1 is a
 * meta-refresh to math/unit-3/recipe-factory-line) still carry the FX kit and a
 * stale game.js, so they look exactly like games to a naive scan. They are not
 * games — counting them inflates the denominator and, worse, attributes a live
 * game's id to a dead directory.
 */
function isRedirectStub(html) {
  // A meta refresh is unambiguous.
  if (/<meta[^>]+http-equiv=["']?refresh/i.test(html)) return true;
  // A scripted redirect is only a STUB when it is the page's whole purpose:
  // it fires immediately, before any content. Real games assign location.href
  // deep in their own navigation logic (the Practice Arcade does it three
  // times), so matching anywhere in the file would delete live games from the
  // inventory. Require both "near the top" and "the file is tiny".
  const head = html.slice(0, 1500);
  return html.length < 8000 && /location\.(replace|href)\s*[=(]/.test(head);
}

/**
 * A game page's real logic usually lives in a sibling module (game.js / main.js)
 * rather than inline. Read it for both the declared game id and the scoring
 * wiring the HTML alone would miss.
 */
function readSidecar(dir) {
  for (const name of ["game.js", "main.js", "index.js"]) {
    let js = "";
    try {
      js = readFileSync(resolve(ROOT, dir, name), "utf8");
    } catch {
      continue;
    }
    const id = js.match(/\bid:\s*["'`]([\w-]+)["'`]/);
    return { id: id ? id[1] : null, wired: WIRING.some((re) => re.test(js)), js };
  }
  return { id: null, wired: false, js: "" };
}

/** Every index.html that loads the shared FX kit is a game page. */
function gamePages() {
  const out = execFileSync(
    "bash",
    [
      "-c",
      `grep -rl "game-fx.js" --include="index.html" . 2>/dev/null | grep -v node_modules | grep -v "^./dist/"`,
    ],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );

  return out
    .split("\n")
    .map((s) => s.trim().replace(/^\.\//, ""))
    .filter(Boolean)
    .map((rel) => {
      let html = "";
      try {
        html = readFileSync(resolve(ROOT, rel), "utf8");
      } catch {
        /* unreadable — treated as unwired below */
      }
      const dir = rel.replace(/\/index\.html$/, "");
      // An engine3d title's game_id comes from `id:` in its sibling game.js,
      // NOT from the folder — games/3d/unit-1 reports as "unit-1-smoothie-stand".
      // Joining on the folder name would misreport every 3D game as silent.
      const sidecar = readSidecar(dir);
      return {
        id: sidecar.id || dir.split("/").pop(),
        path: dir,
        stub: isRedirectStub(html),
        wired: WIRING.some((re) => re.test(html)) || sidecar.wired,
        graded: GRADING.some((re) => re.test(html) || re.test(sidecar.js || "")),
        walkthrough: /step-flow\.js/.test(html),
      };
    })
    .filter((g) => !g.stub)
    .sort((a, b) => a.path.localeCompare(b.path));
}

const games = gamePages();
const rows = d1(
  "SELECT game_id, COUNT(*) AS n, MAX(created_at) AS last FROM game_scores GROUP BY game_id",
);

if (rows === null) {
  if (AS_JSON) console.log(JSON.stringify({ ok: false, reason: "d1-unreachable" }, null, 2));
  else
    console.log("audit-score-writers: could not reach D1 (offline or unauthenticated) — skipped.");
  // A SKIP, not a pass: no score writer was audited on this run.
  process.exit(skipExit("D1 is unreachable (offline or unauthenticated)"));
}

const wrote = new Map(rows.map((r) => [String(r.game_id), r]));

// Evidence beats inference: a game that has actually written rows IS wired,
// whatever the static scan concluded. Treating a proven writer as
// "uninstrumented" would hide a real integration and corrupt the counts, so
// production data is the tiebreak — and the disagreement is reported below as
// a gap in this script's detector, not as a defect in the game.
const detectorMissed = games.filter((g) => !g.wired && wrote.has(g.id)).map((g) => g.path);
for (const g of games) {
  if (wrote.has(g.id)) g.wired = true;
}

const wired = games.filter((g) => g.wired);
const uninstrumented = games.filter((g) => !g.wired);

/**
 * "Wired, zero rows" has two very different readings, and out of school-season
 * they are mostly the second: the score path is dead (SILENT), or nobody has
 * opened the page since it was wired (IDLE). The nt-usage beacon tells them
 * apart: a page with recorded views and no score row has a broken integration;
 * a page nobody has viewed has produced exactly the rows it should have — none.
 * Only SILENT fails the audit. If the views table cannot be read, every
 * zero-row game stays SILENT: a false alarm is recoverable, a masked dead
 * integration is the failure mode this whole script exists to prevent.
 */
const viewRows = d1(
  "SELECT path, SUM(views) AS v, SUM(dwell_ms_sum) AS dms, SUM(dwell_n) AS dn FROM usage_signal GROUP BY path",
);
const viewsByPath = new Map(
  (viewRows ?? []).map((r) => [
    String(r.path).replace(/\/+$/, ""),
    {
      views: Number(r.v) || 0,
      meanDwellSec: Number(r.dn) > 0 ? Number(r.dms) / Number(r.dn) / 1000 : 0,
    },
  ]),
);
const usageFor = (g) => viewsByPath.get(`/${g.path}`) ?? { views: 0, meanDwellSec: 0 };
const wasViewed = (g) => viewRows === null || usageFor(g).views > 0;

/**
 * A page open is not a play. Reporting requires a JUDGED ANSWER — report()
 * deliberately writes nothing when attempts === 0, because a row there would
 * assert the student scored 0% when they never answered anything. So a visit
 * too short to reach one judged answer is not evidence of a dead score path;
 * it is no evidence at all.
 *
 * This mattered. On 2026-09-02 this audit reported six "broken integrations".
 * Five of them were correctly wired and verified working in a browser: their
 * whole evidence base was 1-2 summer pageviews lasting 6-30 seconds, and three
 * of those landed on 2026-07-29, the day the wiring commit shipped -- the
 * developer opening the page to check it. Only one game (u10-volume-blast) was
 * genuinely defective. Calling the other five broken sent real work to the
 * backlog and cost trust in every number this script prints.
 *
 * The fix is NOT to relabel them IDLE -- they were viewed, and quietly burying
 * a dead integration is the failure mode this whole script exists to prevent.
 * They get their own bucket, reported with the evidence, so a human can see
 * exactly how thin it is. Only a game with enough engagement to have plausibly
 * produced a judged answer is called SILENT, and only SILENT fails --strict.
 */
const PLAY_MIN_VIEWS = 3;
const PLAY_MIN_DWELL_SEC = 60;
const plausiblyPlayed = (g) => {
  if (viewRows === null) return true; // can't tell: hold as SILENT, never mask
  const u = usageFor(g);
  return u.views >= PLAY_MIN_VIEWS && u.meanDwellSec >= PLAY_MIN_DWELL_SEC;
};

const zeroRow = wired.filter((g) => !wrote.has(g.id));
const silent = zeroRow.filter((g) => wasViewed(g) && plausiblyPlayed(g));
const unproven = zeroRow.filter((g) => wasViewed(g) && !plausiblyPlayed(g));
const idle = zeroRow.filter((g) => !wasViewed(g));

/**
 * "63 pages cannot report a score" is a true sentence and a misleading number.
 * It counts three different things as one backlog:
 *
 *   HUB          — a landing page listing other games. It has no gameplay, so
 *                  a score row would be meaningless. Detected by evidence (it
 *                  contains other game pages), never by a hand-kept list.
 *   WALKTHROUGH  — a guided step-flow mission. It "finishes" by reaching the
 *                  last step, so any score it reported would be 100% every
 *                  time; writing that would inflate every accuracy figure
 *                  downstream. Absence of a score here is CORRECT.
 *   SCORABLE     — genuinely judges answers, and still reports nothing. This
 *                  is the only real backlog.
 *
 * Collapsing these is the same mistake as summing SILENT and UNINSTRUMENTED:
 * it turns a wiring question into a headcount and mis-shapes planning. Usage is
 * already answered elsewhere — every page carries the nt-usage beacon — so this
 * audit is strictly about "how well did they do", never "was it opened".
 */
// Containment is the evidence: a page that CONTAINS other game pages is a
// landing page for them. A hub that instead links outward (number-system) is
// not caught and falls through to one of the other not-a-gap buckets — the
// label is then imprecise, but the actionable SCORABLE count is unaffected,
// which is the number this audit exists to get right.
const isHub = (g) => games.filter((o) => o.path.startsWith(`${g.path}/`)).length >= 3;
const hubs = uninstrumented.filter(isHub);
const walkthroughs = uninstrumented.filter((g) => !isHub(g) && g.walkthrough);
/**
 * Pages REVIEWED BY A HUMAN and found to have nothing a score could describe.
 * They match the loose grading regex on descriptive prose ("multiplies in the
 * wrong direction" is museum copy ABOUT a misconception, not a judged answer),
 * so without this they sit in the actionable backlog forever — an alarm nobody
 * can act on, which is how a real gap gets lost among false ones.
 *
 * This list can only ever SHRINK the backlog, so it is deliberately hard to
 * abuse: every entry needs a reason, all of them print on every run, and the
 * `evidence` string must still be ABSENT from the page. If someone later adds
 * real grading to one of these, its evidence appears, the exclusion is reported
 * as STALE and the page returns to the backlog on its own.
 */
const REVIEWED_UNSCORABLE = {
  "fix-it-design-challenge": {
    why: "design checklists only — checkKey() builds a checkbox id, nothing judges an answer",
    evidence: /Incorrect|Try again|not quite/,
  },
  "misconception-museum": {
    why: "exhibit copy describing misconceptions; the word 'wrong' is prose, not a verdict",
    evidence: /Incorrect|Try again|answer-wrong/,
  },
  ratiolab: {
    why: "mixer readout — '✓ Math calculations check' displays a computation, it does not grade one",
    evidence: /Incorrect|Try again|not quite/,
  },
};

/** An exclusion is stale the moment its page starts grading something. */
function exclusionStatus(g) {
  const rule = REVIEWED_UNSCORABLE[g.path];
  if (!rule) return null;
  let html = "";
  try {
    html = readFileSync(resolve(ROOT, g.path, "index.html"), "utf8");
  } catch {
    return { ...rule, stale: false };
  }
  return { ...rule, stale: rule.evidence.test(html) };
}

const reviewed = uninstrumented.map((g) => [g, exclusionStatus(g)]).filter(([, r]) => r);
const staleExclusions = reviewed.filter(([, r]) => r.stale).map(([g]) => g.path);

const scorable = uninstrumented.filter(
  (g) =>
    !isHub(g) &&
    !g.walkthrough &&
    g.graded &&
    !(REVIEWED_UNSCORABLE[g.path] && !exclusionStatus(g).stale),
);
const notScorable = uninstrumented.filter((g) => !isHub(g) && !g.walkthrough && !g.graded);
// A game_id in D1 matching no directory: renamed/deleted game, or a typo'd id.
// Either way those rows are orphaned and will never join to anything.
const orphanIds = [...wrote.keys()].filter((id) => !games.some((g) => g.id === id));

const report = {
  ok: silent.length === 0 && orphanIds.length === 0,
  pages: games.length,
  wired: wired.length,
  reporting: wired.length - zeroRow.length,
  silent: silent.map((g) => g.path),
  unproven: unproven.map((g) => ({
    path: g.path,
    views: usageFor(g).views,
    meanDwellSec: Math.round(usageFor(g).meanDwellSec),
  })),
  idle: idle.map((g) => g.path),
  viewsAvailable: viewRows !== null,
  uninstrumented: uninstrumented.map((g) => g.path),
  // The uninstrumented total, split by whether a score would mean anything.
  scorable: scorable.map((g) => g.path),
  reviewedUnscorable: reviewed.map(([g, r]) => ({ path: g.path, why: r.why, stale: r.stale })),
  staleExclusions,
  hubs: hubs.map((g) => g.path),
  walkthroughs: walkthroughs.map((g) => g.path),
  notScorable: notScorable.map((g) => g.path),
  detectorMissed,
  orphanIds,
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`audit-score-writers — ${report.pages} game pages on disk\n`);
  console.log(`  wired to report a score:  ${report.wired}`);
  console.log(`  actually reporting:       ${report.reporting}`);
  console.log(`  SILENT (viewed, 0 rows):  ${silent.length}   <- broken integrations`);
  for (const p of report.silent.slice(0, 30)) console.log(`      ${p}`);
  if (report.silent.length > 30) console.log(`      … and ${report.silent.length - 30} more`);
  console.log(
    `  UNPROVEN (viewed too briefly to judge): ${unproven.length}   <- not evidence of a bug`,
  );
  for (const u of report.unproven.slice(0, 30)) {
    console.log(`      ${u.path}  (${u.views} view(s), ~${u.meanDwellSec}s each)`);
  }
  if (unproven.length) {
    console.log(
      `      ^ needs >=${PLAY_MIN_VIEWS} views averaging >=${PLAY_MIN_DWELL_SEC}s before a\n` +
        "        missing row means anything. Verify in a browser, not from this count.",
    );
  }
  console.log(
    `  IDLE (wired, never viewed since instrumentation): ${idle.length}   <- silence is expected`,
  );
  if (!report.viewsAvailable) {
    console.log("      ^ usage_signal unreadable — every zero-row game held as SILENT.");
  }

  console.log(`\n  UNINSTRUMENTED (no scoring wiring at all): ${uninstrumented.length}`);
  console.log(
    "      ^ these cannot report and never could. Their absence from\n" +
      "        game_scores is not evidence about whether students play them\n" +
      "        (the nt-usage beacon answers that). Split by whether a score\n" +
      "        would mean anything:",
  );

  console.log(
    `\n    SCORABLE — judges answers, reports nothing: ${scorable.length}   <- the real backlog`,
  );
  for (const p of report.scorable.slice(0, 30)) console.log(`        ${p}`);
  if (report.scorable.length > 30) console.log(`        … and ${report.scorable.length - 30} more`);

  if (reviewed.length) {
    console.log(`\n    Reviewed and deliberately unscored: ${reviewed.length}`);
    for (const [g, r] of reviewed) {
      console.log(`        ${r.stale ? "STALE " : ""}${g.path} — ${r.why}`);
    }
    if (staleExclusions.length) {
      console.log(
        "      ^ STALE means the page now grades something after all. Its\n" +
          "        exclusion no longer holds and it is back in the backlog above.",
      );
    }
  }

  console.log(`\n    Not a gap — a score here would be meaningless or false:`);
  console.log(
    `        ${String(hubs.length).padStart(3)} hub / landing pages   (no gameplay to score)`,
  );
  console.log(
    `        ${String(walkthroughs.length).padStart(3)} guided walkthroughs   (finish = 100% by construction;`,
  );
  console.log(`                                   reporting it would inflate accuracy)`);
  console.log(
    `        ${String(notScorable.length).padStart(3)} sandboxes / labs      (nothing is judged right or wrong)`,
  );

  if (detectorMissed.length) {
    console.log(
      `\n  detector gap — these write rows but match no wiring pattern: ${detectorMissed.join(", ")}`,
    );
  }
  if (orphanIds.length) {
    console.log(`\n  ORPHAN game_ids in D1 with no matching directory: ${orphanIds.join(", ")}`);
  }
}

if (STRICT && !report.ok) process.exit(1);

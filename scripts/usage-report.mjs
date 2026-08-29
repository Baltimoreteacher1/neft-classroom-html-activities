#!/usr/bin/env node
/**
 * What students actually use — measured, not guessed.
 *
 * This site has grown by intuition: 200+ lesson configs, 235 catalogued
 * activities, ~114 games, dozens of teacher tools. Nothing has ever reported
 * which of them a student opens twice. That makes "what should I build next?"
 * and "what is safe to delete?" both unanswerable.
 *
 * Reads the live D1 telemetry and joins it against the on-disk inventory, so
 * the output names the gap in both directions: what is used, and what has
 * never been touched.
 *
 * Run:  npm run report:usage            # live D1
 *       npm run report:usage -- --db <file.sqlite>   # a restored backup
 *
 * Writes reports/usage-report.md. Exits non-zero and writes NOTHING if any
 * query fails — see the abort block below for why that matters.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATABASE = "neft-student-progress";
const argv = process.argv.slice(2);
const LOCAL_DB = argv.includes("--db") ? argv[argv.indexOf("--db") + 1] : null;

/* ------------------------------------------------------------------ queries */

// The day game_scores gained an enforced attempts contract: engine3d stopped
// posting its running score into `total` (games/engine3d/game-base.js) and the
// API began clamping the invariant server-side (functions/api/scores). Score
// rows older than this cannot be interpreted as accuracy, only as evidence of
// play. Do not move this date to make a report look fuller.
const TRUSTED_FROM = "2026-07-28";

const QUERIES = {
  lessonEvents: `SELECT lesson_slug AS slug, lesson_title AS title, COUNT(*) AS events,
      COUNT(DISTINCT json_extract(payload_json,'$.session')) AS sessions,
      MAX(created_at) AS last_seen
    FROM lesson_telemetry WHERE lesson_slug IS NOT NULL AND lesson_slug <> ''
    GROUP BY 1 ORDER BY events DESC`,
  eventTypes: `SELECT event_type AS type, COUNT(*) AS n FROM lesson_telemetry GROUP BY 1 ORDER BY n DESC`,
  timeOnTask: `SELECT lesson_slug AS slug,
      SUM(CAST(json_extract(payload_json,'$.props.seconds') AS INTEGER)) AS seconds
    FROM lesson_telemetry WHERE event_type='time_on_task' GROUP BY 1 ORDER BY seconds DESC`,
  milestones: `SELECT lesson_slug AS slug, json_extract(payload_json,'$.props.milestone') AS milestone, COUNT(*) AS n
    FROM lesson_telemetry WHERE event_type='milestone' GROUP BY 1,2`,
  // Accuracy is computed ONLY over rows this project can vouch for.
  //
  // Until 2026-07-28 the engine3d runtime posted its RUNNING SCORE into
  // `total`, a column that means "attempts represented by this row". The usage
  // report therefore read unit-1-smoothie-stand as "18 correct / 1455
  // attempted", and negative-scoring steps wrote total = -4. Structural checks
  // alone cannot rescue those rows: a score of 141 is indistinguishable from a
  // legitimate 141-attempt row, so a row is trustworthy only if it was written
  // after the client fix AND satisfies the contract. Pre-cutoff rows keep their
  // play counts (play really did happen) and are excluded from accuracy.
  games: `SELECT game_id AS id, COUNT(*) AS plays, SUM(points) AS points,
      SUM(CASE WHEN created_at >= '${TRUSTED_FROM}' AND total >= 1 AND correct <= total
               THEN correct END) AS correct,
      SUM(CASE WHEN created_at >= '${TRUSTED_FROM}' AND total >= 1 AND correct <= total
               THEN total END) AS attempted,
      SUM(CASE WHEN created_at <  '${TRUSTED_FROM}' OR total < 1 OR correct > total
               THEN 1 ELSE 0 END) AS untrusted,
      MAX(created_at) AS last_seen
    FROM game_scores GROUP BY 1 ORDER BY plays DESC`,
  activeDays: `SELECT substr(created_at,1,10) AS day, COUNT(*) AS events
    FROM lesson_telemetry GROUP BY 1 ORDER BY day DESC LIMIT 21`,
  // Step funnel (events shipped 2026-08-29). Interactive lessons send
  // `step_view` {phase, step, index, count} from the act step strip; the
  // small-group studio sends `sg_step_view` {tab, step, index, count} on every
  // tab or sub-step arrival. Sessions, not clicks: a student who revisits a
  // step counts once. Rows older than the ship date simply do not exist, so an
  // empty result here means "not yet observed", never "nobody got past step 1".
  stepFunnel: `SELECT lesson_slug AS slug, event_type AS type,
      COALESCE(json_extract(payload_json,'$.props.phase'), json_extract(payload_json,'$.props.tab'), json_extract(payload_json,'$.tab')) AS stage,
      COALESCE(json_extract(payload_json,'$.props.step'), json_extract(payload_json,'$.step'), '') AS step,
      MIN(COALESCE(json_extract(payload_json,'$.props.index'), json_extract(payload_json,'$.index'))) AS idx,
      COUNT(DISTINCT json_extract(payload_json,'$.session')) AS sessions
    FROM lesson_telemetry
    WHERE event_type IN ('step_view','sg_step_view')
    GROUP BY 1,2,3,4 ORDER BY 1,3,5`,
  lessonSessions: `SELECT lesson_slug AS slug,
      COUNT(DISTINCT json_extract(payload_json,'$.session')) AS sessions
    FROM lesson_telemetry
    WHERE json_extract(payload_json,'$.session') IS NOT NULL GROUP BY 1`,
};

function query(sql) {
  if (LOCAL_DB) {
    const out = execFileSync("sqlite3", ["-json", LOCAL_DB, sql], { encoding: "utf8" }).trim();
    return out ? JSON.parse(out) : [];
  }
  const raw = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DATABASE, "--remote", "--json", "--command", sql],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
  // wrangler prefixes npm notices; the payload starts at the first bracket.
  const start = raw.indexOf("[");
  if (start === -1) {
    throw new Error(`wrangler returned no JSON payload:\n${raw.trim().slice(-500)}`);
  }
  const parsed = JSON.parse(raw.slice(start));
  return parsed[0]?.results ?? [];
}

/**
 * wrangler writes an npm notice and a proxy banner to stderr on every run, so
 * the naive "last two lines of stderr" is almost always that banner and almost
 * never the actual error — which is how a hard auth failure once surfaced as
 * `⚠ query "games" failed: Proxy environment variables detected.` Strip the
 * known noise and keep whatever is left.
 */
const STDERR_NOISE = /^(npm (warn|notice)\b|▲|.*Proxy environment variables detected)/;
function describeQueryError(err) {
  const raw = [err?.stderr, err?.stdout, err?.message]
    .map((v) => (v == null ? "" : v.toString()))
    .join("\n")
    .replace(/\u001B\[[0-9;]*m/g, "");

  // wrangler puts the real reason in a JSON envelope — {"error":{"text":"…set a
  // CLOUDFLARE_API_TOKEN…"}} — and then echoes the whole failing SQL statement,
  // which is far longer than the diagnostic and pushes it out of any tail slice.
  // Prefer the envelope whenever it is present.
  const texts = [...raw.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => {
    try {
      return JSON.parse(`"${m[1]}"`);
    } catch {
      return m[1];
    }
  });
  if (texts.length) return [...new Set(texts)].join("\n");

  const signal = raw
    .split("\n")
    .map((l) => l.trimEnd())
    // Drop the echoed command and its SQL: that is the input, not the failure.
    .filter((l) => l.trim() && !STDERR_NOISE.test(l.trim()) && !/^Command failed:/.test(l.trim()));
  return signal.slice(-6).join("\n") || String(err?.message || "unknown error");
}

/* ---------------------------------------------------------------- inventory */

/** Lesson folders that ship a config — the real lesson inventory. */
function lessonInventory() {
  if (!existsSync("lessons")) return [];
  return readdirSync("lessons")
    .filter((d) => existsSync(join("lessons", d, "config.json")))
    .map((d) => {
      let title = d;
      try {
        title = JSON.parse(readFileSync(join("lessons", d, "config.json"), "utf8")).title || d;
      } catch {
        /* keep the folder name */
      }
      return { dir: d, title };
    });
}

/** Playable game pages, identified by their use of the shared FX kit. */
function countGamePages() {
  try {
    const out = execFileSync(
      "bash",
      [
        "-c",
        `grep -rl "game-fx.js" --include="index.html" . 2>/dev/null | grep -v node_modules | grep -v "^./dist/" | grep -cv "^\\./\\."`,
      ],
      { encoding: "utf8" },
    );
    return Number(out.trim()) || 0;
  } catch {
    return 0;
  }
}

function catalogInventory() {
  try {
    return JSON.parse(readFileSync("data/catalog.json", "utf8")).entries || [];
  } catch {
    return [];
  }
}

/**
 * Telemetry slugs look like "math-unit-1-1-3-math-is-in-my-world" while lesson
 * folders are "1-3". Match on the unit-lesson pair embedded in the slug rather
 * than trying to reverse the whole title.
 */
function slugToLessonDir(slug) {
  const m = /unit-(\d+)-(\d+)-(\d+)/.exec(slug) || /unit-(\d+)-(\d+)/.exec(slug);
  if (!m) return null;
  return m.length === 4 ? `${m[2]}-${m[3]}` : `${m[1]}-${m[2]}`;
}

/* ------------------------------------------------------------------- report */

const data = {};
const failures = [];
for (const [key, sql] of Object.entries(QUERIES)) {
  try {
    data[key] = query(sql);
  } catch (err) {
    failures.push({ key, detail: describeQueryError(err) });
    data[key] = [];
  }
}

// A failed query and an empty table both hand back `[]`, and this script used
// to render them identically: it caught every failure, substituted [], and
// wrote a full report anyway. On 2026-07-30 all six queries failed and the
// report still announced "0 of 222 lesson folders have ever reported activity —
// 222 have never been opened", then listed all 222 under a heading that reads
// "build-next / prune candidates". It exited 0. Acting on that list would have
// retired the entire curriculum on the strength of a connection error.
//
// An empty result set is a finding and stays reportable. A failed query is the
// absence of a finding and must never be rendered as one.
if (failures.length) {
  console.error(
    `\n✗ usage report ABORTED — ${failures.length} of ${Object.keys(QUERIES).length} queries failed.\n`,
  );
  for (const f of failures) {
    console.error(`  • ${f.key}\n      ${f.detail.replace(/\n/g, "\n      ")}\n`);
  }
  console.error(
    "  No report written. Any existing reports/usage-report.md is left untouched\n" +
      "  rather than overwritten with zeros — a stale report is recoverable, a\n" +
      "  fabricated one is not.\n" +
      (LOCAL_DB
        ? `  Reading a local backup (${LOCAL_DB}); check the file exists and sqlite3 is installed.\n`
        : "  Live D1 needs Cloudflare auth: npx wrangler login\n"),
  );
  process.exit(1);
}

const lessons = lessonInventory();
const _catalog = catalogInventory();
const touched = new Set();
for (const row of data.lessonEvents) {
  const dir = slugToLessonDir(row.slug || "");
  if (dir) touched.add(dir);
}
const untouched = lessons.filter((l) => !touched.has(l.dir));
const secondsBySlug = new Map(data.timeOnTask.map((r) => [r.slug, r.seconds || 0]));

// data/catalog.json only lists 4 entries under "Game" — it is a curated
// catalogue, not the inventory. The real marker for a playable game page is
// that it loads the shared FX kit, which ~117 pages do.
const gamePages = countGamePages();
const playedGames = new Set(data.games.map((g) => g.id));

const totalEvents = data.eventTypes.reduce((a, r) => a + r.n, 0);
const fmt = (n) => new Intl.NumberFormat("en-US").format(n);
const stamp = new Date().toISOString().slice(0, 10);

const lines = [];
lines.push(`# Usage report — ${stamp}`);
lines.push("");
lines.push(`Source: \`${LOCAL_DB || `D1 ${DATABASE} (remote)`}\``);
lines.push("");
lines.push("## Headline");
lines.push("");
lines.push(
  `- **${fmt(totalEvents)}** telemetry events across **${data.lessonEvents.length}** distinct lessons.`,
);
lines.push(
  `- **${touched.size} of ${lessons.length}** lesson folders have ever reported activity — **${untouched.length} have never been opened** with telemetry on.`,
);
lines.push(
  `- **${playedGames.size} of ${gamePages}** playable game pages have ever recorded a score.`,
);
if (data.activeDays.length) {
  lines.push(
    `- Most recent activity: **${data.activeDays[0].day}** (${fmt(data.activeDays[0].events)} events).`,
  );
}
lines.push("");
lines.push("> Telemetry only counts sessions where the beacon fired. Treat these as");
lines.push("> lower bounds — a quiet lesson may be unused, or may simply predate");
lines.push("> instrumentation. Confirm before deleting anything on this basis.");
lines.push("");

lines.push("## Most-used lessons");
lines.push("");
lines.push("| Lesson | Events | Sessions | Time on task | Last seen |");
lines.push("| --- | ---: | ---: | ---: | --- |");
for (const r of data.lessonEvents.slice(0, 20)) {
  const secs = secondsBySlug.get(r.slug) || 0;
  lines.push(
    `| ${r.title || r.slug} | ${fmt(r.events)} | ${fmt(r.sessions || 0)} | ${Math.round(secs / 60)} min | ${(r.last_seen || "").slice(0, 10)} |`,
  );
}
lines.push("");

lines.push("## Games with recorded play");
lines.push("");
if (data.games.length) {
  lines.push("| Game | Plays | Correct / attempted | Accuracy | Last seen |");
  lines.push("| --- | ---: | ---: | ---: | --- |");
  let anyUntrusted = 0;
  for (const g of data.games) {
    const att = Number(g.attempted) || 0;
    const cor = Number(g.correct) || 0;
    const bad = Number(g.untrusted) || 0;
    anyUntrusted += bad;
    const acc = att ? `${fmt(cor)}/${fmt(att)}` : "—";
    const pct = att ? `${Math.round((100 * cor) / att)}%` : "—";
    const note = bad ? ` <br>⚠️ ${fmt(bad)} pre-contract row(s)` : "";
    lines.push(
      `| ${g.id}${note} | ${fmt(g.plays)} | ${acc} | ${pct} | ${(g.last_seen || "").slice(0, 10)} |`,
    );
  }
  if (anyUntrusted) {
    lines.push("");
    lines.push(
      `> ⚠️ **${fmt(anyUntrusted)} score row(s) predate the \`game_scores\` attempts contract** ` +
        `(before ${TRUSTED_FROM}, engine3d posted its running score into \`total\`), so they are ` +
        "excluded from accuracy above. Their play counts are real; their ratios never were. " +
        "Accuracy will stay `—` until games are played again post-fix.",
    );
  }
} else {
  lines.push("_No game scores recorded._");
}
lines.push("");

lines.push(`## Lessons with no recorded activity (${untouched.length})`);
lines.push("");
lines.push("These are build-next / prune candidates — verify before acting.");
lines.push("");
for (const l of untouched.slice(0, 60)) lines.push(`- \`lessons/${l.dir}/\` — ${l.title}`);
if (untouched.length > 60) lines.push(`- _…and ${untouched.length - 60} more._`);
lines.push("");

lines.push("## Where students stop");
lines.push("");
lines.push(
  "Sessions that reached each step, in the order the lesson presents them. A step",
  "far below the one before it is where students leave. Interactive lessons",
  "report acts and steps; the small-group studio reports tabs and sub-steps.",
  "",
);
const funnelBySlug = new Map();
for (const r of data.stepFunnel) {
  if (!funnelBySlug.has(r.slug)) funnelBySlug.set(r.slug, []);
  funnelBySlug.get(r.slug).push(r);
}
if (!funnelBySlug.size) {
  lines.push(
    "_No step-level events yet. `step_view` / `sg_step_view` shipped 2026-08-29; this",
    "section fills in as classes run._",
    "",
  );
} else {
  const sessionsBySlug = new Map(data.lessonSessions.map((r) => [r.slug, r.sessions || 0]));
  const ranked = [...funnelBySlug.entries()]
    .map(([slug, rows]) => ({ slug, rows, sessions: sessionsBySlug.get(slug) || 0 }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 25);
  for (const { slug, rows, sessions } of ranked) {
    const title = data.lessonEvents.find((r) => r.slug === slug)?.title || slug;
    lines.push(`### ${title} — ${fmt(sessions)} session${sessions === 1 ? "" : "s"}`);
    lines.push("");
    lines.push("| Stage | Step | Sessions reached | Of lesson |");
    lines.push("|---|---|---:|---:|");
    const ordered = rows
      .slice()
      .sort(
        (a, b) => String(a.stage).localeCompare(String(b.stage)) || (a.idx ?? 0) - (b.idx ?? 0),
      );
    for (const r of ordered) {
      const pct = sessions ? Math.round((r.sessions / sessions) * 100) : 0;
      lines.push(`| ${r.stage ?? "—"} | ${r.step || "(arrived)"} | ${fmt(r.sessions)} | ${pct}% |`);
    }
    lines.push("");
  }
}

lines.push("## Event mix");
lines.push("");
for (const r of data.eventTypes) lines.push(`- \`${r.type}\`: ${fmt(r.n)}`);
lines.push("");

lines.push("## Daily activity");
lines.push("");
for (const d of data.activeDays) lines.push(`- ${d.day}: ${fmt(d.events)}`);
lines.push("");

mkdirSync("reports", { recursive: true });
writeFileSync("reports/usage-report.md", lines.join("\n"));

console.log(`✓ reports/usage-report.md`);
console.log(
  `  ${fmt(totalEvents)} events · ${touched.size}/${lessons.length} lessons touched · ${playedGames.size} games played · ${untouched.length} lessons silent`,
);

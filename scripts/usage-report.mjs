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
 * Writes reports/usage-report.md.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATABASE = "neft-student-progress";
const argv = process.argv.slice(2);
const LOCAL_DB = argv.includes("--db") ? argv[argv.indexOf("--db") + 1] : null;

/* ------------------------------------------------------------------ queries */

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
  games: `SELECT game_id AS id, COUNT(*) AS plays, SUM(points) AS points,
      SUM(correct) AS correct, SUM(total) AS attempted, MAX(created_at) AS last_seen
    FROM game_scores GROUP BY 1 ORDER BY plays DESC`,
  activeDays: `SELECT substr(created_at,1,10) AS day, COUNT(*) AS events
    FROM lesson_telemetry GROUP BY 1 ORDER BY day DESC LIMIT 21`,
};

function query(sql) {
  if (LOCAL_DB) {
    const out = execFileSync("sqlite3", ["-json", LOCAL_DB, sql], { encoding: "utf8" }).trim();
    return out ? JSON.parse(out) : [];
  }
  const raw = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DATABASE, "--remote", "--json", "--command", sql],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  // wrangler prefixes npm notices; the payload starts at the first bracket.
  const parsed = JSON.parse(raw.slice(raw.indexOf("[")));
  return parsed[0]?.results ?? [];
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
      } catch { /* keep the folder name */ }
      return { dir: d, title };
    });
}

/** Playable game pages, identified by their use of the shared FX kit. */
function countGamePages() {
  try {
    const out = execFileSync(
      "bash",
      ["-c", `grep -rl "game-fx.js" --include="index.html" . 2>/dev/null | grep -v node_modules | grep -v "^./dist/" | grep -cv "^\\./\\."`],
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
for (const [key, sql] of Object.entries(QUERIES)) {
  try {
    data[key] = query(sql);
  } catch (err) {
    console.error(`⚠ query "${key}" failed: ${(err.stderr || err.message).toString().trim().split("\n").slice(-2).join(" ")}`);
    data[key] = [];
  }
}

const lessons = lessonInventory();
const catalog = catalogInventory();
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
lines.push(`- **${fmt(totalEvents)}** telemetry events across **${data.lessonEvents.length}** distinct lessons.`);
lines.push(`- **${touched.size} of ${lessons.length}** lesson folders have ever reported activity — **${untouched.length} have never been opened** with telemetry on.`);
lines.push(`- **${playedGames.size} of ${gamePages}** playable game pages have ever recorded a score.`);
if (data.activeDays.length) {
  lines.push(`- Most recent activity: **${data.activeDays[0].day}** (${fmt(data.activeDays[0].events)} events).`);
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
  lines.push(`| ${r.title || r.slug} | ${fmt(r.events)} | ${fmt(r.sessions || 0)} | ${Math.round(secs / 60)} min | ${(r.last_seen || "").slice(0, 10)} |`);
}
lines.push("");

lines.push("## Games with recorded play");
lines.push("");
if (data.games.length) {
  lines.push("| Game | Plays | Correct / attempted | Last seen |");
  lines.push("| --- | ---: | ---: | --- |");
  for (const g of data.games) {
    const acc = g.attempted ? `${g.correct}/${g.attempted}` : "—";
    lines.push(`| ${g.id} | ${fmt(g.plays)} | ${acc} | ${(g.last_seen || "").slice(0, 10)} |`);
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
console.log(`  ${fmt(totalEvents)} events · ${touched.size}/${lessons.length} lessons touched · ${playedGames.size} games played · ${untouched.length} lessons silent`);

#!/usr/bin/env node
/**
 * Content Decisions
 * =================
 * The missing feedback loop: nothing in this repo tells you what to STOP
 * building. `usage-report.mjs` says what students opened; `content-coverage`
 * says which standards have material. Neither answers "what should I work on
 * next Saturday?" This joins them and answers exactly that.
 *
 * Run:  npm run decisions
 *       npm run decisions -- --db ~/neft-backups/d1/latest.sqlite
 *
 * Output: reports/content-decisions.md
 *
 * Four verdicts, in priority order:
 *   BUILD    standard is taught in the pacing guide but has no lesson material
 *   PROMOTE  material exists, is used, and is carrying load — surface it more
 *   REPAIR   material exists and is opened, but nobody finishes it
 *   RETIRE   material has existed long enough to be found and never gets opened
 *
 * RETIRE is a *candidate* list, never an instruction. Telemetry only counts
 * sessions where the beacon fired, so a quiet lesson may simply predate
 * instrumentation. Nothing here deletes anything.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATABASE = "neft-student-progress";

const argv = process.argv.slice(2);
const argVal = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const LOCAL_DB = argVal("--db", "");

/* --------------------------------------------------------------------- d1 */

function query(sql) {
  try {
    if (LOCAL_DB) {
      const out = execFileSync("sqlite3", ["-json", LOCAL_DB, sql], { encoding: "utf8" }).trim();
      return out ? JSON.parse(out) : [];
    }
    const raw = execFileSync(
      "npx",
      ["wrangler", "d1", "execute", DATABASE, "--remote", "--json", "--command", sql],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
    const start = raw.indexOf("[");
    return start < 0 ? [] : (JSON.parse(raw.slice(start))[0]?.results ?? []);
  } catch {
    return [];
  }
}

/* --------------------------------------------------------------- the joins */

/** lesson_slug -> { events, sessions, furthest step fraction } */
function usage() {
  const rows = query(`
    SELECT lesson_slug AS slug, event_type, payload_json
      FROM lesson_telemetry
     WHERE lesson_slug IS NOT NULL AND lesson_slug <> ''`);
  const map = new Map();
  for (const r of rows) {
    let entry = map.get(r.slug);
    if (!entry) {
      entry = { slug: r.slug, events: 0, completions: 0, starts: 0 };
      map.set(r.slug, entry);
    }
    entry.events += 1;
    if (r.event_type === "milestone") {
      let p = {};
      try {
        p = JSON.parse(r.payload_json || "{}").props || {};
      } catch {
        /* malformed beacon */
      }
      const step = Number(p.step) || 0;
      const of = Number(p.of) || 0;
      if (of > 0) {
        entry.starts += 1;
        if (step >= of) entry.completions += 1;
      }
    }
  }
  return map;
}

/** Lessons on disk, with their standard, from the curriculum manifest. */
function inventory() {
  let lessons = [];
  try {
    lessons =
      JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8")).lessons || [];
  } catch {
    lessons = [];
  }
  // Fall back to the folder scan if the manifest is missing or stale.
  if (!lessons.length && existsSync(join(ROOT, "lessons"))) {
    lessons = readdirSync(join(ROOT, "lessons"))
      .filter((d) => existsSync(join(ROOT, "lessons", d, "config.json")))
      .map((d) => ({ id: d, title: d, lessonPath: `/lessons/${d}/` }));
  }
  return lessons;
}

/** Standards the pacing guide expects us to teach. */
function expectedStandards() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "data/ccss-standards.json"), "utf8"));
    const list = Array.isArray(data) ? data : data.standards || Object.keys(data);
    return list.map((s) => (typeof s === "string" ? s : s.id || s.code)).filter(Boolean);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ verdict */

const used = usage();
const lessons = inventory();
const standards = expectedStandards();

const covered = new Set(lessons.map((l) => l.standard).filter(Boolean));
const build = standards.filter((s) => !covered.has(s));

/**
 * Telemetry slugs are derived from the page URL, not the manifest id:
 *   math-unit-8-8-1-understand-equations  ->  lesson 8-1
 *   math-unit-1-projects-version-a        ->  (no lesson — a unit project)
 * So a raw `id` lookup matches nothing. Build a slug -> lesson-id index by
 * pulling the `<unit>-<lesson>` pair that follows the `math-unit-<n>-` prefix.
 * Slugs that carry no such pair (projects, reviews, games) stay unmatched and
 * are reported as such rather than silently counting as "never opened".
 */
const slugToId = new Map();
for (const slug of used.keys()) {
  const m = String(slug).match(/^math-unit-\d+-(\d+-\d+)-/);
  if (m) slugToId.set(slug, m[1]);
}
const byLessonId = new Map();
for (const [slug, id] of slugToId) {
  const u = used.get(slug);
  const prev = byLessonId.get(id) || { events: 0, starts: 0, completions: 0 };
  byLessonId.set(id, {
    events: prev.events + u.events,
    starts: prev.starts + u.starts,
    completions: prev.completions + u.completions,
  });
}
const unmatchedSlugs = [...used.keys()].filter((s) => !slugToId.has(s));

const scored = lessons.map((l) => {
  const u =
    byLessonId.get(l.id) ||
    used.get(l.id) ||
    used.get((l.lessonPath || "").replace(/^\/lessons\/|\/$/g, "")) ||
    null;
  const events = u ? u.events : 0;
  const starts = u ? u.starts : 0;
  const completions = u ? u.completions : 0;
  const finishRate = starts ? completions / starts : null;
  return { ...l, events, starts, completions, finishRate };
});

const promote = scored
  .filter((l) => l.events >= 20 && (l.finishRate == null || l.finishRate >= 0.6))
  .sort((a, b) => b.events - a.events)
  .slice(0, 15);

const repair = scored
  .filter((l) => l.starts >= 5 && l.finishRate != null && l.finishRate < 0.4)
  .sort((a, b) => a.finishRate - b.finishRate);

const retire = scored
  .filter((l) => l.events === 0)
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

/* ------------------------------------------------------------------ report */

const L = [];
L.push(`# Content decisions — ${new Date().toISOString().slice(0, 10)}`);
L.push("");
L.push(
  `Inventory: **${lessons.length}** lessons · **${standards.length}** standards in the spine · telemetry on **${used.size}** distinct slugs.`,
);
L.push("");
L.push(
  "> Telemetry counts only sessions where the beacon fired, so every number here is a lower bound. Treat RETIRE as a list to look at, not a list to delete.",
);
L.push("");
L.push(
  `Slug match: **${slugToId.size} of ${used.size}** telemetry slugs resolved to a manifest lesson. The other ${unmatchedSlugs.length} are unit projects, reviews, and games, which have no lesson id to join on — they are excluded from every verdict below rather than counted as unused.`,
);
L.push("");

L.push(`## BUILD — ${build.length} standards with no lesson`);
L.push("");
L.push(
  build.length
    ? build.map((s) => `- \`${s}\``).join("\n")
    : "_Every standard in the spine has at least one lesson._",
);
L.push("");

L.push(`## REPAIR — ${repair.length} lessons students open and abandon`);
L.push("");
if (!repair.length) {
  L.push("_No lesson has 5+ starts with a finish rate under 40%._");
} else {
  L.push("| Lesson | Starts | Finish rate |");
  L.push("| --- | ---: | ---: |");
  for (const l of repair.slice(0, 20)) {
    L.push(
      `| [${l.id} · ${l.title}](${l.lessonPath || "#"}) | ${l.starts} | ${Math.round(l.finishRate * 100)}% |`,
    );
  }
}
L.push("");

L.push(`## PROMOTE — ${promote.length} lessons carrying real load`);
L.push("");
if (!promote.length) {
  L.push("_No lesson has 20+ telemetry events yet._");
} else {
  L.push("| Lesson | Events | Finish rate |");
  L.push("| --- | ---: | ---: |");
  for (const l of promote) {
    L.push(
      `| [${l.id} · ${l.title}](${l.lessonPath || "#"}) | ${l.events} | ${
        l.finishRate == null ? "—" : `${Math.round(l.finishRate * 100)}%`
      } |`,
    );
  }
}
L.push("");

L.push(`## RETIRE (candidates) — ${retire.length} lessons never opened`);
L.push("");
if (!retire.length) {
  L.push("_Every lesson has been opened at least once._");
} else {
  L.push(`<details><summary>Show ${retire.length} lessons</summary>`);
  L.push("");
  L.push(retire.map((l) => `- ${l.id} · ${l.title}`).join("\n"));
  L.push("");
  L.push("</details>");
}
L.push("");

L.push("## What to do with this");
L.push("");
L.push("1. **BUILD** is the only list that is unambiguous — those standards have nothing.");
L.push("2. **REPAIR** beats building new material: students already found these and gave up.");
L.push("3. **PROMOTE** belongs on the hub's front page and in family communication.");
L.push("4. **RETIRE** is a conversation, not an action. Check a few by hand before believing it.");

mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(join(ROOT, "reports/content-decisions.md"), L.join("\n"));

console.log("✓ reports/content-decisions.md");
console.log(
  `  BUILD ${build.length} · REPAIR ${repair.length} · PROMOTE ${promote.length} · RETIRE ${retire.length}`,
);

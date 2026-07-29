#!/usr/bin/env node
/**
 * Batch Parent Updates (offline CLI)
 * ==================================
 * Generates one bilingual (EN/ES) family note per student from the progress
 * "grades" pivot, reusing the family-letter look. The live, in-browser version
 * lives at /teacher-tools/parent-updates/ (PII never leaves the browser there).
 *
 * PRIVACY: notes contain student names + scores. This CLI writes OUTSIDE the
 * repo by default (OS temp dir) and refuses to write into a git-tracked repo
 * folder, so student data is never committed or deployed.
 *
 * Usage:
 *   TEACHER_KEY=… npm run parent-updates -- --section 601
 *   TEACHER_KEY=… npm run parent-updates -- --weekly --section 601
 *   npm run parent-updates -- --fixture ./sample-grades.json --out ~/notes
 *
 * Flags:
 *   --source live|fixture  where to read grades from (default live)
 *   --site <url>           site origin (default $NEFT_SITE or eduwonderlab.com)
 *   --key <k>              teacher key (default $TEACHER_KEY / $NEFT_TEACHER_KEY)
 *   --fixture <path>       JSON grades pivot for --source fixture / offline test
 *                          (with --weekly: a digest response { students: [...] })
 *   --section <id>         only this class/period
 *   --out <dir>            output dir (default: a fresh OS-temp folder)
 *   --weekly               weekly bilingual digests instead of progress notes:
 *                          reads GET /api/progress/digest?since=<7 days ago>
 *                          and renders via buildWeeklyDigest (same guardOut —
 *                          PII never lands inside the repo)
 *   --force               allow a repo-internal --out (NOT recommended)
 *
 * CONTRACT: digest phrasing lives in scripts/lib/parent-note.mjs
 * (buildWeeklyDigest) and is mirrored inline by the live page
 * teacher-tools/parent-updates/index.html — keep the two in sync.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDocument,
  buildNoteHTML,
  buildWeeklyDigest,
  summarizeGrades,
} from "./lib/parent-note.mjs";

const REPO = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const DEFAULT_SITE = process.env.NEFT_SITE || "https://eduwonderlab.com";

function parseArgs(argv) {
  const a = { flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (["--source", "--site", "--key", "--fixture", "--section", "--out"].includes(t))
      a[t.slice(2)] = argv[++i];
    else if (t.startsWith("--")) a.flags.add(t.slice(2));
    else throw new Error(`Unexpected argument: ${t}`);
  }
  return a;
}

function slug(s) {
  return (
    String(s || "student")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "student"
  );
}

/** Refuse output paths inside the repo (unless a dot-dir or --force) so PII never gets committed. */
function guardOut(dir, force) {
  const abs = resolve(dir);
  const rel = relative(REPO, abs);
  const inside = rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  if (inside && !force) {
    const topSeg = rel.split(/[\\/]/)[0];
    if (!topSeg.startsWith(".")) {
      throw new Error(
        `Refusing to write student data inside the repo (${rel}). ` +
          `That dir would be committed/deployed. Use --out <path outside the repo>, or pass --force.`,
      );
    }
  }
  return abs;
}

async function fetchGrades(site, key, section) {
  const qs = new URLSearchParams({ key, format: "json" });
  if (section) qs.set("section", section);
  const r = await fetch(`${site}/api/progress/grades?${qs}`, { headers: { "x-teacher-key": key } });
  if (r.status === 401) throw new Error("Unauthorized (401): wrong teacher key.");
  if (r.status === 503)
    throw new Error("Gradebook not configured on the server (TEACHER_KEY unset).");
  if (!r.ok) throw new Error(`grades request failed: HTTP ${r.status}`);
  const d = await r.json();
  if (!d.ok) throw new Error(`grades error: ${d.error || "unknown"}`);
  return d;
}

function readFixture(path) {
  const d = JSON.parse(readFileSync(path, "utf8"));
  // Accept either a raw pivot { activities, rows } or a wrapped { ... }.
  if (Array.isArray(d.rows)) return d;
  if (d.grades && Array.isArray(d.grades.rows)) return d.grades;
  throw new Error("Fixture must be a grades pivot with { activities, rows }.");
}

async function fetchDigest(site, key, section, since) {
  const qs = new URLSearchParams({ key, since });
  if (section) qs.set("section", section);
  const r = await fetch(`${site}/api/progress/digest?${qs}`, { headers: { "x-teacher-key": key } });
  if (r.status === 401) throw new Error("Unauthorized (401): wrong teacher key.");
  if (r.status === 503) throw new Error("Digest not configured on the server (TEACHER_KEY unset).");
  if (!r.ok) throw new Error(`digest request failed: HTTP ${r.status}`);
  const d = await r.json();
  if (!d.ok) throw new Error(`digest error: ${d.error || "unknown"}`);
  return d;
}

function readDigestFixture(path) {
  const d = JSON.parse(readFileSync(path, "utf8"));
  if (Array.isArray(d.students)) return d;
  throw new Error("Weekly fixture must be a digest response with { students: [...] }.");
}

/** Load the family-homework map (a `window.LESSON_FAMILY_HOMEWORK = {...}` file). */
function readHomeworkMap() {
  try {
    const src = readFileSync(join(REPO, "curriculum", "lesson-family-homework.js"), "utf8");
    return new Function(
      `const window = {}; ${src}; return window.LESSON_FAMILY_HOMEWORK || null;`,
    )();
  } catch {
    return null; // digest simply omits the 5-minute activity link
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const source = a.source || (a.fixture ? "fixture" : "live");
  const site = (a.site || DEFAULT_SITE).replace(/\/$/, "");
  const date = new Date().toISOString().slice(0, 10);

  if (a.flags.has("weekly")) return weeklyMain(a, source, site, date);

  let grades;
  if (source === "fixture") {
    if (!a.fixture) throw new Error("--source fixture requires --fixture <path>.");
    grades = readFixture(a.fixture);
  } else {
    const key = a.key || process.env.TEACHER_KEY || process.env.NEFT_TEACHER_KEY;
    if (!key) throw new Error("Live mode needs a teacher key (--key or $TEACHER_KEY).");
    grades = await fetchGrades(site, key, a.section);
  }

  let summaries = summarizeGrades(grades);
  if (a.section) summaries = summaries.filter((s) => String(s.section) === String(a.section));
  if (!summaries.length) {
    process.stderr.write("No students found for that scope.\n");
    process.exit(1);
  }

  const outDir = guardOut(
    a.out || join(tmpdir(), `neft-parent-notes-${date}`),
    a.flags.has("force"),
  );
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const notes = summaries.map((s) => buildNoteHTML(s, { date }));
  const title = `Family Updates${a.section ? ` — ${a.section}` : ""}`;
  writeFileSync(join(outDir, "index.html"), buildDocument(notes, { title, date }));
  const seen = new Map();
  for (const s of summaries) {
    let base = slug(`${s.name}-${s.section}`);
    seen.set(base, (seen.get(base) || 0) + 1);
    if (seen.get(base) > 1) base += `-${seen.get(base)}`;
    writeFileSync(
      join(outDir, `note-${base}.html`),
      buildDocument([buildNoteHTML(s, { date })], { title: s.name, date }),
    );
  }

  process.stdout.write(
    `\n✓ ${summaries.length} bilingual parent note(s) written to:\n  ${outDir}\n\n` +
      `  • index.html  — all notes on one printable page\n` +
      `  • note-*.html — one file per student\n\n` +
      `⚠ Contains student names + scores. Keep this folder private; it is outside the repo and never deployed.\n`,
  );
}

/** --weekly: one bilingual digest per student from GET /api/progress/digest. */
async function weeklyMain(a, source, site, date) {
  let digest;
  if (source === "fixture") {
    if (!a.fixture) throw new Error("--source fixture requires --fixture <path>.");
    digest = readDigestFixture(a.fixture);
  } else {
    const key = a.key || process.env.TEACHER_KEY || process.env.NEFT_TEACHER_KEY;
    if (!key) throw new Error("Live mode needs a teacher key (--key or $TEACHER_KEY).");
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    digest = await fetchDigest(site, key, a.section, since);
  }

  let students = Array.isArray(digest.students) ? digest.students : [];
  if (a.section) students = students.filter((s) => String(s.section) === String(a.section));
  if (!students.length) {
    process.stderr.write("No students found for that scope.\n");
    process.exit(1);
  }

  const outDir = guardOut(
    a.out || join(tmpdir(), `neft-weekly-digest-${date}`),
    a.flags.has("force"),
  );
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const homeworkMap = readHomeworkMap();
  const opts = { date, homeworkMap, site };
  const title = `Weekly Family Digest${a.section ? ` — ${a.section}` : ""}`;
  writeFileSync(
    join(outDir, "index.html"),
    buildDocument(
      students.map((s) => buildWeeklyDigest(s, opts)),
      { title, date },
    ),
  );
  const seen = new Map();
  for (const s of students) {
    let base = slug(`${s.studentName}-${s.section}`);
    seen.set(base, (seen.get(base) || 0) + 1);
    if (seen.get(base) > 1) base += `-${seen.get(base)}`;
    writeFileSync(
      join(outDir, `digest-${base}.html`),
      buildDocument([buildWeeklyDigest(s, opts)], { title: s.studentName, date }),
    );
  }

  process.stdout.write(
    `\n✓ ${students.length} weekly bilingual digest(s) written to:\n  ${outDir}\n\n` +
      `  • index.html    — all digests on one printable page\n` +
      `  • digest-*.html — one file per student\n\n` +
      `⚠ Contains student names + scores. Keep this folder private; it is outside the repo and never deployed.\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});

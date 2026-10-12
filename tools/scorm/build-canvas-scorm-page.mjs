#!/usr/bin/env node
import { execFile, execFileSync } from "child_process";
// Build the on-site Canvas SCORM hub: generate a SCORM package for every lesson
// and assignable activity, copy them into the SERVED teacher dir, and emit the
// data index the teacher page renders. One command keeps the whole "auto-grade
// everything in Canvas" workflow downloadable from the site — no terminal.
//
//   npm run canvas-scorm:build
//
// Output:
//   teacher-tools/canvas-scorm/packages/*.zip   (downloadable SCORM packages)
//   teacher-tools/canvas-scorm/packages-index.json  (drives index.html)
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { availableParallelism } from "os";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { packageFileName } from "../../functions/_lib/scorm.js";
import { pruneOutsideExpectedSet, reportPrune } from "./lib/prune-stale.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const buildOne = resolve(__dirname, "build-scorm.mjs");
const scormOut = resolve(repoRoot, "scorm-packages");
const pageDir = resolve(repoRoot, "teacher-tools/canvas-scorm");
const pkgDir = resolve(pageDir, "packages");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");

if (existsSync(pkgDir))
  rmSync(pkgDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
mkdirSync(pkgDir, { recursive: true });
mkdirSync(scormOut, { recursive: true });

const execFileAsync = promisify(execFile);
const JOBS = Math.max(
  1,
  Number(process.env.SCORM_JOBS) || Math.min(8, Math.max(2, availableParallelism())),
);

// Every package is its own `node build-scorm.mjs` process writing its own zip,
// so they are independent; running them one at a time was ~16s of the build.
const build = (target, title, id) => execFileAsync("node", [buildOne, target, title, id || ""]);

/** Run `jobs` (async thunks) with at most JOBS in flight; results keep input order. */
async function runPool(jobs) {
  const settled = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      settled[i] = await jobs[i]().then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error }),
      );
    }
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, jobs.length) }, worker));
  return settled;
}

// --- lessons (non-flagship) ---
const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
const allLessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id);
// Flagship lessons are included too — a teacher who assigns the flagship
// version needs its package just like the standard one.
const lessons = allLessons;

// --- activities (catalog) ---
const catalog = JSON.parse(readFileSync(resolve(__dirname, "activity-catalog.json"), "utf8"));
// Dedupe on the package slug (id || path) — query variants of one path (e.g.
// practice-arcade ?unit=1..10) are DISTINCT packages and must all survive.
const seen = new Set();
const activities = catalog.activities.filter((a) => {
  const key = a.id || a.path;
  return seen.has(key) ? false : seen.add(key);
});

// Resolve a catalog entry to its launch URL + collision-proof package slug.
// path may be a directory (gets a trailing /) or a direct .html file; query
// (e.g. ?unit=3) is appended and REQUIRES an explicit id so slugs stay unique.
const resolveEntry = (a) => {
  const isFile = /\.html?$/i.test(a.path);
  const clean = a.path.replace(/\/+$/, "");
  const url = `${SITE}/${clean}${isFile ? "" : "/"}${a.query || ""}`;
  const slug = a.id || clean.replace(/\.html?$/i, "").replace(/\//g, "-");
  return { url, slug };
};

const index = {
  generatedNote: "Rebuild with: npm run canvas-scorm:build",
  lessons: [],
  activities: [],
  homework: [],
  quizzes: [],
};
let ok = 0,
  fail = 0;
// Every zip name scorm-packages/ SHOULD hold after this full-catalog run —
// recorded before each build so a failed rebuild keeps its current-named
// package rather than losing it to the sweep below.
const expectedZips = [];

const lessonJobs = lessons.map((l) => {
  const title = l.title || `Lesson ${l.id}`;
  expectedZips.push(packageFileName(l.id, false));
  return () => build(l.id, title);
});
(await runPool(lessonJobs)).forEach((r, i) => {
  const l = lessons[i];
  const title = l.title || `Lesson ${l.id}`;
  if (!r.ok) {
    fail++;
    console.log(`  ✗ lesson ${l.id}: ${String(r.error.stderr || r.error.message).slice(0, 120)}`);
    return;
  }
  const file = `${packageFileName(l.id, false)}`;
  copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
  index.lessons.push({ id: l.id, unit: l.unit ?? null, title, file, flagship: !!l.flagship });
  ok++;
});

// --- interactive homework (one per lesson that ships homework.html) ---
const homeworkLessons = allLessons.filter((l) =>
  existsSync(resolve(repoRoot, `lessons/${l.id}/homework.html`)),
);
const homeworkJobs = homeworkLessons.map((l) => {
  const slug = `homework-${l.id}`;
  expectedZips.push(packageFileName(slug, false));
  return () =>
    build(`${SITE}/lessons/${l.id}/homework.html`, `Homework ${l.id}: ${l.title || l.id}`, slug);
});
(await runPool(homeworkJobs)).forEach((r, i) => {
  const l = homeworkLessons[i];
  if (!r.ok) {
    fail++;
    console.log(`  ✗ homework ${l.id}: ${String(r.error.stderr || r.error.message).slice(0, 120)}`);
    return;
  }
  const file = `${packageFileName(`homework-${l.id}`, false)}`;
  copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
  index.homework.push({
    id: l.id,
    unit: l.unit ?? null,
    title: `Homework ${l.id}: ${l.title || l.id}`,
    file,
  });
  ok++;
});

const activityJobs = activities.map((a) => {
  const { url, slug } = resolveEntry(a);
  expectedZips.push(packageFileName(slug, false));
  return () => build(url, a.title, slug);
});
(await runPool(activityJobs)).forEach((r, i) => {
  const a = activities[i];
  if (!r.ok) {
    fail++;
    console.log(
      `  ✗ activity ${a.path}: ${String(r.error.stderr || r.error.message).slice(0, 120)}`,
    );
    return;
  }
  const { slug } = resolveEntry(a);
  const file = `${packageFileName(slug, false)}`;
  copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
  index.activities.push({ id: slug, title: a.title, grade: a.grade || "completion", file });
  ok++;
});

// --- native QTI quizzes (item-scored — imported via "QTI .zip file", not SCORM) ---
try {
  execFileSync("node", [resolve(repoRoot, "tools/canvas/build-pretest-qti.mjs")], {
    stdio: "pipe",
  });
  const qtiZip = "neft-pretest-quizzes.zip";
  copyFileSync(resolve(repoRoot, "canvas-packages", qtiZip), resolve(pkgDir, qtiZip));
  index.quizzes.push({
    id: "pretest-quizzes",
    title: "Unit Pre-Tests — 10 native Canvas quizzes (item-scored, answer keys validated)",
    file: qtiZip,
  });
  ok++;
} catch (e) {
  fail++;
  console.log(`  ✗ pre-test QTI: ${String(e.stderr || e.message).slice(0, 200)}`);
}

const byUnit = (a, b) => a.unit - b.unit || a.id.localeCompare(b.id, undefined, { numeric: true });
index.lessons.sort(byUnit);
index.homework.sort(byUnit);
writeFileSync(resolve(pageDir, "packages-index.json"), JSON.stringify(index, null, 2) + "\n");

// This run enumerated EVERY family scorm-packages/ holds, so any zip outside
// the intended set is a stale generation or a removed catalog entry — the
// accumulation that twice broke validate:scorm:shipped. Checklists survive.
const pruned = pruneOutsideExpectedSet(scormOut, expectedZips);

console.log(
  `Canvas SCORM page build: ${ok} packages (${index.lessons.length} lessons + ${index.activities.length} activities + ${index.homework.length} homework + ${index.quizzes.length} quiz pack), ${fail} failed`,
);
reportPrune(pruned);
console.log(`  → teacher-tools/canvas-scorm/packages/ + packages-index.json`);
if (fail) console.log(`  (${fail} item(s) skipped — non-fatal)`);

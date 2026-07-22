#!/usr/bin/env node
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
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const buildOne = resolve(__dirname, "build-scorm.mjs");
const scormOut = resolve(repoRoot, "scorm-packages");
const pageDir = resolve(repoRoot, "teacher-tools/canvas-scorm");
const pkgDir = resolve(pageDir, "packages");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");

if (existsSync(pkgDir)) rmSync(pkgDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
mkdirSync(pkgDir, { recursive: true });
mkdirSync(scormOut, { recursive: true });

const build = (target, title, id) =>
  execFileSync("node", [buildOne, target, title, id || ""], { stdio: "pipe" });

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

for (const l of lessons) {
  const title = l.title || `Lesson ${l.id}`;
  try {
    build(l.id, title);
    const file = `neft-lesson-${l.id}.zip`;
    copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
    index.lessons.push({
      id: l.id,
      unit: l.unit ?? null,
      title,
      file,
      flagship: !!l.flagship,
    });
    ok++;
  } catch (e) {
    fail++;
    console.log(`  ✗ lesson ${l.id}: ${String(e.stderr || e.message).slice(0, 120)}`);
  }
}

// --- interactive homework (one per lesson that ships homework.html) ---
for (const l of allLessons) {
  const rel = `lessons/${l.id}/homework.html`;
  if (!existsSync(resolve(repoRoot, rel))) continue;
  const slug = `homework-${l.id}`;
  const title = `Homework ${l.id}: ${l.title || l.id}`;
  try {
    build(`${SITE}/${rel}`, title, slug);
    const file = `neft-lesson-${slug}.zip`;
    copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
    index.homework.push({ id: l.id, unit: l.unit ?? null, title, file });
    ok++;
  } catch (e) {
    fail++;
    console.log(`  ✗ homework ${l.id}: ${String(e.stderr || e.message).slice(0, 120)}`);
  }
}

for (const a of activities) {
  const { url, slug } = resolveEntry(a);
  try {
    build(url, a.title, slug);
    const file = `neft-lesson-${slug}.zip`;
    copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
    index.activities.push({ id: slug, title: a.title, grade: a.grade || "completion", file });
    ok++;
  } catch (e) {
    fail++;
    console.log(`  ✗ activity ${a.path}: ${String(e.stderr || e.message).slice(0, 120)}`);
  }
}

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

console.log(
  `Canvas SCORM page build: ${ok} packages (${index.lessons.length} lessons + ${index.activities.length} activities + ${index.homework.length} homework + ${index.quizzes.length} quiz pack), ${fail} failed`,
);
console.log(`  → teacher-tools/canvas-scorm/packages/ + packages-index.json`);
if (fail) console.log(`  (${fail} item(s) skipped — non-fatal)`);

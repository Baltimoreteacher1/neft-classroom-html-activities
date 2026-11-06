#!/usr/bin/env node
// Build the on-site Canvas SCORM hub data: the index of every lesson, homework and
// assignable activity a teacher can package, each pointing at /api/scorm.
//
//   npm run canvas-scorm:build
//
// The SCORM zips are NOT written to disk or shipped. /api/scorm builds the same
// package in memory on request from functions/_lib/scorm.js (the code build-scorm.mjs
// uses), so the ~500 static zips only cost Cloudflare Pages file budget (20,000 files per
// deployment) without adding a package the endpoint cannot produce.
//
// Output:
//   teacher-tools/canvas-scorm/packages-index.json  (drives index.html)
//   teacher-tools/canvas-scorm/packages/neft-pretest-quizzes.zip  (QTI: not SCORM, one file)
import { execFileSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const pageDir = resolve(repoRoot, "teacher-tools/canvas-scorm");
const pkgDir = resolve(pageDir, "packages");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");

if (existsSync(pkgDir))
  rmSync(pkgDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
mkdirSync(pkgDir, { recursive: true });

// Manifest titles are {en, es}; the package and page names are English.
const en = (t) => (typeof t === "string" ? t : t?.en);

/** Same-origin download link for one package. `id` pins the SCORM manifest identifier. */
const apiHref = (activity, title, id) => {
  const q = new URLSearchParams({ activity });
  if (title) q.set("title", title);
  if (id) q.set("id", id);
  return `/api/scorm?${q}`;
};

// --- lessons (non-flagship) ---
const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
const allLessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id);

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

for (const l of allLessons) {
  index.lessons.push({
    id: l.id,
    unit: l.unit ?? null,
    title: en(l.title) || `Lesson ${l.id}`,
    // No title param: /api/scorm names a lesson package from the canonical curriculum title.
    href: apiHref(l.id),
    flagship: !!l.flagship,
  });
}

// --- interactive homework (one per lesson that ships homework.html) ---
for (const l of allLessons) {
  if (!existsSync(resolve(repoRoot, `lessons/${l.id}/homework.html`))) continue;
  const title = `Homework ${l.id}: ${en(l.title) || l.id}`;
  index.homework.push({
    id: l.id,
    unit: l.unit ?? null,
    title,
    href: apiHref(`${SITE}/lessons/${l.id}/homework.html`, title, `homework-${l.id}`),
  });
}

for (const a of activities) {
  const { url, slug } = resolveEntry(a);
  index.activities.push({
    id: slug,
    title: a.title,
    grade: a.grade || "completion",
    href: apiHref(url, a.title, slug),
  });
}

// --- native QTI quizzes (item-scored — imported via "QTI .zip file", not SCORM) ---
let fail = 0;
try {
  execFileSync("node", [resolve(repoRoot, "tools/canvas/build-pretest-qti.mjs")], {
    stdio: "pipe",
  });
  const qtiZip = "neft-pretest-quizzes.zip";
  copyFileSync(resolve(repoRoot, "canvas-packages", qtiZip), resolve(pkgDir, qtiZip));
  index.quizzes.push({
    id: "pretest-quizzes",
    title: "Unit Pre-Tests — 10 native Canvas quizzes (item-scored, answer keys validated)",
    href: `./packages/${qtiZip}`,
  });
} catch (e) {
  fail++;
  console.log(`  ✗ pre-test QTI: ${String(e.stderr || e.message).slice(0, 200)}`);
}

const byUnit = (a, b) => a.unit - b.unit || a.id.localeCompare(b.id, undefined, { numeric: true });
index.lessons.sort(byUnit);
index.homework.sort(byUnit);
writeFileSync(resolve(pageDir, "packages-index.json"), JSON.stringify(index, null, 2) + "\n");

console.log(
  `Canvas SCORM page build: ${index.lessons.length} lessons + ${index.activities.length} activities + ${index.homework.length} homework + ${index.quizzes.length} quiz pack indexed, ${fail} failed`,
);
console.log(
  "  → teacher-tools/canvas-scorm/packages-index.json (packages build on request at /api/scorm)",
);
if (fail) console.log(`  (${fail} item(s) skipped — non-fatal)`);

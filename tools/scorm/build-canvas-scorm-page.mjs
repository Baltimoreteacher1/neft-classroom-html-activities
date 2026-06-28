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

if (existsSync(pkgDir)) rmSync(pkgDir, { recursive: true, force: true });
mkdirSync(pkgDir, { recursive: true });
mkdirSync(scormOut, { recursive: true });

const build = (target, title, id) =>
  execFileSync("node", [buildOne, target, title, id || ""], { stdio: "pipe" });

// --- lessons (non-flagship) ---
const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
const lessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id && !l.flagship);

// --- activities (catalog) ---
const catalog = JSON.parse(readFileSync(resolve(__dirname, "activity-catalog.json"), "utf8"));
const seen = new Set();
const activities = catalog.activities.filter((a) => (seen.has(a.path) ? false : seen.add(a.path)));

const index = {
  generatedNote: "Rebuild with: npm run canvas-scorm:build",
  lessons: [],
  activities: [],
};
let ok = 0,
  fail = 0;

for (const l of lessons) {
  const title = l.title || `Lesson ${l.id}`;
  try {
    build(l.id, title);
    const file = `neft-lesson-${l.id}.zip`;
    copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
    index.lessons.push({ id: l.id, unit: l.unit ?? null, title, file });
    ok++;
  } catch (e) {
    fail++;
    console.log(`  ✗ lesson ${l.id}: ${String(e.stderr || e.message).slice(0, 120)}`);
  }
}

for (const a of activities) {
  // Collision-proof slug so nested paths (math/unit-1/projects) get unique
  // package names instead of all colliding on the last segment ("projects").
  const slug = a.path.replace(/\/+$/, "").replace(/\//g, "-");
  try {
    build(`${SITE}/${a.path}/`, a.title, slug);
    const file = `neft-lesson-${slug}.zip`;
    copyFileSync(resolve(scormOut, file), resolve(pkgDir, file));
    index.activities.push({ id: slug, title: a.title, grade: a.grade || "completion", file });
    ok++;
  } catch (e) {
    fail++;
    console.log(`  ✗ activity ${a.path}: ${String(e.stderr || e.message).slice(0, 120)}`);
  }
}

index.lessons.sort(
  (a, b) => a.unit - b.unit || a.id.localeCompare(b.id, undefined, { numeric: true }),
);
writeFileSync(resolve(pageDir, "packages-index.json"), JSON.stringify(index, null, 2) + "\n");

console.log(
  `Canvas SCORM page build: ${ok} packages (${index.lessons.length} lessons + ${index.activities.length} activities), ${fail} failed`,
);
console.log(`  → teacher-tools/canvas-scorm/packages/ + packages-index.json`);
if (fail) console.log(`  (${fail} item(s) skipped — non-fatal)`);

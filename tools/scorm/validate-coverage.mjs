#!/usr/bin/env node
// validate-coverage.mjs — assert every assignable surface on the site has a
// working Canvas grade path, BEFORE the deploy build packages it.
//
// Guards the invariants the Canvas auto-grade pipeline depends on:
//   1. Every activity-catalog entry resolves to a real file on disk.
//   2. Every catalog / injectOnly / homework page carries the canvas-bridge
//      injection sentinel (engine lessons are exempt — the engine has its own
//      grade channel via canvas-code.js / grade-emit.js).
//   3. Query-string entries declare an explicit id, and all package slugs are
//      unique across lessons + activities + homework (zip filename collisions
//      would silently overwrite packages).
//   4. Every curriculum-manifest lesson has a lessons/<id>/ page, and every
//      homework.html is bridge-injected.
//
// Run:  npm run validate:canvas-coverage        (part of `npm run validate`)
// Exit: 0 = all invariants hold, 1 = violations (each printed).
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MARK = "canvas-bridge-injected:begin";
const problems = [];

const catalog = JSON.parse(readFileSync(join(ROOT, "tools/scorm/activity-catalog.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
const lessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id);

const toFile = (p) => (/\.html?$/i.test(p) ? p : `${p.replace(/\/+$/, "")}/index.html`);
const toSlug = (a) =>
  a.id ||
  a.path
    .replace(/\/+$/, "")
    .replace(/\.html?$/i, "")
    .replace(/\//g, "-");

const hasBridge = (rel) => {
  const f = join(ROOT, rel);
  return existsSync(f) && readFileSync(f, "utf8").includes(MARK);
};

// --- 1+2+3: catalog entries ---
const slugs = new Map(); // slug -> first source, to name both sides of a collision
const claim = (slug, source) => {
  if (slugs.has(slug)) problems.push(`slug collision: "${slug}" (${slugs.get(slug)} vs ${source})`);
  else slugs.set(slug, source);
};

for (const a of catalog.activities) {
  const file = toFile(a.path);
  if (!existsSync(join(ROOT, file))) {
    problems.push(`catalog path missing on disk: ${a.path}`);
    continue;
  }
  if (a.query && !a.id)
    problems.push(`catalog entry with query needs explicit id: ${a.path}${a.query}`);
  if (!hasBridge(file)) problems.push(`catalog page lacks canvas-bridge: ${file}`);
  claim(toSlug(a), `activity ${a.path}${a.query || ""}`);
}

for (const p of catalog.injectOnly || []) {
  if (!existsSync(join(ROOT, p))) problems.push(`injectOnly path missing on disk: ${p}`);
  else if (!hasBridge(p)) problems.push(`injectOnly page lacks canvas-bridge: ${p}`);
}

// --- 4: lessons + homework ---
let homeworkCount = 0;
for (const l of lessons) {
  if (!existsSync(join(ROOT, "lessons", l.id, "index.html")))
    problems.push(`manifest lesson missing on disk: lessons/${l.id}/`);
  claim(l.id, `lesson ${l.id}`);
  const hw = `lessons/${l.id}/homework.html`;
  if (existsSync(join(ROOT, hw))) {
    homeworkCount++;
    if (!hasBridge(hw)) problems.push(`homework page lacks canvas-bridge: ${hw}`);
    claim(`homework-${l.id}`, `homework ${l.id}`);
  }
}

const uniqueActivities = new Set(catalog.activities.map(toSlug)).size;
console.log("Canvas coverage validation");
console.log(`  lessons          : ${lessons.length}`);
console.log(`  activities       : ${uniqueActivities}`);
console.log(`  homework pages   : ${homeworkCount}`);
console.log(`  inject-only pages: ${(catalog.injectOnly || []).length}`);
console.log(`  package slugs    : ${slugs.size}`);
if (problems.length) {
  console.log(`\nFAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log("  ✗ " + p);
  console.log("\nRemediation: fix the catalog entry, or run: node tools/inject-canvas-bridge.js");
  process.exit(1);
}
console.log("RESULT: PASS ✅ (every assignable surface has a Canvas grade path)");

#!/usr/bin/env node
import { execFileSync } from "child_process";
// Build a SCORM package for EVERY canonical lesson (non-flagship), so the whole
// Grade 6 course can be uploaded into Canvas's SCORM tool as auto-graded
// assignments. Each package iframes the LIVE lesson, so re-running this is only
// needed when lessons are ADDED/REMOVED — editing lesson content never requires
// a rebuild or re-upload.
//
// Lesson set = data/curriculum-manifest.json where !flagship (mirrors
// build-cartridge.mjs, so SCORM assignments line up 1:1 with the cartridge).
//
// Usage:
//   node tools/scorm/build-all-scorm.mjs            # build all
//   node tools/scorm/build-all-scorm.mjs --unit 3   # one unit only
// Output: scorm-packages/<Teacher-Readable-Name>.zip  +  scorm-packages/UPLOAD-CHECKLIST.md
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { packageFileName } from "../../functions/_lib/scorm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const buildOne = resolve(__dirname, "build-scorm.mjs");
const outRoot = resolve(repoRoot, "scorm-packages");

const args = process.argv.slice(2);
const unitIdx = args.indexOf("--unit");
const unitFilter = unitIdx >= 0 ? Number(args[unitIdx + 1]) : null;

const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
let lessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id && !l.flagship);
if (unitFilter != null) lessons = lessons.filter((l) => Number(l.unit) === unitFilter);

if (!lessons.length) {
  console.error("No lessons matched.");
  process.exit(1);
}

mkdirSync(outRoot, { recursive: true });

const ok = [];
const failed = [];
for (const l of lessons) {
  const title = l.title || `Lesson ${l.id}`;
  try {
    execFileSync("node", [buildOne, l.id, title], { stdio: "pipe" });
    ok.push(l);
  } catch (e) {
    failed.push({ id: l.id, err: String(e.stderr || e.message || e).slice(0, 200) });
  }
}

// Upload checklist, grouped by unit.
const byUnit = new Map();
for (const l of ok) {
  const u = String(l.unit ?? "?");
  if (!byUnit.has(u)) byUnit.set(u, []);
  byUnit.get(u).push(l);
}
const lines = [
  "# SCORM Upload Checklist — Neft Math Lessons",
  "",
  "One package = one auto-graded Canvas assignment. In Canvas → **SCORM** →",
  "**Upload** each `.zip`, then deploy it as a graded assignment. Lessons",
  "auto-grade on completion — no codes, no IT. Each package points at the LIVE",
  "lesson, so editing a lesson later needs no re-upload.",
  "",
];
const unitNum = (u) => (u === "?" ? Infinity : Number(u));
for (const u of [...byUnit.keys()].sort((a, b) => unitNum(a) - unitNum(b))) {
  lines.push(`## Unit ${u}`);
  for (const l of byUnit.get(u))
    lines.push(`- [ ] \`${packageFileName(l.id, false)}\` — ${l.title || l.id}`);
  lines.push("");
}
writeFileSync(resolve(outRoot, "UPLOAD-CHECKLIST.md"), lines.join("\n"));

console.log(`SCORM build-all${unitFilter != null ? ` (unit ${unitFilter})` : ""}`);
console.log(`  built : ${ok.length}`);
console.log(`  failed: ${failed.length}`);
if (failed.length) failed.forEach((f) => console.log(`    ✗ ${f.id}: ${f.err}`));
console.log(`  output: scorm-packages/  (+ UPLOAD-CHECKLIST.md)`);
if (failed.length) process.exit(1);

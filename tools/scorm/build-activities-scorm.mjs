#!/usr/bin/env node
import { execFileSync } from "child_process";
// Build a SCORM package for every assignable standalone activity in
// tools/scorm/activity-catalog.json (the non-lesson "work": games, labs,
// reviews). Each wraps the LIVE activity URL with ?lms=scorm&embed=1 so the
// injected assets/canvas-bridge.js reports its grade silently to Canvas.
//
// Run AFTER `node tools/inject-canvas-bridge.js` (so the bridge is on the page).
//
// Usage:  node tools/scorm/build-activities-scorm.mjs
// Output: scorm-packages/<Teacher-Readable-Name>.zip + scorm-packages/ACTIVITIES-CHECKLIST.md
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { packageFileName } from "../../functions/_lib/scorm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const buildOne = resolve(__dirname, "build-scorm.mjs");
const outRoot = resolve(repoRoot, "scorm-packages");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");

const catalog = JSON.parse(readFileSync(resolve(__dirname, "activity-catalog.json"), "utf8"));
// Dedupe on the package slug (id || path) — query variants of one path are
// distinct packages. path may be a dir (index.html) or a direct .html file.
const seen = new Set();
const activities = catalog.activities.filter((a) => {
  const key = a.id || a.path;
  return seen.has(key) ? false : seen.add(key);
});
const resolveEntry = (a) => {
  const isFile = /\.html?$/i.test(a.path);
  const clean = a.path.replace(/\/+$/, "");
  return {
    url: `${SITE}/${clean}${isFile ? "" : "/"}${a.query || ""}`,
    slug: a.id || clean.replace(/\.html?$/i, "").replace(/\//g, "-"),
  };
};

mkdirSync(outRoot, { recursive: true });
const ok = [];
const failed = [];
for (const a of activities) {
  // build-scorm.mjs appends the SCORM launch params itself — pass the plain URL.
  const { url, slug } = resolveEntry(a);
  try {
    execFileSync("node", [buildOne, url, a.title, slug], { stdio: "pipe" });
    ok.push({ ...a, slug });
  } catch (e) {
    failed.push({ path: a.path, err: String(e.stderr || e.message || e).slice(0, 200) });
  }
}

const lines = [
  "# SCORM Activities Checklist — Standalone Student Work",
  "",
  "These are the non-lesson activities (games, labs, reviews). Upload each `.zip`",
  "in Canvas → SCORM → Upload, then deploy as a graded assignment. Most grade on",
  "**completion** (full credit when the student finishes); activities that compute",
  "a score report the real %. Each wraps the LIVE activity, so edits need no",
  "re-upload.",
  "",
];
for (const a of ok) lines.push(`- [ ] \`${packageFileName(a.slug, false)}\` — ${a.title}`);
writeFileSync(resolve(outRoot, "ACTIVITIES-CHECKLIST.md"), lines.join("\n"));

console.log("SCORM build (activities)");
console.log("  built :", ok.length);
console.log("  failed:", failed.length);
if (failed.length) failed.forEach((f) => console.log(`    ✗ ${f.path}: ${f.err}`));
console.log("  output: scorm-packages/  (+ ACTIVITIES-CHECKLIST.md)");
if (failed.length) process.exit(1);

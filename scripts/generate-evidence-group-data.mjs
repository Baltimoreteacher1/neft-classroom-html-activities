#!/usr/bin/env node
/**
 * Generate the two data files the Groups-from-Evidence teacher tool reads.
 *
 * Why generate rather than author: both are PROJECTIONS of things that already
 * exist in this repo, and a hand-maintained copy of either would drift.
 *
 *   data/misconception-taxonomy.json
 *     A flat, browser-fetchable projection of MISCONCEPTIONS in
 *     engine/core/misconceptions.js — the label, the teacher's watch-for line,
 *     and the student-facing explanation, each in EN and ES. The teacher tool
 *     is a standalone page copied into dist/ as-is, so it cannot import from
 *     engine/ (Vite bundles engine into hashed assets; there is no
 *     dist/engine/ to import at runtime). Projecting to JSON keeps the
 *     taxonomy itself the single source of truth.
 *
 *   data/small-group-variants.json
 *     Which small-group variants actually EXIST for each base lesson. The
 *     naming convention is regular (`3-2-group1`, `3-2-catchup`), which makes
 *     it tempting to construct those URLs on the fly — but the variants are
 *     not uniform: some bases have group1+group2, some add a catch-up, some
 *     have none. Guessing sends a teacher to a 404 in front of a class.
 *
 *   node scripts/generate-evidence-group-data.mjs          # write
 *   node scripts/generate-evidence-group-data.mjs --check  # fail if stale (CI)
 *
 * tools/evidence-group-data.test.mjs runs --check and additionally proves
 * every listed variant resolves on disk.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MISCONCEPTIONS } from "../engine/core/misconceptions.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const DATA = join(ROOT, "data");

// Suffixes recognised as small-group variants of a base lesson, in the order a
// teacher would reach for them: the two parallel groups first, then the
// catch-up for students who need the prerequisite retaught.
const VARIANT_SUFFIXES = ["group1", "group2", "catchup"];

const check = process.argv.includes("--check");

// ── 1. Taxonomy projection ────────────────────────────────────────────────
// Sorted by id so the file has a stable diff rather than object-insertion order.
const taxonomy = {};
for (const id of Object.keys(MISCONCEPTIONS).sort()) {
  const entry = MISCONCEPTIONS[id];
  taxonomy[id] = {
    label: entry.label || "",
    // Mirror the fallback rule in misconceptionLabel()/studentExplanation():
    // a partially translated taxonomy degrades to readable English, never to
    // blank. Baking the fallback in here means the browser page does not have
    // to re-implement (and re-derive) that rule.
    labelEs: entry.labelEs || entry.label || "",
    watchFor: entry.watchFor || "",
    student: entry.student || "",
    studentEs: entry.studentEs || entry.student || "",
  };
}

// ── 2. Small-group variant index ──────────────────────────────────────────
const dirs = new Set(
  readdirSync(LESSONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name),
);

const lessonTitle = (id) => {
  const file = join(LESSONS, id, "config.json");
  if (!existsSync(file)) return "";
  try {
    const cfg = JSON.parse(readFileSync(file, "utf8"));
    return cfg.title || cfg.lessonTitle || "";
  } catch {
    return "";
  }
};

// A base lesson is one whose id is bare `unit-lesson` — the generated variants
// all carry a suffix, so this cannot accidentally treat `3-2-group1` as a base.
const bases = {};
for (const id of [...dirs].sort()) {
  if (!/^\d{1,2}-\d{1,2}$/.test(id)) continue;
  const variants = VARIANT_SUFFIXES.filter((s) => dirs.has(`${id}-${s}`));
  bases[id] = { title: lessonTitle(id), variants };
}

// ── 3. Write (or check) ───────────────────────────────────────────────────
const files = [
  [
    "misconception-taxonomy.json",
    { generatedBy: "scripts/generate-evidence-group-data.mjs", taxonomy },
  ],
  [
    "small-group-variants.json",
    { generatedBy: "scripts/generate-evidence-group-data.mjs", suffixes: VARIANT_SUFFIXES, bases },
  ],
];

let stale = 0;
for (const [name, payload] of files) {
  const target = join(DATA, name);
  const next = `${JSON.stringify(payload, null, 2)}\n`;
  let current = null;
  try {
    current = readFileSync(target, "utf8");
  } catch {
    /* new file */
  }
  if (current === next) continue;
  stale += 1;
  if (check) console.error(`stale: data/${name}`);
  else {
    writeFileSync(target, next);
    console.log(`${current === null ? "created" : "updated"}: data/${name}`);
  }
}

if (check && stale > 0) {
  console.error(
    `\n${stale} file(s) out of date — run: node scripts/generate-evidence-group-data.mjs`,
  );
  process.exit(1);
}
if (!check) {
  const withVariants = Object.values(bases).filter((b) => b.variants.length).length;
  console.log(
    `evidence-group data: ${Object.keys(taxonomy).length} misconceptions · ` +
      `${withVariants}/${Object.keys(bases).length} base lessons have small-group variants`,
  );
}
if (check && stale === 0) console.log("evidence-group data up to date");

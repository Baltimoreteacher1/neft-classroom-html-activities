#!/usr/bin/env node
/* =============================================================================
 * validate-reveal-assets — every file in lessons/<id>/reveal-assets/ must be
 * referenced by something in tracked source.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * These folders hold the Notice-and-Wonder and Reveal word-problem images. They
 * are the one asset class with no generator that owns their lifecycle: images
 * are produced by hand or by a one-off script, wired into a lesson's
 * config.json, and then re-pointed whenever the artwork is redone. Nothing has
 * ever asserted that what is ON DISK matches what is REFERENCED.
 *
 * Both directions of that desync have already shipped:
 *
 *  - Unreferenced files. The 2026-07-02 audit found the Notice-and-Wonder image
 *    slot full of stock photos unrelated to their lesson (a basketball stat
 *    sheet illustrated with a national-park collage). Replacing them with
 *    per-lesson SVG diagrams re-pointed the configs but left every superseded
 *    raster on disk — 41 files, 6.58 MB, copied into dist/ and served to
 *    students' browsers on a site whose whole point is being fast on a phone.
 *
 *  - Broken references. The same audit found lessons whose config named an
 *    image that was never produced.
 *
 * WHY IT SCANS ALL TRACKED SOURCE AND NOT THE OWNING LESSON'S CONFIG
 * The obvious implementation — "does lessons/<id>/config.json mention this
 * file?" — is WRONG here, and wrong in the dangerous direction: it reports live
 * files as garbage. The 148 generated group/catch-up lessons reference the CORE
 * lesson's assets (lessons/2-7-group2/config.json points at
 * /lessons/2-7/reveal-assets/notice-wonder.png), and learn.html embeds them
 * directly. A per-lesson check calls those orphans, and acting on it deletes
 * images that are on screen in a classroom. This gate builds the reference set
 * from every tracked text file, once, and the self-test below pins that
 * behavior with a fixture that would fail under the naive implementation.
 *
 *   node tools/validate-reveal-assets.mjs           # exit 1 on any violation
 *   node tools/validate-reveal-assets.mjs --warn    # report only, exit 0
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WARN_ONLY = process.argv.includes("--warn");

/** Where retention decisions are recorded. Declared here because the reference
 *  sweep below must exclude it — see the note there. */
const MANIFEST_REL = "data/reveal-assets-retained.json";

/** Files that NAME reveal assets without USING them, and so must not count as
 *  references. Both are self-references: the manifest records which assets are
 *  deliberately kept, and this validator's own self-test fixtures cite real
 *  paths. Left in the scan, either one makes the sweep quietly self-fulfilling —
 *  a recorded path would read as referenced and a fixture could mask a genuine
 *  orphan. Kept to an exact two-file list; this is not an ignore mechanism. */
const NOT_A_USE = new Set([MANIFEST_REL, "tools/validate-reveal-assets.mjs"]);

/** Extensions worth grepping for a reference. Binaries cannot cite an image. */
const TEXT_EXT = new Set([
  ".json",
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".md",
  ".txt",
  ".svg",
]);

const REF = /lessons\/([\w.-]+)\/reveal-assets\/([\w.-]+)/g;

/**
 * Collect every (lessonId, filename) pair any of `files` refers to.
 * Exported shape kept trivial so the self-test can drive it with fixtures.
 */
function referencesIn(files, read) {
  const refs = new Set();
  for (const f of files) {
    const text = read(f);
    if (text == null) continue;
    for (const m of text.matchAll(REF)) refs.add(`${m[1]}/${m[2]}`);
  }
  return refs;
}

/* ------------------------------------------------------------------ self-test
 * A gate that stops firing reports a clean tree. Prove both directions still
 * work — and specifically that a cross-lesson reference COUNTS — before the
 * real sweep runs.
 * ------------------------------------------------------------------------- */
function selfTest() {
  const fixtures = {
    "lessons/2-7/config.json": '{"image":"/lessons/2-7/reveal-assets/notice-wonder.png"}',
    // The case the naive per-lesson implementation gets wrong: a GENERATED
    // lesson citing a CORE lesson's asset. 2-7's png is live because of this.
    "lessons/2-7-group2/config.json": '{"image":"/lessons/2-7/reveal-assets/word-problem.png"}',
    "lessons/2-3/learn.html": '<img src="../../lessons/2-3/reveal-assets/notice-wonder.jpg" />',
    "lessons/3-1/config.json": '{"image":"/lessons/3-1/reveal-assets/notice-wonder.svg"}',
  };
  const refs = referencesIn(Object.keys(fixtures), (f) => fixtures[f]);

  const cases = [
    ["2-7/notice-wonder.png", true, "same-lesson config reference"],
    ["2-7/word-problem.png", true, "CROSS-LESSON reference from a generated group lesson"],
    ["2-3/notice-wonder.jpg", true, "relative <img src> in learn.html"],
    ["3-1/notice-wonder.svg", true, "svg reference"],
    ["3-1/notice-wonder.png", false, "superseded raster nothing points at"],
    ["9-9/anything.png", false, "file in a lesson no source mentions"],
  ];

  const failed = [];
  for (const [key, want, why] of cases) {
    if (refs.has(key) !== want)
      failed.push(`  ${key} — expected ${want ? "referenced" : "orphan"} (${why})`);
  }

  /* The retention manifest is the half most likely to rot into a blanket
   * allowlist, so its rules are proved here too — including, deliberately, that
   * a path-shaped wildcard is REJECTED rather than quietly honoured. */
  const shapeOk = (p) => /^lessons\/[\w.-]+\/reveal-assets\/[\w.-]+$/.test(p);
  const shapeCases = [
    ["lessons/0-0/reveal-assets/fixture.png", true, "an exact retained path"],
    ["lessons/*/reveal-assets/notice-wonder.png", false, "a glob must not be accepted"],
    ["lessons/0-0/reveal-assets/", false, "a directory must not be accepted"],
    ["assets/img/logo.png", false, "a path outside reveal-assets"],
  ];
  for (const [p, want, why] of shapeCases) {
    if (shapeOk(p) !== want)
      failed.push(`  ${p} — expected ${want ? "valid" : "rejected"} (${why})`);
  }
  const total = cases.length + shapeCases.length;

  if (failed.length) {
    console.error(`✗ validate-reveal-assets self-test FAILED (${failed.length}/${total}):`);
    for (const f of failed) console.error(f);
    process.exit(1);
  }
  console.log(`self-test: ${total} cases PASS`);
}

selfTest();

/* --------------------------------------------------------------- real sweep */
let tracked;
try {
  tracked = execFileSync("git", ["ls-files"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\n")
    .filter(Boolean);
} catch (err) {
  console.error(
    `✗ could not list tracked files (${err.message}) — cannot build the reference set.`,
  );
  process.exit(1);
}

const textFiles = tracked.filter((f) => {
  if (f.startsWith("dist/")) return false; // build output mirrors source; not a source of truth
  // Naming an asset is not using it — see NOT_A_USE. Load-bearing, not tidy:
  // the manifest is a tracked .json, so the gate read green while the file was
  // untracked and called every entry "back in use" the moment it was staged.
  if (NOT_A_USE.has(f)) return false;
  const dot = f.lastIndexOf(".");
  return dot > -1 && TEXT_EXT.has(f.slice(dot).toLowerCase());
});

const refs = referencesIn(textFiles, (f) => {
  const abs = join(ROOT, f);
  try {
    return readFileSync(abs, "utf8");
  } catch {
    return null;
  }
});

/* ------------------------------------------------------- retention manifest
 * An unreferenced file is only a defect while nobody has looked at it. Some are
 * kept on purpose: deleting the image a lesson used to show is an authoring
 * decision, not something a QA gate gets to make on its own.
 *
 * So retention is ALLOWED but must be RECORDED — exact path, status, reason, in
 * data/reveal-assets-retained.json. No globs, no directory rules, no wildcards:
 * a broad ignore would re-open exactly the desync this gate exists to catch,
 * since the next superseded raster would land inside it unnoticed.
 *
 * The manifest is held to the same standard as the tree it describes. An entry
 * that no longer exists on disk, or that has become referenced again, FAILS —
 * otherwise the list quietly rots into a permanent allowlist.
 */
const MANIFEST = join(ROOT, MANIFEST_REL);
const VALID_STATUS = new Set(["superseded", "unwired"]);

let retained = new Map();
if (existsSync(MANIFEST)) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch (err) {
    console.error(`✗ ${MANIFEST_REL} is not valid JSON (${err.message}).`);
    process.exit(1);
  }
  const rows = Array.isArray(parsed.retained) ? parsed.retained : [];
  const bad = [];
  for (const row of rows) {
    const p = String(row?.path || "");
    if (!/^lessons\/[\w.-]+\/reveal-assets\/[\w.-]+$/.test(p))
      bad.push(`  "${p}" — not an exact lessons/<id>/reveal-assets/<file> path`);
    else if (!VALID_STATUS.has(row.status))
      bad.push(`  ${p} — status must be one of ${[...VALID_STATUS].join(", ")}`);
    else if (!String(row.reason || "").trim())
      bad.push(`  ${p} — every retained asset needs a written reason`);
    else retained.set(p, row);
  }
  if (bad.length) {
    console.error(`✗ ${MANIFEST_REL} has ${bad.length} malformed entr(ies):`);
    for (const b of bad) console.error(b);
    process.exit(1);
  }
}

const lessonsDir = join(ROOT, "lessons");
const orphans = [];
const kept = [];
let scanned = 0;
let bytes = 0;

for (const id of readdirSync(lessonsDir).sort()) {
  const dir = join(lessonsDir, id, "reveal-assets");
  if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
  for (const file of readdirSync(dir).sort()) {
    if (file.startsWith(".")) continue;
    scanned += 1;
    const rel = `lessons/${id}/reveal-assets/${file}`;
    if (refs.has(`${id}/${file}`)) {
      // A recorded asset that came back into use: the record is now a lie.
      if (retained.has(rel)) orphans.push({ id, file, size: 0, stale: "referenced-again" });
      continue;
    }
    const size = statSync(join(dir, file)).size;
    if (retained.has(rel)) {
      kept.push({ rel, size, ...retained.get(rel) });
      continue;
    }
    orphans.push({ id, file, size });
    bytes += size;
  }
}

// A recorded asset that is no longer on disk: prune the record.
const vanished = [...retained.keys()].filter((p) => !existsSync(join(ROOT, p)));

// The reverse direction: a config naming an image that is not on disk.
const broken = [];
for (const key of refs) {
  const [id, file] = key.split("/");
  if (!existsSync(join(lessonsDir, id, "reveal-assets", file))) broken.push(key);
}

console.log(
  `\nreveal-assets — ${scanned} file(s) across every lesson, ${refs.size} distinct reference(s)`,
);

// Retained assets are reported every run, with their reason. They are accounted
// for, not hidden — a reader of this output should be able to see what is being
// kept and why without opening the manifest.
for (const k of kept) {
  console.log(`  RETAINED      ${k.rel}  (${(k.size / 1024).toFixed(0)} KB, ${k.status})`);
  console.log(`                ${k.reason}`);
}

if (!orphans.length && !broken.length && !vanished.length) {
  console.log(
    `✓ every reveal asset is referenced or recorded, and every reference resolves.` +
      (kept.length ? ` ${kept.length} recorded as retained.` : ""),
  );
  process.exit(0);
}

for (const { id, file, size, stale } of orphans) {
  if (stale === "referenced-again") {
    console.log(
      `  STALE RECORD  lessons/${id}/reveal-assets/${file} — listed in ${MANIFEST_REL} but back in use; drop the entry`,
    );
    continue;
  }
  console.log(
    `  UNREFERENCED  lessons/${id}/reveal-assets/${file}  (${(size / 1024).toFixed(0)} KB)`,
  );
}
for (const key of broken) {
  console.log(`  BROKEN REF    lessons/${key} — referenced but not on disk`);
}
for (const p of vanished) {
  console.log(`  STALE RECORD  ${p} — listed in ${MANIFEST_REL} but not on disk; drop the entry`);
}

const realOrphans = orphans.filter((o) => !o.stale);
const staleRecords = orphans.filter((o) => o.stale).length + vanished.length;
const summary = [
  realOrphans.length
    ? `${realOrphans.length} unaccounted file(s) holding ${(bytes / 1024 / 1024).toFixed(2)} MB`
    : null,
  broken.length ? `${broken.length} broken reference(s)` : null,
  staleRecords ? `${staleRecords} stale manifest record(s)` : null,
]
  .filter(Boolean)
  .join(", ");

if (WARN_ONLY) {
  console.log(`\n⚠️  ${summary} (--warn: reporting only)`);
  process.exit(0);
}

console.error(`\n✗ ${summary}.`);
if (realOrphans.length) {
  console.error("   Unreferenced files are copied into dist/ and served to students for nothing.");
  console.error(
    `   Wire it into the lesson that should show it, delete it, or — if it is being kept`,
  );
  console.error(`   on purpose — record it with a reason in ${MANIFEST_REL}.`);
}
if (staleRecords) {
  console.error(`   A record in ${MANIFEST_REL} no longer describes the tree. Prune it.`);
}
process.exit(1);

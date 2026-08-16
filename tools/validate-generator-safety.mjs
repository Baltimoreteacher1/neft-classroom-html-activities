#!/usr/bin/env node
/**
 * validate-generator-safety.mjs — a generator must not damage what it did not
 * mean to touch, and must not publish a route to a file that is not there.
 *
 * THE TWO FAILURES THIS EXISTS FOR, both observed:
 *
 * 1. AUTHORED LAYERS ERASED BY REGENERATION. Small-group configs are generated
 *    AND are the file two later steps write into — the Spanish overlay from
 *    data/es-translations, and `launch.conceptIntro.interactiveVisual`, a
 *    lesson's explicit statement of which tool it wants. The generator rebuilt
 *    each config from the base and wrote it whole, so both were erased.
 *    Reproduced on main: `--only 5-10` deleted 74 lines from 5-10-group1,
 *    taking ten Spanish arrays with them. The repo's answer had been a
 *    documented workaround ("a full run is destructive") plus one bespoke
 *    preserver for vocabulary; a workaround is a note asking humans to
 *    remember.
 *
 * 2. GENERATED ROUTES TO MISSING FILES. Every button on an editable-slides page
 *    is the .pptx — download it, or download it and upload it to Google Slides.
 *    The generator emitted a page for all 84 lessons; 20 have no slides.pptx,
 *    so a routine run published 20 launchers whose every button 404s.
 *
 * WHAT IS CHECKED HERE IS THE SOURCE, and this file says so plainly: these are
 * greps and file-existence checks. They prove the containment code is present
 * and that no generated route currently dangles. The BEHAVIOUR — that a scoped
 * run really does write only its scope, and that an overlay really does survive
 * — is proved by tools/generator-safety.test.mjs, which runs the generators
 * against fixtures and mutates them.
 *
 * Self-tests its detectors first: a gate that has stopped firing reports a
 * perfectly safe set of generators, which is what every gate said about both
 * failures above.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (m) => failures.push(m);

/* ── Detectors ─────────────────────────────────────────────────────────────── */

/** A script that accepts a scope flag must contain a containment assertion. */
export function scopedWithoutContainment(src) {
  const scoped = /"--only"|"--lesson"|"--single"/.test(src);
  if (!scoped) return false;
  // It writes lesson content (not merely reads it).
  const writesLessons = /writeLesson|writeGenerated\(|writeFileSync\(\s*join\(LESSONS/.test(src);
  if (!writesLessons) return false;
  return !/assertWriteSetContained/.test(src);
}

/**
 * A generator that regenerates a LESSON config wholesale must merge the
 * authored layer.
 *
 * Anchored to a lessons directory, not to the filename. `config.json` is also
 * the access-practice-lab inventory and the build stamp — files with no
 * authored layer and no lesson behind them — and matching on the name alone
 * reported both as unsafe.
 */
export function rewritesConfigWithoutOverlay(src) {
  const rewrites =
    /writeFileSync\(\s*join\(\s*LESSONS\s*,[^)]*"config\.json"\s*\)\s*,\s*JSON\.stringify/.test(
      src,
    );
  if (!rewrites) return false;
  return !/mergeAuthoredOverlay/.test(src);
}

/** Every href a generated page emits to a per-lesson artifact, as a template. */
export function lessonArtifactRefs(src) {
  const out = new Set();
  for (const m of src.matchAll(/\/lessons\/\$\{esc\(id\)\}\/([\w.-]+)/g)) out.add(m[1]);
  return [...out];
}

/* ── Self-test, before anything real is inspected ──────────────────────────── */

const SELF = [
  [
    "a scoped generator with no containment assertion is caught",
    () => scopedWithoutContainment('const ONLY = argv["--only"]; writeLesson(id, out);') === true,
  ],
  [
    "a scoped generator WITH the assertion passes",
    () =>
      scopedWithoutContainment(
        'const ONLY = argv["--only"]; writeLesson(id, out); assertWriteSetContained({});',
      ) === false,
  ],
  [
    "a config rewrite with no overlay merge is caught",
    () =>
      rewritesConfigWithoutOverlay(
        'writeFileSync(join(LESSONS, id, "config.json"), JSON.stringify(out, null, 2));',
      ) === true,
  ],
  [
    "a config rewrite that merges the authored layer passes",
    () =>
      rewritesConfigWithoutOverlay(
        'const m = mergeAuthoredOverlay(out, prior); writeFileSync(join(LESSONS, id, "config.json"), JSON.stringify(m, null, 2));',
      ) === false,
  ],
  [
    "a non-lesson config.json write is NOT reported — the build stamp has no authored layer",
    () =>
      rewritesConfigWithoutOverlay(
        'writeFileSync(join(dir, "config.json"), JSON.stringify(stamp, null, 2));',
      ) === false,
  ],
  [
    "per-lesson artifact references are found in a generated page template",
    () =>
      lessonArtifactRefs('<a href="/lessons/${esc(id)}/slides.pptx" download>').join() ===
      "slides.pptx",
  ],
];

for (const [name, fn] of SELF) {
  let ok = false;
  try {
    ok = fn() === true;
  } catch (err) {
    fail(`self-test threw: ${name} — ${err.message}`);
    continue;
  }
  if (!ok) fail(`self-test FAILED, the detector has stopped firing: ${name}`);
}

if (failures.length) {
  console.error("✗ validate:generator-safety");
  for (const m of failures) console.error(`   - ${m}`);
  process.exit(1);
}

/* ── Sweep ─────────────────────────────────────────────────────────────────── */

const sources = [
  ...readdirSync(join(ROOT, "scripts"))
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => join("scripts", f)),
  ...readdirSync(join(ROOT, "tools"))
    .filter((f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"))
    .map((f) => join("tools", f)),
];

let scopedGenerators = 0;
let overlayAware = 0;
for (const rel of sources) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  if (/"--only"|"--lesson"|"--single"/.test(src) && /writeLesson|writeGenerated\(/.test(src)) {
    scopedGenerators++;
  }
  if (scopedWithoutContainment(src)) {
    fail(
      `${rel}: accepts a scope flag and writes lesson content, but asserts nothing about its ` +
        `write set. A flag whose name implies containment while the code writes elsewhere is ` +
        `worse than no flag — it invites the targeted repair work it cannot safely do.`,
    );
  }
  if (rewritesConfigWithoutOverlay(src)) {
    fail(
      `${rel}: rewrites a lesson config wholesale without mergeAuthoredOverlay, so every layer ` +
        `applied to that file after generation (the Spanish overlay, an authored ` +
        `interactiveVisual) is erased on the next run.`,
    );
  }
  if (/mergeAuthoredOverlay/.test(src)) overlayAware++;
}

/* ── Generated routes must resolve ─────────────────────────────────────────── */

const LESSONS = join(ROOT, "lessons");
const pageGenerators = [["editable-slides.html", "scripts/generate-editable-slides-page.mjs"]];

let routesChecked = 0;
let dangling = 0;
for (const [page, gen] of pageGenerators) {
  const refs = lessonArtifactRefs(readFileSync(join(ROOT, gen), "utf8"));
  if (!refs.length) {
    fail(`${gen}: no per-lesson artifact references found — the reader has stopped matching`);
    continue;
  }
  for (const dir of readdirSync(LESSONS)) {
    const file = join(LESSONS, dir, page);
    if (!existsSync(file)) continue;
    const html = readFileSync(file, "utf8");
    for (const ref of refs) {
      if (!html.includes(`/lessons/${dir}/${ref}`)) continue;
      routesChecked++;
      const target = join(LESSONS, dir, ref);
      if (!existsSync(target) || statSync(target).size === 0) {
        dangling++;
        fail(`lessons/${dir}/${page} links /lessons/${dir}/${ref}, which does not exist on disk`);
      }
    }
  }
}

if (failures.length) {
  console.error("✗ validate:generator-safety");
  for (const m of failures) console.error(`   - ${m}`);
  process.exit(1);
}

console.log(
  `✓ generator safety holds — ${sources.length} generators scanned, ${scopedGenerators} accept a ` +
    `scope flag, ${overlayAware} preserve authored overlays, ${routesChecked} generated ` +
    `artifact route(s) resolve, ${dangling} dangling.`,
);
console.log(
  "   Source-level: these are greps and file-existence checks. Behaviour is proved by " +
    "tools/generator-safety.test.mjs, which runs the generators against fixtures.",
);

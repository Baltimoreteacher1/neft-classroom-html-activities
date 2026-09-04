#!/usr/bin/env node
/* =============================================================================
 * validate-lesson-catalogues.mjs — a lesson catalogue must name the lesson it links to.
 * -----------------------------------------------------------------------------
 * Wired into `npm run validate`.
 *
 * Three catalogues decide what the unit hub offers on each lesson row. The hub
 * (assets/curriculum-hub-search.js) reads the lesson id out of that row's own
 * `/lessons/<id>/` link and looks it up as `MAP[lessonId] || MAP[baseLessonId]`:
 *
 *   LESSON_BONUS_ACTIVITIES  curriculum/lesson-bonus-activities.js
 *   LESSON_PRINTABLES        assets/curriculum-hub-search.js (inline)
 *   LESSON_FAMILY_HOMEWORK   curriculum/lesson-family-homework.js
 *
 * WHY THIS GATE EXISTS. All three were built before the 2026-08-10 Reveal-TOC
 * renumber (data/toc-migration.json). Two of them were never rebuilt, so their
 * keys stayed on the OLD lesson numbers while the hub kept looking them up with
 * the new ones. Both number spaces are `\d+-\d+`, so nearly every lookup HIT —
 * and returned a different lesson's material. Measured in Chromium on
 * /curriculum/units/: of 174 rows offered a bonus activity, 147 linked to a
 * different lesson, and of 174 rows offered printables, 147 served a different
 * lesson's worksheet. Lesson 1-1 "Math is Mine" handed out lesson 6-13's Prime
 * Factorization worksheet. Every one of those links resolved HTTP 200, so no
 * link checker, no build, no render probe and no lint could see it.
 *
 * The invariant that catches this class needs no external crosswalk, which is
 * the point — a crosswalk is one more thing that can go stale:
 *
 *   1. KEY AGREEMENT — a catalogue key must equal the lesson its own entries
 *      link to. A key whose entries all point somewhere else is mislabelled,
 *      whatever the reason.
 *   2. DISK, BOTH DIRECTIONS — the key set must equal the set of lessons that
 *      have the underlying material on disk. A lesson with material and no key
 *      is material a student cannot reach; a key with no material is a dead
 *      offer. Each surface reports its own consequence.
 *   3. PARENTS AS WELL AS CHILDREN — the hub renders 252 rows, not 84: every
 *      core lesson also appears as `-group1` and `-group2`, which resolve
 *      through the parent fallback. So every variant directory on disk must
 *      have its parent present, and a catalogue must key the PARENT (a key on a
 *      variant id shadows the fallback for that one row and silently diverges
 *      the twins).
 *
 * Self-tests every detector against known-bad fixtures before sweeping, so a
 * detector that has stopped firing fails loudly instead of reporting a healthy
 * hub.
 * ============================================================================= */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

const CORE_RE = /^\d+-\d+$/;
const VARIANT_RE = /^(\d+-\d+)-(?:group[12]|flagship|catchup)$/;
// A BRIDGE lesson (`6-1-6-2-practice`) is lesson-shaped but is not a variant of
// anything: it is its own hand-authored lesson covering two numbered ones, off
// the numbered spine on purpose. It therefore keys the family catalogue
// directly — resolving it through a parent would hand a family the wrong
// night's practice — while the twins (group1/group2/flagship) keep the strict
// parent-only rule, because those ARE the same lesson at another level.
// A unit REVIEW (`1-review`) is the same kind of thing: hand-authored, off the
// numbered spine by id shape, covering several numbered lessons rather than
// being a variant of one. The shape is "digits, then a word saying what it is",
// which is what `generatesFamilyHomework` in scripts/lib/lesson-scope.mjs
// already accepts — this regex is a second copy of that question and must not
// answer it more narrowly, or the generator writes a hub key this gate then
// calls a phantom.
const BRIDGE_RE = /^\d+(?:-\d+)*-(?:practice|review)$/;

/* --- Detectors -------------------------------------------------------------- */

/**
 * Top-level lesson-id keys of an object literal, with the lesson each key's own
 * entries link to. Text-level on purpose: two of the three catalogues are
 * inline literals inside a larger script, and evaluating them would need a DOM.
 * @param {string} source  the file text
 * @param {string} anchor  the line that opens the literal, e.g. `var X = {`
 * @returns {{key: string, targets: string[]}[]}
 */
export function catalogueEntries(source, anchor) {
  const open = source.indexOf(anchor);
  if (open === -1) throw new Error(`anchor not found: ${anchor}`);
  const bodyStart = source.indexOf("\n", open) + 1;
  const indent = anchor.match(/^\s*/)[0];
  const closeIdx = source.indexOf(`\n${indent}};`, bodyStart);
  const body = source.slice(bodyStart, closeIdx === -1 ? source.length : closeIdx);
  const keyRe = new RegExp(`^${indent} {2}"([\\w-]+)":`, "gm");
  const hits = [...body.matchAll(keyRe)];
  return hits.map((h, i) => {
    const chunk = body.slice(h.index, i + 1 < hits.length ? hits[i + 1].index : body.length);
    const targets = [
      ...new Set([...chunk.matchAll(/["']\/lessons\/([\w-]+)\//g)].map((m) => m[1])),
    ];
    return { key: h[1], targets };
  });
}

/** Keys whose own entries all link to some OTHER lesson. */
export function mislabelledKeys(entries) {
  return entries
    .filter((e) => e.targets.length > 0 && !e.targets.includes(e.key))
    .map((e) => `${e.key} → ${e.targets.join("|")}`);
}

/** Keys that name a variant rather than the parent lesson the fallback expects. */
export function variantKeys(entries) {
  return entries.map((e) => e.key).filter((k) => VARIANT_RE.test(k));
}

/* --- Self-test -------------------------------------------------------------- */
const selfFails = [];
{
  const good = [
    "  var M = {",
    '    "5-1": [',
    '      { href: "/lessons/5-1/worksheet.html" },',
    '      { href: "/lessons/5-1/downloads/printables/9-3-activity.pdf" },',
    "    ],",
    '    "5-2": [{ href: "/lessons/5-2/worksheet.html" }],',
    "  };",
  ].join("\n");
  const stale = good.replace('"5-1": [', '"9-3": [');
  const variant = good.replace('"5-2":', '"5-1-group1":');

  const g = catalogueEntries(good, "  var M = {");
  if (g.length !== 2) selfFails.push(`entry reader found ${g.length} keys, expected 2`);
  if (mislabelledKeys(g).length)
    selfFails.push("a correctly-keyed catalogue was reported mislabelled");
  if (variantKeys(g).length)
    selfFails.push("a parent-keyed catalogue was reported as variant-keyed");

  const s = catalogueEntries(stale, "  var M = {");
  if (!mislabelledKeys(s).some((m) => m.startsWith("9-3 →")))
    selfFails.push("the renumber detector did not fire on a key linking to another lesson");

  const v = catalogueEntries(variant, "  var M = {");
  if (!variantKeys(v).includes("5-1-group1"))
    selfFails.push("the variant-key detector did not fire");

  // A bridge lesson is not a twin: it must never be read as a variant key, and
  // widening for it must not widen for a group twin.
  if (VARIANT_RE.test("6-1-6-2-practice"))
    selfFails.push("a bridge lesson was read as a variant of another lesson");
  if (!BRIDGE_RE.test("6-1-6-2-practice"))
    selfFails.push("the bridge-lesson detector did not recognise 6-1-6-2-practice");
  if (BRIDGE_RE.test("6-1-group1") || BRIDGE_RE.test("6-1") || BRIDGE_RE.test("6-2-catchup"))
    selfFails.push("the bridge-lesson detector matched a lesson that is not a bridge");

  // A key with no /lessons/ link at all is not evidence of mislabelling.
  const linkless = '  var M = {\n    "5-1": [{ href: "/math/games/u5-area-attack/" }],\n  };';
  if (mislabelledKeys(catalogueEntries(linkless, "  var M = {")).length)
    selfFails.push("an entry with no lesson link was reported mislabelled");
}
if (selfFails.length) {
  console.error("validate-lesson-catalogues self-test FAILED:");
  for (const f of selfFails) console.error(`  ✗ ${f}`);
  process.exit(1);
}

/* --- Disk truth ------------------------------------------------------------- */
const dirs = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const core = dirs.filter((d) => CORE_RE.test(d)).sort();
const variants = dirs.map((d) => d.match(VARIANT_RE)).filter(Boolean);
const bridges = dirs.filter((d) => BRIDGE_RE.test(d)).sort();

const findings = [];

if (core.length === 0) {
  console.error("validate-lesson-catalogues FAILED: found zero lesson directories");
  process.exit(1);
}

// (3) Parents as well as children.
for (const v of variants) {
  if (!core.includes(v[1])) {
    findings.push(
      `lessons/${v[0]} is a variant of lesson ${v[1]}, which does not exist — the hub resolves a variant row's activities through its parent, so this row can only ever be empty`,
    );
  }
}

const lessonsWith = (predicate) => core.filter(predicate);

const optionalActivity = (id) => {
  const cfg = join(LESSONS, id, "config.json");
  if (!existsSync(cfg)) return false;
  try {
    return Boolean(JSON.parse(readFileSync(cfg, "utf8")).practice?.optionalActivity?.name);
  } catch {
    return false;
  }
};
const hasPrintables = (id) => {
  const dir = join(LESSONS, id, "downloads", "printables");
  return existsSync(dir) && readdirSync(dir).length > 0;
};
const hasHomework = (id) => existsSync(join(LESSONS, id, "homework.html"));

/* --- The three catalogues --------------------------------------------------- */
const SURFACES = [
  {
    label: "the hub bonus-activity catalogue",
    file: "curriculum/lesson-bonus-activities.js",
    anchor: "window.LESSON_BONUS_ACTIVITIES = {",
    truth: () => lessonsWith(optionalActivity),
    truthName: "lessons whose config.json declares practice.optionalActivity",
    missing: "a student is offered no bonus activity on a lesson that has one",
    phantom: "the hub offers a bonus activity for a lesson with none",
    remedy: "npm run generate-lesson-bonus-map",
  },
  {
    label: "the hub printables catalogue",
    file: "assets/curriculum-hub-search.js",
    anchor: "  var LESSON_PRINTABLES = {",
    truth: () => lessonsWith(hasPrintables),
    truthName: "lessons with a non-empty downloads/printables/ folder",
    missing: "a student cannot reach the worksheet and printables that exist for that lesson",
    phantom: "the hub offers printables that are not on disk for that lesson",
    remedy: "re-key LESSON_PRINTABLES to the lesson folder its own hrefs point at",
  },
  {
    label: "the hub MSTAR-worksheet catalogue",
    file: "curriculum/lesson-mstar-worksheets.js",
    anchor: "window.LESSON_MSTAR_WORKSHEETS = {",
    // A worksheet on disk is the evidence in both directions, same contract as
    // the family-homework map: the map generator reads the filesystem, so a
    // drift here means someone hand-edited the map or deleted a worksheet.
    truth: () => lessonsWith((id) => existsSync(join(LESSONS, id, "mstar-worksheet.html"))),
    truthName: "lessons with an mstar-worksheet.html",
    missing: "a student is offered no MSTAR practice worksheet on a lesson that has one",
    phantom: "the hub links an MSTAR worksheet that is not on disk",
    remedy: "npm run generate-lesson-mstar-worksheet-map",
  },
  {
    label: "the hub family-homework catalogue",
    file: "curriculum/lesson-family-homework.js",
    anchor: "window.LESSON_FAMILY_HOMEWORK = {",
    // Core lessons plus any bridge lesson that opted in. A page on disk is the
    // evidence in both directions, so this cannot drift from the generator.
    truth: () => [...lessonsWith(hasHomework), ...bridges.filter(hasHomework)],
    truthName: "lessons with a homework.html",
    missing: "a family is offered no take-home practice for that lesson",
    phantom: "the hub links family homework that does not exist",
    remedy: "npm run generate-lesson-family-homework-map",
  },
];

let keysChecked = 0;
for (const s of SURFACES) {
  const path = join(ROOT, s.file);
  if (!existsSync(path)) {
    findings.push(`${s.label} is missing its file ${s.file}`);
    continue;
  }
  let entries;
  try {
    entries = catalogueEntries(readFileSync(path, "utf8"), s.anchor);
  } catch (err) {
    findings.push(`${s.label} could not be read from ${s.file}: ${err.message}`);
    continue;
  }
  if (entries.length === 0) {
    findings.push(`${s.label} in ${s.file} is empty — every lesson row loses it`);
    continue;
  }
  keysChecked += entries.length;

  // (1) Key agreement.
  const wrong = mislabelledKeys(entries);
  if (wrong.length) {
    findings.push(
      `${s.label} (${s.file}) has ${wrong.length} key(s) labelled with one lesson and linking to another, so ${s.missing.replace(/^a /, "a ")} and the wrong lesson's material is served instead — this is what a renumber leaves behind: ${wrong.slice(0, 8).join(", ")}${wrong.length > 8 ? ", …" : ""}. Fix: ${s.remedy}`,
    );
  }

  // (3) Parent keys only.
  const vk = variantKeys(entries);
  if (vk.length) {
    findings.push(
      `${s.label} (${s.file}) keys ${vk.length} VARIANT id(s) (${vk.slice(0, 5).join(", ")}) — the hub resolves a variant row as MAP[variant] || MAP[parent], so a variant key silently diverges the twins from their parent lesson`,
    );
  }

  // (2) Disk, both directions.
  const keys = new Set(entries.map((e) => e.key));
  const truth = s.truth();
  const absent = truth.filter((id) => !keys.has(id));
  if (absent.length) {
    findings.push(
      `${s.label} (${s.file}) omits ${absent.length} of ${truth.length} ${s.truthName}, so ${s.missing}: ${absent.slice(0, 12).join(" ")}${absent.length > 12 ? " …" : ""}. Fix: ${s.remedy}`,
    );
  }
  const ghosts = [...keys].filter((k) => !truth.includes(k));
  if (ghosts.length) {
    findings.push(
      `${s.label} (${s.file}) keys ${ghosts.length} lesson(s) that are not ${s.truthName}, so ${s.phantom}: ${ghosts.slice(0, 12).join(" ")}${ghosts.length > 12 ? " …" : ""}. Fix: ${s.remedy}`,
    );
  }
}

if (findings.length) {
  console.error(`validate-lesson-catalogues FAILED (${findings.length}):`);
  for (const f of findings) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(
  `✓ lesson-catalogues: ${SURFACES.length} hub catalogues, ${keysChecked} keys — each names the lesson it links to, matches disk in both directions, and keys parents only (${core.length} lessons, ${variants.length} variants, ${bridges.length} bridge).`,
);

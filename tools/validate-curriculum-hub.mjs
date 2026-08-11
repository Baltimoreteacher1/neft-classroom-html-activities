#!/usr/bin/env node
/**
 * Curriculum Hub lock — guards the hand-maintained curriculum/index.html against
 * the recurring "clobber" incidents (a generator or a bad deploy replacing the
 * hub with a stub / a different app / a stripped baseline).
 *
 * It asserts several INDEPENDENT semantic invariants. A clobbered or stripped
 * hub will fail at least one, so this can't be fooled by a single missing piece.
 * Wired into `npm run validate`, so the pre-push QA loop blocks any push that
 * would ship a broken hub.
 *
 * If you intentionally change the hub in a way that trips an invariant (e.g.,
 * remove the mailbox card), update the matching threshold/landmark below.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HUB = resolve(ROOT, "curriculum/index.html");
/* The units-and-lessons browser moved to its own page so the hub could stop
   being 6,000 lines of unit markup. The clobber invariants moved with it — a
   stripped units page is the same incident this gate was built for, and the hub
   keeps its own landmarks below. Both files are checked on every run. */
const UNITS_PAGE = resolve(ROOT, "curriculum/units/index.html");
const HEADERS = resolve(ROOT, "_headers");

const MIN_BYTES = 100000; // hub is ~170KB after the units split; a stub is far smaller
const MIN_UNITS_PAGE_BYTES = 250000; // units page is ~330KB
const MIN_UNITS = 10; // all 10 math units must be present, on the units page
const MIN_LESSON_LINKS = 200; // ~925 today; a floor well clear of real edits

const failures = [];
function check(ok, msg) {
  if (!ok) failures.push(msg);
}

if (!existsSync(HUB)) {
  console.error("✗ curriculum hub missing: curriculum/index.html");
  process.exit(1);
}

if (!existsSync(UNITS_PAGE)) {
  console.error("✗ units browser missing: curriculum/units/index.html");
  process.exit(1);
}

const html = readFileSync(HUB, "utf8");
const unitsHtml = readFileSync(UNITS_PAGE, "utf8");
const headers = readFileSync(HEADERS, "utf8");
const bytes = statSync(HUB).size;
const unitsBytes = statSync(UNITS_PAGE).size;

// The hub's behaviour is no longer entirely inline. Its three biggest inline
// <script> blocks were extracted to /assets/curriculum-hub-*.js (and the base
// stylesheet to curriculum-hub.css) so they can be linted, cached and tested;
// they are still part of the same shipped page. Behavioural landmarks below
// are therefore matched against hub HTML + those assets, while *structural*
// landmarks (cards, links, units) stay matched against the HTML alone.
//
// Each asset must exist AND be referenced by the hub — otherwise "the code is
// somewhere" would satisfy this gate even if the page stopped loading it.
const HUB_ASSETS = [
  "curriculum-hub.css",
  "curriculum-hub-pacing.js",
  "curriculum-hub-options.js",
  "curriculum-hub-search.js",
];
let assetSource = "";
for (const name of HUB_ASSETS) {
  const path = resolve(ROOT, "assets", name);
  if (!existsSync(path)) {
    failures.push(`missing extracted hub asset assets/${name}`);
    continue;
  }
  if (!new RegExp(`/assets/${name.replace(/[.]/g, "\\.")}\\?v=`).test(html)) {
    failures.push(`hub does not load /assets/${name} (extracted asset orphaned)`);
  }
  assetSource += readFileSync(path, "utf8");
}
/** Hub HTML plus the code it loads from its own extracted assets. */
const behaviour = html + assetSource;
const units = (unitsHtml.match(/class="unit"/g) || []).length;
const lessonLinks = (unitsHtml.match(/\/lessons\//g) || []).length;

check(bytes >= MIN_BYTES, `hub too small: ${bytes} bytes (< ${MIN_BYTES}) — possible clobber/stub`);
check(/Curriculum Hub/.test(html), 'missing the "Curriculum Hub" title');
check(
  unitsBytes >= MIN_UNITS_PAGE_BYTES,
  `units page too small: ${unitsBytes} bytes (< ${MIN_UNITS_PAGE_BYTES}) — possible clobber/stub`,
);
check(units >= MIN_UNITS, `only ${units} unit sections on the units page (expected >= ${MIN_UNITS})`);
check(
  /href="\/curriculum\/units\/"/.test(html),
  "the hub no longer links to the units browser at /curriculum/units/",
);
check(
  lessonLinks >= MIN_LESSON_LINKS,
  `only ${lessonLinks} /lessons/ links (expected >= ${MIN_LESSON_LINKS})`,
);
check(/id="curr-search"/.test(html), "missing the lesson search control (#curr-search)");
check(/mailbox-feature/.test(html), "missing the Student Digital Mailbox featured card");
check(
  /id="family-connections-feature-title"/.test(html),
  "missing the Family Connections featured card",
);
check(
  /href="\/curriculum\/family-connections\/"/.test(html) &&
    /href="\/curriculum\/family-connections\/teacher\/"/.test(html),
  "missing public Family Mode or protected Teacher Mode link",
);
check(
  /id="arcade-feature-title"/.test(html) && /href="\/curriculum\/arcade\/"/.test(html),
  "missing the Arcade Games featured card or /curriculum/arcade/ link",
);
check(
  /id="projects-feature-title"/.test(html) && /href="\/curriculum\/projects\/"/.test(html),
  "missing the Culminating Projects featured card or /curriculum/projects/ link",
);

// Review-game link integrity — locks the 2026-06-29 regression where the
// End-of-Unit entry (lessonId "") produced /practice-arcade/?lesson= (empty),
// which silently fell back to lesson 1-1 for every unit. Two invariants:
//   1. No practice-arcade link is built with a HARD-CODED empty query param
//      (?lesson="/?unit=" closed immediately, not concatenated with a value).
//   2. The End-of-Unit branch that builds the ?unit=N cumulative-review link
//      still exists (so the fix can't be dropped without tripping this).
const emptyArcadeParam = /practice-arcade\/\?(?:lesson|unit)="(?!\s*\+)/.test(behaviour);
check(
  !emptyArcadeParam,
  "a practice-arcade link has an empty/hard-coded query param " +
    '(?lesson="/?unit=" not concatenated with a value) — the empty-?lesson= bug class',
);
check(
  /practice-arcade\/\?unit="\s*\+/.test(behaviour),
  "missing the End-of-Unit ?unit=N review-game link construction",
);

// Canvas (SCORM) download layer — every unit, lesson, and activity gets a
// one-click /api/scorm download, generated at RENDER time so new lessons /
// units / activities pick it up automatically with no per-file step. These
// invariants stop a rewrite from silently dropping that layer.
check(/function\s+makeScormLink/.test(behaviour), "missing the makeScormLink helper (SCORM layer)");
check(
  /window\.NeftScorm\s*=/.test(behaviour),
  "missing window.NeftScorm (shared SCORM helpers for the enhancement layers)",
);
check(
  /scorm-lesson-btn/.test(behaviour),
  "missing the per-lesson Canvas (SCORM) download button (scorm-lesson-btn)",
);
check(/\/api\/scorm\?activity=/.test(behaviour), "missing /api/scorm download link construction");
// The hub HTML must be re-checked with the server on every load so new lesson
// ordering appears immediately. `no-cache` and `no-store` both guarantee that;
// what must never appear is a positive max-age, which would let a browser show
// a stale hub without asking. This gate previously demanded `no-store`
// specifically, which pinned a real cost: no-store forbids storing the response
// at all, so the 580 KB hub could never be answered with a 304 and re-downloaded
// in full on every visit. See the header block in _headers.
const curriculumRule = /(?:^|\n)\/curriculum\/[^\S\n]*\n[^\S\n]+Cache-Control:[^\n]*/i.exec(
  headers,
);
check(
  curriculumRule !== null &&
    /\bno-(cache|store)\b/i.test(curriculumRule[0]) &&
    !/\bmax-age=[1-9]/i.test(curriculumRule[0]),
  "curriculum HTML must use a revalidate-always Cache-Control (no-cache or no-store, no positive max-age) so new lesson ordering appears immediately",
);

if (failures.length) {
  console.error("✗ Curriculum Hub lock FAILED — the hub looks clobbered/stripped:");
  failures.forEach((f) => console.error("   • " + f));
  console.error(
    "\nIf this change is intentional, update tools/validate-curriculum-hub.mjs.\n" +
      "Otherwise restore the hub (good baseline: tag stable-baseline-2026-06-04).",
  );
  process.exit(1);
}

console.log(
  `✓ Curriculum Hub lock passed (${bytes} bytes · ${units} units · ${lessonLinks} lesson links).`,
);

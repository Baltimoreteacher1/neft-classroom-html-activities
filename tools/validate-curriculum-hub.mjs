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
const HEADERS = resolve(ROOT, "_headers");

const MIN_BYTES = 150000; // hub is ~286KB; a clobber/stub is far smaller
const MIN_UNITS = 10; // all 10 math units must be present
const MIN_LESSON_LINKS = 200; // ~925 today; a floor well clear of real edits

const failures = [];
function check(ok, msg) {
  if (!ok) failures.push(msg);
}

if (!existsSync(HUB)) {
  console.error("✗ curriculum hub missing: curriculum/index.html");
  process.exit(1);
}

const html = readFileSync(HUB, "utf8");
const headers = readFileSync(HEADERS, "utf8");
const bytes = statSync(HUB).size;
const units = (html.match(/class="unit"/g) || []).length;
const lessonLinks = (html.match(/\/lessons\//g) || []).length;

check(bytes >= MIN_BYTES, `hub too small: ${bytes} bytes (< ${MIN_BYTES}) — possible clobber/stub`);
check(/Curriculum Hub/.test(html), 'missing the "Curriculum Hub" title');
check(units >= MIN_UNITS, `only ${units} unit sections (expected >= ${MIN_UNITS})`);
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
const emptyArcadeParam = /practice-arcade\/\?(?:lesson|unit)="(?!\s*\+)/.test(html);
check(
  !emptyArcadeParam,
  "a practice-arcade link has an empty/hard-coded query param " +
    '(?lesson="/?unit=" not concatenated with a value) — the empty-?lesson= bug class',
);
check(
  /practice-arcade\/\?unit="\s*\+/.test(html),
  "missing the End-of-Unit ?unit=N review-game link construction",
);

// Canvas (SCORM) download layer — every unit, lesson, and activity gets a
// one-click /api/scorm download, generated at RENDER time so new lessons /
// units / activities pick it up automatically with no per-file step. These
// invariants stop a rewrite from silently dropping that layer.
check(/function\s+makeScormLink/.test(html), "missing the makeScormLink helper (SCORM layer)");
check(
  /window\.NeftScorm\s*=/.test(html),
  "missing window.NeftScorm (shared SCORM helpers for the enhancement layers)",
);
check(
  /scorm-lesson-btn/.test(html),
  "missing the per-lesson Canvas (SCORM) download button (scorm-lesson-btn)",
);
check(/\/api\/scorm\?activity=/.test(html), "missing /api/scorm download link construction");
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

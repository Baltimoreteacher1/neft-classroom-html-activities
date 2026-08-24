#!/usr/bin/env node
/**
 * validate-pathway-counts.mjs — the word "pathway" must mean one thing.
 *
 * THE CONFUSION THIS ENDS. Two user-visible numbers disagreed:
 *
 *   the hub footer  "84 lessons · 214 pathways (168 small-group / 36 catch-up /
 *                    10 unit projects)"
 *   the manifest     lessonCount 84, smallGroupCount 168, catchUpCount 36,
 *                    endOfUnitCount 10  →  288 lesson-shaped routes
 *
 * Neither was wrong. They count different SETS: the hub's "pathways" are the
 * routes BEYOND the 84 core lessons (which it counts separately, one line
 * earlier), and it folds in the 10 unit projects; the manifest's lesson-shaped
 * total is core + small-group + catch-up and holds projects apart. 214 and 288
 * are both correct and neither is a superset of the other — 214 includes 10
 * projects that 288 excludes, and 288 includes 84 core lessons that 214
 * excludes. A third meaning then appeared in validate:notebook-checkpoints.
 *
 * Three definitions of one word, all shown to humans, none written down. So the
 * fix is not to pick a number: it is to pin each one to the SAME generated
 * source and fail when any of them drifts.
 *
 *   HUB TOTAL       = smallGroup + catchUp + endOfUnit          (214)
 *   LESSON ROUTES   = lessons + smallGroup + catchUp            (288)
 *   EVERY ROUTE     = lessons + smallGroup + catchUp + endOfUnit (298)
 *
 * data/curriculum-launch-manifest.json is generated, so it is the arbiter; the
 * hub's prose is checked against it rather than the other way round.
 */
import { readFileSync } from "node:fs";
import { MANIFEST_PATH as MANIFEST, pathwayCounts } from "./lib/pathway-counts.mjs";

const PAGES = ["curriculum/index.html", "curriculum/units/index.html"];

let failures = 0;
function check(ok, msg) {
  if (!ok) {
    failures++;
    console.error(`  FAIL  ${msg}`);
  }
}

const counts = pathwayCounts();
for (const [k, v] of Object.entries(counts)) {
  check(Number.isInteger(v) && v > 0, `${MANIFEST} has no usable ${k} count (${v})`);
}

const { HUB_TOTAL, LESSON_ROUTES, EVERY_ROUTE } = counts;

// The hub footer states the breakdown, so it can be checked component by
// component rather than on the total alone — a total can be right while its
// parts are wrong, and the parts are what a teacher reads.
const FOOTER =
  /(\d+) units · (\d+) lessons · (\d+) pathways \((\d+) small-group \/ (\d+)\s*catch-up \/ (\d+) unit projects\)/;

let sawFooter = false;
for (const page of PAGES) {
  const html = readFileSync(page, "utf8");
  const f = html.match(FOOTER);
  if (f) {
    sawFooter = true;
    const [, , lessons, pathways, sg, cu, proj] = f.map(Number);
    check(
      lessons === counts.lessons,
      `${page}: footer says ${lessons} lessons, manifest says ${counts.lessons}`,
    );
    check(
      sg === counts.smallGroup,
      `${page}: footer says ${sg} small-group, manifest says ${counts.smallGroup}`,
    );
    check(
      cu === counts.catchUp,
      `${page}: footer says ${cu} catch-up, manifest says ${counts.catchUp}`,
    );
    check(
      proj === counts.endOfUnit,
      `${page}: footer says ${proj} unit projects, manifest says ${counts.endOfUnit}`,
    );
    check(
      pathways === HUB_TOTAL,
      `${page}: footer totals ${pathways} pathways, but its own parts sum to ${HUB_TOTAL}`,
    );
    check(
      pathways === sg + cu + proj,
      `${page}: footer's ${pathways} does not equal its stated parts (${sg} + ${cu} + ${proj})`,
    );
  }
  // Every page that prints the number in prose must print the SAME number.
  for (const stated of [...html.matchAll(/(\d+) lessons · (\d+) pathways/g)]) {
    check(
      Number(stated[1]) === counts.lessons && Number(stated[2]) === HUB_TOTAL,
      `${page}: "${stated[0]}" disagrees with the manifest (${counts.lessons} lessons, ${HUB_TOTAL} pathways)`,
    );
  }
}
check(sawFooter, "neither hub page carries the pathway footer any more — the count went silent");

// The notebook gate quotes LESSON_ROUTES as its denominator. Pin the two
// together so a manifest change cannot leave one surface saying 288 and another
// saying something else.
const notebookSrc = readFileSync("tools/validate-notebook-checkpoints.mjs", "utf8");
check(
  /pathway-counts\.mjs/.test(notebookSrc),
  "validate-notebook-checkpoints.mjs no longer derives its denominator from this module — it will drift",
);

console.log(
  `pathway counts — hub total ${HUB_TOTAL} (small-group ${counts.smallGroup} + catch-up ${counts.catchUp} + projects ${counts.endOfUnit}) | ` +
    `lesson routes ${LESSON_ROUTES} (core ${counts.lessons} + small-group + catch-up) | every route ${EVERY_ROUTE}`,
);
if (failures) {
  console.error(`FAIL validate:pathway-counts — ${failures} problem(s)`);
  process.exit(1);
}
console.log("PASS validate:pathway-counts");

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
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
check(
  units >= MIN_UNITS,
  `only ${units} unit sections on the units page (expected >= ${MIN_UNITS})`,
);
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

// --- published counts must match the curriculum, not a memory of it ---------
// The hub advertised "74 lessons · 158 pathways (128 small-group / 20 catch-up)"
// while the manifest held 84 / 214 / 168 / 36 — understating the curriculum by a
// third, in five places across two files, for long enough that nobody noticed.
// Nothing broke, so nothing surfaced: it is copy, and copy has no runtime.
// Derived from data/curriculum-launch-manifest.json so the numbers cannot drift
// from the thing they describe.
{
  const lm = JSON.parse(
    readFileSync(resolve(ROOT, "data/curriculum-launch-manifest.json"), "utf8"),
  );
  const truth = {
    lessons: (lm.lessons || []).length,
    smallGroup: (lm.smallGroups || []).length,
    catchUp: (lm.catchUps || []).length,
    projects: (lm.endOfUnit || []).length,
  };
  truth.pathways = truth.smallGroup + truth.catchUp + truth.projects;

  for (const file of ["curriculum/index.html", "curriculum/units/index.html"]) {
    const src = readFileSync(resolve(ROOT, file), "utf8");
    // Anchored to the SITE-WIDE summary only ("10 units · N lessons · N
    // pathways"). A bare /(\d+) lessons/ also matches the per-unit counts on
    // the units page ("6 lessons", "12 lessons"), which are legitimate and
    // different numbers — a gate that fires on those is a gate that gets
    // disabled, and then it protects nothing.
    for (const m of src.matchAll(/10 units[·,\s]+(\d+) lessons(?:[·,\s]+(\d+) pathways)?/gi)) {
      check(
        Number(m[1]) === truth.lessons,
        `${file} publishes "10 units · ${m[1]} lessons" but the curriculum has ${truth.lessons}`,
      );
      if (m[2])
        check(
          Number(m[2]) === truth.pathways,
          `${file} publishes "${m[2]} pathways" but the curriculum has ${truth.pathways}`,
        );
    }
    for (const m of src.matchAll(/\((\d+) small-group\s*\/\s*(\d+)\s*catch-up/gi)) {
      check(
        Number(m[1]) === truth.smallGroup,
        `${file} publishes "${m[1]} small-group" but the curriculum has ${truth.smallGroup}`,
      );
      check(
        Number(m[2]) === truth.catchUp,
        `${file} publishes "${m[2]} catch-up" but the curriculum has ${truth.catchUp}`,
      );
    }
  }
}

// --- project catalogues must match disk, and their copy must match both -----
// The portfolio kept its OWN list of project pages and silently discarded
// completions for three of them: a student who finished Deep Space Number Sense
// Expedition had the record written and the counter never moved. Same root
// cause as the SCORM orphans, different consumer — which is why this rule lives
// beside that one rather than inside it.
{
  const projectDirs = [];
  const projectSets = [];
  for (const unit of readdirSync(resolve(ROOT, "math"))) {
    const base = `math/${unit}/projects`;
    if (!existsSync(resolve(ROOT, base))) continue;
    // PARENT as well as children. The SCORM orphan gate checked only the
    // variant subdirectories and missed the pre-unit hub for exactly this
    // reason; a set with an index.html is itself a page.
    if (existsSync(resolve(ROOT, base, "index.html"))) projectSets.push(base);
    for (const entry of readdirSync(resolve(ROOT, base))) {
      if (entry === "answer-key") continue; // teacher-only, never catalogued
      if (existsSync(resolve(ROOT, base, entry, "index.html")))
        projectDirs.push(`/${base}/${entry}/`);
    }
  }

  const portfolio = readFileSync(resolve(ROOT, "math/projects/portfolio/index.html"), "utf8");
  const listed = new Set(
    [...portfolio.matchAll(/\/math\/[a-z0-9-]+\/projects\/[a-z0-9-]+\//g)].map((m) => m[0]),
  );
  const missing = projectDirs.filter((d) => !listed.has(d));
  check(
    missing.length === 0,
    `the project portfolio does not list ${missing.length} project page(s) that exist on disk, so a student finishing one gets no credit: ${missing.join(", ")}`,
  );
  const ghost = [...listed].filter((l) => !projectDirs.includes(l));
  check(ghost.length === 0, `the project portfolio lists page(s) not on disk: ${ghost.join(", ")}`);

  // EVERY project page must have a working completion path. Three pages
  // (unit-1/version-c, unit-10/version-c, unit-10/world-architect) were built
  // on a template that omits projects-publisher.js, so buildReport was
  // undefined, there was no report container, and no trigger the completion
  // layer recognised — a student finished and the tracker recorded nothing,
  // while the portfolio counted the page in its denominator. They read as
  // permanently unfinished.
  //
  // PARENTS AS WELL AS CHILDREN: the set below is derived from disk and
  // includes the projects hub index.html beside each set, which is how the
  // pre-unit hub was missed by an earlier gate.
  // Scoped to project VARIANT pages. The set hubs (math/<unit>/projects/) are
  // navigation — a student does not finish a landing page — so requiring the
  // completion layer there is a false positive, and a gate that fires wrongly
  // once gets ignored forever. Hubs are not unwatched: the catalogue rule above
  // still requires each to exist and be listed, which is the parent-level check
  // that matters for them.
  for (const rel of projectDirs.map((d) => `${d.replace(/^\/|\/$/g, "")}/index.html`)) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, "utf8");
    check(
      /projects-complete\.js/.test(src),
      `${rel} has no completion layer, so finishing it records nothing`,
    );
  }
  // And the layer itself must still provide a path that does not depend on
  // button text: a state trigger plus a guaranteed affordance.
  {
    const layer = readFileSync(resolve(ROOT, "shared/projects/projects-complete.js"), "utf8");
    check(
      /function observeReportGeneration/.test(layer),
      "the state-based completion trigger is gone",
    );
    check(
      /recordCompletion\("report-state"\)/.test(layer),
      "the report-state trigger no longer records",
    );
    check(
      /function ensureFinishAffordance/.test(layer),
      "the guaranteed finish affordance is gone",
    );
    check(
      /var host = document\.body;/.test(layer),
      "the finish affordance no longer hosts on body — it rendered inside a display:none screen once",
    );
  }

  // Published copy on both files must match the same derived truth.
  for (const file of ["math/projects/portfolio/index.html", "curriculum/projects/index.html"]) {
    const src = readFileSync(resolve(ROOT, file), "utf8");
    // "Grade 6 project sets" must not read its count from the GRADE. An
    // earlier version did exactly that and reported "6 project sets" as a
    // violation — a false positive is how a gate gets disabled.
    for (const m of src.matchAll(/(\d+)\s+(?:Grade\s+\d+\s+)?(?:math\s+)?project sets/gi)) {
      check(
        Number(m[1]) === projectSets.length,
        `${file} publishes "${m[1]} project sets" but ${projectSets.length} exist on disk`,
      );
    }
    for (const m of src.matchAll(/(\d+)\s+(?:flagship )?project(?:s| pages)/gi)) {
      check(
        Number(m[1]) === projectDirs.length,
        `${file} publishes "${m[1]} projects" but ${projectDirs.length} project pages exist on disk`,
      );
    }
  }
}

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

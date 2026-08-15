#!/usr/bin/env node
/* =============================================================================
 * validate-teacher-reachability.mjs — nothing gets orphaned by a navigation change
 * -----------------------------------------------------------------------------
 * /curriculum/ was reorganised around three pathways (Lessons, Planner, Student
 * Supports) with everything else one level deeper. The risk of that kind of
 * change is not that it looks wrong — it is that a tool quietly stops being
 * linked from anywhere and survives only as a URL somebody has to remember.
 *
 * The invariant is REACHABILITY, not VISIBILITY:
 *
 *     every teacher destination that existed is still linked from the hub
 *
 * NOT "every teacher feature is still on the front page", which is the thing
 * the redesign deliberately stopped doing. A destination inside the More
 * drawer passes; a destination linked from nowhere fails.
 *
 * data/teacher-destinations.json is the captured baseline — the 42 teacher
 * destinations the hub linked to before the redesign. Adding a destination is
 * an edit to that file; losing one is a failed build.
 *
 * Source-text based on purpose: this runs in the pre-push gate where no browser
 * is guaranteed, and the links it checks are authored in the HTML or emitted by
 * a named script, both of which are greppable. The browser-level check that the
 * three pathways actually RENDER lives in the hub's own QA.
 * ========================================================================== */

import { existsSync, readFileSync } from "node:fs";

const HUB = "curriculum/index.html";
/* Scripts the hub loads that emit teacher links at runtime. A destination that
 * only appears in one of these is still reachable — it is built into the page
 * every time the hub renders. */
const EMITTERS = [
  "assets/curriculum-teacher-planning.js",
  "assets/curriculum-teacher-workflow.js",
  "assets/curriculum-district-pacing.js",
  "assets/curriculum-enhancements.js",
];

const baseline = JSON.parse(readFileSync("data/teacher-destinations.json", "utf8"));
const haystack = [HUB, ...EMITTERS]
  .filter((f) => existsSync(f))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

const failures = [];

/* 1. Every baseline destination is still linked from the hub or its emitters.
 *
 * A #fragment is a position WITHIN a page, not a destination of its own, and
 * some are assembled at runtime from a base plus a hash (gradebook-embed.js
 * builds "#codes" and "#grades" that way), so the literal string never appears
 * in any source file. Reachability is therefore checked against the page: if
 * /teacher-tools/gradebook/ is linked, its sections are reachable. */
const pageOf = (href) => href.split("#")[0];
const orphaned = baseline.filter(
  (href) => !haystack.includes(href) && !haystack.includes(pageOf(href)),
);
if (orphaned.length) {
  failures.push(
    `${orphaned.length} teacher destination(s) are no longer linked from the hub — they now require knowing the URL:\n` +
      orphaned.map((h) => `    ${h}`).join("\n"),
  );
}

/* 2. Every destination still resolves to something on disk. A link kept in the
 * markup while its page is deleted is orphaning with extra steps. Query strings
 * and fragments address a page that must exist; the rest is that page's job. */
for (const href of baseline) {
  const path = href.split(/[?#]/)[0].replace(/^\//, "").replace(/\/$/, "");
  if (!path) continue;
  const candidates = [`${path}/index.html`, path, `${path}.html`];
  if (!candidates.some((c) => existsSync(c))) {
    failures.push(`dead destination: ${href} resolves to nothing on disk`);
  }
}

/* 3. The three pathways must be wired IN THE WORKSPACE — checked against the
 * workspace builder specifically, not against the whole page.
 *
 * Checking the page was too weak to be worth having: the scaffolder also left a
 * hub card for /curriculum/student-supports/, so pointing the workspace's
 * Supports button somewhere else still passed a page-wide search. The promise
 * being protected is "a teacher sees three pathways at the top of the hub", and
 * only the workspace can keep that promise. */
const planning = readFileSync("assets/curriculum-teacher-planning.js", "utf8");
const workspace = planning.slice(
  planning.indexOf("function buildWorkspace"),
  planning.indexOf("function organizeTools"),
);
const PATHWAYS = [
  ["Lessons", "/curriculum/units/"],
  ["Math Planner", "/curriculum/planning/"],
  ["Student Supports", "/curriculum/student-supports/"],
];
for (const [name, href] of PATHWAYS) {
  if (!workspace.includes(href)) {
    failures.push(`the ${name} pathway is not wired into the teacher workspace (${href})`);
  }
}
if (workspace.length < 500) {
  failures.push("buildWorkspace() could not be read — the pathway check proved nothing");
}

/* 4. The workspace must stay teacher-scoped. It links to planning and supports,
 * and the hub hides teacher chrome with `hub-teacher-only`; losing that class
 * would put teacher navigation in front of students. */
if (!/className\s*=\s*"tws hub-teacher-only"/.test(planning)) {
  failures.push("the teacher workspace is no longer marked hub-teacher-only");
}

if (failures.length) {
  console.error("validate-teacher-reachability FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `✓ teacher reachability: ${baseline.length} destinations still linked, all resolve, 3 pathways wired.`,
);

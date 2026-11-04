// unit-projects-membership.test.mjs — every project belongs to the unit it teaches.
//
// The legacy project folders (math/unit-N/projects/) were NOT renumbered with the Reveal TOC:
// `unit-1` holds a Unit 6 project and `unit-10` a Unit 5 one. data/project-registry.json
// (`hubs[].currentUnit`) is the truth. Three surfaces must agree with it:
//   1. the units page: each unit block carries its own hubs' routes, and no other unit's
//   2. every unit 1..10 offers its Project Studio mission (`/curriculum/projects/studio/?unit=N`)
//   3. the launch manifest's `endOfUnit` row for a unit (the Lesson picker and the hub footer's
//      "10 unit projects") opens a project that belongs to that unit
// Until 2026-11-03 (3) was keyed by folder name, so the picker's "Unit 1" and "Unit 10" rows
// opened a Unit 6 and a Unit 5 project. Pre-Unit (currentUnit 0) has no unit block and is exempt.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const studio = (unit) => `/curriculum/projects/studio/?unit=${unit}`;

/** Unit number (1-based, page order) -> the HTML of its block on the units page. */
export function unitBlocks(html) {
  const starts = [...html.matchAll(/<span class="unit-name">[^<]+<\/span>/g)].map((m) => m.index);
  return new Map(starts.map((at, i) => [i + 1, html.slice(at, starts[i + 1] ?? html.length)]));
}

/** Every way a project can sit under the wrong unit. Empty array = consistent. */
export function membershipProblems({ hubs, endOfUnit, blocks }) {
  const problems = [];
  const ownRoutes = (unit) => hubs.filter((h) => h.currentUnit === unit).map((h) => h.route);
  for (const [unit, block] of blocks) {
    const own = ownRoutes(unit);
    if (own.length && !own.some((r) => block.includes(`href="${r}"`)))
      problems.push(`unit ${unit} block links none of its hubs (${own.join(", ")})`);
    for (const hub of hubs)
      if (hub.currentUnit !== unit && block.includes(`href="${hub.route}"`))
        problems.push(
          `unit ${unit} block links ${hub.route}, which belongs to unit ${hub.currentUnit}`,
        );
    if (!block.includes(`href="${studio(unit)}"`))
      problems.push(`unit ${unit} block has no Project Studio link`);
  }
  for (const row of endOfUnit) {
    const route = row.resources.lesson;
    if (route !== studio(row.unit) && !ownRoutes(row.unit).includes(route))
      problems.push(`${row.id} opens ${route}, which is not a unit ${row.unit} project`);
  }
  return problems;
}

/* --- self-test: the detector must catch the exact defects that shipped ---------------------- */
const fakeHubs = [{ route: "/math/unit-1/projects/", currentUnit: 6 }];
const fakeBlocks = new Map([
  [1, `<a href="${studio(1)}"></a><a href="/math/unit-1/projects/"></a>`],
]);
assert.ok(
  membershipProblems({ hubs: fakeHubs, endOfUnit: [], blocks: fakeBlocks }).some((p) =>
    p.includes("belongs to unit 6"),
  ),
  "detector missed a project linked under the wrong unit",
);
assert.ok(
  membershipProblems({
    hubs: fakeHubs,
    endOfUnit: [{ id: "unit-1-project", unit: 1, resources: { lesson: "/math/unit-1/projects/" } }],
    blocks: new Map(),
  }).some((p) => p.includes("not a unit 1 project")),
  "detector missed the picker row that opened another unit's project",
);

/* --- the real data --------------------------------------------------------------------------- */
const registry = JSON.parse(read("data/project-registry.json"));
const launch = JSON.parse(read("data/curriculum-launch-manifest.json"));
const blocks = unitBlocks(read("curriculum/units/index.html"));
assert.equal(blocks.size, 10, "the units page must carry ten unit blocks");
assert.equal(launch.endOfUnit.length, 10, "one end-of-unit project row per unit");

const problems = membershipProblems({ hubs: registry.hubs, endOfUnit: launch.endOfUnit, blocks });
assert.deepEqual(problems, [], `projects are not in their own units:\n  ${problems.join("\n  ")}`);
console.log(
  "ok - every project belongs to its own unit (10 units, %d hubs, 10 picker rows)",
  registry.hubs.length,
);

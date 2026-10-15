// The Curriculum 2.0 integration map is derived, current, and points only at real lessons, activities and labs.
//   node tools/ewl-integration.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { build, sketchStories } from "../scripts/generate-ewl-integration-map.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const read = (p) => JSON.parse(readFileSync(join(REPO_ROOT, p), "utf8"));
const onDisk = readFileSync(join(REPO_ROOT, "data/ewl/integration-map.json"), "utf8");
const built = build();
assert.ok(
  onDisk === `${JSON.stringify(built, null, 2)}\n`,
  "integration map is stale; run: node scripts/generate-ewl-integration-map.mjs",
);

const manifest = read("data/curriculum-launch-manifest.json");
const unitOf = Object.fromEntries(manifest.lessons.map((l) => [l.id, l.unit]));
const ids = {
  canvas: new Set(read("data/ewl/canvas-scenes.json").scenes.map((s) => s.id)),
  lab: new Set(read("data/ewl/investigations.json").investigations.map((s) => s.id)),
  forge: new Set(read("data/ewl/forge-bots.json").bots.map((s) => s.id)),
  invariant: new Set(read("data/ewl/invariants.json").hunts.map((s) => s.id)),
  sketch: new Set(sketchStories().map((s) => s.id)),
};
let refs = 0;
for (const [lesson, kinds] of Object.entries(built.lessons)) {
  assert.ok(unitOf[lesson], `${lesson} is a lesson in the launch manifest`);
  assert.ok(
    unitOf[lesson] >= 2 && unitOf[lesson] <= 9,
    `${lesson}: Units 2-9 only (Unit 10 is not taught)`,
  );
  for (const [kind, list] of Object.entries(kinds)) {
    assert.ok(ids[kind], `known kind ${kind}`);
    for (const id of list) {
      assert.ok(ids[kind].has(id), `${lesson}: ${kind} "${id}" exists`);
      refs++;
    }
  }
}
for (const [kind, set] of Object.entries(ids)) {
  const used = new Set(Object.values(built.lessons).flatMap((k) => k[kind] || []));
  for (const id of set)
    assert.ok(used.has(id), `${kind} "${id}" is attached to at least one lesson`);
}
for (const slug of Object.keys(built.learningLabs))
  assert.ok(
    existsSync(join(REPO_ROOT, "curriculum/learning-labs", slug, "content.json")),
    `learning lab ${slug} exists`,
  );
assert.ok(
  Object.keys(built.learningLabs).length >= 15,
  "most learning labs reach a Curriculum 2.0 activity",
);
console.log(
  `ewl-integration: ${Object.keys(built.lessons).length} lessons, ${refs} activity links, ${Object.keys(built.learningLabs).length} learning labs.`,
);

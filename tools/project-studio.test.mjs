import assert from "node:assert/strict";
import fs from "node:fs";
import { FAMILY, matches, model, number } from "../curriculum/projects/studio/math.mjs";
import { getProject, PROJECTS, studioURL } from "../curriculum/projects/studio/projects.mjs";
import { clean, fresh, progress } from "../curriculum/projects/studio/state.mjs";

const expected = {
  discovery: [7, 11, 15, 23, 4, 32],
  "pre-unit-a": [7, 2, 26, 0, 16, 0],
  "unit-1-a": [14, 1, 27, 0, 20, 0],
  "unit-1-b": [14, 1, 24, 0, 22, 0],
  "unit-1-c": [11, 13, 30, 0, 24, 0],
  "unit-2-a": [8, 7, 10, 8 / 3, 6, 4],
  "unit-2-b": [20, 19, 10, 8 / 3, 18, 4],
  "unit-3-a": [18, 12, 1.5, 1.5, 1.25, 0.25],
  "unit-3-b": [90, 10, 9, 14, 11, 3],
  "unit-4-a": [0.2, 8, 32, 1.92, 33.92, 16.08],
  "unit-4-b": [0.25, 15, 45, 2.25, 47.25, 17.75],
  "unit-5-a": [24, 3, 27, 216, 3, 13],
  "unit-5-b": [35, 6, 41, 246, 3, 13],
  "unit-6-a": [4, 8, 36, 4, 16, 40],
  "unit-6-b": [9, 10, 39, 3, 21, 42],
  "unit-7-a": [10, 4, 4, -3, 6, 6],
  "unit-7-b": [9, 6, 6, 4, 8, 3],
  "unit-8-a": [7, 7, 12, 7, 8, 4],
  "unit-8-b": [12, 12, 20, 12, 13, 5],
  "unit-8-c": [9, 9, 15, 9, 10, 7],
  "unit-9-a": [20, 32, 44, 92, 12, 48],
  "unit-9-b": [12, 16, 20, 44, 4, 24],
  "unit-10-a": [20, 60, 30, 94, 188, 10],
  "unit-10-b": [40, 160, 64, 144, 216, 10],
  "unit-10-c": [13.5, 33.75, 22.5, 64.5, 645, 3.75],
  "statistics-a": [7, 6, 10, 8 / 3, 5, 4],
  "statistics-b": [12, 11, 10, 8 / 3, 10, 4],
  "world-architect": [24, 180, 90, 198, 594, 30],
  "statistics-life": [15, 12.5, 25, 20 / 3, 10, 10],
  synthesis: [24, 120, 24, 96, 132, 30],
};
const registry = JSON.parse(fs.readFileSync("data/ccss-standards.json")).standards;
assert.equal(PROJECTS.length, 30);
assert.equal(new Set(PROJECTS.map((p) => p.id)).size, 30);
for (const p of PROJECTS) {
  const m = model(p, p.defaults);
  assert.deepEqual(m.errors, [], p.id);
  assert.equal(m.checks.length, 6);
  assert.equal(new Set(m.checks.map((q) => q.id)).size, 6);
  m.checks.forEach((q, i) =>
    assert.ok(Math.abs(q.answer - expected[p.id][i]) < 1e-8, `${p.id}/${q.id}`),
  );
  for (const code of FAMILY[p.family].standards) assert.ok(registry[code], code);
  assert.equal(p.evidence.length, 3);
  assert.equal(p.choices.length, 3);
  if (p.classic) assert.ok(fs.existsSync("." + p.classic + "index.html"));
  assert.ok(studioURL(p.id).includes(p.id));
  for (const gallery of ["curriculum/projects/index.html", "math/projects/index.html"])
    assert.ok(fs.readFileSync(gallery, "utf8").includes(studioURL(p.id)), `${gallery}: ${p.id}`);
  const roundtrip = clean(p, JSON.parse(JSON.stringify(fresh(p))));
  assert.equal(roundtrip.projectId, p.id);
  assert.equal(progress(p, roundtrip).ready, false);
}
for (let n = 0; n <= 10; n++)
  assert.ok(
    PROJECTS.some((p) => p.unit === n),
    `Current unit ${n}`,
  );
assert.equal(number("2 1/2"), 2.5);
assert.equal(number("-2 1/2"), -2.5);
assert.equal(number(" 3/4 "), 0.75);
assert.ok(Number.isNaN(number("1/0")));
assert.ok(Number.isNaN(number("")));
assert.ok(Number.isNaN(number("Infinity")));
assert.ok(Number.isNaN(number("2+2")));
assert.ok(matches("2.67", 8 / 3));
assert.ok(!matches("", 0));
assert.ok(!matches("2.6", 8 / 3));
const divide = getProject("pre-unit-a");
assert.deepEqual(
  model(divide, { ...divide.defaults, a: 100, b: 24, c: 40, d: 2.5, e: 10, f: 3 }).checks.map(
    (q) => q.answer,
  ),
  [5, 4, 16, 0, 10 / 3, 1],
);
assert.ok(model(divide, { ...divide.defaults, b: 0 }).errors.length);
assert.ok(model(divide, { ...divide.defaults, b: 2.5 }).errors.length);
const stats = getProject("unit-2-a");
assert.deepEqual(
  model(stats, { data: "5,5,5,5,5,5" }).checks.map((q) => q.answer),
  [5, 5, 0, 0, 5, 0],
);
assert.deepEqual(
  model(stats, { data: "1,2,3,4,5,6,7" }).checks.map((q) => q.answer),
  [4, 4, 6, 12 / 7, 2, 4],
);
assert.ok(model(stats, { data: "1,2,3,4,5," }).errors.length);
const p = getProject("unit-3-a"),
  s = fresh(p);
s.answers = { "rate-a": "999" };
s.checked = { "rate-a": true };
assert.equal(clean(p, s).checked["rate-a"], undefined);
assert.throws(() => clean(p, { ...s, projectId: "unit-4-a" }));
assert.throws(() => clean(p, null));
s.stage = 99;
assert.equal(clean(p, s).stage, 0);
s.baseline = { design: { a: "bad" } };
assert.equal(clean(p, s).baseline, null);
const solid = getProject("unit-10-b");
assert.equal(
  model(solid, { a: 2, b: 3, c: 4, d: 1, e: 20 }).checks.find((q) => q.id === "surface").answer,
  46,
);
assert.equal(
  model(getProject("unit-10-a"), { a: 2, b: 3, c: 4, d: 1, e: 20 }).checks.find(
    (q) => q.id === "surface",
  ).answer,
  52,
);
console.log(
  "PASS: 30 mission fixtures / 180 independently computed answers; current unit and standards coverage; boundary math; fraction parsing; state validation and stale-check rejection.",
);

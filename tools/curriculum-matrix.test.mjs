// data/curriculum/matrix.json (contract: types/curriculum.d.ts): current, complete for Units 1-9, and every path is a real page.
//   node tools/curriculum-matrix.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "../scripts/generate-curriculum-matrix.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const read = (p) => readFileSync(join(REPO_ROOT, p), "utf8");
const onDisk = read("data/curriculum/matrix.json");
assert.ok(
  onDisk === `${JSON.stringify(build(), null, 2)}\n`,
  "matrix is stale; run: node scripts/generate-curriculum-matrix.mjs",
);
const m = JSON.parse(onDisk);
const launch = JSON.parse(read("data/curriculum-launch-manifest.json"));
const standards = JSON.parse(read("data/ccss-standards.json")).standards;

assert.equal(m.schemaVersion, 1);
assert.equal(m.grade, 6);
assert.ok(
  m.units.every((u) => u.unitNumber >= 1 && u.unitNumber <= 9),
  "Unit 10 is not taught and is not listed",
);
assert.equal(m.units.length, 9);
const want = launch.lessons.filter((l) => l.unit >= 1 && l.unit <= 9);
const got = m.units.flatMap((u) => u.lessons);
assert.equal(got.length, want.length, "every taught lesson is in the matrix");
assert.deepEqual([...new Set(got.map((l) => l.id))].length, got.length, "no duplicate lesson");
const DOMAINS = new Set(["AT", "NOS", "GR", "DS", "MP"]);
let paths = 0;
for (const u of m.units) {
  assert.ok(u.title && !/^Unit \d+$/.test(u.title), `unit ${u.unitNumber} has a real title`);
  assert.ok(DOMAINS.has(u.domain) && u.domains.includes(u.domain), `unit ${u.unitNumber} domain`);
  u.lessons.forEach((l, i) => {
    assert.equal(l.id, `${u.unitNumber}-${l.lessonNumber}`);
    if (i) assert.ok(l.lessonNumber > u.lessons[i - 1].lessonNumber, `${l.id} is in order`);
    assert.ok(l.title && l.objective, `${l.id} has a title and an objective`);
    for (const s of l.standards)
      assert.ok(
        standards[s] || /^6\.MPP\.|^MPP\./.test(s) || u.unitNumber === 1,
        `${l.id}: standard ${s} exists`,
      );
    assert.ok(Array.isArray(l.topics) && l.topics.length, `${l.id} has search topics`);
    assert.ok(l.tracks.core === true);
    assert.equal(l.tracks.scaffold, Boolean(l.paths.group1));
    for (const [k, p] of Object.entries(l.paths)) {
      const f = p.replace(/^\//, "");
      assert.ok(
        existsSync(join(REPO_ROOT, f)) &&
          (!f.endsWith("/") || existsSync(join(REPO_ROOT, f, "index.html"))),
        `${l.id}.${k}: ${p} exists`,
      );
      paths++;
    }
    assert.equal(
      l.hasInteractive,
      Boolean(l.paths.learningLab || l.canvas.length || l.investigations.length),
    );
  });
}
console.log(
  `curriculum-matrix: ${m.units.length} units, ${got.length} lessons, ${paths} paths resolve on disk.`,
);

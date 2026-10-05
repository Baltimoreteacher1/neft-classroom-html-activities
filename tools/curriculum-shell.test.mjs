import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { shellPages, withCurriculumShell } from "./lib/curriculum-shell.mjs";
import { loadCurriculumManifest, REPO_ROOT } from "./lib/curriculum-source.mjs";

for (const [file, active] of shellPages) {
  const html = readFileSync(`${REPO_ROOT}/${file}`, "utf8");
  assert.equal(withCurriculumShell(html, active), html, `${file}: shared shell is deterministic`);
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("nav.ewl-course-nav").length, 1);
  assert.equal(doc.querySelectorAll(".ewl-course-nav li a").length, 7);
  assert.equal(
    doc.querySelectorAll('.ewl-course-nav [aria-current="page"]').length,
    active ? 1 : 0,
  );
  assert.ok(doc.querySelector("main[id]"), `${file}: skip target exists`);
}
const manifest = loadCurriculumManifest();
const sequence = JSON.parse(readFileSync(`${REPO_ROOT}/assets/curriculum-lesson-sequence.json`));
assert.deepEqual(
  sequence,
  manifest.lessons.map(({ id, unit, title }) => ({ id, unit, title })),
);
const home = new JSDOM(readFileSync(`${REPO_ROOT}/curriculum/index.html`, "utf8")).window.document;
assert.equal(home.querySelectorAll(".course-unit-list li").length, manifest.units.length);
const lessonTotal = [...home.querySelectorAll(".course-unit-count")].reduce(
  (sum, el) => sum + parseInt(el.textContent),
  0,
);
assert.equal(lessonTotal, manifest.lessons.length);
console.log(
  "Curriculum shell: shared navigation, skip targets, idempotency, course counts, and all lesson sequence entries PASS.",
);

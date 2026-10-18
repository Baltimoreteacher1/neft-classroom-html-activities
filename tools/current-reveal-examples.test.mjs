import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadLessonConfig, REPO_ROOT } from "./lib/curriculum-source.mjs";
import { parseModernPractice } from "./lib/reveal-docx.mjs";

const load = (p) => JSON.parse(readFileSync(join(REPO_ROOT, p), "utf8"));
const docs = load("data/reveal-document-downloads.json").documents;
let n = 0;
for (const file of ["data/reveal-session1-source.json", "data/part-two-session2-source.json"]) {
  const data = load(file);
  assert.equal(data.lessons.length, 54);
  for (const lesson of data.lessons) {
    const doc = docs.find((d) => d.sources.includes(lesson.sourcePractice.path));
    assert.ok(doc, lesson.id);
    const path = join(REPO_ROOT, doc.url);
    const bytes = readFileSync(path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), lesson.sourcePractice.sha256);
    const current = parseModernPractice(path);
    assert.deepEqual(current.workedExample, lesson.workedExample, lesson.id);
    assert.deepEqual(
      current.workedExample.steps.map((s) => s.n),
      current.workedExample.steps.map((_, i) => i + 1),
      lesson.id,
    );
    assert.equal(current.revealLesson, lesson.revealLesson);
    assert.equal(current.session, lesson.session);
    n++;
  }
}
const percent = load("data/reveal-session1-source.json").lessons.find((l) => l.id === "4-1");
assert.equal(
  percent.workedExample.steps[1].text,
  "3 × 25 = 75 and 4 × 25 = 100.",
  "OOXML adjacency must not eat the first mathematical digit",
);
const bridge = load("data/part-two-session2-source.json").lessons.find((l) => l.id === "3-7-part2");
assert.match(bridge.workedExample.steps[0].text, /^11/, "Step 1 plus 11 is not step 111");
const core = loadLessonConfig("3-7");
const exponents1 = load("data/reveal-session1-source.json").lessons.find((l) => l.id === "6-3");
const exponents2 = load("data/part-two-session2-source.json").lessons;
assert.match(exponents1.workedExample.answer, /9⁴/);
assert.match(exponents2.find((l) => l.id === "6-3-part2").workedExample.answer, /3⁴/);
assert.match(
  exponents2
    .find((l) => l.id === "6-4-part2")
    .workedExample.steps.map((s) => s.text)
    .join(" "),
  /3² = 9/,
);
assert.match(
  exponents2
    .find((l) => l.id === "6-5-part2")
    .workedExample.steps.map((s) => s.text)
    .join(" "),
  /5² = 25/,
);
assert.match(core.revealWordProblem.text, /0\.454/);
assert.match(core.revealWordProblem.text, /math model/);
assert.ok(Math.abs((35924000 * 0.454) / 1524 - 10701.76902887139) < 1e-8);
const steps = load("data/part-two-worked-steps.json");
assert.match(steps["3-7"].steps[0].math, /0\.454/);
assert.match(steps["3-2"].answer, /\$6/);
assert.equal(4 * (9.25 + 25 + 3.5) - 145, 6);
console.log(
  `${n} current source worked examples match packaged masters, lesson/session and mathematical digits; classroom 4-week and 0.454 conversion assumptions agree with online solutions.`,
);

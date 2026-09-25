import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import {
  controls,
  evaluate,
  numericAnswer,
  puzzle,
  statistics,
} from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";
import { blueprints } from "./learning-labs/blueprints.mjs";
import {
  CORE_ID_RE,
  listLessonDirs,
  loadLessonConfig,
  REPO_ROOT,
} from "./lib/curriculum-source.mjs";

const catalogue = JSON.parse(readFileSync(join(REPO_ROOT, "data/learning-labs.json")));
const core = listLessonDirs({ filter: CORE_ID_RE }).sort();
const covered = catalogue.labs.flatMap((l) => l.lessons).sort();
assert.deepEqual(covered, core, "Every core lesson must be covered exactly once");
assert.equal(catalogue.labCount, blueprints.length);
assert.equal(new Set(catalogue.labs.map((l) => l.id)).size, catalogue.labCount);
assert.equal(new Set(catalogue.labs.map((l) => l.title)).size, catalogue.labCount);
const unitsDOM = new JSDOM(readFileSync(join(REPO_ROOT, "curriculum/units/index.html"), "utf8"))
  .window.document;
let questions = 0,
  gameGoals = 0;
for (const item of catalogue.labs) {
  assert.ok(item.lessons.length >= 1 && item.lessons.length <= 2);
  if (item.lessons.length === 2)
    assert.equal(Number(item.lessons[1].split("-")[1]), Number(item.lessons[0].split("-")[1]) + 1);
  const path = join(REPO_ROOT, "curriculum/learning-labs", item.id);
  assert.ok(existsSync(join(path, "index.html")));
  const lab = JSON.parse(readFileSync(join(path, "content.json")));
  assert.equal(lab.investigate.length, 3);
  assert.ok(lab.create.length > 60);
  assert.ok(lab.vocabulary.length >= 4);
  for (const lesson of lab.lessons) {
    const source = loadLessonConfig(lesson.id);
    assert.equal(lesson.title, source.title);
    assert.equal(lesson.objective, source.contentObjective);
    assert.deepEqual(lesson.concept.worked.lines, source.launch.conceptIntro.iDo.lines);
    const lessonNode = [...unitsDOM.querySelectorAll(".lesson")].find((el) =>
      el.getAttribute("data-search")?.startsWith(`${lesson.id} `),
    );
    assert.ok(
      lessonNode?.querySelector(`a[href="${item.href}"]`),
      `Missing lesson connection ${lesson.id}`,
    );
  }
  for (const [level, bank] of Object.entries(lab.practice)) {
    assert.ok(bank.length >= 5, `${item.id} ${level} needs substantive practice`);
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
    for (const q of bank) {
      assert.ok(q.prompt && q.explanation, `${q.id} needs a prompt and feedback`);
      if (q.type === "choice") {
        assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length);
        assert.equal(new Set(q.choices).size, q.choices.length, `${q.id} has duplicate choices`);
      }
      if (q.type === "repair") assert.ok(q.answer >= 0 && q.answer < q.steps.length);
      if (q.type === "number") assert.ok(Number.isFinite(q.answer) && q.tolerance > 0);
      questions++;
    }
  }
  const fields = controls(lab.model);
  const result = evaluate(lab.model);
  assert.ok(Number.isFinite(result.value));
  const diagram = new JSDOM(visual(lab.model, lab.model.values, result)).window.document;
  assert.ok(diagram.querySelector('svg[role="img"][aria-label]'));
  for (let tier = 0; tier < 3; tier++)
    for (let round = 0; round < 3; round++) {
      const p = puzzle(lab.model, round, tier);
      const f = fields[p.free],
        n = p.goal[p.free];
      assert.ok(n >= f.min && n <= f.max, `${item.id} game target must be reachable`);
      assert.ok(
        Math.abs((n - f.min) / f.step - Math.round((n - f.min) / f.step)) < 1e-7,
        `${item.id} valid input step`,
      );
      assert.ok(Math.abs(evaluate(lab.model, p.goal).value - p.target) <= p.tolerance);
      assert.ok(Number.isFinite(evaluate(lab.model, p.start).value));
      gameGoals++;
    }
}
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const check = (kind, mode, values, expected) =>
  close(evaluate({ kind, mode, values }).value, expected);
check("ratio", "mixer", [3, 2], 1.5);
check("rate", "shopping", [12, 8], 1.5);
check("division", "shipments", [14.4, 1.2], 12);
check("decimal", "receipt", [2.75, 6], 16.5);
check("percent", "whole", [30, 18], 60);
check("percent", "discount", [25, 80], 20);
check("area", "triangle", [8, 5, 4], 20);
check("area", "trapezoid", [10, 6, 4], 32);
check("area", "polygon", [4, 6, 3], 36);
check("solid", "net", [4, 3, 2], 24);
check("solid", "surface", [4, 3, 2], 52);
check("fraction", "ribbon", [5.5, 3, 4], 22 / 3);
const pyramid = evaluate({ kind: "solid", mode: "surface" }, [6, 3, 5], { shape: "pyramid" });
assert.equal(pyramid.value, 96);
assert.equal(pyramid.validShape, true);
assert.equal(
  evaluate({ kind: "solid", mode: "surface" }, [6, 3, 3], { shape: "pyramid" }).validShape,
  false,
);
check("power", "order", [3, 4, 2], 83);
check("expression", "distribute", [3, 4, 2], 18);
check("factors", "gcf", [18, 24], 6);
check("factors", "lcm", [12, 18], 36);
check("coordinates", "rectangle", [-4, -2, 3, 4], 42);
check("coordinates", "distance", [-3, 4, 2, 4], 5);
check("balance", "multiply", [4, 36, 9], 0);
check("balance", "add", [7, 19, 12], 0);
const s = statistics([2, 4, 6, 8]);
assert.deepEqual([s.mean, s.median, s.q1, s.q3, s.range, s.iqr, s.mad], [5, 5, 3, 7, 6, 4, 2]);
for (let i = 0; i < 500; i++) {
  const a = 2 + (i % 35),
    b = 2 + ((i * 7) % 35);
  const f = evaluate({ kind: "factors", mode: "gcf", values: [a, b] });
  assert.equal(a % f.gcf, 0);
  assert.equal(b % f.gcf, 0);
  assert.equal(f.lcm % a, 0);
  assert.equal(f.lcm % b, 0);
  const values = [i % 7, 2 + (i % 9), 4 + (i % 11), 6 + (i % 13)];
  const original = statistics(values),
    shifted = statistics(values.map((n) => n + 5));
  close(shifted.mean, original.mean + 5);
  close(shifted.median, original.median + 5);
  close(shifted.mad, original.mad);
}
for (const [input, expected] of [
  ["0", 0],
  [".5", 0.5],
  ["-.25", -0.25],
  ["3/4", 0.75],
  ["1 1/2", 1.5],
  ["-1 1/2", -1.5],
  ["−3", -3],
  ["1,200", 1200],
])
  close(numericAnswer(input), expected);
for (const input of ["", " ", "1/0", "Infinity", "2+2", "cat"])
  assert.ok(Number.isNaN(numericAnswer(input)));
console.log(
  `PASS learning labs: ${catalogue.labCount} labs / ${core.length} lessons / ${questions} practice items / ${gameGoals} game goals; 20 independent math fixtures, 500 arithmetic/statistics property checks, source fidelity, SVG and curriculum links.`,
);

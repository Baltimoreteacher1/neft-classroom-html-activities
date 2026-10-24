// line:order (lesson 7-4): the readout is the signed step from the first location to the second, never a distance from 0.
// Expectations are built by walking the number line one step at a time, not by the module's subtraction.
// Run: node tools/studio-model-line-order.test.mjs
import assert from "node:assert/strict";
import { evaluate, puzzle } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const model = { kind: "line", mode: "order", values: [-3, -8] };
/** Steps from a to b by stepping along the line: positive going right, negative going left. */
function walk(a, b) {
  let p = a;
  let n = 0;
  while (p < b) {
    p += 1;
    n += 1;
  }
  while (p > b) {
    p -= 1;
    n -= 1;
  }
  return n;
}
const texts = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
let checked = 0;
for (let a = -10; a <= 10; a++)
  for (let b = -10; b <= 10; b++) {
    const r = evaluate(model, [a, b]);
    assert.equal(r.value, walk(a, b), `${a} to ${b}`);
    assert.ok(
      !/absolute|distance/i.test(`${r.label} ${r.equation} ${r.note}`),
      "the readout may not talk about distance",
    );
    const words = texts(visual(model, [a, b], r)).join(" | ");
    const greater = Math.max(a, b).toString().replace("-", "−");
    if (a !== b)
      assert.ok(
        words.includes(`${greater} is farther right, so it is greater.`),
        `${a},${b}: ${words}`,
      );
    else assert.ok(words.includes("Same spot"), `${a},${b}`);
    assert.ok(
      words.includes(`First: ${String(a).replace("-", "−")}`) &&
        words.includes(`Second: ${String(b).replace("-", "−")}`),
      "both locations are named",
    );
    // the note names the lesser number first, with a less-than sign
    if (a !== b) {
      const lo = String(Math.min(a, b)).replace("-", "−");
      assert.ok(r.note.startsWith(`${lo} <`), r.note);
    }
    checked++;
  }
// farther from 0 is not greater: -9 is farther from 0 than -2 but sits left of it
const r = evaluate(model, [-9, -2]);
assert.equal(r.value, 7);
assert.ok(
  texts(visual(model, [-9, -2], r))
    .join(" ")
    .includes("−2 is farther right"),
);
// the mission: 27 puzzles, each starts unsolved, each target reached by exactly one setting of the first location
const targets = new Set();
for (let level = 0; level < 3; level++)
  for (let round = 0; round < 9; round++) {
    const q = puzzle(model, round, level);
    assert.notEqual(evaluate(model, q.start).value, q.target, "starts solved");
    let hits = 0;
    for (let v = -10; v <= 10; v++) if (evaluate(model, [v, q.goal[1]]).value === q.target) hits++;
    assert.equal(hits, 1, `r${round} L${level}: ${hits} solutions`);
    targets.add(q.target);
  }
assert.ok(targets.size >= 6, `only ${targets.size} different targets`);
console.log(`line:order: ${checked} settings and 27 mission puzzles checked.`);

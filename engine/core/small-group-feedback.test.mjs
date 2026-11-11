import assert from "node:assert/strict";
import test from "node:test";
import {
  diagnoseAnswer,
  hintLadder,
  summarizeEvidence,
  supportLevel,
} from "./small-group-feedback.js";

const item = (problem, answer, extra = {}) => ({ problem, answer, ...extra });

test("a swapped ratio is named as an order error", () => {
  const d = diagnoseAnswer(item("5 grapes for every 2 strawberries. Grapes to strawberries?", "5:2"), "2:5");
  assert.equal(d.code, "reversed");
});

test("adding when the problem does not add", () => {
  const d = diagnoseAnswer(item("2 cups mango for every 5 cups yogurt. 28 cups total. How much mango?", "8"), "30");
  assert.equal(d.code, "sum");
});

test("a number copied from the problem", () => {
  assert.equal(diagnoseAnswer(item("A bag has 12 red and 4 blue. How many times as many red?", "3"), "12").code, "given");
});

test("sign and magnitude", () => {
  assert.equal(diagnoseAnswer(item("Temperature drops 8 then rises 3.", "−5"), "5").code, "sign");
  assert.equal(diagnoseAnswer(item("Cost of 5 items at $1.20 each.", "6"), "60").code, "magnitude");
});

test("correct or unreadable answers diagnose nothing", () => {
  assert.equal(diagnoseAnswer(item("1 + 1", "2"), "2"), null);
  assert.equal(diagnoseAnswer(item("1 + 1", "2"), ""), null);
  assert.equal(diagnoseAnswer(item("1 + 1", "two"), "abc"), null);
});

test("diagnosis never contains the answer", () => {
  const it = item("A box holds 6 rows of 7 eggs. Eggs in all?", "42");
  const d = diagnoseAnswer(it, "13");
  assert.equal(d.code, "sum");
  assert.ok(!/42/.test(d.en) && !/42/.test(d.es));
});

test("hint ladder stages: hint, first move, worked steps", () => {
  const ladder = hintLadder({ hint: "Add them.", steps: [{ do: "Add 2 and 3." }, { do: "Write it." }] });
  assert.deepEqual(ladder.map((s) => s.level), [1, 2, 3]);
  assert.match(ladder[1].en, /^Start here: /);
  assert.equal(ladder[2].steps, true);
  assert.deepEqual(hintLadder({}), []);
});

test("support level separates independent from helped", () => {
  assert.equal(supportLevel({}), "independent");
  assert.equal(supportLevel({ misses: 1 }), "coached");
  assert.equal(supportLevel({ hints: 1 }), "coached");
  assert.equal(supportLevel({ stepsShown: true, misses: 0 }), "shown");
});

test("evidence counts only what was done and splits by support", () => {
  const data = {
    "a-done": "right", "a-sup": "independent",
    "b-done": "right", "b-sup": "coached", "b-dx": "sum",
    "c-done": "shown",
  };
  const s = summarizeEvidence((k) => data[k], ["a", "b", "c", "d"]);
  assert.deepEqual(
    { i: s.independent, c: s.coached, s: s.shown, o: s.open, t: s.total, tags: s.tags },
    { i: 1, c: 1, s: 1, o: 1, t: 4, tags: { sum: 1 } },
  );
});

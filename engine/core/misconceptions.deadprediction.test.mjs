/* =============================================================================
 * misconceptions.deadprediction.test.mjs
 * -----------------------------------------------------------------------------
 * Guards a whole CLASS of silent bug: a misconception predictor whose formula
 * collapses to the CORRECT answer.
 *
 * detectMisconception() deliberately drops any candidate that lands on the
 * correct answer ("a prediction that lands on the correct answer explains
 * nothing"). That guard is right — but it means a predictor whose arithmetic is
 * algebraically equal to the correct answer is not merely useless, it is
 * INVISIBLE. It never throws, never logs, and never fires. The tag just quietly
 * never appears in telemetry, so it never reaches the misconception heatmap,
 * /api/class-pulse, the Living Curriculum Map's live signal, or the Class Boss.
 *
 * That is exactly what happened to "fraction-straight-across-division": its
 * predictor was `left.n / right.n / (left.d / right.d)`, which is identically
 * (a/b) ÷ (c/d). Verified inert for all 6561 single-digit fraction pairs.
 *
 * This test sweeps a battery of real item shapes and asserts that every tag a
 * predictor emits is capable of producing at least one value DIFFERENT from the
 * correct answer. A tag that can only ever equal the correct answer fails here.
 * ========================================================================== */
import { strict as assert } from "node:assert";
import { predictions } from "./misconceptions.js";

const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9;

/** Items chosen to exercise every branch of the predictor. */
function buildItems() {
  const items = [];
  const add = (stem, answer) => items.push({ item: { stem, answer: String(answer) }, answer });

  // Fraction arithmetic across many operand pairs — the branch that hid the bug.
  for (const [n1, d1, n2, d2] of [
    [3, 4, 1, 2],
    [2, 3, 3, 4],
    [5, 8, 2, 3],
    [7, 2, 1, 4],
    [6, 8, 2, 4],
    [1, 3, 5, 6],
    [9, 5, 3, 7],
  ]) {
    add(`What is ${n1}/${d1} ÷ ${n2}/${d2}?`, (n1 / d1) / (n2 / d2));
    add(`What is ${n1}/${d1} + ${n2}/${d2}?`, n1 / d1 + n2 / d2);
    add(`What is ${n1}/${d1} × ${n2}/${d2}?`, (n1 / d1) * (n2 / d2));
  }

  // Whole-number and decimal operations.
  for (const [a, b] of [
    [12, 4],
    [7, 3],
    [2.5, 4],
    [0.6, 0.2],
    [15, 5],
    [8, 2],
  ]) {
    for (const op of ["+", "-", "*", "/"]) {
      const val = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b;
      add(`What is ${a} ${op} ${b}?`, val);
    }
  }

  // Percent stems (scanned on a separate path).
  add("What is 15% of 60?", 9);
  add("What is 25% of 80?", 20);

  return items;
}

const ITEMS = buildItems();
assert.ok(ITEMS.length >= 40, "battery should be substantial");

// tag -> { emitted, everDiffered }
const seen = new Map();
for (const { item, answer } of ITEMS) {
  for (const { id, value } of predictions(item, answer)) {
    const rec = seen.get(id) || { emitted: 0, everDiffered: 0 };
    rec.emitted += 1;
    if (!near(value, answer)) rec.everDiffered += 1;
    seen.set(id, rec);
  }
}

assert.ok(seen.size > 0, "the battery should emit at least some predictions");

const inert = [...seen.entries()].filter(([, r]) => r.everDiffered === 0);

if (inert.length) {
  const detail = inert
    .map(([id, r]) => `  - ${id}: emitted ${r.emitted}x, ALWAYS equal to the correct answer`)
    .join("\n");
  assert.fail(
    `${inert.length} misconception predictor(s) are structurally inert — every value they\n` +
      `produce equals the correct answer, so detectMisconception() drops all of them and the\n` +
      `tag can never fire from telemetry:\n${detail}\n\n` +
      `Either fix the arithmetic so it models the error students actually make, or remove the\n` +
      `prediction and let the tag be applied through authored distractors\n` +
      `(item.misconceptionTags[choiceIndex]), which detectMisconception() honours first.`,
  );
}

// The specific regression: the straight-across predictor must not come back,
// because dividing straight across is algebraically valid and therefore
// undetectable from the answer alone.
{
  let same = 0;
  let total = 0;
  for (let n1 = 1; n1 <= 9; n1++)
    for (let d1 = 1; d1 <= 9; d1++)
      for (let n2 = 1; n2 <= 9; n2++)
        for (let d2 = 1; d2 <= 9; d2++) {
          total += 1;
          if (near(n1 / n2 / (d1 / d2), (n1 / d1) / (n2 / d2))) same += 1;
        }
  assert.equal(
    same,
    total,
    "sanity: straight-across division should equal the correct answer in every case",
  );

  const straightAcross = [...seen.keys()].filter((id) => id === "fraction-straight-across-division");
  assert.equal(
    straightAcross.length,
    0,
    "fraction-straight-across-division must not be emitted as a numeric prediction — the " +
      "procedure is algebraically valid, so it can only be diagnosed from an authored distractor.",
  );
}

console.log(
  `misconceptions dead-prediction guard: ${seen.size} predictor tag(s) across ${ITEMS.length} items, ` +
    `all capable of a non-correct value; straight-across confirmed undetectable (${6561}/${6561}).`,
);

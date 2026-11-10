// Find-the-Error "fix the step": what counts as a repaired step.
//
// engine/components/error-analysis.js used to compare the typed text with the LAST NUMBER in `correctWork`. That field
// is a teaching paragraph whose last number is often the WRONG value: lesson 6-3's ends "...= 81. So the track plays
// 81 beats, not 12.", so a student who typed 81 was told "Not quite" and one who typed 12 was told they had fixed it.
// These tests pin the shipped 6-3 and 2-12 items, then sweep every authored error-analysis item in the lesson configs.

import assert from "node:assert/strict";
import {
  evaluateExpression,
  expectedValues,
  numbersIn,
  repairMatches,
  stripNegated,
} from "../engine/core/error-analysis-match.js";
import { listLessonDirs, loadLessonConfig } from "./lib/curriculum-source.mjs";

/* ---- the item that shipped broken (lessons/6-3 practice.optional[5]) ------------------------------------ */
const power = {
  workedExample: [
    { label: "Track says", work: "Play 3⁴ beats" },
    { label: "Producer's thinking", work: "3 × 4" },
    { label: "Calculate", work: "= 12" },
  ],
  errorStep: 1,
  correctWork:
    "3⁴ does NOT mean 3 × 4. The exponent 4 tells you to use the base 3 as a factor 4 times: 3 × 3 × 3 × 3 = 81. So the track plays 81 beats, not 12.",
};
assert.deepEqual(expectedValues(power.correctWork, power.workedExample, power.errorStep), {
  values: [81],
  basis: "fresh",
});
for (const typed of [
  "81",
  "3 × 3 × 3 × 3",
  "3 x 3 x 3 x 3",
  "3 × 3 × 3 × 3 = 81",
  "3^4",
  "3⁴",
  "81 beats",
])
  assert.ok(repairMatches(typed, power), `${typed} repairs 3⁴`);
for (const typed of ["12", "3 × 4", "3 × 4 = 12", "27", "64", "", "  "])
  assert.ok(!repairMatches(typed, power), `${JSON.stringify(typed)} does not repair 3⁴`);
assert.ok(
  !repairMatches("2", power),
  "a bare 2 is not a suffix match for a paragraph ending in 12",
);

/* ---- money and decimals: the point inside $129.00 must not end the negated clause ----------------------- */
const money = {
  workedExample: [{ label: "Step", work: "1,290 → $129.00" }],
  errorStep: 0,
  correctWork:
    "Move it 2 places from the right in 1,290 to get 12.90, so the total is $12.90 — not $129.00.",
};
assert.equal(stripNegated(money.correctWork).includes("129"), false);
assert.deepEqual(numbersIn("$1,290.50 and 3/4"), [1290.5, 0.75]);
assert.ok(repairMatches("$12.90", money));
assert.ok(repairMatches("12.9", money));
assert.ok(!repairMatches("$129.00", money));

/* ---- the parser: arithmetic only, never code ------------------------------------------------------------- */
assert.equal(evaluateExpression("3 × 3 × 3 × 3"), 81);
assert.equal(evaluateExpression("2 + 3 × 4"), 14);
assert.equal(evaluateExpression("(2 + 3) × 4"), 20);
assert.equal(evaluateExpression("2^3^2"), 512);
assert.equal(evaluateExpression("6²"), 36);
assert.equal(evaluateExpression("1,200 ÷ 4"), 300);
assert.equal(evaluateExpression("-3 + 5"), 2);
for (const bad of ["", "abc", "3 +", "alert(1)", "2 ** 3", "constructor", "(2", "2)", "1/0 + x"])
  assert.equal(evaluateExpression(bad), null, `${bad} is not arithmetic`);

/* ---- a paragraph that states no number falls back to wording, never to an accidental pass ---------------- */
const words = { workedExample: [], errorStep: 0, correctWork: "Multiply the base by itself." };
assert.deepEqual(expectedValues(words.correctWork, [], 0), { values: [], basis: "none" });
assert.ok(!repairMatches("81", words));
assert.ok(repairMatches("Multiply the base by itself.", words));
assert.ok(repairMatches("multiply the base by itself", words));

/* ---- every authored item ---------------------------------------------------------------------------------- */
/** @type {{ id: string, item: any }[]} */
const items = [];
const collect = (value, id) => {
  if (Array.isArray(value)) for (const v of value) collect(v, id);
  else if (value && typeof value === "object") {
    if (value.type === "error-analysis" && value.correctWork) items.push({ id, item: value });
    for (const v of Object.values(value)) collect(v, id);
  }
};
for (const id of listLessonDirs()) collect(loadLessonConfig(id), id);
assert.ok(items.length > 900, `expected the authored error-analysis items, found ${items.length}`);

const basis = { fresh: 0, last: 0, none: 0 };
let oldRuleWrong = 0;
for (const { id, item } of items) {
  const { values, basis: kind } = expectedValues(
    item.correctWork,
    item.workedExample,
    item.errorStep,
  );
  basis[kind]++;
  const broken = new Set(
    (item.workedExample || [])
      .slice(Math.max(0, item.errorStep ?? 0))
      .flatMap((s) => numbersIn(s.work)),
  );
  const oldLast = numbersIn(item.correctWork).at(-1);
  if (oldLast !== undefined && broken.has(oldLast) && !values.includes(oldLast)) oldRuleWrong++;

  if (kind === "fresh") {
    // The value the paragraph teaches is accepted, and nothing from the broken work is.
    const taught = values[values.length - 1];
    assert.ok(repairMatches(String(taught), item), `${id}: typing ${taught} must repair`);
    for (const wrong of broken)
      if (!values.includes(wrong))
        assert.ok(
          !repairMatches(String(wrong), item),
          `${id}: ${wrong} comes from the broken work`,
        );
  }
  // Pasting the authored paragraph back always counts.
  assert.ok(repairMatches(item.correctWork, item), `${id}: the authored correctWork must repair`);
}
assert.ok(
  basis.fresh > 700,
  `most items should state a value the broken work lacks (${JSON.stringify(basis)})`,
);
console.log(
  `error-analysis repair: ${items.length} authored items, expected value from the paragraph's new numbers on ${basis.fresh}, ` +
    `last-number fallback on ${basis.last}, no number on ${basis.none}; the old rule pointed at the broken work on ${oldRuleWrong}`,
);

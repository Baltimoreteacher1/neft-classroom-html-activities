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
  repairVerdict,
  statedAnswer,
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

/* ---- items that state their answer up front: "The correct answer is x ≤ 8. ..." --------------------------- */
const ineq = {
  workedExample: [{ label: "Graph", work: "x ≥ 8" }],
  errorStep: 0,
  correctWork:
    "The correct answer is x ≤ 8. Closed circle means the value is included. Shaded left means less than or equal to: x ≤ 8.",
};
assert.equal(statedAnswer(ineq.correctWork), "x ≤ 8");
assert.equal(statedAnswer("The correct answer is 12.90. Move the point."), "12.90");
assert.equal(
  statedAnswer("The correct answer is More, because 60% is less than the whole."),
  "More",
);
assert.equal(statedAnswer("Divide both parts by 6."), null);
for (const typed of ["x ≤ 8", "x<=8", "X ≤ 8", "x ≤ 8 (closed circle)"])
  assert.equal(repairVerdict(typed, ineq), "match", `${typed} repairs the inequality`);
for (const typed of ["x ≥ 8", "x ≥ 8.", "8", "x < 8", "x ≤ 7"])
  assert.equal(repairVerdict(typed, ineq), "no", `${typed} does not repair the inequality`);

const ratio = {
  workedExample: [{ label: "Answer", work: "2 to 1" }],
  errorStep: 0,
  correctWork: "The correct answer is 1 to 1. The pedals are attached directly to the front wheel.",
};
for (const typed of ["1 to 1", "1:1", "1 : 1"])
  assert.equal(repairVerdict(typed, ratio), "match", typed);
for (const typed of ["2 to 1", "2:1", "1 to 2"])
  assert.equal(repairVerdict(typed, ratio), "no", typed);

const word = {
  workedExample: [{ label: "Answer", work: "The range" }],
  errorStep: 0,
  correctWork:
    "The correct answer is The median. The line inside the box of a box plot always represents the median.",
};
assert.equal(repairVerdict("median", word), "match");
assert.equal(repairVerdict("The median", word), "match");
assert.equal(repairVerdict("The range", word), "no", "retyping the broken work is not a repair");
assert.equal(repairVerdict("mean", word), "no");

const absolute = {
  workedExample: [{ label: "Answer", work: "-8" }],
  errorStep: 0,
  correctWork: "The correct answer is 8. Absolute value is the distance from zero, so |-8| = 8.",
};
assert.equal(repairVerdict("8", absolute), "match");
assert.equal(repairVerdict("-8", absolute), "no");
assert.equal(repairVerdict("18", absolute), "no", "18 is not 8");

/* ---- nothing checkable (a reason, not a value): a real attempt gets the model, a stub does not --------------- */
const reason = {
  workedExample: [{ label: "Reason", work: "It only asks about one player" }],
  errorStep: 0,
  correctWork:
    "The reason is wrong. One player's counts vary across games, so this is a statistical question.",
};
assert.equal(repairVerdict("Counts change from game to game", reason), "model");
assert.equal(repairVerdict("idk", reason), "no");
assert.equal(repairVerdict("It only asks about one player", reason), "no");

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
let statedCount = 0;
let modelOnly = 0;
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

  if (kind === "fresh" && !statedAnswer(item.correctWork)) {
    // No stated answer: the value the paragraph teaches is accepted, and nothing from the broken work is.
    const taught = values[values.length - 1];
    assert.ok(repairMatches(String(taught), item), `${id}: typing ${taught} must repair`);
    for (const wrong of broken)
      if (!values.includes(wrong))
        assert.ok(
          !repairMatches(String(wrong), item),
          `${id}: ${wrong} comes from the broken work`,
        );
  }
  const stated = statedAnswer(item.correctWork);
  if (stated) statedCount++;
  if (stated)
    assert.equal(
      repairVerdict(stated, item),
      "match",
      `${id}: its own stated answer "${stated}" must repair`,
    );
  // Retyping any step of the broken work is never a repair (unless it IS the stated answer).
  for (const step of (item.workedExample || []).slice(Math.max(0, item.errorStep ?? 0))) {
    const retyped = String(step.work ?? "")
      .replace(/^=\s*/, "")
      .trim();
    if (!retyped || (stated && retyped === stated.trim())) continue;
    assert.notEqual(
      repairVerdict(retyped, item),
      "match",
      `${id}: retyping the broken work "${retyped}" must not repair`,
    );
  }
  if (!stated && kind === "none") modelOnly++;
  // Pasting the authored paragraph back always counts.
  assert.ok(repairMatches(item.correctWork, item), `${id}: the authored correctWork must repair`);
}
assert.ok(
  basis.fresh > 700,
  `most items should state a value the broken work lacks (${JSON.stringify(basis)})`,
);
assert.ok(statedCount > 150, `most weak items state their answer up front (${statedCount})`);
assert.ok(modelOnly < 30, `only a few items may be unverifiable (${modelOnly})`);
console.log(
  `error-analysis repair: ${items.length} authored items; the old rule pointed at the broken work on ${oldRuleWrong}; ` +
    `${statedCount} state their answer up front, ${basis.fresh} have a value the broken work lacks, ` +
    `${modelOnly} are unverifiable and show the model instead`,
);

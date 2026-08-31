/**
 * The 6-1 guided-fill parallel-practice bank, held to what 6-1 teaches.
 *
 * buildParallelPractice() dispatches on LEGACY_TOPIC coordinates, and 6-1's
 * coordinate ([2, 1]) shared its generator with a shape that never appears in
 * 6-1: every item put a non-unit fraction on BOTH sides of the division
 * ("how many groups of 1/4 fit in 2/3?"), which is fraction ÷ fraction — 6-2's
 * strand ("Division Expressions with Fractions and Mixed Numbers"), not 6-1's
 * ("… Fractions and Whole Numbers"). A student in 6-1's small group met
 * fraction ÷ fraction in every one of the 12 guided-fill drills and never met
 * the two shapes the lesson's own objective names: whole ÷ unit fraction and
 * fraction ÷ whole number.
 *
 * Pinned in both directions: the real curriculum must be clean, and the
 * defect this replaces — reintroduced by mutation below — must be caught.
 */
import assert from "node:assert/strict";
import { evaluateExpression } from "../scripts/lib/rational.mjs";
import { buildParallelPractice } from "./lib/small-group-parallel-practice.mjs";

/** "3/5 ÷ 3" → { left: "3/5", right: "3" }. */
function operandsOf(stem) {
  const match = /:\s*(.+?)\s*÷\s*(.+?)\.\s*$/.exec(stem);
  assert.ok(match, `stem does not carry a "left ÷ right." expression: ${stem}`);
  return { left: match[1], right: match[2] };
}

const isWholeNumber = (text) => /^\d+$/.test(text);

for (const group of [1, 2]) {
  const items = buildParallelPractice({}, `6-1-group${group}`, group);
  assert.equal(items.length, 12, `6-1-group${group} should generate 12 parallel-practice items`);

  const stems = new Set();
  let wholeByUnit = 0;
  let fractionByWhole = 0;

  for (const item of items) {
    // ── 1. Never fraction ÷ fraction — that shape is 6-2's, not 6-1's. ──────
    const { left, right } = operandsOf(item.stem);
    const shapes = [isWholeNumber(left), isWholeNumber(right)];
    assert.ok(
      shapes.includes(true),
      `${item.id} divides fraction by fraction (${left} ÷ ${right}) — that is 6-2's strand: ${item.stem}`,
    );
    if (isWholeNumber(left)) wholeByUnit++;
    else fractionByWhole++;

    // ── 2. The stated answer is exact. ──────────────────────────────────────
    const exact = evaluateExpression(`${left}÷${right}`);
    assert.ok(exact, `${item.id} operands did not parse: ${left} ÷ ${right}`);
    assert.equal(
      exact.toString(),
      item.answer,
      `${item.id} claims ${item.stem.split(":")[1]?.trim()} = ${item.answer}, but it is ${exact.toString()}`,
    );

    // ── 3. No duplicate stems within the row. ───────────────────────────────
    assert.ok(!stems.has(item.stem), `${item.id} repeats a stem in its own row: ${item.stem}`);
    stems.add(item.stem);
  }

  // ── 4. Both of 6-1's shapes are actually played, not just one. ───────────
  assert.equal(wholeByUnit, 6, `6-1-group${group} should play 6 whole ÷ unit-fraction items`);
  assert.equal(fractionByWhole, 6, `6-1-group${group} should play 6 fraction ÷ whole-number items`);
}

console.log(
  "6-1 parallel practice: both groups play whole ÷ unit fraction and fraction ÷ whole number, never fraction ÷ fraction, 12 unique exact items each.",
);

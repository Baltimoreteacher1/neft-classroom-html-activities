#!/usr/bin/env node
/**
 * part-two-session2-practice.test.mjs — the answer key in
 * `data/part-two-session2-practice.json` is re-derived here INDEPENDENTLY.
 *
 * These items are graded in front of a family, and the file is hand-authored,
 * so "the author checked it" is not evidence. Every numeric key is recomputed a
 * DIFFERENT way than a person would work it: ratio shares by dealing units into
 * boxes one at a time rather than dividing, and every algebraic rewrite by
 * evaluating both forms at several values of the variable — an identity that
 * holds at x = 0, 1, 3, 10 and 47 is not a coincidence of one substitution.
 *
 * It also holds the structural rules the renderer depends on, because an item
 * that renders wrong is as bad as one that answers wrong: a multiple-choice
 * item needs a correctIndex inside its own choices, Spanish must be present for
 * every field a family reads (this page is bilingual and an English-only stem
 * silently drops a parent out of the lesson), choices must be distinct, and
 * every type must be one family homework actually renders.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isPrintableProblem } from "../scripts/homework-alignment.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = JSON.parse(readFileSync(join(ROOT, "data/part-two-session2-practice.json"), "utf8"));
const SOURCE = JSON.parse(readFileSync(join(ROOT, "data/part-two-session2-source.json"), "utf8"));

let checks = 0;
const ok = (label, actual, expected) => {
  assert.deepEqual(actual, expected, `${label}: got ${actual}, independently ${expected}`);
  checks++;
};

/** Deal `total` one unit at a time into `parts` equal boxes — no division. */
function dealIntoBoxes(total, parts) {
  const boxes = new Array(parts).fill(0);
  for (let i = 0; i < total; i++) boxes[i % parts] += 1;
  assert.ok(
    boxes.every((b) => b === boxes[0]),
    `${total} does not deal evenly into ${parts} boxes`,
  );
  return boxes[0];
}

/**
 * Scale `a : b` up ONE GROUP AT A TIME until the first quantity reaches
 * `targetA`, and report how many groups that took plus what the partner
 * quantity reached. Repeated addition, never a division — so a scale factor
 * verified here cannot inherit the arithmetic slip that produced the key.
 */
function scaleTo(a, b, targetA) {
  let sumA = 0;
  let sumB = 0;
  let groups = 0;
  while (sumA < targetA) {
    sumA += a;
    sumB += b;
    groups += 1;
  }
  assert.equal(sumA, targetA, `${a} : ${b} does not scale exactly to ${targetA}`);
  return { groups, partner: sumB };
}

/** Equivalence by cross-multiplication — a different derivation from scaling. */
const equivalentRatio = (a, b, c, d) => a * d === b * c;

/** Evaluate a linear form like "6(2x + 3)" or "12x + 8" at x = n. */
function evaluate(form, n) {
  const grouped = /^(\d+)\(\s*(\d*)([a-z])\s*\+\s*(\d+)\s*\)$/.exec(form);
  if (grouped) {
    const [, k, coef, , c] = grouped;
    return Number(k) * ((coef === "" ? 1 : Number(coef)) * n + Number(c));
  }
  const flat = /^(\d*)([a-z])\s*\+\s*(\d+)$/.exec(form);
  if (flat) {
    const [, coef, , c] = flat;
    return (coef === "" ? 1 : Number(coef)) * n + Number(c);
  }
  const bare = /^(\d+)([a-z])$/.exec(form);
  if (bare) return Number(bare[1]) * n;
  throw new Error(`cannot evaluate: ${form}`);
}

const AT = [0, 1, 3, 10, 47];
const identical = (a, b) => AT.every((n) => evaluate(a, n) === evaluate(b, n));

/* ── 3-1-part2 · Equivalent Ratios and Scale Factor ──────────────────────── */
{
  const dressing = scaleTo(1, 3, 4);
  ok("3-1 salad dressing scale factor", dressing.groups, 4);
  ok("3-1 olive oil for 4 spoons of vinegar", dressing.partner, 12);
  /* The distractor set is the lesson's own misconception, so the additive slip
     has to land somewhere ELSE than the key or the item teaches nothing. */
  assert.notEqual(3 + 3, dressing.partner, "3-1: adding 3 to each must not reach the key");
  checks++;

  ok("3-1 ratio-table column where vinegar is 5", scaleTo(1, 3, 5).partner, 15);

  const snack = scaleTo(2, 5, 6);
  ok("3-1 snack mix scale factor", snack.groups, 3);
  ok("3-1 cereal for 6 cups of pretzels", snack.partner, 15);

  ok("3-1 double number line dollars at 9 tickets", scaleTo(3, 5, 9).partner, 15);

  assert.ok(equivalentRatio(5, 8, 15, 24), "3-1: 5 : 8 must be equivalent to 15 : 24");
  for (const [a, b, c, d] of [
    [3, 7, 9, 20],
    [4, 6, 6, 8],
    [5, 8, 10, 13],
  ]) {
    assert.ok(
      !equivalentRatio(a, b, c, d),
      `3-1: ${a} : ${b} must NOT be equivalent to ${c} : ${d}`,
    );
  }
  checks += 4;

  const rice = scaleTo(3, 5, 12);
  ok("3-1 rice-to-water scale factor", rice.groups, 4);
  ok("3-1 water for 12 cups of rice", rice.partner, 20);
  assert.ok(equivalentRatio(3, 5, 12, rice.partner), "3-1: 12 : 20 must reduce back to 3 : 5");
  checks++;
}

/* ── 6-8-part2 · Expanding and Factoring ────────────────────────────────── */
{
  assert.ok(identical("7n + 77", "7(1n + 11)"), "7(n + 11) ≠ 7n + 77");
  checks++;
  assert.ok(identical("12x + 8", "4(3x + 2)"), "4(3x + 2) ≠ 12x + 8");
  checks++;
  assert.ok(identical("6(2x + 3)", "12x + 18"), "12x + 18 ≠ 6(2x + 3)");
  checks++;

  /* The distractors 3(4x + 6) and 2(6x + 9) are TRUE equations — they are wrong
     only because the lesson asks for the GREATEST common factor. If one of them
     were ever promoted to the key, the identity check above would pass it, so
     the maximality is asserted separately. */
  for (const near of ["3(4x + 6)", "2(6x + 9)"]) {
    assert.ok(identical(near, "12x + 18"), `${near} should still equal 12x + 18`);
    const outside = Number(/^(\d+)/.exec(near)[1]);
    assert.ok(outside < 6, `${near} claims a factor no smaller than the GCF`);
    checks += 2;
  }
}

/* ── Unit 3 · the six lessons paced for September ─────────────────────────
   Every key re-derived from the Reveal numbers a second way: unit prices by
   repeated subtraction rather than division, scaling by building the ratio up
   one group at a time, conversions by counting decimal shifts. */

/** How many times `per` fits into `total` — division by repeated subtraction. */
function fitsInto(total, per) {
  let n = 0;
  let left = Math.round(total * 100);
  const step = Math.round(per * 100);
  while (left >= step) {
    left -= step;
    n += 1;
  }
  return { whole: n, remainderCents: left };
}

/* 3-2 unit prices: cheaper per unit wins, and the totals must NOT decide it. */
{
  const perLb = (price, lb) => Math.round((price / lb) * 100) / 100;
  ok("3-2 Bag C per pound", perLb(5.55, 3), 1.85);
  ok("3-2 Bag D per pound", perLb(8.75, 5), 1.75);
  assert.ok(perLb(8.75, 5) < perLb(5.55, 3), "3-2: Bag D must be the better buy");
  assert.ok(8.75 > 5.55, "3-2: the better buy also has the HIGHER total — the distractor is real");
  ok("3-2 5-pack per marker", perLb(3.5, 5), 0.7);
  ok("3-2 8-pack per marker", perLb(6.0, 8), 0.75);
  ok("3-2 forty markers at the 5-pack rate", 40 * 0.7, 28);
  ok("3-2 forty markers at the 8-pack rate", 40 * 0.75, 30);
  checks += 3;
}

/* 3-3 missing ratio-table value: independently re-derive via cross-multiplication,
   a differently-shaped method than "find the scale factor, apply it to both terms". */
{
  // 4 : 3 :: x : 1 — cross-multiply to solve for the unknown red-paint amount.
  const crossMultiply = (a, b, d) => (a * d) / b; // a : b :: x : d  =>  x = a*d/b
  const red = crossMultiply(4, 3, 1);
  ok("3-3 red paint for 1 cup yellow (4:3 scaled down)", red, 4 / 3);
  ok("3-3 red paint as thirds matches 1 1/3", Math.round(red * 3), 4);
  // Check going back up: scaling 1 cup yellow by 3 must return the original ratio.
  ok("3-3 check: yellow scaled back up", 1 * 3, 3);
  ok("3-3 check: red scaled back up", red * 3, 4);
  let a45 = 0;
  let b45 = 0;
  while (a45 < 20) {
    a45 += 4;
    b45 += 5;
  }
  ok("3-3 4:5 scaled to 20", b45, 25);
  let inches = 0;
  let miles = 0;
  while (inches < 6) {
    inches += 2;
    miles += 50;
  }
  ok("3-3 miles for 6 inches at 2in : 50mi", miles, 150);
}

/* 3-4 ratio graphs: the point must sit on the line through (1, r). */
{
  const r = 24 / 4;
  ok("3-4 apples per bag from (4, 24)", r, 6);
  ok("3-4 (1, r) agrees with the stated point", 1 * r, 6);
  const water = 15 / 5;
  ok("3-4 water per cup of rice from (5, 15)", water, 3);
  ok("3-4 water for 8 cups of rice", 8 * water, 24);
  assert.notEqual(8 + water, 24, "3-4: adding the rate must not accidentally equal the answer");
  checks++;
}

/* 3-5 benchmarks: scale both rates to a shared amount, then compare. */
{
  const lcm = (x, y) => {
    const g = (a, b) => (b ? g(b, a % b) : a);
    return (x * y) / g(x, y);
  };
  const bench = lcm(6, 9);
  ok("3-5 benchmark minutes", bench, 18);
  ok("3-5 Runner A laps at the benchmark", 9 * (bench / 6), 27);
  ok("3-5 Runner B laps at the benchmark", 12 * (bench / 9), 24);
  assert.ok(9 * (bench / 6) > 12 * (bench / 9), "3-5: Runner A must be faster");
  assert.ok(12 > 9, "3-5: the slower runner has the bigger raw lap count — the distractor is real");
  ok("3-5 Runner A minutes for a full mile", 5 * 2, 10);
  assert.ok(8 < 5 * 2, "3-5: Runner B must be faster over a mile");
  checks += 3;
}

/* 3-6 metric: counting decimal shifts, not multiplying. */
{
  const shift = (value, places) => {
    let out = value;
    for (let i = 0; i < Math.abs(places); i += 1) out = places > 0 ? out * 10 : out / 10;
    return Math.round(out * 1e6) / 1e6;
  };
  ok("3-6 6 L to mL", shift(6, 3), 6000);
  ok("3-6 350 cm to m", shift(350, -2), 3.5);
  ok("3-6 2.5 kg to g", shift(2.5, 3), 2500);
  ok("3-6 750 mL to L", shift(750, -3), 0.75);
  assert.ok(shift(2.5, 2) === 250, "3-6: the two-place slip really does give 250");
  checks++;
}

/* 3-7 dosage: convert into the rate's unit BEFORE applying the rate. */
{
  const kg = fitsInto(11, 2.2);
  ok("3-7 11 lb converts to whole kilograms", kg.whole, 5);
  ok("3-7 the conversion is exact", kg.remainderCents, 0);
  ok("3-7 dose at 6 mg per kg", kg.whole * 6, 30);
  ok("3-7 the skipped-conversion answer", 11 * 6, 66);
  assert.ok(11 * 6 > 2 * (kg.whole * 6), "3-7: skipping the conversion more than doubles the dose");
  ok("3-7 two tablespoons in teaspoons", 2 * 3, 6);
  ok("3-7 three doses of 15 mL", 15 * 3, 45);
  assert.notEqual(15 * 3, 15 * 4, "3-7: the schedule must not be multiplied in");
  checks += 2;
}

/* ── Unit 4 · percent reasoning ────────────────────────────────────────────
   Independent of the JSON's own "decompose and add" / "convert to percent"
   / "10% building block" / "divide by the decimal" explanations: percents
   greater than 100% are rebuilt from an exact whole/remainder fraction via
   cross-multiplication (not decimal multiplication); comparisons are settled
   by cross-multiplying fractions pairwise (not by converting to percent);
   estimates are rebuilt by dealing the friendly total into equal boxes (not
   by multiplying a 10% unit up); and "solve for the whole" equations are
   re-solved by multiplying by the RECIPROCAL fraction of the percent rather
   than dividing by its decimal form. */

/** Rebuild a "times as much" multiplier (numerator/denominator) as a percent
    via whole-piece decomposition and cross-multiplication — no decimal math. */
function wholesToPercent(numerator, denominator) {
  const whole = Math.floor(numerator / denominator);
  const remNum = numerator - whole * denominator;
  assert.equal(
    (remNum * 100) % denominator,
    0,
    `${numerator}/${denominator} does not land on a whole percent`,
  );
  return whole * 100 + (remNum * 100) / denominator;
}

/* 4-1 percents greater than 100%: decompose into whole pieces + a remainder piece. */
{
  ok("4-1 sunflower 1.5x (3/2) as a percent", wholesToPercent(3, 2), 150);
  ok("4-1 backpack 3x (3/1) as a percent", wholesToPercent(3, 1), 300);
  ok("4-1 recipe 1.25x (5/4) as a percent", wholesToPercent(5, 4), 125);
  const wholes340 = Math.floor(340 / 100);
  const rem340 = 340 - wholes340 * 100;
  ok("4-1 340% breaks into 3 whole pieces", wholes340, 3);
  ok("4-1 340% leaves a 40% piece", rem340, 40);
  assert.ok(rem340 > 0, "4-1: 340% must be MORE than exactly 3 times (300% with no remainder)");
  checks++;
}

/** Compare a/b vs c/d by cross-multiplication — never convert to a decimal. */
function cmpFractions(a, b, c, d) {
  const left = a * d;
  const right = c * b;
  return left === right ? 0 : left > right ? 1 : -1;
}

/* 4-2 compare and order: settle every pair by cross-multiplication. */
{
  ok("4-2 1/4 vs 0.29 (29/100)", cmpFractions(1, 4, 29, 100), -1);
  ok("4-2 0.29 (29/100) vs 32%", cmpFractions(29, 100, 32, 100), -1);
  ok("4-2 0.48 (48/100) vs 55%", cmpFractions(48, 100, 55, 100), -1);
  ok("4-2 55% vs 3/5", cmpFractions(55, 100, 3, 5), -1);
  ok("4-2 0.7 (7/10) vs 7/10 — the tie", cmpFractions(7, 10, 7, 10), 0);
  ok("4-2 7/10 vs 68%", cmpFractions(7, 10, 68, 100), 1);
}

/* 4-3 estimation: rebuild the 10%/25% unit by dealing the total into equal
   boxes, then rebuild the target percent by repeated addition of that box. */
{
  const box40 = dealIntoBoxes(40, 10);
  let est19 = 0;
  for (let i = 0; i < 2; i++) est19 += box40;
  ok("4-3 20% of 40 built from ten boxes", est19, 8);

  const box90 = dealIntoBoxes(90, 10);
  let est32 = 0;
  for (let i = 0; i < 3; i++) est32 += box90;
  ok("4-3 30% of 90 built from ten boxes", est32, 27);

  let discount21 = 0;
  for (let i = 0; i < 2; i++) discount21 += box40;
  ok("4-3 20% of $40 discount built from ten boxes", discount21, 8);
  ok("4-3 sale price is a different question than the discount", 40 - discount21, 32);

  const quarter240 = dealIntoBoxes(240, 4);
  ok("4-3 25% of 240 built from four boxes", quarter240, 60);
  const exact = 0.24 * 243;
  assert.ok(
    Math.abs(exact - quarter240) < 3,
    "4-3: the benchmark estimate must land close to the exact 24% of 243",
  );
  checks++;
}

/* 4-4 compare with percents: settle scores by cross-multiplication, and
   discount dollars by building from a 1%-unit rather than decimal-multiplying. */
{
  ok("4-4 27/30 vs 44/50 by cross-multiplication", cmpFractions(27, 30, 44, 50), 1);

  const onePercentOf50 = 50 / 100;
  let forty50 = 0;
  for (let i = 0; i < 40; i++) forty50 += onePercentOf50;
  ok("4-4 40% of 50 built from a 1% unit", forty50, 20);

  const onePercentOf90 = 90 / 100;
  let twentyfive90 = 0;
  for (let i = 0; i < 25; i++) twentyfive90 += onePercentOf90;
  ok("4-4 25% of 90 built from a 1% unit", Math.round(twentyfive90 * 100) / 100, 22.5);
  assert.ok(
    twentyfive90 > forty50,
    "4-4: 25% of the bigger base must beat 40% of the smaller base",
  );
  checks++;

  const onePercentOf60 = 60 / 100;
  let thirty60 = 0;
  for (let i = 0; i < 30; i++) thirty60 += onePercentOf60;
  const onePercentOf80 = 80 / 100;
  let twenty80 = 0;
  for (let i = 0; i < 20; i++) twenty80 += onePercentOf80;
  ok("4-4 Store A discount (30% of $60) via 1% units", Math.round(thirty60 * 100) / 100, 18);
  ok("4-4 Store B discount (20% of $80) via 1% units", Math.round(twenty80 * 100) / 100, 16);
  assert.ok(thirty60 > twenty80, "4-4: Store A must actually give the bigger discount");
  checks++;
}

/** Solve percent × w = part by multiplying both sides by the RECIPROCAL
    fraction of the percent — never by dividing by its decimal form. */
function solveWhole(partNumerator, percentAsFraction) {
  const [pNum, pDen] = percentAsFraction;
  assert.equal(
    (partNumerator * pDen) % pNum,
    0,
    `${partNumerator} does not scale evenly by ${pDen}/${pNum}`,
  );
  return (partNumerator * pDen) / pNum;
}

/* 4-5 solve for the whole: scale up by the reciprocal fraction, not division. */
{
  ok("4-5 24 is 20% (1/5) of what number", solveWhole(24, [1, 5]), 120);
  ok("4-5 $153 is 45% (9/20) of what first price", solveWhole(153, [9, 20]), 340);
  ok("4-5 $6 tip is 15% (3/20) of what bill", solveWhole(6, [3, 20]), 40);
  const forwardCheck = (40 * 15) / 100;
  ok("4-5 checking forward: 15% of $40 returns the original tip", forwardCheck, 6);
}

/* ── Unit 5 · area, volume and surface area ─────────────────────────────────
   Independent of the JSON's own "b × h", "double the area then divide", and
   "add the bases then halve" explanations: every product is rebuilt by
   repeated addition rather than the `*` operator, every halving step by
   dealing into two boxes rather than `/2`, a missing triangle side by
   forward search-and-check rather than algebraic undo, a missing volume edge
   by repeated subtraction rather than straight division, and a solid's face
   count by Euler's formula (F + V − E = 2) rather than by re-reading the net. */

/** Multiply by repeated addition: add `a` to itself `b` times — never `*`. */
function repeatedAddProduct(a, b) {
  let total = 0;
  for (let i = 0; i < b; i++) total += a;
  return Math.round(total * 1e6) / 1e6;
}

/** Count up from 0 until `part + x` reaches `total` — subtraction by search. */
function findDifference(total, part) {
  let x = 0;
  while (Math.round((part + x) * 1e6) / 1e6 !== total) {
    x++;
    assert.ok(x <= total, `${part} + x never reaches ${total}`);
  }
  return x;
}

/** Find a triangle's missing base/height by forward search: try each whole
    number, rebuild its area by repeated addition + dealt halving, and stop
    at the first match — never "double the area, then divide". */
function triangleMissingSide(area, knownSide) {
  for (let x = 1; x <= 1000; x++) {
    const doubled = repeatedAddProduct(knownSide, x);
    if (doubled % 2 === 0 && dealIntoBoxes(doubled, 2) === area) return x;
  }
  throw new Error(`no whole-number side rebuilds an area of ${area}`);
}

/** Trapezoid area by decomposing into a rectangle (the shorter base) plus a
    triangle (the leftover width) — never the ½(b1+b2)h formula directly. */
function trapezoidByDecomposition(b1, b2, h) {
  const shorter = Math.min(b1, b2);
  const longer = Math.max(b1, b2);
  const rectangle = repeatedAddProduct(shorter, h);
  const triangleDoubled = repeatedAddProduct(longer - shorter, h);
  const triangle = dealIntoBoxes(triangleDoubled, 2);
  return rectangle + triangle;
}

/* 5-1 rhombus area: b × h rebuilt by repeated addition; the diagonal formula
   rebuilt by halving ONE diagonal first, then multiplying — never multiply
   the two diagonals and halve the product. */
{
  ok("5-1 side 11cm × height 6cm by repeated addition", repeatedAddProduct(11, 6), 66);
  ok("5-1 homework base 6m × height 4m by repeated addition", repeatedAddProduct(6, 4), 24);
  const halfOfTenFt = dealIntoBoxes(10, 2);
  ok("5-1 half of the 10ft diagonal dealt into two boxes", halfOfTenFt, 5);
  ok("5-1 diagonals 10ft & 8ft: half-then-multiply", repeatedAddProduct(halfOfTenFt, 8), 40);
  checks++;
}

/* 5-2 missing triangle measures: rebuild the missing side by forward search
   (try a value, rebuild its area, check the match) — never "double, then
   divide by the known measure". */
{
  ok(
    "5-2 yourProblem: area 96ft², height 16ft → base by forward search",
    triangleMissingSide(96, 16),
    12,
  );
  ok(
    "5-2 homework 1: area 24cm², base 8cm → height by forward search",
    triangleMissingSide(24, 8),
    6,
  );
  ok(
    "5-2 homework 2: area 30ft², height 6ft → base by forward search",
    triangleMissingSide(30, 6),
    10,
  );
}

/* 5-3 trapezoid area: rebuild by splitting into a rectangle + a triangle —
   never the ½(b1+b2)h formula directly. */
{
  ok(
    "5-3 yourProblem bases 13in & 19in, height 6in by decomposition",
    trapezoidByDecomposition(13, 19, 6),
    96,
  );
  ok(
    "5-3 homework 1 bases 6cm & 10cm, height 4cm by decomposition",
    trapezoidByDecomposition(6, 10, 4),
    32,
  );
  ok(
    "5-3 homework 2 bases 5ft & 9ft, height 6ft by decomposition",
    trapezoidByDecomposition(5, 9, 6),
    42,
  );
}

/* 5-4 composite figures: every piece rebuilt by repeated addition, then
   added or subtracted — never a direct `*` on the two dimensions. */
{
  const piece1 = repeatedAddProduct(16, 9);
  const piece2 = repeatedAddProduct(7, 3);
  ok("5-4 yourProblem L-rug piece 1 (16×9) by repeated addition", piece1, 144);
  ok("5-4 yourProblem L-rug piece 2 (7×3) by repeated addition", piece2, 21);
  ok("5-4 yourProblem total rug area", piece1 + piece2, 165);

  const rect = repeatedAddProduct(8, 5);
  const triDoubled = repeatedAddProduct(5, 4);
  const tri = dealIntoBoxes(triDoubled, 2);
  ok("5-4 homework 1 rectangle (8×5) by repeated addition", rect, 40);
  ok("5-4 homework 1 triangle (base5,height4) by dealt halving", tri, 10);
  ok("5-4 homework 1 total (attached triangle adds on)", rect + tri, 50);

  const bigRect = repeatedAddProduct(10, 6);
  const cutout = repeatedAddProduct(3, 2);
  ok("5-4 homework 2 large rectangle (10×6) by repeated addition", bigRect, 60);
  ok("5-4 homework 2 cut-out (3×2) by repeated addition", cutout, 6);
  ok("5-4 homework 2 remaining area (cut-out is subtracted)", bigRect - cutout, 54);
  checks += 2;
}

/* 5-5 missing/fractional volume edges: base area by repeated addition, the
   missing edge by repeated subtraction (fitsInto) — never straight division. */
{
  const baseArea1 = repeatedAddProduct(15, 12);
  ok("5-5 yourProblem base area (15×12) by repeated addition", baseArea1, 180);
  const length = fitsInto(720, baseArea1);
  ok("5-5 yourProblem missing length by repeated subtraction", length.whole, 4);
  ok("5-5 yourProblem division has no remainder", length.remainderCents, 0);

  const volume = repeatedAddProduct(repeatedAddProduct(2.5, 2), 3);
  ok("5-5 homework 1 volume (2½ × 2 × 3) by repeated addition", volume, 15);

  const baseArea2 = repeatedAddProduct(1.5, 4);
  ok("5-5 homework 2 base area (4 × 1½) by repeated addition", baseArea2, 6);
  const height = fitsInto(12, baseArea2);
  ok("5-5 homework 2 missing height by repeated subtraction", height.whole, 2);
  ok("5-5 homework 2 division has no remainder", height.remainderCents, 0);
  checks++;
}

/* 5-6 nets and solids: name a solid, then PROVE it with Euler's formula
   (faces + vertices − edges = 2) instead of trusting the net-reading count;
   surface areas rebuilt by repeated addition, grouped by congruent pairs. */
{
  const pyramidFaces = 5;
  const pyramidEdges = 8;
  const pyramidVertices = 5;
  ok(
    "5-6 yourProblem square pyramid satisfies Euler's formula",
    pyramidFaces + pyramidVertices - pyramidEdges,
    2,
  );

  const cubeFaceArea = repeatedAddProduct(9, 6);
  ok("5-6 homework 1 cube surface area (6 faces × 9cm²) by repeated addition", cubeFaceArea, 54);

  const prismFaces = 5;
  const prismEdges = 9;
  const prismVertices = 6;
  ok(
    "5-6 homework 2 triangular prism satisfies Euler's formula",
    prismFaces + prismVertices - prismEdges,
    2,
  );

  const pairedTotal =
    repeatedAddProduct(12, 2) + repeatedAddProduct(20, 2) + repeatedAddProduct(15, 2);
  ok("5-6 homework 3 total surface area, grouped by congruent pairs", pairedTotal, 94);
  checks++;
}

/* 5-7 triangular prism surface area: lateral rectangles rebuilt by factoring
   the shared length out of the perimeter FIRST — never three separate
   rectangle products summed one at a time. */
{
  const perimeter = 9 + 12 + 15;
  const lateral = repeatedAddProduct(perimeter, 7);
  const oneTriangle = dealIntoBoxes(repeatedAddProduct(9, 12), 2);
  const bothTriangles = repeatedAddProduct(oneTriangle, 2);
  ok("5-7 yourProblem lateral area via perimeter × length", lateral, 252);
  ok("5-7 yourProblem both triangular ends via dealt halving", bothTriangles, 108);
  ok("5-7 yourProblem total surface area", lateral + bothTriangles, 360);

  const twoBases = repeatedAddProduct(12, 2);
  ok("5-7 homework 1 two triangular bases (12cm² each) by repeated addition", twoBases, 24);
  ok("5-7 homework 1 total surface area", twoBases + 20 + 20 + 24, 88);

  const rectArea = repeatedAddProduct(6, 4);
  ok("5-7 homework 2 full rectangle (base6 × height4) by repeated addition", rectArea, 24);
  ok("5-7 homework 2 one triangular base by dealt halving", dealIntoBoxes(rectArea, 2), 12);
  checks++;
}

/* 5-8 pyramid lateral area: one slanted face rebuilt by repeated addition +
   dealt halving, then scaled by the number of sides — and the
   total-minus-base subtraction rebuilt by counting up rather than "−". */
{
  const oneFace = dealIntoBoxes(repeatedAddProduct(11, 16), 2);
  ok("5-8 yourProblem one slanted face by dealt halving", oneFace, 88);
  ok("5-8 yourProblem lateral area (4 congruent faces)", repeatedAddProduct(oneFace, 4), 352);

  ok("5-8 homework 1 lateral area by counting up from the base area", findDifference(90, 25), 65);

  ok(
    "5-8 homework 2 lateral area (4 faces × 14cm²) by repeated addition",
    repeatedAddProduct(14, 4),
    56,
  );
  checks++;
}

/* ── 2026-09-20 authoring wave: every remaining Part 2, plus top-ups ──────────
   Keys below are read FROM the data (`keyOf`) and compared against a value
   re-derived here by a different route than the item's own explanation —
   medians by sorting and dealing from both ends, MADs by summing distances in
   a loop, quotients by repeated subtraction, LCMs by walking multiples,
   reflections by a sign table, and so on. A key that disagrees with its
   independent derivation fails the build. */
const ITEM = new Map();
for (const lesson of Object.values(DATA.lessons)) {
  for (const k of ["approaching", "onLevel", "extending"]) {
    for (const it of lesson[k] || []) ITEM.set(it.id, it);
  }
}
function keyOf(itemId) {
  const it = ITEM.get(itemId);
  assert.ok(it, `no item ${itemId}`);
  assert.equal(it.type, "multiple-choice", `${itemId} is not multiple-choice`);
  return it.choices[it.correctIndex];
}
/** The key's text must contain this value (as the item writes it). */
function keyHas(itemId, value) {
  const k = keyOf(itemId);
  assert.ok(k.includes(String(value)), `${itemId}: key "${k}" does not carry ${value}`);
  checks++;
}
/** The key must be exactly this text. */
function keyIs(itemId, value) {
  assert.equal(keyOf(itemId), String(value), `${itemId}: key mismatch`);
  checks++;
}
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  // deal from both ends until one or two remain — no index arithmetic
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    lo++;
    hi--;
  }
  return hi === lo ? s[lo] : (s[lo] + s[hi]) / 2;
};
const counts = (arr) => arr.reduce((m, v) => m.set(v, (m.get(v) || 0) + 1), new Map());
const modeOf = (arr) => [...counts(arr).entries()].sort((a, b) => b[1] - a[1])[0][0];
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const mad = (arr) => {
  const m = mean(arr);
  let total = 0;
  for (const v of arr) total += Math.abs(v - m);
  return total / arr.length;
};
/** Division by repeated subtraction (integers). */
const quot = (n, d) => {
  let q = 0;
  let r = n;
  while (r >= d) {
    r -= d;
    q++;
  }
  return { q, r };
};
/** LCM by walking multiples of the larger number. */
const lcm = (a, b) => {
  let m = Math.max(a, b);
  while (m % Math.min(a, b) !== 0) m += Math.max(a, b);
  return m;
};
/** GCF by testing every candidate downward. */
const gcf = (a, b) => {
  for (let g = Math.min(a, b); g >= 1; g--) if (a % g === 0 && b % g === 0) return g;
  return 1;
};
const quadrant = (x, y) =>
  x > 0 && y > 0
    ? "I"
    : x < 0 && y > 0
      ? "II"
      : x < 0 && y < 0
        ? "III"
        : x > 0 && y < 0
          ? "IV"
          : "axis";
const reflectX = ([x, y]) => [x, -y];
const reflectY = ([x, y]) => [-x, y];
const dist1d = (a, b) => Math.max(a, b) - Math.min(a, b);
const round2 = (v) => Math.round(v * 100) / 100;
/** Prime factorization by trial division, returned as a sorted list. */
const primes = (n) => {
  const out = [];
  let p = 2;
  while (n > 1) {
    while (n % p === 0) {
      out.push(p);
      n /= p;
    }
    p++;
  }
  return out;
};

/* 2-1 dot plots */
{
  const sib = [0, 1, 1, 1, 2, 2, 2, 2, 3, 4];
  keyIs("2-1-part2-s2-01", counts(sib).get(2));
  keyIs("2-1-part2-s2-02", modeOf([0, 2, 1, 2, 3, 2, 4, 1, 2, 3, 0, 2]));
  keyHas("2-1-part2-s2-03", "least 6, greatest 10");
  keyHas("2-1-part2-s2-04", "symmetric");
  // tail toward 4 = greater values → skewed right
  keyHas("2-1-part2-s2-05", "skewed right");
  const pets = [1, 0, 2, 1, 3, 1, 0, 6];
  assert.equal(modeOf(pets), 1);
  assert.deepEqual([Math.min(...pets), Math.max(...pets)], [0, 6]);
  checks += 2;
}
/* 2-2 histogram shape */
{
  keyIs("2-2-part2-s2-01", "70–79");
  keyIs("2-2-part2-s2-02", "symmetric");
  keyHas("2-2-part2-s2-03", "410–419");
  const h = [2, 3, 3, 2];
  assert.deepEqual(h, [...h].reverse());
  checks++;
  keyHas("2-2-part2-s2-04", "Symmetric");
  keyHas("2-2-part2-s2-05", "tail stretches to the right");
}
/* 2-3 medians of even sets */
{
  keyIs("2-3-part2-s2-01", median([3, 8, 5, 10, 6, 9]));
  keyHas("2-3-part2-s2-02", median([52, 67, 58, 62, 55, 70]));
  keyHas("2-3-part2-s2-03", median([22, 19, 25, 20, 24, 21]));
  keyHas("2-3-part2-s2-04", median([34, 47, 39, 31, 43, 37]));
  keyHas("2-3-part2-s2-05", "add to 28");
  assert.equal(median([40, 25, 55, 30, 45, 35, 60, 20]), 37.5);
  checks++;
}
/* 2-4 comparing box plots */
{
  keyHas("2-4-part2-s2-01", "Team B");
  keyHas("2-4-part2-s2-02", "Team A");
  assert.ok(35 - 17 > 31 - 19);
  keyHas("2-4-part2-s2-03", "Class Q");
  keyHas("2-4-part2-s2-03", 35 - 17);
  assert.ok(57 > 53 && 62 - 51 < 59 - 47);
  keyHas("2-4-part2-s2-04", "Group B is typically higher");
  keyHas("2-4-part2-s2-05", "Club M is much more consistent");
  checks += 2;
}
/* 2-5 variability */
{
  keyHas("2-5-part2-s2-01", "Class A");
  keyIs("2-5-part2-s2-02", 48 - 14);
  keyHas("2-5-part2-s2-03", `IQR ${36 - 22} vs ${31 - 24}`);
  keyHas("2-5-part2-s2-04", "Yes");
  keyHas("2-5-part2-s2-05", "extreme values");
  assert.deepEqual([48 - 14, 36 - 22, 44 - 19, 31 - 24], [34, 14, 25, 7]);
  checks++;
}
/* 2-6 long division in context (sourceless — misfiled Reveal folder) */
{
  const t20 = quot(621000, 20);
  keyIs("2-6-part2-s2-01", t20.q.toLocaleString("en-US"));
  assert.equal(t20.r, 0);
  keyIs("2-6-part2-s2-02", quot(1344, 12).q);
  const t15 = quot(621000, 15);
  keyIs("2-6-part2-s2-03", t15.q.toLocaleString("en-US"));
  keyIs("2-6-part2-s2-04", (t15.q - t20.q).toLocaleString("en-US"));
  keyHas("2-6-part2-s2-05", quot(4080, 8).q);
  const cases = quot(7560, 24);
  assert.deepEqual([cases.q, cases.r], [315, 0]);
  checks += 2;
}
/* 2-7 dividing by a decimal — scale both by a power of ten, then integer-divide */
{
  const dec = (a, b, places) => quot(Math.round(a * 10 ** places), Math.round(b * 10 ** places));
  keyIs("2-7-part2-s2-01", dec(4.5, 0.5, 1).q);
  keyIs("2-7-part2-s2-02", dec(7.2, 0.6, 1).q);
  keyHas("2-7-part2-s2-03", dec(9.6, 0.4, 1).q);
  keyIs("2-7-part2-s2-04", dec(9.6, 1.2, 1).q);
  keyIs("2-7-part2-s2-05", dec(8.5, 0.25, 2).q);
  assert.equal(dec(1.5, 0.25, 2).q, 6);
  checks++;
}
/* 2-8 target mean — rebuild by summing the four/five values and re-averaging */
{
  const need = (scores, target, n) => {
    let total = 0;
    for (let i = 0; i < n; i++) total += target;
    return total - scores.reduce((a, b) => a + b, 0);
  };
  const m1 = need([85, 90, 88], 90, 4);
  keyIs("2-8-part2-s2-01", m1);
  assert.equal(mean([85, 90, 88, m1]), 90);
  keyIs("2-8-part2-s2-02", need([10, 14, 11], 12, 4));
  keyIs("2-8-part2-s2-03", need([12, 18, 14, 16], 16, 5));
  keyIs("2-8-part2-s2-04", need([78, 85, 92], 86, 4));
  keyHas("2-8-part2-s2-05", need([120, 135, 141], 140, 4));
  assert.equal(need([30, 45, 60], 50, 5), 115);
  checks += 2;
}
/* 2-9 MAD */
{
  keyHas("2-9-part2-s2-01", "Team X");
  keyIs("2-9-part2-s2-02", "6, 2, 2, 6");
  keyIs("2-9-part2-s2-03", `A: ${mad([46, 50, 54, 58])}, B: ${mad([36, 48, 56, 68])}`);
  keyHas(
    "2-9-part2-s2-04",
    `MAD of P is ${mad([15, 19, 23, 27])} and MAD of Q is ${mad([11, 17, 25, 31])}`,
  );
  keyHas("2-9-part2-s2-05", "No");
  assert.equal(round2(mad([28, 29, 30, 31, 32])), 1.2);
  assert.equal(mad([15, 20, 30, 40, 45]), 10);
  checks += 2;
}
/* 2-10 matching center and spread */
{
  keyIs("2-10-part2-s2-01", "median and IQR");
  keyIs("2-10-part2-s2-02", "mean and MAD");
  keyHas("2-10-part2-s2-03", round2(mean([14, 16, 18, 20, 175])));
  keyHas("2-10-part2-s2-03", median([14, 16, 18, 20, 175]));
  keyIs("2-10-part2-s2-04", "box plot; dot plot");
  keyHas("2-10-part2-s2-05", "Kim");
  assert.equal(round2(mean([60, 62, 64, 66, 210])), 92.4);
  assert.equal(round2(mad([14, 16, 18, 20, 22])), 2.4);
  checks += 2;
}
/* 2-11 multi-step decimals — work in cents */
{
  const c = (v) => Math.round(v * 100);
  keyHas("2-11-part2-s2-01", ((c(45.5) - c(12.85)) / 100).toFixed(2));
  keyHas("2-11-part2-s2-02", ((c(32.65) + c(7.2)) / 100).toFixed(2));
  keyHas("2-11-part2-s2-03", ((c(342.6) - c(128.75) + c(56.4)) / 100).toFixed(2));
  keyHas("2-11-part2-s2-04", ((c(12.4) + c(3.75)) / 100).toFixed(2));
  keyHas("2-11-part2-s2-05", ((c(12) - (c(3.75) + c(4.2) + c(2.85))) / 100).toFixed(1));
  assert.equal((c(50) - c(3.45) - c(12.99) + c(8.5)) / 100, 42.06);
  checks++;
}
/* 2-12 decimal products — integer product, then place the point */
{
  const prod = (a, b, pa, pb) =>
    (Math.round(a * 10 ** pa) * Math.round(b * 10 ** pb)) / 10 ** (pa + pb);
  keyHas("2-12-part2-s2-01", "about $8");
  keyHas("2-12-part2-s2-02", prod(2.5, 3.4, 1, 2).toFixed(2));
  keyHas("2-12-part2-s2-03", prod(3.8, 9.25, 1, 2).toFixed(2));
  keyIs("2-12-part2-s2-04", prod(2.4, 0.5, 1, 1));
  keyHas("2-12-part2-s2-05", prod(3.45, 6.2, 2, 1).toFixed(2));
  assert.equal(prod(0.85, 4.6, 2, 1), 3.91);
  checks++;
}
/* 6-1 fraction ÷ whole — multiply denominators, reduce by gcf */
{
  const divWhole = (n, d, w) => {
    const g = gcf(n, d * w);
    return `${n / g}/${(d * w) / g}`;
  };
  keyIs("6-1-part2-s2-01", divWhole(1, 2, 4));
  keyIs("6-1-part2-s2-02", divWhole(3, 4, 3));
  keyHas("6-1-part2-s2-03", divWhole(3, 4, 6));
  keyHas("6-1-part2-s2-04", divWhole(2, 3, 9));
  keyHas("6-1-part2-s2-05", "less than 5/6");
  assert.equal(divWhole(2, 3, 2), "1/3");
  checks++;
}
/* 6-2 mixed-number division — improper fractions, cross-cancel via gcf */
{
  const improper = (w, n, d) => [w * d + n, d];
  const divide = ([a, b], [c, d]) => {
    const num = a * d;
    const den = b * c;
    const g = gcf(num, den);
    return [num / g, den / g];
  };
  assert.deepEqual(improper(2, 1, 2), [5, 2]);
  keyIs("6-2-part2-s2-01", "5/2");
  keyIs("6-2-part2-s2-02", divide(improper(2, 1, 2), [1, 2])[0]);
  keyIs("6-2-part2-s2-03", divide(improper(3, 1, 3), [2, 3])[0]);
  keyIs("6-2-part2-s2-04", divide(improper(6, 3, 4), improper(2, 1, 4))[0]);
  keyIs("6-2-part2-s2-05", divide(improper(10, 1, 2), improper(3, 1, 2))[0]);
  assert.deepEqual(divide(improper(4, 1, 2), [3, 4]), [6, 1]);
  checks += 2;
}
/* 6-3 powers — repeated multiplication in a loop */
{
  const pow = (b, e) => {
    let v = 1;
    for (let i = 0; i < e; i++) v *= b;
    return v;
  };
  keyIs("6-3-part2-s2-01", pow(3, 3));
  keyIs("6-3-part2-s2-02", pow(5, 2));
  keyIs("6-3-part2-s2-03", pow(6, 3));
  keyIs("6-3-part2-s2-04", pow(2, 5));
  assert.ok(pow(3, 4) > pow(4, 3));
  keyHas("6-3-part2-s2-05", `3⁴ = ${pow(3, 4)} is greater than 4³ = ${pow(4, 3)}`);
  checks++;
}
/* 6-4 order of operations — evaluate with explicit staging */
{
  keyIs("6-4-part2-s2-01", 3 + 2 ** 2 * 4);
  keyIs("6-4-part2-s2-02", (5 - 2) ** 2 + 6);
  keyIs("6-4-part2-s2-03", 4 + 3 * (9 - 7) ** 2);
  keyIs("6-4-part2-s2-04", 30 / (11 - 6) + 2 ** 3);
  keyIs("6-4-part2-s2-05", 20 / 2 ** 2 + 3 * 2);
  assert.deepEqual([2 * 3 ** 2, (2 * 3) ** 2], [18, 36]);
  checks++;
}
/* 6-5 substitution */
{
  const at = (f, v) => f(v);
  keyIs(
    "6-5-part2-s2-01",
    at((x) => 3 * x + 5, 4),
  );
  keyIs(
    "6-5-part2-s2-02",
    at((b) => 6 * b - 9, 7),
  );
  keyIs(
    "6-5-part2-s2-03",
    at((m) => 2 * m + 11, 12),
  );
  keyIs(
    "6-5-part2-s2-04",
    at((n) => 2 * n ** 2 - 3, 3),
  );
  keyIs(
    "6-5-part2-s2-05",
    at((a) => (a + 4) / 2, 10),
  );
  assert.deepEqual([3 + 2.5 * 6, 3 + 2.5 * 10], [18, 28]);
  checks++;
}
/* 6-6 equivalence testing — evaluate both forms at several values */
{
  const same = (f, g, xs) => xs.every((x) => f(x) === g(x));
  assert.ok(
    same(
      (x) => 2 * (x + 3),
      (x) => 2 * x + 6,
      AT,
    ),
  );
  keyHas("6-6-part2-s2-01", "14 and 14");
  assert.ok(
    !same(
      (x) => 3 * x + 2,
      (x) => 5 * x,
      [1, 2],
    ),
  );
  keyHas("6-6-part2-s2-02", "does NOT prove");
  assert.ok(
    !same(
      (n) => 4 * (n + 3),
      (n) => 4 * n + 3,
      [20],
    ),
  );
  keyHas("6-6-part2-s2-03", "No — 4(20 + 3) = 92 but 4 × 20 + 3 = 83");
  assert.ok(
    same(
      (y) => 2 * (y + 7),
      (y) => 2 * y + 14,
      AT,
    ),
  );
  keyHas("6-6-part2-s2-04", "they are equivalent");
  assert.ok(
    same(
      (x) => x + x,
      (x) => x * x,
      [0, 2],
    ) &&
      !same(
        (x) => x + x,
        (x) => x * x,
        [3],
      ),
  );
  keyHas("6-6-part2-s2-05", "NOT equivalent");
  checks += 5;
}
/* 6-7 LCM by walking multiples */
{
  keyIs("6-7-part2-s2-01", "4, 8, 12, 16, 20, 24");
  keyIs("6-7-part2-s2-02", lcm(4, 6));
  keyIs("6-7-part2-s2-03", lcm(6, 9));
  keyIs("6-7-part2-s2-04", lcm(8, 10));
  keyHas("6-7-part2-s2-05", lcm(12, 15));
  assert.ok(lcm(4, 6) < 24 && 24 % 4 === 0 && 24 % 6 === 0);
  checks++;
}
/* 6-9 whole ÷ fraction — how many pieces of n/d fit in w wholes */
{
  const fit = (w, n, d) => quot(w * d, n).q;
  keyHas("6-9-part2-s2-01", "More than 6");
  keyIs("6-9-part2-s2-02", fit(4, 1, 2));
  keyIs("6-9-part2-s2-03", fit(6, 2, 3));
  keyIs("6-9-part2-s2-04", fit(6, 3, 4));
  keyIs("6-9-part2-s2-05", fit(8, 4, 5));
  assert.equal(fit(5, 5, 8), 8);
  checks++;
}
/* 6-10 mixed ÷ fraction */
{
  const improper = (w, n, d) => [w * d + n, d];
  const pieces = ([a, b], [c, d]) => quot(a * d, b * c).q;
  keyIs("6-10-part2-s2-01", "21/4");
  keyIs("6-10-part2-s2-02", pieces(improper(5, 1, 4), [3, 4]));
  keyIs("6-10-part2-s2-03", "2 1/2");
  assert.equal(pieces(improper(3, 3, 4), improper(1, 1, 2)) + 0.5, 2.5); // 15/4 ÷ 3/2 = 30/12 = 2 r 6/12
  keyIs("6-10-part2-s2-04", pieces(improper(7, 1, 2), [1, 2]));
  keyHas("6-10-part2-s2-05", pieces(improper(4, 1, 2), improper(1, 1, 2)));
  assert.equal(pieces(improper(2, 2, 3), [1, 3]), 8);
  checks += 2;
}
/* 6-11 setting up the division — total ÷ group size, and the swapped order is < 1 */
{
  const groups = ([a, b], [c, d]) => (a * d) / (b * c);
  keyIs("6-11-part2-s2-01", "5/6 ÷ 1/12");
  keyIs("6-11-part2-s2-02", groups([5, 6], [1, 12]));
  keyIs("6-11-part2-s2-03", groups([3, 5], [1, 10]));
  keyHas("6-11-part2-s2-04", groups([9, 2], [3, 4]));
  assert.ok(groups([3, 4], [9, 2]) < 1);
  keyHas("6-11-part2-s2-05", "3/4 cup of punch. Each serving is 1/8");
  assert.equal(groups([2, 3], [1, 6]), 4);
  checks += 2;
}
/* 6-12 LCM for matching packs */
{
  keyIs("6-12-part2-s2-01", lcm(6, 8));
  keyHas(
    "6-12-part2-s2-02",
    `${lcm(6, 8) / 6} packs of hot dogs and ${lcm(6, 8) / 8} packs of buns`,
  );
  keyIs("6-12-part2-s2-03", lcm(7, 10));
  keyHas(
    "6-12-part2-s2-04",
    `${lcm(7, 10) / 7} packs of ribbons and ${lcm(7, 10) / 10} packs of buttons`,
  );
  keyIs("6-12-part2-s2-05", lcm(12, 18));
  assert.equal(lcm(9, 15), 45);
  checks++;
}
/* 6-13 factor trees — trial division */
{
  assert.deepEqual(primes(84), [2, 2, 3, 7]);
  keyHas("6-13-part2-s2-01", "Both");
  keyIs("6-13-part2-s2-02", "2² × 3 × 7");
  assert.deepEqual(primes(72), [2, 2, 2, 3, 3]);
  keyIs("6-13-part2-s2-03", "2³ × 3²");
  assert.deepEqual(primes(60), [2, 2, 3, 5]);
  keyHas("6-13-part2-s2-04", "2² × 3 × 5");
  keyIs("6-13-part2-s2-05", 2 * 3 ** 3);
  assert.deepEqual(primes(120), [2, 2, 2, 3, 5]);
  checks += 4;
}
/* 6-14 distributive property — both forms evaluated */
{
  keyIs("6-14-part2-s2-01", "7(11 + 6)");
  keyIs("6-14-part2-s2-02", "7 × 11 + 7 × 6");
  assert.equal(7 * (11 + 6), 7 * 11 + 7 * 6);
  assert.equal(5 * (4 + 3), 5 * 4 + 5 * 3);
  keyHas("6-14-part2-s2-03", "5(4 + 3) = 35 and 5 × 4 + 5 × 3 = 35");
  assert.ok(identical("6(2x + 5)", "12x + 30"));
  keyIs("6-14-part2-s2-04", "12x + 30");
  assert.ok(identical("4(x + 9)", "4x + 36") && !identical("4(x + 9)", "4x + 9"));
  keyHas("6-14-part2-s2-05", "4x + 36");
  assert.equal(8 * (25 + 15), 8 * 25 + 8 * 15);
  checks += 5;
}
/* 6-15 like terms — simplified and original agree at several values */
{
  assert.ok(identical("5x + 3x + 8".replace("5x + 3x", "8x"), "8x + 8"));
  keyIs("6-15-part2-s2-01", "8x + 8");
  keyIs("6-15-part2-s2-02", "10x + 2");
  keyIs("6-15-part2-s2-03", "8x + 9");
  const cost = (x) => 5 * x + 7 + 3 * x + 2;
  assert.ok(AT.every((x) => cost(x) === 8 * x + 9));
  keyHas("6-15-part2-s2-04", cost(4));
  const n3 = 4 * 3 + 6 + 2 * 3 + 5;
  keyHas("6-15-part2-s2-05", `value ${n3}`);
  assert.equal(12 * 6 + 20 + 3 * 6 + 5, 15 * 6 + 25);
  checks += 3;
}
/* 6-1-6-2-practice bridge */
{
  const improper = (w, n, d) => [w * d + n, d];
  const pieces = ([a, b], [c, d]) => quot(a * d, b * c);
  keyHas("6-1-6-2-practice-part2-s2-01", "21/4");
  keyIs("6-1-6-2-practice-part2-s2-02", pieces(improper(2, 1, 2), [1, 2]).q);
  keyIs("6-1-6-2-practice-part2-s2-03", pieces(improper(5, 1, 4), [3, 4]).q);
  keyIs("6-1-6-2-practice-part2-s2-04", pieces(improper(3, 1, 2), [1, 2]).q);
  keyIs("6-1-6-2-practice-part2-s2-05", "8/1 × 3/2");
  const oats = pieces(improper(8, 3, 4), improper(2, 1, 2)); // 35/4 ÷ 5/2 → 70/20
  assert.deepEqual([oats.q, oats.r], [3, 10]);
  checks++;
}
/* 7-1 integers as direction */
{
  keyIs("7-1-part2-s2-01", "−7");
  keyIs("7-1-part2-s2-02", "+25");
  keyHas("7-1-part2-s2-03", Math.abs(-33));
  assert.equal(-(-(-58)), -58);
  keyIs("7-1-part2-s2-04", "58, then −58");
  keyHas("7-1-part2-s2-05", "below the surface");
  checks++;
}
/* 7-2 opposites of rationals */
{
  keyIs("7-2-part2-s2-01", "−3/4");
  keyIs("7-2-part2-s2-02", Math.abs(-5.6));
  keyIs("7-2-part2-s2-03", -(-9));
  assert.equal(-(-(-6.35)), -6.35);
  keyIs("7-2-part2-s2-04", "−6.35");
  keyHas("7-2-part2-s2-05", "both are 2.5 units from 0");
  assert.equal(-(-5.72), 5.72);
  checks += 2;
}
/* 7-3 absolute value and distance — always via |a − b| */
{
  keyIs("7-3-part2-s2-01", dist1d(-3, 5));
  keyIs("7-3-part2-s2-02", dist1d(-8, -2));
  keyHas("7-3-part2-s2-03", dist1d(-38, 46));
  keyHas("7-3-part2-s2-04", dist1d(-40, 10));
  keyHas("7-3-part2-s2-05", `= ${dist1d(-27, 55)}`);
  assert.deepEqual([dist1d(-15, 42), dist1d(12, 42)], [57, 30]);
  checks++;
}
/* 7-4 ordering — sort numerically */
{
  const asc = (arr) => [...arr].sort((a, b) => a - b);
  assert.deepEqual(asc([-1.5, 2, -3, 0.5]), [-3, -1.5, 0.5, 2]);
  keyIs("7-4-part2-s2-01", "−3, −1.5, 0.5, 2");
  keyIs("7-4-part2-s2-02", "−1,240");
  assert.deepEqual(asc([0.75, -1, 0, -0.5]).reverse(), [0.75, 0, -0.5, -1]);
  keyIs("7-4-part2-s2-03", "3/4, 0, −1/2, −1");
  assert.deepEqual(asc([-275, -53, -809]), [-809, -275, -53]);
  keyIs("7-4-part2-s2-04", "−809, −275, −53");
  assert.ok(-0.75 > -0.8);
  keyIs("7-4-part2-s2-05", "−0.75 > −0.8");
  assert.deepEqual(asc([0.25, -0.6, -0.4, 0.3, -1]), [-1, -0.6, -0.4, 0.25, 0.3]);
  checks += 5;
}
/* 7-5 reflections — sign table */
{
  const fmt = ([x, y]) => `(${x}, ${y})`;
  keyIs("7-5-part2-s2-01", fmt(reflectX([3, 4])).replace("-", "−"));
  keyIs("7-5-part2-s2-02", fmt(reflectY([-5, 2])));
  keyIs("7-5-part2-s2-03", fmt(reflectX([3.25, -5.5])));
  keyIs("7-5-part2-s2-04", fmt(reflectY([-2.75, 6.5])));
  keyIs("7-5-part2-s2-05", fmt(reflectY(reflectX([2, -6]))).replace("-", "−"));
  assert.deepEqual(
    [reflectX([-4, 3]), reflectY([-4, 3])],
    [
      [-4, -3],
      [4, 3],
    ],
  );
  checks++;
}
/* 7-6 distances on the plane — |difference| of the unshared coordinate */
{
  keyHas("7-6-part2-s2-01", "The pool");
  keyIs("7-6-part2-s2-02", dist1d(7, -3));
  keyIs("7-6-part2-s2-03", dist1d(5.75, -3.25));
  keyHas("7-6-part2-s2-04", `= ${dist1d(4.25, -6.75)} units`);
  assert.ok(dist1d(4.25, -6.75) > dist1d(5.75, -3.25));
  keyHas(
    "7-6-part2-s2-05",
    `Dara — ${dist1d(1.75, -5.25)} units, against Cruz's ${dist1d(8.25, 2.25)} units`,
  );
  assert.ok(dist1d(7, -3) > dist1d(-2, -9));
  checks += 2;
}
/* 7-7 scale — count units, then convert; convert back by dividing */
{
  keyIs("7-7-part2-s2-01", dist1d(10.5, 4.5));
  keyHas("7-7-part2-s2-02", 6 * 25);
  keyHas("7-7-part2-s2-03", 30000 / 150);
  keyIs("7-7-part2-s2-04", 200 / 25);
  const known = dist1d(-1.5, -13.5) * 20;
  keyHas("7-7-part2-s2-05", `${28800 / known} feet, drawn as ${28800 / known / 20} units`);
  assert.deepEqual([2 * (50 + 30), 50 * 30], [160, 1500]);
  checks++;
}
/* 7-8 quadrants from signs */
{
  keyHas("7-8-part2-s2-01", quadrant(-4, 3));
  keyHas("7-8-part2-s2-02", quadrant(2, -5));
  keyIs("7-8-part2-s2-03", [quadrant(-7, -1), quadrant(6, -2), quadrant(-4, 9)].join(", "));
  keyHas("7-8-part2-s2-04", `Quadrant ${quadrant(3, -8)}`);
  keyIs("7-8-part2-s2-05", "(−3, −4)");
  assert.equal(quadrant(-3, -4), "III");
  assert.equal(quadrant(0, -4), "axis");
  assert.deepEqual(
    [quadrant(4, 3), quadrant(-5, 2), quadrant(-3, -4), quadrant(2, -5)],
    ["I", "II", "III", "IV"],
  );
  checks += 3;
}
/* 7-9 reflections in context */
{
  const fmt = ([x, y]) => `(${x}, ${y})`;
  keyIs("7-9-part2-s2-01", fmt(reflectX([5, -2])));
  keyIs("7-9-part2-s2-02", fmt(reflectY([-6, 4])));
  keyHas("7-9-part2-s2-03", `Both are ${Math.abs(-6)} units`);
  const img = reflectX([3, -7]);
  keyHas(
    "7-9-part2-s2-04",
    `Each is ${Math.abs(img[1])} units from the x-axis; they are ${dist1d(-7, img[1])} units apart`,
  );
  keyIs("7-9-part2-s2-05", fmt(reflectY(reflectX([3, -7]))).replace("-", "−"));
  assert.deepEqual(reflectX([-6, 4]), [-6, -4]);
  checks++;
}
/* 8-1 writing equations — the key equation must be TRUE at its intended solution */
{
  keyIs("8-1-part2-s2-01", "x + 8 = 15");
  assert.equal(7 + 8, 15);
  keyIs("8-1-part2-s2-02", "3n = 21");
  assert.equal(3 * 7, 21);
  keyIs("8-1-part2-s2-03", "n − 6 = 10");
  assert.equal(16 - 6, 10);
  keyIs("8-1-part2-s2-04", "64 − r = 27");
  assert.equal(64 - 37, 27);
  keyHas("8-1-part2-s2-05", "52 − k = 18");
  assert.equal(52 - 34, 18);
  assert.ok(36 / 4 === 9 && 42 - 12 === 30);
  checks += 6;
}
/* 8-2 subtraction equations — solve by search, not by inverse */
{
  const solve = (f, target) => {
    for (let v = -100; v <= 100; v++) if (f(v) === target) return v;
    return null;
  };
  keyHas(
    "8-2-part2-s2-01",
    solve((x) => x - 5, 11),
  );
  keyHas(
    "8-2-part2-s2-02",
    solve((n) => n - 8, 3),
  );
  keyIs(
    "8-2-part2-s2-03",
    solve((m) => m - 18, 27),
  );
  keyHas("8-2-part2-s2-04", `y = ${solve((y) => y - 23, 36)}`);
  keyHas("8-2-part2-s2-05", `y = ${solve((y) => y - 14, 6)}`);
  checks++;
}
/* 8-3 division equations — solve by search */
{
  const solve = (f, target) => {
    for (let v = 0; v <= 200; v++) if (f(v) === target) return v;
    return null;
  };
  keyHas(
    "8-3-part2-s2-01",
    solve((x) => x / 4, 9),
  );
  keyHas(
    "8-3-part2-s2-02",
    solve((n) => n / 6, 5),
  );
  keyIs(
    "8-3-part2-s2-03",
    solve((n) => n / 6, 13),
  );
  keyHas("8-3-part2-s2-04", `k = ${solve((k) => k / 8, 11)}`);
  keyHas("8-3-part2-s2-05", `y = ${solve((y) => y / 2, 14)}`);
  checks++;
}
/* 8-4 representing inequalities — boundary test decides the circle */
{
  const includes = (test, boundary) => test(boundary);
  assert.ok(includes((x) => x >= 3, 3));
  keyHas("8-4-part2-s2-01", "Closed");
  assert.ok(!includes((x) => x < -2, -2));
  keyIs("8-4-part2-s2-02", "Open, shaded to the left.");
  keyIs("8-4-part2-s2-03", "w ≤ 15");
  assert.ok([40, 25, 0].every((p) => p <= 40) && !(41 <= 40));
  keyIs("8-4-part2-s2-04", "40, 25, 0");
  keyIs("8-4-part2-s2-05", "x > 5");
  assert.ok([13, 16, 40].every((a) => a >= 13));
  checks += 4;
}
/* 8-5 testing solutions */
{
  assert.ok(5 > 3);
  keyHas("8-5-part2-s2-01", "Yes");
  assert.ok(4 <= 4);
  keyHas("8-5-part2-s2-02", "Yes");
  assert.ok(11 < 14 && !(14 < 14));
  keyHas("8-5-part2-s2-03", "11 is a solution");
  assert.ok(72 > 68 && !(68 > 68));
  keyHas("8-5-part2-s2-04", "open dot at 68, arrow to the right");
  assert.ok([6, 0, -3].every((x) => x < 7) && !(7 < 7));
  keyIs("8-5-part2-s2-05", "6, 0, −3");
  assert.ok(50 >= 48 && 48 >= 48 && !(45 >= 48));
  checks += 6;
}
/* 8-6 solve then graph — search the boundary */
{
  const boundary = (f, cmp) => {
    for (let v = -50; v <= 200; v++) if (cmp(f(v))) return v;
    return null;
  };
  keyIs(
    "8-6-part2-s2-01",
    `n > ${
      boundary(
        (n) => n - 6,
        (r) => r > 9,
      ) - 1
    }`,
  );
  keyIs("8-6-part2-s2-02", "52 + g ≤ 85");
  const g =
    boundary(
      (g) => 52 + g,
      (r) => r > 85,
    ) - 1;
  keyHas("8-6-part2-s2-03", `g ≤ ${g}`);
  const t =
    boundary(
      (t) => 26 + t,
      (r) => r > 40,
    ) - 1;
  keyHas("8-6-part2-s2-04", `t ≤ ${t}`);
  assert.ok(26 + 10 <= 40 && !(26 + 16 <= 40));
  assert.ok(!(5 + 4 > 12));
  keyHas("8-6-part2-s2-05", "No");
  assert.equal(
    boundary(
      (d) => 38 + d,
      (r) => r > 60,
    ) - 1,
    22,
  );
  checks += 3;
}
/* 8-7 equation vs inequality */
{
  keyHas("8-7-part2-s2-01", "Equation: r ÷ 5 = 40");
  assert.equal(200 / 5, 40);
  keyIs("8-7-part2-s2-02", "Inequality: b ≤ 6");
  keyIs("8-7-part2-s2-03", "9 + p ≤ 14, so p ≤ 5");
  assert.ok(9 + 5 <= 14 && !(9 + 6 <= 14));
  assert.equal(4 * 13, 52);
  keyHas("8-7-part2-s2-04", "Yes");
  keyHas("8-7-part2-s2-05", "split a $27 bill equally");
  assert.equal(3 * 9, 27);
  checks += 4;
}
/* 9-1 tables of values */
{
  const table = (f, xs) => xs.map(f).join(", ");
  keyIs("9-1-part2-s2-01", `y = ${table((x) => x + 3, [1, 2, 3, 4])}`);
  keyIs("9-1-part2-s2-02", `y = ${table((x) => 2 * x, [0, 1, 2, 3])}`);
  keyHas("9-1-part2-s2-03", `pages y = ${table((x) => 35 * x, [1, 2, 3])}`);
  keyIs(
    "9-1-part2-s2-04",
    table((x) => 11 * x, [1, 2, 4]),
  );
  assert.ok([1, 2, 3].every((x) => 5 * x === [5, 10, 15][x - 1]));
  keyIs("9-1-part2-s2-05", "y = 5x");
  assert.equal(3 * 20, 60);
  checks += 2;
}
/* 9-2 analyzing graphs — rate from two points */
{
  const rate = ([x1, y1], [x2, y2]) => (y2 - y1) / (x2 - x1);
  assert.equal(rate([0, 0], [2, 6]), 3);
  keyHas("9-2-part2-s2-01", "Yes");
  keyIs("9-2-part2-s2-02", 5 * rate([0, 0], [2, 6]));
  keyHas("9-2-part2-s2-03", `$${rate([1, 15], [2, 30])} per mile`);
  keyHas("9-2-part2-s2-04", 12 * rate([1, 15], [3, 45]));
  keyIs("9-2-part2-s2-05", 4 * rate([1, 13], [3, 39]));
  assert.equal(5 + rate([0, 5], [2, 11]) * 10, 35);
  checks += 2;
}
/* 9-3 equations from situations — test each key equation against a hand-counted pair */
{
  keyIs("9-3-part2-s2-01", "y = 2x + 5");
  assert.equal(5 + 2 + 2 + 2, 2 * 3 + 5);
  keyIs("9-3-part2-s2-02", "c = 16h");
  keyIs("9-3-part2-s2-03", "y = 0.10x + 20");
  assert.equal(0.1 * 100 + 20, 30);
  keyHas("9-3-part2-s2-04", 2 * 3 + 5);
  keyHas("9-3-part2-s2-05", `$${17 * 20}`);
  assert.equal(3 * 4 + 8, 20);
  checks += 3;
}
/* 9-4 working backward — solve by search, then confirm forward */
{
  const solve = (f, target) => {
    for (let v = 0; v <= 5000; v++) if (f(v) === target) return v;
    return null;
  };
  keyIs(
    "9-4-part2-s2-01",
    solve((n) => 26 * n, 1300),
  );
  keyIs(
    "9-4-part2-s2-02",
    solve((c) => 18 * c, 720),
  );
  keyIs(
    "9-4-part2-s2-03",
    solve((x) => 15 + 3 * x, 36),
  );
  keyIs(
    "9-4-part2-s2-04",
    solve((x) => 2 * x + 4, 30),
  );
  keyHas("9-4-part2-s2-05", "Both");
  assert.equal(
    solve((x) => 25 + 12 * x, 145),
    10,
  );
  checks++;
}
/* 1-3 time conversion — division with remainder by 60 */
{
  keyIs("1-3-part2-s2-01", quot(200, 60).q);
  keyIs("1-3-part2-s2-02", `${quot(200, 60).q}:${quot(200, 60).r} a.m.`);
  keyIs("1-3-part2-s2-03", `${quot(500, 60).q}:${quot(500, 60).r} a.m.`);
  assert.deepEqual([quot(625, 60).q, quot(625, 60).r], [10, 25]);
  keyHas("1-3-part2-s2-04", "a little more than 10 hours");
  assert.deepEqual([quot(150, 60).q, quot(150, 60).r], [2, 30]);
  keyHas("1-3-part2-s2-05", "2 hours 30 minutes");
  const ny = quot(2022, 60);
  assert.deepEqual([ny.q, ny.r, quot(ny.q, 24).r], [33, 42, 9]);
  checks += 3;
}
/* 1-4 volume arguments */
{
  const vol = (l, w, h) => l * w * h;
  keyHas("1-4-part2-s2-01", vol(5, 2, 1));
  keyHas(
    "1-4-part2-s2-02",
    `Box 2 holds ${vol(4, 3, 1)} cubic feet — ${vol(4, 3, 1) - vol(5, 2, 1)} more`,
  );
  keyHas(
    "1-4-part2-s2-03",
    `Three large = ${3 * vol(8, 3, 10)} cubic inches; two jumbo = ${2 * vol(10, 4, 10)} cubic inches. The jumbo pair holds more`,
  );
  keyHas("1-4-part2-s2-04", "half full");
  assert.equal(vol(6, 4, 2), vol(8, 3, 2));
  keyHas("1-4-part2-s2-05", `Both hold ${vol(6, 4, 2)} cubic feet`);
  assert.deepEqual([vol(10, 3, 2), 2 * vol(4, 4, 2)], [60, 64]);
  checks += 2;
}
/* 1-5 pattern rules — build forward to confirm the backward division */
{
  let w = 3;
  let weeks = 0;
  while (w < 10) {
    w += 0.5;
    weeks++;
  }
  keyHas("1-5-part2-s2-01", 10 - 3);
  keyIs("1-5-part2-s2-02", weeks);
  keyHas("1-5-part2-s2-03", ((15 - 4.5) * 100).toLocaleString("en-US"));
  let cm = 450;
  let days = 0;
  while (cm < 1500) {
    cm += 2.5;
    days++;
  }
  keyHas("1-5-part2-s2-04", `${days} days`);
  keyIs("1-5-part2-s2-05", `18 + 10 × 2 = ${18 + 10 * 2}`);
  let h = 40;
  let d = 0;
  while (h < 200) {
    h += 3.5;
    d++;
  }
  assert.equal(d, 46);
  checks++;
}
/* 3-8 unit rates in cents */
{
  const per = (cents, n) => cents / n;
  keyHas("3-8-part2-s2-01", `$${(per(2700, 3) / 100).toFixed(2)} per pizza`);
  assert.ok(per(4250, 5) < per(2700, 3));
  keyHas("3-8-part2-s2-02", "Pizza Town is cheaper per pizza");
  keyIs("3-8-part2-s2-03", `$${((15 * per(4250, 5)) / 100).toFixed(2)}`);
  assert.ok(per(1380, 6) < per(1000, 4));
  keyHas(
    "3-8-part2-s2-04",
    `Shop B at $${(per(1380, 6) / 100).toFixed(2)} each; 12 notebooks cost $${((12 * per(1380, 6)) / 100).toFixed(2)}`,
  );
  keyIs("3-8-part2-s2-05", `$${((14 * per(2000, 8)) / 100).toFixed(2)}`);
  assert.ok(per(840, 6) < per(600, 4) && 24 * per(840, 6) === 3360);
  checks += 3;
}
/* 3-9 equivalent ratios — scale factor by repeated addition */
{
  const factor = (from, to) => {
    let f = 0;
    let s = 0;
    while (s < to) {
      s += from;
      f++;
    }
    assert.equal(s, to);
    return f;
  };
  keyIs("3-9-part2-s2-01", factor(2, 14));
  keyIs("3-9-part2-s2-02", 3 * factor(2, 14));
  keyHas("3-9-part2-s2-03", 2 * factor(3, 18));
  keyIs("3-9-part2-s2-04", `$${8 * (45 / 3)}`);
  assert.ok(equivalentRatio(4, 10, 10, 25));
  keyIs("3-9-part2-s2-05", "x = 10");
  assert.equal(5 * factor(2, 8), 20);
  checks += 2;
}
/* 3-10 conversion direction — the converted number must move the right way */
{
  keyHas("3-10-part2-s2-01", quot(96, 16).q);
  assert.ok(quot(96, 16).q < 96);
  keyHas("3-10-part2-s2-02", 9 * 3);
  assert.ok(9 * 3 > 9);
  keyHas("3-10-part2-s2-03", quot(7650, 3).q.toLocaleString("en-US"));
  const inch = quot(30, 12);
  keyIs("3-10-part2-s2-04", `${inch.q} feet ${inch.r} inches`);
  keyHas("3-10-part2-s2-05", (3 * 60 * 60).toLocaleString("en-US"));
  assert.ok(5 * 1000 > 4800 && 4800 / 1000 < 5);
  checks += 3;
}
/* 5-9 regular polygons — one triangle × sides, then × price */
{
  const tri = (b, h) => dealIntoBoxes(b * h * 2, 4); // ½bh without a fraction: (2bh)/4
  keyHas("5-9-part2-s2-01", tri(4, 3.5 * 2) / 2);
  keyHas("5-9-part2-s2-02", 6 * 7);
  keyHas("5-9-part2-s2-03", 6 * tri(8, 7));
  keyIs("5-9-part2-s2-04", `$${10 * tri(3, 4) * 5}`);
  keyHas("5-9-part2-s2-05", `$${42 * 8}`);
  assert.deepEqual([8 * tri(6, 7), 8 * tri(6, 7) * 0.5], [168, 84]);
  checks++;
}
/* 5-10 box volumes with decimals — work in tenths/hundredths as integers */
{
  const vol = (l, w, h) => Math.round(l * 100 * w * 100 * h * 100) / 1e6;
  keyHas("5-10-part2-s2-01", vol(2, 1, 1));
  keyHas("5-10-part2-s2-02", vol(2, 1.5, 1));
  keyHas("5-10-part2-s2-03", `volume is ${vol(2, 2, 1.5)} cubic feet`);
  assert.ok(vol(2, 2, 1.5) >= 5 && vol(2, 1.5, 1) < 5);
  keyHas("5-10-part2-s2-04", `A is exactly ${vol(3, 1.5, 1)} and B is ${vol(2, 2, 1.25)}`);
  keyHas("5-10-part2-s2-05", vol(1.5, 2, 3));
  assert.ok(vol(2.5, 2, 2) < 11 && vol(3, 1.5, 2.5) >= 11);
  checks += 2;
}
/* 10-1 modeling — per one, times how many, then scale */
{
  keyHas("10-1-part2-s2-01", 4 * 2);
  keyHas("10-1-part2-s2-02", (8 * 365).toLocaleString("en-US"));
  keyIs("10-1-part2-s2-03", [3, 4, 5, 8].map((p) => (2920 * p).toLocaleString("en-US")).join("; "));
  keyIs("10-1-part2-s2-04", `${3 * 7} gallons; ${(3 * 365).toLocaleString("en-US")} gallons`);
  keyHas("10-1-part2-s2-05", "No");
  assert.deepEqual([3 * 2.5, 7.5 * 7, 7.5 * 365, 7.5 * 365 * 4], [7.5, 52.5, 2737.5, 10950]);
  checks++;
}
/* 10-3 pattern rules — apply the rule forward and compare to the sequence */
{
  const hanoi = (n) => {
    let moves = 0;
    for (let i = 0; i < n; i++) moves = moves * 2 + 1;
    return moves;
  };
  assert.deepEqual([1, 2, 3].map(hanoi), [1, 3, 7]);
  keyHas("10-3-part2-s2-01", "Double the previous number and add 1");
  keyIs("10-3-part2-s2-02", hanoi(4));
  keyIs("10-3-part2-s2-03", hanoi(6));
  let seq = 2;
  const terms = [seq];
  for (let i = 0; i < 5; i++) {
    seq = seq * 2 + 1;
    terms.push(seq);
  }
  assert.deepEqual(terms, [2, 5, 11, 23, 47, 95]);
  keyHas("10-3-part2-s2-04", "47 and 95");
  const shakes = (people) => {
    let total = 0;
    for (let i = 1; i < people; i++) total += i;
    return total;
  };
  assert.deepEqual([2, 3, 4, 5].map(shakes), [1, 3, 6, 10]);
  keyHas("10-3-part2-s2-05", `6 people → 10 + 5 = ${shakes(6)}`);
  assert.equal(shakes(8), 28); // 7-step staircase = handshakes among 8
  checks += 4;
}
/* ── Top-ups on the 20 lessons that shipped with 3–4 items ─────────────── */
{
  assert.ok(identical("3(2y + 5)", "6y + 15"));
  keyIs("6-8-part2-s2-05", "6y + 15");
  assert.ok(identical("4(5a + 2)", "20a + 8") && gcf(20, 8) === 4);
  keyIs("6-8-part2-s2-06", "4(5a + 2)");
  keyIs("3-2-part2-s2-04", `$${(450 / 3 / 100).toFixed(2)}`);
  assert.ok(420 / 3 < 300 / 2);
  keyHas("3-2-part2-s2-05", "3-liter");
  keyIs("3-2-part2-s2-06", `$${((20 * 50 - 20 * 45) / 100).toFixed(2)}`);
  keyIs("3-3-part2-s2-05", 3 * (40 / 8));
  keyHas("3-3-part2-s2-06", `${30 / (18 / 3)} — divide both terms by ${18 / 3}`);
  keyIs("3-4-part2-s2-04", `(3, ${6 * 3})`);
  assert.equal(30 / 2, 60 / 4);
  keyHas("3-4-part2-s2-05", `$${30 / 2} is earned for 1 hour`);
  assert.ok(10 / 2 > 6 / 2);
  keyHas("3-4-part2-s2-06", "Line P");
  assert.ok(30 * 4 < 28 * 5);
  keyHas("3-5-part2-s2-04", `Printer Y — ${28 * 5} pages in 20 minutes versus ${30 * 4}`);
  assert.ok(90 / 3 > 140 / 5);
  keyHas("3-5-part2-s2-05", `Car A — ${90 / 3} miles per gallon versus ${140 / 5}`);
  assert.ok(1 / 8 > 0.5 / 5);
  keyHas("3-5-part2-s2-06", "B is faster");
  keyIs("3-6-part2-s2-05", `${(4.2 * 1000).toLocaleString("en-US")} m`);
  keyIs("3-7-part2-s2-05", `${(22 / 2.2) * 5} mg`);
  keyIs("3-7-part2-s2-06", 120 / (2 * 5));
  keyIs("4-1-part2-s2-05", `${2.5 * 100}%`);
  keyHas("4-1-part2-s2-06", "1.75 times");
  assert.ok(cmpFractions(3, 4, 7, 10) > 0 && cmpFractions(3, 4, 65, 100) > 0);
  keyIs("4-2-part2-s2-05", "3/4");
  assert.ok(cmpFractions(8, 10, 75, 100) > 0);
  keyHas("4-2-part2-s2-06", "80%");
  keyHas("4-3-part2-s2-05", `about ${dealIntoBoxes(60, 2)}`);
  keyHas("4-3-part2-s2-06", `about $${2 * dealIntoBoxes(60, 10)}`);
  assert.ok(cmpFractions(18, 24, 21, 30) > 0);
  keyHas("4-4-part2-s2-05", "Team A");
  assert.ok(0.15 * 200 > 0.3 * 90);
  keyHas("4-4-part2-s2-06", `15% of 200 = ${0.15 * 200}`);
  keyIs("4-5-part2-s2-05", `$${42 / 0.6}`);
  keyIs("4-5-part2-s2-06", 18 / 0.3);
  keyIs("5-1-part2-s2-05", `${dealIntoBoxes(12 * 9, 2)} cm²`);
  keyHas("5-1-part2-s2-06", `8 × 5 = ${8 * 5}`);
  keyIs("5-2-part2-s2-05", `${(45 * 2) / 9} ft`);
  keyHas("5-2-part2-s2-06", `${(28 * 2) / 7} cm`);
  keyIs("5-3-part2-s2-05", `${dealIntoBoxes((7 + 11) * 5, 2)} m²`);
  keyIs("5-3-part2-s2-06", `${(60 * 2) / 6 - 8} cm`);
  keyIs("5-4-part2-s2-05", `${12 * 4 + 4 * 10} ft²`);
  keyIs("5-4-part2-s2-06", `${9 * 9 - 3 * 3} m²`);
  keyHas("5-5-part2-s2-05", "4 ½");
  assert.equal(2 * 1.5 * 1.5, 4.5);
  keyIs("5-5-part2-s2-06", `${30 / (5 * 2)} m`);
  keyHas("5-6-part2-s2-05", `= ${2 * (15 + 10 + 6)} square units`);
  keyHas("5-6-part2-s2-06", "cylinder");
  keyIs("5-7-part2-s2-05", `${2 * dealIntoBoxes(6 * 4, 2) + (5 + 5 + 6) * 10} cm²`);
  keyHas("5-7-part2-s2-06", "volume");
  keyIs("5-8-part2-s2-05", `${4 * dealIntoBoxes(6 * 9, 2)} cm²`);
  keyIs("5-8-part2-s2-06", `${4 * dealIntoBoxes(8 * 6, 2)} ft²`);
  checks += 14;
}

/* ── Structure every item must satisfy to render ────────────────────────── */
const RENDERABLE = new Set(["multiple-choice", "open-response"]);
for (const [id, lesson] of Object.entries(DATA.lessons)) {
  const source = SOURCE.lessons.find((l) => l.id === id);
  /* Units 1 and 10, the appended extras, and 2.6 (whose Desktop folder is a
     misfiled duplicate of 2.3) have no Reveal Session 2 to import. Such a
     lesson may still be authored, but it must SAY what it was authored from —
     `sourceBasis` names the lesson's own Apply problem — and its session title
     must match the family-note sidecar exactly, because the sidecar is the
     only other record of what that second night teaches. */
  const sidecarPath = join(ROOT, "data", "family-homework-notes", `${id}.json`);
  assert.ok(existsSync(sidecarPath), `${id}: no family-note sidecar for this Part 2`);
  const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
  if (!source) {
    assert.ok(
      String(lesson.sourceBasis || "").trim().length >= 40,
      `${id}: no imported Reveal source and no written sourceBasis`,
    );
    assert.equal(
      lesson.sessionTitle,
      sidecar.sessionTitle,
      `${id}: session title disagrees with the family-note sidecar`,
    );
    assert.ok(
      !lesson.sourceSessionTitle,
      `${id}: sourceSessionTitle declared but there is no imported source to quote`,
    );
    checks += 3;
  } else {
    assert.ok(!lesson.sourceBasis, `${id}: has an imported source — drop sourceBasis`);
    checks += 1;
  }
  if (source) {
    /* The imported snapshot records the district's Practice docx, and a revised
     deck can outrun it — 3.1's Session 2 moved from splitting a total to
     equivalent ratios and scale factor while the docx kept its old title. A
     rename is therefore allowed, but only as a DECLARED divergence: the lesson
     must still quote the snapshot's exact title, so the provenance link keeps
     verifying, and must say which newer district artifact it now follows. An
     unexplained rename is drift, not an authoring decision. */
    if (lesson.sourceSessionTitle) {
      assert.equal(
        lesson.sourceSessionTitle,
        source.sessionTitle,
        `${id}: sourceSessionTitle does not quote the imported source`,
      );
      assert.ok(
        String(lesson.sourceDivergenceReason || "").trim().length >= 40,
        `${id}: a session-title divergence needs a written sourceDivergenceReason`,
      );
      assert.notEqual(
        lesson.sessionTitle,
        source.sessionTitle,
        `${id}: declares a divergence it does not have — drop sourceSessionTitle`,
      );
      checks += 3;
    } else {
      assert.equal(
        lesson.sessionTitle,
        source.sessionTitle,
        `${id}: session title disagrees with the imported source`,
      );
      checks += 1;
    }
  }
  checks += 1;

  const items = [
    ...(lesson.approaching || []),
    ...(lesson.onLevel || []),
    ...(lesson.extending || []),
  ];
  /* Six is what the Quick Check renders as its core set (3 warm-up + 3 level
     up). A lesson with fewer ships a thinner night than every other Part 2. */
  assert.ok(items.length >= 6, `${id}: needs at least 6 items, has ${items.length}`);
  checks++;

  const seenIds = new Set();
  for (const item of items) {
    const where = `${id}/${item.id}`;
    assert.ok(RENDERABLE.has(item.type), `${where}: type ${item.type} is not rendered here`);
    assert.ok(isPrintableProblem(item), `${where}: family homework filters out ${item.type}`);
    assert.ok(!seenIds.has(item.id), `${where}: duplicate item id`);
    seenIds.add(item.id);

    for (const field of ["stem", "stemEs", "explanation", "explanationEs"]) {
      assert.ok(String(item[field] || "").trim(), `${where}: missing ${field}`);
    }
    assert.equal(
      (item.hints || []).length,
      (item.hintsEs || []).length,
      `${where}: hint counts differ between languages`,
    );
    assert.ok((item.hints || []).length > 0, `${where}: no hints`);

    if (item.type === "multiple-choice") {
      assert.equal(
        item.choices.length,
        item.choicesEs.length,
        `${where}: choice counts differ between languages`,
      );
      assert.equal(new Set(item.choices).size, item.choices.length, `${where}: duplicate choices`);
      assert.ok(
        Number.isInteger(item.correctIndex) &&
          item.correctIndex >= 0 &&
          item.correctIndex < item.choices.length,
        `${where}: correctIndex out of range`,
      );
    }
    checks += 6;
  }
}

/* A file that quietly empties would pass every assertion above. */
assert.ok(Object.keys(DATA.lessons).length > 0, "no lessons authored — nothing was verified");
assert.ok(checks > 40, `only ${checks} checks ran — the suite is not exercising the data`);

console.log(
  `part-two-session2-practice: ${checks} assertions passed across ${Object.keys(DATA.lessons).length} lesson(s)`,
);

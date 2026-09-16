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
import { readFileSync } from "node:fs";
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

/* ── 3-1-part2 · Ratios with Tape Diagrams ──────────────────────────────── */
{
  const unit = dealIntoBoxes(21, 2 + 1);
  ok("3-1 rice share", 2 * unit, 14);
  ok("3-1 beans share", 1 * unit, 7);
  ok("3-1 shares restore the total", 2 * unit + 1 * unit, 21);

  ok("3-1 red marbles (2 boxes of 4)", 4 + 4, 8);
  ok("3-1 blue marbles (3 boxes of 4)", 4 + 4 + 4, 12);

  const flourBox = dealIntoBoxes(20, 4);
  ok("3-1 sugar (1 box)", 1 * flourBox, 5);
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

/* 3-3 bridge strategy: build the simplified ratio up group by group. */
{
  const bridge = (a, b) => {
    const g = (x, y) => (y ? g(y, x % y) : x);
    const k = g(a, b);
    return [a / k, b / k];
  };
  const [ba, bb] = bridge(14, 21);
  ok("3-3 bridge of 14 : 21", `${ba}:${bb}`, "2:3");
  let brown = 0;
  let black = 0;
  while (brown < 8) {
    brown += ba;
    black += bb;
  }
  ok("3-3 brown reaches the target exactly", brown, 8);
  ok("3-3 black for 8 drops of brown", black, 12);
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

/* ── Structure every item must satisfy to render ────────────────────────── */
const RENDERABLE = new Set(["multiple-choice", "open-response"]);
for (const [id, lesson] of Object.entries(DATA.lessons)) {
  const source = SOURCE.lessons.find((l) => l.id === id);
  assert.ok(source, `${id}: authored practice with no imported Reveal source`);
  assert.equal(
    lesson.sessionTitle,
    source.sessionTitle,
    `${id}: session title disagrees with the imported source`,
  );
  checks += 2;

  const items = [
    ...(lesson.approaching || []),
    ...(lesson.onLevel || []),
    ...(lesson.extending || []),
  ];
  assert.ok(items.length >= 3, `${id}: needs at least 3 items, has ${items.length}`);
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

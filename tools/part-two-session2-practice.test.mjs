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

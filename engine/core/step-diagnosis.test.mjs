#!/usr/bin/env node
/* =============================================================================
 * step-diagnosis.test.mjs
 * -----------------------------------------------------------------------------
 * diagnoseStep() names the mistake behind a typed line the Step Lab rejected, by
 * running each named error FORWARD from the previous line and asking the
 * solver's own equivalence engine whether it produced what the student typed.
 *
 * What this pins, and why each is here:
 *   1. A table of (previous line, typed line) -> tag. Every row was written from
 *      the arithmetic of the mistake, not copied from output.
 *   2. Silence. A label is a claim a teacher will act on, so equivalent lines,
 *      unexplained lines, AMBIGUOUS lines and unreadable input all return null.
 *   3. A dead-transform sweep, the same class of bug as
 *      misconceptions.deadprediction.test.mjs: a transform whose output is always
 *      equivalent to its input is invisible (the student's line is known not to
 *      be equivalent, so it can never match) and its tag silently never reaches
 *      the heatmap. Every transform must be able to produce a different line.
 *   4. Mutation checks, so (3) and the uniqueness rule are shown to BITE rather
 *      than assumed to.
 *   5. The copy: every tag exists in the taxonomy, has EN+ES chip labels, and has
 *      a nudge that is a question and contains no digit (so it cannot be an
 *      answer).
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { MISCONCEPTIONS } from "./misconceptions.js";
import {
  DIAGNOSABLE_TAGS,
  diagnoseStep,
  ERROR_TRANSFORMS,
  errorCandidates,
} from "./step-diagnosis.js";
import {
  isEquivalent,
  normalizeSides,
  parseLine,
  rpnToAst,
} from "./step-diagnosis-engine.js";
import { STEP_NUDGES, stepNudge } from "./step-diagnosis-nudges.js";

const tag = (prev, typed, mode = "expression") => diagnoseStep(prev, typed, mode)?.tag ?? null;

// -- 1. The table -----------------------------------------------------------

const EXPR = "expression";
const EQN = "equation";
const NAMED = [
  // Distributed to the first term only: the outside factor never reaches term two.
  ["3(x + 4)", "3x + 4", EXPR, "algebra-distributive-partial"],
  ["2(x - 5)", "2x - 5", EXPR, "algebra-distributive-partial"],
  ["(x + 4) × 3", "3x + 4", EXPR, "algebra-distributive-partial"],
  ["-(x + 3)", "-x + 3", EXPR, "algebra-distributive-partial"],
  ["7 - (x + 2)", "7 - x + 2", EXPR, "algebra-distributive-partial"],
  ["2(9 - 4) + 6", "20", EXPR, "algebra-distributive-partial"], // 2·9 − 4 + 6
  ["2(x + 3) = 14", "2x + 3 = 14", EQN, "algebra-distributive-partial"],
  // Worked left to right instead of by operation order.
  ["2 + 3 × 4", "20", EXPR, "order-of-operations-left-to-right"],
  ["18 - 6 ÷ 3", "4", EXPR, "order-of-operations-left-to-right"],
  ["4 × 5 + 3²", "529", EXPR, "order-of-operations-left-to-right"], // (4·5 + 3)²
  ["2 + 3 × 4", "2 + 3 × 4 = 20", EXPR, "order-of-operations-left-to-right"], // "= 20" form
  // Multiplied the base by the exponent.
  ["4 × 5 + 3²", "26", EXPR, "exponent-as-multiplication"],
  ["5²", "10", EXPR, "exponent-as-multiplication"],
  // Added the denominators.
  ["1/3 + 1/4", "2/7", EXPR, "fraction-added-denominators"],
  ["2/5 + 1/5", "3/10", EXPR, "fraction-added-denominators"],
  // Divided by a fraction without flipping it.
  ["3/4 ÷ 1/8", "3/32", EXPR, "fraction-no-reciprocal"],
  ["2/3 ÷ 4/5", "8/15", EXPR, "fraction-no-reciprocal"],
  // Operation turned around or swapped.
  ["9 - 4", "-5", EXPR, "op-reversed-subtraction"],
  ["x - 5", "5 - x", EXPR, "op-reversed-subtraction"],
  ["12 ÷ 4", "1/3", EXPR, "op-reversed-division"],
  ["6 × 4", "10", EXPR, "op-added-instead-of-multiplied"],
  ["6 × 4", "1.5", EXPR, "op-divided-instead-of-multiplied"],
  ["6 + 4", "24", EXPR, "op-multiplied-instead-of-added"],
  ["6 ÷ 4", "24", EXPR, "op-multiplied-instead-of-divided"],
  // Right digits, wrong magnitude.
  ["0.6 × 0.2", "1.2", EXPR, "decimal-place-value"],
  ["18.4 - 5.75", "1.265", EXPR, "decimal-place-value"],
  // Lost the negative sign (last resort: -12 has no operation to reverse).
  ["-4 × 3", "12", EXPR, "sign-dropped"],
  // Equations: did not undo the operation.
  ["x + 7 = 15", "x = 22", EQN, "equation-not-inverse-operation"],
  ["x - 7 = 15", "x = 8", EQN, "equation-not-inverse-operation"],
  ["3x = 27", "x = 81", EQN, "equation-not-inverse-operation"],
  ["n/5 = 7", "n = 7/5", EQN, "equation-not-inverse-operation"],
  ["3x + 6 = 18", "3x = 24", EQN, "equation-not-inverse-operation"],
  ["3x + 6 = 18", "x = 8", EQN, "equation-not-inverse-operation"], // a later step from the bad line
  ["10 = x + 4", "14 = x", EQN, "equation-not-inverse-operation"], // variable on the right
  // Equations: answered with a number already in the equation.
  ["x + 7 = 15", "x = 15", EQN, "equation-answered-with-given-number"],
  ["3x = 27", "x = 3", EQN, "equation-answered-with-given-number"],
];

for (const [prev, typed, mode, expected] of NAMED) {
  test(`${mode}: "${prev}" -> "${typed}" is ${expected}`, () => {
    assert.equal(tag(prev, typed, mode), expected);
  });
}

test("every diagnosable tag is demonstrated by at least one table row", () => {
  const shown = new Set(NAMED.map((row) => row[3]));
  assert.deepEqual(
    DIAGNOSABLE_TAGS.filter((t) => !shown.has(t)),
    [],
    "a tag with no test row is a tag nobody has proved can fire",
  );
});

// -- 2. Silence --------------------------------------------------------------

test("a line that is still equivalent is never diagnosed", () => {
  for (const [prev, typed, mode] of [
    ["3(x + 4)", "3x + 12", EXPR],
    ["2 + 3 × 4", "14", EXPR],
    ["1/3 + 1/4", "7/12", EXPR],
    ["x + 7 = 15", "x = 8", EQN],
    ["3x + 6 = 18", "3x = 12", EQN],
  ]) {
    assert.equal(diagnoseStep(prev, typed, mode), null, `${prev} -> ${typed}`);
  }
});

test("a wrong line no named error explains is not labelled", () => {
  for (const [prev, typed, mode] of [
    ["2 + 3 × 4", "17", EXPR],
    ["3(x + 4)", "5x + 1", EXPR],
    ["x + 7 = 15", "x = 9", EQN],
    ["3x + 6 = 18", "x = 100", EQN],
  ]) {
    assert.equal(diagnoseStep(prev, typed, mode), null, `${prev} -> ${typed}`);
  }
});

test("a line two different errors both produce is not labelled (uniqueness)", () => {
  // 1 ÷ 4: reversing gives 4 ÷ 1 = 4, and multiplying gives 1 × 4 = 4.
  assert.equal(tag("1 ÷ 4", "4"), null);
  // 1 + 2 × 3: adding instead of multiplying, or multiplying instead of adding, both give 6.
  assert.equal(tag("1 + 2 × 3", "6"), null);
  // x − 1 = 2: "x = 2 − 1" (not undone) and "x = 1" (a number from the equation) are both 1.
  assert.equal(tag("x - 1 = 2", "x = 1", EQN), null);
});

test("specific beats generic, as in misconceptions.js: fraction division", () => {
  // Dividing 3/4 by 1/8 without flipping is also "multiplied instead of divided".
  // The fraction-specific name wins, exactly as it does for a typed answer.
  assert.equal(tag("3/4 ÷ 1/8", "3/32"), "fraction-no-reciprocal");
  // With a whole number there is no fraction-specific claim to make.
  assert.equal(tag("6 ÷ 1/2", "3"), "op-multiplied-instead-of-divided");
});

test("unreadable or hostile input returns null and never throws", () => {
  const junk = [
    "",
    "   ",
    "abc def",
    "((",
    "))",
    "x = = 2",
    "1/0",
    "2 3",
    "3 $ 4",
    "= 5",
    "x = y + z",
    "9".repeat(400),
    "(".repeat(300),
    "😀",
  ];
  for (const a of junk) {
    for (const b of junk) {
      for (const mode of [EXPR, EQN, "nonsense"]) {
        assert.doesNotThrow(() => diagnoseStep(a, b, mode));
        assert.equal(diagnoseStep(a, b, mode), null);
      }
    }
  }
  for (const bad of [null, undefined, 5, {}, []]) {
    assert.equal(diagnoseStep(bad, "3x", EXPR), null);
    assert.equal(diagnoseStep("3(x + 4)", bad, EXPR), null);
  }
});

test("an unknown mode reads as expression, like the solver", () => {
  assert.equal(diagnoseStep("3(x + 4)", "3x + 4", "nonsense")?.tag, "algebra-distributive-partial");
  assert.equal(diagnoseStep("3(x + 4)", "3x + 4")?.tag, "algebra-distributive-partial");
});

test("fuzz: any pair of short lines yields null or a known tag, deterministically", () => {
  let seed = 20261016;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const atoms = ["1", "2", "3", "4", "0.5", "x", "(", ")", "+", "-", "×", "÷", "/", "^", "=", "²", " "];
  const make = () =>
    Array.from({ length: 1 + Math.floor(rand() * 9) }, () => atoms[Math.floor(rand() * atoms.length)]).join("");
  const known = new Set(DIAGNOSABLE_TAGS);
  for (let i = 0; i < 1500; i++) {
    const a = make();
    const b = make();
    const mode = rand() < 0.5 ? EXPR : EQN;
    const first = diagnoseStep(a, b, mode);
    assert.deepEqual(first, diagnoseStep(a, b, mode), `non-deterministic for ${a} / ${b}`);
    if (first) assert.ok(known.has(first.tag), `unknown tag ${first.tag}`);
  }
});

// -- 3. Dead-transform sweep -------------------------------------------------

const BATTERY = [
  ["3(x + 4)", EXPR],
  ["(x + 4) × 3", EXPR],
  ["-(x + 3)", EXPR],
  ["7 - (x + 2)", EXPR],
  ["2 + 3 × 4", EXPR],
  ["18 - 6 ÷ 3", EXPR],
  ["4 × 5 + 3²", EXPR],
  ["5²", EXPR],
  ["1/3 + 1/4", EXPR],
  ["3/4 ÷ 1/8", EXPR],
  ["9 - 4", EXPR],
  ["12 ÷ 4", EXPR],
  ["6 × 4", EXPR],
  ["6 + 4", EXPR],
  ["0.6 × 0.2", EXPR],
  ["-4 × 3", EXPR],
  ["x + 7 = 15", EQN],
  ["x - 7 = 15", EQN],
  ["3x = 27", EQN],
  ["n/5 = 7", EQN],
  ["3x + 6 = 18", EQN],
  ["2(x + 3) = 14", EQN],
  ["10 = x + 4", EQN],
];

/**
 * Transforms that cannot produce a line different from the one they started
 * from, across the battery. A transform that never even APPLIES is reported too:
 * it is untested, which is the same blind spot.
 */
function deadTransforms(transforms) {
  const dead = [];
  for (const t of transforms) {
    let applied = 0;
    let different = 0;
    for (const [line, mode] of BATTERY) {
      const prev = parseLine(line);
      normalizeSides(prev, mode);
      for (const c of errorCandidates(line, mode, [t])) {
        applied++;
        if (!isEquivalent(prev, { sides: c.sides }, mode)) different++;
      }
    }
    if (!different) dead.push(`${t.tag} (${applied} candidates, all equivalent to their input)`);
  }
  return dead;
}

test("no error transform can only produce an equivalent line", () => {
  assert.deepEqual(deadTransforms(ERROR_TRANSFORMS), []);
});

test("the battery exercises every transform", () => {
  for (const t of ERROR_TRANSFORMS) {
    const total = BATTERY.reduce((n, [line, mode]) => n + errorCandidates(line, mode, [t]).length, 0);
    assert.ok(total > 0, `${t.tag} produced no candidate on any battery line`);
  }
});

test("every candidate is a readable line the solver can evaluate", () => {
  for (const [line, mode] of BATTERY) {
    for (const c of errorCandidates(line, mode)) {
      assert.equal(c.sides.length, mode === EQN ? 2 : 1);
      for (const rpn of c.sides) assert.ok(rpnToAst(rpn), `${c.tag} built a malformed tree from ${line}`);
    }
  }
});

// -- 4. Mutation checks ------------------------------------------------------

const withTransform = (tagName, replacement) =>
  ERROR_TRANSFORMS.map((t) => (t.tag === tagName ? { ...t, ...replacement } : t));

test("mutation: a distribution that reaches both terms is caught as dead and goes quiet", () => {
  const correctDistribution = (n) =>
    n.k === "bin" && n.op === "*" && n.b.k === "bin" && (n.b.op === "+" || n.b.op === "-")
      ? [
          {
            k: "bin",
            op: n.b.op,
            a: { k: "bin", op: "*", a: n.a, b: n.b.a },
            b: { k: "bin", op: "*", a: n.a, b: n.b.b },
          },
        ]
      : [];
  const mutated = withTransform("algebra-distributive-partial", { expr: correctDistribution });
  assert.equal(tag("3(x + 4)", "3x + 4"), "algebra-distributive-partial", "control: real table fires");
  assert.equal(diagnoseStep("3(x + 4)", "3x + 4", EXPR, mutated), null);
  const dead = deadTransforms(mutated);
  assert.equal(dead.length, 1);
  assert.match(dead[0], /^algebra-distributive-partial/);
});

test("mutation: an order-of-operations transform that changes nothing is caught as dead", () => {
  const mutated = withTransform("order-of-operations-left-to-right", { expr: (n) => [n] });
  assert.match(deadTransforms(mutated).join("\n"), /order-of-operations-left-to-right/);
  assert.equal(diagnoseStep("2 + 3 × 4", "20", EXPR, mutated), null);
});

test("mutation: removing the specific-over-generic rank makes fraction division ambiguous", () => {
  const flat = ERROR_TRANSFORMS.map((t) => ({ ...t, rank: 1 }));
  assert.equal(diagnoseStep("3/4 ÷ 1/8", "3/32", EXPR, flat), null);
  assert.equal(tag("3/4 ÷ 1/8", "3/32"), "fraction-no-reciprocal");
});

test("mutation: an operation reversed the wrong way is not mistaken for the real error", () => {
  const sloppy = withTransform("op-reversed-subtraction", {
    expr: (n) => (n.k === "bin" && n.op === "-" ? [{ ...n, op: "+" }] : []),
  });
  assert.equal(diagnoseStep("9 - 4", "-5", EXPR, sloppy), null);
});

// -- 5. Taxonomy and copy ----------------------------------------------------

test("every diagnosable tag exists in the misconception taxonomy with EN and ES labels", () => {
  const taxonomy = JSON.parse(readFileSync(new URL("../../data/misconception-taxonomy.json", import.meta.url), "utf8")).taxonomy;
  const labels = JSON.parse(readFileSync(new URL("../../data/misconception-labels.json", import.meta.url), "utf8")).tags;
  for (const t of DIAGNOSABLE_TAGS) {
    assert.ok(MISCONCEPTIONS[t], `${t} is not a MISCONCEPTIONS key`);
    assert.ok(taxonomy[t], `${t} missing from data/misconception-taxonomy.json`);
    assert.ok(labels[t], `${t} missing from data/misconception-labels.json`);
    assert.ok(MISCONCEPTIONS[t].label && MISCONCEPTIONS[t].labelEs, `${t} lacks a bilingual label`);
    assert.notEqual(MISCONCEPTIONS[t].labelEs, MISCONCEPTIONS[t].label, `${t} Spanish label is a copy`);
  }
});

test("nudges cover exactly the diagnosable tags, as digit-free bilingual questions", () => {
  assert.deepEqual(Object.keys(STEP_NUDGES).sort(), [...DIAGNOSABLE_TAGS].sort());
  for (const t of DIAGNOSABLE_TAGS) {
    const n = stepNudge(t);
    for (const [lang, text] of [
      ["en", n.en],
      ["es", n.es],
    ]) {
      assert.ok(text.length > 20, `${t} ${lang} is empty`);
      assert.match(text, /\?/, `${t} ${lang} must ask a question`);
      assert.doesNotMatch(text, /[0-9=]/, `${t} ${lang} must not contain a number or equation`);
    }
    assert.match(n.es, /¿/, `${t} Spanish question needs its opening mark`);
    assert.notEqual(n.en, n.es);
  }
  assert.equal(stepNudge("not-a-tag"), null);
});

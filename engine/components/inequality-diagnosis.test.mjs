#!/usr/bin/env node
/* =============================================================================
 * inequality-diagnosis.test.mjs
 * -----------------------------------------------------------------------------
 * A graph of an inequality carries exactly three facts: where the boundary is,
 * whether the circle is filled, and which way the ray shades. A wrong written
 * answer is wrong in one or more of exactly those ways, and the whole point of
 * diagnoseInequality() is to say WHICH — the component it replaced said "check
 * the circle type and shading direction", which is the task restated.
 *
 * Boundary cases matter here more than volume: negative boundaries, a boundary
 * of zero (where sign reasoning is easiest to get backwards), decimals, and the
 * reversed reading "4 < x" that a student writing left-to-right off the graph
 * produces naturally and which must NOT be marked wrong.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import {
  diagnoseInequality,
  diagnosePlacement,
  matchesInequality,
  parseInequality,
} from "./number-line.js";

const prob = (inequality, boundary, circleType, direction) => ({
  inequality,
  boundary,
  circleType,
  direction,
});

/* ── Parsing ───────────────────────────────────────────────────────────────── */

test("parses the ordinary form", () => {
  assert.deepEqual(parseInequality("x > 4"), { boundary: 4, direction: "right", inclusive: false });
  assert.deepEqual(parseInequality("x ≤ 7"), { boundary: 7, direction: "left", inclusive: true });
});

test("parses the reversed reading a student takes off the graph", () => {
  // "4 < x" is the SAME ray as "x > 4" and must not be treated as an error.
  assert.deepEqual(parseInequality("4 < x"), { boundary: 4, direction: "right", inclusive: false });
  assert.deepEqual(parseInequality("7 ≥ x"), { boundary: 7, direction: "left", inclusive: true });
});

test("parses negative, zero and decimal boundaries", () => {
  assert.deepEqual(parseInequality("x ≥ -3"), {
    boundary: -3,
    direction: "right",
    inclusive: true,
  });
  assert.deepEqual(parseInequality("x < 0"), { boundary: 0, direction: "left", inclusive: false });
  assert.deepEqual(parseInequality("x > 2.5"), {
    boundary: 2.5,
    direction: "right",
    inclusive: false,
  });
});

test("refuses what it cannot read instead of guessing", () => {
  for (const bad of ["", "x", "4", "x > ", "3 < 4", "x > y", "greater than 4", "x >> 4"]) {
    assert.equal(parseInequality(bad), null, `parsed "${bad}" it should have refused`);
  }
});

/* ── Diagnosis ─────────────────────────────────────────────────────────────── */

test("a correct answer produces no complaint", () => {
  assert.equal(diagnoseInequality("x > 4", prob("x > 4", 4, "open", "right")), null);
  assert.equal(diagnoseInequality("4 < x", prob("x > 4", 4, "open", "right")), null);
});

test("wrong boundary is named, and named FIRST", () => {
  const msg = diagnoseInequality("x > 5", prob("x > 4", 4, "open", "right"));
  assert.match(msg, /turns at 5/);
  assert.match(msg, /sits at 4/);
});

test("open vs closed is explained by testing the boundary itself", () => {
  // Student wrote ≥ where the circle is open.
  const open = diagnoseInequality("x ≥ 4", prob("x > 4", 4, "open", "right"));
  assert.match(open, /open/);
  assert.match(open, /NOT a solution/);
  // Student wrote > where the circle is closed.
  const closed = diagnoseInequality("x > 6", prob("x ≥ 6", 6, "closed", "right"));
  assert.match(closed, /filled in/);
  assert.match(closed, /IS a solution/);
});

test("wrong direction tells the student to test a shaded number", () => {
  const msg = diagnoseInequality("x < 4", prob("x > 4", 4, "open", "right"));
  assert.match(msg, /shaded the wrong way|points right/);
  assert.match(msg, /test it/i);
  assert.ok(!/turns at/.test(msg), "reported a boundary error where the boundary was right");
});

test("both direction and circle wrong are reported together, not one at a time", () => {
  const msg = diagnoseInequality("x ≤ 4", prob("x > 4", 4, "open", "right"));
  assert.match(msg, /Two things/);
  assert.match(msg, /greater/);
  assert.match(msg, /open/);
});

test("a zero boundary is described with the sign intact", () => {
  const msg = diagnoseInequality("x > 0", prob("x < 0", 0, "open", "left"));
  assert.match(msg, /\bless\b/);
  assert.ok(!/turns at/.test(msg));
});

test("a negative boundary is not mistaken for a wrong boundary", () => {
  assert.equal(diagnoseInequality("x ≥ -3", prob("x ≥ -3", -3, "closed", "right")), null);
  const msg = diagnoseInequality("x > -3", prob("x ≥ -3", -3, "closed", "right"));
  assert.match(msg, /-3/);
  assert.match(msg, /IS a solution/);
});

test("unreadable input yields null so the caller can prompt for the form", () => {
  assert.equal(diagnoseInequality("dunno", prob("x > 4", 4, "open", "right")), null);
});

/* ── Equivalence ───────────────────────────────────────────────────────────── */

test("an equivalent inequality written the other way round is CORRECT", () => {
  // The student reads the graph left to right and writes the boundary first.
  // String comparison called this wrong, which is a correct answer marked wrong.
  assert.ok(matchesInequality("4 < x", "x > 4"));
  assert.ok(matchesInequality("6 ≥ x", "x ≤ 6"));
  assert.ok(matchesInequality("x>=5", "x ≥ 5"));
});

test("equivalence does not accept a genuinely different statement", () => {
  assert.ok(!matchesInequality("x ≥ 4", "x > 4"), "open/closed difference accepted");
  assert.ok(!matchesInequality("x < 4", "x > 4"), "direction difference accepted");
  assert.ok(!matchesInequality("x > 5", "x > 4"), "boundary difference accepted");
});

test("multi-step keys still compare as text, so nothing regresses", () => {
  assert.ok(matchesInequality("x + 4 > 10", "x + 4 > 10"));
  assert.ok(!matchesInequality("x > 6", "x + 4 > 10"));
});

/* ── Every authored problem in the curriculum is diagnosable ───────────────── */

test("the parser round-trips every authored inequality in the curriculum", async () => {
  const { readdirSync, readFileSync, existsSync } = await import("node:fs");
  // Resolved from this file, not cwd, so the sweep also runs standalone
  // (`npm test -w @eduwonderlab/engine` executes with cwd = engine/).
  const LESSONS = new URL("../../lessons/", import.meta.url).pathname;
  let checked = 0;
  let simple = 0;
  let multiStep = 0;
  for (const id of readdirSync(LESSONS)) {
    const path = `${LESSONS}${id}/config.json`;
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    if (!raw.includes("circleType")) continue;
    (function walk(n) {
      if (Array.isArray(n)) return n.forEach(walk);
      if (n && typeof n === "object") {
        /* A number-line problem, not a fill-table row: 8-5 authors a
         * "Inequality / Circle Type / Shade Direction" table whose rows also
         * carry `circleType` and `inequality`, but with a different schema
         * (`shadeDirection`, `boundaryIsSolution`) and prose values ("Open").
         * Requiring the numeric `boundary` and `direction` the renderer needs
         * is what tells the two apart. */
        if (n.circleType && n.inequality && n.boundary !== undefined && n.direction) {
          const parsed = parseInequality(n.inequality);
          if (parsed) {
            // A one-step answer describes the graph directly, so every fact
            // the parser reads must match the graph the component draws.
            assert.equal(parsed.boundary, n.boundary, `${id}: "${n.inequality}" boundary mismatch`);
            assert.equal(
              parsed.direction,
              n.direction,
              `${id}: "${n.inequality}" direction mismatch`,
            );
            assert.equal(
              parsed.inclusive,
              n.circleType === "closed",
              `${id}: "${n.inequality}" circle mismatch`,
            );
            simple += 1;
          } else {
            /* 8-6 graphs a SOLUTION SET and asks for the original two-step
             * inequality ("x + 4 > 10" for a graph of x > 6). The parser reads
             * one-step forms only, and declining is the right answer: a
             * diagnosis here would tell the student their correct answer has
             * the wrong boundary. What must hold is that it stays silent. */
            multiStep += 1;
          }
          // The authored answer must never be reported as an error, either way.
          assert.equal(
            diagnoseInequality(n.inequality, n),
            null,
            `${id}: the authored answer "${n.inequality}" was diagnosed as wrong`,
          );
          checked += 1;
        }
        Object.values(n).forEach(walk);
      }
    })(JSON.parse(raw));
  }
  assert.ok(checked > 20, `only ${checked} authored inequalities seen — the sweep found nothing`);
  assert.ok(simple > 10, `only ${simple} one-step answers checked — the round-trip proved little`);
  console.log(`    (${checked} authored: ${simple} one-step round-tripped, ${multiStep} multi-step correctly declined)`);
});

/* ── Placement diagnosis (the plot-a-point modes) ──────────────────────────── */

test("an opposite is named as an opposite, not as a distance", () => {
  const msg = diagnosePlacement(-3, 3, { step: 1 });
  assert.match(msg, /opposites/);
  assert.match(msg, /wrong side/);
  assert.ok(!/6 away/.test(msg), "fell back to the distance message");
});

test("opposites work in both directions and are not claimed for zero", () => {
  assert.match(diagnosePlacement(5, -5, { step: 1 }), /opposites/);
  assert.equal(diagnosePlacement(0, 0, { step: 1 }), null, "a correct placement was diagnosed");
});

test("a place-value slip is named by scale, not by subtraction", () => {
  const msg = diagnosePlacement(0.7, 0.07, { step: 0.01 });
  assert.match(msg, /digits are right/);
  assert.match(msg, /place/);
  const other = diagnosePlacement(0.07, 0.7, { step: 0.1 });
  assert.match(other, /digits are right/);
});

test("negative ordering is explained as further left means smaller", () => {
  // Student put -5 to the RIGHT of where it belongs (treated -5 as bigger).
  const msg = diagnosePlacement(-2, -5, { step: 1 });
  assert.match(msg, /further LEFT means smaller|further to the left/);
  assert.ok(!/opposites/.test(msg));
});

test("a small tick miscount says which way and how far, in ticks", () => {
  const msg = diagnosePlacement(4, 5, { step: 1 });
  assert.match(msg, /1 tick\b/);
  assert.match(msg, /left/);
  const two = diagnosePlacement(7, 5, { step: 1 });
  assert.match(two, /2 ticks/);
  assert.match(two, /right/);
});

test("ticks are counted in the line's own step, not in whole numbers", () => {
  const msg = diagnosePlacement(0.25, 0.5, { step: 0.25 });
  assert.match(msg, /1 tick\b/);
  assert.match(msg, /Each tick is 0\.25/);
});

test("an ambiguous miss returns null so the caller uses the distance message", () => {
  // Not an opposite, not a power of ten, not both negative, and 7 ticks off.
  assert.equal(diagnosePlacement(1, 8, { step: 1 }), null);
});

test("a correct placement is never diagnosed", () => {
  for (const v of [0, 3, -3, 0.25, -7.5]) {
    assert.equal(diagnosePlacement(v, v, { step: 0.25 }), null, `${v} was diagnosed`);
  }
});

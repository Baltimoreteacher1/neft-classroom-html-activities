/**
 * The student-built ratio table (engine/core/small-group-ratio-builder.js).
 *
 * Joel, 2026-10-06: students "should be able to create their own ratio tables
 * as the problems continue … that they put numbers into and they show the
 * multiplication or division." The checker must accept EVERY correct route a
 * student can take and reject the two mistakes that matter: a step that is
 * not done to both quantities, and a table that never contains the problem's
 * own ratio.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canBuildRatioTable,
  checkRatioTable,
  ratioTableSegments,
} from "@eduwonderlab/engine/core/small-group-ratio-builder.js";

const feet = {
  kind: "ratioTable",
  headers: ["Feet", "Inches"],
  rows: [
    [1, 12],
    [6, "?"],
  ],
};
const x = (k) => ({ sign: "×", k: String(k) });
const d = (k) => ({ sign: "÷", k: String(k) });

test("the straight route passes", () => {
  assert.equal(
    checkRatioTable(
      feet,
      [
        ["1", "12"],
        ["6", "72"],
      ],
      [x(6)],
    ).ok,
    true,
  );
});

test("a two-step route passes (× 2, then × 3)", () => {
  const r = checkRatioTable(
    feet,
    [
      ["1", "12"],
      ["2", "24"],
      ["6", "72"],
    ],
    [x(2), x(3)],
  );
  assert.equal(r.ok, true, r.msg);
});

test("a unit-rate bridge with ÷ then × passes, and fractions are read", () => {
  const paint = {
    kind: "ratioTable",
    headers: ["Red cans", "Yellow cans"],
    rows: [
      [4, 3],
      ["?", 1],
    ],
  };
  const r = checkRatioTable(
    paint,
    [
      ["4", "3"],
      ["1 1/3", "1"],
      ["8", "6"],
    ],
    [d(3), x(6)],
  );
  assert.equal(r.ok, true, r.msg);
});

test("a step done to only one quantity fails and names it", () => {
  const r = checkRatioTable(
    feet,
    [
      ["1", "12"],
      ["6", "18"],
    ],
    [x(6)],
  );
  assert.equal(r.ok, false);
  assert.match(r.msg, /works for Feet .* but not for Inches/);
});

test("adding instead of multiplying fails", () => {
  const r = checkRatioTable(
    feet,
    [
      ["1", "12"],
      ["7", "18"],
    ],
    [x(6)],
  );
  assert.equal(r.ok, false);
});

test("a consistent table that skips the problem's fact fails", () => {
  const r = checkRatioTable(
    feet,
    [
      ["2", "24"],
      ["6", "72"],
    ],
    [x(3)],
  );
  assert.equal(r.ok, false);
  assert.match(r.msg, /problem's fact/);
});

test("empty boxes and a missing arrow are reported, not graded", () => {
  assert.match(
    checkRatioTable(
      feet,
      [
        ["1", ""],
        ["6", "72"],
      ],
      [x(6)],
    ).msg,
    /Fill every box/,
  );
  assert.match(
    checkRatioTable(
      feet,
      [
        ["1", "12"],
        ["6", "72"],
      ],
      [{ sign: "×", k: "" }],
    ).msg,
    /arrow 1/,
  );
});

test("only plain one-chain ratio tables become builders", () => {
  assert.equal(canBuildRatioTable(feet), true);
  assert.equal(
    canBuildRatioTable({
      ...feet,
      rows: [
        [1, 12],
        [null, "?"],
      ],
    }),
    false,
  );
  assert.equal(canBuildRatioTable({ ...feet, scales: [null] }), true);
  assert.equal(canBuildRatioTable({ kind: "tape", rows: [] }), false);
});

test("a comparison table splits into one builder per option, named from the caption", () => {
  const packs = {
    kind: "ratioTable",
    headers: ["Apples", "Cost ($)"],
    rows: [
      [2, 1],
      [1, "?"],
      [5, 3],
      [1, "?"],
    ],
    scales: ["÷ ?", null, "÷ ?"],
    caption: "Pack A: first two columns. Pack B: last two.",
  };
  const segs = ratioTableSegments(packs);
  assert.deepEqual(
    segs.map((s) => s.name),
    ["Pack A", "Pack B"],
  );
  assert.deepEqual(segs[1].fig.rows, [
    [5, 3],
    [1, "?"],
  ]);
  // Each option is checked on its own: Pack B must contain 5 apples for $3.
  assert.equal(
    checkRatioTable(
      segs[1].fig,
      [
        ["5", "3"],
        ["1", "0.6"],
      ],
      [d(5)],
    ).ok,
    true,
  );
  assert.equal(
    checkRatioTable(
      segs[1].fig,
      [
        ["2", "1"],
        ["1", "0.5"],
      ],
      [d(2)],
    ).ok,
    false,
  );
});

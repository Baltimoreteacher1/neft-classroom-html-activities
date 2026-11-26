// Pure-function proof for the shared coordinate-plane maths.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  axisDistance,
  classifyPlacement,
  distinct,
  fmt,
  labelOf,
  lineKind,
  placeCorrect,
  plotCue,
  pt,
  quadrant,
  validPoint,
  validRange,
  varying,
} from "./plane-model.js";

test("fmt and pt use a real minus sign and exact decimals", () => {
  assert.equal(fmt(-3.75), "−3.75");
  assert.equal(fmt(4.5), "4.5");
  assert.equal(fmt(0), "0");
  assert.equal(fmt(-0), "0");
  assert.equal(pt({ x: -4.5, y: 3 }), "(−4.5, 3)");
});

test("quadrant is decided by the signs, and 0 for a point on an axis", () => {
  assert.equal(quadrant({ x: 4, y: 3 }), 1);
  assert.equal(quadrant({ x: -5, y: 2 }), 2);
  assert.equal(quadrant({ x: -3, y: -4 }), 3);
  assert.equal(quadrant({ x: 2, y: -5 }), 4);
  assert.equal(quadrant({ x: 0, y: 5 }), 0);
  assert.equal(quadrant({ x: -2, y: 0 }), 0);
});

test("validRange keeps the origin inside and the plane drawable", () => {
  const ok = { xmin: -6, xmax: 6, ymin: -5, ymax: 5 };
  assert.deepEqual(validRange(ok), ok);
  for (const bad of [
    null,
    {},
    { xmin: 1, xmax: 6, ymin: -5, ymax: 5 }, // origin outside
    { xmin: -6, xmax: 0.5, ymin: -5, ymax: 5 },
    { xmin: -20, xmax: 6, ymin: -5, ymax: 5 },
    { xmin: -1, xmax: 1, ymin: -5, ymax: 5 }, // too narrow
    { xmin: -9, xmax: 9, ymin: -5, ymax: 5 }, // wider than 16
  ])
    assert.equal(validRange(bad), null, JSON.stringify(bad));
});

test("validPoint accepts the quarter grid inside the range only", () => {
  const r = { xmin: -6, xmax: 6, ymin: -5, ymax: 5 };
  assert.deepEqual(validPoint({ x: -4.5, y: -3.75 }, r), { x: -4.5, y: -3.75 });
  for (const bad of [{ x: 7, y: 0 }, { x: 0, y: -6 }, { x: 0.1, y: 1 }, { x: "1", y: 1 }, null])
    assert.equal(validPoint(bad, r), null);
});

test("classifyPlacement names each real mistake and accepts the target", () => {
  const t = { x: -3, y: -4 };
  assert.equal(classifyPlacement(t, { x: -3, y: -4 }), "ok");
  assert.equal(classifyPlacement(t, { x: -4, y: -3 }), "swap");
  assert.equal(classifyPlacement(t, { x: 3, y: -4 }), "signx");
  assert.equal(classifyPlacement(t, { x: -3, y: 4 }), "signy");
  assert.equal(classifyPlacement(t, { x: 3, y: 4 }), "signs");
  assert.equal(classifyPlacement(t, { x: -1, y: -4 }), "x");
  assert.equal(classifyPlacement(t, { x: -3, y: -1 }), "y");
  assert.equal(classifyPlacement(t, { x: 1, y: 2 }), "both");
  // A point whose coordinates match cannot be "swapped".
  assert.equal(classifyPlacement({ x: 2, y: 2 }, { x: 3, y: 2 }), "x");
});

test("plotCue never says where the dot should go", () => {
  const t = { x: 5, y: 4 };
  for (const [kind, p] of [
    ["swap", { x: 4, y: 5 }],
    ["x", { x: 1, y: 4 }],
    ["y", { x: 5, y: 1 }],
    ["both", { x: 1, y: 1 }],
    ["signx", { x: -5, y: 4 }],
  ]) {
    const cue = plotCue(kind, t, p);
    for (const lang of ["en", "es"]) {
      assert.ok(cue[lang].length > 20, `${kind} ${lang}`);
      assert.ok(!/right 5|5 a la derecha|up 4|4 hacia arriba/i.test(cue[lang]), `${kind} ${lang}`);
    }
  }
});

test("distances along a row or column", () => {
  assert.equal(axisDistance({ x: -3, y: 2 }, { x: 4, y: 2 }), 7);
  assert.equal(axisDistance({ x: 1, y: -3 }, { x: 1, y: 5 }), 8);
  assert.equal(axisDistance({ x: 1, y: 1 }, { x: 2, y: 2 }), null);
  assert.equal(lineKind({ x: 1, y: 1 }, { x: 1, y: 1 }), null);
  assert.equal(lineKind({ x: 1, y: 1 }, { x: 5, y: 1 }), "horizontal");
  assert.deepEqual(varying({ x: 2, y: 3 }, { x: 2, y: 8 }), [3, 8]);
});

test("helpers: placeCorrect never fixes the correct choice at one spot, labelOf bounds text", () => {
  const opts = [{ correct: true, n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }];
  const spots = new Set();
  for (let seed = 0; seed < 8; seed++) {
    const out = placeCorrect(opts, seed);
    assert.equal(out.length, 4);
    assert.equal(out.filter((o) => o.correct).length, 1);
    spots.add(out.findIndex((o) => o.correct));
  }
  assert.ok(spots.size >= 3, "the correct choice moves around");
  assert.equal(distinct([{ n: 1 }, { n: 1 }, { n: 2 }], (o) => o.n).length, 2);
  assert.deepEqual(labelOf("Chest", null, 10), { en: "Chest", es: "Chest" });
  assert.equal(labelOf("a name that is far too long", "fallback", 10), "fallback");
});

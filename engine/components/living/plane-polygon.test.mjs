// Every number the plane-polygon play states (lesson 7-7), recomputed
// independently of the play.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENGLISH, lessonScene, strings } from "./_fixtures.mjs";
import { buildPlanePolygonPlay, validatePlanePolygon as reexported } from "./plane-polygon.js";
import {
  perimeterChoices,
  polygonCopy,
  rectangle,
  sideCalc,
  sideChoices,
  sideOf,
  validatePlanePolygon,
} from "./plane-polygon-model.js";

const CFG = lessonScene("7-7");
const V = validatePlanePolygon(CFG);
const R = { xmin: -6, xmax: 6, ymin: -5, ymax: 5 };

// Independent perimeter: walk the vertex list and add |dx| + |dy| of each hop.
const walk = (vs) =>
  vs.reduce((t, p, i) => {
    const q = vs[(i + 1) % vs.length];
    return t + Math.abs(q.x - p.x) + Math.abs(q.y - p.y);
  }, 0);

test("the authored scene builds with six scenes", () => {
  assert.equal(reexported, validatePlanePolygon);
  const play = buildPlanePolygonPlay(CFG);
  assert.ok(play);
  assert.equal(play.scenes.length, 6);
  assert.deepEqual(
    play.scenes.filter((s) => s.gate).map((s) => s.id),
    ["plot", "predict", "perimeter"],
  );
});

test("side lengths and perimeters equal an independent walk of the coordinates", () => {
  assert.deepEqual(
    V.first.sides.map((s) => s.len),
    [9.5, 6.75, 9.5, 6.75],
  );
  assert.equal(V.first.perimeter, 32.5);
  assert.equal(V.first.perimeter, walk(V.first.vs));
  assert.deepEqual(
    V.transfer.sides.map((s) => s.len),
    [5, 5, 5, 5],
  );
  assert.equal(V.transfer.perimeter, 20);
  assert.equal(V.transfer.perimeter, walk(V.transfer.vs));
  // The lesson's worked equation: 2(9.5) + 2(6.75) = 19 + 13.5 = 32.5.
  assert.equal(2 * 9.5 + 2 * 6.75, 32.5);
});

test("a side is horizontal or vertical by the shared coordinate", () => {
  const s = V.first.sides[0];
  assert.equal(s.horizontal, true);
  assert.equal(s.fixed, 3);
  assert.equal(s.opposite, true);
  assert.equal(sideCalc(s), "|5 − (−4.5)| = 9.5");
  const v = V.first.sides[1];
  assert.equal(v.horizontal, false);
  assert.equal(sideCalc(v), "|3 − (−3.75)| = 6.75");
  assert.equal(sideOf({ x: 1, y: 1 }, { x: 2, y: 2 }), null);
  assert.equal(sideCalc(V.transfer.sides[0]), "|6 − 1| = 5");
});

test("choice sets: one right answer, the rest are real mistakes and distinct", () => {
  const s = V.first.sides[0];
  const side = sideChoices(s);
  assert.deepEqual(
    side.map((o) => [o.kind, o.n]),
    [
      ["right", 9.5],
      ["sub", 0.5],
      ["shared", 3],
      ["whole", 9],
    ],
  );
  const per = perimeterChoices(V.first);
  assert.deepEqual(
    per.map((o) => [o.kind, o.n]),
    [
      ["right", 32.5],
      ["half", 16.25],
      ["area", 64.125],
      ["double", 19],
    ],
  );
  // The square: "half" and "double" coincide (10) and collapse into one choice.
  const sq = perimeterChoices(V.transfer);
  assert.deepEqual(
    sq.map((o) => o.n),
    [20, 10, 25],
  );
  const sqSide = sideChoices(V.transfer.sides[0]);
  assert.deepEqual(
    sqSide.map((o) => [o.kind, o.n]),
    [
      ["right", 5],
      ["add", 7],
      ["shared", 2],
    ],
  );
  for (const set of [side, per, sq, sqSide]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.n)).size, set.length);
  }
});

test("a wrong choice's cue never states the answer", () => {
  const T = polygonCopy(V);
  const s = V.first.sides[0];
  for (const o of sideChoices(s).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) assert.ok(!T.lengthCue(s, o)[lang].includes("9.5"), `${o.kind} ${lang}`);
  for (const o of perimeterChoices(V.first).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) assert.ok(!T.perimeterCue(V.first, o)[lang].includes("32.5"), `${o.kind} ${lang}`);
});

test("copy states the lesson's numbers", () => {
  const T = polygonCopy(V);
  assert.match(T.situateSay.en, /A \(−4\.5, 3\), B \(5, 3\), C \(5, −3\.75\), D \(−4\.5, −3\.75\)/);
  assert.match(T.predictSay.en, /share y = 3.*horizontal/);
  assert.match(T.perimeterOk(V.first).en, /2\(9\.5\) \+ 2\(6\.75\) = 19 \+ 13\.5 = 32\.5 units/);
  assert.match(T.perimeterOk(V.transfer).en, /2\(5\) \+ 2\(5\) = 10 \+ 10 = 20 units/);
  assert.match(T.measureDone.en, /two sides of 9\.5 and two of 6\.75/);
  assert.equal(T.perimeterCalc(V.first), "9.5 + 6.75 + 9.5 + 6.75 = 32.5");
});

test("validation refuses polygons it cannot place or measure", () => {
  const bad = (patch) => ({ ...CFG, ...patch });
  const rect = CFG.rect;
  assert.equal(validatePlanePolygon(null), null);
  assert.equal(validatePlanePolygon(bad({ rect: rect.slice(0, 3) })), null);
  assert.equal(validatePlanePolygon(bad({ rect: [rect[0], rect[2], rect[1], rect[3]] })), null); // a bow-tie order
  assert.equal(validatePlanePolygon(bad({ rect: [{ x: -4.5, y: 3 }, { x: 5, y: 3 }, { x: 5.1, y: -3.75 }, { x: -4.5, y: -3.75 }] })), null);
  assert.equal(validatePlanePolygon(bad({ rect: [{ x: -4.5, y: 3 }, { x: 7, y: 3 }, { x: 7, y: -3 }, { x: -4.5, y: -3 }] })), null); // off the plane
  assert.equal(validatePlanePolygon(bad({ transfer: rect })), null); // the same polygon twice
  const square = [{ x: 1, y: 2 }, { x: 6, y: 2 }, { x: 6, y: -3 }, { x: 1, y: -3 }];
  assert.equal(validatePlanePolygon(bad({ rect: square })), null); // sides must differ
  assert.equal(rectangle([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }], R), null);
  assert.equal(validatePlanePolygon({ ...CFG, range: { xmin: -6, xmax: 6, ymin: -5 } }), null);
});

test("Spanish carries no English", () => {
  const T = polygonCopy(V);
  const s = V.first.sides[0];
  const sample = [
    T.title,
    T.ariaLabel,
    T.printSummary,
    T.situateSay,
    T.plotQ(0),
    T.plotSay(0),
    T.plotOk(0),
    T.plotOk(3),
    T.place,
    T.predictSay,
    T.lengthQ(0),
    T.lengthOk(s),
    T.measureSay,
    T.measureDone,
    T.perimeterSay,
    T.perimeterQ,
    T.perimeterOk(V.first),
    T.transferSay,
    T.transferSideOk(V.transfer.sides[0]),
    T.explainLabel,
    T.explainFrame,
    Object.values(T.scene),
  ];
  for (const str of strings(sample, "es")) assert.ok(!ENGLISH.test(str), `English left in: ${str}`);
});

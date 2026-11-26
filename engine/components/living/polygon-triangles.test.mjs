// polygon-triangles.test.mjs — every number the polygon-triangles play shows a
// student, recomputed from vertices and integer arithmetic, not from the model.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { seedFor } from "./area-derive.js";
import {
  buildPolygonTrianglesPlay,
  validatePolygonTriangles as reexported,
} from "./polygon-triangles.js";
import {
  areaChoices,
  countChoices,
  isEstimate,
  outward,
  placeCorrect,
  polyArea,
  polygonCopy,
  readPoly,
  triangle,
  triArea,
  trueHeight,
  validatePolygonTriangles,
  verts,
} from "./polygon-triangles-model.js";

const lesson = JSON.parse(readFileSync(new URL("../../../lessons/5-9/config.json", import.meta.url), "utf8"));
const CFG = lesson.launch.conceptIntro.livingScene;
const close = (x, y) => Math.abs(x - y) < 1e-9;
const shoelace = (pts) =>
  Math.abs(
    pts.reduce((s, [x1, y1], i) => {
      const [x2, y2] = pts[(i + 1) % pts.length];
      return s + x1 * y2 - x2 * y1;
    }, 0),
  ) / 2;

/** Exact area in tenths: side and height are tenths, so ½·side·height needs no floats. */
const exactTri = (side, a) => (Math.round(side * 10) * Math.round(a * 10)) / 200;

test("the 5-9 scene uses the lesson's own hexagon, pentagon and octagon", () => {
  assert.equal(CFG.kind, "living-scene");
  assert.equal(CFG.play, "polygon-triangles");
  assert.deepEqual([CFG.n, CFG.side, CFG.a], [6, 6, 5.2]);
  const iDo = lesson.launch.conceptIntro.iDo.lines.join(" ");
  for (const s of ["6 equal sides", "5.2", "15.6", "93.6"]) assert.ok(iDo.includes(s), s);
  const table = lesson.explore.items.map((i) => i.polygon).join(" | ");
  assert.ok(table.includes("Pentagon — side 6 ft, triangle height 4 ft"));
  assert.ok(table.includes("Octagon — side 5 ft, triangle height 6 ft"));
  assert.deepEqual(CFG.second, { n: 5, side: 6, a: 4 });
  assert.deepEqual(CFG.transfer, { n: 8, side: 5, a: 6 });
  const play = buildPolygonTrianglesPlay(CFG);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["cut", true],
      ["connect", false],
      ["other", true],
      ["transfer", true],
    ],
  );
  assert.match(play.viewBox, /^0 0 440 \d+$/);
  assert.match(play.printSummary.en, /½ × 6 × 5\.2 = 15\.6/);
  assert.match(play.printSummary.en, /6 × 15\.6 = 93\.6/);
});

test("geometry: n congruent triangles from the center fill the polygon exactly", () => {
  for (const n of [3, 4, 5, 6, 7, 8, 9, 10, 12]) {
    const v = verts(n);
    assert.equal(v.length, n);
    for (const [x, y] of v) assert.ok(close(Math.hypot(x, y), 1), "on the unit circle");
    const side = 2 * Math.sin(Math.PI / n);
    const tri0 = shoelace(triangle(n, 0));
    for (let k = 0; k < n; k++) {
      const t = triangle(n, k);
      assert.ok(close(Math.hypot(t[1][0] - t[2][0], t[1][1] - t[2][1]), side), `side ${k}`);
      assert.ok(close(shoelace(t), tri0), `triangle ${k} is congruent in area`);
      // the center-to-side distance is the triangle's height: the outward direction meets the side at a right angle
      const [ox, oy] = outward(n, k);
      const sv = [t[2][0] - t[1][0], t[2][1] - t[1][1]];
      assert.ok(close(ox * sv[0] + oy * sv[1], 0), "outward is perpendicular to the side");
      const mid = [(t[1][0] + t[2][0]) / 2, (t[1][1] + t[2][1]) / 2];
      assert.ok(close(Math.hypot(...mid), Math.cos(Math.PI / n)), "height = cos(π/n) on the unit circle");
      assert.ok(close(mid[0] * oy - mid[1] * ox, 0), "the middle of the side lies along the outward direction");
    }
    assert.ok(close(shoelace(v), n * tri0), "the triangles tile the polygon");
    // bottom side is flat: triangle 0 points straight down
    assert.deepEqual(outward(n, 0).map((x) => Math.round(x * 1e9) / 1e9), [0, 1]);
    assert.ok(close(v[0][1], v[1][1]) && v[0][1] > 0, "flat side down");
  }
});

test("areas: one triangle and the whole polygon, from integer arithmetic", () => {
  const cases = [
    [CFG, 15.6, 93.6],
    [CFG.second, 12, 60],
    [CFG.transfer, 15, 120],
  ];
  for (const [spec, tri, whole] of cases) {
    const s = readPoly(spec);
    assert.equal(exactTri(s.side, s.a), tri);
    assert.equal(triArea(s), tri);
    assert.equal(polyArea(s), whole);
    assert.equal(s.n * exactTri(s.side, s.a), whole);
  }
  assert.equal(polyArea(readPoly({ n: 6, side: 8, a: 7 })), 168); // the lesson's own explore table
  assert.equal(polyArea(readPoly({ n: 4, side: 10, a: 5 })), 100);
});

test("the lesson's rounded heights agree with the polygons they label", () => {
  for (const spec of [CFG, CFG.second, CFG.transfer]) {
    const err = Math.abs(spec.a - trueHeight(spec.n, spec.side)) / trueHeight(spec.n, spec.side);
    assert.ok(err < 0.05, `${spec.n}-gon: ${(err * 100).toFixed(1)}% off`);
  }
  assert.equal(isEstimate(readPoly(CFG)), false);
  assert.equal(isEstimate(readPoly(CFG.second)), true);
  assert.equal(isEstimate(readPoly(CFG.transfer)), false);
});

test("choices: one correct; the wrong ones are real misconceptions, recomputed", () => {
  assert.deepEqual(
    countChoices(6).map((o) => [o.kind, o.value]),
    [
      ["count", 6],
      ["fromCorner", 4], // n − 2: cutting from one corner
      ["half", 3],
      ["double", 12],
    ],
  );
  assert.deepEqual(
    countChoices(5).map((o) => o.value),
    [5, 3, 10],
    "an odd polygon has no half",
  );
  const second = areaChoices(readPoly(CFG.second));
  assert.deepEqual(
    second.map((o) => [o.kind, o.value]),
    [
      ["total", 60],
      ["one", 12],
      ["noHalf", 5 * 6 * 4],
      ["fromCorner", 3 * 12],
    ],
  );
  const transfer = areaChoices(readPoly(CFG.transfer));
  assert.deepEqual(
    transfer.map((o) => o.value),
    [120, 15, 8 * 5 * 6, 6 * 15],
  );
  for (const set of [countChoices(6), second, transfer]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length);
    assert.ok(set[0].correct);
  }
});

test("validatePolygonTriangles refuses polygons the stage cannot draw correctly", () => {
  assert.ok(validatePolygonTriangles(CFG));
  const bad = [
    null,
    {},
    { ...CFG, n: 2 },
    { ...CFG, n: 13 },
    { ...CFG, n: 11 }, // no name for it
    { ...CFG, n: 6.5 },
    { ...CFG, side: 0 },
    { ...CFG, side: 6.25 }, // not a tenth
    { ...CFG, a: 8 }, // a hexagon with side 6 cannot have a height of 8
    { ...CFG, a: 3 },
    { ...CFG, side: -6 },
  ];
  for (const cfg of bad) {
    assert.equal(validatePolygonTriangles(cfg), null, JSON.stringify(cfg));
    assert.equal(buildPolygonTrianglesPlay(cfg), null);
  }
  // a missing or broken second/transfer polygon falls back to the lesson family's own
  const v = validatePolygonTriangles({ ...CFG, second: { n: 5, side: 6, a: 9 }, transfer: undefined });
  assert.equal(polyArea(v.second.spec), 60);
  assert.equal(polyArea(v.transfer.spec), 120);
  assert.equal(reexported, validatePolygonTriangles);
});

test("copy: every line has English and Spanish, no leftovers, tú register", () => {
  const v = validatePolygonTriangles(CFG);
  const T = polygonCopy(v);
  const out = [];
  const walk = (o) => {
    if (o && typeof o === "object" && "en" in o && "es" in o) return out.push(o);
    if (o && typeof o === "object") Object.values(o).forEach(walk);
  };
  walk(T);
  out.push(T.cutKeep(2));
  for (const o of countChoices(6).filter((x) => !x.correct)) out.push(T.cueCount(o));
  for (const spec of [v.second.spec, v.transfer.spec])
    for (const o of areaChoices(spec).filter((x) => !x.correct)) out.push(T.cueArea(o, spec));
  assert.ok(out.length > 25);
  for (const p of out) {
    assert.ok(p.en.trim() && p.es.trim());
    assert.doesNotMatch(p.en + p.es, /undefined|NaN|\[object/);
    assert.doesNotMatch(p.es, /\b(usted|ustedes|vosotros)\b/i);
    assert.doesNotMatch(p.es, /\b(the|and|height|triangles|center|sides|square feet)\b/i, p.es);
    assert.doesNotMatch(p.en, /centre/, "US spelling");
  }
});

test("copy: a wrong pick's cue never states the answer", () => {
  const v = validatePolygonTriangles(CFG);
  const T = polygonCopy(v);
  const stated = (text, n) => new RegExp(`(^|[^\\d.])${n}([^\\d.]|$)`).test(text);
  for (const o of countChoices(6).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) assert.ok(!stated(T.cueCount(o)[lang], 6), o.kind);
  for (const [spec, answer] of [
    [v.second.spec, 60],
    [v.transfer.spec, 120],
  ])
    for (const o of areaChoices(spec).filter((x) => !x.correct))
      for (const lang of ["en", "es"]) assert.ok(!stated(T.cueArea(o, spec)[lang], answer), `${o.kind}`);
  assert.match(T.connectSay1.en, /½ × 6 × 5\.2 = 15\.6/);
  assert.match(T.connectSay2.en, /6 × 15\.6 = 93\.6/);
  assert.match(T.otherOk.en, /5 × 12 = 60/);
  assert.match(T.transferOk.en, /8 × 15 = 120/);
  assert.match(T.otherSay.en, /rounded/, "the pentagon's rounded height is flagged as an estimate");
  assert.doesNotMatch(T.situateSay.en, /rounded/);
});

test("placeCorrect never leaves the correct choice first for the authored seeds", () => {
  const v = validatePolygonTriangles(CFG);
  const seeds = [
    [countChoices(6), seedFor(4, 6, 6)],
    [areaChoices(v.second.spec), seedFor(4, 60, 5, 6)],
    [areaChoices(v.transfer.spec), seedFor(4, 120, 8, 5)],
  ];
  for (const [set, seed] of seeds) {
    const placed = placeCorrect(set, seed);
    assert.notEqual(placed.findIndex((o) => o.correct), 0);
    assert.equal(placed.length, set.length);
  }
});

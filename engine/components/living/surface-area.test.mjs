// surface-area.test.mjs — every number the surface-area play states, recomputed
// independently of the play, plus validation and the choice sets.
import assert from "node:assert/strict";
import { test } from "node:test";
import { rectPrism, squarePyramid, triPrism } from "./net-fold-model.js";
import { buildSurfaceAreaPlay, validateSurfaceArea as reexported } from "./surface-area.js";
import {
  lengthChoices,
  placeCorrect,
  pyramidArea,
  pyramidChoices,
  sizeChoices,
  surfaceAreaCopy,
  triPrismArea,
  triPrismChoices,
  validateSurfaceArea,
} from "./surface-area-model.js";

// 5-7: the 5 × 4 × 3 cm prism of the guided example, then the triangular prism of the worked example.
const PRISM = {
  mode: "prism",
  l: 5,
  w: 4,
  h: 3,
  unit: "cm",
  transfer: { b: 6, hg: 4, s: 5, len: 10, unit: "in" },
};
// 5-8: the 6 × 6 in base, slant height 8 in; then the 4 × 4 in base, slant 5 in.
const PYRAMID = { mode: "pyramid", b: 6, sl: 8, unit: "in", transfer: { b: 4, sl: 5 } };

test("prism: 94 cm² is the sum of six faces, found two independent ways", () => {
  const faces = rectPrism(5, 4, 3).faces.map((f) => f.area);
  assert.deepEqual(faces.sort((a, b) => a - b), [12, 12, 15, 15, 20, 20]);
  assert.equal(faces.reduce((a, b) => a + b, 0), 94);
  assert.equal(2 * (5 * 4) + 2 * (5 * 3) + 2 * (4 * 3), 94);
});

test("triangular prism: 184 in² = 2 triangles (12 each) + 60 + 50 + 50", () => {
  const faces = triPrism(6, 4, 5, 10).faces;
  const byShape = (sh) => faces.filter((f) => f.shape === sh).map((f) => f.area);
  assert.deepEqual(byShape("tri"), [12, 12]);
  assert.deepEqual(byShape("rect").sort((a, b) => a - b), [50, 50, 60]);
  assert.equal(faces.reduce((a, f) => a + f.area, 0), 184);
  assert.equal(triPrismArea(6, 4, 5, 10), 184);
  assert.equal(faces.length, 5);
});

test("pyramid: 132 in² = base 36 + four faces of 24; and 56 for the 4 × 4, slant 5 pyramid", () => {
  const faces = squarePyramid(6, 8).faces;
  assert.deepEqual(faces.map((f) => f.area), [36, 24, 24, 24, 24]);
  assert.equal(faces.reduce((a, f) => a + f.area, 0), 132);
  assert.equal(pyramidArea(6, 8), 132);
  assert.equal(pyramidArea(4, 5), 56);
  assert.equal(squarePyramid(4, 5).faces.reduce((a, f) => a + f.area, 0), 56);
});

test("the slant height, not the pyramid's height, is the triangle's height", () => {
  const b = 6;
  const sl = 8;
  const height = Math.sqrt(sl * sl - (b / 2) ** 2); // straight up inside
  assert.ok(height < sl);
  assert.notEqual((b * height) / 2, (b * sl) / 2);
  assert.equal((b * sl) / 2, 24);
});

test("choice sets: one correct, the rest are named slips with the values they would give", () => {
  const tri = triPrismChoices(6, 4, 5, 10);
  assert.deepEqual(tri.map((o) => [o.kind, o.value]), [
    ["total", 184],
    ["rects", 160], // only the three rectangles
    ["oneTriangle", 172], // 160 + 12
    ["noHalf", 208], // 160 + 2 × (6 × 4)
  ]);
  const pyr = pyramidChoices(4, 5);
  assert.deepEqual(pyr.map((o) => [o.kind, o.value]), [
    ["total", 56],
    ["noBase", 40], // 4 × 10
    ["noHalf", 96], // 16 + 4 × 20
    ["oneFace", 26], // 16 + 10
  ]);
  for (const set of [tri, pyr, pyramidChoices(6, 8), sizeChoices]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length);
  }
  assert.equal(sizeChoices.find((o) => o.correct).value, 3);
  assert.equal(lengthChoices(6, 8).find((o) => o.correct).kind, "slant");
  assert.equal(lengthChoices(6, 8).filter((o) => o.correct).length, 1);
});

test("placeCorrect varies the slot of the right answer", () => {
  const slots = new Set();
  for (let seed = 0; seed < 8; seed++)
    slots.add(placeCorrect(triPrismChoices(6, 4, 5, 10), seed).findIndex((o) => o.correct));
  assert.ok(slots.size > 1, "the right answer is not always in the same slot");
});

test("validation accepts the lesson configs", () => {
  const a = validateSurfaceArea(PRISM);
  assert.deepEqual([a.l, a.w, a.h, a.tri.s, a.unit.sq.en, a.triUnit.sq.en], [5, 4, 3, 5, "cm²", "in²"]);
  assert.ok(a.hMax >= 6);
  const b = validateSurfaceArea(PYRAMID);
  assert.deepEqual([b.b, b.sl, b.tr.b, b.tr.sl, b.slMin], [6, 8, 4, 5, 4]);
  assert.ok(b.slMax <= 14 && b.slMax > b.sl);
  assert.equal(validateSurfaceArea({ ...PYRAMID, transfer: undefined }).tr.b, 4);
  assert.equal(validateSurfaceArea({ ...PYRAMID, b: 4, sl: 5, transfer: undefined }).tr.b, 6);
  assert.equal(validateSurfaceArea({ ...PRISM, transfer: undefined }).tri.len, 10);
  assert.ok(reexported === validateSurfaceArea);
});

test("validation refuses what the stage cannot draw correctly", () => {
  const bad = [
    null,
    {},
    { mode: "cone" },
    { ...PRISM, l: 4 }, // l = w
    { ...PRISM, h: 2.5 },
    { ...PRISM, l: 11 },
    { ...PRISM, unit: "yard" },
    { ...PRISM, transfer: { b: 6, hg: 4, s: 6, len: 10 } }, // sides are not 5: 3² + 4² ≠ 6²
    { ...PRISM, transfer: { b: 5, hg: 4, s: 5, len: 10 } }, // odd base
    { ...PRISM, transfer: { b: 6, hg: 4, s: 5, len: 0 } },
    { ...PYRAMID, b: 5 }, // odd base: a triangle area would not be a whole number
    { ...PYRAMID, sl: 3 }, // slant height must exceed half the base to close
    { ...PYRAMID, sl: 15 },
    { ...PYRAMID, transfer: { b: 6, sl: 8 } }, // same pyramid as the main one
    { ...PYRAMID, transfer: { b: 4, sl: 2 } },
    { ...PYRAMID, b: 13 },
  ];
  for (const cfg of bad) {
    assert.equal(validateSurfaceArea(cfg), null, JSON.stringify(cfg));
    assert.equal(buildSurfaceAreaPlay(cfg), null, JSON.stringify(cfg));
  }
});

test("the plays: six scenes each, gates at predict, find, what-if", () => {
  const shape = (cfg) => buildSurfaceAreaPlay(cfg).scenes.map((s) => [s.id, !!s.gate]);
  assert.deepEqual(shape(PRISM), [
    ["net", false],
    ["predict", true],
    ["pairs", true],
    ["formula", false],
    ["what", true],
    ["transfer", false],
  ]);
  assert.deepEqual(shape(PYRAMID), [
    ["net", false],
    ["predict", true],
    ["faces", true],
    ["formula", false],
    ["what", true],
    ["transfer", false],
  ]);
  for (const cfg of [PRISM, PYRAMID]) {
    const play = buildSurfaceAreaPlay(cfg);
    assert.doesNotMatch(play.title.en, /\d/, "the title never gives away a number");
  }
});

test("prism copy: statements recomputed", () => {
  const v = validateSurfaceArea(PRISM);
  const T = surfaceAreaCopy(v);
  assert.match(T.formulaExpr.en, /2\(5 × 4\) \+ 2\(5 × 3\) \+ 2\(4 × 3\) = 40 \+ 30 \+ 24 = 94 cm²/);
  assert.match(T.formulaExpr.es, /= 94 cm²/);
  assert.match(T.printSummary.en, /= 94 cm²/);
  assert.match(T.printSummary.en, /2 × 12 \+ 60 \+ 50 \+ 50 = 184 in²/);
  assert.match(T.transferOk.en, /24 \+ 160 = 184 in²/);
  assert.match(T.transferOk.es, /184 pulg²/);
  assert.match(T.pairPick("right", "left").en, /^Right is 4 × 3 = 12 cm²\. Left matches it, so it is also 12\./);
  assert.match(T.pairPick("top", "bottom").es, /^Arriba mide 5 × 4 = 20 cm²\. Abajo es igual/);
  // every what-if height: the total is 2(lw + lh + wh), recomputed here
  for (let h = 1; h <= v.hMax; h++) {
    const total = 2 * (5 * 4 + 5 * h + 4 * h);
    assert.ok(T.whatRow(h).en.endsWith(`= ${total} cm².`), `h=${h}`);
    assert.ok(T.whatExpr(h).endsWith(`= ${total}`));
    assert.ok(T.whatRow(h).en.includes(`Top and Bottom stay 20 each`));
  }
});

test("pyramid copy: statements recomputed", () => {
  const v = validateSurfaceArea(PYRAMID);
  const T = surfaceAreaCopy(v);
  assert.match(T.formulaExpr.en, /6 × 6 \+ 4\(½ × 6 × 8\) = 36 \+ 96 = 132 in²/);
  assert.match(T.predictOk.en, /½ × 6 × 8 = 24/);
  assert.match(T.transferOk.en, /4 × 4 \+ 4\(½ × 4 × 5\) = 16 \+ 40 = 56 in²/);
  assert.match(T.transferOk.es, /= 56 pulg²/);
  for (let s = v.slMin; s <= v.slMax; s++) {
    const tri = (6 * s) / 2;
    assert.ok(Number.isInteger(tri));
    assert.ok(T.whatRow(s).en.includes(`= ${tri}. Total: 36 + 4 × ${tri} = ${36 + 4 * tri} in².`), `s=${s}`);
  }
  assert.match(T.slantLabel(8).es, /inclinada 8/);
});

test("cues name the slip and never state the correct total", () => {
  const prism = surfaceAreaCopy(validateSurfaceArea(PRISM));
  for (const o of triPrismChoices(6, 4, 5, 10).filter((x) => !x.correct)) {
    const c = prism.transferCue(o.kind, o.value);
    for (const lang of ["en", "es"]) {
      assert.ok(c[lang].includes(String(o.value)) && c[lang].includes("?"), `${o.kind} ${lang}`);
      assert.doesNotMatch(c[lang], /\b184\b/);
    }
  }
  for (const kind of ["all", "one", "two"]) {
    const c = prism.predictCue(kind);
    assert.ok(c.en.includes("?") && c.es.includes("?"));
    assert.doesNotMatch(c.en + c.es, /\b3 (sizes|tamaños)\b/);
  }
  const pyr = surfaceAreaCopy(validateSurfaceArea(PYRAMID));
  for (const o of pyramidChoices(4, 5).filter((x) => !x.correct)) {
    const c = pyr.transferCue(o.kind, o.value);
    assert.ok(c.en.includes("?") && c.es.includes("?"));
    assert.doesNotMatch(c.en + c.es, /\b56\b/);
  }
  for (const kind of ["base", "height"]) {
    const c = pyr.lengthCue(kind);
    assert.ok(c.en.includes("?") && c.es.includes("?"));
    assert.doesNotMatch(c.en, /slant height is|is the slant/i, "the cue points; it does not state the answer");
  }
});

test("Spanish copy has no leftover English cue words and no usted forms", () => {
  for (const cfg of [PRISM, PYRAMID]) {
    const T = surfaceAreaCopy(validateSurfaceArea(cfg));
    const es = JSON.stringify(
      Object.values(T)
        .filter((x) => x && typeof x === "object" && typeof x.es === "string")
        .map((x) => x.es),
    );
    assert.doesNotMatch(es, /\b(the|and|face|faces|surface|base area|slant)\b/i);
    assert.doesNotMatch(es, /\busted|vosotros/i);
  }
});

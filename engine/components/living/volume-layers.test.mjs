// volume-layers.test.mjs — every number the volume-layers play states, recomputed
// independently, plus validation and the choice sets.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildVolumeLayersPlay, validateVolumeLayers as reexported } from "./volume-layers.js";
import {
  fmt,
  orientations,
  placeCorrect,
  stepOf,
  validateVolumeLayers,
  volume,
  volumeChoices,
  volumeCopy,
} from "./volume-layers-model.js";

// 5-5: the 6 × 4 × 3 capsule box, then the 5 × 2 × 2 box. 5-10: 4 × 2 × 0.5, then 4 × 3 × 1.5.
const WHOLE = { mode: "whole", l: 6, w: 4, h: 3, unit: "units", transfer: { l: 5, w: 2, h: 2 } };
const FRACTION = { mode: "fraction", l: 4, w: 2, h: 0.5, unit: "units", transfer: { l: 4, w: 3, h: 1.5 } };

test("volume = base area × height = l × w × h, for every box the lessons use", () => {
  for (const [l, w, h, B, V] of [
    [6, 4, 3, 24, 72],
    [5, 2, 2, 10, 20],
    [4, 2, 0.5, 8, 4],
    [4, 3, 1.5, 12, 18],
  ]) {
    assert.equal(volume(l, w, h), V);
    assert.equal(l * w * h, V);
    assert.equal(B * h, V);
  }
  // counting layers: three layers of 24 cubes
  assert.equal(24 + 24 + 24, 72);
  // half a layer: half of 8
  assert.equal(8 / 2, 4);
});

test("orientations: every way to stand the box has the same volume", () => {
  for (const [l, w, h] of [
    [6, 4, 3],
    [4, 2, 0.5],
  ]) {
    const ors = orientations(l, w, h);
    assert.equal(ors.length, 3);
    for (const o of ors) assert.equal(o.base * o.r, l * w * h);
    assert.deepEqual(
      ors.map((o) => [o.p, o.q, o.r].sort((a, b) => a - b)),
      Array(3).fill([l, w, h].sort((a, b) => a - b)),
    );
  }
  assert.deepEqual(orientations(6, 4, 3).map((o) => o.base), [24, 18, 12]);
});

test("choice sets: one correct, each wrong value is a named slip", () => {
  const w = volumeChoices("whole", 6, 4, 3);
  assert.deepEqual(w.map((o) => [o.kind, o.value]), [
    ["total", 72],
    ["add", 13], // 6 + 4 + 3
    ["base", 24], // one layer only
    ["baseplus", 27], // 24 + 3
  ]);
  const f = volumeChoices("fraction", 4, 2, 0.5);
  assert.deepEqual(f.map((o) => [o.kind, o.value]), [
    ["total", 4],
    ["add", 6.5],
    ["base", 8], // a whole layer
    ["divide", 16], // 8 ÷ 0.5
  ]);
  assert.deepEqual(volumeChoices("fraction", 4, 3, 1.5).map((o) => o.value), [18, 8.5, 12, 8]);
  assert.deepEqual(volumeChoices("whole", 5, 2, 2).map((o) => o.value), [20, 9, 10, 12]);
  for (const set of [w, f]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length);
  }
  assert.equal(volumeChoices("whole", 3, 2, 1), null, "6 = 3 + 2 + 1: two choices would coincide");
});

test("placeCorrect varies the slot of the right answer", () => {
  const slots = new Set();
  for (let seed = 0; seed < 8; seed++)
    slots.add(placeCorrect(volumeChoices("whole", 6, 4, 3), seed).findIndex((o) => o.correct));
  assert.ok(slots.size > 1);
});

test("fmt prints exact half-unit numbers", () => {
  assert.equal(fmt(4), "4");
  assert.equal(fmt(0.5), "0.5");
  assert.equal(fmt(13.5), "13.5");
  assert.equal(fmt(8 * 1.5), "12");
  assert.equal(stepOf("whole"), 1);
  assert.equal(stepOf("fraction"), 0.5);
});

test("validation accepts the lesson configs and fills what the stage needs", () => {
  const a = validateVolumeLayers(WHOLE);
  assert.deepEqual([a.l, a.w, a.h, a.tr.l, a.step, a.stackMax], [6, 4, 3, 5, 1, 3]);
  const b = validateVolumeLayers(FRACTION);
  assert.deepEqual([b.l, b.w, b.h, b.tr.h, b.step, b.stackMax], [4, 2, 0.5, 1.5, 0.5, 1]);
  assert.equal(validateVolumeLayers({ ...WHOLE, transfer: undefined }).tr.l, 5);
  assert.equal(validateVolumeLayers({ ...FRACTION, transfer: undefined }).tr.h, 1.5);
  assert.ok(reexported === validateVolumeLayers);
});

test("validation refuses what the stage cannot draw correctly", () => {
  const bad = [
    null,
    {},
    { ...WHOLE, mode: "tenths" },
    { ...WHOLE, h: 1.5 }, // 5-5 is whole-number edges only
    { ...WHOLE, l: 11 },
    { ...WHOLE, w: 0 },
    { ...WHOLE, unit: "yard" },
    { ...WHOLE, l: 1, w: 1 }, // a one-square floor
    { ...WHOLE, transfer: { l: 6, w: 4, h: 3 } }, // same volume as the main box
    { ...WHOLE, transfer: { l: 2.5, w: 2, h: 2 } },
    { ...FRACTION, h: 1 }, // 5-10 needs a fractional edge
    { ...FRACTION, h: 0.3 },
    { ...FRACTION, l: 4.5 }, // the floor of the main box is whole
    { ...FRACTION, transfer: { l: 4, w: 3, h: 2 } }, // the transfer needs a fractional edge too
    { ...FRACTION, transfer: { l: 4, w: 2, h: 0.5 } },
  ];
  for (const cfg of bad) {
    assert.equal(validateVolumeLayers(cfg), null, JSON.stringify(cfg));
    assert.equal(buildVolumeLayersPlay(cfg), null, JSON.stringify(cfg));
  }
  // a fractional width in the transfer box is fine (partial floor tiles)
  assert.ok(validateVolumeLayers({ ...FRACTION, transfer: { l: 3, w: 1.5, h: 2 } }));
});

test("the plays: whole has a 'turn the box' gate, fraction has a 'two ways' connect", () => {
  assert.deepEqual(buildVolumeLayersPlay(WHOLE).scenes.map((s) => [s.id, !!s.gate]), [
    ["situate", false],
    ["predict", true],
    ["floor", true],
    ["stack", true],
    ["tip", true],
    ["transfer", false],
  ]);
  assert.deepEqual(buildVolumeLayersPlay(FRACTION).scenes.map((s) => [s.id, !!s.gate]), [
    ["situate", false],
    ["predict", true],
    ["floor", true],
    ["stack", true],
    ["connect", false],
    ["transfer", false],
  ]);
  for (const cfg of [WHOLE, FRACTION]) assert.doesNotMatch(buildVolumeLayersPlay(cfg).title.en, /\d/);
});

test("copy: whole mode statements recomputed", () => {
  const T = volumeCopy(validateVolumeLayers(WHOLE));
  assert.match(T.floorDone.en, /6 × 4 = 24 squares/);
  assert.equal(T.rowsExpr(2), "2 × 6 = 12");
  assert.equal(T.rowsExpr(0), "");
  assert.equal(T.stackExpr(2), "24 × 2 = 48");
  assert.match(T.stackRow(3).en, /^3 layers: 24 × 3 = 72 cubes$/);
  assert.match(T.stackRow(1).es, /^1 capa: 24 × 1 = 24 cubos$/);
  assert.match(T.stackDone.en, /3 layers of 24 cubes: 24 × 3 = 72 cubes/);
  assert.equal(T.tipExpr(orientations(6, 4, 3)[1]), "(6 × 3) × 4 = 18 × 4 = 72");
  assert.match(T.tipDone.en, /72 cubic units/);
  assert.match(T.tipLabel(orientations(6, 4, 3)[2]).en, /^Base 4 × 3, height 6$/);
  assert.match(T.transferOk.en, /base 5 × 2 = 10, then 10 × 2 = 20 cubic units/);
  assert.match(T.transferOk.es, /20 unidades cúbicas/);
  assert.match(T.printSummary.en, /6 × 4 = 24 unit squares/);
  assert.match(T.printSummary.en, /24 × 3 = 72 cubic units/);
});

test("copy: fraction mode statements recomputed", () => {
  const T = volumeCopy(validateVolumeLayers(FRACTION));
  assert.equal(T.stackExpr(0.5), "8 × 0.5 = 4");
  assert.equal(T.stackExpr(1), "8 × 1 = 8");
  assert.match(T.stackDone.en, /8 × 0.5 = 4 cubic units\. The box is shorter than one full layer, so the volume is less than 8\./);
  assert.match(T.stackDone.es, /8 × 0.5 = 4 unidades cúbicas/);
  assert.match(T.stackRow(1).en, /^Height 1: 8 × 1 = 8 cubic units$/);
  assert.equal(T.connectExpr, "4 × 2 × 0.5 = 8 × 0.5 = 4");
  assert.equal(T.transferExpr, "12 × 1.5 = 18");
  assert.match(T.transferOk.en, /base 4 × 3 = 12, then 12 × 1.5 = 18 cubic units/);
  assert.match(T.printSummary.es, /V = B × h = 8 × 0.5 = 4 unidades cúbicas/);
});

test("cues name the slip and never state the correct volume", () => {
  for (const [cfg, total, ttotal] of [
    [WHOLE, 72, 20],
    [FRACTION, 4, 18],
  ]) {
    const v = validateVolumeLayers(cfg);
    const T = volumeCopy(v);
    for (const o of volumeChoices(v.mode, v.l, v.w, v.h).filter((x) => !x.correct)) {
      const c = T.predictCue(o.kind, o.value);
      for (const g of ["en", "es"]) {
        assert.ok(c[g].includes(fmt(o.value)) && c[g].includes("?"), `${v.mode} ${o.kind} ${g}`);
        assert.doesNotMatch(c[g], new RegExp(`(=\\s*|volume is )${total}(?![\\d.])`), "the cue never states the volume");
      }
    }
    for (const o of volumeChoices(v.mode, v.tr.l, v.tr.w, v.tr.h).filter((x) => !x.correct)) {
      const c = T.transferCue(o.kind, o.value);
      for (const g of ["en", "es"]) {
        assert.ok(c[g].includes(fmt(o.value)));
        assert.doesNotMatch(c[g], new RegExp(`(=\\s*|volume is )${ttotal}(?![\\d.])`));
      }
    }
  }
});

test("Spanish copy has no leftover English cue words and no usted forms", () => {
  for (const cfg of [WHOLE, FRACTION]) {
    const T = volumeCopy(validateVolumeLayers(cfg));
    const es = JSON.stringify(
      Object.values(T)
        .filter((x) => x && typeof x === "object" && typeof x.es === "string")
        .map((x) => x.es),
    );
    assert.doesNotMatch(es, /\b(the|and|layer|layers|cubes|height|stack)\b/i);
    assert.doesNotMatch(es, /\busted|vosotros/i);
  }
});

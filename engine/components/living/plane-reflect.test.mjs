// Every number the plane-reflect play states (lesson 7-9), recomputed
// independently of the play.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENGLISH, lessonScene, strings } from "./_fixtures.mjs";
import { buildPlaneReflectPlay, validatePlaneReflect as reexported } from "./plane-reflect.js";
import {
  classifyReflection,
  distToAxis,
  pointChoices,
  reflect,
  reflectCopy,
  validatePlaneReflect,
} from "./plane-reflect-model.js";

const CFG = lessonScene("7-9");
const V = validatePlaneReflect(CFG);

test("the authored scene builds with six scenes", () => {
  assert.equal(reexported, validatePlaneReflect);
  const play = buildPlaneReflectPlay(CFG);
  assert.ok(play);
  assert.equal(play.scenes.length, 6);
  assert.deepEqual(
    play.scenes.filter((s) => s.gate).map((s) => s.id),
    ["predict", "flip", "other"],
  );
});

test("reflections equal the lesson's: over the y-axis x flips, over the x-axis y flips", () => {
  assert.deepEqual(reflect({ x: 3, y: 2 }, "y"), { x: -3, y: 2 });
  assert.deepEqual(reflect({ x: 4, y: -5 }, "x"), { x: 4, y: 5 });
  assert.deepEqual(reflect({ x: 3, y: 5 }, "x"), { x: 3, y: -5 });
  assert.deepEqual(reflect({ x: -4, y: 2 }, "y"), { x: 4, y: 2 });
  assert.deepEqual(reflect({ x: -2, y: -3 }, "x"), { x: -2, y: 3 });
  // The triangle's image, vertex by vertex.
  assert.deepEqual(
    V.vs.map((p) => reflect(p, V.axisS)),
    [
      { x: -1, y: 2 },
      { x: -4, y: 2 },
      { x: -4, y: 6 },
    ],
  );
});

test("an independent definition agrees: same distance from the mirror, other side", () => {
  for (const [p, axis] of [
    [V.P, V.axisP],
    [V.Q, V.axisQ],
    ...V.vs.map((p) => [p, V.axisS]),
  ]) {
    const t = reflect(p, axis);
    assert.equal(distToAxis(t, axis), distToAxis(p, axis));
    // Landing on the other side: the changed coordinate has the opposite sign.
    const k = axis === "y" ? "x" : "y";
    assert.equal(Math.sign(t[k]), -Math.sign(p[k]));
    // The other coordinate is untouched.
    const o = axis === "y" ? "y" : "x";
    assert.equal(t[o], p[o]);
    // Reflecting twice returns the point.
    assert.deepEqual(reflect(t, axis), { x: p.x, y: p.y });
  }
  assert.equal(distToAxis(V.P, "y"), 3);
  assert.equal(distToAxis(V.Q, "x"), 5);
});

test("choice sets: one right answer; the others are the other flip, both flips, the swap", () => {
  const opts = pointChoices(V.P, V.axisP, V.range);
  assert.deepEqual(
    opts.map((o) => [o.kind, o.p.x, o.p.y]),
    [
      ["right", -3, 2],
      ["other", 3, -2],
      ["both", -3, -2],
      ["swap", 2, 3],
    ],
  );
  const shape = pointChoices(V.vs[2], V.axisS, V.range);
  assert.deepEqual(
    shape.map((o) => `${o.p.x},${o.p.y}`),
    ["-4,6", "4,-6", "-4,-6", "6,4"],
  );
  for (const set of [opts, shape, pointChoices(V.Q, V.axisQ, V.range)]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => `${o.p.x},${o.p.y}`)).size, set.length);
  }
});

test("placements are diagnosed by what the student really did", () => {
  const P = V.P; // (3, 2) over the y-axis
  const k = (x, y) => classifyReflection(P, "y", { x, y });
  assert.equal(k(-3, 2), "ok");
  assert.equal(k(3, 2), "same");
  assert.equal(k(3, -2), "other");
  assert.equal(k(-3, -2), "both");
  assert.equal(k(2, -3), "swap");
  assert.equal(k(-3, 3), "distance");
  assert.equal(k(3, 3), "side");
});

test("a wrong choice's cue is a question or a pointer and never states the image", () => {
  const T = reflectCopy(V);
  for (const [p, axis] of [
    [V.P, V.axisP],
    [V.Q, V.axisQ],
    [V.vs[2], V.axisS],
  ]) {
    const image = reflect(p, axis);
    const imageText = `(${image.x < 0 ? "−" : ""}${Math.abs(image.x)}, ${image.y < 0 ? "−" : ""}${Math.abs(image.y)})`;
    for (const kind of ["other", "both", "swap", "same", "side", "distance"])
      for (const lang of ["en", "es"]) {
        const cue = T.cue(p, axis, { kind, p: { x: 9, y: 9 } })[lang];
        assert.ok(cue.length > 30);
        assert.ok(!cue.includes(imageText), `${kind} ${lang} states ${imageText}`);
      }
  }
});

test("copy states the lesson's numbers", () => {
  const T = reflectCopy(V);
  assert.match(T.situateSay.en, /P is at \(3, 2\)/);
  assert.match(T.predictOk.en, /\(−3, 2\).*y-axis/);
  assert.match(T.whyDone.en, /x-coordinate changes sign: 3 becomes −3/);
  assert.match(T.otherDone.en, /y-coordinate that changes sign: −5 becomes 5/);
  assert.match(T.shapeOk.en, /A′ \(−1, 2\), B′ \(−4, 2\), C′ \(−4, 6\)/);
  assert.equal(T.rule("y"), "(x, y) → (−x, y)");
  assert.equal(T.rule("x"), "(x, y) → (x, −y)");
  assert.match(T.whySay.en, /3 units/);
});

test("validation refuses what a reflection scene cannot show", () => {
  const bad = (patch) => ({ ...CFG, ...patch });
  assert.equal(validatePlaneReflect(null), null);
  assert.equal(validatePlaneReflect(bad({ first: { ...CFG.first, axis: "z" } })), null);
  assert.equal(validatePlaneReflect(bad({ second: { ...CFG.second, axis: "y" } })), null); // both scenes the same axis
  assert.equal(validatePlaneReflect(bad({ first: { p: { x: 0, y: 2 }, axis: "y" } })), null); // on the mirror
  assert.equal(validatePlaneReflect(bad({ first: { p: { x: 3, y: 3 }, axis: "y" } })), null); // a swap would look identical
  assert.equal(validatePlaneReflect(bad({ first: { p: { x: 7, y: 2 }, axis: "y" } })), null); // off the plane
  assert.equal(validatePlaneReflect(bad({ shape: { axis: "y", vs: [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }] } })), null); // collinear
  assert.equal(validatePlaneReflect(bad({ shape: { axis: "y", vs: [{ x: 1, y: 2 }, { x: -4, y: 2 }, { x: 4, y: 6 }] } })), null); // straddles the mirror
  assert.equal(validatePlaneReflect(bad({ shape: { axis: "y", vs: [{ x: 1, y: 2 }] } })), null);
});

test("Spanish carries no English", () => {
  const T = reflectCopy(V);
  const sample = [
    T.title,
    T.ariaLabel,
    T.printSummary,
    T.situateSay,
    T.predictQ,
    T.predictOk,
    T.flipAsk(V.P, V.axisP),
    T.flipSay(V.P, V.axisP),
    T.flipOk(V.P, V.axisP),
    T.whySay,
    T.whyDone,
    T.otherSay,
    T.otherDone,
    T.shapeSay,
    T.shapeQ,
    T.shapeOk,
    T.explainLabel,
    T.explainFrame,
    T.mirror,
    T.place,
    Object.values(T.scene),
    ["other", "both", "swap", "same", "side", "distance"].map((kind) => T.cue(V.P, "y", { kind, p: { x: 1, y: 1 } })),
  ];
  for (const s of strings(sample, "es")) assert.ok(!ENGLISH.test(s), `English left in: ${s}`);
});

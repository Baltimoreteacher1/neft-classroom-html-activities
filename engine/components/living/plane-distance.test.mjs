// Every number the plane-distance play states (lesson 7-6), recomputed
// independently of the play.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENGLISH, lessonScene, strings } from "./_fixtures.mjs";
import { buildPlaneDistancePlay, validatePlaneDistance as reexported } from "./plane-distance.js";
import {
  analyzePair,
  choicesFor,
  distanceCopy,
  onLine,
  validatePlaneDistance,
} from "./plane-distance-model.js";

const CFG = lessonScene("7-6");
const V = validatePlaneDistance(CFG);

// Independent distance: count unit steps from one point to the other along the shared line.
function countSteps(a, b) {
  const horizontal = a.y === b.y;
  let n = 0;
  let u = horizontal ? a.x : a.y;
  const end = horizontal ? b.x : b.y;
  while (u !== end) {
    u += u < end ? 1 : -1;
    n++;
  }
  return n;
}

test("the authored scene builds with six scenes and three gates", () => {
  assert.equal(reexported, validatePlaneDistance);
  const play = buildPlaneDistancePlay(CFG);
  assert.ok(play);
  assert.equal(play.scenes.length, 6);
  assert.deepEqual(
    play.scenes.filter((s) => s.gate).map((s) => s.id),
    ["predict", "count", "same"],
  );
});

test("distances match an independent count of unit steps", () => {
  for (const key of ["first", "sameSide", "transfer"]) {
    const P = V[key];
    assert.equal(P.d, countSteps(P.a, P.b), key);
  }
  assert.deepEqual([V.first.d, V.sameSide.d, V.transfer.d], [7, 4, 8]);
  assert.equal(V.first.opposite, true);
  assert.equal(V.sameSide.opposite, false);
  assert.equal(V.transfer.opposite, true);
  assert.equal(V.first.horizontal, true);
  assert.equal(V.transfer.horizontal, false);
});

test("opposite sides add the absolute values; the same side subtracts", () => {
  const { first, sameSide, transfer } = V;
  assert.equal(Math.abs(first.ua) + Math.abs(first.ub), first.d);
  assert.equal(Math.abs(transfer.ua) + Math.abs(transfer.ub), transfer.d);
  assert.equal(Math.abs(Math.abs(sameSide.ua) - Math.abs(sameSide.ub)), sameSide.d);
});

test("the point on the line at u keeps the shared coordinate", () => {
  assert.deepEqual(onLine(V.first, 0), { x: 0, y: 2 });
  assert.deepEqual(onLine(V.transfer, 0), { x: 1, y: 0 });
  assert.deepEqual(onLine(V.first, -3), { x: -3, y: 2 });
});

test("choice sets: exactly one right answer, wrong ones really wrong and distinct", () => {
  for (const key of ["first", "sameSide", "transfer"]) {
    const P = V[key];
    const opts = choicesFor(P);
    assert.equal(opts.filter((o) => o.correct).length, 1, key);
    assert.equal(opts.find((o) => o.correct).n, P.d);
    assert.ok(opts.length >= 3);
    assert.equal(new Set(opts.map((o) => o.n)).size, opts.length);
    for (const o of opts.filter((x) => !x.correct)) assert.notEqual(o.n, P.d);
  }
  const kinds = (P) => choicesFor(P).map((o) => o.kind);
  assert.deepEqual(kinds(V.first), ["right", "sub", "shared", "far"]);
  assert.deepEqual(kinds(V.sameSide), ["right", "add", "shared", "far"]);
  assert.deepEqual(
    choicesFor(V.first).map((o) => o.n),
    [7, 1, 2, 4],
  );
  assert.deepEqual(
    choicesFor(V.sameSide).map((o) => o.n),
    [4, 6, 1, 5],
  );
});

test("a wrong choice's cue is a question and never states the distance", () => {
  const T = distanceCopy(V);
  for (const key of ["first", "sameSide", "transfer"]) {
    const P = V[key];
    for (const o of choicesFor(P).filter((x) => !x.correct)) {
      for (const lang of ["en", "es"]) {
        const cue = T.cue(P, o)[lang];
        assert.match(cue, /[?]$|\.$/);
        assert.ok(!new RegExp(`(=|es|is) ${P.d}\\b`).test(cue), `${key} ${o.kind} ${lang}`);
        assert.ok(cue.startsWith(String(o.n)), "names the number it is about");
      }
    }
  }
});

test("copy states the lesson's numbers", () => {
  const T = distanceCopy(V);
  assert.match(T.situateSay.en, /Chest is at \(−3, 2\).*Cave is at \(4, 2\).*y = 2/);
  assert.match(T.countDone(V.first).en, /7 units in all: 3 steps to reach 0, then 4 more\. 3 \+ 4 = 7/);
  assert.equal(T.sumText(V.first), "|−3| + |4| = 3 + 4 = 7");
  assert.equal(T.diffText(V.sameSide), "|5| − |1| = 5 − 1 = 4");
  assert.match(T.transferOk.en, /\|−3\| \+ \|5\| = 3 \+ 5 = 8/);
  assert.match(T.sameOk.en, /5 − 1 = 4/);
  assert.match(T.transferSay.es, /Ancla.*\(1, −3\).*Faro de señal.*\(1, 5\).*x = 1/);
  assert.equal(T.predictQ(V.transfer).es, "¿Qué distancia hay del Ancla al Faro de señal?");
});

test("validation refuses pairs it cannot count or draw", () => {
  const bad = (patch) => ({ ...CFG, ...patch });
  const pair = (a, b) => ({ a, b });
  assert.equal(validatePlaneDistance(null), null);
  assert.equal(validatePlaneDistance(bad({ first: pair({ x: -3, y: 2 }, { x: 4, y: 3 }) })), null); // no shared coordinate
  assert.equal(validatePlaneDistance(bad({ first: pair({ x: -3, y: 2 }, { x: -3, y: 2 }) })), null);
  assert.equal(validatePlaneDistance(bad({ first: pair({ x: 1, y: 2 }, { x: 4, y: 2 }) })), null); // same side, wants opposite
  assert.equal(validatePlaneDistance(bad({ same: pair({ x: -3, y: 1 }, { x: 4, y: 1 }) })), null); // opposite, wants same side
  assert.equal(validatePlaneDistance(bad({ first: pair({ x: 0, y: 2 }, { x: 4, y: 2 }) })), null); // on the axis
  assert.equal(validatePlaneDistance(bad({ first: pair({ x: -3, y: 2 }, { x: 7, y: 2 }) })), null); // off the plane
  assert.equal(validatePlaneDistance(bad({ first: pair({ x: -3.5, y: 2 }, { x: 4, y: 2 }) })), null); // not whole
  assert.equal(validatePlaneDistance(bad({ first: CFG.transfer, transfer: CFG.transfer })), null); // same line twice
  assert.equal(validatePlaneDistance({ ...CFG, range: { xmin: -6, xmax: 6 } }), null);
  assert.equal(analyzePair({ x: 1, y: 1 }, { x: 2, y: 2 }), null);
});

test("Spanish carries no English", () => {
  const T = distanceCopy(V);
  const sample = [
    T.title,
    T.ariaLabel,
    T.printSummary,
    T.situateSay,
    T.predictQ(V.first),
    T.predictOk(V.first),
    T.countSay(V.first),
    T.stepFwd(V.first),
    T.stepBack,
    T.absSay(V.first),
    T.absDone,
    T.sameSay,
    T.sameQ,
    T.sameOk,
    T.transferSay,
    T.transferOk,
    T.explainLabel,
    T.explainFrame,
    Object.values(T.scene),
  ];
  for (const s of strings(sample, "es")) assert.ok(!ENGLISH.test(s), `English left in: ${s}`);
});

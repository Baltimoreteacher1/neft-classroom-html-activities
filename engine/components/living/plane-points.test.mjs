// Every number the plane-points play states (lessons 7-5 walk, 7-8 quadrant),
// recomputed independently of the play.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENGLISH, lessonScene, strings } from "./_fixtures.mjs";
import { ROMAN } from "./plane-model.js";
import { buildPlanePointsPlay, validatePlanePoints as reexported } from "./plane-points.js";
import {
  moveWords,
  pointsCopy,
  quadrantChoices,
  quadReadChoices,
  readChoices,
  validatePlanePoints,
  walkChoices,
} from "./plane-points-model.js";

const WALK = lessonScene("7-5");
const QUAD = lessonScene("7-8");
const FLIP = ROMAN;
const signQuadrant = (x, y) => (x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3);

test("the authored lesson scenes build, validate, and re-export the validator", () => {
  assert.equal(reexported, validatePlanePoints);
  for (const cfg of [WALK, QUAD]) {
    const play = buildPlanePointsPlay(cfg);
    assert.ok(play);
    assert.equal(play.scenes.length, 6);
    assert.ok(play.scenes.filter((s) => s.gate).length >= 3);
    assert.ok(play.scenes[0].label.en && play.scenes[0].label.es);
  }
});

test("validation refuses what the stage cannot place exactly", () => {
  const base = JSON.parse(JSON.stringify(WALK));
  const bad = (patch) => ({ ...base, ...patch });
  assert.equal(validatePlanePoints(null), null);
  assert.equal(validatePlanePoints({ ...base, mode: "nope" }), null);
  assert.equal(validatePlanePoints(bad({ range: { xmin: 0, xmax: 40, ymin: 0, ymax: 8 } })), null);
  assert.equal(validatePlanePoints(bad({ first: { x: 5, y: 9 } })), null); // outside the range
  assert.equal(validatePlanePoints(bad({ first: { x: 5.5, y: 4 } })), null); // not whole
  assert.equal(validatePlanePoints(bad({ first: { x: 4, y: 4 } })), null); // a swap would look identical
  assert.equal(validatePlanePoints(bad({ swap: { x: 3, y: 3 } })), null);
  assert.equal(validatePlanePoints(bad({ first: { x: -5, y: 4 } })), null); // walk is first quadrant
  assert.equal(validatePlanePoints(bad({ second: base.first })), null); // waypoints differ
  assert.equal(validatePlanePoints(bad({ swap: { x: 10, y: 2 } })), null); // swapped copy must fit
  const q = JSON.parse(JSON.stringify(QUAD));
  const badQ = (patch) => ({ ...q, ...patch });
  assert.equal(validatePlanePoints(badQ({ first: { x: 0, y: -4 } })), null); // on an axis
  assert.equal(validatePlanePoints(badQ({ first: { x: 3, y: 4 } })), null); // Quadrant I
  assert.equal(validatePlanePoints(badQ({ others: [q.others[0]] })), null);
  assert.equal(validatePlanePoints(badQ({ others: [q.others[0], { x: 5, y: 1 }] })), null); // same quadrant twice
  assert.equal(validatePlanePoints(badQ({ range: { xmin: 0, xmax: 6, ymin: 0, ymax: 6 } })), null);
  assert.equal(validatePlanePoints(badQ({ reading: { x: 7, y: 1 } })), null);
});

test("walk: choices are the trip, the swap and 'both sideways'; exactly one is right", () => {
  const v = validatePlanePoints(WALK);
  const opts = walkChoices(v.A, v.range);
  assert.equal(opts.filter((o) => o.correct).length, 1);
  assert.deepEqual(
    opts.map((o) => [o.kind, o.p.x, o.p.y]),
    [
      ["right", 5, 4],
      ["swap", 4, 5],
      ["sideways", 9, 0],
    ],
  );
  assert.deepEqual(moveWords(v.A), { en: "right 5, up 4", es: "5 a la derecha, 4 hacia arriba" });
  const T = pointsCopy(v);
  for (const o of opts.filter((x) => !x.correct)) {
    for (const lang of ["en", "es"]) {
      const cue = T.walkCue(o)[lang];
      assert.ok(!cue.includes(moveWords(v.A)[lang]), `${o.kind} ${lang} states the trip`);
      assert.ok(cue.includes(`(${o.p.x}, ${o.p.y})`), "points at its own ghost");
    }
  }
});

test("walk: reading choices for the Sandy Dock (7 right, 2 up)", () => {
  const v = validatePlanePoints(WALK);
  const opts = readChoices(v.D, v.range);
  assert.deepEqual(
    opts.map((o) => `${o.p.x},${o.p.y}`).sort(),
    ["2,2", "2,7", "7,0", "7,2"],
  );
  assert.equal(opts.filter((o) => o.correct).length, 1);
  assert.deepEqual([opts.find((o) => o.correct).p.x, opts.find((o) => o.correct).p.y], [7, 2]);
  assert.equal(new Set(opts.map((o) => `${o.p.x},${o.p.y}`)).size, opts.length);
});

test("walk: copy states the lesson's numbers", () => {
  const v = validatePlanePoints(WALK);
  const T = pointsCopy(v);
  assert.match(T.startSay.en, /\(5, 4\)/);
  assert.match(T.predictOk.en, /5 right.*4 up/);
  assert.match(T.plotOk(v.B, false).en, /2 right and 1 up.*\(2, 1\)/);
  assert.match(T.readSay.en, /\(8, 1\).*8 right.*1 up/);
  assert.match(T.orderDone.en, /\(3, 5\) and \(5, 3\)/);
  assert.match(T.transferOk.en, /\(7, 2\)/);
  assert.deepEqual(T.legs(v.C), {
    x: { en: "8 right", es: "8 a la derecha" },
    y: { en: "1 up", es: "1 hacia arriba" },
  });
});

test("quadrant: every stated quadrant matches the signs", () => {
  const v = validatePlanePoints(QUAD);
  const T = pointsCopy(v);
  const all = [v.A, v.B, ...v.others, v.E];
  assert.equal(new Set(all.map((p) => signQuadrant(p.x, p.y))).size, 4, "all four quadrants are visited");
  for (const p of [v.A, v.B]) {
    const n = FLIP[signQuadrant(p.x, p.y)];
    assert.match(T.plotOk(p).en, new RegExp(`Quadrant ${n}\\.`));
    assert.match(T.plotOk(p).es, new RegExp(`cuadrante ${n}\\.`));
  }
  for (const p of v.others) {
    const n = FLIP[signQuadrant(p.x, p.y)];
    assert.match(T.nameOk(p).en, new RegExp(`Quadrant ${n}\\.`));
  }
  assert.match(T.transferOk.en, new RegExp(`Quadrant ${FLIP[signQuadrant(v.E.x, v.E.y)]}\\.`));
  assert.match(T.signsRow(v.A).en, /\(−3, −4\) → \(−, −\) → Quadrant III/);
});

test("quadrant: predict and reading choices have one right answer, all others differ", () => {
  const v = validatePlanePoints(QUAD);
  for (const [opts, t] of [
    [quadrantChoices(v.A, v.range), v.A],
    [quadReadChoices(v.E, v.range), v.E],
  ]) {
    assert.equal(opts.filter((o) => o.correct).length, 1);
    assert.deepEqual([opts[0].p.x, opts[0].p.y], [t.x, t.y]);
    assert.ok(opts.length >= 3);
    assert.equal(new Set(opts.map((o) => `${o.p.x},${o.p.y}`)).size, opts.length);
  }
  const kinds = quadrantChoices(v.A, v.range).map((o) => o.kind);
  assert.deepEqual(kinds, ["right", "unsigned", "swap", "flip"]);
});

test("quadrant: a wrong quadrant's cue never names the real quadrant", () => {
  const v = validatePlanePoints(QUAD);
  const T = pointsCopy(v);
  for (const p of v.others) {
    const real = signQuadrant(p.x, p.y);
    for (const n of [1, 2, 3, 4].filter((k) => k !== real)) {
      for (const lang of ["en", "es"]) {
        const cue = T.nameCue(n, p)[lang];
        assert.ok(!new RegExp(`(Quadrant|uadrante) ${FLIP[real]}\\b`).test(cue), `${lang} ${n}`);
        assert.ok(/\?$/.test(cue), "a cue is a question");
      }
    }
  }
});

test("Spanish carries no English, and every string is a pair", () => {
  for (const cfg of [WALK, QUAD]) {
    const v = validatePlanePoints(cfg);
    const T = pointsCopy(v);
    const sample = [
      T.title,
      T.kicker,
      T.ariaLabel,
      T.printSummary,
      T.startSay,
      T.predictSay,
      T.predictQ,
      T.predictOk,
      T.explainLabel,
      T.explainFrame,
      T.transferSay,
      T.transferQ,
      T.transferOk,
      T.place,
      Object.values(T.scene),
    ];
    for (const s of strings(sample, "es")) assert.ok(!ENGLISH.test(s), `English left in: ${s}`);
    for (const s of strings(sample, "en")) assert.ok(s.trim());
  }
});

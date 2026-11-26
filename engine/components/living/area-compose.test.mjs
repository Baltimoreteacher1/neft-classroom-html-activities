// area-compose.test.mjs — every number the area-compose play shows a student,
// recomputed by counting unit squares, not from the model's formulas.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { seedFor } from "./area-derive.js";
import { buildAreaComposePlay, validateAreaCompose as reexported } from "./area-compose.js";
import {
  composeCopy,
  cutsOf,
  lChoices,
  placeCorrect,
  poolChoices,
  readL,
  readPool,
  total,
  validateAreaCompose,
} from "./area-compose-model.js";

const lesson = JSON.parse(readFileSync(new URL("../../../lessons/5-4/config.json", import.meta.url), "utf8"));
const CFG = lesson.launch.conceptIntro.livingScene;

/** Count unit squares: joined pieces are in, cut pieces are out. Independent of every formula. */
function squares(pieces, w, h) {
  let n = 0;
  for (let i = 0; i < w; i++)
    for (let j = 0; j < h; j++) {
      const inside = (r) => i >= r.x && i < r.x + r.w && j >= r.y && j < r.y + r.h;
      const joined = pieces.some((r) => r.kind === "add" && inside(r));
      const cutOut = pieces.some((r) => r.kind === "cut" && inside(r));
      if (joined && !cutOut) n++;
    }
  return n;
}

test("the 5-4 scene uses the lesson's own L-shaped room", () => {
  assert.equal(CFG.kind, "living-scene");
  assert.equal(CFG.play, "area-compose");
  assert.deepEqual([CFG.base, CFG.arm], [{ w: 12, h: 8 }, { w: 6, h: 5 }]);
  const iDo = lesson.launch.conceptIntro.iDo.lines.join(" ");
  for (const s of ["12 ft by 8 ft", "6 ft by 5 ft", "96", "30", "126"]) assert.ok(iDo.includes(s), s);
  const plan = lesson.explore.rows.find((r) => r[0] === "U-shaped pool");
  assert.ok(plan[1].includes("14 ft x 10 ft") && plan[3].includes("6 ft x 4 ft"), "the lesson's own pool");
  const play = buildAreaComposePlay(CFG);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["pull", true],
      ["connect", false],
      ["change", true],
      ["transfer", false],
    ],
  );
  assert.match(play.printSummary.en, /96 \+ 30 = 126/);
  assert.match(play.printSummary.es, /96 \+ 30 = 126/);
});

test("all three splits of the L cover the same 126 unit squares", () => {
  const L = readL(CFG);
  assert.equal(L.H, 13);
  const cuts = cutsOf(L);
  for (const [name, pieces] of Object.entries(cuts)) {
    assert.equal(squares(pieces, L.base.w, L.H), 126, name);
    assert.equal(total(pieces), 126, name);
    for (const r of pieces) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= L.base.w && r.y + r.h <= L.H, name);
  }
  assert.deepEqual(
    cuts.stack.map((r) => r.w * r.h),
    [96, 30],
  );
  assert.deepEqual(
    cuts.side.map((r) => r.w * r.h),
    [78, 48],
  );
  assert.deepEqual(
    cuts.fill.map((r) => [r.w * r.h, r.kind]),
    [
      [156, "add"],
      [30, "cut"],
    ],
  );
  // joined pieces do not overlap each other
  for (const name of ["stack", "side"]) {
    const [a, b] = cuts[name];
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, name);
  }
});

test("the pool: 14 × 10 with a 6 × 4 cutout covers 116 unit squares", () => {
  const pool = readPool(CFG.transfer);
  assert.equal(squares(pool.pieces, 14, 10), 116);
  assert.equal(total(pool.pieces), 116);
  assert.equal(pool.pieces[1].kind, "cut");
});

test("choices: one correct; the wrong ones are real misconceptions, recomputed", () => {
  const L = readL(CFG);
  const l = lChoices(L);
  assert.deepEqual(
    l.map((o) => [o.kind, o.value]),
    [
      ["correct", 126],
      ["box", 12 * 13], // fills the bounding rectangle
      ["mult", 96 * 30], // multiplies the two areas
      ["sides", 12 + 8 + 6 + 5], // adds the given side lengths
    ],
  );
  const p = poolChoices(readPool(CFG.transfer));
  assert.deepEqual(
    p.map((o) => [o.kind, o.value]),
    [
      ["correct", 116],
      ["addCut", 140 + 24],
      ["outer", 140],
      ["cutOnly", 24],
    ],
  );
  for (const set of [l, p]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length);
  }
});

test("validateAreaCompose refuses figures the stage cannot draw correctly", () => {
  assert.ok(validateAreaCompose(CFG));
  const bad = [
    null,
    {},
    { base: { w: 12, h: 8 } },
    { ...CFG, arm: { w: 12, h: 5 } }, // arm as wide as the base: not an L
    { ...CFG, arm: { w: 13, h: 5 } },
    { ...CFG, arm: { w: 6, h: 0 } },
    { ...CFG, base: { w: 12, h: 30 } },
    { ...CFG, base: { w: 1.5, h: 8 } },
  ];
  for (const cfg of bad) {
    assert.equal(validateAreaCompose(cfg), null, JSON.stringify(cfg));
    assert.equal(buildAreaComposePlay(cfg), null);
  }
  // a broken transfer falls back to a valid pool; cutouts outside the pool or filling it are refused
  assert.equal(total(validateAreaCompose({ ...CFG, transfer: { outer: { w: 3, h: 3 } } }).pool.pieces), 116);
  for (const t of [
    { outer: { w: 14, h: 10 }, cut: { x: 10, y: 0, w: 6, h: 4 } },
    { outer: { w: 4, h: 4 }, cut: { x: 0, y: 0, w: 4, h: 4 } },
    { outer: { w: 14, h: 10 }, cut: { x: 4, y: 1, w: 6, h: 8 } }, // no room for the pool's label
  ])
    assert.equal(readPool(t), null, JSON.stringify(t));
  assert.equal(reexported, validateAreaCompose);
});

test("copy: every line has English and Spanish, no leftovers, tú register", () => {
  const v = validateAreaCompose(CFG);
  const T = composeCopy(v);
  const out = [];
  const walk = (o) => {
    if (o && typeof o === "object" && "en" in o && "es" in o) return out.push(o);
    if (o && typeof o === "object") Object.values(o).forEach(walk);
  };
  walk(T);
  out.push(T.tryOther(1), T.tryOther(2));
  for (const o of lChoices(v.L).filter((x) => !x.correct)) out.push(T.cueL(o));
  for (const o of poolChoices(v.pool).filter((x) => !x.correct)) out.push(T.cuePool(o));
  assert.ok(out.length > 30);
  for (const p of out) {
    assert.ok(p.en.trim() && p.es.trim());
    assert.doesNotMatch(p.en + p.es, /undefined|NaN|\[object/);
    assert.doesNotMatch(p.es, /\b(usted|ustedes|vosotros)\b/i);
    assert.doesNotMatch(p.es, /\b(the|and|rectangle|square feet|joined|room|pool)\b/i, p.es);
  }
});

test("copy: a wrong pick's cue never states the area", () => {
  const v = validateAreaCompose(CFG);
  const T = composeCopy(v);
  const stated = (text, n) => new RegExp(`(^|[^\\d.])${n}([^\\d.]|$)`).test(text);
  for (const o of lChoices(v.L).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) assert.ok(!stated(T.cueL(o)[lang], 126), o.kind);
  for (const o of poolChoices(v.pool).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) assert.ok(!stated(T.cuePool(o)[lang], 116), o.kind);
  assert.equal(T.cutEq.stack, "96 + 30 = 126");
  assert.equal(T.cutEq.side, "78 + 48 = 126");
  assert.equal(T.cutEq.fill, "156 − 30 = 126");
  assert.match(T.transferOk.en, /14 × 10 − 6 × 4 = 140 − 24 = 116/);
});

test("placeCorrect never leaves the correct choice first for the authored configs", () => {
  const v = validateAreaCompose(CFG);
  const seeds = [
    [lChoices(v.L), seedFor(4, 126, 13)],
    [poolChoices(v.pool), seedFor(4, 116, 14, 10)],
  ];
  for (const [set, seed] of seeds) {
    const placed = placeCorrect(set, seed);
    assert.notEqual(placed.findIndex((o) => o.correct), 0);
    assert.equal(placed.length, set.length);
  }
});

// area-derive.test.mjs — every number the area-derive play shows a student,
// recomputed here from vertices and arithmetic, not from the model's formulas.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildAreaDerivePlay, flipScales, seedFor, validateAreaDerive as reexported } from "./area-derive.js";
import {
  bounds,
  choiceSet,
  deriveCopy,
  fmt,
  geom,
  leanMax,
  placeCorrect,
  readSpec,
  slantLabel,
  turned,
  validateAreaDerive,
} from "./area-derive-model.js";

const lesson = (id) => JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"));
// 5-1 now teaches through the parallelogram-area play; this play still supports the shape,
// so its authored scene is kept as a fixture.
const FIXTURES = JSON.parse(readFileSync(new URL("./authored-fixtures.json", import.meta.url), "utf8"));
const living = (id) => FIXTURES[id] ?? lesson(id).launch.conceptIntro.livingScene;

// An independent polygon area (shoelace) and boundary test.
const area = (pts) =>
  Math.abs(pts.reduce((s, [x1, y1], i) => s + x1 * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * y1, 0)) / 2;
const onBoundary = (pt, poly) =>
  poly.some((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const cross = (b[0] - a[0]) * (pt[1] - a[1]) - (b[1] - a[1]) * (pt[0] - a[0]);
    const dot = (pt[0] - a[0]) * (b[0] - a[0]) + (pt[1] - a[1]) * (b[1] - a[1]);
    return Math.abs(cross) < 1e-9 && dot >= -1e-9 && dot <= (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + 1e-9;
  });
const close = (x, y) => Math.abs(x - y) < 1e-9;

const LESSONS = {
  "5-1": { shape: "parallelogram", area: 126, whole: 126, line: "14 × 9 = 126" },
  "5-2": { shape: "triangle", area: 48, whole: 96, line: "½ × 12 × 8 = 48" },
  "5-3": { shape: "trapezoid", area: 30, whole: 60, line: "½ × (4 + 8) × 5 = 30" },
};

test("each lesson's authored scene uses the lesson's own worked-example numbers", () => {
  for (const [id, want] of Object.entries(LESSONS)) {
    const cfg = living(id);
    assert.equal(cfg.kind, "living-scene");
    assert.equal(cfg.play, "area-derive");
    assert.equal(cfg.shape, want.shape);
    const iDo = lesson(id).launch.conceptIntro.iDo.lines.join(" ");
    assert.ok(iDo.includes(String(want.area)), `${id}: the worked example states ${want.area}`);
    const nums = want.shape === "trapezoid" ? [cfg.b1, cfg.b2, cfg.h] : [cfg.b, cfg.h];
    for (const n of nums) assert.ok(new RegExp(`\\b${n}\\b`).test(iDo), `${id}: ${n} is in the worked example`);
    const play = buildAreaDerivePlay(cfg);
    assert.ok(play, `${id} builds`);
    assert.deepEqual(
      play.scenes.map((s) => [s.id, !!s.gate]),
      [
        ["situate", false],
        ["predict", true],
        ["build", true],
        ["connect", false],
        ["change", true],
        ["transfer", false],
      ],
    );
    assert.match(play.viewBox, /^0 0 440 \d+$/);
    assert.match(play.printSummary.en, new RegExp(want.line.replace(/[()+½×]/g, "\\$&")));
  }
});

test("geometry: every lean keeps the same base and height, and the area from the vertices", () => {
  for (const [id, want] of Object.entries(LESSONS)) {
    const s = readSpec(want.shape, living(id));
    const by = {
      parallelogram: (g) => area(g.outline) === s.b * s.h,
      triangle: (g) => close(area(g.outline), (s.b * s.h) / 2),
      trapezoid: (g) => close(area(g.outline), ((s.b1 + s.b2) * s.h) / 2),
    }[want.shape];
    assert.equal(s.lean, want.shape === "triangle" ? 6 : 2, `${id}: the lesson's own offset/apex`);
    for (let lean = 0; lean <= leanMax(s); lean++) {
      const g = geom(s, lean);
      assert.ok(by(g), `${id} lean ${lean}: area from vertices`);
      const ys = g.outline.map((p) => p[1]);
      assert.equal(Math.min(...ys), 0);
      assert.equal(Math.max(...ys), s.h, "height does not change with the lean");
      // the height line from the top vertex at x = foot meets the base at a right angle
      assert.ok(g.outline.some((p) => p[0] === g.foot && p[1] === s.h), `${id}: foot is under a vertex`);
    }
    assert.equal(area(geom(s).final), want.whole, `${id}: the doubled figure`);
  }
});

test("the pieces really make the shape the formula claims", () => {
  for (const [id, want] of Object.entries(LESSONS)) {
    const s = readSpec(want.shape, living(id));
    for (let lean = want.shape === "parallelogram" ? 1 : 0; lean <= leanMax(s); lean++) {
      const g = geom(s, lean);
      if (want.shape === "parallelogram") {
        // slide the triangle right by b: it must complete a b × h rectangle
        const slid = g.p2.map(([x, y]) => [x + g.move[0], y + g.move[1]]);
        assert.ok(close(area(g.p1) + area(g.p2), s.b * s.h), "pieces tile the parallelogram");
        for (const p of slid) assert.ok(onBoundary(p, g.final), `slid vertex ${p} is on the rectangle`);
        const xs = g.final.map((p) => p[0]);
        assert.equal(Math.max(...xs) - Math.min(...xs), s.b, "rectangle width is the base");
        assert.equal(g.final.length, 4);
      } else {
        const flipped = g.p2.map((p) => turned(p, g.pivot));
        assert.ok(close(area(g.p1) + area(flipped), area(g.final)), "two copies tile the parallelogram");
        for (const p of flipped) assert.ok(onBoundary(p, g.final), `flipped vertex ${p} is on the parallelogram`);
        // the flipped copy shares a whole side with the original: two of its vertices are original vertices
        const shared = flipped.filter((p) => g.p1.some((q) => close(p[0], q[0]) && close(p[1], q[1])));
        assert.equal(shared.length, 2, "the copy fits along one shared side");
      }
    }
  }
});

test("flipScales: sideways then upside down equals a half turn about the pivot", () => {
  assert.deepEqual([flipScales(0).sx, flipScales(0).sy], [1, 1]);
  assert.ok(close(flipScales(3).sx, 0), "edge-on half-way through the first flip");
  assert.ok(close(flipScales(6).sx, -1) && close(flipScales(6).sy, 1));
  assert.ok(close(flipScales(12).sx, -1) && close(flipScales(12).sy, -1));
  const pivot = [9, 4];
  const f = flipScales(12);
  const pt = [0, 0];
  const mapped = [pivot[0] + f.sx * (pt[0] - pivot[0]), pivot[1] + f.sy * (pt[1] - pivot[1])];
  assert.deepEqual(mapped, turned(pt, pivot));
});

test("choiceSet: exactly one correct; the wrong ones are real misconceptions, recomputed", () => {
  const want = {
    "5-1": [126, 128.8, 23, 63], // 14×9, 14×(slant ≈ 9.2), 14+9, ½×14×9
    "5-2": [48, 96, 60, 20], // ½×12×8, 12×8, ½×12×(slant 10), 12+8
    "5-3": [30, 60, 20, 32.4], // ½(4+8)5, (4+8)5, ½×8×5, ½(4+8)(slant ≈ 5.4)
  };
  for (const [id, values] of Object.entries(want)) {
    const s = readSpec(LESSONS[id].shape, living(id));
    const set = choiceSet(s);
    assert.deepEqual(set.map((o) => o.value), values, id);
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length, "distinct");
    assert.equal(set[0].value, LESSONS[id].area);
    for (const o of set.slice(1)) assert.notEqual(o.value, LESSONS[id].area);
  }
  // the slanted side is a rounded tenth of the real slanted length
  assert.equal(slantLabel(readSpec("parallelogram", { b: 14, h: 9, offset: 2 })), 9.2);
  assert.equal(slantLabel(readSpec("triangle", { b: 12, h: 8, apex: 6 })), 10);
  assert.equal(slantLabel(readSpec("trapezoid", { b1: 4, b2: 8, h: 5, offset: 0 })), null);
});

test("transfer figures: the lesson family's own, with exact areas", () => {
  const want = { "5-1": 70, "5-2": 30, "5-3": 32 };
  for (const [id, a] of Object.entries(want)) {
    const v = validateAreaDerive(living(id));
    assert.equal(choiceSet(v.transfer.spec)[0].value, a, id);
    assert.ok(choiceSet(v.transfer.spec).every((o, i) => (i === 0) === !!o.correct));
  }
  // a missing or broken transfer falls back to a valid figure
  const v = validateAreaDerive({ ...living("5-2"), transfer: { b: 1, h: 0 } });
  assert.equal(choiceSet(v.transfer.spec)[0].value, 30);
});

test("validateAreaDerive refuses figures the stage cannot draw correctly", () => {
  const ok = { shape: "parallelogram", b: 14, h: 9, offset: 2 };
  assert.ok(validateAreaDerive(ok));
  const bad = [
    null,
    {},
    { ...ok, shape: "rhombus" },
    { ...ok, b: 1 },
    { ...ok, b: 31 },
    { ...ok, h: 0 },
    { ...ok, h: 2.5 },
    { ...ok, offset: 0 }, // a leaning shape needs a lean
    { ...ok, offset: 15 }, // offset past the base: the triangle cannot slide into place
    { shape: "triangle", b: 12, h: 8, apex: 13 },
    { shape: "trapezoid", b1: 8, b2: 8, h: 5 }, // equal bases: a parallelogram
    { shape: "trapezoid", b1: 9, b2: 8, h: 5 },
    { shape: "trapezoid", b1: 4, b2: 8, h: 5, offset: 5 }, // top edge overhangs
    { shape: "trapezoid", b1: 4, b2: 8 },
  ];
  for (const cfg of bad) {
    assert.equal(validateAreaDerive(cfg), null, JSON.stringify(cfg));
    assert.equal(buildAreaDerivePlay(cfg), null);
  }
  assert.equal(reexported, validateAreaDerive);
});

test("bounds hold every state the stage draws", () => {
  for (const [id, want] of Object.entries(LESSONS)) {
    const s = readSpec(want.shape, living(id));
    const b = bounds(s);
    const polys = [geom(s).final];
    for (let l = 0; l <= leanMax(s); l++) polys.push(geom(s, l).outline);
    for (const [x, y] of polys.flat()) {
      assert.ok(x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY, `${id}: ${x},${y}`);
    }
  }
});

/** Every {en, es} pair the copy can say, with the functions called on sample arguments. */
function pairs(v) {
  const T = deriveCopy(v);
  const out = [];
  const walk = (o) => {
    if (o && typeof o === "object" && "en" in o && "es" in o) return out.push(o);
    if (o && typeof o === "object") Object.values(o).forEach(walk);
  };
  const skip = new Set(["cue", "slideKeep", "tryMore"]);
  walk(Object.fromEntries(Object.entries(T).filter(([, x]) => typeof x !== "function" || !skip.has(x.name))));
  out.push(T.slideKeep(3), T.tryMore(1), T.tryMore(2));
  for (const [spec, unit] of [[v.main, v.unit], [v.transfer.spec, v.transfer.unit]])
    for (const o of choiceSet(spec).filter((x) => !x.correct)) out.push(T.cue(o, spec, unit));
  return out;
}

test("copy: every line has English and Spanish, no leftovers, tú register", () => {
  for (const id of Object.keys(LESSONS)) {
    const v = validateAreaDerive(living(id));
    for (const p of pairs(v)) {
      assert.ok(p.en.trim() && p.es.trim());
      assert.doesNotMatch(p.en + p.es, /undefined|NaN|\[object/);
      assert.doesNotMatch(p.es, /\b(usted|ustedes|vosotros)\b/i);
      assert.doesNotMatch(p.es, /\b(the|and|height|base side|area is|square|slanted)\b/i, p.es);
    }
  }
});

test("copy: a wrong pick's cue never states the area, the right pick's line does", () => {
  for (const [id, want] of Object.entries(LESSONS)) {
    const v = validateAreaDerive(living(id));
    const T = deriveCopy(v);
    for (const o of choiceSet(v.main).filter((x) => !x.correct)) {
      const cue = T.cue(o, v.main, v.unit);
      for (const lang of ["en", "es"])
        assert.doesNotMatch(cue[lang], new RegExp(`(^|[^\\d.])${want.area}([^\\d.]|$)`), `${id} ${o.kind}`);
    }
    assert.ok(T.predictOk.en.includes(String(want.area)));
    assert.ok(T.buildDone.en.length > 20 && T.connectSay1.es.length > 20);
  }
  assert.equal(fmt(128.79999999999998), "128.8");
});

test("placeCorrect never leaves the correct choice first for the authored seeds", () => {
  for (const id of Object.keys(LESSONS)) {
    const v = validateAreaDerive(living(id));
    const seeds = [
      [v.main, seedFor(4, choiceSet(v.main)[0].value, v.main.h, v.main.lean)],
      [
        v.transfer.spec,
        seedFor(4, choiceSet(v.transfer.spec)[0].value, v.transfer.spec.h, v.transfer.spec.lean, 7),
      ],
    ];
    for (const [sp, seed] of seeds) {
      const placed = placeCorrect(choiceSet(sp), seed);
      assert.notEqual(placed.findIndex((o) => o.correct), 0, id);
      assert.equal(placed.length, choiceSet(sp).length);
    }
  }
});

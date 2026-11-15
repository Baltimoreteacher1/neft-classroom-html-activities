// Exact-value tests for the number-line and coordinate-plane motion figures (shared/motion/figures/lines-coordinates*.mjs).
// Expected numbers are written by hand or reached by a different route (the lab's own evaluate()), never read back from the figure.
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { Rat } from "../shared/motion/exact.mjs";
import figures from "../shared/motion/figures/lines-coordinates.mjs";
import {
  fmt,
  half,
  quadrantOf,
  whole,
  wrongGap,
} from "../shared/motion/figures/lines-coordinates-kit.mjs";
import {
  absoluteModel,
  oppositesModel,
  orderModel,
} from "../shared/motion/figures/lines-coordinates-line.mjs";
import {
  distanceModel,
  mirrorAxis,
  points,
  predictModel,
} from "../shared/motion/figures/lines-coordinates-plane.mjs";
import {
  rectangleModel,
  reflectModel,
} from "../shared/motion/figures/lines-coordinates-shapes.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";

const n = (r) => Number(r.n) / Number(r.d);
const fig = (key) => figures.find((f) => f.keys.includes(key));
const lab = (kind, mode, values) => evaluate({ kind, mode, values }, values);

test("the group claims exactly the keys it was given, once each", () => {
  const keys = figures.flatMap((f) => f.keys).sort();
  assert.deepEqual(keys, [
    "coordinates:distance",
    "coordinates:rectangle",
    "coordinates:reflect",
    "coordinates:reflect-predict",
    "line:absolute",
    "line:opposites",
    "line:order",
  ]);
});

test("exact formatting: halves as decimals with a true minus", () => {
  assert.equal(fmt(half(-2.5, "x")), "−2.5");
  assert.equal(fmt(half(0.5, "x")), "0.5");
  assert.equal(fmt(half(-10, "x")), "−10");
  assert.equal(fmt(new Rat(-1n, 2n)), "−0.5");
  assert.equal(fmt(half(0, "x")), "0");
});

test("settings the lab would refuse throw RangeError", () => {
  assert.throws(() => half(0.3, "x"), RangeError);
  assert.throws(() => half(10.5, "x"), RangeError);
  assert.throws(() => whole(7, "x"), RangeError);
  assert.throws(() => whole(1.5, "x"), RangeError);
  assert.throws(() => points([1, 2, 3]), RangeError);
  assert.throws(() => fig("line:order").build("line:order", [0.5, 1]), RangeError);
  assert.throws(
    () => fig("coordinates:distance").build("coordinates:distance", [0, 0, 0, 7]),
    RangeError,
  );
});

test("opposites: values and headline agree with the lab", () => {
  const m = oppositesModel([-2.5, 6]);
  assert.equal(fmt(m.rows[0].opposite), "2.5");
  assert.equal(fmt(m.rows[0].distance), "2.5");
  assert.equal(fmt(m.rows[1].opposite), "−6");
  assert.equal(m.wrong, true);
  assert.equal(oppositesModel([4, 6]).wrong, false);
  assert.equal(oppositesModel([0, 6]).rows[0].opposite.n, 0n);
  for (const v of [
    [-4, 6],
    [-2.5, 2.5],
    [0, 3],
    [7.5, -10],
    [10, 0.5],
  ]) {
    const r = lab("line", "opposites", v);
    assert.equal(n(oppositesModel(v).rows[0].distance), r.value);
    assert.equal(n(oppositesModel(v).rows[0].opposite), -v[0] + 0);
  }
});

test("absolute value: distance, order and the wrong moves, only when they differ", () => {
  const m = absoluteModel([-7, -3]);
  assert.equal(fmt(m.between), "4");
  assert.equal(m.order, -1);
  assert.equal(m.orderWrong, true); // |-7| > |-3| but -7 < -3
  assert.deepEqual(m.second, { kind: "gap", a: "|−7| + |−3|", b: "10" });
  const same = absoluteModel([5, 0]);
  assert.equal(same.orderWrong, false);
  assert.equal(same.second, null);
  assert.equal(absoluteModel([-3, 3]).orderWrong, true); // equal digits, different numbers
  assert.equal(absoluteModel([2, 2]).orderWrong, false);
  assert.equal(absoluteModel([0, 5]).second?.kind, "sign"); // 0 - 5 = -5 is not a distance
  for (const v of [
    [-7, -3],
    [-2.5, 4],
    [3, 3],
    [0, -10],
    [10, -10],
    [0.5, -0.5],
  ]) {
    assert.equal(n(absoluteModel(v).between), lab("line", "absolute", v).value);
  }
});

test("order: the signed step from the first to the second, right positive", () => {
  const m = orderModel([-3, -8]);
  assert.equal(fmt(m.gap), "−5");
  assert.equal(m.order, 1);
  assert.equal(m.digitsWrong, true);
  assert.equal(orderModel([2, 7]).digitsWrong, false);
  assert.equal(orderModel([4, 4]).gap.n, 0n);
  for (const v of [
    [-3, -8],
    [0, 10],
    [10, -10],
    [5, 5],
    [-1, 1],
  ]) {
    assert.equal(n(orderModel(v).gap), lab("line", "order", v).value);
  }
});

test("the gap between coordinates: adding is flagged only when it gives a different number", () => {
  const g = (p, q) => wrongGap(new Rat(BigInt(p)), new Rat(BigInt(q)));
  assert.deepEqual(g(-3, 2) && { e: g(-3, 2).expr, v: fmt(g(-3, 2).value) }, {
    e: "−3 + 2",
    v: "−1",
  });
  assert.deepEqual(g(5, 2) && { e: g(5, 2).expr, v: fmt(g(5, 2).value) }, {
    e: "|5| + |2|",
    v: "7",
  });
  assert.equal(g(0, 3), null);
  assert.equal(g(4, 4), null);
  assert.equal(g(-2, -2), null);
});

test("distance on the plane: legs, total and the lab's street-route distance", () => {
  const m = distanceModel([-3, 4, 2, 4]);
  assert.equal(fmt(m.w), "5");
  assert.equal(fmt(m.h), "0");
  assert.equal(fmt(m.total), "5");
  assert.equal(m.wrongV, null); // equal y-values: nothing to mix up
  assert.ok(m.wrongH);
  const d = distanceModel([-6, -6, 6, 6]);
  assert.equal(fmt(d.total), "24");
  for (const v of [
    [-3, 4, 2, 4],
    [0, 0, 0, 0],
    [-6, 6, 6, -6],
    [1, -2, -4, 3],
    [5, 1, 5, -2],
  ]) {
    assert.equal(n(distanceModel(v).total), lab("coordinates", "distance", v).value);
  }
});

test("rectangle: width, height, perimeter, area and quadrants", () => {
  const m = rectangleModel([-4, -2, 3, 4]);
  assert.equal(fmt(m.w), "7");
  assert.equal(fmt(m.h), "6");
  assert.equal(fmt(m.area), "42");
  assert.equal(fmt(m.perimeter), "26");
  assert.deepEqual(
    m.corners.map((k) => `${k.name}${k.quadrant}`),
    ["AIII", "CIV", "BI", "DII"],
  );
  assert.equal(m.flat, false);
  assert.equal(m.sumWrong, true);
  const flat = rectangleModel([2, 2, 2, 5]);
  assert.equal(flat.flat, true);
  assert.equal(fmt(flat.area), "0");
  assert.equal(rectangleModel([0, 0, 2, 2]).sumWrong, false); // 2 + 2 = 2 x 2: adding would be right, so it is not flagged
  assert.equal(quadrantOf(new Rat(0n), new Rat(3n)), "y-axis");
  assert.equal(quadrantOf(new Rat(0n), new Rat(0n)), "origin");
  for (const v of [
    [-4, -2, 3, 4],
    [0, 0, 0, 0],
    [-6, -6, 6, 6],
    [1, 5, -2, 5],
  ]) {
    const r = lab("coordinates", "rectangle", v);
    const mm = rectangleModel(v);
    assert.equal(n(mm.area), r.value);
    assert.equal(n(mm.w), r.width);
    assert.equal(n(mm.h), r.height);
    assert.equal(n(mm.perimeter), 2 * (r.width + r.height));
  }
});

test("reflection: images, sign changes, and the both-signs wrong move", () => {
  const m = reflectModel([-3, 4, 3, -4]);
  assert.deepEqual([fmt(m.overX.x), fmt(m.overX.y)], ["−3", "−4"]);
  assert.deepEqual([fmt(m.overY.x), fmt(m.overY.y)], ["3", "4"]);
  assert.deepEqual([fmt(m.flipped.x), fmt(m.flipped.y)], ["3", "−4"]);
  assert.equal(m.bothSigns, true);
  assert.equal(m.bAt, null); // B is where flipping both signs lands, not an image
  assert.equal(reflectModel([-3, 4, -3, -4]).bAt, "x");
  assert.equal(reflectModel([-3, 4, 3, 4]).bAt, "y");
  const onAxis = reflectModel([0, 4, 3, 1]);
  assert.equal(onAxis.bothSigns, false);
  assert.equal(onAxis.movesY, false); // x = 0: A is on the y-axis and does not move across it
  assert.equal(onAxis.movesX, true);
  for (const v of [
    [-3, 4, 3, -4],
    [0, 0, 1, 1],
    [6, -6, -6, 6],
    [2, 0, 5, 5],
  ]) {
    const r = lab("coordinates", "reflect", v);
    const mm = reflectModel(v);
    assert.deepEqual(
      [n(mm.overX.x), n(mm.overX.y)].map((x) => x + 0),
      r.reflectedX.map((x) => x + 0),
    );
    assert.deepEqual(
      [n(mm.overY.x), n(mm.overY.y)].map((x) => x + 0),
      r.reflectedY.map((x) => x + 0),
    );
  }
});

test("reflect-predict: headline is the street route; mirror detected like the lab's", () => {
  const m = predictModel([-4, 3, 3, -2]);
  assert.equal(fmt(m.total), "12");
  assert.equal(m.axis, null);
  assert.equal(predictModel([-4, 3, -4, -3]).axis, "x");
  assert.equal(predictModel([-4, 3, 4, 3]).axis, "y");
  assert.equal(predictModel([0, 3, 0, -3]).axis, "x");
  assert.equal(predictModel([3, 0, -3, 0]).axis, "y");
  assert.equal(predictModel([3, 0, 3, 0]).axis, null); // a point on an axis is not told apart from its own image
  assert.equal(predictModel([-4, 3, 4, -3]).flipped, true);
  assert.equal(predictModel([-4, 3, 4, 3]).flipped, false);
  assert.equal(mirrorAxis(points([-4, 3, -4, -3])), "x");
  for (const v of [
    [-4, 3, 3, -2],
    [-4, 3, -4, -3],
    [0, 0, 0, 0],
    [6, 6, -6, -6],
    [1, 1, 1, 1],
  ]) {
    assert.equal(n(predictModel(v).total), lab("coordinates", "reflect-predict", v).value);
  }
});

const CASES = {
  "line:opposites": [-2.5, 4],
  "line:absolute": [-7, -3],
  "line:order": [-3, -8],
  "coordinates:distance": [-3, 4, 2, -1],
  "coordinates:rectangle": [-4, -2, 3, 4],
  "coordinates:reflect": [-3, 4, 3, -4],
  "coordinates:reflect-predict": [-4, 3, -4, -3],
};

test("pictures use the true minus, name every number, and carry the lesson's own words in both languages", () => {
  for (const [key, values] of Object.entries(CASES)) {
    const f = fig(key);
    for (const lang of ["en", "es"]) {
      const { svg, model } = figureSvg(f, key, values, { lang, width: 400 });
      const texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)</g)].map((t) => t[1]).join(" ");
      assert.ok(!/(^|[\s(|=>,])-\d/.test(texts), `${key} ${lang}: a hyphen where a minus belongs`);
      assert.ok(/−/.test(texts), `${key} ${lang}: no true minus shown`);
      const d = f.describe(model, lang);
      assert.ok(!/(^|[\s(|=,])-\d/.test(d), `${key} ${lang}: hyphen in description`);
    }
  }
  const es = figureSvg(
    fig("coordinates:rectangle"),
    "coordinates:rectangle",
    CASES["coordinates:rectangle"],
    { lang: "es", width: 400 },
  ).svg.replaceAll("\u00a0", " ");
  assert.ok(
    es.includes("cuadrante III") &&
      es.includes("unidades cuadradas") &&
      es.includes("Perímetro: 7 + 6 + 7 + 6 = 26"),
  );
  const en = figureSvg(fig("line:order"), "line:order", CASES["line:order"], {
    lang: "en",
    width: 400,
  }).svg.replaceAll("\u00a0", " ");
  assert.ok(en.includes("5 steps left") && en.includes("−8 − (−3) = −5"));
});

test("the picture is complete without motion and the scene only moves what is drawn", () => {
  for (const [key, values] of Object.entries(CASES)) {
    const f = fig(key);
    const { svg, model } = figureSvg(f, key, values, { lang: "en", width: 400 });
    const dom = new JSDOM(`<body>${svg}</body>`).window.document;
    const sc = f.scene(dom, model);
    assert.ok(sc.tracks.length > 2, key);
    for (const t of sc.tracks) {
      for (const kf of t.keyframes)
        assert.deepEqual(
          Object.keys(kf).filter(
            (k) =>
              !["opacity", "transform", "transformBox", "transformOrigin", "offset"].includes(k),
          ),
          [],
          key,
        );
      const last = t.keyframes[t.keyframes.length - 1];
      assert.ok(
        last.opacity === undefined || last.opacity === 1,
        `${key}: last keyframe is not the drawn state`,
      );
      assert.ok(
        last.transform === undefined || last.transform === "none",
        `${key}: last keyframe moves`,
      );
    }
    assert.ok(
      !/opacity="0"|display="none"|visibility="hidden"/.test(svg),
      `${key}: the static picture hides something`,
    );
  }
});

test("the counted steps match the lab's arithmetic", () => {
  const f = fig("coordinates:distance");
  const { svg } = figureSvg(f, "coordinates:distance", [-3, 4, 2, -1], { lang: "en", width: 400 });
  assert.equal((svg.match(/data-seq=/g) || []).length, 5 + 5); // 5 across, 5 down
  const o = figureSvg(fig("line:order"), "line:order", [-3, -8], { lang: "en", width: 400 }).svg;
  assert.equal((o.match(/data-seq=/g) || []).length, 4); // five steps: four dots and the arrowhead
  const r = figureSvg(fig("coordinates:rectangle"), "coordinates:rectangle", [-4, -2, 3, 4], {
    lang: "en",
    width: 400,
  }).svg;
  assert.equal((r.match(/data-step="3" data-seq=/g) || []).length, 6); // six rows of squares
});

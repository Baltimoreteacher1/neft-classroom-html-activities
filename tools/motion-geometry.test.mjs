// Exact-value tests for the geometry motion figures (shared/motion/figures/geometry*.mjs): expected numbers are written by hand or
// reached by a different route (floating point, formulas from the lessons), and every key's headline is compared with the lab's own
// evaluate(). The contract sweep lives in tools/motion-figures.test.mjs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { fmt } from "../curriculum/learning-labs/shared/models/util.mjs";
import { parse, Rat } from "../shared/motion/exact.mjs";
import {
  parallelogramFigure,
  trapezoidFigure,
  triangleFigure,
} from "../shared/motion/figures/geometry-area.mjs";
import { compositeFigure, compositeModel } from "../shared/motion/figures/geometry-composite.mjs";
import {
  fractionalFigure,
  fractionalModel,
  mixed,
} from "../shared/motion/figures/geometry-fractional.mjs";
import { dec, isqrt, sqrtText } from "../shared/motion/figures/geometry-kit.mjs";
import {
  hundText,
  polygonFigure,
  polygonModel,
} from "../shared/motion/figures/geometry-polygon.mjs";
import {
  prismFigure,
  pyramidFigure,
  triPrismFigure,
  volumeFigure,
} from "../shared/motion/figures/geometry-solid.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";

const num = (r) => Number(r.n) / Number(r.d);
const near = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a} vs ${b}`);

test("kit: exact square roots and one-decimal rounding use integers only", () => {
  assert.equal(isqrt(10n ** 40n), 10n ** 20n);
  assert.equal(isqrt(99n), 9n);
  assert.deepEqual(sqrtText(new Rat(25n, 4n)), { text: "2.5", approx: false });
  assert.deepEqual(sqrtText(new Rat(25n)), { text: "5", approx: false });
  assert.deepEqual(sqrtText(new Rat(2n)), { text: "1.4", approx: true });
  assert.deepEqual(sqrtText(new Rat(160n)), { text: "12.6", approx: true }); // 12.649...
  assert.deepEqual(sqrtText(new Rat(208n)), { text: "14.4", approx: true }); // 14.422...
  assert.equal(dec(new Rat(21n, 2n)), "10.5");
  assert.equal(dec(new Rat(1234567n)), "1,234,567");
  assert.equal(hundText(1250n), "12.5");
  assert.equal(hundText(1205n), "12.05");
  assert.equal(hundText(1200n), "12");
});

test("parallelogram: area is base x height whatever the shift; the slanted side is exact only when it is whole", () => {
  const f = parallelogramFigure;
  let m = f.build("area:parallelogram", [8, 3, 4]);
  assert.equal(dec(m.area), "24");
  assert.deepEqual(m.slant, { text: "5", approx: false }); // 3-4-5
  assert.deepEqual(m.wrong, { text: "40", approx: false }); // 8 x 5
  assert.equal(m.slabs, 1);
  m = f.build("area:parallelogram", [5, 4, 12]);
  assert.equal(dec(m.area), "20");
  assert.deepEqual(m.slant, { text: "12.6", approx: true }); // sqrt(160)
  assert.deepEqual(m.wrong, { text: "63.2", approx: true }); // 5 x 12.649...
  assert.equal(m.slabs, 3); // ceil(12 / 5)
  m = f.build("area:parallelogram", [8, 3, 0]);
  assert.equal(dec(m.area), "24");
  const svg = figureSvg(f, "area:parallelogram", [8, 3, 0], { lang: "en", width: 400 }).svg;
  assert.ok(
    !/Not this/.test(svg),
    "no wrong-move line when the shift is 0 (the slanted side is the height)",
  );
  assert.ok(
    /Not this/.test(figureSvg(f, "area:parallelogram", [8, 3, 1], { lang: "en", width: 400 }).svg),
  );
  for (const bad of [
    [3, 3, 3],
    [13, 3, 3],
    [8, 1, 3],
    [8, 3, 16],
    [8, 3.5, 3],
    [8, 3],
  ])
    assert.throws(() => f.build("area:parallelogram", bad), RangeError);
});

test("triangle: two copies make b x h, one is half; a half-integer area prints as a decimal", () => {
  let m = triangleFigure.build("area:triangle", [8, 6, 4]);
  assert.equal(dec(m.twice), "48");
  assert.equal(dec(m.area), "24");
  assert.deepEqual(m.wrong, { text: "28.8", approx: true }); // 8 x sqrt(208) / 4 = 28.844
  m = triangleFigure.build("area:triangle", [5, 3, 4]);
  assert.equal(dec(m.area), "7.5");
  m = triangleFigure.build("area:triangle", [6, 4, 4]);
  assert.deepEqual(m.wrong, { text: "15", approx: false }); // 6 x 5 / 2: the slanted side is 5, exactly
  assert.equal(dec(m.area), "12");
});

test("trapezoid: (b1 + b2) x h is two trapezoids; half of it is the area and equals average base x height", () => {
  let m = trapezoidFigure.build("area:trapezoid", [10, 4, 6]);
  assert.equal(m.sum, 14);
  assert.equal(dec(m.twice), "84");
  assert.equal(dec(m.area), "42");
  assert.equal(dec(m.average), "7");
  assert.equal(num(m.average) * 6, 42);
  m = trapezoidFigure.build("area:trapezoid", [5, 2, 3]);
  assert.equal(dec(m.area), "10.5");
  assert.equal(dec(m.average), "3.5");
  m = trapezoidFigure.build("area:trapezoid", [6, 6, 4]);
  assert.equal(m.leg, false);
  assert.ok(
    !/slanted leg/.test(
      figureSvg(trapezoidFigure, "area:trapezoid", [6, 6, 4], { lang: "en", width: 400 }).svg,
    ),
  );
  assert.ok(
    /slanted side/.test(
      figureSvg(trapezoidFigure, "area:trapezoid", [10, 4, 6], { lang: "en", width: 400 }).svg,
    ),
  );
});

test("polygon: fixed-point trigonometry matches closed forms and the lab's rounding, '=' only when exact", () => {
  const sq = polygonModel(4, 6);
  assert.deepEqual(
    [
      sq.apothem.text,
      sq.apothem.sym,
      sq.triangle.text,
      sq.triangle.sym,
      sq.total.text,
      sq.total.sym,
    ],
    ["3", "=", "9", "=", "36", "="],
  );
  const hex = polygonModel(6, 6); // 3 sqrt(3) / 2 x 36
  assert.equal(hex.total.text, "93.53");
  assert.equal(hex.total.sym, "≈");
  assert.equal(hex.apothem.text, "5.2");
  const pent = polygonModel(5, 6);
  assert.equal(pent.total.text, "61.94");
  assert.equal(pent.apothem.text, "4.13");
  const oct = polygonModel(8, 12); // 2 (1 + sqrt 2) s^2
  assert.equal(oct.total.text, "695.29");
  const tri = polygonModel(3, 6); // sqrt(3) / 4 x 36
  assert.equal(tri.total.text, "15.59");
  // "not this": the radius, centre to corner. Hexagon: radius = side, so 6 x 6 x 6 / 2 = 108
  assert.equal(polygonModel(6, 6).wrong.text, "108");
  assert.equal(polygonModel(4, 2).wrong.text, "5.66"); // 4 x 2 x sqrt(2) / 2 = 2 x 2.828...
});

test("polygon: every setting rounds and flags exactly as the lab does (area:apothem and area:polygon)", () => {
  const round2 = (x) => Math.round(x * 100) / 100;
  const sym = (x) => (Math.abs(x - round2(x)) < 1e-9 ? "=" : "≈");
  for (let n = 3; n <= 8; n++) {
    for (let side = 1; side <= 12; side++) {
      const m = polygonFigure.build("area:apothem", [n, side]);
      const ap = side / (2 * Math.tan(Math.PI / n));
      const tr = (side * ap) / 2;
      const total = Number((n * tr).toFixed(10));
      const where = `${n} sides of ${side}`;
      assert.equal(m.apothem.text, fmt(round2(ap)), `apothem ${where}`);
      assert.equal(m.triangle.text, fmt(round2(tr)), `triangle ${where}`);
      assert.equal(m.total.text, fmt(round2(total)), `total ${where}`);
      assert.equal(m.apothem.sym, sym(ap), `apothem sym ${where}`);
      assert.equal(m.triangle.sym, sym(tr), `triangle sym ${where}`);
      assert.equal(m.total.sym, sym(total), `total sym ${where}`);
      const lab = evaluate({ kind: "area", mode: "apothem", values: [n, side] }, [n, side]);
      near(Number(m.total.hund) / 100, round2(lab.value), `headline ${where}`);
    }
  }
});

test("solids: exact faces, running totals and the wrong-move lines appear only when they differ", () => {
  let m = prismFigure.build("solid:surface", [6, 4, 5]);
  assert.equal(m.net.sum, "30 + 24 + 24 + 20 + 30 + 20 = 148");
  assert.deepEqual(m.net.totals.map(dec), ["30", "54", "78", "98", "128", "148"]);
  assert.equal(dec(m.wrong), "144");
  assert.equal(m.differs, true);
  m = prismFigure.build("solid:faces", [3, 3, 3]);
  assert.equal(dec(m.net.total), "54");
  assert.equal(m.differs, false); // a cube: 6 x one face IS the surface area
  m = prismFigure.build("solid:surface", [3, 6, 4]); // 6 x 18 = 108 = 2 (18 + 12 + 24) by coincidence
  assert.equal(dec(m.net.total), "108");
  assert.equal(m.differs, false);
  assert.ok(
    !/Not this/.test(
      figureSvg(prismFigure, "solid:surface", [3, 6, 4], { lang: "en", width: 400 }).svg,
    ),
  );

  const v = volumeFigure.build("solid:net", [4, 3, 2]);
  assert.equal(v.layer, 12);
  assert.equal(v.volume, 24);
  assert.deepEqual(v.cum, [12, 24]);
  assert.equal(v.sum, 9);
  assert.ok(
    !/Not this/.test(
      figureSvg(volumeFigure, "solid:net", [1, 2, 3], { lang: "en", width: 400 }).svg,
    ),
    "1 + 2 + 3 = 1 x 2 x 3",
  );
  assert.ok(
    /Not this/.test(
      figureSvg(volumeFigure, "solid:net", [2, 2, 2], { lang: "en", width: 400 }).svg,
    ),
  );

  const t = triPrismFigure.build("solid:tri-prism", [6, 3]); // 6-8-10 end, length 3
  assert.equal(dec(t.net.tri), "24");
  assert.deepEqual([t.net.a, t.net.b, t.net.c], [6, 8, 10]);
  assert.equal(dec(t.net.total), "120"); // 48 + 18 + 24 + 30
  assert.equal(dec(t.one), "96");
  for (const bad of [
    [4, 3],
    [6, 0],
    [15, 3],
  ])
    assert.throws(() => triPrismFigure.build("solid:tri-prism", bad), RangeError);

  const p = pyramidFigure.build("solid:pyramid-net", [6, 9]);
  assert.equal(dec(p.net.tri), "27");
  assert.equal(dec(p.net.total), "144"); // 36 + 4 x 27
  assert.equal(dec(pyramidFigure.build("solid:pyramid-net", [5, 7]).net.tri), "17.5");
  assert.throws(() => pyramidFigure.build("solid:pyramid-net", [6, 5]), RangeError);
});

/** Each key's headline number equals the lab's own evaluate(). */
test("headline numbers equal evaluate() for every key and every setting", () => {
  /** @type {Array<[object, string, number[][], (m: any, v: number[]) => number]>} */
  const cases = [
    [
      parallelogramFigure,
      "area:parallelogram",
      range3([4, 12], [2, 9], [0, 15], 3),
      (m) => num(m.area),
    ],
    [triangleFigure, "area:triangle", range3([1, 12], [1, 12], [4, 4], 1), (m) => num(m.area)],
    [trapezoidFigure, "area:trapezoid", range3([1, 12], [1, 12], [1, 12], 1), (m) => num(m.area)],
    [volumeFigure, "solid:net", range3([1, 10], [1, 10], [1, 10], 1), (m) => m.volume],
    [prismFigure, "solid:surface", range3([1, 10], [1, 10], [1, 10], 1), (m) => num(m.net.total)],
    [prismFigure, "solid:faces", range3([1, 10], [1, 10], [1, 10], 1), (m) => num(m.net.total)],
    [
      triPrismFigure,
      "solid:tri-prism",
      [3, 6, 9, 12].flatMap((a) => [1, 2, 5, 10].map((l) => [a, l])),
      (m) => num(m.net.total),
    ],
    [
      pyramidFigure,
      "solid:pyramid-net",
      [1, 3, 6, 10].flatMap((s) => [6, 9, 12].map((l) => [s, l])),
      (m) => num(m.net.total),
    ],
  ];
  for (const [fig, key, sets, head] of cases) {
    const [kind, mode] = key.split(":");
    for (const values of sets) {
      const m = /** @type {any} */ (fig).build(key, values);
      const lab = evaluate({ kind, mode, values }, values).value;
      near(head(m, values), lab, `${key} ${values}`);
    }
  }
  // area:polygon is the bench's polygon with a third, unused control
  const lab = evaluate({ kind: "area", mode: "polygon", values: [5, 6, 3] }, [5, 6, 3]).value;
  const m = polygonFigure.build("area:polygon", [5, 6, 3]);
  assert.ok(
    Math.abs(Number(m.total.hund) / 100 - lab) < 0.005,
    `polygon ${lab} vs ${m.total.text}`,
  );
});

/** @param {[number, number]} a @param {[number, number]} b @param {[number, number]} c @param {number} every */
function range3(a, b, c, every) {
  const pick = ([lo, hi]) => [...new Set([lo, hi, Math.ceil((lo + hi) / 2)])];
  void every;
  return pick(a).flatMap((x) => pick(b).flatMap((y) => pick(c).map((z) => [x, y, z])));
}

test("static pictures carry no transform attribute (the scenes animate transforms) and no float noise", () => {
  const sample = [
    [parallelogramFigure, "area:parallelogram", [7, 5, 9]],
    [triangleFigure, "area:triangle", [7, 5, 4]],
    [trapezoidFigure, "area:trapezoid", [9, 5, 7]],
    [polygonFigure, "area:apothem", [7, 9]],
    [volumeFigure, "solid:net", [5, 4, 3]],
    [prismFigure, "solid:faces", [5, 4, 3]],
    [triPrismFigure, "solid:tri-prism", [9, 4]],
    [pyramidFigure, "solid:pyramid-net", [7, 10]],
  ];
  for (const [fig, key, values] of sample) {
    for (const lang of ["en", "es"]) {
      const { svg } = figureSvg(
        /** @type {any} */ (fig),
        /** @type {string} */ (key),
        /** @type {number[]} */ (values),
        { lang: /** @type {"en" | "es"} */ (lang), width: 400 },
      );
      assert.ok(!/ transform=/.test(svg), `${key}: transform attribute`);
      assert.ok(
        !/\d\.\d{4,}/.test(
          svg.replace(/(?:points|d|x|y|cx|cy|x1|x2|y1|y2|width|height|r)="[^"]*"/g, ""),
        ),
        `${key}: long decimal in text`,
      );
    }
  }
});

/** headline() and wrong() for the Standard flow and Challenge: one number the lesson asks for, and the common wrong result. */
const FIGS = [
  [parallelogramFigure, "area:parallelogram", range3([4, 12], [2, 9], [0, 15], 1)],
  [triangleFigure, "area:triangle", range3([1, 12], [1, 12], [4, 4], 1)],
  [trapezoidFigure, "area:trapezoid", range3([1, 12], [1, 12], [1, 12], 1)],
  [
    polygonFigure,
    "area:apothem",
    [3, 4, 5, 6, 7, 8].flatMap((n) => [1, 5, 12].map((side) => [n, side])),
  ],
  [
    polygonFigure,
    "area:polygon",
    [3, 4, 5, 6, 7, 8].flatMap((n) => [1, 5, 12].map((side) => [n, side, 3])),
  ],
  [
    volumeFigure,
    "solid:net",
    range3([1, 10], [1, 10], [1, 10], 1).concat([
      [1, 2, 3],
      [2, 2, 2],
      [3, 3, 3],
    ]),
  ],
  [
    prismFigure,
    "solid:surface",
    range3([1, 10], [1, 10], [1, 10], 1).concat([
      [3, 6, 4],
      [3, 3, 3],
    ]),
  ],
  [
    prismFigure,
    "solid:faces",
    range3([1, 10], [1, 10], [1, 10], 1).concat([
      [3, 6, 4],
      [3, 3, 3],
    ]),
  ],
  [
    triPrismFigure,
    "solid:tri-prism",
    [3, 6, 9, 12].flatMap((a) => [1, 2, 5, 10].map((l) => [a, l])),
  ],
  [
    pyramidFigure,
    "solid:pyramid-net",
    [1, 3, 6, 10].flatMap((s2) => [6, 9, 12].map((l) => [s2, l])),
  ],
];

test("headline() is the lab's number, parse()-readable, labelled in both languages", () => {
  for (const [fig, key, sets] of FIGS) {
    const [kind, mode] = key.split(":");
    for (const values of sets) {
      const f = /** @type {any} */ (fig);
      const m = f.build(key, values);
      const en = f.headline(m, "en");
      const es = f.headline(m, "es");
      const v = parse(en.value);
      assert.ok(v, `${key} ${values}: "${en.value}" does not parse`);
      assert.equal(es.value, en.value);
      assert.notEqual(es.label, en.label, `${key}: label not translated`);
      assert.ok(en.label && es.label);
      const lab = evaluate({ kind, mode, values }, values).value;
      const rounded = key === "area:polygon" || key === "area:apothem";
      if (rounded) {
        assert.ok(Math.abs(num(v) - lab) < 0.0051, `${key} ${values}: ${en.value} vs ${lab}`);
        assert.equal(en.approx, polygonModel(values[0], values[1]).total.sym === "≈");
      } else {
        near(num(v), lab, `${key} ${values}`);
        assert.ok(!en.approx);
      }
    }
  }
  assert.equal(
    polygonFigure.headline(polygonFigure.build("area:apothem", [4, 6]), "en").approx,
    false,
  );
  assert.equal(
    polygonFigure.headline(polygonFigure.build("area:apothem", [5, 6]), "en").approx,
    true,
  );
  assert.equal(
    parallelogramFigure.headline(parallelogramFigure.build("area:parallelogram", [8, 3, 4]), "en")
      .value,
    "24",
  );
  assert.equal(
    triangleFigure.headline(triangleFigure.build("area:triangle", [5, 3, 4]), "en").value,
    "7.5",
  );
});

test("wrong() is non-null exactly when the dashed 'not this' card is drawn, and never equals the right answer", () => {
  for (const [fig, key, sets] of FIGS) {
    for (const values of sets) {
      const f = /** @type {any} */ (fig);
      const m = f.build(key, values);
      const w = f.wrong(m, "en");
      const wEs = f.wrong(m, "es");
      const drawn = (lang) =>
        /Not this|No así/.test(figureSvg(f, key, values, { lang, width: 400 }).svg);
      assert.equal(w === null, !drawn("en"), `${key} ${values}: wrong() vs the card (en)`);
      assert.equal(wEs === null, !drawn("es"), `${key} ${values}: wrong() vs the card (es)`);
      if (!w) continue;
      assert.ok(parse(w.value), `${key} ${values}: wrong value "${w.value}" does not parse`);
      assert.notEqual(w.value, f.headline(m, "en").value, `${key} ${values}: wrong equals right`);
      assert.ok(
        !parse(w.value).eq(parse(f.headline(m, "en").value)),
        `${key} ${values}: wrong equals right by value`,
      );
      assert.ok(w.say && wEs.say && w.say !== wEs.say, `${key}: say not translated`);
      assert.equal(wEs.value, w.value);
      assert.ok(!/\n/.test(w.say) && w.say.endsWith("."), `${key}: say is one sentence`);
    }
  }
});

test("wrong() values by hand", () => {
  const at = (fig, key, values) =>
    /** @type {any} */ (fig).wrong(/** @type {any} */ (fig).build(key, values), "en");
  assert.equal(at(parallelogramFigure, "area:parallelogram", [8, 3, 4]).value, "40"); // 8 x slant 5
  assert.equal(at(parallelogramFigure, "area:parallelogram", [8, 3, 0]), null);
  assert.equal(at(triangleFigure, "area:triangle", [8, 6, 4]).value, "48");
  assert.equal(at(trapezoidFigure, "area:trapezoid", [10, 4, 6]).value, "84");
  assert.equal(at(polygonFigure, "area:apothem", [6, 6]).value, "108");
  assert.equal(at(volumeFigure, "solid:net", [4, 3, 2]).value, "9");
  assert.equal(at(volumeFigure, "solid:net", [1, 2, 3]), null);
  assert.equal(at(prismFigure, "solid:surface", [6, 4, 5]).value, "144");
  assert.equal(at(prismFigure, "solid:faces", [3, 3, 3]), null);
  assert.equal(at(triPrismFigure, "solid:tri-prism", [6, 3]).value, "96");
  // pyramid base 6, slant 9: inside height sqrt(72) = 8.485..., so 36 + 2 x 6 x 8.485 = 137.82
  assert.equal(at(pyramidFigure, "solid:pyramid-net", [6, 9]).value, "137.82");
  assert.match(
    figureSvg(pyramidFigure, "solid:pyramid-net", [6, 9], { lang: "en", width: 400 }).svg,
    /8\.5\) gives ≈ 137\.82/,
  );
});

test("composite L-shape: add and subtract strategies agree at every setting, with hand-worked values", () => {
  const m = compositeFigure.build("area:composite", [10, 8, 3, 2]);
  assert.deepEqual([m.a, m.b, m.addTotal], [56, 18, 74]); // 7 x 8, 3 x 6
  assert.deepEqual([m.whole, m.notch, m.subTotal], [80, 6, 74]);
  const small = compositeFigure.build("area:composite", [4, 4, 3, 3]);
  assert.deepEqual([small.a, small.b, small.whole, small.notch, small.total], [4, 3, 16, 9, 7]); // 1 x 4 + 3 x 1, and 16 - 9
  const [c0, c1, c2, c3] = compositeFigure.controls("area:composite");
  let count = 0;
  for (let W = c0.min; W <= c0.max; W++) {
    for (let H = c1.min; H <= c1.max; H++) {
      for (let w = c2.min; w <= c2.max; w++) {
        for (let h = c3.min; h <= c3.max; h++) {
          const x = compositeModel(W, H, w, h);
          assert.equal(x.addTotal, x.subTotal, `${W} ${H} ${w} ${h}`);
          assert.ok(x.total >= 1 && w < W && h < H);
          // a third route: count the unit squares of the L cell by cell
          let cells = 0;
          for (let i = 0; i < W; i++)
            for (let j = 0; j < H; j++) if (!(i >= W - w && j >= H - h)) cells++;
          assert.equal(cells, x.total);
          const f = /** @type {any} */ (compositeFigure);
          assert.equal(f.headline(x, "en").value, String(x.total));
          assert.equal(f.headline(x, "en").label, "Area of the shape");
          assert.equal(f.headline(x, "es").label, "Área de la figura");
          const wr = f.wrong(x, "en");
          assert.ok(wr && wr.value === String(W * H) && wr.value !== f.headline(x, "en").value);
          assert.notEqual(wr.say, f.wrong(x, "es").say);
          assert.equal(wr.say, "Used the whole rectangle and forgot to subtract the notch.");
          count++;
        }
      }
    }
  }
  assert.equal(count, 11 * 9 * 3 * 3);
  for (const bad of [
    [3, 8, 1, 1],
    [15, 8, 1, 1],
    [10, 8, 0, 1],
    [10, 8, 4, 1],
    [10, 8, 1, 4],
    [10, 8, 1.5, 1],
    [10, 8, 3],
  ])
    assert.throws(() => compositeFigure.build("area:composite", bad), RangeError);
  const en = figureSvg(compositeFigure, "area:composite", [10, 8, 3, 2], {
    lang: "en",
    width: 400,
  });
  const es = figureSvg(compositeFigure, "area:composite", [10, 8, 3, 2], {
    lang: "es",
    width: 400,
  });
  assert.notEqual(en.svg, es.svg);
  assert.match(en.svg, /Not this: 10 × 8 = 80/);
  assert.match(es.svg, /No así: 10 × 8 = 80/);
  assert.notEqual(
    compositeFigure.describe(en.model, "en"),
    compositeFigure.describe(en.model, "es"),
  );
  assert.ok(
    compositeFigure.standalone.values.length === compositeFigure.controls("area:composite").length,
  );
});

test("fractional-edge volume: half-unit cubes and base area x height agree, with hand-worked values", () => {
  const f = /** @type {any} */ (fractionalFigure);
  // 3, 2, 2 halves: edges 1 1/2, 1, 1; 12 half-cubes of 1/8 each = 3/2 cubic units
  let m = f.build("solid:fractional", [3, 2, 2]);
  assert.deepEqual([m.layer, m.count], [6, 12]);
  assert.equal(m.byCubes.toString(), "3/2");
  assert.equal(m.base.toString(), "3/2");
  assert.equal(m.byBase.toString(), "3/2");
  assert.equal(f.headline(m, "en").value, "3/2");
  assert.equal(mixed(m.volume), "1 1/2");
  assert.equal(mixed(m.l), "1 1/2");
  m = f.build("solid:fractional", [12, 12, 12]); // 6 x 6 x 6 = 216 cubic units from 1,728 small cubes
  assert.equal(m.count, 1728);
  assert.equal(m.volume.toString(), "216");
  m = f.build("solid:fractional", [3, 3, 3]); // 1 1/2 each: 27/8
  assert.equal(f.headline(m, "en").value, "27/8");
  assert.equal(f.headline(m, "es").label, "Volumen (unidades cúbicas)");
  assert.equal(f.headline(m, "en").label, "Volume (cubic units)");
  assert.equal(f.wrong(m, "en").value, "27"); // 27 small cubes taken as 27 cubic units
  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      for (let c = 1; c <= 12; c++) {
        const x = fractionalModel(a, b, c);
        assert.ok(x.byCubes.eq(x.byBase), `${a} ${b} ${c}: methods disagree`);
        assert.equal(x.count, a * b * c);
        // a third route: (a/2)(b/2)(c/2) in floating point is exact for these dyadic values
        assert.equal((a / 2) * (b / 2) * (c / 2), Number(x.volume.n) / Number(x.volume.d));
        const w = f.wrong(x, "en");
        assert.ok(w && w.value === String(x.count) && w.value !== f.headline(x, "en").value);
        assert.ok(!parse(w.value).eq(parse(f.headline(x, "en").value)));
        assert.ok(parse(f.headline(x, "en").value).eq(x.volume));
        assert.notEqual(w.say, f.wrong(x, "es").say);
      }
    }
  }
  for (const bad of [
    [0, 2, 2],
    [13, 2, 2],
    [3, 2, 0],
    [3, 2.5, 2],
    [3, 2],
  ])
    assert.throws(() => f.build("solid:fractional", bad), RangeError);
  const en = figureSvg(f, "solid:fractional", [3, 2, 2], { lang: "en", width: 400 });
  const es = figureSvg(f, "solid:fractional", [3, 2, 2], { lang: "es", width: 400 });
  assert.notEqual(en.svg, es.svg);
  assert.match(en.svg, /Not this: 12 is the number of small cubes/);
  assert.match(es.svg, /No así: 12 es el número de cubos pequeños/);
  assert.notEqual(f.describe(en.model, "en"), f.describe(en.model, "es"));
  assert.equal(f.standalone.values.length, f.controls("solid:fractional").length);
});

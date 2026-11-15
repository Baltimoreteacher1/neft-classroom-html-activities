// Exact-value tests for the fraction partition-and-count figure (shared/motion/figures/fractions*.mjs). Expected numbers are worked
// by hand (or by a different route: integer arithmetic on the cross-multiplied fraction), never by calling the figure's own code.
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import fractions from "../shared/motion/figures/fractions.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";

const fig = fractions[0];
const KEYS = ["fraction:servings", "fraction:ribbon", "fraction:field"];
const mixed = (r) => `${r.n / r.d}|${r.n % r.d}|${r.d}`;

test("hand-worked quotients, parts and leftovers", () => {
  // [supply, numerator, denominator] -> quotient as whole|remainder|denominator, and parts = supply x denominator
  const cases = [
    { v: [3, 1, 2], q: "6|0|1", parts: "6|0|1", full: 6 }, // 3 divided by one half
    { v: [3, 1, 4], q: "12|0|1", parts: "12|0|1", full: 12 }, // how many fourths in 3
    { v: [5.5, 3, 4], q: "7|1|3", parts: "22|0|1", full: 7 }, // 5 1/2 / (3/4) = 22/3
    { v: [4.5, 2, 3], q: "6|3|4", parts: "13|1|2", full: 6 }, // 4 1/2 / (2/3) = 27/4; parts 27/2
    { v: [0.5, 5, 2], q: "0|1|5", parts: "1|0|1", full: 0 }, // 1/2 / (5/2) = 1/5
    { v: [3, 2, 4], q: "6|0|1", parts: "12|0|1", full: 6 }, // unreduced 2/4 still means 1/2
    { v: [8, 1, 8], q: "64|0|1", parts: "64|0|1", full: 64 },
    { v: [1, 5, 3], q: "0|3|5", parts: "3|0|1", full: 0 }, // 1 / (5/3) = 3/5
  ];
  for (const k of KEYS) {
    for (const c of cases) {
      const m = fig.build(k, c.v);
      assert.equal(mixed(m.q), c.q, `${k} ${c.v}`);
      assert.equal(mixed(m.parts), c.parts, `${k} ${c.v} parts`);
      assert.equal(m.complete, c.full, `${k} ${c.v} full`);
      assert.equal(
        m.groups.length,
        c.full + (c.q.split("|")[1] === "0" ? 0 : 1),
        `${k} ${c.v} groups`,
      );
      assert.equal(
        mixed(m.check),
        `${Math.floor(c.v[0])}|${c.v[0] % 1 ? 1 : 0}|${c.v[0] % 1 ? 2 : 1}`,
        "quotient x share size is the supply",
      );
    }
  }
});

test("headline agrees with the lab's evaluate() on every legal setting of every key", () => {
  for (const k of KEYS) {
    const [kind, mode] = k.split(":");
    for (let a = 0.5; a <= 8; a += 0.5)
      for (let b = 1; b <= 5; b++)
        for (let c = 2; c <= 8; c++) {
          const m = fig.build(k, [a, b, c]);
          const lab = evaluate({ kind, mode, values: [a, b, c] }, [a, b, c]).value;
          assert.ok(
            Math.abs(Number(m.q.n) / Number(m.q.d) - lab) < 1e-9,
            `${k} ${a} ${b}/${c}: ${m.q} vs ${lab}`,
          );
          // a different route: whole shares and leftover from integer arithmetic on the cross-multiplied fraction
          const num = 2 * a * c;
          const den = 2 * b;
          assert.equal(m.complete, Math.floor(num / den));
          assert.equal(Number(m.leftover.n) * den, (num % den) * Number(m.leftover.d));
        }
  }
});

test("groups tile the supply: every complete group has b parts, a partial group is only the leftover", () => {
  for (const k of KEYS)
    for (const v of [
      [5.5, 3, 4],
      [4.5, 2, 3],
      [0.5, 5, 2],
      [7, 4, 5],
    ]) {
      const m = fig.build(k, v);
      let drawn = 0;
      for (const g of m.groups) {
        const width = g.segs.reduce((s, x) => s + (x.to - x.from), 0);
        drawn += width;
        if (g.complete)
          assert.ok(Math.abs(width * v[2] - v[1]) < 1e-9, `${k} ${v}: group ${g.n} width`);
      }
      assert.ok(Math.abs(drawn - v[0]) < 1e-9, `${k} ${v}: groups cover ${drawn} of ${v[0]}`);
      assert.equal(m.rows, Math.ceil(v[0]));
    }
});

test("the wrong-move cue appears only when it differs from the right answer", () => {
  // servings: multiplying. 3 x 1/2 = 3/2, not 6. With a share of one whole (2/2) multiplying and dividing agree.
  assert.equal(fig.build("fraction:servings", [3, 1, 2]).wrong.kind, "multiply");
  assert.equal(fig.build("fraction:servings", [3, 2, 2]).wrong, null);
  // field: one half divided by 3 is 1/6, not 3 divided by one half; with supply 1 and share 2/2 the two agree
  assert.equal(fig.build("fraction:field", [3, 1, 2]).wrong.kind, "flip");
  assert.equal(mixed(fig.build("fraction:field", [3, 1, 2]).wrong.value), "0|1|6");
  assert.equal(fig.build("fraction:field", [1, 2, 2]).wrong, null);
  // ribbon: the leftover warning needs a leftover
  assert.equal(fig.build("fraction:ribbon", [3, 1, 2]).wrong, null);
  assert.equal(mixed(fig.build("fraction:ribbon", [5.5, 3, 4]).wrong.value), "0|1|3");
  const withCue = figureSvg(fig, "fraction:servings", [3, 1, 2]).svg;
  const without = figureSvg(fig, "fraction:servings", [3, 2, 2]).svg;
  assert.ok(withCue.includes('class="fp-miss"') && withCue.includes('stroke-dasharray="6 4"'));
  assert.ok(!without.includes("fp-miss"));
});

test("fractions are drawn stacked or worded, never inline a/b; every word exists in both languages", () => {
  for (const k of KEYS)
    for (const lang of ["en", "es"]) {
      const { svg, model } = figureSvg(fig, k, [5.5, 3, 4], { lang, width: 340 });
      const texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)</g)].map((t) => t[1]);
      for (const t of texts) assert.ok(!/\d\s*\/\s*\d/.test(t), `inline fraction in "${t}"`);
      assert.ok(svg.includes("<line "), "stacked fractions draw a bar");
      assert.ok(!/\d\s*\/\s*\d/.test(fig.describe(model, lang)), "description words its fractions");
    }
  const en = figureSvg(fig, "fraction:servings", [3, 1, 4], { lang: "en" });
  const es = figureSvg(fig, "fraction:servings", [3, 1, 4], { lang: "es" });
  assert.match(en.svg, /How many servings of one fourth of a cup fit in 3 cups\?/);
  assert.match(es.svg, /¿Cuántas porciones de un cuarto de taza caben en 3 tazas\?/);
  assert.match(fig.describe(fig.build("fraction:ribbon", [5.5, 3, 4]), "es"), /5 unidades y media/);
  assert.match(fig.describe(fig.build("fraction:ribbon", [5.5, 3, 4]), "en"), /7 and one third/);
  assert.doesNotMatch(es.svg, /serving|cup|Check|Not this/);
});

test("the lab's refused settings are refused", () => {
  assert.throws(() => fig.build("fraction:servings", [0, 1, 2]), RangeError);
  assert.throws(() => fig.build("fraction:servings", [3.3, 1, 2]), RangeError);
  assert.throws(() => fig.build("fraction:ribbon", [3, 0, 4]), RangeError);
  assert.throws(() => fig.build("fraction:field", [3, 1, 1]), RangeError);
  assert.throws(() => fig.build("fraction:field", [3, 1, 9]), RangeError);
  assert.throws(() => fig.build("ratio:tape", [3, 1, 2]), RangeError);
});

test("the scene tracks the picture: every share pops once and the static picture is complete", () => {
  const { svg, model } = figureSvg(fig, "fraction:field", [4.5, 2, 3], { lang: "en" });
  const doc = new JSDOM(`<body>${svg}</body>`).window.document;
  const sc = fig.scene(doc, model);
  assert.equal(doc.querySelectorAll(".fp-group").length, model.groups.length);
  assert.equal(model.groups.length, 7);
  const pops = sc.tracks.filter(
    (t) => t.els.length === 1 && t.els[0].classList.contains("fp-group"),
  );
  assert.equal(pops.length, 7);
  for (const t of sc.tracks) {
    const last = t.keyframes[t.keyframes.length - 1];
    assert.equal(last.opacity, 1, "last keyframe is the natural state");
  }
  assert.ok(!svg.includes('opacity="0"'), "nothing is hidden in the static picture");
});

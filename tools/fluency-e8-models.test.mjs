// Phase 2: the MathVisualEngine and every model, tested without a browser.
// For every model, at every grade it serves, over many seeded parameter sets and random walks of its own controls:
// each representation agrees with the state (model.verify), moves are reversible, snapshots round-trip, and the
// output has no NaN or undefined. Then exact-arithmetic spot checks of the mathematics itself.
import assert from "node:assert/strict";
import { listModels, MathVisualEngine, seeded } from "../math/fluency-lab/e8/models.js";
import {
  equivalent,
  mean,
  median,
  modes,
  parseRational,
  quartiles,
  R,
  Rational,
} from "../math/fluency-lab/e8/rational.js";

const models = listModels();
const EXPECTED = [
  "tenFrame",
  "numberBond",
  "numberLine",
  "baseTen",
  "hundredsChart",
  "countingCollection",
  "factFamily",
  "array",
  "areaMultiply",
  "longDivision",
  "fractionBar",
  "fractionCircle",
  "fractionWall",
  "fractionOps",
  "decimalGrid",
  "decimalProduct",
  "percentBar",
  "tapeRatio",
  "linearGraph",
  "functionMachine",
  "balanceScale",
  "algebraTiles",
  "integerChips",
  "areaPerimeter",
  "areaDecomp",
  "triangleArea",
  "angleTool",
  "coordinatePlane",
  "transformation",
  "prismVolume",
  "netSurface",
  "dotPlot",
  "histogram",
  "boxPlot",
  "scatterPlot",
];
assert.deepEqual(models.map((m) => m.id).sort(), [...EXPECTED].sort(), "model inventory changed");

// Grade coverage: every grade 1-8 has at least five interactive models.
for (let g = 1; g <= 8; g += 1)
  assert.ok(
    models.filter((m) => m.grades.includes(g)).length >= 5,
    `Grade ${g} has too few models`,
  );

const bad = /NaN|undefined|Infinity|\[object/;
let moves = 0;
let rejected = 0;
for (const model of models) {
  for (const grade of model.grades) {
    for (let seed = 1; seed <= 12; seed += 1) {
      const rng = seeded(seed * 7919 + grade);
      const params = model.generate(rng, grade);
      const tag = `${model.id} g${grade} seed${seed}`;
      const engine = new MathVisualEngine(model.id, params);
      assert.deepEqual(engine.verify(), [], `${tag}: initial state fails verify`);
      for (let step = 0; step < 40; step += 1) {
        const enabled = engine.controls().filter((c) => !c.disabled);
        if (!enabled.length) {
          assert.ok(step > 0, `${tag}: a fresh model must offer a move`);
          break; // nothing left to do (for example every block already taken away)
        }
        const control = enabled[rng.int(0, enabled.length - 1)];
        const before = engine.serialize();
        const result = engine.dispatch(control.action);
        moves += 1;
        if (!result.ok) {
          rejected += 1;
          assert.equal(engine.serialize(), before, `${tag}: a refused move changed the state`);
          assert.ok(
            result.reason.en && result.reason.es,
            `${tag}: refusal needs English and Spanish reasons`,
          );
        }
        const problems = engine.verify();
        assert.deepEqual(
          problems,
          [],
          `${tag}: after ${JSON.stringify(control.action)} -> ${problems.join("; ")}`,
        );
        const views = engine.views();
        const markup = [views.visual, ...Object.values(views.variants)].join("");
        assert.ok(
          markup.startsWith("<svg") &&
            markup.includes('role="img"') &&
            markup.includes("aria-label="),
          `${tag}: picture needs an accessible name`,
        );
        assert.ok(!bad.test(markup), `${tag}: picture contains ${bad.exec(markup)?.[0]}`);
        const derived = engine.derive();
        assert.ok(
          !bad.test(
            JSON.stringify(derived.verbal) + derived.equation + JSON.stringify(derived.numeric),
          ),
          `${tag}: text contains NaN/undefined`,
        );
        assert.ok(derived.verbal.en && derived.verbal.es, `${tag}: verbal needs both languages`);
        assert.ok(
          views.concrete.en && views.concrete.es,
          `${tag}: description needs both languages`,
        );
        for (const c of engine.controls())
          assert.ok(c.label.en && c.label.es, `${tag}: control ${c.id} needs both languages`);
      }
      // Undo all the way back, redo forward: state is restored exactly.
      const final = engine.serialize();
      let undone = 0;
      while (engine.undo()) undone += 1;
      assert.equal(
        JSON.stringify(engine.state),
        JSON.stringify(engine.initial),
        `${tag}: undo did not reach the start`,
      );
      for (let i = 0; i < undone; i += 1) assert.ok(engine.redo(), `${tag}: redo ran out`);
      assert.equal(engine.serialize(), final, `${tag}: redo did not restore the state`);
      // Reset, then a serialise / restore round trip.
      engine.reset();
      assert.equal(JSON.stringify(engine.state), JSON.stringify(engine.initial), `${tag}: reset`);
      assert.equal(
        MathVisualEngine.restore(final).serialize(),
        final,
        `${tag}: snapshot round trip`,
      );
    }
  }
}
assert.ok(moves > 10000, `exercised only ${moves} moves`);

// A snapshot that fails verification is refused rather than shown.
const tampered = JSON.parse(new MathVisualEngine("tenFrame", { frames: 1, start: 3 }).serialize());
tampered.state = { filled: 99 };
assert.throws(() => MathVisualEngine.restore(tampered), /fails verification|picture shows/);

// ------------------------------------------------------------------ exact mathematics
// Parsing and equivalence.
for (const [text, value] of [
  ["1/2", "1/2"],
  ["2/4", "1/2"],
  ["0.5", "1/2"],
  ["50%", "1/2"],
  ["1 1/2", "3/2"],
  ["-3/6", "-1/2"],
  ["−0.25", "-1/4"],
  ["1,250", "1250"],
  [".75", "3/4"],
  ["½", "1/2"],
  ["2 ¾", "11/4"],
  ["7/3", "7/3"],
])
  assert.ok(parseRational(text).eq(Rational.of(value)), `parse ${text}`);
for (const text of ["", "abc", "1/0", "1..2", "--3", "1/2/3", "0.5.5", "50%%"])
  assert.equal(parseRational(text), null, `reject ${JSON.stringify(text)}`);
assert.ok(equivalent("2/4", "1/2"));
assert.ok(
  !equivalent("2/4", "1/2", { simplified: true }),
  "unsimplified answer refused when simplification is assessed",
);
assert.ok(equivalent("1/2", "1/2", { simplified: true }));
assert.ok(!equivalent("0.5", "1/2", { allowDecimal: false }));
assert.ok(!equivalent("1/3", "0.333"), "a rounded decimal is not equal to one third");
assert.ok(!equivalent("12", "1/2"), "similar strings are not equal values");
assert.equal(R(1, 3).toDecimal(4), "0.3333");
assert.equal(R(2, 3).toDecimal(2), "0.67");
assert.equal(R(-7, 8).toDecimal(2), "-0.88");
assert.equal(R(1, 8).toDecimal(3), "0.125");
assert.ok(R(1, 8).isTerminating() && !R(1, 3).isTerminating());
assert.equal(Rational.of(0.1).add(Rational.of(0.2)).toString(), "3/10", "0.1 + 0.2 is exactly 0.3");
assert.deepEqual(R(7, 3).mixed(), { sign: 1, whole: 2, num: 1, den: 3 });
// Statistics (median-of-halves quartiles, mean, modes).
const q = quartiles([1, 3, 3, 6, 7, 8, 9]);
assert.deepEqual([q.min, q.q1, q.median, q.q3, q.max].map(String), ["1", "3", "6", "8", "9"]);
assert.equal(median([4, 1, 3, 2]).toString(), "5/2");
assert.equal(mean([1, 2, 2, 5]).toString(), "5/2");
assert.deepEqual(modes([1, 2, 2, 3, 3, 4]).map(String), ["2", "3"]);

// The ratio example from the specification: scaling the tape updates table, double number line and equation together.
{
  const e = new MathVisualEngine("tapeRatio", { a: 3, b: 5, k: 1, names: ["red", "blue"] });
  assert.ok(e.dispatch({ type: "scale", value: 4 }).ok);
  const v = e.views();
  assert.match(v.symbolic, /^3:5 = 12:20/);
  assert.deepEqual(v.numeric.rows, [
    [3, 5],
    [6, 10],
    [9, 15],
    [12, 20],
  ]);
  assert.equal((v.variants.doubleLine.match(/data-top=/g) || []).length, 5);
  assert.equal(v.facts.unitRate.toString(), "5/3");
  assert.ok(!e.dispatch({ type: "scale", value: 13 }).ok, "scale is bounded");
}
// Fraction addition: only a common multiple is accepted, and the answer is exact.
{
  const e = new MathVisualEngine("fractionOps", { a: [1, 3], b: [1, 4], op: "+" });
  const refused = e.dispatch({ type: "commonDen", value: 7 });
  assert.ok(!refused.ok && refused.reason.en.includes("not a multiple"));
  assert.ok(e.dispatch({ type: "commonDen", value: 12 }).ok);
  assert.match(e.derive().equation, /= 4\/12 \+ 3\/12 = 7\/12$/);
  assert.equal(e.derive().facts.result.toString(), "7/12");
  assert.ok(e.derive().facts.minimal, "12 is the least common denominator");
  const sub = new MathVisualEngine("fractionOps", { a: [3, 4], b: [1, 6], op: "-" });
  sub.dispatch({ type: "commonDen", value: 12 });
  assert.equal(sub.derive().facts.result.toString(), "7/12");
}
// Equivalent fractions keep the same value and refuse impossible simplifying.
{
  const e = new MathVisualEngine("fractionBar", { n: 2, d: 4 });
  e.dispatch({ type: "refine", by: 3 });
  assert.equal(e.derive().equation, "2/4 = 6/12");
  assert.ok(e.derive().facts.equivalentToStart);
  const bad2 = e.dispatch({ type: "simplify", by: 5 });
  assert.ok(!bad2.ok);
  e.dispatch({ type: "simplify" });
  assert.equal(`${e.state.n}/${e.state.d}`, "1/2");
}
// The balance scale never loses the solution, and divides by a coefficient correctly.
{
  const e = new MathVisualEngine("balanceScale", { a: 3, b: 2, c: 0, d: 14 });
  assert.ok(!e.dispatch({ type: "div", value: 0 }).ok);
  e.dispatch({ type: "addConst", value: -2 });
  assert.equal(e.derive().steps.hint.en.startsWith("Divide both sides by 3"), true);
  e.dispatch({ type: "div", value: 3 });
  assert.equal(e.derive().facts.solved, true);
  assert.match(e.derive().equation, /^x = 4/);
  assert.deepEqual(e.verify(), []);
  const two = new MathVisualEngine("balanceScale", { a: 5, b: 3, c: 2, d: 18 });
  two.dispatch({ type: "addX", value: -2 });
  two.dispatch({ type: "addConst", value: -3 });
  two.dispatch({ type: "div", value: 3 });
  assert.equal(two.derive().facts.solved, true);
  assert.equal(two.state.D, "5");
}
// A fractional-edge prism: counting 1/2-unit cubes and multiplying the edges give the same volume.
{
  const e = new MathVisualEngine("prismVolume", { l: 3, w: 2, h: 4, unit: "1/2" });
  const d = e.derive();
  assert.equal(d.facts.cubes, 24);
  assert.equal(d.facts.volume.toString(), "3");
  assert.deepEqual(e.verify(), []);
}
// Long division: quotient and remainder.
{
  const e = new MathVisualEngine("longDivision", { dividend: 1234, divisor: 7 });
  e.dispatch({ type: "all" });
  const d = e.derive();
  assert.equal(d.facts.quotient, 176);
  assert.equal(d.facts.remainder, 2);
  assert.equal(d.equation, "1234 ÷ 7 = 176 R 2");
}
// Linear graph: the point sits exactly on the line, and an off-grid move is refused with a reason.
{
  const e = new MathVisualEngine("linearGraph", { m: "3/2", b: -1, x: 2 });
  assert.equal(e.derive().facts.point[1].toString(), "2");
  assert.ok(!e.dispatch({ type: "setX", value: 9 }).ok, "(9, 12.5) is off the grid");
  assert.ok(e.dispatch({ type: "setX", value: 6 }).ok);
  assert.equal(e.derive().facts.point[1].toString(), "8");
}
// Transformations compose correctly through two independent routes (step rules and matrices).
{
  const e = new MathVisualEngine("transformation", {
    poly: [
      [1, 1],
      [3, 1],
      [2, 3],
    ],
  });
  e.dispatch({ type: "apply", op: { t: "rotate", quarter: 1 } });
  e.dispatch({ type: "apply", op: { t: "translate", dx: 2, dy: -1 } });
  e.dispatch({ type: "apply", op: { t: "reflect", axis: "y" } });
  assert.deepEqual(e.verify(), []);
  assert.equal(e.derive().numeric.rows[0][2], "(-1, 0)"); // (1,1) -> (-1,1) -> (1,0) -> (-1,0)
  assert.ok(!e.dispatch({ type: "apply", op: { t: "dilate", k: 0 } }).ok);
}
// Scatter plot: exact least squares on a perfect line recovers it.
{
  const e = new MathVisualEngine("scatterPlot", {
    points: [
      [1, 3],
      [2, 5],
      [3, 7],
      [4, 9],
    ],
  });
  const f = e.derive().facts;
  assert.equal(`${f.m}`, "2");
  assert.equal(`${f.b}`, "1");
}
// The mean is the balance point.
{
  const e = new MathVisualEngine("dotPlot", { min: 0, max: 20, data: [2, 3, 3, 8, 14] });
  assert.equal(e.derive().facts.mean.toString(), "6");
  assert.deepEqual(e.verify(), []);
}
// Integer chips: subtracting a negative needs zero pairs first (taking away with none present is refused).
{
  const e = new MathVisualEngine("integerChips", { a: 3, expr: { a: 3, b: -2, op: "-" } });
  assert.ok(!e.dispatch({ type: "remove", sign: "-" }).ok);
  e.dispatch({ type: "addZero" });
  e.dispatch({ type: "addZero" });
  assert.ok(e.dispatch({ type: "remove", sign: "-" }).ok);
  assert.ok(e.dispatch({ type: "remove", sign: "-" }).ok);
  assert.equal(e.derive().facts.net, 5, "3 - (-2) = 5");
}

console.log(
  `Enterprise 8 models: ${models.length} models, ${moves} random moves (${rejected} refused with reasons), exact-arithmetic spot checks passed.`,
);

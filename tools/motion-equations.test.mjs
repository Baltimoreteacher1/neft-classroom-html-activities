// Exact-value tests for the equations motion figures (balance, inequality, growth). Expected numbers are written by hand or reached by a
// different route than the figures use; the headline of each key must also equal the lab's own evaluate().
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { parse } from "../shared/motion/exact.mjs";
import equations from "../shared/motion/figures/equations.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";

const [balance, inequality, growth] = equations;
const KEYS = {
  "balance:add": [7, 19, 12],
  "balance:multiply": [4, 36, 9],
  "inequality:entry": [12, 10],
  "inequality:budget": [15, 6],
  "inequality:graph": [9, 14],
  "growth:weather": [2, 4, 3],
  "growth:fees": [3, 5, 4],
  "growth:table": [3, 0, 2],
};
/** @param {string} key */
const figOf = (key) => equations.find((f) => f.keys.includes(key));
/** @param {string} key */
const labModel = (key) => {
  const [kind, mode] = key.split(":");
  return { kind, mode, values: KEYS[key] };
};
const svgOf = (key, values, lang = "en", width = 400) =>
  figureSvg(figOf(key), key, values, { lang, width }).svg;

test("the group claims exactly the eight keys it was given", () => {
  assert.deepEqual(equations.flatMap((f) => f.keys).sort(), Object.keys(KEYS).sort());
  for (const f of equations) assert.ok(f.title.en && f.title.es && f.title.en !== f.title.es);
});

test("every headline equals the lab's evaluate() across each control's whole range", () => {
  for (const [key, start] of Object.entries(KEYS)) {
    const fig = figOf(key);
    fig.controls(key).forEach((c, i) => {
      for (let v = c.min; v <= c.max; v += c.step) {
        const values = start.map((x, j) => (j === i ? v : x));
        const m = fig.build(key, values);
        const lab = evaluate(labModel(key), values);
        assert.equal(m.value, lab.value, `${key} ${values}`);
        if (key.startsWith("inequality"))
          assert.equal(m.pass, lab.pass, `${key} ${values} qualifies`);
        if (key.startsWith("balance"))
          assert.equal(m.balanced, Math.abs(lab.value) < 1e-9, `${key} ${values} balanced`);
      }
    });
  }
});

test("balance:add: x + 7 = 19 has solution 12 and the candidate 12 balances", () => {
  const m = balance.build("balance:add", [7, 19, 12]);
  assert.equal(m.X.toString(), "12");
  assert.equal(m.balanced, true);
  assert.equal(m.diff.toString(), "0");
  assert.equal(m.wrong.diff.toString(), "-7"); // 12 on the left against 19 on the right
});

test("balance:add: a candidate of 3 leaves the right side heavier by 9; a small right side gives a negative solution", () => {
  const m = balance.build("balance:add", [7, 19, 3]);
  assert.equal(m.left.toString(), "10");
  assert.equal(m.diff.toString(), "-9");
  assert.equal(m.balanced, false);
  assert.equal(balance.build("balance:add", [12, 1, 0]).X.toString(), "-11");
  assert.equal(balance.build("balance:add", [7, 19, 12.5]).diff.toString(), "1/2");
});

test("balance:multiply: 4x = 36 gives 9; 7x = 36 gives exactly 36/7 and is never rounded", () => {
  assert.equal(balance.build("balance:multiply", [4, 36, 9]).X.toString(), "9");
  const m = balance.build("balance:multiply", [7, 36, 3.5]);
  assert.equal(m.X.toString(), "36/7");
  assert.equal(m.left.toString(), "49/2");
  assert.equal(m.diff.toString(), "-23/2");
  const svg = svgOf("balance:multiply", [7, 36, 3.5]);
  assert.ok(!svg.includes("36/7"), "a fraction is stacked, never written inline");
  assert.ok(
    !/over/.test(svg.replace(/<desc>.*<\/desc>/, "")),
    "no spoken form in the drawing itself",
  );
  assert.ok(!balance.describe(m, "en").includes("/"));
  assert.match(balance.describe(m, "en"), /36 over 7/);
  assert.match(balance.describe(m, "es"), /36 sobre 7/);
});

test("balance: the one-sided move is shown only when it differs", () => {
  assert.equal(balance.build("balance:multiply", [1, 10, 3]).wrong, null); // 1x = 10: dividing only the left by 1 changes nothing
  assert.ok(!svgOf("balance:multiply", [1, 10, 3]).includes('stroke-dasharray="6 4"'));
  assert.ok(svgOf("balance:multiply", [2, 10, 3]).includes('stroke-dasharray="6 4"'));
  assert.ok(
    balance.build("balance:add", [1, 1, 0]).wrong,
    "x + 1 = 1: subtracting on one side still differs",
  );
});

test("balance: the picture names the same operation on both sides and says level or heavier in words", () => {
  const en = svgOf("balance:add", [7, 19, 3]);
  assert.match(en, />x \+ 7 = 19</);
  assert.match(en, />x \+ 7 − 7 = 19 − 7</);
  assert.match(en, /the right side is heavier/);
  assert.match(en, />Left minus right = −9</);
  assert.equal((en.match(/class="eq-ghost"/g) || []).length, 3); // a dashed -7 on each pan of card 2 and on the left pan of the wrong card
  const es = svgOf("balance:multiply", [4, 36, 9], "es");
  assert.match(es, /Divide los dos lados entre 4/);
  assert.match(es, /es una solución/);
});

test("inequality: circle type, direction and qualifies come from the rule", () => {
  const e = inequality.build("inequality:entry", [12, 12]);
  assert.deepEqual(
    [e.sym, e.closed, e.right, e.pass, e.wrong, e.wrongPass],
    [">=", true, true, true, ">", false],
  );
  const b = inequality.build("inequality:budget", [15, 15]);
  assert.deepEqual(
    [b.sym, b.closed, b.right, b.pass, b.wrong, b.wrongPass],
    ["<=", true, false, true, "<", false],
  );
  const g = inequality.build("inequality:graph", [9, 14]);
  assert.deepEqual([g.sym, g.pass], ["<=", false]);
  assert.equal(inequality.build("inequality:entry", [12, 11]).pass, false);
  assert.equal(inequality.build("inequality:budget", [15, 0]).pass, true);
});

test("inequality: the test value is marked with a symbol and a word, and the other circle is a dashed line", () => {
  const yes = svgOf("inequality:budget", [15, 15]);
  assert.match(yes, />qualifies</);
  assert.match(yes, />closed circle: 15 is included</);
  const no = svgOf("inequality:entry", [12, 10]);
  assert.match(no, />does not qualify</);
  assert.match(no, /<path d="M[^"]*l12 12/, "a cross, not only a colour");
  assert.ok(no.includes('stroke-dasharray="7 5"'));
  assert.match(svgOf("inequality:entry", [12, 10], "es"), />no califica</);
  assert.match(svgOf("inequality:entry", [12, 12]), /would mark 12 as not qualifying/);
});

test("growth: table rows, the output and the fixed start", () => {
  const m = growth.build("growth:fees", [3, 5, 4]);
  assert.equal(m.value, 17);
  assert.deepEqual(
    m.rows.map((r) => r?.y),
    ["5", "8", "11", "14", "17"],
  );
  assert.deepEqual(
    m.rows.map((r) => r?.ax),
    ["0", "3", "6", "9", "12"],
  );
  assert.equal(m.wrong.total, 32); // (3 + 5) x 4, the fee multiplied
  const long = growth.build("growth:weather", [2, 4, 10]);
  assert.deepEqual(long.xs, [0, 1, 2, 3, null, 9, 10]);
  assert.equal(long.rows[5]?.y, "22");
  assert.equal(long.value, 24);
});

test("growth: the multiplied-fee mistake is shown only when it differs", () => {
  assert.equal(growth.build("growth:table", [3, 0, 4]).wrong, null); // nothing to multiply
  assert.equal(growth.build("growth:fees", [3, 5, 1]).wrong, null); // one item: (3 + 5) x 1 = 3 x 1 + 5
  assert.ok(!svgOf("growth:fees", [3, 5, 1]).includes('class="eq-wrong"'));
  const svg = svgOf("growth:fees", [3, 5, 4]);
  assert.match(svg, /Not \(3 \+ 5\) × 4 = 32\./);
  assert.match(svg, /The 5 is added once\./);
  assert.match(svgOf("growth:fees", [3, 5, 4], "es"), /El 5 se suma una sola vez\./);
});

test("growth: with no start amount the rule has one part and says the graph begins at the origin", () => {
  const svg = svgOf("growth:table", [3, 0, 4]);
  assert.match(svg, /No start amount: the graph begins at \(0, 0\)\./);
  assert.ok(!svg.includes("added once"));
  assert.match(svgOf("growth:table", [3, 2, 4]), /added once/);
});

test("illegal settings are refused the way the lab refuses them", () => {
  assert.throws(() => balance.build("balance:add", [0, 19, 12]), RangeError);
  assert.throws(() => balance.build("balance:add", [13, 19, 12]), RangeError);
  assert.throws(() => balance.build("balance:add", [7, 61, 12]), RangeError);
  assert.throws(() => balance.build("balance:add", [7, 19, 12.3]), RangeError);
  assert.throws(() => balance.build("balance:add", [7, 19, 31]), RangeError);
  assert.throws(() => balance.build("balance:multiply", [7.5, 19, 3]), RangeError);
  assert.throws(() => inequality.build("inequality:entry", [25, 5]), RangeError);
  assert.throws(() => inequality.build("inequality:entry", [5, 31]), RangeError);
  assert.throws(() => growth.build("growth:fees", [9, 5, 4]), RangeError);
  assert.throws(() => growth.build("growth:fees", [3, 13, 4]), RangeError);
  assert.throws(() => growth.build("growth:fees", [3, 5, 0]), RangeError);
  assert.throws(() => balance.build("growth:fees", [3, 5, 4]), RangeError);
});

test("rendering is deterministic and every Spanish picture differs from the English one", () => {
  for (const [key, values] of Object.entries(KEYS)) {
    assert.equal(svgOf(key, values), svgOf(key, values), key);
    assert.notEqual(svgOf(key, values), svgOf(key, values, "es"), key);
    assert.ok(!/NaN|undefined|Infinity/.test(svgOf(key, values, "es", 340)), key);
  }
});

/** Every setting of every control, one at a time from the lab's start values. */
function* settings() {
  for (const [key, start] of Object.entries(KEYS)) {
    const fig = figOf(key);
    for (const [i, c] of fig.controls(key).entries()) {
      for (let v = c.min; v <= c.max; v += c.step)
        yield { key, fig, values: start.map((x, j) => (j === i ? v : x)) };
    }
  }
}
/** True when the drawing contains the dashed "not this" card. @param {string} key @param {string} svg */
const drawsWrongCard = (key, svg) =>
  key.startsWith("balance") ? svg.includes('data-step="x"') : svg.includes('class="eq-wrong"');

test("headline: the number the lesson asks for, read exactly, in both languages", () => {
  for (const { key, fig, values } of settings()) {
    const m = fig.build(key, values);
    const en = fig.headline(m, "en");
    const es = fig.headline(m, "es");
    const v = parse(en.value);
    assert.ok(v, `${key} ${values}: "${en.value}" is not readable`);
    assert.equal(es.value, en.value);
    assert.notEqual(en.label, es.label, `${key}: label not translated`);
    const [a, b] = values;
    if (key === "balance:add") assert.equal(v.toString(), String(b - a), `${key} ${values}`);
    if (key === "balance:multiply") {
      // by substitution, a different route from b / a: a times the solution gives back the right side
      assert.equal(v.mul(parse(String(a))).toString(), String(b), `${key} ${values}`);
    }
    if (key.startsWith("inequality"))
      assert.equal(en.value, String(a), `${key} ${values}: the boundary`);
    if (key.startsWith("growth"))
      assert.equal(en.value, String(evaluate(labModel(key), values).value), `${key} ${values}`);
  }
});

test("wrong: non-null exactly when the dashed card is drawn, never the right answer, one sentence in each language", () => {
  let drawn = 0;
  let hidden = 0;
  for (const { key, fig, values } of settings()) {
    const m = fig.build(key, values);
    const w = fig.wrong(m, "en");
    const card = drawsWrongCard(key, svgOf(key, values));
    assert.equal(w !== null, card, `${key} ${values}: wrong() vs the dashed card`);
    assert.equal(fig.wrong(m, "es") !== null, card, `${key} ${values}: ES agrees`);
    if (!w) {
      hidden++;
      continue;
    }
    drawn++;
    const es = fig.wrong(m, "es");
    assert.ok(parse(w.value), `${key} ${values}: "${w.value}" is not readable`);
    assert.equal(es.value, w.value);
    assert.notEqual(w.value, fig.headline(m, "en").value, `${key} ${values}: wrong equals right`);
    assert.notEqual(w.say, es.say, `${key} ${values}: not translated`);
    assert.ok(/[.]$/.test(w.say) && !/[.].+[.]$/.test(w.say), `${key} ${values}: one sentence`);
  }
  assert.ok(drawn > 0 && hidden > 0, "the sweep covers both the drawn and the hidden case");
});

test("wrong: exact values reached by a different route", () => {
  // balance: the operation lands on the left only, so the right side is untouched and x looks like b
  assert.equal(balance.wrong(balance.build("balance:add", [7, 19, 3]), "en").value, "19");
  assert.equal(balance.wrong(balance.build("balance:multiply", [4, 36, 9]), "en").value, "36");
  assert.match(
    balance.wrong(balance.build("balance:add", [7, 19, 3]), "es").say,
    /Restaste 7 solo del lado izquierdo/,
  );
  assert.equal(balance.wrong(balance.build("balance:multiply", [1, 10, 3]), "en"), null);
  // growth: (a + b) x c
  assert.equal(growth.wrong(growth.build("growth:fees", [3, 5, 4]), "en").value, "32");
  assert.equal(growth.wrong(growth.build("growth:fees", [3, 5, 1]), "en"), null);
  assert.equal(growth.wrong(growth.build("growth:table", [3, 0, 4]), "en"), null);
  // inequality: the nearest whole number that qualifies under the OTHER circle, found by trying the lab's own evaluate()
  for (const [key, symbol] of [
    ["inequality:entry", ">"],
    ["inequality:budget", "<"],
  ]) {
    for (const a of [1, 12, 24]) {
      const model = { kind: "inequality", mode: key.split(":")[1] };
      const ok = (n) => evaluate(model, [a, n], { symbol }).pass;
      const ns = Array.from({ length: 31 }, (_, n) => n).filter(ok);
      const nearest = symbol === ">" ? Math.min(...ns) : Math.max(...ns);
      assert.equal(
        inequality.wrong(inequality.build(key, [a, 5]), "en").value,
        String(nearest),
        `${key} ${a}`,
      );
    }
  }
});

test("headline labels are the student's words for the number, per key", () => {
  assert.equal(
    balance.headline(balance.build("balance:add", [7, 19, 3]), "en").label,
    "Solution x",
  );
  assert.equal(
    balance.headline(balance.build("balance:add", [7, 19, 3]), "es").label,
    "Solución x",
  );
  assert.equal(balance.headline(balance.build("balance:multiply", [7, 36, 3]), "en").value, "36/7");
  assert.equal(
    inequality.headline(inequality.build("inequality:entry", [12, 10]), "es").label,
    "Límite",
  );
  assert.equal(growth.headline(growth.build("growth:fees", [3, 5, 4]), "en").label, "Cost ($)");
  assert.equal(
    growth.headline(growth.build("growth:weather", [2, 4, 3]), "es").label,
    "Litros en el tanque",
  );
});

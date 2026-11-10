// Pure-logic tests for MathSense's exact arithmetic, state and pictures. The oracle is scripts/lib/rational.mjs,
// an independent exact-rational implementation, so a bug in exact.js cannot hide by agreeing with itself.
import assert from "node:assert/strict";
import test from "node:test";
import { Rat, parseAnswerValue } from "../../../scripts/lib/rational.mjs";
import { decimalGrid, fractionBar, numberLine, percentBar } from "./draw.js";
import * as X from "./exact.js";
import { PART_CHOICES, amountAtPosition, deserialize, initialState, partsFor, serialize, setAmount, setCompare, setParts, setPieces, stateFrom, stepAmount } from "./model.js";
import { forms, liveMessage } from "./readouts.js";

const oracle = (q) => new Rat(q.n, q.d);
const same = (q, rat) => X.eq(q, X.make(rat.n, rat.d));

test("arithmetic agrees with the independent oracle on every pair", () => {
  for (let a = 0n; a <= 12n; a += 1n) {
    for (let b = 1n; b <= 12n; b += 1n) {
      for (let c = 0n; c <= 7n; c += 1n) {
        for (let d = 1n; d <= 9n; d += 1n) {
          const x = X.make(a, b);
          const y = X.make(c, d);
          const rx = new Rat(a, b);
          const ry = new Rat(c, d);
          assert.ok(same(X.add(x, y), rx.add(ry)));
          assert.ok(same(X.sub(x, y), rx.sub(ry)));
          assert.ok(same(X.mul(x, y), rx.mul(ry)));
          if (c !== 0n) assert.ok(same(X.div(x, y), rx.div(ry)));
          assert.equal(X.cmp(x, y), rx.sub(ry).n < 0n ? -1 : rx.sub(ry).n > 0n ? 1 : 0);
        }
      }
    }
  }
});

test("typed forms parse to the oracle's value", () => {
  for (const text of ["3/4", "0.75", "75%", "1 3/4", "2.5", "12.5%", "7/4", "0.125", "5", "4/8", ".5"]) {
    const mine = X.parse(text);
    assert.ok(mine.ok, text);
    const rat = parseAnswerValue(text.startsWith(".") ? `0${text}` : text.replace(/^(\d+) (\d+\/\d+)$/, "$1 $2"));
    assert.ok(same(mine.value, rat), `${text}: ${X.fractionText(mine.value)} vs ${rat.n}/${rat.d}`);
  }
  assert.ok(X.eq(X.parse("0,75").value, X.make(3n, 4n)), "decimal comma");
});

test("repeating decimals are exact, and stopped decimals are different numbers", () => {
  const cases = [["0.(3)", 1n, 3n], ["0.8(3)", 5n, 6n], ["0.(45)", 5n, 11n], ["0.(142857)", 1n, 7n], ["0.(6)", 2n, 3n], ["0.1(6)", 1n, 6n], ["0.(9)", 1n, 1n], ["33.(3)%", 1n, 3n], ["1.(3)", 4n, 3n]];
  for (const [text, n, d] of cases) assert.ok(X.eq(X.parse(text).value, X.make(n, d)), text);
  assert.ok(X.eq(X.parse("0.3̅").value, X.make(1n, 3n)), "overline form");
  for (const stopped of ["0.3", "0.33", "0.333", "0.3333333"]) assert.ok(!X.eq(X.parse(stopped).value, X.make(1n, 3n)), stopped);
  // the stopped decimal names its own fraction
  assert.ok(X.eq(X.parse("0.333").value, X.make(333n, 1000n)));
});

test("unreadable input is refused with a reason, never guessed", () => {
  const codes = { "": "empty", abc: "format", "-1": "negative", 6: "range", "1/0": "zero", "0.333...": "ellipsis", "0.3…": "ellipsis", "1.2.3": "format", "5.0001": "range", "1 5/3": "format", "0.1234567890123": "toolong" };
  for (const [text, code] of Object.entries(codes)) assert.deepEqual([X.parse(text).ok, X.parse(text).code], [false, code], JSON.stringify(text));
});

test("decimal and percent text round-trip for every amount up to 5 with a denominator up to 60", () => {
  for (let d = 1n; d <= 60n; d += 1n) {
    for (let n = 0n; n <= 5n * d; n += 1n) {
      const q = X.make(n, d);
      const dec = X.decimalText(q);
      if (!dec.text.includes("…")) assert.ok(X.eq(X.parse(dec.text).value, q), `${n}/${d} -> ${dec.text}`);
      const pct = X.percentText(q);
      if (!pct.text.includes("…")) assert.ok(X.eq(X.parse(pct.text).value, q), `${n}/${d} -> ${pct.text}`);
      const long = X.decimalDigits(q, 400);
      assert.equal(long.cut, false, `${n}/${d} terminates or cycles`);
      // a terminating expansion read back as an integer over a power of ten is the amount (independent of parse)
      if (long.cycle === "") assert.ok(X.eq(X.make(BigInt(long.whole + long.prefix), 10n ** BigInt(long.prefix.length)), q));
    }
  }
  const known = { "1/3": "0.(3)", "1/7": "0.(142857)", "5/8": "0.625", "1/6": "0.1(6)", "7/4": "1.75", "5": "5", "2/3": "0.(6)", "11/12": "0.91(6)" };
  for (const [frac, text] of Object.entries(known)) assert.equal(X.decimalText(X.fromKey(frac.includes("/") ? frac : `${frac}/1`)).text, text, frac);
  assert.equal(X.percentText(X.make(1n, 3n)).text, "33.(3)%");
  assert.equal(X.percentText(X.make(13n, 8n)).text, "162.5%");
});

test("pieces, mixed numbers, benchmarks and rounding", () => {
  assert.equal(X.piecesOf(X.make(3n, 4n), 12), 9n);
  assert.equal(X.piecesOf(X.make(1n, 3n), 12), 4n);
  assert.equal(X.piecesOf(X.make(1n, 3n), 100), null);
  assert.equal(X.mixedText(X.make(17n, 5n)), "3 2/5");
  assert.equal(X.mixedText(X.make(8n, 4n)), "2");
  assert.deepEqual(X.benchmarkOf(X.make(3n, 4n)), { exact: X.make(3n, 4n) });
  assert.equal(X.benchmarkOf(X.make(5n, 9n)).closer, "lo");
  assert.equal(X.benchmarkOf(X.make(3n, 8n)).closer, "middle");
  assert.equal(X.roundedText(X.make(2n, 3n), 2), "0.67");
  assert.equal(X.roundedText(X.make(1n, 3n), 3), "0.333");
});

test("one state drives every representation: all readouts name the same exact amount", () => {
  for (let d = 1n; d <= 24n; d += 1n) {
    for (let n = 0n; n <= 5n * d; n += 1n) {
      const q = X.make(n, d);
      const state = stateFrom({ a: X.key(q) });
      const f = forms(q, state.parts.a);
      assert.ok(X.eq(X.parse(f.fraction).value, q), f.fraction);
      assert.ok(f.decimal.text.includes("…") || X.eq(X.parse(f.decimal.text).value, q), f.decimal.text);
      assert.ok(f.percent.text.includes("…") || X.eq(X.parse(f.percent.text).value, q), f.percent.text);
      assert.ok(f.pieces !== null, `${n}/${d} lands on its own ${state.parts.a}-piece cut`);
      assert.ok(liveMessage(state, "x").includes(f.fraction));
    }
  }
});

test("state edits are exact and bounded", () => {
  let state = initialState();
  assert.equal(X.key(state.a), "3/4");
  let next = stepAmount(state, 1, X.make(1n, 12n), { parts: 12 });
  assert.equal(X.key(next.state.a), "5/6");
  assert.equal(next.state.parts.a, 12);
  next = stepAmount(stateFrom({ a: "0/1" }), -1, X.make(1n, 4n), { parts: 4 });
  assert.equal(X.key(next.state.a), "0/1", "never below 0");
  next = stepAmount(stateFrom({ a: "5/1" }), 1, X.make(1n, 4n), { parts: 4 });
  assert.equal(X.key(next.state.a), "5/1", "never above 5");
  next = stepAmount(stateFrom({ a: "1/3" }), 1, X.make(1n, 100n));
  assert.equal(X.key(next.state.a), "17/50", "1/3 steps up to the next whole hundredth");
  assert.equal(setAmount(state, X.make(11n, 2n)).ok, false);
  assert.equal(setAmount(state, X.make(-1n, 2n)).ok, false);
  next = setPieces(state, 9, 12);
  assert.deepEqual([X.key(next.state.a), next.state.parts.a], ["3/4", 12]);
  assert.equal(setPieces(state, 1.5, 12).ok, false);
  assert.equal(setPieces(state, 1, 101).ok, false);
  assert.equal(setParts(stateFrom({ a: "1/3" }), 12).parts.a, 12, "the cut can change while the amount does not");
  assert.equal(partsFor(X.make(1n, 3n), 12), 12);
  assert.equal(partsFor(X.make(1n, 3n), 4), 3);
  assert.equal(partsFor(X.make(1n, 101n), 4), 100);
  assert.deepEqual(PART_CHOICES.filter((p) => p > 100), []);
  state = setCompare(stateFrom({ a: "2/3", b: "3/4" }), true);
  assert.equal(state.compare, true);
  assert.equal(setCompare(state, false).active, "a");
});

test("pointer positions snap to an exact piece", () => {
  assert.equal(X.key(amountAtPosition(0.5, 1, 4)), "1/2");
  assert.equal(X.key(amountAtPosition(0.3, 1, 10)), "3/10");
  assert.equal(X.key(amountAtPosition(1.4, 2, 5)), "2/1", "clamps to the axis end");
  assert.equal(X.key(amountAtPosition(-3, 2, 5)), "0/1");
});

test("saved state survives a round trip and junk is replaced", () => {
  const state = stateFrom({ a: "7/4", b: "2/3", parts: 4, partsB: 3, compare: true });
  const back = deserialize(JSON.parse(JSON.stringify(serialize(state))));
  assert.equal(X.key(back.a), "7/4");
  assert.equal(back.compare, true);
  for (const junk of [null, 7, "x", { a: "9/1", b: "1/2" }, { a: "1/0", b: "1/2" }, { a: "1/2", b: "x" }]) assert.equal(X.key(deserialize(junk).a), "3/4");
});

const shadedWidth = (svg, cls) => [...svg.matchAll(new RegExp(`class="${cls}"[^>]*width="([\\d.]+)"|width="([\\d.]+)"[^>]*class="${cls}"`, "g"))].map((m) => Number(m[1] ?? m[2]));

test("the pictures shade exactly what the state says", () => {
  // percent bar: shaded width over axis width is value over wholes
  for (const [key, wholes] of [["3/4", 1], ["1/3", 1], ["7/4", 2], ["5/2", 3], ["5/1", 5], ["0/1", 1]]) {
    const q = X.fromKey(key);
    const svg = percentBar(stateFrom({ a: key }));
    const width = shadedWidth(svg, "ms-fill-a")[0] ?? 0;
    assert.ok(Math.abs(width / 348 - X.toNumber(q) / wholes) < 0.01, `percent bar ${key}`);
  }
  // decimal grid: floor(100q) full squares (a partial square for a repeating amount)
  for (const key of ["3/4", "1/3", "7/4", "5/8", "1/1", "0/1"]) {
    const q = X.fromKey(key);
    const svg = decimalGrid(stateFrom({ a: key }));
    const squares = [...svg.matchAll(/class="ms-fill-a"/g)].length;
    const expected = Number(X.floor(X.mul(q, X.make(100n)))) + (X.isWhole(X.mul(q, X.make(100n))) ? 0 : 1);
    assert.equal(squares, expected, `grid ${key}`);
  }
  // fraction bar caption states pieces; number line labels the exact fraction and decimal
  assert.match(fractionBar(stateFrom({ a: "3/4", parts: 12 })), /9 of 12 pieces = 3\/4/);
  assert.match(fractionBar(stateFrom({ a: "1/3", parts: 100 })), /between two lines of the 100-piece cut/);
  assert.match(numberLine(stateFrom({ a: "1/3" })), /A 1\/3 = 0\.\(3\)/);
  const compare = numberLine(stateFrom({ a: "2/3", b: "3/4" }));
  assert.match(compare, /A 2\/3/);
  assert.match(compare, /B 3\/4/);
  assert.match(percentBar(stateFrom({ a: "2/3", b: "3/4" })), /B: 75% of one whole/);
});

// Bio-Resonance Mixer round generators, checked independently of the game's own judge.
// 300 seeds x 4 levels x 4 modes: every round's answer is recomputed here from
// first principles (fraction equality, division, cross-products, a separate unit
// table), the judge must accept that answer and reject corrupted ones, no round
// starts solved from the game's parked controls, and every answer sits exactly on
// its control's range and step.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  COMMON_MAX,
  DIV_MAX,
  DIV_STEP,
  judgeCompare,
  judgeConvert,
  judgeEquiv,
  judgeRate,
  MODES,
  makeCompare,
  makeConvert,
  makeEquiv,
  makeRate,
  modeForRound,
  RATE_MAX,
  RATE_STEP,
  VALVE_MAX,
} from "../../math/games/engines/u3-ratio-mixer/math.js";

// Independent unit table (not imported from the game).
const FACTOR = { ft: ["in", 12], yd: ["ft", 3], m: ["cm", 100], kg: ["g", 1000], gal: ["qt", 4] };
const onGrid = (v, step, min, max) =>
  v >= min - 1e-9 &&
  v <= max + 1e-9 &&
  Math.abs((v - min) / step - Math.round((v - min) / step)) < 1e-9;

const seen = new Set();
for (let r = 1; r <= 4; r++) seen.add(modeForRound(r));
assert.equal(seen.size, MODES.length, "every mode appears in rounds 1-4");

let n = 0;
const variants = new Set();
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 37 + level);

    // EQUIVALENT: B/A must equal b/a as fractions.
    const e = makeEquiv(level, next);
    variants.add(e.variant);
    assert.equal(e.A * e.b, e.B * e.a, `equiv ${JSON.stringify(e)} not equivalent`);
    assert.equal(e.A + e.B, e.total);
    assert.ok(e.A > 0 && e.B > 0 && e.A <= VALVE_MAX && e.B <= VALVE_MAX, "fits the valves");
    assert.ok(e.a !== e.b, "never 1:1");
    assert.equal(judgeEquiv(e, e.A, e.B), "ok");
    for (const d of [-1, 1])
      assert.notEqual(judgeEquiv(e, e.A, e.B + d), "ok", "accepts B off by one");
    if (e.variant === "total") {
      assert.notEqual(judgeEquiv(e, e.A + 1, e.B - 1), "ok", "accepts a wrong split of the total");
      assert.notEqual(judgeEquiv(e, 0, 0), "ok", "starts solved (total)");
      assert.equal(judgeEquiv(e, 2 * e.A, 2 * e.B), "overTotal");
    } else {
      assert.notEqual(judgeEquiv(e, e.A, 0), "ok", "starts solved (scale)");
      // A miss names a direction (or the additive misconception, which the game maps to one).
      assert.ok(["tooAmber", "additive"].includes(judgeEquiv(e, e.A, e.B + 1)));
      assert.ok(["tooTeal", "additive"].includes(judgeEquiv(e, e.A, e.B - 1)));
      assert.equal(
        judgeEquiv(e, e.A, e.A + e.b - e.a),
        e.A + e.b - e.a === e.B ? "ok" : "additive",
      );
    }

    // UNIT RATE: rate = q / c, on the quarter grid.
    const r = makeRate(level, next);
    const rate = r.q / r.c;
    assert.ok(Number.isInteger(r.q) && r.q > 0, "whole units in the log");
    assert.equal(rate, r.rate, "rate is q / c");
    assert.ok(onGrid(rate, RATE_STEP, 0, RATE_MAX), `rate ${rate} not on the dial`);
    if (level >= 2) assert.ok(!Number.isInteger(rate), "level 2+ rates are fractional");
    assert.equal(judgeRate(r, rate), "ok");
    assert.equal(judgeRate(r, rate + RATE_STEP), "rateHigh");
    assert.notEqual(judgeRate(r, rate - RATE_STEP), "ok");
    assert.notEqual(judgeRate(r, 0), "ok", "rate starts solved");

    // COMPARE: stronger in A = larger share of A, a / (a + b).
    const c = makeCompare(level, next);
    const share1 = c.a1 / (c.a1 + c.b1);
    const share2 = c.a2 / (c.a2 + c.b2);
    assert.notEqual(c.a1 * (c.a2 + c.b2), c.a2 * (c.a1 + c.b1), "mixers are equivalent");
    const stronger = share1 > share2 ? 1 : 2;
    assert.equal(c.stronger, stronger, `stronger mixer wrong: ${JSON.stringify(c)}`);
    let common = 0;
    for (let v = 1; v <= COMMON_MAX; v++) {
      if (v % c.a1 === 0 && v % c.a2 === 0) {
        common = v;
        break;
      }
    }
    assert.ok(common > 1 && common === c.common, "smallest common A on the dial");
    assert.equal(judgeCompare(c, stronger, common), "ok");
    assert.equal(judgeCompare(c, stronger, 2 * common <= COMMON_MAX ? 2 * common : common), "ok");
    assert.equal(judgeCompare(c, 3 - stronger, common), "wrongPick");
    assert.notEqual(judgeCompare(c, 0, 1), "ok", "compare starts solved");
    assert.notEqual(judgeCompare(c, stronger, 1), "ok", "1 unit of A is not common");
    for (let v = 1; v <= COMMON_MAX; v++)
      if (v % c.a1 !== 0 || v % c.a2 !== 0) assert.notEqual(judgeCompare(c, stronger, v), "ok");

    // CONVERT: recompute from the independent table.
    const k = makeConvert(level, next);
    const [small, f] = FACTOR[k.big];
    const ans = k.dir === "mul" ? k.n * f : k.n / f;
    assert.equal(k.dir === "mul" ? k.to : k.from, small);
    assert.ok(Math.abs(ans - k.ans) < 1e-9, `convert ${JSON.stringify(k)} answer ${ans}`);
    assert.ok(onGrid(ans, k.step, 0, k.max), `answer ${ans} off the output dial`);
    if (k.dir === "div") assert.ok(k.step === DIV_STEP && k.max === DIV_MAX);
    assert.ok(Number.isInteger(k.n) || k.dir === "mul", "input in whole small units");
    assert.ok(Math.round(ans / k.step) <= 120, "keyboard plan stays short");
    assert.ok(
      Math.abs(Math.round(k.n / k.group) * k.group - k.n) < 1e-9,
      "Tier 2 groups divide the input",
    );
    assert.equal(judgeConvert(k, ans), "ok");
    assert.notEqual(judgeConvert(k, ans + k.step), "ok");
    assert.notEqual(judgeConvert(k, ans - k.step), "ok");
    assert.notEqual(judgeConvert(k, 0), "ok", "convert starts solved");
    if (level === 1) assert.equal(k.dir, "mul");
    if (level === 2) assert.equal(k.dir, "div");
    n += 4;
  }
}
assert.ok(variants.has("scale") && variants.has("total"), "both equivalent variants occur");
console.log(
  `ok u3-ratio-mixer: ${n} rounds checked independently (4 modes x 4 levels x 300 seeds)`,
);

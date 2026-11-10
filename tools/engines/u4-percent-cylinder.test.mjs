// Calibration Cylinder round generators, checked independently of the game's own judge.
// 300 seeds x 4 levels x 3 modes: each target is recomputed here with exact
// integer arithmetic (num·1000/den, p·N/100, 100·P/p), its three text forms are
// re-derived and cross-checked, the judge must accept the true setting and reject
// corrupted ones, no round starts solved from the game's parked controls, and every
// answer fits its wheel / valve / dial range exactly.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  CAP_MAX,
  CAP_MIN,
  formText,
  judgeCalibrate,
  judgePart,
  judgeWhole,
  MODES,
  makeCalibrate,
  makePart,
  makeWhole,
  modeForRound,
} from "../../math/games/engines/u4-percent-cylinder/math.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

const seen = new Set();
for (let r = 1; r <= 4; r++) seen.add(modeForRound(r));
assert.equal(seen.size, MODES.length, "every mode appears in rounds 1-4");

let n = 0;
const kinds = new Set();
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 41 + level);

    // CALIBRATE
    const c = makeCalibrate(level, next);
    kinds.add(`cal-${c.form}`);
    assert.equal((c.num * 1000) % c.den, 0, "terminating target");
    const T = (c.num * 1000) / c.den;
    assert.equal(T, c.T);
    assert.ok(T > 0 && T < 1000, "inside the cylinder");
    if (level < 4) assert.equal(T % 10, 0, "levels 1-3 land on hundredths (no thousandths wheel)");
    else assert.notEqual(T % 10, 0, "level 4 needs the thousandths wheel");
    assert.equal(c.thou, level === 4);
    // Three forms, re-derived independently: fraction, decimal, percent all equal T.
    const g = gcd(T, 1000);
    assert.equal(formText(T, "fraction"), `${T / g}/${1000 / g}`);
    assert.equal(Number(formText(T, "decimal")) * 1000, T);
    assert.ok(formText(T, "percent").endsWith("%") && !formText(T, "percent").includes(" "));
    assert.ok(Math.abs(Number(formText(T, "percent").slice(0, -1)) * 10 - T) < 1e-9);
    const t = Math.floor(T / 100);
    const h = Math.floor(T / 10) % 10;
    const th = T % 10;
    assert.ok(t <= 9 && h <= 9 && th <= 9, "fits the wheels");
    assert.equal(judgeCalibrate(c, t * 100 + h * 10 + th), "ok");
    assert.notEqual(judgeCalibrate(c, 0), "ok", "calibrate starts solved");
    for (const d of [-10, 10, -1, 1])
      if (T + d > 0 && T + d < 1000) assert.notEqual(judgeCalibrate(c, T + d), "ok");
    if (c.form === "percent" && T % 10 === 0) assert.equal(judgeCalibrate(c, T / 10), "shift");

    // PART
    const p = makePart(level, next);
    kinds.add(`part-${p.variant}`);
    const exact = (p.p * p.N) / 100;
    assert.equal(p.exact100, p.p * p.N);
    assert.ok(p.N >= 20 && p.N <= 120, "capacity on the plate range");
    if (p.variant === "exact") {
      assert.ok(Number.isInteger(exact), `exact part ${exact} not whole`);
      assert.equal(p.part, exact);
      assert.equal(judgePart(p, exact), "ok");
      assert.notEqual(judgePart(p, exact + 1), "ok");
      assert.notEqual(judgePart(p, exact - 1), "ok");
    } else {
      assert.ok([10, 20, 25, 50, 75].includes(p.p), "estimates use benchmark percents");
      assert.ok(!Number.isInteger(exact), "estimate rounds are not exact");
      for (let v = 0; v <= p.N; v++) {
        const want = Math.abs(v - exact) <= 1;
        assert.equal(judgePart(p, v) === "ok", want, `estimate judge wrong at ${v} for ${exact}`);
      }
    }
    assert.ok(Math.round(exact) <= p.N, "answer fits the valve");
    assert.notEqual(judgePart(p, 0), "ok", "part starts solved");
    assert.ok(level >= 2 || p.variant === "exact", "level 1 is exact");

    // WHOLE
    const w = makeWhole(level, next);
    const C = (100 * w.P) / w.p;
    assert.ok(Number.isInteger(w.P) && w.P > 0, "whole-number part");
    assert.equal(C, w.C, "capacity is 100·P/p");
    assert.ok(C >= 20 && C <= CAP_MAX && C > CAP_MIN, "capacity fits the dial");
    assert.equal(judgeWhole(w, C), "ok");
    assert.equal(judgeWhole(w, C + 1), "high");
    assert.notEqual(judgeWhole(w, C - 1), "ok");
    assert.notEqual(judgeWhole(w, CAP_MIN), "ok", "whole starts solved");
    assert.equal(judgeWhole(w, w.P), "partAsWhole");
    n += 3;
  }
}
for (const k of ["cal-fraction", "cal-percent", "cal-decimal", "part-exact", "part-estimate"])
  assert.ok(kinds.has(k), `round kind ${k} never generated`);
console.log(
  `ok u4-percent-cylinder: ${n} rounds checked independently (3 modes x 4 levels x 300 seeds)`,
);

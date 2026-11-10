// Pulse Matrix round generators, checked independently of the game's own judge.
// 300 seeds x 4 levels x 3 modes: data fits the shelf, every target statistic
// recomputed here from scratch (brute-force balance sweep, sorted-list quartiles)
// lands on its control grid, the judge accepts it and rejects neighbours, and no
// round starts solved from its parked controls.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  CLAMP_PARK,
  judgeBalance,
  judgeClamp,
  judgeTension,
  makeRound,
  modeForRound,
  parkFulcrum,
} from "../../math/games/engines/u2-pulse-matrix/math.js";

/** Independent median: average of the middle one or two of a fresh sort. */
function med(list) {
  const s = [...list].sort((a, b) => a - b);
  const m = Math.floor((s.length - 1) / 2);
  return (s[m] + s[s.length - 1 - m]) / 2;
}

/** Independent quartiles: drop the middle value(s) for odd n by index, then medians. */
function fiveNumber(values) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  const lower = s.filter((_, i) => i < Math.floor(n / 2));
  const upper = s.filter((_, i) => i >= Math.ceil(n / 2));
  return { q1: med(lower), med: med(s), q3: med(upper) };
}

/** Balance point by sweeping fulcrum positions and finding zero net torque. */
function balancePoint(values) {
  for (let f2 = 0; f2 <= 24; f2++) {
    let torque = 0;
    for (const v of values) torque += 2 * v - f2;
    if (torque === 0) return f2 / 2;
  }
  return null;
}

const counts = { balance: 0, tension: 0, clamp: 0, skewed: 0 };
assert.deepEqual([1, 2, 3, 4].map(modeForRound), ["balance", "tension", "clamp", "balance"]);
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    for (const mode of ["balance", "tension", "clamp"]) {
      const next = rng(seed * 97 + level * 7 + mode.length);
      const r = makeRound(mode, level, next);
      const tag = `seed ${seed} L${level} ${mode} [${r.values}]`;
      assert.ok(r.values.length >= 7 && r.values.length <= 11, `${tag}: 7-11 points`);
      assert.equal(r.n, r.values.length);
      const freq = new Map();
      for (const v of r.values) {
        assert.ok(Number.isInteger(v) && v >= 0 && v <= 12, `${tag}: value on the shelf`);
        freq.set(v, (freq.get(v) || 0) + 1);
      }
      assert.ok(Math.max(...freq.values()) <= 5, `${tag}: column too tall`);

      if (mode === "balance") {
        const bp = balancePoint(r.values);
        assert.notEqual(bp, null, `${tag}: balance point off the half grid`);
        assert.equal(r.mean, bp);
        assert.equal(judgeBalance(r, bp), "ok", `${tag}: judge rejects the balance point`);
        assert.equal(judgeBalance(r, bp - 0.5), bp - 0.5 === med(r.values) ? "median" : "low");
        assert.equal(judgeBalance(r, bp + 0.5), bp + 0.5 === med(r.values) ? "median" : "high");
        const m = med(r.values);
        if (m !== bp) {
          assert.equal(judgeBalance(r, m), "median", `${tag}: median trap not named`);
          counts.skewed++;
        }
        if (level >= 2) assert.ok(Math.abs(m - bp) >= 1, `${tag}: not skewed at level ${level}`);
        const park = parkFulcrum(r.mean);
        assert.notEqual(judgeBalance(r, park), "ok", `${tag}: starts balanced`);
        counts.balance++;
      } else if (mode === "tension") {
        const mean = r.values.reduce((a, b) => a + b, 0) / r.n;
        assert.ok(Number.isInteger(mean), `${tag}: mean anchor not whole`);
        const mad = r.values.reduce((a, v) => a + Math.abs(v - mean), 0) / r.n;
        assert.ok(Number.isInteger(mad * 4), `${tag}: MAD ${mad} off the quarter grid`);
        assert.ok(mad >= 0.5 && mad <= 6, `${tag}: MAD ${mad} outside the dial`);
        assert.equal(r.mad, mad);
        assert.equal(judgeTension(r, mad), "ok", `${tag}: judge rejects the MAD`);
        assert.notEqual(judgeTension(r, mad + 0.25), "ok");
        assert.notEqual(judgeTension(r, mad - 0.25), "ok");
        assert.equal(judgeTension(r, mad + 0.25), mad + 0.25 === r.stretch ? "sum" : "high");
        if (r.stretch <= 6 && r.stretch !== mad) assert.equal(judgeTension(r, r.stretch), "sum");
        assert.notEqual(judgeTension(r, 0), "ok", `${tag}: dial parked at 0 is the answer`);
        counts.tension++;
      } else {
        const f = fiveNumber(r.values);
        for (const k of ["q1", "med", "q3"]) {
          assert.equal(r[k], f[k], `${tag}: ${k}`);
          assert.ok(Number.isInteger(f[k] * 2), `${tag}: ${k} off the half grid`);
        }
        assert.equal(
          judgeClamp(r, f.q1, f.med, f.q3).verdict,
          "ok",
          `${tag}: judge rejects true clamps`,
        );
        assert.equal(judgeClamp(r, f.q1, f.med + 0.5, f.q3).verdict, "medHigh");
        assert.equal(judgeClamp(r, f.q1, f.med - 0.5, f.q3).verdict, "medLow");
        assert.equal(judgeClamp(r, f.q1 + 0.5, f.med, f.q3).verdict, "q1High");
        assert.equal(judgeClamp(r, f.q1, f.med, f.q3 - 0.5).verdict, "q3Low");
        assert.notEqual(
          judgeClamp(r, CLAMP_PARK.q1, CLAMP_PARK.med, CLAMP_PARK.q3).verdict,
          "ok",
          `${tag}: parked clamps already solve it`,
        );
        counts.clamp++;
      }
    }
  }
}
assert.ok(counts.skewed > 600, `too few skewed balance rounds (${counts.skewed})`);
// The inclusive-quartile misconception is named for odd counts: 1,2,3,4,5,6,7 has
// Q1 2 (exclusive) and 2.5 (inclusive).
const odd = { values: [1, 2, 3, 4, 5, 6, 7], n: 7, q1: 2, med: 4, q3: 6 };
assert.deepEqual(judgeClamp(odd, 2.5, 4, 6), { verdict: "q1High", included: true });
console.log(
  `ok u2-pulse-matrix: ${counts.balance} balance (${counts.skewed} with mean != median), ${counts.tension} tension, ${counts.clamp} clamp rounds checked independently`,
);

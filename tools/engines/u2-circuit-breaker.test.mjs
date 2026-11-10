// Circuit Breaker round generators, checked independently of the game's judge.
// 300 seeds x 4 levels: align answers recomputed from decimal strings (BigInt
// over a common scale), wheels fit 0-9 per place, the judge accepts the true
// wheels and names a corrupted place; divide rounds are recomputed by long
// division, drained by the standard chunks AND by random valid partial-quotient
// paths, and refused on overdraw; no round starts solved.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  breakRod,
  bundleTen,
  digitAt,
  divert,
  divideState,
  hText,
  judgeAlign,
  judgeDivide,
  lowestPlace,
  makeAlign,
  makeDivide,
  modeForRound,
  PLACES,
  scaleTen,
  standardChunks,
  trayOf,
} from "../../math/games/engines/u2-circuit-breaker/math.js";

/** Independent decimal arithmetic: text → BigInt thousandths. */
const toMilli = (s) => {
  const [w, f = ""] = s.split(".");
  return BigInt(w) * 1000n + BigInt((f + "000").slice(0, 3));
};

assert.deepEqual([1, 2, 3, 4].map(modeForRound), ["align", "divide", "align", "divide"]);
let aligns = 0;
let divides = 0;
let paths = 0;
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 53 + level);
    // ---- align ----
    const r = makeAlign(level, next);
    const tag = `seed ${seed} L${level} ${hText(r.a)} ${r.op} ${hText(r.b)}`;
    const a = toMilli(hText(r.a));
    const b = toMilli(hText(r.b));
    const truth = r.op === "+" ? a + b : a - b;
    assert.ok(truth > 0n && truth < 10000000n, `${tag}: result off the grid`);
    assert.equal(BigInt(r.result) * 10n, truth, `${tag}: result`);
    const wheels = [...String(r.result).padStart(6, "0")].map(Number);
    assert.ok(wheels.length === 6, `${tag}: wheels`);
    assert.equal(judgeAlign(r, 0, wheels).verdict, "ok", `${tag}: true wheels rejected`);
    assert.notEqual(r.park, 0, `${tag}: conduit parked aligned`);
    assert.equal(judgeAlign(r, r.park, wheels).verdict, "misaligned");
    assert.equal(judgeAlign(r, 0, [0, 0, 0, 0, 0, 0]).verdict, "low", `${tag}: untouched wheels`);
    for (let p = 0; p < 6; p++) {
      const bad = [...wheels];
      bad[p] = (bad[p] + 1) % 10;
      const j = judgeAlign(r, 0, bad);
      assert.equal(j.place, p, `${tag}: wrong place named`);
      assert.equal(j.verdict, bad[p] > wheels[p] ? "high" : "low");
    }
    if (level >= 2) assert.ok(r.aDp !== r.bDp || r.park === 1, `${tag}: park`);
    // Hand trays regroup to the answer.
    const tray = trayOf(r.a);
    if (r.op === "+") {
      const tb = trayOf(r.b);
      for (let p = 0; p < 6; p++) tray[p] += tb[p];
      while (bundleTen(tray) >= 0);
    } else {
      const need = trayOf(r.b);
      while (breakRod(tray, need) >= 0);
      for (let p = 0; p < 6; p++) {
        assert.ok(tray[p] >= need[p], `${tag}: trays still short`);
        tray[p] -= need[p];
      }
    }
    let trayValue = 0;
    for (let p = 0; p < 6; p++) trayValue += tray[p] * PLACES[p];
    assert.equal(trayValue, r.result, `${tag}: trays lost value`);
    if (r.op === "+") assert.deepEqual(tray, wheels, `${tag}: bundled trays are not the digits`);
    aligns++;

    // ---- divide ----
    const d = makeDivide(level, next);
    const dt = `seed ${seed} L${level} ${hText(d.dividend)} ÷ ${hText(d.divisor)}`;
    // Long division with BigInt thousandths.
    const D = toMilli(hText(d.dividend));
    const dv = toMilli(hText(d.divisor));
    if (d.decimal) {
      assert.equal((D * 100n) % dv, 0n, `${dt}: not exact to hundredths`);
      assert.equal(BigInt(d.q), (D * 100n) / dv, `${dt}: quotient`);
    } else {
      assert.equal(BigInt(d.q / 100), D / dv, `${dt}: quotient`);
      assert.equal(BigInt(d.r / 100) * 1000n, D % dv, `${dt}: remainder`);
    }
    if (level <= 2) assert.ok(!d.decimal && d.divisor % 100 === 0);
    if (level === 3) assert.ok(d.decimal && d.divisor % 100 === 0 && d.dividend % 100 !== 0);
    if (level === 4) assert.ok(d.divisor % 100 !== 0, `${dt}: L4 divisor should be a decimal`);
    let s = divideState(d);
    assert.notEqual(judgeDivide(d, s), "ok", `${dt}: starts solved`);
    if (level === 4) {
      assert.equal(divert(s, 1, 3).error, "notWhole");
      s = scaleTen(s);
      assert.equal(scaleTen(s), null, `${dt}: one scale makes the divisor whole`);
    }
    // Standard path.
    let st = s;
    for (const c of standardChunks(d)) {
      assert.ok(c.digit >= 1 && c.digit <= 9 && c.place <= lowestPlace(d));
      st = divert(st, c.digit, c.place).state;
    }
    assert.equal(judgeDivide(d, st), "ok", `${dt}: standard chunks do not finish`);
    assert.equal(st.bank, d.q, `${dt}: bank != quotient`);
    assert.equal(st.remaining, d.r * (st.divisor / d.divisor), `${dt}: remainder`);
    // Random valid paths: any chunk that fits, smallest places allowed.
    for (let k = 0; k < 3; k++) {
      let ps = s;
      for (let guard = 0; guard < 400 && judgeDivide(d, ps) !== "ok"; guard++) {
        const place = Math.floor(next() * (lowestPlace(d) + 1));
        const digit = 1 + Math.floor(next() * 9);
        const res = divert(ps, digit, place);
        if (res.error) {
          assert.equal(res.error, "overdraw");
          assert.ok(res.peel > ps.remaining);
        } else ps = res.state;
      }
      if (judgeDivide(d, ps) === "ok") {
        assert.equal(ps.bank, d.q, `${dt}: a different path banked another quotient`);
        paths++;
      }
    }
    // Overdraw is refused and leaves the state alone.
    const big = divert(s, 9, 0);
    if (big.error) assert.equal(big.error, "overdraw");
    divides++;
  }
}
assert.ok(paths > 2000, `too few random paths finished (${paths})`);
assert.equal(digitAt(123456, 0), 1);
console.log(
  `ok u2-circuit-breaker: ${aligns} align, ${divides} divide rounds, ${paths} alternate partial-quotient paths checked independently`,
);

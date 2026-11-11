// Circuit Breaker round generators, checked independently of the game's judge.
// 300 seeds x 4 levels: align answers recomputed from decimal strings (BigInt
// over a common scale), wheels fit 0-9 per place, the judge accepts the true
// wheels and names a corrupted place; divide rounds are recomputed by long
// division, drained by the standard chunks AND by random valid partial-quotient
// paths, and refused on overdraw; level-4 hundredths divisors need two scalings;
// multiply rounds are recomputed from the written factors (BigInt), the judge
// accepts the product and every trailing-zero equivalent by value and rejects
// corrupted counters, bar positions and digits; no round starts solved.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  breakRod,
  bundleTen,
  digitAt,
  divert,
  divideState,
  estimateRange,
  fixedText,
  hText,
  judgeAlign,
  judgeDivide,
  judgeMultiply,
  lowestPlace,
  MAX_COUNT,
  makeAlign,
  makeDivide,
  makeMultiply,
  modeForRound,
  PLACES,
  REG,
  scaleTen,
  standardChunks,
  trailingZeros,
  trayOf,
  trimText,
} from "../../math/games/engines/u2-circuit-breaker/math.js";

/** Independent decimal arithmetic: text → BigInt thousandths. */
const toMilli = (s) => {
  const [w, f = ""] = s.split(".");
  return BigInt(w) * 1000n + BigInt((f + "000").slice(0, 3));
};

assert.deepEqual([1, 2, 3, 4].map(modeForRound), ["align", "divide", "multiply", "align"]);
/** Independent: decimal text → [BigInt digits, places]. */
const parse = (t) => {
  const [w, f = ""] = t.split(".");
  return [BigInt(w + f), f.length];
};
const P10 = (n) => 10n ** BigInt(n);
let multiplies = 0;
let zeroRounds = 0;
let twoScale = 0;
let oneScale = 0;
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
      // Independent: how many ×10 the divisor's written decimals need.
      const need = (hText(d.divisor).split(".")[1] || "").length;
      assert.ok(need === 1 || need === 2, `${dt}: L4 divisor places`);
      for (let k = 0; k < need; k++) {
        if (k) assert.equal(divert(s, 1, 3).error, "notWhole", `${dt}: still a decimal`);
        s = scaleTen(s);
        assert.ok(s, `${dt}: scale refused`);
        assert.ok(s.remaining < 1000000, `${dt}: scaled charge off the grid`);
      }
      assert.equal(scaleTen(s), null, `${dt}: ${need} scale(s) make the divisor whole`);
      if (need === 2) twoScale++;
      else oneScale++;
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

    // ---- multiply ----
    const m = makeMultiply(level, next);
    const ta = fixedText(m.a.w, m.a.dp);
    const tb = fixedText(m.b.w, m.b.dp);
    const mt = `seed ${seed} L${level} ${ta} × ${tb}`;
    const [ia, pa] = parse(ta);
    const [ib, pb] = parse(tb);
    assert.equal(pa, m.a.dp, `${mt}: written places A`);
    assert.equal(pb, m.b.dp, `${mt}: written places B`);
    assert.equal(BigInt(m.whole), ia * ib, `${mt}: whole-number product`);
    assert.equal(m.places, pa + pb, `${mt}: total places`);
    // Exact value check: product × 10^(pa+pb) == written a × written b.
    assert.equal(BigInt(m.whole) * P10(8 - m.places), ia * ib * P10(8 - pa - pb));
    assert.ok(pa <= MAX_COUNT && pb <= MAX_COUNT, `${mt}: counter range`);
    assert.ok(m.places <= REG - 1 && m.whole < 10 ** (REG - 1), `${mt}: register range`);
    assert.ok(ia % P10(pa) !== 0n || ib % P10(pb) !== 0n, `${mt}: both factors whole`);
    if (level === 1) assert.ok(pa === 1 && pb === 0);
    if (level === 2) assert.ok(pa === 1 && pb === 1);
    const tz = trailingZeros(m.a.w, m.a.dp) + trailingZeros(m.b.w, m.b.dp);
    const endsZero = (t) => t.includes(".") && t.endsWith("0");
    assert.equal(tz > 0, endsZero(ta) || endsZero(tb), `${mt}: trailing zeros`);
    // Never starts solved; truth accepted.
    assert.notEqual(judgeMultiply(m, m.park, m.park, m.park).verdict, "ok", `${mt}: starts solved`);
    assert.equal(judgeMultiply(m, pa, pb, m.places).verdict, "ok", `${mt}: truth rejected`);
    // Trailing-zero equivalents (56.700 = 56.70 = 56.7) and an added zero pass by value.
    let mant = BigInt(m.whole);
    for (let k = 0; k <= m.places; k++) {
      if (k && mant % 10n !== 0n) break;
      if (k) mant /= 10n;
      assert.equal(
        judgeMultiply(m, pa, pb, m.places - k, Number(mant)).verdict,
        "ok",
        `${mt}: -${k} zeros`,
      );
    }
    if (m.places < REG - 1)
      assert.equal(judgeMultiply(m, pa, pb, m.places + 1, m.whole * 10).verdict, "ok");
    assert.equal(trimText(m.whole, m.places), String(Number(fixedText(m.whole, m.places))));
    // Corruptions: bar off by one each way, digits off, counters off.
    if (m.places > 0)
      assert.equal(judgeMultiply(m, pa, pb, m.places - 1).verdict, "overload", `${mt}: bar right`);
    assert.equal(judgeMultiply(m, pa, pb, m.places + 1).verdict, "brownout", `${mt}: bar left`);
    assert.notEqual(judgeMultiply(m, pa, pb, m.places, m.whole + 1).verdict, "ok");
    for (const [ca, cb] of [
      [pa + 1, pb],
      [pa, pb + 1],
      [pa - 1, pb],
      [pa, pb - 1],
    ]) {
      if (ca < 0 || cb < 0) continue;
      const j = judgeMultiply(m, ca, cb, m.places);
      assert.ok(j.verdict.startsWith("count"), `${mt}: counters ${ca},${cb} accepted`);
    }
    // Misconception shapes.
    const hi = Math.max(pa, pb);
    if (hi < m.places)
      assert.equal(judgeMultiply(m, pa, pb, hi).cause, "aligned", `${mt}: aligned like adding`);
    if (endsZero(tb)) assert.equal(judgeMultiply(m, pa, pb - 1, m.places).verdict, "countZero");
    if (endsZero(ta)) assert.equal(judgeMultiply(m, pa - 1, pb, m.places).verdict, "countZero");
    // Estimate range brackets the true product (independent float check is safe here).
    const est = estimateRange(m);
    const v = Number(ia * ib) / 10 ** m.places;
    assert.ok(est.lo < v && v < est.hi, `${mt}: estimate ${est.lo}..${est.hi} misses ${v}`);
    if (tz) zeroRounds++;
    multiplies++;
  }
}
assert.ok(zeroRounds > 100, `too few trailing-zero rounds (${zeroRounds})`);
assert.ok(twoScale > 50 && oneScale > 50, `L4 scale mix ${oneScale}/${twoScale}`);
assert.ok(paths > 2000, `too few random paths finished (${paths})`);
assert.equal(digitAt(123456, 0), 1);
console.log(
  `ok u2-circuit-breaker: ${aligns} align, ${divides} divide (${twoScale} need ×100), ${multiplies} multiply rounds, ${paths} alternate partial-quotient paths checked independently`,
);

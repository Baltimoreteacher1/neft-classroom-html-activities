// Kinetic Slicer round generators, checked independently of the game's judge.
// 300 seeds x 4 levels x 3 modes: the quotient is recomputed by integer
// long division on a common denominator, the judge must accept the true
// answer (and an equivalent unreduced form) and reject corrupted ones, the
// parked dials never solve a round, and every answer fits its dial.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  AP_MAX,
  DEN_MAX,
  judgeAperture,
  judgePredict,
  MODES,
  makeRound,
  modeFor,
  NUM_MAX,
  RIBBON_MAX,
  WHOLE_MAX,
} from "../../math/games/engines/u6-kinetic-slicer/math.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
let checked = 0;
const seen = new Set();
const tags = new Set();

for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    for (const mode of MODES) {
      const next = rng(seed * 97 + level * 7 + mode.length);
      const r = makeRound(mode, level, next);
      const ctx = `seed ${seed} L${level} ${mode}: ${JSON.stringify(r)}`;
      const [A, B, C, D] = [r.ribbon.n, r.ribbon.d, r.ap.n, r.ap.d];
      assert.ok(A > 0 && B > 0 && C > 0 && D > 0, ctx);
      assert.ok(A / B <= RIBBON_MAX, `ribbon fits the ruler: ${ctx}`);

      if (mode === "aperture") {
        // Independent: q blocks of C/D rebuild the ribbon exactly.
        assert.equal(r.blocks * C * B, A * D, `blocks x aperture != ribbon: ${ctx}`);
        assert.ok(C <= AP_MAX && D <= AP_MAX && gcd(C, D) === 1, ctx);
        assert.equal(judgeAperture(r, C, D), "ok", `rejects the true aperture: ${ctx}`);
        if (2 * D <= AP_MAX && 2 * C <= AP_MAX)
          assert.equal(judgeAperture(r, 2 * C, 2 * D), "ok", `rejects equivalent: ${ctx}`);
        assert.notEqual(judgeAperture(r, 1, 1), "ok", `parked aperture 1/1 solves: ${ctx}`);
        // Independent direction: a wider aperture makes fewer blocks.
        const wider = judgeAperture(r, C + 1, D);
        assert.ok(wider === "wide" || wider === "inverted", `wider not flagged: ${ctx}`);
        if (D < AP_MAX && C * (D + 1) !== C * D) {
          const v = judgeAperture(r, C, D + 1);
          assert.ok(v === "narrow" || v === "inverted", `narrower not flagged: ${ctx}`);
        }
        // q ÷ ribbon (the reciprocal of the right share) is named.
        const invN = r.blocks * B;
        const g = gcd(invN, A);
        if (invN / g <= AP_MAX && A / g <= AP_MAX && invN * D !== C * A)
          assert.equal(judgeAperture(r, invN / g, A / g), "inverted", ctx);
        tags.add("aperture");
      } else {
        // Independent: long division on the common denominator B·D.
        const top = A * D; // ribbon in 1/(BD) units
        const each = C * B; // aperture in 1/(BD) units
        const w = Math.floor(top / each);
        const remN = top % each;
        const g = gcd(remN, each);
        const n = remN / g;
        const d = remN ? each / g : 1;
        assert.ok(w <= WHOLE_MAX && n <= NUM_MAX && d <= DEN_MAX, `answer off the dials: ${ctx}`);
        assert.ok(w > 0 || n > 0, ctx);
        assert.equal(judgePredict(r, w, n, d), "ok", `rejects the true quotient: ${ctx}`);
        if (n && 2 * d <= DEN_MAX)
          assert.equal(judgePredict(r, w, 2 * n, 2 * d), "ok", `rejects equivalent: ${ctx}`);
        assert.notEqual(judgePredict(r, 0, 0, 1), "ok", `parked dials solve: ${ctx}`);
        assert.equal(
          judgePredict(r, w + 1, n, d),
          w + 1 + n / d === (A * C) / (B * D) || (B * C) / (A * D) === w + 1 + n / d
            ? "inverted"
            : "high",
          ctx,
        );
        if (w > 0) {
          const v = judgePredict(r, w - 1, n, d);
          assert.ok(
            v === "low" || v === "inverted" || v === "remainderWhole",
            `low not flagged: ${ctx}`,
          );
        }
        // Leftover read in ruler units: scrap = (top - w·each)/(BD) of a whole.
        if (remN) {
          const sg = gcd(remN, B * D);
          const sn = remN / sg;
          const sd = (B * D) / sg;
          if (sn !== n || sd !== d) {
            if (sd <= DEN_MAX && sn < sd)
              assert.equal(judgePredict(r, w, sn, sd), "remainderWhole", ctx);
            tags.add("remainderWhole");
          }
        }
        // Multiplying instead of dividing is named when it lands on the dials.
        const pn = A * C;
        const pd = B * D;
        const pw = Math.floor(pn / pd);
        const pg = gcd(pn % pd, pd);
        if (pn * B * C !== A * D * pd && pw <= WHOLE_MAX && pd / pg <= DEN_MAX) {
          const v = judgePredict(r, pw, (pn % pd) / pg, pn % pd ? pd / pg : 1);
          assert.ok(
            v === "inverted" || v === "remainderWhole",
            `product not named: ${ctx} -> ${v}`,
          );
        }
        assert.equal(judgePredict(r, w, d, d), "improper", ctx);
        if (mode === "mixed") assert.ok(B > 1 && A > B, `mixed ribbon is a mixed number: ${ctx}`);
        if (level === 1 && mode === "predict") assert.equal(B, 1, "level 1 divides a whole number");
        tags.add(mode);
      }
      seen.add(`${mode}:${A}/${B}:${C}/${D}`);
      checked++;
    }
  }
}
// Every mode appears in machines 1-3, so the 4-round audit drives all of them.
assert.deepEqual([1, 2, 3].map(modeFor).sort(), [...MODES].sort());
assert.ok(seen.size > 300, `round variety too low: ${seen.size}`);
for (const t of ["predict", "mixed", "aperture", "remainderWhole"])
  assert.ok(tags.has(t), `never exercised ${t}`);
console.log(
  `ok u6-kinetic-slicer: ${checked} rounds (${seen.size} distinct) checked independently`,
);

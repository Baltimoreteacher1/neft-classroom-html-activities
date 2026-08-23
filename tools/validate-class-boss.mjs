#!/usr/bin/env node
/* =============================================================================
 * validate-class-boss.mjs — gate for the Class Boss raid.
 * -----------------------------------------------------------------------------
 *   node tools/validate-class-boss.mjs
 *
 * Asserts, with no dependencies and no network:
 *   1. Every misconception tag in data/misconception-labels.json has >= 4
 *      question templates, and the bank invents no tag the repo does not know.
 *   2. Every generated question's stated correct answer is REALLY correct. The
 *      expectations below are written from the word problem, not copied from the
 *      bank, and they only ever see the template's `values` — so a typo in the
 *      bank's arithmetic cannot agree with a typo here by construction.
 *   3. Every question's tag distractor is EXACTLY the error the tag names (the
 *      un-divided total for rate-not-per-one, the flipped pair for
 *      ratio-inverted, and so on) — not merely "a wrong number".
 *   4. No timer anywhere in the raid. Timed pressure is banned platform-wide.
 *   5. No file under curriculum/class-boss/ contains the string "ESOL".
 *
 * Exits non-zero on the first failing class of check, printing every failure.
 * ========================================================================== */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const BOSS_DIR = join(ROOT, "curriculum", "class-boss");
const MIN_TEMPLATES = 4;
// Every ISO week of a year, plus attempt salts: enough draws to surface a
// template whose numbers only collide occasionally.
const SEEDS = [];
for (let week = 1; week <= 53; week += 1) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    SEEDS.push(`2026-W${String(week).padStart(2, "0")}#${attempt}`);
  }
}

const failures = [];
const fail = (msg) => failures.push(msg);

/* --- independent math helpers (deliberately NOT imported from the bank) --- */
function g(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}
const F = (n, d) => {
  const s = d < 0 ? -1 : 1;
  const N = s * n;
  const D = s * d;
  const k = g(N, D);
  return D / k === 1 ? String(N / k) : `${N / k}/${D / k}`;
};
const R = (a, b) => `${a / g(a, b)} : ${b / g(a, b)}`;
const rd = (x, p = 4) => Math.round(x * 10 ** p) / 10 ** p;
const sum = (v) => v.reduce((s, x) => s + x, 0);

/* ---------------------------------------------------------------------------
 * Expected [correct, distractor] per template id, recomputed from `values`.
 * Read each line against the prompt in questions.js, not against its code.
 * ------------------------------------------------------------------------- */

/** Prime factors of n WITH repeats, by trial division. Independent of the bank. */
function primeFactorCount(n) {
  let x = Number(n);
  let count = 0;
  for (let p = 2; p * p <= x; p += 1) {
    while (x % p === 0) {
      x /= p;
      count += 1;
    }
  }
  if (x > 1) count += 1;
  return count;
}

/**
 * Given the two candidate questions, decide BY RULE which is statistical: a
 * statistical question asks about EACH member of a group, so its answers vary.
 * Returns [statistical, fixed] — the reverse of what the bank claims fails.
 */
function statisticalPair(options) {
  const list = Array.isArray(options) ? options.map(String) : [];
  const varying = list.find((q) => /\beach\b/i.test(q));
  const fixed = list.find((q) => q !== varying);
  return [varying, fixed];
}

const EXPECT = {
  // rate-not-per-one — distractor is the total, never divided by the count.
  "rate-apples": (v) => [v.total / v.n, v.total],
  "rate-drive": (v) => [v.d / v.h, v.d],
  "rate-notebooks": (v) => [v.total / v.n, v.total],
  "rate-printer": (v) => [v.p / v.m, v.p],

  // equation-not-inverse-operation — distractor applies the SAME operation again
  // instead of its inverse, which is the error the tag names.
  "inv-mul": (v) => [v.x, v.a * v.x * v.a],
  "inv-div": (v) => [v.x, v.x / v.a / v.a],
  "inv-add": (v) => [v.x, v.x + v.a + v.a],
  "inv-sub": (v) => [v.x, v.x - v.a - v.a],

  // equation-answered-with-given-number — distractor is the number printed in
  // the equation rather than the unknown.
  "given-add": (v) => [v.x, v.a],
  "given-div": (v) => [v.x, v.a],
  "given-mul": (v) => [v.x, v.a],
  "given-sub": (v) => [v.x, v.a],

  // inequality-direction-flipped — same boundary, symbol turned around.
  "dir-add": (v) => [`x > ${v.b + v.a}`, `x < ${v.b + v.a}`],
  "dir-sub": (v) => [`x < ${v.b - v.a}`, `x > ${v.b - v.a}`],
  "dir-ge": (v) => [`x ≥ ${v.b + v.a}`, `x ≤ ${v.b + v.a}`],
  "dir-le": (v) => [`x ≤ ${v.b - v.a}`, `x ≥ ${v.b - v.a}`],

  // inequality-boundary-inclusion — same direction, boundary in/out swapped.
  "inc-atleast": (v) => [`x ≥ ${v.b}`, `x > ${v.b}`],
  "inc-atmost": (v) => [`x ≤ ${v.b}`, `x < ${v.b}`],
  "inc-morethan": (v) => [`x > ${v.b}`, `x ≥ ${v.b}`],
  "inc-fewerthan": (v) => [`x < ${v.b}`, `x ≤ ${v.b}`],

  // inequality-graph-direction — same circle, shading on the wrong side.
  "shade-gt": (v) => [`open circle at ${v.b}, shade right`, `open circle at ${v.b}, shade left`],
  "shade-lt": (v) => [`open circle at ${v.b}, shade left`, `open circle at ${v.b}, shade right`],
  "shade-ge": (v) => [
    `filled circle at ${v.b}, shade right`,
    `filled circle at ${v.b}, shade left`,
  ],
  "shade-le": (v) => [
    `filled circle at ${v.b}, shade left`,
    `filled circle at ${v.b}, shade right`,
  ],

  // stat-range-for-iqr — distractor is max − min, the full range.
  "iqr-plot": (v) => [v.q3 - v.q1, v.max - v.min],
  "iqr-quartiles": (v) => [v.q3 - v.q1, v.max - v.min],
  "iqr-scores": (v) => [v.q3 - v.q1, v.max - v.min],
  "iqr-times": (v) => [v.q3 - v.q1, v.max - v.min],

  // stat-center-vs-spread — distractor is a measure of the other kind.
  "cs-spread": (v) => [v.pick ? "range" : "interquartile range", "median"],
  "cs-center": (v) => [v.pick ? "median" : "mean", "range"],
  "cs-mode": () => ["mode", "range"],
  "cs-iqr": () => ["interquartile range", "median"],

  // stat-mean-skewed-by-outlier — distractor is the mean, the measure the
  // outlier drags.
  "out-times": () => ["median", "mean"],
  "out-prices": () => ["median", "mean"],
  "out-scores": () => ["median", "mean"],
  "out-attendance": () => ["median", "mean"],

  // stat-frequency-vs-value — distractor is a number off the value axis.
  "freq-bar": (v) => [v.h, v.lo + 9],
  "freq-tallest": (v) => [v.h, v.lo],
  "freq-players": (v) => [v.h, v.lo + 4],
  "freq-minutes": (v) => [v.h, v.lo + 9],

  // coord-xy-swapped — distractor is the pair with its coordinates traded.
  // Written out here rather than importing questions.js's point(), so this
  // stays an INDEPENDENT statement of the answer: importing the helper under
  // test would let one bad definition satisfy both sides.
  "xy-plot": (v) => [`(${v.x}, ${v.y})`, `(${v.y}, ${v.x})`],
  "xy-read": (v) => [`(${v.x}, ${v.y})`, `(${v.y}, ${v.x})`],
  "xy-map": (v) => [`(${v.x}, ${v.y})`, `(${v.y}, ${v.x})`],
  "xy-negative": (v) => [`(${v.x}, ${v.y})`, `(${v.y}, ${v.x})`],

  // ratio-inverted — distractor is the same ratio written back to front.
  "ratio-marbles": (v) => [R(v.first, v.second), R(v.second, v.first)],
  "ratio-pets": (v) => [R(v.first, v.second), R(v.second, v.first)],
  "ratio-recipe": (v) => [R(v.first, v.second), R(v.second, v.first)],
  "ratio-class": (v) => [R(v.first, v.second), R(v.second, v.first)],

  // ratio-scaled-additively — the second quantity is grown by the SAME amount
  // the first one grew by (a·k − a), instead of by the same FACTOR (×k).
  "rsa-recipe": (v) => [v.b * v.k, v.b + (v.a * v.k - v.a)],
  "rsa-paint": (v) => [v.b * v.k, v.b + (v.a * v.k - v.a)],
  "rsa-gears": (v) => [v.b * v.k, v.b + (v.a * v.k - v.a)],
  "rsa-map": (v) => [v.b * v.k, v.b + (v.a * v.k - v.a)],

  // ratio-as-difference — distractor collapses the pair into ONE number: the
  // gap between them for the first two, their total for the last two.
  "rad-marbles": (v) => [R(v.first, v.second), String(v.second - v.first)],
  "rad-team": (v) => [R(v.first, v.second), String(v.second - v.first)],
  "rad-fruit": (v) => [R(v.first, v.second), String(v.first + v.second)],
  "rad-books": (v) => [R(v.first, v.second), String(v.first + v.second)],

  // stat-mean-vs-median — the prompt asks for the median (the 3rd of 5 sorted
  // values); the distractor is the mean of the same five. Both recomputed here
  // from the offsets written into each prompt, not read off the bank.
  "mvm-scores": (v) => [v.base + 3, sum([0, 1, 3, 4, 12].map((o) => v.base + o)) / 5],
  "mvm-times": (v) => [v.base + 4, sum([0, 2, 4, 6, 18].map((o) => v.base + o)) / 5],
  "mvm-points": (v) => [v.base + 2, sum([0, 1, 2, 3, 19].map((o) => v.base + o)) / 5],
  "mvm-temps": (v) => [v.base + 5, sum([0, 3, 5, 7, 20].map((o) => v.base + o)) / 5],

  // stat-histogram-bin-misread — each distractor is a specific misreading:
  // sweeping in the next bin, dropping the shortest bar, answering with the
  // interval's endpoint instead of the bar height, and stopping at one bin.
  "hbm-bin-count": (v) => [v.f2, v.f2 + v.f3],
  "hbm-total": (v) => [v.f1 + v.f2 + v.f3, v.f1 + v.f2],
  "hbm-tallest": (v) => [v.f2, 29],
  "hbm-two-bins": (v) => [v.f1 + v.f2, v.f1],

  // percent-scale-off-by-100 — distractor is the answer 100 times too big.
  "pct-plain": (v) => [(v.n * v.p) / 100, v.n * v.p],
  "pct-tax": (v) => [(v.n * v.p) / 100, v.n * v.p],
  "pct-bus": (v) => [(v.n * v.p) / 100, v.n * v.p],
  "pct-miles": (v) => [(v.n * v.p) / 100, v.n * v.p],

  // percent-used-as-whole-number — distractor adds/subtracts the percent itself.
  "pctwn-points": (v) => [v.n + (v.n * v.p) / 100, v.n + v.p],
  "pctwn-price": (v) => [v.n + (v.n * v.p) / 100, v.n + v.p],
  "pctwn-cars": (v) => [v.n - (v.n * v.p) / 100, v.n - v.p],
  "pctwn-books": (v) => [v.n + (v.n * v.p) / 100, v.n + v.p],

  // decimal-place-value — distractor keeps the digits, moves the point.
  "dec-tenths-product": (v) => [rd((v.a / 10) * (v.b / 10)), rd((v.a * v.b) / 10)],
  "dec-tenth-whole": (v) => [rd((v.a / 10) * v.b), v.a * v.b],
  "dec-div-100": (v) => [rd(v.n / 100), rd(v.n / 10)],
  "dec-times-10": (v) => [rd((v.w + v.f / 10) * 10), rd((v.w + v.f / 10) * 100)],

  // exponent-as-multiplication — distractor multiplies base by exponent.
  "exp-power": (v) => [Math.pow(v.b, v.e), v.b * v.e],
  "exp-cube": (v) => [Math.pow(v.s, 3), v.s * 3],
  "exp-square": (v) => [Math.pow(v.b, 2), v.b * 2],
  "exp-ten": (v) => [Math.pow(10, v.e), 10 * v.e],

  // fraction-added-denominators — distractor adds tops and bottoms.
  "fadd-unit": (v) => [F(1 * v.d + 1 * v.b, v.b * v.d), F(1 + 1, v.b + v.d)],
  "fadd-general": (v) => [F(v.a * v.d + v.c * v.b, v.b * v.d), F(v.a + v.c, v.b + v.d)],
  "fadd-pizza": (v) => [F(v.a * v.d + v.c * v.b, v.b * v.d), F(v.a + v.c, v.b + v.d)],
  "fadd-walk": (v) => [F(v.a * v.d + v.c * v.b, v.b * v.d), F(v.a + v.c, v.b + v.d)],

  // fraction-no-reciprocal — distractor multiplies across without flipping.
  "fdiv-plain": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],
  "fdiv-cups": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],
  "fdiv-ribbon": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],
  "fdiv-paint": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],

  // fraction-straight-across-division — distractor divides tops and bottoms
  // straight across in the direction that comes out whole (c÷a over d÷b).
  "fsa-plain": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],
  "fsa-juice": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],
  "fsa-wood": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],
  "fsa-trail": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],

  // measure-area-perimeter-swap — distractor is the other measure entirely.
  "tri-sail": (v) => [(v.b * v.h) / 2, v.b * v.h],
  "tri-garden": (v) => [(v.b * v.h) / 2, v.b * v.h],
  "tri-ramp": (v) => [(v.b * v.h) / 2, v.b * v.h],
  "tri-flag": (v) => [(v.b * v.h) / 2, v.b * v.h],
  // geom-surface-area-as-volume — the wrong answer is the VOLUME, which is a
  // correct computation of the wrong quantity. Written out independently here
  // (2(lw + lh + wh)) rather than copied from the bank, which is the point of
  // the double entry: a typo in the bank's formula has to survive being
  // re-derived from the geometry to pass.
  "sa-gift": (v) => [2 * (v.l * v.w + v.l * v.h + v.w * v.h), v.l * v.w * v.h],
  "sa-crate": (v) => [2 * (v.l * v.w + v.l * v.h + v.w * v.h), v.l * v.w * v.h],
  "sa-cube": (v) => [6 * v.s * v.s, v.s * v.s * v.s],
  "sa-net": (v) => [2 * (v.l * v.w + v.l * v.h + v.w * v.h), v.l * v.w * v.h],
  "vol-box": (v) => [v.l * v.w * v.h, v.l + v.w + v.h],
  "vol-tank": (v) => [v.l * v.w * v.h, v.l + v.w + v.h],
  "vol-locker": (v) => [v.l * v.w * v.h, v.l + v.w + v.h],
  "vol-cube": (v) => [v.s * v.s * v.s, 3 * v.s],
  "dist-sum": (v) => [v.a * (v.b + v.c), v.a * v.b + v.c],
  "dist-tickets": (v) => [v.a * (v.b + v.c), v.a * v.b + v.c],
  "dist-garden": (v) => [v.a * (v.b + v.c), v.a * v.b + v.c],
  "dist-diff": (v) => [v.a * (v.b - v.c), v.a * v.b - v.c],
  "ap-area": (v) => [v.l * v.w, 2 * v.l + 2 * v.w],
  "ap-perimeter": (v) => [2 * v.l + 2 * v.w, v.l * v.w],
  "ap-square": (v) => [v.s * v.s, 4 * v.s],
  "ap-carpet": (v) => [v.l * v.w, 2 * v.l + 2 * v.w],

  // factors-multiples-confused — a factor DIVIDES n; a multiple is n counted up.
  // Re-derived from n and d rather than copied: a factor must satisfy n % f === 0,
  // and the tag's error offers something n divides INTO instead.
  "fm-factor-of": (v) => [v.n / (v.n / v.d), v.n * 2],
  "fm-multiple-of": (v) => [v.n * v.k, 1],
  "fm-largest-factor": (v) => [v.n / 2, v.n * 2],
  "fm-smallest-multiple": (v) => [v.n * 2, Math.max(2, Math.floor(v.n / 2))],

  // property-order-vs-grouping — derived from the ARITY of the identity, not
  // from the template's own label: a two-number identity (x∘y = y∘x) can only be
  // commutative, and a three-number one with the same left-to-right order can
  // only be associative. A template that mislabels itself fails here.
  "prop-add-order": (v) =>
    v.c === undefined
      ? ["Commutative Property", "Associative Property"]
      : ["Associative Property", "Commutative Property"],
  "prop-mult-grouping": (v) =>
    v.c === undefined
      ? ["Commutative Property", "Associative Property"]
      : ["Associative Property", "Commutative Property"],
  "prop-add-grouping": (v) =>
    v.c === undefined
      ? ["Commutative Property", "Associative Property"]
      : ["Associative Property", "Commutative Property"],
  "prop-mult-order": (v) =>
    v.c === undefined
      ? ["Commutative Property", "Associative Property"]
      : ["Associative Property", "Commutative Property"],

  // factorization-stopped-early — the count of prime factors WITH repeats is
  // recomputed here by trial division, so a hand-typed count in the bank cannot
  // pass unless the arithmetic agrees. The error stops at a two-factor split.
  "pf-count-12": (v) => [primeFactorCount(v.n), 2],
  "pf-count-18": (v) => [primeFactorCount(v.n), 2],
  "pf-count-20": (v) => [primeFactorCount(v.n), 2],
  "pf-count-36": (v) => [primeFactorCount(v.n), 2],

  // stat-question-no-variability — the validator picks the statistical question
  // BY RULE (the one asking about EACH member of a group, so answers vary),
  // never by reading which one the template called correct.
  "sq-heights": (v) => statisticalPair(v.options),
  "sq-minutes": (v) => statisticalPair(v.options),
  "sq-shoes": (v) => statisticalPair(v.options),
  "sq-pets": (v) => statisticalPair(v.options),

  // ratio-compared-without-common-basis — per-ONE is recomputed by division;
  // the error reports the TOTAL instead of the unit amount.
  "cb-apples": (v) => [Number((v.costA / v.nA).toFixed(2)), v.costA],
  "cb-pencils": (v) => [Number((v.cost / v.n).toFixed(2)), v.cost],
  "cb-miles": (v) => [v.miles / v.gal, v.miles],
  "cb-pages": (v) => [v.pages / v.mins, v.pages],

  // op-added-instead-of-multiplied
  "mul-boxes": (v) => [v.a * v.b, v.a + v.b],
  "mul-rows": (v) => [v.a * v.b, v.a + v.b],
  "mul-tickets": (v) => [v.a * v.b, v.a + v.b],
  "mul-batches": (v) => [v.a * v.b, v.a + v.b],

  // op-divided-instead-of-multiplied
  "muldiv-bags": (v) => [v.a * v.b, v.a / v.b],
  "muldiv-pages": (v) => [v.a * v.b, v.a / v.b],
  "muldiv-stickers": (v) => [v.a * v.b, v.a / v.b],
  "muldiv-laps": (v) => [v.a * v.b, v.a / v.b],

  // op-multiplied-instead-of-added
  "add-collect": (v) => [v.a + v.b, v.a * v.b],
  "add-scores": (v) => [v.a + v.b, v.a * v.b],
  "add-lengths": (v) => [v.a + v.b, v.a * v.b],
  "add-money": (v) => [v.a + v.b, v.a * v.b],

  // op-multiplied-instead-of-divided
  "div-share": (v) => [v.a / v.b, v.a * v.b],
  "div-rows": (v) => [v.a / v.b, v.a * v.b],
  "div-packs": (v) => [v.a / v.b, v.a * v.b],
  "div-time": (v) => [v.a / v.b, v.a * v.b],

  // op-reversed-division — distractor divides the other way round.
  "revdiv-share": (v) => [rd(v.a / v.b), rd(v.b / v.a)],
  "revdiv-cost": (v) => [rd(v.a / v.b), rd(v.b / v.a)],
  "revdiv-teams": (v) => [rd(v.a / v.b), rd(v.b / v.a)],
  "revdiv-minutes": (v) => [rd(v.a / v.b), rd(v.b / v.a)],

  // op-reversed-subtraction — distractor subtracts the other way round.
  "revsub-height": (v) => [v.a - v.b, v.b - v.a],
  "revsub-money": (v) => [v.a - v.b, v.b - v.a],
  "revsub-points": (v) => [v.a - v.b, v.b - v.a],
  "revsub-distance": (v) => [v.a - v.b, v.b - v.a],

  // order-of-operations-left-to-right — distractor evaluates strictly L-to-R.
  "ooo-add-mult": (v) => [v.a + v.b * v.c, (v.a + v.b) * v.c],
  "ooo-sub-mult": (v) => [v.a - v.b * v.c, (v.a - v.b) * v.c],
  "ooo-add-div": (v) => [v.a + v.b / v.c, (v.a + v.b) / v.c],
  "ooo-two-products": (v) => [v.a * v.b + v.c * v.d, (v.a * v.b + v.c) * v.d],

  // sign-dropped — distractor is the right size with the minus sign lost.
  "sign-temp": (v) => [v.a - v.b, v.b - v.a],
  "sign-sub": (v) => [-v.a + v.b, v.a - v.b],
  "sign-account": (v) => [-v.a - v.b, v.a + v.b],
  "sign-product": (v) => [-1 * v.a * v.b, v.a * v.b],

  // stat-summed-instead-of-averaged — distractor is the untouched total.
  "mean-scores": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
  "mean-minutes": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
  "mean-points": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
  "mean-temps": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
};

const same = (a, b) =>
  typeof a === "number" && typeof b === "number" ? rd(a, 6) === rd(b, 6) : String(a) === String(b);

/* --- run ----------------------------------------------------------------- */
const bank = await import(pathToFileURL(join(BOSS_DIR, "questions.js")).href);
const { QUESTION_BANK, BOSS_TAGS, buildQuestion } = bank;

const labels = JSON.parse(readFileSync(join(ROOT, "data", "misconception-labels.json"), "utf8"));
const dataTags = Object.keys(labels.tags).sort();

// 1. tag coverage
for (const tag of dataTags) {
  const templates = QUESTION_BANK[tag];
  if (!templates) {
    fail(`tag "${tag}" from data/misconception-labels.json has no questions in the bank`);
    continue;
  }
  if (templates.length < MIN_TEMPLATES) {
    fail(`tag "${tag}" has ${templates.length} templates, needs >= ${MIN_TEMPLATES}`);
  }
}
for (const tag of Object.keys(QUESTION_BANK)) {
  if (!dataTags.includes(tag)) fail(`bank invents tag "${tag}" that the repo vocabulary lacks`);
}
if (BOSS_TAGS.slice().sort().join("|") !== dataTags.join("|")) {
  fail("BOSS_TAGS does not match the tag list in data/misconception-labels.json");
}

// 2 + 3. per-question math
let questionsChecked = 0;
for (const tag of Object.keys(QUESTION_BANK)) {
  const templates = QUESTION_BANK[tag] || [];
  for (let i = 0; i < templates.length; i += 1) {
    const id = templates[i].id;
    const expect = EXPECT[id];
    if (!expect) {
      fail(`template "${id}" (${tag}) has no independent expectation in the validator`);
      continue;
    }
    for (const seed of SEEDS) {
      const q = buildQuestion(tag, i, seed);
      questionsChecked += 1;
      const where = `${tag}/${id}@${seed}`;

      const [wantCorrect, wantDistractor] = expect(q.values);
      if (!same(q.correct, wantCorrect)) {
        fail(`${where}: correct answer is ${q.correct}, independent check says ${wantCorrect}`);
      }
      if (!same(q.distractor, wantDistractor)) {
        fail(
          `${where}: distractor is ${q.distractor}, but the "${tag}" error produces ${wantDistractor}`,
        );
      }
      if (same(q.correct, q.distractor)) {
        fail(`${where}: the tag error yields the correct answer, so nothing is being taught`);
      }

      const asText = q.choices.map(String);
      if (q.choices.length !== 4) fail(`${where}: expected 4 choices, got ${q.choices.length}`);
      if (new Set(asText).size !== q.choices.length) fail(`${where}: duplicate choices`);
      if (!asText.includes(String(q.correct))) fail(`${where}: correct answer is not offered`);
      if (!asText.includes(String(q.distractor))) fail(`${where}: tag distractor is not offered`);
      for (const c of q.choices) {
        if (typeof c === "number" && !Number.isFinite(c)) fail(`${where}: non-finite choice ${c}`);
      }

      if (!q.prompt || !q.prompt.en || !q.prompt.es) fail(`${where}: prompt missing en or es`);
      else if (q.prompt.en === q.prompt.es) fail(`${where}: Spanish prompt is the English prompt`);
      else if (/\b(What is|How many|Evaluate|Write the|There are)\b/.test(q.prompt.es)) {
        fail(`${where}: Spanish prompt still contains untranslated English`);
      }

      const again = buildQuestion(tag, i, seed);
      if (JSON.stringify(again) !== JSON.stringify(q)) {
        fail(`${where}: not reproducible — two builds from one seed differ`);
      }

      const text = `${q.prompt.en} ${q.prompt.es}`;
      if (/\btimer\b|countdown|seconds left|time'?s up|cronómetro|cuenta regresiva/i.test(text)) {
        fail(`${where}: question text mentions a timer`);
      }
    }
  }
}

// 4 + 5. file-level bans
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const bossFiles = walk(BOSS_DIR);
for (const file of bossFiles) {
  const rel = file.replace(`${ROOT}/`, "");
  const src = readFileSync(file, "utf8");
  if (src.includes("ESOL")) fail(`${rel}: contains the banned string "ESOL"`);
  if (/countdown|secondsLeft|timeLeft|timeLimit|time'?s up|cuenta regresiva/i.test(src)) {
    fail(`${rel}: looks like it counts time down — timed pressure is banned`);
  }
  if (extname(file) === ".js" && /questions\.js$/.test(file)) {
    if (/setTimeout|setInterval|requestAnimationFrame|Date\.now|performance\.now/.test(src)) {
      fail(`${rel}: question bank must not touch the clock`);
    }
  }
}

/* --- report -------------------------------------------------------------- */
if (failures.length) {
  console.error("Class Boss validation FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`${failures.length} problem(s).`);
  process.exit(1);
}

const perTag = dataTags.map((t) => QUESTION_BANK[t].length);
console.log(
  `Class Boss OK — ${dataTags.length} tags, ${bank.bankSize()} templates ` +
    `(min ${Math.min(...perTag)}/tag), ${questionsChecked} generated questions verified ` +
    `against independent math, ${bossFiles.length} files clean (no timers, no "ESOL").`,
);

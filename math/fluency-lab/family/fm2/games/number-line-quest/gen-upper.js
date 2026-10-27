// PLACE generators for grades 6 to 8: integers and rationals with negatives, opposites and absolute value as distance,
// hops expressed as sums, distance between points, roots and scientific notation. Radicals are placed by exact bracketing:
// the round stores the radicand and index, never a decimal stand-in. @fm2 FM-012 FM-052 FM-055
import { add, cmp, frac, mul, neg, sub } from "../../rational.js";
import { int, pick } from "../../rng.js";
import { unitWord, WORD } from "./copy.js";
import { rootText, sciText, showNum } from "./format.js";
import { absF, iroot } from "./geometry.js";
import { buildPlace, F, labelsBy } from "./place-round.js";

const trap = (key, v, extra = {}) => ({ key, x: v, ...extra });
const nonZero = (rng, lo, hi) => {
  let v = 0;
  while (v === 0) v = int(rng, lo, hi);
  return v;
};
const sideWord = (negative) => (negative ? WORD.left : WORD.right);
const MODE_PICK = ["dec", "mixed", "frac"];

export function g6Integers(rng, level) {
  const spec = [
    { r: 10, unit: 1, labelBy: 5, tick: F(1), mode: () => "int" },
    { r: 6, unit: 2, labelBy: 2, tick: F(1, 2), mode: () => pick(rng, ["dec", "mixed"]) },
    { r: 4, unit: 4, labelBy: 1, tick: F(1, 4), mode: () => pick(rng, MODE_PICK) },
  ][level - 1];
  const { r, unit } = spec;
  let k = 0;
  while (k % unit === 0 && level > 1) k = int(rng, -r * unit + 1, r * unit - 1);
  if (level === 1) k = nonZero(rng, -r + 1, r - 1);
  const mode = spec.mode();
  const t = F(k, unit);
  const toward = F(k > 0 ? k - 1 : k + 1, unit);
  return buildPlace({
    rng,
    skill: "g6-integers-rationals",
    family: "signed",
    level,
    line: { min: F(-r), max: F(r), ticks: spec.tick, labels: labelsBy(-r, r, spec.labelBy) },
    mode,
    step: F(1, unit),
    target: t,
    detail: { negative: k < 0 },
    traps: [trap("sign-flip", neg(t)), trap("counted-zero", toward)],
    promptKey: "to",
    vars: { v: showNum(t, mode) },
  });
}

export function g6Opposite(rng, level) {
  const unit = [1, 2, 4][level - 1];
  const r = [10, 8, 4][level - 1];
  const mode = level === 1 ? "int" : level === 2 ? "dec" : pick(rng, ["mixed", "frac"]);
  let k = 0;
  while (k === 0 || (level > 1 && k % unit === 0)) k = int(rng, -r * unit + 1, r * unit - 1);
  const v = F(k, unit);
  const absolute = level > 1 && pick(rng, [true, false]);
  const common = {
    rng,
    skill: "g6-opposite-absolute",
    level,
    line: {
      min: F(-r),
      max: F(r),
      ticks: level === 3 ? F(1, 4) : F(1),
      labels: labelsBy(-r, r, level === 1 ? 5 : 2),
    },
    mode,
    step: F(1, unit),
  };
  if (!absolute) {
    return buildPlace({
      ...common,
      family: "opposite",
      target: neg(v),
      detail: { negative: k < 0 },
      traps: [trap("same-number", v)],
      promptKey: "opposite",
      vars: { v: showNum(v, mode) },
    });
  }
  return buildPlace({
    ...common,
    family: "absolute",
    target: v,
    detail: { negative: k < 0 },
    traps: [trap("sign-flip", neg(v))],
    promptKey: "absolute",
    vars: { d: showNum(absF(v), mode), u: unitWord(showNum(absF(v), mode)), side: k < 0 ? WORD.leftSide : WORD.rightSide },
  });
}

const HOP_UNITS = [
  { r: 20, unit: 1, mode: "int", labelBy: 5, tick: F(1) },
  { r: 10, unit: 2, mode: "dec", labelBy: 5, tick: F(1) },
  { r: 6, unit: 4, mode: "frac", labelBy: 2, tick: F(1, 2) },
];

export function g7HopPlace(rng, level) {
  const { r, unit, mode, labelBy, tick } = HOP_UNITS[level - 1];
  const rangeK = Math.floor((r * unit) / 2);
  const show = (v) => showNum(v, mode);
  const form = level === 1 ? "hopSide" : pick(rng, ["hopSide", "addSub"]);
  for (let tries = 0; tries < 200; tries += 1) {
    const s = F(int(rng, -rangeK, rangeK), unit);
    const size = F(int(rng, 1, level === 1 ? 8 : 3 * unit), unit);
    const negativeOperand = level === 3 && pick(rng, [true, false]);
    const operand = negativeOperand ? neg(size) : size;
    const subtract = pick(rng, [true, false]);
    const right = pick(rng, [true, false]);
    const t =
      form === "hopSide"
        ? right
          ? add(s, size)
          : sub(s, size)
        : subtract
          ? sub(s, operand)
          : add(s, operand);
    if (cmp(absF(t), F(r)) > 0 || cmp(absF(s), F(r)) > 0) continue;
    const mirror = sub(mul(s, frac(2)), t);
    const common = {
      rng,
      skill: "g7-hop-place",
      level,
      line: { min: F(-r), max: F(r), ticks: tick, labels: labelsBy(-r, r, labelBy) },
      mode,
      step: F(1, unit),
      target: t,
      start: undefined,
    };
    const traps = [trap("wrong-direction", mirror), trap("distance-as-position", size)];
    if (form === "hopSide") {
      return buildPlace({
        ...common,
        family: "hopplace",
        detail: { s: show(s), size: show(size), right, form },
        traps,
        promptKey: "hopSide",
        vars: { s: show(s), d: show(size), u: unitWord(show(size)), side: right ? WORD.right : WORD.left },
      });
    }
    return buildPlace({
      ...common,
      family: "hopplace",
      detail: {
        s: show(s),
        size: show(size),
        right: subtract ? negativeOperand : !negativeOperand,
        form,
      },
      traps,
      promptKey: "addSub",
      vars: { s: show(s), op: subtract ? WORD.subtract : WORD.add, v: show(operand) },
    });
  }
  throw new RangeError("g7 hop-place: no round found");
}

export function g7Distance(rng, level) {
  const { r, unit, mode } = [
    { r: 10, unit: 1, mode: "int" },
    { r: 8, unit: 2, mode: "dec" },
    { r: 5, unit: 4, mode: "frac" },
  ][level - 1];
  const show = (v) => showNum(v, mode);
  for (let tries = 0; tries < 200; tries += 1) {
    const b = F(
      level === 1 ? int(rng, 1, r - 1) : int(rng, -r * unit + 2, r * unit - 2),
      level === 1 ? 1 : unit,
    );
    const d = F(int(rng, 1, level === 1 ? r - 2 : 3 * unit), unit);
    const right = pick(rng, [true, false]);
    const t = right ? add(b, d) : sub(b, d);
    const inside = cmp(absF(t), F(r)) <= 0;
    const noCross = level > 1 || t.n >= 0;
    if (!inside || !noCross) continue;
    const other = right ? sub(b, d) : add(b, d);
    return buildPlace({
      rng,
      skill: "g7-distance-between",
      family: "distance",
      level,
      line: {
        min: F(-r),
        max: F(r),
        ticks: level === 3 ? F(1, 2) : F(1),
        labels: labelsBy(-r, r, level === 1 ? 5 : 2),
      },
      mode,
      step: F(1, unit),
      target: t,
      marks: [{ v: b, text: "B", shape: "ring" }],
      detail: { b: show(b), d: show(d), right },
      traps: [trap("distance-as-position", d), trap("wrong-direction", other)],
      promptKey: "dist",
      vars: { b: show(b), d: show(d), u: unitWord(show(d)), side: right ? WORD.rightSide : WORD.leftSide },
    });
  }
  throw new RangeError("g7 distance: no round found");
}

const isPower = (n, index) => iroot(n, index) ** index === n;

export function g8Roots(rng, level, index) {
  const skill = index === 2 ? "g8-square-roots" : "g8-cube-roots";
  const cfg =
    index === 2
      ? [
          { L: 8, max: 49, tol: F(1, 2), step: F(1, 10) },
          { L: 9, max: 80, tol: F(1, 10), step: F(1, 10) },
          { L: 11, max: 120, tol: F(1, 20), step: F(1, 100) },
        ][level - 1]
      : [
          { L: 6, max: 216, tol: F(0), step: F(1) },
          { L: 6, max: 200, tol: F(1, 4), step: F(1, 10) },
          { L: 7, max: 300, tol: F(1, 10), step: F(1, 20) },
        ][level - 1];
  let n = 2;
  const wantPower =
    (index === 2 && level === 1 && pick(rng, [true, false, false])) || (index === 3 && level === 1);
  for (let tries = 0; tries < 400; tries += 1) {
    n = index === 3 && level === 1 ? pick(rng, [8, 27, 64, 125, 216]) : int(rng, 2, cfg.max);
    if (isPower(n, index) === wantPower) break;
  }
  const lo = iroot(n, index);
  const hi = isPower(n, index) ? lo : lo + 1;
  const perfect = lo === hi;
  return buildPlace({
    rng,
    skill,
    family: "root",
    level,
    line: { min: F(0), max: F(cfg.L), ticks: F(1), labels: labelsBy(0, cfg.L, 1) },
    mode: "dec",
    step: cfg.step,
    tol: cfg.tol,
    radical: { index, radicand: n },
    detail: { index, n, lo, hi, perfect, loPow: lo ** index, hiPow: hi ** index },
    traps: [
      trap("radicand-as-position", F(n)),
      trap("radicand-halved", F(n, 2)),
      trap("lower-square", F(lo)),
      trap("upper-square", F(perfect ? lo + 1 : hi)),
    ],
    promptKey: "to",
    vars: { v: rootText(index, n) },
  });
}

const pow10 = (e) => (e >= 0 ? F(10 ** e) : F(1, 10 ** -e));

export function g8Scientific(rng, level) {
  const e =
    level === 1 ? int(rng, 2, 5) : level === 2 ? int(rng, 3, 6) : pick(rng, [-4, -3, -2, 5, 6]);
  const k = level === 1 ? 10 * int(rng, 1, 9) : 10 * int(rng, 1, 9) + int(rng, 1, 9);
  const coef = F(k, 10);
  const t = mul(coef, pow10(e));
  const tol = level === 1 ? mul(pow10(e), F(1, 2)) : level === 2 ? pow10(e - 1) : F(0);
  const max = pow10(e + 1);
  return buildPlace({
    rng,
    skill: "g8-scientific-positions",
    family: "sci",
    level,
    line: { min: F(0), max, ticks: pow10(e), labels: [F(0), mul(max, F(1, 2)), max] },
    mode: e >= 0 ? "int" : "dec",
    step: pow10(e - 1),
    tol,
    target: t,
    detail: { coef: showNum(coef, "dec"), e, zeros: e },
    traps: [trap("exponent-low", mul(coef, pow10(e - 1)), { snap: true })],
    promptKey: "to",
    vars: { v: sciText(coef, e) },
  });
}

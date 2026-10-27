// check(round, response): exact judgement of what the learner built, with a named mistake for every miss.
// Accepts every mathematically correct build (many cuts, many scoop mixes); all arithmetic is exact. @fm2 FM-060 FM-063
import { add, cmp, eq, frac, mul, sub, toString } from "../../rational.js";
import { feedbackFor, praiseFor } from "./feedback.js";
import {
  cleanMeasure,
  cleanPlace,
  cleanScoops,
  cleanShape,
  decimalParts,
  insideBase,
  isEqualSplit,
  levelOf,
  placeValue,
  servedCount,
  servedValue,
  sizesOf,
  totalOf,
} from "./model.js";
import { decimalOf, ms } from "./words.js";

const ok = (vars = {}) => ({ ok: true, vars });
const miss = (key, vars = {}) => ({ ok: false, key, vars });
const sizesText = (sizes) => sizes.map(toString).join(", ");

function shapeOf(round, response) {
  const shape = cleanShape(response, round.wholes ?? 1);
  if (!shape) return null;
  const sizes = sizesOf(shape.cuts);
  return {
    ...shape,
    sizes,
    n: sizes.length,
    equal: isEqualSplit(shape.cuts),
    count: servedCount(shape.served),
    value: servedValue(shape.cuts, shape.served),
  };
}

// The checks every shape task starts with.
function shapeBasics(s, { needServed = true } = {}) {
  if (!s) return miss("malformed");
  if (!s.equal) return miss("unequal", { sizes: sizesText(s.sizes) });
  if (needServed && s.count === 0) return miss("noneServed");
  return null;
}

const JUDGES = {
  fair(round, response) {
    const s = shapeOf(round, response);
    const basic = shapeBasics(s, { needServed: false });
    if (basic) return basic;
    if (s.n !== round.friends) return miss("wrongParts", { n: s.n, f: round.friends });
    if (s.count === 0) return miss("noneServed");
    if (s.count !== round.serveCount)
      return miss("wrongServed", { count: s.count, m: round.serveCount });
    return ok({ n: s.n, count: s.count });
  },
  fix(round, response) {
    const s = shapeOf(round, response);
    const basic = shapeBasics(s, { needServed: false });
    if (basic) return basic;
    return s.n === round.friends
      ? ok({ n: s.n })
      : miss("wrongParts", { n: s.n, f: round.friends });
  },
  serve(round, response) {
    const s = shapeOf(round, response);
    const basic = shapeBasics(s);
    if (basic) return basic;
    if (round.den && s.n !== round.den) return miss("wrongDenom", { den: round.den, n: s.n });
    if (eq(s.value, round.target)) return ok({ count: s.count, n: s.n, value: toString(s.value) });
    if (s.count === round.ask[0] && s.n !== round.ask[1])
      return miss("partsMismatch", { count: s.count, n: s.n, b: round.ask[1] });
    return miss(cmp(s.value, round.target) > 0 ? "tooMuch" : "tooLittle", {
      value: toString(s.value),
    });
  },
  equiv(round, response) {
    const s = shapeOf(round, response);
    const basic = shapeBasics(s);
    if (basic) return basic;
    if (!eq(s.value, round.ref)) {
      const shift = s.n - round.ref.d;
      if (shift > 0 && s.count - round.ref.n === shift) return miss("additive");
      return miss(cmp(s.value, round.ref) > 0 ? "tooMuch" : "tooLittle", { value: ms(s.value) });
    }
    if (round.den && s.n !== round.den) return miss("wrongDenom", { den: round.den, n: s.n });
    if (s.n === round.ref.d) return miss("sameCut", { n: s.n });
    return ok({ n: s.n, count: s.count });
  },
  compare(round, response) {
    const s = shapeOf(round, response);
    const basic = shapeBasics(s);
    if (basic) return basic;
    if (round.den && s.n !== round.den) return miss("wrongDenom", { den: round.den, n: s.n });
    if (round.num && s.count !== round.num)
      return miss("wrongCount", { num: round.num, count: s.count });
    const order = cmp(s.value, round.ref);
    const want = round.relation === "more" ? 1 : -1;
    if (order === want) return ok({ value: toString(s.value), relation: round.relation });
    const value = toString(s.value);
    if (order === 0) return miss("equalToRef", { value, relation: round.relation });
    if (round.mode === "sameNum")
      return miss(round.relation === "more" ? "biggerBottom" : "smallerBottom");
    return miss("wrongSide", {
      value,
      actual: order > 0 ? "more" : "less",
      relation: round.relation,
    });
  },
  area(round, response) {
    const s = shapeOf(round, response);
    const basic = shapeBasics(s);
    if (basic) return basic;
    if (!insideBase(s, round.base)) return miss("outside");
    if (eq(s.value, round.target)) return ok({ value: toString(s.value) });
    const value = toString(s.value);
    if (eq(s.value, round.base)) return miss("tookAll");
    if (eq(s.value, round.factor))
      return miss(round.op === "share" ? "forgotLeftover" : "ofWhole", { value });
    return miss(cmp(s.value, round.target) > 0 ? "tooMuch" : "tooLittle", { value });
  },
  cup: (round, response) => judgeMeasure(round, response),
  line: (round, response) => judgeMeasure(round, response),
  fill(round, response) {
    const scoops = cleanScoops(response);
    if (!scoops) return miss("malformed");
    if (scoops.length === 0) return miss("empty");
    if (!scoops.every((s) => round.scoops.some((allowed) => eq(allowed, s))))
      return miss("notAllowed");
    const sizes = new Set(scoops.map(toString));
    if (round.single && sizes.size > 1) return miss("mixedSizes", { kinds: sizes.size });
    const total = totalOf(scoops);
    if (!eq(total, round.target)) return missFill(round, total);
    if (sizes.size < round.minKinds) return miss("needTwoKinds");
    return ok({ value: ms(total) });
  },
  serving(round, response) {
    const k = response?.servings;
    if (!Number.isInteger(k) || k < 0 || k > 100) return miss("malformed");
    const left = sub(round.amount, mul(frac(k), round.size));
    if (left.n < 0) return miss("malformed");
    if (cmp(left, round.size) >= 0) return miss("stoppedEarly", { left: ms(left) });
    return left.n === 0 ? ok({ k }) : miss("stoppedEarly", { left: ms(left) });
  },
  place(round, response) {
    const p = cleanPlace(response);
    if (!p) return miss("malformed");
    const parts = decimalParts(round.target);
    if (round.mode === "repeat") {
      if (parts.rep) {
        if (!p.never) return miss("claimedExact");
        if (!p.block) return miss("needBlock");
        return p.block === parts.rep ? ok({ block: parts.rep, repeat: true }) : miss("wrongBlock");
      }
      if (p.never) return miss("claimedNever");
    }
    const value = placeValue(p.digits);
    if (eq(value, round.target)) return ok({ value: decimalOf(value) });
    const ten = frac(10);
    if (eq(value, mul(round.target, ten)) || eq(value, mul(round.target, frac(1, 10))))
      return miss("placeShift");
    const sortedDigits = (digits) => [...digits].sort().join("");
    const wanted = [0, 1, 2, 3].map(
      (i) => Math.floor((round.target.n * 10 ** i * 1) / round.target.d) % 10,
    );
    if (sortedDigits(wanted) === sortedDigits(p.digits)) return miss("digitsSwapped");
    return miss(cmp(value, round.target) > 0 ? "overfill" : "underfill", {
      value: decimalOf(value),
    });
  },
};

function missFill(round, total) {
  const t = round.target;
  if (round.op === "batch" && eq(total, round.amount))
    return miss("oneBatch", { batches: round.batches });
  if (round.op === "sum" && round.terms.length === 2) {
    const [x, y] = round.terms;
    if (eq(total, frac(x.n + y.n, x.d + y.d)))
      return miss("topBottom", { tops: `${x.n} + ${y.n}`, bottoms: `${x.d} + ${y.d}` });
  }
  if (round.op === "mixed" && t.d > 1) {
    const whole = frac(Math.floor(t.n / t.d));
    if (eq(total, whole) && whole.n > 0) return miss("wholeOnly");
    if (eq(total, sub(t, whole))) return miss("fractionOnly");
  }
  return miss(cmp(total, t) > 0 ? "overfill" : "underfill", { value: ms(total) });
}

function judgeMeasure(round, response) {
  const m = cleanMeasure(response, round);
  if (!m) return miss("malformed");
  const level = levelOf(m);
  const mark = `1/${m.ticks}`;
  if (round.irr) {
    const gap = sub(level, round.irr.value);
    const near = cmp(frac(Math.abs(gap.n), gap.d), round.irr.tol) <= 0;
    if (!near)
      return miss("tooFar", { dec: decimalOf(level) ?? ms(level), symbol: round.irr.symbol });
    if (m.verdict === "close")
      return ok({ value: ms(level), symbol: round.irr.symbol, approx: true });
    return miss(m.verdict === "equal" ? "saysEqual" : "needVerdict", { symbol: round.irr.symbol });
  }
  if (eq(level, round.target)) return ok({ value: ms(level) });
  if (round.skill === "net") {
    const moves = round.moves;
    const reversed = moves.reduce((sum, x) => add(sum, frac(Math.abs(x.n), x.d)), round.start);
    if (eq(level, reversed)) return miss("signFlip");
    if (
      eq(
        level,
        moves.reduce((sum, x) => add(sum, x), frac(0)),
      )
    )
      return miss("forgotStart");
  }
  if (round.skill === "percent" && !eq(round.of, frac(1)) && eq(level, frac(round.percent, 100))) {
    return miss("ignoredAmount", { p: round.percent, of: ms(round.of) });
  }
  if ((round.target.n * m.ticks) % round.target.d !== 0) return miss("wrongMarks", { mark });
  if (m.steps === round.target.n && m.ticks !== round.target.d)
    return miss("countedMarks", { steps: m.steps, mark });
  return miss(cmp(level, round.target) > 0 ? "tooMuch" : "tooLittle", { value: ms(level) });
}

const PRAISE_KIND = (round, vars) => {
  if (round.kind === "cup" || round.kind === "line") return round.irr ? "approx" : "measure";
  if (round.kind === "place") return vars.repeat ? "repeat" : "place";
  return round.kind;
};

export function check(round, response) {
  const verdict = JUDGES[round.kind](round, response);
  if (verdict.ok) {
    const vars = { ...verdict.vars };
    if (round.kind === "serving") vars.k = verdict.vars.k;
    return { correct: true, feedback: praiseFor(PRAISE_KIND(round, vars), vars), mistake: null };
  }
  return {
    correct: false,
    feedback: feedbackFor(round, verdict.key, verdict.vars),
    mistake: verdict.key,
  };
}

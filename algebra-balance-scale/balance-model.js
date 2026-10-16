/**
 * The algebra of the Balance Builder: an equation (or inequality) is two sides
 * a·x + b, a move is "do this to BOTH sides", and every move the game allows is
 * a property of equality. Pure functions, no DOM, so every rule is testable.
 *
 * Why the game is shaped like this: the mathematics of solving is "apply the same
 * inverse operation to both sides". There is no way in this model to touch one
 * side only, no negative or zero multiplier, and the student types every
 * resulting value, so the balance is the structure and not a picture of it.
 */
import * as R from "./rational.js";

export const RELATIONS = ["=", "<", ">", "≤", "≥"];
export const OPS = ["+", "−", "×", "÷"];
const MINUS = "−";

const num = (v) => (typeof v === "number" ? R.rat(v) : v);
/** A side a·x + b. */
export const side = (a = 0, b = 0) => ({ a: num(a), b: num(b) });
export const equation = (l, r, rel = "=") => ({ l, r, rel });

// ── text ───────────────────────────────────────────────────────────────────
function xTermText(a, v) {
  const mag = R.abs(a);
  const lead = mag.n === 1 ? "" : String(mag.n);
  const tail = mag.d === 1 ? "" : `/${mag.d}`;
  return `${lead}${v}${tail}`;
}

/** "2x + 3", "x − 4", "−x + 10", "0". */
export function sideText(s, v) {
  const parts = [];
  if (!R.isZero(s.a)) parts.push({ neg: s.a.n < 0, body: xTermText(s.a, v) });
  if (!R.isZero(s.b) || parts.length === 0) {
    parts.push({ neg: s.b.n < 0, body: R.fmt(R.abs(s.b)) });
  }
  return parts
    .map((p, i) =>
      i === 0 ? `${p.neg ? MINUS : ""}${p.body}` : `${p.neg ? MINUS : "+"} ${p.body}`,
    )
    .join(" ");
}

export const eqText = (e, v) => `${sideText(e.l, v)} ${e.rel} ${sideText(e.r, v)}`;

/** The "write it on both sides" line before any arithmetic, e.g. "2x + 3 − 3". */
export function unsimplified(s, move, v) {
  const base = sideText(s, v);
  const wrap = (move.op === "×" || move.op === "÷") && !R.isZero(s.a) && !R.isZero(s.b);
  return `${wrap ? `(${base})` : base} ${move.op} ${amountText(move, v)}`;
}

export function amountText(move, v) {
  return R.isZero(move.amount.a) ? R.fmt(move.amount.b) : xTermText(move.amount.a, v);
}

export const moveText = (move, v) => `${move.op} ${amountText(move, v)}`;

/** Screen-reader wording: "2x plus 3 equals 11". */
export function spoken(text) {
  return text
    .replaceAll(MINUS, " minus ")
    .replaceAll("+", " plus ")
    .replaceAll("×", " times ")
    .replaceAll("÷", " divided by ")
    .replaceAll("=", " equals ")
    .replaceAll("≤", " is less than or equal to ")
    .replaceAll("≥", " is greater than or equal to ")
    .replaceAll("<", " is less than ")
    .replaceAll(">", " is greater than ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── typed expressions ──────────────────────────────────────────────────────
const TERM = /^(?:(\d+(?:\.\d+)?)(?:\/(\d+))?)?\*?(?:(VAR)(?:\/(\d+))?)?$/;

/**
 * Reads what a student typed for one side: "2x", "3 + 2x", "x/3 − 1/2".
 * Only numbers, the one variable letter, + − and fractions are accepted.
 * Reports how many x-terms and numbers were typed so "2x + 3 − 3" can be told
 * apart from a simplified side.
 */
export function parseSide(text, v) {
  const src = String(text)
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/\s+/g, "");
  if (!src || src.length > 40) return { ok: false };
  const pattern = new RegExp(TERM.source.replace("VAR", v.toLowerCase()));
  const pieces = src.match(/[+-]?[^+-]+/g);
  if (!pieces || pieces.join("") !== src) return { ok: false };
  let a = R.ZERO;
  let b = R.ZERO;
  let xTerms = 0;
  let numTerms = 0;
  for (const piece of pieces) {
    const negative = piece.startsWith("-");
    const body = piece.replace(/^[+-]/, "");
    const m = pattern.exec(body);
    if (!m || (m[1] === undefined && m[3] === undefined)) return { ok: false };
    let value = m[1] === undefined ? R.ONE : R.parseUnsigned(m[2] ? `${m[1]}/${m[2]}` : m[1]);
    if (!value) return { ok: false };
    if (m[3] !== undefined) {
      if (m[4] !== undefined) {
        if (Number(m[4]) === 0) return { ok: false };
        value = R.div(value, R.rat(Number(m[4])));
      }
      a = R.add(a, negative ? R.neg(value) : value);
      xTerms += 1;
    } else {
      b = R.add(b, negative ? R.neg(value) : value);
      numTerms += 1;
    }
  }
  return { ok: true, side: { a, b }, xTerms, numTerms };
}

/** Builds a move from the operation and what the student typed as the amount. */
export function parseMove(op, text, v) {
  if (!OPS.includes(op)) return { ok: false, reason: "op" };
  const parsed = parseSide(text, v);
  if (!parsed.ok || parsed.xTerms + parsed.numTerms !== 1) return { ok: false, reason: "amount" };
  const plain = !/^[+-]/.test(String(text).replace(/\s+/g, ""));
  if (!plain) return { ok: false, reason: "amount" };
  const amount = parsed.side;
  const multiplicative = op === "×" || op === "÷";
  if (multiplicative && !R.isZero(amount.a)) return { ok: false, reason: "variableScale" };
  if (R.isZero(amount.a) && R.isZero(amount.b)) return { ok: false, reason: "zero" };
  return { ok: true, move: { op, amount } };
}

// ── applying a move ────────────────────────────────────────────────────────
function applyToSide(s, move) {
  const { amount } = move;
  switch (move.op) {
    case "+":
      return side(R.add(s.a, amount.a), R.add(s.b, amount.b));
    case MINUS:
      return side(R.sub(s.a, amount.a), R.sub(s.b, amount.b));
    case "×":
      return side(R.mul(s.a, amount.b), R.mul(s.b, amount.b));
    default:
      return side(R.div(s.a, amount.b), R.div(s.b, amount.b));
  }
}

/** Applies a move to BOTH sides. Never changes the relation: amounts are positive. */
export function applyMove(e, move) {
  const next = equation(applyToSide(e.l, move), applyToSide(e.r, move), e.rel);
  const all = [next.l.a, next.l.b, next.r.a, next.r.b];
  if (!all.every(R.withinLimit)) return { ok: false, reason: "tooBig" };
  return { ok: true, eq: next };
}

export const sidesEqual = (p, q) => R.eq(p.a, q.a) && R.eq(p.b, q.b);

/** Where x stands alone: { sideName, value } when the equation reads x = number. */
export function isolated(e) {
  const alone = (s) => R.eq(s.a, R.ONE) && R.isZero(s.b);
  const plain = (s) => R.isZero(s.a);
  if (alone(e.l) && plain(e.r)) return { sideName: "left", value: e.r.b };
  if (alone(e.r) && plain(e.l)) return { sideName: "right", value: e.l.b };
  return null;
}

// ── truth and tilt ─────────────────────────────────────────────────────────
export const evalSide = (s, x) => R.add(R.mul(s.a, x), s.b);

export function holds(l, rel, r) {
  const c = R.cmp(l, r);
  if (rel === "=") return c === 0;
  if (rel === "<") return c < 0;
  if (rel === ">") return c > 0;
  return rel === "≤" ? c <= 0 : c >= 0;
}

/** +1 left pan heavier, -1 right pan heavier, 0 level, when x weighs `x`. */
export const tilt = (e, x) => R.cmp(evalSide(e.l, x), evalSide(e.r, x));

// ── the canonical solution path (used for hints, rating and tests) ─────────
const xSide = (e) => {
  const lx = !R.isZero(e.l.a);
  const rx = !R.isZero(e.r.a);
  if (lx && rx) return R.cmp(e.l.a, e.r.a) >= 0 ? "left" : "right";
  return lx ? "left" : "right";
};

/** The next productive move, e.g. { kind: "cancelConst", move: {op:"−", amount} }. */
export function nextStep(e) {
  if (isolated(e)) return { kind: "done" };
  const v = xSide(e);
  const target = v === "left" ? e.l : e.r;
  const other = v === "left" ? e.r : e.l;
  if (R.isZero(target.a)) return { kind: "stuck" };
  const xAmount = (a) => side(R.abs(a), 0);
  const constAmount = (b) => side(0, R.abs(b));
  if (!R.isZero(other.a)) {
    return { kind: "cancelX", move: { op: other.a.n > 0 ? MINUS : "+", amount: xAmount(other.a) } };
  }
  if (R.sign(target.a) < 0) {
    return { kind: "cancelX", negative: true, move: { op: "+", amount: xAmount(target.a) } };
  }
  if (!R.isZero(target.b)) {
    return {
      kind: "cancelConst",
      move: { op: target.b.n > 0 ? MINUS : "+", amount: constAmount(target.b) },
    };
  }
  if (target.a.d === 1) return { kind: "scale", move: { op: "÷", amount: constAmount(target.a) } };
  return { kind: "scale", move: { op: "×", amount: constAmount(R.rat(target.a.d)) } };
}

/** Moves a careful solver needs from this state. */
export function solutionLength(e) {
  let cur = e;
  for (let n = 0; n < 12; n += 1) {
    const step = nextStep(cur);
    if (step.kind === "done") return n;
    const next = step.move && applyMove(cur, step.move);
    if (!next?.ok) return Infinity;
    cur = next.eq;
  }
  return Infinity;
}

// ── is this move a known misstep? ──────────────────────────────────────────
/**
 * "sameOp": repeating the operation already acting on x (adding where something is
 * added) instead of undoing it. "wrongFamily": using + or − to undo a product, or
 * × ÷ to undo a lone constant. Both are legal on the balance and still balanced;
 * they carry x farther from alone, which is the misconception.
 */
export function classifyMove(e, move) {
  const v = xSide(e);
  const target = v === "left" ? e.l : e.r;
  const other = v === "left" ? e.r : e.l;
  const xAmt = !R.isZero(move.amount.a);
  const k = xAmt ? move.amount.a : move.amount.b;
  const oneSided = R.isZero(other.a);
  if (move.op === "+" && !xAmt && target.b.n > 0) return "sameOp";
  if (move.op === MINUS && !xAmt && target.b.n < 0) return "sameOp";
  if (move.op === "+" && xAmt && other.a.n > 0) return "sameOp";
  if (move.op === MINUS && xAmt && other.a.n < 0) return "sameOp";
  if (move.op === "×" && oneSided && R.isZero(target.b) && R.isInt(target.a) && target.a.n > 1) {
    return "sameOp";
  }
  if (move.op === "÷" && oneSided && R.isZero(target.b) && target.a.n === 1 && target.a.d > 1) {
    return "sameOp";
  }
  const scaling = move.op === "×" || move.op === "÷";
  if (scaling && R.cmp(k, R.ONE) > 0 && oneSided && R.eq(target.a, R.ONE) && !R.isZero(target.b)) {
    return "wrongFamily";
  }
  if (!scaling && oneSided && R.isZero(target.b) && !R.eq(target.a, R.ONE)) return "wrongFamily";
  return "ok";
}

// ── checking what the student typed after a move ───────────────────────────
const dropSigns = (s) => side(R.abs(s.a), R.abs(s.b));

/**
 * What a student who scaled only the x-term of a two-term side (and left its number
 * alone) would write. A side with one term is scaled whole.
 */
function partialScale(pre, move) {
  const f = (s) => {
    const out = applyToSide(s, move);
    return R.isZero(s.a) || R.isZero(s.b) ? out : side(out.a, s.b);
  };
  return move.op === "×" || move.op === "÷" ? { l: f(pre.l), r: f(pre.r) } : null;
}

/** Numbers already in the problem a student might read off as the answer. */
function givenNumbers(pre, move) {
  const set = [move.amount.b, move.amount.a, pre.l.a, pre.l.b, pre.r.a, pre.r.b].map(R.abs);
  return set.filter((n) => !R.isZero(n));
}

const strictness = { "<": "≤", "≤": "<", ">": "≥", "≥": ">" };
const reversed = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" };

/**
 * Checks the two sides (and, for inequalities, the symbol) a student typed.
 * Never returns the expected values: only which side is off and, when exactly one
 * named misconception explains it, its tag from engine/core/misconceptions.
 */
export function checkEntry(pre, move, typed, v, hiddenX = null) {
  const done = applyMove(pre, move);
  if (!done.ok) return { ok: false, reason: "tooBig" };
  const expected = done.eq;
  const reads = { left: parseSide(typed.left, v), right: parseSide(typed.right, v) };
  for (const name of ["left", "right"]) {
    if (!reads[name].ok) return { ok: false, reason: "unreadable", side: name };
  }
  for (const name of ["left", "right"]) {
    if (reads[name].xTerms > 1 || reads[name].numTerms > 1) {
      return { ok: false, reason: "combine", side: name };
    }
  }
  if (pre.rel !== "=" && !RELATIONS.includes(typed.rel)) return { ok: false, reason: "needRel" };
  const got = { l: reads.left.side, r: reads.right.side };
  const want = { l: expected.l, r: expected.r };
  const status = (key) => {
    if (sidesEqual(got[key], want[key])) return "ok";
    return sidesEqual(got[key], pre[key]) ? "unchanged" : "wrong";
  };
  const sides = { left: status("l"), right: status("r") };
  const relOk = pre.rel === "=" || typed.rel === pre.rel;
  if (sides.left === "ok" && sides.right === "ok" && relOk) return { ok: true, eq: expected };
  const result = {
    ok: false,
    reason: "wrong",
    sides,
    relWrong: !relOk,
    typed: got,
    tag: null,
    coach: "arith",
    tilt: hiddenX && pre.rel === "=" ? tilt(equation(got.l, got.r), hiddenX) : null,
  };
  if (!relOk) {
    if (reversed[pre.rel] === typed.rel) result.tag = "inequality-direction-flipped";
    else if (strictness[pre.rel] === typed.rel) result.tag = "inequality-boundary-inclusion";
    result.coach = result.tag === "inequality-direction-flipped" ? "relFlip" : "relStrict";
    return result;
  }
  if (sides.left === "unchanged" || sides.right === "unchanged") result.coach = "bothSides";
  const wrongKeys = ["l", "r"].filter((k) => !sidesEqual(got[k], want[k]));
  const matches = (guess) => wrongKeys.every((k) => sidesEqual(got[k], guess[k]));
  const tags = [];
  const partial = partialScale(pre, move);
  if (partial && wrongKeys.every((k) => !sidesEqual(partial[k], want[k])) && matches(partial)) {
    tags.push(["algebra-distributive-partial", "partial"]);
  }
  const lost = { l: dropSigns(want.l), r: dropSigns(want.r) };
  if (wrongKeys.every((k) => !sidesEqual(lost[k], want[k])) && matches(lost)) {
    tags.push(["sign-dropped", "signLost"]);
  }
  const iso = isolated(expected);
  if (iso && wrongKeys.length === 1) {
    const k = wrongKeys[0];
    const constantSide = iso.sideName === "left" ? "r" : "l";
    const typedConst = got[k].b;
    if (k === constantSide && sides[k === "l" ? "left" : "right"] === "wrong" && R.isZero(got[k].a)) {
      const named = givenNumbers(pre, move).some((g) => R.eq(g, R.abs(typedConst)));
      if (named) tags.push(["equation-answered-with-given-number", "givenNumber"]);
    }
  }
  if (tags.length === 1) [[result.tag, result.coach]] = tags;
  return result;
}

// Pure arithmetic for the "division" family: exact integers only (decimals are scaled integers, a
// fraction of a whole number is whole ÷ d × n). No DOM, no floats that decide or print an answer.
import { fmtNumber, frac, mul, parseRational, toDecimalString, toFrac } from "./core.mjs";

export const MODES = ["whole", "decimal", "fractionof"];
export const KEYS = {
  whole: ["dividend", "divisor", "context"],
  decimal: ["dividend", "divisor", "context"],
  fractionof: ["n", "d", "whole", "unit"],
};
export const MAX_DIVIDEND = 1_000_000_000;
export const MAX_DIVISOR = 99_999;
export const MAX_COLS = 10; // digits of the dividend (plus any zeros added) that fit at 320px
export const MAX_PLACES = 4; // decimal places allowed in a decimal quotient
export const MAX_OBJECTS = 144;
const MAX_TEXT = 120;

const bad = (m) => {
  throw new TypeError(`division: ${m}`);
};
export const num = (x) => fmtNumber(frac(x));
export const fmtDec = (s) => fmtNumber(parseRational(s));

/** Decimal places of a rational that terminates (Infinity when it needs more than MAX_PLACES). */
function places(r) {
  for (let k = 0; k <= MAX_PLACES; k++) if (10 ** k % r.d === 0) return k;
  return Number.POSITIVE_INFINITY;
}

function words(v, label) {
  if (v === null || v === undefined) return null;
  const ok = (s) => typeof s === "string" && s.trim() && s.length <= MAX_TEXT;
  if (!v || !ok(v.en) || !ok(v.es)) bad(`${label} needs short en and es text`);
  return { en: v.en.trim(), es: v.es.trim() };
}

function positive(x, label) {
  const r = toFrac(x);
  if (!r || r.n <= 0) bad(`${label} must be a positive number`);
  return r;
}

/** Validates one problem (a config, a preset or a patch) and returns it in canonical form. */
export function normalizeProblem(mode, o) {
  if (!MODES.includes(mode)) bad(`mode must be one of ${MODES.join(", ")}`);
  if (!o || typeof o !== "object") bad("a problem is required");
  if (mode === "fractionof") {
    const { n, d, whole } = o;
    if (![n, d, whole].every(Number.isInteger)) bad("n, d and whole must be whole numbers");
    if (d < 2 || d > 12 || n < 1 || n >= d) bad("the fraction must be proper with a bottom of 2 to 12");
    if (whole > MAX_OBJECTS || whole % d !== 0) bad(`the whole must split into ${d} equal groups (at most ${MAX_OBJECTS})`);
    return { n, d, whole, unit: words(o.unit, "unit") };
  }
  const a = positive(o.dividend, "dividend");
  const b = positive(o.divisor, "divisor");
  if (mode === "whole" && (a.d !== 1 || b.d !== 1)) bad("whole mode needs whole numbers");
  const p = { dividend: toDecimalString(a), divisor: toDecimalString(b), context: words(o.context, "context") };
  planOf(mode, p);
  return p;
}

/**
 * The long-division cycles over the digits of the dividend. The first working number is the
 * shortest prefix that reaches the divisor (the whole number when none does). Zeros are appended
 * after the last digit (up to extraMax) while something is left over.
 */
function longDivision(digits, divisor, extraMax) {
  const ds = [...digits].map(Number);
  let pos = 0;
  let w = ds[0];
  while (w < divisor && pos < ds.length - 1) w = w * 10 + ds[++pos];
  const cycles = [];
  let extra = 0;
  for (;;) {
    const q = Math.floor(w / divisor);
    const left = w - q * divisor;
    const cycle = { pos, working: w, q, product: q * divisor, left, bring: null };
    cycles.push(cycle);
    if (pos + 1 < ds.length) cycle.bring = ds[pos + 1];
    else if (left !== 0 && extra < extraMax) {
      cycle.bring = 0;
      extra += 1;
    } else break;
    w = left * 10 + cycle.bring;
    pos += 1;
  }
  return { cycles, extra, digits: ds };
}

/**
 * The whole worked problem as data. "decimal" first multiplies both numbers by 10^need so the
 * divisor is whole; the dividend then reads as the integer A with `dec` digits after its point.
 */
export function planOf(mode, p) {
  const a = parseRational(p.dividend);
  const b = parseRational(p.divisor);
  const need = mode === "decimal" ? places(b) : 0;
  const pa = places(a);
  if (need > 3 || !Number.isFinite(pa)) bad("too many decimal places");
  const dec = mode === "decimal" ? Math.max(pa - need, 0) : 0;
  const A = mul(a, frac(10 ** (need + dec))).n;
  const B = mul(b, frac(10 ** need)).n;
  if (B > MAX_DIVISOR || (mode === "whole" && A > MAX_DIVIDEND)) bad("the numbers are too large");
  const digits = String(A).padStart(dec + 1, "0");
  if (digits.length > MAX_COLS) bad("the dividend is too long");
  const { cycles, extra } = longDivision(digits, B, mode === "decimal" ? Math.max(MAX_PLACES - dec, 0) : 0);
  const last = cycles.at(-1);
  if (mode === "decimal" && last.left !== 0) bad(`the answer must end within ${MAX_PLACES} decimal places`);
  const cols = digits.length + extra;
  if (cols > MAX_COLS) bad("the answer is too long");
  const qDec = dec + extra;
  const actions = [];
  for (let i = 0; i < need; i++) actions.push({ kind: "move" });
  if (mode === "decimal") actions.push({ kind: "point" });
  cycles.forEach((c, k) => {
    for (const kind of ["pick", "mult", "sub", ...(c.bring === null ? [] : ["bring"])]) actions.push({ kind, k });
  });
  actions.push({ kind: "check" });
  return {
    mode,
    A,
    B,
    digits,
    dec,
    need,
    extra,
    cols,
    pointAfter: digits.length - dec - 1,
    cycles,
    actions,
    qDec,
    quotient: frac(Number(cycles.map((c) => c.q).join("")), 10 ** qDec),
    remainder: mode === "whole" ? last.left : 0,
  };
}

/** What the steps taken so far have put on the board. */
export function progressOf(plan, step) {
  const prog = plan.cycles.map(() => 0);
  let moved = 0;
  let point = false;
  for (const a of plan.actions.slice(0, step)) {
    if (a.kind === "move") moved += 1;
    else if (a.kind === "point") point = true;
    else if (a.k !== undefined) prog[a.k] += 1;
  }
  return { moved, point, prog, checked: step === plan.actions.length };
}

/** "big": too many divisors; "small": another divisor still fits; "ok": exactly right. */
export function judgeDigit(working, divisor, digit) {
  const product = digit * divisor;
  if (product > working) return "big";
  return working - product >= divisor ? "small" : "ok";
}

/** Shifts a decimal string by 10^j, exactly. */
export const shifted = (s, j) => fmtNumber(mul(parseRational(s), frac(10 ** j)));

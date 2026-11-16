// Exact mathematics behind the ratio figures. Pure and deterministic: whole numbers in, rationals out, no DOM, no clock.
// Every number a student reads is computed here through shared/motion/exact.mjs (Rat); only picture geometry uses floats.
import { commas, parse, Rat } from "../exact.mjs";

/** @param {number | bigint} n @param {number | bigint} [d] */
export const R = (n, d = 1) => new Rat(BigInt(n), BigInt(d));
/** Sign of a - b. @param {Rat} a @param {Rat} b */
export const cmp = (a, b) => {
  const s = a.sub(b);
  return s.n === 0n ? 0 : s.n < 0n ? -1 : 1;
};
/** Float for picture geometry only, never for a displayed number. @param {Rat} r */
export const num = (r) => Number(r.n) / Number(r.d);
/** @param {number} a @param {number} b */
export const gcdN = (a, b) => (b ? gcdN(b, a % b) : Math.abs(a));
/** @param {number} a @param {number} b */
export const lcmN = (a, b) => (a / gcdN(a, b)) * b;

/** @param {unknown} v @param {number} lo @param {number} hi @param {string} name */
export function whole(v, lo, hi, name) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < lo || v > hi) throw new RangeError(`${name} must be a whole number from ${lo} to ${hi}.`);
  return v;
}

/** Decimal places when the value ends, else -1. @param {Rat} r */
function places(r) {
  let d = r.d;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    twos++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    fives++;
  }
  return d === 1n ? Math.max(twos, fives) : -1;
}
/** @param {bigint} n @param {number} p digits of an unsigned scaled integer -> "12.50" */
function withPoint(n, p) {
  const s = n.toString().padStart(p + 1, "0");
  const head = s.slice(0, s.length - p);
  return commas(BigInt(head)) + (p ? `.${s.slice(s.length - p)}` : "");
}
/** Round half up to p places, unsigned digits. @param {Rat} r positive */
function rounded(r, p) {
  const scale = 10n ** BigInt(p);
  return withPoint((2n * r.n * scale + r.d) / (2n * r.d), p);
}

/**
 * How a rational is written: a whole number or short decimal as text, otherwise a stacked fraction with its two-place decimal.
 * @typedef {{ pre: string, t?: string, n?: string, d?: string, approx?: string }} Show
 * @param {Rat} r @param {{ money?: boolean }} [o]
 * @returns {Show}
 */
export function show(r, o = {}) {
  const neg = r.n < 0n;
  const a = neg ? new Rat(-r.n, r.d) : r;
  const pre = `${neg ? "−" : ""}${o.money ? "$" : ""}`;
  const p = places(a);
  if (p >= 0 && p <= 4) {
    const pp = o.money && !a.isInt() ? Math.max(p, 2) : p;
    return { pre, t: withPoint((a.n * 10n ** BigInt(pp)) / a.d, pp) };
  }
  return { pre, n: commas(a.n), d: commas(a.d), approx: `${pre}${rounded(a, 2)}` };
}
/** Plain text of a Show, for descriptions: "1.25", "$1.50", "5/12". @param {Show} s */
export const plain = (s) => (s.t !== undefined ? `${s.pre}${s.t}` : `${s.pre}${s.n}/${s.d}`);
/** @param {Rat} r @param {boolean} [money] */
export const txt = (r, money = false) => plain(show(r, { money }));
/** "5/12 (about 0.42)" or the plain value. @param {Show} s @param {boolean} es */
export const plainApprox = (s, es) => (s.t !== undefined ? plain(s) : `${plain(s)} (${es ? "aprox." : "about"} ${s.approx})`);

/** "= 1.25" or "≈ 1.97": the value after its equals sign, never an inline fraction. @param {Show} s */
export const eqVal = (s) => (s.t !== undefined ? `= ${plain(s)}` : `≈ ${s.approx}`);

/** A value a parser reads exactly: a whole number or short decimal, else "n/d". @param {Rat} r */
export const exactText = (r) => {
  const s = show(r);
  return s.t !== undefined ? plain(s).replaceAll(",", "") : `${r.n}/${r.d}`;
};

/** The ratio words a figure uses, in both languages. */
export const WORDS = {
  juice: { en: "Juice", es: "Jugo" },
  water: { en: "Water", es: "Agua" },
  color: { en: "Color", es: "Color" },
  white: { en: "White", es: "Blanco" },
};

// ---- ratio:mixer, ratio:unit-rate : a double number line and a ratio table that scale together ----
/**
 * @typedef {{ id: "given" | "scale" | "simplest" | "unit" | "wrong", a: Rat, b: Rat, op: string, mTop: number, mBot: number }} Row
 * Every row is a pair of quantities; mTop / mBot are where each lands on a number line whose length is a multiple of the given pair.
 */
/** @param {Row["id"]} id @param {Rat} a @param {Rat} b @param {string} op @param {Rat} m */
const row = (id, a, b, op, m) => ({ id, a, b, op, mTop: num(m), mBot: num(m) });

/** @param {string} key @param {number[]} values */
export function doubleLine(key, values) {
  const a = whole(values[0], 1, 12, "Juice");
  const b = whole(values[1], 1, 12, "Water");
  const g = gcdN(a, b);
  const A = R(a);
  const B = R(b);
  /** @type {Row[]} */
  const rows = [row("given", A, B, "", R(1)), row("scale", R(2 * a), R(2 * b), "×2", R(2))];
  if (g > 1 && g < b) rows.push(row("simplest", R(a / g), R(b / g), `÷${g}`, R(1, g)));
  if (b > 1) rows.push(row("unit", A.div(B), R(1), `÷${b}`, R(1, b)));
  /** The same amount added to both quantities (the smaller quantity doubles), which is not scaling. */
  let wrong = null;
  if (a !== b) {
    const d = Math.min(a, b);
    wrong = { ...row("wrong", R(a + d), R(b + d), `+${d}`, R(1)), mTop: (a + d) / a, mBot: (b + d) / b, d, scaled: R(2 * a), scaledB: R(2 * b) };
  }
  return { key, a, b, g, rows, wrong, value: A.div(B), sameRatio: a === b };
}

// ---- ratio:compare, ratio:patterns : two mixtures brought to the same amount of white ----
export const REF = Object.freeze([3, 5]);
/** @param {string} key @param {number[]} values */
export function compareModel(key, values) {
  const a = whole(values[0], 1, 12, "Color");
  const b = whole(values[1], 1, 12, "White");
  const L = lcmN(b, REF[1]);
  const kMine = L / b;
  const kRef = L / REF[1];
  const mine = R(a * kMine);
  const ref = R(REF[0] * kRef);
  const verdict = cmp(R(a * REF[1]), R(REF[0] * b));
  const t = REF[1] - b;
  return {
    key,
    a,
    b,
    L,
    kMine,
    kRef,
    mine,
    ref,
    verdict,
    value: R(a, b),
    refValue: R(REF[0], REF[1]),
    /** Adding the same amount to both of your numbers to reach the reference's 5 cups of white, which is not scaling. Equal numbers stay equal either way. */
    wrong: t === 0 || a === b ? null : { t, color: R(a + t), white: R(REF[1]) },
  };
}

// ---- rate:shopping : a pack's unit price against a fixed offer ----
export const OFFER = Object.freeze([10, 6]);
/** @param {string} key @param {number[]} values */
export function rateModel(key, values) {
  const p = whole(values[0], 1, 30, "Pack price");
  const n = whole(values[1], 1, 15, "Items in pack");
  const unit = R(p, n);
  const offerUnit = R(OFFER[0], OFFER[1]);
  const w = p - (n - 1);
  return {
    key,
    p,
    n,
    unit,
    offerUnit,
    verdict: cmp(unit, offerUnit),
    /** Taking the same amount off both the dollars and the items, which is not dividing. */
    wrong: n > 1 && p !== n ? { off: n - 1, dollars: R(w) } : null,
    value: unit,
  };
}

// ---- growth:ratio-graph, growth:rider : a table and its graph ----
/** @param {string} key @param {number[]} values */
export function graphModel(key, values) {
  const r = whole(values[0], 1, 8, "Passengers per carriage");
  const rider = key === "growth:rider";
  const s = whole(values[1], 0, rider ? 6 : 0, rider ? "Starting passengers" : "Starting amount");
  const c = whole(values[2], 1, 12, "Carriages");
  const y = (/** @type {number} */ x) => r * x + s;
  const xs = [1, 2, 3].filter((x) => x <= c);
  if (c > 3) xs.push(c);
  const X = Math.max(c, 4);
  const rows = xs.map((x) => ({ x, y: y(x), rate: R(y(x), x), op: s === 0 ? (x === 1 ? "" : `×${x}`) : "" }));
  const wrong = s === 0 ? (r > 1 && c > 1 ? { x: c, y: r + c - 1, add: c - 1 } : null) : { through: true, x: c, y: y(c) };
  return { key, r, s, c, X, Y: y(X), rows, wrong, value: R(y(c)), proportional: s === 0 };
}

// ---- conversion:expedition, conversion:scale : unit ratio, ratio table and a chain of fraction tiles ----
export const CONV = Object.freeze({ "conversion:expedition": "2.54", "conversion:scale": "12" });
/** @param {string} key @param {number[]} values */
export function convModel(key, values) {
  const L = whole(values[0], 1, 12, "Length");
  const fText = /** @type {Record<string, string>} */ (CONV)[key];
  const f = /** @type {Rat} */ (parse(fText));
  if (values[1] !== Number(fText)) throw new RangeError(`The conversion factor is fixed at ${fText}.`);
  const result = f.mul(R(L));
  const wrongBottom = f.add(R(L - 1));
  return {
    key,
    scale: key === "conversion:scale",
    L,
    f,
    result,
    /** Adding the same amount to both quantities, which is not scaling. */
    wrong: L > 1 ? { add: L - 1, bottom: wrongBottom } : null,
    /** The upside-down factor: the units do not cancel, and the number is the wrong one. */
    flipped: R(L).div(f),
    value: result,
  };
}

// ---- ratio:tape : part to part and part to whole ----
/** @param {string} key @param {number[]} values */
export function tapeModel(key, values) {
  const a = whole(values[0], 1, 12, "Juice");
  const b = whole(values[1], 1, 12, "Water");
  return { key, a, b, total: a + b, value: R(a + b) };
}

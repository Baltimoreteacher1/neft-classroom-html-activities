// Exact arithmetic for the motion models. Browser-safe, dependency-free, never eval.
//   Rat       a BigInt fraction, always normalized (positive denominator)
//   parse     "81", "3^4", "3⁴", "3 × 3 × 3 × 3", "2 1/2", "75%", "0.75" -> Rat | null
//   equivalent(a, b)   true when two answers have the same exact value (not the same string)
// Displayed values elsewhere are computed through this module, never typed in.

/** @param {bigint} a @param {bigint} b */
function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}

export class Rat {
  /** @param {bigint} n @param {bigint} [d] */
  constructor(n, d = 1n) {
    if (d === 0n) throw new RangeError("division by zero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  /** @param {Rat} o */
  add(o) {
    return new Rat(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  /** @param {Rat} o */
  sub(o) {
    return new Rat(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  /** @param {Rat} o */
  mul(o) {
    return new Rat(this.n * o.n, this.d * o.d);
  }
  /** @param {Rat} o */
  div(o) {
    if (o.n === 0n) throw new RangeError("division by zero");
    return new Rat(this.n * o.d, this.d * o.n);
  }
  /** Integer power; a negative exponent inverts. @param {number} e */
  pow(e) {
    if (!Number.isInteger(e) || Math.abs(e) > 64) throw new RangeError("exponent out of range");
    const k = BigInt(Math.abs(e));
    const r = new Rat(this.n ** k, this.d ** k);
    return e < 0 ? new Rat(1n).div(r) : r;
  }
  /** @param {Rat} o */
  eq(o) {
    return this.n === o.n && this.d === o.d;
  }
  isInt() {
    return this.d === 1n;
  }
  toString() {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
}

/** @param {number | bigint} n */
export const int = (n) => new Rat(BigInt(n));

/** Exact b^e for whole numbers. @param {number} b @param {number} e */
export function power(b, e) {
  if (!Number.isInteger(b) || !Number.isInteger(e) || e < 0 || e > 64) throw new RangeError("power: whole base and exponent 0-64");
  return BigInt(b) ** BigInt(e);
}

/** Thousands separators on a bigint, without Intl (deterministic across browsers). @param {bigint | number} n */
export function commas(n) {
  const s = String(n);
  const neg = s.startsWith("-");
  const digits = neg ? s.slice(1) : s;
  return (neg ? "-" : "") + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const SUP = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
/** @type {Record<string, string>} */
const OP = { "*": "×", x: "×", X: "×", "·": "×", "-": "−", "/": "÷" };

/** @param {string} src */
function tokenize(src) {
  /** @type {Array<{t: string, v?: string}>} */
  const out = [];
  const s = src.replace(/,/g, "").replace(/ /g, " ").trim();
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") i++;
    else if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ t: "num", v: s.slice(i, j) });
      i = j;
    } else if (c in SUP) {
      let j = i;
      let digits = "";
      while (j < s.length && s[j] in SUP) digits += SUP[/** @type {keyof typeof SUP} */ (s[j])], j++;
      out.push({ t: "^" }, { t: "num", v: digits });
      i = j;
    } else if (c === "^") {
      out.push({ t: "^" });
      i++;
    } else if (c === "%") {
      out.push({ t: "%" });
      i++;
    } else if ("×÷+−()".includes(c)) {
      out.push({ t: c });
      i++;
    } else if (c in OP) {
      out.push({ t: OP[c] });
      i++;
    } else return null;
  }
  return out;
}

/** @param {string} t */
function decimal(t) {
  const m = /^(\d*)(?:\.(\d+))?$/.exec(t);
  if (!m || (!m[1] && !m[2])) return null;
  const frac = m[2] || "";
  return new Rat(BigInt((m[1] || "0") + frac), 10n ** BigInt(frac.length));
}

/**
 * Parse a student answer to an exact value, or null when it is not a number or expression this module understands.
 * Grammar: sum -> product (('+'|'−') product)*; product -> power (('×'|'÷') power)*; power -> atom ('^' integer)?;
 * atom -> number ['%'] | mixed number "2 1/2" | '(' sum ')'. A mixed number is a whole number followed by a fraction.
 * @param {string} text
 * @returns {Rat | null}
 */
export function parse(text) {
  if (typeof text !== "string" || !text.trim() || text.length > 120) return null;
  const mixed = /^\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/.exec(text);
  if (mixed) {
    const d = BigInt(mixed[3]);
    return d === 0n ? null : int(mixed[1]).add(new Rat(BigInt(mixed[2]), d));
  }
  const toks = tokenize(text);
  if (!toks?.length) return null;
  let p = 0;
  const peek = () => toks[p]?.t;
  /** @returns {Rat} */
  const atom = () => {
    const k = toks[p];
    if (!k) throw new SyntaxError("end");
    if (k.t === "(") {
      p++;
      const v = sum();
      if (peek() !== ")") throw new SyntaxError("paren");
      p++;
      return v;
    }
    if (k.t === "−") {
      p++;
      return int(0).sub(atom());
    }
    if (k.t !== "num") throw new SyntaxError("num");
    p++;
    let v = decimal(/** @type {string} */ (k.v));
    if (!v) throw new SyntaxError("num");
    if (peek() === "%") {
      p++;
      v = v.div(int(100));
    }
    return v;
  };
  /** @returns {Rat} */
  const pw = () => {
    const base = atom();
    if (peek() !== "^") return base;
    p++;
    const e = toks[p];
    if (!e || e.t !== "num" || !/^\d+$/.test(/** @type {string} */ (e.v))) throw new SyntaxError("exp");
    p++;
    return base.pow(Number(e.v));
  };
  /** @returns {Rat} */
  const prod = () => {
    let v = pw();
    while (peek() === "×" || peek() === "÷") {
      const op = toks[p++].t;
      const r = pw();
      v = op === "×" ? v.mul(r) : v.div(r);
    }
    return v;
  };
  /** @returns {Rat} */
  const sum = () => {
    let v = prod();
    while (peek() === "+" || peek() === "−") {
      const op = toks[p++].t;
      const r = prod();
      v = op === "+" ? v.add(r) : v.sub(r);
    }
    return v;
  };
  try {
    const v = sum();
    return p === toks.length ? v : null;
  } catch (e) {
    if (e instanceof SyntaxError || e instanceof RangeError) return null;
    throw e;
  }
}

/** True when both answers parse and have exactly the same value. @param {string} a @param {string} b */
export function equivalent(a, b) {
  const x = parse(a);
  const y = parse(b);
  return !!x && !!y && x.eq(y);
}

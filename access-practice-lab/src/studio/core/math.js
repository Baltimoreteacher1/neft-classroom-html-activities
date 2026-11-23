// Exact math for Activity Studio: parse what a teacher or student types, evaluate expressions, compare answers.
//
// Everything is exact rational arithmetic on BigInt, so 0.75, 3/4, 75%, and "1 1/2" == 1.5 are compared as numbers,
// never as strings, and 0.1 + 0.2 equals 0.3. Pure module, no imports, no DOM: the server, the editor, the
// generators and the standalone player bundle all use it.

const VULGAR = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};
const MAX_DIGITS = 40;

const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

/** A normalized rational {n, d} (d > 0), or null when d is 0. */
export function rat(n, d = 1n) {
  n = BigInt(n);
  d = BigInt(d);
  if (d === 0n) return null;
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

export const ratAdd = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const ratSub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const ratMul = (a, b) => rat(a.n * b.n, a.d * b.d);
export const ratDiv = (a, b) => (b.n === 0n ? null : rat(a.n * b.d, a.d * b.n));
export const ratNeg = (a) => rat(-a.n, a.d);
export const ratToNumber = (a) => Number(a.n) / Number(a.d);
export const ratIsInt = (a) => a.d === 1n;
export const ratCmp = (a, b) => {
  const x = a.n * b.d;
  const y = b.n * a.d;
  return x < y ? -1 : x > y ? 1 : 0;
};

function ratPow(base, exp) {
  if (!ratIsInt(exp) || exp.n > 64n || exp.n < -64n) return null;
  let e = exp.n < 0n ? -exp.n : exp.n;
  let out = rat(1n);
  for (let i = 0n; i < e; i++) out = ratMul(out, base);
  if (exp.n < 0n) return ratDiv(rat(1n), out);
  return out;
}

const normalizeText = (text) =>
  String(text ?? "")
    .normalize("NFKC")
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/⁄/g, "/")
    .replace(/[{}]/g, "")
    .replace(/(\d)([¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, "$1 $2")
    .replace(/[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (m) => VULGAR[m])
    .trim();

function decimalToRat(whole, frac) {
  if (whole.length + frac.length > MAX_DIGITS) return null;
  return rat(BigInt(whole + frac), 10n ** BigInt(frac.length));
}

/**
 * Parse one number: integer, decimal, fraction, mixed number, percent, with optional sign and thousands commas.
 * @returns {{n: bigint, d: bigint} | null}
 */
export function parseNumber(input) {
  let s = normalizeText(input).replace(/\s+/g, " ");
  if (!s) return null;
  let percent = false;
  if (s.endsWith("%")) {
    percent = true;
    s = s.slice(0, -1).trim();
  }
  let sign = 1n;
  if (s.startsWith("-")) {
    sign = -1n;
    s = s.slice(1).trim();
  } else if (s.startsWith("+")) s = s.slice(1).trim();
  s = s.replace(/(?<=\d),(?=\d{3}(\D|$))/g, "");
  let value = null;
  let m;
  if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(s))) {
    const frac = rat(BigInt(m[2]), BigInt(m[3]));
    if (frac) value = ratAdd(rat(BigInt(m[1])), frac);
  } else if ((m = /^(\d+)\/(\d+)$/.exec(s))) value = rat(BigInt(m[1]), BigInt(m[2]));
  else if ((m = /^(\d*)\.(\d+)$/.exec(s))) value = decimalToRat(m[1] || "0", m[2]);
  else if ((m = /^(\d+)\.?$/.exec(s))) value = s.length <= MAX_DIGITS ? rat(BigInt(m[1])) : null;
  if (!value) return null;
  value = rat(value.n * sign, value.d);
  return percent ? ratDiv(value, rat(100n)) : value;
}

/**
 * Evaluate + - * / ^ and parentheses exactly. Numbers inside may be integers, decimals or a/b.
 * @returns {{n: bigint, d: bigint} | null} null for anything that is not arithmetic or divides by zero.
 */
export function evalExpr(input) {
  const src = normalizeText(input).replace(/\s+/g, "");
  if (!src || src.length > 200 || !/^[0-9+\-*/^().]+$/.test(src)) return null;
  let i = 0;
  let bad = false;
  const peek = () => src[i];
  const number = () => {
    const m = /^\d*\.?\d+|^\d+\./.exec(src.slice(i));
    if (!m) return ((bad = true), null);
    i += m[0].length;
    return parseNumber(m[0]);
  };
  const atom = () => {
    if (peek() === "(") {
      i++;
      const v = sum();
      if (peek() !== ")") return ((bad = true), null);
      i++;
      return v;
    }
    if (peek() === "-") {
      i++;
      const v = atom();
      return v && ratNeg(v);
    }
    if (peek() === "+") {
      i++;
      return atom();
    }
    return number();
  };
  const power = () => {
    const base = atom();
    if (peek() === "^") {
      i++;
      const exp = power();
      return base && exp ? ratPow(base, exp) : null;
    }
    return base;
  };
  const product = () => {
    let v = power();
    while (v && (peek() === "*" || peek() === "/")) {
      const op = src[i++];
      const r = power();
      v = r ? (op === "*" ? ratMul(v, r) : ratDiv(v, r)) : null;
    }
    return v;
  };
  function sum() {
    let v = product();
    while (v && (peek() === "+" || peek() === "-")) {
      const op = src[i++];
      const r = product();
      v = r ? (op === "+" ? ratAdd(v, r) : ratSub(v, r)) : null;
    }
    return v;
  }
  const out = sum();
  return bad || i !== src.length ? null : out;
}

/** The number a student typed, tolerating a unit word and spaces ("12 cm", "$4.50", "3 1/2"). */
export function parseAnswer(input, unit = "") {
  let s = String(input ?? "").trim();
  if (unit) {
    const u = unit.trim().toLowerCase();
    const lower = s.toLowerCase();
    if (lower.endsWith(u)) s = s.slice(0, s.length - u.length).trim();
  }
  s = s.replace(/^\$/, "").replace(/\s*(?:units?)$/i, "");
  return parseNumber(s);
}

/** True when two rationals are equal, or within `tolerance` (a plain number) of each other. */
export function ratEquals(a, b, tolerance = 0) {
  if (!a || !b) return false;
  if (!tolerance) return ratCmp(a, b) === 0;
  return Math.abs(ratToNumber(a) - ratToNumber(b)) <= tolerance + 1e-12;
}

export function ratToString(a, mode = "auto") {
  if (!a) return "";
  if (ratIsInt(a)) return a.n.toString();
  let rest = a.d;
  for (const f of [2n, 5n]) while (rest % f === 0n) rest /= f;
  const terminates = rest === 1n;
  if (mode === "fraction" || !terminates) return `${a.n}/${a.d}`;
  if (mode === "auto") return `${a.n}/${a.d}`;
  const sign = a.n < 0n ? "-" : "";
  const n = a.n < 0n ? -a.n : a.n;
  let p = 10n;
  let digits = 1;
  while (p % a.d !== 0n) {
    p *= 10n;
    digits++;
  }
  const scaled = ((n * p) / a.d).toString().padStart(digits + 1, "0");
  const cut = scaled.length - digits;
  return `${sign}${scaled.slice(0, cut)}.${scaled.slice(cut)}`;
}

// ── inline math markup ───────────────────────────────────────────────────────
// Teachers use the Math tray in the editor; it inserts this markup. {3/4} is a stacked fraction, x^2 and x^{10}
// are exponents, _{n} is a subscript. Anything else is plain text, and renderers always escape it.

const RUN = /\{(-?[^{}/\s]+)\/([^{}/\s]+)\}|\^(\{[^{}]+\}|[-+]?\w)|_\{([^{}]+)\}/g;

/** @returns {Array<{t: "text", v: string} | {t: "frac", n: string, d: string} | {t: "sup", v: string} | {t: "sub", v: string}>} */
export function mathRuns(text) {
  const s = String(text ?? "");
  const runs = [];
  let last = 0;
  for (const m of s.matchAll(RUN)) {
    if (m.index > last) runs.push({ t: "text", v: s.slice(last, m.index) });
    if (m[1] !== undefined) runs.push({ t: "frac", n: m[1], d: m[2] });
    else if (m[3] !== undefined) runs.push({ t: "sup", v: m[3].replace(/^\{|\}$/g, "") });
    else runs.push({ t: "sub", v: m[4] });
    last = m.index + m[0].length;
  }
  if (last < s.length) runs.push({ t: "text", v: s.slice(last) });
  return runs;
}

const SUP = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  "-": "⁻",
  "+": "⁺",
};

/** Markup as plain text for aria-labels, answer keys and fallbacks: {3/4} -> 3/4, x^2 -> x², _{n} -> n. */
export function plainMath(text) {
  return mathRuns(text)
    .map((r) => {
      if (r.t === "text") return r.v;
      if (r.t === "frac") return `${r.n}/${r.d}`;
      if (r.t === "sup")
        return /^[-+]?\d+$/.test(r.v) ? [...r.v].map((c) => SUP[c]).join("") : `^${r.v}`;
      return r.v;
    })
    .join("");
}

/** Spoken form for screen readers and read-aloud: {3/4} -> "3 over 4", x^2 -> "x squared". */
export function spokenMath(text) {
  return mathRuns(text)
    .map((r) => {
      if (r.t === "text")
        return r.v
          .replace(/\*|×/g, " times ")
          .replace(/÷/g, " divided by ")
          .replace(/−/g, " minus ");
      if (r.t === "frac") return ` ${r.n} over ${r.d} `;
      if (r.t === "sup")
        return r.v === "2" ? " squared " : r.v === "3" ? " cubed " : ` to the power ${r.v} `;
      return ` sub ${r.v} `;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

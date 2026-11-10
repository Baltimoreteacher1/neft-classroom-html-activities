// MathSense exact arithmetic. Every amount is { n, d }: BigInt, d > 0, lowest terms, so two amounts are equal
// exactly when their fields are equal. Floats appear only to place a pointer or to label an ARIA slider, never to
// decide a mathematical fact. Typing is parsed here too, so "0.(3)" is exactly 1/3 and "0.33" is exactly 33/100.

export const MAX_VALUE = 5n; // the workspace shows amounts from 0 up to 5 wholes
const MAX_DIGITS = 12;
const MAX_FRACTION_PART = 1000000n;
const CYCLE_SHOWN = 12;

const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

export function make(n, d = 1n) {
  n = BigInt(n);
  d = BigInt(d);
  if (d === 0n) throw new RangeError("zero denominator");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return Object.freeze({ n: n / g, d: d / g });
}

export const ZERO = make(0n);
export const ONE = make(1n);
export const cmp = (a, b) => {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
};
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const add = (a, b) => make(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => make(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => make(a.n * b.n, a.d * b.d);
export const div = (a, b) => make(a.n * b.d, a.d * b.n);
export const floor = (a) => (a.n >= 0n ? a.n / a.d : -((-a.n + a.d - 1n) / a.d));
export const ceil = (a) => -floor(make(-a.n, a.d));
export const isWhole = (a) => a.d === 1n;
export const abs = (a) => (a.n < 0n ? make(-a.n, a.d) : a);
export const isRat = (value) =>
  Boolean(value) && typeof value.n === "bigint" && typeof value.d === "bigint" && value.d > 0n;
export const inRange = (q) => q.n >= 0n && cmp(q, make(MAX_VALUE)) <= 0;
export const toNumber = (q) => Number(q.n) / Number(q.d); // display and pointer placement only
export const key = (q) => `${q.n}/${q.d}`;
export const fromKey = (text) => {
  const match = /^(\d{1,12})\/(\d{1,12})$/.exec(String(text));
  return match && BigInt(match[2]) > 0n ? make(BigInt(match[1]), BigInt(match[2])) : null;
};
export const fractionText = (q) => (q.d === 1n ? String(q.n) : `${q.n}/${q.d}`);

// Whole part and proper remainder: 7/4 -> 1 and 3/4.
export function mixed(q) {
  const whole = q.n / q.d;
  return { whole, rest: make(q.n - whole * q.d, q.d) };
}
export const mixedText = (q) => {
  const { whole, rest } = mixed(q);
  if (rest.n === 0n) return String(whole);
  return whole === 0n ? fractionText(rest) : `${whole} ${fractionText(rest)}`;
};

// Pieces form: k of `parts` equal pieces, or null when the amount does not land on that cut.
export function piecesOf(q, parts) {
  const p = BigInt(parts);
  return (q.n * p) % q.d === 0n ? (q.n * p) / q.d : null;
}

// Long division on the fractional part. A repeat of a remainder is the proof that the digits cycle.
export function decimalDigits(q, maxDigits = 140) {
  const whole = q.n / q.d;
  let rem = q.n % q.d;
  const seen = new Map();
  const digits = [];
  while (rem !== 0n && digits.length < maxDigits) {
    const remKey = String(rem);
    if (seen.has(remKey)) {
      const start = seen.get(remKey);
      return {
        whole: String(whole),
        prefix: digits.slice(0, start).join(""),
        cycle: digits.slice(start).join(""),
        cut: false,
      };
    }
    seen.set(remKey, digits.length);
    rem *= 10n;
    digits.push(String(rem / q.d));
    rem %= q.d;
  }
  return { whole: String(whole), prefix: digits.join(""), cycle: "", cut: rem !== 0n };
}

// "0.625", "0.(3)", "0.8(3)". A long block shows its first digits and says how long it is.
export function decimalText(q) {
  const { whole, prefix, cycle, cut } = decimalDigits(q);
  const shown = cycle.length > CYCLE_SHOWN ? `${cycle.slice(0, CYCLE_SHOWN)}…` : cycle;
  const body = prefix + (cycle ? `(${shown})` : cut ? "…" : "");
  return {
    text: body ? `${whole}.${body}` : whole,
    terminating: cycle === "" && !cut,
    repeats: cycle !== "",
    blockLength: cycle.length,
    prefixLength: prefix.length,
    cycle,
  };
}

export function percentText(q) {
  const info = decimalText(mulInt(q, 100n));
  return { ...info, text: `${info.text}%` };
}
const mulInt = (q, k) => make(q.n * k, q.d);

// Round half up to `places` decimals, exactly. Used only for the labelled "about" lines.
export function roundedText(q, places) {
  const scale = 10n ** BigInt(places);
  const scaled = (q.n * scale * 2n + q.d) / (2n * q.d);
  const text = scaled.toString().padStart(places + 1, "0");
  return places ? `${text.slice(0, -places)}.${text.slice(-places)}` : text;
}

// Benchmarks are quarters. Returns the benchmark it sits on, or the two it sits between.
export function benchmarkOf(q) {
  const quarters = make(q.n * 4n, q.d);
  const lo = floor(quarters);
  const loQ = make(lo, 4n);
  if (isWhole(quarters)) return { exact: loQ };
  const hiQ = make(lo + 1n, 4n);
  const middle = add(loQ, make(1n, 8n));
  const order = cmp(q, middle);
  return { lo: loQ, hi: hiQ, closer: order < 0 ? "lo" : order > 0 ? "hi" : "middle" };
}

// ---- Typed input -------------------------------------------------------------------------------------------
const OVERLINE = "̅";
const fail = (code) => ({ ok: false, code });
const digitsToBig = (text) => BigInt(text === "" ? "0" : text);

function parseDecimal(text) {
  // whole . prefix (cycle)    or    whole . prefix with an overline above the repeating digits
  const overlined = /^(\d*)[.,](\d*)((?:\d̅)+)$/.exec(text);
  const bracket = /^(\d*)[.,](\d*)\((\d+)\)$/.exec(text);
  const plain = /^(\d*)(?:[.,](\d*))?$/.exec(text);
  if (overlined || bracket) {
    const [, whole, prefix, rawCycle] = overlined || bracket;
    const cycle = rawCycle.replaceAll(OVERLINE, "");
    if (whole.length + prefix.length + cycle.length > MAX_DIGITS) return fail("toolong");
    const full = digitsToBig(prefix + cycle);
    const head = digitsToBig(prefix);
    const denominator = 10n ** BigInt(prefix.length) * (10n ** BigInt(cycle.length) - 1n);
    return {
      value: add(make(digitsToBig(whole)), make(full - head, denominator)),
      form: "decimal",
      repeating: true,
    };
  }
  if (!plain || (plain[1] === "" && !plain[2])) return fail("format");
  const [, whole, fraction = ""] = plain;
  if (whole.length + fraction.length > MAX_DIGITS) return fail("toolong");
  const value = make(digitsToBig(whole + fraction), 10n ** BigInt(fraction.length));
  return { value, form: /[.,]/.test(text) ? "decimal" : "integer", repeating: false };
}

// Accepts "3/4", "1 3/4", "0.75", ".75", "0,75", "0.(3)", "0.3̅", "75%", "33.(3)%", "2". Returns { ok, value, form }
// or { ok:false, code } with code in: empty, ellipsis, negative, format, zero, toolong, range.
export function parse(raw) {
  const text = String(raw ?? "")
    .normalize("NFKC")
    .replace(/−/g, "-")
    .trim();
  if (!text) return fail("empty");
  if (/\.\.\.|…/.test(text)) return fail("ellipsis");
  if (text.startsWith("-")) return fail("negative");
  let result;
  const percent = /^(.*?)\s*%$/.exec(text);
  const mixedMatch = /^(\d+)[\s-]+(\d+)\s*\/\s*(\d+)$/.exec(text);
  const fraction = /^(\d+)\s*\/\s*(\d+)$/.exec(text);
  if (percent) {
    const inner = parseDecimal(percent[1].trim());
    if (!inner.value) return inner;
    result = { value: div(inner.value, make(100n)), form: "percent", repeating: inner.repeating };
  } else if (mixedMatch || fraction) {
    const parts = (mixedMatch || fraction).slice(1).map(BigInt);
    const [whole, n, d] = mixedMatch ? parts : [0n, ...parts];
    if (d === 0n) return fail("zero");
    if (n > MAX_FRACTION_PART || d > MAX_FRACTION_PART || whole > MAX_FRACTION_PART)
      return fail("toolong");
    if (mixedMatch && n >= d) return fail("format");
    result = {
      value: make(whole * d + n, d),
      form: mixedMatch ? "mixed" : "fraction",
      repeating: false,
    };
  } else {
    result = parseDecimal(text);
    if (!result.value) return result;
  }
  return inRange(result.value) ? { ok: true, ...result } : fail("range");
}

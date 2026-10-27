// Exact rational arithmetic on safe integers. Game generators and the independent test oracles both use exact
// fractions so decimals, percents and equivalences never depend on floating point. @fm2 FM-052 FM-053 FM-054 FM-055
const safe = (n) => {
  if (!Number.isSafeInteger(n)) throw new RangeError("Rational overflow");
  return n;
};

export const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
};
export const lcm = (a, b) => safe(Math.abs(a * b) / gcd(a, b));

export function frac(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new RangeError("A fraction needs integer parts and a nonzero denominator.");
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { n: safe((sign * n) / g), d: Math.abs(d / g) };
}

export const add = (a, b) => frac(safe(a.n * b.d + b.n * a.d), safe(a.d * b.d));
export const sub = (a, b) => frac(safe(a.n * b.d - b.n * a.d), safe(a.d * b.d));
export const mul = (a, b) => frac(safe(a.n * b.n), safe(a.d * b.d));
export const div = (a, b) => {
  if (b.n === 0) throw new RangeError("Division by zero");
  return frac(safe(a.n * b.d), safe(a.d * b.n));
};
export const neg = (a) => frac(-a.n, a.d);
export const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const isInt = (a) => a.d === 1;
export const toNumber = (a) => a.n / a.d;

// "0.75" -> 3/4, "-2.5" -> -5/2, "12" -> 12. Returns null for anything that is not a plain decimal.
export function fromDecimal(text) {
  const match = /^([+-]?)(\d*)(?:\.(\d+))?$/.exec(String(text).trim().replaceAll("−", "-"));
  if (!match || (match[2] === "" && match[3] === undefined)) return null;
  const places = (match[3] || "").length;
  if (places > 9) return null;
  const digits = Number(`${match[2] || "0"}${match[3] || ""}`);
  return frac(match[1] === "-" ? -digits : digits, 10 ** places);
}

// Learner-typed values: "3/4", "1 1/2", "0.75", "75%", "-2", "−3/5". Returns a fraction or null.
export function parse(text) {
  const raw = String(text).trim().replaceAll("−", "-").replace(/\s+/g, " ");
  if (!raw) return null;
  if (raw.endsWith("%")) {
    const base = parse(raw.slice(0, -1));
    return base ? div(base, frac(100)) : null;
  }
  const mixed = /^([+-]?)(\d+) (\d+)\/(\d+)$/.exec(raw);
  if (mixed) {
    if (Number(mixed[4]) === 0) return null;
    const whole = frac(Number(mixed[2]));
    const part = frac(Number(mixed[3]), Number(mixed[4]));
    const total = add(whole, part);
    return mixed[1] === "-" ? neg(total) : total;
  }
  const simple = /^([+-]?\d+)\/([+-]?\d+)$/.exec(raw);
  if (simple) return Number(simple[2]) === 0 ? null : frac(Number(simple[1]), Number(simple[2]));
  return fromDecimal(raw);
}

export const toString = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);

export function toMixedString(a) {
  if (a.d === 1 || Math.abs(a.n) < a.d) return toString(a);
  const whole = Math.trunc(a.n / a.d);
  return `${whole} ${Math.abs(a.n) % a.d}/${a.d}`;
}

// Exact decimal text when the fraction terminates (denominator only 2s and 5s), otherwise null.
export function toDecimalString(a, maxPlaces = 9) {
  let d = a.d;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) { d /= 2; twos += 1; }
  while (d % 5 === 0) { d /= 5; fives += 1; }
  if (d !== 1) return null;
  const places = Math.max(twos, fives);
  if (places > maxPlaces) return null;
  const scaled = safe(Math.abs(a.n) * (10 ** places / a.d));
  const text = String(scaled).padStart(places + 1, "0");
  const body = places ? `${text.slice(0, -places)}.${text.slice(-places)}` : text;
  return a.n < 0 ? `-${body}` : body;
}

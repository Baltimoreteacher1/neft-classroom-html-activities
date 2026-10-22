// Shared helpers for the worked-solution templates (mistake-templates*.js).
export const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = (rng, list) => list[Math.floor(rng() * list.length)];
export const neg = (v) => (v < 0 ? `−${-v}` : String(v));
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const round = (v) => Number(v.toFixed(8));
export const key = (v) => (typeof v === "number" ? String(round(v)) : String(v));
export const repeat = (v, times, sign = "×") => Array.from({ length: times }, () => v).join(` ${sign} `);

// Two wrong repairs: candidates are [text, value]; none may match the right value or the slip's value.
export function near(candidates, ...avoid) {
  const seen = new Set(avoid.map(key));
  const out = [];
  for (const [text, value] of candidates) {
    if (seen.has(key(value))) continue;
    seen.add(key(value));
    out.push(text);
    if (out.length === 2) break;
  }
  if (out.length < 2) throw new Error("Not enough distinct wrong repairs");
  return out;
}

// Split n into two parts for the distributive property: tens and ones when it has both, otherwise any two parts.
export function split(rng, n) {
  if (n >= 20 && n % 10 !== 0) return [n - (n % 10), n % 10];
  if (n >= 20) return [n - 10, 10];
  if (n >= 11) return [10, n - 10];
  const q = int(rng, 1, n === 10 ? 5 : n - 3);
  return [n - q, q];
}

export const wholeSize = (grade, config) => ({
  lo: Math.max(10, config.min ?? 10),
  hi: config.max ?? (grade <= 2 ? 99 : grade === 3 ? 499 : 9999),
  cap: config.maxResult ?? Infinity,
});
export const fraction = (n, d) => n / d;

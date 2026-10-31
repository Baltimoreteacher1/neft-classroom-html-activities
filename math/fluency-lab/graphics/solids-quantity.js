// Exact quantities for surface area and volume: a sum of terms c * pi^p * sqrt(r), with c rational and r squarefree.
// Examples: 54, 12 pi, 16 + 8 sqrt(5), 6 pi sqrt(5). Like terms are always combined, so equality is structural.
import { ZERO, add, eq, mul, rat } from "./b-rational.js";

export function sqrtParts(n) {
  let k = 1;
  let r = n;
  for (let f = 2; f * f <= r; f += 1)
    while (r % (f * f) === 0) {
      r /= f * f;
      k *= f;
    }
  return { k, r };
}

const key = (p, r) => `${p}|${r}`;
function normalize(terms) {
  const map = new Map();
  for (const { c, p, r } of terms) {
    const id = key(p, r);
    map.set(id, add(map.get(id) ?? ZERO, c));
  }
  return [...map]
    .map(([id, c]) => ({ c, p: Number(id.split("|")[0]), r: Number(id.split("|")[1]) }))
    .filter((term) => term.c.n !== 0)
    .sort((a, b) => a.p - b.p || a.r - b.r);
}

export const q = (value) => normalize([{ c: value, p: 0, r: 1 }]);
export const qPi = (value) => normalize([{ c: value, p: 1, r: 1 }]);
export const qAdd = (...parts) => normalize(parts.flat());
export const qScale = (a, k) => normalize(a.map((t) => ({ ...t, c: mul(t.c, k) })));
export function qMul(a, b) {
  const out = [];
  for (const x of a)
    for (const y of b) {
      const { k, r } = sqrtParts(x.r * y.r);
      out.push({ c: mul(mul(x.c, y.c), rat(k)), p: x.p + y.p, r });
    }
  return normalize(out);
}
// sqrt of a non-negative rational n/d = sqrt(n d) / d, as a quantity.
export function qSqrt(value) {
  const { k, r } = sqrtParts(value.n * value.d);
  return normalize([{ c: rat(k, value.d), p: 0, r }]);
}
export const qEq = (a, b) =>
  a.length === b.length && a.every((t, i) => t.p === b[i].p && t.r === b[i].r && eq(t.c, b[i].c));
export const qIsRational = (a) => a.every((t) => t.p === 0 && t.r === 1);
export const qNumber = (a) =>
  a.reduce((sum, t) => sum + (t.c.n / t.c.d) * Math.PI ** t.p * Math.sqrt(t.r), 0);

const coef = (c, bare) => {
  const abs = Math.abs(c.n);
  if (c.d === 1) return abs === 1 && !bare ? "" : String(abs);
  return bare ? `${abs}/${c.d}` : `(${abs}/${c.d})`;
};
export function qText(a) {
  if (!a.length) return "0";
  let out = "";
  a.forEach((t, i) => {
    const bare = t.p === 0 && t.r === 1;
    const body = `${coef(t.c, bare)}${t.p ? "π" : ""}${t.r > 1 ? `√${t.r}` : ""}`;
    out += i === 0 ? `${t.c.n < 0 ? "−" : ""}${body}` : ` ${t.c.n < 0 ? "−" : "+"} ${body}`;
  });
  return out;
}
export const qApprox = (a) => (qIsRational(a) ? "" : ` ≈ ${qNumber(a).toFixed(2)}`);

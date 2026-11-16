// Fraction Food Truck — the mathematics. Pure functions, no DOM.
// Lessons 6-1 / 6-2 (division expressions with fractions and mixed numbers),
// 6-9 (divide whole numbers by fractions), 6-10 (divide mixed numbers),
// 6-11 (fraction division problem solving). Exact fractions { n, d } only.

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
export const F = (n, d = 1) => {
  const g = gcd(n, d) * (d < 0 ? -1 : 1);
  return { n: n / g, d: d / g };
};
export const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => F(a.n * b.n, a.d * b.d);
export const div = (a, b) => F(a.n * b.d, a.d * b.n);
export const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
export const eq = (a, b) => cmp(a, b) === 0;
export const min = (a, b) => (cmp(a, b) <= 0 ? a : b);
export const isZero = (a) => a.n === 0;

/** "3/4", "2", "2 1/4" (mixed when asked and improper). */
export function text(f, mixed = true) {
  if (f.d === 1) return String(f.n);
  if (mixed && Math.abs(f.n) > f.d) {
    const w = Math.trunc(f.n / f.d);
    return `${w} ${Math.abs(f.n) % f.d}/${f.d}`;
  }
  return `${f.n}/${f.d}`;
}

/** Whole number of portions of size p in t, and what is left. */
export function portions(t, p) {
  const q = div(t, p);
  const whole = Math.floor(q.n / q.d);
  return { whole, left: sub(t, mul(F(whole), p)) };
}

/**
 * Serve `count` servings of size `p` from a batch `t`: what each serving gets,
 * in order (a serving the batch cannot fill gets what is left, maybe nothing),
 * and what stays in the pot.
 */
export function serveCount(t, p, count) {
  let rest = t;
  const got = [];
  for (let i = 0; i < count; i++) {
    const g = min(p, rest);
    got.push(g);
    rest = sub(rest, g);
  }
  return { got, rest };
}

/** Share a batch t on `plates` plates at `each` per plate (same report). */
export function serveShare(t, each, plates) {
  return serveCount(t, each, plates);
}

/** Which slip a wrong answer is, in the site's misconception vocabulary. */
export function slipOf(order, answer) {
  const right =
    order.kind === "share" ? div(order.total, F(order.plates)) : div(order.total, order.portion);
  if (eq(answer, right)) return undefined;
  const divisor = order.kind === "share" ? F(order.plates) : order.portion;
  if (eq(answer, mul(order.total, divisor))) return "fraction-no-reciprocal";
  if (eq(answer, div(divisor, order.total))) return "op-reversed-division";
  return undefined;
}

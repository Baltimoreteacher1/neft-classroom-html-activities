/**
 * Independent oracle for the Project Studio feedback engine.
 *
 * Recomputes every check of the five v2 families with exact rational arithmetic (scripts/lib/rational.mjs)
 * and shares NO code with curriculum/projects/studio/math.mjs, so an engine that drifts or is mutated
 * disagrees with it. Used by tools/project-studio-feedback.test.mjs and the Studio browser gate.
 */
import { Rat } from "../../scripts/lib/rational.mjs";

const R = (x) => (x instanceof Rat ? x : Rat.fromDecimal(String(x).trim()));
const ZERO = R(0);
const floorRat = (r) => {
  let q = r.n / r.d;
  if (r.n < 0n && r.n % r.d !== 0n) q -= 1n;
  return R(q.toString());
};
const ceilRat = (r) => (r.isInt() ? r : floorRat(r).add(R(1)));
const abs = (r) => (r.n < 0n ? r.neg() : r);
const sumRat = (xs) => xs.reduce((t, x) => t.add(x), ZERO);
const medianRat = (xs) =>
  xs.length % 2 ? xs[(xs.length - 1) / 2] : xs[xs.length / 2 - 1].add(xs[xs.length / 2]).div(R(2));
const cmp = (x, y) => {
  const d = x.sub(y);
  return d.n < 0n ? -1 : d.n > 0n ? 1 : 0;
};
const roundCents = (r) => floorRat(r.mul(R(100)).add(R("0.5"))).div(R(100));

/** @returns {{id: string, answer: Rat}[]} in the order the Studio shows the six checks. */
export function oracle(subject, design) {
  const family = typeof subject === "string" ? subject : subject.family;
  const open = typeof subject === "object" && subject.id === "unit-10-b";
  const v = (k) => R(design[k]);
  switch (family) {
    case "division": {
      const [a, b, c, d, e, f] = ["a", "b", "c", "d", "e", "f"].map(v);
      const groups = ceilRat(a.div(b));
      const remainder = a.sub(floorRat(a.div(b)).mul(b));
      const packs = floorRat(c.div(d));
      const pieces = floorRat(e.div(f));
      return [
        { id: "groups", answer: groups },
        { id: "remainder", answer: remainder },
        { id: "packs", answer: packs },
        { id: "money", answer: c.sub(packs.mul(d)) },
        { id: "quotient", answer: e.div(f) },
        { id: "leftover", answer: e.sub(pieces.mul(f)) },
      ];
    }
    case "statistics": {
      const data = String(design.data).split(",").map(R).sort(cmp);
      const n = BigInt(data.length);
      const mean = sumRat(data).div(R(n.toString()));
      const mid = Math.floor(data.length / 2);
      const lower = data.slice(0, mid);
      const upper = data.slice(data.length % 2 ? mid + 1 : mid);
      const q1 = medianRat(lower);
      return [
        { id: "mean", answer: mean },
        { id: "median", answer: medianRat(data) },
        { id: "range", answer: data.at(-1).sub(data[0]) },
        { id: "mad", answer: sumRat(data.map((x) => abs(x.sub(mean)))).div(R(n.toString())) },
        { id: "q1", answer: q1 },
        { id: "iqr", answer: medianRat(upper).sub(q1) },
      ];
    }
    case "ratio": {
      const [a, b, c, d, e, f, g] = ["a", "b", "c", "d", "e", "f", "g"].map(v);
      return [
        { id: "scale-a", answer: a.mul(c) },
        { id: "scale-b", answer: b.mul(c) },
        { id: "base-rate", answer: a.div(b) },
        { id: "rate-a", answer: d.div(e) },
        { id: "rate-b", answer: f.div(g) },
        { id: "difference", answer: abs(d.div(e).sub(f.div(g))) },
      ];
    }
    case "percent": {
      const [a, b, c, d] = ["a", "b", "c", "d"].map(v);
      const discount = a.mul(b).div(R(100));
      const sale = a.sub(discount);
      const tax = roundCents(sale.mul(c).div(R(100)));
      const total = roundCents(sale.add(tax)); // the prompt says: round the receipt total to cents
      return [
        { id: "decimal", answer: b.div(R(100)) },
        { id: "discount", answer: discount },
        { id: "sale", answer: sale },
        { id: "tax", answer: tax },
        { id: "total", answer: total },
        { id: "budget", answer: d.sub(total) },
      ];
    }
    case "expressions": {
      const [a, b, c, d] = ["a", "b", "c", "d"].map(v);
      const sq = d.mul(d);
      return [
        { id: "square", answer: sq },
        { id: "inside", answer: c.add(b) },
        { id: "value", answer: a.mul(c.add(b)).add(sq) },
        { id: "coefficient", answer: a },
        { id: "constant", answer: a.mul(b).add(sq) },
        { id: "new-input", answer: a.mul(c.add(R(1)).add(b)).add(sq) },
      ];
    }
    case "area": {
      const [a, b, c, d, e, f, g, h] = ["a", "b", "c", "d", "e", "f", "g", "h"].map(v);
      const rect = a.mul(b),
        tri = c.mul(d).div(R(2));
      return [
        { id: "rectangle", answer: rect },
        { id: "triangle", answer: tri },
        { id: "composite", answer: rect.add(tri) },
        { id: "floor-cost", answer: rect.add(tri).mul(e) },
        { id: "volume", answer: f.mul(g).mul(h) },
        { id: "surface", answer: R(2).mul(f.mul(g).add(f.mul(h)).add(g.mul(h))) },
      ];
    }
    case "coordinates": {
      const [a, b, c] = ["a", "b", "c"].map(v);
      return [
        { id: "distance", answer: abs(c.sub(a)) },
        { id: "a-zero", answer: abs(a) },
        { id: "reflect-x", answer: a.neg() },
        { id: "reflect-y", answer: b.neg() },
        { id: "opposite", answer: R(2).mul(abs(b)) },
        { id: "compare", answer: cmp(a, c) >= 0 ? a : c },
      ];
    }
    case "equations": {
      const [a, b, c] = ["a", "b", "c"].map(v);
      return [
        { id: "addition", answer: a },
        { id: "multiplication", answer: a },
        { id: "substitution", answer: a.add(b) },
        { id: "boundary", answer: a },
        { id: "strict", answer: a.add(R(1)) },
        { id: "difference", answer: c },
      ];
    }
    case "relationships": {
      const [a, b, c] = ["a", "b", "c"].map(v);
      const y = (x) => a.mul(x).add(b);
      return [
        { id: "zero", answer: y(ZERO) },
        { id: "one", answer: y(R(1)) },
        { id: "two", answer: y(R(2)) },
        { id: "target", answer: y(c) },
        { id: "increase", answer: y(R(1)).sub(y(ZERO)) },
        { id: "delta", answer: y(c).sub(y(R(2))) },
      ];
    }
    case "solids": {
      const [a, b, c, d, e] = ["a", "b", "c", "d", "e"].map(v);
      const floor = a.mul(b),
        vol = floor.mul(c);
      const surface = (open ? floor : R(2).mul(floor))
        .add(R(2).mul(a).mul(c))
        .add(R(2).mul(b).mul(c));
      return [
        { id: "floor", answer: floor },
        { id: "volume", answer: vol },
        { id: "pair", answer: R(2).mul(a).mul(c) },
        { id: "surface", answer: surface },
        { id: "cost", answer: surface.mul(d) },
        { id: "capacity", answer: vol.sub(e) },
      ];
    }
    case "discovery": {
      const [a, b, c] = ["a", "b", "c"].map(v);
      const count = (n) => n.mul(a).add(b);
      return [
        { id: "one", answer: count(R(1)) },
        { id: "two", answer: count(R(2)) },
        { id: "three", answer: count(R(3)) },
        { id: "target", answer: count(c) },
        { id: "change", answer: count(R(2)).sub(count(R(1))) },
        { id: "repair", answer: a.mul(c.add(b)) },
      ];
    }
    case "synthesis": {
      const [a, b, c, d, e, f] = ["a", "b", "c", "d", "e", "f"].map(v);
      const area = a.mul(b),
        subtotal = area.mul(c),
        discount = subtotal.mul(d).div(R(100));
      const materials = subtotal.sub(discount);
      return [
        { id: "area", answer: area },
        { id: "subtotal", answer: subtotal },
        { id: "discount", answer: discount },
        { id: "materials", answer: materials },
        { id: "total", answer: materials.add(e.mul(f)) },
        { id: "extra", answer: R(10).mul(e) },
      ];
    }
    default:
      throw new Error(`No oracle for family ${family}`);
  }
}

/** Text to type into an answer box: exact when the decimal terminates, else three decimals. */
export function answerText(rat) {
  if (rat.isInt()) return rat.n.toString();
  let d = rat.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  if (d === 1n) {
    for (let places = 1; places <= 6; places++) {
      const scaled = rat.mul(R((10n ** BigInt(places)).toString()));
      if (scaled.isInt()) {
        const s = scaled.n.toString().padStart(places + 1, "0");
        return `${s.slice(0, -places)}.${s.slice(-places)}`;
      }
    }
  }
  return (Math.round(rat.toNumber() * 1000) / 1000).toString();
}

export const toNumber = (rat) => rat.toNumber();
export { abs as absRat, ceilRat, floorRat, medianRat, R as rat, roundCents };

/** Detector: engine checks vs oracle. Returns a list of human-readable disagreements (empty = agree). */
export function disagreements(engineChecks, expected, label = "") {
  const out = [];
  if (engineChecks.length !== expected.length)
    out.push(`${label} check count ${engineChecks.length} vs ${expected.length}`);
  for (const want of expected) {
    const got = engineChecks.find((q) => q.id === want.id);
    if (!got) out.push(`${label} missing check ${want.id}`);
    else if (
      Math.abs(got.answer - want.answer.toNumber()) >
      1e-9 * Math.max(1, Math.abs(got.answer))
    )
      out.push(`${label} ${want.id}: engine ${got.answer} vs exact ${want.answer}`);
  }
  return out;
}

/** Detector: does text contain a number equal to `value` that is not an allowed (given or student) number? */
export function leaksValue(text, value, allowed = []) {
  const tokens = [
    ...String(text)
      .replaceAll(",", "")
      .matchAll(/-?\d+(?:\.\d+)?/g),
  ].map((m) => Number(m[0]));
  const near = (x, y) => Math.abs(x - y) < 0.0051;
  if (allowed.some((x) => near(Math.abs(x), Math.abs(value)))) return false;
  return tokens.some((t) => near(t, value) || near(Math.abs(t), Math.abs(value)));
}

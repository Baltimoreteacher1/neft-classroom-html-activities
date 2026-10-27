// Pure model of the Fraction Kitchen: partitions of a shape, measuring-cup levels, scoops and place-value scoops.
// Everything is exact rational arithmetic; the checks, the rounds and the interface all read the same functions.
// @fm2 FM-052 FM-053 FM-054 FM-059
import { evenCuts, sizesOf } from "../../art/fractions.js";
import { add, cmp, eq, frac, sub, toNumber } from "../../rational.js";

export { evenCuts, sizesOf };

export const MAX_PARTS = 12;
export const GRID = 12; // slide-able cuts live on twelfths
export const MAX_SCOOPS = 24;
export const PLACE_UNITS = [frac(1), frac(1, 10), frac(1, 100), frac(1, 1000)];

export const isFrac = (x) =>
  Boolean(x) && Number.isInteger(x.n) && Number.isInteger(x.d) && x.d > 0;
export const fkey = (x) => `${x.n}/${x.d}`;
export const fromKey = (text) => {
  const [n, d] = String(text).split("/").map(Number);
  return frac(n, d || 1);
};

// ---- partitions (pizza / bar) --------------------------------------------------------------------------------

// A learner's shape: strictly increasing cuts inside (0, 1) and one served flag per piece, whole by whole.
export function cleanShape(response, wholes = 1) {
  if (!response || !Array.isArray(response.cuts) || response.cuts.length > MAX_PARTS - 1)
    return null;
  if (!response.cuts.every(isFrac)) return null;
  const cuts = response.cuts.map((c) => frac(c.n, c.d));
  let previous = frac(0);
  for (const cut of cuts) {
    if (cmp(cut, previous) <= 0 || cmp(cut, frac(1)) >= 0) return null;
    previous = cut;
  }
  const total = (cuts.length + 1) * wholes;
  const served = Array.from({ length: total }, (_, i) => Boolean(response.served?.[i]));
  return { cuts, served };
}

export const partCount = (cuts) => cuts.length + 1;
export const isEqualSplit = (cuts) => {
  const sizes = sizesOf(cuts);
  return sizes.every((size) => eq(size, sizes[0]));
};
export const servedCount = (served) => served.filter(Boolean).length;

export function servedValue(cuts, served) {
  const sizes = sizesOf(cuts);
  return served.reduce((sum, on, i) => (on ? add(sum, sizes[i % sizes.length]) : sum), frac(0));
}

export function recut(parts, wholes = 1) {
  return { cuts: evenCuts(parts), served: Array(parts * wholes).fill(false) };
}

export const onGrid = (cuts) => cuts.every((c) => GRID % c.d === 0);

// Move one cut a twelfth earlier (dir -1) or later (+1); it may not touch a neighbouring cut or an end.
export function slide(shape, index, dir) {
  const step = frac(1, GRID);
  const moved = add(shape.cuts[index], dir > 0 ? step : frac(-1, GRID));
  const before = index === 0 ? frac(0) : shape.cuts[index - 1];
  const after = index === shape.cuts.length - 1 ? frac(1) : shape.cuts[index + 1];
  if (cmp(moved, add(before, step)) < 0 || cmp(moved, sub(after, step)) > 0) return null;
  const cuts = shape.cuts.map((c, i) => (i === index ? moved : c));
  return { cuts, served: [...shape.served] };
}

// Remove cut `index`, merging the two pieces beside it. A joined piece is served only if both halves were.
export function join(shape, index, wholes = 1) {
  const parts = shape.cuts.length + 1;
  const cuts = shape.cuts.filter((_, i) => i !== index);
  const served = [];
  for (let w = 0; w < wholes; w += 1) {
    for (let i = 0; i < parts; i += 1) {
      const on = shape.served[w * parts + i];
      if (i === index) served.push(on && shape.served[w * parts + i + 1]);
      else if (i !== index + 1) served.push(on);
    }
  }
  return { cuts, served };
}

// True when every served piece lies inside the region from 0 to `base`.
export function insideBase(shape, base) {
  const edges = [frac(0), ...shape.cuts, frac(1)];
  const parts = shape.cuts.length + 1;
  return shape.served.every((on, i) => !on || cmp(edges[(i % parts) + 1], base) <= 0);
}

// ---- measuring cups and number-line strips --------------------------------------------------------------

export function cleanMeasure(response, round) {
  if (!response || !Number.isInteger(response.ticks) || !Number.isInteger(response.steps))
    return null;
  const allowed = round.ticksOptions.includes(response.ticks);
  const low = round.lo * response.ticks;
  const high = round.hi * response.ticks;
  if (!allowed || response.steps < low || response.steps > high) return null;
  return { ticks: response.ticks, steps: response.steps, verdict: response.verdict ?? null };
}

export const levelOf = (m) => frac(m.steps, m.ticks);
// Where a marker or liquid level begins: the fill line (0), or the left end of a strip that starts above 0.
export const markerStart = (round) => frac(round.lo > 0 ? round.lo : 0);

// ---- scoops and pitchers -------------------------------------------------------------------------------------

export function cleanScoops(response) {
  if (!response || !Array.isArray(response.scoops) || response.scoops.length > MAX_SCOOPS)
    return null;
  if (!response.scoops.every(isFrac)) return null;
  return response.scoops.map((s) => frac(s.n, s.d));
}

export const totalOf = (scoops) => scoops.reduce((sum, s) => add(sum, s), frac(0));

export function groupScoops(scoops) {
  const groups = [];
  for (const size of [...scoops].sort((a, b) => cmp(b, a))) {
    const found = groups.find((g) => eq(g.size, size));
    if (found) found.count += 1;
    else groups.push({ size, count: 1 });
  }
  return groups;
}

// ---- place-value scoops (ones, tenths, hundredths, thousandths) ---------------------------------------------

export function cleanPlace(response) {
  const digits = response?.digits;
  if (!Array.isArray(digits) || digits.length !== 4) return null;
  if (!digits.every((d) => Number.isInteger(d) && d >= 0 && d <= 9)) return null;
  return {
    digits,
    never: Boolean(response.never),
    block: typeof response.block === "string" ? response.block : null,
  };
}

export const placeValue = (digits) =>
  digits.reduce((sum, d, i) => add(sum, frac(d * PLACE_UNITS[i].n, PLACE_UNITS[i].d)), frac(0));

// Long division of a non-negative fraction: { whole, lead, rep } where rep is the repeating block ("" if it ends).
export function decimalParts(x) {
  const whole = Math.floor(x.n / x.d);
  let remainder = x.n % x.d;
  const seen = new Map();
  const digits = [];
  while (remainder !== 0 && !seen.has(remainder)) {
    seen.set(remainder, digits.length);
    remainder *= 10;
    digits.push(Math.floor(remainder / x.d));
    remainder %= x.d;
  }
  if (remainder === 0) return { whole, lead: digits.join(""), rep: "" };
  const at = seen.get(remainder);
  return { whole, lead: digits.slice(0, at).join(""), rep: digits.slice(at).join("") };
}

export const decimalText = (parts) =>
  `${parts.whole}${parts.lead || parts.rep ? "." : ""}${parts.lead}${parts.rep ? `(${parts.rep})` : ""}`;
export const isTerminating = (x) => decimalParts(x).rep === "";
export const places = (x) => decimalParts(x).lead.length;

const SUP = {
  "-": "⁻",
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
};
export const sup = (n) => [...String(n)].map((c) => SUP[c]).join("");
export const sci = (term) => `${term.m} × 10${sup(term.e)}`;
export const sciValue = (term) => {
  const [whole, decimals = ""] = term.m.split(".");
  const digits = Number(`${whole}${decimals}`);
  const power = term.e - decimals.length;
  return power >= 0 ? frac(digits * 10 ** power) : frac(digits, 10 ** -power);
};

export const approx = (x) => Math.round(toNumber(x) * 1e6) / 1e6;

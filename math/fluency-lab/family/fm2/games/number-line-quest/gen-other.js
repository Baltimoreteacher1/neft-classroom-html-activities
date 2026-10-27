// ROUND, ORDER and ZOOM generators. ROUND: drop the marker on a value between two benchmarks, then pick the nearer one.
// ORDER: several markers must end up in the right left-to-right order. ZOOM: choose the stretch, zoom, place a decimal.
// @fm2 FM-012 FM-054 FM-055 FM-060
import { add, cmp, div, frac, mul, sub } from "../../rational.js";
import { int, pick, shuffle } from "../../rng.js";
import { makePrompt, tolSentence, UNIT } from "./copy.js";
import { showNum } from "./format.js";
import { absF, floorOf, gridCount } from "./geometry.js";
import { F, labelsBy, tolText } from "./place-round.js";

const lowest = (a, b) => (cmp(a, b) <= 0 ? a : b);

function roundRound(o) {
  const { lo, hi, value, step, ticks, unit, mode, level, skill, places } = o;
  const span = sub(hi, lo);
  const mid = add(lo, div(span, frac(2)));
  const room = lowest(div(span, frac(20)), div(absF(sub(value, mid)), frac(2)));
  const tol = mul(step, frac(floorOf(div(room, step))));
  return {
    skill,
    level,
    kind: "round",
    family: "round",
    line: { min: lo, max: hi, step, ticks, labels: level === 1 ? [lo, mid, hi] : [lo, hi] },
    mode,
    lo,
    hi,
    value,
    start: cmp(sub(value, lo), sub(hi, value)) < 0 ? hi : lo,
    tol,
    detail: { unit },
    marks: [],
    traps: [],
    prompt: makePrompt(
      "round",
      { v: showNum(value, mode, places), unit: UNIT[unit], lo: showNum(lo, mode, o.benchPlaces ?? places), hi: showNum(hi, mode, o.benchPlaces ?? places) },
      tolSentence(tolText(tol, mode)),
    ),
  };
}

export function g3Round(rng, level) {
  const base = level === 3 ? 100 : 10;
  let value = 0;
  while (value % base === 0 || value % base === base / 2) value = level === 1 ? int(rng, 11, 99) : int(rng, 101, 999);
  const lo = Math.floor(value / base) * base;
  return roundRound({ skill: "g3-round-nearest", level, mode: "int", unit: level === 3 ? "hundred" : "ten", lo: F(lo), hi: F(lo + base), value: F(value), step: F(1), ticks: F(base / 10), places: 0 });
}

// Rounds to the nearest whole, tenth or hundredth. The value always has one more place than the rounding place (two for
// wholes), is never exactly halfway, and the line spans just the two benchmarks.
export function g5Round(rng, level) {
  const den = 10 ** (level - 1);
  const fine = level === 3 ? 1000 : 100;
  const parts = fine / den;
  const lo = frac(int(rng, 1, 9) * den + (level === 1 ? 0 : int(rng, 0, den - 1)), den);
  let k = parts / 2;
  while (k === parts / 2) k = int(rng, 1, parts - 1);
  return roundRound({
    skill: "g5-round-decimals",
    level,
    mode: "dec",
    unit: ["whole", "tenth", "hundredth"][level - 1],
    lo,
    hi: add(lo, frac(1, den)),
    value: add(lo, frac(k, fine)),
    step: frac(1, fine),
    ticks: frac(1, den * 10),
    places: level === 3 ? 3 : 2,
    benchPlaces: level - 1,
  });
}

// ---- ORDER ----------------------------------------------------------------------------------------------------------
const bucket = (v, per) => floorOf(mul(v, frac(per)));

const ascending = (list) => list.every((v, i) => i === 0 || cmp(list[i - 1], v) < 0);

function orderRound(o) {
  const { rng, skill, level, line, mode, values } = o;
  const count = gridCount(line.min, line.max, line.step);
  let shown = shuffle(rng, values);
  for (let tries = 0; tries < 20 && ascending(shown); tries += 1) shown = shuffle(rng, values);
  if (ascending(shown)) shown = [...shown].reverse();
  const slots = shown.map((_, j) => Math.round(((j + 1) * count) / (shown.length + 1)));
  const rankOf = (i) => shown.filter((v) => cmp(v, shown[i]) < 0).length;
  const inOrder = (assign) => assign.every((slot, i) => slot === slots[rankOf(i)]);
  let assign = shuffle(rng, slots);
  for (let tries = 0; tries < 20 && inOrder(assign); tries += 1) assign = shuffle(rng, slots);
  if (inOrder(assign)) assign = shown.map((_, i) => slots[shown.length - 1 - rankOf(i)]);
  const items = shown.map((v) => ({ v, text: o.texts(v) }));
  return {
    skill,
    level,
    kind: "order",
    family: "order",
    line,
    mode,
    items,
    starts: assign.map((k) => add(line.min, mul(line.step, frac(k)))),
    detail: { decimals: o.decimals },
    marks: [],
    traps: [],
    prompt: makePrompt("order", { items: items.map((item, i) => `${String.fromCharCode(65 + i)} = ${item.text}`).join(", ") }),
  };
}

function distinctValues(rng, count, draw, per) {
  for (let tries = 0; tries < 500; tries += 1) {
    const list = Array.from({ length: count }, draw);
    const keys = new Set(list.map((v) => bucket(v, per)));
    const exact = new Set(list.map((v) => `${v.n}/${v.d}`));
    if (keys.size === count && exact.size === count) return list;
  }
  throw new RangeError("order: could not draw distinct values");
}

export function g5Order(rng, level) {
  const count = level + 2;
  const whole = level === 3 ? 2 : 1;
  const draw = () => {
    const digits = pick(rng, level === 1 ? [1, 2, 2] : [1, 2, 3, 3]);
    const scale = 10 ** digits;
    return frac(int(rng, 1, scale * whole - 1), scale);
  };
  const values = distinctValues(rng, count, draw, 100);
  return orderRound({
    rng,
    skill: "g5-order-decimals",
    level,
    line: {
      min: F(0),
      max: F(whole),
      step: F(1, 100),
      ticks: F(1, 10),
      labels: labelsBy(0, whole, 1),
    },
    mode: "dec",
    values,
    per: 100,
    decimals: true,
    texts: (v) => showNum(v, "dec"),
  });
}

const FORMS = ["dec", "frac", "mixed"];

export function g6Order(rng, level) {
  const unit = [1, 2, 4][level - 1];
  const r = [10, 6, 4][level - 1];
  const count = level + 2;
  const draw = () => frac(int(rng, -r * unit, r * unit), unit);
  let values = distinctValues(rng, count, draw, unit);
  while (!values.some((v) => v.n < 0) || !values.some((v) => v.n >= 0))
    values = distinctValues(rng, count, draw, unit);
  const kinds = values.map((v) =>
    v.d === 1 ? "int" : pick(rng, level === 2 ? ["dec", "mixed"] : FORMS),
  );
  const byValue = new Map(values.map((v, i) => [`${v.n}/${v.d}`, kinds[i]]));
  return orderRound({
    rng,
    skill: "g6-order-rationals",
    level,
    line: {
      min: F(-r),
      max: F(r),
      step: F(1, unit),
      ticks: unit === 1 ? F(1) : F(1, 2),
      labels: labelsBy(-r, r, level === 1 ? 5 : 2),
    },
    mode: unit === 1 ? "int" : "dec",
    values,
    per: unit,
    decimals: false,
    texts: (v) => {
      const kind = byValue.get(`${v.n}/${v.d}`);
      return showNum(v, kind);
    },
  });
}

// ---- ZOOM -----------------------------------------------------------------------------------------------------------
export function g5Zoom(rng, level) {
  const z = level === 1 ? 1 : 2;
  const digits = z + 1;
  const w = level === 3 ? int(rng, 1, 3) : 0;
  let scaled = 10;
  while (scaled % 10 === 0) scaled = int(rng, 10 ** (digits - 1), 10 ** digits - 1);
  const target = frac(w * 10 ** digits + scaled, 10 ** digits);
  return {
    skill: "g5-zoom-decimals",
    level,
    kind: "zoom",
    family: "zoom",
    line: { min: F(w), max: F(w + 1), step: F(1, 10), ticks: F(1, 10), labels: [F(w), F(2 * w + 1, 2), F(w + 1)] },
    mode: "dec",
    zoom: { z, outerMin: F(w) },
    target,
    tol: F(0),
    detail: { digits },
    marks: [],
    traps: [],
    prompt: makePrompt("zoom", { v: showNum(target, "dec", digits) }, tolSentence(null)),
  };
}

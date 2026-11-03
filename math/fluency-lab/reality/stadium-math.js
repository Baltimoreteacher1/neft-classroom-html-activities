// Soccer Stadium: the pure mathematical model. No DOM, no i18n, no randomness. Every quantity is an integer or an
// exact rational {n, d}; consequences are derived from the model, never written by hand.
import { add, cmp, div, eq, frac, mul, sub } from "../graphics/graphics-a-core.js";

export const CELL_METERS = 5; // one grid cell is 5 m by 5 m
export const COST = { fieldPerM2: 20, perSeat: 50 }; // dollars
export const LIMITS = {
  length: [10, 200],
  width: [10, 120],
  sections: [1, 12],
  seatsPerSection: [1, 60],
  price: [1, 100],
  budget: [1000, 1000000],
};
export const DEFAULT_STADIUM = Object.freeze({
  length: 40,
  width: 20,
  sections: 4,
  seatsPerSection: 5,
  price: 10,
  sold: 12,
  budget: 60000,
});

const FIELDS = ["length", "width", "sections", "seatsPerSection", "price", "sold", "budget"];

export const capacityOf = (s) => s.sections * s.seatsPerSection;

// Invariants every stadium state must satisfy. Returns a list of problems (empty when valid).
export function problems(s) {
  const found = [];
  if (!s || typeof s !== "object") return ["not-an-object"];
  for (const key of FIELDS) {
    if (!Number.isInteger(s[key])) {
      found.push(`${key}-not-integer`);
      continue;
    }
    const [min, max] = LIMITS[key] ?? [0, Number.MAX_SAFE_INTEGER];
    if (s[key] < min || s[key] > max) if (key !== "sold") found.push(`${key}-out-of-range`);
  }
  if (Number.isInteger(s.sold) && (s.sold < 0 || s.sold > capacityOf(s)))
    found.push("sold-exceeds-capacity");
  return found;
}

// Clamp a stored or edited state into the valid space. Unknown or non-integer fields fall back to the default.
export function clean(value) {
  const out = {};
  for (const key of FIELDS) {
    const raw = value && Number.isInteger(value[key]) ? value[key] : DEFAULT_STADIUM[key];
    const [min, max] = LIMITS[key] ?? [0, Number.MAX_SAFE_INTEGER];
    out[key] = Math.min(max, Math.max(min, raw));
  }
  out.sold = Math.min(
    capacityOf(out),
    Math.max(0, Number.isInteger(value?.sold) ? value.sold : DEFAULT_STADIUM.sold),
  );
  return out;
}

// Percent with at most one decimal place, computed on integers so it never shows a float artifact.
export function percentText(part, whole) {
  if (whole === 0) return "0%";
  const tenths = Math.round((part * 1000) / whole);
  const whole10 = Math.floor(tenths / 10);
  const rest = tenths % 10;
  return rest === 0 ? `${whole10}%` : `${whole10}.${rest}%`;
}

export function derive(s) {
  const capacity = capacityOf(s);
  const area = s.length * s.width;
  const perimeter = 2 * (s.length + s.width);
  const occupancy = capacity === 0 ? frac(0, 1) : frac(s.sold, capacity);
  const revenue = s.sold * s.price;
  const cost = area * COST.fieldPerM2 + capacity * COST.perSeat;
  return {
    area,
    perimeter,
    capacity,
    occupancy,
    occupancyText: percentText(s.sold, capacity),
    revenue,
    cost,
    profit: revenue - cost,
    withinBudget: cost <= s.budget,
    cells:
      s.length % CELL_METERS === 0 && s.width % CELL_METERS === 0
        ? { across: s.length / CELL_METERS, down: s.width / CELL_METERS }
        : null,
    lengthToWidth: frac(s.length, s.width),
  };
}

// Multiply both dimensions by an exact factor k. Fails (returns error) unless both results are whole metres in range.
export function scaleField(s, k) {
  const length = mul(frac(s.length, 1), k);
  const width = mul(frac(s.width, 1), k);
  if (length.d !== 1 || width.d !== 1) return { error: "not-whole-metres" };
  const next = { ...s, length: length.n, width: width.n };
  const bad = problems(next);
  return bad.length ? { error: bad[0] } : { state: next };
}

export function setField(s, key, value) {
  if (!FIELDS.includes(key) || !Number.isInteger(value)) return { error: "bad-input" };
  const next = { ...s, [key]: value };
  if (key === "sections" || key === "seatsPerSection")
    next.sold = Math.min(next.sold, capacityOf(next));
  const bad = problems(next);
  return bad.length ? { error: bad[0] } : { state: next };
}

const factor = (before, after) => (before === 0 ? null : frac(after, before));

// What changed between two states and what the mathematics says about it. Each entry names the relationship, the
// exact factors, and (for the scaling case) which wrong prediction would have been natural.
export function consequences(prev, next) {
  const a = derive(prev);
  const b = derive(next);
  const out = [];
  const lf = factor(prev.length, next.length);
  const wf = factor(prev.width, next.width);
  const changedLength = !eq(lf, frac(1, 1));
  const changedWidth = !eq(wf, frac(1, 1));
  if (changedLength || changedWidth) {
    const areaFactor = factor(a.area, b.area);
    const perimeterFactor = factor(a.perimeter, b.perimeter);
    const id =
      changedLength && changedWidth ? (eq(lf, wf) ? "scale-both" : "scale-different") : "scale-one";
    out.push({
      id,
      lengthFactor: lf,
      widthFactor: wf,
      areaFactor,
      perimeterFactor,
      before: { area: a.area, perimeter: a.perimeter },
      after: { area: b.area, perimeter: b.perimeter },
    });
  }
  if (prev.sections !== next.sections || prev.seatsPerSection !== next.seatsPerSection) {
    out.push({
      id: "capacity",
      factor: factor(a.capacity, b.capacity),
      before: a.capacity,
      after: b.capacity,
    });
  }
  if (prev.sold !== next.sold || a.capacity !== b.capacity) {
    out.push({
      id: "occupancy",
      before: a.occupancy,
      after: b.occupancy,
      sameRatio: eq(a.occupancy, b.occupancy),
    });
  }
  if (prev.price !== next.price || prev.sold !== next.sold) {
    out.push({
      id: "revenue",
      factor: factor(a.revenue, b.revenue),
      before: a.revenue,
      after: b.revenue,
    });
  }
  return out;
}

// Area as a function of a scale factor k for the field: A(k) = (L k)(W k) = L W k^2. Used by the graph.
export function areaCurve(s, ks) {
  return ks.map((k) => ({ k, area: mul(mul(frac(s.length, 1), k), mul(frac(s.width, 1), k)) }));
}

// Grade 8: total cost as a linear function of seats, cost(seats) = fixed + perSeat * seats, fixed = field cost.
export function costLine(s) {
  const fixed = s.length * s.width * COST.fieldPerM2;
  return { fixed, slope: COST.perSeat, at: (seats) => fixed + COST.perSeat * seats };
}

// Largest whole number of seats the budget allows for the current field; null when even the field is too costly.
export function seatsWithinBudget(s) {
  const { fixed, slope } = costLine(s);
  if (fixed > s.budget) return null;
  return Math.floor((s.budget - fixed) / slope);
}

export { add, cmp, div, eq, frac, mul, sub };

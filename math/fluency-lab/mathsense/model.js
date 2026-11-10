// The one MathSense state. Two exact amounts (A, and B in compare mode), the cut each fraction bar uses, and which
// amount the editors change. Every representation is drawn from this and every editor ends in one of these functions,
// so no picture can disagree with another.
import {
  MAX_VALUE,
  ZERO,
  add,
  ceil,
  cmp,
  floor,
  fromKey,
  inRange,
  isRat,
  isWhole,
  key,
  make,
  mul,
  piecesOf,
  sub,
  toNumber,
} from "./exact.js";

export const PART_CHOICES = Object.freeze([
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 25, 50, 100,
]);
export const MAX_PARTS = 100;
const MAX = make(MAX_VALUE);

export const initialState = () => ({
  a: make(3n, 4n),
  b: make(2n, 3n),
  compare: false,
  active: "a",
  parts: { a: 4, b: 3 },
});

export const shownKeys = (state) => (state.compare ? ["a", "b"] : ["a"]);
export const amount = (state, which = state.active) => state[which];

// Whole bars, number-line length and grids needed to show every visible amount: 1 to 5.
export function extent(state) {
  const top = shownKeys(state).reduce(
    (best, k) => (cmp(state[k], best) > 0 ? state[k] : best),
    make(1n),
  );
  return Math.min(Number(MAX_VALUE), Math.max(1, Number(ceil(top))));
}

const validParts = (parts) => Number.isInteger(parts) && parts >= 1 && parts <= MAX_PARTS;

// Keep the learner's cut when it still lands exactly on the amount; otherwise recut to the amount's own denominator,
// or to hundredths when that denominator is too fine to draw (the bar then shows a partly shaded piece, honestly).
export function partsFor(q, current) {
  if (validParts(current) && piecesOf(q, current) !== null) return current;
  if (q.d <= BigInt(MAX_PARTS)) return Number(q.d);
  return 100;
}

const withActive = (state, q, parts) => ({
  ...state,
  [state.active]: q,
  parts: { ...state.parts, [state.active]: parts },
});

// Set the active amount from any editor. `keepParts` is for editors that pick a cut themselves (the fraction bar).
export function setAmount(state, q, { parts } = {}) {
  if (!isRat(q) || !inRange(q)) return { ok: false, state, code: "range" };
  const next = validParts(parts) ? parts : partsFor(q, state.parts[state.active]);
  return {
    ok: true,
    state: withActive(state, q, next),
    recut: next !== state.parts[state.active] && !validParts(parts),
  };
}

// k pieces of `parts` equal pieces, exactly (what the numerator and cut fields mean).
export function setPieces(state, k, parts) {
  if (!Number.isInteger(k) || k < 0 || !validParts(parts))
    return { ok: false, state, code: "format" };
  return setAmount(state, make(BigInt(k), BigInt(parts)), { parts });
}

// New cut, same amount. The amount may then fall between two lines, and the bar says so.
export const setParts = (state, parts) =>
  validParts(parts) ? { ...state, parts: { ...state.parts, [state.active]: parts } } : state;

// Move to the next multiple of `unit` in one direction (the unit is a piece, a hundredth, a whole ...).
export function stepAmount(state, direction, unit, { parts } = {}) {
  const q = state[state.active];
  const ratio = mul(q, make(unit.d, unit.n));
  const steps =
    direction > 0 ? floor(ratio) + 1n : (isWhole(ratio) ? ratio.n : floor(ratio) + 1n) - 1n;
  const target = mul(make(steps), unit);
  const clamped = cmp(target, ZERO) < 0 ? ZERO : cmp(target, MAX) > 0 ? MAX : target;
  return setAmount(state, clamped, { parts });
}

export const jumpTo = (state, q, opts) => setAmount(state, q, opts);

// A pointer position along an axis (0 to 1 over `extent` wholes) becomes the nearest exact piece.
export function amountAtPosition(fraction, wholes, parts) {
  const clamped = Math.min(1, Math.max(0, fraction));
  const pieces = Math.round(clamped * wholes * parts);
  return make(BigInt(pieces), BigInt(parts));
}

export function setCompare(state, on) {
  return { ...state, compare: Boolean(on), active: on ? state.active : "a" };
}
export const setActive = (state, which) =>
  which === "b" && state.compare ? { ...state, active: "b" } : { ...state, active: "a" };

export const difference = (state) => sub(state.a, state.b);
export const ordering = (state) => cmp(state.a, state.b);

// ---- Saved form -----------------------------------------------------------------------------------------------
export function serialize(state) {
  return {
    a: key(state.a),
    b: key(state.b),
    compare: state.compare,
    active: state.active,
    parts: { ...state.parts },
  };
}

export function deserialize(saved) {
  const base = initialState();
  if (!saved || typeof saved !== "object") return base;
  const a = fromKey(saved.a);
  const b = fromKey(saved.b);
  if (!a || !b || !inRange(a) || !inRange(b)) return base;
  const parts = saved.parts && typeof saved.parts === "object" ? saved.parts : {};
  return {
    a,
    b,
    compare: saved.compare === true,
    active: saved.compare === true && saved.active === "b" ? "b" : "a",
    parts: {
      a: validParts(parts.a) ? parts.a : partsFor(a, 4),
      b: validParts(parts.b) ? parts.b : partsFor(b, 3),
    },
  };
}

// A scenario or mission start: values as keys such as "3/4".
export function stateFrom({
  a = "3/4",
  b = null,
  parts = null,
  partsB = null,
  compare = false,
} = {}) {
  const qa = fromKey(a) ?? make(3n, 4n);
  const qb = fromKey(b) ?? make(2n, 3n);
  return {
    a: qa,
    b: qb,
    compare: compare || b !== null,
    active: "a",
    parts: {
      a: validParts(parts) ? parts : partsFor(qa, 4),
      b: validParts(partsB) ? partsB : partsFor(qb, 3),
    },
  };
}

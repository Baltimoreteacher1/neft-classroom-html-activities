// Helpers every Number Builder generator shares: piece catalogs, rule builders, starting states and a retry loop that
// only keeps rounds the solver proves solvable. @fm2 FM-007 FM-060 FM-065
import { int } from "../../rng.js";
import { frac, toDecimalString } from "../../rational.js";
import { promptFor } from "./copy-text.js";
import { evalPieces, pieceSolutions, totalPieces } from "./logic.js";

// n scaled down by 10^places, as exact decimal text: dec(235, 2) -> "2.35".
export const dec = (n, places = 0) => toDecimalString(frac(n, 10 ** places));
export const digitsOf = (n) => String(n).split("").map(Number);
export const digitSum = (n) => digitsOf(n).reduce((a, b) => a + b, 0);

export const P = (id, value, kind, max, extra = {}) => ({ id, value, kind, max, ...extra });
export const count = (of, op, n) => ({ t: "count", of: Array.isArray(of) ? of : [of], op, n });
export const total = (op, n) => ({ t: "pieces", op, n });
export const kinds = (n) => ({ t: "kinds", op: "ge", n });

export const COUNTERS = (max, both = true) => [
  P("red", "1", "counter", max, { color: "red" }),
  ...(both ? [P("yellow", "1", "counter", max, { color: "yellow" })] : []),
];
export const BASE10 = (max = [12, 30, 30]) => [
  P("flat", "100", "flat", max[0]),
  P("rod", "10", "rod", max[1]),
  P("unit", "1", "unit", max[2]),
];
export const DISCS = (places, max = 15) => places.map((v) => P(`d${v}`, String(v), "disc", max));
export const DECIMAL = (withMini = false) => [
  P("flat", "1", "flat", 9),
  P("rod", "0.1", "rod", 40),
  P("unit", "0.01", "unit", 40),
  ...(withMini ? [P("mini", "0.001", "mini", 40)] : []),
];
export const chip = (id, value, max) => P(id, value, "chip", max);

function startCounts(rng, level, round) {
  if (rng() > [0.85, 0.5, 0.3][level - 1]) return null;
  const counts = Object.fromEntries(
    round.pieces.map((p) => [p.id, int(rng, 0, Math.min(p.max, 4))]),
  );
  const room = round.cap ?? Infinity;
  for (const p of round.pieces)
    while (totalPieces(counts) > room && counts[p.id] > 0) counts[p.id] -= 1;
  if (totalPieces(counts) === 0 || evalPieces(round, { counts }).ok) return null;
  return counts;
}

// A pieces round from loose parts, or null when the solver finds fewer builds than the round asks for.
export function piecesRound(rng, level, spec) {
  const round = {
    v: 1,
    mode: "pieces",
    form: { type: "numeral" },
    constraints: [],
    ways: 1,
    ...spec,
  };
  if (!round.cap) delete round.cap;
  if (pieceSolutions(round, 8).length < round.ways) return null;
  const start = startCounts(rng, level, round);
  if (start) round.start = start;
  round.prompt = promptFor(round);
  return round;
}

// Run propose() until it yields a solvable round; fall back to the simplest valid round after `tries` attempts.
export function retry(rng, tries, propose, fallback) {
  for (let i = 0; i < tries; i += 1) {
    const round = propose();
    if (round) return round;
  }
  return fallback();
}

export const stamp = (round, skill, level, grade) => ({ ...round, skill, level, grade });

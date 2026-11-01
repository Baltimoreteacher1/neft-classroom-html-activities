// Math Baseball rules (inspired by Funbrain's Math Baseball), kept apart from the screen so they can be tested.
// Positions: 0 is home plate, 1-3 are the bases, 4 means the runner scored. The batter picks a swing; a harder problem
// is worth more bases. Everything is untimed, and a half-inning ends on three outs or after five swings.
import { answerOf } from "./game-pool.js";

export const TIERS = [
  { id: "single", bases: 1 },
  { id: "double", bases: 2 },
  { id: "triple", bases: 3 },
  { id: "homerun", bases: 4 },
];
export const OUTS = 3;
export const SWINGS = 5;
export const INNINGS = 3;

// How hard a problem feels: more and longer numbers, and a bigger answer, rank higher.
export function hardness(item) {
  const digits = (item.question.match(/\d+(?:\.\d+)?/g) || []).reduce(
    (sum, number) => sum + number.length,
    0,
  );
  const answer = Math.abs(answerOf(item));
  return digits + 2 * String(Math.round(answer)).length + answer / 1000;
}

// Splits problems, easiest to hardest, into one deck per tier.
export function tierDecks(items) {
  const sorted = [...items].sort((a, b) => hardness(a) - hardness(b));
  const size = Math.max(1, Math.ceil(sorted.length / TIERS.length));
  return TIERS.map((_, i) => sorted.slice(i * size, (i + 1) * size));
}

// Deals problems for each tier from `draw()` batches, never repeating a question until a batch runs dry.
export function makePitcher(draw) {
  let decks = TIERS.map(() => []);
  const seen = new Set();
  const refill = () => {
    let fresh = draw().filter((item) => !seen.has(item.question));
    if (fresh.length < TIERS.length * 2) {
      seen.clear();
      fresh = draw();
    }
    if (fresh.length < TIERS.length) throw new Error("Not enough problems for Math Baseball");
    for (const item of fresh) seen.add(item.question);
    decks = tierDecks(fresh);
  };
  refill();
  return {
    next(tier) {
      if (!decks[tier].length) refill();
      // A thin batch can leave one tier empty; borrow from the nearest tier that still has problems.
      const order = TIERS.map((_, i) => i).sort((a, b) => Math.abs(a - tier) - Math.abs(b - tier));
      const source = order.find((i) => decks[i].length);
      return decks[source].shift();
    },
  };
}

export const newHalf = () => ({ outs: 0, swings: 0, runs: 0, bases: [false, false, false] });

// Every runner (and the batter) moves up `count` bases together. Returns the new half-inning, each move, and runs scored.
export function hit(half, count) {
  const moves = [{ from: 0, to: Math.min(count, 4), batter: true }];
  half.bases.forEach((on, i) => {
    if (on) moves.push({ from: i + 1, to: Math.min(i + 1 + count, 4), batter: false });
  });
  const bases = [false, false, false];
  let scored = 0;
  for (const move of moves) {
    if (move.to === 4) scored += 1;
    else bases[move.to - 1] = true;
  }
  return {
    half: { ...half, bases, runs: half.runs + scored, swings: half.swings + 1 },
    moves,
    scored,
  };
}

export const out = (half) => ({ ...half, outs: half.outs + 1, swings: half.swings + 1 });

export const halfOver = (half) => half.outs >= OUTS || half.swings >= SWINGS;

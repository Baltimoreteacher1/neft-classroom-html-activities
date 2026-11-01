// Guess the Number rules (inspired by Funbrain's Guess the Number): a secret whole number, a range sized to the grade, and
// stars for how few guesses a careful halving plan would need. Stars never depend on speed.
export const MAX_BY_GRADE = [10, 20, 50, 100, 100, 500, 1000, 1000, 1000];
export const ROUNDS = 3;

export const maxFor = (grade) => MAX_BY_GRADE[grade] ?? 100;

// Halving the possible numbers each time finds any number in this many guesses or fewer.
export const parFor = (max) => Math.ceil(Math.log2(max + 1));

export const midpoint = ({ lo, hi }) => Math.floor((lo + hi) / 2);
export const countLeft = ({ lo, hi }) => hi - lo + 1;

export function pickSecret(max, rng = Math.random) {
  return 1 + Math.floor(rng() * max);
}

// A whole number from 1 to `max`, or null.
export function parseGuess(text, max) {
  if (!/^\d{1,5}$/.test(String(text).trim())) return null;
  const value = Number(text);
  return value >= 1 && value <= max ? value : null;
}

// "found", "low" (the secret is higher) or "high" (the secret is lower).
export const judge = (guess, secret) =>
  guess === secret ? "found" : guess < secret ? "low" : "high";

export function narrow(band, guess, secret) {
  const verdict = judge(guess, secret);
  if (verdict === "low") return { lo: Math.max(band.lo, guess + 1), hi: band.hi };
  if (verdict === "high") return { lo: band.lo, hi: Math.min(band.hi, guess - 1) };
  return { lo: guess, hi: guess };
}

export const inBand = (band, guess) => guess >= band.lo && guess <= band.hi;

// Within `par` guesses is 3 stars, up to two more is 2, anything else 1.
export const starsFor = (guesses, par) => (guesses <= par ? 3 : guesses <= par + 2 ? 2 : 1);

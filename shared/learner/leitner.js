/**
 * Vocabulary Leitner boxes. Intervals 1, 2, 4, 8, 16 days. A miss returns to box 1, a hit moves up one box,
 * an 'easy' answer skips one box (moves up two). The number of cards shown per day is capped by a daily budget
 * (default 10, teacher adjustable). Time is a day number (floor of epoch ms / DAY_MS); nothing reads a clock.
 *
 * Test hook: selectDue takes `hooks.cap(list, budget)`; the negative control passes a no-op cap and the
 * budget test must fail.
 */
import { DAY_MS, DEFAULTS } from "./constants.js";

export const dayOf = (ms) => Math.floor(ms / DAY_MS);

export function newCard(term, unitId, today) {
  return { term, unitId, box: 1, due: today };
}

export function nextBox(box, outcome) {
  const top = DEFAULTS.leitnerIntervalsDays.length;
  if (outcome === "miss") return 1;
  if (outcome === "hit") return Math.min(top, box + 1);
  if (outcome === "easy") return Math.min(top, box + 2);
  throw new Error(`unknown outcome "${outcome}"`);
}

/** Returns a new card after a review on day `today`. */
export function review(card, outcome, today) {
  const box = nextBox(card.box, outcome);
  return { ...card, box, due: today + DEFAULTS.leitnerIntervalsDays[box - 1] };
}

/** Teacher-adjustable budget: a whole number between 1 and the maximum. */
export function validateBudget(budget) {
  if (!Number.isInteger(budget) || budget < 1 || budget > DEFAULTS.maxDailyCardBudget) {
    throw new Error(
      `daily card budget must be a whole number from 1 to ${DEFAULTS.maxDailyCardBudget}`,
    );
  }
  return budget;
}

const defaultCap = (list, budget) => list.slice(0, budget);

/** Due cards, most overdue first, then lowest box, then term; at most `budget` (already used cards count). */
export function selectDue(
  cards,
  today,
  { budget = DEFAULTS.dailyCardBudget, usedToday = 0 } = {},
  hooks = {},
) {
  validateBudget(budget);
  const remaining = Math.max(0, budget - usedToday);
  const due = cards
    .filter((c) => c.due <= today)
    .sort((a, b) => a.due - b.due || a.box - b.box || a.term.localeCompare(b.term));
  return (hooks.cap || defaultCap)(due, remaining);
}

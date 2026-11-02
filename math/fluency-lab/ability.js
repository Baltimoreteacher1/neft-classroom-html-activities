// A per-skill ability estimate that updates on every answer. It is the probability that the learner answers a
// grade-level problem of this skill on their own, kept as a decaying Beta(a, b) so it needs no history to read
// and stays small enough to live in the tutor record. Pure: no storage, no clock (callers pass `now`).
// Hints cannot inflate it: a supported right answer is only weak evidence, and a supported miss still counts.

const DAY = 86400000;
const PRIOR = 1;
const ANSWER_DECAY = 0.97; // old answers fade: about 33 answers of effective memory
const IDLE_HALF_LIFE_DAYS = 60; // certainty regresses toward "unknown" while a skill rests
const MAX_PSEUDO = 60;
// A right answer on harder work says more; a miss on easier work says more.
const UP = [0, 0.4, 0.7, 1, 1.2, 1.4];
const DOWN = [0, 1.4, 1.2, 1, 0.7, 0.4];

const round = (value) => Math.round(value * 1000) / 1000;
const validTier = (tier) => (Number.isInteger(tier) && tier >= 1 && tier <= 5 ? tier : 3);

export const emptyAbility = () => ({ a: PRIOR, b: PRIOR, n: 0, at: null });

function rested(ability, now) {
  const days = ability.at && now > ability.at ? (now - ability.at) / DAY : 0;
  const keep = 0.5 ** (days / IDLE_HALF_LIFE_DAYS);
  return { a: PRIOR + (ability.a - PRIOR) * keep, b: PRIOR + (ability.b - PRIOR) * keep };
}

// answer: { correct, independent, tier 1-5 }. Returns a new ability; never mutates the old one.
export function updateAbility(previous, answer, now = Date.now()) {
  const before = previous && Number.isFinite(previous.a) ? previous : emptyAbility();
  let { a, b } = rested(before, now);
  a = PRIOR + (a - PRIOR) * ANSWER_DECAY;
  b = PRIOR + (b - PRIOR) * ANSWER_DECAY;
  const tier = validTier(answer.tier);
  if (answer.independent) {
    if (answer.correct) a += UP[tier];
    else b += DOWN[tier];
  } else if (answer.correct) {
    // Help was in play: a small share counts as success, the rest as "not on their own yet".
    a += 0.15 * UP[tier];
    b += 0.35 * DOWN[tier];
  } else b += 0.5 * DOWN[tier];
  return { a: round(Math.min(MAX_PSEUDO, a)), b: round(Math.min(MAX_PSEUDO, b)), n: (before.n || 0) + 1, at: now };
}

// { p: 0-1 chance of an independent grade-level success, weight: how much evidence stands behind it, n }
export function abilityEstimate(ability, now = Date.now()) {
  if (!ability || !Number.isFinite(ability.a) || !ability.n) return { p: null, weight: 0, n: 0 };
  const { a, b } = rested(ability, now);
  return { p: round(a / (a + b)), weight: round(a + b - 2 * PRIOR), n: ability.n };
}

export function sanitizeAbility(value) {
  if (!value || typeof value !== "object" || !Number.isFinite(value.a) || !Number.isFinite(value.b)) return null;
  const clamp = (number) => round(Math.min(MAX_PSEUDO, Math.max(PRIOR, number)));
  const n = Math.max(0, Math.min(1e6, Math.floor(Number(value.n) || 0)));
  return n ? { a: clamp(value.a), b: clamp(value.b), n, at: Number.isFinite(value.at) ? value.at : null } : null;
}

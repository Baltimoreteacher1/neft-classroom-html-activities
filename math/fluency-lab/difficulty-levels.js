// Five difficulty tiers and the rule that moves a learner between them. The tier changes the kind of thinking
// asked for, never just bigger numbers:
//   1 concrete visual foundations   2 foundational application   3 grade-level proficiency
//   4 multi-step reasoning          5 advanced transfer and challenge
// Stored tutor entries keep `level` 0-2 for old saves; new entries add `tier` 1-5. chooseTier() is pure: it reads
// independent accuracy, hint use, consistency and recency, and moves at most one tier per decision.
import { t } from "./i18n.js";

const DAY = 86400000;
export const TIER_COUNT = 5;
export const START_TIER = 1;
export const RETURN_AFTER_DAYS = 21;
const WINDOW = 8;
const MIN_DWELL = 3;

export const isTier = (tier) => Number.isInteger(tier) && tier >= 1 && tier <= TIER_COUNT;
// Tiers 1-2 use the scaffolded level-0 generators, 3 the grade-level generators, 4-5 the stretch generators.
export const tierToLevel = (tier) => (tier <= 2 ? 0 : tier === 3 ? 1 : 2);
// Old saves only know level 0-2: scaffolded work was tier 1, grade-level work tier 3, stretch work tier 4.
export const levelToTier = (level) => (level === 0 ? 1 : level === 2 ? 4 : 3);
// When a teacher's challenge range forces a level, keep the tier that already sits at that level.
export const alignTier = (tier, level) => (tierToLevel(tier) === level ? tier : levelToTier(level));
export const tierOf = (entry) => (isTier(entry?.tier) ? entry.tier : levelToTier(entry?.level));

export function tierLabel(tier) {
  switch (tier) {
    case 1: return t("Picture it first");
    case 2: return t("Try the idea");
    case 3: return t("Grade-level");
    case 4: return t("Think it through");
    default: return t("Challenge");
  }
}

// Chronological entries as { correct, independent, tier, at } for one skill record.
export const tierEvidence = (record, now = Date.now()) => ({
  now,
  entries: (Array.isArray(record?.recent) ? record.recent : []).map((entry) => ({
    correct: Boolean(entry.correct), independent: Boolean(entry.independent), tier: tierOf(entry), at: entry.at,
  })),
});

const decision = (tier, previous, reason) => ({ tier, previous, change: Math.sign(tier - previous), reason });

// Returns { tier, previous, change: -1|0|1, reason }. `reason` is a stable id, not learner-facing text.
export function chooseTier({ entries = [], now = Date.now() } = {}) {
  if (!entries.length) return decision(START_TIER, START_TIER, "new");
  const last = entries.at(-1);
  const current = last.tier;
  const idleDays = (now - last.at) / DAY;
  // Returning after a long break: restart a little below where they left off, then earn it back.
  if (idleDays >= RETURN_AFTER_DAYS)
    return decision(Math.max(START_TIER, current - (idleDays >= 60 ? 2 : 1)), current, "returning");

  const dwell = [];
  for (let i = entries.length - 1; i >= 0 && entries[i].tier === current && dwell.length < WINDOW; i -= 1) dwell.unshift(entries[i]);
  const before = entries[entries.length - 1 - dwell.length];
  const helped = (list) => list.filter((entry) => !entry.independent).length;

  if (current > START_TIER && dwell.length >= MIN_DWELL) {
    const lastThree = dwell.slice(-3);
    const lastFour = dwell.slice(-4);
    // Three misses in a row, or three of the last five: one slip never moves a learner, a pattern does.
    if (lastThree.every((entry) => !entry.correct) || dwell.slice(-5).filter((entry) => !entry.correct).length >= 3) return decision(current - 1, current, "misses");
    // Leaning on hints at grade level or above steps back to foundational work; at tier 2 the numbers are already
    // small, so the learner stays and keeps the chance to try one alone.
    if (current >= 3 && lastFour.length === 4 && helped(lastFour) >= 3) return decision(current - 1, current, "needs-hints");
  }

  if (current < TIER_COUNT) {
    // Coming back up after a step down needs a little more proof than the first climb.
    const demotions = entries.slice(-20).filter((entry, i, tail) => i && tail[i - 1].tier > entry.tier).length;
    const need = (current >= 3 ? 4 : 2) + (before && before.tier > current ? 2 : 0) + Math.min(4, demotions);
    const run = dwell.slice(-need);
    const everyRight = run.length === need && run.every((entry) => entry.correct);
    // Tier 1 is always supported work, so only tiers 2 and up must be independent.
    const earned = current === START_TIER ? everyRight : everyRight && run.every((entry) => entry.independent) && helped(dwell) / dwell.length <= 0.34;
    if (earned) return decision(current + 1, current, "steady");
  }
  return decision(current, current, "hold");
}

export const nextTier = (record, now = Date.now()) => chooseTier(tierEvidence(record, now)).tier;

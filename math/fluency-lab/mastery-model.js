// One mastery model for the whole lab: a 0-100 score per skill and a 1/3/7/14/30-day review ladder.
// Pure functions over the tutor record, so the dashboard, practice meter, teacher report and family report agree.

const DAY = 86400000;
export const REVIEW_LADDER = Object.freeze([1, 3, 7, 14, 30]);
export const MASTERY_STATES = Object.freeze([
  "new",
  "learning",
  "developing",
  "proficient",
  "mastered",
]);

// Harder work counts for more, in both directions. Level 0 is the concrete, picture-first level.
const LEVEL_WEIGHT = [0.6, 1, 1.25];
const SUPPORTED_CREDIT = 0.25;
const HALF_LIFE_ENTRIES = 8;
const day = (time) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

// A repeated identical problem is one piece of evidence, not several: keep the latest entry per signature.
function distinctEntries(recent) {
  const lastBySig = new Map();
  recent.forEach((entry, index) => {
    if (entry.sig) lastBySig.set(entry.sig, index);
  });
  return recent.filter((entry, index) => !entry.sig || lastBySig.get(entry.sig) === index);
}

export function masteryParts(record = {}, now = Date.now()) {
  const entries = distinctEntries(Array.isArray(record.recent) ? record.recent : []);
  const count = entries.length;
  if (!count)
    return { count: 0, accuracy: 0, independence: 0, consistency: 0, retention: 0, days: 0 };
  let earned = 0;
  let possible = 0;
  entries.forEach((entry, index) => {
    const recency = 0.5 ** ((count - 1 - index) / HALF_LIFE_ENTRIES);
    const weight = LEVEL_WEIGHT[entry.level] ?? 1;
    possible += recency * weight;
    if (entry.correct) earned += recency * weight * (entry.independent ? 1 : SUPPORTED_CREDIT);
  });
  const independent = entries.filter((entry) => entry.independent);
  const lastSix = independent.slice(-6);
  const flips = lastSix
    .slice(1)
    .filter((entry, index) => entry.correct !== lastSix[index].correct).length;
  const days = new Set(
    independent.filter((entry) => entry.correct && entry.level >= 1).map((entry) => day(entry.at)),
  ).size;
  const overdue = record.dueAt && now - record.dueAt > 7 * DAY;
  const retention =
    (days >= 3 ? 1 : days === 2 ? 0.7 : days === 1 ? 0.4 : 0) * (overdue ? 0.85 : 1);
  return {
    count,
    accuracy: possible ? earned / possible : 0,
    independence: independent.length / count,
    consistency: lastSix.length > 1 ? 1 - flips / (lastSix.length - 1) : 0.5,
    retention,
    days,
  };
}

export function masteryScore(record = {}, now = Date.now()) {
  const parts = masteryParts(record, now);
  if (!parts.count) return null;
  let score =
    100 *
    (0.5 * parts.accuracy +
      0.15 * parts.independence +
      0.15 * parts.consistency +
      0.2 * parts.retention);
  // Few distinct problems cannot show mastery, however clean they were.
  score *= Math.min(1, 0.4 + 0.15 * parts.count);
  // Only easy, picture-first work earns at most a "developing" score.
  const hasGradeLevelSuccess = (record.recent || []).some(
    (entry) => entry.correct && entry.independent && entry.level >= 1,
  );
  if (!hasGradeLevelSuccess) score = Math.min(score, 50);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function masteryState(record = {}, now = Date.now()) {
  const score = masteryScore(record, now);
  if (score === null) return "new";
  const parts = masteryParts(record, now);
  if (score >= 90 && parts.count >= 8 && parts.days >= 2) return "mastered";
  if (score >= 70) return "proficient";
  if (score >= 40) return "developing";
  return "learning";
}

// Position on the ladder for a stored interval: the first rung at least that long (14 -> index 3).
export const ladderIndex = (interval) => {
  const found = REVIEW_LADDER.findIndex((days) => days >= Math.max(1, Number(interval) || 1));
  return found === -1 ? REVIEW_LADDER.length - 1 : found;
};

// Independent success on a new day climbs a rung; an independent miss restarts at 1 day; a hinted or
// easier-level success steps back one rung; the same day changes nothing.
export function nextInterval(interval, { correct, independent, advance }) {
  const index = ladderIndex(interval);
  if (independent && correct)
    return REVIEW_LADDER[advance ? Math.min(index + 1, REVIEW_LADDER.length - 1) : index];
  if (independent || !correct) return REVIEW_LADDER[0];
  return REVIEW_LADDER[Math.max(0, index - 1)];
}

// A short, stable signature of a question's text, so a repeated identical problem counts once in the score.
export function itemSignature(text) {
  let hash = 5381;
  for (const char of String(text ?? "").replace(/\s+/g, " ").trim()) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}

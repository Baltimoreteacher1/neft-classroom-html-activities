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

// The new three-dimension fluency rule coexists with the established numeric
// meter until every practice mode can record strategy and explanation evidence.
export const REVIEW_GAPS_DAYS = REVIEW_LADDER;

export function masterySummary(history, now = Date.now()) {
  const events = (Array.isArray(history) ? history : [])
    .filter((event) => event && Number.isFinite(event.at) && event.at <= now &&
      typeof event.sessionId === "string" && event.sessionId &&
      typeof event.correct === "boolean" && typeof event.independent === "boolean")
    .toSorted((a, b) => a.at - b.at);
  const independentCorrect = events.filter((event) => event.correct && event.independent);
  const sessions = new Set(independentCorrect.map((event) => event.sessionId));
  const strategies = new Set(independentCorrect.filter((event) => event.explained && event.strategy).map((event) => event.strategy));
  const appropriate = new Set(independentCorrect.filter((event) => event.appropriateStrategy === true).map((event) => event.sessionId));
  const halfway = Math.ceil(events.length / 2);
  const hintTotal = (rows) => rows.reduce((sum, event) => sum + (Number(event.hintsUsed) || 0), 0);
  const earlyHints = hintTotal(events.slice(0, halfway));
  const lateHints = hintTotal(events.slice(halfway));
  const dimensions = {
    accuracy: sessions.size >= 3,
    flexibility: strategies.size >= 2,
    efficiency: appropriate.size >= 2 && lateHints <= earlyHints,
  };
  const responseTimes = independentCorrect.map((event) => event.responseMs)
    .filter((value) => Number.isFinite(value) && value >= 0).toSorted((a, b) => a - b);

  let fluentAt = null;
  const seenSessions = new Set();
  const seenStrategies = new Set();
  const seenAppropriate = new Set();
  for (const event of events) {
    if (event.correct && event.independent) {
      seenSessions.add(event.sessionId);
      if (event.explained && event.strategy) seenStrategies.add(event.strategy);
      if (event.appropriateStrategy === true) seenAppropriate.add(event.sessionId);
    }
    if (seenSessions.size >= 3 && seenStrategies.size >= 2 && seenAppropriate.size >= 2) {
      fluentAt = event.at;
      break;
    }
  }
  if (!dimensions.efficiency) fluentAt = null;

  let reviews = 0;
  let lastReview = fluentAt;
  if (fluentAt !== null) {
    for (const event of events) {
      if (event.at <= fluentAt || reviews === REVIEW_LADDER.length) continue;
      if (event.retrieval !== true || !event.correct || !event.independent) continue;
      if (event.at - lastReview < REVIEW_LADDER[reviews] * DAY) continue;
      reviews++;
      lastReview = event.at;
    }
  }
  const state = reviews === REVIEW_LADDER.length ? "Maintained" : fluentAt !== null ? "Fluent" : events.length ? "Strategy" : "Explore";
  return {
    state,
    dimensions,
    evidence: { independentSessions: sessions.size, explainedStrategies: strategies.size, appropriateSessions: appropriate.size },
    retention: { completedGaps: reviews, nextDueAt: fluentAt !== null && reviews < REVIEW_LADDER.length ? lastReview + REVIEW_LADDER[reviews] * DAY : null },
    privateMetrics: { medianResponseMs: responseTimes.length ? responseTimes[Math.floor(responseTimes.length / 2)] : null,
      hintsTrend: lateHints < earlyHints ? "decreasing" : lateHints === earlyHints ? "steady" : "increasing" },
  };
}

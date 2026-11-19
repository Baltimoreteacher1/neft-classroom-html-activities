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
const EVIDENCE_STRATEGIES = new Set(["visual", "decomposition", "fact"]);

export function normalizeMasteryEvent(event) {
  if (!event || !Number.isFinite(event.at) || typeof event.sessionId !== "string" || !event.sessionId ||
    typeof event.eventId !== "string" || typeof event.correct !== "boolean" || typeof event.independent !== "boolean") return null;
  return {
    at: event.at, sessionId: event.sessionId.slice(0, 80), eventId: event.eventId.slice(0, 100),
    correct: event.correct, independent: event.independent,
    hintsUsed: Math.min(20, Math.max(0, Number(event.hintsUsed) || 0)),
    ...(Number.isFinite(event.responseMs) && event.responseMs >= 0 && event.responseMs <= 300000 ? { responseMs: event.responseMs } : {}),
    ...(EVIDENCE_STRATEGIES.has(event.strategy) ? { strategy: event.strategy, explained: event.explained === true } : {}),
    ...(typeof event.strategyHelped === "boolean" ? { strategyHelped: event.strategyHelped } : {}),
  };
}

export function recordMasteryEvent(record, event) {
  const clean = normalizeMasteryEvent(event);
  if (!record || !clean) return null;
  const history = Array.isArray(record.masteryEvents) ? record.masteryEvents : [];
  record.masteryEvents = [...history.filter((entry) => entry?.eventId !== clean.eventId), clean].slice(-100);
  return clean;
}

export function recordMasteryReflection(record, eventId, strategy, strategyHelped) {
  if (!record || !EVIDENCE_STRATEGIES.has(strategy) || typeof strategyHelped !== "boolean") return false;
  const event = record.masteryEvents?.find((entry) => entry.eventId === eventId && entry.correct && entry.independent);
  if (!event) return false;
  event.strategy = strategy;
  event.explained = true;
  event.strategyHelped = strategyHelped;
  return true;
}

export function masterySummary(history, now = Date.now()) {
  const events = (Array.isArray(history) ? history : [])
    .filter((event) => event && Number.isFinite(event.at) && event.at <= now &&
      typeof event.sessionId === "string" && event.sessionId &&
      typeof event.correct === "boolean" && typeof event.independent === "boolean")
    .toSorted((a, b) => a.at - b.at);
  const independentCorrect = events.filter((event) => event.correct && event.independent);
  const sessions = new Set(independentCorrect.map((event) => event.sessionId));
  const strategies = new Set(independentCorrect.filter((event) => event.explained && event.strategy).map((event) => event.strategy));
  const helpful = new Set(independentCorrect.filter((event) => event.strategyHelped === true).map((event) => event.sessionId));
  const halfway = Math.ceil(events.length / 2);
  const hintTotal = (rows) => rows.reduce((sum, event) => sum + (Number(event.hintsUsed) || 0), 0);
  const earlyHints = hintTotal(events.slice(0, halfway));
  const lateHints = hintTotal(events.slice(halfway));
  const dimensions = {
    accuracy: sessions.size >= 3,
    flexibility: strategies.size >= 2,
    efficiency: helpful.size >= 2 && lateHints <= earlyHints,
  };
  const responseTimes = independentCorrect.map((event) => event.responseMs)
    .filter((value) => Number.isFinite(value) && value >= 0).toSorted((a, b) => a - b);

  let fluentAt = null;
  const seenSessions = new Set();
  const seenStrategies = new Set();
  const seenHelpful = new Set();
  for (const event of events) {
    if (event.correct && event.independent) {
      seenSessions.add(event.sessionId);
      if (event.explained && event.strategy) seenStrategies.add(event.strategy);
      if (event.strategyHelped === true) seenHelpful.add(event.sessionId);
    }
    if (seenSessions.size >= 3 && seenStrategies.size >= 2 && seenHelpful.size >= 2) {
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
    evidence: { independentSessions: sessions.size, explainedStrategies: strategies.size, helpfulStrategySessions: helpful.size },
    retention: { completedGaps: reviews, nextDueAt: fluentAt !== null && reviews < REVIEW_LADDER.length ? lastReview + REVIEW_LADDER[reviews] * DAY : null },
    privateMetrics: { medianResponseMs: responseTimes.length ? responseTimes[Math.floor(responseTimes.length / 2)] : null,
      hintsTrend: lateHints < earlyHints ? "decreasing" : lateHints === earlyHints ? "steady" : "increasing" },
  };
}

// Explicit 5-stage evidence-based learning progression (Exploring -> Developing -> Practicing -> Independent -> Retained).
// Distinguishes fluency, understanding, assisted practice, and multi-day retention without opaque percentages.
export const LEARNING_STAGES = Object.freeze([
  "exploring",
  "developing",
  "practicing",
  "independent",
  "retained",
]);

export const LEARNING_STAGE_LABELS = Object.freeze({
  exploring: { en: "Exploring", es: "Explorando" },
  developing: { en: "Developing", es: "Desarrollando" },
  practicing: { en: "Practicing", es: "Practicando" },
  independent: { en: "Independent", es: "Independiente" },
  retained: { en: "Retained", es: "Retenido" },
});

export function learningStage(record = {}, now = Date.now()) {
  const recent = Array.isArray(record.recent) ? record.recent : [];
  const entries = distinctEntries(recent);
  const independentEntries = entries.filter((e) => e.independent && (e.level ?? 1) >= 1);
  const independentCorrect = independentEntries.filter((e) => e.correct);
  const assistedEntries = entries.filter((e) => !e.independent || (e.level ?? 1) < 1);
  const assistedCorrect = assistedEntries.filter((e) => e.correct);
  const independentAccuracy = independentEntries.length
    ? independentCorrect.length / independentEntries.length
    : null;
  const recentThreeIndependent = independentEntries.slice(-3);
  const lastThreeAccurate =
    recentThreeIndependent.length === 3 && recentThreeIndependent.every((e) => e.correct);
  const retentionDays = new Set(independentCorrect.map((e) => day(e.at || now))).size;
  const overdue = Boolean(record.dueAt && now - record.dueAt > 7 * DAY);
  const insufficientEvidence = independentEntries.length < 3;

  const criteria = {
    hasAnyAttempt: entries.length > 0,
    hasAssistedOrEarlySuccess: assistedCorrect.length > 0 || independentCorrect.length > 0,
    hasThreeIndependent: independentEntries.length >= 3,
    independentAccuracyAtLeast80: independentAccuracy !== null && independentAccuracy >= 0.8,
    hasSixIndependentCorrect: independentCorrect.length >= 6,
    lastThreeIndependentCorrect: lastThreeAccurate,
    retainedAcrossDays: retentionDays >= 2 && !overdue,
  };

  let stage = "exploring";
  let reason = {
    en: "Not enough independent attempts yet to judge mastery. Exploring the concept and visual model.",
    es: "Aún no hay suficientes intentos independientes para evaluar el dominio. Explorando el concepto y el modelo visual.",
  };
  let nextStep = {
    en: "Explore the visual model and try 3 independent problems.",
    es: "Explora el modelo visual e intenta 3 problemas por tu cuenta.",
  };

  if (
    criteria.hasSixIndependentCorrect &&
    criteria.independentAccuracyAtLeast80 &&
    criteria.lastThreeIndependentCorrect &&
    criteria.retainedAcrossDays
  ) {
    stage = "retained";
    reason = {
      en: `${independentCorrect.length} independent successes (${Math.round(independentAccuracy * 100)}%) across ${retentionDays} separate days, including the last 3 in a row.`,
      es: `${independentCorrect.length} aciertos independientes (${Math.round(independentAccuracy * 100)}%) en ${retentionDays} días distintos, incluidos los últimos 3 seguidos.`,
    };
    nextStep = {
      en: "Scheduled retrieval checks will keep this skill fresh over time.",
      es: "Las revisiones espaciadas mantendrán esta destreza firme con el tiempo.",
    };
  } else if (
    criteria.hasSixIndependentCorrect &&
    criteria.independentAccuracyAtLeast80 &&
    criteria.lastThreeIndependentCorrect
  ) {
    stage = "independent";
    reason = {
      en: `${independentCorrect.length} independent successes (${Math.round(independentAccuracy * 100)}%) and 3 in a row on their own; needs a fresh check on another day to confirm retention.`,
      es: `${independentCorrect.length} aciertos independientes (${Math.round(independentAccuracy * 100)}%) y 3 seguidos por su cuenta; falta una comprobación en otro día para confirmar retención.`,
    };
    nextStep = {
      en: "Return on another day for a fresh independent retention check.",
      es: "Vuelve otro día para una comprobación independiente de retención.",
    };
  } else if (criteria.hasThreeIndependent && independentCorrect.length >= 2) {
    stage = "practicing";
    reason = {
      en: `${independentCorrect.length} of ${independentEntries.length} independent answers correct (${Math.round(independentAccuracy * 100)}%); building consistency toward independent mastery.`,
      es: `${independentCorrect.length} de ${independentEntries.length} respuestas independientes correctas (${Math.round(independentAccuracy * 100)}%); construyendo consistencia.`,
    };
    nextStep = {
      en: "Practice without hints until 6 independent successes with 80%+ accuracy.",
      es: "Practica sin pistas hasta lograr 6 aciertos independientes con 80%+ de precisión.",
    };
  } else if (criteria.hasAssistedOrEarlySuccess) {
    stage = "developing";
    reason = {
      en: `${assistedCorrect.length} supported and ${independentCorrect.length} independent successes so far. Early understanding is forming.`,
      es: `${assistedCorrect.length} aciertos con apoyo y ${independentCorrect.length} independientes hasta ahora. La comprensión inicial está creciendo.`,
    };
    nextStep = {
      en: "Use the strategy model, then try 3 fresh problems independently.",
      es: "Usa el modelo de estrategia y luego intenta 3 problemas nuevos por tu cuenta.",
    };
  }

  return {
    stage,
    stageIndex: LEARNING_STAGES.indexOf(stage),
    label: LEARNING_STAGE_LABELS[stage],
    insufficientEvidence,
    overdue,
    criteria,
    metrics: {
      totalAttempts: entries.length,
      independentAttempts: independentEntries.length,
      independentCorrect: independentCorrect.length,
      independentAccuracy: independentAccuracy === null ? null : Math.round(independentAccuracy * 100),
      assistedAttempts: assistedEntries.length,
      assistedCorrect: assistedCorrect.length,
      retentionDays,
    },
    reason,
    nextStep,
  };
}

import { TUTOR_NOTE } from "./fraction-division-copy.js";
import { sanitizeAbility, updateAbility } from "./ability.js";
import { isTier, levelToTier, tierToLevel } from "./difficulty-levels.js";
import { sanitizeRescues } from "./rescue-history.js";
import { REVIEW_LADDER, ladderIndex, masteryScore, masteryState, nextInterval } from "./mastery-model.js";
import { classifyMistake, isKnownMistakeCategory, likelyMistake } from "./mistake-notes.js";
import { ALL_SKILLS, GENERATOR_PARTS, baseGenerator, generateProblem, getGrade, opsOf, resolveOp, seededRandom } from "./problem-bank.js";
import { storyFor } from "./story-problems.js";

export const DAY = 86400000;
const SPACING_MS = 18 * 3600 * 1000;
export const skillKey = (skill) => `${skill.grade}:${skill.id}`;
export const findSkill = (key) => ALL_SKILLS.find((skill) => skillKey(skill) === key);
export const localDay = (time = Date.now()) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export const emptyTutor = () => ({ version: 2, records: {}, mistakes: [], diagnostics: {}, sessions: [], rescues: [] });

const RECENT_WINDOW = 20;
const MIN_CALM_RESPONSE_MS = 600;
const MAX_CALM_RESPONSE_MS = 5 * 60 * 1000;
const STRATEGIES = new Set(["visual", "decomposition", "fact", "mental", "symbolic"]);
const normalizeStrategies = (value) => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return [...new Set(values.map((entry) => String(entry).trim().toLowerCase()).filter((entry) => STRATEGIES.has(entry)))];
};
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};
function summarizeMetrics(record) {
  const recent = Array.isArray(record.recent) ? record.recent : [];
  const independent = recent.filter((entry) => entry.independent && entry.level >= 1);
  const strategies = [...new Set([
    ...(Array.isArray(record.strategyTags) ? record.strategyTags : []),
    ...recent.flatMap((entry) => Array.isArray(entry.strategies) ? entry.strategies : []),
  ].filter((entry) => STRATEGIES.has(entry)))];
  const calmSamples = independent.filter((entry) => entry.paceEligible && Number.isFinite(entry.responseMs)).map((entry) => entry.responseMs);
  const recentHalf = calmSamples.slice(-6);
  const previousHalf = calmSamples.slice(-12, -6);
  const currentMedian = median(recentHalf);
  const previousMedian = median(previousHalf);
  const change = previousMedian && currentMedian ? (currentMedian - previousMedian) / previousMedian : 0;
  // Pace is descriptive, never a mastery score: taking more time is not labelled as failure.
  const trend = previousHalf.length < 3 || recentHalf.length < 3 || Math.abs(change) < 0.15
    ? "steady"
    : change > 0 ? "more_time" : "less_time";
  const correct = independent.filter((entry) => entry.correct).length;
  return {
    accuracy: { correct, total: independent.length, percent: independent.length ? Math.round((correct / independent.length) * 100) : null, window: RECENT_WINDOW },
    strategyFlexibility: { strategies, count: strategies.length },
    pace: { sampleCount: calmSamples.length, medianResponseMs: median(calmSamples), trend },
  };
}

const FOUNDATIONS = {
  "1:add-20": ["1:make-10"], "1:subtract-20": ["1:missing-addend"],
  "1:add-10": ["0:compose-10", "0:add-sub-5"], "1:subtract-10": ["0:add-sub-5"], "1:make-10": ["0:compose-10"],
  "2:add-100": ["1:tens-ones", "1:add-20"], "2:subtract-100": ["1:subtract-20"],
  "2:add-1000": ["2:place-1000", "2:add-100"],
  "3:mul-6-9": ["3:mul-0-5"], "3:mul-10-12": ["3:mul-0-5"], "3:division-facts": ["3:mul-0-5"], "3:area": ["3:mul-0-5"], "4:division": ["3:division-facts"],
  "4:multiply-1digit": ["3:mul-6-9"], "4:multiply-2digit": ["3:mul-6-9"],
  "5:fraction-add": ["4:fraction-equiv"], "5:fraction-mul": ["3:mul-0-5"],
  "6:divide-fractions": ["5:fraction-mul"], "6:ratios": ["3:mul-0-5"],
  "6:unit-rates": ["4:division"], "6:percent": ["5:fraction-of"],
  "7:equations": ["6:one-step"], "7:proportions": ["6:ratios"], "7:fraction-ops": ["5:fraction-add"],
  "7:percent-change": ["6:percent"], "7:unit-rate": ["6:unit-rates"],
  "8:linear-equations": ["7:equations"], "8:systems": ["7:equations"],
  "8:slope": ["7:integer-add", "6:unit-rates"], "8:functions": ["6:evaluate"],
  "8:pythagorean": ["8:square-roots", "8:exponents"],
};

// Which of a grade's skills a trail or game answer is evidence for. A whole-number fact goes to the fact skill
// with that operation whose number ranges hold it; any other item goes to the skill built on its generator.
const FACT_OPS = { "+": "add", "−": "sub", "×": "mul", "÷": "div" };
const within = (value, low, high) => value >= (low ?? 0) && value <= (high ?? Infinity);
function factFits(config, op, a, b, answer, turned = true) {
  const c = config || {};
  if (op === "add") return within(a, c.min, c.max) && within(b, c.min, c.max) && answer <= (c.maxResult ?? (c.max ?? 10) * 2);
  if (op === "sub") return within(answer, c.min, c.max) && within(b, c.min, c.max);
  if (op === "mul") {
    const [lowA, highA] = c.factors ? [Math.min(...c.factors), Math.max(...c.factors)] : [c.minA ?? c.min, c.maxA ?? c.max];
    const [lowB, highB] = [c.minB ?? c.min, c.maxB ?? c.max];
    const tens = (n) => (c.tens ? n % 10 === 0 && within(n / 10, lowB, highB) : within(n, lowB, highB));
    return (within(a, lowA, highA) && tens(b)) || (turned && within(b, lowA, highA) && tens(a));
  }
  return within(b, c.minDivisor ?? 1, c.maxDivisor ?? c.max) && within(answer, c.minQuotient ?? 1, c.maxQuotient ?? c.max);
}
function matchSkill(skills, item) {
  const fact = String(item?.question || "").replaceAll(",", "").match(/^(\d+) ([+−×÷]) (\d+) = \?$/);
  if (fact && ["fact", "factPool"].includes(item.generator)) {
    const [a, b, op, answer] = [Number(fact[1]), Number(fact[3]), FACT_OPS[fact[2]], Number(item.answers?.[0])];
    const facts = skills.filter((skill) => skill.generator === "fact" && opsOf(skill.config).includes(op));
    // 7 × 4 is a ×6–9 fact as written; it only counts as a ×4 fact when no skill holds it the way it is written.
    return facts.find((skill) => factFits(skill.config, op, a, b, answer, false)) || facts.find((skill) => factFits(skill.config, op, a, b, answer)) || facts[0] || null;
  }
  // An operation skill ("Multiply and divide integers") only takes items with one of its operations.
  const op = FACT_OPS[String(item?.question || "").match(/ ([+−×÷]) /)?.[1]];
  return skills.find((skill) =>
    (skill.generator === item?.generator || GENERATOR_PARTS[skill.generator]?.includes(item?.generator)) &&
    (!skill.config?.op || !op || opsOf(skill.config).includes(op))) || null;
}
// A review or foundation stop (Grade 8 integer review, Grade 6 decimal addition) practises a skill taught in an
// earlier grade, so when the learner's grade has no skill for it, the nearest earlier grade's skill gets the credit.
export function skillForItem(grade, item) {
  for (let g = grade; g >= 0; g -= 1) {
    const skill = matchSkill(getGrade(g)?.skills || [], item);
    if (skill) return skill;
  }
  return null;
}

// Authored edges only. The generator-based fallback in prerequisites() is good enough to suggest a foundation to
// visit, but not to infer that a learner who passed one skill has also mastered another.
export const explicitPrerequisites = (skill) => (FOUNDATIONS[skillKey(skill)] || []).map(findSkill).filter(Boolean);

export function prerequisites(skill) {
  const explicit = explicitPrerequisites(skill);
  if (explicit.length) return explicit;
  // A mixed skill ("add and subtract") builds on an earlier skill that practised either operation.
  const earlier = ALL_SKILLS.filter((candidate) => candidate.grade < skill.grade && baseGenerator(candidate) === baseGenerator(skill) && opsOf(candidate.config).some((op) => opsOf(skill.config).includes(op)));
  return earlier.length ? [earlier.at(-1)] : [];
}

// A detached graph keeps the shared curriculum catalog immutable while exposing
// both directions for path maps, bridge practice, and enrichment recommendations.
const graphNodes = Object.fromEntries(ALL_SKILLS.map((skill) => [skillKey(skill), {
  prerequisiteSkills: prerequisites(skill).map(skillKey),
  enrichmentSkills: [],
}]));
for (const [skill, edges] of Object.entries(graphNodes)) {
  for (const prerequisite of edges.prerequisiteSkills) graphNodes[prerequisite]?.enrichmentSkills.push(skill);
}
export const prerequisiteGraph = Object.freeze(Object.fromEntries(Object.entries(graphNodes).map(([key, edges]) => [key, Object.freeze({
  prerequisiteSkills: Object.freeze([...edges.prerequisiteSkills]),
  enrichmentSkills: Object.freeze([...edges.enrichmentSkills].sort()),
})])));
export const withSkillEdges = (skill) => ({
  ...skill,
  ...(prerequisiteGraph[skillKey(skill)] || { prerequisiteSkills: [], enrichmentSkills: [] }),
});

export function evidence(tutor, skill, now = Date.now()) {
  const record = tutor.records[skillKey(skill)] || {};
  const recent = record.recent || [];
  const independent = recent.filter((entry) => entry.independent && entry.level >= 1);
  const successes = independent.filter((entry) => entry.correct).length;
  const ratio = independent.length ? successes / independent.length : 0;
  // "Remembered" needs correct answers that are really apart in time: 7 at 11:50 pm and one at 12:05 am is one sitting.
  const times = independent.filter((entry) => entry.correct).map((entry) => entry.at);
  const spaced = times.length >= 2 && Math.max(...times) - Math.min(...times) >= SPACING_MS;
  const secure = independent.length >= 8 && ratio >= 0.85 && spaced && recent.slice(-3).every((entry) => entry.correct);
  const due = Boolean(record.dueAt && record.dueAt <= now);
  let label = "Not checked yet";
  if (record.lessonCompleted && !recent.length) label = "Lesson explored";
  if (recent.length) label = independent.length >= 4 && ratio >= 0.75 ? "Building confidence" : recent.some((entry) => !entry.independent) ? "Learning with support" : "Getting started";
  if (secure) label = due ? "Ready for a refresh" : "Remembered independently";
  // reviewStep is the rung (1-5) of the 1/3/7/14/30-day ladder the skill is waiting on; 0 means not on it yet.
  const reviewDueAt = Number.isFinite(record.dueAt) ? record.dueAt : null;
  const reviewStep = record.interval ? ladderIndex(record.interval) + 1 : 0; // fl4:adaptive
  return { ...record, recent, independent: independent.length, successes, ratio, secure, due, label, reviewDueAt, reviewStep, score: masteryScore(record, now), state: masteryState(record, now) };
}

export function difficulty(tutor, skill) {
  const recent = evidence(tutor, skill).recent.slice(-4);
  if (!recent.length) return 0;
  if (recent.length >= 2 && recent.slice(-2).every((item) => item.correct && !item.independent)) return 1;
  if (recent.length >= 2 && recent.slice(-2).every((item) => !item.correct || !item.independent)) return 0;
  if (
    recent.length >= 2 &&
    recent.slice(-2).every((item) => item.correct && item.level === 0)
  )
    return 1;
  if (
    recent.length >= 4 &&
    recent.every((item) => item.correct && item.independent && item.level >= 1)
  )
    return 2;
  if (recent.at(-1).level === 0) return 0;
  return 1;
}

export function adaptiveProblem(skill, rng = Math.random, level = 1) {
  const config = { ...resolveOp(skill.config, rng) };
  if (level === 0) {
    config.scaffolded = true;
    // Reduce number size while preserving the operation and the intended topic.
    const limits = { maxDenominator: 5, maxFactor: 3, maxPart: 5, maxCount: 5, maxRate: 10,
      maxCoefficient: 3, maxRoot: 12, maxBase: 5, maxExponent: 3, maxGroups: 5,
      maxQuotient: 12, maxDivisor: 6, maxMultiplier: 5, maxAmount: 5 };
    for (const [key, cap] of Object.entries(limits)) if (config[key] != null) config[key] = Math.min(config[key], cap);
    if (skill.generator === "fact") {
      if (["add", "sub"].includes(config.op)) {
        const floor = config.min ?? 0;
        // Smaller steps keep the skill's digit count: a 4-digit skill stays 4-digit instead of collapsing to its floor.
        config.max = Math.max(floor, Math.min(config.max ?? 10, floor >= 100 ? floor + Math.max(20, floor / 2) : 20));
        if (config.op === "add") config.maxResult = Math.min(config.maxResult ?? config.max * 2, config.max * 2);
      } else if (config.op === "div") {
        config.maxDivisor = Math.min(config.maxDivisor ?? 6, 6); config.maxQuotient = Math.min(config.maxQuotient ?? 12, 12);
      } else {
        const [minA, minB] = [config.minA ?? 0, config.minB ?? 0];
        // Two- and three-digit factors shrink their span; clamping to the floor made one repeated problem.
        config.maxB = minB >= 10 ? Math.min(config.maxB ?? minB + 9, minB + 9) : Math.max(minB, 5);
        if (!config.factors) config.maxA = minA >= 10 ? Math.min(config.maxA ?? minA * 4 - 1, minA * 4 - 1) : Math.max(minA, Math.min(config.maxA ?? 10, 12));
      }
    }
    if (skill.generator === "solve") {
      config.minX = 1;
      config.maxX = 6;
      config.maxCoefficient = 3;
      config.maxConstant = 6;
      config.maxQuotient = 6;
    }
    if (skill.generator === "decimalOp") {
      config.places = 1;
      config.maxScaled = 90;
      config.maxA = 20;
      config.maxB = 10;
    }
    if (skill.generator === "integerOp") { config.min = -8; config.max = 8; }
    if (skill.generator === "sequence") {
      config.maxStart = Math.min(config.maxStart ?? 50, 20);
      config.steps = (config.steps || [2, 5, 10]).slice(0, 2);
    }
    if (skill.generator === "compare") {
      const min = config.min ?? 0;
      config.max = Math.min(config.max ?? 100, min + (min >= 1000 ? 999 : min >= 100 ? 99 : 20));
    }
    if (skill.generator === "placeValue") {
      const min = config.min ?? 10;
      config.max = Math.min(config.max ?? 999, min + (min >= 1000 ? 999 : min >= 100 ? 99 : 20));
      config.places = (config.places || [1, 10, 100]).slice(0, 2);
    }
    if (skill.generator === "missingAddend") config.maxTotal = Math.min(config.maxTotal ?? 20, 10);
    if (skill.generator === "round") {
      config.places = (config.places || [10, 100]).slice(0, 1);
      config.max = Math.min(config.max ?? 999, 99);
    }
    if (skill.generator === "timeAdd") {
      config.elapsed = (config.elapsed || [15, 20, 25, 30, 35, 45, 60]).slice(0, 2);
      config.startMinutes = (config.startMinutes || [0, 30]).slice(0, 1);
    }
    if (skill.generator === "lengthMeasure") {
      config.minLength = 1;
      config.maxLength = 6;
      config.maxStart = 2;
    }
    if (skill.generator === "dataDisplay") {
      config.minCount = 1;
      config.maxCount = 8;
      config.choiceCount = 3;
    }
    if (skill.generator === "evenOdd") config.max = Math.min(config.max ?? 200, 20);
    if (skill.generator === "money") {
      config.maxCoins = Math.min(config.maxCoins ?? 4, 2);
      config.maxPennies = 4;
    }
    if (skill.generator === "scaleDrawing") {
      config.maxScale = 3;
      config.maxDrawing = 7;
    }
    if (skill.generator === "decimalPlace") config.places = 1;
    if (skill.generator === "fractionOp") {
      config.maxDenominator = Math.min(config.maxDenominator ?? 10, 4);
      config.maxWhole = 4;
    }
    if (skill.generator === "fractionOf") {
      config.maxDenominator = Math.min(config.maxDenominator ?? 10, 4);
      config.maxGroups = 4;
    }
    if (skill.generator === "gcfLcm") config.max = Math.min(config.max ?? 60, 12);
    if (skill.generator === "factorMultiple") config.max = Math.min(config.max ?? 100, 20);
    if (skill.generator === "percent") {
      config.percents = (config.percents || [10, 20, 25, 50, 75]).slice(0, 4);
      config.maxMultiplier = 6;
    }
    if (skill.generator === "percentChange") {
      config.percents = [10, 25];
      config.maxMultiplier = 6;
    }
    if (skill.generator === "expression") {
      config.minX = -3;
      config.maxX = 3;
      config.maxCoefficient = 3;
      config.maxConstant = 5;
    }
    if (skill.generator === "numberPlane") {
      config.min = -5;
      config.max = 5;
    }
    if (skill.generator === "inequality") {
      config.min = -5;
      config.max = 5;
    }
    if (skill.generator === "dataChance") {
      config.maxTotal = 10;
      config.scaffolded = true;
    }
    if (skill.generator === "geometry") {
      config.max = Math.min(config.max ?? 18, 6);
      config.maxHeight = 4;
      config.maxKnown = 60;
      if (config.shape === "angleRelations") config.relations = ["vertical", "complementary"];
    }
    if (skill.generator === "slope") {
      config.minCoordinate = -3;
      config.maxCoordinate = 3;
      config.maxRun = 2;
    }
    if (skill.generator === "functionRule") {
      config.minX = 0;
      config.maxX = 4;
      config.maxMultiplier = 3;
      config.maxConstant = 4;
    }
    if (skill.generator === "system") {
      config.minValue = 1;
      config.maxValue = 4;
    }
    if (skill.generator === "transform") {
      config.minCoordinate = -4;
      config.maxCoordinate = 4;
      config.axes = ["x-axis", "y-axis"];
    }
    if (skill.generator === "powerTen") {
      config.minPower = -1;
      config.maxPower = 2;
    }
    if (skill.generator === "association") config.scaffolded = true;
    if (skill.generator === "proportion") {
      config.maxPart = 5;
      config.maxFactor = 3;
    }
    if (skill.generator === "rateConversion") {
      config.maxAmount = 5;
      config.maxCount = 5;
      config.maxRate = 10;
      config.conversions = [["yards", "feet", 3], ["feet", "inches", 12]];
    }
    if (skill.generator === "powerTen") config.maxCoefficient = 30;
    if (skill.generator === "pythagorean") config.scaffolded = true;
  }
  // A stretch keeps grade-level content, but asks students to work without a model.
  return { ...generateProblem({ ...skill, config }, rng), skill, level };
}

export function recordAnswer(tutor, skill, result, now = Date.now()) {
  const key = skillKey(skill);
  const record = tutor.records[key] || { recent: [], independentTotal: 0, supportedTotal: 0, interval: 0 };
  const independent = Boolean(result.independent);
  const tier = isTier(result.tier) ? result.tier : null; // fl4:adaptive
  const level = [0, 1, 2].includes(result.level) ? result.level : tier ? tierToLevel(tier) : 1;
  const strategies = normalizeStrategies(result.strategyTags ?? result.strategy);
  const responseMs = Number(result.responseMs ?? result.responseTimeMs);
  const paceEligible = independent && result.calm !== false && Number.isFinite(responseMs) && responseMs >= MIN_CALM_RESPONSE_MS && responseMs <= MAX_CALM_RESPONSE_MS;
  record.strategyTags = [...new Set([...(record.strategyTags || []).filter((tag) => STRATEGIES.has(tag)), ...strategies])];
  record.recent = [...(record.recent || []), {
    correct: Boolean(result.correct), independent, level, at: now,
    ...(tier ? { tier } : {}),
    ...(strategies.length ? { strategies } : {}),
    ...(Number.isFinite(responseMs) ? { responseMs, paceEligible } : {}),
    ...(result.sig ? { sig: String(result.sig).slice(0, 24) } : {}),
  }].slice(-RECENT_WINDOW);
  record.metrics = summarizeMetrics(record);
  record.ability = updateAbility(record.ability, { correct: Boolean(result.correct), independent, tier: tier ?? levelToTier(level) }, now); // fl4:adaptive
  if (independent) record.independentTotal = (record.independentTotal || 0) + 1;
  else record.supportedTotal = (record.supportedTotal || 0) + 1;
  const previousDay = record.lastSuccessfulDay;
  if (independent && result.correct && result.level !== 0) {
    if (previousDay !== localDay(now)) record.interval = previousDay ? nextInterval(record.interval, { correct: true, independent: true, advance: true }) : REVIEW_LADDER[0];
    record.lastSuccessfulDay = localDay(now);
    record.dueAt = now + Math.max(1, record.interval) * DAY;
  } else {
    // An independent miss means the skill needs a short recheck; a hinted or easier-level success only halves the wait.
    record.interval = nextInterval(record.interval || 1, { correct: Boolean(result.correct) && !independent, independent: false });
    record.dueAt = now + record.interval * DAY;
  }
  record.lastAt = now;
  tutor.records[key] = record;
}

export function rememberMistake(tutor, skill, item, submitted, now = Date.now()) {
  const key = skillKey(skill);
  const existing = tutor.mistakes.find((entry) => entry.key === key && entry.question === item.question && !entry.resolvedAt);
  if (existing) return;
  const original = {
    question: String(item.question || "").slice(0, 500),
    answers: (Array.isArray(item.answers) ? item.answers : []).slice(0, 8).map((answer) => String(answer).slice(0, 120)),
    kind: String(item.kind || "number").slice(0, 30),
    ...(typeof item.unit === "string" ? { unit: item.unit.slice(0, 40) } : {}),
    ...(Array.isArray(item.choices) ? { choices: item.choices.slice(0, 12).map((choice) => String(choice).slice(0, 120)) } : {}),
  };
  const category = classifyMistake(item, submitted);
  tutor.mistakes.unshift({ id: `${now}-${tutor.mistakes.length}`, key, question: item.question,
    submitted: String(submitted).slice(0, 120), explanation: item.explanation, hint: item.hint,
    category: category?.id || null, misconceptionCode: category?.id || null,
    misconceptionLabel: category?.label || null, repairStatus: "open",
    problemPrompt: String(item.question || "").slice(0, 500),
    studentInput: String(submitted).slice(0, 120), expectedAnswer: String(item.answers?.[0] || "").slice(0, 120),
    original, at: now, resolvedAt: null });
  tutor.mistakes = tutor.mistakes.slice(0, 60);
}

export function feedbackFor(skill, item, raw) {
  const slip = likelyMistake(item, raw);
  if (slip) return slip;
  const submitted = Number(String(raw).replaceAll(",", "").replace("−", "-"));
  const answer = Number(item.answers[0]);
  if (Number.isFinite(submitted) && Number.isFinite(answer) && answer !== 0 && submitted === -answer) return "The size matches. Check the sign: which direction or sign does this operation require?";
  const arithmetic = item.question.replaceAll(",", "").match(/^(-?\d+(?:\.\d+)?) ([+×÷−]) \(?(-?\d+(?:\.\d+)?)\)? =/);
  if (arithmetic) {
    const a = Number(arithmetic[1]); const b = Number(arithmetic[3]); const op = arithmetic[2];
    if (op === "×" && submitted === a + b) return "That result adds the factors. Multiplication counts equal groups: find the total in all the groups.";
    if (op === "÷" && submitted === a - b) return "That removes one group. Division asks how many equal groups fit, or how much belongs in each group.";
    if (op === "−" && submitted === a + b) return "You combined the amounts. This problem asks for their difference. Try counting up from the smaller amount.";
    if (["decimalOp", "powerTen"].includes(skill.generator) && answer !== 0 && [10, 100, 0.1, 0.01].some((factor) => Math.abs(submitted - answer * factor) < 1e-8)) return "Check the place value. Estimate the size first, then check how many decimal places your result needs.";
  }
  const fractions = item.question.match(/^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+)/);
  if (fractions) {
    const [num1, den1, fracOp, num2, den2] = [Number(fractions[1]), Number(fractions[2]), fractions[3], Number(fractions[4]), Number(fractions[5])];
    const cleaned = String(raw).replaceAll(" ", "");
    if (fracOp === "+" && cleaned === `${num1 + num2}/${den1 + den2}`) return "The denominator names the size of the pieces. Make equal-sized pieces first; do not add the denominators.";
    if (fracOp === "−" && cleaned === `${num1 - num2}/${den1 - den2}`) return "The denominator names the size of the pieces. Make equal-sized pieces first; do not subtract the denominators.";
  }
  const fracMul = item.question.match(/^(\d+)\/(\d+) [×*] (\d+)\/(\d+)/);
  if (fracMul) {
    const [n1, d1, n2, d2] = [Number(fracMul[1]), Number(fracMul[2]), Number(fracMul[3]), Number(fracMul[4])];
    if (String(raw).replaceAll(" ", "") === `${n1 + n2}/${d1 + d2}`) return "When multiplying fractions, multiply the numerators together and multiply the denominators together.";
  }
  const fracDiv = item.question.match(/^(\d+)\/(\d+) [÷/] (\d+)\/(\d+)/);
  if (fracDiv) {
    const [n1, d1, n2, d2] = [Number(fracDiv[1]), Number(fracDiv[2]), Number(fracDiv[3]), Number(fracDiv[4])];
    if (String(raw).replaceAll(" ", "") === `${n1 * n2}/${d1 * d2}`) return TUTOR_NOTE;
  }
  const integerSub = item.question.replaceAll(",", "").match(/^(-?\d+) [−\-] \((-?\d+)\) =/);
  if (integerSub) {
    const a = Number(integerSub[1]); const b = Number(integerSub[2]);
    if (b < 0 && submitted === a - Math.abs(b)) return "Subtracting a negative removes a deficit: it has the same effect as adding a positive amount.";
  }
  const integerMul = item.question.replaceAll(",", "").match(/^(-?\d+) [×*] \((-?\d+)\) =/);
  if (integerMul) {
    const a = Number(integerMul[1]); const b = Number(integerMul[2]);
    if (a < 0 && b < 0 && submitted === -Math.abs(a * b)) return "A negative number multiplied by a negative number results in a positive product.";
  }
  const eqLinear = item.question.match(/^(\d+)([a-zA-Z]|\?|\bx\b)\s*=\s*(\d+)/);
  if (eqLinear) {
    const coef = Number(eqLinear[1]); const total = Number(eqLinear[3]);
    if (submitted === total - coef) return "The coefficient multiplies the variable. Undo multiplication with division on both sides, not subtraction.";
  }
  if (skill.generator === "exponent") {
    const [base, power] = item.question.match(/\d+/g).map(Number);
    if (submitted === base * power) return `The exponent counts factors: use ${base} as a factor ${power} times. It does not mean ${base} × ${power}.`;
  }
  return `${skill.learn.watch} ${item.hint}`;
}

export function recommendations(tutor, grade, now = Date.now()) {
  const skills = ALL_SKILLS.filter((skill) => skill.grade === grade);
  const diagnostic = tutor.diagnostics[grade]?.results || {};
  return skills.map((skill, index) => {
    const status = evidence(tutor, skill, now);
    const misses = tutor.mistakes.filter((entry) => entry.key === skillKey(skill) && !entry.resolvedAt).length;
    // A checkup miss is a starting point, not a verdict: it stops counting once independent practice shows the skill is working.
    const practiced = status.independent >= 3 && status.ratio >= 0.75;
    const diagnosticMiss = diagnostic[skillKey(skill)] === false && !practiced;
    const priority = misses * 5 + (diagnosticMiss ? 10 : 0) + (status.due ? 8 + Math.min(4, Math.floor((now - status.reviewDueAt) / DAY)) : 0) + (status.recent.length && status.ratio < 0.75 ? 6 : 0) + (!status.recent.length ? 2 : 0);
    const reason = misses ? "Revisit a tricky idea" : status.due ? "Time for a memory refresh" : diagnosticMiss ? "A useful next step from your checkup" : !status.recent.length ? "Explore something new" : status.secure ? "Keep this skill fresh" : "Build independent confidence";
    return { skill, status, reason, priority, index };
  }).sort((a, b) => b.priority - a.priority || a.index - b.index);
}

export function dailyPlan(tutor, grade, now = Date.now()) {
  const ranked = recommendations(tutor, grade, now);
  const focus = ranked[0];
  const byKey = new Map(ranked.map((entry) => [skillKey(entry.skill), entry]));
  const relatedPrerequisites = prerequisites(focus.skill).map((skill) => byKey.get(skillKey(skill)) || ({
    skill,
    status: evidence(tutor, skill, now),
    reason: "Strengthen an earlier idea this skill builds on.",
  }));
  const weak = (entry) => {
    const unresolved = tutor.mistakes.some((mistake) => mistake.key === skillKey(entry.skill) && !mistake.resolvedAt);
    const diagnosticMiss = tutor.diagnostics?.[entry.skill.grade]?.results?.[skillKey(entry.skill)] === false;
    return unresolved || (entry.status.independent >= 2 && entry.status.ratio < 0.75) || diagnosticMiss;
  };
  const repair = relatedPrerequisites.filter(weak).sort((a, b) => a.status.ratio - b.status.ratio)[0]
    || null;
  const review = ranked.filter((entry) => entry.status.recent.length && entry !== focus);
  const daySeed = Number(localDay(now).replaceAll("-", "")) + grade * 997;
  const rng = seededRandom(daySeed);
  const due = ranked.filter((entry) => entry.status.due).sort((a, b) => a.status.reviewDueAt - b.status.reviewDueAt);
  const practiced = review.length ? review : ranked.filter((entry) => entry !== focus && entry.status.due);
  let transferProblem = null;
  for (let attempt = 0; attempt < 24 && !transferProblem; attempt += 1) {
    const candidate = adaptiveProblem(focus.skill, rng, 3);
    transferProblem = storyFor(candidate, rng, focus.skill);
  }
  const hasTransfer = Boolean(transferProblem);
  const explore = repair ? null : ranked.find((entry) =>
    entry !== focus && !entry.status.recent.length &&
    prerequisites(entry.skill).every((prerequisite) => evidence(tutor, prerequisite, now).secure));

  let targetSlots = repair ? 3 : 4;
  const repairSlots = repair ? 3 : 0;
  const retrievalSlots = practiced.length ? (repair ? 2 : 3) : 0;
  targetSlots += Math.max(0, 10 - targetSlots - repairSlots - retrievalSlots - Number(hasTransfer) - Number(Boolean(explore)) - 1);
  const dueWithoutFocus = due.filter((entry) => entry !== focus);
  const refresh = Array.from({ length: retrievalSlots }, (_, i) => dueWithoutFocus[i] || practiced[(Math.floor(rng() * Math.max(1, practiced.length)) + i) % Math.max(1, practiced.length)] || focus);
  // Transfer stays on the focus skill. A new skill is a separate exploration item, and it only opens
  // when its recorded prerequisites are secure.
  const stretch = focus.status.secure;
  const independentClose = {
    entry: focus,
    category: stretch ? "stretch" : "independent",
    purpose: "Finish independently",
  };
  const choices = [
    ...Array.from({ length: targetSlots }, () => ({ entry: focus, category: "target", purpose: "Build confidence" })),
    ...Array.from({ length: repairSlots }, () => ({ entry: repair, category: "repair", purpose: "Repair a foundation" })),
    ...refresh.map((entry) => ({ entry, category: "retrieval", purpose: "Remember it again" })),
    ...(hasTransfer ? [{ entry: focus, category: "transfer", purpose: "Apply it in a new context", transfer: true, generated: transferProblem }] : []),
    ...(explore ? [{ entry: explore, category: "explore", purpose: "Explore something new" }] : []),
    independentClose,
  ];
  // Keep the ten-item contract and include each due review when there is room, even when several skills are overdue.
  for (const entry of due) {
    if (choices.some((choice) => choice.entry === entry)) continue;
    let replace = -1;
    for (let index = choices.length - 1; index >= 0; index -= 1)
      if (["stretch", "transfer", "explore"].includes(choices[index].category)) { replace = index; break; }
    if (replace >= 0) choices[replace] = { entry, category: "retrieval", purpose: "Remember it again" };
    else break;
  }
  const categoryIndex = {};
  return choices.slice(0, 10).map(({ entry, category, purpose, transfer: isTransfer, generated }, index) => {
    const ordinal = categoryIndex[category] || 0;
    categoryIndex[category] = ordinal + 1;
    const independent = category === "retrieval" || category === "transfer" || category === "independent" || category === "stretch" || (category === "target" && index >= 2) || (category === "repair" && ordinal >= 2);
    return {
      key: skillKey(entry.skill),
      purpose,
      category,
      reason: category === "target" || category === "repair" || category === "explore" ? entry.reason : category === "retrieval" ? (entry.status.due ? "A spaced review is due." : "Bring a recent skill back to mind.") : category === "transfer" ? "Apply the same skill in a new context." : category === "stretch" ? "You have shown this skill independently; try a deeper problem." : "Try one independently to stretch your thinking.",
      independent,
      ...(category === "repair" ? { unlocks: skillKey(focus.skill) } : {}),
      ...(isTransfer ? { transfer: true } : {}),
      ...(generated ? { generated } : {}),
      ...((category === "stretch" ? { tier: 4 } : independent ? { tier: 3 } : {})),
      ...(entry.status.due ? { reviewDueAt: entry.status.reviewDueAt, reviewStep: entry.status.reviewStep } : {}),
    };
  });
}

// A short, grade-anchored sequence: check the selected skill, visit one relevant
// foundation, then return to the original skill for coached, independent, and
// contextual work. The plan is derived from the current session/device evidence;
// it never creates a learner record of its own.
export function missionPlan(tutor, grade, now = Date.now()) {
  const target = recommendations(tutor, grade, now)[0]?.skill || getGrade(grade)?.skills?.[0];
  if (!target) return [];
  const foundation = prerequisites(target)[0] || target;
  const targetKey = skillKey(target);
  const foundationKey = skillKey(foundation);
  return [
    { key: targetKey, purpose: "Starting point", reason: "Try the grade-level idea first." },
    { key: foundationKey, purpose: foundationKey === targetKey ? "Explore the idea" : "A useful foundation", reason: foundationKey === targetKey ? "Notice what you already know." : "A brief visit to a related prerequisite." },
    { key: targetKey, purpose: "Build with support", reason: "Use a strategy or model, then solve." },
    { key: targetKey, purpose: "Try independently", reason: "Return to the grade-level skill." },
    { key: targetKey, purpose: "Transfer", reason: "Use the same idea with a new problem or context.", transfer: true },
  ];
}

export function diagnosticPlan(grade) {
  return getGrade(grade).skills.map((skill) => ({ key: `${grade}:${skill.id}`, purpose: "Starting-point checkup" }));
}

export function sanitizeTutor(value) {
  const clean = emptyTutor();
  if (!value || value.version !== 2 || typeof value.records !== "object" || Array.isArray(value.records)) return clean;
  for (const skill of ALL_SKILLS) {
    const key = skillKey(skill); const record = value.records?.[key];
    if (!record || typeof record !== "object") continue;
    const recent = (Array.isArray(record.recent) ? record.recent : []).filter((entry) => entry && Number.isFinite(entry.at) && typeof entry.correct === "boolean" && typeof entry.independent === "boolean").slice(-RECENT_WINDOW).map((entry) => {
      const level = [0, 1, 2].includes(entry.level) ? entry.level : 1;
      const tier = isTier(entry.tier) ? entry.tier : null; // fl4:adaptive
      const responseMs = Number(entry.responseMs);
      const validResponse = Number.isFinite(responseMs) && responseMs >= MIN_CALM_RESPONSE_MS && responseMs <= MAX_CALM_RESPONSE_MS;
      const strategies = normalizeStrategies(entry.strategies);
      return {
        correct: entry.correct, independent: entry.independent, at: entry.at, level,
        ...(tier ? { tier } : {}),
        ...(strategies.length ? { strategies } : {}),
        ...(typeof entry.sig === "string" && entry.sig ? { sig: entry.sig.slice(0, 24) } : {}),
        ...(validResponse ? { responseMs, paceEligible: Boolean(entry.paceEligible && entry.independent && level >= 1) } : {}),
      };
    });
    const strategyTags = normalizeStrategies(record.strategyTags);
    clean.records[key] = {
      recent,
      independentTotal: Math.max(0, Number(record.independentTotal) || 0), supportedTotal: Math.max(0, Number(record.supportedTotal) || 0),
      dueAt: Number.isFinite(record.dueAt) ? record.dueAt : null, interval: Math.min(REVIEW_LADDER.at(-1), Math.max(0, Number(record.interval) || 0)),
      lastAt: Number.isFinite(record.lastAt) ? record.lastAt : null, lastSuccessfulDay: String(record.lastSuccessfulDay || "").slice(0, 10), lessonCompleted: Boolean(record.lessonCompleted),
      strategyTags: [...new Set([...strategyTags, ...recent.flatMap((entry) => entry.strategies || [])])],
      metrics: summarizeMetrics({ recent, strategyTags }),
      ...(sanitizeAbility(record.ability) ? { ability: sanitizeAbility(record.ability) } : {}), // fl4:adaptive
    };
  }
  clean.mistakes = (Array.isArray(value.mistakes) ? value.mistakes : []).filter((entry) => entry && findSkill(entry.key) && typeof entry.question === "string").slice(0, 60).map((entry, index) => ({
    id: String(entry.id || index).slice(0, 100), key: entry.key, question: entry.question.slice(0, 500), submitted: String(entry.submitted || "").slice(0, 120),
    explanation: String(entry.explanation || "").slice(0, 800), hint: String(entry.hint || "").slice(0, 800),
    category: isKnownMistakeCategory(entry.category) ? entry.category : null,
    misconceptionCode: isKnownMistakeCategory(entry.misconceptionCode) ? entry.misconceptionCode : (isKnownMistakeCategory(entry.category) ? entry.category : null),
    misconceptionLabel: typeof entry.misconceptionLabel === "string" ? entry.misconceptionLabel.slice(0, 160) : null,
    repairStatus: entry.resolvedAt ? "repaired" : (entry.repairStatus === "in-progress" ? "in-progress" : "open"),
    problemPrompt: String(entry.problemPrompt || entry.question).slice(0, 500),
    studentInput: String(entry.studentInput || entry.submitted || "").slice(0, 120),
    expectedAnswer: String(entry.expectedAnswer || entry.original?.answers?.[0] || "").slice(0, 120),
    original: entry.original && typeof entry.original === "object" && typeof entry.original.question === "string" && entry.original.question.length <= 500 && Array.isArray(entry.original.answers) && entry.original.answers.length > 0
      ? { question: entry.original.question, answers: entry.original.answers.slice(0, 8).map((answer) => String(answer).slice(0, 120)), kind: String(entry.original.kind || "number").slice(0, 30), ...(typeof entry.original.unit === "string" ? { unit: entry.original.unit.slice(0, 40) } : {}), ...(Array.isArray(entry.original.choices) ? { choices: entry.original.choices.slice(0, 12).map((choice) => String(choice).slice(0, 120)) } : {}) }
      : null,
    at: Number(entry.at) || 0, resolvedAt: Number(entry.resolvedAt) || null,
  }));
  for (let grade = 0; grade <= 8; grade++) {
    const diagnostic = value.diagnostics?.[grade];
    if (diagnostic?.results && typeof diagnostic.results === "object") clean.diagnostics[grade] = {
      at: Number(diagnostic.at) || 0,
      results: Object.fromEntries(Object.entries(diagnostic.results).filter(([key, result]) => findSkill(key)?.grade === grade && typeof result === "boolean")),
      // Foundation probes reach into earlier grades, so they are keyed by any skill at or below this grade.
      foundations: Object.fromEntries(Object.entries(diagnostic.foundations || {}).filter(([key, result]) => findSkill(key)?.grade <= grade && typeof result === "boolean")),
      unsure: [...new Set((Array.isArray(diagnostic.unsure) ? diagnostic.unsure : []).filter((key) => findSkill(key)?.grade <= grade))],
    };
  }
  clean.rescues = sanitizeRescues(value.rescues); // fl4:adaptive
  clean.sessions = (Array.isArray(value.sessions) ? value.sessions : []).filter((session) => session && Number.isFinite(session.at) && Number.isFinite(session.answered)).slice(-60).map((session) => ({ at: session.at, answered: Math.max(0, session.answered), correct: Math.max(0, Number(session.correct) || 0), grade: Math.min(8, Math.max(0, Number(session.grade) || 0)), mode: String(session.mode || "practice").slice(0, 30) }));
  return clean;
}

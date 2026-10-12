import { likelyMistake } from "./mistake-notes.js";
import { ALL_SKILLS, GENERATOR_PARTS, baseGenerator, generateProblem, getGrade, opsOf, resolveOp, seededRandom } from "./problem-bank.js";

export const DAY = 86400000;
const SPACING_MS = 18 * 3600 * 1000;
export const skillKey = (skill) => `${skill.grade}:${skill.id}`;
export const findSkill = (key) => ALL_SKILLS.find((skill) => skillKey(skill) === key);
export const localDay = (time = Date.now()) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export const emptyTutor = () => ({ version: 2, records: {}, mistakes: [], diagnostics: {}, sessions: [] });

const FOUNDATIONS = {
  "1:add-20": ["1:make-10"], "1:subtract-20": ["1:missing-addend"],
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
  for (let g = grade; g >= 1; g -= 1) {
    const skill = matchSkill(getGrade(g)?.skills || [], item);
    if (skill) return skill;
  }
  return null;
}

export function prerequisites(skill) {
  const explicit = (FOUNDATIONS[skillKey(skill)] || []).map(findSkill).filter(Boolean);
  if (explicit.length) return explicit;
  // A mixed skill ("add and subtract") builds on an earlier skill that practised either operation.
  const earlier = ALL_SKILLS.filter((candidate) => candidate.grade < skill.grade && baseGenerator(candidate) === baseGenerator(skill) && opsOf(candidate.config).some((op) => opsOf(skill.config).includes(op)));
  return earlier.length ? [earlier.at(-1)] : [];
}

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
  return { ...record, recent, independent: independent.length, successes, ratio, secure, due, label, score: independent.length ? Math.round(ratio * 100) : null };
}

export function difficulty(tutor, skill) {
  const recent = evidence(tutor, skill).recent.slice(-4);
  if (recent.length >= 2 && recent.slice(-2).every((item) => item.correct && !item.independent)) return 1;
  if (recent.length >= 2 && recent.slice(-2).every((item) => !item.correct || !item.independent)) return 0;
  if (recent.length >= 4 && recent.every((item) => item.correct && item.independent)) return 2;
  return 1;
}

export function adaptiveProblem(skill, rng = Math.random, level = 1) {
  const config = { ...resolveOp(skill.config, rng) };
  if (level === 0) {
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
    if (skill.generator === "solve") { config.minX = 1; config.maxX = 6; config.maxCoefficient = 3; }
    if (skill.generator === "decimalOp") { config.maxScaled = 100; config.maxA = 20; config.maxB = 10; }
    if (skill.generator === "integerOp") { config.min = -8; config.max = 8; }
  }
  // A stretch keeps grade-level content, but asks students to work without a model.
  return { ...generateProblem({ ...skill, config }, rng), skill, level };
}

export function recordAnswer(tutor, skill, result, now = Date.now()) {
  const key = skillKey(skill);
  const record = tutor.records[key] || { recent: [], independentTotal: 0, supportedTotal: 0, interval: 0 };
  const independent = Boolean(result.independent);
  record.recent = [...(record.recent || []), { correct: Boolean(result.correct), independent, level: result.level ?? 1, at: now }].slice(-20);
  if (independent) record.independentTotal = (record.independentTotal || 0) + 1;
  else record.supportedTotal = (record.supportedTotal || 0) + 1;
  const previousDay = record.lastSuccessfulDay;
  if (independent && result.correct && result.level !== 0) {
    if (previousDay !== localDay(now)) record.interval = previousDay ? Math.min(14, Math.max(1, record.interval) * 2) : 1;
    record.lastSuccessfulDay = localDay(now);
    record.dueAt = now + Math.max(1, record.interval) * DAY;
  } else {
    // An independent miss means the skill needs a short recheck; a hinted or easier-level success only halves the wait.
    record.interval = independent || !result.correct ? 1 : Math.max(1, Math.floor((record.interval || 1) / 2));
    record.dueAt = now + record.interval * DAY;
  }
  record.lastAt = now;
  tutor.records[key] = record;
}

export function rememberMistake(tutor, skill, item, submitted, now = Date.now()) {
  const key = skillKey(skill);
  const existing = tutor.mistakes.find((entry) => entry.key === key && entry.question === item.question && !entry.resolvedAt);
  if (existing) return;
  tutor.mistakes.unshift({ id: `${now}-${tutor.mistakes.length}`, key, question: item.question,
    submitted: String(submitted).slice(0, 120), explanation: item.explanation, hint: item.hint, at: now, resolvedAt: null });
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
  if (fractions && String(raw).replaceAll(" ", "") === `${Number(fractions[1]) + Number(fractions[4])}/${Number(fractions[2]) + Number(fractions[5])}`) return "The denominator names the size of the pieces. Make equal-sized pieces first; do not add the denominators.";
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
    const priority = misses * 5 + (diagnosticMiss ? 10 : 0) + (status.due ? 8 : 0) + (status.recent.length && status.ratio < 0.75 ? 6 : 0) + (!status.recent.length ? 2 : 0);
    const reason = misses ? "Revisit a tricky idea" : status.due ? "Time for a memory refresh" : diagnosticMiss ? "A useful next step from your checkup" : !status.recent.length ? "Explore something new" : status.secure ? "Keep this skill fresh" : "Build independent confidence";
    return { skill, status, reason, priority, index };
  }).sort((a, b) => b.priority - a.priority || a.index - b.index);
}

export function dailyPlan(tutor, grade, now = Date.now()) {
  const ranked = recommendations(tutor, grade, now);
  const focus = ranked[0];
  const review = ranked.filter((entry) => entry.status.recent.length && entry !== focus);
  const newSkill = ranked.find((entry) => !entry.status.recent.length && entry !== focus) || ranked[1];
  const daySeed = Number(localDay(now).replaceAll("-", "")) + grade * 997;
  const rng = seededRandom(daySeed);
  const reviewPool = review.length ? review : ranked.slice(1);
  const refresh = Array.from({ length: 3 }, (_, i) => reviewPool[(Math.floor(rng() * reviewPool.length) + i) % reviewPool.length]);
  return [focus, refresh[0], focus, newSkill, refresh[1], focus, newSkill, refresh[2], focus, ranked[1]].map((entry, index) => ({
    key: skillKey(entry.skill), purpose: [0, 2, 5, 8].includes(index) ? "Build confidence" : [3, 6].includes(index) ? "Connect a new idea" : index === 9 ? "Finish independently" : "Remember it again",
  }));
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
    clean.records[key] = {
      recent: (Array.isArray(record.recent) ? record.recent : []).filter((entry) => entry && Number.isFinite(entry.at) && typeof entry.correct === "boolean" && typeof entry.independent === "boolean").slice(-20).map((entry) => ({ correct: entry.correct, independent: entry.independent, at: entry.at, level: [0, 1, 2].includes(entry.level) ? entry.level : 1 })),
      independentTotal: Math.max(0, Number(record.independentTotal) || 0), supportedTotal: Math.max(0, Number(record.supportedTotal) || 0),
      dueAt: Number.isFinite(record.dueAt) ? record.dueAt : null, interval: Math.min(14, Math.max(0, Number(record.interval) || 0)),
      lastAt: Number.isFinite(record.lastAt) ? record.lastAt : null, lastSuccessfulDay: String(record.lastSuccessfulDay || "").slice(0, 10), lessonCompleted: Boolean(record.lessonCompleted),
    };
  }
  clean.mistakes = (Array.isArray(value.mistakes) ? value.mistakes : []).filter((entry) => entry && findSkill(entry.key) && typeof entry.question === "string").slice(0, 60).map((entry, index) => ({
    id: String(entry.id || index).slice(0, 100), key: entry.key, question: entry.question.slice(0, 500), submitted: String(entry.submitted || "").slice(0, 120),
    explanation: String(entry.explanation || "").slice(0, 800), hint: String(entry.hint || "").slice(0, 800), at: Number(entry.at) || 0, resolvedAt: Number(entry.resolvedAt) || null,
  }));
  for (let grade = 1; grade <= 8; grade++) {
    const diagnostic = value.diagnostics?.[grade];
    if (diagnostic?.results && typeof diagnostic.results === "object") clean.diagnostics[grade] = { at: Number(diagnostic.at) || 0, results: Object.fromEntries(Object.entries(diagnostic.results).filter(([key, result]) => findSkill(key)?.grade === grade && typeof result === "boolean")) };
  }
  clean.sessions = (Array.isArray(value.sessions) ? value.sessions : []).filter((session) => session && Number.isFinite(session.at) && Number.isFinite(session.answered)).slice(-60).map((session) => ({ at: session.at, answered: Math.max(0, session.answered), correct: Math.max(0, Number(session.correct) || 0), grade: Math.min(8, Math.max(1, Number(session.grade) || 1)), mode: String(session.mode || "practice").slice(0, 30) }));
  return clean;
}

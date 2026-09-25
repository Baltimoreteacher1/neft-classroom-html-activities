import { ALL_SKILLS, generateProblem, getGrade, seededRandom } from "./problem-bank.js";

export const DAY = 86400000;
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
  "3:division-facts": ["3:mul-0-5"], "4:division": ["3:division-facts"],
  "4:multiply-1digit": ["3:mul-6-9"], "4:multiply-2digit": ["3:mul-6-9"],
  "5:fraction-add": ["4:fraction-equiv"], "5:fraction-mul": ["3:mul-0-5"],
  "6:divide-fractions": ["5:fraction-mul"], "6:ratios": ["3:mul-0-5"],
  "6:unit-rates": ["4:division"], "6:percent": ["5:fraction-of"],
  "7:equations": ["6:one-step"], "7:proportions": ["6:ratios"],
  "7:percent-change": ["6:percent"], "7:unit-rate": ["6:unit-rates"],
  "8:linear-equations": ["7:equations"], "8:systems": ["7:equations"],
  "8:slope": ["7:integer-add", "6:unit-rates"], "8:functions": ["6:evaluate"],
  "8:pythagorean": ["8:square-roots", "8:exponents"],
};

export function prerequisites(skill) {
  const explicit = (FOUNDATIONS[skillKey(skill)] || []).map(findSkill).filter(Boolean);
  if (explicit.length) return explicit;
  const earlier = ALL_SKILLS.filter((candidate) => candidate.grade < skill.grade && candidate.generator === skill.generator && candidate.config.op === skill.config.op);
  return earlier.length ? [earlier.at(-1)] : [];
}

export function evidence(tutor, skill, now = Date.now()) {
  const record = tutor.records[skillKey(skill)] || {};
  const recent = record.recent || [];
  const independent = recent.filter((entry) => entry.independent && entry.level >= 1);
  const successes = independent.filter((entry) => entry.correct).length;
  const ratio = independent.length ? successes / independent.length : 0;
  const days = new Set(independent.filter((entry) => entry.correct).map((entry) => localDay(entry.at)));
  const secure = independent.length >= 8 && ratio >= 0.85 && days.size >= 2 && recent.slice(-3).every((entry) => entry.correct);
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
  const config = { ...skill.config };
  if (level === 0) {
    // Reduce number size while preserving the operation and the intended topic.
    const limits = { maxDenominator: 5, maxFactor: 3, maxPart: 5, maxCount: 5, maxRate: 10,
      maxCoefficient: 3, maxRoot: 12, maxBase: 5, maxExponent: 3, maxGroups: 5,
      maxQuotient: 12, maxDivisor: 6, maxMultiplier: 5, maxAmount: 5 };
    for (const [key, cap] of Object.entries(limits)) if (config[key] != null) config[key] = Math.min(config[key], cap);
    if (skill.generator === "fact") {
      if (["add", "sub"].includes(config.op)) {
        const floor = config.min ?? 0;
        config.max = Math.max(floor, Math.min(config.max ?? 10, floor >= 100 ? 120 : 20));
        if (config.op === "add") config.maxResult = Math.min(config.maxResult ?? config.max * 2, config.max * 2);
      } else if (config.op === "div") {
        config.maxDivisor = 6; config.maxQuotient = 12;
      } else {
        config.maxB = Math.max(config.minB ?? 0, 5);
        if (!config.factors) config.maxA = Math.max(config.minA ?? 0, Math.min(config.maxA ?? 10, 12));
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
  } else { record.interval = 1; record.dueAt = now + DAY; }
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
    const diagnosticMiss = diagnostic[skillKey(skill)] === false;
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

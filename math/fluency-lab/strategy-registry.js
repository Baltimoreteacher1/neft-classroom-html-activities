// Central Typed, Versioned Mathematics Strategy Registry & Canonical Solution Engine.
// Unifies all 128 K–8 skills into one authoritative instructional contract so that
// student lessons, practice, games, teacher assignments, interventions, and family guides
// never contradict one another.

import { ALL_SKILLS, generateProblem, getSkill, seededRandom } from "./problem-bank.js";
import { AUTHORED } from "./shell/authored/index.js";
import { TITLES_ES } from "./shell/titles-es.js";
import { framesOf, lessonFor, repsOf } from "./studio/engines.js";
import { pick } from "./studio/core.js";
import {
  loadCurriculumSettings,
  resolveCurriculumProfile,
  strategyAlignmentForSkill,
} from "./curriculum-profiles.js";
import { helpLadder, revealsAnswer } from "./shell/content.js";
import { classifyMistake, likelyMistake } from "./mistake-notes.js";

export const STRATEGY_REGISTRY_VERSION = "1.0.0";

const L = (en, es) => ({ en, es: es ?? en });

// Prerequisite map matching tutor-engine.js FOUNDATIONS
const PREREQUISITES = Object.freeze({
  "1:add-20": ["1:make-10"],
  "1:subtract-20": ["1:missing-addend"],
  "1:add-10": ["0:compose-10", "0:add-sub-5"],
  "1:subtract-10": ["0:add-sub-5"],
  "1:make-10": ["0:compose-10"],
  "2:add-100": ["1:tens-ones", "1:add-20"],
  "2:subtract-100": ["1:subtract-20"],
  "2:add-1000": ["2:place-1000", "2:add-100"],
  "3:mul-6-9": ["3:mul-0-5"],
  "3:mul-10-12": ["3:mul-0-5"],
  "3:division-facts": ["3:mul-0-5"],
  "3:area": ["3:mul-0-5"],
  "4:division": ["3:division-facts"],
  "4:multiply-1digit": ["3:mul-6-9"],
  "4:multiply-2digit": ["3:mul-6-9"],
  "5:fraction-add": ["4:fraction-equiv"],
  "5:fraction-mul": ["3:mul-0-5"],
  "6:divide-fractions": ["5:fraction-mul"],
  "6:ratios": ["3:mul-0-5"],
  "6:unit-rates": ["4:division"],
  "6:percent": ["5:fraction-of"],
  "7:equations": ["6:one-step"],
  "7:proportions": ["6:ratios"],
  "7:fraction-ops": ["5:fraction-add"],
  "7:percent-change": ["6:percent"],
  "7:unit-rate": ["6:unit-rates"],
  "8:linear-equations": ["7:equations"],
  "8:systems": ["7:equations"],
  "8:slope": ["7:integer-add", "6:unit-rates"],
  "8:functions": ["6:evaluate"],
  "8:pythagorean": ["8:square-roots", "8:exponents"],
});

const DOMAIN_BY_STRAND = Object.freeze({
  counting: "Counting & Cardinality",
  operations: "Operations & Algebraic Thinking",
  placeValue: "Number & Operations in Base Ten",
  fractions: "Number & Operations — Fractions",
  decimals: "Number & Operations in Base Ten (Decimals)",
  ratios: "Ratios & Proportional Relationships",
  expressions: "Expressions & Equations",
  geometry: "Geometry",
  measurement: "Measurement & Data",
  statistics: "Statistics & Probability",
  functions: "Functions",
  numberSystem: "The Number System",
});

function inferDomain(skill) {
  if (skill.strand && DOMAIN_BY_STRAND[skill.strand]) return DOMAIN_BY_STRAND[skill.strand];
  const id = skill.id;
  if (/ratio|rate|percent|proportion/.test(id)) return DOMAIN_BY_STRAND.ratios;
  if (/frac|mixed|equal-shares/.test(id)) return DOMAIN_BY_STRAND.fractions;
  if (/dec|place|round|tens|1000/.test(id)) return DOMAIN_BY_STRAND.placeValue;
  if (/eq|expr|ineq|term|eval|system|one-step/.test(id)) return DOMAIN_BY_STRAND.expressions;
  if (/func|slope|graph|coord/.test(id)) return DOMAIN_BY_STRAND.functions;
  if (/area|vol|geo|angle|shape|circle|circum|pythag|transform|surface/.test(id)) return DOMAIN_BY_STRAND.geometry;
  if (/stat|sampl|prob|mean|median|plot/.test(id)) return DOMAIN_BY_STRAND.statistics;
  if (/time|coin|money|measure|ruler/.test(id)) return DOMAIN_BY_STRAND.measurement;
  if (/int|rational|neg|root|exp|sci/.test(id)) return DOMAIN_BY_STRAND.numberSystem;
  return DOMAIN_BY_STRAND.operations;
}

function gradeRangeFor(grade) {
  if (grade <= 2) return "K–2";
  if (grade <= 5) return "3–5";
  return "6–8";
}

function modeledSampleFor(skill) {
  for (let seed = 11; seed < 40; seed += 1) {
    const item = generateProblem(skill, seededRandom(seed * 7919));
    const lesson = lessonFor(item);
    if (lesson?.modeled) return { item, lesson };
  }
  const item = generateProblem(skill, seededRandom(17 * 7919));
  return { item, lesson: lessonFor(item) };
}

function buildStrategyEntry(skill) {
  const key = `${skill.grade}:${skill.id}`;
  const authored = AUTHORED[key] || {};
  const { item: sampleItem, lesson } = modeledSampleFor(skill);
  const transferItem = generateProblem(skill, seededRandom(29 * 7919));

  const title = authored.title || L(skill.title, TITLES_ES[skill.title] || skill.title);
  const concept = authored.concept || L(skill.learn?.rule || `Build conceptual understanding and fluency with ${skill.title.toLowerCase()}.`);
  const misconceptionSummary = authored.misconception || L(skill.learn?.watch || "Check that each step preserves mathematical value.");

  const generalAlignment = strategyAlignmentForSkill(key, "general-standards");
  const revealAlignment = strategyAlignmentForSkill(key, "reveal-math");

  return Object.freeze({
    registryVersion: STRATEGY_REGISTRY_VERSION,
    strategyId: `strat:${key}`,
    skillId: skill.id,
    skillKey: key,
    grade: skill.grade,
    gradeRange: gradeRangeFor(skill.grade),
    domain: inferDomain(skill),
    title,
    standards: [skill.standard, skill.mccrs2025].filter(Boolean),
    prerequisites: PREREQUISITES[key] || [],
    learningObjective: L(
      `Understand and solve ${skill.title.toLowerCase()} using verified visual models and reasoning.`,
      `Comprender y resolver ${(title.es || skill.title).toLowerCase()} usando modelos visuales y razonamiento verificado.`,
    ),
    conceptualExplanation: concept,
    preferredVisual: lesson?.modeled ? lesson.engine.id : "worked-steps",
    visualModeled: Boolean(lesson?.modeled),
    transformationSteps: Array.isArray(sampleItem.steps) ? sampleItem.steps : [],
    vocabulary: Array.isArray(skill.vocab) ? skill.vocab : [],
    workedExample: {
      question: sampleItem.question,
      answer: sampleItem.answers?.[0] ?? "",
      steps: sampleItem.steps || [],
    },
    guidedExample: authored.guided || [],
    transferProblem: authored.transfer || {
      question: transferItem.question,
      answer: transferItem.answers?.[0] ?? "",
    },
    misconceptionPatterns: (authored.misconceptions || []).map((m, idx) => ({
      id: m.id || `${key}:m${idx + 1}`,
      summary: m.note || m.message || misconceptionSummary,
    })),
    misconceptionSummary,
    targetedHints: [
      sampleItem.hint || "Notice what the quantities represent before choosing an operation.",
      authored.another?.text?.en || null,
    ].filter(Boolean),
    alternateStrategies: [
      ...(lesson?.modeled ? repsOf(lesson).slice(1) : []),
      ...(authored.another?.text ? ["authored-alternative"] : []),
    ],
    curriculumProfiles: {
      "general-standards": generalAlignment,
      "reveal-math": revealAlignment,
    },
    verificationStatus: generalAlignment.verificationStatus,
    reviewer: generalAlignment.reviewer,
    lastReviewDate: generalAlignment.lastReviewDate,
  });
}

let cachedRegistry = null;

export function getStrategyRegistry() {
  if (!cachedRegistry) {
    const map = new Map();
    for (const skill of ALL_SKILLS) {
      const entry = buildStrategyEntry(skill);
      map.set(entry.skillKey, entry);
    }
    cachedRegistry = map;
  }
  return cachedRegistry;
}

export function listStrategies({ grade = null, domain = null } = {}) {
  const all = [...getStrategyRegistry().values()];
  return all.filter((s) => (grade === null || s.grade === grade) && (!domain || s.domain === domain));
}

export function getStrategy(skillOrKey, settings = null) {
  const key =
    typeof skillOrKey === "string"
      ? skillOrKey
      : skillOrKey
        ? `${skillOrKey.grade}:${skillOrKey.id}`
        : null;
  if (!key) return null;
  const base = getStrategyRegistry().get(key);
  if (!base) return null;
  const activeSettings = settings || loadCurriculumSettings();
  const profile = resolveCurriculumProfile(activeSettings.profileId);
  const alignment = strategyAlignmentForSkill(key, profile.id);
  const override = activeSettings.lessonOverrides?.[key] || null;
  return {
    ...base,
    activeProfile: profile,
    activeAlignment: alignment,
    preferredMethod: override?.method || activeSettings.preferredMethod || profile.defaultMethod,
    teacherNote: override?.note || "",
  };
}

// Canonical Mathematical Solution Engine:
// Derives correct answer, equivalent answers, worked steps, visual model states,
// audio explanation script, graduated hints, and error classifications from ONE item.
export function buildCanonicalSolution(skill, item, { lang = "en", settings = null } = {}) {
  const strategy = getStrategy(skill, settings);
  const lesson = lessonFor(item);
  const rep = lesson?.modeled ? lesson.spec.reps?.[0] || "main" : "main";
  const visualFrames = lesson?.modeled ? framesOf(lesson, rep) : [];
  const ladder = helpLadder(skill, item);
  const answers = Array.isArray(item.answers) ? item.answers : [];
  const steps = Array.isArray(item.steps) ? item.steps : [];

  const audioScript = {
    en: [
      `Problem: ${item.question}`,
      strategy?.conceptualExplanation?.en || "",
      ...steps.map((s, i) => `Step ${i + 1}: ${s}`),
    ]
      .filter(Boolean)
      .join(" "),
    es: [
      `Problema: ${item.questionEs || item.question}`,
      strategy?.conceptualExplanation?.es || "",
      ...visualFrames.map((f, i) => `Paso ${i + 1}: ${pick(f.cap, "es") || ""}`),
    ]
      .filter(Boolean)
      .join(" "),
  };

  return {
    strategyId: strategy?.strategyId || `strat:${skill.grade}:${skill.id}`,
    skillKey: `${skill.grade}:${skill.id}`,
    question: item.question,
    correctAnswer: answers[0] ?? "",
    equivalentAnswers: answers,
    workedSteps: steps,
    notation: visualFrames.map((f) => f.eq).filter(Boolean),
    visualModel: {
      engineId: lesson?.modeled ? lesson.engine.id : "steps",
      modeled: Boolean(lesson?.modeled),
      frames: visualFrames,
      alternateReps: lesson?.modeled ? repsOf(lesson).slice(1) : [],
    },
    audioScript: audioScript[lang] || audioScript.en,
    audioScripts: audioScript,
    helpLadder: ladder,
    classifyWrongAnswer(rawWrong) {
      const category = classifyMistake(item, rawWrong);
      const note = likelyMistake(item, rawWrong);
      return {
        category: category || null,
        note: note || null,
        hasSafeHint: Boolean(item.hint && !revealsAnswer(item.hint, item)),
      };
    },
    curriculumAlignment: strategy?.activeAlignment || null,
  };
}

// Misleading shortcut patterns that must never appear without conceptual grounding.
const MISLEADING_SHORTCUT_PATTERNS = [
  { id: "bare-move-decimal", re: /\bjust move the decimal\b/i, reason: "Unexplained 'just move the decimal' without place-value scaling." },
  { id: "bare-cross-multiply", re: /\bjust cross[- ]multiply\b/i, reason: "Unexplained 'just cross-multiply' shortcut." },
  { id: "bare-flip-it", re: /\bjust flip it\b/i, reason: "Unexplained 'just flip it' without reciprocal reasoning." },
];

export function auditStrategyRegistry() {
  const entries = [...getStrategyRegistry().values()];
  const issues = [];
  let modeledCount = 0;
  let verifiedRevealCount = 0;
  let pendingRevealCount = 0;

  for (const entry of entries) {
    if (entry.visualModeled) modeledCount += 1;
    if (entry.curriculumProfiles["reveal-math"].verificationStatus === "verified-reveal") {
      verifiedRevealCount += 1;
    } else {
      pendingRevealCount += 1;
    }
    if (!entry.standards.length) {
      issues.push({ skillKey: entry.skillKey, severity: "error", code: "missing-standard" });
    }
    const textBlob = [
      entry.conceptualExplanation.en,
      ...entry.transformationSteps,
      ...entry.targetedHints,
    ].join(" ");
    for (const pat of MISLEADING_SHORTCUT_PATTERNS) {
      if (pat.re.test(textBlob)) {
        issues.push({ skillKey: entry.skillKey, severity: "warning", code: pat.id, reason: pat.reason });
      }
    }
  }

  return {
    version: STRATEGY_REGISTRY_VERSION,
    totalSkills: entries.length,
    modeledSkills: modeledCount,
    unmodeledSkills: entries.length - modeledCount,
    verifiedRevealSkills: verifiedRevealCount,
    pendingRevealSkills: pendingRevealCount,
    issues,
    ok: issues.filter((i) => i.severity === "error").length === 0,
  };
}

export function resolveSkill(keyOrSkill) {
  if (typeof keyOrSkill === "string") {
    const [g, id] = keyOrSkill.split(":");
    return getSkill(Number(g), id);
  }
  return keyOrSkill;
}

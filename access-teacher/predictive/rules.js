// Versioned WIDA score rules for the Data Studio: which assessments exist, which scale and proficiency-level
// version a result belongs to, which results may be compared, and the composite weights the studio is allowed
// to apply. Every rule names its source and when a person last checked it. A rule here is a statement about
// how WIDA reports scores; nothing in this file estimates or predicts a student's score.
import { SCALE_RESET_YEAR } from "../../access-practice-lab/src/lang/dna.js";

export const RULES_VERSION = "2026-11-17.1";
export { SCALE_RESET_YEAR };
/** First school year reported on the cut scores set at WIDA's summer 2026 standard setting. */
export const NEW_CUTS_YEAR = "2026-27";

export const DOMAINS = Object.freeze(["Listening", "Speaking", "Reading", "Writing"]);
export const COMPOSITES = Object.freeze(["Oral", "Literacy", "Comprehension", "Overall"]);
export const SCORE_KEYS = Object.freeze([...DOMAINS, ...COMPOSITES]);

export const COMPOSITE_INFO = Object.freeze({
  Oral: {
    label: "Oral Language",
    parts: "Listening and Speaking",
    means: "How the student understands and uses spoken English.",
  },
  Literacy: {
    label: "Literacy",
    parts: "Reading and Writing",
    means: "How the student reads and writes academic English.",
  },
  Comprehension: {
    label: "Comprehension",
    parts: "Listening and Reading",
    means: "How the student understands spoken and written English (weighted toward Reading).",
  },
  Overall: {
    label: "Overall",
    parts: "all four domains",
    means:
      "One summary of all four domains, weighted toward Reading and Writing. Read it with the domain scores, never instead of them.",
  },
});

export const ASSESSMENTS = Object.freeze({
  ACCESS: {
    label: "WIDA ACCESS",
    short: "ACCESS",
    kind: "annual",
    grades: "1-12",
    store: "official",
  },
  KINDERGARTEN_ACCESS: {
    label: "WIDA ACCESS for Kindergarten",
    short: "K ACCESS",
    kind: "annual",
    grades: "K",
    store: "official",
  },
  MODEL_ONLINE: {
    label: "WIDA MODEL Online",
    short: "MODEL Online",
    kind: "interim",
    grades: "1-12",
    store: "interim",
  },
  MODEL_PAPER: {
    label: "WIDA MODEL Paper",
    short: "MODEL Paper",
    kind: "interim",
    grades: "1-12",
    store: "interim",
  },
  KINDERGARTEN_MODEL: {
    label: "WIDA MODEL for Kindergarten",
    short: "K MODEL",
    kind: "interim",
    grades: "K",
    store: "interim",
  },
});
export const ASSESSMENT_TYPES = Object.freeze(Object.keys(ASSESSMENTS));
export const isInterim = (type) => ASSESSMENTS[type]?.kind === "interim";

export const SOURCES = Object.freeze({
  reset: "https://wida.wisc.edu/news/what-know-wida-assessments-2025-2026-school-year",
  revising: "https://wida.wisc.edu/revisingaccess",
  standardSetting: "https://wida.wisc.edu/standardsetting",
  scores: "https://wida.wisc.edu/assess/access/scores-reports",
  scoring: "https://wida.wisc.edu/news/everything-youve-ever-wanted-know-scoring-access-ells",
  weightsTable: "https://dpi.wi.gov/wisedash/districts/about-data/access",
  concordance: "https://wida.wisc.edu/resources/wida-model-and-access-ells-concordance-table",
  concordanceUse:
    "https://wida.wisc.edu/news/how-use-wida-model-and-concordance-table-instructional-planning",
});

/** Scale version: ACCESS results before 2025-26 sit on the 2016 scale; MODEL has its own scale. */
export function scaleVersionOf(type, year) {
  if (isInterim(type)) return type === "KINDERGARTEN_MODEL" ? "model-k-scale" : "model-scale";
  const family = type === "KINDERGARTEN_ACCESS" ? "access-k" : "access";
  return `${family}-${year >= SCALE_RESET_YEAR ? "2025" : "2016"}-scale`;
}

/**
 * Proficiency-level version. Results before 2025-26 use the 2016 cut scores. 2025-26 reports were first
 * issued on the 2016 cuts and re-issued after the 2026 standard setting, so the teacher says which report
 * they typed; 2026-27 onward uses the 2026 cuts. Levels from two versions are never compared.
 */
export function levelVersionOf(type, year, declared = null) {
  if (isInterim(type)) return "model-levels";
  if (year < SCALE_RESET_YEAR) return "2016-cuts";
  if (year >= NEW_CUTS_YEAR) return "2026-cuts";
  return declared === "2026-cuts" ? "2026-cuts" : "2016-cuts";
}

export const SCALE_WORDS = Object.freeze({
  "access-2016-scale": "ACCESS scale before the 2025-26 reset",
  "access-2025-scale": "ACCESS scale from 2025-26",
  "access-k-2016-scale": "Kindergarten ACCESS scale before 2025-26",
  "access-k-2025-scale": "Kindergarten ACCESS scale from 2025-26",
  "model-scale": "MODEL scale",
  "model-k-scale": "Kindergarten MODEL scale",
});
export const LEVEL_WORDS = Object.freeze({
  "2016-cuts": "levels on the 2016 cut scores",
  "2026-cuts": "levels on the 2026 cut scores",
  "model-levels": "MODEL levels",
});

/** Plausible scale-score range per scale version; only the 2016 ACCESS range is documented here. */
export const SCALE_RANGES = Object.freeze({
  "access-2016-scale": [100, 600],
  "access-k-2016-scale": [100, 600],
});

/** Two results' scale scores are comparable only on the same scale version. */
export const scaleComparable = (a, b) => a.scaleVersion === b.scaleVersion;
/** Two results' proficiency levels are comparable only for the same assessment family and cut-score version. */
export const levelComparable = (a, b) =>
  a.levelVersion === b.levelVersion &&
  a.scaleVersion === b.scaleVersion &&
  familyOf(a.assessmentType) === familyOf(b.assessmentType);
export const familyOf = (type) =>
  isInterim(type) ? "MODEL" : type === "KINDERGARTEN_ACCESS" ? "K" : "ACCESS";

/** Why two results cannot be compared, in plain words, or null when they can. */
export function whyNotComparable(a, b, measure = "level") {
  if (familyOf(a.assessmentType) !== familyOf(b.assessmentType))
    return `${ASSESSMENTS[a.assessmentType].short} and ${ASSESSMENTS[b.assessmentType].short} are different assessments; their numbers are not on one scale.`;
  if (measure === "scale" && !scaleComparable(a, b))
    return `ACCESS reset its scale in ${SCALE_RESET_YEAR}. Scale scores before and after the reset cannot be compared.`;
  if (measure === "level" && a.levelVersion === b.levelVersion && a.scaleVersion !== b.scaleVersion)
    return `ACCESS was revised and its scale reset in ${SCALE_RESET_YEAR}. Results on the two sides of the reset are kept in separate eras and not compared.`;
  if (measure === "level" && a.levelVersion !== b.levelVersion)
    return a.levelVersion === "2026-cuts" || b.levelVersion === "2026-cuts"
      ? "One result uses the 2026 cut scores and the other does not, so the same level number does not mean the same thing."
      : `The ${SCALE_RESET_YEAR} scale reset separates these results.`;
  return null;
}

/**
 * Composite weights the studio may apply to REPORTED domain scale scores to illustrate a missing composite.
 * Only the 2016 ACCESS scale is covered: no weights are applied to the reset scale, Kindergarten or MODEL
 * until they are checked against WIDA's documentation for that version. A calculated composite is a scale
 * score only; a composite proficiency level is never calculated (WIDA converts with cut tables).
 */
export const COMPOSITE_RULES = Object.freeze([
  {
    id: "access-2016-composites",
    scaleVersions: ["access-2016-scale"],
    weights: {
      Oral: { Listening: 0.5, Speaking: 0.5 },
      Literacy: { Reading: 0.5, Writing: 0.5 },
      Comprehension: { Listening: 0.3, Reading: 0.7 },
      Overall: { Listening: 0.15, Speaking: 0.15, Reading: 0.35, Writing: 0.35 },
    },
    sources: [SOURCES.scoring, SOURCES.weightsTable, "WIDA TR-2019-3 (overall weights)"],
    verifiedOn: "2026-11-17",
    verifiedBy:
      "WIDA scoring article (Oral 50/50, Comprehension weighted to Reading); Wisconsin DPI table for the exact percentages. The Interpretive Guide table itself was not read.",
  },
]);
export const compositeRuleFor = (scaleVersion) =>
  COMPOSITE_RULES.find((r) => r.scaleVersions.includes(scaleVersion)) || null;

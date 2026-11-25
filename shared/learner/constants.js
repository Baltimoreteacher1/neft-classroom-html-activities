/**
 * Learner model constants: the single source of truth for the skill graph vocabulary and every
 * tunable default. Pure browser-safe ESM: no Node imports, no clock, no network.
 * All learner state is on-device by design; nothing here reads or writes a remote store.
 */

export const LANG_DOMAINS = Object.freeze(["listening", "speaking", "reading", "writing"]);
export const KLUS = Object.freeze(["Narrate", "Inform", "Explain", "Argue"]);
export const BANDS = Object.freeze(["1_2", "3_4", "5_6"]);

/** Activity domains as authored in the unit content (language domains plus Vocabulary and Game). */
export const ACTIVITY_DOMAINS = Object.freeze([
  "Listening",
  "Speaking",
  "Reading",
  "Writing",
  "Vocabulary",
  "Game",
]);

/** Activity kinds as authored in the unit content. A test pins this list to the content schema. */
export const ACTIVITY_KINDS = Object.freeze([
  "word_sort",
  "match",
  "cloze",
  "unscramble",
  "dictogloss",
  "info_gap",
  "error_analysis",
  "sentence_combine",
  "quiz",
  "talk_cards",
  "write_scaffold",
  "sequence",
  "clue_game",
  "read_annotate",
]);

export const DAY_MS = 86_400_000;

export const DEFAULTS = Object.freeze({
  halfLifeDays: 21,
  priorStrength: 4,
  /** Below this much decayed evidence a node never shows building or strong. */
  minEvidence: 3,
  strongMean: 0.8,
  buildingMean: 0.5,
  intervalZ: 1.2816, // 80% two-sided
  hintedCorrectWeight: 0.6,
  leitnerIntervalsDays: Object.freeze([1, 2, 4, 8, 16]),
  dailyCardBudget: 10,
  maxDailyCardBudget: 40,
  targetSuccess: Object.freeze([0.65, 0.85]),
  freshnessDays: 3,
  maxConsecutiveDomain: 2,
  warmupMinutes: 2,
  warmupCards: 6,
  planMinutes: Object.freeze([10, 15, 20]),
  activityMinutes: Object.freeze([8, 20]),
  topN: 3,
  minCell: 10,
  tooEasy: 0.95,
  tooHard: 0.2,
  minDiscrimination: 0.1,
});

export const STATUS = Object.freeze({
  building: "building",
  gettingThere: "getting there",
  strong: "strong",
});

export const ESTIMATE_LABEL = "practice estimate, not an official score";
export const TEACHER_DISCLAIMER =
  "Practice estimate, inspired by WIDA ACCESS. Not official, not a score, not a placement tool.";

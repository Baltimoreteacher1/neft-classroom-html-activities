// "My Week" planner constants: the single source of truth for every limit, weight and dependency rule.
// Plain browser-safe ESM: imported by Pages Functions, the Studio view and the tests.

export const PLANNER_VERSION = 1;

/** Block lengths a teacher can pick, in minutes. A day may never hold more than its block length. */
export const BLOCK_MINUTES = Object.freeze([45, 60, 90]);
export const DAYS_MIN = 1;
export const DAYS_MAX = 5;

/** Teacher-side planning groups. Counts only: the planner never sees a student. */
export const BAND_KEYS = Object.freeze(["1_2", "3_4", "5_6"]);
export const BAND_LABELS = Object.freeze({
  "1_2": "Bands 1-2",
  "3_4": "Bands 3-4",
  "5_6": "Bands 5-6",
});
export const BAND_COUNT_MAX = 40;
export const SEED_MAX = 999999;

/**
 * Planning assumption, not a research claim: early-band groups get a longer share of each activity for think time,
 * later-band groups a slightly shorter one. Minutes are scaled by the count-weighted factor of the mix.
 */
export const BAND_TIME_FACTOR = Object.freeze({ "1_2": 1.15, "3_4": 1, "5_6": 0.9 });

/** Per band, how strongly a domain is favoured when the priority is computed (1 = neutral). */
export const BAND_DOMAIN_EMPHASIS = Object.freeze({
  "1_2": { Listening: 1.15, Speaking: 1.15, Vocabulary: 1.1, Reading: 0.9, Writing: 0.85 },
  "3_4": {},
  "5_6": { Listening: 0.9, Speaking: 0.95, Vocabulary: 0.95, Reading: 1.1, Writing: 1.15 },
});

/** Priority shape. Earlier arc position is worth more; a domain's k-th candidate is worth DOMAIN_DECAY^k of its base. */
export const ARC_TOP = 100;
export const ARC_SPAN = 60; // the last candidate of a source is worth ARC_TOP - ARC_SPAN
export const STANDARD_BONUS = 15;
export const STANDARD_BONUS_CAP = 45;
export const DOMAIN_DECAY = 0.85;
export const VALUE_SCALE = 10;
export const TIE_JITTER = 5; // seed-dependent tie-break, in value units (never larger than the smallest real gap)

/** Domain of each ESOL pack section (the pack itself carries none). */
export const PACK_DOMAIN = Object.freeze({
  cognates: "Vocabulary",
  doubleduty: "Vocabulary",
  retrieval: "Vocabulary",
  dictogloss: "Listening",
  infogap: "Speaking",
  doctor: "Writing",
  ladder: "Writing",
  talkline: "Speaking",
  routines: "Reading",
  passport: "Reflection",
  glossary: "Vocabulary",
  family: "Family",
});

export const PACK_TITLES = Object.freeze({
  cognates: "Cognates and word parts",
  doubleduty: "Double-duty words",
  retrieval: "Retrieval warm-up",
  dictogloss: "Dictogloss",
  infogap: "Information gap",
  doctor: "Sentence doctor",
  ladder: "Sentence ladder",
  talkline: "Talk line debate",
  routines: "Subject language routines",
  passport: "Language passport",
  glossary: "Home-language glossary",
  family: "Family mission",
});

/** Relative weight used to split a pack day's minutes among its sections (largest-remainder, sums exactly). */
export const PACK_SECTION_WEIGHT = Object.freeze({
  cognates: 4,
  doubleduty: 4,
  retrieval: 4,
  dictogloss: 1,
  infogap: 3,
  doctor: 2,
  ladder: 3,
  talkline: 3,
  routines: 3,
  passport: 3,
  glossary: 3,
  family: 3,
});

/** pack section -> the one section that must be taught first (a forest: one parent each). */
export const PACK_DEPENDS_ON = Object.freeze({
  infogap: "dictogloss",
  doctor: "infogap",
  talkline: "ladder",
  routines: "talkline",
  passport: "ladder",
  family: "glossary",
  glossary: "cognates",
});

/** Studio activity kind -> the kind (first activity of that kind in the unit) that must come first. */
export const ACTIVITY_DEPENDS_ON = Object.freeze({
  word_sort: "match",
  cloze: "match",
  quiz: "match",
  talk_cards: "dictogloss",
  info_gap: "talk_cards",
  read_annotate: "dictogloss",
  sequence: "read_annotate",
  sentence_combine: "read_annotate",
  error_analysis: "sentence_combine",
  write_scaffold: "sentence_combine",
});

export const SOURCE_RANK = Object.freeze({ lesson: 0, pack: 1, studio: 2 });
export const SOURCE_LABELS = Object.freeze({
  lesson: "Lesson",
  pack: "ESOL week",
  studio: "Studio activity",
});

export const DROP_CODES = Object.freeze({
  too_long: "Longer than one block",
  needs_dropped: "Needs an item that was dropped",
  low_priority: "Lower priority for the minutes available",
});

export const MATERIALS = "Paper and pencil only.";
export const WIDA_NOTE =
  "Planning aid. Band groupings are inspired by WIDA ACCESS, not official, not a score, not a placement tool.";

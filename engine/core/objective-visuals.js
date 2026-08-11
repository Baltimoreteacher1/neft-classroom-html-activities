// The picture that sits under each "I can…" goal card, and the words that
// describe it.
//
// There used to be exactly THREE illustrations for 222 lesson configs, so every
// picture was reused dozens of times and 138 lessons (62%) sat under a photo of
// somebody else's math. The captions lived inline in lesson-renderer.js as a
// `unit === n` ladder written against an OLDER unit numbering, so unit 7 was
// captioned "plotting ordered pairs across all 4 quadrants" over a photo of a
// paper net, and unit 10 — the one unit that really is about nets — fell through
// to a generic default. A caption that names a tool the student cannot see
// teaches the student to stop reading captions.
//
// The fix was to DRAW the missing artwork rather than hedge about the photos:
// scripts/gen-objective-art.mjs authors one exact, labelled figure per topic
// (assets/objective-art/*.svg) plus a partner-talk version of the SAME figure,
// and the two photographs that were always truthful are kept exactly where they
// are true — the pan balance for equations, the paper net for solids.
//
// So every lesson now gets a picture of ITS OWN math, and the caption says what
// is visible first, then names this lesson's goal. There is no "this is not
// today's math" wording left anywhere, because there is no lesson left that it
// would apply to.
//
// Routing is by STANDARD, never by unit number: the unit numbering has been
// re-cut before and the old ladder is what that cost.
//
// Kept in its own module so it is directly unit-testable — lesson-renderer.js
// pulls in the entire component graph and cannot be imported outside a bundler.
// Everything returned is PLAIN TEXT; the caller escapes it (`esc()`) before it
// reaches innerHTML, which matters because objectives for the inequality
// lessons contain `<` and `>`.

import { OBJECTIVE_IMAGES } from "./objective-art-catalog.js";

export { MANIPULATIVES, OBJECTIVE_IMAGES } from "./objective-art-catalog.js";

/**
 * The slice of a lesson `config.json` this module reads. Everything is optional:
 * a config missing all of it still resolves a picture and a true caption.
 *
 * @typedef {object} LessonConfig
 * @property {string} [standard]
 * @property {string} [title]
 * @property {string} [contentObjective]
 * @property {string} [languageObjective]
 * @property {string} [objective]
 * @property {{ objective?: string }} [launch]
 * @property {{ term?: string, word?: string }[]} [vocabulary]
 * @property {{ stems?: (string | { en?: string, es?: string })[] }[]} [turnAndTalk]
 * @property {string} [contentVisualImg]
 * @property {string} [languageVisualImg]
 * @property {string} [contentVisualCaption]
 * @property {string} [languageVisualCaption]
 */

/**
 * Topic → the two catalogue entries it uses. Every topic has BOTH: a content
 * picture of the model, and a talk picture of two partners naming that same
 * model's parts, because the language objective's job is academic talk about
 * the thing the content objective just built.
 *
 * `equations` keeps the pan-balance photograph (x + 3 = 7 is printed on the
 * scale) and `solids` keeps the paper-net pair — those photos were never the
 * problem.
 */
export const TOPICS = {
  mathPractice: { content: "mathPracticeContent", language: "mathPracticeTalk" },
  factors: { content: "factorsContent", language: "factorsTalk" },
  division: { content: "divisionContent", language: "divisionTalk" },
  decimalSum: { content: "decimalSumContent", language: "decimalSumTalk" },
  decimalProduct: { content: "decimalProductContent", language: "decimalProductTalk" },
  decimalQuotient: { content: "decimalQuotientContent", language: "decimalQuotientTalk" },
  fractionDivision: { content: "fractionDivisionContent", language: "fractionDivisionTalk" },
  ratios: { content: "ratiosContent", language: "ratiosTalk" },
  ratioTables: { content: "ratioTablesContent", language: "ratioTablesTalk" },
  rates: { content: "ratesContent", language: "ratesTalk" },
  measurement: { content: "measurementContent", language: "measurementTalk" },
  percents: { content: "percentsContent", language: "percentsTalk" },
  exponents: { content: "exponentsContent", language: "exponentsTalk" },
  expressions: { content: "expressionsContent", language: "expressionsTalk" },
  equations: { content: "balance", language: "equationsTalk" },
  inequalities: { content: "inequalitiesContent", language: "inequalitiesTalk" },
  statQuestions: { content: "statQuestionsContent", language: "statQuestionsTalk" },
  centre: { content: "centreContent", language: "centreTalk" },
  mad: { content: "madContent", language: "madTalk" },
  boxPlot: { content: "boxPlotContent", language: "boxPlotTalk" },
  histogram: { content: "histogramContent", language: "histogramTalk" },
  distributions: { content: "distributionsContent", language: "distributionsTalk" },
  rationalNumberLine: { content: "rationalNumberLineContent", language: "rationalNumberLineTalk" },
  integers: { content: "integersContent", language: "integersTalk" },
  coordinatePlane: { content: "coordinatePlaneContent", language: "coordinatePlaneTalk" },
  quadrants: { content: "quadrantsContent", language: "quadrantsTalk" },
  distance: { content: "distanceContent", language: "distanceTalk" },
  planeArea: { content: "planeAreaContent", language: "planeAreaTalk" },
  solids: { content: "solidsContent", language: "solidsTalk" },
};

/**
 * Standard → topic. `rules` refine WITHIN a standard where one code covers two
 * different models — 6.DS.5 is both box plots and histograms, 6.NOS.3 is all
 * three decimal operations — because the standard alone cannot tell them apart.
 *
 * @type {Record<string, { topic: string, rules?: [RegExp, string][] }>}
 */
const BY_STANDARD = {
  // The book's "Math Is..." units (1 and 10) are placed by their practice
  // standard, and its Grade 5 review lessons by the Grade 5 code they revisit.
  // Without these they fell through to the hard default, which this module
  // treats as a failure: a lesson would inherit a stranger's picture.
  "MPP.3": { topic: "mathPractice" },
  "MPP.4": { topic: "mathPractice" },
  "MPP.7": { topic: "mathPractice" },
  "5.OA.B.3": { topic: "mathPractice" },
  "6.NOS.1": { topic: "fractionDivision" },
  "6.NOS.2": { topic: "division" },
  "6.NOS.3": {
    topic: "decimalSum",
    rules: [
      [/\bmultiply(?:ing)?\s+decimals?\b/i, "decimalProduct"],
      [/\bdivid(?:e|ing)\s+(?:with\s+)?decimals?\b/i, "decimalQuotient"],
    ],
  },
  "6.NOS.4": { topic: "factors" },
  "6.NOS.6": { topic: "coordinatePlane", rules: [[/\bnumber line\b/i, "rationalNumberLine"]] },
  "6.NOS.7": { topic: "quadrants" },
  "6.NOS.8": { topic: "integers" },
  "6.NOS.9": { topic: "distance" },
  "6.AT.1": { topic: "ratios" },
  "6.AT.2": { topic: "rates" },
  "6.AT.3": { topic: "ratios", rules: [[/\bunit rates?\b/i, "rates"]] },
  "6.AT.3a": { topic: "ratioTables" },
  "6.AT.3c": { topic: "measurement" },
  "6.AT.4": { topic: "percents" },
  "6.AT.5": { topic: "exponents" },
  "6.AT.6a": { topic: "expressions" },
  "6.AT.6c": { topic: "expressions" },
  "6.AT.7": { topic: "expressions" },
  "6.AT.8": { topic: "equations", rules: [[/\binequalit/i, "inequalities"]] },
  "6.AT.9": { topic: "inequalities" },
  "6.DS.1": { topic: "statQuestions" },
  "6.DS.3": { topic: "distributions" },
  "6.DS.4": { topic: "centre" },
  "6.DS.5": { topic: "boxPlot", rules: [[/\bhistograms?\b/i, "histogram"]] },
  "6.DS.6c": { topic: "mad" },
  "6.DS.6d": { topic: "centre" },
  "6.GR.1": { topic: "planeArea" },
  "6.GR.2": { topic: "solids" },
  "6.GR.4": { topic: "solids" },
};

// Read in order, first match wins — used only when the standard is missing or is
// one this module has never seen. Specific phrases come before general ones.
/** @type {[RegExp, string][]} */
const BY_WORDING = [
  [/\b(?:nets?|surface area|volume|prisms?|pyramids?)\b/i, "solids"],
  [/\b(?:parallelogram|trapezoid|composite figure|area of)\b/i, "planeArea"],
  [/\bstatistical question/i, "statQuestions"],
  [/\bmean absolute deviation|\bMAD\b/, "mad"],
  [/\bbox plots?\b/i, "boxPlot"],
  [/\bhistograms?\b/i, "histogram"],
  [/\b(?:distributions?|skewed|symmetric)\b/i, "distributions"],
  [/\b(?:mean|median|mode)\b/i, "centre"],
  [/\b(?:quadrants?|reflect)/i, "quadrants"],
  [/\bdistance\b/i, "distance"],
  [/\b(?:coordinate plane|ordered pairs?)\b/i, "coordinatePlane"],
  [/\b(?:integers?|absolute value)\b/i, "integers"],
  [/\bnumber line\b/i, "rationalNumberLine"],
  [/\binequalit/i, "inequalities"],
  [/\bequations?\b/i, "equations"],
  [/\b(?:expressions?|exponents?|powers?|distributive|variable|like terms)\b/i, "expressions"],
  [/\bpercents?\b/i, "percents"],
  [/\bratio tables?\b/i, "ratioTables"],
  [/\b(?:unit rates?|rates?)\b/i, "rates"],
  [/\b(?:convert|conversion)/i, "measurement"],
  [/\bratios?\b/i, "ratios"],
  [/\b(?:prime factor|greatest common factor|least common multiple)\b|\bGCF\b|\bLCM\b/i, "factors"],
  [/\bfractions?\b/i, "fractionDivision"],
  [/\bdecimals?\b/i, "decimalSum"],
  [/\bdivid/i, "division"],
];

// Last resort before the hard default: keep a lesson inside its own strand.
const BY_FAMILY = {
  NOS: "rationalNumberLine",
  AT: "expressions",
  DS: "centre",
  GR: "planeArea",
  // The book's "Math Is..." units carry practice standards, and its Grade 5
  // review lessons carry Grade 5 codes. Both are placed on the practice picture.
  MPP: "mathPractice",
  G5: "mathPractice",
};

function normaliseStandard(standard) {
  const raw = String(standard || "").trim();
  const m = raw.match(/^6\.(NOS|AT|DS|GR)\.(\d+)\s*([a-z]?)/i);
  if (m) {
    const family = m[1].toUpperCase();
    return { family, key: `6.${family}.${m[2]}${m[3].toLowerCase()}`, base: `6.${family}.${m[2]}` };
  }
  // MPP.3 / MPP.4 / MPP.7 — the mathematical-practice standards the book's
  // "Math Is..." units are built on. Returning null here sent all twelve of
  // them to the hard default.
  const mpp = raw.match(/^MPP\.(\d+)/i);
  if (mpp) return { family: "MPP", key: `MPP.${mpp[1]}`, base: `MPP.${mpp[1]}` };
  // Grade 5 review codes (5.NF.B.4, 5.OA.B.3, …) carried by unit 1's lessons.
  const g5 = raw.match(/^5\.[A-Z]+(?:\.[A-Z0-9.]+)?/i);
  if (g5) return { family: "G5", key: g5[0].toUpperCase(), base: g5[0].toUpperCase() };
  return null;
}

function lessonText(config) {
  return [
    config && config.title,
    config && config.contentObjective,
    config && config.objective,
    config && config.launch && config.launch.objective,
  ]
    .filter(Boolean)
    .join(" ");
}

// Catch-up lessons carry the titles of the lessons they cover in `vocabulary`,
// and their own objective is deliberately generic ("mixed practice"). Only
// consult that list when the lesson's own wording decided nothing, and only
// trust it when ONE sub-topic wins it outright — a catch-up spanning two models
// must fall back to the standard's default rather than pick a favourite.
function refineFromVocabulary(rules, config) {
  const terms = Array.isArray(config && config.vocabulary) ? config.vocabulary : [];
  const hits = new Map();
  for (const entry of terms) {
    const text = String((entry && (entry.term || entry.word)) || entry || "");
    for (const [re, topic] of rules) {
      if (re.test(text)) hits.set(topic, (hits.get(topic) || 0) + 1);
    }
  }
  if (hits.size !== 1) return "";
  const [[topic, count]] = [...hits.entries()];
  return count >= 2 ? topic : "";
}

/**
 * Place a lesson, and say HOW it was placed.
 *
 * `source` is what the test gate watches: every one of the 222 lessons must be
 * placed by its own standard or its own wording. "family" and "default" mean
 * nobody taught this module about the lesson, and the gate treats them as a
 * failure rather than letting a lesson quietly inherit a stranger's picture.
 *
 * @param {LessonConfig} config
 * @returns {{ topic: string, source: "standard"|"wording"|"family"|"default" }}
 */
export function classifyLesson(config) {
  const cfg = config || {};
  const std = normaliseStandard(cfg.standard);
  const entry = std && (BY_STANDARD[std.key] || BY_STANDARD[std.base]);
  if (entry) {
    const rules = entry.rules || [];
    const text = lessonText(cfg);
    const direct = rules.filter(([re]) => re.test(text)).map(([, topic]) => topic);
    if (new Set(direct).size === 1) return { topic: direct[0], source: "standard" };
    if (!direct.length && rules.length) {
      const fromVocab = refineFromVocabulary(rules, cfg);
      if (fromVocab) return { topic: fromVocab, source: "standard" };
    }
    return { topic: entry.topic, source: "standard" };
  }

  const text = lessonText(cfg);
  if (text) {
    for (const [re, topic] of BY_WORDING) {
      if (re.test(text)) return { topic, source: "wording" };
    }
  }
  if (std) return { topic: BY_FAMILY[std.family], source: "family" };
  return { topic: "expressions", source: "default" };
}

/**
 * The topic key a lesson resolves to — always one of TOPICS, never empty.
 *
 * @param {LessonConfig} config
 * @returns {string}
 */
export function lessonTopic(config) {
  return classifyLesson(config).topic;
}

const OBJECTIVE_OPENERS = [
  /^\s*with my (?:small )?group,?\s*I can\s+/i,
  /^\s*with a partner,?\s*I can\s+/i,
  /^\s*I can\s+/i,
  /^\s*I will be able to\s+/i,
  /^\s*I am able to\s+/i,
  /^\s*Students? (?:will be able to|will|can)\s+/i,
];

/**
 * The doing-part of an "I can…" objective: the leading stem and the trailing
 * period come off so the phrase can be dropped into a caption sentence.
 * "I can write a number as a product of its prime factors." →
 * "write a number as a product of its prime factors".
 *
 * Wording that matches no known opener is returned whole (minus the period) —
 * a mangled goal is worse than a long one.
 *
 * @param {string} text authored objective
 * @returns {string}
 */
export function objectivePhrase(text) {
  let s = String(text || "").trim();
  if (!s) return "";
  for (const re of OBJECTIVE_OPENERS) {
    if (re.test(s)) {
      s = s.replace(re, "");
      break;
    }
  }
  // Drop ONE trailing sentence mark; "…using < and >." must keep its symbols.
  return s.replace(/\s*[.!]\s*$/, "").trim();
}

// Fallbacks that mirror resolveContentObjective / resolveLanguageObjective in
// lesson-renderer.js, but on the RAW (unescaped) text — the caption is escaped
// once, at render time, and double-escaping would print "&amp;lt;" to students.
function rawContentObjective(config) {
  const authored =
    (config && config.contentObjective) ||
    (config && config.objective) ||
    (config && config.launch && config.launch.objective) ||
    "";
  if (authored) return String(authored);
  return `I can solve problems about ${(config && config.title) || "this topic"}.`;
}

function rawLanguageObjective(config) {
  if (config && config.languageObjective) return String(config.languageObjective);
  return `I can talk and write about ${(config && config.title) || "this topic"} using math words.`;
}

// An author who sets contentVisualImg/languageVisualImg points at artwork this
// module has never seen, so it cannot describe it. Say that plainly rather than
// invent contents — an empty alt is worse for a screen-reader user than a
// modest one, and a made-up one is worse than both.
function unknownImage(src, config) {
  const title = (config && config.title) || "this lesson";
  return {
    src,
    alt: `Visual model chosen for this lesson: ${title}.`,
    scene: "",
    shows: [],
    banned: [],
  };
}

function imageFor(key, overrideSrc, config) {
  if (!overrideSrc) return OBJECTIVE_IMAGES[key];
  const known = Object.values(OBJECTIVE_IMAGES).find((img) => img.src === overrideSrc);
  return known || unknownImage(overrideSrc, config);
}

// scene + goal, joined. Two short sentences: what is on screen, then what the
// student is aiming at. A 6th grader reads it top to bottom in one breath.
function joinCaption(scene, lead, goalPhrase) {
  if (!goalPhrase) return scene;
  if (!scene) return `${lead} ${goalPhrase}.`;
  return `${scene} ${lead} ${goalPhrase}.`;
}

// ── ESOL caption bullets ────────────────────────────────────────────────────
// The card used to print `caption` as one run-on line: a full scene sentence
// ("A student moves unit cubes on a pan balance labelled x + 3 = 7, keeping the
// two pans level so the equation stays true while she works out what x is
// worth.") followed by the whole objective. That is ~45 words of subordinate
// clauses under a picture, and a newcomer reading at an entering/emerging level
// gets nothing from it — the sentence is longer than the objective it explains.
//
// So the SAME two facts are now printed as two short bullets: what is on the
// screen, then what you are aiming at. Nothing new is invented and no scene text
// was rewritten — each bullet is the first clause of a sentence the module
// already had, cut at the first real clause boundary.

// Clause boundaries that reliably start a subordinate clause in the authored
// scenes. Cutting here keeps a complete, true main clause every time.
const SCENE_CLAUSE =
  /\s*(?:,\s*(?:so|and|with|while|instead|then|which|because|but|each|its|one|the other)\b|,\s*\w+ing\b|\s—\s|[;:]\s).*$/i;

const SCENE_MAX = 110;

// Last ", " at paren depth 0 before `limit`. Coordinate pairs are written
// "(3, 2)", so a depth-blind search cuts scenes mid-ordered-pair — "reflects
// across the y-axis to B (−3" is worse than the long sentence it shortened.
function lastTopLevelComma(text, limit) {
  let depth = 0;
  let found = -1;
  for (let i = 0; i < text.length && i < limit; i += 1) {
    const ch = text[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0 && text[i + 1] === " ") found = i;
  }
  return found;
}

/**
 * The one-clause version of a scene sentence: what a student can see, with the
 * explanatory tail removed.
 *
 * @param {string} scene authored scene sentence
 * @returns {string} plain text, no trailing punctuation
 */
export function shortScene(scene) {
  let s = String(scene || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  s = s.replace(SCENE_CLAUSE, "");
  if (s.length > SCENE_MAX) {
    const cut = lastTopLevelComma(s, SCENE_MAX);
    if (cut > 40) s = s.slice(0, cut);
  }
  return s.replace(/[.,;:]+$/, "").trim();
}

/**
 * The one-clause version of an objective phrase, for the goal bullet. The full
 * phrase stays available on `goalPhrase` and in `caption`.
 *
 * @param {string} phrase output of {@link objectivePhrase}
 * @returns {string}
 */
export function shortGoal(phrase) {
  let s = String(phrase || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  // Level-2 objectives open with a lead-in label ("go beyond today's lesson:
  // solve one-step equations…"). The label is framing for the teacher; the
  // substance is after the colon, and printing the label alone says nothing.
  const lead = s.match(/^([^:]{1,40}):\s+(.+)$/);
  if (lead) s = lead[2];
  // Split only on markers that genuinely END the main idea. A bare comma does
  // not: objectives list their tools ("use the commutative, associative and
  // distributive properties"), and cutting there prints the fragment "use the
  // commutative". Over-long goals are handled by the honest word cap below.
  const clause = s.split(/\s+—\s+|\s+(?:so that|in order to|and then|while)\s+/i)[0].trim();
  if (clause.length >= 12) s = clause;
  const words = s.split(/\s+/);
  if (words.length > 12) s = `${words.slice(0, 12).join(" ")}…`;
  return s.replace(/[.,;:]+$/, "").trim();
}

/**
 * The two short lines printed under the picture, in place of the old paragraph.
 * An authored `contentVisualCaption` / `languageVisualCaption` wins outright —
 * a teacher who wrote their own caption gets it printed as a single bullet.
 *
 * @param {object} o
 * @param {string} o.scene authored scene sentence
 * @param {string} o.goalPhrase full objective phrase
 * @param {string} o.goalLabel "Your goal" / "Your talking goal"
 * @param {string} [o.authored] author-supplied caption override
 * @returns {{ icon: string, label: string, text: string }[]}
 */
function captionBullets({ scene, goalPhrase, goalLabel, authored }) {
  if (authored) return [{ icon: "🖼️", label: "About this picture", text: String(authored) }];
  const bullets = [];
  const look = shortScene(scene);
  if (look) bullets.push({ icon: "👀", label: "You see", text: look });
  const goal = shortGoal(goalPhrase);
  if (goal) bullets.push({ icon: "🎯", label: goalLabel, text: goal });
  return bullets;
}

// ── Student talk targets ────────────────────────────────────────────────────
// These print on the objective cards under "What to Say / What to Listen For".
// They used to be one long sentence each, built by pasting the whole content or
// language objective into a frame — e.g. "To solve this, I can multiply
// multi-digit decimals fluently using the standard algorithm and estimate to
// check reasonableness." That is the objective, not something a multilingual
// sixth grader can say out loud, and it is the one line on the card a newcomer
// most needs to be able to read.
//
// Both resolvers now return SHORT BULLETS instead: three frames of a handful of
// words each, ending in a blank the student fills. The lesson still shows up —
// one bullet names the skill or the key word — but the grammar is handed over
// rather than modelled at full length.

// Cut a long objective down to a sayable skill phrase. Objectives are written as
// "I can <skill>, <qualifier> using <tool> to <purpose>"; everything after the
// first clause boundary is detail a speaker does not need.
function shortSkillPhrase(objective, fallback) {
  const cleaned = String(objective || "")
    .replace(/^\s*(students?\s+will\s+be\s+able\s+to|swbat|I\s+can)\s+/i, "")
    .replace(/\.\s*$/, "")
    .trim();
  if (!cleaned) return fallback;
  const clause = cleaned.split(
    /\s*,\s*|\s+(?:using|by|to|so that|in order to|and then|while)\s+/i,
  )[0];
  const words = clause.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  return words
    .slice(0, 6)
    .join(" ")
    .replace(/[.,;:]$/, "");
}

const firstTerm = (list) => (list && list.length ? String(list[0]) : "");

function vocabTerms(cfg) {
  return Array.isArray(cfg.vocabulary)
    ? cfg.vocabulary
        .map((v) => (typeof v === "object" && v ? v.term || v.word || "" : String(v || "")))
        .filter(Boolean)
    : [];
}

/**
 * Short, student-facing "What to Say" / "What to Listen For" bullets for the
 * CONTENT objective card.
 *
 * @param {LessonConfig} config
 * @returns {{ say: string[], sayEs: string[], listen: string[], listenEs: string[] }}
 */
export function resolveContentTalkPrompts(config) {
  const cfg = config || {};
  const contentObj = String(cfg.contentObjective || cfg.objective || cfg.launch?.objective || "");
  const skill = shortSkillPhrase(contentObj, "solve this problem");

  return {
    say: [`I can ${skill}.`, "First I ___. Then I ___.", "My answer is ___ because ___."],
    // No lesson in the corpus authors a Spanish content objective, so the
    // Spanish first bullet stays generic rather than pasting the English skill
    // phrase into a Spanish sentence ("Puedo multiply decimals…").
    sayEs: [
      "Puedo explicar mi trabajo paso a paso.",
      "Primero yo ___. Luego yo ___.",
      "Mi respuesta es ___ porque ___.",
    ],
    listen: [
      "Did they say every step?",
      "Did they say WHY it works?",
      "Did they check the answer?",
    ],
    listenEs: ["¿Dijeron cada paso?", "¿Dijeron POR QUÉ funciona?", "¿Revisaron la respuesta?"],
  };
}

/**
 * Short, student-facing "What to Say" / "What to Listen For" bullets for the
 * LANGUAGE objective card. One bullet always names a real lesson word so the
 * target is a word the student will actually hear today.
 *
 * @param {LessonConfig} config
 * @returns {{ say: string[], sayEs: string[], listen: string[], listenEs: string[], keyWords: string[] }}
 */
export function resolveLanguageTalkPrompts(config) {
  const cfg = config || {};
  const vocabList = vocabTerms(cfg);
  const word = firstTerm(vocabList);

  const wordSay = word ? `I used the word "${word}".` : "I used today's math words.";
  const wordSayEs = word ? `Usé la palabra "${word}".` : "Usé las palabras de hoy.";
  const wordListen = word ? `Did they say "${word}"?` : "Did they use today's math words?";
  const wordListenEs = word ? `¿Dijeron "${word}"?` : "¿Usaron las palabras de hoy?";

  return {
    say: ["I think ___ because ___.", wordSay, "I agree with ___ because ___."],
    sayEs: ["Creo que ___ porque ___.", wordSayEs, "Estoy de acuerdo con ___ porque ___."],
    listen: [
      wordListen,
      "Did they say why, not just the answer?",
      "Did they talk in a full sentence?",
    ],
    listenEs: [
      wordListenEs,
      "¿Dijeron por qué, no solo la respuesta?",
      "¿Hablaron con una oración completa?",
    ],
    keyWords: vocabList,
  };
}

export function resolveObjectiveVisuals(config) {
  const cfg = config || {};
  const topic = TOPICS[lessonTopic(cfg)] || TOPICS.expressions;

  const contentImage = imageFor(topic.content, cfg.contentVisualImg, cfg);
  const languageImage = imageFor(topic.language, cfg.languageVisualImg, cfg);

  const contentPhrase = objectivePhrase(rawContentObjective(cfg));
  const languagePhrase = objectivePhrase(rawLanguageObjective(cfg));

  const contentScene = contentImage.scene || "";
  const languageScene = languageImage.scene || "";

  return {
    content: {
      src: contentImage.src,
      alt: contentImage.alt,
      scene: contentScene,
      goalPhrase: contentPhrase,
      caption:
        cfg.contentVisualCaption || joinCaption(contentScene, "Today's goal:", contentPhrase),
      captionBullets: captionBullets({
        scene: contentScene,
        goalPhrase: contentPhrase,
        goalLabel: "Your goal",
        authored: cfg.contentVisualCaption,
      }),
      talkPrompts: resolveContentTalkPrompts(cfg),
    },
    language: {
      src: languageImage.src,
      alt: languageImage.alt,
      scene: languageScene,
      goalPhrase: languagePhrase,
      caption:
        cfg.languageVisualCaption ||
        joinCaption(languageScene, "Today's talking goal:", languagePhrase),
      captionBullets: captionBullets({
        scene: languageScene,
        goalPhrase: languagePhrase,
        goalLabel: "Your talking goal",
        authored: cfg.languageVisualCaption,
      }),
      talkPrompts: resolveLanguageTalkPrompts(cfg),
    },
  };
}

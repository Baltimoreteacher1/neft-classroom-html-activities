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
const BY_FAMILY = { NOS: "rationalNumberLine", AT: "expressions", DS: "centre", GR: "planeArea" };

function normaliseStandard(standard) {
  const m = String(standard || "")
    .trim()
    .match(/^6\.(NOS|AT|DS|GR)\.(\d+)\s*([a-z]?)/i);
  if (!m) return null;
  const family = m[1].toUpperCase();
  return { family, key: `6.${family}.${m[2]}${m[3].toLowerCase()}`, base: `6.${family}.${m[2]}` };
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

/**
 * Generate 1-2 concrete, student-facing "What to Say" and "What to Listen For"
 * prompts derived directly from the lesson's language objective, sentence stems,
 * or key academic vocabulary.
 *
 * @param {LessonConfig} config
 * @returns {{ say: string, sayEs?: string, listen: string, listenEs?: string, keyWords?: string[] }}
 */
export function resolveContentTalkPrompts(config) {
  const cfg = config || {};
  const contentObj = String(cfg.contentObjective || cfg.objective || cfg.launch?.objective || "");
  const title = String(cfg.title || "this math topic");
  const vocabList = Array.isArray(cfg.vocabulary)
    ? cfg.vocabulary
        .map((v) => (typeof v === "object" && v ? v.term || v.word || "" : String(v || "")))
        .filter(Boolean)
    : [];

  let say = "";
  if (contentObj) {
    const cleaned = contentObj.replace(/^\s*I\s+can\s+/i, "").replace(/\.\s*$/, "");
    say = `To solve this, I can ${cleaned}.`;
  } else {
    say = `I solved this problem by explaining my math steps clearly.`;
  }

  let sayEs = contentObj
    ? `Para resolver esto, puedo explicar los pasos de la lección sobre ${title}.`
    : `Resolví este problema explicando mis pasos matemáticos claramente.`;

  let listen = "";
  if (contentObj.toLowerCase().includes("step") || contentObj.toLowerCase().includes("find") || contentObj.toLowerCase().includes("solve")) {
    listen = `My partner explaining each mathematical step in order and showing why their final answer is correct.`;
  } else if (vocabList.length >= 1) {
    listen = `My partner explaining how their visual model proves their solution using ${vocabList[0]}.`;
  } else {
    listen = `My partner describing their problem-solving strategy and checking that their work makes sense.`;
  }

  let listenEs = `Mi compañero explicando cada paso matemático en orden y demostrando por qué su respuesta final es correcta.`;

  return { say, sayEs, listen, listenEs };
}

export function resolveLanguageTalkPrompts(config) {
  const cfg = config || {};
  const langObj = String(cfg.languageObjective || "");
  const vocabList = Array.isArray(cfg.vocabulary)
    ? cfg.vocabulary
        .map((v) => (typeof v === "object" && v ? v.term || v.word || "" : String(v || "")))
        .filter(Boolean)
    : [];

  let stemSay = "";
  let stemSayEs = "";
  if (Array.isArray(cfg.turnAndTalk)) {
    for (const item of cfg.turnAndTalk) {
      if (Array.isArray(item.stems) && item.stems.length > 0) {
        const firstStem = item.stems[0];
        const rawStem = typeof firstStem === "object" && firstStem ? firstStem.en : firstStem;
        if (rawStem && typeof rawStem === "string") {
          stemSay = rawStem.replace(/^I\s+/i, "I ").trim();
        }
        if (typeof firstStem === "object" && firstStem && firstStem.es) {
          stemSayEs = firstStem.es;
        }
        if (stemSay) break;
      }
    }
  }

  let say = "";
  if (stemSay) {
    say = stemSay;
  } else if (langObj) {
    const cleaned = langObj.replace(/^\s*I\s+can\s+/i, "").replace(/\.\s*$/, "");
    say = `I can ${cleaned}.`;
  } else if (vocabList.length >= 2) {
    say = `I used the academic terms "${vocabList[0]}" and "${vocabList[1]}" to explain my strategy.`;
  } else if (vocabList.length === 1) {
    say = `I used the math term "${vocabList[0]}" to describe my work to my partner.`;
  } else {
    say = "I know my solution is correct because I can explain each step clearly to my partner.";
  }

  let sayEs = stemSayEs || (langObj ? `Puedo explicar mi razonamiento usando el vocabulario matemático de hoy.` : "Sé que mi solución es correcta porque puedo explicar cada paso claramente.");

  let listen = "";
  if (vocabList.length >= 2) {
    listen = `My partner using academic terms like "${vocabList[0]}" and "${vocabList[1]}" to justify their reasoning.`;
  } else if (vocabList.length === 1) {
    listen = `My partner using the word "${vocabList[0]}" while describing how they solved the problem.`;
  } else if (langObj.toLowerCase().includes("words") || langObj.toLowerCase().includes("using")) {
    const match = langObj.match(/words?\s+([^\.]+)/i);
    const wordClause = match ? match[1].trim() : "academic vocabulary";
    listen = `My partner explaining their strategy using ${wordClause}.`;
  } else if (langObj.toLowerCase().includes("explain") || langObj.toLowerCase().includes("justify")) {
    listen = "My partner explaining WHY their strategy works, not just sharing the final answer.";
  } else {
    listen = "My partner naming the mathematical model and describing how their steps connect to it.";
  }

  let listenEs = vocabList.length >= 1
    ? `Mi compañero usando términos del vocabulario como "${vocabList[0]}" para justificar su razonamiento.`
    : "Mi compañero explicando POR QUÉ funciona su estrategia y usando el vocabulario matemático.";

  return { say, sayEs, listen, listenEs, keyWords: vocabList };
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
      talkPrompts: resolveLanguageTalkPrompts(cfg),
    },
  };
}

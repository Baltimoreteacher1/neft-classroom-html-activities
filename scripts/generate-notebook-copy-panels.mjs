#!/usr/bin/env node
/**
 * generate-notebook-copy-panels.mjs — build every notebook copy panel from the
 * lesson it appears on, and from nothing else.
 *
 * The panels this replaces were authored by hand across 84 configs with no
 * generator owning them, which is how 39 of 84 box-2 rules ended up stating
 * mathematics from a different lesson. The rule here is one sentence:
 *
 *     Content in a copy panel comes from that lesson's own data,
 *     or the lesson gets no panel. There is no third option.
 *
 * Consequently this script SHORTENS lesson text (verbatim prefixes, cut at
 * clause boundaries) and never composes new prose. Where a lesson does not
 * state a rule in a form that can be quoted, it emits no box-2 panel and names
 * the lesson in its output. A mixed result is the correct result.
 *
 * Usage: node scripts/generate-notebook-copy-panels.mjs [--check] [--only 2-5]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVocabImage } from "../engine/core/vocab-images.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

const MEANING_MAX_WORDS = 11; // the shape gate fails at 12
const RULE_MAX_WORDS = 16;

export const coreLessonIds = () =>
  readdirSync(LESSONS)
    .filter((d) => /^\d+-\d+$/.test(d))
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });

const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

/** Longest VERBATIM prefix of `text` that ends at a clause boundary and fits
 *  the word budget. Never reorders, never substitutes, never paraphrases. */
export function shortenVerbatim(text, maxWords) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;]+$/, "");
  if (!clean) return "";
  if (wordCount(clean) <= maxWords) return clean;

  // Prefer a real clause boundary inside the budget.
  const boundaries = [];
  for (const m of clean.matchAll(/\s*(?:—|–|;|,|:| that | which | so )/g)) {
    boundaries.push(m.index);
  }
  const fitting = boundaries
    .map((idx) =>
      clean
        .slice(0, idx)
        .trim()
        .replace(/[,;:—–]+$/, ""),
    )
    .filter((c) => c && wordCount(c) <= maxWords);

  // The SHORTEST clause that still says something whole beats the longest one
  // that fits: cutting "…what you have done, felt, and learned" at the last
  // comma leaves a dangling list item, while cutting at the em-dash leaves a
  // complete phrase. Below five words a clause is usually too thin to mean
  // anything, so those fall through to the longest fitting prefix.
  const whole = fitting
    .filter((c) => wordCount(c) >= 5)
    .sort((a, b) => wordCount(a) - wordCount(b))[0];
  if (whole) return whole;
  const longest = fitting.sort((a, b) => wordCount(b) - wordCount(a))[0];
  if (longest) return longest;

  // No boundary fits: hard-cut on the word budget, still a verbatim prefix,
  // then drop any trailing word that leaves the phrase hanging.
  const DANGLING =
    /^(with|from|and|or|of|the|a|an|to|that|which|for|in|on|by|into|than|as|is|are|be|one|another|each|both|either)$/i;
  const cut = clean.split(/\s+/).slice(0, maxWords);
  while (cut.length > 3 && DANGLING.test(cut[cut.length - 1])) cut.pop();
  return cut.join(" ").replace(/[,;:—–]+$/, "");
}

/** Vocabulary this lesson declares, in the lesson's own order, concept role
 *  first (see docs: `role:"concept"` marks the lesson's anchor term). */
export function panelVocabulary(config) {
  const vocab = (config.vocabulary || []).filter(
    (v) =>
      v &&
      typeof v.term === "string" &&
      v.term.trim() &&
      typeof v.definition === "string" &&
      v.definition.trim(),
  );
  const concept = vocab.filter((v) => v.role === "concept");
  const rest = vocab.filter((v) => v.role !== "concept");
  return [...concept, ...rest];
}

/**
 * The picture for a word — chosen from the art the curriculum already has, and
 * only when the artwork itself says it depicts that word.
 *
 * Every vocab SVG carries its own <title> ("Reflection: a mirror image across
 * an axis"). That title is the evidence: if it does not name the term, the
 * image is not about the term, and the resolver's synonym table had quietly
 * placed a ruler beside "Customary system", "Metric system", "Convert" and
 * "Conversion factor" alike — four rows of one lesson showing the same picture,
 * none of them depicting the word. A picture that does not depict the word is
 * worse than no picture, and four identical pictures read as a broken page.
 */
function artTitle(src) {
  const file = join(ROOT, "assets", src.replace(/^\/assets/, ""));
  if (!existsSync(file)) return "";
  const m = readFileSync(file, "utf8").match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1] : "";
}

const ART_STOP = new Set(
  "a an the of to in on for and or is are be that this it with as at by from into".split(" "),
);
const artStem = (w) => (w.length > 5 ? w.slice(0, 5) : w);
const artWords = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w && !ART_STOP.has(w))
    .map(artStem);

/** True when the artwork's own title names this term. */
export function artFitsTerm(term, src) {
  const title = artTitle(src);
  if (!title) return false;
  const inTitle = artWords(title);
  return artWords(term).some((w) => inTitle.includes(w));
}

export function buildBox1(config) {
  const vocab = panelVocabulary(config);
  if (vocab.length < 3)
    return { panel: null, reason: "fewer than 3 declared vocabulary entries with definitions" };
  const items = [];
  const usedArt = new Set();
  for (const v of vocab) {
    if (items.length === 5) break;
    const term = v.term.trim().replace(/\.$/, "");
    // Only the definition's FIRST sentence: crossing a full stop is how
    // "A number sentence with an equal sign. The percent one is" happened.
    const firstSentence = String(v.definition).split(/(?<=[.!?])\s+/)[0];
    const meaning = shortenVerbatim(firstSentence, MEANING_MAX_WORDS);
    if (!term || !meaning) continue;
    // Carry the lesson's OWN image override when it pins one. Terms without an
    // override resolve by slug at render time, and the renderer suppresses any
    // term whose only match would be a generic category tile — a picture that
    // does not depict the word is worse than no picture.
    const item = { term, meaning };
    if (typeof v.image === "string" && v.image.trim()) item.image = v.image.trim();
    // The picture is decided HERE, once, with the artwork's own title in hand —
    // the renderer has no filesystem. `art` is written only when the image
    // depicts this word and no earlier row in this panel already used it.
    const src = resolveVocabImage(term, item.image);
    if (src && !usedArt.has(src) && artFitsTerm(term, src)) {
      usedArt.add(src);
      item.art = src;
    }
    items.push(item);
  }
  if (items.length < 3)
    return { panel: null, reason: "fewer than 3 vocabulary entries survived shortening" };
  return { panel: { items }, reason: null };
}

/** A keyIdea sentence is a quotable RULE when it states a procedure or a
 *  relation, rather than a disposition. "To divide fractions, multiply by the
 *  reciprocal" is a rule; "Everyone uses math daily" is not. Symbols, an
 *  imperative opening, and relational vocabulary are the three decidable
 *  signals; everything else is skipped rather than guessed at. */
const balanced = (str) =>
  (String(str).match(/\(/g) || []).length === (String(str).match(/\)/g) || []).length;

/** A quote that ends on a word still waiting for its object — "…into a
 *  percent", "…when substituting it makes" — is a truncation, not a statement. */
const HANGING_END =
  /\b(into|onto|with|from|by|of|for|to|than|as|and|or|makes?|gives?|equals?|is|are|be|the|a|an|when|that|which)$/i;

const RULE_MARKER =
  /[=÷×−+≤≥<>%]|^to\s+\w+|\bper\b|\bequals?\b|\bis the same as\b|\bmeans\b|\balways\b|\bmust\b|\bmultiply\b|\bdivide\b|\bsubtract\b|\badd\b|\bcount\b|\bshade\b|\bcompares?\b/i;
const sentences = (s) =>
  String(s || "")
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

const MATH_TOKEN = /^[$(]*[\d.,\/]*\d[\d.,\/]*[)%°]*[.,;]?$|^[=+×÷−–\-*x][.,;]?$|^ft³?$|^in³?$/i;
const isMathToken = (t) => MATH_TOKEN.test(t);

/** The maximal run of mathematical tokens around the "=" in a sentence. Token
 *  boundaries are spaces, so a decimal point can never end the match. */
export function extractEquation(sentence) {
  const tokens = String(sentence || "")
    .trim()
    .split(/\s+/);
  const eq = tokens.findIndex((t) => t.includes("="));
  if (eq < 0) return "";
  let lo = eq;
  let hi = eq;
  while (lo - 1 >= 0 && isMathToken(tokens[lo - 1])) lo--;
  while (hi + 1 < tokens.length && isMathToken(tokens[hi + 1])) hi++;
  const span = tokens
    .slice(lo, hi + 1)
    .join(" ")
    .replace(/[.,;:]+$/, "")
    .trim();
  const numbers = span.match(/\d+(?:\.\d+)?/g) || [];
  // An equation needs both sides. "= 3" or "5 =" is a fragment, not an example.
  if (numbers.length < 2) return "";
  if (/^=|=$/.test(span)) return "";
  if (/^[+×÷−–*]/.test(span)) return ""; // "+ 8 = 20" is a clipped equation
  return span;
}

/** The lesson's stated rule, quoted from `launch.conceptIntro.keyIdea` — the
 *  one field where every lesson states its own big idea in its own words. */
/** A FORMULA: an equation whose sides carry named quantities rather than only
 *  digits — "A = 1/2 (b1 + b2) h", "V = l x w x h". Lifted by tokens from a
 *  line the lesson itself prints, never assembled from parts. */
export function extractFormula(sentence) {
  let clean = String(sentence || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean.includes("=")) return "";

  // Drop a narrating lead-in the lesson uses to introduce its own formula:
  // "I write the formula: A = base × height", "MULTIPLY: 1 × 12 = 12".
  const colon = clean.lastIndexOf(":", clean.indexOf("="));
  if (colon > 0) clean = clean.slice(colon + 1).trim();
  clean = clean.replace(
    /^(so|then|now|first|next|finally|i|we)\s+(write|add|multiply|divide|subtract|test|find|get|do|put|start|check|say|know)?\s*(the\s+)?(formula|equation)?\s*/i,
    "",
  );
  clean = clean.replace(/^(so|then|now|first|next)\s+/i, "");
  // "my equation is n + 8 = 20", "each is 8 × 5 = 40", "That is 45 + 15 = 60",
  // "Both have y = 2" — the lesson narrating its way into its own equation.
  clean = clean.replace(
    /^(my|the|each|both|that|this|it)\s+(equation|conversion factor|answer|total)?\s*(is|are|has|have)\s+/i,
    "",
  );

  // Cut the sentence's continuation AFTER the equation — "= 80, so I would say"
  // is an equation with a conversational tail, and the tail is not the note.
  clean = clean.replace(/(,|;|\s+(?:so|which|because|and then|then i|so i)\b).*$/i, "").trim();
  clean = clean.replace(/[.,;:]+$/, "").trim();

  const at = clean.indexOf("=");
  if (at <= 0 || at === clean.length - 1) return "";
  const lhs = clean.slice(0, at).trim();
  const rhs = clean.slice(at + 1).trim();
  if (!lhs || !rhs) return "";

  // Both sides must read as quantities. A verb on either side means we cut a
  // sentence, not an equation: "means = 20", "points to an equation (=)".
  const VERBY = /\b(means?|points?|shows?|tells?|gives?|says?|is called|test|becomes?)\b/i;
  if (VERBY.test(lhs) || VERBY.test(rhs)) return "";
  if (wordCount(lhs) > 6 || wordCount(rhs) > 8) return "";
  if (!/[A-Za-z0-9]/.test(lhs) || !/[A-Za-z0-9]/.test(rhs)) return "";
  // A formula NAMES quantities somewhere. Digits on both sides is an arithmetic
  // example — also a useful anchor, but a different kind, handled by tier 4.
  if (!/[A-Za-z]/.test(clean)) return "";
  if (!balanced(clean) || HANGING_END.test(clean)) return "";
  if (wordCount(clean) > 12) return "";
  // A single letter equal to a bare number ("x = 4") is a step in someone
  // else's working, not something worth copying as today's mathematics. Let the
  // next tier offer the lesson's idea instead.
  if (/^[A-Za-z]$/.test(lhs) && /^[\d.]+$/.test(rhs)) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** A PROCEDURE step: an imperative line from the lesson's own worked example
 *  that tells the student what to DO. */
export function extractProcedure(line) {
  const clean = String(line || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]+$/, "");
  if (!clean) return "";
  if (
    !/^(divide|multiply|subtract|add|count|line up|write|place|start|find|check|rewrite|flip|keep|change|bring|estimate|round|compare|order|plot|label|draw|shade|split|group|simplify|substitute|solve|graph|repeat)\b/i.test(
      clean,
    )
  )
    return "";
  if (wordCount(clean) > 14) return "";
  if (!balanced(clean) || HANGING_END.test(clean)) return "";
  return clean;
}

/** A PATTERN: a line of the lesson's own worked example that states a numeric
 *  relationship without an equals sign — "a one-disc tower takes 1 move, and a
 *  two-disc tower takes 3 moves". The user's own list of acceptable anchors
 *  names this; 10-3 teaches a pattern and states its key idea in one 37-word
 *  sentence no student would copy by hand. */
export function extractPattern(line) {
  let clean = String(line || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]+$/, "");
  // Drop a narrating lead-in ("Then I play the small cases: …").
  const colon = clean.indexOf(":");
  if (colon > 0 && colon < clean.length - 12) clean = clean.slice(colon + 1).trim();
  const numbers = clean.match(/\d+(?:\.\d+)?/g) || [];
  if (numbers.length < 2) return "";
  if (wordCount(clean) < 4 || wordCount(clean) > 20) return "";
  if (!balanced(clean) || HANGING_END.test(clean)) return "";
  if (/^[a-z]/.test(clean)) clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  return clean;
}

/** A complete KEY IDEA: one whole sentence of the lesson's own keyIdea, used as
 *  written. Never truncated — if it does not fit whole, it is not this anchor. */
export function extractKeyIdea(keySentences) {
  for (const raw of keySentences) {
    const clean = raw.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
    // One whole sentence is allowed to be a sentence. The cap exists to keep a
    // note copyable by hand, not to force a formula out of a lesson that
    // teaches a pattern or a habit of mind — 1-5, 10-1 and 10-3 state their
    // mathematics in exactly one such sentence and have no formula at all.
    if (wordCount(clean) < 4 || wordCount(clean) > 26) continue;
    if (!balanced(clean) || HANGING_END.test(clean)) continue;
    if (!/[a-z]/.test(clean)) continue;
    return clean;
  }
  return "";
}

/**
 * Tier 0 — a STRUCTURED key idea. The 2026-08-19 Section-2 upgrade rewrote
 * every core lesson's `keyIdea` into a fixed shape the lesson states about
 * itself:
 *
 *     Title. [Formula: F.] 1. step. 2. step. 3. step. [Example: E]
 *
 * When a keyIdea carries that shape, the panel is a pure PARSE of it — title,
 * formula, numbered steps and example are each a verbatim segment of the
 * lesson's own sentence, so provenance holds by construction. Step markers are
 * matched INCREMENTALLY (`1.` then `2.` then `3.` …), each at a sentence
 * boundary, because a bare /\d+\./ split reads "a fraction over 1. 2. Multiply"
 * and "1% = 0.01 = 1/100. 3. Fraction" as extra steps — both are real keyIdeas
 * in this curriculum.
 */
export function parseStructuredKeyIdea(keyIdea) {
  const clean = String(keyIdea || "")
    .replace(/\s+/g, " ")
    .trim();
  const startMatch = clean.match(/(?:^|[.!?])\s*1\.\s/);
  if (!startMatch || startMatch.index === undefined) return null;
  const headEnd = startMatch.index + (clean[startMatch.index] === "1" ? 0 : 1);
  let head = clean.slice(0, headEnd).trim();
  let rest = clean.slice(headEnd).trim();

  // The head is "Title." optionally followed by "Formula: F."
  let formula = "";
  const formulaAt = head.search(/\bFormula:\s*/);
  if (formulaAt >= 0) {
    formula = head
      .slice(formulaAt)
      .replace(/^Formula:\s*/, "")
      .trim()
      .replace(/\.$/, "");
    head = head.slice(0, formulaAt).trim();
  }
  const rule = head.replace(/[.]+$/, "").trim();
  if (!rule || !/[A-Za-z]/.test(rule)) return null;

  // Steps, split at incrementing markers only.
  const steps = [];
  let n = 2;
  for (;;) {
    const marker = rest.match(new RegExp(`[.!?]\\s+(?=${n}\\.\\s)`));
    if (!marker || marker.index === undefined) break;
    steps.push(rest.slice(0, marker.index + 1).trim());
    rest = rest.slice(marker.index + marker[0].length).trim();
    n++;
  }
  // The final chunk may carry a trailing "Example: …" the lesson states.
  let example = "";
  const exampleAt = rest.search(/(?:^|[.!?])\s*Example:\s*/);
  if (exampleAt >= 0) {
    example = rest
      .slice(exampleAt)
      .replace(/^[.!?]?\s*Example:\s*/, "")
      .trim()
      .replace(/[.]+$/, "");
    rest = rest.slice(0, exampleAt + 1).trim();
  }
  if (rest) steps.push(rest);
  const cleanSteps = steps.map((s) => s.replace(/[.]+$/, "").trim()).filter(Boolean);
  if (cleanSteps.length < 2) return null;
  if (!cleanSteps.every((s, i) => new RegExp(`^${i + 1}\\.\\s`).test(s))) return null;

  const panel = { rule };
  panel.anchorKind = /\balgorithm\b/i.test(rule) ? "algorithm" : formula ? "formula" : "key idea";
  if (formula) panel.formula = formula;
  panel.steps = cleanSteps;
  if (example) panel.example = example;
  return panel;
}

/**
 * Box 2's anchor. Tier 0 parses a structured keyIdea whole (see above). Tier 1
 * is a rule the lesson states as a complete sentence, with a clause that
 * explains it and an equation that shows it. When a lesson does not state
 * either, we do NOT stop: we fall through to the next thing the lesson
 * genuinely contains. Every tier quotes that lesson and nothing else.
 */
export function buildBox2(config) {
  const ci = (config.launch || {}).conceptIntro || {};
  const structured = parseStructuredKeyIdea(ci.keyIdea);
  if (structured) return { panel: structured, reason: null };
  const strict = buildStrictRule(config);
  if (strict.panel) return { panel: { ...strict.panel, anchorKind: "rule" }, reason: null };
  return buildFallbackAnchor(config, strict.reason);
}

function buildStrictRule(config) {
  const ci = (config.launch || {}).conceptIntro || {};
  const keySentences = sentences(ci.keyIdea);
  const ruleSentence = keySentences.find((s) => RULE_MARKER.test(s));
  if (!ruleSentence) return { panel: null, reason: "keyIdea states no rule that can be quoted" };

  const rule = shortenVerbatim(ruleSentence, RULE_MAX_WORDS);
  if (!rule) return { panel: null, reason: "rule sentence did not survive shortening" };
  // A quote that opens a bracket it never closes ("a unit ratio (12 inches") is
  // a truncation wearing a rule's clothes, and so is one ending on a word that
  // still needs an object. Neither is shown to a student.
  if (!balanced(rule)) return { panel: null, reason: "rule quote cuts inside a bracket" };
  if (HANGING_END.test(rule)) return { panel: null, reason: "rule quote ends mid-clause" };
  // "To turn a fraction into a percent" is the purpose half of an instruction
  // whose method the quote cut off. An infinitive opener needs its main clause.
  if (/^to\s/i.test(rule) && !/,/.test(rule)) {
    return { panel: null, reason: "rule quote keeps the infinitive opener but not the method" };
  }

  // The meaning is the REST of the lesson's own statement — the remainder of
  // the rule sentence when it was cut, otherwise the next keyIdea sentence.
  let meaning = "";
  const remainder = ruleSentence
    .replace(/\s+/g, " ")
    .trim()
    .slice(rule.length)
    .replace(/^[\s,;:—–]+/, "")
    .replace(/[.;]+$/, "");
  // A remainder that opens with a continuation word ("to bring down; what is
  // left…") is the back half of a clause, and reads as a broken sentence on a
  // classroom board. In that case the lesson's NEXT statement is used instead;
  // if it has none, the lesson gets no box-2 panel rather than a fragment.
  // The remainder is only usable when it starts a NEW statement: a run that
  // begins lower-case ("to bring down; what is left…", "rule, and a fractional
  // edge…") is the back half of a clause and reads as a broken sentence on a
  // classroom board. Otherwise the lesson's next statement is used, and if it
  // has none the lesson gets no box-2 panel rather than a fragment.
  const startsNewStatement = /^[A-Z0-9($]/.test(remainder);
  if (wordCount(remainder) >= 3 && startsNewStatement) meaning = remainder;
  else {
    const next = keySentences.find((k) => k !== ruleSentence);
    if (next) meaning = shortenVerbatim(next, 14);
  }
  if (!meaning)
    return { panel: null, reason: "lesson states no second clause to explain the rule" };
  if (/^(when|if|because|while|once|since|unless|although)\b/i.test(meaning)) {
    return { panel: null, reason: "the explaining clause is dependent, not a whole statement" };
  }
  if (!balanced(meaning) || HANGING_END.test(meaning)) {
    return { panel: null, reason: "the explaining clause is a fragment, not a whole statement" };
  }

  // The example is an equation the lesson's own worked example prints, lifted
  // by TOKENS rather than by a character regex. A character class that stops at
  // "." cuts "$0.60" down to "$0" and "2 × 1.5 = 3" down to "5 = 3" — both of
  // which shipped, and both of which are a wrong number in front of a student.
  const lines = (ci.iDo && Array.isArray(ci.iDo.lines) ? ci.iDo.lines : []).flatMap((l) =>
    sentences(l),
  );
  let example = "";
  for (const line of lines) {
    const found = extractEquation(line);
    if (found) {
      example = found;
      break;
    }
  }
  if (!example) return { panel: null, reason: "worked example prints no single-line equation" };

  return {
    panel: { rule, meaning: meaning.endsWith(".") ? meaning : `${meaning}.`, example },
    reason: null,
  };
}

/**
 * Tiers 2-6, in the order a note is most useful to a Grade 6 student copying
 * one line into a paper notebook. Each tier reads the SAME lesson's own text;
 * none of them composes a mathematical claim out of pieces from elsewhere.
 *
 *   2. a FORMULA the lesson prints          — "A = 1/2 (b1 + b2) h"
 *   3. a complete KEY IDEA sentence         — the lesson's own big idea, whole
 *   4. a worked EXAMPLE equation            — "94 - 68 = 26"
 *   5. a PROCEDURE step from the worked example
 *
 * A lesson that yields none of these keeps the student-generated state, and
 * its vocabulary panel is still a real anchor: a term with its meaning is one
 * of the things a student can usefully copy.
 */
function buildFallbackAnchor(config, strictReason) {
  const ci = (config.launch || {}).conceptIntro || {};
  const keySentences = sentences(ci.keyIdea);
  const iDoLines = (ci.iDo && Array.isArray(ci.iDo.lines) ? ci.iDo.lines : []).flatMap((l) =>
    sentences(l),
  );
  const sources = [...keySentences, ...iDoLines];

  // 2 — a formula, from anywhere the lesson states one.
  for (const line of sources) {
    const formula = extractFormula(line);
    if (formula) {
      const example = firstEquation(iDoLines, formula);
      return {
        panel: { rule: formula, anchorKind: "formula", ...(example ? { example } : {}) },
        reason: null,
      };
    }
  }

  // 3 — the lesson's own key idea, used whole.
  const idea = extractKeyIdea(keySentences);
  if (idea) {
    const example = firstEquation(iDoLines, idea);
    return {
      panel: { rule: idea, anchorKind: "key idea", ...(example ? { example } : {}) },
      reason: null,
    };
  }

  // 4 — an equation the worked example prints.
  const equation = firstEquation(iDoLines, "");
  if (equation) return { panel: { rule: equation, anchorKind: "example" }, reason: null };

  // 5 — a step of the lesson's own procedure.
  for (const line of iDoLines) {
    const step = extractProcedure(line);
    if (step) return { panel: { rule: step, anchorKind: "procedure" }, reason: null };
  }

  // 6 — a pattern the worked example states in numbers.
  for (const line of iDoLines) {
    const pattern = extractPattern(line);
    if (pattern) return { panel: { rule: pattern, anchorKind: "pattern" }, reason: null };
  }

  return { panel: null, reason: strictReason || "lesson states no anchor that can be quoted" };
}

/** The first equation the worked example prints, skipping one already shown. */
function firstEquation(iDoLines, already) {
  for (const line of iDoLines) {
    const found = extractEquation(line);
    if (found && found !== already) return found;
  }
  return "";
}

function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const onlyIdx = argv.indexOf("--only");
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;

  const ids = coreLessonIds().filter((id) => !only || id === only);
  const skippedBox1 = [];
  const skippedBox2 = [];
  let both = 0;
  let one = 0;
  let none = 0;
  let changed = 0;

  for (const id of ids) {
    const file = join(LESSONS, id, "config.json");
    const raw = readFileSync(file, "utf8");
    const config = JSON.parse(raw);
    const cps = (config.notebook && config.notebook.checkpoints) || [];
    if (cps.length === 0) continue;

    const b1 = buildBox1(config);
    const b2 = buildBox2(config);
    if (!b1.panel) skippedBox1.push(`${id}: box 1 — ${b1.reason}`);
    if (!b2.panel) skippedBox2.push(`${id}: box 2 — ${b2.reason}`);
    const count = (b1.panel ? 1 : 0) + (b2.panel ? 1 : 0);
    if (count === 2) both++;
    else if (count === 1) one++;
    else none++;

    for (const cp of cps) {
      const built = cp.box === 1 ? b1.panel : cp.box === 2 ? b2.panel : null;
      if (built) cp.copyPanel = built;
      else delete cp.copyPanel;
    }

    const next = `${JSON.stringify(config, null, 2)}\n`;
    if (next !== raw) {
      changed++;
      if (!check) writeFileSync(file, next);
    }
  }

  console.log(`Lessons swept: ${ids.length}`);
  console.log(`  both panels: ${both}`);
  console.log(`  one panel:   ${one}`);
  console.log(`  no panel:    ${none}`);
  if (skippedBox1.length) {
    console.log(`\nNo box-1 panel (${skippedBox1.length}):`);
    for (const s of skippedBox1) console.log(`  ${s}`);
  }
  if (skippedBox2.length) {
    console.log(`\nNo box-2 panel (${skippedBox2.length}):`);
    for (const s of skippedBox2) console.log(`  ${s}`);
  }
  if (check && changed > 0) {
    console.error(
      `\nFAIL: ${changed} lesson config(s) are stale — run node scripts/generate-notebook-copy-panels.mjs`,
    );
    process.exit(1);
  }
  if (!check) console.log(`\nRewrote ${changed} config(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

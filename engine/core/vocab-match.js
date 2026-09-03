// Shared surface matcher for vocabulary underlining.
//
// Two renderers underline vocab terms: `linkifyObjectiveTerms` (the two "I can…"
// goal cards, the cover screen, the review restatement) and `underlineVocabTerms`
// (every phase body). They used to build their own term index, and they drifted:
// the body underliner grew alias support in 2026-07-20 — so "prime" opens the
// "Prime number" popup — while the objectives card kept the naive whole-term
// match, which is exactly where a lesson is most likely to write the term in its
// natural short form. Lesson 6-4's content objective ("I can use the commutative,
// associative, and identity properties to rewrite expressions") underlined
// nothing but "expressions", even though all four properties are in its
// vocabulary list with definitions AND illustrations.
//
// This module is the single index both of them build from. It is DOM-free and
// side-effect-free so `tools/vocab-match.test.mjs` can exercise it directly —
// lesson-renderer.js cannot be imported outside a browser build (it pulls in
// `@engine/styles`).

import { surfaceMatchesEntry } from "./math-glossary.js";

// Escape a string for safe use inside a RegExp.
export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Two-word "<modifier> number(s)" terms also answer to the modifier alone
// ("prime"/"composite"), limited to unambiguously-mathematical modifiers so
// ordinary adjectives ("whole", "even", "mixed") are never linked in prose.
const SAFE_TERM_MODIFIERS = new Set(["prime", "composite", "rational", "irrational"]);

// The same trick for "<modifier> propert(y|ies)". A property's NAME is the math
// word — an objective or a hint routinely lists them with the head word shared
// ("the commutative, associative, and identity properties"), so the full
// two-word term never appears and a whole-phrase matcher sees nothing. The
// allowlist keeps it to words that mean nothing else in a 6th-grade sentence.
const SAFE_PROPERTY_MODIFIERS = new Set(["commutative", "associative", "distributive", "identity"]);

// Normalize a surface for lookup: lowercase, collapse spaces, and undo the
// plural. English pluralizes the LAST word, and a "-y" head takes "-ies"
// ("identity property" → "identity properties") — a flat trailing-"s" strip can
// never fold that back onto its term, which is why "properties" matched nothing.
export function normalizeVocabSurface(s) {
  const t = String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  if (/[^aeiou]ies$/.test(t)) return t.replace(/ies$/, "y");
  return t.replace(/s$/, "");
}

// Build the plural-tolerant match pattern for one surface. Only the head word
// pluralizes, so "identity property" matches "identity properties" but not
// "identities property".
function surfacePattern(surface) {
  const words = String(surface).trim().split(/\s+/);
  const head = words.pop() || "";
  const headPattern = /[^aeiou]y$/i.test(head)
    ? `${escapeRegExp(head.slice(0, -1))}(?:y|ies)`
    : `${escapeRegExp(head)}(?:es|s)?`;
  return words.length ? `${words.map(escapeRegExp).join("\\s+")}\\s+${headPattern}` : headPattern;
}

// A term is only worth underlining if tapping it shows something: a definition
// (EN or ES) or an authored visual/example. Otherwise students get a dead popup.
const hasPopupContent = (v) => !!(v && (v.definition || v.definitionEs || v.visual || v.example));

/**
 * Build the shared match index for a vocabulary list.
 *
 * @param {Array<Record<string, any>>} vocab - lesson vocabulary, ideally already run through
 *   `augmentVocabWithGlossary` so glossary terms and acronyms are included.
 * @returns {null | {
 *   entries: Array<{ i: number, term: string }>,
 *   createRegex: () => RegExp,
 *   resolveIndex: (surface: string) => number,
 *   termFor: (idx: number) => string,
 * }} null when nothing in the list is matchable.
 */
export function buildVocabMatcher(vocab) {
  const list = Array.isArray(vocab) ? vocab : [];
  // Skip very short terms to avoid noisy matches inside ordinary words — except
  // acronym entries (LCM, SA…), which are matched case-sensitively and so are
  // safe at two letters.
  const entries = list
    .map((v, i) => ({ i, term: String((v && v.term) || "").trim() }))
    .filter((e) => (e.term.length > 2 || list[e.i]?.caseSensitive) && hasPopupContent(list[e.i]));
  if (!entries.length) return null;

  const lookup = new Map();
  for (const e of entries) {
    const key = normalizeVocabSurface(e.term);
    if (!lookup.has(key)) lookup.set(key, e.i);
  }

  // Short natural surface forms, from two sources: an explicit `aliases: [...]`
  // array on the entry (full control), and the auto-derived modifier above.
  const surfaces = entries.map((e) => ({ surface: e.term, i: e.i }));
  const addAlias = (surface, i) => {
    const s = String(surface || "").trim();
    if (s.length <= 2) return;
    const key = normalizeVocabSurface(s);
    if (lookup.has(key)) return; // never override a real term sharing this key
    lookup.set(key, i);
    surfaces.push({ surface: s, i });
  };
  for (const e of entries) {
    const v = list[e.i] || {};
    if (Array.isArray(v.aliases)) for (const a of v.aliases) addAlias(a, e.i);
    const words = e.term.split(/\s+/);
    if (words.length !== 2) continue;
    const modifier = words[0].toLowerCase();
    const head = words[1];
    if (/^numbers?$/i.test(head) && SAFE_TERM_MODIFIERS.has(modifier)) addAlias(words[0], e.i);
    if (/^propert(y|ies)$/i.test(head) && SAFE_PROPERTY_MODIFIERS.has(modifier)) {
      addAlias(words[0], e.i);
    }
  }

  // Longest surface first so "identity property" wins over "identity", and
  // "composite number" over "number".
  const alt = [...surfaces]
    .sort((a, b) => b.surface.length - a.surface.length)
    .map((s) => surfacePattern(s.surface))
    .join("|");
  const regexSource = `\\b(?:${alt})\\b`;
  // Each consumer gets its own RegExp: they are stateful (`g` + lastIndex) and
  // the body underliner runs one across many text nodes.
  const createRegex = () => new RegExp(regexSource, "gi");

  const termFor = (idx) => entries.find((e) => e.i === idx)?.term || "";

  // Resolve a matched surface to its vocab index, or -1. Acronym entries only
  // answer to their exact uppercase form ("MAD" yes, "mad" in a sentence no).
  const resolveIndex = (surface) => {
    const key = normalizeVocabSurface(surface);
    const idx = lookup.has(key) ? lookup.get(key) : -1;
    if (idx < 0) return -1;
    return surfaceMatchesEntry(surface, list[idx]) ? idx : -1;
  };

  // `regexSource` + `lookup` are the same index in serializable form, for the
  // one consumer that cannot call back into this module: the family homework
  // page, which is standalone HTML with its matching precomputed in Node and
  // shipped as JSON. It walks text nodes against `regexSource` and resolves a
  // matched surface through `lookup` exactly as `resolveIndex` does here, so it
  // must apply the same plural normalization and the same `caseSensitive`
  // check on the entry it lands on.
  return {
    entries,
    createRegex,
    resolveIndex,
    termFor,
    regexSource,
    lookup: Object.fromEntries(lookup),
  };
}

// ── Concept entries vs. words a student can say ─────────────────────────────
//
// `vocabulary[0]` is, on 55 of the 84 core lessons, a statement of what the
// lesson DOES rather than a term: "Display Data with Histograms", "Solve and
// Graph Inequalities", "Determine the Whole Given the Part and Percent". Those
// entries are fully authored — definition, Spanish, often an illustration — and
// they earn their place as the first Word Wall card, which opens the lesson's
// big idea before its component terms. Nothing about the card is wrong.
//
// What was wrong is every consumer that reaches for ONE word. They all read
// index 0, so the language-objective card told students to say
//
//     I used the word "Display Data with Histograms".
//
// on both Objectives phases of every one of those lessons — and the code's own
// docstring says it means to name "a word the student will actually hear
// today". Slide decks and the projects card had the same shape.
//
// The distinction is AUTHORED, not inferred: an entry carries role:"concept"
// or it does not. No word-count or capitalisation heuristic decides it — "Mean
// Absolute Deviation" and "The Distributive Property" are multi-word entries
// that ARE terms, and a rule about length would have moved them. Absent role
// means term, so older data and the 148 generated variants keep working.
export function isConceptEntry(entry) {
  return !!entry && typeof entry === "object" && entry.role === "concept";
}

/**
 * The first entry a student could be asked to SAY — the first one not marked
 * as a lesson-concept statement. Falls back to the first entry of any kind, so
 * a list made entirely of concept entries still yields something rather than
 * nothing.
 *
 * @param {Array} vocab lesson `vocabulary`
 * @returns {object|string|null}
 */
export function firstVocabularyWord(vocab) {
  const list = Array.isArray(vocab) ? vocab : [];
  if (!list.length) return null;
  return list.find((entry) => !isConceptEntry(entry)) || list[0];
}

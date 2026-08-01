// The vocab surface matcher decides which words in a lesson become tappable
// definitions. Its failures are SILENT — the page renders, the sentence reads
// fine, and the key term simply has no underline — so this file pins the
// behaviours that have each broken in production at least once.
//
// The case that prompted it: lesson 6-4's content objective, "I can use the
// commutative, associative, and identity properties to rewrite expressions."
// Every property is in that lesson's vocabulary WITH a definition and dedicated
// art, and not one of them was underlined: the objectives card matched whole
// terms only, and the objective lists them with the head word shared.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { augmentVocabWithGlossary } from "../engine/core/math-glossary.js";
import { buildVocabMatcher, normalizeVocabSurface } from "../engine/core/vocab-match.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

// Underline a plain sentence the way linkifyObjectiveTerms does, and report the
// surfaces that matched, in order.
function matchedSurfaces(text, vocab) {
  const matcher = buildVocabMatcher(vocab);
  if (!matcher) return [];
  const out = [];
  for (const m of text.matchAll(matcher.createRegex())) {
    if (matcher.resolveIndex(m[0]) >= 0) out.push(m[0]);
  }
  return out;
}

const withDef = (term, extra = {}) => ({ term, definition: `def of ${term}`, ...extra });

// ── plural normalization ────────────────────────────────────────────────────
assert.equal(normalizeVocabSurface("Properties"), "property", "-ies folds to -y");
assert.equal(normalizeVocabSurface("Identity Properties"), "identity property");
assert.equal(normalizeVocabSurface("numbers"), "number");
assert.equal(normalizeVocabSurface("expression"), "expression");
assert.equal(normalizeVocabSurface("LCMs"), "lcm", "acronym plural still folds");
assert.equal(normalizeVocabSurface("  Unit   Rate  "), "unit rate", "spaces collapse");

// ── the 6-4 regression: shared head word ────────────────────────────────────
{
  const vocab = [
    withDef("Commutative Property"),
    withDef("Associative Property"),
    withDef("Identity Property"),
    withDef("Property"),
    withDef("expression"),
  ];
  const got = matchedSurfaces(
    "I can use the commutative, associative, and identity properties to rewrite expressions.",
    vocab,
  );
  assert.deepEqual(
    got,
    ["commutative", "associative", "identity properties", "expressions"],
    "every property in the objective must be tappable",
  );
}

// The full two-word term still wins over the bare modifier when it is written
// out — the language objective of the same lesson.
{
  const vocab = [withDef("Commutative Property"), withDef("Identity Property")];
  assert.deepEqual(
    matchedSurfaces("using the words commutative property and identity property", vocab),
    ["commutative property", "identity property"],
    "longest surface wins",
  );
}

// ── the modifier allowlist is a gate, not a convenience ─────────────────────
{
  // "whole"/"even" are ordinary English; underlining them mid-sentence was the
  // reason the allowlist exists. Only the curated modifiers alias.
  const vocab = [withDef("Whole number"), withDef("Prime number")];
  assert.deepEqual(matchedSurfaces("a whole pizza and a prime cut", vocab), ["prime"]);
}
{
  // A property head outside the allowlist stays whole-term only.
  const vocab = [withDef("Zero Property")];
  assert.deepEqual(matchedSurfaces("she scored zero on the quiz", vocab), []);
  assert.deepEqual(matchedSurfaces("the zero property of addition", vocab), ["zero property"]);
}

// ── invariants inherited from the body underliner ───────────────────────────
{
  // Acronyms are case-sensitive BY DESIGN: "MAD" is a measure, "mad" is a mood.
  const vocab = augmentVocabWithGlossary([withDef("mean absolute deviation")]);
  assert.deepEqual(matchedSurfaces("the MAD is 4 but he was mad", vocab), ["MAD"]);
}
{
  // A term with nothing to show must not become a dead underline.
  const vocab = [{ term: "Mystery" }, withDef("ratio")];
  assert.deepEqual(matchedSurfaces("a mystery ratio", vocab), ["ratio"]);
}
{
  // Explicit aliases still work, and never override a real term.
  const vocab = [withDef("Greatest common factor", { aliases: ["biggest shared factor"] })];
  assert.deepEqual(matchedSurfaces("find the biggest shared factor first", vocab), [
    "biggest shared factor",
  ]);
}
{
  // Regex metacharacters in a term must not blow up the alternation.
  const vocab = [withDef("a + b (sum)")];
  assert.doesNotThrow(() => matchedSurfaces("write a + b (sum) here", vocab));
}
assert.equal(buildVocabMatcher([]), null, "empty vocab → no matcher");
assert.equal(buildVocabMatcher(null), null, "missing vocab must not throw");

// ── the real lesson, end to end ─────────────────────────────────────────────
{
  const cfg = JSON.parse(readFileSync(`${repoRoot}lessons/6-4/config.json`, "utf8"));
  const vocab = augmentVocabWithGlossary(cfg.vocabulary);
  for (const key of ["contentObjective", "languageObjective"]) {
    const hits = matchedSurfaces(cfg[key], vocab);
    assert.ok(
      hits.length >= 3,
      `6-4 ${key} should underline its properties, got ${JSON.stringify(hits)}`,
    );
  }
}

console.log("vocab-match.test.mjs: OK");

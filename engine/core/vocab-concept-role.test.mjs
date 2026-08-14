// A lesson-concept statement must never be handed out as "today's word".
//
// WHY THIS GATE EXISTS
// --------------------
// `vocabulary[0]` is, on 55 of the 84 core lessons, a statement of what the
// lesson does — "Display Data with Histograms", "Solve and Graph Inequalities",
// "Determine the Whole Given the Part and Percent". Those entries are properly
// authored (definition, Spanish, usually an illustration) and they belong where
// they are: the first Word Wall card, opening the big idea before its terms.
//
// The defect was on the other side. Every consumer that wanted ONE word read
// index 0 positionally, so the language-objective card printed
//
//     I used the word "Display Data with Histograms".
//
// on both Objectives phases of all 55 — while its own docstring said it meant to
// name "a word the student will actually hear today".
//
// The fix is an AUTHORED marker, role:"concept", not a heuristic. That matters:
// "Mean Absolute Deviation" and "The Distributive Property" are long, capitalised
// multi-word entries that ARE terms, so any rule about length or capitalisation
// would have moved them wrongly. These tests pin the marker's meaning, the
// selector's behaviour, and — most importantly — that a marked entry is still
// fully present as vocabulary, because the repair must not cost the Word Wall a
// card or a Spanish translation.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { firstVocabularyWord, isConceptEntry } from "./vocab-match.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CORE = readdirSync(join(ROOT, "lessons"))
  .filter((d) => /^\d+-\d+$/.test(d))
  .sort();
const cfg = (id) => JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));

test("the marker is authored, never inferred", () => {
  assert.equal(isConceptEntry({ term: "Display Data with Histograms" }), false);
  assert.equal(isConceptEntry({ term: "Display Data with Histograms", role: "concept" }), true);
  // Length and capitalisation say nothing. Both of these are real terms.
  assert.equal(isConceptEntry({ term: "Mean Absolute Deviation" }), false);
  assert.equal(isConceptEntry({ term: "The Distributive Property" }), false);
  assert.equal(isConceptEntry(null), false);
  assert.equal(isConceptEntry("plain string"), false);
});

test("the selector skips concept entries and keeps the rest", () => {
  const vocab = [
    { term: "Display Data with Histograms", role: "concept" },
    { term: "Histogram" },
    { term: "Frequency" },
  ];
  assert.equal(firstVocabularyWord(vocab).term, "Histogram");
  assert.equal(firstVocabularyWord([{ term: "quantity" }, { term: "unit" }]).term, "quantity");
});

test("a list of nothing but concept entries still yields one", () => {
  // Better a concept statement than an empty bullet.
  const only = [{ term: "Solve and Graph Inequalities", role: "concept" }];
  assert.equal(firstVocabularyWord(only).term, "Solve and Graph Inequalities");
  assert.equal(firstVocabularyWord([]), null);
  assert.equal(firstVocabularyWord(undefined), null);
});

test("no lesson's spoken word is a concept statement", () => {
  const bad = [];
  for (const id of CORE) {
    const c = cfg(id);
    const chosen = firstVocabularyWord(c.vocabulary);
    if (isConceptEntry(chosen)) bad.push(`${id}: "${chosen.term}"`);
  }
  assert.deepEqual(bad, [], "lessons whose only vocabulary is a concept statement");
});

test("every concept entry is still a complete vocabulary card", () => {
  // The repair marks an entry; it must never hollow one out. A concept card
  // that lost its definition or its Spanish would be a worse outcome than the
  // defect it replaced.
  const bad = [];
  for (const id of CORE) {
    for (const entry of cfg(id).vocabulary || []) {
      if (!isConceptEntry(entry)) continue;
      if (!entry.definition) bad.push(`${id}: "${entry.term}" has no definition`);
      if (!entry.termEs) bad.push(`${id}: "${entry.term}" has no Spanish term`);
      if (!entry.definitionEs) bad.push(`${id}: "${entry.term}" has no Spanish definition`);
    }
  }
  assert.deepEqual(bad, [], "concept entries missing content");
});

test("marking is confined to the concept slot", () => {
  // Only the opening entry states the lesson concept. A marker further down
  // would quietly remove a real term from every one-word consumer.
  const bad = [];
  for (const id of CORE) {
    (cfg(id).vocabulary || []).forEach((entry, i) => {
      if (i > 0 && isConceptEntry(entry)) bad.push(`${id}[${i}]: "${entry.term}"`);
    });
  }
  assert.deepEqual(bad, [], "concept markers outside vocabulary[0]");
});

test("the fleet still has terms to say", () => {
  // A floor, not an exact count: the point is that the selector finds a real
  // word on the lessons that carry a concept entry, not how many there are.
  const withConcept = CORE.filter((id) => isConceptEntry(cfg(id).vocabulary?.[0]));
  assert.ok(withConcept.length >= 40, `expected the convention to be widespread, got ${withConcept.length}`);
  for (const id of withConcept) {
    const chosen = firstVocabularyWord(cfg(id).vocabulary);
    assert.ok(chosen && !isConceptEntry(chosen), `${id} found no word to say`);
  }
});

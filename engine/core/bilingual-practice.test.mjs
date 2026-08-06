// The core lesson practice lane had no Spanish renderer at all.
//
// 4,355 `*Es` strings are authored across the 64 core lesson configs, but a
// module-graph walk from `engine/core/lesson-renderer.js` reached a consumer
// for only the vocabulary ones. `explanationEs` (1,308), `hintsEs` (860),
// `choicesEs` (162), `instructionsEs` (170) and `promptEs` (54) had ZERO
// reachable consumers — authored, shipped, and never once drawn on screen.
// The small-group renderer had a complete bilingual lane the whole time
// (`bi()` in small-group-ui.js); the core renderer simply never grew one.
//
// These tests pin the two invariants that make that lane safe to turn on:
//
//   1. No Spanish authored → English alone, NOT an empty second line. A blank
//      italic line under the English reads as "the translation is missing" on
//      the many items that never had one.
//   2. Spanish present → a `.i18n-es` span, which design-system.css keeps at
//      `display:none` until <html lang="es">. Spanish stays opt-in; a student
//      who never touches the toggle sees exactly what they saw before.
//
// Pure-function tests on purpose: `esc()` in i18n.js already no-ops without a
// DOM, so this runs in plain Node and stays in `npm test` rather than needing
// the browser gate. The browser side (that the spans actually reach the page
// and flip with the toggle) is covered by validate:lesson-boot / lesson-visuals.

import assert from "node:assert/strict";
import test from "node:test";

import { deriveHintLadder } from "./content-enrichment.js";
import { stackContent, stackContentHtml } from "./i18n.js";
import { misconceptionLabel, studentExplanation } from "./misconceptions.js";

test("stackContent: Spanish present → stacked, and tagged for the CSS switch", () => {
  const out = stackContent("What is the GCF of 8 and 12?", "¿Cuál es el MCD de 8 y 12?");
  assert.match(out, /class="i18n-stack"/);
  assert.match(out, /class="i18n-en" lang="en"/);
  assert.match(out, /class="i18n-es" lang="es"/);
  assert.match(out, /¿Cuál es el MCD de 8 y 12\?/);
});

test("stackContent: no Spanish → English alone, never an empty ES span", () => {
  for (const missing of [undefined, null, "", "   ", "\n\t"]) {
    const out = stackContent("Sort these numbers.", missing);
    assert.equal(out, "Sort these numbers.");
    assert.doesNotMatch(out, /i18n-es/);
  }
});

test("stackContent: identical lanes collapse to one line", () => {
  // Numeric choices ("9", "18") and untranslated fallbacks arrive with both
  // lanes equal. Stacking them prints the same text twice.
  assert.equal(stackContent("18", "18"), "18");
  assert.doesNotMatch(stackContent("18", "18"), /i18n-es/);
});

test("stackContentHtml preserves caller markup and stacks both lanes", () => {
  // Stems run through renderMathText, which emits real tags — escaping here
  // would print the markup literally to exactly the students who need it read.
  const raw = stackContentHtml("<b>3</b> × 4", "<b>3</b> × 4 (es)");
  assert.match(raw, /<b>3<\/b> × 4/);
  assert.match(raw, /class="i18n-es"/);

  // NOT asserted here: that `stackContent` HTML-escapes its two lanes. It does,
  // but only in a browser — `esc()` in i18n.js short-circuits to a plain String()
  // when `document` is undefined, so under `node --test` escaping is a no-op and
  // an assertion either way would be measuring the test environment rather than
  // the code. `stackContent` routes through the same `esc()` that `stackHtml`
  // has always used, so it inherits whatever that guarantees on a real page.
});

test("deriveHintLadder carries hintsEs alongside the English rungs", () => {
  const ladder = deriveHintLadder({
    type: "multiple-choice",
    hints: ["First look.", "Try a factor tree.", "Compare the factors."],
    hintsEs: ["Primero mira.", "Prueba un árbol de factores.", "Compara los factores."],
  });
  assert.equal(ladder.length, 3);
  assert.deepEqual(
    ladder.map((h) => h.textEs),
    ["Primero mira.", "Prueba un árbol de factores.", "Compara los factores."],
  );
});

test("deriveHintLadder: untranslated hints stay undefined, not empty strings", () => {
  const ladder = deriveHintLadder({
    type: "multiple-choice",
    hints: ["a", "b", "c"],
  });
  assert.equal(ladder.length, 3);
  for (const rung of ladder) assert.equal(rung.textEs, undefined);
});

test("deriveHintLadder pairs by RAW index, so a blank hint cannot shift the lanes", () => {
  // `hints` is filtered for falsy entries before mapping; `hintsEs` is not.
  // Pairing after the filter would hand rung 2 the translation of rung 3.
  const ladder = deriveHintLadder({
    type: "multiple-choice",
    hints: ["one", "", "three", "four"],
    hintsEs: ["uno", "", "tres", "cuatro"],
  });
  assert.deepEqual(
    ladder.map((h) => [h.text, h.textEs]),
    [
      ["one", "uno"],
      ["three", "tres"],
      ["four", "cuatro"],
    ],
  );
});

test("misconception accessors return Spanish when it exists, English when it does not", () => {
  // The taxonomy is only partly translated. Both accessors fall back to
  // English rather than blank — and multiple-choice.js compares the two before
  // prefixing "No exactamente.", so a fallback never yields a Spanish lead-in
  // glued to an English sentence.
  const id = "op-added-instead-of-multiplied";
  assert.equal(misconceptionLabel(id, "es"), "Sumó cuando el problema multiplica");
  assert.notEqual(misconceptionLabel(id, "en"), misconceptionLabel(id, "es"));
  assert.ok(studentExplanation(id, "es").length > 0);

  // Unknown ids are empty, never "undefined" printed at a student.
  assert.equal(misconceptionLabel("no-such-id", "es"), "");
  assert.equal(studentExplanation("no-such-id", "es"), "");
});

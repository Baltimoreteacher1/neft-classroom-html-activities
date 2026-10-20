#!/usr/bin/env node
/* =============================================================================
 * deck-warmup.test.mjs — a lesson's `deckWarmup` is the Reveal deck's own Slide 1.
 * -----------------------------------------------------------------------------
 * The online warm-up is a Previous Lesson Check; the deck's Slide 1 is a skills
 * check for TODAY. A lesson that carries `deckWarmup` presents both. These
 * assertions hold the two things that can drift:
 *   - every deck question's numbers come from the deck's Slide 1 text
 *     (tools/reveal-classroom-slide-text.json), so the online item cannot quietly
 *     become a different problem;
 *   - each item is fully authored — feedback for every choice, a valid answer,
 *     and the Spanish lane — because nothing downstream reviews it.
 * ============================================================================= */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { listLessonDirs, tryLoadLessonConfig } from "./lib/curriculum-source.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const deckSlides = read("tools/reveal-classroom-slide-text.json").decks;
const nums = (text) => new Set(String(text).match(/\d+(?:\.\d+)?/g) || []);

const withDeck = listLessonDirs()
  .map((id) => ({ id, config: tryLoadLessonConfig(id) }))
  .filter(({ config }) => config?.deckWarmup);

test("at least one lesson carries a deck warm-up", () => {
  assert.ok(withDeck.length > 0, "no lesson has `deckWarmup`; this gate would verify nothing");
});

for (const { id, config } of withDeck) {
  const { questions } = config.deckWarmup;

  test(`${id}: deck warm-up items are fully authored`, () => {
    assert.ok(Array.isArray(questions) && questions.length > 0, "no questions");
    for (const q of questions) {
      const where = `${id} ${q.id}`;
      assert.ok(q.stem && q.explanation, `${where}: stem and explanation required`);
      assert.ok(q.choices.length >= 2, `${where}: needs choices`);
      assert.ok(q.choices[q.correctIndex], `${where}: correctIndex points at nothing`);
      assert.equal(q.choiceFeedback.length, q.choices.length, `${where}: feedback per choice`);
      q.choiceFeedback.forEach((line, i) => {
        assert.equal(
          line === "",
          i === q.correctIndex,
          `${where}: only the correct choice may have empty feedback (choice ${i})`,
        );
      });
      assert.ok(q.stemEs && q.explanationEs, `${where}: Spanish stem and explanation required`);
      assert.equal(q.choicesEs?.length, q.choices.length, `${where}: choicesEs per choice`);
      assert.equal(q.choiceFeedbackEs?.length, q.choices.length, `${where}: Spanish feedback`);
    }
  });

  test(`${id}: deck warm-up items come from Slide 1 of the deck`, () => {
    const deck = deckSlides.find((d) => d.url?.includes(`/lessons/${id}/`));
    assert.ok(deck, `${id}: no deck in tools/reveal-classroom-slide-text.json`);
    const slide1 = deck.slides[0].paragraphs.join(" ");
    assert.match(slide1, /warm-?up/i, `${id}: deck slide 1 is not the warm-up`);
    const onSlide = nums(slide1);
    for (const q of questions) {
      for (const n of nums(q.stem)) {
        assert.ok(onSlide.has(n), `${id} ${q.id}: stem number ${n} is not on deck slide 1`);
      }
    }
    assert.equal(
      questions.length,
      (deck.slides[0].paragraphs.join("\n").match(/^QUESTION \d+/gm) || []).length,
      `${id}: the deck has a different number of warm-up questions`,
    );
  });
}

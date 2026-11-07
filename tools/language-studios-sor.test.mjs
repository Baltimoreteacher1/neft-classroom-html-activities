import assert from "node:assert/strict";
import test from "node:test";
import { toHtml } from "../access-practice-lab/src/util.js";
import * as ls from "../access-practice-lab/src/views/language-studios.js";
import * as sor from "../access-practice-lab/src/views/science-of-reading.js";
import { routeFacts } from "./lib/journey-routes.mjs";

test("Science of Reading data structures and contracts", () => {
  assert.ok(
    sor.ROPE_STRANDS.upper.strands.length >= 5,
    "Upper rope has at least 5 comprehension strands",
  );
  assert.ok(
    sor.ROPE_STRANDS.lower.strands.length >= 3,
    "Lower rope has at least 3 word recognition strands",
  );
  assert.ok(sor.VOWEL_VALLEY.length >= 12, "Vowel valley contains all 12 phonemes");
  assert.ok(
    sor.CONSONANT_CATEGORIES.length >= 5,
    "Consonants matrix covers stops, fricatives, affricates, nasals, liquids/glides",
  );
  assert.ok(
    Object.keys(sor.MAPPING_WORDS).length >= 10,
    "Orthographic mapping library has at least 10 words",
  );
  assert.ok(sor.SYLLABLE_TYPES.length === 6, "Covers all 6 CLOVER syllable types");
  assert.ok(
    sor.CHOPPER_WORDS.length >= 5,
    "Syllable division chopper has words covering VCCV, VCV, VV, and C-le",
  );
  assert.ok(sor.SVR_PROFILES.length >= 4, "Simple view of reading includes key archetypes");
  assert.ok(sor.EHRI_PHASES.length === 4, "Ehri's 4 phases of word reading development");
  assert.equal(
    sor.WORD_PART_CHALLENGE.length,
    5,
    "Word-Part Detective includes five practice rounds",
  );
  for (const item of sor.WORD_PART_CHALLENGE) {
    assert.ok(
      item.answer >= 0 && item.answer < item.choices.length,
      `${item.word} answer index is valid`,
    );
  }
  for (const band of ["3-5", "6-8"]) {
    assert.ok(sor.TEXT_CLUE_CHALLENGE[band].length >= 3, `${band} has a text-clue round`);
    for (const question of sor.TEXT_CLUE_CHALLENGE[band]) {
      assert.ok(
        question.answer >= 0 && question.answer < question.choices.length,
        `Text answer index is valid for ${band}`,
      );
    }
  }
});

test("Science of Reading render contract", async () => {
  const out = await sor.render();
  assert.strictEqual(out.title, "Science of Reading Studio");
  const markup = toHtml(out.html);
  assert.ok(markup.length > 500);
  assert.ok(markup.includes("Word-Part Detective"));
  assert.ok(markup.includes("sor-nav-tabs"));
  assert.ok(markup.includes("Reading Rope"));
  assert.ok(markup.includes("Science of Reading Studio"));
  assert.ok(markup.includes("READY-TO-TEACH"));
  assert.ok(markup.includes("sor-grade-switch"));
  assert.ok(markup.includes("Text-Clue Challenge"));
});

test("Language Studios data structures and contracts", () => {
  assert.ok(
    ls.WIDA_DISCOURSE_DATA.science.levels.length === 5,
    "Science has all 5 WIDA discourse levels",
  );
  assert.ok(
    ls.WIDA_DISCOURSE_DATA.socialStudies.levels.length === 5,
    "Social Studies has all 5 WIDA discourse levels",
  );
  assert.ok(
    ls.WIDA_DISCOURSE_DATA.math.levels.length === 5,
    "Math has all 5 WIDA discourse levels",
  );
  assert.ok(ls.SYNTAX_CLAUSES.length >= 3, "Clause slicer has sample prompts");
  assert.ok(ls.WHEEL_DATA.prefixes.length >= 5, "Morphology wheel has prefixes");
  assert.ok(
    ls.WHEEL_DATA.roots.length >= 5,
    "Morphology wheel has Latin/Greek roots with Spanish cognates",
  );
  assert.ok(ls.COHESION_PASSAGES.length >= 2, "Cohesion balancer has passages");
  assert.ok(ls.SYNTAX_GLITCHES.length >= 4, "Syntax glitch hunter has error cards");
});

test("Language Studios render contract", async () => {
  const out = await ls.render();
  assert.strictEqual(out.title, "Language Studios");
  const markup = toHtml(out.html);
  assert.ok(markup.length > 500);
  assert.ok(markup.includes("WIDA Academic Discourse Level Slider"));
  assert.ok(markup.includes("Academic English Mastery"));
  assert.ok(markup.includes("wida-range-slider"));
});

test("App routing recognizes Science of Reading and Language Studios roots", () => {
  const facts = routeFacts();
  assert.ok(facts.roots.includes("science-of-reading"), "parseRoute handles 'science-of-reading'");
  assert.ok(facts.roots.includes("language-studios"), "parseRoute handles 'language-studios'");
  assert.ok(facts.roots.includes("sor"), "parseRoute handles 'sor'");
});

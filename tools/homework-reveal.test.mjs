/**
 * The tap-to-reveal parts of the family page, driven over all 166 sidecars: "Talk about it" prompts,
 * "Almost right", and the no-JavaScript problem list. Each is built only from the lesson's own
 * fields, so what must hold is: the wrong answer is never the right one, both languages are there,
 * and a page with its own spot-the-glitch does not get a second card.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { almostRightPick, renderAlmostRight } from "../scripts/lib/homework-almost-right.mjs";
import { renderStaticFallback } from "../scripts/lib/homework-static-fallback.mjs";
import { renderTalkTogether, talkPrompts } from "../scripts/lib/homework-talk.mjs";

const DIR = new URL("../data/family-homework-notes/", import.meta.url);
const lessons = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({
    id: f.slice(0, -5),
    familyNotes: JSON.parse(readFileSync(new URL(f, DIR), "utf8")),
  }))
  .map((l) => ({ ...l, lessonId: l.id }));

test("sweep covers every lesson", () => assert.equal(lessons.length, 166));

test("Almost right: wrong is never right, both languages, none where a glitch exists", () => {
  let cards = 0;
  for (const config of lessons) {
    const html = renderAlmostRight(config);
    if (config.familyNotes.v3?.glitch) {
      assert.equal(html, "", `${config.id} has a glitch card already`);
      continue;
    }
    const pick = almostRightPick(config.familyNotes);
    if (!pick) {
      assert.equal(html, "");
      continue;
    }
    cards += 1;
    const { item, wrong, right } = pick;
    assert.notEqual(wrong.en, right.en, `${config.id}: wrong equals right`);
    assert.equal(item.choices[item.correctIndex], right.en);
    assert.match(html, /class="lang-es"/);
    assert.match(html, /id="hw_almost_reveal"/);
  }
  assert.ok(cards >= 70, `only ${cards} base pages got an Almost right card`);
});

test("Talk about it: 1-3 unique prompts per page, each revealable and readable aloud", () => {
  for (const config of lessons) {
    const ask = { en: "What do you notice?", es: "¿Qué notas?" };
    const prompts = talkPrompts(config, ask);
    assert.ok(prompts.length >= 1 && prompts.length <= 3, config.id);
    assert.equal(new Set(prompts.map((p) => p.en)).size, prompts.length);
    const html = renderTalkTogether(config, ask);
    assert.equal((html.match(/<details class="hw-reveal"/g) || []).length, prompts.length);
    assert.equal((html.match(/hwSpeakById/g) || []).length, prompts.length);
  }
});

test("No-JavaScript list: six problems, answers match the key, PDFs linked, both languages", () => {
  for (const config of lessons) {
    const html = renderStaticFallback(config, config.id);
    const items = config.familyNotes.basicPractice || [];
    assert.match(html, /^<noscript>/);
    assert.match(
      html,
      new RegExp(`/lessons/${config.id}/downloads/${config.id}-family-sheet\\.pdf`),
    );
    assert.match(
      html,
      new RegExp(`/lessons/${config.id}/downloads/${config.id}-family-sheet-es\\.pdf`),
    );
    assert.equal((html.match(/<details>/g) || []).length, items.length * 2, config.id);
    const esc = (t) =>
      t
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    for (const item of items) {
      const letter = "ABCDE"[item.correctIndex];
      assert.ok(
        html.includes(`${letter}.</strong> ${esc(item.explanation)}`),
        `${config.id}: EN answer line`,
      );
      assert.ok(
        html.includes(`${letter}.</strong> ${esc(item.explanationEs)}`),
        `${config.id}: ES answer line`,
      );
    }
  }
});

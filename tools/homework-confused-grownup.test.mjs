import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { MISCONCEPTIONS, resolveAuthoredTag } from "@eduwonderlab/engine/core/misconceptions.js";
import {
  confusedRoundsFor,
  leaksAnswer,
  MAX_ROUNDS,
  roundOf,
} from "../scripts/lib/homework-confused-grownup.mjs";
import { generatesFamilyHomework } from "../scripts/lib/lesson-scope.mjs";
import { toHomeworkShape } from "../scripts/lib/review-lesson-shape.mjs";
import { lessonPath, listLessonDirs, loadLessonConfig } from "./lib/curriculum-source.mjs";
import { homeworkDom, tick } from "./lib/homework-page-dom.mjs";

const TAGS = JSON.parse(
  readFileSync(new URL("../data/homework-confused-grownup-tags.json", import.meta.url), "utf8"),
).tags;
const shaped = (id) => toHomeworkShape(loadLessonConfig(id));
const familyIds = () =>
  listLessonDirs({ filter: /^[0-9][0-9a-z-]*$/ }).filter((id) =>
    generatesFamilyHomework(id, loadLessonConfig(id)),
  );

test("every family prompt copies its tag's current watchFor, in both languages", () => {
  for (const [tag, row] of Object.entries(TAGS)) {
    assert.ok(MISCONCEPTIONS[tag], `${tag} is a real misconception tag`);
    assert.equal(
      row.watchFor,
      MISCONCEPTIONS[tag].watchFor,
      `${tag}: taxonomy changed, revisit the prompt`,
    );
    assert.ok(row.askEn.length > 20 && row.askEs.length > 20 && row.askEn !== row.askEs, tag);
    assert.match(row.askEn, /[?.]$/);
  }
});

test("no authored distractor tag a lesson uses is missing a family prompt", () => {
  const missing = new Set();
  for (const id of familyIds()) {
    const cfg = shaped(id);
    const pools = [
      ...(cfg.warmup?.questions || []),
      ...Object.values(cfg.practice || {}).flat(),
      ...(cfg.familyCheck ? [cfg.familyCheck] : []),
    ];
    for (const it of pools)
      for (const t of it?.misconceptionTags || []) {
        const key = resolveAuthoredTag(t);
        if (key && !TAGS[key]) missing.add(key);
      }
  }
  assert.deepEqual([...missing], [], "add these tags to data/homework-confused-grownup-tags.json");
});

test("rounds are real, never give the answer away, and skip lessons with no suitable tag", () => {
  let lessons = 0;
  for (const id of familyIds()) {
    const rounds = confusedRoundsFor(shaped(id));
    assert.ok(rounds.length <= MAX_ROUNDS);
    if (rounds.length) lessons++;
    for (const r of rounds) {
      const correct = r.options.filter((o) => o.correct);
      assert.equal(correct.length, 1, `${id}: exactly one right option`);
      assert.ok(
        !r.options.some((o) => o.en === r.claim.en),
        `${id}: the claim is not offered back`,
      );
      assert.ok(r.options.length >= 2);
      for (const o of r.options.filter((x) => !x.correct)) {
        assert.ok(o.fbEn && o.fbEs, `${id}: every wrong option answers back in both languages`);
        assert.ok(!leaksAnswer(o.fbEn, correct[0].en), `${id}: feedback leaks the answer`);
      }
      assert.ok(r.stem.es && r.claim.es && r.why.es && r.explanation.es && r.ask.es);
    }
  }
  assert.ok(lessons >= 60, `expected >= 60 lessons with a card, got ${lessons}`);
  assert.equal(roundOf({ stem: "x", choices: ["a", "b", "c"], correctIndex: 0 }), null);
});

test("detector bites: an item whose distractor feedback states the answer is skipped", () => {
  const item = {
    stem: "Write 10% as a decimal.",
    stemEs: "Escribe 10% como decimal.",
    choices: ["0.01", "0.1", "1.0"],
    choicesEs: ["0.01", "0.1", "1.0"],
    correctIndex: 1,
    explanation: "10% = 0.1",
    explanationEs: "10% = 0.1",
    misconceptionTags: ["decimal-place-value", null, "decimal-place-value"],
    choiceFeedback: ["Moved two places.", "", "Not 1.0, it is 0.1 here."],
    choiceFeedbackEs: ["Dos lugares.", "", "No es 1.0."],
  };
  assert.equal(roundOf(item), null, "feedback for 1.0 says 0.1");
  item.choiceFeedback[2] = "That is ten times too big.";
  assert.equal(roundOf(item)?.claim.en, "0.01");
});

test("generated card: present only where rounds exist, plays by keyboard, never prints the answer on a miss", async () => {
  for (const id of familyIds()) {
    const has = confusedRoundsFor(shaped(id)).length > 0;
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    assert.equal(html.includes('id="hw_cga"'), has, id);
  }
  const { w, d, errors } = await homeworkDom("4-3");
  w.switchHomeworkTab("play");
  const round = d.querySelector("#hw_cga .cga-round:not([hidden])");
  const right = round.querySelector('[data-cga-correct="1"]');
  const wrong = round.querySelector('[data-cga-correct="0"]');
  wrong.click();
  assert.ok(wrong.classList.contains("is-wrong"));
  assert.ok(round.querySelector(".cga-win").hidden, "a miss does not reveal the explanation");
  assert.match(round.querySelector(".cga-feedback").textContent, /Not yet/);
  assert.equal(round.querySelector(".cga-feedback").getAttribute("aria-live"), "polite");
  right.click();
  await tick();
  assert.equal(round.querySelector(".cga-win").hidden, false);
  assert.ok(right.disabled);
  assert.equal(errors.length, 0, errors.map((e) => e.message).join());
  assert.ok(existsSync(lessonPath("4-3", "homework.html")));
});

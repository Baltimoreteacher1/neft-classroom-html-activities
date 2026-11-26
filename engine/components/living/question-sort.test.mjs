// question-sort.test.mjs — every number and choice the question-sort play shows
// for lesson 2-1, recomputed independently of the play.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildQuestionSortPlay, validateQuestionSort as reexported } from "./question-sort.js";
import {
  distinct,
  facts,
  isStatistical,
  placeCorrect,
  predictOptions,
  questionSortCopy,
  validateQuestionSort,
  wrap,
} from "./question-sort-model.js";

const lesson = JSON.parse(readFileSync(new URL("../../../lessons/2-1/config.json", import.meta.url)));
const CFG = lesson.launch.conceptIntro.livingScene;
const clone = () => structuredClone(CFG);

test("the authored 2-1 scene builds, with its own questions and numbers", () => {
  const v = validateQuestionSort(CFG);
  assert.ok(v);
  assert.equal(v.n, 7);
  // The worked example's data: Question 2 answers are 8, 12, 12, 15, 18, 20, 22.
  assert.deepEqual(v.duo[1].answers, [8, 12, 12, 15, 18, 20, 22]);
  assert.deepEqual(v.duo[0].answers, Array(7).fill(18));
  assert.match(v.duo[0].text.en, /top player score last night/);
  assert.ok(buildQuestionSortPlay(CFG));
  assert.equal(reexported, validateQuestionSort);
});

test("a question is statistical exactly when its answers vary", () => {
  assert.equal(isStatistical([18, 18, 18]), false);
  assert.equal(isStatistical([8, 12, 12]), true);
  assert.equal(isStatistical([0]), false);
  assert.equal(distinct([8, 12, 12, 15, 18, 20, 22]), 6);
  // Independent recount of the lesson's data.
  const q2 = [8, 12, 12, 15, 18, 20, 22];
  assert.equal(new Set(q2).size, 6);
  assert.deepEqual(facts({ answers: q2 }), { d: 6, min: 8, max: 22, one: 8 });
  const v = validateQuestionSort(CFG);
  for (const q of [...v.duo, ...v.more]) assert.equal(q.statistical, new Set(q.answers).size > 1);
});

test("every group holds exactly one statistical and one fixed-answer question", () => {
  const v = validateQuestionSort(CFG);
  assert.equal(v.duo.filter((q) => q.statistical).length, 1);
  assert.equal(v.more.filter((q) => q.statistical).length, 1);
  assert.equal(v.transfer.options.filter((o) => o.statistical).length, 1);
  for (const o of v.transfer.options.filter((x) => !x.statistical))
    assert.ok(o.cue.en.endsWith("?") && o.cue.es.endsWith("?"), "a wrong choice is cued with a question");
});

test("predict choices: one correct, three distinct wrong ones, none is the answer", () => {
  const v = validateQuestionSort(CFG);
  const opts = predictOptions(v);
  assert.equal(opts.length, 4);
  assert.equal(opts.filter((o) => o.correct).length, 1);
  assert.equal(new Set(opts.map((o) => o.label.en)).size, 4);
  assert.equal(opts.find((o) => o.correct).label.en, "Question 2");
  const T = questionSortCopy(v);
  for (const o of opts.filter((x) => !x.correct)) {
    const cue = T.predictCue(o.kind);
    assert.ok(cue.en.endsWith("?") && cue.es.endsWith("?"), o.kind);
    assert.doesNotMatch(cue.en, /is (a )?statistical|not statistical/i, "a cue never states the answer");
  }
  assert.notEqual(T.cueRow("fixed"), T.cueRow("neither"), "each cue points at a different card");
  const placed = placeCorrect(opts, 3 * 7 + 1);
  assert.notEqual(placed.findIndex((o) => o.correct), 0);
  assert.equal(placed.length, 4);
});

test("sentences state numbers recomputed from the data", () => {
  const v = validateQuestionSort(CFG);
  const T = questionSortCopy(v);
  assert.match(T.askDone.en, /every answer is 18/);
  assert.match(T.askDone.en, /6 different answers, from 8 to 22/);
  assert.match(T.askDone.es, /todas las respuestas son 18/);
  assert.match(T.askDone.es, /6 respuestas distintas, de 8 a 22/);
  assert.match(T.nameExpr.en, /Question 1: 1 different answer · Question 2: 6 different answers/);
  assert.match(T.asked(3).en, /Question 1 → 18, Question 2 → 12/);
  const pets = v.more[0];
  assert.match(T.sortOk(pets).en, /\(4 different answers\)/); // 0, 1, 2, 3
  assert.equal(new Set([0, 1, 0, 2, 3, 2, 1]).size, 4);
  assert.match(T.sortOk(v.more[1]).en, /All 7 answers are 7/);
  assert.match(T.sortCue(pets).en, /Would they all give the same answer\?/);
  assert.match(T.sortCue(v.more[1]).en, /Would you expect them to give different answers\?/);
});

test("copy exists in both languages, with no English left in the Spanish", () => {
  const v = validateQuestionSort(CFG);
  const T = questionSortCopy(v);
  const walk = (x, path) => {
    if (x && typeof x === "object" && "en" in x) {
      assert.ok(typeof x.es === "string" && x.es.trim(), `${path} needs Spanish`);
      assert.notEqual(x.en, x.es, `${path} Spanish must not be a copy`);
      assert.doesNotMatch(x.es, /\b(the|and|answers?|question|statistical)\b/i, `${path}: English in Spanish`);
      assert.doesNotMatch(x.es, /\b(usted|ustedes|vosotros)\b/i);
    }
  };
  for (const [k, val] of Object.entries(T)) {
    if (typeof val === "function") continue;
    if (val && typeof val === "object" && !("en" in val)) {
      for (const [k2, v2] of Object.entries(val)) walk(v2, `${k}.${k2}`);
    } else walk(val, k);
  }
  for (const f of [T.asked(2), T.sortOk(v.more[0]), T.sortCue(v.more[1]), T.transferOk(v.transfer.options[0])])
    walk(f, "fn");
});

test("question cards wrap to two lines in both languages", () => {
  const v = validateQuestionSort(CFG);
  for (const q of [...v.duo, ...v.more]) {
    assert.ok(q.lines.en.length <= 2 && q.lines.es.length <= 2);
    assert.ok([...q.lines.en, ...q.lines.es].every((l) => l.length <= 50));
  }
  assert.equal(wrap("one two three", 50).length, 1);
  assert.equal(wrap("x ".repeat(80)), null, "too long for two lines");
});

test("validation refuses configs the stage cannot draw correctly", () => {
  const mutate = (fn) => {
    const c = clone();
    fn(c);
    return c;
  };
  const bad = [
    null,
    {},
    mutate((c) => (c.pair[0].statistical = true)), // flag disagrees with the all-18 answers
    mutate((c) => (c.pair[1].statistical = false)), // flag disagrees with varying answers
    mutate((c) => (c.pair[1].answers = [8, 12, 12, 15, 18, 20])), // length differs
    mutate((c) => (c.pair[1].answers = [8, 12, 12, 15, 18, 20, 30])), // outside the axis
    mutate((c) => (c.pair[1].answers[0] = 1.5)),
    mutate((c) => (c.pair[1].axis.step = 0)),
    mutate((c) => (c.pair[1].axis = { ...c.pair[1].axis, min: 0, max: 300, step: 1 })), // too many ticks
    mutate((c) => (c.pair[0].answers = [18, 18, 18, 18, 18, 18, 17])), // both would be statistical
    mutate((c) => (c.pair[1].text.es = "")),
    mutate((c) => (c.pair[1].text.en = "word ".repeat(30))), // will not wrap
    mutate((c) => (c.pair = [c.pair[0]])),
    mutate((c) => (c.more = [])),
    mutate((c) => delete c.crowd),
    mutate((c) => delete c.story),
    mutate((c) => (c.transfer.options[2].statistical = false)), // no statistical option
    mutate((c) => (c.transfer.options[0].statistical = true)), // two statistical options
    mutate((c) => delete c.transfer.options[0].cue), // a wrong choice without a cue
    mutate((c) => (c.transfer.options = c.transfer.options.slice(0, 2))),
    mutate((c) => {
      const a = Array(8).fill(3);
      for (const q of c.pair) q.answers = [...a];
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateQuestionSort(cfg), null, JSON.stringify(cfg)?.slice(0, 120));
    assert.equal(buildQuestionSortPlay(cfg), null);
  }
});

test("buildQuestionSortPlay: six scenes, gates where the student acts", () => {
  const play = buildQuestionSortPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["ask", true],
      ["name", false],
      ["sort", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /statistical|vary/i, "the title must not give away the idea");
  assert.match(play.printSummary.en, /6 different answers \(8, 12, 12, 15, 18, 20, 22\)/);
  assert.match(play.viewBox, /^0 0 480 \d+$/);
});

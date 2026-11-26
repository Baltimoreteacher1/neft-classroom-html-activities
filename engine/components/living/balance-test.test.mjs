// balance-test.test.mjs — every number the balance-test play (8-1) shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildBalanceTestPlay, validateBalanceTest as reexported } from "./balance-test.js";
import {
  guessChoices,
  testCopy,
  testPans,
  testScale,
  validateBalanceTest,
  valueChoices,
  writeChoices,
} from "./balance-test-model.js";
import { total, tiltFor } from "./balance-solve-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/8-1/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;

test("validateBalanceTest accepts the 8-1 config and derives the solutions itself", () => {
  const v = validateBalanceTest(CFG);
  assert.ok(v);
  assert.equal(v.eq.x, 20 - 8); // n + 8 = 20
  assert.equal(v.transfer.eq.x, 9 - 5); // n + 5 = 9
  assert.deepEqual(
    v.words.map((w) => w.en),
    ["a number of stolen gems", "plus 8 more", "equals 20 total"],
  );
});

test("validateBalanceTest refuses configs the scale cannot draw or that teach the wrong thing", () => {
  const t = CFG.transfer;
  const bad = [
    null,
    {},
    { ...CFG, mode: "inverse" },
    { ...CFG, form: "sub" }, // test mode is x + a = b
    { ...CFG, guess: 12 }, // the guess is the solution
    { ...CFG, guess: 21 }, // beyond the slider
    { ...CFG, guess: 1.5 },
    { ...CFG, words: CFG.words.slice(0, 2) },
    { ...CFG, story: undefined },
    { ...CFG, a: 1, b: 90 }, // the 1 would be a sliver
    { ...CFG, transfer: { ...t, a: 4, b: 8 } }, // solution = a: a guess of the added number is right
    { ...CFG, transfer: { ...t, a: 3, b: 6 } }, // solution = a
    { ...CFG, transfer: { ...t, b: 3 } }, // no positive solution
    { ...CFG, transfer: { ...t, story: undefined } },
  ];
  for (const c of bad) {
    assert.equal(validateBalanceTest(c), null, JSON.stringify(c)?.slice(0, 100));
    assert.equal(buildBalanceTestPlay(c), null);
  }
});

test("the scale balances for exactly one value of n, and tips toward the heavier side", () => {
  const v = validateBalanceTest(CFG);
  const { a, b } = v.eq;
  let balanced = 0;
  for (let n = 0; n <= b; n++) {
    const pans = testPans(v.eq, n);
    const left = n + a; // independent
    assert.equal(total(pans.L), left);
    assert.equal(total(pans.R), b);
    if (left === b) balanced++;
    const t = tiltFor(total(pans.L) - total(pans.R));
    assert.equal(Math.sign(t), Math.sign(left - b));
  }
  assert.equal(balanced, 1);
  assert.equal(testScale(v.eq) * (b + a), 176, "the heaviest the left pan gets still fits");
});

test("guessChoices: the guess n = 5 is judged by arithmetic; one option is right", () => {
  const v = validateBalanceTest(CFG);
  const opts = guessChoices(v.eq, v.guess);
  assert.equal(opts.length, 3);
  assert.equal(opts.filter((o) => o.correct).length, 1);
  const right = opts.find((o) => o.correct);
  assert.equal(right.id, 5 + 8 < 20 ? "right" : "left"); // 13 < 20: the RIGHT side is heavier
  assert.equal(right.id, "right");
  assert.match(opts.find((o) => o.id === "bal").cue.en, /5 \+ 8 = 13/);
  // Every guess a config could make yields exactly one correct option.
  for (let g = 0; g <= 20; g++) {
    if (g === 12) continue;
    const o = guessChoices(v.eq, g);
    assert.equal(o.filter((x) => x.correct).length, 1, `guess ${g}`);
    assert.equal(o.find((x) => x.correct).id, g + 8 > 20 ? "left" : "right");
  }
});

test("writeChoices and valueChoices: one right answer; each wrong one is really wrong", () => {
  const v = validateBalanceTest(CFG);
  const t = v.transfer.eq; // n + 5 = 9
  const w = writeChoices(t);
  assert.equal(w.length, 4);
  assert.equal(w.find((o) => o.correct).text, "n + 5 = 9");
  assert.deepEqual(
    w.map((o) => o.text).sort(),
    ["5n = 9", "n + 5 = 9", "n + 9 = 5", "n − 5 = 9"].sort(),
  );
  // Independent: none of the wrong equations is solved by 4.
  assert.notEqual(5 * 4, 9);
  assert.notEqual(4 + 9, 5);
  assert.notEqual(4 - 5, 9);
  const val = valueChoices(t);
  assert.equal(val.filter((o) => o.correct).length, 1);
  assert.equal(Number(val.find((o) => o.correct).text), 4);
  for (const o of val.filter((x) => !x.correct)) {
    assert.notEqual(Number(o.text) + 5, 9, `${o.text} is not a solution`);
    assert.ok(o.cue.en.includes(`${o.text} + 5 = ${Number(o.text) + 5}`));
    assert.ok(!o.cue.en.includes("n = 4"));
  }
  assert.ok(val.length >= 3);
});

test("copy: the substitution table has one true row and rows that really differ from 20", () => {
  const v = validateBalanceTest(CFG);
  const T = testCopy(v);
  assert.equal(T.rows.length, 5);
  assert.equal(T.rows.filter((r) => r.endsWith("✓")).length, 1);
  for (const r of T.rows) {
    const m = r.match(/^(\d+) \+ 8 = (\d+)(?: ≠ (\d+)| ✓)$/);
    assert.ok(m, r);
    assert.equal(Number(m[1]) + 8, Number(m[2]));
    if (m[3]) assert.notEqual(Number(m[2]), Number(m[3]));
    else assert.equal(Number(m[2]), 20);
  }
  assert.deepEqual(T.rows[2], "12 + 8 = 20 ✓");
  assert.match(T.predictOk.en, /5 \+ 8 = 13, and 13 < 20/);
  assert.match(T.testMiss(14).en, /14 \+ 8 = 22, and 22 > 20/);
  assert.match(T.testMiss(14).es, /14 \+ 8 = 22, y 22 > 20/);
  assert.match(T.printSummary.en, /12 \+ 8 = 20/);
});

test("copy: Spanish has no English left", () => {
  const english = /\b(the|which|and|your|both|choose|check|value|scale)\b/i;
  const T = testCopy(validateBalanceTest(CFG));
  for (const [k, p] of Object.entries(T)) {
    if (p && typeof p === "object" && typeof p.en === "string") {
      assert.doesNotMatch(p.es, english, `${k}: ${p.es}`);
      assert.notEqual(p.es, p.en, k);
    }
  }
  for (const o of [
    ...guessChoices(validateBalanceTest(CFG).eq, 5),
    ...writeChoices(validateBalanceTest(CFG).transfer.eq),
    ...valueChoices(validateBalanceTest(CFG).transfer.eq),
  ])
    if (o.cue) assert.doesNotMatch(o.cue.es, english, o.cue.es);
});

test("buildBalanceTestPlay: five scenes, gates where the student acts", () => {
  const play = buildBalanceTestPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["clue", false],
      ["predict", true],
      ["test", true],
      ["check", false],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /\d/);
});

test("balance-test.js re-exports the model's validator", () => {
  assert.equal(reexported, validateBalanceTest);
});

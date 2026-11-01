import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ladder = await import("../access-practice-lab/src/ladder.js");
const den = await import("../access-practice-lab/src/puzzles.js");
const read = (path) =>
  JSON.parse(
    readFileSync(new URL(`../access-practice-lab/content/${path}`, import.meta.url), "utf8"),
  );
const { passages } = read("ladder/passages.json");
const { puzzles } = read("puzzles/puzzles.json");

// ---- Reading Ladder
test("a round moves up on a perfect score, holds on one miss, and drops on two", () => {
  assert.equal(ladder.nextStep(3, 3, 3), 4);
  assert.equal(ladder.nextStep(3, 2, 3), 3);
  assert.equal(ladder.nextStep(3, 1, 3), 2);
  assert.equal(ladder.nextStep(3, 0, 3), 2);
});

test("the ladder never leaves steps 1 to 6", () => {
  assert.equal(ladder.nextStep(ladder.LADDER_STEPS, 3, 3), ladder.LADDER_STEPS);
  assert.equal(ladder.nextStep(1, 0, 3), 1);
});

test("a round with too few questions never changes the step", () => {
  assert.equal(ladder.nextStep(4, 2, 2), 4);
});

test("first rounds start lower for grades 3-5 than for 6-8", () => {
  assert.ok(ladder.startStep("3-5") < ladder.startStep("6-8"));
});

test("pickPassage serves the least-seen passage at the step and uses them all before repeating", () => {
  const atStep = passages.filter((p) => p.step === 3);
  const history = [];
  const served = [];
  for (let i = 0; i < atStep.length; i += 1) {
    const next = ladder.pickPassage(passages, 3, history, () => 0);
    served.push(next.id);
    history.push({ id: next.id, step: 3, correct: 2, total: 3, day: "d" });
  }
  assert.equal(new Set(served).size, atStep.length);
  assert.ok(ladder.pickPassage(passages, 3, history, () => 0));
});

test("finishRound scores the picks, moves the step, and keeps the best step", () => {
  const passage = passages.find((p) => p.step === 2);
  const state = ladder.normalizeLadder({ step: 2, best: 2 });
  const perfect = ladder.finishRound(
    state,
    passage,
    passage.questions.map((q) => q.answer),
    "2026-11-01",
  );
  assert.equal(perfect.step, 3);
  assert.equal(perfect.best, 3);
  assert.equal(perfect.history.at(-1).correct, 3);
  const wrong = passage.questions.map((q) => (q.answer + 1) % 3);
  const missed = ladder.finishRound(perfect, passage, wrong, "2026-11-02");
  assert.equal(missed.step, 1, "zero right on a step-2 passage drops one step from that passage");
  assert.equal(missed.best, 3, "best never drops");
});

test("normalizeLadder survives corrupt saved data", () => {
  for (const bad of [
    null,
    "x",
    7,
    [],
    { step: 99, best: -4, history: [null, { id: 1 }, { id: "a", step: 2, correct: 9, total: 3 }] },
  ]) {
    const state = ladder.normalizeLadder(bad, 4);
    assert.ok(state.step >= 1 && state.step <= ladder.LADDER_STEPS);
    assert.ok(Array.isArray(state.history));
  }
  const clamped = ladder.normalizeLadder({
    history: [{ id: "a", step: 2, correct: 9, total: 3, day: "d" }],
  });
  assert.equal(clamped.history[0].correct, 3);
});

test("the summary withholds a trend until three rounds are saved", () => {
  const rows = (n) =>
    Array.from({ length: n }, () => ({ id: "a", step: 2, correct: 2, total: 3, day: "d" }));
  assert.equal(ladder.ladderSummary({ step: 2, best: 2, history: rows(2) }).enough, false);
  assert.equal(ladder.ladderSummary({ step: 2, best: 2, history: rows(3) }).enough, true);
});

// ---- Puzzle Den
test("stars: three for a clean solve, fewer as hints and misses are used", () => {
  assert.equal(den.starsFor(0, 0), 3);
  assert.equal(den.starsFor(1, 0), 2);
  assert.equal(den.starsFor(1, 1), 2);
  assert.equal(den.starsFor(2, 1), 1);
});

test("sentence builder accepts every listed order and nothing else", () => {
  const puzzle = puzzles.find((p) => p.id === "order-walk-school");
  assert.ok(den.checkOrder(puzzle, ["I", "walk", "to", "school", "every", "day"]));
  assert.ok(den.checkOrder(puzzle, ["every", "day", "I", "walk", "to", "school"]));
  assert.ok(!den.checkOrder(puzzle, ["I", "walk", "every", "day", "to", "school"]));
  assert.ok(!den.checkOrder(puzzle, ["I", "walk"]));
  assert.equal(den.buildSentence(["every", "day", "I", "walk"], "."), "Every day I walk.");
  assert.equal(den.buildSentence([], "?"), "");
});

test("every clue grid has exactly one solution and the checker agrees with it", () => {
  for (const puzzle of puzzles.filter((p) => p.type === "grid")) {
    const solutions = den.gridSolutions(puzzle);
    assert.equal(solutions.length, 1, puzzle.id);
    assert.ok(den.checkGrid(puzzle, solutions[0]), puzzle.id);
    const swapped = {
      ...solutions[0],
      [puzzle.people[0]]: solutions[0][puzzle.people[1]],
      [puzzle.people[1]]: solutions[0][puzzle.people[0]],
    };
    assert.ok(!den.checkGrid(puzzle, swapped), `${puzzle.id} accepts a swapped answer`);
    assert.ok(
      !den.checkGrid(puzzle, { [puzzle.people[0]]: solutions[0][puzzle.people[0]] }),
      `${puzzle.id} accepts an incomplete answer`,
    );
  }
});

test("a grid pick that repeats an option is never complete", () => {
  const puzzle = puzzles.find((p) => p.id === "grid-pets");
  assert.equal(den.gridComplete(puzzle, { Ana: "fish", Ben: "fish", Cy: "cat" }), false);
});

test("brokenClues names the clues a wrong grid breaks without revealing the answer", () => {
  const puzzle = puzzles.find((p) => p.id === "grid-pets");
  assert.deepEqual(den.brokenClues(puzzle, { Ana: "dog", Ben: "cat", Cy: "fish" }), [0, 1]);
  assert.deepEqual(den.brokenClues(puzzle, { Ana: "fish", Ben: "dog", Cy: "cat" }), []);
});

test("odd-one-out checks the chosen index", () => {
  const puzzle = puzzles.find((p) => p.id === "odd-animals");
  assert.ok(den.checkOdd(puzzle, puzzle.answer));
  assert.ok(!den.checkOdd(puzzle, (puzzle.answer + 1) % 4));
});

test("a solve keeps the best stars, clears the open attempt, and survives corrupt state", () => {
  let state = den.normalizePuzzleState({ open: { a: { hints: 2, misses: 1, placed: [0, 1] } } });
  state = den.recordSolve(state, "a", { hints: 0, misses: 0 }, "d1");
  assert.equal(state.solved.a.stars, 3);
  assert.equal(state.open.a, undefined);
  state = den.recordSolve(state, "a", { hints: 3, misses: 2 }, "d2");
  assert.equal(state.solved.a.stars, 3, "a worse replay does not lower stars");
  for (const bad of [null, "x", 4, [], { solved: { a: { stars: 9 } }, open: { b: 7 } }]) {
    const clean = den.normalizePuzzleState(bad);
    assert.deepEqual(Object.keys(clean.solved), []);
  }
});

test("the summary counts only puzzles that exist", () => {
  const sub = puzzles.slice(0, 3);
  const state = {
    solved: { [sub[0].id]: { stars: 3 }, [sub[1].id]: { stars: 1 }, gone: { stars: 3 } },
    open: {},
  };
  assert.deepEqual(den.puzzleSummary(state, sub), { total: 3, solved: 2, stars: 4, threeStar: 1 });
});

test("forBand returns band puzzles plus shared ones", () => {
  const a = den.forBand(puzzles, "3-5");
  assert.ok(a.every((p) => p.band === "3-5" || p.band === "both"));
  assert.ok(a.some((p) => p.band === "both"));
});

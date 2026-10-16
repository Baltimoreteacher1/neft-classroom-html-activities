// Balance Builder turn rules: hints are earned, nothing prints a solution on a
// miss, wrong moves and wrong entries are told apart, saves replay exactly.
import assert from "node:assert/strict";
import test from "node:test";
import { applyMove, nextStep, sideText } from "./balance-model.js";
import { generate, LEVELS } from "./puzzles.js";
import {
  cancelMove,
  chooseMove,
  nextHint,
  proveIt,
  reset,
  restore,
  serialize,
  startSession,
  submitEntry,
  submitGraph,
  testValue,
  undo,
} from "./session.js";
import { t } from "./strings.js";

const MINUS = "−";

/** Types the correct simplified sides for the pending move (test-only helper). */
function correctTyping(s) {
  const out = applyMove(s.eq, s.pending.move).eq;
  return { left: sideText(out.l, s.v), right: sideText(out.r, s.v), rel: out.rel };
}

/** Plays the canonical path to the end; returns how many moves it took. */
function playOut(s) {
  let moves = 0;
  while (s.status === "playing") {
    const step = nextStep(s.eq);
    const amount = step.move.amount;
    const text = amount.a.n === 0 ? sideText({ a: amount.a, b: amount.b }, s.v) : sideText(amount, s.v);
    assert.equal(chooseMove(s, step.move.op, text).kind, "started");
    assert.equal(submitEntry(s, correctTyping(s)).kind, "correct");
    moves += 1;
  }
  return moves;
}

test("a student can solve every level by typing each result", () => {
  for (const { id } of LEVELS) {
    for (let i = 0; i < 25; i += 1) {
      const s = startSession(generate(id, i));
      const moves = playOut(s);
      assert.ok(moves >= 1 && moves <= 3);
      assert.equal(s.status, id === 4 ? "isolated" : "solved");
      if (id === 4) {
        const right = s.spec.rel === ">" || s.spec.rel === "≥";
        assert.equal(submitGraph(s, { open: s.spec.rel === ">" || s.spec.rel === "<", dir: right ? "right" : "left" }).kind, "correct");
        assert.equal(s.status, "solved");
      }
    }
  }
});

test("hints are locked until the student has tried, then go method first and a concrete move second", () => {
  const s = startSession(generate(1, 0));
  assert.deepEqual(nextHint(s), { locked: true });
  assert.equal(chooseMove(s, "+", "3").tag, "equation-not-inverse-operation");
  cancelMove(s);
  const first = nextHint(s);
  const second = nextHint(s);
  const third = nextHint(s);
  assert.equal(first.rung, 0);
  assert.match(first.key, /^hintMethod/);
  assert.equal(second.rung, 1);
  assert.equal(second.key, "hintStepMove");
  assert.equal(third.key, "hintStepMove", "the ladder stops at the concrete step");
});

test("a wrong written entry unlocks hints and prints neither the answer nor the expected sides", () => {
  for (const { id } of LEVELS) {
    for (let i = 0; i < 40; i += 1) {
      const s = startSession(generate(id, i));
      const step = nextStep(s.eq);
      const a = step.move.amount;
      chooseMove(s, step.move.op, sideText({ a: a.a, b: a.b }, s.v));
      const good = correctTyping(s);
      const bad = { ...good, right: `${good.right}+1` };
      const miss = submitEntry(s, bad);
      if (miss.kind === "format") continue;
      assert.equal(miss.kind, "wrong");
      assert.equal(s.earned, true);
      const said = JSON.stringify(miss);
      assert.ok(!said.includes(good.right) || good.right.length < 2, `outcome repeats ${good.right}`);
      assert.deepEqual(s.pending && s.steps.length, 0, "a miss changes nothing on the board");
    }
  }
});

test("no hint at any rung, at any point of any puzzle, mentions a number that is not on the screen", () => {
  const numbers = (text) => (String(text).match(/\d+(?:\/\d+)?/g) ?? []).map(String);
  for (const { id } of LEVELS) {
    for (let i = 0; i < 60; i += 1) {
      const s = startSession(generate(id, i));
      s.earned = true;
      while (s.status === "playing") {
        const onScreen = new Set(numbers(`${sideText(s.eq.l, s.v)} ${sideText(s.eq.r, s.v)}`));
        for (let rung = 0; rung < 3; rung += 1) {
          const hint = nextHint(s);
          for (const lang of ["en", "es"]) {
            for (const n of numbers(t(lang, hint.key, hint.vars))) {
              assert.ok(onScreen.has(n), `level ${id} #${i} hint ${hint.key} mentions ${n}`);
            }
          }
        }
        s.rungs = 0;
        const step = nextStep(s.eq);
        const a = step.move.amount;
        chooseMove(s, step.move.op, sideText({ a: a.a, b: a.b }, s.v));
        submitEntry(s, correctTyping(s));
      }
    }
  }
});

test("entry hints talk about the work on screen and nothing else", () => {
  const s = startSession(generate(1, 0));
  const step = nextStep(s.eq);
  chooseMove(s, step.move.op, sideText({ a: step.move.amount.a, b: step.move.amount.b }, s.v));
  s.earned = true;
  s.wrongSide = "right";
  const m = nextHint(s);
  const w = nextHint(s);
  assert.equal(m.key, "hintEntryMethod");
  assert.equal(w.key, "hintEntryStep");
  assert.match(w.vars.work, new RegExp(`${MINUS}|\\+`));
  assert.equal(w.vars.side, "right");
});

test("repeating the operation is flagged as a move, not as a typing mistake", () => {
  const s = startSession(generate(1, 0));
  const out = chooseMove(s, "+", "9");
  assert.equal(out.kind, "started");
  assert.equal(out.classify, "sameOp");
  assert.equal(out.tag, "equation-not-inverse-operation");
  assert.equal(s.earned, true);
  const fine = startSession(generate(1, 0));
  assert.equal(chooseMove(fine, MINUS, "9").tag, undefined);
});

test("moves the model refuses give a reason and change nothing", () => {
  const s = startSession(generate(1, 0));
  assert.equal(chooseMove(s, "+", "").code, "amount");
  assert.equal(chooseMove(s, "+", "0").code, "zero");
  assert.equal(chooseMove(s, "×", "2n").code, "variableScale");
  assert.equal(chooseMove(s, "÷", "-2").code, "amount");
  assert.equal(s.pending, null);
  assert.equal(submitEntry(s, { left: "x", right: "1" }).code, "noMove");
});

test("unreadable or unfinished sides are format notes, not misses", () => {
  const s = startSession(generate(2, 0));
  const step = nextStep(s.eq);
  chooseMove(s, step.move.op, sideText({ a: step.move.amount.a, b: step.move.amount.b }, s.v));
  const out = submitEntry(s, { left: "???", right: "4" });
  assert.equal(out.kind, "format");
  assert.equal(s.earned, false);
});

test("undo steps back, start over clears the board, neither costs anything", () => {
  const s = startSession(generate(2, 1));
  const start = s.eq;
  const step = nextStep(s.eq);
  chooseMove(s, step.move.op, sideText({ a: step.move.amount.a, b: step.move.amount.b }, s.v));
  submitEntry(s, correctTyping(s));
  assert.equal(s.steps.length, 1);
  assert.equal(undo(s), true);
  assert.equal(s.eq, start);
  assert.equal(undo(s), false);
  chooseMove(s, step.move.op, sideText({ a: step.move.amount.a, b: step.move.amount.b }, s.v));
  assert.equal(undo(s), true, "undo cancels a move that is still being written");
  assert.equal(s.pending, null);
  chooseMove(s, step.move.op, sideText({ a: step.move.amount.a, b: step.move.amount.b }, s.v));
  submitEntry(s, correctTyping(s));
  reset(s);
  assert.equal(s.steps.length, 0);
  assert.equal(s.eq, start);
});

test("a save replays to exactly the same board", () => {
  for (const { id } of LEVELS) {
    const spec = generate(id, 3);
    const s = startSession(spec);
    const step = nextStep(s.eq);
    chooseMove(s, step.move.op, sideText({ a: step.move.amount.a, b: step.move.amount.b }, s.v));
    submitEntry(s, correctTyping(s));
    const saved = JSON.parse(JSON.stringify(serialize(s)));
    const back = restore(spec, saved);
    assert.deepEqual(back.eq, s.eq);
    assert.deepEqual(back.steps.map((x) => x.text), s.steps.map((x) => x.text));
    assert.equal(back.status, s.status);
  }
  assert.equal(restore(generate(1, 0), { moves: [["+", "banana"]] }).steps.length, 0);
  assert.equal(restore(generate(1, 0), null).steps.length, 0);
  assert.equal(restore(generate(1, 0), { moves: "no" }).steps.length, 0);
});

test("graphing names the slip: wrong side, or wrong kind of circle", () => {
  const find = (rel) => {
    for (let i = 0; i < 40; i += 1) {
      const spec = generate(4, i);
      if (spec.rel === rel) return startSession(spec);
    }
    throw new Error(rel);
  };
  const strict = find(">");
  assert.equal(submitGraph(strict, { open: true, dir: "left" }).tag, "inequality-graph-direction");
  assert.equal(submitGraph(strict, { open: false, dir: "right" }).tag, "inequality-boundary-inclusion");
  assert.equal(submitGraph(strict, { open: false, dir: "left" }).coach, "coach.graphBoth");
  assert.equal(submitGraph(strict, { open: true, dir: "right" }).kind, "correct");
  const closed = find("≤");
  assert.equal(submitGraph(closed, { open: false, dir: "left" }).kind, "correct");
  assert.equal(submitGraph(find("<"), { open: true, dir: "left" }).kind, "correct");
  assert.equal(submitGraph(find("≥"), { open: false, dir: "right" }).kind, "correct");
});

test("prove-it checks the student's own substitution against the first equation", () => {
  const s = startSession(generate(1, 0));
  playOut(s);
  const spec = s.start;
  const x = s.answer;
  const left = spec.l.a.n === 0 ? spec.l.b.n : (spec.l.a.n / spec.l.a.d) * x.n + spec.l.b.n / spec.l.b.d;
  const right = spec.r.a.n === 0 ? spec.r.b.n : (spec.r.a.n / spec.r.a.d) * x.n + spec.r.b.n / spec.r.b.d;
  assert.equal(proveIt(s, String(left), String(right)).kind, "correct");
  assert.equal(proveIt(s, String(left + 1), String(right)).kind, "wrong");
  assert.equal(proveIt(s, "x", "3").kind, "format");
});

test("trying a number makes the scale lean the way the inequality says", () => {
  const spec = { rel: ">", v: 0, q: 1, l: { a: 1, b: 3 }, r: { a: 0, b: 10 } };
  const s = startSession(spec);
  assert.deepEqual(testValue(s, "12"), { kind: "tested", n: "12", tilt: 1, truth: true });
  assert.deepEqual(testValue(s, "7"), { kind: "tested", n: "7", tilt: 0, truth: false });
  assert.deepEqual(testValue(s, "2"), { kind: "tested", n: "2", tilt: -1, truth: false });
  assert.equal(testValue(s, "banana").kind, "error");
});

test("starting a session with a puzzle the validator rejects throws", () => {
  assert.throws(() => startSession({ rel: "=", v: 0, q: 1, l: { a: 2, b: 0 }, r: { a: 2, b: 5 } }));
});

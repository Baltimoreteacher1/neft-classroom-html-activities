// Balance Builder: move legality, typed-entry checking and misconception tags.
// The engine's own equation solver (engine/core/step-diagnosis-engine) is the
// independent oracle: every move the model applies must keep the same solution.
import assert from "node:assert/strict";
import test from "node:test";
import { eqEquivalent, parseLine } from "@eduwonderlab/engine/core/step-diagnosis-engine.js";
import {
  applyMove,
  checkEntry,
  classifyMove,
  eqText,
  equation,
  isolated,
  nextStep,
  parseMove,
  parseSide,
  RELATIONS,
  side,
  sideText,
  solutionLength,
  spoken,
  tilt,
  unsimplified,
} from "./balance-model.js";
import { generate, toEquation, VARIABLES } from "./puzzles.js";
import * as R from "./rational.js";

const MINUS = "−";
const move = (op, text, v = "x") => {
  const m = parseMove(op, text, v);
  assert.ok(m.ok, `${op} ${text} should parse`);
  return m.move;
};
const eq = (la, lb, ra, rb, rel = "=") => equation(side(la, lb), side(ra, rb), rel);

test("sideText writes sides the way a student reads them", () => {
  assert.equal(sideText(side(2, 3), "x"), "2x + 3");
  assert.equal(sideText(side(1, -4), "x"), `x ${MINUS} 4`);
  assert.equal(sideText(side(-1, 10), "x"), `${MINUS}x + 10`);
  assert.equal(sideText(side(0, 0), "x"), "0");
  assert.equal(sideText(side(R.rat(1, 4), 0), "n"), "n/4");
  assert.equal(sideText(side(R.rat(3, 2), R.rat(1, 2)), "x"), "3x/2 + 1/2");
  assert.equal(eqText(eq(1, 0, 0, 7, ">"), "t"), "t > 7");
});

test("parseSide reads simplified and unsimplified sides, and refuses everything else", () => {
  const ok = (text, a, b, xTerms, numTerms) => {
    const p = parseSide(text, "x");
    assert.ok(p.ok, text);
    assert.ok(R.eq(p.side.a, R.rat(...a)), `${text} x-part`);
    assert.ok(R.eq(p.side.b, R.rat(...b)), `${text} number-part`);
    assert.deepEqual([p.xTerms, p.numTerms], [xTerms, numTerms], text);
  };
  ok("2x", [2], [0], 1, 0);
  ok("3 + 2x", [2], [3], 1, 1);
  ok("x", [1], [0], 1, 0);
  ok(`${MINUS}x + 10`, [-1], [10], 1, 1);
  ok("x/3 − 1/2", [1, 3], [-1, 2], 1, 1);
  ok("2x/3", [2, 3], [0], 1, 0);
  ok("0.5x + 1.25", [1, 2], [5, 4], 1, 1);
  ok("2x + 3 − 3", [2], [0], 1, 2);
  ok("X + 4", [1], [4], 1, 1);
  for (const bad of ["", "y + 2", "2(x+1)", "x*x", "3+", "--3", "2x^2", "1/0", "abc", "x/0", "2 x 3"]) {
    assert.equal(parseSide(bad, "x").ok, false, `"${bad}" should be refused`);
  }
});

test("parseMove allows only positive amounts and no variable multiplier", () => {
  assert.ok(parseMove("+", "5", "x").ok);
  assert.ok(parseMove(MINUS, "2x", "x").ok);
  assert.ok(parseMove("×", "3", "x").ok);
  assert.ok(parseMove("÷", "1/2", "x").ok);
  assert.equal(parseMove("÷", "0", "x").reason, "zero");
  assert.equal(parseMove("×", "2x", "x").reason, "variableScale");
  assert.equal(parseMove("+", "-3", "x").reason, "amount");
  assert.equal(parseMove("+", "3 + 4", "x").reason, "amount");
  assert.equal(parseMove("+", "", "x").reason, "amount");
  assert.equal(parseMove("^", "2", "x").reason, "op");
});

test("a move is always applied to BOTH sides and never changes the relation", () => {
  const start = eq(2, 3, 0, 11);
  const next = applyMove(start, move(MINUS, "3")).eq;
  assert.equal(eqText(next, "x"), "2x = 8");
  const two = applyMove(next, move("÷", "2")).eq;
  assert.equal(eqText(two, "x"), "x = 4");
  assert.deepEqual(isolated(two), { sideName: "left", value: R.rat(4) });
  for (const rel of RELATIONS) {
    const out = applyMove(eq(3, 1, 0, 30, rel), move("÷", "3")).eq;
    assert.equal(out.rel, rel, `${rel} survives a division by a positive number`);
  }
});

test("every applied move keeps the engine's solution set (independent oracle)", () => {
  let checked = 0;
  for (let level = 1; level <= 3; level += 1) {
    for (let i = 0; i < 40; i += 1) {
      const spec = generate(level, i);
      const v = VARIABLES[spec.v];
      let cur = toEquation(spec);
      const moves = [
        move("+", "7", v),
        move("×", "2", v),
        move(MINUS, v, v),
        move("+", `3${v}`, v),
        move("÷", "3", v),
        move(MINUS, "5", v),
      ];
      for (const m of moves) {
        const out = applyMove(cur, m);
        if (!out.ok) continue;
        assert.ok(
          eqEquivalent(parseLine(eqText(cur, v)), parseLine(eqText(out.eq, v))),
          `${eqText(cur, v)} -> ${eqText(out.eq, v)} via ${m.op}`,
        );
        cur = out.eq;
        checked += 1;
      }
    }
  }
  assert.ok(checked > 300, `only ${checked} moves checked`);
});

test("numbers that grow past the scale are refused, not computed", () => {
  let cur = eq(9, 90, 0, 99);
  let refused = false;
  for (let i = 0; i < 6 && !refused; i += 1) {
    const out = applyMove(cur, move("×", "99"));
    if (out.ok) cur = out.eq;
    else refused = out.reason === "tooBig";
  }
  assert.ok(refused);
});

test("the written-out move shows the work without doing it", () => {
  const start = eq(2, 3, 0, 11);
  const m = move(MINUS, "3");
  assert.equal(unsimplified(start.l, m, "x"), `2x + 3 ${MINUS} 3`);
  assert.equal(unsimplified(start.r, m, "x"), `11 ${MINUS} 3`);
  assert.equal(unsimplified(start.l, move("÷", "2"), "x"), "(2x + 3) ÷ 2");
  assert.equal(unsimplified(side(2, 0), move("÷", "2"), "x"), "2x ÷ 2");
});

test("tilt follows the weights: a level beam for an equation, a lean for an inequality", () => {
  const e = eq(2, 3, 0, 11);
  assert.equal(tilt(e, R.rat(4)), 0);
  assert.equal(tilt(e, R.rat(9)), 1);
  assert.equal(tilt(e, R.rat(1)), -1);
});

test("the canonical path solves every generated puzzle within four moves", () => {
  for (let level = 1; level <= 4; level += 1) {
    for (let i = 0; i < 60; i += 1) {
      let cur = toEquation(generate(level, i));
      let steps = 0;
      for (; steps < 5; steps += 1) {
        const step = nextStep(cur);
        if (step.kind === "done") break;
        cur = applyMove(cur, step.move).eq;
      }
      assert.ok(isolated(cur), `level ${level} #${i}`);
      assert.ok(steps <= 4);
      assert.equal(steps, solutionLength(toEquation(generate(level, i))));
    }
  }
});

test("classifyMove names the two ways of failing to undo an operation", () => {
  const plus = eq(1, 3, 0, 10);
  assert.equal(classifyMove(plus, move("+", "3")), "sameOp");
  assert.equal(classifyMove(plus, move(MINUS, "3")), "ok");
  assert.equal(classifyMove(plus, move("×", "4")), "wrongFamily");
  assert.equal(classifyMove(plus, move("÷", "1")), "ok");
  const times = eq(4, 0, 0, 20);
  assert.equal(classifyMove(times, move("×", "4")), "sameOp");
  assert.equal(classifyMove(times, move(MINUS, "4")), "wrongFamily");
  assert.equal(classifyMove(times, move("÷", "4")), "ok");
  const minus = eq(1, -5, 0, 9);
  assert.equal(classifyMove(minus, move(MINUS, "5")), "sameOp");
  assert.equal(classifyMove(minus, move("+", "5")), "ok");
  const divided = eq(R.rat(1, 4), 0, 0, 6);
  assert.equal(classifyMove(divided, move("÷", "4")), "sameOp");
  assert.equal(classifyMove(divided, move("×", "4")), "ok");
  const both = eq(3, 2, 1, 10);
  assert.equal(classifyMove(both, move(MINUS, "x")), "ok");
  assert.equal(classifyMove(both, move("+", "x")), "sameOp");
});

// ── typed results ──────────────────────────────────────────────────────────
const pre = eq(2, 3, 0, 11);
const minus3 = move(MINUS, "3");

test("a correct entry is accepted in any equivalent written order", () => {
  assert.equal(checkEntry(pre, minus3, { left: "2x", right: "8" }, "x").ok, true);
  assert.equal(checkEntry(pre, minus3, { left: " 2 x ", right: " 8 " }, "x").ok, true);
  assert.equal(checkEntry(eq(2, 3, 0, 11), move(MINUS, "3"), { left: "2x + 0", right: "8" }, "x").ok, true);
});

test("an unfinished side asks to combine; an unreadable one asks to rewrite", () => {
  assert.deepEqual(checkEntry(pre, minus3, { left: "2x + 3 − 3", right: "8" }, "x"), {
    ok: false,
    reason: "combine",
    side: "left",
  });
  assert.deepEqual(checkEntry(pre, minus3, { left: "2x", right: "cat" }, "x"), {
    ok: false,
    reason: "unreadable",
    side: "right",
  });
});

test("a wrong entry says which side is off and never contains the right values", () => {
  const out = checkEntry(pre, minus3, { left: "2x", right: "9" }, "x", R.rat(4));
  assert.equal(out.ok, false);
  assert.deepEqual(out.sides, { left: "ok", right: "wrong" });
  assert.equal(out.tilt, -1, "right pan is heavier, so the beam leans right");
  assert.equal(out.tag, null);
  assert.equal(out.coach, "arith");
  const serialized = JSON.stringify(out);
  assert.ok(!serialized.includes('"n":8'), "the correct 8 must not appear in the result");
});

test("a side left as it was means the move was not done to both sides", () => {
  const out = checkEntry(pre, minus3, { left: "2x", right: "11" }, "x");
  assert.equal(out.sides.right, "unchanged");
  assert.equal(out.coach, "bothSides");
  assert.equal(out.tag, null);
});

test("dividing only the x-term is tagged algebra-distributive-partial", () => {
  const six = eq(2, 6, 0, 14);
  const half = move("÷", "2");
  const out = checkEntry(six, half, { left: "x + 6", right: "7" }, "x");
  assert.equal(out.tag, "algebra-distributive-partial");
  assert.equal(out.coach, "partial");
  assert.equal(checkEntry(six, half, { left: "x + 3", right: "7" }, "x").ok, true);
  assert.equal(checkEntry(six, half, { left: "x + 6", right: "8" }, "x").tag, null);
});

test("losing a minus sign is tagged sign-dropped", () => {
  const both = eq(3, 2, 1, 10);
  const take3x = move(MINUS, "3x");
  const out = checkEntry(both, take3x, { left: "2", right: "2x + 10" }, "x");
  assert.equal(out.tag, "sign-dropped");
  assert.equal(checkEntry(both, take3x, { left: "2", right: `${MINUS}2x + 10` }, "x").ok, true);
});

test("answering with a number already in the problem is tagged equation-answered-with-given-number", () => {
  const e = eq(1, 8, 0, 20);
  const out = checkEntry(e, move(MINUS, "8"), { left: "x", right: "8" }, "x");
  assert.equal(out.tag, "equation-answered-with-given-number");
  assert.equal(checkEntry(e, move(MINUS, "8"), { left: "x", right: "13" }, "x").tag, null);
  assert.equal(checkEntry(e, move(MINUS, "8"), { left: "x", right: "12" }, "x").ok, true);
});

test("inequality symbols: reversed and strict/inclusive slips are tagged", () => {
  const ineq = eq(1, 3, 0, 10, ">");
  const m = move(MINUS, "3");
  assert.equal(checkEntry(ineq, m, { left: "x", right: "7", rel: ">" }, "x").ok, true);
  assert.equal(checkEntry(ineq, m, { left: "x", right: "7", rel: "<" }, "x").tag, "inequality-direction-flipped");
  assert.equal(checkEntry(ineq, m, { left: "x", right: "7", rel: "≥" }, "x").tag, "inequality-boundary-inclusion");
  assert.equal(checkEntry(ineq, m, { left: "x", right: "7" }, "x").reason, "needRel");
});

test("every tag the game can emit exists in the shared misconception taxonomy", async () => {
  const labels = (await import("../data/misconception-labels.json", { with: { type: "json" } })).default.tags;
  const { MISCONCEPTIONS } = await import("@eduwonderlab/engine/core/misconceptions.js");
  for (const tag of [
    "equation-not-inverse-operation",
    "equation-answered-with-given-number",
    "algebra-distributive-partial",
    "sign-dropped",
    "inequality-direction-flipped",
    "inequality-boundary-inclusion",
    "inequality-graph-direction",
  ]) {
    assert.ok(labels[tag], `${tag} missing from data/misconception-labels.json`);
    assert.ok(MISCONCEPTIONS[tag], `${tag} missing from engine/core/misconceptions.js`);
  }
});

test("spoken() reads symbols aloud for a screen reader", () => {
  assert.equal(spoken(`2x + 3 = 11`), "2x plus 3 equals 11");
  assert.equal(spoken(`x ${MINUS} 4 ≥ 9`), "x minus 4 is greater than or equal to 9");
});

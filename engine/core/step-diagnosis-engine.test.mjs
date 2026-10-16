#!/usr/bin/env node
/* =============================================================================
 * step-diagnosis-engine.test.mjs
 * -----------------------------------------------------------------------------
 * The Step Lab's math engine moved out of the component so the diagnosis reads
 * lines exactly as the solver does. These pin the behaviour both depend on:
 * what parses, what counts as equivalent, how parentheses survive into the tree,
 * and that a tree flattens back to the same value.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";

import {
  astToRpn,
  evalRPN,
  exprEquivalent,
  isEquivalent,
  looksSolved,
  normalizeSides,
  parseLine,
  rpnToAst,
} from "./step-diagnosis-engine.js";

const side = (text, i = 0) => parseLine(text).sides[i];
const value = (text, x = 0) => evalRPN(side(text), x);

test("the reader understands the notation students type", () => {
  assert.equal(value("2 1/2"), 2.5); // mixed number
  assert.equal(value("3/4 ÷ 1/8"), 6); // fraction slash binds tighter than ÷
  assert.equal(value("4 × 5 + 3²"), 29);
  assert.equal(value("2(x + 3)", 4), 14); // implicit multiplication
  assert.equal(value("-x^2", 3), -9); // unary minus below ^
  assert.equal(value("6 ÷ 2(1 + 2)"), 9);
});

test("unreadable input throws a coded reason the component can translate", () => {
  const code = (text) => {
    try {
      parseLine(text);
    } catch (e) {
      return e.message;
    }
    return null;
  };
  assert.equal(code("3 $ 4"), "symbol");
  assert.equal(code("1.2.3"), "number");
  assert.equal(code("2 3"), "mixed");
  assert.equal(code("(1 + 2"), "paren");
  assert.equal(code("1 = 2 = 3"), "equals");
  assert.equal(code("x + y"), "vars");
  assert.equal(code(""), "empty");
  assert.equal(code("1/0 + 2 1/0"), "divzero");
});

test("expressions are equivalent by value, equations by solution", () => {
  assert.ok(exprEquivalent(side("3(x + 4)"), side("3x + 12")));
  assert.ok(!exprEquivalent(side("3(x + 4)"), side("3x + 4")));
  assert.ok(isEquivalent(parseLine("3x + 6 = 18"), parseLine("3x = 12"), "equation"));
  assert.ok(isEquivalent(parseLine("3x + 6 = 18"), parseLine("2x = 8"), "equation"));
  assert.ok(!isEquivalent(parseLine("3x + 6 = 18"), parseLine("3x = 24"), "equation"));
  assert.ok(isEquivalent(parseLine("2 + 3 × 4"), parseLine("14"), "expression"));
});

test("an expression line with '=' is read by its right-hand side; an equation needs both", () => {
  const withEquals = parseLine("2 + 3 × 4 = 14");
  assert.equal(withEquals.sides.length, 2);
  assert.ok(normalizeSides(withEquals, "expression"));
  assert.equal(withEquals.sides.length, 1);
  assert.ok(!normalizeSides(parseLine("x + 7"), "equation"));
  assert.ok(normalizeSides(parseLine("x + 7 = 15"), "equation"));
});

test("parentheses survive into the tree, so grouping can be told from precedence", () => {
  const grouped = rpnToAst(side("2 + (3 × 4)"));
  assert.equal(grouped.op, "+");
  assert.equal(grouped.b.p, true);
  const bare = rpnToAst(side("2 + 3 × 4"));
  assert.equal(bare.b.p, undefined);
  const neg = rpnToAst(side("-(x + 3)"));
  assert.equal(neg.k, "neg");
  assert.equal(neg.a.p, true);
});

test("a tree flattens back to a line with the same value everywhere", () => {
  for (const text of [
    "4 × 5 + 3²",
    "2(9 - 4) + 6",
    "-(x + 3)",
    "3x - 5",
    "1/3 + 1/4",
    "18.4 - 5.75 + 2.1",
    "(x + 4)(x - 1)",
    "n/5",
  ]) {
    const rpn = side(text);
    const ast = rpnToAst(rpn);
    assert.ok(ast, `no tree for ${text}`);
    for (const x of [-2.5, 0.6, 3, 7]) {
      const a = evalRPN(rpn, x);
      const b = evalRPN(astToRpn(ast), x);
      assert.ok(Object.is(a, b) || Math.abs(a - b) < 1e-9, `${text} at ${x}: ${a} vs ${b}`);
    }
  }
});

test("a malformed token stream has no tree", () => {
  assert.equal(rpnToAst([{ t: "op", v: "+" }]), null);
  assert.equal(rpnToAst([{ t: "num", v: 1 }, { t: "num", v: 2 }]), null);
});

test("looksSolved: a bare variable = number, a lone number, or the authored compactness", () => {
  assert.ok(looksSolved(parseLine("x = 4"), "equation", 0));
  assert.ok(looksSolved(parseLine("-4 = x"), "equation", 0));
  assert.ok(!looksSolved(parseLine("3x = 12"), "equation", 0));
  assert.ok(looksSolved(parseLine("29"), "expression", 0));
  assert.ok(looksSolved(parseLine("3/4"), "expression", 0));
  assert.ok(!looksSolved(parseLine("20 + 9"), "expression", 0));
  assert.ok(looksSolved(parseLine("3x + 12"), "expression", 8));
});

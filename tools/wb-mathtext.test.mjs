import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("curriculum/math-workbench/wb-mathtext.js", "utf8"), ctx);
const T = ctx.WBMathText;
const live = (s) => T.convert(s);
const done = (s) => T.convert(s, { final: true });

// symbols as you type
assert.equal(live("x <= 5"), "x ≤ 5");
assert.equal(live("x >= 5"), "x ≥ 5");
assert.equal(live("a != b"), "a ≠ b");
assert.equal(live("5 +- 2"), "5 ± 2");

// exponents wait for the end of the number, so 2^10 is never cut at 2^1
assert.equal(live("2^1"), "2^1", "still typing the exponent");
assert.equal(live("2^10 "), "2¹⁰ ");
assert.equal(done("x^2"), "x²");
assert.equal(done("10^-1"), "10⁻¹");

// roots, pi, degrees
assert.equal(live("sqrt(9)"), "√(9)");
assert.equal(live("sqrt 16 "), "√16 ");
assert.equal(done("area = pi"), "area = π");
assert.equal(live("pie"), "pie", "pi inside a word is left alone");
assert.equal(live("90 deg "), "90° ");

// fractions: common ones become vulgar fractions, others stack
assert.equal(T.fraction("3", "4"), "¾");
assert.equal(T.fraction("7", "12"), "⁷⁄₁₂");
assert.equal(T.fractionize("add 1/2 and 7/12"), "add ½ and ⁷⁄₁₂");

// pasted LaTeX-lite
const tex = (s) => T.convert(s, { final: true, latex: true });
assert.equal(tex("\\frac{3}{4}"), "¾");
assert.equal(tex("\\frac{x+1}{2}"), "(x+1)⁄(2)");
assert.equal(tex("$x^{2} + 3 \\times 4$"), "x² + 3 × 4");
assert.equal(tex("\\sqrt{25} \\le 5 \\ge 4 \\neq 3 \\pm 1"), "√(25) ≤ 5 ≥ 4 ≠ 3 ± 1");
assert.equal(tex("90\\degree \\theta"), "90° θ");

// caret stays where the student is typing
const r = T.liveEdit("x <= 5", 4);
assert.equal(r.text, "x ≤ 5");
assert.equal(r.caret, 3, "caret moves back by the one character that was replaced");
const r2 = T.liveEdit("a<=b", 4);
assert.equal(r2.text, "a≤b");

// plain text is never changed
for (const plain of ["The ratio 3/4 means 3 for every 4", "Hello, world", "3 x 4 = 12"])
  assert.equal(done(plain), plain);

console.log("wb-mathtext: all assertions passed");

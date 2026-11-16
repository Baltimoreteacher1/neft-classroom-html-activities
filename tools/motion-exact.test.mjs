// shared/motion/exact.mjs: exact arithmetic and answer equivalence. Expected values are written out here by hand
// (or computed by a different route, scripts/lib/rational.mjs), never by the code under test.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Rat as OtherRat, parseAnswerValue as parseRational } from "../scripts/lib/rational.mjs";
import { commas, equivalent, int, parse, power, Rat } from "../shared/motion/exact.mjs";

test("Rat normalizes and does exact arithmetic where floats fail", () => {
  assert.equal(new Rat(2n, -4n).toString(), "-1/2");
  assert.equal(parse("0.1").add(parse("0.2")).toString(), "3/10");
  assert.ok(parse("0.1").add(parse("0.2")).eq(parse("0.3")));
  assert.equal(parse("1/3").mul(int(3)).toString(), "1");
  assert.throws(() => int(1).div(int(0)), RangeError);
});

test("power is exact past 2^53 and rejects bad input", () => {
  assert.equal(power(3, 4), 81n);
  assert.equal(power(12, 8), 429981696n);
  assert.equal(power(1, 8), 1n);
  assert.equal(power(2, 64), 18446744073709551616n);
  assert.throws(() => power(2, -1), RangeError);
  assert.throws(() => power(2.5, 2), RangeError);
  assert.throws(() => power(2, 65), RangeError);
});

test("commas groups digits without Intl", () => {
  assert.equal(commas(429981696n), "429,981,696");
  assert.equal(commas(999), "999");
  assert.equal(commas(1000), "1,000");
  assert.equal(commas(-1234567), "-1,234,567");
});

test("equivalent compares values, not strings", () => {
  for (const a of [
    "81",
    "3^4",
    "3⁴",
    "3 × 3 × 3 × 3",
    "3*3*3*3",
    "9 × 9",
    "81.0",
    "(1+8) × 9",
    "162/2",
  ])
    assert.ok(equivalent(a, "81"), a);
  for (const a of ["12", "3×4", "80", "27", "81/2", "3^3"]) assert.ok(!equivalent(a, "81"), a);
  assert.ok(equivalent("2 1/2", "5/2"));
  assert.ok(equivalent("75%", "3/4"));
  assert.ok(equivalent("0.75", "3/4"));
  assert.ok(equivalent("1,000", "1000"));
});

test("precedence: power before multiply before add; no left-to-right trap", () => {
  assert.equal(parse("2 + 3 × 2^3").toString(), "26");
  // The trap from the prototype: inline "3 ÷ 1/4" reads left to right as (3 ÷ 1) ÷ 4 = 3/4, not 3 ÷ (1/4) = 12.
  // This is why fractions are rendered stacked and worded unambiguously; the parser must not guess otherwise.
  assert.equal(parse("3 ÷ 1/4")?.toString(), "3/4");
  assert.equal(parse("3 ÷ (1/4)")?.toString(), "12");
});

test("garbage is null, never a thrown error or a guess", () => {
  for (const bad of [
    "",
    "   ",
    "abc",
    "3 +",
    "(3",
    "3^",
    "3^-1",
    "1/0",
    "2..3",
    "3 4",
    "eval(1)",
    "1;2",
    "9".repeat(200),
    null,
    undefined,
    4,
  ]) {
    assert.equal(parse(/** @type {any} */ (bad)), null, String(bad));
  }
});

test("agrees with the repo's other exact parser on shared forms", () => {
  for (const t of ["3/4", "2 1/2", "0.75", "12", "50%"]) {
    const a = parse(t);
    const b = parseRational(t);
    assert.ok(a && b, t);
    assert.ok(new OtherRat(a.n, a.d).eq(b), t);
  }
});

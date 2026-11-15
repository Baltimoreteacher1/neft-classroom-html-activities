// shared/motion/exponent-copies.mjs: the corrected exponent model. Expected values are hand-written or computed with
// plain BigInt loops here, independent of the code under test.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkValue,
  clampInput,
  copyOf,
  describe,
  exponentModel,
  LIMITS,
} from "../shared/motion/exponent-copies.mjs";

const loopPower = (b, e) => {
  let v = 1n;
  for (let i = 0; i < e; i++) v *= BigInt(b);
  return v;
};

test("3^4 = 81 built in four steps of three copies", () => {
  const m = exponentModel(3, 4);
  assert.equal(m.value, 81n);
  assert.equal(m.notation, "3⁴");
  assert.equal(m.expanded, "3 × 3 × 3 × 3");
  assert.deepEqual(
    m.steps.map((s) => s.equation),
    ["3", "3 × 3 = 9", "3 × 3 × 3 = 27", "3 × 3 × 3 × 3 = 81"],
  );
  assert.deepEqual(
    m.steps.map((s) => s.copies.en),
    ["1 row of 3", "3 copies of 3", "3 copies of 9", "3 copies of 27"],
  );
  assert.deepEqual(
    m.steps.map((s) => s.arrow),
    [null, "×3", "×3", "×3"],
  );
  assert.deepEqual(
    m.steps.map((s) => s.layout),
    ["row", "stack", "side", "stack"],
  );
  assert.equal(m.misconception?.text, "3⁴ is not 3 × 4 = 12");
});

test("grid is base^floor(n/2) rows by base^ceil(n/2) columns, and its dot count is base^n", () => {
  for (let b = LIMITS.baseMin; b <= LIMITS.baseMax; b++) {
    for (let e = LIMITS.expMin; e <= LIMITS.expMax; e++) {
      const m = exponentModel(b, e);
      assert.equal(m.steps.length, e);
      m.steps.forEach((s) => {
        assert.equal(s.rows, b ** Math.floor(s.n / 2), `${b}^${s.n} rows`);
        assert.equal(s.cols, b ** Math.ceil(s.n / 2), `${b}^${s.n} cols`);
        assert.equal(BigInt(s.rows) * BigInt(s.cols), s.total, `${b}^${s.n} area`);
        assert.equal(s.total, loopPower(b, s.n));
        assert.equal(s.total, s.previous * BigInt(b), "each step is base copies of the one before");
        assert.equal(s.display, s.total > 256n ? "blocks" : "dots");
      });
      assert.equal(m.value, loopPower(b, e));
    }
  }
});

test("every dot belongs to exactly one copy and each copy holds the previous block", () => {
  for (const [b, e] of [
    [2, 4],
    [3, 3],
    [3, 4],
    [5, 3],
    [12, 2],
  ]) {
    const m = exponentModel(b, e);
    for (const s of m.steps) {
      if (s.display === "blocks") continue;
      const sizes = new Map();
      for (let r = 0; r < s.rows; r++)
        for (let c = 0; c < s.cols; c++)
          sizes.set(copyOf(b, s.n, r, c), (sizes.get(copyOf(b, s.n, r, c)) || 0) + 1);
      assert.equal(sizes.size, b, `${b}^${s.n} copies`);
      for (const n of sizes.values()) assert.equal(BigInt(n), s.previous, `${b}^${s.n} copy size`);
    }
  }
});

test("boundaries: 1^8 and 12^8", () => {
  const one = exponentModel(1, 8);
  assert.equal(one.value, 1n);
  assert.equal(one.steps.at(-1).equation, "1 × 1 × 1 × 1 × 1 × 1 × 1 × 1 = 1");
  assert.equal(one.steps[0].equation, "1");
  assert.equal(one.steps[1].copies.en, "1 copy of 1");
  assert.equal(one.misconception?.text, "1⁸ is not 1 × 8 = 8");
  const big = exponentModel(12, 8);
  assert.equal(big.value, 429981696n);
  assert.equal(big.valueText, "429,981,696");
  assert.equal(big.steps.at(-1).display, "blocks");
  assert.equal(big.steps[0].display, "dots");
  assert.equal(big.steps.at(-1).copies.en, "12 copies of 35,831,808");
});

test("2^2 equals 2 × 2 and the misconception check is skipped because both are 4", () => {
  const m = exponentModel(2, 2);
  assert.equal(m.value, 4n);
  assert.equal(m.misconception, null);
  assert.equal(exponentModel(7, 1).misconception, null, "b^1 = b × 1");
  assert.ok(exponentModel(2, 3).misconception, "2^3 = 8 but 2 × 3 = 6");
  assert.ok(exponentModel(3, 2).misconception, "3^2 = 9 but 3 × 2 = 6");
  assert.ok(!/is not/.test(describe(m)));
});

test("out-of-range and invalid input is clamped or defaulted, and reported", () => {
  assert.deepEqual(clampInput(0, 0), {
    base: 1,
    exponent: 1,
    adjusted: ["base-low", "exponent-low"],
  });
  assert.deepEqual(clampInput(13, 9), {
    base: 12,
    exponent: 8,
    adjusted: ["base-high", "exponent-high"],
  });
  assert.deepEqual(clampInput(-5, 100), {
    base: 1,
    exponent: 8,
    adjusted: ["base-low", "exponent-high"],
  });
  assert.deepEqual(clampInput("4", "2"), { base: 4, exponent: 2, adjusted: [] });
  assert.deepEqual(clampInput(2.6, 3.2), {
    base: 3,
    exponent: 3,
    adjusted: ["base-rounded", "exponent-rounded"],
  });
  for (const bad of [NaN, Infinity, "", "abc", null, undefined, {}, [], true]) {
    const c = clampInput(bad, bad);
    assert.equal(c.base, 3);
    assert.equal(c.exponent, 4);
    assert.deepEqual(c.adjusted, ["base-invalid", "exponent-invalid"]);
  }
  assert.equal(exponentModel("99", "-3").value, 12n, "12^1");
});

test("the model is deterministic", () => {
  const a = JSON.stringify(exponentModel(5, 4), (_k, v) => (typeof v === "bigint" ? String(v) : v));
  const b = JSON.stringify(exponentModel("5", 4.0), (_k, v) =>
    typeof v === "bigint" ? String(v) : v,
  );
  assert.equal(a, b);
});

test("answers are checked by value, and the multiplied-base trap is named", () => {
  const m = exponentModel(3, 4);
  for (const a of ["81", "3^4", "3⁴", "3 × 3 × 3 × 3", "9 × 9", "81.0", "162/2"])
    assert.deepEqual(checkValue(m, a), { ok: true, reason: "equal" }, a);
  assert.deepEqual(checkValue(m, "12"), { ok: false, reason: "multiplied-base-by-exponent" });
  assert.deepEqual(checkValue(m, "3 × 4"), { ok: false, reason: "multiplied-base-by-exponent" });
  assert.deepEqual(checkValue(m, "27"), { ok: false, reason: "different-value" });
  assert.deepEqual(checkValue(m, "eighty-one"), { ok: false, reason: "not-a-number" });
});

test("screen-reader text covers every step, the notation and the check, in both languages", () => {
  const m = exponentModel(3, 4);
  const en = describe(m, "en");
  const es = describe(m, "es");
  for (const piece of [
    "Step 1",
    "Step 4",
    "3 × 3 × 3 = 27",
    "3 copies of 9",
    "Expanded form: 3 × 3 × 3 × 3",
    "the base 3 is the factor",
    "the exponent 4 says how many factors",
    "3⁴ = 81",
    "3⁴ is not 3 × 4 = 12",
  ])
    assert.ok(en.includes(piece), piece);
  for (const piece of [
    "Paso 1",
    "Paso 4",
    "3 copias de 9",
    "Forma desarrollada: 3 × 3 × 3 × 3",
    "la base 3 es el factor",
    "el exponente 4 dice cuántos factores hay",
    "3⁴ = 81",
    "3⁴ no es 3 × 4 = 12",
  ])
    assert.ok(es.includes(piece), piece);
  assert.ok(!/\bundefined\b|\bNaN\b|\[object/.test(en + es));
});

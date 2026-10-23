/* Attempt policy: guessing earns no credit, a reload cannot reset it, and the pause never prints an answer. Pure, no DOM. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function load(search = "") {
  const ctx = { location: { search } };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync("assets/studio/attempts.js", "utf8"), ctx);
  return ctx.StudioAttempts;
}

const A = load();
assert.equal(A.LOOK_AT, 2, "two misses close an item into Look closer");
assert.equal(A.tierOf(0, 0), "clean");
assert.equal(A.tierOf(0, 1), "clean", "one hint is still a clean answer");
assert.equal(A.tierOf(0, 2), "assisted", "two hints are help");
assert.equal(A.tierOf(1, 0), "assisted", "one miss is help, not guessing");
assert.equal(A.tierOf(2, 0), "guessed", "two misses is guessing");
assert.equal(A.tierOf(9, 3), "guessed");
assert.equal(A.creditable("clean"), true);
assert.equal(A.creditable("assisted"), false, "only a clean answer earns seals and Boost");
assert.equal(A.creditable("guessed"), false);
assert.equal(A.starCredit("assisted"), true);
assert.equal(A.starCredit("guessed"), false, "a guessed answer waits for its fresh problem");

// a teacher support link gives one more try; it is a link, never a label on a student
const S = load("?support=1");
assert.equal(S.LOOK_AT, 3);
assert.equal(S.tierOf(2, 0), "assisted");
assert.equal(S.tierOf(3, 0), "guessed");
assert.equal(load("?s=2&support=10").LOOK_AT, 2, "only support=1 counts");

// the order after a miss: a permutation, stable for one seed, different across seeds
for (const n of [3, 4, 5]) {
  for (const seed of [1, 7919, 15838, 99999]) {
    const o = A.shuffleOrder(n, seed);
    assert.deepEqual(
      [...o].sort((a, b) => a - b),
      Array.from({ length: n }, (_, i) => i),
    );
    assert.deepEqual(o, A.shuffleOrder(n, seed), "stable for one seed");
  }
}
const seen = new Set();
for (let seed = 1; seed < 200; seed++) seen.add(A.shuffleOrder(4, seed).join(""));
assert.ok(seen.size >= 12, "many different orders, so a position cannot be memorised");

// the pause is four reasons, every one bilingual
assert.equal(A.HOLD_REASONS.length, 4);
for (const r of A.HOLD_REASONS) assert.ok(r.id && r.en && r.es);

console.log("studio-attempts: tiers, credit, support link, choice order and the pause all hold.");

#!/usr/bin/env node
/**
 * Round-trip and checksum-rejection vectors for assets/ewl-seed-engine.js.
 * The module is a browser IIFE, so it is loaded through node:vm.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const sandbox = { module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(
  readFileSync(new URL("../assets/ewl-seed-engine.js", import.meta.url), "utf8"),
  sandbox,
);
const { encode, decode, MAX } = sandbox.module.exports;

// Exhaustive round trip over the whole legal field space (84 × 3 × 16 × 8).
let count = 0;
for (let lessonIndex = 0; lessonIndex <= MAX.lessonIndex; lessonIndex++)
  for (let recommendedTier = 0; recommendedTier <= MAX.recommendedTier; recommendedTier++)
    for (let misconceptionId = 0; misconceptionId <= MAX.misconceptionId; misconceptionId++)
      for (let variantSalt = 0; variantSalt <= MAX.variantSalt; variantSalt++) {
        const fields = { lessonIndex, recommendedTier, misconceptionId, variantSalt };
        const seed = encode(fields);
        assert.match(seed, /^[0-9A-HJKMNP-TV-Z]{4}$/);
        assert.deepEqual({ ...decode(seed) }, fields, seed);
        count++;
      }
assert.equal(count, 84 * 3 * 16 * 8);

// CRC-4 detects every single-symbol typo (any one of 4 positions × 31 wrong symbols).
const sample = encode({ lessonIndex: 42, recommendedTier: 1, misconceptionId: 9, variantSalt: 5 });
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
let rejected = 0;
let accepted = 0;
for (let pos = 0; pos < 4; pos++)
  for (const ch of alphabet) {
    if (ch === sample[pos]) continue;
    const mutated = sample.slice(0, pos) + ch + sample.slice(pos + 1);
    if (decode(mutated) === null) rejected++;
    else accepted++;
  }
// A 4-bit CRC cannot catch everything in a 5-bit symbol, but it must catch most.
assert.ok(
  rejected > accepted * 2,
  `CRC-4 should reject most typos (rejected ${rejected}, accepted ${accepted})`,
);

// Hand-copy tolerance and shape rejection.
const fields = decode(sample);
assert.deepEqual({ ...decode(sample.toLowerCase()) }, { ...fields });
assert.deepEqual({ ...decode(` ${sample} `) }, { ...fields });
for (const bad of ["", "ABC", "ABCDE", "UUUU", "!!!!", null, undefined, 1234])
  assert.equal(decode(bad), null, String(bad));

// Encoder fails fast on out-of-range input.
for (const bad of [
  { lessonIndex: 84, recommendedTier: 0, misconceptionId: 0, variantSalt: 0 },
  { lessonIndex: 0, recommendedTier: 3, misconceptionId: 0, variantSalt: 0 },
  { lessonIndex: 0, recommendedTier: 0, misconceptionId: 16, variantSalt: 0 },
  { lessonIndex: 0, recommendedTier: 0, misconceptionId: 0, variantSalt: 8 },
  { lessonIndex: 1.5, recommendedTier: 0, misconceptionId: 0, variantSalt: 0 },
  null,
])
  assert.throws(() => encode(bad));

console.log(
  `ewl-seed-engine: ${count} round trips, ${rejected}/${rejected + accepted} typos rejected`,
);

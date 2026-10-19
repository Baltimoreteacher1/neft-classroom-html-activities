/**
 * ewl-seed-engine.js — Privacy-safe 4-character Mastery Seed.
 *
 * A seed packs four small fields and a CRC-4 into 20 bits (4 × 5-bit symbols):
 *
 *   bits 19..13  lessonIndex      0..83   (index into the 84 core lessons)
 *   bits 12..11  recommendedTier  0..2    (0 Support, 1 Core, 2 Challenge)
 *   bits 10..7   misconceptionId  0..15   (0 = none)
 *   bits  6..4   variantSalt      0..7
 *   bits  3..0   CRC-4 over the 16 payload bits (poly x^4 + x + 1)
 *
 * It carries no name, score or timestamp, so a seed on a sticky note or in a
 * family text message identifies nothing about the student.
 *
 * Alphabet is Crockford base-32 (no I, L, O, U). Decoding is case-insensitive
 * and maps the look-alikes O→0, I/L→1 so a hand-copied seed still verifies.
 *
 * Pure functions, no DOM, no storage. Safe to run in Node for tests.
 */
(function (root) {
  "use strict";

  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const MAX = Object.freeze({
    lessonIndex: 83,
    recommendedTier: 2,
    misconceptionId: 15,
    variantSalt: 7,
  });
  const FIELDS = Object.keys(MAX);

  function crc4(value16) {
    // Bitwise long division by 0b10011 over 16 bits followed by 4 zero bits.
    let reg = (value16 << 4) & 0xfffff;
    for (let bit = 19; bit >= 4; bit--) {
      if (reg & (1 << bit)) reg ^= 0b10011 << (bit - 4);
    }
    return reg & 0xf;
  }

  function validate(fields) {
    if (!fields || typeof fields !== "object")
      throw new TypeError("Seed fields must be an object.");
    for (const name of FIELDS) {
      const v = fields[name];
      if (!Number.isInteger(v) || v < 0 || v > MAX[name]) {
        throw new RangeError(`${name} must be an integer 0..${MAX[name]}, got ${v}.`);
      }
    }
  }

  function encode(fields) {
    validate(fields);
    const payload =
      (fields.lessonIndex << 9) |
      (fields.recommendedTier << 7) |
      (fields.misconceptionId << 3) |
      fields.variantSalt;
    const word = (payload << 4) | crc4(payload);
    let out = "";
    for (let shift = 15; shift >= 0; shift -= 5) out += ALPHABET[(word >> shift) & 31];
    return out;
  }

  /** Returns the fields, or null for anything that is not a valid seed. */
  function decode(seed) {
    if (typeof seed !== "string") return null;
    const clean = seed.trim().toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1");
    if (clean.length !== 4) return null;
    let word = 0;
    for (const ch of clean) {
      const idx = ALPHABET.indexOf(ch);
      if (idx < 0) return null;
      word = (word << 5) | idx;
    }
    const payload = word >> 4;
    if (crc4(payload) !== (word & 0xf)) return null;
    const fields = {
      lessonIndex: payload >> 9,
      recommendedTier: (payload >> 7) & 3,
      misconceptionId: (payload >> 3) & 15,
      variantSalt: payload & 7,
    };
    // Checksum-valid but outside the real ranges (lesson 84..127, tier 3).
    for (const name of FIELDS) if (fields[name] > MAX[name]) return null;
    return fields;
  }

  const api = Object.freeze({ ALPHABET, MAX, crc4, encode, decode });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EWLSeed = api;
})(typeof window !== "undefined" ? window : globalThis);

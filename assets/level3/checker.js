// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/*!
 * level3/checker.js — answer checking without shipping an answer key.
 *
 * The Level 3 item bank stores only salted SHA-256 digests. A student's typed
 * response is normalized, salted with the item's own salt, hashed, and compared.
 * Nothing in the shipped bundle or in data/level3-adaptive.json can be read to
 * recover a correct answer, and the digests are per-item salted so identical
 * answers across items do not collide into a lookup table.
 *
 * Known WRONG answers are stored the same way, each tagged with the
 * misconception it evidences. That is what lets the runtime say "this looks
 * like additive reasoning" without ever holding the right answer in the clear.
 *
 * Works in the browser (crypto.subtle) and in node (node:crypto), so the same
 * code path is exercised by tools/level3-adaptive.test.mjs.
 */

/**
 * Normalize a response so trivial formatting differences don't read as wrong.
 * Deliberately conservative: it lowercases, collapses whitespace, drops commas
 * in numbers and a single trailing period, and normalizes a few ratio spellings.
 * It does NOT try to do algebra — an item whose answers need real equivalence
 * checking should ship every accepted form as its own digest.
 */
export function normalizeResponse(raw) {
  let s = String(raw == null ? "" : raw)
    .trim()
    .toLowerCase();
  s = s.replace(/\s+/g, " ");
  s = s.replace(/(\d),(?=\d{3}\b)/g, "$1"); // 1,200 -> 1200
  s = s.replace(/\.$/, "");
  s = s.replace(/\s*(?:to|:)\s*/g, ":"); // "3 to 5", "3 : 5" -> "3:5"
  s = s.replace(/^\$/, "");
  s = s.replace(/\s*per\s*/g, " per ");
  return s.trim();
}

async function sha256Hex(text) {
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    const bytes = new TextEncoder().encode(text);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Digest used by both the generator and the runtime. Keep the two in lockstep. */
export async function digest(salt, response) {
  return sha256Hex(`${salt}::${normalizeResponse(response)}`);
}

/**
 * Check a response against an item.
 * Returns { correct, misconception } — `misconception` is set only when the
 * response matches a known wrong-answer digest, never inferred from being wrong.
 */
export async function checkAnswer(item, response) {
  if (!item) return { correct: false, misconception: null };
  const salt = item.salt || item.id || "";
  const hex = await digest(salt, response);
  const accepted = item.answer && Array.isArray(item.answer.hashes) ? item.answer.hashes : [];
  if (accepted.includes(hex)) return { correct: true, misconception: null };
  for (const d of item.distractors || []) {
    if (d.hash === hex) return { correct: false, misconception: d.misconception || null };
  }
  return { correct: false, misconception: null };
}

export default { normalizeResponse, digest, checkAnswer };

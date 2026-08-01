#!/usr/bin/env node
/* ==========================================================================
 * vocab-bank-fresh.test.mjs — the Vocabulary Study Hub's bank must agree with
 * the lessons it was built from.
 *
 * WHY THIS EXISTS
 *
 * `vocab-hub/vocab-bank.json` is a SECOND copy of every lesson's vocabulary,
 * built from lessons/<id>/config.json. Like every second copy in this repo, it
 * goes wrong silently: the hub still renders, still looks right, and simply
 * teaches an old definition or shows a picture the lesson stopped using.
 *
 * Two concrete failures this pins:
 *
 *   1. STALENESS. The committed bank sat 11 days behind the configs (197 terms
 *      vs 258) because nothing ran the builder after a curriculum edit.
 *
 *   2. A DUPLICATED RESOLVER. build-bank.mjs used to carry its own copy of
 *      resolveVocabImage() "mirroring" engine/core/vocab-images.js. It drifted
 *      twice over: it ignored per-lesson `image` overrides entirely — so all
 *      ~200 concept cards fell through to cat-number.svg, a literal "#" tile —
 *      and its slug tables aged out of sync, resolving "Dividend" to divide.svg
 *      while the lesson rendered dividend.svg. A picture that contradicts the
 *      word is worse than no picture, because a student trusts the picture.
 *
 * The builder now imports the engine's resolver instead of reimplementing it,
 * and this test keeps both properties honest.
 * ========================================================================== */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const bankUrl = new URL("../vocab-hub/vocab-bank.json", import.meta.url);
assert.ok(existsSync(bankUrl), "vocab-hub/vocab-bank.json is missing");
const bank = JSON.parse(readFileSync(bankUrl, "utf8"));
const items = bank.items ?? [];

assert.ok(items.length >= 200, `the bank looks truncated — only ${items.length} terms`);

/* ── 1 · No term may show a generic category placeholder ──────────────────
 * cat-*.svg are the fallback tiles; cat-number.svg is a literal "#". Any term
 * landing on one is a term whose picture means nothing. */
const placeholders = items
  .filter((t) => /\/cat-[a-z]+\.svg$/.test(t.image ?? ""))
  .map((t) => `${t.term} -> ${t.image}`);

assert.deepEqual(
  placeholders,
  [],
  `${placeholders.length} bank term(s) show a generic "#" tile instead of real art:\n  ${placeholders
    .slice(0, 10)
    .join("\n  ")}\nUsually this means a per-lesson \`image\` override was dropped.`,
);

/* ── 2 · Per-lesson image overrides must survive into the bank ────────────
 * If a lesson pins `image`, it is saying the generic term picture shows the
 * WRONG example for that lesson. The bank must not silently un-pin it. */
const overrides = items.filter((t) => (t.image ?? "").includes("/concept-"));
assert.ok(
  overrides.length >= 40,
  `expected the per-lesson concept cards to reach the bank, found ${overrides.length} — ` +
    "the builder has probably stopped passing the override to resolveVocabImage()",
);

/* ── 3 · The builder must not reimplement image resolution ────────────────
 * A second implementation of a mapping is a second thing to keep correct. */
const builderSrc = readFileSync(new URL("../vocab-hub/build-bank.mjs", import.meta.url), "utf8");
assert.match(
  builderSrc,
  /import\s*\{[^}]*resolveVocabImage[^}]*\}\s*from\s*["'][^"']*engine\/core\/vocab-images\.js["']/,
  "build-bank.mjs must IMPORT resolveVocabImage from engine/core/vocab-images.js, not redefine it",
);
assert.doesNotMatch(
  builderSrc,
  /function\s+resolveVocabImage\s*\(/,
  "build-bank.mjs re-defines resolveVocabImage — that copy is what drifted before",
);

/* ── 4 · The committed bank must match what the builder produces now ──────
 * Runs the builder's own --check so there is exactly one definition of fresh. */
execFileSync(
  process.execPath,
  [fileURLToPath(new URL("../vocab-hub/build-bank.mjs", import.meta.url)), "--check"],
  { stdio: "pipe" },
);

console.log(
  `Vocab bank fresh: ${items.length} terms, 0 placeholder tiles, ${overrides.length} per-lesson overrides honored.`,
);

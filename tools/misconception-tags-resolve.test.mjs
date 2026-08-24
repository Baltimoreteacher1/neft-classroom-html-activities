#!/usr/bin/env node
/**
 * Every authored `misconceptionTags` value must resolve to a real taxonomy
 * entry with student-facing text.
 *
 * This guards the one way the diagnosis pipeline fails SILENTLY. `resolveAuthoredTag()`
 * returns null for an unknown string and the renderer falls through to the
 * predictor, so a typo — or a tag deleted from the taxonomy while 40 lesson
 * configs still reference it — costs the diagnosis with no error anywhere. The
 * item still renders, still grades, still looks fine; it just stops naming the
 * mistake, and the heatmap, class pulse and small-group routing downstream of it
 * quietly go empty.
 *
 * Verified 2026-08-10 that the loop actually closes: a student who picks a
 * tagged distractor gets a "💭 Looks like: <label>" chip above the coaching
 * sentence (engine/components/multiple-choice.js), and `onAnswer` feeds
 * recordMisconception(). Note that authored per-choice feedback deliberately
 * OUTRANKS the diagnosis for the sentence itself, so the tag's visible effect is
 * the chip plus everything downstream — not a rewritten sentence.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MISCONCEPTIONS, resolveAuthoredTag } from "../engine/core/misconceptions.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const TIERS = ["approaching", "onLevel", "extending", "optional"];

/**
 * An item's own words, for asking whether the mathematics it shows matches the
 * error it claims to diagnose.
 */
function itemText(item) {
  return [item?.stem, ...(item?.choices || []), item?.explanation].filter(Boolean).join(" | ");
}

/* A DECIMAL error cannot be diagnosed by a problem that contains no decimal.
 *
 * The engine's own numeric predictor already knows this — it guards
 * `decimal-place-value` behind `hasDecimal` so "a clean whole-number problem
 * never gets a decimal label" — but an AUTHORED tag bypasses the predictor
 * entirely, and `place-value` is aliased straight to `decimal-place-value`.
 * Sixteen whole-number items were tagged that way, including "What is the prime
 * factorization of 30?" and "Which ratio is greater: 3:4 or 5:8?". Nothing
 * caught it, because the tag resolves, has student text and sits on a wrong
 * answer — every existing check passes.
 *
 * The cost was teacher-facing: lesson 2-6 is whole-number long division, and
 * its small-group panel told the teacher to "check where the point lands" and
 * to "count decimal places out loud" on 1,344 ÷ 12. */
const DECIMAL_TAGS = new Set(["decimal-place-value"]);
const HAS_DECIMAL = /\d\.\d/;

const problems = [];
let tagged = 0;
let items = 0;
const used = new Set();

for (const id of readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .sort()) {
  const file = join(LESSONS, id, "config.json");
  if (!existsSync(file)) continue;
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    problems.push(`${id}: config.json does not parse (${error.message})`);
    continue;
  }
  for (const tier of TIERS) {
    for (const item of config.practice?.[tier] || []) {
      const tags = item?.misconceptionTags;
      if (!Array.isArray(tags)) continue;
      items += 1;

      if (Array.isArray(item.choices) && tags.length !== item.choices.length)
        problems.push(
          `${id}: misconceptionTags has ${tags.length} entries for ${item.choices.length} choices — they are positional, so a length mismatch silently mislabels`,
        );

      tags.forEach((tag, index) => {
        if (tag == null) return;
        tagged += 1;
        const resolved = resolveAuthoredTag(tag);
        if (!resolved) {
          problems.push(
            `${id}: tag "${tag}" resolves to nothing — typo, or removed from the taxonomy`,
          );
          return;
        }
        used.add(resolved);
        const entry = MISCONCEPTIONS[resolved];
        for (const field of ["label", "student"]) {
          if (!entry?.[field])
            problems.push(`${id}: "${resolved}" has no ${field} to show a student`);
        }
        if (index === item.correctIndex)
          problems.push(
            `${id}: the CORRECT choice (index ${index}) carries tag "${tag}" — a right answer diagnoses nothing`,
          );
        if (DECIMAL_TAGS.has(resolved) && !HAS_DECIMAL.test(itemText(item)))
          problems.push(
            `${id}: "${tag}" (→ ${resolved}) is a DECIMAL error, but this item states no decimal — "${String(item.stem || "").slice(0, 60)}". The teacher move for it says to count decimal places.`,
          );
      });
    }
  }
}

if (tagged === 0)
  problems.push("no authored misconceptionTags found at all — the sweep matched nothing");

if (problems.length) {
  console.error("misconception tag resolution FAILED:");
  for (const p of problems.slice(0, 25)) console.error(`  ✗ ${p}`);
  if (problems.length > 25) console.error(`  … and ${problems.length - 25} more`);
  process.exit(1);
}

console.log(
  `misconception tags: ${tagged} authored tags across ${items} items resolve to ${used.size} of ${Object.keys(MISCONCEPTIONS).length} taxonomy entries, all with student text.`,
);

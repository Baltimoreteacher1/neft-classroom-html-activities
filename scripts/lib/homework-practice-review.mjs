import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractProblemText } from "../homework-alignment.mjs";

/**
 * Family homework practice may only ask what its lesson taught.
 *
 * A lesson's `practice` pool is written for the lesson page and its worksheets,
 * and it includes stretch items that go beyond the skill taught that night (a
 * percent lesson's pool carried a multi-category car-dealership explanation and
 * "greater than 100%" items taught in Part 2). Family homework shows a student
 * only a small slice of that pool, so what it shows has to be on-skill.
 *
 * `data/family-homework-practice-review.json` records, per homework page, the
 * pool items a reviewer judged off-skill (`exclude`) and any authored items that
 * replace them (`add`, keyed by tier). This module applies that record to the
 * pool BEFORE selection, so the single selector sees only on-skill items and
 * every other consumer of the pool (the Together ladder, "more practice") does
 * too.
 *
 * Exclusions are keyed by tier#index AND a stem fingerprint. If a config is
 * regenerated and the item at that index is no longer the one that was
 * reviewed, this throws instead of silently excluding a different problem.
 */

export const PRACTICE_REVIEW_FILE = "data/family-homework-practice-review.json";
const TIERS = ["approaching", "onLevel", "optional", "extending"];

/** The fingerprint stored beside each exclusion. */
export function stemFingerprint(problem) {
  return extractProblemText(problem).replace(/\s+/g, " ").trim().slice(0, 80);
}

export function loadPracticeReview(root) {
  const path = join(root, PRACTICE_REVIEW_FILE);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")).lessons || {};
  } catch (e) {
    throw new Error(`${PRACTICE_REVIEW_FILE} is unreadable: ${e.message}`);
  }
}

function parseRef(ref) {
  const m = /^(approaching|onLevel|optional|extending)#(\d+)$/.exec(String(ref));
  if (!m) throw new Error(`bad practice ref "${ref}"`);
  return { tier: m[1], index: Number(m[2]) };
}

/**
 * Returns a new `practice` object with the reviewed exclusions removed and the
 * authored additions appended to their tier. Never mutates its input.
 */
export function applyPracticeReview(lessonId, practice = {}, entry = null) {
  if (!entry) return practice;
  const out = {};
  for (const tier of TIERS) out[tier] = Array.isArray(practice[tier]) ? [...practice[tier]] : [];

  const drop = new Set();
  for (const ex of entry.exclude || []) {
    const { tier, index } = parseRef(ex.ref);
    const item = (practice[tier] || [])[index];
    if (!item || stemFingerprint(item) !== ex.stem) {
      throw new Error(
        `${PRACTICE_REVIEW_FILE}: ${lessonId} ${ex.ref} no longer matches the reviewed problem ` +
          `("${ex.stem}"). The pool changed since it was reviewed; re-review it.`,
      );
    }
    drop.add(item);
  }
  for (const tier of TIERS) out[tier] = out[tier].filter((p) => !drop.has(p));

  for (const [tier, items] of Object.entries(entry.add || {})) {
    if (!TIERS.includes(tier)) throw new Error(`${lessonId}: unknown tier "${tier}" in add`);
    out[tier].push(...items);
  }
  return { ...practice, ...out };
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Per-choice feedback for the authored Session 2 (Apply Day) practice.
 *
 * `data/part-two-session2-practice.json` holds ~390 multiple-choice items and
 * none of them carries `choiceFeedback`, so a family that picked a wrong answer
 * got the generic "check what the question asks" line in both languages. The
 * feedback is authored in `data/part-two-feedback-additions.json` instead of in
 * that file because `tools/import-session2-practice.mjs` can regenerate it.
 *
 * Each entry is keyed by the item's id and carries `correctChoice`, the text of
 * the item's right answer when the feedback was written. If the item has been
 * edited since, this throws instead of attaching feedback written for a
 * different question, the same fail-loud rule as lib/homework-practice-review.mjs.
 *
 * Shape of one entry:
 *   correctChoice      text of choices[correctIndex] at authoring time
 *   choiceFeedback     one line per choice, "" at the correct slot (the repo's
 *                      distractor audit requires it)
 *   choiceFeedbackEs   the same in Spanish
 *   correctNote        { en, es } one line reinforcing the METHOD the student used
 */

export const FEEDBACK_ADDITIONS_FILE = "data/part-two-feedback-additions.json";
const TIERS = ["approaching", "onLevel", "extending"];

export function loadFeedbackAdditions(root) {
  const path = join(root, FEEDBACK_ADDITIONS_FILE);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")).items || {};
  } catch (e) {
    throw new Error(`${FEEDBACK_ADDITIONS_FILE} is unreadable: ${e.message}`);
  }
}

/** Every multiple-choice item in the Session 2 lessons, with where it lives. */
export function* sessionTwoChoiceItems(lessons) {
  for (const [lessonId, lesson] of Object.entries(lessons)) {
    for (const tier of TIERS) {
      for (const item of lesson[tier] || []) {
        if (Array.isArray(item.choices) && item.choices.length > 1) yield { lessonId, tier, item };
      }
    }
  }
}

/**
 * Attaches authored feedback to the Session 2 items, in place. An item that
 * already carries its own `choiceFeedback` keeps it. Returns `lessons`.
 */
export function applyFeedbackAdditions(lessons, additions) {
  const byId = new Map();
  for (const { item } of sessionTwoChoiceItems(lessons)) byId.set(item.id, item);

  for (const [id, entry] of Object.entries(additions)) {
    const item = byId.get(id);
    if (!item) throw new Error(`${FEEDBACK_ADDITIONS_FILE}: no Session 2 item "${id}"`);
    const correct = item.choices[item.correctIndex ?? 0];
    if (entry.correctChoice !== correct) {
      throw new Error(
        `${FEEDBACK_ADDITIONS_FILE}: "${id}" was written for the answer "${entry.correctChoice}" but the item's answer is now "${correct}"; re-author its feedback`,
      );
    }
    if ((item.choiceFeedback || []).some(Boolean)) continue;
    item.choiceFeedback = entry.choiceFeedback;
    item.choiceFeedbackEs = entry.choiceFeedbackEs;
    item.correctNote = entry.correctNote.en;
    item.correctNoteEs = entry.correctNote.es;
  }
  return lessons;
}

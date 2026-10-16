import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LAB_STRINGS } from "@eduwonderlab/engine/components/lab-strings-es.js";
import { FEEDBACK_ADDITIONS_FILE, loadFeedbackAdditions } from "./part-two-feedback-additions.mjs";

/**
 * The native-review queue for Spanish that has been written but never read by a
 * native speaker.
 *
 * `data/spanish-review-queue.json` lists EVERY new Spanish string with its file,
 * key, English, Spanish and a review status. This module is the one place that
 * knows where those strings live, so the queue file, the printable sheet and the
 * test that proves the queue is complete all ask the same question.
 *
 * Sources, in the order they are listed:
 *   engine/components/lab-strings-es.js          Touch & Try lab interface text
 *   data/part-two-feedback-additions.json         per-choice feedback, Session 2 practice
 */

export const QUEUE_FILE = "data/spanish-review-queue.json";
export const LAB_FILE = "engine/components/lab-strings-es.js";
export const STATUSES = ["needs-native-review", "approved", "changes-requested"];
export const NEW_STATUS = "needs-native-review";

/** @typedef {{ file: string, key: string, en: string, es: string, status: string, reviewer?: string, note?: string, suggestedEs?: string }} QueueEntry */

/** Every new Spanish string, as it stands in its source file. */
export function collectNewSpanishStrings(root) {
  /** @type {Omit<QueueEntry, "status">[]} */
  const out = [];
  for (const [key, [en, es]] of Object.entries(LAB_STRINGS)) {
    out.push({ file: LAB_FILE, key, en, es });
  }
  for (const [id, entry] of Object.entries(loadFeedbackAdditions(root))) {
    entry.choiceFeedback.forEach((en, index) => {
      if (!en) return;
      out.push({
        file: FEEDBACK_ADDITIONS_FILE,
        key: `${id}.choiceFeedback[${index}]`,
        en,
        es: entry.choiceFeedbackEs[index],
      });
    });
    out.push({
      file: FEEDBACK_ADDITIONS_FILE,
      key: `${id}.correctNote`,
      en: entry.correctNote.en,
      es: entry.correctNote.es,
    });
  }
  return out;
}

export function loadQueue(root) {
  const path = join(root, QUEUE_FILE);
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8")).entries || [];
}

const identity = (e) => `${e.file}\u0000${e.key}`;

/**
 * The queue as it should be: every current string, keeping a reviewer's
 * decision only while the English and Spanish it was made on are unchanged. A
 * string edited after approval goes back to needs-native-review, because the
 * approval was of different words.
 */
export function syncQueue(root, previous = loadQueue(root)) {
  const before = new Map(previous.map((e) => [identity(e), e]));
  return collectNewSpanishStrings(root).map((s) => {
    const old = before.get(identity(s));
    if (old && old.en === s.en && old.es === s.es) return { ...old };
    return { ...s, status: NEW_STATUS };
  });
}

export function queueFileText(entries) {
  return `${JSON.stringify(
    {
      $comment:
        "Spanish written for this site that no native speaker has read yet. Every entry is needs-native-review until a person says otherwise. Regenerate with `node scripts/spanish-review-sheet.mjs --sync`; render a printable sheet with `node scripts/spanish-review-sheet.mjs --out reports/spanish-review.html`. An entry keeps its decision only while its English and Spanish are unchanged.",
      entries,
    },
    null,
    2,
  )}\n`;
}

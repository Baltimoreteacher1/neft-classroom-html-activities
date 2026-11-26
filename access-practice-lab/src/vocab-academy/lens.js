// Vocabulary Academy -> My Words (the Language Lens). One place that turns an Academy result into a word encounter, so
// the six result paths (practice, review, games, word card, unit activities, reading) all say the same thing.
//
// What counts, and why:
//  * a card opened for the first time is `saw` (never tested, never scheduled);
//  * a graded answer is `chose`, unless the item itself says the learner typed (`wrote`) or talked (`said`), which is the
//    item's own `mode`, never guessed from the skill it exercises;
//  * a heavy or light support (word bank, hint, read-aloud) makes the encounter supported, not independent;
//  * the headword is looked up in the Academy index. A word the index does not know is skipped, never invented, and
//    nothing the learner typed or said is passed on.
import { noteWords } from "../lang/word-encounters.js";
import { getIndex } from "./data.js";

const SRC = "vocab-academy";
const BY_ITEM_MODE = { typed: "wrote", write: "wrote", speak: "said" };

/** Pure: what the Lens records for one Academy result, or null when there is no headword. */
export function lensEncounter(result, headword) {
  const w = typeof headword === "string" ? headword.trim() : "";
  if (!w || !result) return null;
  const supported =
    (Array.isArray(result.sup) && result.sup.length > 0) || Number(result.hints) > 0;
  return {
    w,
    opts: {
      src: SRC,
      mode: BY_ITEM_MODE[result.mode] || "chose",
      supported,
      ok: Boolean(result.ok),
    },
  };
}

/** Record one graded Academy result. Never throws and never blocks the learner. */
export function noteAcademyResult(result) {
  if (!result?.wordId) return;
  getIndex()
    .then((index) => {
      const e = lensEncounter(result, index?.words?.[result.wordId]?.hw);
      if (e) noteWords([e.w], e.opts);
    })
    .catch(() => {});
}

/** The first time a word card opens: seen, nothing more. */
export function noteAcademySeen(headword) {
  const w = typeof headword === "string" ? headword.trim() : "";
  if (w) noteWords([w], { src: SRC, mode: "saw" });
}

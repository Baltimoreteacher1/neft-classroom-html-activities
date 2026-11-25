// Level-aware support defaults for WIDA levels 1-6 and grade bands 3-5 and 6-8.
//
// These are STARTING POINTS a teacher sets per class or per unit. They are never inferred from student work, never
// shown to students, and are not a placement (docs/language-world-audit.md section 6). A student can always change
// any support from the dial. Defaults for levels 1-2 and 3-4 are grouped because the lab's support tiers (A/B/C)
// are coarser than six levels; they should be confirmed by a WIDA-trained reviewer (docs/language-page/human-required.md).
import { BANDS } from "./schema/v1.js";

export const WIDA_LEVELS = Object.freeze([1, 2, 3, 4, 5, 6]);

const BASE = {
  1: { step: "full", wordHelp: { image: true, gloss: true, audio: true, example: true }, chunking: "always", frames: "full", model: true },
  2: { step: "full", wordHelp: { image: true, gloss: true, audio: true, example: true }, chunking: "always", frames: "full", model: false },
  3: { step: "partial", wordHelp: { image: true, gloss: true, audio: true, example: true }, chunking: "ondemand", frames: "partial", model: false },
  4: { step: "partial", wordHelp: { image: false, gloss: true, audio: true, example: true }, chunking: "ondemand", frames: "partial", model: false },
  5: { step: "hint", wordHelp: { image: false, gloss: false, audio: true, example: true }, chunking: "ondemand", frames: "hint", model: false },
  6: { step: "none", wordHelp: { image: false, gloss: false, audio: false, example: true }, chunking: "ondemand", frames: "none", model: false },
};

// Grades 6-8 must not feel babyish: pictures are off unless the word is concrete and needs one, and audio does not autoplay.
const BAND_ADJUST = {
  "3-5": { autoplayAudio: true, imagesFirst: true, textSize: 1.1 },
  "6-8": { autoplayAudio: false, imagesFirst: false, textSize: 1 },
};

/** The defaults for one WIDA starting point and band. `unitOverride` is a partial object from a unit's own settings. */
export function defaultsFor(level, band, unitOverride = {}) {
  if (!WIDA_LEVELS.includes(level)) throw new RangeError(`WIDA starting point must be 1-6, got ${level}`);
  if (!BANDS.includes(band)) throw new RangeError(`band must be ${BANDS.join(" or ")}, got ${band}`);
  const b = BASE[level];
  const adj = BAND_ADJUST[band];
  const wordHelp = { ...b.wordHelp, ...(unitOverride.wordHelp || {}) };
  if (band === "6-8" && !unitOverride.wordHelp?.image) wordHelp.image = false;
  return { ...b, ...adj, ...unitOverride, wordHelp, level, band };
}

// Readability measure for the three WIDA-tier texts of a vocabulary reading (audit F-12).
//
// Difficulty of one text = Flesch-Kincaid grade level, floored at 0:
//   FKGL = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
// Tokens are the same words reading-rules.countWords counts (numerals included; a numeral counts as 1 syllable).
// A reading is MONOTONIC when, going 1_2 -> 3_4 -> 5_6, neither the FKGL nor the word count ever decreases.
//
// Limits (state them wherever a number from this module is quoted):
//  - FKGL was built for running prose of 100+ words and school-age text. These passages are 35-220 words, so a
//    single score is noisy (one added clause moves it by ~1 grade). It is a band-ordering check, not a grade
//    placement: never present the score to students or call it a reading level.
//  - The floor at 0 exists because very short K-1 sentences push FKGL below zero ("below kindergarten"), which
//    has no meaning. Equal scores are allowed (non-decreasing, not strictly increasing).
//  - Syllables come from a vowel-group heuristic with a silent-e rule. It is wrong for some words (for example
//    "area", "science", "being" are off by one). The error is the same for every band of the same reading, so it
//    cancels in the within-reading comparison this module is used for; do not compare scores across readings.
//  - Word count is the second axis because FKGL ignores vocabulary load and text length, and a longer text at the
//    same sentence length is still more to read.

export const BAND_ORDER = ["1_2", "3_4", "5_6"];
export const FKGL_FLOOR = 0;

const WORD = /[A-Za-z0-9][A-Za-z0-9'’-]*/g;

export function syllables(word) {
  const w = String(word)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!w) return 1; // a numeral
  if (w.length <= 3) return 1;
  const stem = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return Math.max(1, (stem.match(/[aeiouy]{1,2}/g) || []).length);
}

export function readability(text) {
  const words = String(text).match(WORD) || [];
  const sentences = String(text)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean).length;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const fkgl = words.length
    ? 0.39 * (words.length / Math.max(1, sentences)) + 11.8 * (syl / words.length) - 15.59
    : 0;
  return {
    words: words.length,
    sentences,
    fkgl: Math.max(FKGL_FLOOR, Math.round(fkgl * 100) / 100),
  };
}

/** Problems (strings, no unit prefix) where a harder band is not at least as hard as the easier one. */
export function monotonicProblems(texts) {
  const problems = [];
  const scores = BAND_ORDER.map((band) => readability(texts?.[band] || ""));
  for (let i = 1; i < BAND_ORDER.length; i += 1) {
    const [lo, hi] = [BAND_ORDER[i - 1], BAND_ORDER[i]];
    if (scores[i].fkgl < scores[i - 1].fkgl)
      problems.push(
        `readability falls from texts.${lo} (FKGL ${scores[i - 1].fkgl}) to texts.${hi} (FKGL ${scores[i].fkgl})`,
      );
    if (scores[i].words < scores[i - 1].words)
      problems.push(
        `length falls from texts.${lo} (${scores[i - 1].words} words) to texts.${hi} (${scores[i].words} words)`,
      );
  }
  return problems;
}

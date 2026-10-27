// Flesch-Kincaid grade level for instruction text. Pure functions, no I/O.
//
// Numbers, operators and bare symbols are removed before counting: "3/4 x 2/1 = 6/4" is
// arithmetic, not reading load, and counting its digits as words would make every maths lesson
// look both short-sentenced and easy.

/** Syllables in one English word (vowel-group heuristic, silent-e aware). Always >= 1. */
export function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Split into sentences that contain real words, with their word lists. */
export function sentencesOf(text) {
  const clean = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\b\d[\d,.:/%]*\b/g, " ")
    .replace(/[=+×÷−*^<>()[\]{}|_]/g, " ")
    .replace(/\s+/g, " ");
  const out = [];
  for (const raw of clean.split(/(?<=[.!?])\s+|\n+/)) {
    const words = raw.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
    if (words.length >= 3) out.push(words);
  }
  return out;
}

/** { grade, words, sentences, avgSentence } or null when there is too little text to judge. */
export function fleschKincaid(text) {
  const sents = sentencesOf(text);
  const words = sents.flat();
  if (sents.length < 3 || words.length < 25) return null;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const grade = 0.39 * (words.length / sents.length) + 11.8 * (syl / words.length) - 15.59;
  return {
    grade: +Math.max(0, grade).toFixed(2),
    words: words.length,
    sentences: sents.length,
    avgSentence: +(words.length / sents.length).toFixed(1),
  };
}

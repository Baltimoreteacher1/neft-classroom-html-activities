// Flesch-Kincaid grade level over prose strings, with a documented syllable heuristic.
// FK = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
// It estimates surface difficulty from sentence length and word length. It does NOT measure comprehension, vocabulary
// difficulty, background knowledge, or how well a Language Learner will understand the text.

const WORD = /[A-Za-z][A-Za-z'’-]*/g;
const MIN_WORDS_PER_STRING = 4; // shorter strings are labels, single terms or answer options, not prose
const BLANK = /\[[^\]]*\]|_{2,}/g;

/**
 * Syllables in one English word (heuristic, typically within one syllable of a dictionary count for rarer words):
 * vowel groups, minus a silent final "e" / "-es" / "-ed", plus one for consonant+"le" and for vowel pairs that split
 * (ia, io, iu, ua, uo). Words of three letters or fewer count as one syllable.
 */
export function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const consonantLe = /[^aeiouy]le$/.test(w);
  let stem = w;
  if (/(?:[^aeiouy]ed)$/.test(w) && !/[td]ed$/.test(w)) stem = w.slice(0, -2);
  else if (/es$/.test(w) && !/(?:[sxz]|ch|sh|[cg])es$/.test(w)) stem = w.slice(0, -2);
  else if (/e$/.test(w)) stem = w.slice(0, -1);
  stem = stem.replace(/^y/, "").replace(/([tsc])i(?=o[nu]|a[ln])/g, "$1"); // fraction, ratio, special: -tion/-cial are one beat
  let n = (stem.match(/[aeiouy]+/g) || []).length;
  n += (stem.match(/ia|io|iu|ua|uo/g) || []).length;
  if (consonantLe) n += 1;
  return Math.max(1, n);
}

const terminators = (text) => (text.match(/[.!?]+(?=\s|$|[”"')])/g) || []).length;

/** Prose strings only: blanks become a one-syllable word so frames do not collapse into fragments. */
export function proseStats(strings) {
  let words = 0;
  let syl = 0;
  let sentences = 0;
  let strs = 0;
  for (const raw of strings) {
    const text = String(raw).replace(BLANK, " it ");
    const ws = text.match(WORD) || [];
    if (ws.length < MIN_WORDS_PER_STRING) continue;
    strs += 1;
    words += ws.length;
    for (const w of ws) syl += syllables(w);
    sentences += Math.max(1, terminators(text));
  }
  return { words, syllables: syl, sentences, strings: strs };
}

export function fleschKincaid({ words, syllables: syl, sentences }) {
  if (!words || !sentences) return null;
  return Math.round((0.39 * (words / sentences) + 11.8 * (syl / words) - 15.59) * 100) / 100;
}

export const gradeOf = (strings) => fleschKincaid(proseStats(strings));

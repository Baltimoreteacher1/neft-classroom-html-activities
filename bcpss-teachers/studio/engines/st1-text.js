// Pure text helpers shared by the engines-1 activities and their tests (no DOM, no imports).
const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g;

/** Whole-word, case-insensitive finder for a word (or several inflected forms) inside a sentence. */
export function wordRegex(words) {
  const parts = []
    .concat(words)
    .filter(Boolean)
    .map((w) => w.replace(REGEX_ESCAPE, "\\$&"));
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${parts.join("|")})(?=$|[^\\p{L}\\p{N}])`, "iu");
}

export const hasWord = (text, words) => wordRegex(words).test(text);

/** Replace the first whole-word hit with a blank. Returns {text, found}. */
export function blankOut(sentence, words) {
  const m = wordRegex(words).exec(sentence);
  if (!m) return { text: sentence, found: false };
  const start = m.index + m[1].length;
  return { text: `${sentence.slice(0, start)}_____${sentence.slice(start + m[2].length)}`, found: true };
}

const STOP = new Set("a an and are as at be but by for from has have he her him his i in is it its of on or she so that the their them they this to was we were with you".split(" "));
/** Content words (lower case, no stop words, length >= 3). */
export const contentWords = (text) =>
  (String(text).toLowerCase().match(/[\p{L}\p{N}']+/gu) || []).filter((w) => w.length >= 3 && !STOP.has(w));

export const wordCount = (text) => (String(text).trim().match(/[\p{L}\p{N}']+/gu) || []).length;

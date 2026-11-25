// Word splitting and a light stemmer shared by the frequency builder and the vocab-tier verifier.
const WORD = /[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]*/g;

export const wordsOf = (text) =>
  (String(text).match(WORD) || [])
    .map((w) =>
      w
        .toLowerCase()
        .replace(/['’]s$/, "")
        .replace(/^[-']+|[-']+$/g, ""),
    )
    .filter(Boolean);

/** Plural/possessive folding only (ratios -> ratio, fractions -> fraction, studies -> study); no deeper stemming. */
export function stemWord(word) {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (/ies$/.test(w) && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/(?:ss|us|is)$/.test(w)) return w;
  if (/(?:sh|ch|x|z|s)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w)) return w.slice(0, -1);
  return w;
}

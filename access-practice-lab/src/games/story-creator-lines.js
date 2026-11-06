// Story Creator line repair: the language task inside each storyboard panel.
// Three authored kinds: "punct" (place quotation marks, commas and end marks in the gaps between words and
// fix capital letters), "connector" (choose the transition that shows how two ideas relate) and "verb"
// (swap a weak verb for a precise one the context supports). The punct key is derived from the authored
// finished sentence, so the content holds one truth and the gaps cannot disagree with it.

/** Every mark the tray can offer, by stable index (data-g-tool uses the index, never the glyph). */
export const MARKS = ["“", "”", ",", ".", "?", "!"];
export const MARK_NAMES = {
  "“": ["opening quotation mark", "comillas de apertura"],
  "”": ["closing quotation mark", "comillas de cierre"],
  ",": ["comma", "coma"],
  ".": ["period", "punto"],
  "?": ["question mark", "signo de interrogación"],
  "!": ["exclamation point", "signo de exclamación"],
};
const PRE = /^[“]+/;
const POST = /[”,.!?]+$/;

/** Split the authored answer into word cores and the mark string that belongs in each gap (n words -> n+1 gaps). */
export function parsePunct(answer) {
  const tokens = String(answer).trim().split(/\s+/);
  const gaps = Array(tokens.length + 1).fill("");
  const words = tokens.map((t, i) => {
    const pre = t.match(PRE)?.[0] || "";
    const post = t.slice(pre.length).match(POST)?.[0] || "";
    gaps[i] += pre;
    gaps[i + 1] += post;
    return t.slice(pre.length, t.length - post.length);
  });
  return { words, gaps };
}

const swapFirst = (w) => {
  const c = w.charAt(0);
  const up = c.toUpperCase();
  return (c === up ? c.toLowerCase() : up) + w.slice(1);
};
/** The word the learner currently sees at index i (authored word, with its first letter flipped if toggled). */
export const shownWord = (line, work, i) =>
  work.caps.includes(i) ? swapFirst(line.words[i]) : line.words[i];
export const emptyWork = () => ({ gaps: {}, caps: [], tool: null });

/** The learner's sentence as plain text (used for read-back and screen-reader summaries). */
export function workText(line, work) {
  const out = [];
  line.words.forEach((_, i) => out.push(`${work.gaps[i] || ""}${shownWord(line, work, i)}`));
  return `${out.join(" ")}${work.gaps[line.words.length] || ""}`;
}

export function punctCorrect(line, work) {
  const key = parsePunct(line.answer);
  const gapsOk = key.gaps.every((g, i) => (work.gaps[i] || "") === g);
  const wordsOk = key.words.every((w, i) => shownWord(line, work, i) === w);
  return gapsOk && wordsOk;
}

/**
 * Why a punctuation attempt is not right yet, as [en, es]. Names the KIND of problem, never the position,
 * so feedback teaches the rule without placing the marks for the learner.
 */
export function diagnose(line, work) {
  const key = parsePunct(line.answer);
  const mine = key.gaps.map((_, i) => work.gaps[i] || "");
  const count = (list, m) => list.join("").split(m).length - 1;
  if (mine.some((g) => /”[,.!?]/.test(g)) && key.gaps.some((g) => /[,.!?]”/.test(g)))
    return [
      "In English, a comma, question mark or exclamation point that ends the spoken words goes inside the closing quotation mark.",
      "En inglés, la coma, el signo de interrogación o de exclamación que termina las palabras dichas va antes de las comillas de cierre.",
    ];
  if (count(mine, "“") !== count(key.gaps, "“") || count(mine, "”") !== count(key.gaps, "”"))
    return [
      "Check your quotation marks. They come in pairs: one before the first spoken word and one after the last spoken word.",
      "Revisa las comillas. Van en pares: unas antes de la primera palabra dicha y otras después de la última.",
    ];
  if (!key.words.every((w, i) => shownWord(line, work, i) === w))
    return [
      "Check your capital letters. The first word someone says starts with a capital letter, and the word “I” is always a capital.",
      "Revisa las mayúsculas. La primera palabra que alguien dice empieza con mayúscula, y la palabra “I” siempre va con mayúscula.",
    ];
  if (!/[.!?]/.test(mine[mine.length - 1]))
    return [
      "Every sentence needs an end mark. Look at the very end of the line.",
      "Toda oración necesita un signo al final. Mira el final de la línea.",
    ];
  if (count(mine, ",") !== count(key.gaps, ","))
    return [
      "Check your commas. A comma separates the spoken words from the words that tell who is talking.",
      "Revisa las comas. La coma separa las palabras dichas de las palabras que dicen quién habla.",
    ];
  return [
    "Some marks are in the wrong spot. Read the line aloud and listen for where the talking starts and stops.",
    "Algunos signos están en el lugar equivocado. Lee la línea en voz alta y escucha dónde empieza y termina lo que se dice.",
  ];
}

/** Marks the tray offers: everything the key needs, plus distractors by support mode (fewer at A, all at C). */
export function trayFor(line, sup) {
  const need = new Set(parsePunct(line.answer).gaps.join("").split(""));
  const extra = MARKS.filter((m) => !need.has(m));
  const add = sup.key === "C" ? extra.length : sup.key === "B" ? 2 : 1;
  const keep = new Set([...need, ...extra.slice(0, add)]);
  return MARKS.map((m, i) => ({ m, i })).filter((x) => keep.has(x.m));
}

/** The finished line for the storyboard, in English. */
export const finalLine = (line) =>
  line.kind === "punct" ? line.answer : line.text.replace("___", line.answer);

/** Generic hint ladders by kind (the authored clue is slotted in as hint 2). */
export const KIND_HINTS = {
  punct: [
    [
      "Find the words someone says out loud. Only those words go inside quotation marks.",
      "Busca las palabras que alguien dice en voz alta. Solo esas palabras van entre comillas.",
    ],
    null,
    [
      "The mark that ends the spoken words goes inside the closing quotation mark, and the words that tell who is talking come after it.",
      "El signo que termina las palabras dichas va dentro de las comillas de cierre, y las palabras que dicen quién habla van después.",
    ],
  ],
  connector: [
    [
      "Read both parts of the sentence. Is the second part a reason, a result, a surprise or an ending?",
      "Lee las dos partes de la oración. ¿La segunda parte es una razón, un resultado, una sorpresa o un final?",
    ],
    null,
    [
      "Read the sentence aloud with each word in the gap. Keep the one that makes the ideas connect.",
      "Lee la oración en voz alta con cada palabra en el espacio. Quédate con la que conecta las ideas.",
    ],
  ],
  verb: [
    [
      "A precise verb shows exactly how the action happens. It has to match the rest of the sentence.",
      "Un verbo preciso muestra exactamente cómo pasa la acción. Tiene que coincidir con el resto de la oración.",
    ],
    null,
    [
      "Cross out any verb that means the opposite of the clue words.",
      "Descarta cualquier verbo que signifique lo contrario de las palabras pista.",
    ],
  ],
};

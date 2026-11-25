// Ask the passage: a question is answered ONLY by pointing at the sentence in the passage that best matches it.
// Nothing is generated. If no sentence shares enough meaningful words with the question, the tool says so and
// refuses to guess. Pure and deterministic, so the same fallback serves when the optional AI layer is off.
const STOP = new Set("a an the is are was were be been do does did of to in on at for and or but with by from as it its this that these those what who whom whose which when where why how can could would should will you your they them their he she his her we our i me my not no yes if then so than about into over under up down out".split(" "));
const words = (s) => (String(s).toLowerCase().match(/[a-z0-9']+/g) || []).map((w) => w.replace(/'s$/, "")).filter((w) => w && !STOP.has(w));
const stem = (w) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);

export const splitSentences = (passage) => String(passage).replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];

export const MIN_OVERLAP = 1;

export function askPassage(passage, question) {
  const sentences = splitSentences(passage);
  const q = new Set(words(question).map(stem));
  if (!q.size) return { refused: true, reason: "no-question" };
  let best = { index: -1, score: 0 };
  sentences.forEach((s, index) => {
    const hit = new Set(words(s).map(stem));
    let score = 0;
    for (const w of q) if (hit.has(w)) score += 1;
    if (score > best.score) best = { index, score };
  });
  if (best.score < MIN_OVERLAP || best.score / q.size < 0.34) return { refused: true, reason: "not-in-passage" };
  return { refused: false, index: best.index, evidence: sentences[best.index], matched: best.score };
}

export const REFUSAL = {
  "no-question": { en: "Type a question about the passage first.", es: "Primero escribe una pregunta sobre la lectura." },
  "not-in-passage": {
    en: "I can't find that in this passage, so I won't guess. Try asking with words from the text, or ask your teacher.",
    es: "No encuentro eso en esta lectura, así que no voy a adivinar. Prueba con palabras del texto o pregunta a tu maestro.",
  },
};

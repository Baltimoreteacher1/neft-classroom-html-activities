// Guided practice (Language Intelligence Engine): one short, targeted try between the feedback and the revision,
// built from the learner's OWN sentences and the one next step they were given. Pure; runs in Node.
//
// Rules: it is practice, so it is always "supported" and never a result; it is checked by a visible rule (a joining
// word is there, the sentence grew, the broad word is gone), never by whether the idea is true; it can be skipped.
import { CONNECTORS, COORDINATORS, SUBORDINATORS } from "../lang/lexicon.js";
import { purposeMoves } from "../lang/purpose.js";
import { findPhrase, isStop, sentences, stem, tokenize } from "../lang/text.js";

const JOINERS = [...new Set([...CONNECTORS.cause, ...CONNECTORS.contrast, ...SUBORDINATORS, ...COORDINATORS])].filter((w) => !["that", "which", "who", "for"].includes(w));
const REASON = ["because", "since", "so", "so that", "as a result", "therefore", "when", "if"];
const content = (t) => new Set(tokenize(t).filter((w) => !isStop(w.lower) && w.lower.length > 2).map((w) => stem(w.lower)));
const shares = (a, b) => [...content(a)].some((w) => content(b).has(w));
const has = (t, list) => list.some((w) => findPhrase(t, w).length);
const words = (t) => tokenize(t).length;

const PROMPTS = {
  combine: ["Join these two sentences of yours into one sentence. Use a joining word such as because, so, but or although.", "Une estas dos oraciones tuyas en una sola. Usa una palabra de enlace como because, so, but o although."],
  because: ["Add a reason to this sentence of yours. Keep your words and add because ...", "Agrega una razón a esta oración tuya. Conserva tus palabras y agrega because ..."],
  word: ["Write this sentence again with a more exact word in place of the marked one.", "Escribe otra vez esta oración con una palabra más exacta en lugar de la marcada."],
  move: ["Write one sentence that does this.", "Escribe una oración que haga esto."],
  more: ["Add one detail to this sentence of yours: when, where, why or an example.", "Agrega un detalle a esta oración tuya: cuándo, dónde, por qué o un ejemplo."],
  first: ["Write one sentence with your first idea.", "Escribe una oración con tu primera idea."],
};
const NOTES = {
  ok: ["That does it. Now use the same move in your revision.", "Así es. Ahora usa el mismo recurso en tu revisión."],
  empty: ["Write your sentence first.", "Primero escribe tu oración."],
  joiner: ["Look for a joining word such as because, so, but or although between the two ideas.", "Busca una palabra de enlace como because, so, but o although entre las dos ideas."],
  both: ["Keep the idea from both of your sentences in the new one.", "Conserva la idea de tus dos oraciones en la nueva."],
  reason: ["Add a reason with because, so or when.", "Agrega una razón con because, so o when."],
  keep: ["Keep your own sentence and build on it.", "Conserva tu oración y amplíala."],
  grow: ["Add a few more words: a detail, a reason or an example.", "Agrega unas palabras más: un detalle, una razón o un ejemplo."],
  swap: ["The broad word is still there. Which exact word says what you mean?", "La palabra general sigue ahí. ¿Qué palabra exacta dice lo que quieres decir?"],
  move: ["Not yet. Read the next step once more and try one sentence that does it.", "Todavía no. Lee otra vez el siguiente paso e intenta una oración que lo haga."],
};

/**
 * @param {object} feedback a buildFeedback result
 * @param {string} text the learner's response
 * @param {{keyUse?:string}} [opts]
 * @returns {{kind:"combine"|"because"|"word"|"move"|"more"|"first", prompt:[string,string], given:string[], target:string, moveId:string, keyUse:string}}
 */
export function buildPractice(feedback, text, { keyUse = "Explain" } = {}) {
  const src = String(text || "");
  const sents = sentences(src).map((s) => s.text);
  const step = feedback?.nextStep || { id: "", quote: "" };
  const make = (kind, given = [], target = "", moveId = "") => ({ kind, prompt: [...PROMPTS[kind]], given, target, moveId, keyUse });
  if (!sents.length) return make("first");
  if (step.id === "precise-words" && step.quote) {
    const host = sents.find((s) => s.includes(step.quote));
    if (host) return make("word", [host], step.quote);
  }
  if (["combine", "link-ideas"].includes(step.id) && sents.length >= 2) {
    // Two neighbours that are short and not already joined make the clearest pair.
    let i = sents.findIndex((s, k) => k + 1 < sents.length && words(s) <= 14 && words(sents[k + 1]) <= 14 && !has(s, JOINERS) && !has(sents[k + 1], JOINERS));
    if (i < 0) i = 0;
    return make("combine", [sents[i], sents[i + 1]]);
  }
  if (step.id.startsWith("move-")) {
    const moveId = step.id.slice(5);
    if (["cause", "reason"].includes(moveId)) return make("because", [sents.find((s) => !has(s, REASON)) || sents[0]]);
    return make("move", [], "", moveId);
  }
  const plain = sents.find((s) => !has(s, REASON) && words(s) <= 14);
  if (["develop", "expand"].includes(step.id) && plain) return make("because", [plain]);
  return make("more", [step.quote && sents.find((s) => s.includes(step.quote)) || sents[0]]);
}

/** @returns {{ok:boolean, note:[string,string]}} */
export function checkPractice(practice, input) {
  const t = String(input || "").trim();
  const no = (k) => ({ ok: false, note: [...NOTES[k]] });
  if (!practice || words(t) < 2) return no("empty");
  const [a, b] = practice.given || [];
  switch (practice.kind) {
    case "combine":
      if (!has(t, JOINERS)) return no("joiner");
      if (!shares(t, a) || !shares(t, b)) return no("both");
      break;
    case "because":
      if (!has(t, REASON)) return no("reason");
      if (a && !shares(t, a)) return no("keep");
      break;
    case "word":
      if (findPhrase(t, practice.target).length) return no("swap");
      if (a && !shares(t, a)) return no("keep");
      break;
    case "move": {
      const m = purposeMoves(t, practice.keyUse, { words: words(t) }).moves.find((x) => x.id === practice.moveId);
      if (words(t) < 4 || (m && !m.present && m.id !== "phenomenon" && m.id !== "topic")) return no("move");
      break;
    }
    case "more":
      if (a && !shares(t, a)) return no("keep");
      if (words(t) < words(a || "") + 2) return no("grow");
      break;
    default:
      if (words(t) < 3) return no("grow");
  }
  return { ok: true, note: [...NOTES.ok] };
}

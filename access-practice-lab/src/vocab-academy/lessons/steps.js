// Vocabulary Academy — the steps of the eight sections of a lesson (a: the word list, b–g: Exercises A–F in the order
// of a Wordly Wise-style lesson, h: the lesson review), composed from one lesson file. Pure: no DOM, no storage.
// A step is { id, kind, title:[en,es], ...payload }; src/vocab-academy/lessons/kinds/* render each kind.
// Every section is usable alone (nothing reads another section's results) and the eight form a sequence.
import { bandOfGrade, LESSONS } from "../contract.js";
import { rngFor } from "../rng.js";
import {
  analogyItems, antonymItem, clozeItem, defToWordItem, evidenceItem, findMeaningItem, fitItem, groupItem,
  morphItem, orderItem, passageItem, senseItem, synonymItem, wordToDefItem, wordsInText,
} from "./items.js";

export const GOALS = {
  a: ["Study the words: hear each one, say it, read what it means, and see it in a sentence.", "Estudia las palabras: escucha cada una, dila, lee qué significa y mírala en una oración."],
  b: ["Find the true meaning of each word: build the one sentence that is true, then match words and meanings.", "Encuentra el significado verdadero de cada palabra: forma la única oración verdadera y une palabras y significados."],
  c: ["Choose just the right word to complete each sentence.", "Elige la palabra justa para completar cada oración."],
  d: ["Decide when each word is used correctly, and sort the words by meaning.", "Decide cuándo se usa bien cada palabra y clasifica las palabras por significado."],
  e: ["Study how the words connect: same and opposite, word pairs, shades of meaning, and word parts.", "Estudia cómo se conectan las palabras: iguales y opuestas, pares, matices y partes de palabras."],
  f: ["Read a passage that uses the words, then answer questions about it.", "Lee una lectura que usa las palabras y responde preguntas sobre ella."],
  g: ["Use the words yourself: write sentences, talk about them, and write about the passage.", "Usa tú las palabras: escribe oraciones, conversa sobre ellas y escribe sobre la lectura."],
  h: ["Show what you know about these words and find out what to practice next.", "Muestra lo que sabes de estas palabras y descubre qué practicar después."],
};
export const lessonMeta = (letter) => LESSONS.find((l) => l.id === letter);

const T = (en, es) => [en, es];
const take = (items, n) => items.filter(Boolean).slice(0, n);
const early = (unit) => bandOfGrade(String(unit.grade)) === "early";

/** Step shell for a runner of choice items; skipped by the caller when fewer than `min` items exist. */
const itemsStep = (id, title, items, extra = {}) => ({ id, kind: "items", title, items, ...extra });

// ── A ───────────────────────────────────────────────────────────────────────────────────────────────────────
function lessonA(unit) {
  return unit.words.map((word, i) => {
    const rng = rngFor(`${unit.id}:a:${word.id}`);
    const check = (i % 2 ? wordToDefItem : defToWordItem)(unit, word, rng, "A") || defToWordItem(unit, word, rng, "A");
    return { id: `a-${word.id}`, kind: "card", title: T(`Word ${i + 1}: ${word.hw}`, `Palabra ${i + 1}: ${word.hw}`), wordId: word.id, n: i + 1, total: unit.words.length, check };
  });
}

// ── Exercise A: Finding Meanings ───────────────────────────────────────────────────────────────────────────
function lessonB(unit) {
  const rng = rngFor(`${unit.id}:b`);
  const W = unit.words;
  const find = W.map((w) => findMeaningItem(unit, w, rng, "B") || defToWordItem(unit, w, rng, "B"));
  const match = W.map((w, i) => (i % 2 ? wordToDefItem : defToWordItem)(unit, w, rng, "B2"));
  return [
    itemsStep("b-find", T("Build the true sentence", "Forma la oración verdadera"), take(find, 10), { engine: ["finding-meanings"] }),
    itemsStep("b-match", T("Match words and meanings", "Une palabras y significados"), take(match, 10), { engine: ["match", "matching", "meaning-match"] }),
  ].filter((s) => s.items.length >= 2);
}

// ── Exercise B: Just the Right Word ────────────────────────────────────────────────────────────────────────
function lessonC(unit) {
  const rng = rngFor(`${unit.id}:c`);
  const W = unit.words;
  const first = W.map((w) => clozeItem(unit, w, rng, "C", 1));
  const second = W.map((w) => clozeItem(unit, w, rng, "C", 2));
  const senses = W.flatMap((w) => [senseItem(unit, w, rng, "C", 0), senseItem(unit, w, rng, "C", 1)]);
  return [
    itemsStep("c-right-word", T("Complete each sentence", "Completa cada oración"), take(first, 10), { engine: ["cloze", "just-the-right-word"] }),
    itemsStep("c-more", T("More sentences to complete", "Más oraciones para completar"), take(second, 10), { engine: ["cloze"] }),
    itemsStep("c-senses", T("More than one meaning", "Más de un significado"), take(senses, 6), { engine: ["multiple-meaning", "senses"] }),
  ].filter((s) => s.items.length >= 2);
}

// ── Exercise C: Applying Meanings ──────────────────────────────────────────────────────────────────────────
function lessonD(unit) {
  const rng = rngFor(`${unit.id}:d`);
  const W = unit.words;
  const examples = W.map((w, i) => fitItem(unit, w, rng, "D", { useMisuse: i % 2 === 1, variant: i % 2 ? 1 : 2 }));
  const groups = W.map((w) => groupItem(unit, w, rng, "D"));
  const rel = unit.relations?.groups || [];
  return [
    itemsStep("d-examples", T("Is the word used correctly?", "¿Se usa bien la palabra?"), take(examples, 10), { engine: ["example", "non-example", "fit"] }),
    rel.length >= 2 ? { id: "d-sort", kind: "sort", title: T("Sort the words", "Clasifica las palabras"), groups: rel, wordIds: rel.flatMap((g) => g.ids) } : null,
    itemsStep("d-groups", T("Which group does it belong in?", "¿En qué grupo va?"), take(groups, 10), { engine: ["sort", "categorize"] }),
  ].filter((s) => s && (s.kind === "sort" || s.items.length >= 2));
}

// ── Exercise D: Word Study ─────────────────────────────────────────────────────────────────────────────────
function lessonE(unit) {
  const rng = rngFor(`${unit.id}:e`);
  const syn = unit.words.flatMap((w) => [synonymItem(unit, w, rng, "E"), antonymItem(unit, w, rng, "E")]);
  const shades = (unit.relations?.shades || []).map((s) => orderItem(unit, s, rng, "E"));
  const analogies = early(unit) ? [] : analogyItems(unit, rng, "E", 5);
  const hasParts = (unit.study?.parts || []).length || unit.words.some((w) => (w.morph?.segs || []).length > 1);
  const morph = unit.words.flatMap((w) => [morphItem(unit, w, rng, "E", "last"), morphItem(unit, w, rng, "E", "base")]);
  const web = unit.words.filter((w) => (w.syn?.length || 0) + (w.ant?.length || 0) + (w.family?.length || 0) >= 3).slice(0, 2);
  return [
    syn.filter(Boolean).length >= 2 ? itemsStep("e-syn", T("Same and opposite", "Iguales y opuestas"), take(syn, 10), { engine: ["synonym", "antonym"] }) : null,
    analogies.length ? itemsStep("e-analogies", T("Word pairs (analogies)", "Pares de palabras (analogías)"), take(analogies, 6), { engine: ["analogy"] }) : null,
    shades.filter(Boolean).length ? itemsStep("e-shades", T("Shades of meaning", "Matices de significado"), take(shades, 3)) : null,
    hasParts ? { id: "e-parts", kind: "study", title: T("Word parts and families", "Partes y familias de palabras"), parts: unit.study?.parts || [], focus: unit.study?.focus || "none", items: take(morph, 8) } : null,
    web.length ? { id: "e-web", kind: "web", title: T("Build a word web", "Construye una red de palabras"), wordIds: web.map((w) => w.id) } : null,
    unit.study?.task ? { id: "e-task", kind: "write", title: T("Use the word parts", "Usa las partes de las palabras"), prompts: [{ key: "study-task", prompt: unit.study.task, minWords: 8, wordIds: [] }] } : null,
  ].filter(Boolean);
}

// ── Exercise E: Reading Passage ────────────────────────────────────────────────────────────────────────────
function lessonF(unit) {
  const rng = rngFor(`${unit.id}:f`);
  const p = unit.passage || {};
  const qs = (p.qs || []).map((q) => passageItem(unit, q, "F"));
  const inPassage = unit.words.filter((w) => (p.words || []).includes(w.id));
  const evidence = inPassage.map((w) => evidenceItem(unit, w, rng, "F"));
  return [
    { id: "f-read", kind: "reader", title: T("Read the passage", "Lee la lectura") },
    itemsStep("f-questions", T("Questions about the passage", "Preguntas sobre la lectura"), take(qs, 6), { passage: true }),
    itemsStep("f-evidence", T("Find the evidence", "Busca la evidencia"), take(evidence, 4), { passage: true }),
  ].filter((s) => (s.kind === "reader" ? Boolean(p.paras?.length) : s.items.length >= 1));
}

// ── Exercise F: Using the Words ────────────────────────────────────────────────────────────────────────────
function lessonG(unit) {
  const p = unit.produce || {};
  const oral = early(unit);
  const ids = (text) => wordsInText(unit, text).map((w) => w.id);
  const sentences = (p.sentences || []).map((prompt, i) => ({ key: `sentence-${i}`, prompt, minWords: oral ? 2 : 5, wordIds: ids(prompt), oral }));
  const combine = (p.combine || []).map((c, i) => ({ key: `combine-${i}`, prompt: "", given: c.given, model: c.model, minWords: 6, wordIds: ids(c.model), reveal: true }));
  const talk = [
    ...(p.discuss || []).map((prompt, i) => ({ key: `discuss-${i}`, prompt, minWords: 5, wordIds: ids(prompt), discuss: true, oral: true })),
    p.explain ? { key: "explain", prompt: p.explain, minWords: oral ? 3 : 8, wordIds: ids(p.explain), oral } : null,
  ].filter(Boolean);
  const argue = !oral && p.argue?.prompt ? [{ key: "argue", prompt: p.argue.prompt, frame: p.argue.frame, minWords: 15, wordIds: ids(p.argue.prompt), argue: true }] : [];
  const w = unit.passage?.write;
  const looks = [...new Set((unit.check?.constructed || []).flatMap((c) => c.look || []))];
  const write = w?.prompt
    ? { id: "g-write", kind: "write", title: T("Write about the passage", "Escribe sobre la lectura"), looks, prompts: [{ key: "write", prompt: w.prompt, frame: w.frame, minWords: oral ? 4 : 30, wordIds: unit.words.map((x) => x.id), useCount: 3 }] }
    : null;
  return [
    sentences.length ? { id: "g-sentences", kind: "write", title: T("Write your own sentences", "Escribe tus propias oraciones"), prompts: sentences } : null,
    combine.length ? { id: "g-combine", kind: "write", title: T("Combine sentences", "Combina oraciones"), prompts: combine } : null,
    talk.length ? { id: "g-talk", kind: "write", title: T("Explain and discuss", "Explica y conversa"), prompts: talk } : null,
    argue.length ? { id: "g-argue", kind: "write", title: T("Argue a position", "Defiende una postura"), prompts: argue } : null,
    write,
    write ? { id: "g-revise", kind: "revise", title: T("Revise your writing", "Revisa tu escritura"), looks, fromKey: "g-write", prompts: [{ key: "revise", prompt: "", minWords: oral ? 4 : 30, wordIds: [] }] } : null,
  ].filter(Boolean);
}

// ── H ───────────────────────────────────────────────────────────────────────────────────────────────────────
const lessonH = () => [
  { id: "h-form-a", kind: "assess", part: "A", title: T("Check your word knowledge: form A", "Comprueba lo que sabes: forma A") },
  { id: "h-evidence", kind: "assess", part: "evidence", title: T("What the evidence shows", "Lo que muestra la evidencia") },
  { id: "h-practice", kind: "assess", part: "practice", title: T("Explain and practice", "Explica y practica") },
  { id: "h-form-b", kind: "assess", part: "B", title: T("Parallel form B", "Forma paralela B") },
  { id: "h-growth", kind: "assess", part: "growth", title: T("See your growth", "Mira tu crecimiento") },
];

const BUILDERS = { a: lessonA, b: lessonB, c: lessonC, d: lessonD, e: lessonE, f: lessonF, g: lessonG, h: lessonH };

/** The ordered steps of one section (a–h) of one lesson. */
export function buildSteps(letter, unit) {
  const build = BUILDERS[letter];
  if (!build) return [];
  return build(unit).filter(Boolean);
}

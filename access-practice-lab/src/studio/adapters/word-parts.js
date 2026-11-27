// Adapter: Vocabulary word-part builders (src/content/vocabulary-items.js, a pure data module): per grade band,
// eighteen words built from prefixes, roots and suffixes, each with the parts that build it, the part choices, what
// every part means and a context sentence. A band becomes the words (meaning = the meanings of their parts), matching,
// and one select-the-parts question per word whose key is the source's own parts. Loaded on demand.

import { labActivity } from "./lab-parts.js";
import { matchQuestions, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const load = async () => (await import("../../content/vocabulary-items.js")).VOCABULARY_ITEMS;
const URL = "/access-practice-lab/vocabulary";

const meaningOf = (item) =>
  list(item.parts)
    .map((p) => `${text(p)} (${text(item.meanings?.[p])})`)
    .join(" + ");

function partsQuestion(item, n) {
  const options = list(item.choices).map((c, i) => ({ id: `o${i + 1}`, text: text(c) }));
  return {
    type: "question",
    id: `b${n}`,
    format: "multi",
    prompt: `${text(item.prompt)} Choose the word parts that build it.`,
    options,
    answers: options.filter((o) => list(item.parts).includes(o.text)).map((o) => o.id),
    hint: `Read the sentence: ${text(item.context)}`.slice(0, 400),
    explanation: `${text(item.word)} = ${meaningOf(item)}`.slice(0, 800),
    skill: text(item.focus).slice(0, 80),
  };
}

export default {
  family: "word-parts",
  label: t("Word-part builders", "Constructores de partes de palabras"),
  note: t(
    "Copies a grade band's word-part words into practice you can edit: the words with the meanings of their parts, matching, and a choose-the-parts question for each word.",
    "Copia las palabras con partes de una banda de grados en una práctica que puede editar: las palabras con el significado de sus partes, emparejar y una pregunta de elegir las partes para cada palabra.",
  ),
  editable: [
    "title",
    "description",
    "vocab",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "hints",
    "explanations",
  ],
  fixed: [
    {
      what: t(
        "The word sprint, weekly goal and part tiles",
        "La carrera de palabras, la meta semanal y las fichas de partes",
      ),
      why: t(
        "These are features of the Vocabulary page; the copy keeps the words, parts and meanings.",
        "Son funciones de la página de Vocabulario; la copia conserva las palabras, las partes y los significados.",
      ),
    },
    {
      what: t("Spanish", "Español"),
      why: t(
        "The word-part items have no Spanish in the source, so the copy has none either.",
        "Los ejercicios de partes de palabras no tienen español en la fuente, así que la copia tampoco lo tiene.",
      ),
    },
  ],

  async list() {
    return Object.entries(await load()).map(([band, items]) => ({
      id: band,
      title: `Word parts, grades ${band}`,
      grade: band,
      subject: "",
      domain: "Vocabulary",
      description: list(items)
        .map((i) => text(i.word))
        .join(", "),
      count: list(items).length,
    }));
  },

  url: () => URL,

  async extract(ref) {
    const items = list((await load())[ref]);
    if (!items.length) throw new Error("not-found");
    const vocab = items.map((i) => ({
      term: text(i.word),
      def: meaningOf(i),
      es: "",
      example: text(i.context),
    }));
    const fitted = vocabBlock(vocab);
    return {
      activity: labActivity({
        title: `Word parts, grades ${ref}`,
        description: "Build words from prefixes, roots and suffixes.",
        grade: ref,
        curriculum: "Language Page Vocabulary",
        objective: "Use the meanings of word parts to build and understand academic words.",
        sourceNote: `Copied from the Vocabulary word-part items for grades ${ref}.`,
        template: "match-sort",
        blocks: [
          fitted.block,
          ...noteBlocks("vocab", fitted.extra),
          ...matchQuestions(vocab),
          ...items.map((it, n) => partsQuestion(it, n + 1)),
        ],
        teacher: `Copied from the Vocabulary page word-part items, grades ${ref} (${items.length} words).`,
      }),
      notes: [
        t(
          "Not carried: the word sprint, the weekly goal and the order of the part tiles (the copy asks which parts build the word).",
          "No se conserva: la carrera de palabras, la meta semanal ni el orden de las fichas (la copia pregunta qué partes forman la palabra).",
        ),
      ],
      source: items,
      url: URL,
      sourceTitle: `Word parts ${ref}`,
    };
  },
};

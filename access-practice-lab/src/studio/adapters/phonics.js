// Adapter: Phonics Path lessons (src/sor/sequence.js over src/content/phonics/level-*.js, pure data modules; the
// Science of Reading lesson player at /science-of-reading/lesson/<id>). A lesson becomes its sound cards, the build
// step (letters in order), the read step (which word has this meaning), the sort, the spelling word, the decodable
// passage with its question, and the dictation sentence. Every word, meaning and sentence is the lesson's own.
// Loaded on demand so the Create panel stays light.

import { fitNote, labActivity, passageBlocks, textBlocks } from "./lab-parts.js";
import { openQuestion } from "./vocab-parts.js";
import { list, t, text } from "./util.js";

const load = async () => (await import("../../sor/sequence.js")).READING_LESSONS;
const urlFor = (ref) => `/access-practice-lab/science-of-reading/lesson/${ref}`;

/** Letters (spelling units) in order, when they are distinct enough to grade an order question. */
function buildQuestion(step) {
  const units = list(step?.units).map(text);
  if (units.length < 2 || new Set(units).size !== units.length) return null;
  return {
    type: "question",
    id: "build",
    format: "order",
    prompt: `Build the word that means "${text(step.meaning)}". Put the spellings in order.`,
    items: units.map((u, i) => ({ id: `i${i + 1}`, text: u })),
    explanation: `${text(step.word)}: ${units.join(" - ")} (${list(step.sounds).join(" ")})`,
    skill: "encoding",
  };
}

function readQuestion(step) {
  const choices = list(step?.choices).map(text);
  const at = choices.indexOf(text(step?.word));
  if (choices.length < 2 || at < 0 || new Set(choices).size !== choices.length) return null;
  return {
    type: "question",
    id: "read",
    format: "choice",
    prompt: `Read the words. Which word means "${text(step.meaning)}"?`,
    options: choices.map((c, i) => ({ id: `o${i + 1}`, text: c })),
    answer: `o${at + 1}`,
    explanation: `${text(step.word)} means ${text(step.meaning)}.`,
    skill: "decoding",
  };
}

function sortQuestion(sort) {
  const a = sort?.a;
  const b = sort?.b;
  if (!a || !b) return null;
  const items = [
    ...list(a.words).map((w) => [w, "ca"]),
    ...list(b.words).map((w) => [w, "cb"]),
  ].map(([w, c], i) => ({ id: `i${i + 1}`, text: text(w), category: c }));
  if (items.length < 2) return null;
  return {
    type: "question",
    id: "sort",
    format: "sort",
    prompt: "Sort the words.",
    categories: [
      { id: "ca", label: text(a.label) },
      { id: "cb", label: text(b.label) },
    ],
    items,
    explanation: `${text(a.label)}: ${text(a.rule)}. ${text(b.label)}: ${text(b.rule)}.`,
    skill: "phonics",
  };
}

const spellQuestion = (step) =>
  text(step?.word)
    ? {
        type: "question",
        id: "spell",
        format: "blank",
        prompt: `Spell the word that means "${text(step.meaning)}".`,
        text: `[[${text(step.word)}]]`,
        bank: false,
        explanation: `${text(step.word)}: ${list(step.units).join(" - ")}`,
        skill: "spelling",
      }
    : null;

/** Every block for a lesson; exported shape is the question list the tests count. */
export function lessonBlocks(l) {
  const cards = list(l.cards)
    .map((c) => `${text(c.g)} says ${text(c.sound)}, as in ${text(c.key)}`)
    .join("\n");
  const blocks = [
    ...textBlocks("cards", `Sounds and spellings in this lesson:\n${cards}`),
    buildQuestion(l.build),
    readQuestion(l.read),
    sortQuestion(l.sort),
    spellQuestion(l.spell),
  ];
  if (text(l.passage)) {
    blocks.push(...passageBlocks("passage", "Read", [l.passage]));
    if (text(l.question))
      blocks.push(
        openQuestion({
          id: "passage-q",
          prompt: text(l.question),
          kind: "write",
          rubric: list(l.answerWords).length
            ? [
                `My answer uses the word${l.answerWords.length > 1 ? "s" : ""} ${list(l.answerWords).join(", ")}.`,
              ]
            : [],
        }),
      );
  }
  if (text(l.dictation?.sentence))
    blocks.push(
      {
        type: "audio",
        id: "dictation-audio",
        say: text(l.dictation.sentence),
        label: "Dictation sentence",
      },
      openQuestion({
        id: "dictation",
        prompt: "Listen to the sentence. Write it.",
        kind: "write",
        sample: text(l.dictation.sentence),
      }),
    );
  return blocks.filter(Boolean);
}

export default {
  family: "phonics",
  label: t("Phonics Path lessons", "Lecciones de la Ruta de fonética"),
  note: t(
    "Copies a phonics lesson into practice you can edit: the sound cards, building, reading and spelling words, the sort, the decodable passage and the dictation.",
    "Copia una lección de fonética en una práctica que puede editar: las tarjetas de sonidos, formar, leer y deletrear palabras, la clasificación, el texto decodificable y el dictado.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "audio",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Sound boxes, letter tiles and spoken sounds",
        "Cajas de sonidos, fichas de letras y sonidos hablados",
      ),
      why: t(
        "The Phonics Path player draws the sound boxes and says each sound; the copy keeps the words and their spellings.",
        "El reproductor de la Ruta de fonética dibuja las cajas y dice cada sonido; la copia conserva las palabras y su ortografía.",
      ),
    },
    {
      what: t("Spanish", "Español"),
      why: t(
        "Phonics lessons teach English sound-spelling patterns and have no Spanish in the source.",
        "Las lecciones de fonética enseñan patrones de sonido y ortografía del inglés y no tienen español en la fuente.",
      ),
    },
  ],

  async list() {
    return (await load()).map((l) => ({
      id: l.id,
      title: text(l.title),
      grade: text(l.levelTitle),
      subject: "",
      domain: "Reading",
      description: `${text(l.unit)}: ${text(l.objective)}`,
      count: lessonBlocks(l).filter((b) => b.type === "question").length,
    }));
  },

  url: urlFor,

  async extract(ref) {
    const l = (await load()).find((x) => x.id === ref);
    if (!l) throw new Error("not-found");
    const { LEVELS } = await import("../../sor/sequence.js");
    const grade = text(LEVELS.find((v) => v.level === l.level)?.grade).replace(/^Grade\s*/i, "");
    const note = fitNote([
      `Copied from Phonics Path lesson ${l.id} (${text(l.levelTitle)}, ${text(l.unit)}, lesson ${l.n}).`,
      text(l.model) && `Model: ${text(l.model)}`,
      text(l.note) && `Note: ${text(l.note)}`,
      list(l.prerequisites).length && `Before this lesson: ${list(l.prerequisites).join("; ")}`,
      list(l.exceptions).length &&
        `Words in the passage that are not decodable yet: ${list(l.exceptions).join(", ")}`,
      text(l.transfer?.word) &&
        `Transfer word: ${text(l.transfer.word)} (${text(l.transfer.meaning)})`,
      text(l.example?.word) && `Example word: ${text(l.example.word)} (${text(l.example.meaning)})`,
    ]);
    return {
      activity: labActivity({
        title: `Phonics: ${text(l.title)}`,
        description: text(l.objective),
        grade,
        subject: "Reading",
        curriculum: "Language Page Phonics Path",
        objective: text(l.objective),
        sourceNote: `Copied from Phonics Path lesson ${l.id}.`,
        template: "explore-practice",
        blocks: lessonBlocks(l),
        teacher: note.teacher,
        readAloud: Boolean(l.dictation?.sentence),
      }),
      notes: [
        t(
          "Not carried: sound boxes, letter tiles with extra letters, spoken sounds, the transfer word step and the practice stars. A word is left out of a step when its letters repeat, so the order can be graded.",
          "No se conserva: las cajas de sonidos, las fichas con letras de más, los sonidos hablados, el paso de la palabra de transferencia ni las estrellas de práctica. Una palabra se omite de un paso cuando sus letras se repiten, para poder calificar el orden.",
        ),
      ],
      source: l,
      url: urlFor(ref),
      sourceTitle: text(l.title),
    };
  },
};

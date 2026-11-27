// Adapter: Dialogue Studio (DIALOGUE_ITEMS, CLOZE_STORIES, VISUAL_FLASHCARDS, WARMUP_PROMPTS in
// src/platform/data/externalIntegrationsData.js, /dialogue-studio). The studio is one page, so it is one source (ref
// "studio"):
//   everyday dialogues -> the key phrases and the dialogue as read-aloud, then the role-play choice (its correct reply)
//   grammar stories    -> a blank question over the story, with each blank's own choices listed, and its rule
//   flashcards         -> the vocabulary block (word, meaning, example sentence, Spanish)
//   warm-ups           -> open speaking responses with their frames (never graded)

import {
  audioBlocks,
  blankFromParts,
  fitter,
  openQuestion,
  pickQuestion,
  practiceDraft,
  questionBase,
  textBlock,
  vocabItems,
  whyNot,
} from "./practice-parts.js";
import { list, t, text } from "./util.js";

const load = () => import("../../platform/data/externalIntegrationsData.js");

function dialogueBlocks(d, n, fit) {
  const choices = list(d.rolePlayChoices);
  const right = choices.find((c) => c.correct);
  const others = choices.filter((c) => !c.correct).map((c) => `"${text(c.text)}": ${text(c.feedback)}`);
  return [
    textBlock(
      `kp${n}`,
      `**${text(d.title)}** (${text(d.klu)})\nKey phrases: ${list(d.keyPhrases)
        .map((p) => `"${text(p.phrase)}" (${text(p.meaning)})`)
        .join("; ")}`,
      "body",
      fit,
    ),
    ...audioBlocks(
      `d${n}`,
      `Dialogue: ${text(d.title)}`,
      list(d.turns).map((tn) => `${text(tn.name)}: ${text(tn.text)}`),
    ),
    pickQuestion(
      fit,
      {
        id: `roleplay${n}`,
        prompt: text(d.rolePlayPrompt),
        explanation: [text(right?.feedback), whyNot(others)].filter(Boolean).join("\n\n"),
        skill: text(d.klu),
      },
      choices.map((c, i) => ({ id: `o${i + 1}`, text: fit(c.text, 400, "Reply") })),
      [`o${choices.indexOf(right) + 1}`],
    ),
  ];
}

function clozeQuestion(c, n, fit) {
  const made = blankFromParts(list(c.segments));
  return {
    ...questionBase(fit, {
      id: `story${n}`,
      prompt: `${text(c.title)} (${text(c.grammarFocus)}). Fill in each blank.\n\n${made.lead}`,
      hint: text(c.rule),
      explanation: text(c.rule),
      skill: text(c.grammarFocus),
    }),
    format: "blank",
    bank: false,
    text: fit(made.text, 4000, "Story"),
  };
}

export default {
  family: "dialogue-studio",
  label: t("Dialogue Studio", "Estudio de diálogos"),
  note: t(
    "Copies the studio's everyday dialogues, grammar stories, picture words and warm-ups into a draft you can edit.",
    "Copia los diálogos cotidianos, las historias de gramática, las palabras con imagen y los calentamientos del estudio en un borrador que puede editar.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "audio",
    "vocab",
    "prompts",
    "choices",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t("Flashcard pictures and the teacher elicit mode", "Las imágenes de las tarjetas y el modo de preguntas del docente"),
      why: t(
        "The card drawings and the elicit mode belong to the studio page; the draft keeps the words, meanings and sentences.",
        "Los dibujos de las tarjetas y el modo de preguntas pertenecen a la página; el borrador conserva las palabras, significados y oraciones.",
      ),
    },
  ],

  async list() {
    const d = await load();
    return [
      {
        id: "studio",
        title: "Dialogue Studio",
        grade: "3-8",
        subject: "",
        domain: "Speaking",
        description: "Everyday dialogues, grammar stories, picture words and warm-ups.",
        count: d.DIALOGUE_ITEMS.length + d.CLOZE_STORIES.length + d.WARMUP_PROMPTS.length,
      },
    ];
  },

  url: () => "/access-practice-lab/dialogue-studio",

  async extract(ref) {
    if (ref !== "studio") throw new Error("not-found");
    const d = await load();
    const { fit, overflow } = fitter();
    const vocab = vocabItems(
      d.VISUAL_FLASHCARDS.map((c) => ({ term: c.word, def: c.meaning, es: c.l1?.es, example: c.sentence })),
      fit,
    );
    return {
      activity: practiceDraft(fit, overflow, {
        title: "Dialogue Studio: dialogues, grammar stories and warm-ups",
        description: "Everyday academic dialogues, grammar-in-context stories, picture words and quick warm-ups.",
        grade: "3-8",
        objective: "Use key academic phrases in conversation and choose verb forms in context.",
        sourceNote: "Copied from the Dialogue Studio.",
        spanish: Boolean(vocab?.items.some((v) => v.es)),
        blocks: [
          vocab,
          ...d.DIALOGUE_ITEMS.flatMap((x, i) => dialogueBlocks(x, i + 1, fit)),
          ...d.CLOZE_STORIES.map((c, i) => clozeQuestion(c, i + 1, fit)),
          ...d.WARMUP_PROMPTS.map((w, i) =>
            openQuestion(
              fit,
              { id: `warmup${i + 1}`, prompt: `${text(w.title)} (grades ${text(w.grade)}): ${text(w.prompt)}`, frame: text(w.frame), skill: text(w.focus) },
              { kind: "explain" },
            ),
          ),
        ],
        teacher: [
          "Copied from the Dialogue Studio: everyday dialogues, grammar stories, visual flashcards and warm-ups.",
          "The flashcard Spanish comes from the card's home-language list; the other home languages stay on the studio page.",
        ],
      }),
      notes: [
        t(
          "Not carried: the flashcard pictures and pronunciation, the other home-language translations, and the teacher elicit mode.",
          "No se conserva: las imágenes y la pronunciación de las tarjetas, las traducciones a otros idiomas ni el modo de preguntas del docente.",
        ),
      ],
      source: { dialogues: d.DIALOGUE_ITEMS, stories: d.CLOZE_STORIES, cards: d.VISUAL_FLASHCARDS, warmups: d.WARMUP_PROMPTS },
      url: "/access-practice-lab/dialogue-studio",
      sourceTitle: "Dialogue Studio",
    };
  },
};

// Adapter: Subject Reading passages (src/subject-reading/content.js, a pure data module): a content-area reading
// with numbered paragraphs, three words with meanings and context sentences, and one evidence prompt. A reading
// becomes the passage, the words with matching, and the prompt as an open response; its self-check points to the
// evidence paragraph and the focus words the source names. Loaded on demand so the Create panel stays light.

import { fitNote, labActivity, passageBlocks } from "./lab-parts.js";
import { matchQuestions, openQuestion, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const load = async () => (await import("../../subject-reading/content.js")).READINGS;
const urlFor = (ref) => `/access-practice-lab/subject-reading/${ref}`;

export default {
  family: "subject-reading",
  label: t("Subject Reading passages", "Lecturas por materia"),
  note: t(
    "Copies a content-area reading into an activity you can edit: the passage, its words with meanings and examples, matching, and the evidence question.",
    "Copia una lectura de una materia en una actividad que puede editar: el texto, sus palabras con significados y ejemplos, emparejar y la pregunta de evidencia.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "passage",
    "vocab",
    "prompts",
    "pairs",
    "answerKeys",
    "hints",
    "explanations",
    "rubric",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Highlighting evidence and the reading sequence",
        "Resaltar evidencia y la secuencia de lecturas",
      ),
      why: t(
        "The reader marks evidence and moves to the next reading on the page itself; the copy keeps the text and the task.",
        "El lector marca la evidencia y pasa a la siguiente lectura en la página; la copia conserva el texto y la tarea.",
      ),
    },
    {
      what: t("Spanish", "Español"),
      why: t(
        "These readings have no Spanish in the source, so the copy has none either.",
        "Estas lecturas no tienen español en la fuente, así que la copia tampoco lo tiene.",
      ),
    },
  ],

  async list() {
    return (await load()).map((r) => ({
      id: r.id,
      title: text(r.title),
      grade: text(r.band),
      subject: text(r.subject),
      domain: "Reading",
      description: text(r.goal),
      count: list(r.vocabulary).length >= 2 ? 2 : 1,
    }));
  },

  url: urlFor,

  async extract(ref) {
    const r = (await load()).find((x) => x.id === ref);
    if (!r) throw new Error("not-found");
    const paras = list(r.paragraphs).map((p, i) => `${i + 1}. ${text(p)}`);
    const vocab = list(r.vocabulary).map((v) => ({
      term: text(v.term),
      def: text(v.meaning),
      es: "",
      example: text(v.context),
    }));
    const fitted = vocabBlock(vocab);
    const evidence = list(r.evidenceParagraphs).map((n) => Number(n) + 1);
    const rubric = [
      evidence.length &&
        `I use evidence from paragraph${evidence.length > 1 ? "s" : ""} ${evidence.join(" and ")}.`,
      list(r.focusTerms).length &&
        `I use words from the text such as ${list(r.focusTerms).map(text).join(", ")}.`,
    ].filter(Boolean);
    const note = fitNote([
      `Copied from Subject Reading ${r.id} (${text(r.subject)}, grade ${text(r.grade)}, ${text(r.complexity)}): ${text(r.title)}.`,
      `Unit: ${text(r.unit)}, reading ${r.order}.`,
    ]);
    return {
      activity: labActivity({
        title: text(r.title),
        description: text(r.goal),
        grade: r.band,
        subject: r.subject,
        curriculum: "Language Page Subject Reading",
        objective: text(r.goal),
        sourceNote: `Copied from Subject Reading ${r.id}.`,
        template: "interactive-reading",
        blocks: [
          ...passageBlocks("passage", r.title, paras),
          fitted.block,
          ...noteBlocks("vocab", fitted.extra),
          ...(vocab.length >= 2 ? matchQuestions(vocab) : []),
          openQuestion({ id: "evidence", prompt: text(r.prompt), kind: "explain", rubric }),
        ],
        teacher: note.teacher,
      }),
      notes: [
        t(
          "Not carried: evidence highlighting, the link to the next reading and the progress record.",
          "No se conserva: el resaltado de evidencia, el enlace a la siguiente lectura ni el registro de progreso.",
        ),
      ],
      source: r,
      url: urlFor(ref),
      sourceTitle: text(r.title),
    };
  },
};

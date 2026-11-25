// The editable properties an adapter can promise. Each one has a `present` test on a real draft, so an adapter can
// only list a property that actually exists in what it extracts (tools/studio-customize-adapters.test.mjs holds that).

import { t } from "./util.js";

const blocks = (a, type) => a.blocks.filter((b) => b.type === type);
const questions = (a) => blocks(a, "question");
const some = (a, fn) => questions(a).some(fn);

export const PROPERTIES = Object.freeze({
  title: { label: t("Title", "Título"), present: (a) => Boolean(a.title) },
  description: { label: t("Description", "Descripción"), present: (a) => Boolean(a.description) },
  objective: {
    label: t("Objective", "Objetivo"),
    present: (a) => Boolean(a.context.objective),
  },
  standards: {
    label: t(
      "Standards (curriculum labels kept)",
      "Estándares (etiquetas del currículo conservadas)",
    ),
    present: (a) => a.context.standards.length > 0,
  },
  directions: {
    label: t("Directions and task text", "Instrucciones y texto de la tarea"),
    present: (a) => blocks(a, "text").length > 0,
  },
  passage: {
    label: t("Reading passages and transcripts", "Lecturas y transcripciones"),
    present: (a) => blocks(a, "passage").length > 0,
  },
  table: { label: t("Tables", "Tablas"), present: (a) => blocks(a, "table").length > 0 },
  audio: {
    label: t("Read-aloud script", "Guion para leer en voz alta"),
    present: (a) => blocks(a, "audio").length > 0,
  },
  vocab: {
    label: t("Vocabulary words, meanings and Spanish", "Vocabulario, significados y español"),
    present: (a) => blocks(a, "vocab").length > 0,
  },
  prompts: {
    label: t("Question wording", "Texto de las preguntas"),
    present: (a) => questions(a).length > 0,
  },
  choices: {
    label: t("Answer choices", "Opciones de respuesta"),
    present: (a) => some(a, (q) => q.format === "choice" || q.format === "multi"),
  },
  pairs: {
    label: t("Matching pairs and sorting groups", "Pares y grupos para clasificar"),
    present: (a) => some(a, (q) => q.format === "match" || q.format === "sort"),
  },
  answerKeys: {
    label: t("Answer keys", "Claves de respuesta"),
    present: (a) => some(a, (q) => q.format !== "short"),
  },
  hints: { label: t("Hints", "Pistas"), present: (a) => some(a, (q) => Boolean(q.hint)) },
  frames: {
    label: t("Sentence frames", "Marcos de oraciones"),
    present: (a) => some(a, (q) => Boolean(q.frame)),
  },
  explanations: {
    label: t("Explanations shown after answering", "Explicaciones tras responder"),
    present: (a) => some(a, (q) => Boolean(q.explanation)),
  },
  rubric: {
    label: t(
      "Self-check rubric for open responses",
      "Rúbrica de autoevaluación de respuestas abiertas",
    ),
    present: (a) => some(a, (q) => q.format === "short" && q.rubric.length > 0),
  },
  samples: {
    label: t("Sample responses", "Respuestas de ejemplo"),
    present: (a) => some(a, (q) => q.format === "short" && Boolean(q.sample)),
  },
  openResponses: {
    label: t(
      "Open responses (speaking and writing, never auto-graded)",
      "Respuestas abiertas (oral y escrita, nunca calificadas automáticamente)",
    ),
    present: (a) => some(a, (q) => q.format === "short"),
  },
  teacherNotes: {
    label: t("Teacher notes", "Notas para el docente"),
    present: (a) => Boolean(a.notes.teacher) || blocks(a, "note").length > 0,
  },
  supports: {
    label: t(
      "Student supports (frames, hints, Spanish, read-aloud)",
      "Apoyos para estudiantes (marcos, pistas, español, lectura en voz alta)",
    ),
    present: () => true,
  },
});

export const PROPERTY_IDS = Object.freeze(Object.keys(PROPERTIES));

/** The property ids that are really present in this draft, in a stable order. */
export const presentProperties = (activity) =>
  PROPERTY_IDS.filter((id) => PROPERTIES[id].present(activity));

/** An adapter's promised properties narrowed to what this particular draft really has. */
export const editableFor = (adapter, activity) => {
  const present = new Set(presentProperties(activity));
  return adapter.editable.filter((id) => present.has(id));
};

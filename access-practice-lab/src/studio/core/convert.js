// Change the format of an activity without retyping anything: the same questions, answers and explanations become a
// worksheet, an interactive activity, a game or a quick check. The questions are untouched; only how they are
// delivered changes, and anything that cannot be the same on paper (or on screen) is reported, never hidden.

import { TEMPLATES, normalizeActivity, questionsOf } from "./schema.js";

const PAPER_NOTES = {
  hotspot: [
    "On paper, the picture is shown with lettered areas and students write the letter.",
    "En papel, la imagen se muestra con áreas con letras y los estudiantes escriben la letra.",
  ],
  identify: [
    "On paper, students circle the words in the printed text.",
    "En papel, los estudiantes encierran las palabras en el texto impreso.",
  ],
  numberline: [
    "On paper, students mark a printed number line.",
    "En papel, los estudiantes marcan una recta numérica impresa.",
  ],
  plot: [
    "On paper, students plot on a printed grid.",
    "En papel, los estudiantes marcan puntos en una cuadrícula impresa.",
  ],
  sort: [
    "On paper, students write each item under its group.",
    "En papel, los estudiantes escriben cada elemento bajo su grupo.",
  ],
  order: [
    "On paper, students number the items in order.",
    "En papel, los estudiantes numeran los elementos en orden.",
  ],
  build: [
    "On paper, students write the sentence from the word cards.",
    "En papel, los estudiantes escriben la oración con las tarjetas de palabras.",
  ],
  match: [
    "On paper, students write the letter of each match.",
    "En papel, los estudiantes escriben la letra de cada pareja.",
  ],
};

const DEFAULT_TEMPLATE = {
  interactive: "explore-practice",
  worksheet: "guided",
  game: "quest",
  check: "skill-check",
};
const DEFAULT_STYLE = {
  interactive: "calm",
  worksheet: "classic",
  game: "adventure",
  check: "calm",
};

/**
 * @returns {{ activity: object, notes: {en: string, es: string}[] }} notes describe what changes about delivery.
 */
export function convertActivity(activity, toKind, template = "") {
  const notes = [];
  const qs = questionsOf(activity);
  if (toKind === "worksheet") {
    for (const f of new Set(qs.map((q) => q.format)))
      if (PAPER_NOTES[f]) notes.push({ en: PAPER_NOTES[f][0], es: PAPER_NOTES[f][1] });
    if (qs.some((q) => q.format === "short"))
      notes.push({
        en: "Written responses get ruled lines for writing.",
        es: "Las respuestas escritas tienen líneas para escribir.",
      });
  }
  if (toKind === "game" && qs.length < 3)
    notes.push({
      en: "A game needs at least three questions.",
      es: "Un juego necesita al menos tres preguntas.",
    });
  if (toKind === "check" && (qs.length < 3 || qs.length > 6))
    notes.push({
      en: "Quick checks usually have three to six questions.",
      es: "Las revisiones rápidas suelen tener de tres a seis preguntas.",
    });
  if (activity.kind === "worksheet" && toKind !== "worksheet")
    notes.push({
      en: "Answers are checked on screen with hints and a chance to revise.",
      es: "Las respuestas se comprueban en pantalla con pistas y una oportunidad de corregir.",
    });
  const next = normalizeActivity({
    ...activity,
    kind: toKind,
    template: TEMPLATES[toKind].some((t) => t.id === template)
      ? template
      : DEFAULT_TEMPLATE[toKind],
    look: {
      ...activity.look,
      style:
        activity.look.style === DEFAULT_STYLE[activity.kind]
          ? DEFAULT_STYLE[toKind]
          : activity.look.style,
    },
    options: { ...activity.options, answerKey: true },
  });
  return { activity: next, notes };
}

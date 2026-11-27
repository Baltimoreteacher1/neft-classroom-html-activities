// The list of language supports an activity can take: what each one is called, what it adds, where it goes, and the
// plain reason it is unavailable. Wording of the added text is in language-support-text.js; the builders are in
// language-support.js. Unavailable reasons are teacher-facing, in English and Spanish.

import { pair } from "../core/differentiate-util.js";
import { LIMITS } from "../core/schema.js";

/** Placement: where an added block goes among the existing ones (never inside the questions). */
export const PLACE = { start: "start", beforeQuestions: "beforeQuestions", end: "end" };

const NEEDS_CONTEXT = pair(
  "It needs a vocabulary word or a known math topic, and this activity has neither. Nothing generic was written.",
  "Necesita una palabra de vocabulario o un tema de matemáticas conocido, y esta actividad no tiene ninguno. No se escribió nada genérico.",
);
const NEEDS_QUESTION = pair(
  "It needs at least one question in the activity.",
  "Necesita al menos una pregunta en la actividad.",
);
const NEEDS_WRITING = pair(
  "It needs a written-response question (short answer) in the activity.",
  "Necesita una pregunta de respuesta escrita (respuesta corta) en la actividad.",
);

const hasContext = (c) => !c.terms.length && !c.topic && NEEDS_CONTEXT;
const needsQuestion = (c) => !c.questions.length && NEEDS_QUESTION;
const needsWriting = (c) => !c.hasShort && NEEDS_WRITING;

export const OPTIONS = Object.freeze([
  {
    id: "visual-vocabulary",
    adds: "setting",
    label: pair("Visual vocabulary", "Vocabulario visual"),
    what: pair(
      "Shows the pictures already in your word list beside each word. Nothing new is drawn.",
      "Muestra las imágenes que ya están en tu lista de palabras junto a cada palabra. No se dibuja nada nuevo.",
    ),
    unmet: (c, a) =>
      a.supports.visuals
        ? pair(
            "Pictures with new words are already on.",
            "Las imágenes con palabras nuevas ya están activadas.",
          )
        : !c.images &&
          pair(
            "No word in this activity has a picture yet.",
            "Ninguna palabra de esta actividad tiene imagen todavía.",
          ),
  },
  {
    id: "language-objective",
    adds: "text",
    place: PLACE.start,
    label: pair("Academic language objective", "Objetivo de lenguaje académico"),
    what: pair(
      "A short language goal that names this activity's own words and topic.",
      "Una meta de lenguaje breve que nombra las palabras y el tema de esta actividad.",
    ),
    unmet: hasContext,
  },
  {
    id: "sentence-frames",
    adds: "text",
    place: PLACE.beforeQuestions,
    label: pair("Sentence frames", "Marcos de oraciones"),
    what: pair(
      "Up to three frames that fit the kinds of questions this activity asks.",
      "Hasta tres marcos que se ajustan a los tipos de preguntas de esta actividad.",
    ),
    unmet: needsQuestion,
  },
  {
    id: "because-but-so",
    adds: "text",
    place: PLACE.beforeQuestions,
    label: pair("Because, but, so", "Porque, pero, así que"),
    what: pair(
      "Three sentence starters (because, but, so) about the first word or the topic.",
      "Tres inicios de oración (porque, pero, así que) sobre la primera palabra o el tema.",
    ),
    unmet: hasContext,
  },
  {
    id: "sentence-expansion",
    adds: "question",
    place: PLACE.end,
    label: pair("Sentence expansion", "Ampliar oraciones"),
    what: pair(
      "A written task that stretches a sentence taken from your own example or reading.",
      "Una tarea escrita que amplía una oración tomada de tu ejemplo o tu lectura.",
    ),
    unmet: (c) =>
      !c.kernel &&
      pair(
        "It needs a short example sentence in the word list or a short sentence in the reading, and there is none.",
        "Necesita una oración de ejemplo corta en la lista de palabras o una oración corta en la lectura, y no hay ninguna.",
      ),
  },
  {
    id: "oral-rehearsal",
    adds: "text",
    place: PLACE.beforeQuestions,
    label: pair("Oral rehearsal", "Ensayo oral"),
    what: pair(
      "Students say the answer to a partner first, then write it.",
      "Los estudiantes dicen la respuesta a un compañero primero y luego la escriben.",
    ),
    unmet: needsQuestion,
  },
  {
    id: "discussion-prompts",
    adds: "text",
    place: PLACE.end,
    label: pair("Discussion prompts", "Preguntas para conversar"),
    what: pair(
      "Partner talk prompts about your words or topic.",
      "Preguntas para conversar en parejas sobre tus palabras o tu tema.",
    ),
    unmet: hasContext,
  },
  {
    id: "comparison-structures",
    adds: "organizer",
    place: PLACE.end,
    label: pair("Comparison structures", "Estructuras para comparar"),
    what: pair(
      "A compare organizer for your first two vocabulary words, with alike and different frames.",
      "Un organizador para comparar tus dos primeras palabras, con marcos de parecidos y diferencias.",
    ),
    unmet: (c) =>
      c.compareTerms.length < 2 &&
      pair(
        "It needs at least two short vocabulary words (20 characters or fewer) to compare.",
        "Necesita al menos dos palabras de vocabulario cortas (20 caracteres o menos) para comparar.",
      ),
  },
  {
    id: "claim-evidence-reasoning",
    adds: "organizer",
    place: PLACE.end,
    label: pair("Claim, evidence, reasoning", "Afirmación, evidencia, razonamiento"),
    what: pair(
      "An organizer with a frame for each part. Students use their own claim and evidence.",
      "Un organizador con un marco para cada parte. Los estudiantes usan su propia afirmación y evidencia.",
    ),
    unmet: (c) =>
      !c.hasShort &&
      !c.hasPassage &&
      pair(
        "It needs a reading or a written-response question to build a claim from.",
        "Necesita una lectura o una pregunta de respuesta escrita para construir una afirmación.",
      ),
  },
  {
    id: "paragraph-organizer",
    adds: "organizer",
    place: PLACE.end,
    label: pair("Paragraph organizer", "Organizador de párrafo"),
    what: pair(
      "Four numbered boxes: topic sentence, two details, closing sentence.",
      "Cuatro cuadros numerados: oración principal, dos detalles, oración final.",
    ),
    unmet: needsWriting,
  },
  {
    id: "explanation-task",
    adds: "question",
    place: PLACE.end,
    label: pair("Explanation task", "Tarea de explicación"),
    what: pair(
      "A written task: explain one of your own answers. It is not scored automatically.",
      "Una tarea escrita: explicar una de tus propias respuestas. No se califica automáticamente.",
    ),
    unmet: needsQuestion,
  },
  {
    id: "writing-revision",
    adds: "text",
    place: PLACE.end,
    label: pair("Writing revision", "Revisión de la escritura"),
    what: pair(
      "A short checklist for revising written answers.",
      "Una lista breve para revisar las respuestas escritas.",
    ),
    unmet: needsWriting,
  },
]);

export const OPTION_IDS = Object.freeze(OPTIONS.map((o) => o.id));
export const DONE = pair(
  "Already added. Use Undo to remove it.",
  "Ya se agregó. Usa Deshacer para quitarlo.",
);
export const FULL = pair(
  `The activity already has the most blocks it can hold (${LIMITS.blocks}).`,
  `La actividad ya tiene el máximo de bloques que puede contener (${LIMITS.blocks}).`,
);


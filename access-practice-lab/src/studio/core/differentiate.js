// Differentiation: one-click presets and tiered versions of an activity. Pure, deterministic, no DOM, no network.
//
// Five separate dials, never conflated:
//   language   proficiency / supports: WIDA level, frames, word bank, read-aloud, chunking, Spanish, pictures, hints
//   content    how hard the thinking is (only increase-challenge and the Extension tier touch it, and only by ADDING)
//   reading    how much and how complex the reading is (directions split into steps; no words replaced)
//   length     how much practice there is (shorten, extend-practice)
//   support    how much help is on the page (the tiers reduce frames from full to partial to none)
// Language support never changes the task or the answer key: `assertRigor` proves it.
//
// Nothing here writes new facts, definitions, answers or Spanish. A teacher's own text is never replaced; additions
// are listed in `lineage.added`, every change is described in English and Spanish, and a preset that cannot do its
// job safely changes nothing and says why in `warnings`.

import { challengeItems } from "./differentiate-extension.js";
import { extendPractice, shorten } from "./differentiate-length.js";
import { assertRigor, compareVersions, keyResponse, TIER_LABELS } from "./differentiate-rigor.js";
import { applySupports, shortenDirections } from "./differentiate-supports.js";
import {
  STUDIO_FAMILY,
  clone,
  finish,
  insertAfterQuestions,
  newActivityId,
  newErrors,
  pair,
  plural,
  suffixedTitle,
  takenIds,
  versionLineage,
  withAdded,
} from "./differentiate-util.js";
import { TIERS } from "./schema.js";

export { STUDIO_FAMILY, TIER_LABELS, assertRigor, compareVersions, keyResponse };

export const DIALS = Object.freeze([
  { id: "language", label: pair("Language support", "Apoyo de lenguaje") },
  { id: "content", label: pair("Content difficulty", "Dificultad del contenido") },
  { id: "reading", label: pair("Reading complexity", "Complejidad de la lectura") },
  { id: "length", label: pair("Task length", "Extensión de la tarea") },
  { id: "support", label: pair("Amount of support", "Cantidad de apoyo") },
]);

export const PRESETS = Object.freeze([
  {
    id: "keep",
    dial: "",
    label: pair("Keep as it is", "Dejar como está"),
    description: pair("Changes nothing.", "No cambia nada."),
  },
  {
    id: "language-support",
    dial: "language",
    label: pair("Add language support", "Agregar apoyo de lenguaje"),
    description: pair(
      "Adds read-aloud, hints, sentence frames, word banks, short reading parts and Spanish where it exists. The questions and answers stay the same.",
      "Agrega lectura en voz alta, pistas, marcos de oraciones, bancos de palabras, partes de lectura cortas y español donde existe. Las preguntas y las respuestas no cambian.",
    ),
  },
  {
    id: "simplify-directions",
    dial: "reading",
    label: pair("Break directions into steps", "Dividir las instrucciones en pasos"),
    description: pair(
      "Splits the directions into short numbered steps. No words are replaced.",
      "Divide las instrucciones en pasos numerados y cortos. No se reemplaza ninguna palabra.",
    ),
  },
  {
    id: "increase-challenge",
    dial: "content",
    label: pair("Add a challenge", "Agregar un desafío"),
    description: pair(
      "Adds written challenge items built from this activity's own text or words. Your questions stay the same.",
      "Agrega tareas escritas de desafío hechas con el texto o las palabras de esta actividad. Tus preguntas no cambian.",
    ),
  },
  {
    id: "shorten",
    dial: "length",
    label: pair("Make it shorter", "Hacerla más corta"),
    description: pair(
      "Removes some questions but keeps at least one for every skill. The objective stays the same.",
      "Quita algunas preguntas pero deja al menos una de cada destreza. El objetivo no cambia.",
    ),
  },
  {
    id: "extend-practice",
    dial: "length",
    label: pair("Add more practice", "Agregar más práctica"),
    description: pair(
      "Adds practice of the same skills only when it can be proved correct (generated math problems, vocabulary from your word list).",
      "Agrega práctica de las mismas destrezas solo cuando se puede comprobar que es correcta (problemas de matemáticas generados, vocabulario de tu lista de palabras).",
    ),
  },
]);

/** Add the challenge items the activity's own content supports. Returns the added question ids. */
function addChallenge(a, changes, warnings) {
  const { questions } = challengeItems(a, { taken: takenIds(a) });
  if (!questions.length) {
    warnings.push(
      pair(
        "No challenge items were added: they are built from a reading passage or a word list of two or more words, and this activity has neither. Nothing was invented.",
        "No se agregaron tareas de desafío: se hacen con un texto de lectura o con una lista de dos o más palabras, y esta actividad no tiene ninguna. No se inventó nada.",
      ),
    );
    return [];
  }
  insertAfterQuestions(a, questions);
  const ids = questions.map((q) => q.id);
  withAdded(a, ids);
  changes.push(
    plural(
      ids.length,
      [
        "Added {n} written challenge item from this activity's own text or words, with a hint, a teacher explanation and a rubric. It is not scored automatically.",
        "Added {n} written challenge items from this activity's own text or words, each with a hint, a teacher explanation and a rubric. They are not scored automatically.",
      ],
      [
        "Se agregó {n} tarea escrita de desafío con el texto o las palabras de esta actividad, con pista, explicación para el docente y rúbrica. No se califica automáticamente.",
        "Se agregaron {n} tareas escritas de desafío con el texto o las palabras de esta actividad, cada una con pista, explicación para el docente y rúbrica. No se califican automáticamente.",
      ],
    ),
  );
  return ids;
}

const LANGUAGE_SUPPORT = {
  hints: true,
  readAloud: true,
  chunk: true,
  visuals: true,
  spanish: true,
  frames: "full",
  bank: true,
  vocabPreview: true,
};

const RUN = {
  keep: () => ({ changes: [], warnings: [] }),
  "language-support": (a) => applySupports(a, LANGUAGE_SUPPORT),
  "simplify-directions": (a) => {
    const changes = [];
    if (!shortenDirections(a, changes))
      return {
        changes,
        warnings: [
          pair(
            "The directions are already short, or there are none to split. Nothing changed.",
            "Las instrucciones ya son cortas, o no hay ninguna que dividir. No cambió nada.",
          ),
        ],
      };
    return { changes, warnings: [] };
  },
  "increase-challenge": (a) => {
    const changes = [];
    const warnings = [];
    addChallenge(a, changes, warnings);
    return { changes, warnings };
  },
  shorten,
  "extend-practice": extendPractice,
};

function checkedWarnings(before, after) {
  return newErrors(before, after).map((e) =>
    pair(
      `A check found a new problem. Fix it before sharing: ${e.message}`,
      "Una revisión encontró un problema nuevo. Corrígelo antes de compartir.",
    ),
  );
}

/**
 * Apply one preset to a copy of the activity (same id: this edits the teacher's draft; it never touches the input).
 * @returns {{ activity: object, changes: {en,es}[], warnings: {en,es}[] }}
 */
export function applyPreset(activity, presetId) {
  if (!PRESETS.some((p) => p.id === presetId)) throw new RangeError(`Unknown preset: ${presetId}`);
  const a = clone(activity);
  const { changes, warnings } = RUN[presetId](a);
  const next = finish(a);
  return { activity: next, changes, warnings: [...warnings, ...checkedWarnings(activity, next)] };
}

const TIER_PROFILE = {
  emerging: (a) => ({
    wida: a.supports.wida === 1 || a.supports.wida === 2 ? a.supports.wida : 2,
    ...LANGUAGE_SUPPORT,
    directions: true,
  }),
  developing: () => ({ wida: 3, hints: true, frames: "full", bank: true, chunk: false }),
  expanding: () => ({ wida: 4, hints: true, frames: "partial", chunk: false }),
  extension: () => ({ wida: 5, hints: true, frames: "off", chunk: false }),
};

const TIER_ABOUT = {
  emerging: pair(
    "for students at WIDA levels 1-2: read-aloud, short reading parts, words first, full sentence frames, word banks, short direction steps",
    "para estudiantes en los niveles WIDA 1-2: lectura en voz alta, partes de lectura cortas, palabras primero, marcos de oraciones completos, bancos de palabras, pasos cortos",
  ),
  developing: pair(
    "for students at WIDA level 3: sentence frames, word banks and hints",
    "para estudiantes en el nivel WIDA 3: marcos de oraciones, bancos de palabras y pistas",
  ),
  expanding: pair(
    "for students at WIDA level 4: shorter sentence starters and hints on request",
    "para estudiantes en el nivel WIDA 4: inicios de oración más cortos y pistas cuando las pidan",
  ),
  extension: pair(
    "for students ready for more: grade-level work with no sentence frames, plus written challenge items",
    "para estudiantes listos para más: trabajo de nivel de grado sin marcos de oraciones, más tareas escritas de desafío",
  ),
};

/**
 * A NEW activity for one tier of learners. The original is untouched; every original question keeps its id, prompt and
 * answer key. Only the Extension tier adds questions, and it lists them in `lineage.added`.
 * @param {object} deps `{ newId }` a function returning a fresh id (default: s + 10 hex digits)
 * @returns {{ activity: object, changes: {en,es}[], warnings: {en,es}[] }}
 */
export function makeVersion(activity, tier, deps = {}) {
  if (!TIERS.includes(tier)) throw new RangeError(`Unknown tier: ${tier}`);
  const a = clone(activity);
  const { changes, warnings } = applySupports(a, TIER_PROFILE[tier](a));
  const added = tier === "extension" ? addChallenge(a, changes, warnings) : [];
  a.id = (deps.newId || newActivityId)();
  a.rev = 0;
  a.createdAt = 0;
  a.updatedAt = 0;
  a.title = suffixedTitle(activity.title, TIER_LABELS[tier].en);
  a.lineage = versionLineage(activity, tier, added);
  const next = finish(a);
  const about = TIER_ABOUT[tier];
  return {
    activity: next,
    changes: [
      pair(
        `Made a new version "${next.title}" ${about.en}. Your original is unchanged.`,
        `Se creó una versión nueva "${next.title}" ${about.es}. Tu original no cambió.`,
      ),
      ...changes,
    ],
    warnings: [...warnings, ...checkedWarnings(activity, next)],
  };
}

/** One version per tier (all four by default), in the order a teacher meets them. */
export function makeVersions(activity, tiers = TIERS, deps = {}) {
  return tiers.map((tier) => ({ tier, ...makeVersion(activity, tier, deps) }));
}

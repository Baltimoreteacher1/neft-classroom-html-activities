// Create · student supports. A level (WIDA tier) and individual supports, each mapped onto what the Activity Studio
// already implements and the player and print layers already honour (studio/core/differentiate*.js). A support never
// changes a question's task or answer (assertRigor runs after), and one that cannot apply (no Spanish words, no
// pictures) is reported, never faked. Pure: no DOM, no storage.

import { makeVersion } from "../studio/core/differentiate.js";
import { assertRigor } from "../studio/core/differentiate-rigor.js";
import { applySupports } from "../studio/core/differentiate-supports.js";
import { normalizeActivity } from "../studio/core/schema.js";

const pair = (en, es) => Object.freeze({ en, es });

/** Who the resource is for. "grade" leaves the level alone; the rest are the Studio's tiers. */
export const LEVELS = Object.freeze([
  { id: "grade", tier: "", label: pair("Grade level", "Nivel de grado") },
  {
    id: "emerging",
    tier: "emerging",
    label: pair("WIDA 1-2", "WIDA 1-2"),
    hint: pair("Emerging", "Emergente"),
  },
  {
    id: "developing",
    tier: "developing",
    label: pair("WIDA 3", "WIDA 3"),
    hint: pair("Developing", "En desarrollo"),
  },
  {
    id: "expanding",
    tier: "expanding",
    label: pair("WIDA 4", "WIDA 4"),
    hint: pair("Expanding", "En expansión"),
  },
  {
    id: "extension",
    tier: "extension",
    label: pair("Ready for more", "Listos para más"),
    hint: pair("Extension", "Extensión"),
  },
]);

/** Individual supports: id -> the applySupports option it sets. Order is the order a teacher sees. */
export const SUPPORTS = Object.freeze([
  {
    id: "readAloud",
    icon: "speaker",
    option: { readAloud: true },
    label: pair("Read aloud", "Lectura en voz alta"),
    hint: pair("A listen button on text and questions", "Botón para escuchar textos y preguntas"),
  },
  {
    id: "frames",
    icon: "frame",
    option: { frames: "full" },
    label: pair("Sentence frames", "Marcos de oraciones"),
    hint: pair(
      "Starters for written and spoken answers",
      "Inicios para respuestas escritas y orales",
    ),
  },
  {
    id: "bank",
    icon: "bank",
    option: { bank: true },
    label: pair("Word banks", "Bancos de palabras"),
    hint: pair("Choices shown for fill-in blanks", "Opciones para los espacios en blanco"),
  },
  {
    id: "vocabFirst",
    icon: "vocab",
    option: { vocabPreview: true },
    label: pair("Words first", "Palabras primero"),
    hint: pair("Key words before the reading", "Palabras clave antes de la lectura"),
  },
  {
    id: "spanish",
    icon: "globe",
    option: { spanish: true },
    label: pair("Spanish glossary", "Glosario en español"),
    hint: pair("Spanish for each key word", "Español para cada palabra clave"),
  },
  {
    id: "visuals",
    icon: "picture",
    option: { visuals: true },
    label: pair("Pictures with words", "Imágenes con palabras"),
    hint: pair("Shows the word list's pictures", "Muestra las imágenes de la lista"),
  },
  {
    id: "chunk",
    icon: "chunk",
    option: { chunk: true },
    label: pair("Short reading parts", "Lectura en partes cortas"),
    hint: pair("The passage one part at a time", "La lectura por partes"),
  },
  {
    id: "directions",
    icon: "steps",
    option: { directions: true },
    label: pair("Step-by-step directions", "Instrucciones paso a paso"),
    hint: pair("Directions split into short steps", "Instrucciones en pasos cortos"),
  },
]);

export const supportById = (id) => SUPPORTS.find((s) => s.id === id) || null;

/** Clean a stored choice: { level, on: [support ids] }. */
export function cleanSupports(input) {
  const i = input && typeof input === "object" ? input : {};
  return {
    level: LEVELS.some((l) => l.id === i.level) ? i.level : "grade",
    on: Array.isArray(i.on) ? SUPPORTS.map((s) => s.id).filter((id) => i.on.includes(id)) : [],
  };
}

/**
 * Apply a level, then each support. @returns {{ activity, changes: {en,es}[], warnings: {en,es}[] }}
 * The activity keeps its id, title and lineage (Create's copy, not a new Studio version).
 */
export function applyCreateSupports(activity, choice) {
  const c = cleanSupports(choice);
  const changes = [];
  const warnings = [];
  let a = activity;
  const level = LEVELS.find((l) => l.id === c.level);
  if (level?.tier) {
    const v = makeVersion(a, level.tier, { newId: () => activity.id });
    a = normalizeActivity({
      ...v.activity,
      id: activity.id,
      title: activity.title,
      lineage: activity.lineage,
    });
    changes.push(...v.changes.slice(1));
    warnings.push(...v.warnings);
  }
  if (c.on.length) {
    const before = a;
    const work = structuredClone(a);
    const opts = Object.assign({}, ...c.on.map((id) => supportById(id).option));
    const out = applySupports(work, opts);
    a = normalizeActivity(work);
    changes.push(...out.changes);
    warnings.push(...out.warnings);
    if (!assertRigor(before, a).ok)
      warnings.push(
        pair(
          "A support changed a question. Review it before use.",
          "Un apoyo cambió una pregunta. Revísela antes de usarla.",
        ),
      );
  }
  return { activity: a, changes, warnings, supports: c };
}

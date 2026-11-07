// Spanish preview layer for one practice task (Achieve3000 "Partial Language" model).
//
// The preview tells a Spanish-dominant newcomer, in Spanish, what the task is called, what it is about, what to
// do, what a good answer includes and which key words matter. It never carries the passage, the listening
// script, the question choices or the answer: those stay English, because the English is what is practised.
// Opening the preview is a support, so the caller records the attempt as supported (PLATFORM.md rule 2).
//
// Pure data in, data out. The Spanish task name and directions come from content/es-guide.json; the gist and
// the "good answer" checklist below are authored per domain and response type.

/** What the task asks the learner to do, by response type. */
const GIST_BY_TYPE = {
  multipleChoice: "Eliges una respuesta entre varias opciones.",
  multiSelect: "Eliges todas las respuestas que son correctas; hay más de una.",
  sort: "Ordenas cada idea en el grupo correcto.",
  order: "Pones los pasos o las ideas en el orden correcto.",
  cloze: "Completas los espacios en blanco con la palabra que tiene sentido.",
  hotText: "Señalas la oración del texto que contesta la pregunta.",
  constructed: "Respondes con tus propias palabras.",
  worksheet: "Trabajas en papel con tu maestro o maestra.",
};

/** What the learner works with, by domain. The English source itself is never shown here. */
const GIST_BY_DOMAIN = {
  Listening: "Primero escuchas en inglés.",
  Reading: "Primero lees un texto corto en inglés.",
  Speaking: "Vas a hablar en inglés.",
  Writing: "Vas a escribir en inglés.",
  "Model-Test": "Es una pregunta con el formato de una prueba de práctica en inglés.",
};

/** What a good answer includes. Practice descriptors written for this lab, never WIDA rubric text. */
const RUBRIC = {
  Listening: [
    "Lees la pregunta antes de escuchar.",
    "Escuchas las palabras señal (first, because, but, finally).",
    "Tu respuesta se basa en lo que oíste, no en lo que adivinas.",
  ],
  Reading: [
    "Lees la pregunta primero.",
    "Encuentras la oración del texto que prueba tu respuesta.",
    "Puedes decir por qué las otras opciones no sirven.",
  ],
  Speaking: [
    "Contestas la pregunta directamente.",
    "Das una razón o un detalle con because.",
    "Usas al menos una palabra clave de la tarea.",
    "Hablas en oraciones completas; puedes hablar despacio.",
  ],
  Writing: [
    "Contestas la consigna en la primera oración.",
    "Das una razón y un ejemplo o dato.",
    "Unes las ideas con palabras como because, but, so.",
    "Revisas tus palabras al final.",
  ],
  "Model-Test": [
    "Lees la pregunta con cuidado.",
    "Buscas la evidencia antes de elegir.",
    "Revisas tu respuesta antes de seguir.",
  ],
};

const TYPE_RUBRIC = {
  multiSelect: "Revisas cada opción: puede haber más de una correcta.",
  order: "Buscas palabras de orden (first, next, then, last).",
  sort: "Piensas qué tienen en común las ideas de cada grupo.",
  cloze: "Lees la oración completa con tu palabra para ver si tiene sentido.",
};

/** The Spanish half of a vocabulary entry: "término: definición" → { term, es, esDef }. */
export function splitVocab(entry) {
  if (!Array.isArray(entry) || !entry[0]) return null;
  const spanish = String(entry[2] || "");
  const at = spanish.indexOf(":");
  const es = (at > 0 ? spanish.slice(0, at) : spanish).trim();
  const esDef = at > 0 ? spanish.slice(at + 1).trim() : "";
  return es ? { term: String(entry[0]), es, esDef } : null;
}

/**
 * The preview for one activity, or null when there is no Spanish for it.
 * @param {object} activity  the activity object (content/g6-8/Reading.json and the like)
 * @param {string} domain    Listening | Reading | Speaking | Writing | Model-Test
 * @param {{skill?: string, directions?: string}} guide  its content/es-guide.json entry
 */
export function buildEsPreview(activity, domain, guide = {}) {
  if (!activity || !guide?.skill || !guide?.directions) return null;
  const typeLine = GIST_BY_TYPE[activity.type] || GIST_BY_TYPE.multipleChoice;
  const rubric = [...(RUBRIC[domain] || RUBRIC.Reading)];
  if (TYPE_RUBRIC[activity.type] && !["Speaking", "Writing"].includes(domain)) rubric.push(TYPE_RUBRIC[activity.type]);
  return {
    title: guide.skill,
    gist: `${GIST_BY_DOMAIN[domain] || GIST_BY_DOMAIN.Reading} ${typeLine}`,
    prompt: guide.directions,
    rubric,
    vocab: (activity.vocabulary || []).map(splitVocab).filter(Boolean).slice(0, 6),
  };
}

export const ES_PREVIEW_DOMAINS = Object.keys(RUBRIC);

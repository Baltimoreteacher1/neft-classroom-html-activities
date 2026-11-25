// Coverage: every instructional activity family found in the repo, with an honest status.
//   adapter        a registered adapter copies it into an editable lp-activity/1 draft (tested for every source item)
//   via-transform  no adapter is needed: it is already an Activity Studio draft or reaches one through a core transform
//   not-supported  no adapter; `reason` says why. Nothing here claims coverage that was not inspected.
// Rows are data, not code paths: tools/studio-customize-adapters.test.mjs fails when an adapter has no row, a row says
// `adapter` without one, or a listed source path no longer exists. The Markdown table is written into CUSTOMIZE.md by
// tools/studio-customize-coverage.mjs.

import { ADAPTERS } from "./registry.js";
import { PROPERTIES } from "./properties.js";
import { t } from "./util.js";

export const STATUSES = Object.freeze(["adapter", "via-transform", "not-supported"]);

const TESTED = "adapter test: every source item";
const INSPECTED = "inspected, no adapter";

/** The adapter rows only say what does NOT carry over; their editable list comes from the adapter itself. */
export const ROWS = Object.freeze([
  {
    family: "access-bank",
    label: t("ACCESS Practice Lab question sets", "Conjuntos de preguntas de ACCESS Practice Lab"),
    status: "adapter",
    source: ["access-practice-lab/content/bank"],
    reason: t(
      "All 320 items of the 40 sets copy as one question each. Not carried: WIDA ids and bands, controlled listening playback, recording and preparation timers, test-simulation mode.",
      "Los 320 ítems de los 40 conjuntos se copian como una pregunta cada uno. No se conserva: identificadores y bandas WIDA, reproducción controlada de la escucha, temporizadores de grabación y preparación, modo de simulación de examen.",
    ),
    evidence: TESTED,
  },
  {
    family: "vocab-academy",
    label: t("Vocabulary Academy units", "Unidades de Academia de Vocabulario"),
    status: "adapter",
    source: ["access-practice-lab/content/vocab-academy"],
    reason: t(
      "All 157 units copy: words, meanings, examples, Spanish, matching, one fill-in per word, the reading with its questions, the checks. Not carried: pictures, pronunciation, word families, review words, study and production tasks.",
      "Se copian las 157 unidades: palabras, significados, ejemplos, español, emparejar, una oración para completar por palabra, la lectura con sus preguntas y las revisiones. No se conserva: imágenes, pronunciación, familias de palabras, palabras de repaso, tareas de estudio y de producción.",
    ),
    evidence: TESTED,
  },
  {
    family: "reading-room",
    label: t("Reading Room lessons", "Lecciones de la Sala de Lectura"),
    status: "adapter",
    source: ["access-practice-lab/content/reading-room/lessons.json"],
    reason: t(
      "All 183 lessons copy: numbered reading, vocabulary, tables, every authored question, the connect-it prompt. Not carried: family page, reading-path labels, question phases.",
      "Se copian las 183 lecciones: lectura numerada, vocabulario, tablas, cada pregunta original y la consigna de conexión. No se conserva: página familiar, etiquetas de ruta de lectura, fases de preguntas.",
    ),
    evidence: TESTED,
  },
  {
    family: "bcpss-unit",
    label: t("BCPSS curriculum units", "Unidades del currículo de BCPSS"),
    status: "adapter",
    source: ["data/bcpss-curriculum-seed.mjs"],
    reason: t(
      "All 162 units copy from the same /api/bcpss data: vocabulary, the unit's cloze items, one reading level with its questions, the language exit ticket, grade, subject, unit and curriculum standards. Not carried: the other two reading levels, Language Studio activities, writing lab, family card.",
      "Se copian las 162 unidades con los mismos datos de /api/bcpss: vocabulario, las oraciones para completar de la unidad, un nivel de lectura con sus preguntas, el boleto de salida de lenguaje, grado, materia, unidad y estándares del currículo. No se conserva: los otros dos niveles de lectura, las actividades de Language Studio, el laboratorio de escritura ni la tarjeta familiar.",
    ),
    evidence: TESTED,
  },
  {
    family: "activity-studio-draft",
    label: t(
      "Activity Studio drafts (lp-activity/1)",
      "Borradores de Activity Studio (lp-activity/1)",
    ),
    status: "via-transform",
    editable: ["all"],
    source: ["access-practice-lab/src/studio/drafts.js"],
    reason: t(
      "Already the editable model: copy a draft with Duplicate in My Activities or make differentiated versions of it. Not exercised by the adapter test.",
      "Ya es el modelo editable: copie un borrador con Duplicar en Mis actividades o cree versiones diferenciadas. La prueba de adaptadores no lo ejercita.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "access-arcade-games",
    label: t("ACCESS Practice Lab games and arcade", "Juegos y arcade de ACCESS Practice Lab"),
    status: "not-supported",
    source: [
      "access-practice-lab/content/games",
      "access-practice-lab/src/games",
      "access-practice-lab/src/arcade",
    ],
    reason: t(
      "Each game file is a mechanic script (mechanic, rules, bands, transfer) played by its own engine; lp-activity/1 cannot hold the mechanic, so a copy would keep the words and lose the game. Copy a question set or a vocabulary unit and convert it to a game instead.",
      "Cada archivo de juego es un guion de mecánica (mecánica, reglas, bandas, transferencia) que reproduce su propio motor; lp-activity/1 no puede contener la mecánica, así que una copia conservaría las palabras y perdería el juego. Copie un conjunto de preguntas o una unidad de vocabulario y conviértalo en juego.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "book-studio",
    label: t("Book Studio books", "Libros de Book Studio"),
    status: "not-supported",
    source: ["access-practice-lab/src/book", "access-practice-lab/BOOK-STUDIO.md"],
    reason: t(
      "Books are pages with art, audio and comic panels authored in the Book Studio, which already opens and edits any template or book. A question-and-block activity cannot hold pages and artwork.",
      "Los libros son páginas con arte, audio y viñetas que se crean en Book Studio, que ya abre y edita cualquier plantilla o libro. Una actividad de preguntas y bloques no puede contener páginas ni ilustraciones.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "graphic-novels",
    label: t("Graphic novels", "Novelas gráficas"),
    status: "not-supported",
    source: ["graphic-novels"],
    reason: t(
      "Each novel is a set of authored HTML pages run by graphic-novels/_engine with its own art; panel layout and art have no equivalent in lp-activity/1.",
      "Cada novela es un conjunto de páginas HTML creadas y ejecutadas por graphic-novels/_engine con su propio arte; la disposición de viñetas y el arte no tienen equivalente en lp-activity/1.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "bcpss-writing-lab",
    label: t("BCPSS Writing Lab", "Laboratorio de escritura de BCPSS"),
    status: "not-supported",
    source: ["bcpss-teachers/writing-lab", "db/seeds/bcpss/v2"],
    reason: t(
      "A step-by-step writing coach (notes, because-but-so, sentence stretching, drafting) driven by each unit's writing record. No teacher customization surface was found in its code, and the bcpss-unit adapter does not carry the writing task either.",
      "Un entrenador de escritura paso a paso (notas, porque-pero-entonces, ampliar oraciones, borrador) basado en el registro de escritura de cada unidad. No se encontró ninguna superficie de personalización para docentes en su código, y el adaptador bcpss-unit tampoco conserva la tarea de escritura.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "bcpss-teacher-studio",
    label: t("BCPSS Teacher Studio activities", "Actividades de BCPSS Teacher Studio"),
    status: "not-supported",
    source: ["bcpss-teachers/studio/data/activities", "bcpss-teachers/studio/engines"],
    reason: t(
      "The 87 activities run on eight engines (concept builder, language detective, visual match, early sort, escape challenge, conversation studio, vocab quest, argument builder), each with its own payload of visuals, confusion-tagged feedback and steps that lp-activity/1 cannot hold without dropping the interaction. Its own Resource Remix makes drafts from teacher text.",
      "Las 87 actividades usan ocho motores (constructor de conceptos, detective del lenguaje, emparejar imágenes, clasificación temprana, desafío de escape, estudio de conversación, búsqueda de vocabulario, constructor de argumentos), cada uno con su propia carga de imágenes, retroalimentación por confusión y pasos que lp-activity/1 no puede contener sin perder la interacción. Su propio Resource Remix crea borradores a partir de texto del docente.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "bcpss-language-studio",
    label: t("BCPSS Language Studio activities", "Actividades de BCPSS Language Studio"),
    status: "not-supported",
    source: ["bcpss-teachers/language-studio"],
    reason: t(
      "Per-unit activities (dictogloss, quiz, match, word sort, sequence, info gap and more) are separate engines with different payloads. Only the unit's own vocabulary, cloze items, reading and exit ticket are carried, by the bcpss-unit adapter.",
      "Las actividades de cada unidad (dictogloss, cuestionario, emparejar, clasificar palabras, secuencia, brecha de información y más) son motores distintos con cargas diferentes. Solo el vocabulario, las oraciones para completar, la lectura y el boleto de salida de la unidad se conservan, con el adaptador bcpss-unit.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "vocab-teacher-sets",
    label: t(
      "Teacher vocabulary sets and Vocabulary Curriculum investigations",
      "Conjuntos de vocabulario del docente e investigaciones del currículo de vocabulario",
    ),
    status: "not-supported",
    source: ["access-practice-lab/src/vocab-sets", "access-practice-lab/src/vocab-curriculum"],
    reason: t(
      "Teacher sets are already teacher-owned and editable (paste the words into Create). The Vocabulary Curriculum investigations hold structured words, meanings and examples that could be mapped like Vocabulary Academy units, but no adapter has been built or tested.",
      "Los conjuntos del docente ya son del docente y se pueden editar (pegue las palabras en Crear). Las investigaciones del currículo de vocabulario tienen palabras, significados y ejemplos estructurados que podrían convertirse como las unidades de Academia de Vocabulario, pero no se ha creado ni probado un adaptador.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "esol-printables",
    label: t("ESOL worksheets and printable pages", "Hojas de trabajo e impresiones de ESOL"),
    status: "not-supported",
    source: ["esol", "esol-reading-writing", "esol-study-guide", "esol-vocab-scrambler"],
    reason: t(
      "Hand-authored standalone HTML pages (and Word or PDF files) with no structured question data to read.",
      "Páginas HTML independientes creadas a mano (y archivos Word o PDF) sin datos estructurados de preguntas que leer.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "reveal-math-lessons",
    label: t(
      "Reveal Math lessons and small-group lessons",
      "Lecciones de Reveal Math y de grupos pequeños",
    ),
    status: "not-supported",
    source: ["lessons/1-1/config.json", "engine"],
    reason: t(
      "Lesson configs drive a lesson engine with many interactive components and publisher-aligned content that must not be altered or copied loosely. Use the Studio math generators to build new problems instead.",
      "Las configuraciones de lección controlan un motor con muchos componentes interactivos y contenido alineado con la editorial que no debe alterarse ni copiarse sin cuidado. Use los generadores de matemáticas del Studio para crear problemas nuevos.",
    ),
    evidence: INSPECTED,
  },
  {
    family: "family-resources",
    label: t("Family homework and family resources", "Tareas y recursos para familias"),
    status: "not-supported",
    source: ["families", "family", "family-app"],
    reason: t(
      "Generated family pages, take-home sheets and the family app: built from sidecar data by their own generators and printed or exported as pages and PDFs, not as questions.",
      "Páginas para familias generadas, hojas para llevar a casa y la aplicación familiar: se construyen con sus propios generadores a partir de datos auxiliares y se imprimen o exportan como páginas y PDF, no como preguntas.",
    ),
    evidence: INSPECTED,
  },
]);

/** Rows with the editable properties of each adapter filled in from the adapter itself (never typed twice). */
export function coverageRows() {
  return ROWS.map((row) => {
    const adapter = ADAPTERS[row.family];
    return {
      ...row,
      editable: row.status === "adapter" ? [...(adapter?.editable ?? [])] : (row.editable ?? []),
    };
  });
}

export const propertyLabel = (id) => PROPERTIES[id]?.label ?? { en: id, es: id };

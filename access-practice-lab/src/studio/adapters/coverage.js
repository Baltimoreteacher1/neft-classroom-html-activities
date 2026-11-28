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
    family: "reading-ladder",
    label: t("Reading Ladder passages", "Lecturas de la Escalera de lectura"),
    status: "adapter",
    source: ["access-practice-lab/content/ladder/passages.json"],
    reason: t(
      "All 18 passages copy with their three questions, hints, explanations and Spanish version; the easier and richer versions go to the teacher notes. Not carried: the ladder's step placement.",
      "Se copian las 18 lecturas con sus tres preguntas, pistas, explicaciones y versión en español; las versiones más fácil y más rica van a las notas para docentes. No se conserva: la ubicación por escalón.",
    ),
    evidence: TESTED,
  },
  {
    family: "missions",
    label: t("Academic Missions", "Misiones académicas"),
    status: "adapter",
    source: ["access-practice-lab/content/missions"],
    reason: t(
      "All 9 missions copy: briefing, dispatch audio with transcript, reports, tables and charts, vocabulary with Spanish, every question and evidence pick with its key, and the speaking and writing tasks with frames, model and criteria. Not carried: the branching decision (kept as teacher notes), the evidence board, per-choice prompt changes.",
      "Se copian las 9 misiones: introducción, audio con transcripción, informes, tablas y gráficos, vocabulario con español, cada pregunta y selección de evidencia con su clave, y las tareas de hablar y escribir con marcos, modelo y criterios. No se conserva: la decisión con ramas (queda en las notas para docentes), el tablero de evidencia, los cambios de consigna según la decisión.",
    ),
    evidence: TESTED,
  },
  {
    family: "puzzle-den",
    label: t("Puzzle Den puzzles", "Acertijos de la Guarida"),
    status: "adapter",
    source: ["access-practice-lab/content/puzzles/puzzles.json"],
    reason: t(
      "All 61 puzzles copy as one keyed question each: sentence builders as order, odd-one-out as choice, clue grids as match keyed by the Puzzle Den solver's one solution. Not carried: stars, hints two and three (teacher notes), alternate word orders.",
      "Se copian los 61 acertijos como una pregunta con clave cada uno: construir oraciones como ordenar, la palabra que no pertenece como opción, las cuadrículas de pistas como emparejar con la única solución del solucionador. No se conserva: estrellas, pistas dos y tres (notas para docentes), otros órdenes de palabras.",
    ),
    evidence: TESTED,
  },
  {
    family: "mentor-texts",
    label: t("Mentor Text Explorer texts", "Textos del Explorador de textos modelo"),
    status: "adapter",
    source: ["access-practice-lab/src/content/craft-mentor.js"],
    reason: t(
      "All 32 mentor texts copy: the text, a sort of its marked phrases by writer's move (the author's own marking is the key), and the try-it writing tasks for those moves with frame, model and criteria. Not carried: in-text highlights, the Writer's Toolbox.",
      "Se copian los 32 textos modelo: el texto, una clasificación de sus frases marcadas por recurso del escritor (la marca del autor es la clave) y las tareas de escritura de esos recursos con marco, modelo y criterios. No se conserva: el resaltado dentro del texto, la caja de herramientas.",
    ),
    evidence: TESTED,
  },
  {
    family: "newsroom-prompts",
    label: t("Newsroom story prompts", "Consignas de noticias del Newsroom"),
    status: "adapter",
    source: ["access-practice-lab/src/content/newsroom.js"],
    reason: t(
      "All 48 prompts copy: the assignment in English and Spanish, the reporter's notes, the reporter questions and the story task with lead frames, all open responses. Not carried: the 5W1H planner, pictures, recording, front page.",
      "Se copian las 48 consignas: la tarea en inglés y español, las notas del reportero, las preguntas de reportero y la tarea de la noticia con marcos, todas de respuesta abierta. No se conserva: el planificador 5W1H, las imágenes, la grabación, la portada.",
    ),
    evidence: TESTED,
  },
  {
    family: "reading-path",
    label: t("Reading Path phonics units", "Unidades de fonética del Camino de lectura"),
    status: "adapter",
    source: ["access-practice-lab/content/reading-path/phonics-scope.json"],
    reason: t(
      "All 15 units copy: the decodable book as read-aloud with transcript, its Spanish, the pattern and sight words, and one read-aloud task. Not carried: the word games and mini-lesson; the units have no authored questions, so none are made.",
      "Se copian las 15 unidades: el libro decodificable con lectura en voz alta y transcripción, su español, las palabras del patrón y de uso frecuente, y una tarea de leer en voz alta. No se conserva: los juegos de palabras y la minilección; las unidades no tienen preguntas escritas, por eso no se crean.",
    ),
    evidence: TESTED,
  },
  {
    family: "newcomer-packs",
    label: t("Newcomer vocabulary packs", "Paquetes de vocabulario para recién llegados"),
    status: "adapter",
    source: ["access-practice-lab/content/packs"],
    reason: t(
      "14 sources copy: the 12 survival-vocabulary topics and the new-arrival phrases as English and Spanish tables with matching, and the 36 speaking cards as prompts with frames. Not carried: pictures, print layouts, choice menus, the family guide, the tracker, the personal and frame-only packs.",
      "Se copian 14 fuentes: los 12 temas de vocabulario esencial y las frases de llegada como tablas en inglés y español con emparejar, y las 36 tarjetas para hablar como consignas con marcos. No se conserva: imágenes, diseños para imprimir, menús de opciones, la guía familiar, el registro, los paquetes personales y de solo marcos.",
    ),
    evidence: TESTED,
  },
  {
    family: "quest-missions",
    label: t("Language Quest missions", "Misiones de Language Quest"),
    status: "adapter",
    source: ["access-practice-lab/content/quest/missions"],
    reason: t(
      "All 17 missions copy: vocabulary, readings, listening and reading checks, sorts and timelines with their keys, and writing and speaking tasks with frame, model and checklist. Not carried: interactive scene items (named in the teacher notes), endings, the family page.",
      "Se copian las 10 misiones: vocabulario, lecturas, revisiones de escucha y lectura, clasificaciones y líneas de tiempo con su clave, y tareas de escribir y hablar con marco, modelo y lista. No se conserva: las escenas interactivas (nombradas en las notas para docentes), los finales, la página familiar.",
    ),
    evidence: TESTED,
  },
  {
    family: "studio-task",
    label: t("Speaking and Writing Studio tasks", "Tareas del Estudio de expresión oral y escrita"),
    status: "adapter",
    source: ["access-practice-lab/content/studio/speaking.json", "access-practice-lab/content/studio/writing.json"],
    reason: t(
      "All 56 tasks (34 speaking, 22 writing) copy: scenario, recording script with transcript, chart, table or reading, vocabulary with Spanish, listening checks, planner, frames and word bank, and the task with its success criteria and model. Not carried: recorder, timing, stage switching, scored exemplars.",
      "Se copian las 56 tareas (34 orales y 22 escritas): situación, guion de la grabación con transcripción, gráfica, tabla o lectura, vocabulario con español, preguntas de escucha, planificador, marcos y banco de palabras, y la tarea con sus criterios de éxito y modelo. No se conserva: grabadora, tiempos, cambio de etapas ni ejemplos calificados.",
    ),
    evidence: TESTED,
  },
  {
    family: "twr",
    label: t("TWR sentence-skill sets", "Conjuntos de destrezas de oraciones TWR"),
    status: "adapter",
    source: ["access-practice-lab/content/twr"],
    reason: t(
      "All 132 sets copy: the rule and model, every practice item with its key (choice, select-all, joining-word blanks, order) and the writing task with its checklist and model. Not carried: the step player and automatic word checks.",
      "Se copian los 132 conjuntos: la regla y el modelo, cada ejercicio con su clave (opción, seleccionar todas, espacios con palabra de unión, orden) y la tarea de escritura con su lista de control y modelo. No se conserva: el reproductor por pasos ni la revisión automática de palabras.",
    ),
    evidence: TESTED,
  },
  {
    family: "talk-table",
    label: t("Talk Table discussion decks", "Mazos de conversación de la Mesa de diálogo"),
    status: "adapter",
    source: ["access-practice-lab/content/talk-table.json"],
    reason: t(
      "All 20 decks (5 bands x 4 language uses, 8 cards each) copy as open speaking prompts with starter, follow-up and words, English and machine-drafted Spanish. Not carried: turn order, dealer, printed cards.",
      "Se copian los 20 mazos (5 bandas x 4 usos del lenguaje, 8 tarjetas cada uno) como consignas orales abiertas con comienzo, seguimiento y palabras, en inglés y en español de borrador automático. No se conserva: orden de turnos, reparto ni tarjetas impresas.",
    ),
    evidence: TESTED,
  },
  {
    family: "warmup",
    label: t("Daily Warm-Up word sets", "Conjuntos de palabras del calentamiento diario"),
    status: "adapter",
    source: ["access-practice-lab/content/warmup-early.json", "access-practice-lab/content/warmup-upper.json"],
    reason: t(
      "All 240 words in 24 sets of ten copy: meaning, Spanish, example, matching and each word's listening clip with its question and choices. Not carried: pictures, daily rotation, quick-write and speaking steps.",
      "Se copian las 240 palabras en 24 conjuntos de diez: significado, español, ejemplo, emparejar y el audio de cada palabra con su pregunta y opciones. No se conserva: imágenes, rotación diaria ni los pasos de escritura rápida y expresión oral.",
    ),
    evidence: TESTED,
  },
  {
    family: "subject-reading",
    label: t("Subject Reading passages", "Lecturas por materia"),
    status: "adapter",
    source: ["access-practice-lab/src/subject-reading/content.js"],
    reason: t(
      "All 5 readings copy: numbered passage, words with meanings and context, matching, and the evidence question with its evidence paragraph and focus words as a self-check. Not carried: highlighting, reading sequence.",
      "Se copian las 5 lecturas: texto numerado, palabras con significado y contexto, emparejar y la pregunta de evidencia con su párrafo y palabras clave como autoevaluación. No se conserva: resaltado ni secuencia de lecturas.",
    ),
    evidence: TESTED,
  },
  {
    family: "teach-back",
    label: t("Teach-Back concepts", "Conceptos para explicar (Teach-Back)"),
    status: "adapter",
    source: ["access-practice-lab/src/teachback/concepts.js"],
    reason: t(
      "All 24 concepts copy: the idea in English and Spanish, terms with Spanish, matching, an open prompt per key point and the teach-back explanation with its model. Not carried: concept picture, recording, automatic listening.",
      "Se copian los 24 conceptos: la idea en inglés y español, términos con español, emparejar, una consigna abierta por punto clave y la explicación con su modelo. No se conserva: imagen del concepto, grabación ni escucha automática.",
    ),
    evidence: TESTED,
  },
  {
    family: "word-parts",
    label: t("Word-part builders", "Constructores de partes de palabras"),
    status: "adapter",
    source: ["access-practice-lab/src/content/vocabulary-items.js"],
    reason: t(
      "Both bands (36 words) copy: words with the meanings of their parts, matching and a choose-the-parts question per word. Not carried: word sprint, weekly goal, tile order.",
      "Se copian las dos bandas (36 palabras): palabras con el significado de sus partes, emparejar y una pregunta de elegir las partes por palabra. No se conserva: carrera de palabras, meta semanal ni orden de fichas.",
    ),
    evidence: TESTED,
  },
  {
    family: "wordlab",
    label: t("Word Lab word sets", "Conjuntos de palabras del Laboratorio de palabras"),
    status: "adapter",
    source: ["access-practice-lab/src/content/wordlab-words.js"],
    reason: t(
      "All 755 words in 68 sets (band and subject, up to 12 each) copy: meaning, Spanish, example, matching and a fill-in where the example uses the word. Not carried: families, Frayer, detective, garden review, Spanish examples.",
      "Se copian las 755 palabras en 68 conjuntos (banda y materia, hasta 12): significado, español, ejemplo, emparejar y una oración para completar cuando el ejemplo usa la palabra. No se conserva: familias, Frayer, detective, repaso del jardín ni ejemplos en español.",
    ),
    evidence: TESTED,
  },
  {
    family: "phonics",
    label: t("Phonics Path lessons", "Lecciones de la Ruta de fonética"),
    status: "adapter",
    source: ["access-practice-lab/src/sor/sequence.js", "access-practice-lab/src/content/phonics"],
    reason: t(
      "All 58 lessons copy: sound cards, build (letters in order), read, sort, spell, the decodable passage with its question and the dictation. Not carried: sound boxes, extra tiles, spoken sounds, transfer step.",
      "Se copian las 58 lecciones: tarjetas de sonidos, formar (letras en orden), leer, clasificar, deletrear, el texto decodificable con su pregunta y el dictado. No se conserva: cajas de sonidos, fichas extra, sonidos hablados ni paso de transferencia.",
    ),
    evidence: TESTED,
  },
  {
    family: "world-missions",
    label: t("Language Worlds missions", "Misiones de los Mundos del lenguaje"),
    status: "adapter",
    source: ["access-practice-lab/src/content/world-missions.js"],
    reason: t(
      "All 64 missions (4 worlds x 2 bands x 8) copy: source, question with its answer and feedback or writing task with success criteria, and the independent transfer prompt with frame. Not carried: map, console, sound.",
      "Se copian las 64 misiones (4 mundos x 2 bandas x 8): fuente, pregunta con respuesta y comentario o tarea de escritura con criterios, y la consigna de transferencia con su marco. No se conserva: mapa, consola ni sonido.",
    ),
    evidence: TESTED,
  },
  {
    family: "scenarios",
    label: t("Real-Life Scenarios", "Situaciones de la vida real"),
    status: "adapter",
    source: ["access-practice-lab/src/content/scenarios.js"],
    reason: t(
      "All 27 scenes copy: the goal, one question per conversation turn keyed to the reply the scene rates best with its English and Spanish explanation, and a role-play with the best path as model. Not carried: branches, characters, recording.",
      "Se copian las 27 escenas: la meta, una pregunta por turno con la respuesta mejor valorada como clave y su explicación en inglés y español, y una dramatización con el mejor camino como modelo. No se conserva: ramas, personajes ni grabación.",
    ),
    evidence: TESTED,
  },
  {
    family: "voice-lab",
    label: t("Voice Lab retells, picture talk and sound pairs", "Recuentos, descripción de imágenes y pares de sonidos del Laboratorio de voz"),
    status: "adapter",
    source: ["access-practice-lab/src/content/voice-lab.js"],
    reason: t(
      "All 7 retells, 6 picture-talk ladders and 5 sound-pair sets copy. Read-aloud passages, shadowing lines and key frames have no task or answer and are not offered. Not carried: pictures, recording, playback.",
      "Se copian los 7 recuentos, las 6 escaleras para hablar de imágenes y los 5 conjuntos de pares de sonidos. Las lecturas en voz alta, líneas para imitar y marcos clave no tienen tarea ni respuesta y no se ofrecen. No se conserva: imágenes, grabación ni reproducción.",
    ),
    evidence: TESTED,
  },
  {
    family: "scaffold-items",
    label: t("Language builders", "Constructores de lenguaje"),
    status: "adapter",
    source: ["access-practice-lab/src/content/scaffold-items.js"],
    reason: t(
      "All 24 items (3 tools x 2 bands) copy: sentences to order, supporting cards and connector with keys, and revisions with frame and model. Not carried: slots, off-topic tiles, live language feedback.",
      "Se copian los 24 ejercicios (3 herramientas x 2 bandas): oraciones para ordenar, tarjetas de apoyo y conector con claves, y revisiones con marco y modelo. No se conserva: casillas, fichas fuera de tema ni retroalimentación en vivo.",
    ),
    evidence: TESTED,
  },
  {
    family: "craft-sentences",
    label: t("Sentence Lab levels and challenges", "Niveles y desafíos del Laboratorio de oraciones"),
    status: "adapter",
    source: ["access-practice-lab/src/content/craft-sentences.js"],
    reason: t(
      "All 8 levels and 10 challenges copy: build, combine and expand tasks as part-order questions (open with the answer as sample when parts repeat or another order is accepted) and fix-it tasks with the rule. Not carried: 60 spot-the-error tasks.",
      "Se copian los 8 niveles y 10 desafíos: tareas de construir, combinar y ampliar como preguntas de orden de partes (abiertas con la respuesta como ejemplo si las partes se repiten o se acepta otro orden) y tareas de corregir con la regla. No se conserva: 60 tareas de encontrar el error.",
    ),
    evidence: TESTED,
  },
  {
    family: "lab-activity",
    label: t("Language Page practice activities", "Actividades de práctica de The Language Page"),
    status: "adapter",
    source: ["access-practice-lab/content/index.json", "access-practice-lab/content/g6-8"],
    reason: t(
      "All 933 activities of every band and domain copy: directions, reading, listening script, picture, table or chart, vocabulary with Spanish, and the one task keyed as the activity page keys it (constructed and worksheet tasks as open responses). Not carried: the recorder, picture-tap answers, scene art.",
      "Se copian las 933 actividades de todos los niveles y dominios: instrucciones, lectura, guion de audio, imagen, tabla o gráfico, vocabulario con español y la tarea con la clave de la página (las tareas abiertas y hojas de trabajo como respuestas abiertas). No se conserva: la grabadora, las respuestas tocando imágenes, el arte de la escena.",
    ),
    evidence: TESTED,
  },
  {
    family: "access-prep",
    label: t("Access Prep skill builders", "Prácticas de destrezas de Access Prep"),
    status: "adapter",
    source: ["access-practice-lab/content/prep"],
    reason: t(
      "All 64 sets of the eight skill builders copy with every step: matches, fill-ins with their choices, choice and select-all questions, rankings, sorts and open responses. Not carried: tiles, replay and speed controls, saved progress.",
      "Se copian los 64 conjuntos de las ocho prácticas con cada paso: emparejar, completar con sus opciones, preguntas de opción y de seleccionar todas, ordenar, clasificar y respuestas abiertas. No se conserva: fichas, controles de repetición y velocidad, progreso guardado.",
    ),
    evidence: TESTED,
  },
  {
    family: "grammar-packs",
    label: t("Grammar practice packs", "Paquetes de práctica de gramática"),
    status: "adapter",
    source: ["access-practice-lab/content/grammar/packs.json"],
    reason: t(
      "All 7 packs copy: the rule and every check-in and practice item as a choose-the-correct-sentence question with its why-line in English and Spanish. Not carried: the writing-sample detectors.",
      "Se copian los 7 paquetes: la regla y cada ítem del chequeo y de práctica como pregunta de elegir la oración correcta, con su explicación en inglés y español. No se conserva: los detectores de la muestra de escritura.",
    ),
    evidence: TESTED,
  },
  {
    family: "claim-check",
    label: t("Misconception Detective cases", "Casos del Detective de conceptos erróneos"),
    status: "adapter",
    source: ["access-practice-lab/src/claimcheck/cases.js"],
    reason: t(
      "All 30 cases copy: the numbered explanation, the wrong line, the evidence-card sort, the replacement statement, and the explain and transfer questions as open responses. Not carried: line tapping, the sentence check.",
      "Se copian los 30 casos: la explicación numerada, la línea equivocada, la clasificación de tarjetas, el enunciado correcto y las preguntas de explicar y transferir como respuestas abiertas. No se conserva: tocar la línea, la revisión de la oración.",
    ),
    evidence: TESTED,
  },
  {
    family: "argument-arena",
    label: t("Argument Arena topics", "Temas de la Arena de argumentos"),
    status: "adapter",
    source: ["access-practice-lab/src/content/craft-arena.js"],
    reason: t(
      "All 26 topics copy: the debate question, the six evidence cards, which side each card helps (a sort), the argument and both rebuttals as open responses with the Arena frames. Not carried: recording, the argument card.",
      "Se copian los 26 temas: la pregunta, las seis tarjetas de evidencia, qué lado apoya cada tarjeta (clasificar), el argumento y las dos respuestas al otro lado como respuestas abiertas con los marcos. No se conserva: la grabación, la tarjeta de argumento.",
    ),
    evidence: TESTED,
  },
  {
    family: "choice-boards",
    label: t("Language Choice Boards", "Tableros de opciones de lenguaje"),
    status: "adapter",
    source: ["access-practice-lab/content/choice-boards.json"],
    reason: t(
      "All 20 boards (5 grade bands x 4 Key Language Uses) copy: the nine squares as open tasks with their frames and look-for lines, listening texts as read-aloud, readings as passages. No answer keys exist, so none are invented.",
      "Se copian los 20 tableros (5 niveles x 4 usos clave del lenguaje): las nueve casillas como tareas abiertas con sus marcos y criterios, los textos para escuchar como lectura en voz alta y las lecturas como pasajes. No hay claves, así que no se inventa ninguna.",
    ),
    evidence: TESTED,
  },
  {
    family: "language-city",
    label: t("Language City missions", "Misiones de la Ciudad del Lenguaje"),
    status: "adapter",
    source: ["access-practice-lab/src/content/city.js"],
    reason: t(
      "All 12 missions copy step by step: signs and speech, choice steps with their key, build steps as word-order questions, say steps as open responses. Not carried: the map, character art, the extra word tiles (listed for the teacher), the three city episodes.",
      "Se copian las 12 misiones paso a paso: letreros y diálogos, pasos de elegir con su clave, pasos de construir como preguntas de ordenar palabras y pasos de decir como respuestas abiertas. No se conserva: el mapa, el arte, las fichas adicionales (listadas para el docente), los tres episodios.",
    ),
    evidence: TESTED,
  },
  {
    family: "communication",
    label: t("Culture & Communication scenarios", "Situaciones de Cultura y comunicación"),
    status: "adapter",
    source: ["access-practice-lab/src/content/communication.js"],
    reason: t(
      "All 16 scenarios copy: situation and audience card, the best-message choice, the changes / stays-the-same sort, the reflection and the writing task with its model. Not carried: the message dials and writing checks.",
      "Se copian las 16 situaciones: el contexto y la tarjeta de audiencia, la elección del mejor mensaje, la clasificación de lo que cambia, la reflexión y la tarea de escritura con su modelo. No se conserva: los diales y las revisiones de escritura.",
    ),
    evidence: TESTED,
  },
  {
    family: "exhibition",
    label: t("Language World exhibitions", "Exhibiciones de Language World"),
    status: "adapter",
    source: ["access-practice-lab/src/content/exhibition.js"],
    reason: t(
      "Both exhibitions (grades 3-5 and 6-8) copy their four tasks: the announcement and its questions, the exhibit card with choice and evidence questions, the speaking and writing tasks with level-A frames, and the glossary. Not carried: map, diagram, level B and C frames.",
      "Se copian las dos exhibiciones (grados 3-5 y 6-8) con sus cuatro tareas: el anuncio y sus preguntas, la tarjeta con preguntas de opción y de evidencia, las tareas de hablar y escribir con los marcos del nivel A y el glosario. No se conserva: mapa, diagrama, marcos B y C.",
    ),
    evidence: TESTED,
  },
  {
    family: "adventures",
    label: t("Adventure Worlds missions", "Misiones de Mundos de aventura"),
    status: "adapter",
    source: ["access-practice-lab/src/adventures/worlds"],
    reason: t(
      "All 56 mission-and-band versions copy scene by scene: story, readings with glossary, listening, clues, choices, ordering and the response task. Not carried: scene art, the Spanish story text, the response checks.",
      "Se copian las 56 versiones de misión y nivel escena por escena: historia, lecturas con glosario, audio, pistas, decisiones, ordenar y la tarea de respuesta. No se conserva: el arte, el texto en español de la historia, las revisiones de respuesta.",
    ),
    evidence: TESTED,
  },
  {
    family: "error-detective",
    label: t("Language Error Detective case files", "Casos del Detective de errores de lenguaje"),
    status: "adapter",
    source: ["access-practice-lab/content/detective/patterns.json"],
    reason: t(
      "All 25 case files copy: the micro-lesson, every sentence to fix (open response with the corrected sentence as the sample) and the transfer tasks. Not carried: the detector that reads a student's own writing.",
      "Se copian los 25 casos: la minilección, cada oración para corregir (respuesta abierta con la oración corregida como ejemplo) y las tareas de transferencia. No se conserva: el detector que lee la escritura del estudiante.",
    ),
    evidence: TESTED,
  },
  {
    family: "conversation-sim",
    label: t("Conversation Simulator scenarios", "Situaciones del Simulador de conversación"),
    status: "adapter",
    source: ["access-practice-lab/src/views/conversation.js"],
    reason: t(
      "Both scenarios copy every turn: what the partner or teacher says and a choice over the sample responses keyed to the one rated High, with each response's feedback. Not carried: scene picture, recorder.",
      "Se copian las dos situaciones con cada turno: lo que dice la pareja o el docente y una elección entre las respuestas de ejemplo con la clave en la valorada como Alta y los comentarios de cada una. No se conserva: imagen, grabadora.",
    ),
    evidence: TESTED,
  },
  {
    family: "construction-lab",
    label: t("Language Construction Lab", "Laboratorio de construcción del lenguaje"),
    status: "adapter",
    source: ["access-practice-lab/src/views/construction.js"],
    reason: t(
      "The lab copies as one source: each expansion challenge (its phrases and register notes, one open response with the finished sentence as the sample) and each register rewrite as a keyed choice. Not carried: building the sentence on screen.",
      "El laboratorio se copia como una sola fuente: cada reto de expansión (sus frases y notas de registro, una respuesta abierta con la oración terminada como ejemplo) y cada reescritura de registro como opción con clave. No se conserva: construir la oración en pantalla.",
    ),
    evidence: TESTED,
  },
  {
    family: "dialogue-studio",
    label: t("Dialogue Studio", "Estudio de diálogos"),
    status: "adapter",
    source: ["access-practice-lab/src/platform/data/externalIntegrationsData.js"],
    reason: t(
      "The studio copies as one source: dialogues with their role-play choice, grammar stories as fill-ins, picture words as vocabulary with Spanish, and warm-ups as open responses. Not carried: card pictures, other home languages, elicit mode.",
      "El estudio se copia como una sola fuente: diálogos con su elección de juego de roles, historias de gramática para completar, palabras con imagen como vocabulario con español y calentamientos como respuestas abiertas. No se conserva: imágenes, otros idiomas, modo de preguntas.",
    ),
    evidence: TESTED,
  },
  {
    family: "sentence-architect",
    label: t("Sentence Architect Studio", "Estudio Arquitecto de oraciones"),
    status: "adapter",
    source: ["access-practice-lab/src/platform/data/platformData.js"],
    reason: t(
      "The studio copies as one source: every kernel sentence with its parts and phrase blocks by tier, and one open writing response per kernel. It has no single right sentence, so nothing is keyed. Not carried: snapping blocks, the level meter.",
      "El estudio se copia como una sola fuente: cada oración núcleo con sus partes y bloques de frases por nivel, y una respuesta escrita abierta por oración. No tiene una sola oración correcta, así que nada lleva clave. No se conserva: encajar bloques, el medidor de nivel.",
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

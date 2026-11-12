// The site map: one registry of every destination on The Language Page, the section it lives in and who it is for.
// The top navigation, the "More" menu, the section bar under the header, the Explore directory (/explore) and the
// teacher and family start pages all read this file, so a page can never sit in one section in the menu and another
// in the section bar. Adding a destination is one entry here (tools/access-sitemap.test.mjs checks every entry:
// unique id, English and Spanish, a known section and skill, and a route the lab really answers).
//
// Pure data and pure functions: no DOM, so Node tests can import it.
//
//   href     a lab route ("speak", "journey/map", "Listening") or a site path ("/graphic-novels/")
//   section  where it lives (SECTIONS); `skill` sub-groups the Practice section
//   for      who it is for: student | teacher | family
//   kind     what it is: practice | studio | game | story | world | test | tool | guide | progress
//   bands    content bands it has material for; leave it out for every band
//   match    which routes belong to this destination: [view, idPrefix?] pairs; defaults to [[first path segment]]
//   top      shown in the section bar and the first rows of the menu
//   external opens another site (labelled so nobody is surprised)

const P = (en, es) => [en, es];

export const SECTIONS = Object.freeze([
  {
    id: "practice",
    icon: "reading",
    title: P("Practice", "Practicar"),
    lead: P(
      "Listening, reading, speaking, writing and words. Pick a skill, then a studio.",
      "Escuchar, leer, hablar, escribir y palabras. Elige una destreza y luego un estudio.",
    ),
  },
  {
    id: "play",
    icon: "sparkle",
    title: P("Games & Worlds", "Juegos y mundos"),
    lead: P(
      "Games, story worlds, a city to explore and real-life scenes. Every one practices real language.",
      "Juegos, mundos de cuentos, una ciudad para explorar y escenas de la vida real. Todos practican lenguaje real.",
    ),
  },
  {
    id: "prep",
    icon: "tests",
    title: P("ACCESS Prep", "Preparación ACCESS"),
    lead: P(
      "Practice tests, the 12-week Road to ACCESS and an optional skill check-in. Practice only, never an official score.",
      "Pruebas de práctica, el Camino a ACCESS de 12 semanas y un chequeo opcional. Solo práctica, nunca un puntaje oficial.",
    ),
  },
  {
    id: "progress",
    icon: "growth",
    title: P("My Progress", "Mi progreso"),
    lead: P(
      "Your path, your growth from your own work, and everything you have saved on this device.",
      "Tu camino, tu crecimiento a partir de tu propio trabajo y todo lo que guardaste en este dispositivo.",
    ),
  },
  {
    id: "teach",
    icon: "teacher",
    title: P("For Teachers", "Para docentes"),
    lead: P(
      "Start here, project a whole-class routine, launch an activity to students and see their evidence.",
      "Empiecen aquí, proyecten una rutina para toda la clase, envíen una actividad y vean la evidencia.",
    ),
  },
  {
    id: "family",
    icon: "families",
    title: P("For Families", "Para familias"),
    lead: P(
      "Short practice to do together at home, in English, Spanish or both.",
      "Práctica corta para hacer juntos en casa, en inglés, español o ambos.",
    ),
  },
  {
    id: "help",
    icon: "help",
    title: P("Help", "Ayuda"),
    lead: P(
      "How the site works, saving your work and a device check.",
      "Cómo funciona el sitio, guardar tu trabajo y revisar el dispositivo.",
    ),
  },
]);

export const SKILLS = Object.freeze([
  { id: "Listening", icon: "listening", title: P("Listening", "Escuchar") },
  { id: "Speaking", icon: "speaking", title: P("Speaking", "Hablar") },
  { id: "Reading", icon: "reading", title: P("Reading", "Leer") },
  { id: "Writing", icon: "writing", title: P("Writing", "Escribir") },
  { id: "Words", icon: "words", title: P("Words & grammar", "Palabras y gramática") },
  { id: "Mixed", icon: "sparkle", title: P("All four skills", "Las cuatro destrezas") },
]);

export const KINDS = Object.freeze({
  practice: P("Practice set", "Práctica"),
  studio: P("Studio", "Estudio"),
  game: P("Game", "Juego"),
  story: P("Stories", "Cuentos"),
  world: P("World", "Mundo"),
  test: P("Test prep", "Preparación"),
  tool: P("Tool", "Herramienta"),
  guide: P("Guide", "Guía"),
  progress: P("Progress", "Progreso"),
});

export const AUDIENCES = Object.freeze([
  { id: "student", icon: "reading", title: P("Students", "Estudiantes") },
  { id: "teacher", icon: "teacher", title: P("Teachers", "Docentes") },
  { id: "family", icon: "families", title: P("Families", "Familias") },
]);

const S = ["student"];
const ST = ["student", "teacher"];
const STF = ["student", "teacher", "family"];
const T_ = ["teacher"];
const TF = ["teacher", "family"];
const F = ["family"];
const UPPER = ["3-5", "6-8"];

export const DESTINATIONS = Object.freeze([
  // ── Practice · Listening ──────────────────────────────────────────────────────────────────
  {
    id: "listening",
    section: "practice",
    skill: "Listening",
    kind: "practice",
    for: STF,
    top: true,
    href: "Listening",
    icon: "listening",
    match: [
      ["room", "Listening"],
      ["activity", "Listening"],
    ],
    title: P("Listening practice", "Práctica de escuchar"),
    text: P(
      "Short listens with pictures: directions, details and main ideas.",
      "Escuchas cortas con imágenes: instrucciones, detalles e ideas principales.",
    ),
  },
  {
    id: "voice",
    section: "practice",
    skill: "Listening",
    kind: "studio",
    for: ST,
    top: true,
    href: "voice",
    icon: "listening",
    title: P("Voice Lab", "Laboratorio de voz"),
    text: P(
      "Picture speaking ladders, listen-then-retell, sound pairs and shadowing.",
      "Escaleras para hablar con imágenes, escuchar y volver a contar, pares de sonidos y repetición.",
    ),
  },
  {
    id: "conversation",
    section: "practice",
    skill: "Listening",
    kind: "studio",
    for: ST,
    bands: UPPER,
    href: "conversation",
    icon: "conversation",
    title: P("Conversation Simulator", "Simulador de conversación"),
    text: P(
      "Listen to a science discussion and choose how to respond.",
      "Escucha una discusión de ciencias y elige cómo responder.",
    ),
  },
  // ── Practice · Speaking ───────────────────────────────────────────────────────────────────
  {
    id: "speaking",
    section: "practice",
    skill: "Speaking",
    kind: "practice",
    for: STF,
    top: true,
    href: "Speaking",
    icon: "speaking",
    match: [
      ["room", "Speaking"],
      ["activity", "Speaking"],
    ],
    title: P("Speaking practice", "Práctica de hablar"),
    text: P(
      "Plan, record and listen back. Nothing is uploaded.",
      "Planea, graba y escucha. No se sube nada.",
    ),
  },
  {
    id: "speak",
    section: "practice",
    skill: "Speaking",
    kind: "studio",
    for: ST,
    top: true,
    href: "speak",
    icon: "speaking",
    title: P("Speaking Studio", "Estudio de expresión oral"),
    text: P(
      "Rehearse a school speaking task, then try it on your own.",
      "Ensaya una tarea oral escolar y luego hazla por tu cuenta.",
    ),
  },
  {
    id: "arena",
    section: "practice",
    skill: "Speaking",
    kind: "studio",
    for: ST,
    bands: UPPER,
    top: true,
    href: "arena",
    icon: "conversation",
    title: P("Argument Arena", "Arena de argumentos"),
    text: P(
      "26 debate topics: evidence cards, a claim builder and a rehearsal.",
      "26 temas de debate: tarjetas de evidencia, un constructor de afirmaciones y un ensayo.",
    ),
  },
  // ── Practice · Reading ────────────────────────────────────────────────────────────────────
  {
    id: "reading-practice",
    section: "practice",
    skill: "Reading",
    kind: "practice",
    for: STF,
    top: true,
    href: "Reading",
    icon: "reading",
    match: [
      ["room", "Reading"],
      ["activity", "Reading"],
    ],
    title: P("Reading practice", "Práctica de leer"),
    text: P(
      "Short texts: find evidence and explain the main idea.",
      "Textos cortos: encuentra evidencia y explica la idea principal.",
    ),
  },
  {
    id: "reading-room",
    section: "practice",
    skill: "Reading",
    kind: "story",
    for: STF,
    top: true,
    href: "reading-room",
    icon: "reading",
    match: [["reading-room"], ["reading"]],
    title: P("Reading Room", "Sala de lectura"),
    text: P(
      "A shelf of books to read, listen to and log.",
      "Un estante de libros para leer, escuchar y registrar.",
    ),
  },
  {
    id: "graphic-novels",
    section: "practice",
    skill: "Reading",
    kind: "story",
    for: STF,
    top: true,
    href: "/graphic-novels/",
    icon: "reading",
    match: [],
    title: P("Graphic Novel Library", "Biblioteca de novelas gráficas"),
    text: P(
      "Illustrated stories with read-aloud and word help.",
      "Cuentos ilustrados con lectura en voz alta y ayuda con palabras.",
    ),
  },
  {
    id: "ladder",
    section: "practice",
    skill: "Reading",
    kind: "practice",
    for: ST,
    href: "ladder",
    icon: "reading",
    title: P("Reading Ladder", "Escalera de lectura"),
    text: P(
      "One passage at three levels of support. Climb when you are ready.",
      "Un texto con tres niveles de apoyo. Sube cuando estés listo.",
    ),
  },
  {
    id: "stories",
    section: "practice",
    skill: "Reading",
    kind: "story",
    for: STF,
    href: "stories",
    icon: "worlds",
    title: P("Neighborhood Notes stories", "Historias del cuaderno del vecindario"),
    text: P(
      "Short neighborhood stories with questions.",
      "Historias cortas del vecindario con preguntas.",
    ),
  },
  {
    id: "science-of-reading",
    section: "practice",
    skill: "Reading",
    kind: "studio",
    for: STF,
    top: true,
    href: "science-of-reading",
    icon: "reading",
    match: [["science-of-reading"], ["sor"], ["subject-reading"]],
    title: P("Science of Reading Studio", "Estudio de la ciencia de la lectura"),
    text: P(
      "Phonics, decoding, fluency and reading across subjects.",
      "Fonética, decodificación, fluidez y lectura en distintas materias.",
    ),
  },
  {
    id: "mentor",
    section: "practice",
    skill: "Reading",
    kind: "studio",
    for: ST,
    bands: UPPER,
    href: "mentor",
    icon: "reading",
    title: P("Mentor Text Explorer", "Explorador de textos modelo"),
    text: P(
      "32 mentor texts and the writer's moves inside them.",
      "32 textos modelo y las técnicas del escritor que contienen.",
    ),
  },
  {
    id: "reader",
    section: "practice",
    skill: "Reading",
    kind: "tool",
    for: STF,
    href: "reader",
    icon: "reading",
    title: P("Immersive Reader", "Lector inmersivo"),
    text: P(
      "Paste or open a text and read it with spacing, audio and word help.",
      "Pega o abre un texto y léelo con espacio, audio y ayuda con palabras.",
    ),
  },
  // ── Practice · Writing ────────────────────────────────────────────────────────────────────
  {
    id: "writing",
    section: "practice",
    skill: "Writing",
    kind: "practice",
    for: STF,
    top: true,
    href: "Writing",
    icon: "writing",
    match: [
      ["room", "Writing"],
      ["activity", "Writing"],
    ],
    title: P("Writing practice", "Práctica de escribir"),
    text: P(
      "Build sentences and paragraphs with the words and frames you choose.",
      "Construye oraciones y párrafos con las palabras y estructuras que elijas.",
    ),
  },
  {
    id: "write",
    section: "practice",
    skill: "Writing",
    kind: "studio",
    for: ST,
    top: true,
    href: "write",
    icon: "writing",
    title: P("Writing Studio", "Estudio de escritura"),
    text: P(
      "Draft, get feedback that quotes your words, revise and keep a portfolio.",
      "Escribe, recibe comentarios que citan tus palabras, revisa y guarda un portafolio.",
    ),
  },
  {
    id: "sentences",
    section: "practice",
    skill: "Writing",
    kind: "studio",
    for: ST,
    top: true,
    href: "sentences",
    icon: "writing",
    title: P("Sentence Lab", "Laboratorio de oraciones"),
    text: P(
      "Build sentences from tiles, spot and fix errors, beat the boss paragraph.",
      "Construye oraciones con fichas, encuentra y corrige errores, vence al párrafo jefe.",
    ),
  },
  {
    id: "newsroom",
    section: "practice",
    skill: "Writing",
    kind: "studio",
    for: ST,
    top: true,
    href: "newsroom",
    icon: "launch",
    title: P("Newsroom", "Sala de redacción"),
    text: P(
      "48 story prompts: plan, draft, read it aloud and print a front page.",
      "48 temas de noticias: planea, escribe, léelo en voz alta e imprime una portada.",
    ),
  },
  {
    id: "scaffold",
    section: "practice",
    skill: "Writing",
    kind: "tool",
    for: ST,
    href: "scaffold",
    icon: "writing",
    title: P("Language builders", "Constructores de lenguaje"),
    text: P(
      "Sentence Architecture, Evidence Builder and Language Upgrade Lab.",
      "Arquitectura de oraciones, Constructor de evidencia y Laboratorio de mejora.",
    ),
  },
  {
    id: "evidence",
    section: "practice",
    skill: "Writing",
    kind: "studio",
    for: ST,
    bands: UPPER,
    href: "evidence",
    icon: "evidence",
    title: P("Evidence Studio", "Estudio de evidencia"),
    text: P(
      "Turn evidence from a source into your own sentences.",
      "Convierte la evidencia de una fuente en tus propias oraciones.",
    ),
  },
  {
    id: "construction",
    section: "practice",
    skill: "Writing",
    kind: "studio",
    for: ST,
    bands: UPPER,
    href: "construction",
    icon: "construction",
    title: P("Construction Lab", "Laboratorio de construcción"),
    text: P(
      "Assemble academic sentences piece by piece.",
      "Arma oraciones académicas pieza por pieza.",
    ),
  },
  // ── Practice · Words & grammar ────────────────────────────────────────────────────────────
  {
    id: "wordlab",
    section: "practice",
    skill: "Words",
    kind: "studio",
    for: ST,
    top: true,
    href: "wordlab",
    icon: "words",
    title: P("Word Lab", "Laboratorio de palabras"),
    text: P(
      "755 words: build with word parts, spot cognates, grow a word garden.",
      "755 palabras: forma palabras con sus partes, encuentra cognados, cultiva un jardín.",
    ),
  },
  {
    id: "vocabulary",
    section: "practice",
    skill: "Words",
    kind: "practice",
    for: ST,
    top: true,
    href: "vocabulary",
    icon: "words",
    match: [["vocabulary"], ["vocab-curriculum"]],
    title: P("Word Builder", "Constructor de palabras"),
    text: P(
      "Academic word parts with review on day 1, 3 and 7.",
      "Partes de palabras académicas con repaso el día 1, 3 y 7.",
    ),
  },
  {
    id: "flashcards",
    section: "practice",
    skill: "Words",
    kind: "tool",
    for: STF,
    href: "flashcards",
    icon: "words",
    title: P("Word cards and partner talk", "Tarjetas de palabras y conversación en pareja"),
    text: P(
      "Flip cards and talk prompts to use with a partner or family.",
      "Tarjetas y preguntas para conversar con un compañero o la familia.",
    ),
  },
  {
    id: "detective",
    section: "practice",
    skill: "Words",
    kind: "studio",
    for: ST,
    top: true,
    href: "detective",
    icon: "detective",
    title: P("Error Detective", "Detective de errores"),
    text: P(
      "Find and fix the 25 most common language patterns.",
      "Encuentra y corrige los 25 patrones de lenguaje más comunes.",
    ),
  },
  {
    id: "grammar",
    section: "practice",
    skill: "Words",
    kind: "practice",
    for: ST,
    href: "grammar",
    icon: "detective",
    title: P("Grammar check-in and packs", "Chequeo y paquetes de gramática"),
    text: P(
      "A short grammar check-in, then practice packs.",
      "Un chequeo corto de gramática y luego paquetes de práctica.",
    ),
  },
  // ── Practice · All four skills ────────────────────────────────────────────────────────────
  {
    id: "library",
    section: "practice",
    skill: "Mixed",
    kind: "tool",
    for: ST,
    top: true,
    href: "library",
    icon: "library",
    title: P("Activity library", "Biblioteca de actividades"),
    text: P(
      "Every practice activity, with filters for skill, level and grade.",
      "Todas las actividades, con filtros por destreza, nivel y grado.",
    ),
  },
  {
    id: "learn",
    section: "practice",
    skill: "Mixed",
    kind: "studio",
    for: S,
    href: "learn",
    icon: "bulb",
    title: P("Interactive Learn Hub", "Centro interactivo de aprendizaje"),
    text: P(
      "Learn a language move, then try it.",
      "Aprende una estrategia de lenguaje y pruébala.",
    ),
  },
  {
    id: "language-studios",
    section: "practice",
    skill: "Mixed",
    kind: "studio",
    for: ST,
    href: "language-studios",
    icon: "sparkle",
    title: P("Interactive Language Studios", "Estudios interactivos de lenguaje"),
    text: P(
      "Discourse studios for explaining and arguing in content classes.",
      "Estudios de discurso para explicar y argumentar en las materias.",
    ),
  },
  {
    id: "missions",
    section: "practice",
    skill: "Mixed",
    kind: "studio",
    for: ST,
    href: "missions",
    icon: "mission",
    match: [["missions"], ["mission"]],
    title: P("Academic missions", "Misiones académicas"),
    text: P(
      "Prepare, produce real language, get feedback, revise.",
      "Prepara, produce lenguaje real, recibe comentarios y revisa.",
    ),
  },
  {
    id: "units",
    section: "practice",
    skill: "Mixed",
    kind: "studio",
    for: ST,
    href: "units",
    icon: "road",
    title: P("Thematic Units", "Unidades temáticas"),
    text: P(
      "Week-long units that connect all four skills to one theme.",
      "Unidades de una semana que conectan las cuatro destrezas con un tema.",
    ),
  },
  // ── Games & Worlds ────────────────────────────────────────────────────────────────────────
  {
    id: "games",
    section: "play",
    skill: "Mixed",
    kind: "game",
    for: STF,
    top: true,
    href: "games",
    icon: "sparkle",
    title: P("Language Game Studio", "Estudio de juegos de lenguaje"),
    text: P(
      "20+ games for words, sentences, listening and stories.",
      "Más de 20 juegos de palabras, oraciones, escucha y cuentos.",
    ),
  },
  {
    id: "puzzles",
    section: "play",
    skill: "Words",
    kind: "game",
    for: STF,
    top: true,
    href: "puzzles",
    icon: "grid",
    title: P("Puzzle Den", "Rincón de rompecabezas"),
    text: P(
      "Word puzzles that build vocabulary.",
      "Rompecabezas de palabras que construyen vocabulario.",
    ),
  },
  {
    id: "city",
    section: "play",
    skill: "Mixed",
    kind: "world",
    for: ST,
    top: true,
    href: "city",
    icon: "worlds",
    title: P("Language City", "Ciudad del lenguaje"),
    text: P(
      "Six buildings and twelve missions: ask, answer and repair conversations.",
      "Seis edificios y doce misiones: pregunta, responde y repara conversaciones.",
    ),
  },
  {
    id: "scenarios",
    section: "play",
    skill: "Speaking",
    kind: "world",
    for: STF,
    top: true,
    href: "scenarios",
    icon: "conversation",
    title: P("Real-Life Scenarios", "Escenas de la vida real"),
    text: P(
      "27 branching conversations from school and everyday life.",
      "27 conversaciones con opciones de la escuela y la vida diaria.",
    ),
  },
  {
    id: "adventures",
    section: "play",
    skill: "Mixed",
    kind: "world",
    for: STF,
    top: true,
    href: "/language-adventures/",
    icon: "worlds",
    match: [],
    title: P("Language Adventures", "Aventuras del lenguaje"),
    text: P(
      "Nine story worlds to explore with language.",
      "Nueve mundos de cuentos para explorar con el lenguaje.",
    ),
  },
  {
    id: "worlds",
    section: "play",
    skill: "Mixed",
    kind: "world",
    for: ST,
    top: true,
    href: "worlds",
    icon: "worlds",
    title: P("Language Worlds", "Mundos lingüísticos"),
    text: P(
      "Signal Station, Evidence City, Conversation Quest, StoryWorks and the Science Lab.",
      "Estación de señales, Ciudad de la evidencia, Misión conversación, StoryWorks y el laboratorio.",
    ),
  },
  {
    id: "exhibition",
    section: "play",
    skill: "Mixed",
    kind: "world",
    for: ST,
    href: "exhibition",
    icon: "worlds",
    title: P("Science Exhibition", "Feria de ciencias"),
    text: P(
      "One science story, four linked tasks: listen, read, speak, write.",
      "Una historia de ciencias, cuatro tareas: escuchar, leer, hablar y escribir.",
    ),
  },
  {
    id: "reality",
    section: "play",
    skill: "Mixed",
    kind: "world",
    for: ST,
    href: "reality",
    icon: "worlds",
    title: P("Language Reality Engine", "Motor de Realidad Lingüística"),
    text: P(
      "Live a story and use the language it needs.",
      "Vive una historia y usa el lenguaje que necesita.",
    ),
  },
  // ── ACCESS Prep ───────────────────────────────────────────────────────────────────────────
  {
    id: "access-prep",
    section: "prep",
    skill: "Mixed",
    kind: "test",
    for: STF,
    top: true,
    href: "access-prep",
    icon: "tests",
    title: P("Access Prep hub", "Centro de preparación ACCESS"),
    text: P(
      "What the test looks like and how to practice each part.",
      "Cómo es la prueba y cómo practicar cada parte.",
    ),
  },
  {
    id: "tests",
    section: "prep",
    skill: "Mixed",
    kind: "test",
    for: ST,
    top: true,
    href: "tests",
    icon: "tests",
    match: [["tests"], ["test"]],
    title: P("Practice tests", "Pruebas de práctica"),
    text: P(
      "Full practice tests in all four skills, with practice points.",
      "Pruebas completas en las cuatro destrezas, con puntos de práctica.",
    ),
  },
  {
    id: "assess",
    section: "prep",
    skill: "Mixed",
    kind: "test",
    for: ST,
    top: true,
    href: "assess",
    icon: "tests",
    title: P("Assessment simulator", "Simulador de evaluación"),
    text: P(
      "Practice the real screens, or learn as you go.",
      "Practica con las pantallas reales o aprende mientras avanzas.",
    ),
  },
  {
    id: "road",
    section: "prep",
    skill: "Mixed",
    kind: "test",
    for: STF,
    top: true,
    href: "road",
    icon: "road",
    title: P("Road to ACCESS", "Camino a ACCESS"),
    text: P(
      "A 12-week plan: one theme and task type each week.",
      "Un plan de 12 semanas: un tema y un tipo de tarea por semana.",
    ),
  },
  {
    id: "diagnostic",
    section: "prep",
    skill: "Mixed",
    kind: "tool",
    for: ST,
    top: true,
    href: "diagnostic",
    icon: "checkin",
    title: P("Skill check-in", "Chequeo de destrezas"),
    text: P(
      "An optional 4-minute starting point. Not a test.",
      "Un punto de partida opcional de 4 minutos. No es una prueba.",
    ),
  },
  // ── My Progress ───────────────────────────────────────────────────────────────────────────
  {
    id: "journey",
    section: "progress",
    skill: "Mixed",
    kind: "progress",
    for: S,
    top: true,
    href: "journey",
    icon: "road",
    match: [["journey"]],
    title: P("My Learning Journey", "Mi viaje de aprendizaje"),
    text: P("Twelve short missions, one step at a time.", "Doce misiones cortas, paso a paso."),
  },
  {
    id: "journey-map",
    section: "progress",
    skill: "Mixed",
    kind: "progress",
    for: S,
    top: true,
    href: "journey/map",
    icon: "flag",
    match: [["journey", "map"]],
    title: P("My Journey Map", "Mi mapa del viaje"),
    text: P("All 12 missions and where I am.", "Las 12 misiones y dónde estoy."),
  },
  {
    id: "path",
    section: "progress",
    skill: "Mixed",
    kind: "progress",
    for: S,
    top: true,
    href: "path",
    icon: "growth",
    title: P("My Language Path", "Mi camino del lenguaje"),
    text: P(
      "My next mission and how my skills connect.",
      "Mi próxima misión y cómo se conectan mis destrezas.",
    ),
  },
  {
    id: "growth",
    section: "progress",
    skill: "Mixed",
    kind: "progress",
    for: STF,
    top: true,
    href: "growth",
    icon: "growth",
    title: P("Growth Map", "Mapa de crecimiento"),
    text: P(
      "Trends from my own first attempts. Never a level or score.",
      "Tendencias de mis primeros intentos. Nunca un nivel o puntaje.",
    ),
  },
  {
    id: "passport",
    section: "progress",
    skill: "Mixed",
    kind: "progress",
    for: STF,
    top: true,
    href: "passport",
    icon: "passport",
    title: P("My Passport", "Mi Pasaporte"),
    text: P(
      "Everything I finished, a family letter and a code to share.",
      "Todo lo que terminé, una carta para la familia y un código para compartir.",
    ),
  },
  {
    id: "warmup",
    section: "progress",
    skill: "Mixed",
    kind: "practice",
    for: S,
    top: true,
    href: "warmup",
    icon: "sparkle",
    title: P("Daily Language Warm-Up", "Calentamiento diario de lenguaje"),
    text: P(
      "A new word, a short listen, one sentence and one rehearsal.",
      "Una palabra nueva, una escucha corta, una oración y un ensayo.",
    ),
  },
  {
    id: "portfolio",
    section: "progress",
    skill: "Mixed",
    kind: "progress",
    for: S,
    href: "portfolio",
    icon: "passport",
    title: P("My portfolio", "Mi portafolio"),
    text: P(
      "Save and revisit the work I want to keep.",
      "Guarda y revisa el trabajo que quiero conservar.",
    ),
  },
  {
    id: "collection",
    section: "progress",
    skill: "Mixed",
    kind: "progress",
    for: S,
    href: "collection",
    icon: "medal",
    title: P("My collection book", "Mi libro de colección"),
    text: P("Stickers and badges from practice.", "Calcomanías e insignias de la práctica."),
  },
  {
    id: "class",
    section: "progress",
    skill: "Mixed",
    kind: "tool",
    for: S,
    href: "class",
    icon: "classroom",
    match: [["class"]],
    title: P("Join my class", "Unirme a mi clase"),
    text: P("Enter the class code from my teacher.", "Escribe el código de clase de mi maestro."),
  },
  {
    id: "move",
    section: "progress",
    skill: "Mixed",
    kind: "tool",
    for: STF,
    href: "move",
    icon: "save",
    title: P("Move my progress", "Mover mi progreso"),
    text: P("Carry your work to another device.", "Lleva tu trabajo a otro dispositivo."),
  },
  // ── For Teachers ──────────────────────────────────────────────────────────────────────────
  {
    id: "start",
    section: "teach",
    skill: "Mixed",
    kind: "guide",
    for: T_,
    top: true,
    href: "start",
    icon: "flag",
    title: P("Teachers: Start Here", "Docentes: empiecen aquí"),
    text: P(
      "Choose your grades and try one activity in each skill.",
      "Elijan sus grados y prueben una actividad de cada destreza.",
    ),
  },
  {
    id: "teacher-hub",
    section: "teach",
    skill: "Mixed",
    kind: "tool",
    for: T_,
    top: true,
    href: "/access-teacher/",
    icon: "teacher",
    match: [],
    title: P("Teacher Hub", "Centro docente"),
    text: P(
      "Class roster, student evidence, goals and printables (sign-in).",
      "Lista de clase, evidencia, metas e imprimibles (con acceso).",
    ),
  },
  {
    id: "classroom",
    section: "teach",
    skill: "Mixed",
    kind: "tool",
    for: T_,
    top: true,
    href: "classroom",
    icon: "classroom",
    title: P("Whole-Class Studio", "Estudio para toda la clase"),
    text: P(
      "Projector-ready routines with models and scaffold toggles.",
      "Rutinas para proyectar con modelos y apoyos.",
    ),
  },
  {
    id: "launch",
    section: "teach",
    skill: "Mixed",
    kind: "tool",
    for: T_,
    top: true,
    href: "launch-studio",
    icon: "launch",
    match: [["launch"], ["launch-studio"], ["teacher-launch"]],
    title: P("Launch Studio", "Estudio de lanzamiento"),
    text: P(
      "Pick an activity and settings, then share one link or QR code.",
      "Elijan una actividad y ajustes, y compartan un enlace o código QR.",
    ),
  },
  {
    id: "class-quiz",
    section: "teach",
    skill: "Mixed",
    kind: "tool",
    for: T_,
    top: true,
    href: "class/quiz",
    icon: "classroom",
    match: [["class-quiz"]],
    title: P("Live class quiz", "Cuestionario de clase en vivo"),
    text: P(
      "Run a live quiz; students join with a code.",
      "Hagan un cuestionario en vivo; los estudiantes entran con un código.",
    ),
  },
  {
    id: "class-teacher",
    section: "teach",
    skill: "Mixed",
    kind: "tool",
    for: T_,
    href: "class/teacher",
    icon: "teacher",
    match: [["class-teacher"]],
    title: P("Class teacher view", "Vista de la clase para el maestro"),
    text: P(
      "Create a class code and see who has joined.",
      "Creen un código de clase y vean quién se unió.",
    ),
  },
  {
    id: "journey-guide",
    section: "teach",
    skill: "Mixed",
    kind: "guide",
    top: true,
    for: T_,
    href: "journey/guide",
    icon: "teacher",
    match: [["journey", "guide"]],
    title: P("Journey teacher guide", "Guía docente del viaje"),
    text: P(
      "How the 12 missions work and how to use them in class.",
      "Cómo funcionan las 12 misiones y cómo usarlas en clase.",
    ),
  },
  {
    id: "early",
    section: "teach",
    skill: "Mixed",
    kind: "practice",
    for: STF,
    bands: ["K", "1", "2-3"],
    href: "early?grades=K",
    icon: "reading",
    match: [["early"]],
    title: P("K–3 practice and Story Time", "Práctica de kínder a 3.º y Hora del cuento"),
    text: P(
      "Picture-first practice for the youngest learners.",
      "Práctica con imágenes para los más pequeños.",
    ),
  },
  {
    id: "expedition",
    section: "teach",
    skill: "Mixed",
    kind: "guide",
    for: T_,
    href: "/access-expedition/",
    icon: "flag",
    match: [],
    external: true,
    title: P("Teacher Expedition", "Expedición docente"),
    text: P(
      "A guided professional-learning walk-through on EduWonderLab.",
      "Un recorrido de formación docente en EduWonderLab.",
    ),
  },
  // ── For Families ──────────────────────────────────────────────────────────────────────────
  {
    id: "practice-together",
    section: "family",
    skill: "Mixed",
    kind: "guide",
    for: F,
    top: true,
    href: "practice-together",
    icon: "families",
    title: P("Families: Practice Together", "Familias: Practicar juntos"),
    text: P(
      "A short guide shows you how to help your child practice English, even if you are still learning English.",
      "Una guía corta les muestra cómo ayudar a su hijo o hija a practicar inglés, aunque todavía estén aprendiendo inglés.",
    ),
  },
  {
    id: "family-corner",
    section: "family",
    skill: "Mixed",
    kind: "tool",
    for: F,
    top: true,
    href: "family",
    icon: "families",
    match: [["family"]],
    title: P("Family Corner", "Rincón de la familia"),
    text: P(
      "A weekly plan, progress in plain words and conversation starters.",
      "Un plan semanal, el progreso en palabras sencillas e ideas para conversar.",
    ),
  },
  // ── Help ──────────────────────────────────────────────────────────────────────────────────
  {
    id: "explore",
    section: "help",
    skill: "Mixed",
    kind: "guide",
    for: STF,
    top: true,
    href: "explore",
    icon: "grid",
    match: [["explore"]],
    title: P("Everything on the site", "Todo el sitio"),
    text: P(
      "Every studio, game and tool in one place, with filters.",
      "Todos los estudios, juegos y herramientas en un lugar, con filtros.",
    ),
  },
  {
    id: "site-guide",
    section: "help",
    skill: "Mixed",
    kind: "guide",
    for: STF,
    top: true,
    href: "site-guide",
    icon: "help",
    title: P("Site Guide", "Guía del sitio"),
    text: P(
      "What each part of the site does and how to try it.",
      "Qué hace cada parte del sitio y cómo probarla.",
    ),
  },
  {
    id: "search",
    section: "help",
    skill: "Mixed",
    kind: "tool",
    for: STF,
    top: true,
    href: "search",
    icon: "search",
    title: P("Search", "Buscar"),
    text: P(
      "Find activities, lessons and tools.",
      "Encuentra actividades, lecciones y herramientas.",
    ),
  },
  {
    id: "tools",
    section: "help",
    skill: "Mixed",
    kind: "tool",
    for: STF,
    top: true,
    href: "tools",
    icon: "tools",
    title: P("Help and device check", "Ayuda y revisión del dispositivo"),
    text: P(
      "Check the microphone and speakers, and get help.",
      "Revisa el micrófono y los parlantes, y obtén ayuda.",
    ),
  },
]);

// ── lookups ──────────────────────────────────────────────────────────────────────────────────
export const SECTION_BY_ID = Object.freeze(Object.fromEntries(SECTIONS.map((s) => [s.id, s])));
export const DEST_BY_ID = Object.freeze(Object.fromEntries(DESTINATIONS.map((d) => [d.id, d])));

const firstSegment = (href) => href.replace(/[?#].*$/, "").split("/")[0];
/** The [view, idPrefix?] pairs a destination answers; site paths answer none. */
export const matchesOf = (d) =>
  d.match ? d.match : d.href.startsWith("/") ? [] : [[firstSegment(d.href)]];

/** Which destination a parsed route belongs to: the most specific match (one with an id) wins. */
export function locate(route = {}) {
  const view = route.view || "home";
  const key = route.domain || route.id || "";
  let best = null;
  for (const d of DESTINATIONS) {
    for (const [v, sub] of matchesOf(d)) {
      if (v !== view) continue;
      if (sub && sub !== key && !String(key).startsWith(`${sub}`)) continue;
      if (!best || (sub && !best.sub)) best = { d, sub };
    }
  }
  return best?.d || null;
}

export const inBand = (d, band) =>
  !d.bands || d.bands.includes(band) || (d.bands.includes("2-3") && band === "2-3");

/** Siblings shown in the section bar: same section (and same skill inside Practice), `top` first. */
export function siblings(dest, band) {
  if (!dest) return [];
  return DESTINATIONS.filter(
    (d) =>
      d.section === dest.section &&
      (dest.section !== "practice" || d.skill === dest.skill) &&
      inBand(d, band) &&
      (d.top || d.id === dest.id),
  );
}

export function destinationsIn(sectionId, band) {
  return DESTINATIONS.filter((d) => d.section === sectionId && inBand(d, band));
}

export function forAudience(audience, band) {
  return DESTINATIONS.filter((d) => d.for.includes(audience) && inBand(d, band));
}

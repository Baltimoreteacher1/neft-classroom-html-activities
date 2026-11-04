// ACCESS Learning Journey: the route registry and the rule tables behind src/journey/resources.js.
// Pure data, no DOM, no storage. Every `path` here is a route the lab already answers (src/main.js parseRoute);
// tools/access-journey-resources.test.mjs checks that. Objectives are copied or shortened from the route's own page
// text (the view's lead line or the nav label), never invented.
// `steps` = the Journey steps the route supports (the RECOMMENDED mapping), `klus` = Key Language Uses the route
// serves (empty = all four), `supports` = what the route renders when the learner asks for help, `verifies` =
// how the route relates to independent verification (the Journey's `show` step is the only place a mission is
// marked as shown independently; everything here is practice around it).

/** @typedef {[string, string]} T */

export const STEP_ORDER = ["discover", "understand", "build", "communicate", "improve", "show"];
export const KLUS = ["Narrate", "Inform", "Explain", "Argue"];

/**
 * Language feature -> words in a skill or title that signal it. Used only to rank an activity for a mission
 * (the mission lists its `features`). Heuristic and visible: the activity bank has no strand tag in the index.
 */
export const FEATURE_PATTERNS = {
  sequence: /sequenc|in order|time order|first|next|retell|recount/,
  description: /describ|picture|observ|detail/,
  cohesion: /connect|transition|link|signal|because|combine/,
  reference: /pronoun|refer|\bit\b|they/,
  perspective: /point of view|perspective|opinion|feeling|character/,
  classification: /sort|classif|categor|defin|kind of/,
  comparison: /compar|contrast|alike|differen/,
  "main-idea": /main idea|central idea|summar|topic/,
  process: /step|process|procedure|direction|how /,
  "cause-effect": /cause|effect|because|reason|why /,
  evidence: /evidence|support|fact|source|cite/,
  clarification: /clarif|ask for|question|repeat/,
  claim: /claim|argu|persua|position|opinion/,
  counterclaim: /counter|other view|disagree|however/,
  revision: /revis|improve|edit|fix|correct|strengthen/,
};

const R = (id, path, kind, domain, klus, steps, label, objective, supports, verifies) => ({
  id,
  path,
  kind,
  domain,
  klus,
  steps,
  label,
  objective,
  supports,
  verifies,
});

const SUP_STUDIO = "Support levels A/B/C; help panels are opt-in";
const SUP_NONE = "No scaffolds to add: the page is the tool";

/** Student studios, rooms, games and utilities (hub pages; individual tasks are reached from them or by id). */
export const ROUTES = [
  R(
    "exhibition",
    "exhibition",
    "studio",
    "All",
    ["Explain", "Inform", "Argue"],
    ["discover"],
    ["Language World: Science Exhibition", "Mundo del lenguaje: Feria de ciencias"],
    [
      "One scenario, four linked tasks, then a new independent attempt.",
      "Un escenario, cuatro tareas conectadas y luego un intento nuevo e independiente.",
    ],
    "Help per step; levels A/B/C; every help closed at level C",
    "Ends with an independent attempt",
  ),
  R(
    "worlds",
    "worlds",
    "studio",
    "All",
    [],
    ["discover"],
    ["Language Worlds", "Mundos lingüísticos"],
    [
      "Each world tests your communication in context with original missions and independent transfer.",
      "Cada mundo pone a prueba tu comunicación en contexto con misiones originales y transferencia independiente.",
    ],
    SUP_STUDIO,
    "Independent transfer inside each world",
  ),
  R(
    "reality",
    "reality",
    "studio",
    "All",
    [],
    ["discover"],
    ["Language Reality Engine", "Motor de Realidad Lingüística"],
    [
      "Live the story and use the language in a simulated situation.",
      "Vive la historia y usa el lenguaje en una situación simulada.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "stories",
    "stories",
    "studio",
    "All",
    [],
    ["discover"],
    ["Neighborhood Notes stories", "Historias del cuaderno del vecindario"],
    [
      "Short story episodes with a language goal and key vocabulary.",
      "Episodios breves con una meta de lenguaje y vocabulario clave.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "reading-room",
    "reading-room",
    "studio",
    "Reading",
    [],
    ["discover", "understand"],
    ["Reading Room", "Sala de lectura"],
    [
      "Read together, build your academic words and keep a reading log.",
      "Lean juntos, construyan sus palabras académicas y lleven un registro de lectura.",
    ],
    "Read-aloud, word help; all optional",
    "Practice only",
  ),
  R(
    "ladder",
    "ladder",
    "studio",
    "Reading",
    [],
    ["understand"],
    ["Reading Ladder", "Escalera de lectura"],
    [
      "One short passage and three questions per round; the next passage moves one practice step.",
      "Un pasaje corto y tres preguntas por ronda; el siguiente pasaje se mueve un paso de práctica.",
    ],
    SUP_STUDIO,
    "Practice steps on this device, not a level",
  ),
  R(
    "construction",
    "construction",
    "studio",
    "Writing",
    [],
    ["build"],
    ["Construction Lab", "Laboratorio de construcción"],
    [
      "Manipulate, expand and elevate sentences; build cohesion and formal register.",
      "Manipula, expande y mejora oraciones; construye cohesión y registro formal.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "vocabulary",
    "vocabulary",
    "studio",
    "All",
    [],
    ["build"],
    ["Word Builder", "Constructor de palabras"],
    [
      "Build and use academic words from the activities you have done.",
      "Construye y usa palabras académicas de las actividades que has hecho.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "flashcards",
    "flashcards",
    "studio",
    "All",
    [],
    ["build"],
    ["Word cards and partner talk", "Tarjetas de palabras y conversación en pareja"],
    [
      "Practice words with cards, then use them in partner talk.",
      "Practica palabras con tarjetas y luego úsalas en conversación en pareja.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "detective",
    "detective",
    "studio",
    "Writing",
    [],
    ["build", "improve"],
    ["Error Detective", "Detective de errores"],
    [
      "Find and fix a language pattern in a short case file.",
      "Encuentra y corrige un patrón de lenguaje en un caso breve.",
    ],
    "Hints and a peek are opt-in and recorded as help",
    "Practice only",
  ),
  R(
    "evidence",
    "evidence",
    "studio",
    "Writing",
    ["Explain", "Argue"],
    ["improve"],
    ["Evidence Studio", "Estudio de evidencia"],
    [
      "Find, choose and use evidence from a source.",
      "Encuentra, elige y usa evidencia de una fuente.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "speak",
    "speak",
    "studio",
    "Speaking",
    [],
    ["communicate"],
    ["Speaking Studio", "Estudio de expresión oral"],
    [
      "Speak with a purpose, type what you said, get coach feedback and self-review.",
      "Habla con un propósito, escribe lo que dijiste, recibe comentarios del entrenador y autoevalúate.",
    ],
    "Frames, word bank and model are opt-in; on my own shows none",
    "Independent attempts are recorded separately from supported ones",
  ),
  R(
    "write",
    "write",
    "studio",
    "Writing",
    [],
    ["communicate", "improve"],
    ["Writing Studio", "Estudio de escritura"],
    [
      "Plan, draft and revise a piece of writing, with practice work and how it changed.",
      "Planifica, escribe y revisa un texto, con el trabajo de práctica y cómo cambió.",
    ],
    "Frames, word bank and model are opt-in; on my own shows none",
    "Independent attempts are recorded separately from supported ones",
  ),
  R(
    "conversation",
    "conversation",
    "studio",
    "Speaking",
    ["Argue", "Explain"],
    ["communicate"],
    ["Conversation Simulator", "Simulador de conversación"],
    [
      "Practice realistic academic discussions; rehearse claims, clarification and argumentation.",
      "Practica conversaciones académicas realistas; ensaya afirmaciones, aclaraciones y argumentos.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "games",
    "games",
    "game",
    "All",
    [],
    ["build", "improve"],
    ["Language Game Studio", "Estudio de juegos de lenguaje"],
    [
      "Language games with rounds, feedback and a transfer round in your own words.",
      "Juegos de lenguaje con rondas, comentarios y una ronda de transferencia con tus propias palabras.",
    ],
    "Support mode chosen per session",
    "Transfer round in the learner's own words",
  ),
  R(
    "puzzles",
    "puzzles",
    "game",
    "All",
    [],
    ["build"],
    ["Puzzle Den", "Rincón de rompecabezas"],
    [
      "Language puzzles to solve at your own pace.",
      "Rompecabezas de lenguaje para resolver a tu ritmo.",
    ],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "missions",
    "missions",
    "studio",
    "All",
    ["Explain", "Argue"],
    ["show"],
    ["Academic missions", "Misiones académicas"],
    [
      "Listen, read, compare and then explain and write a recommendation.",
      "Escucha, lee, compara y luego explica y escribe una recomendación.",
    ],
    "Supports are opt-in",
    "Ends with a written recommendation",
  ),
  R(
    "learn",
    "learn",
    "studio",
    "All",
    [],
    ["understand"],
    ["Interactive Learn Hub", "Centro interactivo de aprendizaje"],
    ["Learn a skill by trying it.", "Aprende una destreza practicándola."],
    SUP_STUDIO,
    "Practice only",
  ),
  R(
    "library",
    "library",
    "room",
    "All",
    [],
    ["understand", "build"],
    ["Find an activity", "Buscar una actividad"],
    [
      "Search and filter every activity by skill, level and status.",
      "Busca y filtra todas las actividades por destreza, nivel y estado.",
    ],
    SUP_NONE,
    "Practice only",
  ),
  R(
    "tests",
    "tests",
    "test",
    "All",
    [],
    ["show"],
    ["Practice tests", "Pruebas de práctica"],
    [
      "Four-domain classroom practice, single-skill tests and short practice sets.",
      "Práctica de clase de las cuatro destrezas, pruebas de una destreza y conjuntos cortos.",
    ],
    "Guided mode shows supports; Independent Rehearsal shows none",
    "Independent Rehearsal is the on-your-own mode",
  ),
  R(
    "assess",
    "assess",
    "test",
    "All",
    [],
    ["show"],
    ["Assessment simulator", "Simulador de evaluación"],
    [
      "Sets with passages, listening, speaking and writing under test-style conditions.",
      "Conjuntos con pasajes, escucha, expresión oral y escritura en condiciones de prueba.",
    ],
    "None: test-style conditions",
    "Independent by design",
  ),
  R(
    "diagnostic",
    "diagnostic",
    "test",
    "All",
    [],
    ["discover"],
    ["Skill check-in", "Chequeo de destrezas"],
    [
      "A few original tasks suggest a practice starting point; not an assessment or level.",
      "Unas pocas tareas originales sugieren un punto de partida; no es una evaluación ni un nivel.",
    ],
    SUP_NONE,
    "Suggests practice only",
  ),
  R(
    "road",
    "road",
    "studio",
    "All",
    [],
    ["show"],
    ["Road to ACCESS", "Camino a ACCESS"],
    ["A weekly practice road, step by step.", "Un camino de práctica semanal, paso a paso."],
    SUP_NONE,
    "Practice only",
  ),
  R(
    "growth",
    "growth",
    "studio",
    "All",
    [],
    ["improve"],
    ["My growth", "Mi progreso"],
    ["See your practice work and how it changed.", "Mira tu trabajo de práctica y cómo cambió."],
    SUP_NONE,
    "Shows supported and independent work separately",
  ),
  R(
    "passport",
    "passport",
    "family",
    "All",
    [],
    ["show"],
    ["My Passport", "Pasaporte"],
    ["Keep and share a record of your practice.", "Guarda y comparte un registro de tu práctica."],
    SUP_NONE,
    "Records supported and independent work separately",
  ),
  R(
    "family",
    "family",
    "family",
    "All",
    [],
    ["improve"],
    ["Families", "Familias"],
    [
      "Short family conversations and activities in any language you share.",
      "Conversaciones y actividades familiares breves en cualquier idioma que compartan.",
    ],
    SUP_NONE,
    "Practice only",
  ),
  R(
    "tools",
    "tools",
    "room",
    "All",
    [],
    [],
    ["Help and device check", "Ayuda y revisión del dispositivo"],
    ["Check your device and find help.", "Revisa tu dispositivo y encuentra ayuda."],
    SUP_NONE,
    "Not practice",
  ),
  R(
    "classroom",
    "classroom",
    "teacher",
    "All",
    [],
    [],
    ["Whole-Class Studio", "Estudio para toda la clase"],
    ["Run an activity with the whole class.", "Realiza una actividad con toda la clase."],
    SUP_NONE,
    "Teacher-led",
  ),
  R(
    "launch-studio",
    "launch-studio",
    "teacher",
    "All",
    [],
    [],
    ["Launch Studio", "Estudio de lanzamiento"],
    [
      "Build a focused, direct classroom link in a few steps.",
      "Crea un enlace de clase directo y enfocado en pocos pasos.",
    ],
    SUP_NONE,
    "Teacher-led",
  ),
  R(
    "journey-map",
    "journey/map",
    "journey",
    "All",
    [],
    [],
    ["My Journey Map", "Mi mapa del viaje"],
    [
      "Four units, twelve missions, six steps each.",
      "Cuatro unidades, doce misiones, seis pasos cada una.",
    ],
    SUP_NONE,
    "Shows independent and supported steps separately",
  ),
  R(
    "journey-guide",
    "journey/guide",
    "teacher",
    "All",
    [],
    [],
    ["Journey teacher guide", "Guía docente del viaje"],
    [
      "Unit and mission overview, WIDA references, evidence and direct links.",
      "Resumen de unidades y misiones, referencias de WIDA, evidencia y enlaces directos.",
    ],
    SUP_NONE,
    "Teacher-led",
  ),
];

/** Standalone pages outside the lab app that students or families open (absolute paths, no `?grades`). */
export const EXTERNAL = [
  {
    id: "teacher-hub",
    path: "/access-teacher/",
    kind: "teacher",
    label: ["Teacher Hub", "Centro docente"],
  },
  {
    id: "teacher-expedition",
    path: "/access-expedition/",
    kind: "teacher",
    label: ["Teacher Expedition", "Expedición docente"],
  },
  {
    id: "family-adventure",
    path: "/access-family-expedition/",
    kind: "family",
    label: ["Family Adventure", "Aventura familiar"],
  },
  {
    id: "family-expedition",
    path: "/access-family-tour/",
    kind: "family",
    label: ["Family Expedition", "Expedición familiar"],
  },
];

/**
 * Practice games and which Journey step each one supports. Ids are the files in content/games (the test checks
 * that every id still has a file with both grade bands). `klus` empty = all four.
 */
export const GAMES = [
  {
    id: "sentence-factory",
    domain: "Writing",
    klus: [],
    steps: ["build"],
    label: ["Sentence Factory", "Fábrica de oraciones"],
    objective: ["Build sentences station by station.", "Arma oraciones estación por estación."],
  },
  {
    id: "spelling-expedition",
    domain: "Writing",
    klus: [],
    steps: ["build"],
    label: ["Spelling Expedition", "Expedición de ortografía"],
    objective: ["Build words from word parts.", "Arma palabras con partes de palabras."],
  },
  {
    id: "sound-word-studio",
    domain: "Speaking",
    klus: [],
    steps: ["build"],
    label: ["Sound and Word Studio", "Estudio de sonidos y palabras"],
    objective: [
      "Mix sounds and words to say them clearly.",
      "Mezcla sonidos y palabras para decirlos con claridad.",
    ],
  },
  {
    id: "sentence-strategy",
    domain: "Writing",
    klus: ["Explain", "Argue"],
    steps: ["build"],
    label: ["Sentence Strategy", "Estrategia de oraciones"],
    objective: [
      "Choose the strongest sentence for the job.",
      "Elige la oración más fuerte para la tarea.",
    ],
  },
  {
    id: "grammar-jungle",
    domain: "Writing",
    klus: [],
    steps: ["improve"],
    label: ["Grammar Jungle", "Selva de gramática"],
    objective: [
      "Edit sentences and fix what does not fit.",
      "Edita oraciones y corrige lo que no encaja.",
    ],
  },
  {
    id: "story-detective",
    domain: "Reading",
    klus: ["Narrate", "Explain"],
    steps: ["understand"],
    label: ["Story Detective", "Detective de cuentos"],
    objective: [
      "Collect evidence from a story to solve a question.",
      "Reúne evidencia de un cuento para resolver una pregunta.",
    ],
  },
  {
    id: "read-along-theater",
    domain: "Reading",
    klus: ["Narrate"],
    steps: ["understand"],
    label: ["Read-Along Theater", "Teatro de lectura"],
    objective: [
      "Read along page by page and answer as you go.",
      "Lee página por página y responde mientras avanzas.",
    ],
  },
  {
    id: "fluency-echo",
    domain: "Speaking",
    klus: [],
    steps: ["communicate"],
    label: ["Fluency Echo", "Eco de fluidez"],
    objective: ["Rehearse a phrase and say it smoothly.", "Ensaya una frase y dila con fluidez."],
  },
  {
    id: "story-creator",
    domain: "Writing",
    klus: ["Narrate"],
    steps: ["communicate"],
    label: ["Story Creator", "Creador de cuentos"],
    objective: [
      "Plan and tell your own story on a storyboard.",
      "Planifica y cuenta tu propio cuento en un guion gráfico.",
    ],
  },
  {
    id: "escape-room",
    domain: "All",
    klus: ["Explain", "Inform"],
    steps: ["understand"],
    label: ["Escape Room", "Sala de escape"],
    objective: [
      "Open four locks by using language clues.",
      "Abre cuatro cerraduras usando pistas de lenguaje.",
    ],
  },
  {
    id: "language-arcade",
    domain: "All",
    klus: [],
    steps: ["build"],
    label: ["Language Arcade", "Arcade de lenguaje"],
    objective: [
      "Move through pathway gates with language skills.",
      "Avanza por puertas del camino con destrezas de lenguaje.",
    ],
  },
];

/** Printable the student can use on paper (committed PDFs, src/paper-passport.js). */
export const PRINTABLES = [
  {
    id: "paper-passport",
    path: "/access-practice-lab/paper-passport/language-passport-booklet-print.pdf",
    steps: ["show"],
    domain: "All",
    label: ["Passport booklet (print)", "Librito del pasaporte (imprimir)"],
    objective: [
      "Print a passport your teacher can stamp.",
      "Imprime un pasaporte que tu docente pueda sellar.",
    ],
  },
];

/**
 * Unit n -> which tests close it: for each domain, `pick` is the position in that domain's tests (short practice
 * sets first, then the rest, by id), so units 1 and 2 use the first test and units 3 and 4 the second when there is
 * one; `fulls` adds a full form. Used by checkpointsFor in resources.js.
 */
export const CHECKPOINT_PLAN = {
  1: { domains: ["Listening", "Reading"], pick: 0, fulls: 0 },
  2: { domains: ["Speaking", "Writing"], pick: 0, fulls: 0 },
  3: { domains: ["Listening", "Reading"], pick: 1, fulls: 1 },
  4: { domains: ["Speaking", "Writing"], pick: 1, fulls: 2 },
};

/**
 * What each Journey step practices, by domain (the step's skill, not the mission's). `levels` is the support
 * preference order for bank activities; the `show` step prefers level C (least support) and never shows supports.
 */
export const STEP_PLAN = {
  discover: { domains: ["Reading"], levels: ["A", "B", "C"] },
  understand: { domains: ["Listening", "Reading"], levels: ["A", "B", "C"] },
  build: { domains: ["Writing"], levels: ["A", "B", "C"] },
  communicate: { domains: ["Speaking", "Writing"], levels: ["A", "B", "C"] },
  improve: { domains: ["Writing"], levels: ["B", "A", "C"] },
  show: { domains: ["Speaking", "Writing"], levels: ["C", "B", "A"] },
};

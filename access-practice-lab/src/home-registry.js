// The lab home's link registry: every card the home shows outside its own panels, grouped by where it appears.
// Adding a feature to the home is one entry here (tools/access-home-start.test.mjs checks each entry: unique id,
// English and Spanish, a known icon, a route the lab or the site really answers).
//
//   group "start"    quick links under the Continue card (students)
//   group "explore"  "More ways to practice" (students); `featured` cards show first, the rest behind "Show all"
//   group "teach"    the Teachers section
//   group "family"   the Families section
//
// `href` is a lab route ("speak", "worlds/science-lab", a route may carry its own query such as "?case=ramp-roll")
// or a site path ("/access-teacher/#printables").
// `bands` (optional) limits a card to the content bands it has material for; leave it out for every band.
//
// Planned entries from parallel work go in the group where people will look for them, for example:
//   speaking practice pack → explore · literacy tools → explore · join a class by code → start · live class quiz → teach

export const HOME_GROUPS = ["start", "explore", "teach", "family"];

export const LEARNING_AREAS = Object.freeze([
  { id: "reading", label: ["Reading", "Lectura"] },
  { id: "phonics", label: ["Phonics and decoding", "Fonética y decodificación"] },
  { id: "vocabulary", label: ["Vocabulary", "Vocabulario"] },
  { id: "content-reading", label: ["Reading across subjects", "Lectura en distintas materias"] },
]);

export const HOME_CARDS = [
  // ── start: next to the Continue card ───────────────────────────────────────
  {
    id: "path",
    group: "start",
    href: "path",
    icon: "growth",
    title: ["My Language Path", "Mi camino del lenguaje"],
    text: [
      "My next mission and how my skills connect.",
      "Mi próxima misión y cómo se conectan mis destrezas.",
    ],
  },
  {
    id: "journey-map",
    group: "start",
    href: "journey/map",
    icon: "road",
    title: ["My Journey Map", "Mi mapa del viaje"],
    text: ["All 12 missions and where I am.", "Las 12 misiones y dónde estoy."],
  },
  {
    id: "checkin",
    group: "start",
    href: "diagnostic",
    icon: "checkin",
    title: ["Skill check-in", "Chequeo de destrezas"],
    text: ["An optional 4-minute starting point.", "Un punto de partida opcional de 4 minutos."],
  },

  {
    id: "join-class",
    group: "start",
    href: "class",
    icon: "classroom",
    title: ["Join my class", "Unirme a mi clase"],
    text: [
      "Enter the class code from my teacher.",
      "Escribe el código de clase de mi maestro.",
    ],
  },

  {
    id: "daily-warmup",
    group: "start",
    href: "warmup",
    icon: "sparkle",
    title: ["Daily Language Warm-Up", "Calentamiento diario de lenguaje"],
    text: ["A new word, a short listen, one sentence and one rehearsal.", "Una palabra nueva, una escucha corta, una oración y un ensayo."],
  },
  {
    id: "search-lab",
    group: "start",
    href: "search",
    icon: "search",
    title: ["Search the lab", "Buscar en el laboratorio"],
    text: ["Find activities, lessons and learning tools.", "Encuentra actividades, lecciones y herramientas de aprendizaje."],
  },
  {
    id: "portfolio",
    group: "start",
    href: "portfolio",
    icon: "passport",
    title: ["My portfolio and showcase", "Mi portafolio y muestra"],
    text: ["Save and revisit the work I want to keep.", "Guarda y vuelve a ver el trabajo que quiero conservar."],
  },

  // ── explore: more ways to practice ─────────────────────────────────────────
  {
    id: "wida-access-prep",
    group: "explore",
    featured: true,
    href: "access-prep",
    icon: "tests",
    title: ["WIDA Access Prep · Grades 3–5 & 6–8", "Preparación WIDA ACCESS · Grados 3–5 y 6–8"],
    text: [
      "All Listening, Reading, Speaking, and Writing activities organized cleanly for Grades 3–5 and 6–8.",
      "Todas las actividades de comprensión auditiva, lectura, expresión oral y escritura organizadas para los grados 3–5 y 6–8.",
    ],
  },
  {
    id: "graphic-novels",
    group: "explore",
    featured: true,
    href: "/graphic-novels/",
    icon: "reading",
    title: ["Graphic Novel Library · ESOL Edition", "Biblioteca de novelas gráficas · Edición ESOL"],
    text: [
      "Bilingual math graphic novels with side-by-side English + Spanish, numbered panel badges, and step-by-step guidance.",
      "Novelas gráficas matemáticas bilingües con inglés y español lado a lado, números de viñeta y lectura guiada.",
    ],
  },
  {
    id: "language-adventures",
    group: "explore",
    featured: true,
    href: "/language-adventures/",
    icon: "worlds",
    title: ["Language Adventures · 9 Worlds", "Aventuras del lenguaje · 9 mundos"],
    text: [
      "Nine illustrated worlds, 11 branching stories, and 16 five-minute domain sprints.",
      "Nueve mundos ilustrados, 11 historias interactivas y 16 prácticas de cinco minutos.",
    ],
  },
  {
    id: "language-adventures-arcade",
    group: "explore",
    featured: true,
    href: "/language-adventures/arcade/",
    icon: "sparkle",
    title: ["Language Arcade · Discourse Games", "Arcade del lenguaje · Juegos de discurso"],
    text: [
      "Four logic and discourse games: Connector Bridge, Courtroom, Sequence Stage, and Detective.",
      "Cuatro juegos de lógica y discurso: conectores, tribunal, secuencia y detective.",
    ],
  },
  {
    id: "language-adventures-studios",
    group: "explore",
    featured: true,
    href: "/language-adventures/studios/",
    icon: "classroom",
    title: ["12 Language & Classroom Studios", "12 estudios de lenguaje y clase"],
    text: [
      "Word Matrix, Register Polisher, Data Evidence, Cohesion X-Ray, Counterpoint, and more.",
      "Matriz de palabras, registro, evidencia, cohesión, contrapunto y más.",
    ],
  },
  {
    id: "exhibition",
    group: "explore",
    featured: true,
    href: "exhibition",
    icon: "worlds",
    title: ["Language World", "Mundo del lenguaje"],
    text: ["One exhibition, four linked tasks.", "Una exposición, cuatro tareas unidas."],
  },
  {
    id: "science-lab",
    group: "explore",
    featured: true,
    href: "worlds/science-lab",
    icon: "evidence",
    title: ["Science Investigation Lab", "Laboratorio de investigación científica"],
    text: [
      "Notice, question, test and argue from evidence.",
      "Observa, pregunta, prueba y argumenta con evidencia.",
    ],
  },
  {
    id: "science-lab-ramp",
    group: "explore",
    bands: ["3-5"],
    href: "worlds/science-lab?case=ramp-roll",
    icon: "evidence",
    title: ["Science Lab: toy car ramp", "Laboratorio de ciencias: rampa de carritos"],
    text: [
      "Test floors and ramps, then argue from data.",
      "Prueba pisos y rampas, y luego argumenta con datos.",
    ],
  },
  {
    id: "games",
    group: "explore",
    featured: true,
    href: "games",
    icon: "sparkle",
    title: ["Language Game Studio", "Estudio de juegos de lenguaje"],
    text: ["Fifteen games for all four skills.", "Quince juegos para las cuatro habilidades."],
  },
  {
    id: "speak",
    group: "explore",
    featured: true,
    href: "speak",
    icon: "speaking",
    title: ["Speaking Studio", "Estudio de expresión oral"],
    text: [
      "Plan, record, listen back, say it better.",
      "Planea, graba, escucha y mejora lo que dices.",
    ],
  },
  {
    id: "write",
    group: "explore",
    featured: true,
    href: "write",
    icon: "writing",
    title: ["Writing Studio", "Estudio de escritura"],
    text: [
      "Use sources, draft, get feedback, revise.",
      "Usa fuentes, escribe, recibe comentarios y revisa.",
    ],
  },
  {
    id: "reader",
    group: "explore",
    featured: true,
    learningArea: "reading",
    href: "reader",
    icon: "reading",
    title: ["Immersive Reader", "Lector inmersivo"],
    text: [
      "Guided read-aloud, spoken practice, dictionary and word bank.",
      "Lectura guiada, práctica oral, diccionario y banco de palabras.",
    ],
  },
  {
    id: "reading-room",
    group: "explore",
    featured: true,
    learningArea: "reading",
    href: "reading-room",
    icon: "reading",
    title: ["Reading Room", "Sala de lectura"],
    text: ["Choose a text, annotate evidence.", "Elige un texto y anota la evidencia."],
  },
  {
    id: "science-of-reading-path",
    group: "explore",
    learningArea: "phonics",
    href: "science-of-reading/path",
    icon: "reading",
    title: ["Decoding and connected reading", "Decodificación y lectura conectada"],
    text: [
      "Learn a spelling pattern, practice it, then read connected text.",
      "Aprende un patrón de escritura, practícalo y luego lee un texto conectado.",
    ],
  },
  {
    id: "vocabulary-investigations",
    group: "explore",
    learningArea: "vocabulary",
    href: "vocab-curriculum",
    icon: "words",
    title: ["Vocabulary investigations", "Investigaciones de vocabulario"],
    text: [
      "Explore word meaning, relationships, context, and use.",
      "Explora el significado, las relaciones, el contexto y el uso de las palabras.",
    ],
  },
  {
    id: "subject-reading",
    group: "explore",
    learningArea: "content-reading",
    bands: ["3-5", "6-8"],
    href: "subject-reading",
    icon: "evidence",
    title: ["Read across subjects", "Lee sobre distintas materias"],
    text: [
      "Use vocabulary and evidence to explain ideas in science and more.",
      "Usa vocabulario y evidencia para explicar ideas de ciencias y otras materias.",
    ],
  },
  {
    id: "worlds",
    group: "explore",
    href: "worlds",
    icon: "worlds",
    title: ["Language Worlds", "Mundos lingüísticos"],
    text: [
      "Four worlds of missions with real choices.",
      "Cuatro mundos de misiones con decisiones reales.",
    ],
  },
  {
    id: "reality",
    group: "explore",
    href: "reality",
    icon: "worlds",
    title: ["Language Reality Engine", "Motor de Realidad Lingüística"],
    text: [
      "Mystery Academy, Future City, Science Expedition.",
      "Academia de Misterios, Ciudad del Futuro, Expedición Científica.",
    ],
  },
  {
    id: "learn",
    group: "explore",
    href: "learn",
    icon: "bulb",
    title: ["Interactive Learn Hub", "Centro interactivo de aprendizaje"],
    text: [
      "Notice a language move, predict, respond, apply.",
      "Observa un recurso del lenguaje, predice, responde y aplica.",
    ],
  },
  {
    id: "missions",
    group: "explore",
    href: "missions",
    icon: "mission",
    title: ["Academic missions", "Misiones académicas"],
    text: ["Listen, read, decide, speak and write.", "Escucha, lee, decide, habla y escribe."],
  },
  {
    id: "scaffold",
    group: "explore",
    href: "scaffold",
    icon: "writing",
    title: ["Language builders", "Constructores de lenguaje"],
    text: [
      "Build sentences, use evidence, upgrade words.",
      "Forma oraciones, usa evidencia y mejora palabras.",
    ],
  },
  {
    id: "detective",
    group: "explore",
    href: "detective",
    icon: "detective",
    title: ["Error Detective", "Detective de errores"],
    text: [
      "Find a pattern in your work and fix it.",
      "Encuentra un patrón en tu trabajo y corrígelo.",
    ],
  },
  {
    id: "vocabulary",
    group: "explore",
    href: "vocabulary",
    icon: "words",
    title: ["Word Builder", "Constructor de palabras"],
    text: ["Prefixes, roots and academic words.", "Prefijos, raíces y palabras académicas."],
  },
  {
    id: "ladder",
    group: "explore",
    href: "ladder",
    icon: "reading",
    title: ["Reading Ladder", "Escalera de lectura"],
    text: ["Texts that step up or down as you read.", "Textos que suben o bajan según tu lectura."],
  },
  {
    id: "puzzles",
    group: "explore",
    href: "puzzles",
    icon: "grid",
    title: ["Puzzle Den", "Rincón de rompecabezas"],
    text: ["Build sentences, solve clues.", "Forma oraciones y resuelve pistas."],
  },
  {
    id: "stories",
    group: "explore",
    href: "stories",
    icon: "worlds",
    title: ["Neighborhood Notes", "Notas del vecindario"],
    text: [
      "Short stories to read, hear and talk about.",
      "Cuentos cortos para leer, escuchar y comentar.",
    ],
  },
  {
    id: "publisher-demo",
    group: "explore",
    href: "publisher-demo",
    icon: "library",
    title: ["One topic, four skills", "Un tema, cuatro habilidades"],
    text: [
      "One topic through listening, reading, speaking and writing.",
      "Un tema a través de escuchar, leer, hablar y escribir.",
    ],
  },
  {
    id: "road",
    group: "explore",
    href: "road",
    icon: "road",
    title: ["Road to ACCESS", "Camino a ACCESS"],
    text: ["A 12-week plan, one stop a week.", "Un plan de 12 semanas, una parada por semana."],
  },
  {
    id: "studios",
    group: "explore",
    href: "library#studios",
    icon: "classroom",
    title: ["WIDA practice studios", "Estudios de práctica WIDA"],
    text: [
      "Listening, reading, speaking and writing studios.",
      "Estudios para escuchar, leer, hablar y escribir.",
    ],
  },

  {
    id: "units",
    group: "explore",
    featured: true,
    href: "units",
    icon: "road",
    title: ["Thematic Units", "Unidades temáticas"],
    text: ["Big themes with five lessons and a project.", "Grandes temas con cinco lecciones y un proyecto."],
  },
  {
    id: "argument-arena",
    group: "explore",
    featured: true,
    href: "arena",
    icon: "conversation",
    title: ["Argument Arena", "Arena de argumentos"],
    text: ["Read evidence, build an argument and answer another point of view.", "Lee evidencia, construye un argumento y responde a otro punto de vista."],
  },
  { id: "mentor-texts", group: "explore", href: "mentor", icon: "reading", title: ["Mentor Text Explorer", "Explorador de textos modelo"], text: ["Find the moves authors make, keep them in a toolbox, then try them.", "Encuentra los recursos de los autores, guárdalos y luego pruébalos."] },
  { id: "sentence-lab", group: "explore", href: "sentences", icon: "writing", title: ["Sentence Lab", "Laboratorio de oraciones"], text: ["Build, join and fix sentences with a live sentence machine.", "Construye, une y corrige oraciones con una máquina de oraciones."] },
  { id: "word-lab", group: "explore", href: "wordlab", icon: "words", title: ["Word Lab", "Laboratorio de palabras"], text: ["Build words from parts, find Spanish twins and grow your word garden.", "Construye palabras con sus partes, encuentra gemelas en español y haz crecer tu jardín de palabras."] },
  { id: "real-life-scenarios", group: "explore", href: "scenarios", icon: "conversation", title: ["Real-Life Scenarios", "Escenas de la vida real"], text: ["Choose what to say in everyday conversations.", "Elige qué decir en conversaciones cotidianas."] },
  { id: "newsroom", group: "explore", href: "newsroom", icon: "launch", title: ["Newsroom", "Sala de redacción"], text: ["Plan, write, record and print your own front page.", "Planea, escribe, graba e imprime tu propia portada."] },
  { id: "collection", group: "explore", href: "collection", icon: "medal", title: ["My collection book", "Mi libro de colección"], text: ["Revisit the milestones and keepsakes from my practice.", "Vuelve a ver los logros y recuerdos de mi práctica."] },

  // ── teach ──────────────────────────────────────────────────────────────────
  {
    id: "teacher-hub",
    group: "teach",
    featured: true,
    href: "/access-teacher/",
    icon: "teacher",
    title: ["Teacher Hub", "Centro docente"],
    text: ["Class evidence, rubrics and review.", "Evidencia de la clase, rúbricas y revisión."],
  },
  {
    id: "units-plan",
    group: "teach",
    href: "units",
    icon: "calendar",
    title: ["Unit pacing and packets", "Ritmo y paquetes de unidades"],
    text: ["Pacing guides, printable packets and class assignments.", "Guías de ritmo, paquetes imprimibles y tareas de clase."],
  },
  {
    id: "assign",
    group: "teach",
    href: "/access-teacher/#accAssign",
    icon: "launch",
    title: ["Assign practice", "Asignar práctica"],
    text: [
      "Build a practice set and share it as a link.",
      "Crea un conjunto de práctica y compártelo con un enlace.",
    ],
  },
  {
    id: "launch-studio",
    group: "teach",
    href: "launch-studio",
    icon: "launch",
    title: ["Launch Studio", "Estudio de lanzamiento"],
    text: [
      "QR codes and direct links for any activity.",
      "Códigos QR y enlaces directos para cualquier actividad.",
    ],
  },
  {
    id: "classroom",
    group: "teach",
    href: "classroom",
    icon: "classroom",
    title: ["Whole-Class Studio", "Estudio para toda la clase"],
    text: [
      "Projector-ready routines for the whole class.",
      "Rutinas listas para proyectar a toda la clase.",
    ],
  },
  {
    id: "class-evidence",
    group: "teach",
    href: "/access-teacher/#classEvidence",
    icon: "evidence",
    title: ["My class", "Mi clase"],
    text: [
      "What your students practiced and where they need help.",
      "Lo que practicaron tus estudiantes y dónde necesitan ayuda.",
    ],
  },
  {
    id: "printables",
    group: "teach",
    href: "/access-teacher/#printables",
    icon: "print",
    title: ["Printable packets", "Paquetes imprimibles"],
    text: [
      "Student packets, and teacher packets with keys.",
      "Paquetes para estudiantes y paquetes docentes con respuestas.",
    ],
  },
  {
    id: "exhibition-teacher",
    group: "teach",
    href: "exhibition/teacher",
    icon: "worlds",
    title: ["Language World teacher notes", "Notas docentes del Mundo del lenguaje"],
    text: [
      "Objectives, Key Language Uses, supports.",
      "Objetivos, usos clave del lenguaje y apoyos.",
    ],
  },
  {
    id: "journey-guide",
    group: "teach",
    href: "journey/guide",
    icon: "teacher",
    title: ["Journey teacher guide", "Guía docente del viaje"],
    text: ["How the 12 missions work in class.", "Cómo funcionan las 12 misiones en clase."],
  },
  {
    id: "teacher-expedition",
    group: "teach",
    href: "/access-expedition/",
    icon: "flag",
    title: ["Teacher Expedition", "Expedición docente"],
    text: [
      "A guided tour of the lab for teachers.",
      "Un recorrido guiado del laboratorio para docentes.",
    ],
  },

  {
    id: "live-class",
    group: "teach",
    featured: true,
    href: "/access-teacher/#liveClass",
    icon: "classroom",
    title: ["Live class", "Clase en vivo"],
    text: [
      "Create a class, send assignments and run a quiz.",
      "Crea una clase, envía tareas y dirige un cuestionario.",
    ],
  },
  {
    id: "class-teacher",
    group: "teach",
    href: "class/teacher",
    icon: "teacher",
    title: ["Class roster and voice notes", "Lista de la clase y notas de voz"],
    text: [
      "See who needs help and answer with a voice note.",
      "Mira quién necesita ayuda y responde con una nota de voz.",
    ],
  },
  {
    id: "voice-lab",
    group: "explore",
    featured: true,
    bands: ["3-5", "6-8"],
    href: "voice",
    icon: "speaking",
    title: ["Voice Lab", "Laboratorio de voz"],
    text: [
      "Listen to a model, then speak, shadow and retell.",
      "Escucha un modelo y luego habla, repite y vuelve a contar.",
    ],
  },
  {
    id: "voice-sounds",
    group: "explore",
    bands: ["3-5", "6-8"],
    href: "voice#voice-sounds",
    icon: "words",
    title: ["Sound Bridge", "Puente de sonidos"],
    text: [
      "A listening game for sounds that sound alike.",
      "Un juego de escucha para sonidos parecidos.",
    ],
  },
  {
    id: "grammar",
    group: "explore",
    featured: true,
    bands: ["3-5", "6-8"],
    href: "grammar",
    icon: "writing",
    title: ["Grammar check-in", "Chequeo de gramática"],
    text: [
      "Find what to practice next, then use a numbered pack.",
      "Descubre qué practicar y usa un paquete numerado.",
    ],
  },
  {
    id: "benchmarks",
    group: "explore",
    bands: ["3-5", "6-8"],
    href: "tests#benchmarks",
    icon: "grid",
    title: ["Fall, winter and spring check", "Chequeo de otoño, invierno y primavera"],
    text: [
      "See growth in each skill across the year.",
      "Mira el crecimiento en cada destreza durante el año.",
    ],
  },
  {
    id: "growth",
    group: "explore",
    href: "growth",
    icon: "growth",
    title: ["My growth shields", "Mis escudos de crecimiento"],
    text: [
      "See skill shields with words and pictures.",
      "Mira los escudos de cada destreza con palabras e imágenes.",
    ],
  },
  {
    id: "early-home",
    group: "explore",
    featured: true,
    bands: ["K", "1", "2-3"],
    href: "early",
    icon: "sparkle",
    title: ["Little Learners", "Pequeños aprendices"],
    text: [
      "Listen, tap and play: Kindergarten to Grade 3.",
      "Escucha, toca y juega: de kínder a tercer grado.",
    ],
  },
  {
    id: "early-story",
    group: "explore",
    bands: ["K"],
    href: "early/story?grades=K",
    icon: "reading",
    title: ["Story Time: Our Neighborhood Garden", "Hora del cuento: Nuestro jardín del vecindario"],
    text: [
      "A story an adult reads aloud together with a child.",
      "Un cuento que un adulto lee en voz alta con el niño.",
    ],
  },
  {
    id: "class-quiz",
    group: "explore",
    bands: ["3-5", "6-8"],
    href: "class/quiz",
    icon: "flag",
    title: ["Class quiz", "Cuestionario de la clase"],
    text: [
      "Join my teacher's live quiz with a code.",
      "Únete al cuestionario en vivo de mi maestro con un código.",
    ],
  },

  // ── family ─────────────────────────────────────────────────────────────────
  {
    id: "family-corner",
    group: "family",
    featured: true,
    href: "family",
    icon: "families",
    title: ["Family Corner", "Rincón de la familia"],
    text: [
      "A plain-language guide, in English and Spanish.",
      "Una guía en lenguaje sencillo, en inglés y español.",
    ],
  },
  {
    id: "family-units",
    group: "family",
    href: "units",
    icon: "families",
    title: ["Unit letters for families", "Cartas de unidad para las familias"],
    text: ["See what your child is learning, in English and Spanish.", "Mira lo que aprende tu hijo, en inglés y español."],
  },
  {
    id: "family-portfolio",
    group: "family",
    href: "portfolio?view=family",
    icon: "families",
    title: ["Share my portfolio with family", "Compartir mi portafolio con la familia"],
    text: ["Show selected work in a family-friendly view.", "Muestra el trabajo elegido en una vista para la familia."],
  },
  {
    id: "family-understand",
    group: "family",
    href: "family/understand",
    icon: "info",
    title: ["What is ACCESS?", "¿Qué es ACCESS?"],
    text: [
      "What the test is and what practice can do.",
      "Qué es la prueba y qué puede hacer la práctica.",
    ],
  },
  {
    id: "family-adventure",
    group: "family",
    href: "/access-family-expedition/",
    icon: "sparkle",
    title: ["Family Adventure", "Aventura familiar"],
    text: ["A guided tour to do together.", "Un recorrido guiado para hacer juntos."],
  },
  {
    id: "family-tour",
    group: "family",
    href: "/access-family-tour/",
    icon: "road",
    title: ["Family Expedition", "Expedición familiar"],
    text: [
      "See how the lab works, step by step.",
      "Mira cómo funciona el laboratorio, paso a paso.",
    ],
  },
  {
    id: "flashcards",
    group: "family",
    href: "flashcards",
    icon: "words",
    title: ["Word cards and partner talk", "Tarjetas de palabras y conversación en pareja"],
    text: [
      "Practice words together, a few minutes at a time.",
      "Practiquen palabras juntos, unos minutos a la vez.",
    ],
  },
];

/** Cards for one group and band, in registry order. */
export const cardsFor = (group, band) =>
  HOME_CARDS.filter((c) => c.group === group && (!c.bands || c.bands.includes(band)));

/** Existing learning destinations with reviewed area metadata, shared by home and activity discovery. */
export const learningAreaCards = (band) =>
  HOME_CARDS.filter((card) => card.group === "explore" && card.learningArea && (!card.bands || card.bands.includes(band)));

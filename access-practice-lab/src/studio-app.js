// The Learning Studios app: language studios for grades 3-8, its own Worker, served inside this site at /studios by
// functions/_lib/studios-proxy.js. Its pages are not files in this repo, so the site's listings cannot find them by
// scanning. THIS file is the one list of them: the site map (sitemap.js), the XML sitemap (functions/_lib/language-page.js),
// the site search (lang/site-search.js) and the landing page (learning-studios/index.html) all read it, and
// tools/studio-app-listing.test.mjs fails if any of them drifts. Adding a studio to the app is one entry here.
//
// Pure data: no DOM, so Node tests and the Functions can import it.

export const STUDIO_APP_BASE = "/studios";

const STF = ["student", "teacher", "family"];

/** [english, spanish] */
const P = (en, es) => [en, es];

export const STUDIO_APP_PAGES = Object.freeze([
  {
    id: "studio-app",
    path: "/studios/language",
    section: "practice",
    skill: "Mixed",
    kind: "studio",
    for: STF,
    icon: "worlds",
    keys: ["learning studios", "estudios de aprendizaje", "studios"],
    title: P("Language Studios", "Estudios del lenguaje"),
    text: P(
      "Speaking, writing, WordLab, reading, foundations, games, and stories for grades 3–5 and 6–8.",
      "Hablar, escribir, WordLab, lectura, fundamentos, juegos y cuentos para los grados 3–5 y 6–8.",
    ),
  },
  {
    id: "studio-app-speaking",
    path: "/studios/language/speaking",
    section: "practice",
    skill: "Speaking",
    kind: "studio",
    for: STF,
    icon: "speaking",
    keys: ["speaking tasks", "record", "rehearse", "hablar"],
    title: P("Speaking tasks · Learning Studios", "Tareas de hablar · Estudios de aprendizaje"),
    text: P(
      "Plan, rehearse, record, listen back, and improve. Twenty-four tasks, twelve per grade band.",
      "Planifica, ensaya, graba, escucha y mejora. Veinticuatro tareas, doce por grado.",
    ),
  },
  {
    id: "studio-app-writing",
    path: "/studios/language/writing",
    section: "practice",
    skill: "Writing",
    kind: "studio",
    for: STF,
    icon: "writing",
    keys: ["writing workshop", "paragraph", "revise", "escribir"],
    title: P("Writing workshop · Learning Studios", "Taller de escritura · Estudios de aprendizaje"),
    text: P(
      "Build sentences, expand ideas, order paragraphs, and revise a draft. Twenty-four lessons.",
      "Construye oraciones, amplía ideas, ordena párrafos y revisa un borrador. Veinticuatro lecciones.",
    ),
  },
  {
    id: "studio-app-words",
    path: "/studios/language/words",
    section: "practice",
    skill: "Words",
    kind: "studio",
    for: STF,
    icon: "words",
    keys: ["wordlab", "vocabulary", "word sets", "vocabulario", "palabras"],
    title: P("WordLab · Learning Studios", "Laboratorio de palabras · Estudios de aprendizaje"),
    text: P(
      "Meet each word in context, use it, build it, and bring it back later. Twenty-four word sets.",
      "Conoce cada palabra en contexto, úsala, constrúyela y recuérdala después. Veinticuatro conjuntos de palabras.",
    ),
  },
  {
    id: "studio-app-reading",
    path: "/studios/language/reading",
    section: "practice",
    skill: "Reading",
    kind: "studio",
    for: STF,
    icon: "reading",
    keys: ["reading expeditions", "evidence", "inference", "leer", "lectura"],
    title: P("Reading expeditions · Learning Studios", "Expediciones de lectura · Estudios de aprendizaje"),
    text: P(
      "Short texts in science, math, social studies, and language arts, with evidence and an inference.",
      "Textos cortos de ciencias, matemáticas, estudios sociales y artes del lenguaje, con evidencia e inferencias.",
    ),
  },
  {
    id: "studio-app-foundations",
    path: "/studios/language/foundations",
    section: "practice",
    skill: "Reading",
    kind: "studio",
    for: STF,
    icon: "listening",
    keys: ["foundations", "phonics", "decoding", "syllables", "roots", "fonética", "fundamentos"],
    title: P("Foundations · Learning Studios", "Fundamentos · Estudios de aprendizaje"),
    text: P(
      "Hear it, learn the pattern, build the word, read it, check it, and use it. Sounds in grades 3–5; syllables and roots in 6–8.",
      "Escúchalo, aprende el patrón, construye la palabra, léela, compruébala y úsala. Sonidos en 3–5; sílabas y raíces en 6–8.",
    ),
  },
  {
    id: "studio-app-games",
    path: "/studios/language/games",
    section: "play",
    skill: "Mixed",
    kind: "game",
    for: STF,
    icon: "sparkle",
    keys: ["mystery", "dialogue quest", "word forge", "publishing studio", "juegos"],
    title: P("Language games · Learning Studios", "Juegos del lenguaje · Estudios de aprendizaje"),
    text: P(
      "Mystery Evidence Files, Dialogue Quest, Word Forge, and The Publishing Studio. Untimed, with a way to recover.",
      "Archivos de evidencia, Misión de diálogo, Forja de palabras y El estudio de publicación. Sin cronómetro.",
    ),
  },
  {
    id: "studio-app-stories",
    path: "/studios/language/stories",
    section: "play",
    skill: "Writing",
    kind: "story",
    for: STF,
    icon: "sparkle",
    keys: ["story mixer", "mad libs", "madlibs", "fill in the blanks", "scenario studio", "cuentos"],
    title: P("Story Mixer · Learning Studios", "Mezcla de cuentos · Estudios de aprendizaje"),
    text: P(
      "Mad-libs style stories. Grades 3–5 pick the right kind of word; grades 6–8 choose transitions, evidence, and modals.",
      "Cuentos para completar. Los grados 3–5 eligen el tipo de palabra; los grados 6–8 eligen transiciones, evidencia y modales.",
    ),
  },
  {
    id: "studio-app-teacher",
    path: "/studios/language/teacher",
    section: "teach",
    skill: "Mixed",
    kind: "guide",
    for: ["teacher"],
    icon: "teacher",
    keys: ["teacher notes", "lesson list", "docentes"],
    title: P("Learning Studios · teacher notes", "Estudios de aprendizaje · notas para docentes"),
    text: P(
      "Every speaking task, writing lesson, and story with its objective and how to use it.",
      "Cada tarea de hablar, lección de escritura y cuento con su objetivo y cómo usarlo.",
    ),
  },
  {
    id: "studio-app-family",
    path: "/studios/language/family",
    section: "family",
    skill: "Mixed",
    kind: "guide",
    for: ["family"],
    icon: "families",
    keys: ["family guide", "guía para familias"],
    title: P("Learning Studios · family guide", "Estudios de aprendizaje · guía para familias"),
    text: P(
      "English and Spanish directions for helping at home without giving the answer.",
      "Indicaciones en inglés y español para ayudar en casa sin dar la respuesta.",
    ),
  },
]);

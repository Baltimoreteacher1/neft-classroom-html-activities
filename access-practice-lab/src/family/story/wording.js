// Every sentence a family reads in the Family Language Story, in English and Spanish. The story model only chooses
// entries by id; the share link carries ids and a few teacher-approved words, never this prose. Plain language at
// about a grade-5 reading level, one idea per sentence. No score, level, percent, timer or proficiency label
// (LANGUAGE-INTELLIGENCE.md); tools/access-family-story.test.mjs checks both languages for banned words and level.
// `{s}` is the child's first name (or "Your child" / "Su hijo o hija"). Spanish is machine-drafted and awaits a
// native-speaker review, like the rest of the family pages.

export const DOMAIN_IDS = Object.freeze({
  L: "Listening",
  R: "Reading",
  S: "Speaking",
  W: "Writing",
});
export const DOMAIN_ORDER = Object.freeze(["L", "R", "S", "W"]);

/** The four skills as short verbs a child already knows. */
export const DOMAIN_WORD = Object.freeze({
  L: { en: "Listening", es: "Escuchar" },
  R: { en: "Reading", es: "Leer" },
  S: { en: "Speaking", es: "Hablar" },
  W: { en: "Writing", es: "Escribir" },
});

/** Subject when the teacher did not add a first name. */
export const SUBJECT = Object.freeze({ en: "Your child", es: "Su hijo o hija" });

/**
 * One thing to celebrate. Ids are stable (they are in saved links). The first nine match the Language Intelligence
 * Engine's strength ids (src/intel/wording.js); `ef` is the effort line used when there is no quote.
 */
export const CELEBRATE = Object.freeze({
  lk: {
    engine: "links",
    en: "{s} joined ideas together in more than one way.",
    es: "{s} unió ideas de más de una manera.",
  },
  sr: {
    engine: "source",
    en: "{s} pointed to the text to back up an idea.",
    es: "{s} señaló el texto para apoyar una idea.",
  },
  cx: {
    engine: "complex",
    en: "{s} held two ideas together in one sentence.",
    es: "{s} mantuvo dos ideas juntas en una oración.",
  },
  np: {
    engine: "noun-phrase",
    en: "{s} added rich detail to describe things.",
    es: "{s} agregó muchos detalles para describir cosas.",
  },
  sw: {
    engine: "subject-words",
    en: "{s} used exact words from the topic.",
    es: "{s} usó palabras exactas del tema.",
  },
  ow: {
    engine: "own-words",
    en: "{s} shared ideas in their own words.",
    es: "{s} compartió ideas con sus propias palabras.",
  },
  mv: {
    engine: "move",
    en: "{s} did just what the task asked.",
    es: "{s} hizo justo lo que pedía la tarea.",
  },
  ef: {
    engine: null,
    en: "{s} kept practicing, and that matters.",
    es: "{s} siguió practicando, y eso importa.",
  },
});
export const CELEBRATE_IDS = Object.freeze(Object.keys(CELEBRATE));
/** The engine's strength ids include `move-<name>` for each task move (src/intel/engine.js); they share one sentence. */
export const celebrateIdFor = (engineId) =>
  CELEBRATE_IDS.find((id) => CELEBRATE[id].engine === (String(engineId).startsWith("move-") ? "move" : engineId)) || "ef";

/**
 * Conversation starters, tied to the skill and, for speaking and writing, to the kind of language practiced
 * (`use`: narrate, explain, argue). `ask` is what the grown-up says; `frame` is a sentence frame the child can use
 * in English, Spanish or both.
 */
export const STARTERS = Object.freeze({
  l1: {
    domain: "L",
    ask: {
      en: "Ask: What did you hear in class this week? Tell me one thing.",
      es: "Pregunten: ¿Qué escuchaste en clase esta semana? Cuéntame una cosa.",
    },
    frame: { en: "I heard ___.", es: "Escuché ___." },
  },
  l2: {
    domain: "L",
    ask: {
      en: "Play a short song or video together. Ask: What was it about?",
      es: "Pongan juntos una canción o un video corto. Pregunten: ¿De qué trataba?",
    },
    frame: { en: "It was about ___.", es: "Trataba de ___." },
  },
  l3: {
    domain: "L",
    ask: {
      en: "Say one sentence. Ask your child to say it back in their own words.",
      es: "Digan una oración. Pídanle que la repita con sus propias palabras.",
    },
    frame: { en: "You said ___.", es: "Dijiste ___." },
  },
  r1: {
    domain: "R",
    ask: {
      en: "Read one short page together, in any language. Ask: Which part shows that? Point to it.",
      es: "Lean juntos una página corta, en cualquier idioma. Pregunten: ¿Qué parte lo muestra? Señálala.",
    },
    frame: { en: "I know because the text says ___.", es: "Lo sé porque el texto dice ___." },
  },
  r2: {
    domain: "R",
    ask: {
      en: "Ask: What new word did you learn? What does it mean?",
      es: "Pregunten: ¿Qué palabra nueva aprendiste? ¿Qué significa?",
    },
    frame: {
      en: "A new word is ___. It means ___.",
      es: "Una palabra nueva es ___. Significa ___.",
    },
  },
  r3: {
    domain: "R",
    ask: {
      en: "Ask: What is the big idea? Why do you think so?",
      es: "Pregunten: ¿Cuál es la idea principal? ¿Por qué lo crees?",
    },
    frame: { en: "The big idea is ___.", es: "La idea principal es ___." },
  },
  sn: {
    domain: "S",
    use: "narrate",
    ask: {
      en: "Ask: What happened first, next, and last today?",
      es: "Pregunten: ¿Qué pasó primero, después y al final hoy?",
    },
    frame: {
      en: "First ___. Then ___. Last ___.",
      es: "Primero ___. Luego ___. Al final ___.",
    },
  },
  se: {
    domain: "S",
    use: "explain",
    ask: {
      en: "Ask: How does it work? Can you explain it to me?",
      es: "Pregunten: ¿Cómo funciona? ¿Me lo puedes explicar?",
    },
    frame: { en: "It works because ___.", es: "Funciona porque ___." },
  },
  sa: {
    domain: "S",
    use: "argue",
    ask: {
      en: "Ask: What do you think? Why do you think that?",
      es: "Pregunten: ¿Qué piensas? ¿Por qué lo piensas?",
    },
    frame: { en: "I think ___ because ___.", es: "Creo que ___ porque ___." },
  },
  wn: {
    domain: "W",
    use: "narrate",
    ask: {
      en: "Ask your child to write two sentences about today. Read them out loud together.",
      es: "Pídanle que escriba dos oraciones sobre hoy. Léanlas juntos en voz alta.",
    },
    frame: { en: "First ___. Then ___.", es: "Primero ___. Luego ___." },
  },
  we: {
    domain: "W",
    use: "explain",
    ask: {
      en: "Ask your child to write one sentence that explains an idea. Add the word because.",
      es: "Pídanle que escriba una oración que explique una idea con la palabra because.",
    },
    frame: { en: "___ because ___.", es: "___ because ___." },
  },
  wa: {
    domain: "W",
    use: "argue",
    ask: {
      en: "Ask your child to write what they think and one reason. Read it out loud together.",
      es: "Pídanle que escriba lo que piensa y una razón. Léanlo juntos en voz alta.",
    },
    frame: { en: "I think ___. One reason is ___.", es: "Creo que ___. Una razón es ___." },
  },
});
export const STARTER_IDS = Object.freeze(Object.keys(STARTERS));

/** The translanguaging line printed with every starter: any language counts. */
export const EITHER = Object.freeze({
  en: "Say it in English, Spanish, or both. All your words count.",
  es: "Díganlo en inglés, en español o en los dos. Todas sus palabras cuentan.",
});

/** How a quote is introduced: `{s} wrote:` or `{s} said:`. */
export const QUOTE_LEAD = Object.freeze({
  w: { en: "In class, {s} wrote:", es: "En clase, {s} escribió:" },
  s: { en: "In class, {s} said:", es: "En clase, {s} dijo:" },
});

export const WEEK = Object.freeze({
  days: {
    one: { en: "{s} practiced on 1 day this week.", es: "{s} practicó 1 día esta semana." },
    many: {
      en: "{s} practiced on {n} days this week.",
      es: "{s} practicó {n} días esta semana.",
    },
    none: {
      en: "This week was quiet. That is okay. A short talk at home is a good way to start.",
      es: "Esta semana fue tranquila. Está bien. Una conversación corta en casa es una buena forma de empezar.",
    },
  },
  skills: { en: "Skills practiced:", es: "Destrezas practicadas:" },
  skillsNone: {
    en: "No skills yet. We start together.",
    es: "Aún no hay destrezas. Empezamos juntos.",
  },
});

export const NOTE_FROM = Object.freeze({
  en: "A note from the teacher",
  es: "Una nota del maestro o la maestra",
});

/** Text of the message a family can send back. English first (the teacher reads it), Spanish second. */
export const REPLY = Object.freeze({
  tried: { en: "We tried the talk at home.", es: "Hicimos la conversación en casa." },
  easy: { en: "It went well.", es: "Nos fue bien." },
  hard: { en: "It was hard for us.", es: "Nos costó un poco." },
  help: { en: "We would like some help.", es: "Nos gustaría recibir ayuda." },
  both: { en: "We used English and Spanish.", es: "Usamos inglés y español." },
  thanks: { en: "Thank you!", es: "¡Gracias!" },
});

export const FINE = Object.freeze({
  en: "This note describes classroom practice. It is not a test result.",
  es: "Esta nota describe la práctica en clase. No es un resultado de examen.",
});

export const FROM_LINK = Object.freeze({
  en: "This page was made from a link. Only trust links your teacher gave you.",
  es: "Esta página se hizo a partir de un enlace. Confíen solo en enlaces que les dio su maestro o maestra.",
});

/** Fill `{s}` and `{n}`. */
export const fill = (text, vars = {}) =>
  String(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

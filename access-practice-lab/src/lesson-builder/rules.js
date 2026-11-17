// Lesson Builder rules: pure data, no DOM. Read by src/lesson-builder/assemble.js and tools/lesson-builder.test.mjs.
//
// Everything a teacher sees in a built lesson comes from these tables plus real activity rows from
// content/index.json. Support profiles reuse the lab's own support choices (levels A/B/C, util.js TIERS). They are
// classroom support choices informed by the WIDA ELD framework, never WIDA proficiency levels, scores or diagnoses.
// Key Language Use names follow the WIDA ELD Standards Framework (2020); every frame and word bank here is original.
import { TIERS } from "../util.js";

export const BUILDER_BANDS = ["3-5", "6-8"];
export const BUILDER_DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
export const INTERPRETIVE = ["Listening", "Reading"];
export const EXPRESSIVE = ["Speaking", "Writing"];
export const DURATIONS = [10, 20, 30, 45];
export const SUPPORT_KEYS = ["A", "B", "C"];

/** Support presets. `wida` names the WIDA levels a profile often suits, as a hint for the teacher, not a placement. */
export const SUPPORT_PROFILES = {
  A: {
    name: [TIERS.A.name, TIERS.A.es],
    wida: ["Often fits Entering / Emerging", "Suele servir para Iniciando / Emergente"],
    plain: [
      "The most help: pictures, read-aloud, word banks and short sentence frames.",
      "La mayor ayuda: imágenes, lectura en voz alta, bancos de palabras y marcos cortos.",
    ],
    teacher:
      "Model the frame aloud first, point to the word bank, and accept words, gestures, drawings or home-language talk on the way to an English sentence.",
    student: "Use the word bank and the sentence frame. You can point, draw or say it first.",
  },
  B: {
    name: [TIERS.B.name, TIERS.B.es],
    wida: ["Often fits Developing", "Suele servir para En desarrollo"],
    plain: [
      "Some help: models and word help are there when students ask.",
      "Algo de ayuda: modelos y ayuda con palabras cuando los piden.",
    ],
    teacher:
      "Show one model answer, keep the frames posted, and invite students to add a reason or detail to each sentence.",
    student: "Use a sentence frame if you need it. Add a reason or a detail.",
  },
  C: {
    name: [TIERS.C.name, TIERS.C.es],
    wida: [
      "Often fits Expanding / Bridging / Reaching",
      "Suele servir para En expansión / Puente / Alcanzando",
    ],
    plain: [
      "Less help: longer texts and open answers, with help still one tap away.",
      "Menos ayuda: textos más largos y respuestas abiertas, con ayuda a un toque.",
    ],
    teacher:
      "Offer the frames as optional, push for precise academic words, and ask students to connect two ideas in one answer.",
    student: "Answer in your own words. Connect two ideas and use precise words.",
  },
};

export const SUPPORT_NOTE = [
  "Support profiles are flexible classroom presets, not WIDA proficiency levels, scores or diagnoses. Change them whenever a student needs more or less help.",
  "Los perfiles de apoyo son ajustes flexibles para la clase, no niveles de dominio WIDA, puntajes ni diagnósticos. Cámbielos cuando un estudiante necesite más o menos ayuda.",
];

/**
 * Language functions. `match` is tested against an activity's title + skill; `klu` is the WIDA Key Language Use the
 * function most often serves; `frames` holds one frame set per support profile; `words` is the vocabulary preview.
 */
export const FUNCTIONS = {
  describe: {
    label: ["Describe", "Describir"],
    klu: "Inform",
    verb: "describe",
    match: /describ|detail|adjectiv|picture|character|feature/i,
    words: ["detail", "feature", "looks like", "sounds like", "size", "shape"],
    frames: {
      A: ["It is ___.", "It has ___."],
      B: ["The ___ is ___ because it has ___.", "I notice ___."],
      C: ["One important detail about ___ is ___, which shows ___.", "___ stands out because ___."],
    },
  },
  explain: {
    label: ["Explain", "Explicar"],
    klu: "Explain",
    verb: "explain",
    match: /explain|because|cause|why|how/i,
    words: ["because", "so", "reason", "cause", "effect", "as a result"],
    frames: {
      A: ["___ because ___.", "It happens because ___."],
      B: ["___ happens because ___. So, ___.", "The reason is ___."],
      C: [
        "The main reason ___ is that ___. As a result, ___.",
        "This happens when ___, which causes ___.",
      ],
    },
  },
  compare: {
    label: ["Compare", "Comparar"],
    klu: "Inform",
    verb: "compare",
    match: /compar|contrast|differ|similar|\bvs\b|both/i,
    words: ["same", "different", "both", "but", "however", "while"],
    frames: {
      A: ["___ and ___ are both ___.", "___ is ___, but ___ is ___."],
      B: ["___ and ___ are alike because ___.", "They are different because ___."],
      C: ["While ___ is ___, ___ is ___.", "However, both ___ and ___ ___."],
    },
  },
  infer: {
    label: ["Infer", "Inferir"],
    klu: "Explain",
    verb: "infer",
    match: /infer|predict|conclu|clue|implied|guess/i,
    words: ["clue", "I think", "probably", "suggests", "predict", "evidence"],
    frames: {
      A: ["I think ___ because I see ___.", "The clue is ___."],
      B: ["The clue ___ tells me that ___.", "___ probably ___ because ___."],
      C: ["Based on ___, I can infer that ___ because ___.", "The text suggests ___, since ___."],
    },
  },
  justify: {
    label: ["Justify", "Justificar"],
    klu: "Argue",
    verb: "justify an answer about",
    match: /justif|evidence|support|reason|claim|proof|prove/i,
    words: ["evidence", "reason", "shows", "proves", "according to", "support"],
    frames: {
      A: ["I know ___ because ___.", "The proof is ___."],
      B: ["My reason is ___. The evidence is ___.", "This shows ___."],
      C: ["According to ___, ___.", "This evidence supports my answer because ___."],
    },
  },
  sequence: {
    label: ["Sequence", "Ordenar en secuencia"],
    klu: "Narrate",
    verb: "put in order",
    match: /sequenc|order|steps|procedure|first|timeline|process/i,
    words: ["first", "next", "then", "after that", "finally", "before"],
    frames: {
      A: ["First, ___. Next, ___.", "Last, ___."],
      B: ["First, ___. Then, ___.", "Finally, ___."],
      C: ["Before ___, ___. After that, ___.", "This leads to ___, and finally ___."],
    },
  },
  argue: {
    label: ["Argue", "Argumentar"],
    klu: "Argue",
    verb: "argue a position about",
    match: /argu|persua|opinion|position|counterclaim|debate|defend|rebut/i,
    words: ["claim", "I believe", "should", "opinion", "counterclaim", "however"],
    frames: {
      A: ["I think ___ should ___.", "I agree / disagree because ___."],
      B: ["I believe ___ because ___.", "Some people think ___, but ___."],
      C: ["My claim is that ___.", "Although some argue ___, the evidence shows ___."],
    },
  },
  summarize: {
    label: ["Summarize", "Resumir"],
    klu: "Inform",
    verb: "summarize",
    match: /summar|main idea|gist|retell|key point/i,
    words: ["main idea", "mostly about", "key detail", "in short", "important", "retell"],
    frames: {
      A: ["This is about ___.", "One key detail is ___."],
      B: ["The main idea is ___.", "Two key details are ___ and ___."],
      C: ["In short, ___.", "The most important points are ___, ___ and ___."],
    },
  },
};
export const FUNCTION_KEYS = Object.keys(FUNCTIONS);

export const KLU_ES = {
  Inform: "Informar",
  Explain: "Explicar",
  Argue: "Argumentar",
  Narrate: "Narrar",
};

/** Topic suggestions for the optional keyword field (each one hits several real activities in both bands). */
export const TOPIC_SUGGESTIONS = [
  "science",
  "math",
  "school",
  "community",
  "story",
  "weather",
  "animals",
  "directions",
  "history",
  "health",
];

/**
 * Phase catalog. `domains` lists where the phase's activity may come from (intersected with the teacher's domains),
 * `pick` says how the activity is chosen, and `mode` is the practice mode its launch link opens in.
 *   pick "none"   → no activity (talk, vocabulary, frames)
 *   pick "best"   → highest-ranked unused activity
 *   pick "short"  → highest-ranked unused activity that fits the phase minutes
 *   pick "repeat" → the activity from the phase named in `repeatOf` (a second attempt after feedback)
 *   pick "family" → the Talk Table cards for the Key Language Use, never a classroom activity
 */
export const PHASES = {
  opening: { name: ["Opening", "Apertura"], pick: "none" },
  vocabulary: { name: ["Vocabulary preview", "Vista previa del vocabulario"], pick: "none" },
  input: {
    name: ["Comprehensible input", "Información comprensible"],
    pick: "best",
    domains: INTERPRETIVE,
    mode: "learning",
  },
  guided: {
    name: ["Guided practice", "Práctica guiada"],
    pick: "best",
    domains: BUILDER_DOMAINS,
    mode: "learning",
  },
  task: {
    name: ["Partner or independent task", "Tarea en pareja o individual"],
    pick: "best",
    domains: EXPRESSIVE,
    mode: "learning",
  },
  check: {
    name: ["Formative check", "Comprobación formativa"],
    pick: "short",
    domains: BUILDER_DOMAINS,
    mode: "independent",
  },
  feedback: {
    name: ["Feedback and second attempt", "Comentarios y segundo intento"],
    pick: "repeat",
    repeatOf: ["task", "guided"],
    mode: "learning",
  },
  exit: { name: ["Exit ticket", "Boleto de salida"], pick: "none" },
  family: {
    name: ["Family extension (optional)", "Extensión para la familia (opcional)"],
    pick: "family",
  },
};
export const PHASE_KEYS = Object.keys(PHASES);

/**
 * Phase plan per duration: [phase key, minutes]. Shorter lessons drop phases instead of squeezing them; minutes add
 * up to the duration. The family extension happens at home, so it carries 0 class minutes.
 */
export const PLANS = {
  10: [
    ["opening", 1],
    ["guided", 6],
    ["exit", 3],
    ["family", 0],
  ],
  20: [
    ["opening", 2],
    ["vocabulary", 3],
    ["guided", 8],
    ["check", 4],
    ["exit", 3],
    ["family", 0],
  ],
  30: [
    ["opening", 2],
    ["vocabulary", 3],
    ["input", 6],
    ["guided", 7],
    ["task", 6],
    ["feedback", 3],
    ["exit", 3],
    ["family", 0],
  ],
  45: [
    ["opening", 3],
    ["vocabulary", 4],
    ["input", 8],
    ["guided", 9],
    ["task", 9],
    ["check", 4],
    ["feedback", 5],
    ["exit", 3],
    ["family", 0],
  ],
};

/**
 * Ranking weights for choosing an activity (higher wins; ties keep content/index.json teaching order).
 *   keyword: each topic keyword found in title + skill
 *   fn:      the language function's pattern matches title + skill
 *   level:   the activity's level equals the support profile; `nearLevel` for an adjacent level
 *   fits:    the activity's minutes fit inside the phase minutes (+2 minutes of slack)
 * Activities two levels away from the profile (A vs C) are never chosen.
 */
export const WEIGHTS = { keyword: 5, fn: 4, level: 3, nearLevel: 1, fits: 2 };
export const FIT_SLACK = 2;

/** Opening question per language function: the "hook" a teacher asks before any activity opens. */
export const HOOKS = {
  describe: "What do you notice? Describe one detail.",
  explain: "Why do you think this happens?",
  compare: "How are these two things alike? How are they different?",
  infer: "What do you think is going on? What clue tells you?",
  justify: "What is your answer, and how do you know?",
  sequence: "What happens first? What happens next?",
  argue: "Do you agree or disagree? Why?",
  summarize: "What is the most important idea in one sentence?",
};

/** Band voice: the same phase reads a little simpler for grades 3-5 than for 6-8. */
export const BAND_VOICE = {
  "3-5": { talk: "Talk with a partner", write: "Write one sentence", think: "Think for a moment" },
  "6-8": { talk: "Discuss with a partner", write: "Write one or two sentences", think: "Take think time" },
};

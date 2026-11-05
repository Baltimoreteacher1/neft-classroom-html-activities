// Student-facing copy for My Language Path (/path), English and Spanish, kept apart from the view logic.
// Practice evidence words only: no level, score or percentage is written here.
export const DOMAIN_ES = {
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
};
export const USE_ES = { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };
export const GOALS = {
  Listening: [
    [
      "I listen for the main idea and the details that support it.",
      "Escucho la idea principal y los detalles que la apoyan.",
    ],
    [
      "I listen for time words to follow what happened.",
      "Escucho las palabras de tiempo para seguir lo que pasó.",
    ],
    ["I listen for why something happened.", "Escucho por qué pasó algo."],
  ],
  Reading: [
    ["I find the sentence that proves an idea.", "Encuentro la oración que prueba una idea."],
    [
      "I figure out a new word from the words around it.",
      "Descubro una palabra nueva por las palabras que la rodean.",
    ],
    ["I follow the order of events or steps.", "Sigo el orden de los sucesos o los pasos."],
  ],
  Speaking: [
    ["I say my idea, then give a reason.", "Digo mi idea y luego doy una razón."],
    [
      "I connect my ideas with words like because and so.",
      "Conecto mis ideas con palabras como porque y entonces.",
    ],
    ["I use exact words for my topic.", "Uso palabras exactas para mi tema."],
  ],
  Writing: [
    [
      "I write a claim and back it up with evidence.",
      "Escribo una afirmación y la apoyo con evidencia.",
    ],
    [
      "I grow a sentence with a detail and a connector.",
      "Amplío una oración con un detalle y un conector.",
    ],
    [
      "I replace general words with precise ones.",
      "Cambio las palabras generales por palabras precisas.",
    ],
  ],
};
export const SUPPORT_ES = {
  modeled: "Primero lo hacemos juntos",
  partial: "Tengo un marco y un banco de palabras",
  minimal: "Tengo una pista si la pido",
  independent: "Lo hago por mi cuenta",
};
export const NODE_ES = {
  "key-info": "Entender la información clave",
  sequence: "Ordenar sucesos",
  relationships: "Ver cómo se conectan las ideas",
  causes: "Explicar causas",
  compare: "Comparar ideas",
  vocabulary: "Usar vocabulario preciso",
  evidence: "Usar evidencia",
  discourse: "Organizar el discurso académico",
  elaborate: "Ampliar explicaciones",
  argument: "Construir argumentos",
  independence: "Comunicar con independencia",
};
export const STATE_ES = {
  "not-started": "todavía no hay evidencia",
  emerging: "hay algo de evidencia, todavía no basta para decir",
  building: "en construcción",
  "with-support": "lo mostré con apoyo",
  independent: "lo mostré por mi cuenta",
};
export const STAGE = {
  guided: ["together", "juntos"],
  supported: ["with support", "con apoyo"],
  independent: ["on my own", "por mi cuenta"],
};
export const LAYERS = [
  ["key-info", "vocabulary", "discourse"],
  ["sequence", "relationships", "evidence", "independence"],
  ["causes", "compare", "elaborate"],
  ["argument"],
];
export const NODE_TOOL = {
  elaborate: "sentence-architecture",
  discourse: "sentence-architecture",
  independence: "sentence-architecture",
  evidence: "evidence-builder",
  argument: "evidence-builder",
  vocabulary: "language-upgrade",
};
// The readiness engine's criteria are written for teachers (one names a first-try percentage); students read these.
export const CRITERIA = {
  emerging: ["Do two different tasks that use this skill, on two different days.", "Haz dos tareas distintas que usen esta destreza, en dos días distintos."],
  building: ["Make three first tries work with only a word bank, over two days.", "Logra que tres primeros intentos funcionen solo con un banco de palabras, en dos días."],
  "with-support": ["Try a new task with just one hint available and get it right on the first try.", "Intenta una tarea nueva con solo una pista disponible y hazla bien al primer intento."],
  independent: ["Show the same skill with no help, on a topic you have not seen.", "Muestra la misma destreza sin ayuda, en un tema que no has visto."],
  default: ["Finish the task, then show what you learned on a second try.", "Termina la tarea y luego muestra lo que aprendiste en un segundo intento."],
};
export const criterionT = (I, state) => I.T(...(CRITERIA[state] || CRITERIA.default));
export const STATE_FILL = {
  "not-started": 0,
  emerging: 0.25,
  building: 0.5,
  "with-support": 0.75,
  independent: 1,
};

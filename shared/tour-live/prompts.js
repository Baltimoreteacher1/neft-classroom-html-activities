// The questions a live tour of The Language Page asks its audience, and the only answers each one accepts.
// One list, read by the room API (functions/api/tour-room), the audience phone page (/tour/join/) and the
// projected tour (/tour/). The server stores nothing but these ids: no names, no free text. A revision typed
// into the phone's Upgrade Lab is checked on the phone; only which of the three checks passed is sent.
// Each question and choice carries Spanish (`qEs`, the third element of a choice) for the audience page.

export const STOP_COUNT = 16;

/** Upgrade Lab results: one character per check (detail, precise word, connector), "1" passed, "0" not. */
export const UPGRADE_RESULTS = Object.freeze([
  "000",
  "001",
  "010",
  "011",
  "100",
  "101",
  "110",
  "111",
]);

export const PROMPTS = Object.freeze({
  need: {
    stop: 1,
    q: "Where do your students most need more practice?",
    qEs: "¿Dónde necesitan más práctica sus estudiantes?",
    choices: [
      ["speaking", "Speaking", "Hablar"],
      ["writing", "Writing", "Escribir"],
      ["listening", "Listening", "Escuchar"],
      ["reading", "Reading", "Leer"],
    ],
  },
  door: {
    stop: 2,
    q: "Which door would you open first?",
    qEs: "¿Qué puerta abrirían primero?",
    choices: [
      ["student", "Student", "Estudiante"],
      ["family", "Family member", "Familia"],
      ["classroom", "Classroom teacher", "Docente de aula"],
      ["esol", "ESOL teacher", "Docente de ESOL"],
    ],
  },
  support: {
    stop: 4,
    q: "On the hallway task, where would most of your students start?",
    qEs: "En la tarea del pasillo, ¿dónde empezaría la mayoría de sus estudiantes?",
    choices: [
      ["more", "More support", "Más apoyo"],
      ["some", "Some support", "Algo de apoyo"],
      ["own", "On my own", "Por mi cuenta"],
    ],
  },
  ladder: {
    stop: 5,
    q: "Which step will stretch your students most?",
    qEs: "¿Qué paso les costará más a sus estudiantes?",
    choices: [
      ["name", "Step 1: name four things", "Paso 1: nombrar cuatro cosas"],
      ["tell", "Step 2: tell what and why", "Paso 2: decir qué pasa y por qué"],
      ["explain", "Step 3: explain a change", "Paso 3: explicar un cambio"],
    ],
  },
  upgrade: {
    stop: 6,
    q: "Revise “Phones in class are bad.” on your phone, then send your check.",
    qEs: "Mejoren “Phones in class are bad.” en el teléfono y envíen su revisión.",
    kind: "upgrade",
    choices: UPGRADE_RESULTS.map((v) => [v, v]),
  },
  lesson: {
    stop: 7,
    q: "Which step of the lesson will need the most care in your room?",
    qEs: "¿Qué paso de la lección necesitará más cuidado en su salón?",
    choices: [
      ["notice", "Notice", "Notar"],
      ["speak", "Speak", "Hablar"],
      ["write", "Write", "Escribir"],
      ["improve", "Improve", "Mejorar"],
      ["share", "Share", "Compartir"],
    ],
  },
  place: {
    stop: 8,
    q: "Which place would your students open first?",
    qEs: "¿Qué lugar abrirían primero sus estudiantes?",
    choices: [
      ["reading", "Reading Room"],
      ["wordlab", "Word Lab"],
      ["newsroom", "Newsroom"],
      ["scenarios", "Real-Life Scenarios"],
      ["arena", "Argument Arena"],
      ["mentor", "Mentor Text Explorer"],
      ["sor", "Science of Reading Studio"],
      ["worlds", "Language Worlds"],
      ["write", "Writing Studio"],
      ["speak", "Speaking Studio"],
      ["vocab", "Word Builder"],
      ["videos", "Videos"],
    ],
  },
  teach: {
    stop: 10,
    q: "Which teacher tool would you open first?",
    qEs: "¿Qué herramienta docente abrirían primero?",
    choices: [
      ["hub", "Teacher Hub", "Teacher Hub (centro docente)"],
      ["lesson", "Featured lesson", "Lección destacada"],
      ["data", "WIDA Data Studio", "WIDA Data Studio"],
      ["family", "Family Tour", "Recorrido familiar"],
    ],
  },
  home: {
    stop: 11,
    q: "Which language do most of your students’ families read at home?",
    qEs: "¿Qué idioma lee en casa la mayoría de las familias de sus estudiantes?",
    choices: [
      ["english", "English", "Inglés"],
      ["spanish", "Spanish", "Español"],
      ["other", "Another language", "Otro idioma"],
      ["mix", "A mix", "Una mezcla"],
    ],
  },
  ready: {
    stop: 15,
    q: "How ready are you to try one activity with students this week?",
    qEs: "¿Qué tan listos están para probar una actividad con sus estudiantes esta semana?",
    choices: [
      ["1", "Not yet", "Todavía no"],
      ["2", "Maybe", "Tal vez"],
      ["3", "Likely", "Probablemente"],
      ["4", "Yes, this week", "Sí, esta semana"],
    ],
  },
});

/** A choice's label in the reader's language (place and tool names are product names and stay as they are). */
export const choiceLabel = (choice, es = false) => (es && choice[2]) || choice[1];

/** Reactions an audience can send at any moment. Counted, never attributed. */
export const REACTIONS = Object.freeze([
  ["agree", "Agree", "De acuerdo"],
  ["idea", "Good idea", "Buena idea"],
  ["question", "I have a question", "Tengo una pregunta"],
  ["love", "Love this", "Me encanta"],
]);

/** The prompt asked at a stop, or "" when that stop asks nothing. */
export function promptForStop(stop) {
  for (const [id, p] of Object.entries(PROMPTS)) if (p.stop === stop) return id;
  return "";
}

/** True when `value` is one of the answers prompt `id` accepts. */
export function validAnswer(id, value) {
  const p = Object.hasOwn(PROMPTS, id) ? PROMPTS[id] : null;
  return Boolean(p && p.choices.some(([v]) => v === value));
}

export const validReaction = (kind) => REACTIONS.some(([k]) => k === kind);

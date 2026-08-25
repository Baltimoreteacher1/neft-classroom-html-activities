// Canonical list of the family page's editable copy: the i18n key, a friendly
// label + group for the teacher editor, and the default English / Spanish text.
// This is the single source of truth shared by the family page (Spanish
// translations), the teacher publisher (editor fields), and the API
// (override validation), so the three never drift apart.

export const COPY_FIELDS = Object.freeze([
  // Hero
  {
    key: "eyebrow",
    group: "Hero",
    label: "Eyebrow",
    en: "Family Connections",
    es: "Conexión con las familias",
  },
  {
    key: "title",
    group: "Hero",
    label: "Headline",
    en: "This week, at a glance.",
    es: "Esta semana, de un vistazo.",
  },
  {
    key: "lede",
    group: "Hero",
    label: "Intro paragraph",
    en: "See what your student is learning and choose a simple way to practice together.",
    es: "Vea lo que su estudiante está aprendiendo y elija una manera sencilla de practicar juntos.",
  },
  {
    key: "promiseTitle",
    group: "Hero",
    label: "Partnership title",
    en: "You do not need to teach the lesson.",
    es: "No necesita enseñar la lección.",
  },
  {
    key: "promiseBody",
    group: "Hero",
    label: "Partnership body",
    en: "Ask what your student notices, listen to the strategy, and encourage the effort.",
    es: "Pregunte qué nota su estudiante, escuche la estrategia y anime su esfuerzo.",
  },

  // This week
  {
    key: "weekEyebrow",
    group: "This week",
    label: "Eyebrow",
    en: "Start here",
    es: "Empiece aquí",
  },
  {
    key: "weekTitle",
    group: "This week",
    label: "Heading",
    en: "This week in math",
    es: "Esta semana en matemáticas",
  },
  {
    key: "quickWeek",
    group: "Navigation",
    label: "This week link",
    en: "This week",
    es: "Esta semana",
  },
  {
    key: "quickPractice",
    group: "Navigation",
    label: "Optional practice link",
    en: "Optional practice",
    es: "Práctica opcional",
  },
  {
    key: "quickHelp",
    group: "Navigation",
    label: "Ways to help link",
    en: "Ways to help",
    es: "Maneras de ayudar",
  },
  { key: "classLabel", group: "This week", label: "Class picker label", en: "Class", es: "Clase" },
  {
    key: "readWeek",
    group: "This week",
    label: "Read-aloud button",
    en: "Listen",
    es: "Escuchar",
  },

  // Updates
  {
    key: "updatesEyebrow",
    group: "Updates",
    label: "Eyebrow",
    en: "From the classroom",
    es: "Desde el salón",
  },
  {
    key: "updatesTitle",
    group: "Updates",
    label: "Heading",
    en: "Updates for families",
    es: "Noticias para las familias",
  },

  // Homework library
  {
    key: "homeworkEyebrow",
    group: "Optional family practice",
    label: "Eyebrow",
    en: "Optional and ungraded",
    es: "Opcional y sin calificación",
  },
  {
    key: "homeworkTitle",
    group: "Optional family practice",
    label: "Heading",
    en: "Optional family practice",
    es: "Práctica familiar opcional",
  },
  {
    key: "homeworkIntro",
    group: "Optional family practice",
    label: "Intro paragraph",
    en: "This is separate from your student's regular homework. Use it only when it works for your family as a chance to review or practice the learning together. It is never graded.",
    es: "Esto es aparte de la tarea regular de su estudiante. Úselo solo cuando funcione para su familia, como una oportunidad para repasar o practicar juntos. No se califica.",
  },
  {
    key: "weekPracticeTitle",
    group: "Optional family practice",
    label: "This week's practice heading",
    en: "Practice for this week's lessons",
    es: "Práctica para las lecciones de esta semana",
  },
  {
    key: "weekPracticeHint",
    group: "Optional family practice",
    label: "This week's practice hint",
    en: "These match the lessons posted on the calendar above. Start with the day your student had in class.",
    es: "Estas corresponden a las lecciones publicadas en el calendario de arriba. Empiece con el día que su estudiante tuvo en clase.",
  },
  {
    key: "browsePractice",
    group: "Optional family practice",
    label: "Library disclosure",
    en: "Browse optional family practice",
    es: "Ver la práctica familiar opcional",
  },
  {
    key: "browsePracticeHint",
    group: "Optional family practice",
    label: "Library hint",
    en: "Find any lesson by number or topic",
    es: "Busque cualquier lección por número o tema",
  },
  {
    key: "searchLabel",
    group: "Optional family practice",
    label: "Search label",
    en: "Search lessons",
    es: "Buscar lecciones",
  },
  {
    key: "unitLabel",
    group: "Optional family practice",
    label: "Unit label",
    en: "Unit",
    es: "Unidad",
  },

  // Support
  {
    key: "supportEyebrow",
    group: "Support",
    label: "Eyebrow",
    en: "Three ways to help",
    es: "Tres maneras de ayudar",
  },
  {
    key: "supportTitle",
    group: "Support",
    label: "Heading",
    en: "Ask. Listen. Encourage.",
    es: "Pregunte. Escuche. Anime.",
  },
  {
    key: "askTitle",
    group: "Support",
    label: "Ask title",
    en: "Ask",
    es: "Pregunte",
  },
  {
    key: "askBody",
    group: "Support",
    label: "Ask prompt",
    en: "“What do you notice?”",
    es: "“¿Qué notas?”",
  },
  {
    key: "listenTitle",
    group: "Support",
    label: "Listen title",
    en: "Listen",
    es: "Escuche",
  },
  {
    key: "listenBody",
    group: "Support",
    label: "Listen prompt",
    en: "Let your student explain one strategy.",
    es: "Deje que su estudiante explique una estrategia.",
  },
  {
    key: "encourageTitle",
    group: "Support",
    label: "Encourage title",
    en: "Encourage",
    es: "Anime",
  },
  {
    key: "encourageBody",
    group: "Support",
    label: "Encourage prompt",
    en: "Praise the effort. We will check the math at school.",
    es: "Elogie el esfuerzo. Revisaremos las matemáticas en la escuela.",
  },
  {
    key: "gradingTitle",
    group: "Support",
    label: "Grading statement",
    en: "Family participation is never graded.",
    es: "La participación familiar no se califica.",
  },
  {
    key: "schoolOptionBody",
    group: "Support",
    label: "School option",
    en: "Equivalent school option: Students can use the same practice with a trusted adult at school.",
    es: "Opción equivalente en la escuela: Los estudiantes pueden usar la misma práctica con un adulto de confianza en la escuela.",
  },
  {
    key: "aiLink",
    group: "Support",
    label: "AI guide link",
    en: "Open the family AI guide →",
    es: "Abrir la guía familiar de IA →",
  },

  // Take this week with you
  {
    key: "takeTitle",
    group: "Take this week with you",
    label: "Toolbar heading",
    en: "Take this week with you",
    es: "Lleve esta semana con usted",
  },
  {
    key: "printWeek",
    group: "Take this week with you",
    label: "Print button",
    en: "Print",
    es: "Imprimir",
  },
  {
    key: "calendarWeek",
    group: "Take this week with you",
    label: "Add-to-calendar button",
    en: "Add to calendar",
    es: "Agregar al calendario",
  },
  {
    key: "emailWeek",
    group: "Take this week with you",
    label: "Email button",
    en: "Email",
    es: "Enviar por correo",
  },
  {
    key: "textWeek",
    group: "Take this week with you",
    label: "Text button",
    en: "Text",
    es: "Enviar por mensaje",
  },
  {
    key: "shareWeek",
    group: "Take this week with you",
    label: "Send-to-phone button",
    en: "Send to phone",
    es: "Enviar al teléfono",
  },

  // Family check-in
  {
    key: "pulseTitle",
    group: "Family check-in",
    label: "Heading",
    en: "How did practice go?",
    es: "¿Cómo les fue con la práctica?",
  },
  {
    key: "pulseIntro",
    group: "Family check-in",
    label: "Intro",
    en: "One tap, never graded. It helps Mr. Neft plan the next lesson.",
    es: "Un toque, nunca se califica. Ayuda al Sr. Neft a planear la próxima lección.",
  },
  {
    key: "pulseWent",
    group: "Family check-in",
    label: "Went well button",
    en: "It went well",
    es: "Nos fue bien",
  },
  {
    key: "pulseStuck",
    group: "Family check-in",
    label: "Got stuck button",
    en: "We got stuck",
    es: "Nos atascamos",
  },
  {
    key: "pulseSkip",
    group: "Family check-in",
    label: "Skipped button",
    en: "Not this week",
    es: "Esta semana no",
  },
  {
    key: "pulseThanks",
    group: "Family check-in",
    label: "Thank-you message",
    en: "Thank you. This helps Mr. Neft plan the next lesson.",
    es: "Gracias. Esto ayuda al Sr. Neft a planear la próxima lección.",
  },
  {
    key: "pulseTell",
    group: "Family check-in",
    label: "Tell-more link",
    en: "Tell Mr. Neft more →",
    es: "Contarle más al Sr. Neft →",
  },

  // Connect
  {
    key: "connectEyebrow",
    group: "Connect",
    label: "Eyebrow",
    en: "Questions are welcome",
    es: "Sus preguntas son bienvenidas",
  },
  {
    key: "connectTitle",
    group: "Connect",
    label: "Heading",
    en: "Keep the conversation going.",
    es: "Sigamos conversando.",
  },
  {
    key: "connectBody",
    group: "Connect",
    label: "Body",
    en: "Use your school's family channel to ask a question or share what your student noticed.",
    es: "Use el canal familiar de su escuela para preguntar o compartir lo que notó su estudiante.",
  },
]);

export const COPY_KEYS = Object.freeze(COPY_FIELDS.map((field) => field.key));

const COPY_KEY_SET = new Set(COPY_KEYS);

// Spanish defaults, consumed by the family page's language toggle.
export const translationsEs = Object.freeze(
  Object.fromEntries(COPY_FIELDS.map((field) => [field.key, field.es])),
);

// Validate + clamp published copy overrides. Only known keys survive; blanks are
// dropped so a cleared field falls back to the default wording.
export function normalizeCopyOverrides(input) {
  const out = { en: {}, es: {} };
  for (const lang of ["en", "es"]) {
    const lane = input?.[lang];
    if (lane && typeof lane === "object") {
      for (const key of COPY_KEYS) {
        const value = lane[key];
        if (typeof value === "string") {
          const clean = value.trim().slice(0, 600);
          if (clean) out[lang][key] = clean;
        }
      }
    }
  }
  return out;
}

export function isCopyKey(key) {
  return COPY_KEY_SET.has(key);
}

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
    en: "School and home, on the same page",
    es: "La escuela y el hogar, en la misma página",
  },
  {
    key: "title",
    group: "Hero",
    label: "Headline",
    en: "Your guide to this week in math.",
    es: "Su guía para las matemáticas de esta semana.",
  },
  {
    key: "lede",
    group: "Hero",
    label: "Intro paragraph",
    en: "See the lesson plan, open family homework, and find simple ways to support learning—without needing to teach the lesson yourself.",
    es: "Vea el plan, abra la tarea familiar y encuentre maneras sencillas de apoyar el aprendizaje.",
  },
  {
    key: "seeWeek",
    group: "Hero",
    label: "Button: see this week",
    en: "See this week",
    es: "Ver esta semana",
  },
  {
    key: "findHomework",
    group: "Hero",
    label: "Button: find homework",
    en: "Find homework",
    es: "Buscar tarea",
  },
  {
    key: "promiseTitle",
    group: "Hero",
    label: "Partnership title",
    en: "You are a partner, not the math teacher.",
    es: "Usted es un compañero, no el maestro de matemáticas.",
  },
  {
    key: "promiseBody",
    group: "Hero",
    label: "Partnership body",
    en: "Ask what your student notices. Listen to the strategy. Celebrate the effort. We will handle corrections together at school.",
    es: "Pregunte qué nota su estudiante. Escuche la estrategia. Celebre el esfuerzo. Corregiremos juntos en la escuela.",
  },

  // This week
  {
    key: "weekEyebrow",
    group: "This week",
    label: "Eyebrow",
    en: "The week at a glance",
    es: "La semana de un vistazo",
  },
  {
    key: "weekTitle",
    group: "This week",
    label: "Heading",
    en: "This week in math",
    es: "Esta semana en matemáticas",
  },
  { key: "classLabel", group: "This week", label: "Class picker label", en: "Class", es: "Clase" },
  {
    key: "readWeek",
    group: "This week",
    label: "Read-aloud button",
    en: "Read this week aloud",
    es: "Escuchar esta semana",
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
    group: "Homework library",
    label: "Eyebrow",
    en: "Every lesson, one place",
    es: "Cada lección, en un lugar",
  },
  {
    key: "homeworkTitle",
    group: "Homework library",
    label: "Heading",
    en: "Family homework library",
    es: "Biblioteca de tarea familiar",
  },
  {
    key: "homeworkIntro",
    group: "Homework library",
    label: "Intro paragraph",
    en: "Search by lesson number or topic. Each activity includes an equivalent school option when home support is not available.",
    es: "Busque por número de lección o tema. Hay una opción equivalente en la escuela cuando no hay apoyo en casa.",
  },
  {
    key: "searchLabel",
    group: "Homework library",
    label: "Search label",
    en: "Search lessons",
    es: "Buscar lecciones",
  },
  { key: "unitLabel", group: "Homework library", label: "Unit label", en: "Unit", es: "Unidad" },

  // Support
  {
    key: "supportEyebrow",
    group: "Support",
    label: "Eyebrow",
    en: "Help that protects the thinking",
    es: "Ayuda que protege el pensamiento",
  },
  {
    key: "supportTitle",
    group: "Support",
    label: "Heading",
    en: "Support learning without giving away the work.",
    es: "Apoye el aprendizaje sin hacer el trabajo.",
  },
  {
    key: "aiTitle",
    group: "Support",
    label: "AI card title",
    en: "AI as a learning coach",
    es: "IA como guía de aprendizaje",
  },
  {
    key: "aiBody",
    group: "Support",
    label: "AI card body",
    en: "Use AI to explain a word, ask a guiding question, or practice a similar example—not to complete the assignment.",
    es: "Use la IA para explicar una palabra, hacer una pregunta guía o practicar un ejemplo similar.",
  },
  {
    key: "aiLink",
    group: "Support",
    label: "AI card link",
    en: "Open the family AI guide →",
    es: "Abrir la guía familiar de IA →",
  },
  {
    key: "schoolOptionTitle",
    group: "Support",
    label: "School option title",
    en: "Equivalent school option",
    es: "Opción equivalente en la escuela",
  },
  {
    key: "schoolOptionBody",
    group: "Support",
    label: "School option body",
    en: "No adult, device, or time at home? Your student can complete the same reflection with a trusted adult at school.",
    es: "¿No hay adulto, aparato o tiempo en casa? Su estudiante puede hacer la misma reflexión con un adulto de confianza en la escuela.",
  },
  {
    key: "gradingTitle",
    group: "Support",
    label: "Grading title",
    en: "Participation is never graded",
    es: "La participación nunca recibe nota",
  },
  {
    key: "gradingBody",
    group: "Support",
    label: "Grading body",
    en: "Family participation is never graded. These resources are invitations to connect, not requirements for families.",
    es: "La participación familiar nunca recibe nota. Estos recursos son invitaciones, no requisitos.",
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

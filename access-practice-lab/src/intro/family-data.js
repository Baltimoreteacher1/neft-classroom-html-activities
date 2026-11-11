// Practice Together (the family starting page): all page copy as { en, es } pairs, written once.
// Pure data, no DOM. The family page (family.js) renders it and the Site Guide "Practice at Home" section reuses
// `practiceAtHome`. Routes, activity names and the account / saving / audio facts come from data.js, never retyped.
//
// Spanish is machine-written and addresses adults as "ustedes" (docs/family-homework-v3/es-style-guide.md).
// Activity names and example sentences stay English: the activities are English practice.
import { ACTIVITY_BY_ID, FACTS, ROUTES, SUPPLEMENTAL } from "./data.js";

/** The four bullets of "practice at home". Shared with the Site Guide. */
export const practiceAtHome = [
  {
    id: "choose",
    en: "Choose one activity.",
    es: "Elijan una actividad.",
  },
  {
    id: "together",
    en: "Practice together for 5 to 10 minutes.",
    es: "Practiquen juntos de 5 a 10 minutos.",
  },
  {
    id: "language",
    en: "Use your home language to talk about ideas. Adults do not need perfect English to help.",
    es: "Usen su idioma del hogar para hablar de las ideas. Los adultos no necesitan un inglés perfecto para ayudar.",
  },
  {
    id: "stop",
    en: "Stop when time is up. Come back another day.",
    es: "Paren cuando se acabe el tiempo. Vuelvan otro día.",
  },
];

/** The two main choices. `activityId` points into data.js ACTIVITIES; the route is read from there. */
const activity = (id) => ACTIVITY_BY_ID[id];

export const FAMILY_ACTIVITIES = [
  {
    id: "talk",
    activityId: "hallway",
    icon: "speaking",
    route: activity("hallway").route,
    activityName: activity("hallway").name,
    title: { en: "Let’s Talk", es: "Hablemos" },
    description: {
      en: "Look at a picture of a school hallway. Say what you see, out loud.",
      es: "Miren una imagen de un pasillo de escuela. Digan en voz alta lo que ven.",
    },
    steps: [
      {
        head: { en: "Look at the example", es: "Miren el ejemplo" },
        body: {
          en: "Look at the picture. Press the speaker button to hear the model answer.",
          es: "Miren la imagen. Toquen el botón del altavoz para escuchar la respuesta modelo.",
        },
      },
      {
        head: { en: "Try it together", es: "Inténtenlo juntos" },
        body: {
          en: "Name four things you see in the hallway. Say them out loud.",
          es: "Digan cuatro cosas que ven en el pasillo. Díganlas en voz alta.",
        },
      },
      {
        head: { en: "Share what you did", es: "Compartan lo que hicieron" },
        body: {
          en: "Tell more. Say what the students are doing, and why. Press “I said it out loud.”",
          es: "Digan más. Cuenten qué hacen los estudiantes y por qué. Toquen «Lo dije en voz alta».",
        },
      },
    ],
    example: {
      label: { en: "Example answer", es: "Ejemplo de respuesta" },
      text: "I see lockers, backpacks, a clock and a water fountain.",
    },
    note: {
      en: "The picture activity has three parts. It is fine to do only the first one or two.",
      es: "La actividad de la imagen tiene tres partes. Está bien hacer solo la primera o las dos primeras.",
    },
  },
  {
    id: "write",
    activityId: "upgrade",
    icon: "writing",
    route: activity("upgrade").route,
    activityName: activity("upgrade").name,
    title: { en: "Let’s Write", es: "Escribamos" },
    description: {
      en: "Make one plain sentence better. Add a detail and a reason.",
      es: "Mejoren una oración sencilla. Agreguen un detalle y una razón.",
    },
    steps: [
      {
        head: { en: "Look at the example", es: "Miren el ejemplo" },
        body: {
          en: "Read the plain sentence and the better sentence below.",
          es: "Lean la oración sencilla y la oración mejor que están abajo.",
        },
      },
      {
        head: { en: "Try it together", es: "Inténtenlo juntos" },
        body: {
          en: "Press “Start with this help.” Write a better sentence. Then press “Check my work.”",
          es: "Toquen «Empezar con esta ayuda». Escriban una oración mejor. Luego toquen «Revisar mi trabajo».",
        },
      },
      {
        head: { en: "Share what you did", es: "Compartan lo que hicieron" },
        body: {
          en: "Read your sentence out loud. Say what you added.",
          es: "Lean su oración en voz alta. Digan qué agregaron.",
        },
      },
    ],
    example: {
      label: { en: "Example", es: "Ejemplo" },
      plainLabel: { en: "Plain sentence", es: "Oración sencilla" },
      betterLabel: { en: "Better sentence", es: "Oración mejor" },
      plain: "Phones in class are bad.",
      better: "Phones in class can be a distraction because students stop paying attention.",
    },
    note: {
      en: "You can change your sentence and check it again as many times as you like.",
      es: "Pueden cambiar su oración y revisarla otra vez las veces que quieran.",
    },
  },
];

/** One-line family descriptions for the optional extras. Names, places and times come from data.js. */
const MORE_DESCRIPTIONS = {
  seasons: {
    en: "Read a short text about the seasons. You can hear it read aloud.",
    es: "Lean un texto corto sobre las estaciones. Pueden escucharlo en voz alta.",
  },
  morphemes: {
    en: "Snap word parts together to build a word. Nothing is timed.",
    es: "Unan partes de palabras para formar una palabra. Nada tiene tiempo.",
  },
};

export const FAMILY_MORE = SUPPLEMENTAL.map((s) => ({
  id: s.id,
  icon: s.icon,
  route: s.route,
  name: s.name,
  where: s.where,
  time: s.time,
  description: MORE_DESCRIPTIONS[s.id],
}));

/** All other page copy. `answers` are the "Where? What? How long? Then what?" quick answers. */
export const FAMILY = {
  eyebrow: { en: "For families", es: "Para familias" },
  title: { en: "Practice Together", es: "Practicar juntos" },
  lead: {
    en: "Choose one activity. Practice for 5–10 minutes.",
    es: "Elijan una actividad. Practiquen de 5 a 10 minutos.",
  },
  welcome: {
    en: "Talk about your ideas in the language you use at home. Adults do not need perfect English to help. Listening and asking questions is enough.",
    es: "Hablen de sus ideas en el idioma que usan en casa. Los adultos no necesitan un inglés perfecto para ayudar. Escuchar y hacer preguntas es suficiente.",
  },
  chooseHeading: { en: "Choose one", es: "Elijan una" },
  stepsHeading: { en: "Three steps", es: "Tres pasos" },
  start: { en: "Start", es: "Empezar" },
  startsActivity: { en: "Opens", es: "Abre" },
  answersHeading: { en: "Quick answers", es: "Respuestas rápidas" },
  answers: [
    {
      id: "where",
      q: { en: "Where do we start?", es: "¿Dónde empezamos?" },
      a: { en: "Choose Let’s Talk or Let’s Write.", es: "Elijan Hablemos o Escribamos." },
    },
    {
      id: "what",
      q: { en: "What do we do?", es: "¿Qué hacemos?" },
      a: {
        en: "Follow the three steps on the card.",
        es: "Sigan los tres pasos de la tarjeta.",
      },
    },
    {
      id: "time",
      q: { en: "How long should we practice?", es: "¿Cuánto tiempo practicamos?" },
      a: { en: "5 to 10 minutes.", es: "De 5 a 10 minutos." },
    },
    {
      id: "finish",
      q: { en: "What do we do when we finish?", es: "¿Qué hacemos al terminar?" },
      a: {
        en: "Share what you did. Stop for today. Come back another day.",
        es: "Compartan lo que hicieron. Paren por hoy. Vuelvan otro día.",
      },
    },
  ],
  languageHeading: { en: "About the languages", es: "Sobre los idiomas" },
  languageNote: {
    en: "This page is in English and Español. The activities practice English: the pictures, questions and sentences stay in English. When you choose Español, the buttons and directions in these two activities also show in Spanish.",
    es: "Esta página está en inglés y en español. Las actividades practican inglés: las imágenes, las preguntas y las oraciones quedan en inglés. Si eligen Español, los botones y las instrucciones de estas dos actividades también se muestran en español.",
  },
  spanishNote: {
    en: "The Spanish on this page is machine-assisted and has not been reviewed by a human translator.",
    es: "El español es asistido por máquina y no ha sido revisado por un traductor humano.",
  },
  help: {
    heading: { en: "Need help?", es: "¿Necesitan ayuda?" },
    items: [
      {
        id: "account",
        q: { en: "Do we need an account?", es: "¿Necesitamos una cuenta?" },
        a: {
          en: FACTS.account,
          es: "No se necesita una cuenta para practicar. El trabajo se guarda en este navegador, en este dispositivo.",
        },
      },
      {
        id: "sound",
        q: { en: "What if the sound does not play?", es: "¿Y si no se oye el sonido?" },
        a: {
          en: `${FACTS.audio} The model voice comes from your device.`,
          es: "Si no se oye el sonido, revisen el volumen del dispositivo y prueben con otra pestaña del navegador. Todas las actividades se pueden hacer leyendo, escribiendo o hablando con otra persona. La voz modelo viene de su dispositivo.",
        },
        link: {
          route: "/tools",
          label: {
            en: "Open the lab tools and device check",
            es: "Abrir las herramientas y la revisión del dispositivo",
          },
        },
      },
      {
        id: "mic",
        q: { en: "Do we have to record?", es: "¿Tenemos que grabar?" },
        a: {
          en: FACTS.microphone,
          es: "Nunca se necesita un micrófono. La grabación empieza solo cuando alguien toca Grabar, y las grabaciones se quedan en la pestaña abierta.",
        },
      },
      {
        id: "back",
        q: { en: "How do we come back to this page?", es: "¿Cómo volvemos a esta página?" },
        a: {
          en: "Press “Back to Practice Together” on the activity page. You can also use the Back button of your browser.",
          es: "Toquen «Volver a Practicar juntos» en la página de la actividad. También pueden usar el botón Atrás de su navegador.",
        },
      },
      {
        id: "stop",
        q: { en: "How do we stop and try another day?", es: "¿Cómo paramos y probamos otro día?" },
        a: {
          en: "Stop any time. Your work saves in this browser on this device. “I said it out loud” is remembered on this device too. Clearing site data removes saved work.",
          es: "Pueden parar en cualquier momento. El trabajo se guarda en este navegador, en este dispositivo. «Lo dije en voz alta» también se recuerda en este dispositivo. Si borran los datos del sitio, se borra el trabajo guardado.",
        },
      },
    ],
  },
  more: {
    heading: { en: "More practice", es: "Más práctica" },
    lead: {
      en: "Optional. Try these on another day.",
      es: "Opcional. Pruébenlas otro día.",
    },
    open: { en: "Open", es: "Abrir" },
  },
  links: {
    siteGuide: {
      route: `${ROUTES.siteGuide}?for=family`,
      label: { en: "Site Guide", es: "Guía del sitio" },
    },
    familyCorner: {
      route: "/family",
      label: { en: "More family help", es: "Más ayuda para familias" },
    },
  },
  privacy: {
    en: "No account. This page does not ask for your name or email.",
    es: "Sin cuenta. Esta página no pide su nombre ni su correo.",
  },
};

/** The grade choice at the top of the page. K–2 goes to the early learners home, which has its own grade picker. */
export const FAMILY_BANDS = [
  { id: "k-2", label: { en: "Grades K–2", es: "Grados K a 2" } },
  { id: "3-5", label: { en: "Grades 3–5", es: "Grados 3 a 5" } },
  { id: "6-8", label: { en: "Grades 6–8", es: "Grados 6 a 8" } },
];
export const FAMILY_GRADE = {
  heading: { en: "Your child’s grade", es: "El grado de su hijo o hija" },
  early: {
    route: "/early?grades=K",
    title: { en: "Practice for grades K–2", es: "Práctica para los grados K a 2" },
    text: {
      en: "Younger children have their own page: a picture story read aloud, sounds, word cards and short games to do together. Choose Kindergarten, Grade 1 or Grades 2–3 at the top of that page.",
      es: "Los niños más pequeños tienen su propia página: un cuento con imágenes leído en voz alta, sonidos, tarjetas de palabras y juegos cortos para hacer juntos. Elijan Kínder, Grado 1 o Grados 2 y 3 arriba en esa página.",
    },
    cta: { en: "Open practice for grades K–2", es: "Abrir la práctica de los grados K a 2" },
  },
};

const [talk68, write68] = FAMILY_ACTIVITIES;
/** Grades 3–5: the same two routines on that band's own picture and sentence (checked in a browser 2026-11-10). */
export const FAMILY_ACTIVITIES_35 = [
  {
    ...talk68,
    route: "/voice/ladder/class-garden",
    activityName: "Our Class Garden",
    description: {
      en: "Look at a picture of a school garden. Say what you see, out loud.",
      es: "Miren una imagen de un huerto escolar. Digan en voz alta lo que ven.",
    },
    steps: [
      talk68.steps[0],
      {
        head: talk68.steps[1].head,
        body: { en: "Name three things in the garden. Say them out loud.", es: "Digan tres cosas que ven en el huerto. Díganlas en voz alta." },
      },
      {
        head: talk68.steps[2].head,
        body: {
          en: "Tell more. Say what the girl and the boy are doing. Press “I said it out loud.”",
          es: "Digan más. Cuenten qué hacen la niña y el niño. Toquen «Lo dije en voz alta».",
        },
      },
    ],
    example: { label: talk68.example.label, text: "I see tomatoes, sunflowers and a watering can." },
  },
  {
    ...write68,
    route: "/scaffold/language-upgrade?item=lu35-explain-plants",
    example: { ...write68.example, plain: "Plants need stuff.", better: "Plants need sunlight and water because they use them to make food." },
  },
];

export const familyActivitiesFor = (band) => (band === "3-5" ? FAMILY_ACTIVITIES_35 : FAMILY_ACTIVITIES);

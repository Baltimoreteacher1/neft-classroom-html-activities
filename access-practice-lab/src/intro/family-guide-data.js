// Family walkthrough (/practice-together) words, written once as { en, es } pairs. Another language is one more key
// on each pair: `pickLang` falls back to English for any key that is missing, and no component holds its own copy.
// The guide speaks to the adult, never quotes a button's words (the buttons change with the page language), and
// never translates the English task itself: the child still reads, hears and answers in English.
//
// Spanish is machine-written, addresses adults as "ustedes" (docs/family-homework-v3/es-style-guide.md) and has not
// been reviewed by a human translator.
import { FAMILY } from "./family-data.js";

export const FAMILY_LANGS = ["en", "es"];

/** One string from an { en, es } pair, English when the language has no entry. */
export const pickLang = (pair, lang) => (pair && (pair[lang] ?? pair.en)) || "";

/** Every { en, es } pair in a nested object, resolved to one language (arrays and functions pass through). */
export function resolveLang(obj, lang) {
  if (Array.isArray(obj)) return obj.map((x) => resolveLang(x, lang));
  if (!obj || typeof obj !== "object") return obj;
  if ("en" in obj && Object.values(obj).every((v) => typeof v === "string"))
    return pickLang(obj, lang);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, resolveLang(v, lang)]));
}

export const STEPS = [
  { n: 1, id: "start", name: { en: "Get started", es: "Empezar" } },
  { n: 2, id: "practice", name: { en: "Practice together", es: "Practicar juntos" } },
  { n: 3, id: "next", name: { en: "What to do next", es: "Qué hacer después" } },
];

export const PAGE = {
  eyebrow: { en: "For families", es: "Para familias" },
  stepOf: { en: "Step", es: "Paso" },
  of: { en: "of", es: "de" },
  progressLabel: { en: "Family practice steps", es: "Pasos de la práctica en familia" },
  exit: { en: "Exit", es: "Salir" },
  back: { en: "Back", es: "Atrás" },
  title: { en: "Let’s practice English together.", es: "Practiquemos inglés juntos." },
  nextNeft: {
    en: "You did it together! Short practice, a few times a week, is what helps most. Here is the next activity for your child.",
    es: "¡Lo lograron juntos! Practicar un poco, algunas veces por semana, es lo que más ayuda. Esta es la próxima actividad para su hijo o hija.",
  },
  welcome: {
    en: "Welcome! I’m Mr. Neft. Choose your child’s grade and I’ll show you how to help, one step at a time. You do not need perfect English.",
    es: "¡Bienvenidos! Soy Mr. Neft. Elijan el grado de su hijo o hija y les mostraré cómo ayudar, paso a paso. No necesitan un inglés perfecto.",
  },
  lead: {
    en: "Short English practice for school. Your child answers in English; you sit beside them and help.",
    es: "Práctica corta de inglés para la escuela. Su hijo o hija responde en inglés; ustedes se sientan a su lado y le ayudan.",
  },
  noEnglish: {
    en: "You do not need to speak English well to help. Listening, pointing and saying “try again” is enough.",
    es: "No necesitan hablar bien inglés para ayudar. Escuchar, señalar y decir «inténtalo otra vez» es suficiente.",
  },
  langLabel: { en: "Language for the directions", es: "Idioma de las instrucciones" },
  langNote: {
    en: "The practice itself stays in English. Directions and buttons can be in Spanish.",
    es: "La práctica sigue en inglés. Las instrucciones y los botones pueden estar en español.",
  },
  gradeLabel: { en: "Your child’s grade", es: "El grado de su hijo o hija" },
  early: { en: "Which grade exactly?", es: "¿Qué grado exactamente?" },
  /** The exact grade inside a family grade band. `pick` is the lab grade the activities come from: Grade 3 uses the
   *  lab's Grades 2–3 activities, as on the lab's own grade picker. Grades 6–8 share one set, so it has no list. */
  exact: {
    "k-2": [
      { id: "K", pick: "K", label: { en: "Kindergarten", es: "Kínder" } },
      { id: "1", pick: "1", label: { en: "Grade 1", es: "1.º grado" } },
      { id: "2", pick: "2-3", label: { en: "Grade 2", es: "2.º grado" } },
    ],
    "3-5": [
      { id: "3", pick: "2-3", label: { en: "Grade 3", es: "3.er grado" } },
      { id: "4", pick: "4-5", label: { en: "Grade 4", es: "4.º grado" } },
      { id: "5", pick: "4-5", label: { en: "Grade 5", es: "5.º grado" } },
    ],
  },
  needGrade: {
    en: "First, choose your child’s grade.",
    es: "Primero, elijan el grado de su hijo o hija.",
  },
  start: { en: "Start practicing together", es: "Empezar a practicar juntos" },
  how: { en: "How it works", es: "Cómo funciona" },
  howSteps: [
    {
      icon: "volume",
      head: { en: "Listen to the directions", es: "Escuchen las instrucciones" },
      body: {
        en: "Read them, or press play to hear them.",
        es: "Léanlas o toquen el botón para escucharlas.",
      },
    },
    {
      icon: "speaking",
      head: { en: "Your child answers in English", es: "Su hijo o hija responde en inglés" },
      body: {
        en: "You help by asking, not by answering.",
        es: "Ustedes ayudan preguntando, no respondiendo.",
      },
    },
    {
      icon: "retry",
      head: { en: "Try again together", es: "Inténtenlo otra vez juntos" },
      body: { en: "Mistakes are part of learning.", es: "Los errores son parte de aprender." },
    },
  ],
  skip: { en: "We know how. Go straight to practice", es: "Ya sabemos cómo. Ir directo a practicar" },
  print: { en: "Print a one-page guide", es: "Imprimir una guía de una página" },
  practiceTitle: { en: "Practice together", es: "Practiquen juntos" },
  practiceLead: {
    en: "Sit side by side. The guide next to the activity shows one thing at a time.",
    es: "Siéntense uno al lado del otro. La guía junto a la actividad muestra una cosa a la vez.",
  },
  skipToNext: { en: "Skip to what to do next", es: "Ver qué hacer después" },
  nextTitle: {
    en: "Great work! Here is what to do next.",
    es: "¡Buen trabajo! Esto es lo que sigue.",
  },
  nextLead: {
    en: "Practice a little, often. Here is the next activity for your child.",
    es: "Practiquen un poco, pero seguido. Esta es la próxima actividad para su hijo o hija.",
  },
  startPracticing: { en: "Start practicing", es: "Empezar a practicar" },
  again: { en: "Do the same activity again", es: "Hacer la misma actividad otra vez" },
  keepGoing: { en: "How to keep going", es: "Cómo seguir" },
  keep: [
    {
      en: "Practice 10 minutes, a few days a week.",
      es: "Practiquen 10 minutos, algunos días por semana.",
    },
    {
      en: "Stop while it is still fun. Come back another day.",
      es: "Terminen mientras todavía se divierten. Vuelvan otro día.",
    },
    {
      en: "Ask your child to tell you one thing they learned, in any language.",
      es: "Pídanle a su hijo o hija que les cuente algo que aprendió, en cualquier idioma.",
    },
  ],
  moreTitle: { en: "Other ways to practice", es: "Otras formas de practicar" },
  sharing: {
    q: { en: "More than one child uses this device", es: "Más de un niño usa este dispositivo" },
    a: {
      en: "Work saves in this browser, so children who share a device share saved work. Each child can use a different browser or device, or press “Save / Resume” at the bottom of the activity to keep a copy.",
      es: "El trabajo se guarda en este navegador, así que los niños que comparten un dispositivo comparten el trabajo guardado. Cada niño puede usar otro navegador u otro dispositivo, o tocar «Save / Resume» al final de la actividad para guardar una copia.",
    },
  },
  saving: {
    q: { en: "Where is our work saved?", es: "¿Dónde se guarda nuestro trabajo?" },
    a: {
      en: "On this device, in this browser. No account is needed and nothing is sent to the school. Clearing site data removes it.",
      es: "En este dispositivo, en este navegador. No se necesita una cuenta y no se envía nada a la escuela. Si borran los datos del sitio, se borra.",
    },
  },
  privacy: {
    en: "No account. This page does not ask for your name or email.",
    es: "Sin cuenta. Esta página no pide su nombre ni su correo electrónico.",
  },
  machine: {
    en: "The Spanish on these pages is machine-assisted and has not been reviewed by a human translator.",
    es: "El español de estas páginas se escribió con ayuda de una máquina y no lo ha revisado un traductor humano.",
  },
};

/** The coach's buttons and status words. */
export const COACH_COPY = {
  next: { en: "Next", es: "Siguiente" },
  back: { en: "Back", es: "Atrás" },
  skip: { en: "Skip this step", es: "Saltar este paso" },
  finish: { en: "Next", es: "Siguiente" },
  tryMyself: { en: "Hide the guide", es: "Ocultar la guía" },
  showMe: { en: "Show the guide", es: "Mostrar la guía" },
  missing: {
    en: "That part is not on the screen right now. Press Next to keep going.",
    es: "Esa parte no está en la pantalla ahora. Toquen Siguiente para seguir.",
  },
  awayTitle: { en: "You left the activity", es: "Salieron de la actividad" },
  away: {
    en: "Another page opened inside the activity. Bring the activity back to keep going.",
    es: "Se abrió otra página dentro de la actividad. Vuelvan a la actividad para seguir.",
  },
  bringBack: { en: "Bring the activity back", es: "Volver a la actividad" },
  why: { en: "Why this helps", es: "Por qué ayuda" },
  done: { en: "Done.", es: "Listo." },
  doIt: {
    en: "Do it in the activity. The guide moves on by itself.",
    es: "Háganlo en la actividad. La guía avanzará sola.",
  },
  hear: { en: "Hear the guide", es: "Escuchar la guía" },
  goTo: { en: "Take me to it", es: "Llevarme ahí" },
};

/** What the guide says at each part of the activity (coach/activity-steps.js loopSteps). */
export const FAMILY_SAY = {
  final: { en: "What to do next", es: "Qué hacer después" },
  intro: {
    title: { en: "Sit together, side by side", es: "Siéntense juntos, uno al lado del otro" },
    body: {
      en: "Your child answers in English. You help them get started and keep going.",
      es: "Su hijo o hija responde en inglés. Ustedes le ayudan a empezar y a seguir.",
    },
    why: {
      en: "Children try harder and stay longer when an adult is beside them, in any language.",
      es: "Los niños se esfuerzan más y practican más tiempo cuando un adulto está a su lado, en cualquier idioma.",
    },
  },
  skill: {
    title: { en: "Look at the short lesson", es: "Miren la lección corta" },
    body: {
      en: "It shows how to do the task. Look at it together, then press the highlighted button.",
      es: "Muestra cómo hacer la tarea. Mírenla juntos y luego toquen el botón resaltado.",
    },
    fallback: {
      en: "This activity starts right away. Press Next.",
      es: "Esta actividad empieza enseguida. Toquen Siguiente.",
    },
  },
  directions: {
    title: { en: "Listen to the directions", es: "Escuchen las instrucciones" },
    body: {
      en: "Read the directions together, or press the play button beside them to hear them.",
      es: "Lean juntos las instrucciones, o toquen el botón para escucharlas.",
    },
    why: {
      en: "When the directions are clear, your child can spend their effort on the English.",
      es: "Cuando las instrucciones están claras, su hijo o hija puede concentrarse en el inglés.",
    },
    fallback: {
      en: "Read or listen to the directions together, then press Next.",
      es: "Lean o escuchen juntos las instrucciones y luego toquen Siguiente.",
    },
  },
  helpChild: {
    title: { en: "Tips for you", es: "Consejos para ustedes" },
    body: {
      en: "This box has short tips for the adult. Open it if you want ideas.",
      es: "Esta caja tiene consejos cortos para el adulto. Ábranla si quieren ideas.",
    },
  },
  spanish: {
    title: { en: "Directions in Spanish", es: "Instrucciones en español" },
    body: {
      en: "Open this to read the directions in Spanish. The question and answers stay in English.",
      es: "Ábranlo para leer las instrucciones en español. La pregunta y las respuestas siguen en inglés.",
    },
  },
  answer: {
    title: { en: "Your child chooses the answer", es: "Su hijo o hija elige la respuesta" },
    body: {
      en: "Let your child choose. If they are not sure, ask them to point to a word they know. Try not to give the answer.",
      es: "Dejen que su hijo o hija elija. Si no está seguro o segura, pídanle que señale una palabra que conozca. Traten de no darle la respuesta.",
    },
    fallback: {
      en: "Let your child answer in the activity, then press Next.",
      es: "Dejen que su hijo o hija responda en la actividad y luego toquen Siguiente.",
    },
  },
  words: {
    title: { en: "Help with hard words", es: "Ayuda con palabras difíciles" },
    body: {
      en: "Open this to see hard words explained, with Spanish help.",
      es: "Ábranlo para ver palabras difíciles explicadas, con ayuda en español.",
    },
  },
  sure: {
    title: { en: "How sure is your child?", es: "¿Qué tan seguro o segura está?" },
    body: {
      en: "Your child chooses how sure they feel. Any choice is fine.",
      es: "Su hijo o hija elige qué tan seguro o segura se siente. Cualquier opción está bien.",
    },
    why: {
      en: "Saying “I’m guessing” is honest, and it helps the teacher know what to teach next.",
      es: "Decir «estoy adivinando» es honesto y le ayuda a la maestra o al maestro a saber qué enseñar después.",
    },
  },
  check: {
    title: { en: "Check the answer", es: "Revisen la respuesta" },
    body: {
      en: "Press the highlighted button to check.",
      es: "Toquen el botón resaltado para revisar.",
    },
    fallback: {
      en: "Press the check button in the activity, then press Next.",
      es: "Toquen el botón de revisar en la actividad y luego toquen Siguiente.",
    },
  },
  feedback: {
    title: { en: "Read the message together", es: "Lean el mensaje juntos" },
    body: {
      en: "If it says to try again, that is part of learning. Say: “Good try! Let’s look again.”",
      es: "Si dice que lo intenten otra vez, es parte de aprender. Díganle: «¡Buen intento! Miremos otra vez».",
    },
    rightTitle: { en: "Celebrate!", es: "¡Celébrenlo!" },
    right: {
      en: "Tell your child what they did well: “You worked hard and found it!”",
      es: "Díganle a su hijo o hija qué hizo bien: «¡Te esforzaste y lo encontraste!»",
    },
    why: {
      en: "The message helps without giving the answer away, so your child does the thinking.",
      es: "El mensaje ayuda sin dar la respuesta, así su hijo o hija es quien piensa.",
    },
    fallback: {
      en: "A message appears after checking. Press Next.",
      es: "Después de revisar aparece un mensaje. Toquen Siguiente.",
    },
  },
  retry: {
    title: { en: "Try again together", es: "Inténtenlo otra vez juntos" },
    body: {
      en: "Press the highlighted button. Cheer your child on: one more try.",
      es: "Toquen el botón resaltado. Animen a su hijo o hija: un intento más.",
    },
    early: {
      en: "All the pictures are still there. Listen again together and choose once more.",
      es: "Todos los dibujos siguen ahí. Escuchen otra vez juntos y elijan una vez más.",
    },
  },
  again: {
    title: { en: "Check again together", es: "Revisen otra vez juntos" },
    body: {
      en: "Your child chooses again, then presses the highlighted button to check. Celebrate when it is right!",
      es: "Su hijo o hija elige otra vez y toca el botón resaltado para revisar. ¡Celébrenlo cuando esté bien!",
    },
    fallback: {
      en: "Choose again and check, or press Skip this step.",
      es: "Elijan otra vez y revisen, o toquen Saltar este paso.",
    },
  },
  end: {
    title: { en: "You practiced English together!", es: "¡Practicaron inglés juntos!" },
    body: {
      en: "That is how every activity works. Next, see how to keep practicing.",
      es: "Así funcionan todas las actividades. Ahora vean cómo seguir practicando.",
    },
  },
};

/** "Need help?" for families, in their language. Facts match data.js FACTS and the family page help. */
export const FAMILY_HELP = {
  heading: FAMILY.help.heading,
  items: [
    {
      q: { en: "The guide disappeared", es: "La guía desapareció" },
      a: {
        en: "Press “Show the guide” next to the activity to bring it back.",
        es: "Toquen «Mostrar la guía» junto a la actividad para que vuelva.",
      },
    },
    ...FAMILY.help.items
      .filter((x) => ["sound", "mic", "account"].includes(x.id))
      .map((x) => ({ q: x.q, a: x.a })),
    {
      q: { en: "The microphone is blocked", es: "El micrófono está bloqueado" },
      a: {
        en: "Recording is never required. Your child can say the answer out loud to you instead.",
        es: "Nunca hace falta grabar. Su hijo o hija puede decirles la respuesta en voz alta.",
      },
    },
  ],
  restart: { en: "Start the family guide again", es: "Empezar la guía para familias otra vez" },
};

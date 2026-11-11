// Site Guide data, part 1: audiences, sections, the Start Here steps and the activity cards.
// One model, audience tags: every fact an activity card shows comes from data.js (the single source). Only wording that
// is new to the guide lives here, as { en, es } pairs. Spanish is machine-written (the page says so).
// Pure data: no DOM, so tools/access-intro-site-guide.test.mjs can import it in Node.
import { ACTIVITY_BY_ID, FACTS, ROUTES, SUPPLEMENTAL } from "./data.js";
import { practiceAtHome } from "./family-data.js";

const P = (en, es) => ({ en, es });

export const AUDIENCES = [
  { id: "teacher", icon: "teacher", label: P("I’m a Teacher", "Soy docente") },
  { id: "student", icon: "reading", label: P("I’m a Student", "Soy estudiante") },
  { id: "family", icon: "families", label: P("I’m a Family Member", "Soy de la familia") },
];
export const AUDIENCE_IDS = AUDIENCES.map((a) => a.id);

export const GUIDE = {
  title: P("Your Guide to The Language Page", "Su guía de The Language Page"),
  lead: P(
    "Find an activity, see how it works, and choose your next step.",
    "Encuentren una actividad, vean cómo funciona y elijan su próximo paso.",
  ),
  general: P(
    "New here? Start with the three steps below. Choose who you are to see what is most useful for you.",
    "¿Es su primera vez? Empiecen con los tres pasos de abajo. Elijan quiénes son para ver lo que más les sirve.",
  ),
  forTeacher: P(
    "New to the site? The teacher start page lets you choose your grades and try one activity in each domain:",
    "¿Son nuevos en el sitio? En la página de inicio para docentes pueden elegir sus grados y probar una actividad de cada destreza:",
  ),
  overview: P(
    "English practice in four language domains, Listening, Speaking, Reading and Writing, for Kindergarten through Grade 8. No account is needed, and work stays on the device.",
    "Práctica de inglés en cuatro destrezas, escuchar, hablar, leer y escribir, desde kínder hasta 8.º grado. No se necesita una cuenta, y el trabajo se queda en el dispositivo.",
  ),
};

/**
 * Sections in reading order. `show` lists the audiences that see the section by default; `general` is the short intro
 * shown until someone chooses. Every section stays reachable by its own link (/site-guide/<id>) and from search.
 */
export const SECTIONS = [
  {
    id: "start",
    icon: "flag",
    title: P("Start Here", "Empiecen aquí"),
    show: ["teacher", "student", "family"],
    general: true,
  },
  {
    id: "speaking",
    summary: P("Curated speaking activities, each with what students do, how to try it and the help built into the site.", "Actividades de hablar seleccionadas, cada una con lo que hacen los estudiantes, cómo probarla y la ayuda incluida en el sitio."),
    icon: "speaking",
    title: P("Speaking", "Hablar"),
    show: ["teacher", "student", "family"],
    general: true,
  },
  {
    id: "writing",
    summary: P("Curated writing activities, a worked example from first try to clearer, and a link to every writing activity.", "Actividades de escribir seleccionadas, un ejemplo del primer intento a algo más claro y un enlace a todas las actividades de escribir."),
    icon: "writing",
    title: P("Writing", "Escribir"),
    show: ["teacher", "student", "family"],
    general: true,
  },
  {
    id: "more",
    icon: "reading",
    title: P("Reading, Listening, and Vocabulary", "Leer, escuchar y vocabulario"),
    show: ["teacher", "student"],
  },
  {
    id: "classroom",
    summary: P("Three routines you can run tomorrow, grouping ideas, and how to share, assign, print and see progress.", "Tres rutinas para usar mañana, ideas para agrupar, y cómo compartir, asignar, imprimir y ver el progreso."),
    icon: "classroom",
    title: P("Use It in Your Classroom", "Úsenlo en el salón de clase"),
    show: ["teacher"],
  },
  {
    id: "home",
    icon: "families",
    title: P("Practice at Home", "Practicar en casa"),
    show: ["family"],
  },
  {
    id: "around",
    summary: P("How to get home, find each skill, and move around the site, with screenshots and every area at a glance.", "Cómo volver al inicio, encontrar cada destreza y moverse por el sitio, con capturas de pantalla y todas las áreas de un vistazo."),
    icon: "pin",
    title: P("Find Your Way Around", "Cómo orientarse en el sitio"),
    show: ["teacher", "student", "family"],
    general: true,
  },
  {
    id: "help",
    icon: "info",
    title: P("Help and Common Questions", "Ayuda y preguntas frecuentes"),
    show: ["teacher", "student", "family"],
    general: true,
  },
];
export const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Section ids shown for an audience ("" = nobody chosen yet), plus any extra id named by the link. */
export function visibleSections(audience, extraId = "") {
  const keep = (s) => (AUDIENCE_IDS.includes(audience) ? s.show.includes(audience) : s.general);
  return SECTIONS.filter((s) => keep(s) || s.id === extraId).map((s) => s.id);
}

/** The five labels every activity card uses. */
export const LABELS = {
  what: P("What it is", "Qué es"),
  do: P("What you’ll do", "Qué harán"),
  time: P("About", "Tiempo"),
  try: P("Try it", "Pruébenlo"),
  support: P("Get support", "Apoyo"),
  builtIn: P("Built into the site", "Incluido en el sitio"),
  moves: P(
    "Teaching moves you add (not site features)",
    "Ideas de enseñanza que se agregan (no son funciones del sitio)",
  ),
  help: P("A way to help", "Una manera de ayudar"),
  next: P("Next step", "Siguiente paso"),
  open: P("Open", "Abrir"),
};

/** Scenarios and Newsroom are not in data.js: facts below were read from the real pages on 2026-11-10. */
export const EXTRA_ACTIVITIES = {
  scenario: {
    id: "scenario",
    pathway: "speaking",
    icon: "speaking",
    name: "Sorry in the hallway",
    where: "Real-Life Scenarios",
    route: "/scenarios/s68-hallway-bump",
    time: "about 5 min",
    does: "Students read a short conversation with a classmate, choose what to say in each turn, and then say a reply aloud.",
    tryNow:
      "Choose “B Some support,” read the three replies, pick one, and read the feedback it gets.",
    builtIn: [
      "Three support levels: More support, Some support, or On my own.",
      "“Hear it” reads the classmate’s line (device voice).",
      "“Spanish help” shows each line and reply in Spanish beside the English.",
      "Each reply you pick gets a short comment on what it does well or leaves out.",
    ],
    moves: [
      "Partners act out the three replies and talk about which one sounds kind.",
      "Students say the best reply to a partner before moving on.",
    ],
    limits:
      "Not scored. The wording check reads words only, never pronunciation. Practice content stays in English.",
    preview: {
      task: "Goal: apologize after bumping into a classmate and offer to help. Noor says: “Oh no! My papers are all over the floor!”",
      sample:
        "“I am so sorry, Noor! I was not looking where I was going. Are you okay? Let me help you pick them up.”",
      source: "The reply the site marks “Clear and polite”",
      next: "Students read why it works (it apologizes, owns the mistake, checks on Noor and offers help), continue, and later say a reply aloud.",
    },
  },
  newsroom: {
    id: "newsroom",
    pathway: "writing",
    icon: "writing",
    name: "Cafeteria Composting Cuts Waste in Half",
    where: "Newsroom",
    route: "/newsroom/np-68-03",
    time: "15–25 min across four steps",
    does: "Students plan a news story with Who, What, When, Where, Why and How, write it as an article or a script, read it aloud, and make a printable front page.",
    tryNow: "Choose “B Some support,” answer only Who and What in the Plan step, then open Draft.",
    builtIn: [
      "Three support levels: More support, Some support, or On my own.",
      "Four steps (Plan, Draft, Read aloud, Front page); students can stop after any step.",
      "A choice of class newspaper article or newscast script.",
      "Front page: choose a picture, then print it or download the page.",
    ],
    moves: [
      "Partners interview each other with the Who, What and Why questions first.",
      "Read the headline aloud together before planning.",
    ],
    limits: "The student’s name is printed only on the page they make. Nothing is scored.",
    preview: {
      task: "“The cafeteria began sorting food scraps into compost bins. Report on how it started and what changed.”",
      sample:
        "Who? Cafeteria workers and students. What happened? The cafeteria began sorting food scraps into compost bins. Where? In the school cafeteria. Why? To make less trash.",
      source: "Sample work written for this guide",
      next: "Students turn the plan into a short article or script, read it aloud (recording is optional), and make a front page.",
    },
  },
};

/** Suggested audience and prerequisite, from what each activity actually asks. */
export const LEVELS = {
  hallway: P(
    "Good first speaking activity. No setup needed. Students who can name objects can start.",
    "Buena primera actividad de hablar. No requiere preparación. Quien pueda nombrar objetos puede empezar.",
  ),
  board: P(
    "After the hallway or any speaking warm-up. Students read a short survey table.",
    "Después del pasillo o de otro calentamiento de hablar. Se lee una tabla de encuesta corta.",
  ),
  scenario: P(
    "Any student who can read short sentences. Choose a support level first.",
    "Cualquier estudiante que pueda leer oraciones cortas. Primero se elige el nivel de apoyo.",
  ),
  upgrade: P(
    "Good first writing activity. Students who can write one sentence can start.",
    "Buena primera actividad de escribir. Quien pueda escribir una oración puede empezar.",
  ),
  paragraph: P(
    "After sentence work. Students read three sources and write a full paragraph.",
    "Después de trabajar oraciones. Se leen tres fuentes y se escribe un párrafo completo.",
  ),
  newsroom: P(
    "Students who can write several sentences. Planning comes before drafting.",
    "Estudiantes que pueden escribir varias oraciones. Primero se planea y luego se escribe.",
  ),
};

/** Second-person and Spanish wording for each card. `you` replaces data.js `does` for students, families and the default view. */
export const CARD_TEXT = {
  hallway: {
    you: P(
      "You will look at a hallway picture and speak three times: name things, say what is happening and why, then explain one change and give a reason.",
      "Mirarán una imagen de un pasillo y hablarán tres veces: nombrar cosas, decir qué pasa y por qué, y explicar un cambio con una razón.",
    ),
    try: P(
      "Go to Step 3. Tap “Hear Lina first,” then say your own answer aloud using the sentence frame.",
      "Vayan al Paso 3. Toquen «Escucha primero a Lina» y digan su propia respuesta en voz alta con el marco de oración.",
    ),
    support: P(
      "You can hear a model student first, open a sentence frame, and record (optional) or just say it aloud.",
      "Pueden escuchar primero a una estudiante modelo, abrir un marco de oración y grabar (opcional) o solo decirlo en voz alta.",
    ),
    help: P(
      "Listen once, then ask: “What else do you see?” and “Why?”",
      "Escuchen una vez y pregunten: «¿Qué más ves?» y «¿Por qué?»",
    ),
  },
  board: {
    you: P(
      "You will read a short survey table, plan a position with two pieces of evidence, say it, and review it.",
      "Leerán una tabla de encuesta corta, planearán una posición con dos pruebas, la dirán y la revisarán.",
    ),
    try: P(
      "Choose “With frames and words,” plan your position and one number from the table, then say it aloud.",
      "Elijan «Con marcos y palabras», planeen su posición y un número de la tabla, y díganlo en voz alta.",
    ),
    support: P(
      "Three help levels, a “Hear the task” button, and a choice to record, type the words, or say it without recording.",
      "Hay tres niveles de ayuda, un botón «Escuchar la tarea» y la opción de grabar, escribir las palabras o decirlo sin grabar.",
    ),
    help: P(
      "Be the school board: ask one question, such as “Which number helped you decide?”",
      "Hagan el papel de la junta escolar y hagan una pregunta, como «¿Qué número te ayudó a decidir?»",
    ),
  },
  scenario: {
    you: P(
      "You will read a short conversation with a classmate, choose what to say, and then say a reply aloud.",
      "Leerán una conversación corta con un compañero, elegirán qué decir y luego dirán una respuesta en voz alta.",
    ),
    try: P(
      "Choose “B Some support,” read the three replies, pick one, and read the feedback it gets.",
      "Elijan «B Algo de apoyo», lean las tres respuestas, escojan una y lean el comentario que recibe.",
    ),
    support: P(
      "Three support levels, “Hear it,” and “Spanish help” (the lines and replies in Spanish).",
      "Hay tres niveles de apoyo, «Escúchalo» y «Ayuda en español» (las líneas y las respuestas en español).",
    ),
    help: P(
      "Take turns being Noor. Say each reply aloud and talk about which one sounds kind.",
      "Túrnense para ser Noor. Digan cada respuesta en voz alta y hablen de cuál suena amable.",
    ),
  },
  upgrade: {
    you: P(
      "You will make a plain sentence clearer by adding a detail, a more exact word and a connector.",
      "Mejorarán una oración sencilla agregando un detalle, una palabra más exacta y un conector.",
    ),
    try: P(
      "Choose “Start with this help,” write one improved sentence, press “Check my work,” then fix one thing it names.",
      "Elijan «Empezar con esta ayuda», escriban una oración mejorada, toquen «Revisar mi trabajo» y corrijan una cosa que la revisión señale.",
    ),
    support: P(
      "A sentence frame and word bank, an “Ask for more help” button, or nothing at all (“On my own”). The check looks for words and patterns, not meaning.",
      "Hay un marco de oración y un banco de palabras, un botón «Pedir más ayuda» o ninguna ayuda («Por mi cuenta»). La revisión busca palabras y patrones, no el significado.",
    ),
    help: P(
      "Read the plain sentence together, then ask: “What detail could you add?”",
      "Lean juntos la oración sencilla y pregunten: «¿Qué detalle puedes agregar?»",
    ),
  },
  paragraph: {
    you: P(
      "You will read a school-board situation, an article and a survey table, plan, write one paragraph that takes a position, then revise after feedback.",
      "Leerán una situación de la junta escolar, un artículo y una tabla de encuesta, planearán, escribirán un párrafo con una posición y lo revisarán.",
    ),
    try: P(
      "Read the Student Council Notes, write only your position sentence with the first frame, then press “Get feedback.”",
      "Lean las notas del consejo estudiantil (el texto «Student Council Notes», en inglés), escriban solo su oración de posición con el primer marco y toquen «Obtener comentarios».",
    ),
    support: P(
      "Three help levels, “Hear the task,” a “Read my writing to me” button, sentence frames, a word bank and a model. Writing saves on this device as you type.",
      "Hay tres niveles de ayuda, «Escuchar la tarea», un botón «Leer mi escritura en voz alta», marcos de oración, un banco de palabras y un modelo. Lo escrito se guarda en este dispositivo mientras escriben.",
    ),
    help: P(
      "Ask them to say their two reasons before they write.",
      "Pídanles que digan sus dos razones antes de escribir.",
    ),
  },
  newsroom: {
    you: P(
      "You will plan a news story, write it, read it aloud and make a printable front page.",
      "Planearán una noticia, la escribirán, la leerán en voz alta y harán una portada para imprimir.",
    ),
    try: P(
      "Choose “B Some support,” answer only Who and What in the Plan step, then open Draft.",
      "Elijan «B Algo de apoyo», respondan solo ¿Quién? y ¿Qué pasó? en el paso Planear y abran Redactar.",
    ),
    support: P(
      "Three support levels, and a choice of article or script. You can stop after any step.",
      "Hay tres niveles de apoyo y la opción de artículo o guion. Se puede parar después de cualquier paso.",
    ),
    help: P(
      "Ask the reporter’s questions out loud: Who? What happened? Why?",
      "Hagan en voz alta las preguntas de reportero: ¿Quién? ¿Qué pasó? ¿Por qué?",
    ),
  },
};

/** The card model for one activity id: data.js fact plus the guide's own wording. */
export function cardFor(id) {
  const base = ACTIVITY_BY_ID[id] || EXTRA_ACTIVITIES[id];
  return { ...base, ...(EXTRA_ACTIVITIES[id] || {}), text: CARD_TEXT[id], level: LEVELS[id] };
}

export const SPEAKING_IDS = ["hallway", "board", "scenario"];
export const WRITING_IDS = ["upgrade", "paragraph", "newsroom"];
/** Starting links for Start Here: one per skill. */
export const STARTERS = [
  {
    id: "hallway",
    kind: P("Start with Speaking", "Empiecen con Hablar"),
    why: P(
      "A picture gives you something to talk about, and you can hear a model student before you answer.",
      "Una imagen da un tema para hablar, y se puede escuchar a una estudiante modelo antes de responder.",
    ),
  },
  {
    id: "upgrade",
    kind: P("Start with Writing", "Empiecen con Escribir"),
    why: P(
      "It is one sentence long, so you can see a clear change in about 5 minutes.",
      "Es una sola oración, así que se puede ver un cambio claro en unos 5 minutos.",
    ),
  },
];

export const START_STEPS = [
  {
    id: "choose",
    head: P("Choose what to practice.", "Elijan qué practicar."),
    body: P(
      "Pick Speaking or Writing. Not sure? Begin with Speaking.",
      "Elijan Hablar o Escribir. ¿No están seguros? Empiecen con Hablar.",
    ),
  },
  {
    id: "try",
    head: P("Open an activity and try the example.", "Abran una actividad y prueben el ejemplo."),
    body: P(
      "Read the directions and try the first step. Some activities show a model or an example. Not every one does.",
      "Lean las instrucciones y prueben el primer paso. Algunas actividades muestran un modelo o un ejemplo. No todas lo hacen.",
    ),
  },
  {
    id: "respond",
    head: P(
      "Complete a response, use the feedback, and try again.",
      "Completen una respuesta, usen los comentarios y vuelvan a intentar.",
    ),
    body: P(
      "Say or write your answer. Where an activity offers a check, read it and try once more. Checks look for words and patterns, not meaning, and not every activity has one.",
      "Digan o escriban su respuesta. Si la actividad ofrece una revisión, léanla y vuelvan a intentar. Las revisiones buscan palabras y patrones, no el significado, y no todas las actividades la tienen.",
    ),
  },
];

export const START_FACTS = [
  {
    id: "account",
    en: FACTS.account,
    es: "No se necesita una cuenta para practicar. El trabajo se guarda en este navegador, en este dispositivo.",
  },
  {
    id: "saving",
    en: FACTS.saving,
    es: "El trabajo guardado se queda en el dispositivo y el navegador que usaron. No pasa a otro dispositivo, y si borran los datos del sitio, se borra. El Pasaporte puede exportarlo.",
  },
];

/** Practice at Home reuses the family page's four bullets (family-data.js) so the two never differ. */
export const HOME = {
  lead: P(
    "Practice Together is a short, calm way to practice English at home.",
    "Practicar juntos es una manera breve y tranquila de practicar inglés en casa.",
  ),
  open: P("Open Practice Together", "Abrir Practicar juntos"),
  more: P("More family help", "Más ayuda para familias"),
  detail: P(
    "The family page has the full directions with an example for each activity.",
    "La página para familias tiene las instrucciones completas con un ejemplo para cada actividad.",
  ),
  bullets: practiceAtHome,
  also: SUPPLEMENTAL.map((s) => s.id),
};

export const SPANISH_NOTE = P(
  "The Spanish on this page is machine-assisted and has not been reviewed by a human translator. Activities are English practice.",
  "El español de esta página es asistido por máquina y no ha sido revisado por un traductor humano. Las actividades son práctica de inglés.",
);
export const ENGLISH_ONLY_NOTE = P(
  "This part of the guide is in English. Practice at Home, Start Here, and Help are also in Spanish.",
  "Esta parte de la guía está en inglés. Empiecen aquí, Practicar en casa y Ayuda también están en español.",
);
export const GUIDE_ROUTES = { site: ROUTES.siteGuide };

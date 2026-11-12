// Site Guide data, part 2: the other skills, classroom routines, the "around the site" tasks, area overview and the
// Help questions. Facts about activities come from data.js; these are the guide's own words ({ en, es } where the
// section is translated). Every route was opened in a browser on 2026-11-10. Pure data, no DOM.
import { ACTIVITY_BY_ID, FACTS, FEATURED_LESSON, ROUTES } from "./data.js";

const P = (en, es) => ({ en, es });

/** Section "Reading, Listening, and Vocabulary": one verified starting activity per area, visually secondary. */
export const OTHER_AREAS = [
  {
    id: "listening",
    icon: "listening",
    name: "Listening",
    start: "Weather Words: Follow a Direction",
    route: "/Listening/A/classroom-directions",
    section: { route: "/Listening", label: "All Listening activities" },
    time: "5 min",
    helps:
      "Students listen to a spoken direction and choose the action it describes. The activity has four steps: Warm up, Learn, Try, Reflect.",
    supports: "Hear directions, key words, a Spanish preview, and a printable lesson sheet.",
    link: "Listening for directions prepares students to give and follow directions when they speak.",
  },
  {
    id: "reading",
    icon: "reading",
    name: "Reading Room",
    start: ACTIVITY_BY_ID.seasons.name,
    route: ACTIVITY_BY_ID.seasons.route,
    section: { route: "/reading-room", label: "Open the Reading Room" },
    time: ACTIVITY_BY_ID.seasons.time,
    helps: ACTIVITY_BY_ID.seasons.does,
    supports: ACTIVITY_BY_ID.seasons.supports,
    link: "After reading, students can choose “Write about a text” or “Speak about a text.”",
  },
  {
    id: "vocabulary",
    icon: "words",
    name: "Vocabulary (Word Lab)",
    start: ACTIVITY_BY_ID.morphemes.name,
    route: ACTIVITY_BY_ID.morphemes.route,
    section: { route: "/wordlab", label: "Open Word Lab" },
    time: ACTIVITY_BY_ID.morphemes.time,
    helps: ACTIVITY_BY_ID.morphemes.does,
    supports: ACTIVITY_BY_ID.morphemes.supports,
    link: "Knowing word parts gives students more exact words to use when they speak and write.",
  },
];

/** Section "Use It in Your Classroom": three routines. `activity` is a data.js id; the rest is the guide's advice. */
export const ROUTINES = [
  {
    id: "five",
    length: "5 minutes",
    name: "Exit ticket: improve one sentence",
    activity: "upgrade",
    directions:
      "Share the link. Students open it, choose “Start with this help,” revise “Phones in class are bad.” and press “Check my work.”",
    produce: "One revised sentence.",
    support: "The sentence frame and word bank under “Start with this help.”",
    lookFor: "A detail, an exact word and a connector (the same three things the check names).",
    followUp: "Partners swap sentences and underline the exact word each chose.",
  },
  {
    id: "ten",
    length: "10–15 minutes",
    name: `Speak, then write: ${FEATURED_LESSON.title}`,
    activity: "hallway",
    lesson: true,
    directions: `Follow the featured lesson: ${FEATURED_LESSON.steps.map((s) => s.name).join(", ")}. Partners say Step 3 aloud first, then everyone writes what they said.`,
    produce: "A spoken response, then two or three written sentences.",
    support: `The sentence frame: “${FEATURED_LESSON.frame}”`,
    lookFor: "A clear change, a “because,” and a “For example.” Ask students to point to each.",
    followUp: FEATURED_LESSON.followUp,
  },
  {
    id: "twenty",
    length: "20–30 minutes",
    name: "Write a position paragraph",
    activity: "paragraph",
    directions: ACTIVITY_BY_ID.paragraph.classroomUse,
    produce:
      "One paragraph with a position, two reasons from the sources and an answer to a concern, revised once after feedback.",
    support: "One of the three help levels, from frames and words to on my own.",
    lookFor:
      "The position sentence first, then two reasons that point to the sources. The feedback describes the writing and gives no score.",
    followUp: "Students read the paragraph to a partner and say which reason is strongest.",
  },
];

/** How to group students. Only features that exist are named; each has a verified link. */
export const GROUPINGS = [
  {
    id: "whole",
    name: "Whole class",
    text: "Project a routine from the Whole-Class Studio. The question and model stay hidden until you reveal them, and nothing students mark is collected.",
    link: { route: "/classroom", label: "Open the Whole-Class Studio" },
  },
  {
    id: "partners",
    name: "Partners",
    text: "Use any speaking activity with a listener. The listener holds up one finger for the change and two for the reason. This is a teaching move, not a site feature.",
  },
  {
    id: "small",
    name: "Small groups",
    text: "In the Launch Studio, “Print Station Cards / Answer Key and Teacher Notes” makes a one-page station card for a World, a Studio task or an activity.",
    link: { route: "/launch-studio", label: "Open the Launch Studio" },
  },
  {
    id: "independent",
    name: "Independent practice",
    text: "Give students a direct link or a printed ticket. They open it without an account and their work saves on their own device.",
    link: { route: "/launch-studio", label: "Make a direct link" },
  },
];

/** What really works for sharing, assigning, printing and progress (each read in the browser before writing). */
export const SHARING = [
  {
    id: "launch",
    head: "Launch Studio",
    text: "Choose an activity from its list, then copy the direct link, print a launch card, or print tickets (8 per page). The link holds the activity and mode only, never student information.",
    route: "/launch-studio",
  },
  {
    id: "library",
    head: "Activity library",
    text: "Press “Add” on up to 12 activities, then “Copy assignment link.” The link includes the activities, not answers or progress.",
    route: "/library",
  },
  {
    id: "print",
    head: "Preview and print",
    text: "Each room page (Listening, Reading, Speaking, Writing) has “Preview & print” and “Download Word packet.” Newsroom prints a front page.",
    route: "/Speaking",
  },
  {
    id: "passport",
    head: "Passport",
    text: "A student’s Passport shows practice saved on that device and can print a practice report. “Move my progress” moves saved work to another device.",
    route: "/passport",
  },
  {
    id: "class",
    head: "Class and Teacher Hub",
    text: "Joining a class is optional. A joined student’s teacher sees counts of what they practiced, never recordings unless the student sends one.",
    route: "/class",
    second: { route: "/access-teacher/", label: "Teacher Hub (sign-in required)" },
  },
];

export const PD_LINKS = [
  { route: ROUTES.tour, label: "Take the Teacher Tour" },
  { route: ROUTES.explore, label: "Explore for 20 Minutes" },
  { route: ROUTES.guide, label: "Open the Quick Guide" },
  { route: ROUTES.lesson, label: "See the Featured Lesson" },
];

/** Section "Find Your Way Around": real navigation tasks in plain language. */
export const WAYS = [
  {
    id: "home",
    q: P("Return home", "Volver al inicio"),
    a: P(
      "Choose “ACCESS Practice Lab” at the top left of any page, or the “Lab” link above the page title.",
      "Elijan “ACCESS Practice Lab” arriba a la izquierda en cualquier página, o el enlace “Lab” sobre el título.",
    ),
  },
  {
    id: "find",
    q: P("Find speaking and writing", "Encontrar hablar y escribir"),
    a: P(
      "Open the “More” menu at the top. Under “Practice by skill,” choose Speaking or Writing. The home page and the footer also list the four skills.",
      "Abran el menú “More” arriba. En “Practice by skill”, elijan Speaking o Writing. La página de inicio y el pie de página también muestran las cuatro destrezas.",
    ),
    links: [
      { route: "/Speaking", label: P("Speaking", "Hablar") },
      { route: "/Writing", label: P("Writing", "Escribir") },
    ],
  },
  {
    id: "back",
    q: P("Return from an activity", "Volver de una actividad"),
    a: P(
      "If you opened an activity from this guide, press “Back to Guide” at the bottom of the screen. You can also use your browser’s Back button, or the “Lab” link.",
      "Si abrieron una actividad desde esta guía, toquen “Volver a la guía” en la parte de abajo de la pantalla. También pueden usar el botón Atrás del navegador o el enlace “Lab”.",
    ),
  },
  {
    id: "link",
    q: P("Follow a teacher’s direct link", "Usar un enlace directo de un docente"),
    a: P(
      "The link opens the activity itself, with no sign-in. When you finish, choose “Lab” to look around, or this guide to see what else is here.",
      "El enlace abre la actividad misma, sin iniciar sesión. Al terminar, elijan “Lab” para explorar, o esta guía para ver qué más hay.",
    ),
  },
  {
    id: "help",
    q: P("Find help", "Encontrar ayuda"),
    a: P(
      "“Help and device check” is in the footer of every page. It tests sound and the microphone. Families can also use the Family Help Center.",
      "“Help and device check” está en el pie de cada página. Prueba el sonido y el micrófono. Las familias también pueden usar el Centro de ayuda familiar.",
    ),
    links: [
      { route: "/tools", label: P("Help and device check", "Ayuda y revisión del dispositivo") },
      { route: "/family/help", label: P("Family Help Center", "Centro de ayuda familiar") },
    ],
  },
  {
    id: "comfort",
    q: P("Make text bigger or change colors", "Agrandar el texto o cambiar los colores"),
    a: P(
      "Choose the A+ button at the top to open Reading comfort. It has color choices, text size, space between lines and letters, a reading ruler and calm motion.",
      "Elijan el botón A+ de arriba para abrir Reading comfort. Tiene opciones de color, tamaño del texto, espacio entre líneas y letras, regla de lectura y movimiento tranquilo.",
    ),
  },
  {
    id: "search",
    q: P("Search", "Buscar"),
    a: P(
      "Use the search box in the “More” menu or the “Search the lab” page to find a word, activity or page. The Activity library searches by topic and skill and can filter by grade, skill and support.",
      "Usen el cuadro de búsqueda del menú “More” o la página “Search the lab” para buscar una palabra, actividad o página. La biblioteca de actividades busca por tema y destreza y filtra por grado, destreza y apoyo.",
    ),
    links: [
      { route: "/search", label: P("Search the lab", "Buscar en el sitio") },
      { route: "/library", label: P("Activity library", "Biblioteca de actividades") },
    ],
  },
];

/** Annotated screenshots (pictures/guide/*.png, captured from the real interface by tools/access-intro-site-guide-shots.mjs). */
export const SCREENSHOTS = [
  {
    id: "header",
    file: "site-header.png",
    w: 820,
    h: 128,
    alt: "The top of a lab page on a tablet. Numbered marks point to the ACCESS Practice Lab name, the search button, the reading comfort button, the More menu button and the English, Spanish and both-languages buttons.",
    caption: P(
      "The top of every page. 1: home. 2: search. 3: reading comfort (text size, color, spacing). 4: the More menu. 5: language.",
      "La parte de arriba de cada página. 1: inicio. 2: búsqueda. 3: comodidad de lectura (tamaño del texto, color, espaciado). 4: menú More. 5: idioma.",
    ),
  },
  {
    id: "menu",
    file: "more-menu.png",
    w: 760,
    h: 650,
    alt: "The More menu open. Numbered marks point to the search box, the Practice by skill list with Listening, Reading, Speaking and Writing, and the Plan and review group.",
    caption: P(
      "The More menu. 1: search. 2: Practice by skill. 3: Plan and review.",
      "El menú More. 1: búsqueda. 2: Practice by skill. 3: Plan and review.",
    ),
  },
];

/** "All areas at a glance": every major current area, speaking and writing first. Descriptions read from each page. */
export const AREAS = [
  {
    route: "/Speaking",
    icon: "speaking",
    name: "Speaking",
    text: "Quick practice rooms for speaking, by grade band and support level.",
    main: true,
  },
  {
    route: "/Writing",
    icon: "writing",
    name: "Writing",
    text: "Quick practice rooms for writing, by grade band and support level.",
    main: true,
  },
  {
    route: "/Listening",
    icon: "listening",
    name: "Listening",
    text: "Listen for important words and follow what you hear.",
  },
  {
    route: "/Reading",
    icon: "reading",
    name: "Reading",
    text: "Reading practice rooms by support level.",
  },
  {
    route: "/library",
    icon: "library",
    name: "Activity library",
    text: "Search every activity and build a shared set of up to 12.",
  },
  {
    route: "/voice",
    icon: "speaking",
    name: "Voice Lab",
    text: "Picture speaking ladders, retelling, sound practice and shadowing.",
  },
  {
    route: "/wordlab",
    icon: "words",
    name: "Word Lab",
    text: "Academic words, word parts, cognates and word families.",
  },
  {
    route: "/reading-room",
    icon: "reading",
    name: "Reading Room",
    text: "Texts to read with word help, notes and read-aloud.",
  },
  {
    route: "/scenarios",
    icon: "conversation",
    name: "Real-Life Scenarios",
    text: "Branching conversations with a say-it step.",
  },
  {
    route: "/newsroom",
    icon: "writing",
    name: "Newsroom",
    text: "Plan, write, read aloud and print a front page.",
  },
  {
    route: "/worlds",
    icon: "worlds",
    name: "Language Worlds and studios",
    text: "Longer missions and studios for speaking, writing and evidence.",
  },
  {
    route: "/passport",
    icon: "passport",
    name: "Passport and Growth Map",
    text: "Saved practice on this device; the Growth Map shows evidence from your own work.",
    second: { route: "/growth", label: "Growth Map" },
  },
  {
    route: "/access-prep",
    icon: "tests",
    name: "ACCESS Prep and practice tests",
    text: "Classroom test practice. These are not official tests.",
    second: { route: "/tests", label: "Practice tests" },
  },
  {
    route: "/science-of-reading",
    icon: "reading",
    name: "Science of Reading",
    text: "Word study and short reading lessons.",
  },
  {
    route: "/family",
    icon: "families",
    name: "Families",
    text: "Family help, planner and progress pages in English and Spanish.",
    second: { route: ROUTES.together, label: "Practice Together" },
  },
  {
    route: "/access-teacher/",
    icon: "teacher",
    name: "Teacher Hub",
    text: "Teacher dashboard and tools (sign-in required).",
    external: true,
  },
];

/** Help questions. Short answers; facts come from data.js FACTS or from pages read in the browser. */
export const FAQ = [
  {
    id: "begin",
    q: P("Where should I begin?", "¿Por dónde empiezo?"),
    a: P(
      "Start with the three steps in Start Here. A good first speaking activity is The Busy Hallway, and a good first writing activity is the Language Upgrade Lab.",
      "Empiecen con los tres pasos de Empiecen aquí. Una buena primera actividad de hablar es The Busy Hallway, y una buena primera actividad de escribir es Language Upgrade Lab.",
    ),
  },
  {
    id: "account",
    q: P("Do I need an account?", "¿Necesito una cuenta?"),
    a: P(
      `${FACTS.account} Joining a teacher’s class is optional.`,
      "No se necesita una cuenta para practicar. El trabajo se guarda en este navegador, en este dispositivo. Unirse a la clase de un docente es opcional.",
    ),
  },
  {
    id: "saved",
    q: P("Will my work be saved?", "¿Se guardará mi trabajo?"),
    a: P(
      `${FACTS.saving} “Move my progress” moves it to another device.`,
      "El trabajo guardado se queda en el dispositivo y el navegador que usaron. No pasa a otro dispositivo, y si borran los datos del sitio, se borra. El Pasaporte puede exportarlo, y “Move my progress” lo mueve a otro dispositivo.",
    ),
    links: [{ route: "/passport", label: P("Open the Passport", "Abrir el Pasaporte") }],
  },
  {
    id: "device",
    q: P("Can I use a phone or tablet?", "¿Puedo usar un teléfono o una tableta?"),
    a: P(
      "Yes. The pages fit phone and tablet screens, and the controls are large enough to tap. Recording is optional, so a device without a microphone still works.",
      "Sí. Las páginas se ajustan a pantallas de teléfono y tableta, y los controles son lo bastante grandes para tocarlos. Grabar es opcional, así que un dispositivo sin micrófono también sirve.",
    ),
  },
  {
    id: "sound",
    q: P("What if sound does not play?", "¿Y si no se oye el sonido?"),
    a: P(
      `${FACTS.audio} “Help and device check” has a Listen button to test sound.`,
      "Si no se oye el sonido, revisen el volumen del dispositivo y prueben con otra pestaña del navegador. Todas las actividades se pueden hacer leyendo, escribiendo o hablando con otra persona. “Help and device check” tiene un botón Listen para probar el sonido.",
    ),
    links: [
      { route: "/tools", label: P("Help and device check", "Ayuda y revisión del dispositivo") },
    ],
  },
  {
    id: "mic",
    q: P("Do I need a microphone?", "¿Necesito un micrófono?"),
    a: P(
      FACTS.microphone,
      "Nunca se necesita un micrófono. La grabación empieza solo cuando alguien toca Grabar, y las grabaciones se quedan en la pestaña abierta.",
    ),
  },
  {
    id: "norecord",
    q: P("Can I practice without recording?", "¿Puedo practicar sin grabar?"),
    a: P(
      "Yes. Say your answer aloud to a partner or to yourself, then press the button that says you said it: “I said my answer” in kindergarten to grade 3, “I said it out loud” in the picture speaking ladders, and “I said it out loud (no recording)” or typed words in the School Board Meeting.",
      "Sí. Digan la respuesta en voz alta a un compañero o a ustedes mismos y luego toquen el botón que dice que la dijeron: “I said my answer” (“Dije mi respuesta”) de kínder a 3.º grado, “I said it out loud” (“Lo dije en voz alta”) en las escaleras de habla con imágenes, y “I said it out loud (no recording)” o palabras escritas en el School Board Meeting.",
    ),
    // The same answer for the grade a teacher or family chose (guide-knowledge.js faqAnswer). Every button name was
    // read from the running activity of that grade's tour (tour-bands.js) on 2026-11-11.
    byPick: {
      K: P(
        "Yes. In What Do You See?, the child says the answer aloud to you or a partner and presses “I said my answer.” The microphone is used only if someone presses “Record my answer.”",
        "Sí. En What Do You See?, el niño o la niña dice la respuesta en voz alta a ustedes o a un compañero y toca “I said my answer” (“Dije mi respuesta”). El micrófono se usa solo si alguien toca “Record my answer” (“Grabar mi respuesta”).",
      ),
      1: P(
        "Yes. In Name It: Garden, students say the answer aloud to you or a partner and press “I said my answer.” The microphone is used only if someone presses “Record my answer.”",
        "Sí. En Name It: Garden, los estudiantes dicen la respuesta en voz alta a ustedes o a un compañero y tocan “I said my answer” (“Dije mi respuesta”). El micrófono se usa solo si alguien toca “Record my answer” (“Grabar mi respuesta”).",
      ),
      "2-3": P(
        "Yes. In What Do You See in the Garden?, students say the answer aloud to a partner and press “I said my answer.” The microphone is used only if someone presses “Record my answer.”",
        "Sí. En What Do You See in the Garden?, los estudiantes dicen la respuesta en voz alta a un compañero y tocan “I said my answer” (“Dije mi respuesta”). El micrófono se usa solo si alguien toca “Record my answer” (“Grabar mi respuesta”).",
      ),
      "4-5": P(
        "Yes. In Our Class Garden, students say each step aloud and press “I said it out loud.” “Record my answer” is there only if they want it.",
        "Sí. En Our Class Garden, los estudiantes dicen cada paso en voz alta y tocan “I said it out loud” (“Lo dije en voz alta”). “Record my answer” está ahí solo si lo quieren usar.",
      ),
      "6-8": P(
        "Yes. In The Busy Hallway, students say each step aloud and press “I said it out loud.” In the School Board Meeting, they press “I said it out loud (no recording),” or type the words.",
        "Sí. En The Busy Hallway, los estudiantes dicen cada paso en voz alta y tocan “I said it out loud” (“Lo dije en voz alta”). En el School Board Meeting, tocan “I said it out loud (no recording)” o escriben las palabras.",
      ),
    },
  },
  {
    id: "share",
    q: P("How do I share an activity?", "¿Cómo comparto una actividad?"),
    a: P(
      "Open the Launch Studio, choose an activity and copy its direct link. For any other page, copy the address from your browser. Students open it without an account.",
      "Abran el Launch Studio, elijan una actividad y copien su enlace directo. Para cualquier otra página, copien la dirección del navegador. Los estudiantes la abren sin cuenta.",
    ),
    links: [
      { route: "/launch-studio", label: P("Open the Launch Studio", "Abrir el Launch Studio") },
    ],
  },
  {
    id: "language",
    q: P("How can I change the language?", "¿Cómo cambio el idioma?"),
    a: P(
      "Use the EN, ES and EN+ES buttons at the top of any page. Buttons and directions change; practice content stays in English.",
      "Usen los botones EN, ES y EN+ES arriba en cualquier página. Cambian los botones y las instrucciones; el contenido de práctica sigue en inglés.",
    ),
  },
  {
    id: "broken",
    q: P("What if an activity does not work?", "¿Y si una actividad no funciona?"),
    a: P(
      "Reload the page, then try another browser tab. Run the device check. Saved work stays on the device. If it still fails, tell your teacher, and use another activity or practice aloud with a partner.",
      "Recarguen la página y prueben otra pestaña del navegador. Hagan la revisión del dispositivo. El trabajo guardado se queda en el dispositivo. Si sigue fallando, avisen a su docente, y usen otra actividad o practiquen en voz alta con otra persona.",
    ),
    links: [
      { route: "/tools", label: P("Help and device check", "Ayuda y revisión del dispositivo") },
    ],
  },
];

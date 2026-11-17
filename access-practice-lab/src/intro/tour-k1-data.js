// The K–1 Teacher Tour (/start/tour-k1): its own tour for Kindergarten and Grade 1, separate from the Grades 3–8
// Teacher Tour 2.0 (tour/model.js, whose BANDS stay "3-5" and "6-8"). Pure data, no DOM, so
// tools/access-intro-k1-tour.test.mjs checks it in Node: every activity named here is a real K or Grade 1 row in
// content/index.json (id, title, domain, level) or a real early page (src/early/pages.js, the Phonics Path), and
// every string a person reads is English and Spanish. Spanish addresses adults as "ustedes".
//
// How the activities really work (read from src/early/player.js, story.js, phonics.js, words.js, scenes.js and the
// routes checked in tour-bands.js): directions are spoken, answers are pictures with a speaker button each, replay is
// the only help, a wrong answer never shows the right one, an age-matched model student speaks first, writing happens
// on paper, and Kindergarten Story Time is read aloud by an adult. Nothing is scored or timed.
// Mr. Neft's lines here are scripted: the K–1 tour sends nothing anywhere and makes no AI call.

export const K1_PICKS = ["K", "1"];
export const K1_STORE_KEY = "tourK1";
export const K1_ROUTE = "/start/tour-k1";
export const pickNames = {
  K: { en: "Kindergarten", es: "Kínder" },
  1: { en: "Grade 1", es: "1.º grado" },
};

const p = (en, es) => ({ en, es });
// A content/index.json activity: [band, Domain, level, id, title]. The route opens it in its own grade.
const act = (band, domain, level, id, title) => ({
  kind: "activity",
  band,
  domain,
  level,
  id,
  title,
  route: `/${domain}/${level}/${id}?grades=${band}`,
});
// An early page (src/early/pages.js) or the Phonics Path: never in index.json, so it names its own route.
const page = (band, id, route, title) => ({
  kind: "page",
  band,
  id,
  title,
  route: `${route}?grades=${band}`,
});

/** Every activity and page the tour names, keyed for the steps below. Titles are the site's own. */
export const K1_ACTIVITIES = {
  "k-home": page(
    "K",
    "home",
    "/early",
    p("Kindergarten practice home", "Página de práctica de kínder"),
  ),
  "1-home": page(
    "1",
    "home",
    "/early",
    p("Grade 1 practice home", "Página de práctica de 1.º grado"),
  ),
  "k-story": page(
    "K",
    "story",
    "/early/story",
    p("Story Time: Our Neighborhood Garden", "Hora del cuento: Nuestro huerto del vecindario"),
  ),
  "k-phonics": page(
    "K",
    "phonics",
    "/early/phonics",
    p("Sound Builder game", "Juego Construye con sonidos"),
  ),
  "1-phonics": page(
    "1",
    "phonics",
    "/early/phonics",
    p("Sound Builder game", "Juego Construye con sonidos"),
  ),
  "k-words": page(
    "K",
    "words",
    "/early/words",
    p("Picture word cards", "Tarjetas de palabras con dibujos"),
  ),
  "1-words": page(
    "1",
    "words",
    "/early/words",
    p("Picture word cards", "Tarjetas de palabras con dibujos"),
  ),
  "1-path": page(
    "1",
    "phonics-path",
    "/science-of-reading/path",
    p("Phonics Path: Levels 1 to 3", "Ruta de fonética: niveles 1 a 3"),
  ),
  "k-family": page("K", "family", "/early/family", p("Family time", "Tiempo en familia")),
  "1-family": page("1", "family", "/early/family", p("Family time", "Tiempo en familia")),
  "k-find-seed": act("K", "Listening", "A", "gk-l-a-find-seed", "Find the Seed"),
  "k-tweet": act("K", "Listening", "A", "gk-l-a-garden-bird", "Who Says Tweet?"),
  "k-fish": act("K", "Reading", "B", "gk-r-b-i-see-fish", "I See a Fish"),
  "k-sound-s": act("K", "Reading", "A", "gk-r-a-sound-s", "Starts with S"),
  "k-see": act("K", "Speaking", "A", "gk-s-a-garden-see", "What Do You See?"),
  "k-pond": act("K", "Speaking", "A", "gk-s-a-pond-animal", "Pond Walk"),
  "k-draw": act("K", "Writing", "A", "gk-w-a-draw-garden", "Draw a Garden"),
  "1-cat": act("1", "Listening", "A", "g1-l-a-hear-cat", "Find the Cat"),
  "1-ana": act("1", "Listening", "B", "g1-l-b-ana-waters", "Ana Helps"),
  "1-cat-mat": act("1", "Reading", "B", "g1-r-b-cat-mat", "The Cat Naps"),
  "1-sun": act("1", "Reading", "A", "g1-r-a-word-sun", "Read: sun"),
  "1-garden": act("1", "Speaking", "A", "g1-s-a-garden-name", "Name It: Garden"),
  "1-farm": act("1", "Speaking", "A", "g1-s-a-farm-name", "Name It: Farm"),
  "1-i-see": act("1", "Writing", "B", "g1-w-b-i-see", "I See Sentence"),
};

/** The other routes the tour links (not activities): family walkthrough, Passport, class. */
export const K1_LINKS = {
  together: {
    route: "/practice-together",
    label: p(
      "Practice Together: the family walkthrough",
      "Practicar juntos: la guía para familias",
    ),
  },
  passport: { route: "/passport", label: p("Passport", "Pasaporte") },
  class: { route: "/class", label: p("My class", "Mi clase") },
  tour38: {
    route: "/start/tour",
    label: p("Teacher Tour for Grades 3–8", "Recorrido para docentes de 3.º a 8.º grado"),
  },
};

/**
 * The tour, in order. Each step: a short name (the step rail), a title, what it is, the directions a teacher follows,
 * Mr. Neft's line, and per grade the activity "Try it" opens (`try`) plus more real ones (`more`).
 */
export const K1_STEPS = [
  {
    id: "welcome",
    name: p("How it works", "Cómo funciona"),
    title: p(
      "How Kindergarten and Grade 1 practice works",
      "Cómo funciona la práctica de kínder y 1.º grado",
    ),
    what: p(
      "Young learners have their own practice home. Every direction is spoken, answers are pictures, and a grown-up sits nearby. Kindergarten is built for an adult to sit beside the child; Grade 1 children can listen to every prompt on their own.",
      "Los más pequeños tienen su propia página de práctica. Cada instrucción se oye, las respuestas son dibujos y un adulto está cerca. Kínder está hecho para que un adulto se siente al lado del niño; en 1.º grado los niños pueden escuchar cada instrucción por su cuenta.",
    ),
    directions: [
      p("Choose Kindergarten or Grade 1 above.", "Elijan kínder o 1.º grado arriba."),
      p(
        "Press “Try it here” to open the practice home a child sees.",
        "Toquen «Pruébenlo aquí» para abrir la página de práctica que ve un niño.",
      ),
      p(
        "Find the “Audio-first mode” button: it is on for these grades.",
        "Busquen el botón «Modo de audio primero»: está activado para estos grados.",
      ),
    ],
    neft: p(
      "Welcome. This tour is just for Kindergarten and Grade 1. We’ll go slowly and try the real pages a child uses.",
      "Bienvenidos. Este recorrido es solo para kínder y 1.º grado. Vamos con calma y probamos las páginas reales que usa un niño.",
    ),
    try: { K: "k-home", 1: "1-home" },
    more: { K: [], 1: [] },
  },
  {
    id: "listen",
    name: p("Listen together", "Escuchar juntos"),
    title: p(
      "Listening: a story read aloud, then a picture to tap",
      "Escuchar: un cuento leído en voz alta y un dibujo para tocar",
    ),
    what: p(
      "In Kindergarten, Story Time is a picture story that an adult reads aloud and talks about, one page at a time. It is not a computer test. In Grade 1, children hear a short prompt and tap the picture that answers it.",
      "En kínder, la Hora del cuento es un cuento ilustrado que un adulto lee en voz alta y comenta, una página a la vez. No es un examen en computadora. En 1.º grado, los niños oyen una instrucción corta y tocan el dibujo que la responde.",
    ),
    directions: [
      p(
        "Kindergarten: open Story Time, press “Read the page,” then read the grown-up’s question aloud.",
        "Kínder: abran la Hora del cuento, toquen «Leer la página» y lean en voz alta la pregunta para el adulto.",
      ),
      p(
        "Grade 1: open the activity, press “Hear it again,” then tap a picture and press “Check.”",
        "1.º grado: abran la actividad, toquen «Escuchar otra vez», toquen un dibujo y luego «Revisar».",
      ),
      p(
        "Open “What to listen for” to see what a good answer sounds like. Any answer is welcome.",
        "Abran «Qué escuchar» para ver cómo suena una buena respuesta. Toda respuesta es bienvenida.",
      ),
    ],
    neft: p(
      "Kindergarten Story Time is yours to read. The tick “We talked about it” is only a bookmark; nothing is scored.",
      "La Hora del cuento de kínder la leen ustedes. La marca «Ya lo conversamos» es solo un marcador; nada se califica.",
    ),
    try: { K: "k-story", 1: "1-cat" },
    more: { K: ["k-find-seed", "k-tweet"], 1: ["1-ana"] },
  },
  {
    id: "tap",
    name: p("What children tap", "Qué tocan los niños"),
    title: p("What the student taps", "Qué toca el estudiante"),
    what: p(
      "The audio-first player speaks the directions when the activity opens. Each answer is a picture with its own speaker button. Replay is the only help: nothing removes a choice, and a wrong answer never shows the right one. The child hears the question again and tries again.",
      "El reproductor de audio primero dice las instrucciones al abrir la actividad. Cada respuesta es un dibujo con su propio botón de altavoz. Volver a escuchar es la única ayuda: nada quita una opción y una respuesta equivocada nunca muestra la correcta. El niño oye la pregunta otra vez y vuelve a intentar.",
    ),
    directions: [
      p("Tap the sentence to hear it read aloud.", "Toquen la oración para oírla en voz alta."),
      p(
        "Press the speaker button on one picture to hear that choice.",
        "Toquen el botón de altavoz de un dibujo para oír esa opción.",
      ),
      p(
        "Tap a picture and press “Check.” Try a wrong picture once to see what a child sees.",
        "Toquen un dibujo y luego «Revisar». Prueben una vez un dibujo equivocado para ver lo que ve un niño.",
      ),
    ],
    neft: p(
      "Try a wrong answer on purpose. See how the question just plays again? No red marks, no answer given away.",
      "Prueben una respuesta equivocada a propósito. ¿Ven que la pregunta solo se repite? Sin marcas rojas y sin regalar la respuesta.",
    ),
    try: { K: "k-fish", 1: "1-cat-mat" },
    more: { K: [], 1: [] },
  },
  {
    id: "phonics",
    name: p("Phonics and words", "Fonética y palabras"),
    title: p("Phonics and words", "Fonética y palabras"),
    what: p(
      "Sound Builder says a word and each of its sounds; the child builds the word from sound tiles, left to right. A wrong tile goes back and that sound is said again. Picture word cards say the English word when a picture is tapped, with the Spanish word as an option. Grade 1 also has the Phonics Path: short lessons on one sound pattern at a time.",
      "Construye con sonidos dice una palabra y cada uno de sus sonidos; el niño forma la palabra con fichas, de izquierda a derecha. Una ficha equivocada regresa y ese sonido se dice otra vez. Las tarjetas de palabras con dibujos dicen la palabra en inglés al tocar un dibujo, con la palabra en español como opción. 1.º grado también tiene la Ruta de fonética: lecciones cortas sobre un patrón de sonidos a la vez.",
    ),
    directions: [
      p(
        "Open Sound Builder and listen to the word. Tap the sound tiles in order to fill the sound boxes.",
        "Abran Construye con sonidos y escuchen la palabra. Toquen las fichas en orden para llenar las cajas de sonidos.",
      ),
      p(
        "Open Picture word cards and tap three pictures. Turn on the Spanish word if it helps your class.",
        "Abran las tarjetas de palabras y toquen tres dibujos. Activen la palabra en español si ayuda a su clase.",
      ),
      p(
        "Try one first-sound or word activity from the list below.",
        "Prueben una actividad de primer sonido o de palabras de la lista de abajo.",
      ),
    ],
    neft: p(
      "Sound Builder never fills in the word for a child, and no tile is ever taken away. Every finished word grows a plant.",
      "Construye con sonidos nunca completa la palabra por el niño y nunca quita una ficha. Cada palabra terminada hace crecer una planta.",
    ),
    try: { K: "k-phonics", 1: "1-path" },
    more: { K: ["k-words", "k-sound-s"], 1: ["1-phonics", "1-words", "1-sun"] },
  },
  {
    id: "talk",
    name: p("Talk and write", "Hablar y escribir"),
    title: p(
      "Talking about a picture, then writing on paper",
      "Hablar de una imagen y luego escribir en papel",
    ),
    what: p(
      "Speaking activities show a large drawn scene. A student the child’s own age answers first, and the sentence starter “I see ___.” waits behind a speaker button. Recording is optional; saying it to a partner counts. Writing happens with a pencil: the site prints a page with the picture and the words to copy.",
      "Las actividades de hablar muestran una escena grande dibujada. Un estudiante de la misma edad responde primero, y el inicio de oración «I see ___.» espera detrás de un botón de altavoz. Grabar es opcional; decirlo a un compañero también cuenta. Se escribe con lápiz: el sitio imprime una página con el dibujo y las palabras para copiar.",
    ),
    directions: [
      p(
        "Press the button to hear the model student answer first.",
        "Toquen el botón para oír primero la respuesta del estudiante modelo.",
      ),
      p(
        "Say your own answer aloud, then press “I said my answer.” You never have to record.",
        "Digan su propia respuesta en voz alta y toquen «Dije mi respuesta». Nunca es necesario grabar.",
      ),
      p(
        "Open the writing activity and look at the page children would print.",
        "Abran la actividad de escritura y miren la página que imprimirían los niños.",
      ),
    ],
    neft: p(
      "Pointing or one word is a fine start. Say the child’s words back in a full sentence, and let them hear it.",
      "Señalar o decir una palabra es un buen comienzo. Repitan las palabras del niño en una oración completa para que la oiga.",
    ),
    try: { K: "k-see", 1: "1-garden" },
    more: { K: ["k-pond", "k-draw"], 1: ["1-farm", "1-i-see"] },
  },
  {
    id: "run",
    name: p("Run it with your class", "Úsenlo con su clase"),
    title: p(
      "Running audio-first practice with a class or a small group",
      "Cómo usar la práctica de audio primero con la clase o un grupo pequeño",
    ),
    what: p(
      "Whole class: put one activity on the projector, play the prompt, and have children point or answer together. Story Time has a Class mode for the projector. Small group: one device per table, children take turns tapping while the others say the answer quietly. Centers: print the writing page; children draw, copy and share with a partner.",
      "Toda la clase: proyecten una actividad, reproduzcan la instrucción y pidan a los niños que señalen o respondan juntos. La Hora del cuento tiene un Modo clase para el proyector. Grupo pequeño: un dispositivo por mesa; los niños se turnan para tocar mientras los demás dicen la respuesta en voz baja. Centros: impriman la página de escritura; los niños dibujan, copian y lo comparten con un compañero.",
    ),
    directions: [
      p(
        "Pick one setting for tomorrow: whole class, small group or a center.",
        "Elijan un formato para mañana: toda la clase, grupo pequeño o un centro.",
      ),
      p(
        "Open the activity for that setting and run it once yourself, out loud.",
        "Abran la actividad para ese formato y háganla una vez ustedes mismos, en voz alta.",
      ),
      p(
        "Plan the one sentence you will model, such as “I see a flower.”",
        "Planeen la oración que van a modelar, por ejemplo «I see a flower.»",
      ),
    ],
    neft: p(
      "Four minutes is plenty. One prompt, everyone points, then a partner turn. That’s a whole routine.",
      "Cuatro minutos son suficientes. Una instrucción, todos señalan y luego un turno con un compañero. Esa es una rutina completa.",
    ),
    try: { K: "k-find-seed", 1: "1-cat" },
    more: { K: ["k-story", "k-draw"], 1: ["1-cat-mat", "1-i-see"] },
  },
  {
    id: "supports",
    name: p("Supports", "Apoyos"),
    title: p("Supports children can use", "Apoyos que los niños pueden usar"),
    what: p(
      "Every support is a button the child chooses: hear it again, hear one picture choice, hear the model student, hear the sentence starter, talk with a partner instead of recording, draw first. The “Audio-first mode” switch on the practice home turns the spoken player on or off. Families and classes can turn on Spanish or both languages for directions; practice items stay in English.",
      "Cada apoyo es un botón que el niño elige: escuchar otra vez, oír una opción con dibujo, oír al estudiante modelo, oír el inicio de oración, hablar con un compañero en vez de grabar, dibujar primero. El botón «Modo de audio primero» de la página de práctica activa o desactiva el reproductor hablado. Las familias y las clases pueden activar el español o ambos idiomas para las instrucciones; las preguntas de práctica siguen en inglés.",
    ),
    directions: [
      p(
        "In the speaking activity, press the speaker beside “I see ___.” to hear the starter.",
        "En la actividad de hablar, toquen el altavoz junto a «I see ___.» para oír el inicio de oración.",
      ),
      p(
        "In Picture word cards, turn the Spanish word on and off.",
        "En las tarjetas de palabras, activen y desactiven la palabra en español.",
      ),
      p(
        "Notice that no support costs anything: nothing is scored.",
        "Noten que ningún apoyo cuesta nada: nada se califica.",
      ),
    ],
    neft: p(
      "The home language is a bridge, not a crutch. Talk in any language builds the ideas the English words attach to.",
      "El idioma de casa es un puente, no una muleta. Hablar en cualquier idioma construye las ideas a las que se unen las palabras en inglés.",
    ),
    try: { K: "k-words", 1: "1-words" },
    more: { K: ["k-see"], 1: ["1-garden"] },
  },
  {
    id: "after",
    name: p("What you see after", "Lo que ven después"),
    title: p("What you see afterwards", "Lo que ven después"),
    what: p(
      "Audio-first work saves to the same practice record as every other activity on that device, so the child’s Passport shows what was practiced and can print a practice report. Joining a class is optional; a joined child’s teacher sees counts of what was practiced, never recordings unless one is sent. Story Time ticks are only bookmarks. Nothing is a WIDA score, level or test result.",
      "El trabajo con audio primero se guarda en el mismo registro de práctica que cualquier otra actividad en ese dispositivo, así que el Pasaporte del niño muestra lo que practicó y puede imprimir un informe de práctica. Unirse a una clase es opcional; el docente de un niño que se unió ve cuántas actividades practicó, nunca grabaciones a menos que se envíe una. Las marcas de la Hora del cuento son solo marcadores. Nada es un puntaje, nivel o resultado de WIDA.",
    ),
    directions: [
      p(
        "Open the Passport to see what this device has practiced.",
        "Abran el Pasaporte para ver lo que se practicó en este dispositivo.",
      ),
      p(
        "If you use classes, open “My class” to see what a child sees.",
        "Si usan clases, abran «Mi clase» para ver lo que ve un niño.",
      ),
      p(
        "Watch and listen during practice: what a child says aloud is your best evidence.",
        "Observen y escuchen durante la práctica: lo que un niño dice en voz alta es su mejor evidencia.",
      ),
    ],
    neft: p(
      "With little ones, your notes from listening beat any count on a screen. The site just helps you see who practiced.",
      "Con los pequeños, sus notas al escuchar valen más que cualquier número en pantalla. El sitio solo ayuda a ver quién practicó.",
    ),
    try: { K: "k-home", 1: "1-home" },
    more: { K: [], 1: [] },
    links: ["passport", "class"],
  },
  {
    id: "families",
    name: p("Families at home", "Las familias en casa"),
    title: p("How families continue at home", "Cómo siguen las familias en casa"),
    what: p(
      "Practice Together is the family walkthrough for grades K–2: one picture-talk routine for tonight, in English and Spanish, with a printable handout. Family time on the practice home has short talk-and-play activities that use things most homes have. Families can talk in their home language.",
      "Practicar juntos es la guía para familias de los grados K a 2: una rutina para hablar de una imagen esta noche, en inglés y español, con una hoja para imprimir. Tiempo en familia, en la página de práctica, tiene actividades cortas para hablar y jugar con cosas que hay en casi todas las casas. Las familias pueden hablar en su idioma.",
    ),
    directions: [
      p(
        "Open Practice Together and copy its link for your families.",
        "Abran Practicar juntos y copien el enlace para sus familias.",
      ),
      p(
        "Print or send the K–2 family handout in English or Spanish.",
        "Impriman o envíen la hoja para familias de K a 2 en inglés o español.",
      ),
      p(
        "Download this tour’s quick reference to keep beside you.",
        "Descarguen la referencia rápida de este recorrido para tenerla a mano.",
      ),
    ],
    neft: p(
      "That’s the tour. Five minutes together at home, a picture and a sentence, is exactly right for this age.",
      "Ese es el recorrido. Cinco minutos juntos en casa, un dibujo y una oración, es justo lo adecuado para esta edad.",
    ),
    try: { K: "k-family", 1: "1-family" },
    more: { K: [], 1: [] },
    links: ["together"],
  },
];

export const K1_STEP_IDS = K1_STEPS.map((s) => s.id);

/** Interface words for the tour page. */
export const K1_COPY = {
  eyebrow: p("For teachers · Kindergarten and Grade 1", "Para docentes · Kínder y 1.º grado"),
  title: p("K–1 Teacher Tour", "Recorrido para docentes de K a 1.º grado"),
  lead: p(
    "Its own tour for the youngest learners: try the real pages a child uses, then plan how you will run them.",
    "Un recorrido propio para los más pequeños: prueben las páginas reales que usa un niño y planeen cómo usarlas.",
  ),
  pickLabel: p("Which grade do you teach?", "¿Qué grado enseñan?"),
  rail: p("K–1 tour steps", "Pasos del recorrido de K a 1.º"),
  stepOf: p("Step {n} of {total}", "Paso {n} de {total}"),
  directions: p("Do this", "Hagan esto"),
  tryIt: p("Try it here", "Pruébenlo aquí"),
  close: p("Close the activity", "Cerrar la actividad"),
  open: p("Open the activity", "Abrir la actividad"),
  more: p("More to try for this grade", "Más para probar en este grado"),
  frameNote: p(
    "This is the real page. Answers in this preview are not saved to this device.",
    "Esta es la página real. Las respuestas en esta vista previa no se guardan en este dispositivo.",
  ),
  back: p("Back", "Atrás"),
  next: p("Next", "Siguiente"),
  done: p("Finish the tour", "Terminar el recorrido"),
  exit: p("Exit", "Salir"),
  resumed: p(
    "Welcome back. You are on the step where you stopped.",
    "Bienvenidos de nuevo. Están en el paso donde se quedaron.",
  ),
  restart: p("Start the K–1 tour over", "Empezar de nuevo el recorrido de K a 1.º"),
  handout: p("K–2 family handout", "Hoja para familias de K a 2"),
  quickref: p("Quick reference", "Referencia rápida"),
  quickrefPdf: p("Download the quick reference (PDF)", "Descargar la referencia rápida (PDF)"),
  print: p("Print this page", "Imprimir esta página"),
  older: p(
    "Teach Grades 3–8 too? Take the Teacher Tour for Grades 3–8.",
    "¿También enseñan de 3.º a 8.º? Hagan el recorrido para 3.º a 8.º grado.",
  ),
  saved: p(
    "Your place in this tour is saved in this browser on this device only. Nothing is sent anywhere.",
    "Su lugar en este recorrido se guarda solo en este navegador y este dispositivo. No se envía nada.",
  ),
  coachRole: p("Your tour guide", "Su guía del recorrido"),
  pdfDone: p("Quick reference downloaded.", "Referencia rápida descargada."),
};

/** The step for a skill from the Start page's domain cards (?skill=listening|speaking|reading|writing). */
export const SKILL_STEP = {
  listening: "listen",
  speaking: "talk",
  reading: "tap",
  writing: "talk",
};

/** The K–1 grade for this visit: a ?grades= value first, then this device's saved choice, else Kindergarten. */
export function k1PickFrom(grades, saved) {
  const g = String(grades || "")
    .trim()
    .toUpperCase();
  if (K1_PICKS.includes(g)) return g;
  return K1_PICKS.includes(saved) ? saved : "K";
}

/** Reads what was saved and returns a complete, valid state. */
export function normalizeK1(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const step = Number.isInteger(s.step) && s.step >= 0 && s.step < K1_STEPS.length ? s.step : 0;
  const furthest = Number.isInteger(s.furthest)
    ? Math.min(K1_STEPS.length - 1, Math.max(step, s.furthest))
    : step;
  return {
    v: 1,
    pick: K1_PICKS.includes(s.pick) ? s.pick : "K",
    step,
    furthest,
    done: s.done === true,
  };
}

/** What this device remembers about the K–1 tour: "start", "continue" or "again" (finished). */
export function k1Status(intro) {
  const t = intro?.[K1_STORE_KEY];
  if (!t || !(t.furthest > 0 || t.step > 0 || t.done)) return { state: "start", step: 0 };
  const s = normalizeK1(t);
  return { state: s.done ? "again" : "continue", step: s.step };
}

/** The activity a step opens for a grade, and the more-to-try list, as records. */
export const stepTry = (step, pick) => K1_ACTIVITIES[step.try[pick]];
export const stepMore = (step, pick) => (step.more[pick] || []).map((k) => K1_ACTIVITIES[k]);

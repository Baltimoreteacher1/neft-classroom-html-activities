/* =============================================================================
 * Family Math Night kit — every sentence a family or volunteer will read.
 * -----------------------------------------------------------------------------
 * Each item is { en, es }. The English leads; the Spanish sits under it, written
 * in the formal "ustedes" voice used across Family Connections, not translated
 * word for word. The night is CALM by design: nothing here asks for a timer, a
 * score, a rank or a winner (tools/math-night-kit.test.mjs enforces that).
 * ========================================================================== */

export const UNIT_NAMES_ES = Object.freeze({
  1: "Las matemáticas son descubrimiento",
  2: "Estadística",
  3: "Razones y tasas",
  4: "Porcentajes",
  5: "Área, área de superficie y volumen",
  6: "Expresiones",
  7: "Enteros y el plano de coordenadas",
  8: "Ecuaciones y desigualdades",
  9: "Relaciones entre dos variables",
});

export const CHROME = Object.freeze({
  pageTitle: { en: "Family Math Night kit", es: "Kit para la Noche de Matemáticas en Familia" },
  intro: {
    en: "Pick a unit and get a print-ready kit: six stations, bilingual signs, a family passport, a volunteer script, a 60-minute plan, a materials list and a set-up checklist.",
    es: "Elija una unidad y obtenga un kit listo para imprimir: seis estaciones, letreros bilingües, un pasaporte familiar, un guion para voluntarios, un plan de 60 minutos, una lista de materiales y una lista de preparación.",
  },
  unitLabel: { en: "Unit", es: "Unidad" },
  detailsHeading: { en: "About your event (optional)", es: "Sobre su evento (opcional)" },
  dateLabel: { en: "Date", es: "Fecha" },
  timeLabel: { en: "Time", es: "Hora" },
  placeLabel: { en: "Room or place", es: "Salón o lugar" },
  partsHeading: { en: "What to print", es: "Qué imprimir" },
  print: { en: "Print the kit", es: "Imprimir el kit" },
  ready: {
    en: (unit, n) => `Kit for Unit ${unit} is ready: ${n} stations.`,
    es: (unit, n) => `El kit de la Unidad ${unit} está listo: ${n} estaciones.`,
  },
  loadError: {
    en: "The kit for this unit could not load. Check your connection and try again.",
    es: "No se pudo cargar el kit de esta unidad. Revise su conexión e inténtelo de nuevo.",
  },
  testQr: {
    en: "Scan each code with a phone before the night. Every link opens a page on eduwonderlab.com.",
    es: "Escanee cada código con un teléfono antes de la noche. Cada enlace abre una página de eduwonderlab.com.",
  },
  stationOf: {
    en: (n, total) => `Station ${n} of ${total}`,
    es: (n, total) => `Estación ${n} de ${total}`,
  },
  connects: { en: "Connects to", es: "Se conecta con" },
  lessonWord: { en: "Lesson", es: "Lección" },
  atTable: { en: "At this table", es: "En esta mesa" },
  tryAsking: { en: "Try asking", es: "Pregunten" },
  scan: {
    en: "Scan to open on a phone or tablet",
    es: "Escanee para abrir en un teléfono o tableta",
  },
  calm: {
    en: "No timer. No score. Move on when you are ready.",
    es: "Sin cronómetro. Sin puntaje. Sigan cuando estén listos.",
  },
  night: { en: "Family Math Night", es: "Noche de Matemáticas en Familia" },
  gradeLine: { en: "6th-Grade Math", es: "Matemáticas de 6.º grado" },
});

/** Section ids, in print order. The page lets the organizer leave any out. */
export const PARTS = Object.freeze([
  { id: "plan", en: "Plan, materials and set-up", es: "Plan, materiales y preparación" },
  { id: "script", en: "Volunteer script", es: "Guion para voluntarios" },
  { id: "signs", en: "Station signs (6)", es: "Letreros de estaciones (6)" },
  { id: "passport", en: "Family passport", es: "Pasaporte familiar" },
]);

export const GROUND_RULES = Object.freeze([
  {
    en: "Everything is optional. A family can skip a station or stay at one all night.",
    es: "Todo es opcional. Una familia puede saltar una estación o quedarse en una toda la noche.",
  },
  {
    en: "No timers, no scores, no leaderboards and no winners.",
    es: "Sin cronómetros, sin puntajes, sin tablas de posiciones y sin ganadores.",
  },
  {
    en: "Families explain their thinking. Volunteers ask questions and do not take over the math.",
    es: "Las familias explican su razonamiento. Los voluntarios hacen preguntas y no resuelven por ellos.",
  },
  {
    en: "Use first names only. Nobody's work or grades are shared.",
    es: "Use solo nombres de pila. No se comparte el trabajo ni las calificaciones de nadie.",
  },
]);

/** What happens at a station of each kind. Every step is something to DO at the table. */
export const ROLES = Object.freeze({
  game: {
    name: { en: "Game Table", es: "Mesa de juegos" },
    steps: [
      {
        en: "Open the game with the QR code, or type the short link.",
        es: "Abran el juego con el código QR o escriban el enlace corto.",
      },
      {
        en: "Take turns. One person plays while the other says the plan out loud.",
        es: "Túrnense. Una persona juega mientras la otra dice el plan en voz alta.",
      },
      {
        en: "When a try does not work, say what you will change. Mistakes are how we learn.",
        es: "Si un intento no funciona, digan qué van a cambiar. Equivocarse es parte de aprender.",
      },
      {
        en: "Stamp the passport when you are ready to move on.",
        es: "Sellen el pasaporte cuando estén listos para seguir.",
      },
    ],
    ask: [
      { en: "How did you choose that move?", es: "¿Cómo eligieron esa jugada?" },
      { en: "What will you try next, and why?", es: "¿Qué probarán después y por qué?" },
    ],
  },
  lab: {
    name: { en: "Lab Table", es: "Mesa de laboratorio" },
    steps: [
      {
        en: "Open the lab and read the mission out loud, one sentence each.",
        es: "Abran el laboratorio y lean la misión en voz alta, una oración cada uno.",
      },
      {
        en: "Sketch your plan on scrap paper before you touch the screen.",
        es: "Dibujen su plan en papel borrador antes de tocar la pantalla.",
      },
      {
        en: "Try your plan in the lab. Change it if the model shows something new.",
        es: "Prueben su plan en el laboratorio. Cámbienlo si el modelo muestra algo nuevo.",
      },
      {
        en: "Explain your model to someone else at the table, then stamp the passport.",
        es: "Expliquen su modelo a otra persona de la mesa y luego sellen el pasaporte.",
      },
    ],
    ask: [
      { en: "What does your picture show?", es: "¿Qué muestra su dibujo?" },
      {
        en: "What stayed the same when you changed it?",
        es: "¿Qué no cambió cuando lo modificaron?",
      },
    ],
  },
  studio: {
    name: { en: "Studio Table", es: "Mesa del estudio" },
    steps: [
      {
        en: "This is Family Math Studio, the same page your family can use at home.",
        es: "Este es el Estudio Familiar de Matemáticas, la misma página que su familia puede usar en casa.",
      },
      {
        en: "Read the example together. Take turns reading and explaining.",
        es: "Lean el ejemplo juntos. Túrnense para leer y explicar.",
      },
      {
        en: "Try one problem on paper first, then enter your answer on the screen.",
        es: "Primero intenten un problema en papel y luego escriban su respuesta en la pantalla.",
      },
      {
        en: "Say how you know. Then stamp the passport.",
        es: "Digan cómo lo saben. Luego sellen el pasaporte.",
      },
    ],
    ask: [
      { en: "How do you know?", es: "¿Cómo lo saben?" },
      { en: "Can you show it a different way?", es: "¿Pueden mostrarlo de otra manera?" },
    ],
  },
  build: {
    name: { en: "Build Table", es: "Mesa de construcción" },
    steps: [
      {
        en: "Open the Math Workbench and choose one tool, like a number line or a grid.",
        es: "Abran el Taller de Matemáticas y elijan una herramienta, como una recta numérica o una cuadrícula.",
      },
      {
        en: "Make a picture of one idea from this unit. Your family picks the idea.",
        es: "Hagan un dibujo de una idea de esta unidad. Su familia elige la idea.",
      },
      {
        en: "Tell your partner what the picture shows, using words from the unit.",
        es: "Cuéntenle a su compañero qué muestra el dibujo, usando palabras de la unidad.",
      },
      {
        en: "Stamp the passport when you are ready to move on.",
        es: "Sellen el pasaporte cuando estén listos para seguir.",
      },
    ],
    ask: [
      {
        en: "What is the most important part of your picture?",
        es: "¿Cuál es la parte más importante de su dibujo?",
      },
      { en: "How could someone else use it?", es: "¿Cómo podría usarlo otra persona?" },
    ],
  },
});

/** 60 minutes, start to finish. A shape for the night, not a bell schedule. */
export const RUN_OF_SHOW = Object.freeze([
  {
    start: 0,
    minutes: 10,
    title: { en: "Welcome", es: "Bienvenida" },
    body: {
      en: "Greet families at the door. Hand out passports. Explain the ground rules and point to the six stations.",
      es: "Reciba a las familias en la puerta. Entregue los pasaportes. Explique las reglas y señale las seis estaciones.",
    },
  },
  {
    start: 10,
    minutes: 35,
    title: { en: "Explore the stations", es: "Explorar las estaciones" },
    body: {
      en: "Families move freely and at their own pace. Suggest trying three or more stations. No bell and no rotation.",
      es: "Las familias se mueven libremente y a su propio ritmo. Sugiera probar tres estaciones o más. Sin campana y sin rotación.",
    },
  },
  {
    start: 45,
    minutes: 10,
    title: { en: "Share one idea", es: "Compartir una idea" },
    body: {
      en: "Invite families to share one thing they noticed. Sharing is optional and nobody is called on.",
      es: "Invite a las familias a compartir algo que notaron. Compartir es opcional y no se señala a nadie.",
    },
  },
  {
    start: 55,
    minutes: 5,
    title: { en: "Close", es: "Cierre" },
    body: {
      en: "Thank everyone. Point to the code on the passport for Family Math Studio at home. Collect the signs.",
      es: "Agradezca a todos. Señale el código del pasaporte para el Estudio Familiar en casa. Recoja los letreros.",
    },
  },
]);

export const MATERIALS = Object.freeze([
  {
    en: "Printed station signs (6) and passports (one per family)",
    es: "Letreros de estación impresos (6) y pasaportes (uno por familia)",
  },
  {
    en: "One charged Chromebook or tablet per station (a family phone also works)",
    es: "Una Chromebook o tableta cargada por estación (el teléfono de una familia también sirve)",
  },
  { en: "Pencils and scrap paper at every table", es: "Lápices y papel borrador en cada mesa" },
  {
    en: "Stamps, stickers or colored pencils for the passport boxes",
    es: "Sellos, calcomanías o lápices de colores para las casillas del pasaporte",
  },
  {
    en: "Graph paper and a few rulers for the Lab and Build tables",
    es: "Papel cuadriculado y algunas reglas para las mesas de laboratorio y construcción",
  },
  {
    en: "Tape or table stands to hold the signs",
    es: "Cinta o soportes para sostener los letreros",
  },
  { en: "Name tags (first names only)", es: "Etiquetas con el nombre (solo nombre de pila)" },
  {
    en: "Water and a simple snack, if your school allows it",
    es: "Agua y un refrigerio sencillo, si su escuela lo permite",
  },
]);

export const SETUP = Object.freeze([
  {
    when: { en: "A week before", es: "Una semana antes" },
    items: [
      {
        en: "Print the kit and test every QR code with a phone.",
        es: "Imprima el kit y pruebe cada código QR con un teléfono.",
      },
      {
        en: "Open each link once on the school network.",
        es: "Abra cada enlace una vez en la red de la escuela.",
      },
      {
        en: "Ask two or three volunteers, including a Spanish speaker if you can.",
        es: "Invite a dos o tres voluntarios, incluyendo a alguien que hable español si es posible.",
      },
    ],
  },
  {
    when: { en: "The day of", es: "El día del evento" },
    items: [
      {
        en: "Charge and test the devices. Set each to its station's page.",
        es: "Cargue y pruebe los dispositivos. Abra en cada uno la página de su estación.",
      },
      {
        en: "Set six tables with a sign, pencils and scrap paper.",
        es: "Prepare seis mesas con un letrero, lápices y papel borrador.",
      },
      {
        en: "Put passports and stamps near the door.",
        es: "Ponga los pasaportes y los sellos cerca de la puerta.",
      },
      {
        en: "Make the walkway wide enough for strollers and wheelchairs.",
        es: "Deje un pasillo lo bastante ancho para cochecitos y sillas de ruedas.",
      },
    ],
  },
  {
    when: { en: "After the night", es: "Después de la noche" },
    items: [
      { en: "Thank volunteers and families.", es: "Agradezca a los voluntarios y a las familias." },
      {
        en: "Note what worked. Save the kit for next year.",
        es: "Anote lo que funcionó. Guarde el kit para el próximo año.",
      },
    ],
  },
]);

export const VOLUNTEER = Object.freeze({
  heading: { en: "Volunteer script", es: "Guion para voluntarios" },
  lead: {
    en: "You do not need to be a math expert. Your job is to welcome people and ask good questions. Say the lines in your own words.",
    es: "No necesita ser experto en matemáticas. Su trabajo es dar la bienvenida y hacer buenas preguntas. Diga las frases con sus propias palabras.",
  },
  welcome: {
    title: { en: "At the door", es: "En la puerta" },
    lines: [
      {
        en: "“Welcome to Family Math Night! There is a passport for each family.”",
        es: "«¡Bienvenidos a la Noche de Matemáticas en Familia! Hay un pasaporte para cada familia.»",
      },
      {
        en: "“Visit any station in any order. Stamp the passport when you finish one. There are no scores tonight.”",
        es: "«Visiten las estaciones en el orden que quieran. Sellen el pasaporte al terminar una. Esta noche no hay puntajes.»",
      },
      {
        en: "“Please try three or more, and stay as long as you like at the ones you enjoy.”",
        es: "«Prueben tres o más y quédense el tiempo que quieran en las que disfruten.»",
      },
    ],
  },
  station: {
    title: { en: "At a station", es: "En una estación" },
    lines: [
      {
        en: "“Hi! Would you like me to show you where to start?”",
        es: "«¡Hola! ¿Quieren que les muestre por dónde empezar?»",
      },
      {
        en: "Let the student lead. If they are stuck, ask: “What have you tried?” and “What do you notice?”",
        es: "Deje que el estudiante guíe. Si se traba, pregunte: «¿Qué han intentado?» y «¿Qué notan?»",
      },
      {
        en: "Do not give the answer. Point back to the example or the picture on the screen.",
        es: "No dé la respuesta. Remita al ejemplo o al dibujo de la pantalla.",
      },
      {
        en: "Praise effort and thinking: “I like how you explained that.”",
        es: "Elogie el esfuerzo y el razonamiento: «Me gustó cómo explicaron eso.»",
      },
    ],
  },
  closing: {
    title: { en: "At the close", es: "En el cierre" },
    lines: [
      {
        en: "“Thank you for spending your evening with us. What is one thing you noticed tonight?”",
        es: "«Gracias por pasar la noche con nosotros. ¿Qué fue algo que notaron esta noche?»",
      },
      {
        en: "“Your passport has a code for Family Math Studio. You can keep going at home, whenever you like.”",
        es: "«Su pasaporte tiene un código para el Estudio Familiar de Matemáticas. Pueden seguir en casa cuando quieran.»",
      },
    ],
  },
});

export const PASSPORT = Object.freeze({
  title: {
    en: "Family Math Night Passport",
    es: "Pasaporte de la Noche de Matemáticas en Familia",
  },
  lead: {
    en: "Stamp each box when you try a station. There is no right order and no score.",
    es: "Selle cada casilla cuando pruebe una estación. No hay orden correcto ni puntaje.",
  },
  stamp: { en: "Stamp here", es: "Sello aquí" },
  noticed: { en: "We noticed:", es: "Notamos:" },
  home: {
    en: "Keep going at home with Family Math Studio.",
    es: "Sigan en casa con el Estudio Familiar de Matemáticas.",
  },
});

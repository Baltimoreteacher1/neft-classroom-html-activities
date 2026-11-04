// Family Expedition: the one table that drives the tour page (/access-family-tour/) and the guide panel that
// follows families through the lab (access-practice-lab/src/tour-dock.js). Change a stop here and both change.
export const KEY = "ewl-family-expedition-v1";
export const TOUR_PATH = "/access-family-tour/";
export const LAB = "/access-practice-lab";
export const MODES = ["en", "es", "bi"];
export const BANDS = ["3-5", "6-8"];

// One table: the stops of the tour. Each stop is one real part of the lab, what it is for, and how to use it.
// `path` is relative to /access-practice-lab/ ("" is the Practice home). Spanish addresses the family as
// "ustedes" (adult and child together), matching the lab's family pages.
export const STOPS = [
  {
    id: "home",
    color: "#234cda",
    tint: "#e9efff",
    path: "family",
    name: ["Family Corner", "Rincón de la familia"],
    title: ["Start here: your home base.", "Empiecen aquí: su punto de partida."],
    what: [
      "The Family Corner is the front door for families. It is written for adults, in English, Spanish or both.",
      "El Rincón de la familia es la puerta de entrada para las familias. Está escrito para adultos, en inglés, en español o en ambos.",
    ],
    steps: [
      [
        "Choose your language at the top: English, Español, or both together.",
        "Elijan su idioma arriba: English, Español o ambos juntos.",
      ],
      [
        "Scroll down to see a suggested practice, simple tips, and how the lab works.",
        "Bajen para ver una práctica sugerida, consejos sencillos y cómo funciona el laboratorio.",
      ],
      [
        "Open the setup page to say your child’s grade and how many minutes you have.",
        "Abran la página de configuración para indicar el grado de su hijo o hija y cuántos minutos tienen.",
      ],
    ],
    tip: [
      "You do not need an account. Everything is saved on this device.",
      "No necesitan una cuenta. Todo se guarda en este dispositivo.",
    ],
  },
  {
    id: "listening",
    color: "#006c60",
    tint: "#e4f4ec",
    path: "",
    name: ["Today’s mission", "La misión de hoy"],
    title: ["A short practice, picked for you.", "Una práctica corta, elegida para ustedes."],
    what: [
      "The Practice page puts together a short mission for today: a few activities that mix listening, reading, speaking and writing.",
      "La página de Práctica prepara una misión corta para hoy: unas pocas actividades que mezclan escuchar, leer, hablar y escribir.",
    ],
    steps: [
      [
        "Choose how long you have: 5, 10 or 15 minutes.",
        "Elijan cuánto tiempo tienen: 5, 10 o 15 minutos.",
      ],
      [
        "Tap the mission button and do the first activity together.",
        "Toquen el botón de la misión y hagan juntos la primera actividad.",
      ],
      [
        "Unfinished activities and review come first the next time.",
        "Las actividades sin terminar y el repaso van primero la próxima vez.",
      ],
    ],
    tip: [
      "Short practice on many days works better than one long session.",
      "Practicar poco muchos días funciona mejor que una sola sesión larga.",
    ],
  },
  {
    id: "find",
    color: "#9a5700",
    tint: "#fff3d5",
    path: "library",
    name: ["Find an activity", "Buscar una actividad"],
    title: ["Pick the skill you want.", "Elijan la destreza que quieren."],
    what: [
      "Want to work on one skill? Here you can browse activities for Listening, Reading, Speaking and Writing.",
      "¿Quieren practicar una destreza? Aquí pueden ver actividades de Escuchar, Leer, Hablar y Escribir.",
    ],
    steps: [
      [
        "Choose a skill, or search for a topic your child likes.",
        "Elijan una destreza o busquen un tema que le guste a su hijo o hija.",
      ],
      [
        "Open an activity. Look for the supports, like word help or listening again.",
        "Abran una actividad. Busquen las ayudas, como ayuda con palabras o escuchar otra vez.",
      ],
      [
        "Check the answer and read the feedback together.",
        "Revisen la respuesta y lean juntos los comentarios.",
      ],
    ],
    tip: [
      "Start with one that feels comfortable. Success builds confidence.",
      "Empiecen con una que se sienta cómoda. El éxito da confianza.",
    ],
  },
  {
    id: "help",
    color: "#b13f31",
    tint: "#ffebe6",
    path: "family/help",
    name: ["Help My Child", "Ayuda para mi hijo o hija"],
    title: ["Help without giving the answer.", "Ayuden sin dar la respuesta."],
    what: [
      "A short guide for adults: how to support practice at home, even if English is not your strongest language.",
      "Una guía corta para adultos: cómo apoyar la práctica en casa, aunque el inglés no sea su idioma más fuerte.",
    ],
    steps: [
      [
        "Read the first few tips. Each one is short.",
        "Lean los primeros consejos. Cada uno es corto.",
      ],
      [
        "Pick one idea to try the next time your child practices.",
        "Elijan una idea para probar la próxima vez que su hijo o hija practique.",
      ],
      [
        "Come back here whenever you feel stuck.",
        "Vuelvan aquí cuando no sepan qué hacer.",
      ],
    ],
    tip: [
      "You can help in any language. Talking about the idea in your home language is welcome.",
      "Pueden ayudar en cualquier idioma. Hablar de la idea en su idioma es bienvenido.",
    ],
  },
  {
    id: "passport",
    color: "#2d5a9e",
    tint: "#e9f0fb",
    path: "passport",
    name: ["My Passport", "Pasaporte"],
    title: ["See what has been practiced.", "Vean lo que han practicado."],
    what: [
      "My Passport keeps a record of practice, like stamps in a travel book. It also has a paper passport you can print.",
      "El Pasaporte guarda un registro de la práctica, como sellos en un libro de viaje. También tiene un pasaporte en papel que pueden imprimir.",
    ],
    steps: [
      [
        "Open it to see the practice done so far.",
        "Ábranlo para ver la práctica hecha hasta ahora.",
      ],
      [
        "Look at the next suggested step and celebrate what is finished.",
        "Miren el siguiente paso sugerido y celebren lo que ya terminaron.",
      ],
      [
        "Look for the paper passport menu if you like to print.",
        "Busquen el menú del pasaporte en papel si les gusta imprimir.",
      ],
    ],
    tip: [
      "Progress is saved on this device. Use the same phone or computer each time.",
      "El avance se guarda en este dispositivo. Usen el mismo teléfono o computadora cada vez.",
    ],
  },
  {
    id: "trip",
    color: "#7a4a00",
    tint: "#fdf0d8",
    path: "family/trip",
    name: ["Family Trip", "Viaje familiar"],
    title: ["A longer practice for the weekend.", "Una práctica más larga para el fin de semana."],
    what: [
      "The Family Trip is a guided route of six stops. It is for a day when you have more time to sit together.",
      "El Viaje familiar es una ruta guiada de seis paradas. Es para un día en que tengan más tiempo para sentarse juntos.",
    ],
    steps: [
      [
        "Pick a skill, or use the one the lab suggests.",
        "Elijan una destreza o usen la que sugiere el laboratorio.",
      ],
      [
        "Follow the stops in order.",
        "Sigan las paradas en orden.",
      ],
      [
        "Stop any time. The trip remembers where you were.",
        "Paren cuando quieran. El viaje recuerda dónde se quedaron.",
      ],
    ],
    tip: [
      "A trip can take several days. There is no rush.",
      "Un viaje puede durar varios días. No hay prisa.",
    ],
  },
  {
    id: "save",
    color: "#17324d",
    tint: "#e8eef4",
    path: "family/save",
    name: ["Save & Continue Later", "Guardar y continuar después"],
    title: ["Keep your work safe.", "Mantengan su trabajo seguro."],
    what: [
      "Your work is saved on this device. A backup code lets you keep it safe or move it to another phone or computer.",
      "Su trabajo se guarda en este dispositivo. Un código de respaldo les permite protegerlo o llevarlo a otro teléfono o computadora.",
    ],
    steps: [
      [
        "Open the page and read where your work is saved.",
        "Abran la página y lean dónde se guarda su trabajo.",
      ],
      [
        "Copy or download your backup code and keep it somewhere safe.",
        "Copien o descarguen su código de respaldo y guárdenlo en un lugar seguro.",
      ],
      [
        "On a new device, paste the code to bring your work back.",
        "En un dispositivo nuevo, peguen el código para recuperar su trabajo.",
      ],
    ],
    tip: [
      "Voice recordings are not saved. They disappear when the page closes.",
      "Las grabaciones de voz no se guardan. Desaparecen al cerrar la página.",
    ],
  },
  // ── Learning Journey sequence (added after the original seven stops, so saved progress by stop number is unchanged) ──
  // Six stops that follow the ACCESS Learning Journey: grade band, first mission, the six-step cycle, progress, supporting a
  // revision, and continuing at home. `path` may carry its own query (family?mission=m01); stopUrl adds the rest.
  {
    id: "lj-grade",
    color: "#264e48",
    tint: "#e3efe4",
    path: "journey",
    name: ["Journey: choose a grade", "Recorrido: elijan el grado"],
    title: ["Start with the right grade band.", "Empiecen con el grupo de grados correcto."],
    what: [
      "The Learning Journey is a path of 12 missions, each with six steps. Choose Grades 3–5 or Grades 6–8 first, so the language and the tasks fit your child.",
      "El Recorrido de aprendizaje es un camino de 12 misiones, cada una con seis pasos. Primero elijan Grados 3–5 o Grados 6–8, para que el lenguaje y las tareas se ajusten a su hijo o hija.",
    ],
    steps: [
      [
        "Open the Journey page and find the grade switch near the top.",
        "Abran la página del Recorrido y busquen el selector de grados cerca de la parte de arriba.",
      ],
      [
        "Tap the grade band that matches your child.",
        "Toquen el grupo de grados que corresponde a su hijo o hija.",
      ],
      [
        "Read the one next step the Journey suggests. There is always one.",
        "Lean el siguiente paso que sugiere el Recorrido. Siempre hay uno.",
      ],
    ],
    tip: [
      "You can change the grade band at any time. Each band keeps its own place.",
      "Pueden cambiar el grupo de grados cuando quieran. Cada grupo guarda su propio avance.",
    ],
  },
  {
    id: "lj-begin",
    color: "#264e48",
    tint: "#e3efe4",
    path: "journey/m01",
    name: ["Journey: begin a mission", "Recorrido: empiecen una misión"],
    title: ["Open a mission together.", "Abran una misión juntos."],
    what: [
      "Each mission page tells you the goal in plain words, the six steps, and the kind of language your child will practice. Mission 1 is My World, My Story.",
      "Cada página de misión dice la meta en palabras sencillas, los seis pasos y el tipo de lenguaje que practicará su hijo o hija. La misión 1 es Mi mundo, mi historia.",
    ],
    steps: [
      [
        "Read the goal at the top of the mission.",
        "Lean la meta que aparece arriba en la misión.",
      ],
      [
        "Look at the six steps and see where your child is.",
        "Miren los seis pasos y vean en cuál va su hijo o hija.",
      ],
      [
        "Press the button to begin the first step, or to pick up where you left off.",
        "Toquen el botón para empezar el primer paso o para continuar donde se quedaron.",
      ],
    ],
    tip: [
      "Nothing is graded. A step is never blocked, and there is always a next step.",
      "Nada se califica. Ningún paso se bloquea y siempre hay un siguiente paso.",
    ],
  },
  {
    id: "lj-cycle",
    color: "#264e48",
    tint: "#e3efe4",
    path: "journey/m01/discover",
    name: ["Journey: the six steps", "Recorrido: los seis pasos"],
    title: ["Discover, understand, build, communicate, improve, show.", "Descubrir, comprender, construir, comunicar, mejorar y mostrar."],
    what: [
      "Every mission follows the same six steps. Your child looks into a real situation, listens and reads, builds sentences, says or writes an answer, improves it, and then tries a new task alone.",
      "Cada misión sigue los mismos seis pasos. Su hijo o hija investiga una situación real, escucha y lee, construye oraciones, dice o escribe una respuesta, la mejora y luego prueba una tarea nueva por su cuenta.",
    ],
    steps: [
      [
        "Open the first step, Discover, and look around the scene together.",
        "Abran el primer paso, Descubre, y miren juntos la escena.",
      ],
      [
        "Let your child lead. Ask what they notice before you explain anything.",
        "Dejen que su hijo o hija lleve la iniciativa. Pregunten qué nota antes de explicar algo.",
      ],
      [
        "Each step takes about 8 to 12 minutes. Stop at any step and come back later.",
        "Cada paso toma entre 8 y 12 minutos. Pueden parar en cualquier paso y volver más tarde.",
      ],
    ],
    tip: [
      "Help is there when your child needs it. Using help is fine, and the Journey records it honestly.",
      "La ayuda está ahí cuando su hijo o hija la necesite. Usar ayuda está bien, y el Recorrido lo registra con honestidad.",
    ],
  },
  {
    id: "lj-progress",
    color: "#264e48",
    tint: "#e3efe4",
    path: "journey/map",
    name: ["Journey: understand progress", "Recorrido: entiendan el progreso"],
    title: ["See the whole path.", "Vean todo el camino."],
    what: [
      "The map shows four units and twelve missions, with the steps finished in each. It shows what has been practiced, not a score or a level.",
      "El mapa muestra cuatro unidades y doce misiones, con los pasos terminados en cada una. Muestra lo que se ha practicado, no una puntuación ni un nivel.",
    ],
    steps: [
      [
        "Open the map and find the mission your child is on.",
        "Abran el mapa y busquen la misión en la que va su hijo o hija.",
      ],
      [
        "Notice which steps were done with help and which were done alone.",
        "Fíjense en qué pasos se hicieron con ayuda y cuáles sin ayuda.",
      ],
      [
        "Celebrate the finished steps, then choose the next one together.",
        "Celebren los pasos terminados y elijan juntos el siguiente.",
      ],
    ],
    tip: [
      "Progress is saved on this device only. Use the same phone or computer each time.",
      "El progreso se guarda solo en este dispositivo. Usen el mismo teléfono o computadora cada vez.",
    ],
  },
  {
    id: "lj-revise",
    color: "#264e48",
    tint: "#e3efe4",
    path: "journey/m01/improve",
    name: ["Journey: support a revision", "Recorrido: apoyen una revisión"],
    title: ["Help your child make it stronger.", "Ayuden a su hijo o hija a mejorarlo."],
    what: [
      "In the Improve step your child changes one thing in their own answer and sees what changed. You can help by asking a question, not by giving the answer.",
      "En el paso Mejora, su hijo o hija cambia una cosa en su propia respuesta y ve qué cambió. Ustedes pueden ayudar con una pregunta, no dando la respuesta.",
    ],
    steps: [
      [
        "Ask: “What is one more detail that would help me understand?”",
        "Pregunten: «¿Qué otro detalle me ayudaría a entender?»",
      ],
      [
        "Wait. Let your child decide what to add.",
        "Esperen. Dejen que su hijo o hija decida qué añadir.",
      ],
      [
        "Ask why the change helps. Any reason in any language is a good start.",
        "Pregunten por qué ayuda el cambio. Cualquier razón, en cualquier idioma, es un buen comienzo.",
      ],
    ],
    tip: [
      "Praise the effort of revising. A second try is how writing and speaking get stronger.",
      "Elogien el esfuerzo de revisar. Un segundo intento es como se fortalecen la escritura y el habla.",
    ],
  },
  {
    id: "lj-home",
    color: "#264e48",
    tint: "#e3efe4",
    path: "family?mission=m01",
    name: ["Journey: continue at home", "Recorrido: sigan en casa"],
    title: ["Five minutes at the kitchen table.", "Cinco minutos en la mesa."],
    what: [
      "Every mission has a Family Companion: a short activity, one question to talk about, and sentence starters. It needs no materials or screens, and you can use any language you share.",
      "Cada misión tiene una guía familiar: una actividad corta, una pregunta para conversar e inicios de oración. No necesita materiales ni pantallas, y pueden usar cualquier idioma que compartan.",
    ],
    steps: [
      [
        "Open the companion for your child’s mission and pick the grade band.",
        "Abran la guía de la misión de su hijo o hija y elijan el grupo de grados.",
      ],
      [
        "Try the five-minute activity and ask the one question.",
        "Prueben la actividad de cinco minutos y hagan la pregunta.",
      ],
      [
        "Press “Print this companion” if you would like a paper copy for the fridge.",
        "Toquen «Imprimir esta guía» si quieren una copia en papel para el refri.",
      ],
    ],
    tip: [
      "You do not need to speak English at home. Talking about the ideas in any language helps.",
      "No necesitan hablar inglés en casa. Hablar de las ideas en cualquier idioma ayuda.",
    ],
  },
];

export const TOTAL = STOPS.length;

export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// Language: 'en' English only, 'es' Spanish only, 'bi' English with Spanish beneath.
export const modeOf = (lang) => (MODES.includes(lang) ? lang : "en");
export const tr = (lang, [e, s]) => {
  const m = modeOf(lang);
  return m === "en" ? esc(e) : m === "es" ? esc(s) : `${esc(e)}<span class="es" lang="es">${esc(s)}</span>`;
};
export const trText = (lang, [e, s]) => {
  const m = modeOf(lang);
  return m === "en" ? e : m === "es" ? s : `${e} / ${s}`;
};

/** Link into the lab for stop `i`. `tour=i` tells the lab to show the guide panel. */
export const stopUrl = (i, band) =>
  `${LAB}/${STOPS[i].path}${STOPS[i].path.includes("?") ? "&" : "?"}grades=${BANDS.includes(band) ? band : "3-5"}&tour=${i}`;

/** The saved tour, validated, or null when no grade has been chosen yet. */
export function loadState() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {}
  if (!raw || !BANDS.includes(raw.band)) return null;
  const inRange = (i) => Number.isInteger(i) && i >= 0 && i < TOTAL;
  return {
    lang: MODES.includes(raw.lang) ? raw.lang : "",
    band: raw.band,
    stop: inRange(raw.stop) ? raw.stop : 0,
    done: Array.isArray(raw.done) ? [...new Set(raw.done.filter(inRange))] : [],
    view: raw.view === "end" || raw.view === "map" ? raw.view : "stop",
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

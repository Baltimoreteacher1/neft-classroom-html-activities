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
  `${LAB}/${STOPS[i].path}?grades=${BANDS.includes(band) ? band : "3-5"}&tour=${i}`;

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
    view: raw.view === "end" ? "end" : "stop",
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

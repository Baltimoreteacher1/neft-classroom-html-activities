// Every word the Learning Supports show a student, in English and in Spanish.
// English leads and Spanish sits beneath it, written the way a Spanish speaker
// would say it rather than word for word.
//
// `{name}` marks a number or word filled in at runtime.

/** @typedef {{ en: string, es: string }} Line */

/** @type {Record<string, Line>} */
export const STRINGS = {
  // Panel
  panelButton: { en: "Learning supports", es: "Apoyos para aprender" },
  panelTitle: { en: "Learning supports", es: "Apoyos para aprender" },
  panelNote: {
    en: "These choices stay on this device. Nobody else sees them.",
    es: "Estas opciones se quedan en este dispositivo. Nadie más las ve.",
  },
  close: { en: "Close", es: "Cerrar" },
  reset: { en: "Turn everything off", es: "Apagar todo" },
  resetDone: { en: "All supports are off.", es: "Todos los apoyos están apagados." },

  // Read aloud
  readTitle: { en: "Read aloud", es: "Leer en voz alta" },
  readPage: { en: "Read this page", es: "Leer esta página" },
  readHint: {
    en: "Select some text first to hear just that part. Press Alt+R to start or stop.",
    es: "Selecciona un texto primero para oír solo esa parte. Oprime Alt+R para empezar o parar.",
  },
  stop: { en: "Stop reading", es: "Dejar de leer" },
  readEmpty: { en: "There is no text to read here.", es: "No hay texto para leer aquí." },
  readUnsupported: {
    en: "This browser cannot read aloud.",
    es: "Este navegador no puede leer en voz alta.",
  },
  readStarted: { en: "Reading. Press Stop to end.", es: "Leyendo. Oprime Detener para terminar." },
  readStopped: { en: "Stopped reading.", es: "Lectura detenida." },
  readLang: { en: "Read in", es: "Leer en" },
  langAuto: { en: "My page language", es: "El idioma de mi página" },
  langEn: { en: "English", es: "Inglés" },
  langEs: { en: "Spanish", es: "Español" },
  speed: { en: "Speed", es: "Velocidad" },
  speedSlow: { en: "Slow", es: "Lenta" },
  speedNormal: { en: "Normal", es: "Normal" },
  speedFast: { en: "Fast", es: "Rápida" },
  voiceEn: { en: "English voice", es: "Voz en inglés" },
  voiceEs: { en: "Spanish voice", es: "Voz en español" },
  voiceAuto: { en: "Automatic", es: "Automática" },
  offline: {
    en: "Only voices saved on this device (works with no internet)",
    es: "Solo voces guardadas en este dispositivo (funciona sin internet)",
  },

  // Voice answers
  voiceAnswer: { en: "Say my answers", es: "Decir mis respuestas" },
  voiceAnswerHint: {
    en: "Shows a microphone button on answer boxes. Your browser's speech service listens only while you press it, and it may send your voice over the internet. You can always type instead.",
    es: "Muestra un botón de micrófono en las casillas de respuesta. El servicio de voz de tu navegador escucha solo mientras lo oprimes y puede enviar tu voz por internet. Siempre puedes escribir.",
  },
  voiceUnsupported: {
    en: "Saying answers is not available in this browser. Typing works everywhere.",
    es: "Decir respuestas no está disponible en este navegador. Escribir funciona en todas partes.",
  },
  sayIt: { en: "Say it", es: "Dilo" },
  sayItLabel: { en: "Say your answer", es: "Di tu respuesta" },
  listening: { en: "Listening…", es: "Escuchando…" },
  heard: { en: "I heard: {text}", es: "Escuché: {text}" },
  heardNothing: {
    en: "I did not hear an answer. Try again or type it.",
    es: "No escuché una respuesta. Inténtalo otra vez o escríbela.",
  },
  notThisBox: {
    en: "I heard {text}, but this box only takes a plain number. Type it instead.",
    es: "Escuché {text}, pero esta casilla solo acepta un número sencillo. Escríbelo.",
  },
  micDenied: {
    en: "The microphone is off. You can type your answer.",
    es: "El micrófono está apagado. Puedes escribir tu respuesta.",
  },
  micError: {
    en: "That did not work. You can type your answer.",
    es: "Eso no funcionó. Puedes escribir tu respuesta.",
  },

  // Look and feel
  lookTitle: { en: "Look and feel", es: "Aspecto y comodidad" },
  calm: { en: "Calm mode", es: "Modo tranquilo" },
  calmHint: {
    en: "No motion, no sounds, no celebrations.",
    es: "Sin movimiento, sin sonidos, sin celebraciones.",
  },
  focus: { en: "One problem at a time", es: "Un problema a la vez" },
  focusHint: {
    en: "Shows a single problem and hides the rest until you are ready.",
    es: "Muestra un solo problema y oculta los demás hasta que estés listo.",
  },
  spacing: { en: "Easy-read spacing", es: "Espaciado fácil de leer" },
  spacingHint: {
    en: "More space between letters, words, and lines.",
    es: "Más espacio entre letras, palabras y líneas.",
  },
  contrast: { en: "High contrast", es: "Contraste alto" },
  contrastHint: {
    en: "Dark text on a plain light page.",
    es: "Texto oscuro sobre una página clara y sencilla.",
  },
  targets: { en: "Larger buttons", es: "Botones más grandes" },
  targetsHint: {
    en: "Bigger buttons and answer boxes that are easier to tap.",
    es: "Botones y casillas más grandes, más fáciles de tocar.",
  },

  // One problem at a time
  focusBar: { en: "Problem {n} of {total}", es: "Problema {n} de {total}" },
  focusBack: { en: "Back", es: "Atrás" },
  focusNext: { en: "Next", es: "Siguiente" },
  focusNav: { en: "One problem at a time", es: "Un problema a la vez" },
  focusShowing: {
    en: "Showing problem {n} of {total}.",
    es: "Mostrando el problema {n} de {total}.",
  },
};

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 * @returns {Line}
 */
export function line(key, vars = {}) {
  const entry = STRINGS[key];
  if (!entry) throw new Error(`Unknown learning-support string: ${key}`);
  const fill = (/** @type {string} */ s) =>
    s.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k] ?? ""));
  return { en: fill(entry.en), es: fill(entry.es) };
}

// Interface text for downloaded activities, English and Spanish (tú for students, ustedes for adults). Activity
// content is never translated here: it stays in its authored language and is marked lang="en" by the writers.
import { makeI18n } from "../i18n.js";

export const LABELS = {
  name: ["Name", "Nombre"],
  date: ["Date", "Fecha"],
  directions: ["Directions", "Instrucciones"],
  directionsEs: ["Directions in Spanish", "Instrucciones en español"],
  readAloud: ["For the adult to read aloud", "Para que un adulto lo lea en voz alta"],
  audioFirst: [
    "For the adult: read the directions and the question aloud. The child can answer by pointing, saying a word or drawing.",
    "Para el adulto: lean en voz alta las instrucciones y la pregunta. El niño o la niña puede responder señalando, diciendo una palabra o dibujando.",
  ],
  listenScript: ["Listening script", "Guion para escuchar"],
  read: ["Read", "Lee"],
  question: ["Question", "Pregunta"],
  chooseOne: [
    "Fill in the circle next to one answer.",
    "Rellena el círculo junto a una respuesta.",
  ],
  chooseAll: [
    "Check every correct answer. More than one is correct.",
    "Marca todas las respuestas correctas. Hay más de una.",
  ],
  sortHow: [
    "Circle the group each one belongs in.",
    "Encierra en un círculo el grupo de cada una.",
  ],
  orderHow: [
    "Number the steps in order. Write 1 next to the first step.",
    "Numera los pasos en orden. Escribe 1 junto al primer paso.",
  ],
  clozeHow: ["Write the word that fits each blank.", "Escribe la palabra que va en cada espacio."],
  choicesFor: ["Choices for blank", "Opciones para el espacio"],
  hotHow: [
    "Check the sentence or sentences that answer the question.",
    "Marca la oración o las oraciones que responden la pregunta.",
  ],
  yourAnswer: ["Your answer", "Tu respuesta"],
  planning: ["Planning notes", "Notas para planear"],
  sayAloud: [
    "Then say your answer aloud to a partner or an adult.",
    "Luego di tu respuesta en voz alta a un compañero o a un adulto.",
  ],
  include: ["What to include", "Qué incluir"],
  checkWork: ["Check your work", "Revisa tu trabajo"],
  help: ["Optional help", "Ayuda opcional"],
  helpNote: ["Use these only if you need them.", "Úsalas solo si las necesitas."],
  frames: ["Sentence starters", "Inicios de oración"],
  wordBank: ["Word bank", "Banco de palabras"],
  words: ["Words to know", "Palabras para saber"],
  hint: ["Hint", "Pista"],
  listenFor: ["Listen for", "Escucha para encontrar"],
  readFor: ["Read for", "Lee para encontrar"],
  picture: ["Picture", "Imagen"],
  online: ["Do this activity online", "Haz esta actividad en línea"],
  scan: ["Scan to open the activity online", "Escanea para abrir la actividad en línea"],
  honest: [
    "Practice only. This is not a test score or a level.",
    "Solo práctica. No es una calificación ni un nivel de examen.",
  ],
  support: ["Support", "Apoyo"],
  words70: ["Write about {n} words.", "Escribe unas {n} palabras."],
  wordsRange: ["Write {a} to {b} words.", "Escribe de {a} a {b} palabras."],
  scenario: ["The situation", "La situación"],
  task: ["Your task", "Tu tarea"],
  sources: ["Sources", "Fuentes"],
  recording: [
    "Recording script: read it aloud, or play it online",
    "Guion de la grabación: léanlo en voz alta o escúchalo en línea",
  ],
  organizer: ["Plan with the organizer", "Planea con el organizador"],
  speakTime: ["Speak for about {a} to {b} seconds.", "Habla de {a} a {b} segundos más o menos."],
  revise: ["Revise", "Revisa"],
  conversation: ["Your partner says", "Tu compañero dice"],
  yourReply: ["Your reply", "Tu respuesta"],
  mission: ["Mission handout", "Hoja de la misión"],
  places: ["Places on the map", "Lugares del mapa"],
  people: ["People to talk to", "Personas con quienes hablar"],
  evidence: ["Evidence to find", "Evidencia que buscar"],
  explanations: ["Possible explanations", "Explicaciones posibles"],
  tasks: ["Tasks", "Tareas"],
  notes: ["My notes", "Mis notas"],
  wants: ["Wants", "Quiere"],
  compareHow: [
    "Compare these two pieces of evidence. Do they agree or conflict? Why?",
    "Compara estas dos evidencias. ¿Están de acuerdo o se contradicen? ¿Por qué?",
  ],
  decideHow: [
    "Choose one, then name the evidence that supports it.",
    "Elige una opción y nombra la evidencia que la apoya.",
  ],
  speakHow: ["Plan here, then say it aloud.", "Planea aquí y luego dilo en voz alta."],
  minWords: ["Use at least {n} words.", "Usa al menos {n} palabras."],
  kind: {
    audio: ["Audio message", "Mensaje de audio"],
    document: ["Document", "Documento"],
    object: ["Object", "Objeto"],
    testimony: ["Testimony", "Testimonio"],
    data: ["Data", "Datos"],
  },
};

/** The interface strings for one language mode ("en" | "es" | "bi"): t(key, vars) → plain text. */
export function labelsFor(lang = "en") {
  const I = makeI18n(["en", "es", "bi"].includes(lang) ? lang : "en");
  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  const t = (key, vars = {}) => {
    const pair = key.split(".").reduce((o, k) => o?.[k], LABELS);
    if (!Array.isArray(pair)) throw new Error(`download label "${key}" is missing`);
    return I.S(fill(pair[0], vars), fill(pair[1], vars));
  };
  return { t, S: I.S, mode: I.mode };
}

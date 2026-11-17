// Book Studio self-check rubrics: four "I can" statements per key language use (WIDA ELD Standard 2) for each band
// program in src/book/programs.js. Learners see the rubric for their book's purpose in the Finish dialog and tick what
// their book does; ticks are saved on the book (`selfCheck`) and are reminders, never a score. Pure data.
import { programFor } from "./programs.js";

const R35 = {
  Narrate: [
    [
      "n-hook",
      "My beginning makes the reader want to keep going.",
      "Mi comienzo hace que el lector quiera seguir.",
    ],
    [
      "n-order",
      "My events are in order, with words like first, next and finally.",
      "Mis sucesos están en orden, con palabras como primero, después y por último.",
    ],
    [
      "n-detail",
      "I show feelings and details with words and pictures.",
      "Muestro sentimientos y detalles con palabras e imágenes.",
    ],
    [
      "n-end",
      "My ending tells how it worked out or what I learned.",
      "Mi final cuenta cómo terminó o qué aprendí.",
    ],
  ],
  Inform: [
    [
      "i-topic",
      "I tell the reader my topic on the first page.",
      "Le digo al lector mi tema en la primera página.",
    ],
    [
      "i-facts",
      "Each page teaches one fact with a detail or example.",
      "Cada página enseña un dato con un detalle o ejemplo.",
    ],
    ["i-words", "I use and explain topic words.", "Uso y explico palabras del tema."],
    [
      "i-visual",
      "My pictures or labels help the reader understand.",
      "Mis imágenes o rótulos ayudan al lector a entender.",
    ],
  ],
  Explain: [
    ["e-what", "I say what I am explaining.", "Digo qué estoy explicando."],
    [
      "e-steps",
      "My steps or reasons are in an order that makes sense.",
      "Mis pasos o razones están en un orden que tiene sentido.",
    ],
    [
      "e-link",
      "I use linking words like because, so and then.",
      "Uso palabras de enlace como porque, así que y luego.",
    ],
    [
      "e-show",
      "A picture, diagram or example shows how it works.",
      "Una imagen, un diagrama o un ejemplo muestra cómo funciona.",
    ],
  ],
  Argue: [
    ["a-claim", "I state my opinion clearly.", "Digo mi opinión con claridad."],
    ["a-reasons", "I give at least two reasons.", "Doy por lo menos dos razones."],
    ["a-support", "Each reason has a fact or example.", "Cada razón tiene un dato o un ejemplo."],
    [
      "a-close",
      "My ending says my opinion again and asks the reader to act.",
      "Mi final repite mi opinión y le pide algo al lector.",
    ],
  ],
};

const R68 = {
  Narrate: [
    [
      "n-lead",
      "My lead drops the reader into a scene or a question.",
      "Mi comienzo pone al lector en una escena o una pregunta.",
    ],
    [
      "n-pace",
      "I slow down the key moment with dialogue and detail.",
      "Hago más lento el momento clave con diálogo y detalles.",
    ],
    [
      "n-trans",
      "Transitions show shifts in time and place.",
      "Las transiciones muestran cambios de tiempo y lugar.",
    ],
    [
      "n-theme",
      "My ending reflects on what the events mean.",
      "Mi final reflexiona sobre lo que significan los sucesos.",
    ],
  ],
  Inform: [
    [
      "i-focus",
      "I introduce the topic and preview how the book is organized.",
      "Presento el tema y anticipo cómo está organizado el libro.",
    ],
    [
      "i-evidence",
      "I develop each section with facts, definitions and examples from sources.",
      "Desarrollo cada sección con datos, definiciones y ejemplos de fuentes.",
    ],
    [
      "i-precise",
      "I use precise, academic vocabulary for the topic.",
      "Uso vocabulario preciso y académico del tema.",
    ],
    [
      "i-features",
      "Headings, captions or diagrams make the information easy to find.",
      "Los títulos, pies de foto o diagramas hacen fácil encontrar la información.",
    ],
  ],
  Explain: [
    [
      "e-question",
      "I state the question or process I am explaining.",
      "Planteo la pregunta o el proceso que explico.",
    ],
    [
      "e-cause",
      "I connect causes and effects or steps with precise transitions.",
      "Conecto causas y efectos o pasos con transiciones precisas.",
    ],
    [
      "e-data",
      "I use data, observations or examples as evidence.",
      "Uso datos, observaciones o ejemplos como evidencia.",
    ],
    [
      "e-conclude",
      "My conclusion explains why it matters.",
      "Mi conclusión explica por qué es importante.",
    ],
  ],
  Argue: [
    ["a-claim", "I state a precise claim.", "Planteo una afirmación precisa."],
    [
      "a-evidence",
      "I support it with relevant evidence from credible sources and say where it came from.",
      "La apoyo con evidencia relevante de fuentes confiables y digo de dónde viene.",
    ],
    [
      "a-counter",
      "I acknowledge a counterclaim and respond to it.",
      "Reconozco un contraargumento y le respondo.",
    ],
    [
      "a-close",
      "My conclusion follows from the argument.",
      "Mi conclusión se desprende del argumento.",
    ],
  ],
};

const RK2 = [
  ["k-pic", "Every page has a picture.", "Cada página tiene un dibujo."],
  [
    "k-words",
    "I wrote a word, label or sentence on my pages.",
    "Escribí una palabra, un rótulo o una oración en mis páginas.",
  ],
  ["k-tell", "I can tell my book out loud.", "Puedo contar mi libro en voz alta."],
  ["k-end", "My book has a beginning and an end.", "Mi libro tiene un comienzo y un final."],
];

const BY_PROGRAM = { "3-5": R35, "6-8": R68 };
const shape = ([id, en, es]) => ({ id, en, es });

/** The self-check for a book: its band program's rubric for the book's key language use (Narrate when unknown). */
export function rubricFor(band, purpose) {
  const program = programFor(band);
  if (program.band === "K-2") return RK2.map(shape);
  const set = BY_PROGRAM[program.band];
  return (set[purpose] || set.Narrate).map(shape);
}

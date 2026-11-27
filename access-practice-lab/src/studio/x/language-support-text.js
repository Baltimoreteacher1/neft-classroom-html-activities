// Wording for the Academic Language Support Builder. Original, short, grammatical English and Spanish (the Spanish is
// not reviewed by a native speaker). Every template is data: `{name}` marks a value filled from the activity's own
// context (a vocabulary word, the math topic, a sentence of its reading) and `___` marks a blank the STUDENT fills.
// tools/studio-x-language.test.mjs checks that English and Spanish agree on both counts for every template, so a frame
// can never lose a blank or print a stray placeholder in one language.
//
// Nothing here names a math topic or a content word: topic language comes only from the activity (see
// language-support.js), so an activity with no known topic gets structure-only wording.

import { FRAME_BANK } from "../core/differentiate-frames.js";

/** A pair of strings, English and Spanish. */
const P = (en, es) => ({ en, es });

/** Spanish for each family in the engine's own frame bank (the English text is the engine's, so there is one source). */
const FRAME_ES = {
  narrate: "Primero, ___. Luego, ___. Por último, ___.",
  inform: "___ es ___. Un dato es ___. Otro dato es ___.",
  explain: "Sé que ___ porque ___. Esto muestra ___.",
  argue: "Pienso que ___ porque ___. Una razón es ___.",
  evidence: "El texto dice ___. Esto muestra ___.",
  math: "Primero ___. Luego ___. Entonces la respuesta es ___.",
  error: "El error está en el paso ___. Una mejor manera es ___.",
  retell: "El texto trata de ___. Un detalle es ___. Esto muestra ___.",
  choose: "Elijo ___ porque ___.",
};

/** The full frame of one family, in both languages. */
export const frameOf = (key) => P(FRAME_BANK[key].full, FRAME_ES[key]);
export const FRAME_KEYS = Object.freeze(Object.keys(FRAME_ES));

export const QUOTES = { en: ["“", "”"], es: ["«", "»"] };

/** Wording per option. `head` is the bold first line of a block; `line*` entries are the body. */
export const TEXT = {
  objective: {
    head: P("Language goal", "Meta de lenguaje"),
    withWords: P(
      "I can talk about this topic using these words: {words}.",
      "Puedo hablar de este tema con estas palabras: {words}.",
    ),
    noWords: P(
      "I can explain my thinking in words.",
      "Puedo explicar mi pensamiento con palabras.",
    ),
    topic: P("Topic: {topic}.", "Tema: {topic}."),
  },
  frames: {
    head: P("Sentence frames", "Marcos de oraciones"),
    intro: P(
      "Use a frame to start your answer. Fill in each ___.",
      "Usa un marco para empezar tu respuesta. Completa cada ___.",
    ),
  },
  bbs: {
    head: P("Because, but, so", "Porque, pero, así que"),
    intro: P("Finish each sentence.", "Termina cada oración."),
    topic: P("Topic: {topic}.", "Tema: {topic}."),
    thisTopic: P("this topic", "este tema"),
    one: P("I need to know {s} because ___.", "Necesito saber {s} porque ___."),
    two: P("I am still learning {s}, but ___.", "Todavía estoy aprendiendo {s}, pero ___."),
    three: P("I know {s}, so ___.", "Conozco {s}, así que ___."),
  },
  expand: {
    prompt: P(
      "Make this sentence longer: {kernel}\nAdd who, what, where, when or why. Then use because, but or so.",
      "Alarga esta oración: {kernel}\nAgrega quién, qué, dónde, cuándo o por qué. Luego usa porque, pero o así que.",
    ),
    frame: P("{kernel}, because ___.", "{kernel}, porque ___."),
    hint: P(
      "Start with the sentence. Add one more detail.",
      "Empieza con la oración. Agrega un detalle más.",
    ),
  },
  oral: {
    head: P("Say it first", "Dilo primero"),
    one: P(
      "1. Tell a partner your answer out loud.",
      "1. Dile tu respuesta a tu compañero en voz alta.",
    ),
    two: P("2. Your partner says: I heard you say ___.", "2. Tu compañero dice: Te oí decir ___."),
    three: P("3. Then write your answer.", "3. Luego escribe tu respuesta."),
  },
  discuss: {
    head: P("Talk about it", "Hablemos de esto"),
    intro: P("Talk with a partner.", "Habla con un compañero."),
    explain: P(
      "How would you explain {s} in your own words?",
      "¿Cómo explicarías {s} con tus propias palabras?",
    ),
    where: P("Where do you see {s} in this activity?", "¿Dónde ves {s} en esta actividad?"),
    link: P("How is {s2} connected to {s}?", "¿Cómo se conecta {s2} con {s}?"),
    ask: P("What is one question you still have?", "¿Qué pregunta todavía tienes?"),
    thisTopic: P("this topic", "este tema"),
  },
  compare: {
    alike: P("{a} and {b} are alike because ___.", "{a} y {b} se parecen porque ___."),
    different: P(
      "{a} is different from {b} because ___.",
      "{a} es diferente de {b} porque ___.",
    ),
  },
  cer: {
    claim: P("Claim: I think ___.", "Afirmación: Pienso que ___."),
    evidenceText: P("Evidence: The text says ___.", "Evidencia: El texto dice ___."),
    evidenceOwn: P("Evidence: I know this because ___.", "Evidencia: Lo sé porque ___."),
    reasoning: P(
      "Reasoning: This shows ___ because ___.",
      "Razonamiento: Esto muestra ___ porque ___.",
    ),
  },
  paragraph: {
    topic: P(
      "Topic sentence: My main idea is ___.",
      "Oración principal: Mi idea principal es ___.",
    ),
    one: P("Detail 1: One detail is ___.", "Detalle 1: Un detalle es ___."),
    two: P("Detail 2: Another detail is ___.", "Detalle 2: Otro detalle es ___."),
    close: P("Closing sentence: In conclusion, ___.", "Oración final: En conclusión, ___."),
  },
  explainTask: {
    prompt: P(
      "Pick one answer you gave in this activity. Explain how you know it is right.",
      "Elige una respuesta que diste en esta actividad. Explica cómo sabes que es correcta.",
    ),
    useWord: P("Use the word {s}.", "Usa la palabra {s}."),
    hint: P("Say it out loud first, then write it.", "Dilo primero en voz alta y luego escríbelo."),
  },
  revise: {
    head: P("Revise your writing", "Revisa tu escritura"),
    read: P("I read my writing out loud.", "Leí mi escritura en voz alta."),
    word: P("I used a word from the word list: {s}.", "Usé una palabra de la lista: {s}."),
    link: P("I used because, but or so.", "Usé porque, pero o así que."),
    marks: P(
      "I checked my capital letters and my end marks.",
      "Revisé mis mayúsculas y mis puntos finales.",
    ),
  },
};

/** Fill `{name}` placeholders. A name with no value is left in place so a test can see it. */
export function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
}

export const BLANK = /___/g;
export const SLOTS = /\{(\w+)\}/g;

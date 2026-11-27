// English and Spanish chrome for printed worksheets and Word files. Only directions and labels are translated:
// practice text (prompts, options, passages) is always printed exactly as the teacher wrote it.
// Spanish here has NOT had a native-speaker review.

export const PRINT_STRINGS = Object.freeze({
  name: { en: "Name", es: "Nombre" },
  date: { en: "Date", es: "Fecha" },
  directions: { en: "Directions", es: "Instrucciones" },
  goal: { en: "Today I am learning", es: "Hoy estoy aprendiendo" },
  grade: { en: "Grade", es: "Grado" },
  unit: { en: "Unit", es: "Unidad" },
  objective: { en: "Objective", es: "Objetivo" },
  keyWords: { en: "Key words", es: "Palabras clave" },
  term: { en: "Word", es: "Palabra" },
  meaning: { en: "Meaning", es: "Significado" },
  example: { en: "Example", es: "Ejemplo" },
  spanish: { en: "Spanish", es: "Español" },
  picture: { en: "Picture", es: "Dibujo" },
  wordBank: { en: "Word bank", es: "Banco de palabras" },
  answer: { en: "Answer", es: "Respuesta" },
  workSpace: { en: "Work space", es: "Espacio para trabajar" },
  sentenceStarter: { en: "Sentence starter", es: "Inicio de oración" },
  step: { en: "Step", es: "Paso" },
  group: { en: "Group", es: "Grupo" },
  yourSentence: { en: "Write your sentence", es: "Escribe tu oración" },
  fix: { en: "Choose the best fix", es: "Elige la mejor corrección" },
  listen: {
    en: "Your teacher will read this aloud.",
    es: "Tu maestro o maestra lo leerá en voz alta.",
  },
  picturePlaceholder: { en: "Picture not included", es: "Imagen no incluida" },
  diagramMissing: {
    en: "Diagram could not be drawn",
    es: "No se pudo dibujar el diagrama",
  },
  animationMissing: {
    en: "Animation could not be built",
    es: "No se pudo crear la animación",
  },
  animationInWord: {
    en: "Animation (the steps are listed below; the pictures are in the printable version)",
    es: "Animación (los pasos están en la lista; los dibujos están en la versión para imprimir)",
  },
  diagramInWord: {
    en: "Diagram (drawn in the printable version; the data is in the table below)",
    es: "Diagrama (se dibuja en la versión para imprimir; los datos están en la tabla)",
  },
  page: { en: "Page", es: "Página" },
  of: { en: "of", es: "de" },
  teacherCopy: { en: "TEACHER COPY", es: "COPIA DEL MAESTRO" },
  answerKey: { en: "Answer key", es: "Clave de respuestas" },
  notForStudents: { en: "Do not hand out", es: "No repartir a los estudiantes" },
  sample: { en: "Sample response", es: "Respuesta de ejemplo" },
  look: { en: "Look for", es: "Busque" },
  why: { en: "Why", es: "Por qué" },
  misconception: { en: "Common mistake", es: "Error común" },
  scaffold: { en: "If students struggle", es: "Si los estudiantes tienen dificultad" },
  frame: { en: "Sentence frame", es: "Marco de oración" },
  teacherNotes: { en: "Teacher notes", es: "Notas del maestro" },
  misconceptions: { en: "Watch for these mistakes", es: "Errores comunes" },
  standards: { en: "Standards", es: "Estándares" },
  teacherChosen: { en: "teacher-selected", es: "elegido por el maestro" },
  readAloudScript: { en: "Read-aloud script", es: "Texto para leer en voz alta" },
  noQuestions: {
    en: "This worksheet has no questions yet.",
    es: "Esta hoja aún no tiene preguntas.",
  },
  org: {
    en: {
      know: "What I know",
      want: "What I want to know",
      learned: "What I learned",
      both: "Both",
      claim: "Claim",
      evidence: "Evidence",
      reasoning: "Reasoning",
      cause: "Cause",
      effect: "Effect",
      main: "Main idea",
      topic: "Topic",
    },
    es: {
      know: "Lo que sé",
      want: "Lo que quiero saber",
      learned: "Lo que aprendí",
      both: "Ambos",
      claim: "Afirmación",
      evidence: "Evidencia",
      reasoning: "Razonamiento",
      cause: "Causa",
      effect: "Efecto",
      main: "Idea principal",
      topic: "Tema",
    },
  },
  how: {
    choice: {
      en: "Fill in the bubble next to the best answer.",
      es: "Rellena el círculo junto a la mejor respuesta.",
    },
    multi: {
      en: "Check every answer that applies.",
      es: "Marca todas las respuestas que correspondan.",
    },
    match: {
      en: "Write the letter of the match on each line.",
      es: "Escribe la letra de la pareja en cada línea.",
    },
    sort: {
      en: "Write each item in the correct column.",
      es: "Escribe cada elemento en la columna correcta.",
    },
    order: {
      en: "Write the letters in the correct order.",
      es: "Escribe las letras en el orden correcto.",
    },
    blank: {
      en: "Write the missing word or number on each line.",
      es: "Escribe la palabra o el número que falta en cada línea.",
    },
    bank: { en: "Use the word bank.", es: "Usa el banco de palabras." },
    number: {
      en: "Show your work. Write your answer on the line.",
      es: "Muestra tu trabajo. Escribe tu respuesta en la línea.",
    },
    write: { en: "Write your answer.", es: "Escribe tu respuesta." },
    explain: {
      en: "Explain your thinking with words, numbers, or a picture.",
      es: "Explica tu razonamiento con palabras, números o un dibujo.",
    },
    identify: {
      en: "Circle the words that answer the question.",
      es: "Encierra en un círculo las palabras que responden la pregunta.",
    },
    hotspot: {
      en: "Write the letter of the correct place.",
      es: "Escribe la letra del lugar correcto.",
    },
    numberline: {
      en: "Draw a dot on the number line.",
      es: "Dibuja un punto en la recta numérica.",
    },
    plot: { en: "Plot each point on the grid.", es: "Marca cada punto en la cuadrícula." },
    plotWord: {
      en: "Mark each point with an X in the grid.",
      es: "Marca cada punto con una X en la cuadrícula.",
    },
    build: {
      en: "Cut out the cards and put them in order, or write the sentence on the lines.",
      es: "Recorta las tarjetas y ponlas en orden, o escribe la oración en las líneas.",
    },
    error: {
      en: "Circle the step that has a mistake. Then choose the fix.",
      es: "Encierra en un círculo el paso que tiene un error. Luego elige la corrección.",
    },
    fillTable: { en: "Fill in the empty boxes.", es: "Llena los cuadros vacíos." },
  },
});

/** A translated string for `lang` ("en" | "es" | "bi"). Bilingual joins English and Spanish. */
export function tr(lang, path) {
  const node = path.split(".").reduce((o, k) => o?.[k], PRINT_STRINGS);
  if (!node || typeof node.en !== "string") return "";
  if (lang === "es") return node.es;
  if (lang === "bi") return node.en === node.es ? node.en : `${node.en} / ${node.es}`;
  return node.en;
}

export const normLang = (lang) => (lang === "es" || lang === "bi" ? lang : "en");
export const normPart = (part) =>
  part === "teacher" ? "key" : ["student", "key", "all"].includes(part) ? part : "student";

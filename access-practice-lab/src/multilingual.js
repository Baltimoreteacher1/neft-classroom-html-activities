// Multilingual scaffolds: Academic Cognate Network and False Friends (English and Spanish only).
// Supports home-language asset bridging for English Learners (WIDA ELD Standard 1).

export const ACADEMIC_COGNATES = [
  { en: "analyze", es: "analizar", cat: "Thinking & Action", note: "Examine details closely to understand the whole." },
  { en: "evidence", es: "evidencia", cat: "Scientific & Argument", note: "Facts, data, or quotes that support a claim." },
  { en: "conclude", es: "concluir", cat: "Thinking & Action", note: "Reach a decision or ending based on evidence." },
  { en: "hypothesis", es: "hipótesis", cat: "Scientific & Argument", note: "An educated prediction that can be tested." },
  { en: "contrast", es: "contrastar", cat: "Comparison", note: "Explain how two or more things are different." },
  { en: "compare", es: "comparar", cat: "Comparison", note: "Explain how two or more things are alike or different." },
  { en: "sequence", es: "secuencia", cat: "Organization", note: "The specific order in which events or steps occur." },
  { en: "classify", es: "clasificar", cat: "Thinking & Action", note: "Group items based on shared features or properties." },
  { en: "demonstrate", es: "demostrar", cat: "Thinking & Action", note: "Show clearly with evidence, examples, or actions." },
  { en: "evaluate", es: "evaluar", cat: "Thinking & Action", note: "Judge the quality, importance, or value of something." },
  { en: "interpret", es: "interpretar", cat: "Thinking & Action", note: "Explain the meaning of information, charts, or words." },
  { en: "justify", es: "justificar", cat: "Scientific & Argument", note: "Give valid reasons and evidence for an answer or claim." },
  { en: "summarize", es: "resumir", cat: "Organization", note: "State the central ideas briefly in your own words." },
  { en: "observe", es: "observar", cat: "Scientific & Argument", note: "Notice or measure carefully using the senses or tools." },
  { en: "predict", es: "predecir", cat: "Thinking & Action", note: "Forecast what will happen next based on patterns." },
  { en: "investigate", es: "investigar", cat: "Scientific & Argument", note: "Explore systematically to find answers." },
  { en: "organize", es: "organizar", cat: "Organization", note: "Arrange parts into a clear, structured system." },
  { en: "perspective", es: "perspectiva", cat: "Social Studies & Literature", note: "A point of view or way of seeing an issue." },
  { en: "impact", es: "impacto", cat: "Cause & Effect", note: "The strong effect or result one thing has on another." },
  { en: "factor", es: "factor", cat: "Cause & Effect", note: "An element or condition that contributes to a result." },
  { en: "function", es: "función", cat: "Scientific & Argument", note: "The special purpose or job of a part or system." },
  { en: "process", es: "proceso", cat: "Scientific & Argument", note: "A series of actions or steps taken to achieve an end." },
  { en: "structure", es: "estructura", cat: "Organization", note: "How parts are built, arranged, or connected." },
  { en: "solution", es: "solución", cat: "Cause & Effect", note: "The answer to a problem or a homogeneous mixture." },
  { en: "ecosystem", es: "ecosistema", cat: "Science", note: "A community of living organisms interacting with their environment." },
  { en: "adaptation", es: "adaptación", cat: "Science", note: "A trait that helps a living thing survive in its habitat." },
  { en: "precipitation", es: "precipitación", cat: "Science", note: "Water falling from clouds as rain, snow, sleet, or hail." },
  { en: "evaporation", es: "evaporación", cat: "Science", note: "The process of liquid water turning into water vapor." },
  { en: "condensation", es: "condensación", cat: "Science", note: "The process of water vapor cooling and turning into liquid." },
  { en: "significant", es: "significativo", cat: "Evaluation", note: "Important, meaningful, or having a noticeable effect." },
  { en: "alternative", es: "alternativa", cat: "Evaluation", note: "Another choice or possibility." },
  { en: "consequence", es: "consecuencia", cat: "Cause & Effect", note: "A result or outcome that follows an action." }
];

export const FALSE_FRIENDS = [
  {
    en: "embarrassed",
    esFalse: "embarazada",
    actualEs: "avergonzado / apenado",
    warning: "'Embarazada' in Spanish means pregnant, not embarrassed!"
  },
  {
    en: "actual",
    esFalse: "actual",
    actualEs: "real / verdadero",
    warning: "'Actual' in Spanish means current or present-day, while in English it means real or true."
  },
  {
    en: "assist",
    esFalse: "asistir",
    actualEs: "ayudar",
    warning: "'Asistir' in Spanish means to attend (an event), while in English 'assist' means to help."
  },
  {
    en: "exit",
    esFalse: "éxito",
    actualEs: "salida",
    warning: "'Éxito' in Spanish means success, while 'exit' in English means a way out."
  },
  {
    en: "library",
    esFalse: "librería",
    actualEs: "biblioteca",
    warning: "'Librería' in Spanish is a bookstore where you buy books; a 'library' is a biblioteca where you borrow them."
  },
  {
    en: "sensible",
    esFalse: "sensible",
    actualEs: "sensato / prudente",
    warning: "'Sensible' in Spanish means emotionally sensitive; in English 'sensible' means having good common sense."
  },
  {
    en: "record",
    esFalse: "recordar",
    actualEs: "grabar / registrar",
    warning: "'Recordar' in Spanish means to remember; 'record' in English means to capture audio, video, or data."
  }
];

/**
 * Find cognates appearing in a given text string.
 */
export function findCognatesInText(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordSet = new Set(words);
  return ACADEMIC_COGNATES.filter((c) => wordSet.has(c.en.toLowerCase()));
}

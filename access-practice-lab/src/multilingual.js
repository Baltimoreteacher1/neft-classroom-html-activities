// Multilingual Scaffolds: Academic Cognate Network, False Friends, and Multilingual Directions.
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

export const MULTILINGUAL_DIRECTIONS = {
  es: {
    name: "Español",
    listen: "Escucha el audio atentamente antes de responder.",
    read: "Lee el pasaje y busca evidencia para apoyar tus ideas.",
    speak: "Graba tu voz explicando tu respuesta con detalles académicos.",
    write: "Escribe tu respuesta usando oraciones completas y vocabulario específico.",
    check: "Revisa tu trabajo y añade un detalle adicional si es necesario.",
    retry: "Inténtalo de nuevo. Piensa en qué evidencia puedes añadir.",
    hint: "¿Necesitas una pista? Observa la gráfica o el texto con atención."
  },
  vi: {
    name: "Tiếng Việt",
    listen: "Lắng nghe cẩn thận trước khi trả lời.",
    read: "Đọc đoạn văn và tìm bằng chứng để giải thích.",
    speak: "Ghi âm giọng nói của bạn, giải thích bằng từ ngữ học thuật.",
    write: "Viết câu trả lời của bạn bằng các câu hoàn chỉnh.",
    check: "Kiểm tra lại câu trả lời và thêm chi tiết nếu cần.",
    retry: "Thử lại lần nữa. Xem xét bằng chứng cụ thể hơn.",
    hint: "Cần gợi ý? Hãy nhìn kỹ vào biểu đồ hoặc bài đọc."
  },
  ar: {
    name: "العربية",
    listen: "استمع إلى المقطع الصوتي بعناية قبل الإجابة.",
    read: "اقرأ النص وابحث عن الأدلة لدعم فكرتك.",
    speak: "سجّل صوتك وأنت تشرح إجابتك باستخدام مصطلحات أكاديمية.",
    write: "اكتب إجابتك في جمل كاملة ومنظمة.",
    check: "راجع إجابتك وأضف تفصيلاً آخر إذا لزم الأمر.",
    retry: "حاول مرة أخرى وفكّر في الدليل المناسب.",
    hint: "هل تحتاج إلى تلميح؟ انظر إلى الرسم البياني أو النص بعناية."
  },
  pt: {
    name: "Português",
    listen: "Ouça o áudio com atenção antes de responder.",
    read: "Leia o texto e encontre evidências para apoiar sua resposta.",
    speak: "Grave sua voz explicando sua resposta com detalhes acadêmicos.",
    write: "Escreva sua resposta em frases completas.",
    check: "Revise seu trabalho e adicione detalhes se necessário.",
    retry: "Tente novamente. Pense em quais evidências você pode usar.",
    hint: "Precisa de uma dica? Observe o gráfico ou texto com atenção."
  },
  zh: {
    name: "中文",
    listen: "在回答之前请仔细聆听音频。",
    read: "阅读短文并寻找支持你观点的证据。",
    speak: "录下你的声音，用学术词汇解释你的想法。",
    write: "用完整的句子写出你的回答。",
    check: "检查你的答案，必要时添加更多细节。",
    retry: "再试一次，思考你可以添加哪些证据。",
    hint: "需要提示吗？仔细查看图表或文章。"
  },
  fr: {
    name: "Français",
    listen: "Écoutez attentivement l'audio avant de répondre.",
    read: "Lisez le texte et trouvez des preuves pour appuyer votre réponse.",
    speak: "Enregistrez votre voix en expliquant avec des termes académiques.",
    write: "Rédigez votre réponse en phrases complètes et structurées.",
    check: "Relisez votre travail et ajoutez un détail si nécessaire.",
    retry: "Réessayez. Réfléchissez aux preuves à ajouter.",
    hint: "Besoin d'un indice ? Observez attentivement le graphique ou le texte."
  }
};

/**
 * Find cognates appearing in a given text string.
 */
export function findCognatesInText(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordSet = new Set(words);
  return ACADEMIC_COGNATES.filter((c) => wordSet.has(c.en.toLowerCase()));
}

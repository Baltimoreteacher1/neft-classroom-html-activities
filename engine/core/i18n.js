/**
 * Centralized bilingual (EN/ES) strings for lesson engine chrome.
 * Stacked EN+ES display matches family homework pattern.
 */

const STRINGS = {
  startActivity: { en: "Start Activity →", es: "Comenzar actividad →" },
  yourName: { en: "Your Name", es: "Tu nombre" },
  period: { en: "Period", es: "Período" },
  namePlaceholder: {
    en: "First name Last initial",
    es: "Nombre e inicial del apellido",
  },
  periodPlaceholder: { en: "e.g. 3", es: "ej. 3" },
  enterNamePrompt: {
    en: "Enter your <strong>first name and last initial</strong> to start. Lesson progress saves on this device and your name may be included in classroom submissions or exports. Google Forms, when used, open Google and follow your school account settings.",
    es: "Escribe tu <strong>nombre y la inicial de tu apellido</strong> para comenzar. El progreso se guarda en este dispositivo y tu nombre puede incluirse en entregas o exportaciones de la clase. Los Formularios de Google se abren en Google y siguen la configuración de tu cuenta escolar.",
  },
  familyHomework: { en: "Family homework", es: "Tarea familiar" },
  guidedNotes: { en: "Guided notes", es: "Notas guiadas" },
  studentHandout: { en: "Printable handout", es: "Hoja imprimible" },
  printableLesson: {
    en: "Full lesson (print)",
    es: "Lección completa (imprimir)",
  },
  lessonSlides: { en: "Lesson slides", es: "Diapositivas de la lección" },
  googleSlides: { en: "Google Slides", es: "Google Slides" },
  teacherNotes: { en: "Teacher notes", es: "Notas del maestro" },
  teacherNotesToggle: {
    en: "Show teacher pacing & tips",
    es: "Ver ritmo y consejos del maestro",
  },
  teacherNotesHide: {
    en: "Hide teacher notes",
    es: "Ocultar notas del maestro",
  },
  newToTopic: { en: "New to this topic?", es: "¿Nuevo en este tema?" },
  getReady: { en: "Get Ready", es: "Prepárate" },
  getReadyDesc: {
    en: "Take the quick Get Ready check first — it finds what you're missing.",
    es: "Haz primero la verificación rápida — encuentra lo que te falta.",
  },
  startArrow: { en: "Start →", es: "Comenzar →" },
  todaysGoal: { en: "Today's Goal", es: "Meta de hoy" },
  vocabWords: { en: "vocab words", es: "palabras de vocabulario" },
  practiceItems: { en: "practice items", es: "ejercicios de práctica" },
  phases: { en: "phases", es: "fases" },
  standardsTap: { en: "tap to learn more", es: "toca para saber más" },
  savedProgress: {
    en: "Saved progress on this device:",
    es: "Progreso guardado en este dispositivo:",
  },
  lessonForms: { en: "Lesson Forms", es: "Formularios de la lección" },
  notes: { en: "Notes", es: "Notas" },
  practice: { en: "Practice", es: "Práctica" },
  quiz: { en: "Quiz", es: "Prueba" },
  target: { en: "Target", es: "Objetivo" },
  discuss: { en: "Discuss", es: "Conversar" },
  progress: { en: "Progress", es: "Progreso" },
  coins: { en: "coins", es: "monedas" },
  beforeLesson: { en: "Before the lesson", es: "Antes de la lección" },
  bonus: { en: "Bonus", es: "Extra" },
  extend: { en: "Extend", es: "Ampliar" },
  projects: { en: "Projects", es: "Proyectos" },
  bonusUngraded: { en: "Bonus · Ungraded", es: "Extra · Sin calificar" },
  openFullPage: { en: "Open full page ↗", es: "Abrir página completa ↗" },
  print: { en: "Print", es: "Imprimir" },
  continue: { en: "Continue →", es: "Continuar →" },
  continueTo: { en: "Continue to", es: "Continuar a" },
  phaseComplete: { en: "Phase Complete", es: "Fase completada" },
  phaseDone: { en: "Done!", es: "¡Listo!" },
  upNext: { en: "Up next", es: "Siguiente" },
  perfectPhase: { en: "Perfect Phase!", es: "¡Fase perfecta!" },
  strongWork: { en: "Strong Work!", es: "¡Buen trabajo!" },
  bestStreak: { en: "Best streak", es: "Mejor racha" },
  inARow: { en: "in a row", es: "seguidas" },
  accuracy: { en: "accuracy", es: "precisión" },
  needNudge: { en: "Need a nudge?", es: "¿Necesitas una pista?" },
  hintsCount: { en: "hints", es: "pistas" },
  hintTip: { en: "Tip", es: "Consejo" },
  hintStrategy: { en: "Strategy", es: "Estrategia" },
  hintShowMe: { en: "Show me", es: "Muéstrame" },
  lessonComplete: { en: "Lesson Complete", es: "Lección completada" },
  awardedTo: { en: "Awarded to", es: "Otorgado a" },
  xpEarned: { en: "XP Earned", es: "XP ganados" },
  stars: { en: "Stars", es: "Estrellas" },
  printCertificate: { en: "Print Certificate", es: "Imprimir certificado" },
  downloadCertificate: {
    en: "Download Certificate (PNG)",
    es: "Descargar certificado (PNG)",
  },
  scanToRevisit: {
    en: "Scan to revisit this lesson",
    es: "Escanea para volver a esta lección",
  },
  myLessonSummary: { en: "My Lesson Summary", es: "Mi resumen de la lección" },
  printSummary: { en: "Print my summary", es: "Imprimir mi resumen" },
  student: { en: "Student", es: "Estudiante" },
  lesson: { en: "Lesson", es: "Lección" },
  oneThingLearned: { en: "One thing I learned", es: "Una cosa que aprendí" },
  confidence: { en: "Confidence", es: "Confianza" },
  reflectTitle: { en: "Reflect", es: "Reflexionar" },
  reflectDesc: {
    en: "Look back at what you learned and show what you know.",
    es: "Mira lo que aprendiste y demuestra lo que sabes.",
  },
  reflection321: { en: "3-2-1 Reflection", es: "Reflexión 3-2-1" },
  thingsLearned: { en: "things I learned", es: "cosas que aprendí" },
  connectionsMade: { en: "connections I made", es: "conexiones que hice" },
  questionStillHave: {
    en: "question I still have",
    es: "pregunta que aún tengo",
  },
  oneThingToday: {
    en: "One thing I learned today",
    es: "Una cosa que aprendí hoy",
  },
  oneThingPlaceholder: {
    en: "The most important thing I learned is...",
    es: "Lo más importante que aprendí es...",
  },
  howConfident: {
    en: "How confident do you feel about",
    es: "¿Qué tan seguro te sientes sobre",
  },
  notYet: { en: "Not yet", es: "Aún no" },
  gettingThere: { en: "Getting there", es: "Casi lo tengo" },
  gotIt: { en: "Got it!", es: "¡Lo tengo!" },
  almost: { en: "Almost", es: "Casi" },
  needHelp: { en: "Need help", es: "Necesito ayuda" },
  didIGetIt: { en: "Did I get it?", es: "¿Lo logré?" },
  exitTicketIntro: {
    en: "3 quick questions — show what you know.",
    es: "3 preguntas rápidas — demuestra lo que sabes.",
  },
  etQ1Label: { en: "Question 1 · Skill check", es: "Pregunta 1 · Chequeo de destreza" },
  etQ2Label: {
    en: "Question 2 · Explain your thinking",
    es: "Pregunta 2 · Explica tu razonamiento",
  },
  etQ3Label: { en: "Question 3 · Spot the mistake", es: "Pregunta 3 · Encuentra el error" },
  etQ2Prompt: {
    en: "Look back at Question 1. How do you know your answer is right? Write 1–2 sentences.",
    es: "Mira la Pregunta 1. ¿Cómo sabes que tu respuesta es correcta? Escribe 1–2 oraciones.",
  },
  etQ3Prompt: {
    en: "What is one mistake someone could make on today's skill — and how would you catch it?",
    es: "¿Qué error podría cometer alguien con la destreza de hoy — y cómo lo descubrirías?",
  },
  etCompareModel: {
    en: "Compare with a model answer",
    es: "Compara con una respuesta modelo",
  },
  etModelAnswer: { en: "Model answer", es: "Respuesta modelo" },
  etWriteFirst: {
    en: "Write your own idea first — then compare.",
    es: "Escribe tu propia idea primero — luego compara.",
  },
  etFinishReminder: {
    en: "Before you finish: also answer Questions 2 and 3 above.",
    es: "Antes de terminar: responde también las Preguntas 2 y 3 arriba.",
  },
  spTryFirst: {
    en: "Give it a try first — show a step or type an answer, then check.",
    es: "Inténtalo primero — escribe un paso o una respuesta, y luego revisa.",
  },
  spFirstMiss: {
    en: "Not quite yet. Re-read the problem, check your steps against the Worked Example above, then check again to see the answer.",
    es: "Todavía no. Vuelve a leer el problema, compara tus pasos con el Ejemplo Resuelto de arriba, y revisa otra vez para ver la respuesta.",
  },
  contentObjective: { en: "Content Objective", es: "Objetivo de contenido" },
  languageObjective: { en: "Language Objective", es: "Objetivo de lenguaje" },
  teacherView: { en: "Teacher View", es: "Vista del maestro" },
  pacingGuide: { en: "Pacing Guide", es: "Guía de ritmo" },
  standardsObjectives: {
    en: "Standards & Objectives",
    es: "Estándares y objetivos",
  },
  listenFor: { en: "Listen For", es: "Escuchar por" },
  answerKey: {
    en: "Answer Key (Practice)",
    es: "Clave de respuestas (Práctica)",
  },
  differentiationTips: {
    en: "Differentiation Tips",
    es: "Consejos de diferenciación",
  },
  printPacingSheet: { en: "Print pacing sheet", es: "Imprimir hoja de ritmo" },
  commonMistake: { en: "Watch out!", es: "¡Cuidado!" },
  tapToReveal: { en: "Tap to reveal →", es: "Toca para revelar →" },
  storyBeats: {
    en: "Story beats — tap to reveal",
    es: "Partes de la historia — toca para revelar",
  },
  gradeOutstanding: { en: "Outstanding!", es: "¡Excelente!" },
  gradeGreat: { en: "Great Job!", es: "¡Gran trabajo!" },
  gradeGood: { en: "Good Effort!", es: "¡Buen esfuerzo!" },
  gradeKeep: { en: "Keep Practicing!", es: "¡Sigue practicando!" },
  mathematician: { en: "Mathematician", es: "Matemático" },
  ofComplete: { en: "of", es: "de" },
  complete: { en: "complete", es: "completadas" },
};

const PHASE_NAMES = {
  warmup: { en: "Warmup", es: "Calentamiento" },
  launch: { en: "Launch", es: "Inicio" },
  vocab: { en: "Vocabulary", es: "Vocabulario" },
  explore: { en: "Explore", es: "Explorar" },
  practice: { en: "Practice", es: "Práctica" },
  connect: { en: "Connect", es: "Conectar" },
  reflect: { en: "Reflect", es: "Reflexionar" },
  objectives: { en: "Objectives", es: "Objetivos" },
};

const BADGE_NAMES = {
  streak_sage: { en: "Streak Sage", es: "Maestro de rachas" },
  vocab_scholar: { en: "Vocab Scholar", es: "Erudito del vocabulario" },
  no_hint_hero: { en: "No-Hint Hero", es: "Héroe sin pistas" },
  coin_collector: { en: "Coin Collector", es: "Coleccionista de monedas" },
  sharpshooter: { en: "Sharpshooter", es: "Tirador certero" },
  deep_thinker: { en: "Deep Thinker", es: "Pensador profundo" },
};

const HINT_LABELS = [
  { en: "💡 Tip", es: "💡 Consejo" },
  { en: "🧭 Strategy", es: "🧭 Estrategia" },
  { en: "👀 Show me", es: "👀 Muéstrame" },
];

/** Persisted student language choice (English and Spanish only). */
const LANG_LS = "nt-lang";

/**
 * The student's language, which is ENGLISH until they say otherwise.
 *
 * This used to auto-detect: no saved choice meant falling through to
 * `document.documentElement.lang`, and then to `navigator.language`. On any
 * device whose browser is set to Spanish — a shared Chromebook, a phone, a
 * teacher's laptop — the lesson opened in Spanish with nobody having asked for
 * it, and the only way back was to find the ES/EN toggle. The Spanish is a
 * support students opt into, not a default the operating system picks for them.
 *
 * `setPreferredLang` still stamps `document.documentElement.lang`, so the html
 * attribute is a mirror of the saved choice rather than a second source of
 * truth; reading it back here would just reintroduce the same guess.
 */
export function getPreferredLang() {
  try {
    const saved = localStorage.getItem(LANG_LS);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    /* storage blocked — the choice simply does not persist; English stands */
  }
  return "en";
}

/** Persist the student's language choice ("en" | "es"); "" clears it. */
export function setPreferredLang(lang) {
  try {
    if (lang === "es" || lang === "en") localStorage.setItem(LANG_LS, lang);
    else localStorage.removeItem(LANG_LS);
  } catch {
    /* storage blocked — choice just won't persist */
  }
  if (typeof document !== "undefined" && (lang === "es" || lang === "en")) {
    document.documentElement.lang = lang;
  }
}

/** Single-language string (defaults EN). */
export function t(key, lang) {
  const entry = STRINGS[key] || PHASE_NAMES[key] || BADGE_NAMES[key];
  if (!entry) return key;
  const l = lang || getPreferredLang();
  return entry[l] || entry.en || key;
}

/** Badge name by id. */
export function badgeName(id, lang) {
  const entry = BADGE_NAMES[id];
  if (!entry) return id;
  const l = lang || getPreferredLang();
  return entry[l] || entry.en;
}

/** Phase name by engine index (0=Warmup, 1=Launch … 5=Reflect). */
export function phaseName(index, lang) {
  const keys = [
    "warmup",
    "objectives",
    "launch",
    "explore",
    "practice",
    "connect",
    "reflect",
    "objectives",
  ];
  const key = keys[index];
  const entry = PHASE_NAMES[key];
  if (!entry) return `Phase ${index + 1}`;
  const l = lang || getPreferredLang();
  return entry[l] || entry.en;
}

/** Stacked bilingual HTML block (EN primary, ES secondary). */
export function stack(key, opts = {}) {
  const entry = STRINGS[key] || PHASE_NAMES[key] || BADGE_NAMES[key];
  if (!entry) return esc(key);
  const en = entry.en || "";
  const es = entry.es || "";
  if (opts.html) {
    return `<span class="i18n-stack"><span class="i18n-en" lang="en">${en}</span><span class="i18n-es" lang="es">${es}</span></span>`;
  }
  return `${en}\n${es}`;
}

/** Bilingual stacked label for buttons (compact). */
export function stackBtn(key) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return `<span class="i18n-btn"><span class="i18n-en">${esc(entry.en)}</span><span class="i18n-es">${esc(entry.es)}</span></span>`;
}

/** Hint ladder label by level index 0–2. */
export function hintLabel(index) {
  const entry = HINT_LABELS[index] || HINT_LABELS[0];
  return stackHtml(entry.en, entry.es);
}

export function stackHtml(en, es) {
  return `<span class="i18n-stack"><span class="i18n-en" lang="en">${esc(en)}</span><span class="i18n-es" lang="es">${esc(es)}</span></span>`;
}

function esc(s) {
  if (typeof document === "undefined") return String(s ?? "");
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

export { BADGE_NAMES, HINT_LABELS, PHASE_NAMES, STRINGS };

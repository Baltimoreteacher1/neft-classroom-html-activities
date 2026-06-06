/**
 * Centralized bilingual (EN/ES) strings for lesson engine chrome.
 * Stacked EN+ES display matches family homework pattern.
 */

const STRINGS = {
  startActivity: { en: "Start Activity →", es: "Comenzar actividad →" },
  yourName: { en: "Your Name", es: "Tu nombre" },
  period: { en: "Period", es: "Período" },
  namePlaceholder: { en: "First name Last initial", es: "Nombre e inicial del apellido" },
  periodPlaceholder: { en: "e.g. 3", es: "ej. 3" },
  enterNamePrompt: {
    en: "Enter your name to start. Your progress saves on <strong>this device</strong>. Ask your teacher before switching Chromebooks.",
    es: "Escribe tu nombre para comenzar. Tu progreso se guarda en <strong>este dispositivo</strong>. Pregunta a tu maestro antes de cambiar de Chromebook.",
  },
  familyHomework: { en: "Family homework", es: "Tarea familiar" },
  guidedNotes: { en: "Guided notes", es: "Notas guiadas" },
  studentHandout: { en: "Printable handout", es: "Hoja imprimible" },
  teacherNotes: { en: "Teacher notes", es: "Notas del maestro" },
  teacherNotesToggle: { en: "Show teacher pacing & tips", es: "Ver ritmo y consejos del maestro" },
  teacherNotesHide: { en: "Hide teacher notes", es: "Ocultar notas del maestro" },
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
  savedProgress: { en: "Saved progress on this device:", es: "Progreso guardado en este dispositivo:" },
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
  downloadCertificate: { en: "Download Certificate (PNG)", es: "Descargar certificado (PNG)" },
  scanToRevisit: { en: "Scan to revisit this lesson", es: "Escanea para volver a esta lección" },
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
  questionStillHave: { en: "question I still have", es: "pregunta que aún tengo" },
  oneThingToday: { en: "One thing I learned today", es: "Una cosa que aprendí hoy" },
  oneThingPlaceholder: {
    en: "The most important thing I learned is...",
    es: "Lo más importante que aprendí es...",
  },
  howConfident: { en: "How confident do you feel about", es: "¿Qué tan seguro te sientes sobre" },
  notYet: { en: "Not yet", es: "Aún no" },
  gettingThere: { en: "Getting there", es: "Casi lo tengo" },
  gotIt: { en: "Got it!", es: "¡Lo tengo!" },
  almost: { en: "Almost", es: "Casi" },
  needHelp: { en: "Need help", es: "Necesito ayuda" },
  didIGetIt: { en: "Did I get it?", es: "¿Lo logré?" },
  contentObjective: { en: "Content Objective", es: "Objetivo de contenido" },
  languageObjective: { en: "Language Objective", es: "Objetivo de lenguaje" },
  teacherView: { en: "Teacher View", es: "Vista del maestro" },
  pacingGuide: { en: "Pacing Guide", es: "Guía de ritmo" },
  standardsObjectives: { en: "Standards & Objectives", es: "Estándares y objetivos" },
  listenFor: { en: "Listen For", es: "Escuchar por" },
  answerKey: { en: "Answer Key (Practice)", es: "Clave de respuestas (Práctica)" },
  differentiationTips: { en: "Differentiation Tips", es: "Consejos de diferenciación" },
  printPacingSheet: { en: "Print pacing sheet", es: "Imprimir hoja de ritmo" },
  commonMistake: { en: "Watch out!", es: "¡Cuidado!" },
  tapToReveal: { en: "Tap to reveal →", es: "Toca para revelar →" },
  storyBeats: { en: "Story beats — tap to reveal", es: "Partes de la historia — toca para revelar" },
  gradeOutstanding: { en: "Outstanding!", es: "¡Excelente!" },
  gradeGreat: { en: "Great Job!", es: "¡Gran trabajo!" },
  gradeGood: { en: "Good Effort!", es: "¡Buen esfuerzo!" },
  gradeKeep: { en: "Keep Practicing!", es: "¡Sigue practicando!" },
  mathematician: { en: "Mathematician", es: "Matemático" },
  ofComplete: { en: "of", es: "de" },
  complete: { en: "complete", es: "completadas" },
};

const PHASE_NAMES = {
  launch: { en: "Launch", es: "Inicio" },
  vocab: { en: "Vocab Builder", es: "Vocabulario" },
  explore: { en: "Explore", es: "Explorar" },
  practice: { en: "Practice", es: "Práctica" },
  connect: { en: "Connect", es: "Conectar" },
  reflect: { en: "Reflect", es: "Reflexionar" },
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

/** Detect preferred language from html[lang] or browser. */
export function getPreferredLang() {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang || "";
    if (htmlLang.startsWith("es")) return "es";
  }
  if (typeof navigator !== "undefined" && navigator.language?.startsWith("es")) {
    return "es";
  }
  return "en";
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

/** Phase name by engine index (0=Launch … 5=Reflect). */
export function phaseName(index, lang) {
  const keys = ["launch", "vocab", "explore", "practice", "connect", "reflect"];
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

export { STRINGS, PHASE_NAMES, BADGE_NAMES, HINT_LABELS };

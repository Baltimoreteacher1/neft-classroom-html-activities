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
  // Lesson entrance badge (engine/core/app.js playLessonEntrance).
  entranceWelcome: { en: "Welcome,", es: "Te damos la bienvenida," },
  entranceGo: { en: "Your lesson is ready — let's go!", es: "Tu lección está lista — ¡vamos!" },
  // Matching-game chrome (engine/components/matching-game.js).
  mgTap: {
    en: "Tap an item on the left, then its match on the right.",
    es: "Toca un elemento a la izquierda y luego su pareja a la derecha.",
  },
  mgMatched: { en: "matched", es: "emparejados" },
  mgAttempts: { en: "Attempts", es: "Intentos" },
  mgMatchThese: { en: "Match these…", es: "Empareja estos…" },
  mgWithThese: { en: "…with these", es: "…con estos" },
  mgDoneOne: { en: "All matched in 1 attempt!", es: "¡Todo emparejado en 1 intento!" },
  mgDoneMany: {
    en: "All matched in {n} attempts!",
    es: "¡Todo emparejado en {n} intentos!",
  },
  mgFlawless: { en: "Flawless!", es: "¡Impecable!" },
  mgNice: { en: "Nice work!", es: "¡Buen trabajo!" },
  mgKeep: { en: "Keep practicing!", es: "¡Sigue practicando!" },
  // Drag-sort chrome (engine/components/drag-sort.js).
  dsBank: {
    en: "Drag items into the correct category",
    es: "Arrastra cada tarjeta a su categoría",
  },
  dsCheckSorting: { en: "Check Sorting", es: "Revisar clasificación" },
  dsCheckOrder: { en: "Check Order", es: "Revisar orden" },
  dsOrderRight: {
    en: "Correct order! Nicely sequenced.",
    es: "¡Orden correcto! Bien secuenciado.",
  },
  dsOrderPartial: {
    en: "{n} of {t} in the right spot. Use ▲ ▼ to rearrange, then check again.",
    es: "{n} de {t} en el lugar correcto. Usa ▲ ▼ para reordenar y revisa otra vez.",
  },
  dsAllSorted: {
    en: "All {t} items sorted correctly!",
    es: "¡Las {t} tarjetas están clasificadas correctamente!",
  },
  dsPartialSorted: {
    en: "{n} of {t} correct. Drag the highlighted items to the right category.",
    es: "{n} de {t} correctas. Arrastra las tarjetas marcadas a la categoría correcta.",
  },

  /* ── Lesson chrome that was English-only ───────────────────────────────────
     Audited in reports/es-workorder-units-1-9-10.md and ranked ABOVE the 1,437
     lesson-content strings, for a reason worth restating: a missing translation
     on a problem still lets a student read the problem in English, but a
     missing translation on the control that RECORDS their work costs them the
     completion. Two "finish lesson" buttons existed and only one spoke
     Spanish; a student who saved in Spanish and mistyped their resume code was
     answered in English. */
  finishCelebrate: {
    en: "Finish Lesson & Celebrate 🎉",
    es: "Terminar la lección y celebrar 🎉",
  },
  submitResponse: { en: "Submit Response", es: "Enviar respuesta" },
  responsePlaceholder: {
    en: "Type your response here...",
    es: "Escribe tu respuesta aquí...",
  },
  gotItContinue: { en: "Got it — continue →", es: "Entendido — continuar →" },
  continueToPractice: { en: "Continue to Practice →", es: "Continuar a la práctica →" },
  continueToObjectives: {
    en: "Continue to Phase 2: Objectives 🎯",
    es: "Continuar a la fase 2: Objetivos 🎯",
  },
  continueToLaunch: {
    en: "Continue to Phase 3: Launch 🚀",
    es: "Continuar a la fase 3: Inicio 🚀",
  },
  readyForLaunch: {
    en: "Great job! You're ready for Phase 2: Launch 🚀",
    es: "¡Buen trabajo! Estás listo para la fase 2: Inicio 🚀",
  },
  breakIntoSteps: {
    en: "Remember to break the problem into steps! You've got this.",
    es: "¡Recuerda dividir el problema en pasos! Tú puedes.",
  },
  scoreFinal: { en: "Score Final (Submitted)", es: "Puntaje final (enviado)" },
  answersChecked: { en: "Answers checked", es: "Respuestas revisadas" },
  answersCheckedNote: {
    en: "Scroll up — every problem is marked.",
    es: "Desplázate hacia arriba — cada problema está marcado.",
  },
  checkMyThinking: { en: "✅ Check my thinking", es: "✅ Revisar mi razonamiento" },
  haveAGo: {
    en: "Have a go — even a guess beats skipping it.",
    es: "Inténtalo — incluso adivinar es mejor que saltarlo.",
  },
  notQuitePicture: {
    en: "Not quite — picture it with objects, then try once more.",
    es: "Todavía no — imagínalo con objetos y vuelve a intentarlo.",
  },
  findTheirMistake: {
    en: "Someone solved it like this — find their mistake:",
    es: "Alguien lo resolvió así — encuentra su error:",
  },
  beforeTheAnswer: {
    en: "🎯 Before the answer — one smaller question",
    es: "🎯 Antes de la respuesta — una pregunta más pequeña",
  },
  justShowAnswer: { en: "Just show me the answer", es: "Solo muéstrame la respuesta" },
  solveColumnsFirst: {
    en: "🔒 Finish Step 1 first — solve the problem in columns.",
    es: "🔒 Termina primero el paso 1 — resuelve el problema en columnas.",
  },
  alreadySolvedNumberLine: {
    en: "I already solved it — open the number line",
    es: "Ya lo resolví — abre la recta numérica",
  },
  scenarioWorkBelow: {
    en: "Use the scenario above. Work it out step by step below.",
    es: "Usa la situación de arriba. Resuélvelo paso a paso abajo.",
  },
  showSentenceStarters: {
    en: "Show sentence starters",
    es: "Mostrar inicios de oración",
  },
  sentenceStartersLabel: {
    en: "Sentence starters — tap one to add it to your answer",
    es: "Inicios de oración — toca uno para agregarlo a tu respuesta",
  },
  sentenceStarterTip: {
    en: "Tap to add this sentence starter",
    es: "Toca para agregar este inicio de oración",
  },
  startTimer60: { en: "⏱️ Start 60s timer", es: "⏱️ Iniciar temporizador de 60 s" },
  restartTimer60: { en: "⏱️ Restart 60s timer", es: "⏱️ Reiniciar temporizador de 60 s" },
  timeWrapUp: {
    en: "⏰ Time! Wrap up your ideas.",
    es: "⏰ ¡Se acabó el tiempo! Cierra tus ideas.",
  },
  weTalked: { en: "We talked! ✓", es: "¡Ya hablamos! ✓" },
  timesUp: { en: "time's up!", es: "¡se acabó el tiempo!" },
  resetTimer: { en: "↻ Reset", es: "↻ Reiniciar" },
  resetTimerTip: {
    en: "Set the warmup timer back to the full time (stopped)",
    es: "Devuelve el temporizador al tiempo completo (detenido)",
  },
  setTime: { en: "✏️ Set time", es: "✏️ Ajustar tiempo" },
  setTimeTip: {
    en: "Teacher: set the warmup time allowed (applies to all devices)",
    es: "Maestro: ajusta el tiempo permitido (se aplica a todos los dispositivos)",
  },
  nextTeacher: { en: "⏭ Next (teacher)", es: "⏭ Siguiente (maestro)" },
  nextTeacherTip: {
    en: "Teacher Mode — advance without answering",
    es: "Modo maestro — avanzar sin responder",
  },
  noticePlaceholder: { en: "I notice that...", es: "Yo noto que..." },
  wonderPlaceholder: { en: "I wonder if...", es: "Yo me pregunto si..." },
  revealSlidesLabel: { en: "Reveal Math slides", es: "Diapositivas de Reveal Math" },
  noticeWonderLabel: { en: "Notice and Wonder", es: "Observa y pregúntate" },
  nwNoticeHeading: { en: "What do you notice?", es: "¿Qué observas?" },
  nwWonderHeading: { en: "What do you wonder?", es: "¿Qué te preguntas?" },
  exploreGoalDefault: {
    en: "Build it yourself first. You do not need the formula yet — you are looking for it.",
    es: "Constrúyelo tú primero. Todavía no necesitas la fórmula — la estás buscando.",
  },
  showYourWorkLabel: { en: "Show your work", es: "Muestra tu trabajo" },
  lessonToolsMenu: { en: "Lesson tools menu", es: "Menú de herramientas de la lección" },
  submitWarmup: { en: "Submit Warmup Answers", es: "Enviar respuestas del calentamiento" },
  warmupCorrect: { en: "Correct! ✓", es: "¡Correcto! ✓" },
  warmupIncorrect: { en: "Incorrect. ✘", es: "Incorrecto. ✘" },
  warmupUnanswered: { en: "Unanswered.", es: "Sin responder." },
};

const PHASE_NAMES = {
  act1: { en: "Launch & Focus", es: "Inicio y Enfoque" },
  act2: { en: "Interactive Studio", es: "Estudio Interactivo" },
  act3: { en: "Exit Ticket", es: "Boleto de Salida" },
  warmup: { en: "Launch & Focus", es: "Inicio y Enfoque" },
  launch: { en: "Launch & Focus", es: "Inicio y Enfoque" },
  vocab: { en: "Vocabulary", es: "Vocabulario" },
  explore: { en: "Interactive Studio", es: "Estudio Interactivo" },
  practice: { en: "Interactive Studio", es: "Estudio Interactivo" },
  connect: { en: "Interactive Studio", es: "Estudio Interactivo" },
  reflect: { en: "Exit Ticket", es: "Boleto de Salida" },
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
 * Legacy key: the small-group studio used to persist its own Spanish lane
 * separately from the lesson engine's. Two keys meant two switches — a student
 * who chose Español in a lesson walked into the studio and got English back,
 * and had to find a second control they had no reason to know existed. The
 * studio now reads and writes `nt-lang` like everything else.
 *
 * This adopts the old value ONCE, and only when the student has never made a
 * choice under the new key, so a device already set to Spanish in the studio
 * stays in Spanish instead of silently reverting on the day this shipped. A
 * later explicit "English" writes `nt-lang` and wins permanently — the legacy
 * key is removed here rather than left to out-vote it on the next load.
 */
const LEGACY_STUDIO_LANG_LS = "nt-sg-lang";

function adoptLegacyStudioLang() {
  try {
    const legacy = localStorage.getItem(LEGACY_STUDIO_LANG_LS);
    if (legacy === null) return;
    const saved = localStorage.getItem(LANG_LS);
    if (saved !== "es" && saved !== "en" && (legacy === "es" || legacy === "en")) {
      localStorage.setItem(LANG_LS, legacy);
    }
    localStorage.removeItem(LEGACY_STUDIO_LANG_LS);
  } catch {
    /* storage blocked — nothing to migrate, and nothing breaks without it */
  }
}

if (typeof localStorage !== "undefined") adoptLegacyStudioLang();

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

// Mirror the saved choice onto <html lang> as soon as this module loads.
// setPreferredLang() stamps it when the student TOGGLES, but on a later page
// load nothing did — so a student who had chosen Spanish got Spanish phase
// names (phaseName reads the preference directly) while every stacked bilingual
// label stayed hidden, because those are switched by the lang attribute. The
// attribute is now set from the same source of truth on every load.
if (typeof document !== "undefined") {
  try {
    document.documentElement.lang = getPreferredLang();
  } catch {
    /* nothing to do — the attribute is a hint, not a requirement */
  }
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

/** Phase name by engine index (0=Act 1, 1=Act 2, 2=Act 3). */
export function phaseName(index, lang) {
  const keys = [
    "act1",
    "act2",
    "act3",
    "explore",
    "practice",
    "connect",
    "reflect",
    "objectives",
  ];
  const key = keys[index] || `act${index + 1}`;
  const entry = PHASE_NAMES[key];
  if (!entry) return `Act ${index + 1}`;
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

/**
 * Stacked chrome string with `{placeholder}` interpolation — for the fixed UI
 * strings that need a live number in them ("3 of 8 correct"). Same escaping
 * and CSS-switch contract as `stackHtml`; values are interpolated into BOTH
 * lanes before escaping.
 */
export function stackT(key, vars = {}) {
  const entry = STRINGS[key];
  if (!entry) return esc(key);
  const fill = (s) => String(s).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
  return stackHtml(fill(entry.en), fill(entry.es));
}

/**
 * Bilingual stack for AUTHORED CONTENT (stems, hints, explanations, choices) —
 * as opposed to `stackHtml`, which is for fixed UI chrome.
 *
 * The difference is what happens when there is no Spanish. Chrome always has
 * both lanes, so `stackHtml` can emit the `.i18n-es` span unconditionally.
 * Content does not: hint ladders fall back to generic English strings, and not
 * every practice item was translated. Emitting an empty `.i18n-es` for those
 * puts a blank italic line under the English whenever a student is in Spanish
 * mode, which reads as "the translation is missing" on items that never had
 * one. So a blank/whitespace `es` returns the English alone, unstacked.
 *
 * Spanish stays opt-in: `.i18n-es` is `display:none` until `setPreferredLang`
 * stamps `<html lang="es">` (see design-system.css). A student who never
 * touches the toggle sees exactly what they saw before.
 */
export function stackContent(en, es) {
  return stackContentHtml(esc(en), esc(es));
}

/**
 * Pre-rendered variant of `stackContent`. Both lanes must ALREADY be escaped or
 * intentionally-trusted markup — problem stems run through `renderMathText`,
 * which emits real tags, so escaping here would print them as literal text.
 * Callers passing raw config text want `stackContent` instead.
 */
/**
 * One language, chosen by the reader's preference — for places a STACK cannot
 * go. An SVG `<text>` axis label, an `alt`, a `title`: markup there is printed
 * verbatim or dropped, and two lines of text on an axis overlap the plot. Falls
 * back to English whenever the Spanish is absent, so a partly-translated chart
 * is readable rather than blank.
 */
export function pickLang(en, es) {
  const spanish = String(es ?? "").trim();
  if (spanish && getPreferredLang() === "es") return spanish;
  return String(en ?? "");
}

export function stackContentHtml(enHtml, esHtml) {
  const en = String(enHtml ?? "");
  const es = String(esHtml ?? "");
  if (!es.trim() || es === en) return en;
  return `<span class="i18n-stack"><span class="i18n-en" lang="en">${en}</span><span class="i18n-es" lang="es">${es}</span></span>`;
}

function esc(s) {
  if (typeof document === "undefined") return String(s ?? "");
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

export { BADGE_NAMES, HINT_LABELS, PHASE_NAMES, STRINGS };

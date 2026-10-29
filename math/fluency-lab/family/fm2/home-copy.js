// English and Spanish copy for the Family Math 2.0 home page. Static page text uses the same keys through data-t.
// @fm2 FM-001 FM-020 FM-021 FM-035
const c = (en, es) => ({ en, es });

export const COPY = {
  skip: c("Skip to family practice", "Ir a la práctica en familia"),
  heroTitle: c("Make room for a math moment.", "Hagamos un momento para las matemáticas."),
  focusedTitle: c("Practice: {skill}", "Práctica: {skill}"),
  heroLead: c(
    "A few minutes of math, together. You don’t need to know every answer.",
    "Unos minutos de matemáticas en familia. No necesitas saber todas las respuestas.",
  ),
  privacy: c(
    "Saved on this device. No account needed.",
    "Se guarda en este dispositivo. Sin cuenta.",
  ),
  loading: c("Getting your games ready…", "Preparando los juegos…"),
  gradeWord: c("Grade", "Grado"),
  grade: c("Choose a grade", "Elige un grado"),
  length: c("Session length", "Duración de la sesión"),
  how: c("How will you play?", "¿Cómo van a jugar?"),
  minutesOpt: c("{n} min", "{n} min"),
  solo: c("Learner plays", "Juega el estudiante"),
  together: c("Play together", "Jueguen juntos"),
  soloHint: c(
    "A grown-up can watch and cheer.",
    "Un adulto puede mirar y animar.",
  ),
  togetherHint: c(
    "Take turns, and pause to explain a thought.",
    "Túrnense y expliquen una idea.",
  ),
  start: c(
    "Start today’s {min}-minute practice",
    "Empezar la práctica de hoy: {min} minutos",
  ),
  guidedStart: c(
    "Try a guided session instead",
    "Probar una sesión guiada",
  ),
  guidedResume: c(
    "Continue the guided session",
    "Seguir la sesión guiada",
  ),
  guidedNote: c(
    "Guided: one idea, a few problems, a game and a chance to explain, about {min} minutes. We choose the skill.",
    "Guiada: una idea, unos problemas, un juego y una oportunidad de explicar, unos {min} minutos. Nosotros elegimos la destreza.",
  ),
  startNote: c(
    "{n} activities · about {min} min · {mode}. This is an estimate, not a speed test.",
    "{n} actividades · unos {min} min · {mode}. Es un cálculo aproximado, no una prueba de velocidad.",
  ),
  noGames: c(
    "Activities could not load. Your choices are saved; try loading them again.",
    "No se pudieron cargar las actividades. Tus opciones están guardadas; intenta cargarlas de nuevo.",
  ),
  missionTitle: c("Today’s mission", "Misión de hoy"),
  missionEmptyTitle: c("Nothing to play yet.", "Todavía no hay nada para jugar."),
  missionEmpty: c(
    "As soon as a game for this grade is ready, today’s mission appears here.",
    "Cuando haya un juego listo para este grado, la misión de hoy aparecerá aquí.",
  ),
  totalTime: c("About {n} minutes in all.", "En total, unos {n} minutos."),
  progressTitle: c("Your progress", "Tu progreso"),
  streak: c("Day streak", "Días seguidos"),
  week: c("Minutes this week", "Minutos esta semana"),
  starsEarned: c("Stars earned", "Estrellas ganadas"),
  progressEmpty: c(
    "Not practiced yet. Try one short activity to begin a progress record.",
    "Aún no se ha practicado. Prueba una actividad corta para comenzar un registro de progreso.",
  ),
  seeProgress: c("See my progress", "Ver mi progreso"),
  shelfTitle: c("Explore other activities", "Explora otras actividades"),
  shelfLead: c(
    "Pick any game to play at your learner’s grade.",
    "Elige cualquier juego para jugar al grado de tu estudiante.",
  ),
  soon: c("Temporarily unavailable", "No disponible por ahora"),
  retry: c("Try loading activities again", "Volver a cargar las actividades"),
  focusSkill: c(
    "Share or focus",
    "Compartir o enfocar",
  ),
  focusSelected: c("Focused practice: {skill}", "Práctica enfocada: {skill}"),
  skillSearch: c("Find a skill for this grade", "Buscar una destreza para este grado"),
  examplePrompt: c("Example prompt:", "Ejemplo de consigna:"),
  teacherMessage: c("Message for the family", "Mensaje para la familia"),
  shareLength: c("Practice length in the shared link", "Duración de práctica en el enlace"),
  teacherLink: c("Share link (no learner information)", "Enlace para compartir (sin datos del estudiante)"),
  copyMessage: c("Copy message", "Copiar mensaje"),
  copyLink: c("Copy link", "Copiar enlace"),
  copied: c("Copied to the clipboard.", "Copiado al portapapeles."),
  copyFallback: c("Copy is unavailable. The text is selected so you can copy it.", "No se puede copiar automáticamente. El texto está seleccionado para copiarlo."),
  clearSkill: c("Return to today’s recommended practice", "Volver a la práctica recomendada de hoy"),
  skillInvalid: c("That skill link does not match this grade. Choose a skill below or use today’s recommendation.", "Ese enlace de destreza no corresponde a este grado. Elige una destreza abajo o usa la recomendación de hoy."),
  skillUnavailable: c("That activity is temporarily unavailable. Try today’s recommendation or reload the activities.", "Esa actividad no está disponible por ahora. Prueba la recomendación de hoy o vuelve a cargar las actividades."),
  gradesRange: c("Grades {range}", "Grados {range}"),
  play: c("Play", "Jugar"),
  skillsTitle: c(
    "Browse skills",
    "Explorar destrezas",
  ),
  skillsLead: c(
    "Skills for {grade}. Search, then open a group.",
    "Destrezas de {grade}. Busca y abre un grupo.",
  ),
  practice: c("Practice", "Practicar"),
  skillOne: c("1 skill", "1 destreza"),
  rwMore: c("Show all {n} activities", "Mostrar las {n} actividades"),
  rwLess: c("Show fewer", "Mostrar menos"),
  skillCount: c("{n} skills", "{n} destrezas"),
  coachTitle: c("Try this together", "Prueben juntos"),
  coachFor: c(
    "For {skill}, one of today’s activities.",
    "Para {skill}, una de las actividades de hoy.",
  ),
  coachEmpty: c(
    "A coaching question appears here as soon as a game is ready.",
    "Aquí aparecerá una pregunta de apoyo cuando haya un juego listo.",
  ),
  printCard: c("Print this card", "Imprimir esta tarjeta"),
  printCoach: c(
    "Family Math coaching card · {grade}",
    "Tarjeta de apoyo de Matemáticas en familia · {grade}",
  ),
  lookFor: c("Listen for:", "Escucha si:"),
  ifStuck: c("If they get stuck:", "Si se atasca:"),
  extend: c("To go further:", "Para ir más lejos:"),
  tip: c("Game tip:", "Consejo del juego:"),
  rwTitle: c("Math at home", "Matemáticas en casa"),
  rwLead: c(
    "Activities for {grade} that use things you already have.",
    "Actividades de {grade} con cosas que ya tienen.",
  ),
  printRealworld: c("Family Math at home · {grade}", "Matemáticas en casa · {grade}"),
  materials: c("You need:", "Necesitan:"),
  askThis: c("Ask this:", "Pregunten:"),
  goFurther: c("Go further:", "Vayan más lejos:"),
  printThis: c("Print this activity", "Imprimir esta actividad"),
  resumeTitle: c("Continue your activity", "Continúa tu actividad"),
  resumeText: c(
    "You paused {skill} in {game}, round {n} of {total}. Your place is saved.",
    "Pausaste {skill} en {game}, ronda {n} de {total}. Tu lugar está guardado.",
  ),
  resumeGo: c("Continue", "Continuar"),
  resumeConflict: c("Choose Continue to return to the saved activity, or start the selected skill below.", "Elige Continuar para volver a la actividad guardada o inicia la destreza elegida abajo."),
  moreTitle: c("More ways to practice", "Más maneras de practicar"),
  tonightTitle: c("Tonight’s Math", "Matemáticas de hoy"),
  tonightText: c(
    "A separate five-part path from the Fluency Lab, built from your learner’s saved Fluency Lab practice.",
    "Un camino aparte de cinco partes del laboratorio de fluidez, basado en la práctica guardada allí.",
  ),
  labTitle: c("The full Fluency Lab", "El laboratorio de fluidez completo"),
  labText: c(
    "Skills, games and tools from the whole Math Fluency Lab.",
    "Destrezas, juegos y herramientas de todo el laboratorio de fluidez.",
  ),
  backLab: c("Back to the Fluency Lab", "Volver al laboratorio de fluidez"),
  errorTitle: c("Something went wrong loading this page.", "Algo salió mal al cargar esta página."),
  errorText: c("Reload the page, or try", "Recarga la página o prueba"),
  savedReplace: c(
    "Starting a new session replaces your saved activity.",
    "Empezar una sesión nueva reemplaza tu actividad guardada.",
  ),
  elseText: c(
    "Want to choose something else?",
    "¿Quieres elegir otra cosa?",
  ),
  elseLink: c(
    "Browse skills and games",
    "Explorar destrezas y juegos",
  ),
  missionTheme: c(
    "Today’s focus: {theme}",
    "Enfoque de hoy: {theme}",
  ),
  missionLead: c(
    "Start the whole mission above, or open any one skill.",
    "Empieza toda la misión arriba o abre una sola destreza.",
  ),
  practiceThis: c(
    "Practice this skill",
    "Practicar esta destreza",
  ),
  practiceThisAria: c(
    "Practice this skill: {skill} ({game})",
    "Practicar esta destreza: {skill} ({game})",
  ),
  resumeSession: c(
    "It is part of a longer session.",
    "Es parte de una sesión más larga.",
  ),
  coachForPicked: c(
    "For {skill}, the skill you chose.",
    "Para {skill}, la destreza que elegiste.",
  ),
  moreIdeas: c(
    "More ideas",
    "Más ideas",
  ),
  progressNote: c(
    "Stars show practice saved on this device. They do not measure mastery.",
    "Las estrellas muestran la práctica guardada en este dispositivo. No miden el dominio.",
  ),
  weekSummary: c(
    "This week’s summary",
    "Resumen de esta semana",
  ),
  skillDetails: c(
    "Details",
    "Detalles",
  ),
  standardLabel: c(
    "Standard:",
    "Estándar:",
  ),
  searchNone: c(
    "No skills match “{q}”. Try a shorter word.",
    "Ninguna destreza coincide con «{q}». Prueba con una palabra más corta.",
  ),
  searchCount: c(
    "{n} matching skills",
    "{n} destrezas coinciden",
  ),
  guidedResumeTitle: c(
    "Continue your guided session",
    "Continúa tu sesión guiada",
  ),
  guidedResumeText: c(
    "You started a guided session on {skill}. Your place is saved.",
    "Empezaste una sesión guiada sobre {skill}. Tu lugar está guardado.",
  ),
};

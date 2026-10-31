// English and Spanish for the Fluency Lab 4.0 family home additions: grade chips, optional-practice note, grown-up guide,
// short routines, topic cards and the links to achievements and the report. Adult lines use ustedes; lines spoken to the
// child use tú.
const c = (en, es) => ({ en, es });

export const COPY4 = {
  gradeGroup: c("Choose a grade", "Elige un grado"),
  gradeChip: c("Grade {n}", "Grado {n}"),
  gradeChipK: c("Kindergarten", "Jardín de niños"),
  optionalTitle: c("All practice here is optional.", "Toda la práctica aquí es opcional."),
  optionalText: c(
    "Skip a day, stop early or pick it up next week. Nothing is lost and nobody is graded.",
    "Pueden saltarse un día, parar antes o retomarlo la próxima semana. No se pierde nada y nadie recibe una nota.",
  ),
  guideTitle: c("For grown-ups: how this works", "Para los adultos: cómo funciona"),
  guideSteps: c(
    "Sit nearby and let your learner click and type. You do not need to know every answer.|After a game, ask one question: “How did you figure that out?”|Stop whenever it stops being fun. Five good minutes are plenty.",
    "Siéntense cerca y dejen que su estudiante haga clic y escriba. No necesitan saber todas las respuestas.|Después de un juego, hagan una pregunta: «¿Cómo lo averiguaste?»|Paren cuando deje de ser divertido. Cinco buenos minutos son suficientes.",
  ),
  routinesTitle: c("Short routines", "Rutinas cortas"),
  routinesLead: c(
    "Pick one. Each starts in one tap and stays short. Choose what fits your evening.",
    "Elijan una. Cada una empieza con un toque y es corta. Escojan la que encaje con su noche.",
  ),
  routineQuick: c("5-minute warm-up", "Calentamiento de 5 minutos"),
  routineQuickText: c(
    "Two short activities picked from your learner’s recent practice. Good for a busy night.",
    "Dos actividades cortas elegidas según la práctica reciente de su estudiante. Buena para una noche con prisa.",
  ),
  routineSteady: c("10-minute practice", "Práctica de 10 minutos"),
  routineSteadyText: c(
    "A warm-up, a main skill and a stretch. The usual choice when there is a little more time.",
    "Un calentamiento, una destreza principal y un reto. La opción de siempre cuando hay un poco más de tiempo.",
  ),
  routineGuided: c("Guided session", "Sesión guiada"),
  routineGuidedText: c(
    "One idea to learn, a few problems, a game and a chance to explain. We choose the skill. About 10 minutes.",
    "Una idea para aprender, unos problemas, un juego y una oportunidad de explicar. Nosotros elegimos la destreza. Unos 10 minutos.",
  ),
  routineMin: c("{n} min", "{n} min"),
  routineStart: c("Start {name}", "Empezar: {name}"),
  routineNote: c("Based on grade {grade}. You can change the grade above.", "Según el grado {grade}. Pueden cambiar el grado arriba."),
  topicsTitle: c("Find a skill by topic", "Encuentra una destreza por tema"),
  topicsLead: c("Tap a topic to see its skills for this grade.", "Toca un tema para ver sus destrezas de este grado."),
  topicSkills: c("{n} skills", "{n} destrezas"),
  topicSkill: c("1 skill", "1 destreza"),
  topicOpen: c("Show skills: {topic}", "Ver destrezas: {topic}"),
  celebrateTitle: c("Celebrate what is growing", "Celebren lo que va creciendo"),
  celebrateText: c(
    "See badges, goals and a printable report built from real practice. Nothing here is a grade.",
    "Vean insignias, metas y un informe para imprimir hechos con práctica real. Nada de esto es una nota.",
  ),
  achievementsLink: c("My achievements", "Mis logros"),
  reportLink: c("Printable report", "Informe para imprimir"),
};

// Goal setting: the drop-down options that are the same for every grade band (time frames, how-well measures,
// check-in rhythms, supports for teachers and families, the self-rating scale, reflection prompts, sheet labels).
// Every entry is [English, Spanish]. Pure data: the form, the lab page, the preview and the Word file all read it.

export const TIMEFRAMES = [
  { id: "4w", weeks: 4, label: ["4 weeks", "4 semanas"] },
  { id: "6w", weeks: 6, label: ["6 weeks", "6 semanas"] },
  { id: "9w", weeks: 9, label: ["9 weeks (one quarter)", "9 semanas (un trimestre)"] },
  { id: "18w", weeks: 18, label: ["18 weeks (one semester)", "18 semanas (un semestre)"] },
  { id: "36w", weeks: 36, label: ["The school year", "El año escolar"] },
];

/** How well, how often: appended to the teacher's goal sentence. */
export const MEASURES = [
  {
    id: "4of5",
    teacher: ["in 4 out of 5 attempts", "en 4 de 5 intentos"],
    student: ["4 out of 5 times", "4 de cada 5 veces"],
  },
  {
    id: "3of4",
    teacher: ["in 3 out of 4 attempts", "en 3 de 4 intentos"],
    student: ["3 out of 4 times", "3 de cada 4 veces"],
  },
  {
    id: "daily",
    teacher: ["in daily class routines", "en las rutinas diarias de la clase"],
    student: ["every day", "todos los días"],
  },
  {
    id: "weekly",
    teacher: ["at least once a week", "al menos una vez por semana"],
    student: ["every week", "cada semana"],
  },
  {
    id: "indep",
    teacher: ["independently on 3 different tasks", "de forma independiente en 3 tareas distintas"],
    student: ["on my own, 3 times", "yo solo, 3 veces"],
  },
  {
    id: "rubric",
    teacher: ["at a 3 or higher on the class rubric", "con un 3 o más en la rúbrica de la clase"],
    student: ["at a 3 or higher on our rubric", "con un 3 o más en nuestra rúbrica"],
  },
  {
    id: "most",
    teacher: [
      "most of the time, observed by the teacher",
      "casi siempre, según observa el docente",
    ],
    student: ["most of the time", "casi siempre"],
  },
];

export const CHECKINS = [
  { id: "weekly", days: 7, label: ["Every week", "Cada semana"] },
  { id: "biweekly", days: 14, label: ["Every 2 weeks", "Cada 2 semanas"] },
  { id: "monthly", days: 28, label: ["Every 4 weeks", "Cada 4 semanas"] },
];

/** The student's own rating at each check-in. Words and shapes, never a grade. */
export const SCALE = [
  { n: 1, mark: "◔", label: ["Just starting", "Empezando"] },
  { n: 2, mark: "◑", label: ["Getting there", "Avanzando"] },
  { n: 3, mark: "◕", label: ["I can do it", "Lo logro"] },
  { n: 4, mark: "●", label: ["I can teach it", "Puedo enseñarlo"] },
];

export const TEACHER_SUPPORTS = [
  {
    id: "frames",
    label: ["Sentence frames and word banks", "Marcos de oraciones y bancos de palabras"],
  },
  { id: "visuals", label: ["Pictures, diagrams and gestures", "Imágenes, diagramas y gestos"] },
  {
    id: "model",
    label: [
      "Model the task first, then practice together",
      "Modelar la tarea y luego practicar juntos",
    ],
  },
  {
    id: "partner",
    label: ["Partner or small-group practice", "Práctica en pareja o en grupo pequeño"],
  },
  {
    id: "time",
    label: ["Extra time to think and respond", "Tiempo extra para pensar y responder"],
  },
  {
    id: "native",
    label: [
      "Chances to use home language to plan",
      "Oportunidades de usar el idioma del hogar para planificar",
    ],
  },
  {
    id: "feedback",
    label: [
      "Specific feedback on one thing at a time",
      "Comentarios específicos sobre una cosa a la vez",
    ],
  },
  {
    id: "texts",
    label: [
      "Texts at the right level on the same topic",
      "Textos del nivel adecuado sobre el mismo tema",
    ],
  },
  {
    id: "tech",
    label: ["Audio, read-aloud or recording tools", "Audio, lectura en voz alta o grabación"],
  },
  {
    id: "conference",
    label: [
      "A short goal conference every two weeks",
      "Una conversación breve sobre la meta cada dos semanas",
    ],
  },
];

export const FAMILY_SUPPORTS = [
  {
    id: "talk",
    label: [
      "Talk about the day in any language, 10 minutes",
      "Conversar sobre el día en cualquier idioma, 10 minutos",
    ],
  },
  {
    id: "read",
    label: [
      "Read together or listen to a story at home",
      "Leer juntos o escuchar un cuento en casa",
    ],
  },
  {
    id: "ask",
    label: [
      "Ask: What did you learn? How did you say it in English?",
      "Preguntar: ¿Qué aprendiste? ¿Cómo lo dijiste en inglés?",
    ],
  },
  {
    id: "practice",
    label: [
      "Practice on The Language Page a few minutes a day",
      "Practicar en The Language Page unos minutos al día",
    ],
  },
  {
    id: "celebrate",
    label: ["Celebrate effort and new words", "Celebrar el esfuerzo y las palabras nuevas"],
  },
  {
    id: "write",
    label: ["Write a short note or list together", "Escribir juntos una nota o una lista corta"],
  },
  {
    id: "space",
    label: [
      "A quiet place and time for practice",
      "Un lugar y un momento tranquilos para practicar",
    ],
  },
  {
    id: "share",
    label: ["Tell the teacher what is working at home", "Contarle al docente qué funciona en casa"],
  },
];

export const REFLECTIONS = [
  { id: "proud", label: ["One thing I did well:", "Algo que hice bien:"] },
  { id: "hard", label: ["One thing that is still hard:", "Algo que todavía me cuesta:"] },
  { id: "help", label: ["Help I need next:", "La ayuda que necesito ahora:"] },
  {
    id: "new",
    label: ["A new word or sentence I can use:", "Una palabra u oración nueva que puedo usar:"],
  },
  { id: "change", label: ["What I will change next time:", "Lo que cambiaré la próxima vez:"] },
  { id: "evidence", label: ["Work that shows my progress:", "Trabajo que muestra mi progreso:"] },
];

export const CELEBRATIONS = [
  { id: "share", label: ["Share my work with the class", "Compartir mi trabajo con la clase"] },
  { id: "home", label: ["Show my family", "Mostrárselo a mi familia"] },
  { id: "new", label: ["Set a new goal", "Fijar una meta nueva"] },
  { id: "teach", label: ["Teach a classmate", "Enseñarle a un compañero"] },
  { id: "badge", label: ["Add it to my portfolio", "Agregarlo a mi portafolio"] },
];

export const SHEET_STYLES = [
  {
    id: "student",
    label: ["Student goal sheet (my words)", "Hoja de metas del estudiante (mis palabras)"],
  },
  {
    id: "teacher",
    label: [
      "Teacher record (measurable goals and supports)",
      "Registro del docente (metas medibles y apoyos)",
    ],
  },
  { id: "both", label: ["Both on one sheet", "Ambos en una hoja"] },
];

export const LANGS = [
  { id: "en", label: ["English", "Inglés"] },
  { id: "es", label: ["Spanish", "Español"] },
  { id: "both", label: ["English and Spanish", "Inglés y español"] },
];

export const LEVELS = [
  "",
  "1.0",
  "1.5",
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
  "5.5",
  "6.0",
];

/** Fixed words on the sheet itself. */
export const LABELS = {
  title: ["My Language Goals", "Mis metas de lenguaje"],
  titleTeacher: ["Language Goal Plan", "Plan de metas de lenguaje"],
  student: ["Name", "Nombre"],
  grade: ["Grade", "Grado"],
  teacher: ["Teacher", "Docente"],
  school: ["School", "Escuela"],
  level: ["Current level", "Nivel actual"],
  start: ["Start date", "Fecha de inicio"],
  until: ["Review by", "Revisar antes del"],
  goal: ["Goal", "Meta"],
  focus: ["Focus", "Enfoque"],
  myGoal: ["My goal", "Mi meta"],
  measure: ["I will know I did it when I can do it", "Sabré que lo logré cuando pueda hacerlo"],
  measureT: ["Measure", "Medida"],
  steps: ["My steps", "Mis pasos"],
  evidence: ["I will show my progress with", "Mostraré mi progreso con"],
  teacherSup: ["How my teacher will help", "Cómo me ayudará mi docente"],
  familySup: ["How my family can help", "Cómo puede ayudar mi familia"],
  checkins: ["Check-ins", "Revisiones"],
  date: ["Date", "Fecha"],
  rating: ["How I feel (circle)", "Cómo me siento (encierra)"],
  note: ["What I noticed", "Lo que noté"],
  reflect: ["Reflect", "Reflexiona"],
  celebrate: ["When I reach my goal I will", "Cuando logre mi meta voy a"],
  sign: ["Signatures", "Firmas"],
  signStudent: ["Student", "Estudiante"],
  signTeacher: ["Teacher", "Docente"],
  signFamily: ["Family", "Familia"],
  practice: ["Practice on The Language Page", "Practica en The Language Page"],
  notes: ["Notes", "Notas"],
  made: [
    "Made with The Language Page · thelanguagepage.com",
    "Hecho con The Language Page · thelanguagepage.com",
  ],
  privacy: [
    "Practice goals only. Not an official ACCESS score.",
    "Solo metas de práctica. No es un puntaje oficial de ACCESS.",
  ],
};

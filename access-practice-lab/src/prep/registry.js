// Access Prep skill builders: one list of the skills, their names, steps and how-to lines. The hub reads it to
// draw the cards without loading the skills themselves; each skill module reads its own entry.
export const PREP_SKILLS = {
  "notes": {
  slug: "notes",
  title: "Listen & Take Notes",
  titleEs: "Escucha y toma notas",
  domain: "Listening",
  domainLabel: ["Listening", "Escuchar"],
  icon: "listening",
  blurb: [
    "Hear a short class talk, keep the key ideas as notes, and use your notes to answer questions.",
    "Escucha una charla corta de clase, guarda las ideas clave como notas y usa tus notas para responder.",
  ],
  how: [
    [
      "Learn the key words and the signal words first.",
      "Primero aprende las palabras clave y las palabras señal.",
    ],
    [
      "Listen as many times as you need. You can slow it down.",
      "Escucha las veces que necesites. Puedes hacerlo más lento.",
    ],
    [
      "Pick short notes: one main idea and three details.",
      "Elige notas cortas: una idea principal y tres detalles.",
    ],
    [
      "Answer from your notes, then see the talk.",
      "Responde con tus notas y luego mira la charla.",
    ],
  ],
  steps: [
    ["Get ready", "Prepárate"],
    ["Listen", "Escucha"],
    ["Take notes", "Toma notas"],
    ["Use your notes", "Usa tus notas"],
    ["Look back", "Repasa"],
  ],
},
  "data-talk": {
  slug: "data-talk",
  title: "Data Talk",
  titleEs: "Hablemos de datos",
  domain: "Writing",
  domainLabel: ["Reading · Writing", "Leer · Escribir"],
  icon: "grid",
  blurb: [
    "Read a graph, compare the numbers, and explain what the data shows in clear sentences.",
    "Lee una gráfica, compara los números y explica lo que muestran los datos con oraciones claras.",
  ],
  how: [
    [
      "Look at the title, the labels and the unit first.",
      "Primero mira el título, las etiquetas y la unidad.",
    ],
    ["Answer questions about the numbers.", "Responde preguntas sobre los números."],
    [
      "Build a sentence that compares, then write your own.",
      "Arma una oración que compare y luego escribe la tuya.",
    ],
  ],
  steps: [
    ["Look closely", "Observa"],
    ["Read the data", "Lee los datos"],
    ["Build a sentence", "Arma una oración"],
    ["Your turn", "Tu turno"],
  ],
},
  "raters-eye": {
  slug: "raters-eye",
  title: "Rater's Eye",
  titleEs: "Ojo de evaluador",
  domain: "Speaking",
  domainLabel: ["Speaking · Writing", "Hablar · Escribir"],
  icon: "evidence",
  blurb: [
    "Compare three student answers to the same task, find what makes one stronger, then make a weak answer better.",
    "Compara tres respuestas de estudiantes a la misma tarea, descubre qué hace más fuerte a una y mejora una respuesta débil.",
  ],
  how: [
    ["Read or hear the task and three answers.", "Lee o escucha la tarea y tres respuestas."],
    ["Rank them from strongest to weakest.", "Ordénalas de la más fuerte a la más débil."],
    [
      "Name what makes the strongest answer strong.",
      "Nombra lo que hace fuerte a la mejor respuesta.",
    ],
    [
      "Upgrade the weakest answer, word by word.",
      "Mejora la respuesta más débil, palabra por palabra.",
    ],
  ],
  steps: [
    ["The task", "La tarea"],
    ["Three answers", "Tres respuestas"],
    ["Rank them", "Ordénalas"],
    ["What makes it strong", "Qué la hace fuerte"],
    ["Upgrade", "Mejora"],
  ],
},
  "word-meanings": {
    slug: "word-meanings",
    title: "Two Meanings",
    titleEs: "Dos significados",
    domain: "Reading",
    domainLabel: ["Vocabulary", "Vocabulario"],
    icon: "words",
    blurb: [
      "Many school words have an everyday meaning and a math, science or social studies meaning. Learn to tell which one a sentence uses.",
      "Muchas palabras escolares tienen un significado de todos los días y otro de matemáticas, ciencias o estudios sociales. Aprende a saber cuál usa una oración.",
    ],
    how: [
      ["Meet four words and both of their meanings.", "Conoce cuatro palabras y sus dos significados."],
      ["Decide which meaning each sentence uses.", "Decide qué significado usa cada oración."],
      ["Answer test-style questions about the words.", "Responde preguntas tipo examen sobre las palabras."],
      ["Write your own sentence the school way.", "Escribe tu propia oración con el significado escolar."],
    ],
    steps: [
      ["Meet the words", "Conoce las palabras"],
      ["Which meaning?", "¿Qué significado?"],
      ["Test questions", "Preguntas tipo examen"],
      ["Your turn", "Tu turno"],
    ],
  },
  "text-structures": {
    slug: "text-structures",
    title: "Text Structures",
    titleEs: "Estructuras de texto",
    domain: "Reading",
    domainLabel: ["Reading", "Leer"],
    icon: "reading",
    blurb: [
      "Find how a text is organized from its signal words, then fill in the organizer that fits.",
      "Descubre cómo está organizado un texto por sus palabras señal y completa el organizador que le corresponde.",
    ],
    how: [
      ["Learn the five ways texts are organized.", "Aprende las cinco formas de organizar un texto."],
      ["Read three short texts and name each structure.", "Lee tres textos cortos y nombra cada estructura."],
      ["See the signal words, then fill the organizer.", "Mira las palabras señal y completa el organizador."],
    ],
    steps: [
      ["Five structures", "Cinco estructuras"],
      ["Text 1", "Texto 1"],
      ["Text 2", "Texto 2"],
      ["Text 3", "Texto 3"],
      ["Look back", "Repasa"],
    ],
  },
  "task-words": {
    slug: "task-words",
    title: "Task Words",
    titleEs: "Palabras de tarea",
    domain: "Writing",
    domainLabel: ["Speaking · Writing", "Hablar · Escribir"],
    icon: "flag",
    blurb: [
      "Describe, explain, compare, sequence, argue, summarize: find the word that tells you what to do, and choose the answer that does it.",
      "Describir, explicar, comparar, ordenar, argumentar, resumir: encuentra la palabra que te dice qué hacer y elige la respuesta que lo hace.",
    ],
    how: [
      ["Learn what each task word asks for.", "Aprende lo que pide cada palabra de tarea."],
      ["Find the task word in three prompts.", "Encuentra la palabra de tarea en tres consignas."],
      ["Check what a complete answer needs, then pick the answer that does the task.", "Revisa lo que necesita una respuesta completa y elige la que cumple la tarea."],
    ],
    steps: [
      ["Six task words", "Seis palabras de tarea"],
      ["Prompt 1", "Consigna 1"],
      ["Prompt 2", "Consigna 2"],
      ["Prompt 3", "Consigna 3"],
      ["Look back", "Repasa"],
    ],
  },
  "daily-drill": {
    slug: "daily-drill",
    title: "Language Path & Micro-Drills",
    titleEs: "Ruta y microejercicios",
    domain: "Reading",
    domainLabel: ["All 4 Skills · Micro-Drills", "Las 4 destrezas · Microejercicios"],
    icon: "sparkle",
    blurb: [
      "Five bite-sized steps per set: match academic words, listen at normal or slow speed, fill context clues, forge a stronger sentence, and review.",
      "Cinco pasos cortos por conjunto: une palabras académicas, escucha a velocidad normal o lenta, completa pistas de contexto, forja una oración más sólida y repasa.",
    ],
    how: [
      [
        "Match four school words to their meanings with normal or slow audio.",
        "Une cuatro palabras escolares con su significado usando audio normal o lento.",
      ],
      [
        "Listen to a spoken academic sentence and build its parts in order.",
        "Escucha una oración académica y arma sus partes en orden.",
      ],
      [
        "Use tap-a-word hints to fill the missing words in a short passage.",
        "Usa pistas por palabra para completar las palabras que faltan en un texto corto.",
      ],
      [
        "Upgrade an everyday sentence into a precise school sentence and review.",
        "Mejora una oración cotidiana hasta convertirla en una oración escolar precisa y repasa.",
      ],
    ],
    steps: [
      ["Match words", "Une palabras"],
      ["Listen & build", "Escucha y arma"],
      ["Context clues", "Pistas de contexto"],
      ["Sentence forge", "Forja la oración"],
      ["Mastery review", "Repaso final"],
    ],
  },
  "extempore-speak": {
    slug: "extempore-speak",
    title: "Extempore Speaking Lab",
    titleEs: "Laboratorio oral Extempore",
    domain: "Speaking",
    domainLabel: ["Speaking · Oral Discourse", "Hablar · Discurso oral"],
    icon: "speaking",
    blurb: [
      "Hear a teacher prompt and a model student, then respond across Tier A, Tier B, and Tier C turns with voice recording, live self-check, and model comparison.",
      "Escucha la consigna docente y a un estudiante modelo, y luego responde en turnos de Nivel A, Nivel B y Nivel C con grabación de voz, autoevaluación en vivo y comparación con el modelo.",
    ],
    how: [
      [
        "Study the visual data card and hear the teacher prompt and model student.",
        "Observa la tarjeta de datos y escucha la consigna docente y al estudiante modelo.",
      ],
      [
        "Build and rehearse Turn 1 (Describe) and Turn 2 (Explain how or why).",
        "Arma y ensaya el Turno 1 (Describir) y el Turno 2 (Explicar cómo o por qué).",
      ],
      [
        "Speak or type your Turn 3 extended response with a live 3-part checklist.",
        "Di o escribe tu respuesta extendida en el Turno 3 con una lista de verificación en vivo.",
      ],
      [
        "Compare your three turns side by side with the model student and family card.",
        "Compara tus tres turnos lado a lado con el estudiante modelo y la tarjeta familiar.",
      ],
    ],
    steps: [
      ["Prompt & model", "Consigna y modelo"],
      ["Turn 1 · Describe", "Turno 1 · Describe"],
      ["Turn 2 · Explain", "Turno 2 · Explica"],
      ["Turn 3 · Speak", "Turno 3 · Habla"],
      ["Compare & share", "Compara y comparte"],
    ],
  },
};

export const PREP_SKILL_LIST = Object.values(PREP_SKILLS);
export const isPrepSkill = (slug) => Object.hasOwn(PREP_SKILLS, slug || "");

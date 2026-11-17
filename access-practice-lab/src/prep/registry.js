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
};

export const PREP_SKILL_LIST = Object.values(PREP_SKILLS);
export const isPrepSkill = (slug) => Object.hasOwn(PREP_SKILLS, slug || "");

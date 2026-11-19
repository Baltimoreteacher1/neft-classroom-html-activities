// Every sentence the class intelligence panel shows, in English and Spanish. `S(en, es)` picks the language
// (src/i18n.js makeI18n). Plain language, counts and quotes only: no score, level, percent, timer or proficiency label.

const DOMAIN = {
  Listening: ["Listening", "Escuchar"],
  Speaking: ["Speaking", "Hablar"],
  Reading: ["Reading", "Leer"],
  Writing: ["Writing", "Escribir"],
};

/** The four observable needs of src/lang/teacher.js CONFERENCE_NEEDS, as "students <how>". */
const NEED = {
  "cohesion-explain": [
    "link their ideas in more than one way when they explain",
    "unir sus ideas de más de una manera al explicar",
  ],
  "tense-narrate": [
    "keep finished events in the past tense when they retell",
    "mantener en pasado los hechos terminados al relatar",
  ],
  "evidence-argue": [
    "name a detail or number from the source to back up a claim",
    "nombrar un dato o número de la fuente para apoyar una afirmación",
  ],
  "precision-inform": [
    "use exact subject words when they inform",
    "usar palabras exactas de la materia al informar",
  ],
};

/** Strength ids from the Language Intelligence Engine (src/intel/wording.js STRENGTH_TEXT), as "students <phrase>". */
const STRENGTH = {
  links: ["linking their ideas in more than one way", "unir sus ideas de más de una manera"],
  source: ["pointing to the source to support what they say", "señalar la fuente para apoyar lo que dicen"],
  complex: ["holding two ideas together in one sentence", "mantener dos ideas juntas en una oración"],
  "noun-phrase": ["packing detail into the words around a noun", "poner detalle en las palabras alrededor de un sustantivo"],
  "subject-words": ["using exact subject words", "usar palabras exactas de la materia"],
  "own-words": ["putting their ideas into their own words", "poner sus ideas en sus propias palabras"],
  move: ["making a move the task asks for", "hacer un paso que pide la tarea"],
};

/** Ledger features (src/lang/ledger.js FEATURES) that a student does better on with supports than alone. */
const FEATURE = {
  words: ["how much they write or say", "cuánto escriben o dicen"],
  link: ["linking ideas", "unir ideas"],
  cites: ["using the source", "usar la fuente"],
  moves: ["the moves of the genre", "los pasos del género"],
  complex: ["sentences with more than one idea", "oraciones con más de una idea"],
  errs: ["sentence patterns", "patrones de oración"],
  academic: ["exact subject words", "palabras exactas de la materia"],
};

const list = (S, names, max = 4) => {
  const shown = names.slice(0, max).join(", ");
  return names.length > max
    ? S(`${shown} and ${names.length - max} more`, `${shown} y ${names.length - max} más`)
    : shown;
};
const plural = (S, n, one, many, uno, muchos) =>
  S(`${n} ${n === 1 ? one : many}`, `${n} ${n === 1 ? uno : muchos}`);

export function copy(S) {
  const dom = (d) => S(...DOMAIN[d]);
  const students = (n) => plural(S, n, "student", "students", "estudiante", "estudiantes");
  const items = (n) =>
    plural(
      S,
      n,
      "practice item",
      "practice items",
      "actividad de práctica",
      "actividades de práctica",
    );
  return {
    dom,
    students,
    items,
    title: S("Class intelligence", "Inteligencia de la clase"),
    lead: S(
      "What students did, what they do well, and the one thing to teach next. Counts and students' own words only.",
      "Lo que hicieron los estudiantes, lo que hacen bien y lo único que enseñar después. Solo conteos y las palabras de los estudiantes.",
    ),
    classLabel: S("Class", "Clase"),
    refresh: S("Refresh", "Actualizar"),
    langName: S("Language", "Idioma"),
    summary: (s) =>
      S(
        `${students(s.students)}. ${s.weekActive} practiced this week (${items(s.weekItems)}).`,
        `${students(s.students)}. ${s.weekActive} practicaron esta semana (${items(s.weekItems)}).`,
      ),
    next: S("Teach this next", "Enseñar esto después"),
    checkIns: S("Check in with", "Hablar con"),
    checkInsNone: S(
      "No one stands out right now. Everyone with practice shared is on track.",
      "Nadie destaca ahora. Todos los que compartieron práctica van bien.",
    ),
    more: (n) => S(`${n} more`, `${n} más`),
    didHeading: S("What they did", "Lo que hicieron"),
    strengthHeading: S("Strength", "Fortaleza"),
    moveHeading: S("Next move", "Próximo paso"),
    did: (c) => {
      const base = c.items
        ? S(
            `${items(c.items)} from ${students(c.practised)}.`,
            `${items(c.items)} de ${students(c.practised)}.`,
          )
        : S("No practice yet.", "Todavía no hay práctica.");
      return c.own + c.supported
        ? `${base} ${S(`${c.own} first tries on their own, ${c.supported} with supports.`, `${c.own} primeros intentos solos, ${c.supported} con apoyos.`)}`
        : base;
    },
    strength: (c) => {
      const s = c.strength;
      if (!s) {
        return {
          text: S(
            "A strength appears here once a student shares their own work. Ask for a Passport code.",
            "Una fortaleza aparece aquí cuando un estudiante comparte su propio trabajo. Pida un código de Pasaporte.",
          ),
          quote: null,
        };
      }
      if (s.kind === "skill") {
        return {
          text: S(
            `Seen in ${students(s.n)}: “${s.skill}” right on their own (${s.right} first tries).`,
            `Se vio en ${students(s.n)}: “${s.skill}” acertado solo (${s.right} primeros intentos).`,
          ),
          quote: null,
        };
      }
      const phrase = STRENGTH[s.id] || STRENGTH.move;
      return {
        text: S(`Seen in ${students(s.n)}: ${phrase[0]}.`, `Se vio en ${students(s.n)}: ${phrase[1]}.`),
        quote: { alias: s.example.alias, text: s.example.quote },
      };
    },
    move: (c) => {
      const m = c.move;
      const d = dom(c.domain).toLowerCase();
      if (m.kind === "need") {
        const how = NEED[m.need] || NEED["cohesion-explain"];
        return {
          title: S(`Show how to ${how[0]}.`, `Muestre cómo ${how[1]}.`),
          why: S(
            `${list(S, m.members)} did not yet do this in their first tries.`,
            `${list(S, m.members)} todavía no lo hicieron en sus primeros intentos.`,
          ),
        };
      }
      if (m.kind === "skill") {
        return {
          title: S(
            `Re-teach “${m.skill}” in a short group.`,
            `Vuelva a enseñar “${m.skill}” en un grupo corto.`,
          ),
          why: S(
            `${list(S, m.members)} missed it on their own (${m.missed} first tries).`,
            `${list(S, m.members)} no lo lograron solos (${m.missed} primeros intentos).`,
          ),
        };
      }
      if (m.kind === "start") {
        return {
          title: S(`Start ${d} with one short activity.`, `Empiece ${d} con una actividad corta.`),
          why: S("No one has practiced it yet.", "Nadie lo ha practicado todavía."),
        };
      }
      if (m.kind === "balance") {
        return {
          title: S(`Add one more ${d} activity.`, `Agregue una actividad más de ${d}.`),
          why: S(
            "This is the skill your class has practiced the least.",
            "Es la destreza que su clase ha practicado menos.",
          ),
        };
      }
      return {
        title: S(`Keep ${d} going with one more activity.`, `Siga con ${d} con una actividad más.`),
        why: S(
          "Nothing needs fixing here. Steady practice is the move.",
          "Aquí no hay nada que arreglar. La práctica constante es el paso.",
        ),
      };
    },
    reason: (r) => {
      if (r.id === "quiet")
        return S(
          "No practice yet. A hello and one short first activity can start things.",
          "Todavía no practica. Un saludo y una actividad corta pueden empezar.",
        );
      if (r.id === "idle")
        return S(`No practice in ${r.days} days.`, `No practica desde hace ${r.days} días.`);
      if (r.id === "alone") {
        const f = r.features.map((k) => S(...FEATURE[k])).join(", ");
        return S(
          `Does better with supports than alone: ${f}.`,
          `Le va mejor con apoyos que solo: ${f}.`,
        );
      }
      const d = r.domains.map((x) => dom(x)).join(", ");
      return S(`No practice yet in ${d}.`, `Todavía no practica en ${d}.`);
    },
    assign: {
      toClass: (n, title) => S(`Assign ${n} to ${title}`, `Asignar ${n} a ${title}`),
      activities: (n) => plural(S, n, "activity", "activities", "actividad", "actividades"),
      open: S("Open the first activity", "Abrir la primera actividad"),
      copy: S("Copy link", "Copiar enlace"),
      copied: S("Link copied.", "Enlace copiado."),
      added: (titles, title) =>
        S(
          `Added to ${title}: ${titles.join("; ")}. Students see it under Assigned practice.`,
          `Agregado a ${title}: ${titles.join("; ")}. Los estudiantes lo ven en Práctica asignada.`,
        ),
      none: S(
        "Everything for this grade and skill is already assigned or not available yet.",
        "Todo para este grado y destreza ya está asignado o aún no está disponible.",
      ),
      failed: S(
        "Could not assign right now. Try again, or open the class panel.",
        "No se pudo asignar ahora. Intente de nuevo o abra el panel de la clase.",
      ),
      busy: S("Assigning…", "Asignando…"),
    },
    empty: {
      noneTitle: S("Start with one of these", "Empiece con una de estas opciones"),
      create: S("Create a class and share the code", "Crear una clase y compartir el código"),
      passport: S("Add a student's Passport code", "Agregar un código de Pasaporte"),
      sample: S("Look at a sample class", "Ver una clase de muestra"),
      noStudents: S(
        "No students have joined this class yet. Share the class code, then come back.",
        "Todavía no se une ningún estudiante a esta clase. Comparta el código y regrese.",
      ),
      shareCode: S("Open the class code", "Abrir el código de clase"),
      noBand: (bands) =>
        S(
          `No students in this grade band yet. Students shared here are in: ${bands.join(", ")}.`,
          `Todavía no hay estudiantes en esta banda. Los estudiantes compartidos están en: ${bands.join(", ")}.`,
        ),
      noMatch: S(
        "No shared Passport matches this class's nicknames, so strengths need a Passport code.",
        "Ningún Pasaporte compartido coincide con los apodos de esta clase, así que las fortalezas necesitan un código de Pasaporte.",
      ),
      offline: S(
        "Could not reach the class right now. Showing what is saved on this device.",
        "No se pudo llegar a la clase ahora. Se muestra lo guardado en este dispositivo.",
      ),
    },
    sample: S(
      "Sample class. These are made-up students.",
      "Clase de muestra. Son estudiantes inventados.",
    ),
    exit: S("Leave the sample", "Salir de la muestra"),
    sources: {
      live: (t) => t,
      roster: S("Passport codes on this device", "Códigos de Pasaporte en este dispositivo"),
      section: (n) => S(`Section ${n}`, `Sección ${n}`),
    },
    deeper: S("Go deeper", "Ver más a fondo"),
    deeperLinks: {
      evidence: S("Class evidence and groups", "Evidencia de la clase y grupos"),
      review: S("Speaking and writing review", "Revisión de habla y escritura"),
      live: S("Live class and class code", "Clase en vivo y código de clase"),
      studio: S(
        "Official ACCESS and MODEL scores: Data Studio",
        "Puntajes oficiales de ACCESS y MODEL: Estudio de datos",
      ),
    },
    fine: S(
      "From practice on these devices. Not an ACCESS or WIDA score and not a proficiency level. Use your own judgment.",
      "De la práctica en estos dispositivos. No es un puntaje de ACCESS ni de WIDA ni un nivel de dominio. Use su propio criterio.",
    ),
    loading: S("Loading your class…", "Cargando su clase…"),
  };
}

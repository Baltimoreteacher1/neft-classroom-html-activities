/*!
 * mentor-universe.js — yearlong, local-first extension for Math Mentor Unit 0.
 * No network writes. The only fetch is the site's generated curriculum manifest.
 */
(function () {
  "use strict";

  var KEY = "nt_mentor";
  var VERSION = 2;
  var LAB_ORDER = [
    "noticing",
    "balance",
    "drawing",
    "pattern",
    "small-start",
    "reality",
    "record",
    "second-way",
  ];

  var UNIT_INVESTIGATIONS = {
    1: {
      en: "Discovery Map: collect three examples of mathematics in your world. Label what you noticed, what you wondered, and one connection.",
      es: "Mapa de descubrimiento: reúne tres ejemplos de matemáticas en tu mundo. Escribe qué notaste, qué te preguntaste y una conexión.",
    },
    2: {
      en: "Data Detective: gather one class-safe data set, choose a display, and defend which center and spread best describe it.",
      es: "Detective de datos: reúne datos seguros, escoge una gráfica y defiende qué centro y variación los describen mejor.",
    },
    3: {
      en: "Fair Recipe Lab: scale a recipe for three group sizes and prove that every ratio stays equivalent.",
      es: "Laboratorio de recetas: cambia una receta para tres grupos y demuestra que cada razón sigue siendo equivalente.",
    },
    4: {
      en: "Percent Claims Audit: test three sale or survey claims. Model the whole, compute the percent, and revise one misleading claim.",
      es: "Auditoría de porcentajes: prueba tres anuncios o encuestas. Modela el total, calcula y corrige una afirmación engañosa.",
    },
    5: {
      en: "Packaging Studio: design two packages with equal volume, compare surface area, and recommend the more efficient design.",
      es: "Estudio de empaques: diseña dos empaques con el mismo volumen, compara el área de superficie y recomienda el más eficiente.",
    },
    6: {
      en: "Expression Machine: write two different-looking expressions for one situation, evaluate them, and explain whether they are equivalent.",
      es: "Máquina de expresiones: escribe dos expresiones para una situación, evalúalas y explica si son equivalentes.",
    },
    7: {
      en: "Coordinate Rescue: create a map with all four quadrants, give precise movement directions, and verify distance with absolute value.",
      es: "Rescate en coordenadas: crea un mapa con cuatro cuadrantes, da instrucciones y verifica distancias con valor absoluto.",
    },
    8: {
      en: "Two Rules, One Graph: compare two equations, locate where each rule wins, and justify the intersection.",
      es: "Dos reglas, una gráfica: compara dos ecuaciones, encuentra dónde gana cada una y justifica la intersección.",
    },
    9: {
      en: "Relationship Reporter: collect paired data, represent it in a table and graph, then describe the relationship without overstating it.",
      es: "Reportero de relaciones: reúne datos en pares, haz una tabla y gráfica, y describe la relación sin exagerarla.",
    },
    10: {
      en: "Synthesis Exhibit: choose a question from the year, combine at least three representations, and annotate how your strategy changed.",
      es: "Exhibición final: escoge una pregunta del año, combina tres representaciones y explica cómo cambió tu estrategia.",
    },
  };

  var MOMENTS = {
    noticing: {
      en: "Pause before calculating. What structure, quantity, or relationship is already visible in {title}?",
      es: "Pausa antes de calcular. ¿Qué estructura, cantidad o relación ya se ve en {title}?",
    },
    balance: {
      en: "Track what stays equal in {title}. Name any operation you apply to both sides or equivalent forms.",
      es: "Sigue lo que permanece igual en {title}. Nombra la operación que aplicas a ambos lados o formas equivalentes.",
    },
    drawing: {
      en: "Make {title} visible with a diagram, number line, table, or labeled model before using symbols.",
      es: "Haz visible {title} con un dibujo, recta numérica, tabla o modelo antes de usar símbolos.",
    },
    pattern: {
      en: "In {title}, identify what changes, what repeats, and a rule that predicts the next case.",
      es: "En {title}, identifica qué cambia, qué se repite y una regla que predice el caso siguiente.",
    },
    "small-start": {
      en: "Try a friendly case from {title} first. Use what it teaches you to return to the original numbers.",
      es: "Prueba primero un caso sencillo de {title}. Usa lo aprendido para volver a los números originales.",
    },
    reality: {
      en: "Estimate before solving {title}. Afterward, check units, size, sign, and whether the result fits the situation.",
      es: "Estima antes de resolver {title}. Después, revisa unidades, tamaño, signo y si el resultado tiene sentido.",
    },
    record: {
      en: "Keep a strategy record for {title}: first try, evidence, revision, and the reason the revision is stronger.",
      es: "Lleva un registro para {title}: primer intento, evidencia, revisión y por qué la revisión es mejor.",
    },
    "second-way": {
      en: "Connect {title} to an earlier representation or rule. State exactly what is the same and what is different.",
      es: "Conecta {title} con una representación o regla anterior. Explica qué es igual y qué es diferente.",
    },
  };

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function migrate(raw) {
    var old = raw;
    if (typeof raw === "string") old = safeParse(raw) || { id: raw };
    if (!old || typeof old !== "object") old = {};
    var id = old.id || old.mentorId || old.selectedMentor || null;
    return {
      version: VERSION,
      id: typeof id === "string" ? id : null,
      chosenAt: old.chosenAt || null,
      moves: Array.isArray(old.moves) ? old.moves.slice() : [],
      seenStories: Array.isArray(old.seenStories) ? old.seenStories.slice() : [],
      lang: old.lang === "es" ? "es" : "en",
      studio: old.studio && typeof old.studio === "object" ? old.studio : {},
      journey:
        old.journey && typeof old.journey === "object"
          ? old.journey
          : { weeks: {}, moments: {}, experiences: {} },
    };
  }

  function load() {
    var raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (_error) {
      return migrate(null);
    }
    var state = migrate(raw);
    try {
      if (raw && JSON.stringify(safeParse(raw)) !== JSON.stringify(state)) {
        localStorage.setItem(KEY, JSON.stringify(state));
      }
    } catch (_error) {
      /* storage is optional */
    }
    return state;
  }

  function save(state) {
    var next = migrate(state);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (_error) {
      /* local-only progress can still work for this page view */
    }
    return next;
  }

  function update(mutator) {
    var state = load();
    mutator(state);
    return save(state);
  }

  function labForLesson(lesson) {
    var hay = ((lesson.standard || "") + " " + (lesson.title || "")).toLowerCase();
    if (/equation|inequal|equivalent|equal/.test(hay)) return "balance";
    if (/graph|plot|coordinate|area|volume|geometry|histogram|model/.test(hay)) return "drawing";
    if (/pattern|relationship|rate|sequence|function/.test(hay)) return "pattern";
    if (/estimate|factor|multiple|divide|decimal|fraction/.test(hay)) return "small-start";
    if (/percent|measurement|unit|mean|median|data|statistic/.test(hay)) return "reality";
    if (/expression|write|algorithm|explain/.test(hay)) return "record";
    if (/ratio|connect|distribut|property|synthesis/.test(hay)) return "second-way";
    return "noticing";
  }

  function momentFor(lesson, language) {
    var lab = labForLesson(lesson);
    var text = MOMENTS[lab][language === "es" ? "es" : "en"];
    return {
      lessonId: lesson.id,
      lab: lab,
      text: text.replace("{title}", lesson.title),
    };
  }

  function sourcesFor(mentor) {
    var q = encodeURIComponent(mentor.name);
    return [
      {
        label: "MacTutor History of Mathematics",
        href: "https://mathshistory.st-andrews.ac.uk/Search/?query=" + q,
      },
      {
        label: "Encyclopaedia Britannica",
        href: "https://www.britannica.com/search?query=" + q,
      },
    ];
  }

  function interactionFor(mentor, language) {
    var es = language === "es";
    var interactions = {
      noticing: {
        prompt: es ? "¿Qué par forma 100 en 48 + 27 + 52?" : "Which pair makes 100 in 48 + 27 + 52?",
        answer: "48,52",
        hint: es ? "Busca dos números con unidades que suman 10." : "Look for ones digits that total 10.",
      },
      balance: {
        prompt: es ? "x + 7 = 12. Escribe x." : "x + 7 = 12. Enter x.",
        answer: "5",
        hint: es ? "Resta 7 en ambos lados." : "Subtract 7 from both sides.",
      },
      drawing: {
        prompt: es ? "Una razón 3:2 se duplica. Escribe la nueva razón." : "Double the ratio 3:2. Enter the new ratio.",
        answer: "6:4",
        hint: es ? "Duplica las dos cantidades." : "Double both quantities.",
      },
      pattern: {
        prompt: es ? "2, 4, 8, 16, __" : "2, 4, 8, 16, __",
        answer: "32",
        hint: es ? "Cada término se duplica." : "Each term doubles.",
      },
      "small-start": {
        prompt: es ? "25% de 840 = __" : "25% of 840 = __",
        answer: "210",
        hint: es ? "25% es un cuarto." : "25% is one fourth.",
      },
      reality: {
        prompt: es ? "¿Es razonable $340 por un lápiz? sí/no" : "Is $340 reasonable for one pencil? yes/no",
        answer: es ? "no" : "no",
        hint: es ? "Compara con una compra real." : "Compare with a real purchase.",
      },
      record: {
        prompt: es ? "Si un intento falla, ¿lo borras o lo registras?" : "If a try fails, erase it or record it?",
        answer: es ? "registras" : "record",
        hint: es ? "Un registro evita repetir un callejón sin salida." : "A record prevents repeating a dead end.",
      },
      "second-way": {
        prompt: es ? "0.5 como fracción simplificada = __" : "0.5 as a simplified fraction = __",
        answer: "1/2",
        hint: es ? "Cinco décimos se simplifica." : "Five tenths simplifies.",
      },
    };
    return interactions[mentor.lab] || interactions.noticing;
  }

  function normalized(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace("yes", "sí");
  }

  function checkInteraction(mentor, value, language) {
    var task = interactionFor(mentor, language);
    var answer = normalized(task.answer);
    var given = normalized(value);
    var correct =
      given === answer ||
      (mentor.lab === "noticing" && (given === "52,48" || given === "48and52")) ||
      (mentor.lab === "record" && /record|registr/.test(given));
    return { correct: correct, hint: task.hint };
  }

  function markExperience(id, detail) {
    return update(function (state) {
      if (!state.journey.experiences) state.journey.experiences = {};
      state.journey.experiences[id] = {
        completedAt: new Date().toISOString(),
        detail: detail || "",
      };
    });
  }

  function markWeek(week, reflection) {
    return update(function (state) {
      if (!state.journey.weeks) state.journey.weeks = {};
      state.journey.weeks[String(week)] = {
        completedAt: new Date().toISOString(),
        reflection: String(reflection || "").slice(0, 500),
      };
    });
  }

  window.NTMentorUniverse = {
    __loaded: true,
    version: VERSION,
    labOrder: LAB_ORDER.slice(),
    investigations: UNIT_INVESTIGATIONS,
    migrate: migrate,
    load: load,
    save: save,
    update: update,
    labForLesson: labForLesson,
    momentFor: momentFor,
    sourcesFor: sourcesFor,
    interactionFor: interactionFor,
    checkInteraction: checkInteraction,
    markExperience: markExperience,
    markWeek: markWeek,
  };
})();

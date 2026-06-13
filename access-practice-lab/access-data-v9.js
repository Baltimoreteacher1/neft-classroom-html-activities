/* access-data-v9.js — QA + WIDA-alignment patches.
   Applied by mergeV9() in app.js via Object.assign(activity, patch) by id.
   Sources: structural integrity fix + 5 parallel domain QA reviews (2026-06-13).
   - Fixes the broken `order` activity that shipped with no items/answer.
   - Normalizes Spanish vocabulary that used a stray "spanish:" English label.
   - Adds a missing listening script, fixes a mislabeled WIDA tag, de-"drag"s a
     button-based order prompt, and clarifies awkward directions. */
window.ACCESS_LAB_V9 = {
  patches: {
    // ── Structural fix: order activity shipped with no items/answer ──
    "v7-list-a-labsteps": {
      items: [
        { id: "i1", text: "Put on your safety goggles." },
        { id: "i2", text: "Get your tray of materials." },
        { id: "i3", text: "Mix the two liquids in the cup." },
        { id: "i4", text: "Write what you see in your notebook." },
      ],
      answer: ["i1", "i2", "i3", "i4"],
    },

    // ── Listening: normalize Spanish vocab (stray "spanish:" label) ──
    "v3-l-a-1": {
      vocabulary: [
        [
          "goggles",
          "special glasses that protect your eyes",
          "gafas protectoras: lentes especiales que protegen los ojos",
        ],
        [
          "experiment",
          "a science test to learn something",
          "experimento: una prueba científica para aprender algo",
        ],
        [
          "safety",
          "staying free from harm",
          "seguridad: estar libre de peligro",
        ],
      ],
    },
    "v3-l-a-2": {
      vocabulary: [
        ["twenty", "the number 20", "veinte: el número 20"],
        ["twelve", "the number 12", "doce: el número 12"],
        [
          "pencils",
          "tools you write with",
          "lápices: herramientas para escribir",
        ],
      ],
    },
    "v3-l-b-1": {
      vocabulary: [
        [
          "materials",
          "the supplies you need for a task",
          "materiales: los útiles que necesitas para una tarea",
        ],
        [
          "poster board",
          "a large stiff paper for displays",
          "cartulina: un papel grande y rígido para exhibir",
        ],
        [
          "project",
          "a bigger task you build over time",
          "proyecto: una tarea más grande que se hace con el tiempo",
        ],
      ],
    },
    "v3-l-b-2": {
      vocabulary: [
        [
          "evaporation",
          "when water turns into vapor and rises",
          "evaporación: cuando el agua se convierte en vapor y sube",
        ],
        [
          "condensation",
          "when vapor cools and becomes water drops",
          "condensación: cuando el vapor se enfría y forma gotas de agua",
        ],
        [
          "precipitation",
          "rain, snow, or hail that falls",
          "precipitación: lluvia, nieve o granizo que cae",
        ],
      ],
    },

    // ── Reading: clarity + button-based (no "drag") ──
    "read-sequence-order": {
      directions:
        "Read the steps. Choose the correct order word (First, Next, or Last) for each step. Use the buttons; no dragging is needed.",
    },
    "v7-read-b-volcano-order": {
      prompt: "Put the steps in the correct order, from first to last.",
    },

    // ── Writing: normalize Spanish vocab ──
    "v3-w-a-1": {
      vocabulary: [
        [
          "desk",
          "a table where you do work",
          "escritorio: una mesa donde trabajas",
        ],
        [
          "board",
          "the surface the teacher writes on",
          "pizarra: la superficie donde escribe el maestro",
        ],
        [
          "window",
          "the glass opening in the wall",
          "ventana: la abertura de vidrio en la pared",
        ],
      ],
    },
    "v3-w-a-2": {
      vocabulary: [
        [
          "routine",
          "things you do the same way each day",
          "rutina: cosas que haces igual cada día",
        ],
        [
          "first",
          "the thing you do at the start",
          "primero: lo que haces al comienzo",
        ],
        [
          "last",
          "the thing you do at the end",
          "último: lo que haces al final",
        ],
      ],
    },
    "v3-w-b-1": {
      vocabulary: [
        [
          "data",
          "facts or numbers you collect",
          "datos: hechos o números que reúnes",
        ],
        [
          "compare",
          "to show how things differ",
          "comparar: mostrar en qué se diferencian las cosas",
        ],
        [
          "popular",
          "chosen by many people",
          "popular: elegido por muchas personas",
        ],
      ],
    },
    "v3-w-b-2": {
      vocabulary: [
        [
          "summary",
          "a short retelling of the main points",
          "resumen: un recuento breve de los puntos principales",
        ],
        [
          "recycling",
          "making used items into new ones",
          "reciclaje: convertir objetos usados en nuevos",
        ],
        [
          "landfill",
          "a place where trash is buried",
          "vertedero: un lugar donde se entierra la basura",
        ],
      ],
    },

    // ── Speaking: normalize Spanish vocab ──
    "v3-s-a-1": {
      vocabulary: [
        [
          "park",
          "an outdoor place to play and relax",
          "parque: un lugar al aire libre para jugar y descansar",
        ],
        [
          "swing",
          "a seat that moves back and forth",
          "columpio: un asiento que se mueve de un lado a otro",
        ],
        [
          "grass",
          "the green plants on the ground",
          "césped: las plantas verdes del suelo",
        ],
      ],
    },
    "v3-s-a-2": {
      vocabulary: [
        [
          "excuse me",
          "a polite way to get attention",
          "disculpe: una forma cortés de llamar la atención",
        ],
        [
          "understand",
          "to know what something means",
          "entender: saber lo que algo significa",
        ],
        ["polite", "kind and respectful", "cortés: amable y respetuoso"],
      ],
    },
    "v3-s-b-1": {
      vocabulary: [
        [
          "process",
          "a set of steps to do something",
          "proceso: un conjunto de pasos para hacer algo",
        ],
        [
          "sequence",
          "the order of the steps",
          "secuencia: el orden de los pasos",
        ],
        [
          "ingredient",
          "a food item you use in a recipe",
          "ingrediente: un alimento que usas en una receta",
        ],
      ],
    },
    "v3-s-b-2": {
      vocabulary: [
        [
          "opinion",
          "what you think or believe",
          "opinión: lo que piensas o crees",
        ],
        ["reason", "why you think something", "razón: por qué piensas algo"],
        [
          "prefer",
          "to like one thing more",
          "preferir: gustar más una cosa que otra",
        ],
      ],
    },

    // ── Model-Test: add missing listening script; fix WIDA tag + vocab ──
    "mt6-a-keywords": {
      prompt:
        "Announcement: Good morning. Your math homework is due on Monday, and your science project is due on Friday. Picture day is on Sunday. When is the science project due?",
    },
    "model-68-a-reading-1": {
      wida: ["identifying main idea", "interpreting short academic language"],
      vocabulary: [
        ["passage", "a short text", "pasaje: un texto corto"],
        ["safe", "free from harm", "seguro: libre de peligro"],
        [
          "community",
          "people in one place",
          "comunidad: personas en un mismo lugar",
        ],
      ],
    },
  },
};

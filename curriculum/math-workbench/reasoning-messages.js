/* Reasoning Studio analyzer data: connector lists, representation aliases,
 * misconception rules (keys from data/misconception-taxonomy.json) and the
 * English/Spanish message text. Data only; reasoning-analyze.js applies it. */
(function (root) {
  "use strict";

  const CAUSAL = [
    "because",
    "since",
    "so that",
    "therefore",
    "which means",
    "that means",
    "this means",
    "that is why",
    "thats why",
    "this is why",
    "due to",
    "as a result",
    "porque",
    "ya que",
    "por eso",
    "por lo tanto",
    "asi que",
    "debido a",
    "lo que significa",
    "eso significa",
    "esto significa",
    "puesto que",
  ];
  const CLAIM_WORDS = [
    "answer",
    "therefore",
    "equals",
    "equal",
    "solution",
    "claim",
    "respuesta",
    "igual",
    "solucion",
    "afirmacion",
    "es",
    "is",
    "are",
    "son",
  ];
  const LINK_WORDS = [
    "match*",
    "matches",
    "same",
    "both",
    "connect*",
    "agree*",
    "also shows",
    "correspond*",
    "coincid*",
    "igual",
    "mismo",
    "misma",
    "ambos",
    "ambas",
    "conecta*",
    "tambien muestra*",
  ];

  const ALIASES = {
    "ratio table": ["table", "tabla"],
    "double number line": [
      "double number line",
      "number line",
      "recta numerica doble",
      "recta numerica",
    ],
    "tape diagram": ["tape", "strip", "diagram", "cinta", "diagrama"],
    equation: ["equation", "expression", "ecuacion", "expresion"],
    "hundred model": ["hundred*", "grid", "cien", "cuadricula"],
    "fraction model": ["fraction bar", "bar", "model", "barra", "modelo"],
    "number line": ["number line", "line", "recta numerica", "recta"],
    "balance model": ["balance", "scale", "tiles", "balanza", "fichas"],
    "shape model": [
      "shape",
      "figure",
      "triangle*",
      "rectangle*",
      "figura",
      "triangulo*",
      "rectangulo*",
    ],
    array: ["array", "arreglo", "rows", "columns", "filas", "columnas"],
    "data display": [
      "dot plot",
      "plot",
      "histogram*",
      "box plot",
      "graph",
      "display",
      "grafica",
      "histograma*",
    ],
    table: ["table", "tabla"],
    calculation: ["calculat*", "calcul*", "compute*"],
    claim: ["claim", "afirmacion"],
    "integer chips": ["chips", "counters", "fichas"],
    "coordinate plane": ["plane", "grid", "plano", "cuadricula"],
    "place-value model": ["place value", "blocks", "chart", "valor posicional", "bloques"],
    "expanded form": ["expanded", "expandid*"],
    "3-D model": ["cubes", "prism*", "layers", "cubos", "prisma*", "capas"],
    graph: ["graph", "grafica"],
    "inequality graph": ["graph", "number line", "grafica", "recta numerica"],
  };


  const TAG_RULES = {
    ratio: [
      {
        tag: "ratio-scaled-additively",
        all: [/\b(add|added|adding|plus|sum|suma|sume|sumando|agregue)\b/],
        none: [/\b(multipl\w*|times|veces|por cada|for every)\b/],
      },
    ],
    fraction: [
      {
        tag: "fraction-straight-across-division",
        all: [/\b(numerator|numerador)\b/, /\b(denominator|denominador)\b/, /\b(divid\w*)\b/],
        none: [/reciproc/],
      },
    ],
    area: [
      {
        tag: "measure-area-perimeter-swap",
        all: [/\b(add|added|sum|suma|sume)\w*\s+(all\s+|todos\s+)?(the\s+|los\s+)?(sides|lados)\b/],
      },
      {
        tag: "geom-triangle-area-no-half",
        all: [/\b(triangle|triangulo)\b/, /\b(base)\b/],
        none: [/\b(half|mitad)\b/, /1\s*\/\s*2/, /divid\w*\s+by\s+2/, /÷\s*2/],
      },
    ],
    volume: [
      {
        tag: "geom-volume-added-dimensions",
        all: [
          /\b(add|added|sum|suma|sume)\w*\s+(the\s+|las\s+)?(length|width|height|dimensions?|largo|ancho|altura|dimensiones)\b/,
        ],
      },
    ],
    exponents: [
      {
        tag: "exponent-as-multiplication",
        all: [/\b(multipl\w*|times|por)\b.*\bbase\b.*\b(by|times|por)\b.*\b(exponent|exponente)\b/],
      },
    ],
    statistics: [
      {
        tag: "stat-mean-vs-median",
        all: [/\b(median|mediana)\b/, /\b(add|sum|suma|sume)\w*\b/, /\bdivid\w*\b/],
      },
      {
        tag: "stat-center-vs-spread",
        all: [/\b(range|rango)\b/, /\b(typical|center|centre|centro|tipico)\b/],
      },
    ],
  };


  const MSG = {
    notVisible: {
      signal: {
        en: "There is not enough written reasoning yet to follow the mathematical decision.",
        es: "Todavía no hay suficiente razonamiento escrito para seguir la decisión matemática.",
      },
      next: {
        en: "Write what you did first and why that move fits the problem.",
        es: "Escribe qué hiciste primero y por qué ese paso encaja con el problema.",
      },
    },
    wordList: {
      signal: {
        en: "The writing reads like a list of math words, so the steps cannot be followed yet.",
        es: "El texto parece una lista de palabras matemáticas, así que todavía no se pueden seguir los pasos.",
      },
      evidence: {
        en: "Most of the words are math terms or repeats.",
        es: "La mayoría de las palabras son términos matemáticos o repeticiones.",
      },
      next: {
        en: "Write full sentences: what you did, then why, using your own words.",
        es: "Escribe oraciones completas: qué hiciste y luego por qué, con tus propias palabras.",
      },
    },
    needModel: {
      signal: {
        en: "Fewer than two representations are filled in on the board, so the connection between ideas cannot be checked yet.",
        es: "Hay menos de dos representaciones completas en el tablero, así que todavía no se puede revisar la conexión entre ideas.",
      },
      next: {
        en: "Fill in a second representation on the board, then write one sentence explaining how the two match.",
        es: "Completa una segunda representación en el tablero y escribe una oración que explique cómo coinciden.",
      },
    },
    inconsistent: {
      signal: {
        en: "Two parts of your model do not agree yet.",
        es: "Dos partes de tu modelo todavía no coinciden.",
      },
      next: {
        en: "Look at that part of your model and say what you notice. Then fix the model or explain why it is right.",
        es: "Mira esa parte de tu modelo y di qué notas. Luego corrige el modelo o explica por qué es correcto.",
      },
    },
    concept: {
      evidence: {
        en: "The response does not yet use a relationship phrase such as {a} or {b}.",
        es: "La respuesta todavía no usa una frase de relación como {a} o {b}.",
      },
    },
    reason: {
      signal: {
        en: "The steps are present, but the reason connecting them is not explicit yet.",
        es: "Los pasos están, pero la razón que los conecta todavía no es explícita.",
      },
      evidence: {
        en: "No connector such as because, since, or therefore is followed by a reason.",
        es: "Ningún conector como porque, ya que o por lo tanto va seguido de una razón.",
      },
      next: {
        en: "Join one step to its reason with because, since, or therefore.",
        es: "Une un paso con su razón usando porque, ya que o por lo tanto.",
      },
    },
    units: {
      signal: {
        en: "The quantities are present, but what they measure is not explicit yet.",
        es: "Las cantidades están, pero lo que miden todavía no es explícito.",
      },
      evidence: {
        en: "No unit or quantity label is visible in the explanation.",
        es: "No se ve ninguna unidad ni rótulo de cantidad en la explicación.",
      },
      next: {
        en: "Add the unit and explain what the final quantity means in this situation.",
        es: "Agrega la unidad y explica qué significa la cantidad final en esta situación.",
      },
    },
    connected: {
      signal: {
        en: "The available evidence shows a model, a relationship, and a stated reason.",
        es: "La evidencia disponible muestra un modelo, una relación y una razón dicha.",
      },
      evidence: {
        en: "{reps} representations on the board, {words} words, and a stated reason are visible.",
        es: "Se ven {reps} representaciones en el tablero, {words} palabras y una razón dicha.",
      },
      nextLink: {
        en: "Add one sentence that says how two of your representations match.",
        es: "Agrega una oración que diga cómo coinciden dos de tus representaciones.",
      },
      next: {
        en: "Test the explanation with a new case or compare it with a different strategy.",
        es: "Prueba la explicación con un caso nuevo o compárala con otra estrategia.",
      },
    },
  };


  root.MWRMessages = Object.freeze({ CAUSAL, CLAIM_WORDS, LINK_WORDS, ALIASES, TAG_RULES, MSG });
})(window);

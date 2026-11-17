// TWR: the one list of strategies, the three stages they sit in, and which grade bands have each one.
// The hub, the strategy pages, the sitemap test and the content test all read this file; content lives in
// content/twr/<band>/<strategy>.json (three sets per strategy per band). Pure data, no DOM.
//
// TWR here means the sentence-first writing method popularized by The Writing Revolution (Hochman and Wexler):
// teach writing through the content being learned, sentence skills first, then paragraphs. Every activity in the
// lab is original; no published TWR text is reproduced.

/** Content bands TWR ships, youngest first. Same ids as src/bands.js CONTENT_BANDS. */
export const TWR_BANDS = ["K", "1", "2-3", "3-5", "6-8"];

export const STAGES = [
  {
    id: "sentences",
    title: ["Build sentences", "Construye oraciones"],
    lead: ["Strong sentences come first.", "Las oraciones fuertes van primero."],
  },
  {
    id: "join",
    title: ["Join ideas", "Une ideas"],
    lead: ["Connect sentences so they flow.", "Conecta oraciones para que fluyan."],
  },
  {
    id: "paragraphs",
    title: ["Write paragraphs", "Escribe párrafos"],
    lead: ["Plan, write, summarize and revise.", "Planifica, escribe, resume y revisa."],
  },
];

/** `bands` lists the content bands that have sets for the strategy. Order inside a stage is the learning order. */
export const STRATEGIES = {
  "sentence-sense": {
    slug: "sentence-sense",
    stage: "sentences",
    icon: "writing",
    title: ["Sentence or Fragment?", "¿Oración o fragmento?"],
    blurb: [
      "Tell a whole sentence from a piece of one, then fix the pieces.",
      "Distingue una oración completa de un pedazo y arregla los pedazos.",
    ],
    how: [
      [
        "Learn what makes a sentence a whole idea.",
        "Aprende qué hace que una oración sea una idea completa.",
      ],
      ["Sort and fix six examples.", "Clasifica y arregla seis ejemplos."],
      ["Write one whole sentence of your own.", "Escribe una oración completa propia."],
    ],
    bands: ["K", "1", "2-3", "3-5", "6-8"],
  },
  "because-but-so": {
    slug: "because-but-so",
    stage: "sentences",
    icon: "bulb",
    title: ["Because · But · So", "Because · But · So"],
    blurb: [
      "One sentence start, three connectors: give a reason, show a surprise, name a result.",
      "Un mismo comienzo, tres conectores: una razón, una sorpresa, un resultado.",
    ],
    how: [
      ["See how each word changes the meaning.", "Mira cómo cada palabra cambia el significado."],
      ["Choose the ending that fits the connector.", "Elige el final que va con el conector."],
      ["Finish all three versions yourself.", "Termina tú las tres versiones."],
    ],
    bands: ["K", "1", "2-3", "3-5", "6-8"],
  },
  expand: {
    slug: "expand",
    stage: "sentences",
    icon: "grid",
    title: ["Who, What, When, Where, Why", "Quién, qué, cuándo, dónde, por qué"],
    blurb: [
      "Start with a short sentence and grow it by answering questions.",
      "Empieza con una oración corta y hazla crecer respondiendo preguntas.",
    ],
    how: [
      [
        "Meet a short sentence and the question words.",
        "Conoce una oración corta y las palabras de pregunta.",
      ],
      ["Add the detail each question asks for.", "Agrega el detalle que pide cada pregunta."],
      ["Grow your own sentence.", "Haz crecer tu propia oración."],
    ],
    bands: ["K", "1", "2-3", "3-5", "6-8"],
  },
  appositives: {
    slug: "appositives",
    stage: "sentences",
    icon: "star",
    title: ["Appositive Artist", "Artista de aposiciones"],
    blurb: [
      "Add a describing phrase that renames a noun, set off with commas.",
      "Agrega una frase descriptiva que renombra un sustantivo, entre comas.",
    ],
    how: [
      ["See an appositive inside a sentence.", "Mira una aposición dentro de una oración."],
      ["Pick the phrase that renames the noun.", "Elige la frase que renombra el sustantivo."],
      ["Add one to your own sentence.", "Agrega una a tu propia oración."],
    ],
    bands: ["2-3", "3-5", "6-8"],
  },
  conjunctions: {
    slug: "conjunctions",
    stage: "sentences",
    icon: "road",
    title: ["Joining Words", "Palabras que unen"],
    blurb: [
      "Use when, after, although, since and unless to say how ideas connect.",
      "Usa when, after, although, since y unless para decir cómo se conectan las ideas.",
    ],
    how: [
      [
        "Learn what each joining word tells the reader.",
        "Aprende qué le dice al lector cada palabra.",
      ],
      ["Choose the word that fits the meaning.", "Elige la palabra que encaja con el significado."],
      ["Write a sentence with one.", "Escribe una oración con una."],
    ],
    bands: ["2-3", "3-5", "6-8"],
  },
  combine: {
    slug: "combine",
    stage: "join",
    icon: "construction",
    title: ["Sentence Combining", "Combinar oraciones"],
    blurb: [
      "Turn two or three short sentences into one smooth sentence.",
      "Convierte dos o tres oraciones cortas en una sola oración fluida.",
    ],
    how: [
      ["See short sentences join into one.", "Mira cómo oraciones cortas se unen en una."],
      ["Choose the strongest combined sentence.", "Elige la oración combinada más fuerte."],
      ["Combine a set yourself.", "Combina un grupo tú mismo."],
    ],
    bands: ["1", "2-3", "3-5", "6-8"],
  },
  transitions: {
    slug: "transitions",
    stage: "join",
    icon: "flag",
    title: ["Transition Words", "Palabras de transición"],
    blurb: [
      "Pick the signal word that tells the reader what comes next.",
      "Elige la palabra señal que dice al lector lo que sigue.",
    ],
    how: [
      [
        "Learn the signal words for order, addition, contrast and results.",
        "Aprende las palabras señal de orden, suma, contraste y resultado.",
      ],
      [
        "Fill each blank with the word that fits.",
        "Completa cada espacio con la palabra que encaja.",
      ],
      ["Use signal words in your own writing.", "Usa palabras señal en tu escritura."],
    ],
    bands: ["K", "1", "2-3", "3-5", "6-8"],
  },
  "paragraph-parts": {
    slug: "paragraph-parts",
    stage: "paragraphs",
    icon: "reading",
    title: ["Topic Sentence & Details", "Oración temática y detalles"],
    blurb: [
      "Find the topic sentence, keep the details that belong, drop the ones that do not.",
      "Encuentra la oración temática, conserva los detalles que van y quita los que no.",
    ],
    how: [
      ["Learn the parts of a paragraph.", "Aprende las partes de un párrafo."],
      [
        "Pick the topic sentence and the details that fit.",
        "Elige la oración temática y los detalles que encajan.",
      ],
      ["Write a topic sentence and details.", "Escribe una oración temática y detalles."],
    ],
    bands: ["2-3", "3-5", "6-8"],
  },
  outline: {
    slug: "outline",
    stage: "paragraphs",
    icon: "evidence",
    title: ["Outline to Paragraph", "Del esquema al párrafo"],
    blurb: [
      "Turn notes into an outline, then an outline into a paragraph.",
      "Convierte notas en un esquema y un esquema en un párrafo.",
    ],
    how: [
      [
        "Sort notes into a topic sentence and supporting details.",
        "Clasifica notas en oración temática y detalles de apoyo.",
      ],
      ["Put the outline in order.", "Pon el esquema en orden."],
      ["Write the paragraph from your outline.", "Escribe el párrafo desde tu esquema."],
    ],
    bands: ["2-3", "3-5", "6-8"],
  },
  summarize: {
    slug: "summarize",
    stage: "paragraphs",
    icon: "sparkle",
    title: ["Summary Sentence", "Oración resumen"],
    blurb: [
      "Say the big idea in one sentence: who or what, and what mattered most.",
      "Di la idea principal en una oración: quién o qué, y lo que más importó.",
    ],
    how: [
      [
        "Read a short text and find the big idea.",
        "Lee un texto corto y encuentra la idea principal.",
      ],
      [
        "Choose the best summary and cut what does not belong.",
        "Elige el mejor resumen y quita lo que no va.",
      ],
      ["Write your own one-sentence summary.", "Escribe tu propio resumen de una oración."],
    ],
    bands: ["1", "2-3", "3-5", "6-8"],
  },
  revise: {
    slug: "revise",
    stage: "paragraphs",
    icon: "retry",
    title: ["Revise & Upgrade", "Revisa y mejora"],
    blurb: [
      "Make a weak paragraph stronger with better sentences, signal words and details.",
      "Mejora un párrafo débil con mejores oraciones, palabras señal y detalles.",
    ],
    how: [
      ["Read a draft and spot what is weak.", "Lee un borrador y detecta lo débil."],
      ["Choose the fix that makes it stronger.", "Elige el arreglo que lo mejora."],
      ["Revise a short draft yourself.", "Revisa tú un borrador corto."],
    ],
    bands: ["2-3", "3-5", "6-8"],
  },
  thesis: {
    slug: "thesis",
    stage: "paragraphs",
    icon: "medal",
    title: ["Thesis & Conclusion", "Tesis y conclusión"],
    blurb: [
      "State a clear claim, then close an essay by restating it in fresh words.",
      "Enuncia una afirmación clara y cierra un ensayo reformulándola con palabras nuevas.",
    ],
    how: [
      [
        "Learn what a thesis claims and what a conclusion does.",
        "Aprende qué afirma una tesis y qué hace una conclusión.",
      ],
      [
        "Pick the strongest thesis and the conclusion that fits.",
        "Elige la tesis más fuerte y la conclusión que encaja.",
      ],
      ["Write a thesis and a closing sentence.", "Escribe una tesis y una oración final."],
    ],
    bands: ["6-8"],
  },
};

export const STRATEGY_LIST = Object.values(STRATEGIES);
export const isStrategy = (slug) => Object.hasOwn(STRATEGIES, slug || "");
export const strategiesFor = (band) => STRATEGY_LIST.filter((s) => s.bands.includes(band));
export const SETS_PER_STRATEGY = 3;
/** Set ids are `<token>-<strategy>-<n>`, so the hub can read progress without loading any content. */
export const BAND_TOKEN = { K: "k", 1: "g1", "2-3": "g23", "3-5": "g35", "6-8": "g68" };
export const setIdFor = (band, slug, n) => `${BAND_TOKEN[band]}-${slug}-${n}`;

/** Every activity step the player shows, in order. The practice step holds one question at a time. */
export const TWR_STEPS = [
  ["Learn", "Aprende"],
  ["Practice", "Practica"],
  ["Write", "Escribe"],
  ["Finish", "Termina"],
];

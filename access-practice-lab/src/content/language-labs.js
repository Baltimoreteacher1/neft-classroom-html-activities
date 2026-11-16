// Language Labs content (/language-labs): Verb Time Machine, Connector Bridge, Paragraph X-Ray.
// Original items for grades 3-5 and 6-8. English is the language being practised; directions and feedback are
// bilingual. Checkers: src/lang/labs-check.js. Docs: PLATFORM.md ("Language Labs").

// ── Verb Time Machine ────────────────────────────────────────────────────────
export const VERB_STOPS = {
  "3-5": ["past", "present", "present-progressive", "future"],
  "6-8": [
    "past-perfect",
    "past",
    "past-progressive",
    "present-perfect",
    "present",
    "present-progressive",
    "future",
  ],
};
/** Time words that go with each stop, so the explorer's sentence always carries its own clue. */
export const STOP_CUES = {
  "past-perfect": ["Before the storm started,", "Antes de que empezara la tormenta,"],
  past: ["Yesterday,", "Ayer,"],
  "past-progressive": ["At 8:00 last night,", "Anoche a las 8:00,"],
  "present-perfect": ["Since September,", "Desde septiembre,"],
  present: ["Every Saturday,", "Todos los sábados,"],
  "present-progressive": ["Right now,", "Ahora mismo,"],
  future: ["Tomorrow,", "Mañana,"],
};
/** Short labels for the timeline itself (the full cue goes in the sentence). */
export const STOP_SHORT = {
  "past-perfect": ["Earlier", "Antes"],
  past: ["Yesterday", "Ayer"],
  "past-progressive": ["Last night", "Anoche"],
  "present-perfect": ["Since Sept.", "Desde sept."],
  present: ["Every week", "Cada semana"],
  "present-progressive": ["Right now", "Ahora"],
  future: ["Tomorrow", "Mañana"],
};
export const VERB_EXPLORE = [
  { subject: "Maya", base: "build", rest: "a model bridge" },
  { subject: "my brother", base: "write", rest: "a letter to our grandmother" },
  { subject: "the scientists", base: "study", rest: "the river water" },
  { subject: "Leo", base: "run", rest: "around the track" },
  { subject: "we", base: "plant", rest: "beans in the school garden" },
];
export const VERB_GUIDED = {
  "3-5": {
    sentence: "Last Monday, our class ___ (visit) the museum.",
    steps: [
      ["Find the time clue: “Last Monday”.", "Busca la pista de tiempo: «Last Monday»."],
      [
        "Place it on the timeline: Last Monday is before now, so the action is in the past.",
        "Ubícala en la línea del tiempo: el lunes pasado es antes de ahora, así que la acción está en el pasado.",
      ],
      [
        "Visit is a regular verb: past = visit + ed.",
        "Visit es un verbo regular: pasado = visit + ed.",
      ],
      ["Last Monday, our class visited the museum.", "Last Monday, our class visited the museum."],
    ],
  },
  "6-8": {
    sentence: "By the time the bus arrived, Ana ___ (finish) her breakfast.",
    steps: [
      [
        "Two past events: the bus arrived, and Ana finished breakfast.",
        "Dos sucesos pasados: llegó el autobús y Ana terminó el desayuno.",
      ],
      [
        "Which happened first? “By the time” tells us breakfast was already done.",
        "¿Cuál pasó primero? «By the time» nos dice que el desayuno ya había terminado.",
      ],
      [
        "The earlier past event uses had + past participle.",
        "El suceso pasado anterior usa had + participio.",
      ],
      [
        "By the time the bus arrived, Ana had finished her breakfast.",
        "By the time the bus arrived, Ana had finished her breakfast.",
      ],
    ],
  },
};
export const VERB_ITEMS = [
  {
    id: "vt-35-1",
    band: "3-5",
    text: "Yesterday, Ana ___ to the library.",
    base: "walk",
    cue: "Yesterday",
    tense: "past",
    accept: ["walked"],
  },
  {
    id: "vt-35-2",
    band: "3-5",
    text: "Last night, we ___ a story about a brave fox.",
    base: "read",
    cue: "Last night",
    tense: "past",
    accept: ["read"],
  },
  {
    id: "vt-35-3",
    band: "3-5",
    text: "Every morning, my dad ___ coffee before work.",
    base: "make",
    cue: "Every morning",
    tense: "present",
    accept: ["makes"],
  },
  {
    id: "vt-35-4",
    band: "3-5",
    text: "Look! The baby birds ___ right now.",
    base: "eat",
    cue: "right now",
    tense: "present-progressive",
    accept: ["are eating"],
  },
  {
    id: "vt-35-5",
    band: "3-5",
    text: "Tomorrow, our team ___ in the big game.",
    base: "play",
    cue: "Tomorrow",
    tense: "future",
    accept: ["will play", "is going to play", "'ll play"],
  },
  {
    id: "vt-35-6",
    band: "3-5",
    text: "Two days ago, Sam ___ his bike to the park.",
    base: "ride",
    cue: "Two days ago",
    tense: "past",
    accept: ["rode"],
  },
  {
    id: "vt-68-1",
    band: "6-8",
    text: "While the scientists ___ the river, it started to rain.",
    base: "test",
    cue: "While … it started",
    tense: "past-progressive",
    accept: ["were testing"],
  },
  {
    id: "vt-68-2",
    band: "6-8",
    text: "Before the treaty was signed, the two nations ___ for ten years.",
    base: "fight",
    cue: "Before … was signed",
    tense: "past-perfect",
    accept: ["had fought", "had been fighting"],
  },
  {
    id: "vt-68-3",
    band: "6-8",
    text: "Since 2020, our town ___ three new parks.",
    base: "build",
    cue: "Since 2020",
    tense: "present-perfect",
    accept: ["has built"],
  },
  {
    id: "vt-68-4",
    band: "6-8",
    text: "Last spring, the class ___ a letter to the city council.",
    base: "write",
    cue: "Last spring",
    tense: "past",
    accept: ["wrote"],
  },
  {
    id: "vt-68-5",
    band: "6-8",
    text: "Next week, the eighth graders ___ their science projects.",
    base: "present",
    cue: "Next week",
    tense: "future",
    accept: ["will present", "are going to present", "'ll present"],
  },
  {
    id: "vt-68-6",
    band: "6-8",
    text: "Water ___ at 100 degrees Celsius at sea level.",
    base: "boil",
    cue: "a fact that is always true",
    tense: "present",
    accept: ["boils"],
  },
];
export const VERB_TRANSFER = {
  "3-5": {
    en: "Write three sentences about your week: one about something you already did, one about now, and one about something you will do. Use a time word in each.",
    es: "Escribe tres oraciones sobre tu semana: una sobre algo que ya hiciste, una sobre ahora y una sobre algo que harás. Usa una palabra de tiempo en cada una.",
  },
  "6-8": {
    en: "Write about a change in your neighborhood or school: what it was like before, what is happening now, and what you think will happen next. Use at least three time words.",
    es: "Escribe sobre un cambio en tu barrio o escuela: cómo era antes, qué está pasando ahora y qué crees que pasará después. Usa al menos tres palabras de tiempo.",
  },
};

// ── Connector Bridge ─────────────────────────────────────────────────────────
export const BRIDGE_PALETTE = [
  "because",
  "so",
  "but",
  "although",
  "then",
  "after that",
  "for example",
  "also",
  "however",
  "as a result",
];
export const BRIDGE_EXPLORE = { a: "The bridge was closed", b: "we took the long road home" };
export const BRIDGE_GUIDED = {
  a: "Plants need sunlight",
  b: "the plant in the dark closet turned yellow",
  steps: [
    [
      "Read idea A and idea B. What does B do to A?",
      "Lee la idea A y la idea B. ¿Qué hace B con A?",
    ],
    [
      "B shows what happens without sunlight: it is a result.",
      "B muestra qué pasa sin luz: es un resultado.",
    ],
    [
      "Result connectors: so, as a result, therefore.",
      "Conectores de resultado: so, as a result, therefore.",
    ],
    [
      "Plants need sunlight, so the plant in the dark closet turned yellow.",
      "Plants need sunlight, so the plant in the dark closet turned yellow.",
    ],
  ],
};
export const BRIDGE_ITEMS = [
  {
    id: "cb-35-1",
    band: "3-5",
    a: "It started to rain",
    b: "we went inside",
    jobs: ["cause", "sequence"],
    why: { en: "The rain made us go in.", es: "La lluvia hizo que entráramos." },
  },
  {
    id: "cb-35-2",
    band: "3-5",
    a: "I like apples",
    b: "my sister likes oranges",
    jobs: ["contrast"],
    why: {
      en: "The two people like different fruit.",
      es: "Las dos personas prefieren frutas distintas.",
    },
  },
  {
    id: "cb-35-3",
    band: "3-5",
    a: "Some animals sleep all winter",
    b: "bears hibernate in caves",
    jobs: ["example"],
    why: {
      en: "Bears are one example of animals that sleep all winter.",
      es: "Los osos son un ejemplo de animales que duermen todo el invierno.",
    },
  },
  {
    id: "cb-35-4",
    band: "3-5",
    a: "First we mixed the flour and eggs",
    b: "we baked the cake",
    jobs: ["sequence"],
    why: { en: "Baking comes after mixing.", es: "Hornear viene después de mezclar." },
  },
  {
    id: "cb-35-5",
    band: "3-5",
    a: "Our class planted a garden",
    b: "we built a bird feeder",
    jobs: ["addition", "sequence"],
    why: { en: "Both are things the class did.", es: "Las dos son cosas que hizo la clase." },
  },
  {
    id: "cb-35-6",
    band: "3-5",
    a: "Mia studied every day",
    b: "she did well on the spelling test",
    jobs: ["cause"],
    why: {
      en: "Studying is the reason she did well.",
      es: "Estudiar es la razón por la que le fue bien.",
    },
  },
  {
    id: "cb-68-1",
    band: "6-8",
    a: "The town built a new factory",
    b: "the river became polluted",
    jobs: ["cause"],
    why: {
      en: "The pollution is a result of the factory.",
      es: "La contaminación es resultado de la fábrica.",
    },
  },
  {
    id: "cb-68-2",
    band: "6-8",
    a: "Solar panels cost a lot to install",
    b: "they save money over time",
    jobs: ["contrast"],
    why: {
      en: "Saving money is the surprising opposite of the high cost.",
      es: "Ahorrar dinero es lo contrario sorprendente al alto costo.",
    },
  },
  {
    id: "cb-68-3",
    band: "6-8",
    a: "Many inventions changed daily life",
    b: "the printing press spread books across Europe",
    jobs: ["example"],
    why: {
      en: "The printing press is one example of such an invention.",
      es: "La imprenta es un ejemplo de ese tipo de invento.",
    },
  },
  {
    id: "cb-68-4",
    band: "6-8",
    a: "The colonists protested the new taxes",
    b: "the king sent more soldiers",
    jobs: ["cause", "sequence"],
    why: {
      en: "The soldiers came after, and because of, the protests.",
      es: "Los soldados llegaron después de las protestas y por causa de ellas.",
    },
  },
  {
    id: "cb-68-5",
    band: "6-8",
    a: "Exercise strengthens the heart",
    b: "it improves sleep",
    jobs: ["addition"],
    why: {
      en: "Better sleep is a second benefit of the same habit.",
      es: "Dormir mejor es un segundo beneficio del mismo hábito.",
    },
  },
  {
    id: "cb-68-6",
    band: "6-8",
    a: "The experiment followed every step",
    b: "the results did not match the prediction",
    jobs: ["contrast"],
    why: {
      en: "The result is surprising after a careful experiment.",
      es: "El resultado sorprende después de un experimento cuidadoso.",
    },
  },
];
export const BRIDGE_TRANSFER = {
  "3-5": {
    job: "cause",
    en: "Write two ideas about your school day and join them so the second is the reason or the result of the first.",
    es: "Escribe dos ideas sobre tu día en la escuela y únelas para que la segunda sea la razón o el resultado de la primera.",
  },
  "6-8": {
    job: "contrast",
    en: "Write two ideas about a technology you use and join them to show a surprising difference (a benefit and a problem).",
    es: "Escribe dos ideas sobre una tecnología que usas y únelas para mostrar una diferencia sorprendente (un beneficio y un problema).",
  },
};

// ── Paragraph X-Ray ──────────────────────────────────────────────────────────
const S = (text, job, why, clue, orderClue = "") => ({ text, job, why, clue, orderClue });
export const XRAY_MODEL = {
  "3-5": {
    title: "Why Bees Matter",
    sentences: [
      S(
        "Bees are important helpers for plants.",
        "topic",
        {
          en: "It names the topic (bees) and the main idea (they help plants).",
          es: "Nombra el tema (las abejas) y la idea principal (ayudan a las plantas).",
        },
        {
          en: "Does this sentence tell what the whole paragraph is about?",
          es: "¿Esta oración dice de qué trata todo el párrafo?",
        },
      ),
      S(
        "When a bee visits a flower, pollen sticks to its legs.",
        "detail",
        { en: "A fact about what bees do.", es: "Un dato sobre lo que hacen las abejas." },
        { en: "Is this one fact or event?", es: "¿Es un dato o un suceso?" },
      ),
      S(
        "Then the bee carries the pollen to the next flower.",
        "detail",
        {
          en: "Another fact; “Then” links it to the one before.",
          es: "Otro dato; «Then» lo une al anterior.",
        },
        { en: "Is this one more fact?", es: "¿Es un dato más?" },
        {
          en: "“Then” and “the pollen” point back to something said earlier.",
          es: "«Then» y «the pollen» se refieren a algo dicho antes.",
        },
      ),
      S(
        "This helps the flower make seeds and fruit.",
        "explain",
        {
          en: "It tells why carrying pollen matters.",
          es: "Dice por qué importa llevar el polen.",
        },
        { en: "Does this tell why the facts matter?", es: "¿Dice por qué importan los datos?" },
        {
          en: "“This” must point back to an action already described.",
          es: "«This» debe referirse a una acción ya descrita.",
        },
      ),
      S(
        "Without bees, many of the foods we eat would disappear.",
        "conclude",
        {
          en: "It connects back to the topic and shows the big picture.",
          es: "Vuelve al tema y muestra el panorama general.",
        },
        { en: "Does this sum up the paragraph?", es: "¿Resume el párrafo?" },
        {
          en: "A big-picture sentence comes last.",
          es: "Una oración de panorama general va al final.",
        },
      ),
    ],
    refs: [
      { word: "its", to: "a bee" },
      { word: "This", to: "carrying pollen" },
    ],
  },
  "6-8": {
    title: "The Cost of Fast Fashion",
    sentences: [
      S(
        "Fast fashion harms the environment in ways most shoppers never see.",
        "topic",
        {
          en: "It states the claim the paragraph will support.",
          es: "Plantea la afirmación que el párrafo va a apoyar.",
        },
        {
          en: "Does this sentence state the paragraph's main point?",
          es: "¿Esta oración plantea la idea principal del párrafo?",
        },
      ),
      S(
        "For example, making one cotton shirt can use about 2,700 liters of water.",
        "detail",
        {
          en: "A specific piece of evidence, introduced with “For example”.",
          es: "Una evidencia específica, introducida con «For example».",
        },
        { en: "Is this a specific fact or number?", es: "¿Es un dato o un número específico?" },
        {
          en: "“For example” needs a claim before it.",
          es: "«For example» necesita una afirmación antes.",
        },
      ),
      S(
        "In addition, cheap clothes are often thrown away after only a few uses.",
        "detail",
        {
          en: "A second piece of evidence, added with “In addition”.",
          es: "Una segunda evidencia, agregada con «In addition».",
        },
        { en: "Is this another fact?", es: "¿Es otro dato?" },
        {
          en: "“In addition” adds to evidence already given.",
          es: "«In addition» agrega a evidencia ya dada.",
        },
      ),
      S(
        "These habits waste resources and fill landfills with fabric that takes years to break down.",
        "explain",
        {
          en: "It explains how the evidence connects to the claim.",
          es: "Explica cómo la evidencia se conecta con la afirmación.",
        },
        {
          en: "Does this explain why the facts matter?",
          es: "¿Explica por qué importan los datos?",
        },
        {
          en: "“These habits” refers back to facts already listed.",
          es: "«These habits» se refiere a datos ya mencionados.",
        },
      ),
      S(
        "Therefore, buying fewer, longer-lasting clothes is one way to protect the planet.",
        "conclude",
        {
          en: "“Therefore” signals the conclusion drawn from the evidence.",
          es: "«Therefore» señala la conclusión que sale de la evidencia.",
        },
        { en: "Does this draw a conclusion?", es: "¿Saca una conclusión?" },
        {
          en: "“Therefore” draws a conclusion, so it comes last.",
          es: "«Therefore» saca una conclusión, así que va al final.",
        },
      ),
    ],
    refs: [{ word: "These habits", to: "using water and throwing clothes away" }],
  },
};
export const XRAY_PRACTICE = {
  "3-5": {
    title: "A Rainy Day Plan",
    sentences: [
      S(
        "Rainy days can still be fun at home.",
        "topic",
        {
          en: "It says what the whole paragraph is about.",
          es: "Dice de qué trata todo el párrafo.",
        },
        { en: "Which sentence tells the main idea?", es: "¿Qué oración dice la idea principal?" },
      ),
      S(
        "First, my family builds a blanket fort in the living room.",
        "detail",
        {
          en: "One thing the family does, with “First”.",
          es: "Una cosa que hace la familia, con «First».",
        },
        { en: "Is this one activity?", es: "¿Es una actividad?" },
        {
          en: "“First” starts the list of activities.",
          es: "«First» empieza la lista de actividades.",
        },
      ),
      S(
        "After that, we play board games inside it.",
        "detail",
        {
          en: "The next activity; “After that” and “it” point back.",
          es: "La siguiente actividad; «After that» e «it» se refieren a lo anterior.",
        },
        { en: "Is this another activity?", es: "¿Es otra actividad?" },
        {
          en: "“it” needs the fort to be named first.",
          es: "«it» necesita que el fuerte se nombre antes.",
        },
      ),
      S(
        "These games make us laugh and forget about the gray sky.",
        "explain",
        {
          en: "It tells why the activities make the day fun.",
          es: "Dice por qué las actividades hacen el día divertido.",
        },
        { en: "Does this tell why it matters?", es: "¿Dice por qué importa?" },
        {
          en: "“These games” needs the games to come first.",
          es: "«These games» necesita que los juegos vengan antes.",
        },
      ),
      S(
        "That is why I do not mind rainy days.",
        "conclude",
        { en: "“That is why” sums up the paragraph.", es: "«That is why» resume el párrafo." },
        { en: "Does this sum it up?", es: "¿Lo resume?" },
        { en: "A summing-up sentence goes last.", es: "Una oración que resume va al final." },
      ),
    ],
  },
  "6-8": {
    title: "Should School Start Later?",
    sentences: [
      S(
        "Middle schools should start later in the morning.",
        "topic",
        { en: "It states the claim.", es: "Plantea la afirmación." },
        { en: "Which sentence states the claim?", es: "¿Qué oración plantea la afirmación?" },
      ),
      S(
        "Research shows that teenagers' sleep cycles shift later during puberty.",
        "detail",
        { en: "Evidence from research.", es: "Evidencia de investigaciones." },
        { en: "Is this evidence?", es: "¿Es evidencia?" },
        {
          en: "Evidence follows the claim it supports.",
          es: "La evidencia va después de la afirmación que apoya.",
        },
      ),
      S(
        "As a result, students who start at 7:30 often arrive tired and unfocused.",
        "detail",
        {
          en: "A consequence presented as evidence.",
          es: "Una consecuencia presentada como evidencia.",
        },
        { en: "Is this another fact or result?", es: "¿Es otro dato o resultado?" },
        {
          en: "“As a result” needs a cause before it.",
          es: "«As a result» necesita una causa antes.",
        },
      ),
      S(
        "Because tired students learn less, an early start works against the purpose of school.",
        "explain",
        {
          en: "It explains why the evidence matters for the claim.",
          es: "Explica por qué la evidencia importa para la afirmación.",
        },
        { en: "Does this explain the evidence?", es: "¿Explica la evidencia?" },
        {
          en: "The explanation comes after the evidence it explains.",
          es: "La explicación viene después de la evidencia que explica.",
        },
      ),
      S(
        "For these reasons, a later start time would help students succeed.",
        "conclude",
        {
          en: "“For these reasons” signals the conclusion.",
          es: "«For these reasons» señala la conclusión.",
        },
        { en: "Does this conclude?", es: "¿Concluye?" },
        {
          en: "“For these reasons” needs the reasons first.",
          es: "«For these reasons» necesita las razones antes.",
        },
      ),
    ],
  },
};
export const XRAY_TRANSFER = {
  "3-5": {
    topicWords: ["animal", "pet"],
    en: "Write a paragraph about an animal you know well. Start with a topic sentence, give two details, explain one, and end with a sentence that sums it up.",
    es: "Escribe un párrafo sobre un animal que conoces bien. Empieza con una oración principal, da dos detalles, explica uno y termina con una oración que lo resuma.",
  },
  "6-8": {
    topicWords: ["phone", "phones", "technology", "screen"],
    en: "Write a paragraph arguing whether students should use phones during lunch. State your claim, give two pieces of evidence or reasons, explain them, and conclude.",
    es: "Escribe un párrafo que argumente si los estudiantes deberían usar el teléfono durante el almuerzo. Plantea tu afirmación, da dos evidencias o razones, explícalas y concluye.",
  },
};

/** The six labs named in the platform brief: three built here, three that already existed under other names. */
export const LABS = [
  {
    id: "verb-time-machine",
    here: true,
    icon: "clock",
    title: ["Verb Time Machine", "Máquina del tiempo de verbos"],
    text: [
      "Move an action along a timeline and watch the verb change.",
      "Mueve una acción en la línea del tiempo y mira cómo cambia el verbo.",
    ],
    skill: ["Time and verb tense", "Tiempo y tiempos verbales"],
  },
  {
    id: "connector-bridge",
    here: true,
    icon: "words",
    title: ["Connector Bridge", "Puente de conectores"],
    text: [
      "Join two ideas and see how the linking word changes the meaning.",
      "Une dos ideas y mira cómo el conector cambia el significado.",
    ],
    skill: ["Linking ideas", "Unir ideas"],
  },
  {
    id: "paragraph-xray",
    here: true,
    icon: "search",
    title: ["Paragraph X-Ray", "Rayos X del párrafo"],
    text: [
      "See the job of every sentence and the words that hold a paragraph together.",
      "Mira la función de cada oración y las palabras que mantienen unido un párrafo.",
    ],
    skill: ["Organization and cohesion", "Organización y cohesión"],
  },
  {
    id: "sentence-expansion",
    href: "scaffold/sentence-architecture",
    icon: "construction",
    title: ["Sentence Expansion Lab", "Laboratorio de expansión de oraciones"],
    text: [
      "Build a sentence from parts, then add who, when, where and why. (Sentence Architecture)",
      "Construye una oración por partes y agrega quién, cuándo, dónde y por qué. (Arquitectura de oraciones)",
    ],
    skill: ["Sentence building", "Construir oraciones"],
  },
  {
    id: "evidence-builder",
    href: "scaffold/evidence-builder",
    icon: "evidence",
    title: ["Evidence Builder", "Constructor de evidencia"],
    text: [
      "Choose evidence that supports a claim and connect it with reasoning.",
      "Elige evidencia que apoye una afirmación y conéctala con un razonamiento.",
    ],
    skill: ["Claims and evidence", "Afirmaciones y evidencia"],
  },
  {
    id: "precision-challenge",
    href: "scaffold/language-upgrade",
    icon: "sparkle",
    title: ["Precision Challenge", "Reto de precisión"],
    text: [
      "Swap vague words for precise ones that fit the context. (Language Upgrade Lab)",
      "Cambia palabras vagas por palabras precisas que encajen. (Laboratorio de mejora del lenguaje)",
    ],
    skill: ["Precise vocabulary", "Vocabulario preciso"],
  },
];

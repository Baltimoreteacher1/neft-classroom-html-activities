// Static knowledge tables behind the BCPSS "ESOL Power Pack" (see esol-pack.js).
// Single source of truth for routine design, cognate rules, L1-transfer error patterns and
// multiple-meaning words. Nothing here is unit-specific; esol-pack.js fills in each unit's own
// vocabulary, frame, summary and standards.

/** Sentence-ladder rungs per WIDA Key Language Use. Rung count is gated by WIDA tier. */
export const LADDER_BY_KLU = {
  Argue: [
    {
      label: "Add your claim",
      prompt: "Say what you believe is true or important. Start with “I think…”",
      connectors: ["i think", "i believe", "my claim"],
    },
    {
      label: "Add evidence",
      prompt: "Prove it with a fact, quote, number or observation.",
      connectors: ["because", "since", "according to", "for example"],
    },
    {
      label: "Add a counterpoint",
      prompt: "Show you considered another view.",
      connectors: ["although", "however", "while", "even though"],
    },
    {
      label: "Add precise words",
      prompt:
        "Swap general words for unit vocabulary and add your warrant (why the evidence proves it).",
      connectors: ["therefore", "this shows", "which proves", "as a result"],
    },
  ],
  Explain: [
    {
      label: "Name the thing",
      prompt: "Say exactly what you are explaining.",
      connectors: [],
    },
    {
      label: "Add the cause or how",
      prompt: "Tell why or how it happens.",
      connectors: ["because", "when", "so", "by"],
    },
    {
      label: "Add the effect",
      prompt: "Tell what happens next as a result.",
      connectors: ["which causes", "which leads to", "as a result", "so that", "therefore"],
    },
    {
      label: "Add precise words",
      prompt: "Use unit vocabulary and add a second cause or effect.",
      connectors: ["consequently", "in addition", "furthermore", "also"],
    },
  ],
  Inform: [
    {
      label: "Add a key detail",
      prompt: "Tell who or what, using a specific noun.",
      connectors: [],
    },
    {
      label: "Add where or when",
      prompt: "Give the place, time or condition.",
      connectors: ["in", "on", "at", "during", "when", "where"],
    },
    {
      label: "Add an example",
      prompt: "Give one example or a comparison.",
      connectors: ["for example", "such as", "like", "for instance", "similar to"],
    },
    {
      label: "Add precise words",
      prompt: "Use unit vocabulary and add one more related fact.",
      connectors: ["in addition", "also", "whereas", "in contrast", "both"],
    },
  ],
  Narrate: [
    {
      label: "Add who and what",
      prompt: "Say who did what.",
      connectors: [],
    },
    {
      label: "Add time order",
      prompt: "Show when it happened.",
      connectors: ["first", "then", "next", "after", "before", "later"],
    },
    {
      label: "Add the problem or feeling",
      prompt: "Add what went wrong, or how someone felt.",
      connectors: ["but", "however", "although", "so", "because"],
    },
    {
      label: "Add precise words",
      prompt: "Use unit vocabulary and end with how it was resolved.",
      connectors: ["until", "finally", "as soon as", "in the end"],
    },
  ],
};

/** Verb phrase for the language objective, per KLU. */
export const OBJECTIVE_VERB = {
  Argue: "state a claim and support it with evidence from",
  Explain: "explain how or why something happens in",
  Inform: "describe and give examples of key ideas from",
  Narrate: "sequence and retell events and problems from",
};

export const KLU_NOUN = {
  Argue: "claim",
  Explain: "explanation",
  Inform: "key detail",
  Narrate: "event",
};

/** What “success” sounds like per tier, used in objectives and look-fors. */
export const TIER_PERFORMANCE = {
  "1_2": {
    mode: "orally with a word bank, gestures and pictures",
    look: "Points to, labels or says a unit term and completes a frame with 1–2 words.",
  },
  "3_4": {
    mode: "orally and in writing",
    look: "Builds 1–2 connected sentences with a connector and two unit terms.",
  },
  "5_6": {
    mode: "in a connected paragraph",
    look: "Writes or says 3+ cohesive sentences, varies connectors, and justifies word choice.",
  },
};

/** English suffix ↔ Spanish suffix cognate rules (most productive first). */
export const COGNATE_RULES = [
  { en: "tion", es: "ción", tip: "English -tion = Spanish -ción" },
  { en: "sion", es: "sión", tip: "English -sion = Spanish -sión" },
  { en: "ity", es: "idad", tip: "English -ity = Spanish -idad" },
  { en: "ty", es: "dad", tip: "English -ty = Spanish -dad" },
  { en: "tial", es: "cial", tip: "English -tial = Spanish -cial" },
  { en: "ance", es: "ancia", tip: "English -ance = Spanish -ancia" },
  { en: "ence", es: "encia", tip: "English -ence = Spanish -encia" },
  { en: "ment", es: "mento", tip: "English -ment = Spanish -mento" },
  { en: "ious", es: "ioso", tip: "English -ious = Spanish -ioso" },
  { en: "ous", es: "oso", tip: "English -ous = Spanish -oso" },
  { en: "ive", es: "ivo", tip: "English -ive = Spanish -ivo" },
  { en: "ary", es: "ario", tip: "English -ary = Spanish -ario" },
  { en: "ic", es: "ico", tip: "English -ic = Spanish -ico/-ica" },
  { en: "ist", es: "ista", tip: "English -ist = Spanish -ista" },
  { en: "ure", es: "ura", tip: "English -ure = Spanish -ura" },
  { en: "ize", es: "izar", tip: "English -ize = Spanish -izar" },
  { en: "ate", es: "ar", tip: "English verb -ate = Spanish verb -ar" },
  { en: "al", es: "al", tip: "English -al = Spanish -al (same ending)" },
  { en: "ent", es: "ente", tip: "English -ent = Spanish -ente" },
  { en: "ant", es: "ante", tip: "English -ant = Spanish -ante" },
  { en: "ble", es: "ble", tip: "English -ble = Spanish -ble (same ending)" },
  { en: "y", es: "ia", tip: "English -y = Spanish -ia (history/historia)" },
  {
    en: "",
    es: "ar",
    tip: "English verb + -ar/-r = Spanish verb (e.g., adapt → adaptar)",
    verbOnly: true,
  },
];

/** Well-known Spanish↔English false friends, keyed by the English word. */
export const FALSE_FRIENDS = {
  actual: "In Spanish, “actual” means current. English “actual” means real.",
  assist: "Spanish “asistir” usually means to attend. English “assist” means to help.",
  attend: "Spanish “atender” means to take care of or serve. English “attend” means to go to.",
  billion:
    "Spanish “billón” is a million million (trillion in English). English “billion” = mil millones.",
  carpet: "Spanish “carpeta” is a folder. English “carpet” is a floor covering (alfombra).",
  college: "Spanish “colegio” is a school. English “college” is higher education.",
  constipated:
    "Spanish “constipado” means having a cold. English “constipated” is a digestive problem.",
  exit: "Spanish “éxito” means success. English “exit” means the way out (salida).",
  fabric: "Spanish “fábrica” is a factory. English “fabric” is cloth (tela).",
  large: "Spanish “largo” means long. English “large” means big (grande).",
  library: "Spanish “librería” is a bookstore. English “library” is biblioteca.",
  notice: "Spanish “noticia” means news. English “notice” means to observe (notar).",
  pretend:
    "Spanish “pretender” means to intend or try. English “pretend” means to make believe (fingir).",
  realize:
    "Spanish “realizar” means to carry out. English “realize” means to understand suddenly (darse cuenta).",
  record:
    "Spanish “recordar” means to remember. English “record” means to store or write down (grabar/registrar).",
  resume: "Spanish “resumir” means to summarize. English “resume” means to continue (reanudar).",
  sensible: "Spanish “sensible” means sensitive. English “sensible” means reasonable (sensato).",
  support:
    "Spanish “soportar” can mean to tolerate. English “support” means to hold up or back (apoyar).",
};

/** Multiple-meaning words that change their job across school subjects. */
export const DOUBLE_DUTY_WORDS = [
  {
    word: "table",
    senses: [
      ["Math", "an organized chart of rows and columns of numbers"],
      ["Science", "a chart that records data from an investigation"],
      ["Everyday", "furniture you eat or work at"],
    ],
  },
  {
    word: "plot",
    senses: [
      ["ELA", "the sequence of events in a story"],
      ["Math", "to mark a point on a graph"],
      ["Science", "a small area of land used for an experiment"],
    ],
  },
  {
    word: "value",
    senses: [
      ["Math", "how much a number or digit is worth"],
      ["Social Studies", "something a group believes is important"],
      ["Everyday", "how useful or costly something is"],
    ],
  },
  {
    word: "product",
    senses: [
      ["Math", "the answer to a multiplication problem"],
      ["Social Studies", "something that is made or grown to sell"],
      ["Science", "a substance made by a chemical reaction"],
    ],
  },
  {
    word: "factor",
    senses: [
      ["Math", "a number you multiply to get another number"],
      ["Science", "a condition that can change a result"],
      ["Social Studies", "a cause that helps explain an event"],
    ],
  },
  {
    word: "power",
    senses: [
      ["Math", "an exponent that tells how many times to multiply"],
      ["Science", "how fast energy is used or transferred"],
      ["Social Studies", "the ability to make decisions or control others"],
    ],
  },
  {
    word: "cell",
    senses: [
      ["Science", "the smallest living unit of an organism"],
      ["Math", "one box in a table or spreadsheet"],
      ["Social Studies", "a small room, such as in a jail"],
    ],
  },
  {
    word: "matter",
    senses: [
      ["Science", "anything that has mass and takes up space"],
      ["Everyday", "to be important (It matters.)"],
      ["Everyday", "a topic or problem (a matter of time)"],
    ],
  },
  {
    word: "force",
    senses: [
      ["Science", "a push or pull on an object"],
      ["Social Studies", "to make someone do something; a military group"],
      ["Everyday", "strong effort"],
    ],
  },
  {
    word: "mean",
    senses: [
      ["Math", "the average of a set of numbers"],
      ["ELA", "to express or signify (What does it mean?)"],
      ["Everyday", "unkind"],
    ],
  },
  {
    word: "range",
    senses: [
      ["Math", "the difference between the greatest and least value"],
      ["Science", "the full set of values a tool can measure"],
      ["Social Studies", "a line of mountains"],
    ],
  },
  {
    word: "volume",
    senses: [
      ["Math", "the amount of space inside a solid shape"],
      ["Science", "the amount of space a liquid takes up"],
      ["Everyday", "how loud a sound is"],
    ],
  },
  {
    word: "scale",
    senses: [
      ["Math", "the ratio that relates a drawing to a real object"],
      ["Social Studies", "the size of a map compared to real land"],
      ["Science", "a tool that measures mass"],
    ],
  },
  {
    word: "degree",
    senses: [
      ["Math", "a unit for measuring angles"],
      ["Science", "a unit for measuring temperature"],
      ["Social Studies", "a level of education earned"],
    ],
  },
  {
    word: "base",
    senses: [
      ["Math", "the bottom side of a shape; the number being multiplied in a power"],
      ["Science", "a substance that is not an acid"],
      ["Social Studies", "a place where soldiers live and work"],
    ],
  },
  {
    word: "figure",
    senses: [
      ["Math", "a shape, or a number"],
      ["ELA", "to figure out means to solve or understand"],
      ["Social Studies", "an important person in history"],
    ],
  },
  {
    word: "operation",
    senses: [
      ["Math", "an action such as add, subtract, multiply or divide"],
      ["Social Studies", "a planned military or organized action"],
      ["Science", "a medical procedure"],
    ],
  },
  {
    word: "expression",
    senses: [
      ["Math", "numbers and operations written together without an equal sign"],
      ["ELA", "words that show feelings or ideas"],
      ["Everyday", "the look on a face"],
    ],
  },
  {
    word: "root",
    senses: [
      ["Science", "the part of a plant that grows underground"],
      ["Math", "a number that, when multiplied by itself, gives another number"],
      ["ELA", "the base part of a word"],
    ],
  },
  {
    word: "common",
    senses: [
      ["Math", "shared by two or more numbers (common factor)"],
      ["Social Studies", "shared by a whole community (common good)"],
      ["Everyday", "happens often"],
    ],
  },
  {
    word: "interest",
    senses: [
      ["Math", "money paid for using money"],
      ["Social Studies", "something a group wants or cares about"],
      ["Everyday", "a feeling of wanting to know more"],
    ],
  },
  {
    word: "revolution",
    senses: [
      ["Social Studies", "a fast, big change in government"],
      ["Science", "one full trip around a center (Earth’s revolution)"],
      ["Math", "one full turn"],
    ],
  },
  {
    word: "current",
    senses: [
      ["Science", "the flow of electricity or water"],
      ["Social Studies", "happening now (current events)"],
      ["Everyday", "up to date"],
    ],
  },
  {
    word: "state",
    senses: [
      ["Science", "a form of matter (solid, liquid, gas)"],
      ["Social Studies", "a part of a country, like Maryland"],
      ["ELA", "to say clearly"],
    ],
  },
  {
    word: "model",
    senses: [
      ["Science", "a drawing or object that shows how something works"],
      ["Math", "a drawing or equation that shows a problem"],
      ["ELA", "an example to copy"],
    ],
  },
  {
    word: "period",
    senses: [
      ["ELA", "the punctuation mark at the end of a sentence"],
      ["Social Studies", "a length of time in history"],
      ["Science", "a row in the periodic table"],
    ],
  },
  {
    word: "set",
    senses: [
      ["Math", "a group of numbers or objects"],
      ["ELA", "where a scene takes place (the set)"],
      ["Everyday", "to put something down"],
    ],
  },
  {
    word: "property",
    senses: [
      ["Science", "a characteristic of a substance"],
      ["Math", "a rule that is always true (commutative property)"],
      ["Social Studies", "something someone owns"],
    ],
  },
  {
    word: "character",
    senses: [
      ["ELA", "a person or animal in a story"],
      ["Social Studies", "a person’s good or bad qualities"],
      ["Math", "a symbol or digit"],
    ],
  },
  {
    word: "colony",
    senses: [
      ["Social Studies", "land ruled by another country"],
      ["Science", "a group of the same organisms living together"],
    ],
  },
  {
    word: "region",
    senses: [
      ["Social Studies", "an area with shared features"],
      ["Math", "a part of a plane or shape"],
      ["Science", "an area of the body or Earth"],
    ],
  },
  {
    word: "series",
    senses: [
      ["Math", "numbers that follow a pattern and are added"],
      ["Science", "a circuit where parts are in one path"],
      ["ELA", "a set of books or events in order"],
    ],
  },
  {
    word: "key",
    senses: [
      ["Math", "the part of a graph that explains the symbols"],
      ["Social Studies", "the part of a map that explains the symbols"],
      ["Everyday", "very important; a tool that opens a lock"],
    ],
  },
];

/** Defaults so every unit shows at least two double-duty words (matched by subject). */
export const DOUBLE_DUTY_DEFAULTS = {
  ELA: ["character", "plot", "set"],
  Math: ["table", "value", "mean"],
  Science: ["matter", "model", "force"],
  "Social Studies": ["state", "key", "power"],
};

/** Subject-specific language routines. s = steps; tokens {t1} {t2} {frame} are filled per unit. */
export const SUBJECT_ROUTINES = {
  Math: [
    {
      id: "mlr-three-reads",
      name: "Three Reads: Read, Re-Read, Re-Read",
      source: "Math Language Routine 6 (Stanford SCALE / Zwiers), adapted",
      klus: ["Explain", "Argue", "Inform", "Narrate"],
      steps: [
        "Read 1 — Say what the situation is about. Cover the question. Students tell a partner who or what, in their own words.",
        "Read 2 — Reveal the numbers. Students list every quantity and what it measures; underline “{t1}” if it appears.",
        "Read 3 — Reveal the question. Students predict what operation or model could help and sketch it before computing.",
        "Share — Partners use the frame “{frame}” to explain their plan before anyone solves.",
      ],
    },
    {
      id: "mlr-stronger-clearer",
      name: "Stronger and Clearer Each Time",
      source: "Math Language Routine 1 (Stanford SCALE), adapted",
      klus: ["Explain", "Argue"],
      steps: [
        "Write a first draft that explains one step or answer from today’s lesson. Use “{t1}” at least once.",
        "Round 1 — Meet a new partner; read your draft aloud while they ask “What do you mean by…?” once.",
        "Round 2 — Switch partners; repeat. The listener presses for one more detail or one precise word.",
        "Revise — Rewrite using feedback; circle every new word from the unit. Compare drafts to see growth.",
      ],
    },
    {
      id: "mlr-compare-connect",
      name: "Compare and Connect",
      source: "Math Language Routine 7 (Stanford SCALE), adapted",
      klus: ["Explain", "Argue", "Inform"],
      steps: [
        "Show two different solution paths for the same problem from today’s lesson (area model vs. equation, table vs. graph).",
        "Silent notice — Students write one thing that is the same and one that is different.",
        "Partner talk — “{frame}” Point at the model while you speak.",
        "Whole class — Chart the connection words that show how both representations carry the same idea.",
      ],
    },
    {
      id: "mlr-co-craft",
      name: "Co-Craft Questions",
      source: "Math Language Routine 5 (Stanford SCALE), adapted",
      klus: ["Inform", "Narrate", "Explain"],
      steps: [
        "Show a problem situation from today’s lesson with no question.",
        "Students write 2–3 math questions they could ask, in pairs, using “{t1}” or “{t2}.”",
        "Share and sort — Which questions can we answer with the information shown? Which need more?",
        "Reveal the real question; compare it to student questions and note the question words used.",
      ],
    },
  ],
  Science: [
    {
      id: "sci-observe-wonder-infer",
      name: "Observe–Wonder–Infer with Sentence Frames",
      source: "Phenomena routine, adapted for WIDA tiers",
      klus: ["Explain", "Inform", "Argue"],
      steps: [
        "Show a phenomenon, photo or short demo that connects to today’s lesson. Silence for 30 seconds: students only look.",
        "Observe — “I observe ___.” Students say only what they can see or measure (no explaining yet).",
        "Wonder — “I wonder why/how ___?” Collect questions on the board using “{t1}.”",
        "Infer — “Because ___, I infer ___.” Use the unit frame: “{frame}”",
      ],
    },
    {
      id: "sci-cer-talk",
      name: "Claim–Evidence–Reasoning Talk Walk",
      source: "CER framework (McNeill & Krajcik), oral first",
      klus: ["Argue", "Explain"],
      steps: [
        "Post a testable claim about the phenomenon you are studying on chart paper in each corner of the room.",
        "Groups rotate; at each stop one student states the claim, another gives evidence, a third explains reasoning with “{t1}.”",
        "Everyone adds one sticky-note sentence stem completion at each stop (“This evidence supports the claim because…”).",
        "Final round — each student writes their own CER using “{frame}”",
      ],
    },
    {
      id: "sci-model-narrate",
      name: "Model Narration: Draw It, Say It, Fix It",
      source: "Modeling routine for emergent bilinguals, adapted",
      klus: ["Explain", "Narrate", "Inform"],
      steps: [
        "Students draw a quick model of the idea they are studying and label with “{t1}” and “{t2}.”",
        "Say It — partner narrates the model using arrows and connectors (“first… then… so…”).",
        "Fix It — the listener adds one missing label or arrow, explaining why it is needed.",
        "Revise the model and record one sentence with the frame “{frame}”",
      ],
    },
  ],
  "Social Studies": [
    {
      id: "ss-hot-seat",
      name: "Perspective Hot Seat",
      source: "Role-based oral rehearsal (SIOP-aligned), adapted",
      klus: ["Argue", "Narrate", "Inform"],
      steps: [
        "Assign each pair a person or group from the unit (a ruler, a worker, a family, a neighbor).",
        "Prepare 3 sentences from that perspective using “{t1}” and the frame “{frame}”",
        "Hot seat — the speaker answers three questions from classmates in role; listeners use “Why do you think…?”",
        "Debrief — Which words sounded like an historian? Which sounded like a character?",
      ],
    },
    {
      id: "ss-connector-relay",
      name: "Timeline Connector Relay",
      source: "Sequencing routine with transition words",
      klus: ["Narrate", "Inform", "Explain"],
      steps: [
        "Give each group 5 event cards from the unit; students order them.",
        "Relay — one member walks to the timeline, places a card, and says the event with a time-order connector (first, next, then, after that, finally).",
        "Next member must add a cause or effect with “because” or “as a result” using “{t1}.”",
        "Silent check — groups read the timeline aloud once to confirm the connectors match the order.",
      ],
    },
    {
      id: "ss-source-talk",
      name: "Source Talk: Who Made This? Why?",
      source: "Document analysis routine, scaffolded for ELs",
      klus: ["Argue", "Explain", "Inform"],
      steps: [
        "Show a short primary source, image or map linked to the unit.",
        "Sourcing — Who made this? When? For whom? Students point and say with sentence starters.",
        "Close read — Underline words about “{t1}.” Discuss which words are strong or surprising.",
        "Claim — Use “{frame}” and cite one detail from the source.",
      ],
    },
  ],
  ELA: [
    {
      id: "ela-language-dive",
      name: "Chunk, Unpack, Imitate (Language Dive)",
      source: "Language Dive protocol (Great Minds / Wit & Wisdom), adapted",
      klus: ["Narrate", "Explain", "Inform", "Argue"],
      steps: [
        "Choose one rich sentence from the anchor text. Chunk it into 3–4 meaningful parts.",
        "Unpack — ask “Who/what is this chunk about? What does ‘{t1}’ do here?” Translate chunks into plain English.",
        "Imitate — students write a new sentence copying the grammar pattern but changing the content.",
        "Share — read aloud. Compare to the unit frame: “{frame}”",
      ],
    },
    {
      id: "ela-mentor-remix",
      name: "Mentor Sentence Remix",
      source: "Mentor-sentence writing routine, WIDA-tiered",
      klus: ["Narrate", "Explain", "Argue", "Inform"],
      steps: [
        "Display the unit mentor sentence on the Connections tab. Read it twice, chorally.",
        "Remix 1 — change one noun; Remix 2 — change the verb; Remix 3 — change the connector.",
        "Students underline what stayed the same (the grammar) and highlight what changed (the meaning).",
        "Use “{t1}” in a fourth remix that connects to your own life or home culture.",
      ],
    },
    {
      id: "ela-read-aloud-stop",
      name: "Stop-and-Talk Read-Aloud",
      source: "Interactive read-aloud with accountable talk",
      klus: ["Narrate", "Inform", "Explain"],
      steps: [
        "Pre-teach “{t1}” and “{t2}” with a picture or gesture. Ask students to signal when they hear them.",
        "Stop at three planned places: predict, clarify, connect. Students turn and talk with a frame, then one pair shares.",
        "Return to the text for one sentence that proves each idea, and point to it.",
        "Close with “{frame}” on a sticky note.",
      ],
    },
  ],
};

/** I-can statements for the Language Passport, by WIDA tier and domain. */
export const PASSPORT_ICAN = {
  "1_2": {
    Listening: "I can point to a picture or say the word when I hear “{t1}.”",
    Speaking: "I can say “{t1}” and finish one sentence frame with a partner.",
    Reading: "I can match “{t1}” to a picture, label or definition.",
    Writing: "I can label a drawing with “{t1}” and write a short sentence with help.",
  },
  "3_4": {
    Listening: "I can listen to a partner and tell the main idea using “{t1}” and “{t2}.”",
    Speaking: "I can talk for 30 seconds with a frame, the word “{t1},” and a connector.",
    Reading: "I can find a sentence that has “{t1}” and explain what it means.",
    Writing: "I can write 2–3 connected sentences with “{t1}” and a connector.",
  },
  "5_6": {
    Listening: "I can listen to a discussion and identify the {noun} and the evidence behind it.",
    Speaking: "I can explain my {noun} in my own words, using precise terms and varied connectors.",
    Reading: "I can analyze how a sentence is built and why the author chose words like “{t1}.”",
    Writing:
      "I can write a cohesive paragraph that uses at least three unit terms and a counterpoint.",
  },
};

/** Entry points that let newcomers (WIDA 1–2, SLIFE) show understanding before they have full sentences. */
export const NEWCOMER_MENU = [
  ["Point", "Point to the picture, object or text that matches “{t1}.”"],
  [
    "Sort",
    "Sort picture cards for “{t1}” and “{t2}” into two groups, and name one group with a word.",
  ],
  ["Draw & label", "Draw “{t1}” and label it in English and your home language."],
  ["Act it out", "Show “{t1}” with your body or an object while a partner guesses."],
  ["Order", "Put 3 pictures or steps that show “{t1}” in order and use first / next / last."],
  ["Match", "Match “{t1}” and “{t2}” to a definition card or cognate card."],
];

// Book Studio 2.0 · the Language Supports library: seed supports, packs, search, and the rule-based Designer.
// Pure. Nothing here calls a network: "Design Language Supports" is a bounded, rule-based command interpreter that
// produces a PREVIEW of schema-validated supports; a teacher edits and approves before anything is saved. No generated
// text ever reaches the DOM or the book without passing normalizeSupport.
import { LEVELS } from "./profiles.js";
import { SUPPORT_TYPES, makeSupport, normalizeSupport } from "./supports.js";

// ── frame seeds: one row per kind, text by band (1-2 heavy, 3 developing, 4 expanding, 5-6 light) ──
const F = {
  descriptive: [
    [
      "The ___ is ___. It sees ___.",
      "The ___ looks ___ because ___.",
      "The ___ looks ___ because ___, and it ___.",
      "With ___ in its eyes, the ___ ___ as if ___.",
      "Show what the ___ is like through what it does, not only what it is.",
    ],
    [
      "Describe the fox.",
      "Describe a character.",
      "Describe the setting.",
      "Describe how it looks, sounds and feels.",
      "Describe so a reader can see, hear and feel it.",
    ],
  ],
  dialogue: [
    [
      "I think ___.",
      "I feel ___ because ___.",
      "I disagree with ___ because ___. One reason is ___.",
      '"___," said ___, trying to ___.',
      "Make each character's position clear and use dialogue to reveal their motivations.",
    ],
  ],
  causeEffect: [
    [
      "The ___ makes ___.",
      "Because ___, ___.",
      "The character decided to ___ because ___. This caused ___.",
      "Although the character believed ___, the discovery of ___ caused ___.",
      "Trace how ___ leads to ___, and what that shows about the character.",
    ],
  ],
  sequence: [
    [
      "First ___. Then ___.",
      "First, ___. Then, ___. Finally, ___.",
      "At the beginning ___. After that ___. In the end ___.",
      "Before ___, ___. Soon after, ___. Eventually, ___.",
      "Pace the events so the reader feels the tension build.",
    ],
  ],
  narrative: [
    [
      "One day ___.",
      "One day, ___ went to ___. There, ___.",
      "One day, ___ discovered ___. This made ___ want to ___.",
      "It started when ___, though no one yet knew ___.",
      "Open in the middle of the action, then reveal what matters.",
    ],
  ],
  prediction: [
    [
      "I think ___ will ___.",
      "I predict ___ because ___.",
      "Based on ___, I predict ___ because ___.",
      "The clue of ___ suggests that ___ will ___.",
      "What does the clue imply, and what would change your prediction?",
    ],
  ],
  compare: [
    [
      "___ and ___ are the same. ___ is different.",
      "___ and ___ are alike because ___. They are different because ___.",
      "Both ___ and ___ ___, but ___ ___ while ___ ___.",
      "While ___ ___, ___ ___; however, both ___.",
      "Compare to reveal something a reader would not see in either alone.",
    ],
  ],
  opinion: [
    [
      "I like ___.",
      "I think ___ because ___.",
      "In my opinion, ___ because ___. For example, ___.",
      "Although some believe ___, I argue ___ because ___.",
      "Make a claim, support it with strong evidence, and address another view.",
    ],
  ],
  cer: [
    [
      "I see ___.",
      "My claim is ___. My evidence is ___.",
      "My claim is ___. The evidence is ___. This shows ___ because ___.",
      "The evidence of ___ supports the claim that ___ because ___.",
      "Link each piece of evidence to your claim explicitly.",
    ],
  ],
  reflection: [
    [
      "I learned ___.",
      "I learned ___. It was hard when ___.",
      "I learned ___ because ___. Next time I will ___.",
      "Looking back, ___ changed how I ___.",
      "What would you do differently as an author, and why?",
    ],
  ],
  character: [
    [
      "___ is ___.",
      "___ is ___ because ___.",
      "___ shows they feel ___ when ___.",
      "___'s choice to ___ reveals ___.",
      "What does the choice reveal that the character would never say aloud?",
    ],
  ],
  problemSolution: [
    [
      "The problem is ___.",
      "The problem is ___. They try ___.",
      "The problem is ___. They try ___, and it ___.",
      "The problem grows when ___, until ___ makes ___ possible.",
      "Let the solution come from something the story has already planted.",
    ],
  ],
  expansion: [
    [
      "Add a word: The ___ fox.",
      "Add where or when: The fox ___ in the ___.",
      "Add why: The fox ___ because ___.",
      "Add a detail, a reason and a feeling to one sentence.",
      "Expand with a phrase that changes how the reader sees it.",
    ],
  ],
};
const BAND = (n) => (n <= 2 ? 0 : n === 3 ? 2 : n === 4 ? 3 : 4);
const BAND_LEVELS = [[1], [2], [3], [4], [5, 6]];

const KLU_OF = {
  descriptive: "Narrate",
  dialogue: "Narrate",
  causeEffect: "Explain",
  sequence: "Narrate",
  narrative: "Narrate",
  prediction: "Explain",
  compare: "Inform",
  opinion: "Argue",
  cer: "Argue",
  reflection: "Explain",
  character: "Explain",
  problemSolution: "Narrate",
  expansion: "Narrate",
};
const FN_OF = {
  descriptive: "describe",
  dialogue: "dialogue",
  causeEffect: "cause and effect",
  sequence: "sequence",
  narrative: "narrate",
  prediction: "predict",
  compare: "compare",
  opinion: "opinion",
  cer: "evidence",
  reflection: "reflect",
  character: "character",
  problemSolution: "problem solution",
  expansion: "elaborate",
};

function buildFrameSeeds() {
  const out = [];
  for (const [kind, rows] of Object.entries(F)) {
    for (let band = 0; band < 5; band++) {
      const text = rows[0][band];
      if (!text) continue;
      const levels = BAND_LEVELS[band];
      const intensity = band <= 1 ? "heavy" : band === 2 ? "moderate" : "minimal";
      out.push({
        id: `lib-frame-${kind}-${band + 1}`,
        type: "frame",
        kind,
        title: `${SUPPORT_TYPES.frame.kinds.find((x) => x.id === kind).en}: ${levels.length > 1 ? `Levels ${levels.join("–")}` : `Level ${levels[0]}`}`,
        levels,
        keyUse: KLU_OF[kind],
        domain: "writing",
        intensity,
        objective: `Use ${FN_OF[kind]} language in the student's own words.`,
        example: `A student completes: "${text.replace(/___/g, "…")}"`,
        tags: [FN_OF[kind], "writing", "frame", `level ${levels.join(" ")}`],
        content: {
          frames: [text],
          bank: band <= 1 ? ["because", "then", "feels", "sees", "wants"] : [],
        },
        studentInstructions:
          band === 4 ? text : "Choose a starter, then finish it in your own words.",
      });
    }
  }
  return out;
}

function organizerSeed(kind, title, cells, levels, klu, tags) {
  return {
    id: `lib-org-${kind}`,
    type: "organizer",
    kind,
    title,
    levels,
    keyUse: klu,
    domain: "writing",
    intensity: "moderate",
    objective: "Plan ideas in order before writing.",
    example: `Fill each box (${cells.map((c) => c[0]).join(", ")}), then write from it.`,
    tags: ["organizer", "planning", ...tags],
    content: {
      cells: cells.map(([label, prompt], i) => ({ id: `c${i + 1}x`, label, prompt })),
      layout: "grid",
    },
    studentInstructions: "Fill in the boxes. You can draw, speak or write.",
  };
}

const ORGANIZERS = [
  organizerSeed(
    "bme",
    "Beginning, middle, end",
    [
      ["Beginning", "Who is there? Where are they?"],
      ["Middle", "What problem happens?"],
      ["End", "How is it solved?"],
    ],
    [1, 2, 3],
    "Narrate",
    ["story", "narrative"],
  ),
  organizerSeed(
    "mountain",
    "Story mountain",
    [
      ["Start", "Meet the character"],
      ["Problem", "What goes wrong?"],
      ["Climb", "What do they try?"],
      ["Peak", "The biggest moment"],
      ["Resolution", "How does it end?"],
    ],
    [2, 3, 4],
    "Narrate",
    ["story", "plot", "mystery"],
  ),
  organizerSeed(
    "causeEffect",
    "Cause and effect map",
    [
      ["Cause", "What happened first?"],
      ["Effect", "What happened because of it?"],
      ["Why it matters", "How does it change the story?"],
    ],
    [2, 3, 4],
    "Explain",
    ["cause and effect", "science"],
  ),
  organizerSeed(
    "evidence",
    "Clue and evidence organizer",
    [
      ["Clue", "What did you find?"],
      ["What it shows", "What does it make you think?"],
      ["Because", "What is your reason?"],
    ],
    [3, 4, 5],
    "Argue",
    ["mystery", "evidence", "clue"],
  ),
  organizerSeed(
    "character",
    "Character profile",
    [
      ["Name", "What is the character called?"],
      ["Looks", "What do they look like?"],
      ["Wants", "What does the character want?"],
      ["Problem", "What stops them?"],
    ],
    [1, 2, 3, 4],
    "Narrate",
    ["character"],
  ),
  organizerSeed(
    "compare",
    "Compare and contrast map",
    [
      ["Alike", "How are they the same?"],
      ["Different (first)", "How is the first different?"],
      ["Different (second)", "How is the second different?"],
    ],
    [2, 3, 4],
    "Inform",
    ["compare", "informational"],
  ),
  organizerSeed(
    "argument",
    "Argument planner",
    [
      ["Claim", "What do you believe?"],
      ["Evidence", "What shows it?"],
      ["Reasoning", "Why does it show it?"],
      ["Another view", "What might someone say?"],
    ],
    [4, 5, 6],
    "Argue",
    ["argument", "opinion"],
  ),
  organizerSeed(
    "branching",
    "Story branching planner",
    [
      ["Choice", "What can the reader choose?"],
      ["Path A", "What happens if they choose A?"],
      ["Path B", "What happens if they choose B?"],
      ["Endings", "How can it end?"],
    ],
    [3, 4, 5, 6],
    "Narrate",
    ["adventure", "branching"],
  ),
  organizerSeed(
    "storyboard",
    "Scene storyboard",
    [
      ["Scene 1", "What do we see?"],
      ["Scene 2", "What changes?"],
      ["Scene 3", "What is the surprise?"],
    ],
    [1, 2, 3],
    "Narrate",
    ["story", "comic", "movie"],
  ),
  organizerSeed(
    "mainIdea",
    "Main idea and details",
    [
      ["Main idea", "What is it mostly about?"],
      ["Detail 1", "A fact that supports it"],
      ["Detail 2", "Another fact"],
    ],
    [2, 3, 4],
    "Inform",
    ["informational", "science"],
  ),
];

const VOCAB_SEEDS = [
  {
    id: "lib-vocab-mystery",
    type: "vocab",
    kind: "genre",
    title: "Mystery words",
    levels: [1, 2, 3],
    keyUse: "Narrate",
    domain: "reading",
    intensity: "heavy",
    tags: ["mystery", "genre", "vocabulary", "clue"],
    objective: "Use genre vocabulary to tell a mystery.",
    example: "Tap 'clue' to see a picture, hear it and read it in a sentence.",
    content: {
      words: [
        {
          w: "clue",
          def: "A small thing that helps you solve a mystery.",
          tr: { es: "pista" },
          art: "obj-magnifier",
          example: "She found a clue under the door.",
        },
        {
          w: "key",
          def: "A small metal tool that opens a lock.",
          tr: { es: "llave" },
          art: "obj-key",
          example: "The key was under the mat.",
        },
        {
          w: "map",
          def: "A drawing that shows where places are.",
          tr: { es: "mapa" },
          art: "obj-map",
          example: "The map showed a hidden door.",
        },
        {
          w: "suspect",
          def: "A person who might have done something.",
          tr: { es: "sospechoso" },
          example: "Everyone was a suspect.",
        },
      ],
    },
  },
  {
    id: "lib-vocab-feelings",
    type: "vocab",
    kind: "emotion",
    title: "Feeling words",
    levels: [1, 2, 3],
    keyUse: "Narrate",
    domain: "reading",
    intensity: "heavy",
    tags: ["emotion", "feelings", "vocabulary", "character"],
    objective: "Name how a character feels.",
    example: "The student taps 'worried' and uses it in a sentence.",
    content: {
      words: [
        { w: "scared", def: "Afraid.", tr: { es: "asustado" }, example: "The fox felt scared." },
        {
          w: "worried",
          def: "Thinking something bad might happen.",
          tr: { es: "preocupado" },
          example: "She looked worried.",
        },
        {
          w: "curious",
          def: "Wanting to know more.",
          tr: { es: "curioso" },
          example: "He was curious about the door.",
        },
        {
          w: "brave",
          def: "Doing something hard even when afraid.",
          tr: { es: "valiente" },
          example: "The brave cat went first.",
        },
      ],
    },
  },
  {
    id: "lib-vocab-academic-cause",
    type: "vocab",
    kind: "academic",
    title: "Cause and effect words",
    levels: [3, 4, 5],
    keyUse: "Explain",
    domain: "reading",
    intensity: "moderate",
    tags: ["academic", "cause and effect", "vocabulary", "science"],
    objective: "Use precise cause-and-effect vocabulary.",
    example: "Words: because, therefore, as a result, consequently.",
    content: {
      words: [
        {
          w: "because",
          def: "For the reason that.",
          tr: { es: "porque" },
          example: "The door opened because she pushed it.",
        },
        {
          w: "therefore",
          def: "For that reason.",
          tr: { es: "por lo tanto" },
          example: "It was dark; therefore, they used a light.",
        },
        {
          w: "as a result",
          def: "Because of what happened before.",
          tr: { es: "como resultado" },
          example: "As a result, the room was hidden.",
        },
        {
          w: "consequently",
          def: "Because of this.",
          tr: { es: "en consecuencia" },
          example: "Consequently, nobody found it.",
        },
      ],
    },
  },
];

const REHEARSAL_SEEDS = [
  {
    id: "lib-rehearse-oral",
    type: "rehearsal",
    kind: "oral",
    title: "Say it first",
    levels: [1, 2, 3],
    keyUse: "Narrate",
    domain: "speaking",
    intensity: "heavy",
    tags: ["oral rehearsal", "speaking", "record before writing"],
    objective: "Rehearse the idea aloud before writing it.",
    example: "Record a sentence about the picture, listen, then write it.",
    content: {
      prompt: "Say your idea out loud. Listen. Then write it.",
      steps: ["Look at the picture", "Say one sentence", "Listen", "Write it"],
      model: "",
      allowText: true,
    },
  },
  {
    id: "lib-rehearse-explain",
    type: "rehearsal",
    kind: "explain",
    title: "Explain it aloud",
    levels: [3, 4, 5],
    keyUse: "Explain",
    domain: "speaking",
    intensity: "moderate",
    tags: ["oral explanation", "speaking", "explain"],
    objective: "Explain a character's choice aloud with a reason.",
    example: "Record why the character opened the door.",
    content: {
      prompt: "Explain why the character did this. Give one reason.",
      steps: ["Say your claim", "Give a reason", "Listen and improve"],
      model: "",
      allowText: true,
    },
  },
];

const REVISION_SEEDS = [
  ["details", "Add a detail", "Which detail would help a reader see it? Add one.", [3, 4]],
  [
    "vague",
    "Replace a vague word",
    "Find a word like 'good', 'nice' or 'thing'. What word is more exact?",
    [3, 4, 5],
  ],
  [
    "transitions",
    "Improve transitions",
    "Does the order feel clear? Add or change a transition.",
    [3, 4, 5],
  ],
  [
    "causeEffect",
    "Strengthen cause and effect",
    "Is the reason clear? Add 'because' or 'so' and say why.",
    [2, 3, 4],
  ],
  ["cohesion", "Make it flow", "Read two sentences in a row. How do they connect?", [4, 5, 6]],
  [
    "voice",
    "Strengthen the voice",
    "Would this character really say it this way? Change one line.",
    [4, 5, 6],
  ],
].map(([kind, title, prompt, levels]) => ({
  id: `lib-rev-${kind}`,
  type: "revision",
  kind,
  title,
  levels,
  keyUse: "Narrate",
  domain: "writing",
  intensity: "moderate",
  tags: ["revision", "writing", kind],
  objective: "Revise one idea and choose how to change it.",
  example: "The suggestion appears beside the original; the student decides.",
  content: { prompts: [prompt] },
}));

const MODEL_SEEDS = [
  {
    id: "lib-model-fox",
    type: "model",
    kind: "example",
    title: "Model sentence: fear",
    levels: [2, 3],
    keyUse: "Narrate",
    domain: "writing",
    intensity: "heavy",
    tags: ["model", "mentor", "description", "character"],
    objective: "See how a detail explains a feeling.",
    example: "Compare 'The animal was scared' with the model.",
    content: {
      text: "The fox froze when it heard footsteps inside the dark cave.",
      note: "Notice what the fox heard and where. That shows why it is scared.",
    },
  },
];

const READING_SEEDS = [
  {
    id: "lib-reading-aloud",
    type: "reading",
    kind: "readAloud",
    title: "Read it to me",
    levels: [1, 2, 3, 4],
    keyUse: "Inform",
    domain: "reading",
    intensity: "heavy",
    tags: ["read aloud", "reading", "listening"],
    objective: "Follow the text while hearing it.",
    example: "A Read to me button appears on the page.",
    content: { prompts: [], chunks: [], highlights: [] },
  },
  {
    id: "lib-reading-infer",
    type: "reading",
    kind: "infer",
    title: "What does the clue tell us?",
    levels: [3, 4, 5, 6],
    keyUse: "Explain",
    domain: "reading",
    intensity: "moderate",
    tags: ["inference", "reading", "mystery"],
    objective: "Infer from a clue and give a reason.",
    example: "The reader answers: What does this clue tell us about the character?",
    content: {
      prompts: ["What does this clue tell you? What makes you think so?"],
      chunks: [],
      highlights: [],
    },
  },
];

const TRANSITION_SEED = {
  id: "lib-frame-transitions",
  type: "frame",
  kind: "transitions",
  title: "Transition phrases",
  levels: [2, 3, 4],
  keyUse: "Narrate",
  domain: "writing",
  intensity: "moderate",
  tags: ["transitions", "sequence", "writing"],
  objective: "Link events with transition phrases.",
  example: "Choose a phrase to start the next sentence.",
  content: {
    frames: [],
    bank: ["First", "Next", "Then", "After that", "Suddenly", "Meanwhile", "Finally", "In the end"],
  },
};

export const LIBRARY = Object.freeze([
  ...buildFrameSeeds(),
  ...ORGANIZERS,
  ...VOCAB_SEEDS,
  ...REHEARSAL_SEEDS,
  ...REVISION_SEEDS,
  ...MODEL_SEEDS,
  ...READING_SEEDS,
  TRANSITION_SEED,
]);

/** A library entry turned into a real, editable support aimed at `target`. The copy is the teacher's to change. */
export function instantiate(entry, target = { scope: "book" }, extra = {}) {
  return makeSupport(entry.type, entry.kind, {
    title: entry.title,
    levels: entry.levels,
    keyUse: entry.keyUse,
    domain: entry.domain,
    intensity: entry.intensity,
    objective: entry.objective,
    studentInstructions: entry.studentInstructions,
    content: JSON.parse(JSON.stringify(entry.content)),
    source: "library",
    target,
    ...extra,
  });
}

// ── packs: editable sets, kept as support lists so each member stays editable after insertion ──
const pick = (...ids) => ids.map((id) => LIBRARY.find((e) => e.id === id)).filter(Boolean);
export const PACKS = Object.freeze([
  {
    id: "mystery-1-2",
    title: "Mystery Writing — Levels 1–2",
    levels: [1, 2],
    entries: pick(
      "lib-vocab-mystery",
      "lib-vocab-feelings",
      "lib-frame-descriptive-1",
      "lib-frame-sequence-2",
      "lib-rehearse-oral",
      "lib-org-bme",
    ),
  },
  {
    id: "science-2-3",
    title: "Science Explanation — Levels 2–3",
    levels: [2, 3],
    entries: pick(
      "lib-vocab-academic-cause",
      "lib-frame-causeEffect-2",
      "lib-frame-causeEffect-3",
      "lib-org-causeEffect",
      "lib-rehearse-explain",
    ),
  },
  {
    id: "narrative-3-4",
    title: "Narrative Writing — Levels 3–4",
    levels: [3, 4],
    entries: pick(
      "lib-frame-narrative-3",
      "lib-frame-sequence-3",
      "lib-frame-transitions",
      "lib-org-mountain",
      "lib-rev-details",
      "lib-rev-transitions",
    ),
  },
  {
    id: "argument-4-5",
    title: "Evidence-Based Argument — Levels 4–5",
    levels: [4, 5],
    entries: pick(
      "lib-frame-cer-4",
      "lib-frame-opinion-4",
      "lib-org-argument",
      "lib-org-evidence",
      "lib-rev-cohesion",
    ),
  },
  {
    id: "dialogue-kit",
    title: "Character Dialogue Toolkit",
    levels: [1, 2, 3, 4, 5],
    entries: pick(
      "lib-frame-dialogue-1",
      "lib-frame-dialogue-3",
      "lib-frame-dialogue-4",
      "lib-frame-dialogue-5",
      "lib-rev-voice",
    ),
  },
  {
    id: "info-book",
    title: "Informational Book Toolkit",
    levels: [2, 3, 4],
    entries: pick(
      "lib-org-mainIdea",
      "lib-org-compare",
      "lib-frame-compare-3",
      "lib-vocab-academic-cause",
      "lib-reading-aloud",
    ),
  },
  {
    id: "family-story",
    title: "Multilingual Family Storytelling",
    levels: [1, 2, 3, 4, 5, 6],
    entries: pick("lib-rehearse-oral", "lib-frame-narrative-2", "lib-vocab-feelings"),
  },
]);

/** Insert a whole pack (each entry becomes its own editable support carrying `packId`). */
export const instantiatePack = (pack, target = { scope: "book" }) =>
  pack.entries.map((e, i) => instantiate(e, target, { source: "pack", packId: pack.id, order: i }));

// ── search ──
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
/** "Cause and effect, grade 6, WIDA Level 2" -> { text: "cause and effect", cluster: "6-8", level: 2 } */
export function parseQuery(q = "") {
  let text = String(q).toLowerCase();
  const out = { cluster: "", level: 0, klu: "", domain: "" };
  const lv = text.match(
    /\b(?:wida\s*)?(?:level|lvl|profile)\s*([1-6]|one|two|three|four|five|six)\b/,
  );
  if (lv) {
    out.level = Number(WORDS[lv[1]] || lv[1]);
    text = text.replace(lv[0], " ");
  }
  const gr = text.match(/\bgrades?\s*(k|[0-9]{1,2})(?:\s*[-–to]+\s*([0-9]{1,2}))?\b/);
  if (gr) {
    const g = gr[1] === "k" ? 0 : Number(gr[1]);
    out.cluster =
      g === 0 ? "K" : g === 1 ? "1" : g <= 3 ? "2-3" : g <= 5 ? "4-5" : g <= 8 ? "6-8" : "9-12";
    text = text.replace(gr[0], " ");
  }
  for (const u of ["narrate", "inform", "explain", "argue"])
    if (new RegExp(`\\b${u}\\b`).test(text)) {
      out.klu = u[0].toUpperCase() + u.slice(1);
      text = text.replace(u, " ");
    }
  for (const d of ["listening", "speaking", "reading", "writing"])
    if (new RegExp(`\\b${d}\\b`).test(text)) out.domain = d;
  out.text = text.replace(/[,;]+/g, " ").replace(/\s+/g, " ").trim();
  return out;
}

const haystack = (e) =>
  [e.title, e.kind, e.type, e.objective, e.keyUse, ...(e.tags || [])].join(" ").toLowerCase();

/** Search the library. `filters` can set level, cluster, klu, domain, type, intensity; the query text can too. */
export function searchLibrary(query = "", filters = {}, entries = LIBRARY) {
  const p = parseQuery(query);
  const f = { ...p, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
  const terms = (p.text || "")
    .split(" ")
    .filter((t) => t.length > 1 && !["and", "the", "for", "with"].includes(t));
  return entries
    .map((e) => {
      if (f.level && e.levels.length && !e.levels.includes(Number(f.level))) return null;
      if (f.klu && e.keyUse !== f.klu) return null;
      if (f.domain && e.domain !== f.domain) return null;
      if (f.type && e.type !== f.type) return null;
      if (f.intensity && e.intensity !== f.intensity) return null;
      const h = haystack(e);
      const hit = terms.filter((t) => h.includes(t)).length;
      if (terms.length && !hit) return null;
      return { entry: e, score: hit * 3 + (f.level && e.levels.includes(Number(f.level)) ? 2 : 0) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.entry);
}

// ── suggestions from selected content (rule-based, deterministic) ──
const STOP = new Set(
  "the a an and or but of to in on at is are was were be been it its this that with for from by as he she they his her their them then there here had has have not no so if when what who how did do does will would could should into out up down over very just than too also can".split(
    " ",
  ),
);

/** Candidate vocabulary from some text: content words, longest/rarest first (a teacher still approves each). */
export function suggestWords(text, max = 8) {
  const counts = new Map();
  for (const w of String(text || "")
    .toLowerCase()
    .match(/[a-záéíóúñü']{4,}/g) || [])
    if (!STOP.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[0].length - a[0].length || b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

/** What kind of language task is in a stretch of content? Used to propose a fitting support. */
export function detectTask({ type = "text", text = "", isDialogue = false } = {}) {
  const t = String(text).toLowerCase();
  if (type === "bubble" || isDialogue || /["“”]/.test(t))
    return { kind: "dialogue", fn: "dialogue" };
  if (/\b(because|so that|therefore|caused|reason|why)\b/.test(t))
    return { kind: "causeEffect", fn: "cause and effect" };
  if (/\b(first|then|next|finally|after)\b/.test(t)) return { kind: "sequence", fn: "sequence" };
  if (/\b(felt|feels|scared|happy|sad|angry|worried)\b/.test(t))
    return { kind: "character", fn: "character" };
  if (/\b(looks?|looked|saw|see|dark|bright|big|small)\b/.test(t))
    return { kind: "descriptive", fn: "describe" };
  if (/\b(think|believe|should|best|better)\b/.test(t)) return { kind: "opinion", fn: "opinion" };
  return { kind: "narrative", fn: "narrate" };
}

/** Propose supports for one piece of content at the given levels. Always a PREVIEW; the teacher edits and approves. */
export function proposeForContent({ type, text, pageId, elementId, levels = [3] }, kinds = null) {
  const task = detectTask({ type, text });
  const kind = kinds?.[0] || task.kind;
  const out = [];
  for (const lv of levels) {
    const entry =
      LIBRARY.find((e) => e.id === `lib-frame-${kind}-${BAND(lv) + 1}`) ||
      LIBRARY.find((e) => e.type === "frame" && e.kind === kind && e.levels.includes(lv));
    if (!entry) continue;
    out.push(
      instantiate(
        entry,
        { scope: elementId ? "element" : "page", pageId, elementId: elementId || "" },
        {
          levels: [lv],
          source: "suggested",
          reviewed: false,
          teacherInstructions: `Suggested from the ${task.fn} language in this content. Review before assigning.`,
        },
      ),
    );
  }
  return out;
}

// ── "Design Language Supports": a bounded, rule-based command interpreter ──
const KIND_WORDS = [
  ["sentence starter", "frame", "starter"],
  ["starter", "frame", "starter"],
  ["sentence frame", "frame", "sentence"],
  ["paragraph frame", "frame", "paragraph"],
  ["dialogue", "frame", "dialogue"],
  ["cause", "frame", "causeEffect"],
  ["vocabulary", "vocab", "bank"],
  ["word bank", "vocab", "bank"],
  ["glossary", "vocab", "bilingual"],
  ["bilingual", "vocab", "bilingual"],
  ["oral rehearsal", "rehearsal", "oral"],
  ["rehearsal", "rehearsal", "oral"],
  ["organizer", "organizer", "bme"],
  ["revision", "revision", "details"],
  ["transition", "revision", "transitions"],
  ["model", "model", "example"],
  ["read aloud", "reading", "readAloud"],
];

/**
 * Turn a teacher's sentence into a plan: { ok, summary, ops: [{ kind, type, levels, scope, pageIds }] }.
 * Only these verbs and objects exist; anything else returns { ok:false, help } so there is never a silent no-op.
 * `book` is read only to find pages (by index or by words in the page's text).
 */
export function interpretCommand(
  text,
  book,
  plainTextOf = (h) => String(h || "").replace(/<[^>]+>/g, " "),
) {
  const q = String(text || "").toLowerCase();
  if (!/\b(add|create|insert|make|give)\b/.test(q))
    return {
      ok: false,
      help: "Try: “Add Level 1 and 2 sentence starters to every page where students describe a character.”",
    };
  const levels = new Set();
  for (const m of q.matchAll(/levels?\s+((?:[1-6](?:\s*(?:,|and|&|to|through|–|-)\s*)?)+)/g)) {
    const nums = m[1].match(/[1-6]/g)?.map(Number) || [];
    if (/(to|through|–|-)/.test(m[1]) && nums.length === 2)
      for (let i = nums[0]; i <= nums[1]; i++) levels.add(i);
    else nums.forEach((n) => levels.add(n));
  }
  const kindHit = KIND_WORDS.find(([w]) => q.includes(w));
  if (!kindHit)
    return {
      ok: false,
      help: "Say which support: sentence starters, vocabulary, glossary, oral rehearsal, organizer, revision prompts or a model.",
    };
  const pages = book?.pages || [];
  let pageIds = [];
  const firstN = q.match(/first\s+(\d+|one|two|three|four|five)\s+pages?/);
  const lastP = q.match(/(?:page|scene)\s+(\d+)/);
  const where = q.match(
    /where (?:students? )?(?:describe|explain|write|retell|argue|tell)\w*\s+(?:a |the )?([a-z ]{3,40})/,
  );
  if (/every page|all pages|each page|entire book|whole book/.test(q) && !where)
    pageIds = pages.map((p) => p.id);
  if (firstN) pageIds = pages.slice(0, Number(WORDS[firstN[1]] || firstN[1])).map((p) => p.id);
  else if (lastP) pageIds = pages[Number(lastP[1]) - 1] ? [pages[Number(lastP[1]) - 1].id] : [];
  if (where) {
    const needle = where[1].trim().split(" ").slice(-1)[0];
    pageIds = pages
      .filter((p) =>
        [p.prompt?.en, ...(p.elements || []).map((e) => plainTextOf(e.html || e.alt || ""))]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .map((p) => p.id);
  }
  if (!pageIds.length) pageIds = /book/.test(q) ? [] : pages.slice(0, 1).map((p) => p.id);
  const bookWide = /entire book|whole book/.test(q) && !where;
  const lv = [...levels].sort();
  const per = /different versions|each level|levels 1 through|1 through/.test(q);
  const ops = (per && lv.length ? lv.map((n) => [n]) : [lv]).map((l) => ({
    type: kindHit[1],
    kind: kindHit[2],
    levels: l,
    scope: bookWide ? "book" : "page",
    pageIds: bookWide ? [] : pageIds,
  }));
  const touches = bookWide
    ? "the entire book"
    : `${pageIds.length} page${pageIds.length === 1 ? "" : "s"}`;
  return {
    ok: true,
    summary: `${ops.length} support${ops.length === 1 ? "" : "s"} per target (${kindHit[0]}${lv.length ? `, level${lv.length > 1 ? "s" : ""} ${lv.join(", ")}` : ""}) on ${touches}.`,
    ops,
  };
}

/** Run a plan into REVIEWABLE supports. Nothing is applied here: the caller previews, the teacher approves. */
export function planToSupports(plan, book) {
  const out = [];
  if (!plan?.ok) return out;
  for (const op of plan.ops) {
    const targets =
      op.scope === "book"
        ? [{ scope: "book" }]
        : op.pageIds.map((pageId) => ({ scope: "page", pageId }));
    for (const target of targets) {
      const lv = op.levels.length ? op.levels : [3];
      const entry =
        LIBRARY.find(
          (e) => e.type === op.type && e.kind === op.kind && lv.some((n) => e.levels.includes(n)),
        ) ||
        LIBRARY.find((e) => e.type === op.type && e.kind === op.kind) ||
        LIBRARY.find((e) => e.type === op.type);
      const page = (book?.pages || []).find((p) => p.id === target.pageId);
      const base = entry
        ? instantiate(entry, target, { levels: op.levels })
        : makeSupport(op.type, op.kind, { target, levels: op.levels });
      out.push(
        normalizeSupport({
          ...base,
          source: "designer",
          reviewed: false,
          title: page ? `${base.title} (page ${book.pages.indexOf(page) + 1})` : base.title,
          teacherInstructions:
            "Proposed by Design Language Supports (rule-based). Review and edit before assigning.",
        }),
      );
    }
  }
  return out;
}

export const LEVEL_NUMBERS = LEVELS.map((l) => l.n);

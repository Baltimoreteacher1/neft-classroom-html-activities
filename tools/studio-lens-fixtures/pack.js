// Throwaway lesson pack, vocabulary collection and activities used only by studio-lens tests. Not shipped content.
const sup = (frames, wordBank, extra = {}) => ({ frames, wordBank, ...extra });
const tiers = (base) => ({
  ee: sup(
    ["For every ____ cups of yogurt there are ____ cups of fruit."],
    ["ratio", "for every", "cups", "fruit", "yogurt", "table"],
    {
      directions:
        "Read the question. Find the groups of 2 in the yogurt amount. Then count the fruit.",
      hint: "Draw one group: 2 yogurt and 3 fruit. Draw more groups until you reach the yogurt amount.",
      oral: "Say: for every 2 cups of yogurt there are 3 cups of fruit.",
      visual: {
        kind: "tape",
        alt: "Tape diagram with 3 fruit units over 2 yogurt units",
        parts: [
          { label: "fruit", units: 3 },
          { label: "yogurt", units: 2 },
        ],
      },
      ...base,
    },
  ),
  dev: sup(
    ["I multiplied both amounts by ____ because ____."],
    ["ratio", "equivalent", "multiply", "table"],
    {
      directions: "Use the ratio table. Multiply both amounts by the same number.",
      hint: "How many groups of 2 are in the amount of yogurt?",
      oral: "Tell a partner how many groups you made.",
    },
  ),
  exp: sup(["I used a ratio table because ____."], ["equivalent ratio"], {
    directions: "Solve using a ratio table or another strategy.",
  }),
  br: {},
});
const item = (id, prompt, answer, hint) => ({ id, prompt, answer, hint, supports: tiers({}) });

export const PACK = {
  id: "fixture-g6-ratio-tables",
  kind: "lesson",
  title: "Ratio Tables and Unit Rates",
  subtitle: "Test fixture for the Lesson Lens worker",
  grade: "6",
  band: "6-8",
  subject: "math",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Fixture only. Aligned to the standard named below; not tied to a district unit.",
  },
  standards: ["6.RP.A.3"],
  wida: { eld: ["ELD-MA"], klus: ["Explain"], domains: ["Speaking", "Writing"], cluster: "6-8" },
  contentObjective: "I can use ratio tables to find equivalent ratios and unit rates.",
  languageObjective:
    "I can explain how I found an equivalent ratio using 'because' and the words ratio and unit rate.",
  languageDemands: {
    functions: ["explain a strategy", "compare representations"],
    structures: ["I multiplied both amounts by ____ because ____."],
    discourse: "two-turn partner explanation",
    barriers: ["'for every' versus 'per'", "table as data table"],
    oralRehearse: ["Say the ratio in a full sentence before writing it."],
    writeScaffold: "Because-sentence with a number from the table.",
  },
  vocab: { collection: "fixture-g6-ratios", ids: ["ratio", "unit-rate"] },
  launch: {
    title: "Notice and Wonder: Smoothie Recipes",
    visual: {
      kind: "tape",
      alt: "Tape diagram showing 3 fruit units and 2 yogurt units",
      parts: [
        { label: "fruit", units: 3 },
        { label: "yogurt", units: 2 },
      ],
    },
    prompts: ["What do you notice about the recipe?", "What do you wonder?"],
    teacherNote: "TEACHER-ONLY launch note: let students talk for a full minute before sharing.",
  },
  teach: {
    model: [
      "A ratio compares two quantities. A recipe uses 3 cups of fruit for every 2 cups of yogurt, so the ratio of fruit to yogurt is 3 to 2.",
      "A ratio table shows equivalent ratios. When you multiply both quantities by the same number, you make a new row that keeps the same relationship.",
      "A unit rate compares one quantity to exactly 1 of the other. If 6 cups of fruit go with 4 cups of yogurt, there are 1.5 cups of fruit for every 1 cup of yogurt.",
    ],
    moves: ["Model one row of the table, then ask a partner to say the next row."],
  },
  guided: [
    item(
      "g1",
      "A recipe uses 3 cups of fruit for every 2 cups of yogurt. How many cups of fruit are needed for 8 cups of yogurt?",
      12,
      "Find how many groups of 2 are in 8.",
    ),
    item(
      "g2",
      "A ratio table has fruit amounts 3, 6, 9 and yogurt amounts 2, 4, 6. What fruit amount goes with 8 cups of yogurt?",
      12,
      "Keep adding the same amounts to each row.",
    ),
    item(
      "g3",
      "A rider travels 12 miles in 3 hours. What is the unit rate in miles per hour?",
      4,
      "Divide the miles by the hours.",
    ),
  ],
  collaborate: {
    title: "Partner Explain",
    task: "Take turns. Explain how you found one row of the ratio table and why the new row is equivalent.",
    roles: ["Speaker", "Questioner"],
    discussionCards: [
      {
        prompt: "How do you know the two ratios are equivalent?",
        frame: "They are equivalent because ____.",
      },
      {
        prompt: "What stayed the same when you multiplied?",
        frame: "The relationship stayed the same because ____.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it as a tape diagram",
      visualOrModel: {
        kind: "tape",
        alt: "Tape diagram: two equal groups of 3 fruit and 2 yogurt",
        rows: [
          {
            label: "fruit",
            parts: [
              { label: "3", units: 3 },
              { label: "3", units: 3 },
            ],
          },
          {
            label: "yogurt",
            parts: [
              { label: "2", units: 2 },
              { label: "2", units: 2 },
            ],
          },
        ],
      },
      teacherNote: "TEACHER-ONLY see note.",
    },
    discuss: {
      title: "Discuss it with a partner",
      structure: "Say the ratio, then explain why the second pair of numbers is equivalent.",
      frames: ["The ratio of ____ to ____ is ____.", "It is equivalent because ____."],
    },
    apply: {
      title: "Apply it to a new recipe",
      task: "Write a recipe with a ratio of 4 to 3 and find how much of each you need for a party.",
      successCriteria: ["I name both quantities.", "I use a ratio table.", "I explain my answer."],
    },
  },
  activities: [
    { engine: "concept-builder", id: "fixture-ratio-table-lab" },
    { engine: "conversation-studio", id: "fixture-ratio-talk" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        prompt:
          "A pack has 5 red pens for every 2 blue pens. How many red pens are in a pack with 6 blue pens?",
        type: "numeric",
        answer: 15,
        explain: "6 is 3 groups of 2, so 3 groups of 5 red pens is 15.",
      },
      {
        id: "i2",
        prompt: "Which unit rate matches 20 miles in 4 hours?",
        type: "choice",
        choices: ["4 miles per hour", "5 miles per hour", "80 miles per hour"],
        answer: "5 miles per hour",
        explain: "20 divided by 4 is 5.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        prompt: "Explain why 6 to 4 is equivalent to 3 to 2.",
        type: "short",
        answer: "Both numbers were multiplied by 2.",
        explain: "Multiplying both quantities by 2 keeps the ratio the same.",
      },
    ],
  },
  exitTicket: {
    prompt: "Use a ratio table to find an equivalent ratio, then say how you know.",
    items: [
      {
        id: "x1",
        prompt: "A ratio is 2 to 5. Write an equivalent ratio.",
        type: "short",
        answer: "4 to 10",
        explain: "Multiply both by 2.",
      },
    ],
    successCriteria: ["I show a table.", "I explain with because."],
  },
  answerKey: {
    notes: "TEACHER-ONLY answer key notes.",
    items: {
      g1: "12 cups of fruit",
      g2: "12",
      g3: "4 miles per hour",
      i1: "15",
      i2: "5 miles per hour",
    },
  },
  extension: {
    title: "Mix your own",
    task: "Invent a mixture with a ratio of 7 to 3 and find two equivalent amounts.",
  },
  homeLanguage: {
    es: {
      objective: "Puedo explicar razones equivalentes.",
      vocab: [{ en: "ratio", es: "razon", verified: false }],
      familyPrompt: "Pidale que explique una receta con una razon.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing: "TEACHER-ONLY pacing: 10 minutes launch, 15 teach.",
    misconceptions: ["Adding the same number to both quantities instead of multiplying."],
    differentiation: "Use the scaffold slider.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - test fixture",
};

export const VOCAB = {
  id: "fixture-g6-ratios",
  title: "Ratios (fixture)",
  grade: "6",
  band: "6-8",
  subject: "math",
  curriculum: { status: "standards-aligned", note: "Fixture." },
  standards: ["6.RP.A.1"],
  entries: [
    {
      id: "ratio",
      word: "ratio",
      pos: "noun",
      pron: "RAY-shee-oh",
      def: "A comparison of two quantities.",
      visual: {
        kind: "tape",
        alt: "Tape diagram comparing 3 units and 2 units",
        parts: [
          { label: "A", units: 3 },
          { label: "B", units: 2 },
        ],
      },
      context: "The ratio of cats to dogs is 3 to 2.",
      academicSentence: "A ratio compares two quantities.",
      es: { word: "razon", def: "Comparacion de dos cantidades.", verified: false },
      tier: 3,
    },
    {
      id: "unit-rate",
      word: "unit rate",
      pos: "noun",
      def: "A rate with 1 as the second quantity.",
      noVisualReason: "phrase explained with an example",
      context: "The unit rate is 4 miles per hour.",
      academicSentence: "A unit rate compares to exactly 1 of another quantity.",
      tier: 3,
    },
    {
      id: "equivalent",
      word: "equivalent",
      pos: "adjective",
      def: "Having the same value or the same relationship.",
      noVisualReason: "abstract word",
      context: "2 to 3 and 4 to 6 are equivalent ratios.",
      academicSentence: "Equivalent ratios describe the same relationship.",
      tier: 2,
    },
  ],
  review: { status: "authored", checks: {} },
};

export const ACTIVITIES = {
  "fixture-ratio-table-lab": {
    id: "fixture-ratio-table-lab",
    engine: "concept-builder",
    title: "Ratio Table Lab",
    minutes: 15,
    grade: "6",
    subject: "math",
    lessonId: PACK.id,
    vocabIds: ["ratio"],
  },
  "fixture-ratio-talk": {
    id: "fixture-ratio-talk",
    engine: "conversation-studio",
    title: "Explain Your Table",
    minutes: 10,
    grade: "6",
    subject: "math",
    lessonId: PACK.id,
  },
};

export const STANDARDS = [
  {
    code: "6.RP.A.3",
    framework: "CCSS-Math",
    grades: ["6"],
    subject: "math",
    text: "Use ratio and rate reasoning to solve real-world and mathematical problems.",
  },
];

// A seed unit detail in the shape /api/bcpss/units/<id> returns (trimmed from the real response).
export const UNIT = {
  unit: {
    id: "g6-math-u2",
    grade: "6",
    subject: "Math",
    curriculum_name: "Reveal Math",
    unit_number: 2,
    unit_title: "Ratios & Rates",
    unit_summary:
      "Students represent part-to-part and part-to-whole ratios using tape diagrams, double number lines, and ratio tables to solve unit-rate and percent problems.",
    essential_question:
      "How can we use ratio, unit rate, and mathematical models to reason about Ratios & Rates?",
    core_standards: ["6.RP.A.1", "6.RP.A.2", "6.RP.A.3"],
    publisher_meta: {
      publisher_imprint: "McGraw Hill - Reveal Math",
      signature_protocol: "MLR 7: Compare and Connect",
    },
  },
  connections: [
    {
      id: "conn-g6-math-u2",
      unit_id: "g6-math-u2",
      blueprint_id: "explain-proportional-reasoning",
      wida_klu: "Explain",
      move_name: "Explain Proportional and Quantitative Relationships",
      syntax_pattern: "Quantity + relationship phrase + because + reason",
      scaffolds_json: {
        level_1_2: {
          sentence_frames: ["The ratio of [A] to [B] is [number]."],
          word_bank: ["ratio", "for every", "total"],
          teacher_move: "Annotate a tape diagram, then narrate each label.",
        },
        level_3_4: {
          sentence_frames: ["For every [A] there are [B], so [conclusion]."],
          word_bank: ["equivalent", "unit rate", "proportional"],
          teacher_move: "Use partner talk to compare two representations.",
        },
        level_5_6: {
          sentence_frames: [
            "Because the relationship is constant, [conclusion] holds when [condition].",
          ],
          word_bank: ["constant", "proportional", "generalize"],
          teacher_move: "Ask students to defend a method against a peer's.",
        },
      },
      unit_example_frame:
        "For every [A] there are [B], so when there are [C] of A there are [D] of B.",
      cross_subject_bridge_note: "Connects ratio reasoning with Grade 6 science mixtures.",
      l1_watchouts: [
        {
          l1_group: "Spanish - Cognates",
          friction_point: "Razon and ratio share a root; per and por do not always match.",
          quick_fix: "Post a side-by-side anchor for ratio and razon.",
        },
      ],
      tier2_tier3_vocab: [
        { term: "ratio", tier: 3, kid_def: "A comparison of two amounts.", cognate_es: "razon" },
        {
          term: "unit rate",
          tier: 3,
          kid_def: "How much for exactly 1 of something.",
          cognate_es: "tasa unitaria",
        },
        { term: "equivalent", tier: 2, kid_def: "Equal in value.", cognate_es: "equivalente" },
      ],
      mentor_sentence_unpacking: {
        mentor_sentence:
          "In Ratios and Rates, a ratio table shows that two quantities change together because they are multiplied by the same number.",
      },
      language_exit_ticket_json: {
        prompt: "Explain one ratio using a table and the word because.",
        target_frame: "For every [A] there are [B], so [conclusion].",
      },
    },
  ],
  activities: [
    {
      id: "act-g6-math-u2-1",
      unit_id: "g6-math-u2",
      activity_order: 1,
      day_label: "Day 1 - Syntax and Frame Launch",
      domain: "Writing",
      grouping: "Whole Group, then Partners",
      duration_minutes: 10,
      activity_type: "Sentence Architect",
      title: "Sentence Architect: Ratios and Rates",
      prep_time_minutes: 3,
      materials: ["Projected Mentor Sentence"],
      teacher_instructions:
        "1. Read the mentor sentence aloud and unpack the connector. 2. Co-construct one example. 3. Partners draft two sentences.",
      student_prompt:
        "Draft two sentences about a ratio using the frame and at least two unit words.",
      target_lab_route: "/access-practice-lab/sentences",
    },
    {
      id: "act-g6-math-u2-2",
      unit_id: "g6-math-u2",
      activity_order: 2,
      day_label: "Day 2 - Oral Rehearsal",
      domain: "Speaking",
      grouping: "Partners",
      duration_minutes: 10,
      activity_type: "Partner Talk",
      title: "Partner Talk: Ratios and Rates",
      prep_time_minutes: 2,
      materials: [],
      teacher_instructions: "Pair students. Each explains one ratio table.",
      student_prompt: "Explain how your ratio table shows an equivalent ratio.",
      target_lab_route: null,
    },
  ],
  cross_subject_transfers: [
    {
      unit_id: "g6-science-u1",
      grade: "6",
      subject: "Science",
      unit_number: 1,
      unit_title: "Mixtures",
      move_name: "Explain Proportional and Quantitative Relationships",
    },
  ],
  family_card: {
    unit_id: "g6-math-u2",
    translations_json: {
      en: {
        title: "Grade 6 Math: Ratios and Rates",
        summary: "Students compare amounts with ratios and rates.",
        dinner_question: "If a recipe doubles, what happens to each ingredient?",
        key_words: ["ratio", "rate"],
      },
      es: {
        title: "Grado 6 Matematicas: Razones y tasas",
        summary: "Los estudiantes comparan cantidades con razones y tasas.",
        dinner_question: "Si una receta se duplica, que pasa con cada ingrediente?",
        key_words: ["ratio (razon)", "rate (tasa)"],
      },
    },
  },
};

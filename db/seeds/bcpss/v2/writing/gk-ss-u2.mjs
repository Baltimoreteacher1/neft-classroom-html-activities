// BCPSS Writing Lab (TWR) — gk-ss-u2 · Maps, Globes & Where We Live. Contract: ../writing-schema.mjs

export default {
  title: "Maya's Map of Baltimore",
  genre: "inform",
  tip: "Let children draw a simple map of the classroom with two symbols, then say what each symbol shows and where it is.",
  lessons: [
    { id: "A", title: "What maps and symbols show" },
    { id: "B", title: "Land and water on a map" },
    { id: "C", title: "Near, far, and next to" },
    { id: "D", title: "Globes and Baltimore neighborhoods" },
  ],
  source: {
    title: "Reading Maya's Map",
    lesson: "A",
    text: "Maya looks at a map. Blue shows the Bay. Green shows land. A star shows her school. A tree shows the park. The park is next to school.",
  },
  notes: [
    { sentence: "A star shows her school.", note: "star = school" },
    { sentence: "A tree shows the park.", note: "tree = park" },
    { sentence: "Blue shows the Bay.", note: "blue = Bay" },
    { sentence: "The park is next to school.", note: "park next to school" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A star shows the school",
      because: "a symbol stands for a real place.",
      but: "the star is not a real star.",
      so: "we can find the school on the map.",
    },
    {
      lesson: "B",
      kernel: "Blue shows water on a map",
      because: "the Bay and rivers are wet.",
      but: "green shows dry land.",
      so: "we know where boats can go.",
    },
    {
      lesson: "C",
      kernel: "The park is next to the school",
      because: "nothing is in between them.",
      but: "the pond is far away.",
      so: "we can walk there quickly.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Maya draws a map.",
      parts: { when: "after school", where: "of her block", how: "with a blue marker" },
      model: "After school, Maya draws a map of her block with a blue marker.",
    },
    {
      lesson: "D",
      kernel: "Maya spins the globe.",
      parts: { when: "in class", where: "on the desk", how: "with one hand" },
      model: "In class, Maya spins the globe on the desk with one hand.",
    },
  ],
  fragments: [
    { text: "A map shows places.", is_sentence: true },
    { text: "Next to the park.", is_sentence: false, fix: "The school is next to the park." },
    { text: "Blue shows water.", is_sentence: true },
    { text: "Shows land and water.", is_sentence: false, fix: "A globe shows land and water." },
    { text: "The pond far from the school.", is_sentence: false, fix: "The pond is far from the school." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A map, ___, shows where places are.",
      noun: "map",
      options: ["a flat drawing of a place", "a round model of Earth", "a small picture that stands for something"],
      answer: 0,
      model: "A map, a flat drawing of a place, shows where places are.",
    },
    {
      lesson: "D",
      sentence: "A globe, ___, shows the whole Earth.",
      noun: "globe",
      options: ["a flat drawing from above", "a round model of Earth", "the dry ground of Earth"],
      answer: 1,
      model: "A globe, a round model of Earth, shows the whole Earth.",
    },
    {
      lesson: "B",
      sentence: "Land, ___, is green on our map.",
      noun: "Land",
      options: ["the wet stuff that fills the Bay", "a long way from here", "the dry ground of Earth"],
      answer: 2,
      model: "Land, the dry ground of Earth, is green on our map.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "I know it is water", model: "When I see blue on a map, I know it is water." },
    { lesson: "A", conjunction: "if", stem: "I can find the school", model: "If I look at the star, I can find the school." },
    { lesson: "C", conjunction: "while", stem: "the pond is far away", model: "While the school is next to the park, the pond is far away." },
  ],
  spo: {
    topic: {
      l1_2: "A map shows [places].",
      l3_4: "On this map, the [symbol] shows the [place].",
      l5_6: "Although a map is flat, its [symbols] show [where land, water, and places are].",
    },
    starters: [
      { type: "question", text: "What does the star on the map show?" },
      { type: "appositive", text: "Maya, a girl from Baltimore, reads a map." },
      { type: "subordinate", text: "When Maya sees blue, she knows it is water." },
    ],
    details: [
      { note: "star = school", lesson: "A" },
      { note: "tree = park", lesson: "A" },
      { note: "blue = water, the Bay", lesson: "B" },
      { note: "green = land", lesson: "B" },
      { note: "park next to school", lesson: "C" },
      { note: "pond far from school", lesson: "C" },
    ],
    distractors: ["Maya likes drawing", "maps can be folded"],
    conclusion: {
      l1_2: "A map helps us find [places].",
      l3_4: "A map helps us find where [places] are.",
      l5_6: "Because [symbols] stand for real places, a map helps us [find our way].",
    },
  },
  prompt: {
    l1_2: "Draw a map of your block with two symbols. Write 1-3 sentences. Tell what each symbol shows.",
    l3_4: "Write about a map. Tell what a symbol shows and where a place is. Use your outline.",
    l5_6: "Describe what a map shows about land, water, and places. Include an appositive and a sentence that starts with when or if.",
  },
  transitions: ["First,", "Next,", "Also,", "and", "but", "because", "so", "near"],
  model: {
    l1_2: "A star shows the school. A tree shows the park.",
    l3_4: "On this map, the star shows the school. The tree shows the park. Blue shows the Bay, and green shows land. The park is next to the school.",
    l5_6: "Maya, a girl from Baltimore, reads a map. A star is a symbol for her school. When she sees blue, she knows it is water. The park is next to the school, but the pond is far.",
  },
  revise: [
    "Did I say what each symbol shows?",
    "Did I tell where a place is, like next to or far from?",
    "Did I tell what blue and green show?",
    "Did I use the words map or globe?",
  ],
};

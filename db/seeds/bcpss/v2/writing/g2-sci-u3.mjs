// BCPSS Writing Lab (TWR) — g2-sci-u3 · Quick & Slow Earth Changes. Contract: ../writing-schema.mjs

export default {
  title: "What Changes the Cliff?",
  genre: "explain",
  tip: "Use a two-column chart (cause, effect) with a fast or slow label so students plan before they write.",
  lessons: [
    { id: "A", title: "Fast changes: earthquakes and landslides" },
    { id: "B", title: "Slow changes: wind and water erosion" },
    { id: "C", title: "Landforms change over a long time" },
    { id: "D", title: "Plant roots can slow erosion" },
  ],
  source: {
    title: "The Cliffs by the Bay",
    lesson: "B",
    text: "Calvert Cliffs rise above the Chesapeake Bay. Waves hit the bottom of the cliffs. Rain runs down the sides. Little by little, clay and sand wash away. This change is slow. Sometimes a big piece of cliff falls all at once. That landslide is a fast change.",
  },
  notes: [
    { sentence: "Waves hit the bottom of the cliffs.", note: "waves hit cliff bottom" },
    { sentence: "Rain runs down the sides.", note: "rain → runs down" },
    { sentence: "Little by little, clay and sand wash away.", note: "little by little = slow" },
    { sentence: "That landslide is a fast change.", note: "landslide = fast" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The cliff gets smaller over time",
      because: "waves and rain wash away clay and sand.",
      but: "the change is too slow to see each day.",
      so: "we find new clay and sand on the beach.",
    },
    {
      lesson: "A",
      kernel: "An earthquake changes the land fast",
      because: "the ground shakes and cracks suddenly.",
      but: "most earthquakes in Maryland are very small.",
      so: "strong ones can damage buildings in seconds.",
    },
    {
      lesson: "D",
      kernel: "Plant roots slow erosion",
      because: "they hold the soil in place.",
      but: "bare soil washes away in the rain.",
      so: "people plant grass on hills.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Rain washed the soil.",
      parts: { when: "after every storm", where: "down the hill", how: "little by little" },
      model: "After every storm, rain washed the soil down the hill little by little.",
    },
    {
      lesson: "A",
      kernel: "The landslide happened.",
      parts: { when: "in the night", where: "at the cliff", how: "all at once" },
      model: "In the night, the landslide happened at the cliff all at once.",
    },
  ],
  fragments: [
    { text: "A landslide is a fast change.", is_sentence: true },
    { text: "Because the rain ran down the hill.", is_sentence: false, fix: "The soil moved because the rain ran down the hill." },
    { text: "Washes soil away slowly.", is_sentence: false, fix: "Water washes soil away slowly." },
    { text: "Wind and water cause erosion.", is_sentence: true },
    { text: "The cliff by the bay.", is_sentence: false, fix: "The cliff by the bay is changing slowly." },
    { text: "An earthquake shakes the ground.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A landslide, ___, can happen after heavy rain.",
      noun: "landslide",
      options: ["a fast slide of soil and rock", "a sudden shaking of the ground", "a deep valley with steep sides"],
      answer: 0,
      model: "A landslide, a fast slide of soil and rock, can happen after heavy rain.",
    },
    {
      lesson: "B",
      sentence: "Erosion, ___, changes land slowly.",
      noun: "Erosion",
      options: ["an opening where hot rock bursts out", "when wind or water moves soil and rock", "a natural shape like a hill"],
      answer: 1,
      model: "Erosion, when wind or water moves soil and rock, changes land slowly.",
    },
    {
      lesson: "C",
      sentence: "A canyon, ___, can be cut by a river.",
      noun: "canyon",
      options: ["a sudden shaking of the ground", "a plan to stop erosion", "a deep valley with steep sides"],
      answer: 2,
      model: "A canyon, a deep valley with steep sides, can be cut by a river.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "soil washes away", model: "When heavy rain runs down a bare hill, soil washes away." },
    { lesson: "A", conjunction: "because", stem: "an earthquake is a fast change", model: "Because the shaking is sudden, an earthquake is a fast change." },
    { lesson: "C", conjunction: "although", stem: "it can cut a deep canyon", model: "Although the river moves slowly, it can cut a deep canyon." },
  ],
  spo: {
    topic: {
      l1_2: "[Waves and rain] change a [cliff].",
      l3_4: "[Waves and rain] wash away the cliff, so the [cliff] changes [slowly].",
      l5_6: "Although [Calvert Cliffs] look strong, [waves and rain] cause [slow erosion], and [a landslide] causes [a fast change].",
    },
    starters: [
      { type: "question", text: "What can change a tall cliff by the bay?" },
      { type: "appositive", text: "Calvert Cliffs, tall cliffs above the Chesapeake Bay, are slowly changing." },
      { type: "subordinate", text: "When waves hit the cliff again and again, clay washes away." },
    ],
    details: [
      { note: "waves hit bottom of cliff", lesson: "B" },
      { note: "rain runs down the sides", lesson: "B" },
      { note: "clay + sand wash away", lesson: "B" },
      { note: "little by little = slow", lesson: "B" },
      { note: "landslide = fast change", lesson: "A" },
      { note: "roots hold soil = less erosion", lesson: "D" },
    ],
    distractors: ["fossils are found on the beach", "sailboats sail on the bay"],
    conclusion: {
      l1_2: "So the cliff changes [slowly].",
      l3_4: "As a result, the [cliff] changes [slowly] because [waves and rain wash away clay and sand].",
      l5_6: "In conclusion, [slow erosion] and [a fast landslide] both [change the cliff], but they work at [different speeds].",
    },
  },
  prompt: {
    l1_2: "Draw a cliff, waves, and rain. Write 1-3 sentences that tell what changes the cliff.",
    l3_4: "Write a paragraph that explains what causes a cliff to change and how fast. Use so, because, and as a result.",
    l5_6: "Write a paragraph that explains slow and fast changes to a cliff and what causes each one. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Next,", "Because", "So", "As a result,", "That is why", "When", "For example,"],
  model: {
    l1_2: "Waves and rain wash clay off the cliff. The change is slow.",
    l3_4: "Waves hit the bottom of the cliff again and again. Rain also runs down its sides, so clay and sand wash away. This change is slow because it happens a little at a time. As a result, the cliff gets smaller.",
    l5_6: "Calvert Cliffs, tall cliffs above the Chesapeake Bay, are slowly changing. When waves and rain hit the cliffs, clay and sand wash away. This slow erosion happens a little at a time. Although the change is slow, a big piece can fall in a landslide. That landslide is a fast change.",
  },
  revise: [
    "Did I tell the cause and the effect?",
    "Did I use so, because, or as a result to link them?",
    "Did I say if the change is fast or slow?",
    "Did I use erosion or landslide correctly?",
  ],
};

// BCPSS Writing Lab (TWR) — gk-sci-u3 · Living Things & Needs. Contract: ../writing-schema.mjs

export default {
  title: "A Terrapin by the Bay",
  genre: "inform",
  tip: "Take children on a short look for living and nonliving things, then have each name what a living thing needs.",
  lessons: [
    { id: "A", title: "Living and nonliving things" },
    { id: "B", title: "What plants need" },
    { id: "C", title: "What animals need" },
    { id: "D", title: "Habitats: homes for living things" },
  ],
  source: {
    title: "The Terrapin and the Rock",
    lesson: "A",
    text: "A terrapin lives by the Bay. It eats snails. It drinks water. It needs air too. A rock sits beside it. The rock is not alive.",
  },
  notes: [
    { sentence: "A terrapin lives by the Bay.", note: "terrapin @ Bay" },
    { sentence: "It needs air too.", note: "needs air" },
    { sentence: "The rock is not alive.", note: "rock ≠ alive" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A terrapin is a living thing",
      because: "it needs food and air.",
      but: "a rock is not alive.",
      so: "it needs a habitat.",
    },
    {
      lesson: "B",
      kernel: "A sunflower needs water",
      because: "it is a living plant.",
      but: "it does not eat like animals.",
      so: "we water it every day.",
    },
    {
      lesson: "D",
      kernel: "A crab lives in the Bay",
      because: "the Bay is its habitat.",
      but: "it cannot live in the desert.",
      so: "it finds food and shelter there.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "The terrapin eats.",
      parts: { when: "every day", where: "near the Bay", why: "to stay alive" },
      model: "Every day, the terrapin eats near the Bay to stay alive.",
    },
    {
      lesson: "B",
      kernel: "Rosa waters plants.",
      parts: { when: "after school", where: "in her garden", why: "so they can grow" },
      model: "After school, Rosa waters plants in her garden so they can grow.",
    },
  ],
  fragments: [
    { text: "A rock is not alive.", is_sentence: true },
    { text: "Needs water and air.", is_sentence: false, fix: "A frog needs water and air." },
    { text: "The Bay is a habitat.", is_sentence: true },
    { text: "Because plants need sun.", is_sentence: false, fix: "Plants grow because plants need sun." },
    { text: "Lives in a pond.", is_sentence: false, fix: "A frog lives in a pond." },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "A terrapin, ___, lives by the Bay.",
      noun: "terrapin",
      options: ["an animal with a hard shell", "a plant that grows tall", "a rock in the water"],
      answer: 0,
      model: "A terrapin, an animal with a hard shell, lives by the Bay.",
    },
    {
      lesson: "D",
      sentence: "A habitat, ___, has food and water.",
      noun: "habitat",
      options: ["a thing that is not alive", "the natural home of a plant or animal", "a plant with big leaves"],
      answer: 1,
      model: "A habitat, the natural home of a plant or animal, has food and water.",
    },
    {
      lesson: "B",
      sentence: "A sunflower, ___, needs water and sun.",
      noun: "sunflower",
      options: ["an animal that moves around", "a rock in the garden", "a plant that grows in the ground"],
      answer: 2,
      model: "A sunflower, a plant that grows in the ground, needs water and sun.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "since", stem: "it needs food and air", model: "Since a terrapin is alive, it needs food and air." },
    { lesson: "B", conjunction: "if", stem: "it cannot grow", model: "If a plant gets no water, it cannot grow." },
    { lesson: "D", conjunction: "when", stem: "the crab finds shelter", model: "When a storm comes, the crab finds shelter." },
  ],
  spo: {
    topic: {
      l1_2: "A [terrapin] is a living thing.",
      l3_4: "A [terrapin] is a living thing because it needs [food, water, and air].",
      l5_6: "Although a [rock] sits beside it, a [terrapin] is [a living thing] because it [eats, drinks, and needs air].",
    },
    starters: [
      { type: "question", text: "How can you tell a terrapin is alive?" },
      { type: "appositive", text: "A terrapin, an animal with a hard shell, lives by the Bay." },
      { type: "subordinate", text: "Because it needs food and air, a terrapin is alive." },
    ],
    details: [
      { note: "terrapin lives by Bay", lesson: "D" },
      { note: "Bay = habitat", lesson: "D" },
      { note: "eats snails", lesson: "C" },
      { note: "drinks water", lesson: "C" },
      { note: "needs air", lesson: "C" },
      { note: "rock = not alive", lesson: "A" },
    ],
    distractors: ["the Bay is salty", "Maryland has a state bird"],
    conclusion: {
      l1_2: "A rock is [not alive].",
      l3_4: "A rock is not alive because it does not [eat or grow].",
      l5_6: "Because a terrapin [eats, drinks, and breathes], it is alive, but [a rock] is not.",
    },
  },
  prompt: {
    l1_2: "Draw a living thing in its home. Write 1-3 sentences. Tell what it is and what it needs.",
    l3_4: "Write about a living thing and its habitat. Tell what it needs. Use because. Use your outline.",
    l5_6: "Tell how you know something is a living thing. Include an appositive and a sentence that starts with because or although.",
  },
  transitions: ["First,", "Also,", "Next,", "because", "and", "so", "but", "not"],
  model: {
    l1_2: "A terrapin is a living thing. It needs water.",
    l3_4: "A terrapin is a living thing because it needs food, water, and air. It lives by the Bay. The Bay is its habitat. A rock is not alive.",
    l5_6: "A terrapin, an animal with a hard shell, lives by the Bay. Because it eats, drinks, and needs air, it is a living thing. Although a rock sits beside it, the rock is not alive.",
  },
  revise: [
    "Did I name the living thing?",
    "Did I tell what it needs?",
    "Did I tell where it lives?",
    "Did I use because to tell why it is alive?",
  ],
};

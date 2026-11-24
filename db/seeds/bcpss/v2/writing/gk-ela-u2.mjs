// BCPSS Writing Lab (TWR) — gk-ela-u2 · Once Upon a Farm. Contract: ../writing-schema.mjs

export default {
  title: "Hattie Hen Grows Corn",
  genre: "narrate",
  tip: "Act out first, next, and last with farm toys before children draw and write their own story.",
  lessons: [
    { id: "A", title: "Characters and setting on a farm" },
    { id: "B", title: "Telling first, next, and last" },
    { id: "C", title: "The problem and how it is solved" },
    { id: "D", title: "Growing corn from a seed" },
  ],
  source: {
    title: "Hattie Hen's Seed",
    lesson: "D",
    text: "Hattie Hen lives on a farm. One day, she finds a seed. First, she plants it. But no rain comes! Next, she waters it. Then the corn grows tall. Last, Hattie picks the corn.",
  },
  notes: [
    { sentence: "One day, she finds a seed.", note: "finds seed" },
    { sentence: "First, she plants it.", note: "1st: plant" },
    { sentence: "Next, she waters it.", note: "next: water" },
    { sentence: "Then the corn grows tall.", note: "then: corn grows" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Hattie plants the seed",
      because: "she wants corn to grow.",
      but: "the seed is very small.",
      so: "a corn plant grows.",
    },
    {
      lesson: "C",
      kernel: "Pip runs out of the barn",
      because: "the gate is open.",
      but: "he does not go far.",
      so: "the farmer chases him.",
    },
    {
      lesson: "B",
      kernel: "Hattie waters the seed",
      because: "plants need water.",
      but: "the sky has no rain.",
      so: "the corn grows tall.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Pip ran away.",
      parts: { when: "one sunny morning", where: "through the open gate", why: "to find the corn" },
      model: "One sunny morning, Pip ran away through the open gate to find the corn.",
    },
    {
      lesson: "D",
      kernel: "Hattie planted a seed.",
      parts: { when: "in spring", where: "in the garden", why: "so corn could grow" },
      model: "In spring, Hattie planted a seed in the garden so corn could grow.",
    },
  ],
  fragments: [
    { text: "Farmer June has a red barn.", is_sentence: true },
    { text: "Ran to the garden.", is_sentence: false, fix: "Pip ran to the garden." },
    { text: "The hen waters the seed.", is_sentence: true },
    { text: "Then the tall corn.", is_sentence: false, fix: "Then the tall corn grew." },
    { text: "When Pip got out.", is_sentence: false, fix: "Farmer June laughed when Pip got out." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Hattie, ___, plants a seed.",
      noun: "Hattie",
      options: ["a brown hen", "a tall corn plant", "a big red barn"],
      answer: 0,
      model: "Hattie, a brown hen, plants a seed.",
    },
    {
      lesson: "C",
      sentence: "Farmer June, ___, saw Pip in the garden.",
      noun: "Farmer June",
      options: ["a pig that likes corn", "a woman who cares for animals", "a seed in the ground"],
      answer: 1,
      model: "Farmer June, a woman who cares for animals, saw Pip in the garden.",
    },
    {
      lesson: "D",
      sentence: "A seed, ___, can grow into corn.",
      noun: "seed",
      options: ["a big building for animals", "a person who grows food", "a tiny thing that grows"],
      answer: 2,
      model: "A seed, a tiny thing that grows, can grow into corn.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "Farmer June laughed", model: "When she saw Pip in the corn, Farmer June laughed." },
    { lesson: "D", conjunction: "after", stem: "Hattie picked the corn", model: "After the corn grew tall, Hattie picked the corn." },
    { lesson: "B", conjunction: "before", stem: "Pip ran to the garden", model: "Before Farmer June woke up, Pip ran to the garden." },
  ],
  spo: {
    topic: {
      l1_2: "Hattie Hen grows [corn].",
      l3_4: "This is a story about [Hattie Hen] and the [corn].",
      l5_6: "Although [Hattie Hen] had a problem on the farm, she found a way to [solve it].",
    },
    starters: [
      { type: "question", text: "Can a little hen grow a whole corn plant?" },
      { type: "appositive", text: "Hattie, a hen on a farm, planted a seed." },
      { type: "subordinate", text: "When no rain came, Hattie watered the seed." },
    ],
    details: [
      { note: "Hattie Hen on a farm", lesson: "A" },
      { note: "first: plants seed", lesson: "B" },
      { note: "problem: no rain", lesson: "C" },
      { note: "next: waters seed = solved", lesson: "C" },
      { note: "then: corn grows tall", lesson: "D" },
      { note: "last: picks corn", lesson: "B" },
    ],
    distractors: ["pigs like mud", "Farmer June drives a tractor"],
    conclusion: {
      l1_2: "Last, Hattie [picks the corn].",
      l3_4: "Last, Hattie [picks the corn] and is [happy].",
      l5_6: "Because Hattie [watered the seed], the corn grew tall and she [picked it at last].",
    },
  },
  prompt: {
    l1_2: "Draw your farm story. Write 1-3 sentences. Tell first, next, and last.",
    l3_4: "Write a farm story about Hattie or your own animal. Tell the problem and how it ends. Use first, next, and last.",
    l5_6: "Write a farm story with a problem and a turning point. Include an appositive and a sentence that starts with when or before.",
  },
  transitions: ["First,", "Next,", "Then,", "Last,", "One day,", "But", "So", "At last,"],
  model: {
    l1_2: "First, Hattie plants a seed. Then the corn grows.",
    l3_4: "Hattie Hen finds a seed on the farm. First, she plants it. But no rain comes, so she waters it. Last, the corn grows tall.",
    l5_6: "Hattie, a hen on a farm, found a seed. First, she planted it. When no rain came, she watered it. Then the corn grew tall, so Hattie picked it.",
  },
  revise: [
    "Did I tell who is in my story and where it happens?",
    "Did I use first, next, and last?",
    "Did I tell the problem and how it was solved?",
    "Did each sentence tell what happened?",
  ],
};

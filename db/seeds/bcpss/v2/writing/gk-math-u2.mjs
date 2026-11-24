// BCPSS Writing Lab (TWR) — gk-math-u2 · Compare Numbers & Quantities to 10. Contract: ../writing-schema.mjs

export default {
  title: "Which Group Has More",
  genre: "inform",
  tip: "Have partners line up two small groups of blocks one to one, then say more, fewer, or same before writing.",
  lessons: [
    { id: "A", title: "Matching groups one to one" },
    { id: "B", title: "More and fewer" },
    { id: "C", title: "Same and equal groups" },
    { id: "D", title: "Comparing numbers to 10" },
  ],
  source: {
    title: "Blocks at the Park",
    lesson: "B",
    text: "Dee and Omar play. Dee has 8 blocks. Omar has 6 blocks. Dee has more blocks. Omar has fewer blocks. Omar finds 2 more. Now they have the same.",
  },
  notes: [
    { sentence: "Dee has more blocks.", note: "Dee = more" },
    { sentence: "Omar has fewer blocks.", note: "Omar = fewer" },
    { sentence: "Omar finds 2 more.", note: "6 + 2" },
    { sentence: "Now they have the same.", note: "8 = 8 same" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Dee has more blocks than Omar",
      because: "she has 8 and he has 6.",
      but: "he can find 2 more.",
      so: "he wants to catch up.",
    },
    {
      lesson: "C",
      kernel: "Both groups have 5 stars",
      because: "5 stars match 5 stars.",
      but: "the stars are different colors.",
      so: "the groups are equal.",
    },
    {
      lesson: "A",
      kernel: "Mia lines up her counters",
      because: "matching shows which has more.",
      but: "one row has no match left.",
      so: "she sees which row has more.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Dee has blocks.",
      parts: { when: "after school", where: "at the park", why: "to build a tower" },
      model: "After school, Dee has blocks at the park to build a tower.",
    },
    {
      lesson: "C",
      kernel: "Omar finds more.",
      parts: { when: "then", where: "in the box", what: "2 more blocks" },
      model: "Then Omar finds 2 more blocks in the box.",
    },
  ],
  fragments: [
    { text: "Dee has more blocks.", is_sentence: true },
    { text: "More than 6.", is_sentence: false, fix: "8 is more than 6." },
    { text: "Omar has fewer blocks.", is_sentence: true },
    { text: "The same number.", is_sentence: false, fix: "Both groups have the same number." },
    { text: "When we match.", is_sentence: false, fix: "We see which has more when we match." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Dee, ___, has 8 blocks.",
      noun: "Dee",
      options: ["a girl at the park", "a number that is bigger", "two groups that match"],
      answer: 0,
      model: "Dee, a girl at the park, has 8 blocks.",
    },
    {
      lesson: "C",
      sentence: "Equal, ___, tells that two groups match.",
      noun: "Equal",
      options: ["a bigger number of things", "the word for exactly the same amount", "a smaller number of things"],
      answer: 1,
      model: "Equal, the word for exactly the same amount, tells that two groups match.",
    },
    {
      lesson: "D",
      sentence: "Fewer, ___, tells about the smaller group.",
      noun: "Fewer",
      options: ["the number for no things", "a group of 10 blocks", "a word for a smaller number of things"],
      answer: 2,
      model: "Fewer, a word for a smaller number of things, tells about the smaller group.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "I see which group has more", model: "When I match one to one, I see which group has more." },
    { lesson: "B", conjunction: "because", stem: "Dee has more blocks", model: "Because 8 is more than 6, Dee has more blocks." },
    { lesson: "C", conjunction: "unless", stem: "the groups stay the same", model: "Unless someone adds more, the groups stay the same." },
  ],
  spo: {
    topic: {
      l1_2: "[Dee] has more blocks than [Omar].",
      l3_4: "[Dee] has [more] blocks than [Omar], but they can make the groups [equal].",
      l5_6: "Although [Dee and Omar] start with different groups, [they can make them the same].",
    },
    starters: [
      { type: "question", text: "Who has more blocks, Dee or Omar?" },
      { type: "appositive", text: "Dee, a girl at the park, has 8 blocks." },
      { type: "subordinate", text: "Because 8 is more than 6, Dee has more." },
    ],
    details: [
      { note: "Dee 8 blocks", lesson: "B" },
      { note: "Omar 6 blocks", lesson: "B" },
      { note: "8 is more than 6", lesson: "D" },
      { note: "Dee = more, Omar = fewer", lesson: "B" },
      { note: "Omar finds 2 more", lesson: "C" },
      { note: "now 8 and 8 = same", lesson: "C" },
    ],
    distractors: ["blocks are made of wood", "Dee likes the park"],
    conclusion: {
      l1_2: "Now they have the [same].",
      l3_4: "Now both have [8] blocks, so the groups are [equal].",
      l5_6: "After Omar finds [2 more], both groups have [8], so they are [equal].",
    },
  },
  prompt: {
    l1_2: "Draw two groups of things. Write 1-3 sentences. Tell which group has more.",
    l3_4: "Draw two groups and compare them. Tell which has more and which has fewer. Use your outline.",
    l5_6: "Compare two groups and tell how you know. Include an appositive and a sentence that starts with because or when.",
  },
  transitions: ["First,", "Next,", "Then,", "Now,", "because", "but", "so", "both"],
  model: {
    l1_2: "Dee has 8 blocks. Omar has 6 blocks. Dee has more.",
    l3_4: "Dee has 8 blocks and Omar has 6 blocks. Dee has more because 8 is more than 6. Omar has fewer. Omar finds 2 more, so they have the same.",
    l5_6: "Dee, a girl at the park, has 8 blocks. Omar has 6 blocks. Because 8 is more than 6, Dee has more. When Omar finds 2 more, both groups are equal.",
  },
  revise: [
    "Did I say which group has more and which has fewer?",
    "Did I use numbers to show how I know?",
    "Did I use both or same when the groups match?",
    "Did I use because or but in a sentence?",
  ],
};

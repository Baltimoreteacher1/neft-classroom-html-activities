// BCPSS Writing Lab (TWR) — gk-math-u1 · Count & Represent Numbers to 10. Contract: ../writing-schema.mjs

export default {
  title: "Rosa Counts at the Harbor",
  genre: "inform",
  tip: "Let children touch and count real objects while they say each number, then write how many and how they know.",
  lessons: [
    { id: "A", title: "Counting with one-to-one touches" },
    { id: "B", title: "The last number tells how many" },
    { id: "C", title: "Seeing small groups and ten frames" },
    { id: "D", title: "Writing numbers and zero" },
  ],
  source: {
    title: "Counting Boats and Birds",
    lesson: "A",
    text: "Rosa is at the Inner Harbor. She counts 3 red boats. She counts 5 white birds. She counts 2 big ships. She touches each one once. Then she says the last number.",
  },
  notes: [
    { sentence: "She counts 3 red boats.", note: "3 red boats" },
    { sentence: "She counts 5 white birds.", note: "5 white birds" },
    { sentence: "She touches each one once.", note: "touch each, 1x" },
    { sentence: "Then she says the last number.", note: "last # = how many" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Rosa counts the boats",
      because: "she wants to know how many.",
      but: "one boat sails away.",
      so: "she counts again.",
    },
    {
      lesson: "B",
      kernel: "Jay touches each crab once",
      because: "he must not count one twice.",
      but: "the last crab is hiding under a net.",
      so: "the last number he says is 6.",
    },
    {
      lesson: "C",
      kernel: "Mia sees 3 dots on the die",
      because: "she knows 3 dots by looking.",
      but: "she cannot know 8 dots that fast.",
      so: "she counts the bigger group.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Rosa counts boats.",
      parts: { when: "at noon", where: "at the Inner Harbor", how: "with her finger" },
      model: "At noon, Rosa counts boats at the Inner Harbor with her finger.",
    },
    {
      lesson: "D",
      kernel: "Jay writes a number.",
      parts: { when: "after counting the crabs", where: "on his paper", how: "with a pencil" },
      model: "After counting the crabs, Jay writes a number on his paper with a pencil.",
    },
  ],
  fragments: [
    { text: "There are 6 crabs.", is_sentence: true },
    { text: "Counts the shells.", is_sentence: false, fix: "Mia counts the shells." },
    { text: "The last number tells how many.", is_sentence: true },
    { text: "Each star once.", is_sentence: false, fix: "I touch each star once." },
    { text: "When I count.", is_sentence: false, fix: "I touch each one when I count." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Rosa, ___, counts at the harbor.",
      noun: "Rosa",
      options: ["a girl with a notebook", "a box with 10 spaces", "the number for none"],
      answer: 0,
      model: "Rosa, a girl with a notebook, counts at the harbor.",
    },
    {
      lesson: "C",
      sentence: "A ten frame, ___, helps me count.",
      noun: "ten frame",
      options: ["the number for no things", "a box with 10 spaces", "a group of crabs"],
      answer: 1,
      model: "A ten frame, a box with 10 spaces, helps me count.",
    },
    {
      lesson: "D",
      sentence: "Zero, ___, tells how many are in an empty basket.",
      noun: "Zero",
      options: ["a box with 2 rows of 5", "the last number I say", "the number for no things"],
      answer: 2,
      model: "Zero, the number for no things, tells how many are in an empty basket.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "I touch each crab once", model: "When I count, I touch each crab once." },
    { lesson: "B", conjunction: "after", stem: "I say the last number", model: "After I touch the last crab, I say the last number." },
    { lesson: "C", conjunction: "if", stem: "I do not need to count", model: "If I see 3 dots, I do not need to count." },
  ],
  spo: {
    topic: {
      l1_2: "Rosa counts [things] at the harbor.",
      l3_4: "Rosa counts [10] things at the Inner Harbor and tells how many.",
      l5_6: "At the Inner Harbor, Rosa counts [boats, birds, and ships] by touching each one [once].",
    },
    starters: [
      { type: "question", text: "How many boats can you count?" },
      { type: "appositive", text: "Rosa, a girl at the harbor, counts everything." },
      { type: "subordinate", text: "When Rosa counts, she touches each one once." },
    ],
    details: [
      { note: "3 red boats", lesson: "A" },
      { note: "5 white birds", lesson: "A" },
      { note: "2 big ships", lesson: "A" },
      { note: "touch each one once", lesson: "B" },
      { note: "last number = how many", lesson: "B" },
      { note: "all together: 10 things", lesson: "C" },
    ],
    distractors: ["ships carry big boxes", "Rosa lives near the harbor"],
    conclusion: {
      l1_2: "There are [10] things in all.",
      l3_4: "The last number is [10], so there are [10] things in all.",
      l5_6: "Because Rosa touched each one once, the last number [10] tells [how many] there are.",
    },
  },
  prompt: {
    l1_2: "Draw a group of things. Count them. Write 1-3 sentences to tell how many.",
    l3_4: "Draw and count a group. Write how many and how you know. Use your outline and because.",
    l5_6: "Count a group and explain how you know there are that many. Include an appositive and a sentence that starts with when or after.",
  },
  transitions: ["First,", "Next,", "Then,", "Last,", "In all,", "because", "so", "and"],
  model: {
    l1_2: "There are 5 birds. I counted each bird once.",
    l3_4: "Rosa counts things at the Inner Harbor. She counts 3 red boats and 5 white birds. She counts 2 big ships. There are 10 things because she touched each one once.",
    l5_6: "Rosa, a girl at the harbor, counts everything. When she counts, she touches each one once. She counts 3 boats, 5 birds, and 2 ships. The last number she says is 10, so there are 10 in all.",
  },
  revise: [
    "Did I tell how many with a number?",
    "Did I say I touched each one once?",
    "Did I say the last number tells how many?",
    "Did I use because or so to tell how I know?",
  ],
};

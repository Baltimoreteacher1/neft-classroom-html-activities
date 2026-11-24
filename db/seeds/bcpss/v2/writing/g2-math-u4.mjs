// BCPSS Writing Lab (TWR) — g2-math-u4 · Measure & Compare Lengths (Standard Units). Contract: ../writing-schema.mjs

export default {
  title: "Why the Number Changes",
  genre: "explain",
  tip: "Let students measure one object with two units and count out loud before they explain why the numbers differ.",
  lessons: [
    { id: "A", title: "Measure with inches and feet" },
    { id: "B", title: "Measure with centimeters and meters" },
    { id: "C", title: "A smaller unit gives a bigger number" },
    { id: "D", title: "Compare lengths and find the difference" },
  ],
  source: {
    title: "Mia and the Crab Shell",
    lesson: "C",
    text: "Mia finds a blue crab shell at the beach. She measures it with a ruler. The shell is 6 inches wide. Then she measures it in centimeters. A centimeter is smaller than an inch. So Mia counts more centimeters. The shell is about 15 centimeters wide.",
  },
  notes: [
    { sentence: "The shell is 6 inches wide.", note: "shell: 6 inches" },
    { sentence: "A centimeter is smaller than an inch.", note: "cm < inch" },
    { sentence: "So Mia counts more centimeters.", note: "small unit → more" },
    { sentence: "The shell is about 15 centimeters wide.", note: "shell ≈ 15 cm" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Mia counts more centimeters than inches",
      because: "a centimeter is smaller than an inch.",
      but: "the shell is still the same length.",
      so: "the number for centimeters is bigger.",
    },
    {
      lesson: "A",
      kernel: "A foot is longer than an inch",
      because: "a foot is the same as 12 inches.",
      but: "both units measure the same kind of thing, length.",
      so: "a rope that is 3 feet long is 36 inches long.",
    },
    {
      lesson: "D",
      kernel: "The ribbon is 3 inches longer than the bookmark",
      because: "the ribbon is 8 inches and the bookmark is 5 inches.",
      but: "both are shorter than one foot.",
      so: "we subtract 8 − 5 to compare them.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Mia measured the shell.",
      parts: { where: "at the beach", how: "with a ruler", why: "to find its length" },
      model: "At the beach, Mia measured the shell with a ruler to find its length.",
    },
    {
      lesson: "C",
      kernel: "Tom counted more centimeters.",
      parts: { when: "after measuring in inches", where: "along the edge of his desk", why: "because centimeters are small" },
      model: "After measuring in inches, Tom counted more centimeters along the edge of his desk because centimeters are small.",
    },
  ],
  fragments: [
    { text: "A centimeter is smaller than an inch.", is_sentence: true },
    { text: "Because the unit is smaller.", is_sentence: false, fix: "We count more because the unit is smaller." },
    { text: "Measured the shell with a ruler.", is_sentence: false, fix: "Mia measured the shell with a ruler." },
    { text: "A foot is the same as 12 inches.", is_sentence: true },
    { text: "The rope in feet.", is_sentence: false, fix: "The rope is 3 feet long." },
    { text: "So Mia counts more centimeters.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A ruler, ___, has marks and numbers.",
      noun: "ruler",
      options: ["a flat tool for measuring length", "a long metric unit of length", "a unit that is the same as 12 inches"],
      answer: 0,
      model: "A ruler, a flat tool for measuring length, has marks and numbers.",
    },
    {
      lesson: "B",
      sentence: "A meter, ___, is a little more than 3 feet long.",
      noun: "meter",
      options: ["a tool with marks and numbers", "a long metric unit of length", "a small unit about as wide as a fingernail"],
      answer: 1,
      model: "A meter, a long metric unit of length, is a little more than 3 feet long.",
    },
    {
      lesson: "C",
      sentence: "A centimeter, ___, is smaller than an inch.",
      noun: "centimeter",
      options: ["a flat tool with marks and numbers", "a unit equal to 12 inches", "a small metric unit of length"],
      answer: 2,
      model: "A centimeter, a small metric unit of length, is smaller than an inch.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "Mia counts more centimeters than inches", model: "Because a centimeter is smaller than an inch, Mia counts more centimeters than inches." },
    { lesson: "A", conjunction: "when", stem: "we count fewer units", model: "When we use a bigger unit, we count fewer units." },
    { lesson: "B", conjunction: "if", stem: "the number is bigger", model: "If we measure the shell in centimeters, the number is bigger." },
  ],
  spo: {
    topic: {
      l1_2: "A smaller unit gives a [bigger] number.",
      l3_4: "The same [shell] has a [bigger number] in centimeters because [a centimeter is smaller than an inch].",
      l5_6: "Although [the shell] stays the same length, [its number changes] because [a smaller unit needs more copies to cover it].",
    },
    starters: [
      { type: "question", text: "Why does one shell have two different measures?" },
      { type: "appositive", text: "A centimeter, a small metric unit of length, is smaller than an inch." },
      { type: "subordinate", text: "When we use a smaller unit, we count more of them." },
    ],
    details: [
      { note: "shell = 6 inches wide", lesson: "A" },
      { note: "shell ≈ 15 centimeters wide", lesson: "B" },
      { note: "centimeter smaller than inch", lesson: "C" },
      { note: "smaller unit → count more", lesson: "C" },
      { note: "same shell, same length", lesson: "C" },
      { note: "bigger number, smaller unit", lesson: "D" },
    ],
    distractors: ["blue crabs have ten legs", "the beach has soft sand"],
    conclusion: {
      l1_2: "So a [smaller] unit gives a [bigger] number.",
      l3_4: "So the shell has a [bigger] number in [centimeters] because [the unit is smaller].",
      l5_6: "In conclusion, [the length stays the same], but [a smaller unit needs more copies], so [the number gets bigger].",
    },
  },
  prompt: {
    l1_2: "Draw a shell and a ruler. Write 1-3 sentences about the two numbers.",
    l3_4: "Write a paragraph that explains why Mia counts more centimeters than inches for the same shell. Use because and so.",
    l5_6: "Write a paragraph that explains why one shell has two different numbers. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Next,", "Because", "So", "That is why", "As a result,", "When", "For example,"],
  model: {
    l1_2: "The shell is 6 inches wide. It is about 15 centimeters wide. A centimeter is smaller.",
    l3_4: "Mia measures a blue crab shell in two ways. It is 6 inches wide and about 15 centimeters wide. She counts more centimeters because a centimeter is smaller than an inch. That is why the number is bigger.",
    l5_6: "Although the shell stays the same length, its number changes. A centimeter, a small metric unit, is smaller than an inch. When Mia uses a smaller unit, she counts more of them. So the shell is 6 inches but about 15 centimeters. The unit changed, but the shell did not.",
  },
  revise: [
    "Did I tell why the number changes?",
    "Did I use because and so to link the cause and the effect?",
    "Did I use the real measures, 6 inches and about 15 centimeters?",
    "Did I name the units, like inches and centimeters, every time?",
  ],
};

// BCPSS Writing Lab (TWR) — g1-math-u2 · Place Value: Tens & Ones to 120. Contract: ../writing-schema.mjs

export default {
  title: "Which Number Is Greater?",
  genre: "inform",
  tip: "Build both numbers with ten-sticks and cubes first so students can point to the tens they compare in their sentences.",
  lessons: [
    { id: "A", title: "Count to 120 and make groups of ten" },
    { id: "B", title: "Show numbers as tens and ones" },
    { id: "C", title: "Compare with greater than and less than" },
  ],
  source: {
    title: "Acorns in the Park",
    lesson: "B",
    text: "Marcus and Zoe collect acorns in Patterson Park. Marcus has 52 acorns. Zoe has 47 acorns. 52 has 5 tens and 2 ones. 47 has 4 tens and 7 ones. Both numbers have two digits. 5 tens is more than 4 tens. So 52 is greater than 47.",
  },
  notes: [
    { sentence: "52 has 5 tens and 2 ones.", note: "52 = 5 tens 2 ones" },
    { sentence: "Both numbers have two digits.", note: "both = 2 digits" },
    { sentence: "5 tens is more than 4 tens.", note: "5 tens > 4 tens" },
    { sentence: "So 52 is greater than 47.", note: "52 > 47" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "63 is greater than 58",
      because: "6 tens is more than 5 tens.",
      but: "58 has more ones than 63.",
      so: "we compare the tens first.",
    },
    {
      lesson: "B",
      kernel: "41 and 48 both have 4 tens",
      because: "the digit in the tens place is 4.",
      but: "their ones are different.",
      so: "we look at the ones to compare them.",
    },
    {
      lesson: "A",
      kernel: "Zoe put her acorns in groups of ten",
      because: "ten at a time is easy to count.",
      but: "she had a few acorns left over.",
      so: "she counted the leftovers as ones.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Zoe counted acorns.",
      parts: { when: "on Saturday", where: "in Patterson Park", how: "in groups of ten" },
      model: "On Saturday, Zoe counted acorns in Patterson Park in groups of ten.",
    },
    {
      lesson: "B",
      kernel: "Ava made 63.",
      parts: { when: "before the lesson", what: "with 6 tens and 3 ones", where: "on her mat" },
      model: "Before the lesson, Ava made 63 with 6 tens and 3 ones on her mat.",
    },
  ],
  fragments: [
    { text: "63 has 6 tens and 3 ones.", is_sentence: true },
    { text: "Greater than 58.", is_sentence: false, fix: "63 is greater than 58." },
    { text: "Both numbers have two digits.", is_sentence: true },
    { text: "With 4 tens and 7 ones.", is_sentence: false, fix: "The number 47 is made with 4 tens and 7 ones." },
    { text: "Because 6 tens is more than 5 tens.", is_sentence: false, fix: "63 is greater than 58 because 6 tens is more than 5 tens." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Marcus, ___, has 52 acorns.",
      noun: "Marcus",
      options: ["a boy who collects acorns", "a number with two digits", "a group of ten"],
      answer: 0,
      model: "Marcus, a boy who collects acorns, has 52 acorns.",
    },
    {
      lesson: "B",
      sentence: "The digit 5, ___, is in the tens place of 52.",
      noun: "The digit 5",
      options: ["a group of 2 ones", "the digit that stands for 5 tens", "the sum of 52 and 47"],
      answer: 1,
      model: "The digit 5, the digit that stands for 5 tens, is in the tens place of 52.",
    },
    {
      lesson: "C",
      sentence: "Patterson Park, ___, is where they collect acorns.",
      noun: "Patterson Park",
      options: ["a group of ten", "a number with two digits", "a big park in Baltimore"],
      answer: 2,
      model: "Patterson Park, a big park in Baltimore, is where they collect acorns.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "Marcus has more acorns", model: "Because 52 is greater than 47, Marcus has more acorns." },
    { lesson: "B", conjunction: "although", stem: "52 is the greater number", model: "Although 47 has more ones than 52, 52 is the greater number." },
    { lesson: "C", conjunction: "when", stem: "we look at the tens first", model: "When we compare two numbers, we look at the tens first." },
  ],
  spo: {
    topic: {
      l1_2: "[52] is greater than [47].",
      l3_4: "[52] and [47] are alike and different. [52] is greater.",
      l5_6: "Although both [52] and [47] have two digits, [52] is greater than [47] because [reason].",
    },
    starters: [
      { type: "question", text: "Which number is greater, 52 or 47, and how do we know?" },
      { type: "appositive", text: "52, a number with 5 tens, is greater than 47." },
      { type: "statement", text: "Both 52 and 47 have two digits, but they are not the same." },
    ],
    details: [
      { note: "52 = 5 tens 2 ones", lesson: "B" },
      { note: "47 = 4 tens 7 ones", lesson: "B" },
      { note: "both have 2 digits", lesson: "B" },
      { note: "5 tens > 4 tens", lesson: "C" },
      { note: "52 > 47", lesson: "C" },
      { note: "count by tens to 120", lesson: "A" },
    ],
    distractors: ["oak trees are tall", "Zoe likes the park slide"],
    conclusion: {
      l1_2: "So [Marcus] has [more].",
      l3_4: "So [52] is greater than [47] because [5 tens is more than 4 tens].",
      l5_6: "Because [the tens are worth more], [Marcus has more acorns than Zoe].",
    },
  },
  prompt: {
    l1_2: "Draw 52 and 47 with tens and ones. Write 1-3 sentences. Tell which number is greater.",
    l3_4: "Compare 52 and 47. Tell what is alike and what is different. Use both and but.",
    l5_6: "Compare 52 and 47. Tell how they are alike and different and which is greater. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Both", "Also,", "But", "However,", "On the other hand,", "Because", "So", "In the end,"],
  model: {
    l1_2: "52 has 5 tens. 47 has 4 tens. 52 is greater than 47.",
    l3_4: "Both 52 and 47 have two digits. 52 has 5 tens, but 47 has 4 tens. So 52 is greater than 47. We compare the tens first.",
    l5_6: "Both 52 and 47 have two digits, so we compare the tens first. 52, a number with 5 tens and 2 ones, is greater than 47. Although 47 has more ones, 5 tens is more than 4 tens. Because the tens are worth more, Marcus has more acorns than Zoe.",
  },
  revise: [
    "Did I tell one way the numbers are alike?",
    "Did I tell one way they are different?",
    "Did I say which number is greater and why?",
    "Did I write the tens and ones for each number?",
  ],
};

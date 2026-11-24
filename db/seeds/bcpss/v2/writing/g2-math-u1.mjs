// BCPSS Writing Lab (TWR) — g2-math-u1 · Place Value to 1,000. Contract: ../writing-schema.mjs

export default {
  title: "Which Number Is Greater?",
  genre: "inform",
  tip: "Build both numbers with place value blocks first so students can point to the hundreds, tens, and ones as they write.",
  lessons: [
    { id: "A", title: "Hundreds, tens, and ones" },
    { id: "B", title: "Expanded form and word form" },
    { id: "C", title: "Compare three-digit numbers" },
  ],
  source: {
    title: "Riders on the North Avenue Bus",
    lesson: "C",
    text: "The North Avenue bus carries 417 riders on Monday. It carries 428 riders on Tuesday. Both numbers have 4 hundreds. But the tens are different. The number 417 has 1 ten. The number 428 has 2 tens. So 428 is greater than 417.",
  },
  notes: [
    { sentence: "Both numbers have 4 hundreds.", note: "both = 4 hundreds" },
    { sentence: "The number 417 has 1 ten.", note: "417 = 1 ten" },
    { sentence: "The number 428 has 2 tens.", note: "428 = 2 tens" },
    { sentence: "So 428 is greater than 417.", note: "428 > 417" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "The number 428 is greater than 417",
      because: "it has 2 tens and 417 has only 1 ten.",
      but: "both numbers have 4 hundreds.",
      so: "428 comes after 417 on a number line.",
    },
    {
      lesson: "A",
      kernel: "The 7 in 372 is worth 70",
      because: "it sits in the tens place.",
      but: "the 7 in 237 is worth only 7.",
      so: "we must look at the place, not just the digit.",
    },
    {
      lesson: "B",
      kernel: "The number 305 is three hundred five",
      because: "it has 3 hundreds, 0 tens, and 5 ones.",
      but: "we do not say any tens in the word form.",
      so: "we can write 305 as 300 + 5.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Tomas counted shells.",
      parts: { where: "on the beach", how: "in piles of one hundred", why: "to find the total" },
      model: "On the beach, Tomas counted shells in piles of one hundred to find the total.",
    },
    {
      lesson: "C",
      kernel: "Ava compared two numbers.",
      parts: { where: "on her paper", how: "by looking at the hundreds first", why: "to see which one is greater" },
      model: "On her paper, Ava compared two numbers by looking at the hundreds first to see which one is greater.",
    },
  ],
  fragments: [
    { text: "The digit 5 is in the tens place.", is_sentence: true },
    { text: "Greater than 538.", is_sentence: false, fix: "546 is greater than 538." },
    { text: "Because it has more tens.", is_sentence: false, fix: "546 is greater because it has more tens." },
    { text: "A hundred is ten tens.", is_sentence: true },
    { text: "Has three digits.", is_sentence: false, fix: "The number 214 has three digits." },
    { text: "Both numbers have 5 hundreds.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A digit, ___, can be worth different amounts.",
      noun: "digit",
      options: ["one of the symbols 0 to 9", "a group of 10 tens", "a way to write a number with letters"],
      answer: 0,
      model: "A digit, one of the symbols 0 to 9, can be worth different amounts.",
    },
    {
      lesson: "B",
      sentence: "Expanded form, ___, shows a number as an adding problem.",
      noun: "Expanded form",
      options: ["the name of a number in letters", "a way to write a number by its place values", "the biggest number you can make"],
      answer: 1,
      model: "Expanded form, a way to write a number by its place values, shows a number as an adding problem.",
    },
    {
      lesson: "C",
      sentence: "The greater than sign, ___, opens toward the bigger number.",
      noun: "greater than sign",
      options: ["a digit in the hundreds place", "a number with three digits", "a symbol that compares two numbers"],
      answer: 2,
      model: "The greater than sign, a symbol that compares two numbers, opens toward the bigger number.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the 7 is worth 70", model: "When the 7 sits in the tens place, the 7 is worth 70." },
    { lesson: "B", conjunction: "after", stem: "we can say three hundred five", model: "After we write 300 + 5, we can say three hundred five." },
    { lesson: "C", conjunction: "if", stem: "we compare the tens", model: "If two numbers have the same hundreds, we compare the tens." },
  ],
  spo: {
    topic: {
      l1_2: "[428] is greater than [417].",
      l3_4: "[428] is greater than [417] because it has more [tens].",
      l5_6: "Although [428] and [417] both have [4 hundreds], [428] is greater because [it has 2 tens and 417 has only 1 ten].",
    },
    starters: [
      { type: "question", text: "Which number is greater, 417 or 428?" },
      { type: "appositive", text: "The number 428, the count for Tuesday, is greater than 417." },
      { type: "subordinate", text: "When two numbers have the same hundreds, we compare the tens." },
    ],
    details: [
      { note: "Monday 417, Tuesday 428", lesson: "A" },
      { note: "both have 4 hundreds", lesson: "A" },
      { note: "417 = 400 + 10 + 7", lesson: "B" },
      { note: "428 = 400 + 20 + 8", lesson: "B" },
      { note: "compare hundreds, then tens", lesson: "C" },
      { note: "2 tens > 1 ten", lesson: "C" },
    ],
    distractors: ["the bus has a blue stripe", "riders pay with a pass"],
    conclusion: {
      l1_2: "So [428] is [greater].",
      l3_4: "So [428] is greater than [417] because [it has more tens].",
      l5_6: "In conclusion, [428] is greater than [417], and the [tens place] is how we know.",
    },
  },
  prompt: {
    l1_2: "Draw 417 and 428 with place value blocks. Write 1-3 sentences about which number is greater.",
    l3_4: "Write a paragraph that compares 417 and 428. Tell what is the same, what is different, and which number is greater. Use both, but, and because.",
    l5_6: "Write a paragraph that compares 417 and 428. Include an appositive, a sentence that starts with although or when, and the expanded form of each number.",
  },
  transitions: ["First,", "Both", "But", "Because", "So", "Also,", "Whereas", "In the end,"],
  model: {
    l1_2: "428 is greater than 417. It has 2 tens, and 417 has 1 ten.",
    l3_4: "428 is greater than 417 because it has more tens. Both numbers have 4 hundreds. But 428 has 2 tens, and 417 has only 1 ten. So 428 comes after 417.",
    l5_6: "Although 417 and 428 both have 4 hundreds, 428 is greater. The number 428, the count for Tuesday, has 2 tens. The number 417 has only 1 ten, so Monday had fewer riders. In expanded form, 428 is 400 + 20 + 8.",
  },
  revise: [
    "Did I use the right numbers and say which one is greater?",
    "Did I tell what is the same with both and what is different with but?",
    "Did I compare the hundreds first, then the tens?",
    "Did I use hundreds, tens, and ones correctly?",
  ],
};

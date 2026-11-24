// BCPSS Writing Lab (TWR) — g5-math-u2 · Decimal Place Value & Powers of 10. Contract: ../writing-schema.mjs

export default {
  title: "Why the Digits Shift",
  genre: "explain",
  tip: "Use a place-value chart on the board so students can point to each digit as it moves while they say the because sentence.",
  lessons: [
    { id: "A", title: "Place value to the thousandths" },
    { id: "B", title: "Comparing and rounding decimals" },
    { id: "C", title: "Multiplying decimals by powers of 10" },
    { id: "D", title: "Dividing by powers of 10 and using exponents" },
  ],
  source: {
    title: "The Patterson Park Path",
    lesson: "C",
    text: "A walking path in Patterson Park is 0.45 kilometer long. Jada wants to know how many meters that is. She multiplies 0.45 by 1,000, because 1 kilometer equals 1,000 meters. Multiplying by 1,000 moves each digit three places to the left, so 0.45 becomes 450. The path is 450 meters long. Jada checks her work by dividing 450 by 1,000. Dividing moves each digit three places to the right, and she gets 0.45 again.",
  },
  notes: [
    { sentence: "She multiplies 0.45 by 1,000, because 1 kilometer equals 1,000 meters.", note: "× 1,000 b/c 1 km = 1,000 m" },
    { sentence: "Multiplying by 1,000 moves each digit three places to the left, so 0.45 becomes 450.", note: "× 1,000 → digits left 3 places" },
    { sentence: "The path is 450 meters long.", note: "path = 450 meters" },
    { sentence: "Dividing moves each digit three places to the right, and she gets 0.45 again.", note: "÷ 1,000 → digits right 3 places" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The 4 in 0.45 is in the tenths place",
      because: "it is the first digit after the decimal point.",
      but: "its value is only 0.4, not 4.",
      so: "the 5 in the hundredths place is worth 0.05.",
    },
    {
      lesson: "C",
      kernel: "Multiplying 0.45 by 1,000 moves the digits to the left",
      because: "each place is worth ten times as much as the place to its right.",
      but: "the digits themselves do not change.",
      so: "0.45 becomes 450.",
    },
    {
      lesson: "D",
      kernel: "Dividing 450 by 1,000 moves the digits to the right",
      because: "each place is worth one tenth as much as the place to its left.",
      but: "the digits stay in the same order.",
      so: "450 becomes 0.45 again.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Mia rounded the rainfall.",
      parts: { when: "on Monday night", how: "to the nearest tenth", why: "so the amount was easier to use" },
      model: "On Monday night, Mia rounded the rainfall to the nearest tenth so the amount was easier to use.",
    },
    {
      lesson: "C",
      kernel: "Jada multiplied.",
      parts: { where: "in Patterson Park", what: "0.45 by 1,000", why: "to change kilometers to meters" },
      model: "In Patterson Park, Jada multiplied 0.45 by 1,000 to change kilometers to meters.",
    },
  ],
  fragments: [
    { text: "The 5 is in the hundredths place.", is_sentence: true },
    { text: "Because each place is worth ten times as much.", is_sentence: false, fix: "The digits move left because each place is worth ten times as much." },
    { text: "Multiplying by 1,000 moves the digits three places to the left.", is_sentence: true },
    { text: "Moves each digit one place to the right.", is_sentence: false, fix: "Dividing by 10 moves each digit one place to the right." },
    { text: "The decimal point that separates whole numbers from parts.", is_sentence: false, fix: "The decimal point separates whole numbers from parts." },
    { text: "When Jada divides 450 by 1,000.", is_sentence: false, fix: "She gets 0.45 when she divides 450 by 1,000." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A thousandth, ___, is written in the third place after the decimal point.",
      noun: "thousandth",
      options: ["one of 1,000 equal parts of a whole", "the dot that separates whole numbers from parts", "a small raised number that shows repeated factors"],
      answer: 0,
      model: "A thousandth, one of 1,000 equal parts of a whole, is written in the third place after the decimal point.",
    },
    {
      lesson: "C",
      sentence: "A power of 10, ___, shifts the digits of a decimal.",
      noun: "power of 10",
      options: ["a way to write a number as a sum of its digits", "a number made by multiplying 10 by itself", "the answer to a division problem"],
      answer: 1,
      model: "A power of 10, a number made by multiplying 10 by itself, shifts the digits of a decimal.",
    },
    {
      lesson: "D",
      sentence: "An exponent, ___, shows up in 10³ as the 3.",
      noun: "exponent",
      options: ["the dot that separates the whole number from the parts", "a way to round to a nearby number", "a small raised number that tells how many times to use the base as a factor"],
      answer: 2,
      model: "An exponent, a small raised number that tells how many times to use the base as a factor, shows up in 10³ as the 3.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the digit rounds up", model: "When the digit to the right is 5 or more, the digit rounds up." },
    { lesson: "C", conjunction: "because", stem: "each digit moves three places to the left", model: "Because 1,000 has three zeros, each digit moves three places to the left." },
    { lesson: "D", conjunction: "after", stem: "she divides by 1,000 to check her work", model: "After Jada multiplies by 1,000, she divides by 1,000 to check her work." },
  ],
  spo: {
    topic: {
      l1_2: "When I multiply by [1,000], the digits move to the [left].",
      l3_4: "When I multiply 0.45 by 1,000, each digit moves [three] places to the [left] because [each place is worth ten times as much].",
      l5_6: "Although [the digits themselves stay the same], multiplying 0.45 by 1,000 [changes the value of each digit] because [each place is worth ten times the place to its right].",
    },
    starters: [
      { type: "question", text: "What happens to the digits of 0.45 when you multiply by 1,000?" },
      { type: "statement", text: "Multiplying by a power of 10 moves every digit to a new place." },
      { type: "subordinate", text: "Because each place is worth ten times the next, the digits shift when we multiply by 10." },
    ],
    details: [
      { note: "0.45 km × 1,000 = 450 m", lesson: "C" },
      { note: "1,000 has 3 zeros → 3 places left", lesson: "C" },
      { note: "each place = 10 × place to its right", lesson: "A" },
      { note: "4 tenths + 5 hundredths: place value", lesson: "A" },
      { note: "check: 450 ÷ 1,000 = 0.45", lesson: "D" },
      { note: "÷ power of 10: digits move right", lesson: "D" },
    ],
    distractors: ["Patterson Park has a pagoda", "Jada walks the path after school"],
    conclusion: {
      l1_2: "The digits move [left], so the number gets [bigger].",
      l3_4: "As a result, 0.45 becomes [450] because [each digit is worth 1,000 times as much].",
      l5_6: "Therefore, multiplying by [1,000] causes [each digit to move three places left], so [0.45 kilometer equals 450 meters].",
    },
  },
  prompt: {
    l1_2: "Draw a place-value chart for 0.45. Write 2-4 sentences. Tell what happens to the digits when you multiply by 1,000.",
    l3_4: "Write a paragraph that explains what happens to the digits of 0.45 when you multiply by 1,000, and why. Use your outline, because, so, and as a result.",
    l5_6: "Write a paragraph that explains the cause and effect when 0.45 is multiplied by 1,000, and how dividing proves it. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Because", "Since", "So", "As a result,", "Therefore,", "This causes", "Next,", "To check,"],
  model: {
    l1_2: "Jada multiplies 0.45 by 1,000. The digits move three places to the left. The path is 450 meters long.",
    l3_4: "When I multiply 0.45 by 1,000, each digit moves three places to the left because every place is worth ten times as much as the place to its right. Since 1,000 has three zeros, the digits move three places, so 0.45 becomes 450. As a result, the path in Patterson Park is 450 meters long. To check, I divide 450 by 1,000, and the digits move back three places to the right.",
    l5_6: "Although the digits stay the same, multiplying 0.45 by 1,000 changes the value of every digit. Each place is worth ten times as much as the place to its right, so each digit moves three places to the left. The 4, which stood in the tenths place, moves to the hundreds place. Therefore, 0.45 kilometer becomes 450 meters. Because dividing is the opposite of multiplying, dividing 450 by 1,000 moves the digits back to 0.45. As a result, a power of 10, a number made by multiplying 10 by itself, acts like a shift key for the digits.",
  },
  mpo: {
    thesis: "Multiplying or dividing a decimal by a power of 10 causes each digit to shift places, and place value explains why.",
    paragraphs: [
      { topic: "Place value gives each digit its value.", notes: ["4 tenths, 5 hundredths", "each place = 10 × place to its right"] },
      { topic: "Multiplying by a power of 10 shifts the digits to the left.", notes: ["0.45 × 1,000 = 450", "1,000 has 3 zeros → 3 places", "result: bigger number"] },
      { topic: "Dividing by a power of 10 shifts the digits back to the right.", notes: ["450 ÷ 1,000 = 0.45", "opposite operations", "result: smaller number"] },
    ],
    conclusion: "Because every place is worth ten times the place to its right, multiplying and dividing by powers of 10 always shift the digits in a predictable way.",
  },
  revise: [
    "Did I say which way the digits move and how many places?",
    "Did I explain why with place value, not only what happened?",
    "Did I use because, so, or as a result to link each cause to its effect?",
    "Did I use the right units, kilometers and meters, and check my answer with division?",
  ],
};

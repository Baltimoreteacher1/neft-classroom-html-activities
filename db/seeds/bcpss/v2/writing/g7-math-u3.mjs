// BCPSS Writing Lab (TWR) — g7-math-u3 · Operations with Signed Rational Numbers. Contract: ../writing-schema.mjs

export default {
  title: "Why the Sign Decides",
  genre: "explain",
  tip: "Have students write the sign rule in words before the equation, so the cause is stated first and the effect follows.",
  lessons: [
    { id: "A", title: "Adding integers with zero pairs" },
    { id: "B", title: "Subtracting means adding the opposite" },
    { id: "C", title: "Multiplying and dividing signed numbers" },
    { id: "D", title: "Rational numbers as fractions and decimals" },
  ],
  source: {
    title: "A Cold Day in Baltimore",
    lesson: "B",
    text: "Zeke tracks the temperature in Baltimore on a cold winter day. At dawn it is −6 degrees Celsius. By noon it is 2 degrees. To find the change, Zeke subtracts 2 − (−6). Subtracting −6 is the same as adding 6, so the change is 8 degrees. That is a rise, so the change is positive. That night the temperature falls 3 degrees each hour for 4 hours. Zeke multiplies 4 by −3 and gets −12. The product is negative because the signs are different. Since the temperature starts at 2 and drops 12, it ends at −10 degrees.",
  },
  notes: [
    { sentence: "Subtracting −6 is the same as adding 6, so the change is 8 degrees.", note: "− (−6) = + 6 → change = 8" },
    { sentence: "Zeke multiplies 4 by −3 and gets −12.", note: "4 × (−3) = −12" },
    { sentence: "The product is negative because the signs are different.", note: "different signs → negative product" },
    { sentence: "Since the temperature starts at 2 and drops 12, it ends at −10 degrees.", note: "2 + (−12) = −10" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Subtracting a negative number raises the result",
      because: "subtracting a negative is the same as adding its opposite.",
      but: "subtracting a positive number lowers the result.",
      so: "2 − (−6) equals 8.",
    },
    {
      lesson: "C",
      kernel: "The product of 4 and −3 is negative",
      because: "the two signs are different.",
      but: "the product of −4 and −3 is positive.",
      so: "4 × (−3) equals −12.",
    },
    {
      lesson: "A",
      kernel: "A positive number and its opposite make zero",
      because: "each positive chip cancels one negative chip.",
      but: "two positive chips do not cancel each other.",
      so: "a zero pair adds nothing to the total.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Zeke subtracted a negative.",
      parts: { when: "at noon", how: "by adding its opposite", why: "to find the change in temperature" },
      model: "At noon, Zeke subtracted a negative by adding its opposite to find the change in temperature.",
    },
    {
      lesson: "C",
      kernel: "The temperature fell.",
      parts: { when: "that night", where: "in Baltimore", how: "by 3 degrees each hour for 4 hours" },
      model: "That night, the temperature fell in Baltimore by 3 degrees each hour for 4 hours.",
    },
  ],
  fragments: [
    { text: "Subtracting a negative number is the same as adding a positive.", is_sentence: true },
    { text: "Because the signs are different.", is_sentence: false, fix: "The product is negative because the signs are different." },
    { text: "Adds 8 to −3 on the number line.", is_sentence: false, fix: "Zeke adds 8 to −3 on the number line." },
    { text: "A zero pair is a positive and a negative of the same size.", is_sentence: true },
    { text: "When you divide a positive by a negative.", is_sentence: false, fix: "When you divide a positive by a negative, the quotient is negative." },
    { text: "The sum of −4 and 4 is 0.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A zero pair, ___, adds up to 0.",
      noun: "zero pair",
      options: ["one positive chip and one negative chip", "the answer to a multiplication problem", "a decimal that repeats forever"],
      answer: 0,
      model: "A zero pair, one positive chip and one negative chip, adds up to 0.",
    },
    {
      lesson: "D",
      sentence: "The number −0.75, ___, is a rational number.",
      noun: "−0.75",
      options: ["a whole number below zero", "a decimal that stops after two digits", "the answer to a division problem"],
      answer: 1,
      model: "The number −0.75, a decimal that stops after two digits, is a rational number.",
    },
    {
      lesson: "C",
      sentence: "A quotient, ___, is negative when the signs are different.",
      noun: "quotient",
      options: ["the plus or minus mark on a number", "the answer to a multiplication problem", "the answer to a division problem"],
      answer: 2,
      model: "A quotient, the answer to a division problem, is negative when the signs are different.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "the product is negative", model: "Because the signs are different, the product is negative." },
    { lesson: "B", conjunction: "since", stem: "the change is positive", model: "Since subtracting −6 is the same as adding 6, the change is positive." },
    { lesson: "A", conjunction: "when", stem: "the total is zero", model: "When a positive number meets its opposite, the total is zero." },
  ],
  spo: {
    topic: {
      l1_2: "The [signs] cause the answer to be [positive / negative].",
      l3_4: "The signs of the numbers cause the answer to be [positive or negative] because [the rule], so [the example] has an answer of [number].",
      l5_6: "Because [subtracting a negative is adding its opposite], [2 − (−6)] leads to [8], and because [the signs are different], [4 × (−3)] is [−12].",
    },
    starters: [
      { type: "question", text: "Why does subtracting a negative number make a number bigger?" },
      { type: "statement", text: "The signs of two numbers decide whether their product is positive or negative." },
      { type: "appositive", text: "Zeke, a student who tracks the temperature, uses signs to explain every change." },
    ],
    details: [
      { note: "2 − (−6) = 2 + 6", lesson: "B" },
      { note: "change = 8 degrees, a rise", lesson: "B" },
      { note: "4 × (−3) = −12", lesson: "C" },
      { note: "different signs → negative product", lesson: "C" },
      { note: "zero pair: +6 and −6 make 0", lesson: "A" },
      { note: "−3/4 = −0.75, a rational number", lesson: "D" },
    ],
    distractors: ["water freezes at 0 degrees Celsius", "the harbor has many boats"],
    conclusion: {
      l1_2: "So the [sign] tells me the [answer].",
      l3_4: "Therefore, I can look at the [signs] first to predict whether the answer will be [positive or negative].",
      l5_6: "As a result, [looking at the signs first] lets me predict [whether any answer is positive, negative, or zero] before I calculate.",
    },
  },
  prompt: {
    l1_2: "Look at 2 − (−6). Write 3 sentences. Tell what it equals and why. Use the word because.",
    l3_4: "Write a paragraph that explains why 2 − (−6) equals 8 and why 4 × (−3) is negative. Use because, so, and as a result.",
    l5_6: "Write a paragraph that explains how the signs cause the answers to 2 − (−6) and 4 × (−3). Use the temperature story, a zero pair, or the number line. Include an appositive and a sentence that starts with because or since.",
  },
  transitions: ["First,", "Because", "So", "As a result,", "This leads to", "For example,", "Since", "Therefore,"],
  model: {
    l1_2: "Subtracting a negative is the same as adding. So 2 − (−6) equals 8. The temperature rose 8 degrees.",
    l3_4: "Subtracting a negative number causes the answer to get bigger because subtracting a negative is the same as adding its opposite. For example, 2 − (−6) is the same as 2 + 6, so the change is 8 degrees. Multiplying also depends on signs. The product of 4 and −3 is negative because the signs are different. As a result, 4 × (−3) equals −12. Therefore, the signs of the numbers decide whether an answer is positive or negative.",
    l5_6: "Because subtracting a negative number is the same as adding its opposite, 2 − (−6) leads to 8. Zeke, a student who tracks the temperature, uses this idea to find that the temperature rose 8 degrees from −6 to 2. Later, the temperature falls 3 degrees each hour for 4 hours. The product 4 × (−3) is −12 because the signs are different. As a result, the temperature drops from 2 to −10 degrees. Although the numbers look small, their signs cause very different effects. A positive number and its opposite make a zero pair, which cancels to 0. Therefore, I can predict the sign of any answer by looking at the signs first.",
  },
  mpo: {
    thesis: "The signs of numbers cause the answer to a problem to be positive, negative, or zero, and Zeke's temperature story shows how.",
    paragraphs: [
      { topic: "Subtracting a negative number causes the result to rise because it is the same as adding the opposite.", notes: ["2 − (−6) = 2 + 6", "change = 8 degrees", "subtract a positive → lower"] },
      { topic: "Multiplying numbers with different signs causes a negative product.", notes: ["4 × (−3) = −12", "different signs → negative", "same signs → positive"] },
      { topic: "Zero pairs show why a number and its opposite cancel.", notes: ["+6 and −6 = 0", "additive inverses", "2 + (−12) = −10"] },
    ],
    conclusion: "Looking at the signs first lets me predict whether an answer will be positive, negative, or zero, and then I can check my calculation.",
  },
  revise: [
    "Did I state the sign rule in words and then show it with numbers?",
    "Did I use because, so, leads to, or as a result to link each cause to its effect?",
    "Is every calculation correct, such as 2 − (−6) = 8 and 4 × (−3) = −12?",
    "Did I use at least two math words, such as product, opposite, or zero pair?",
  ],
};

// BCPSS Writing Lab (TWR) — g6-math-u3 · Compute with Multi-Digit Numbers & Fractions. Contract: ../writing-schema.mjs

export default {
  title: "Explain Every Cookie Tray Step",
  genre: "explain",
  tip: "Have students cover the numbers and read only their order words aloud to check that the steps make a complete process.",
  lessons: [
    { id: "A", title: "Dividing fractions with visual models" },
    { id: "B", title: "Dividing by the reciprocal" },
    { id: "C", title: "Dividing multi-digit whole numbers" },
    { id: "D", title: "Computing with multi-digit decimals" },
  ],
  source: {
    title: "Butter for the Cookie Trays",
    lesson: "B",
    text: "Ms. Grant sells cookies at Lexington Market. She has 2/3 pound of butter, and each tray of cookies needs 1/12 pound. She wants to know how many trays she can make. First, she writes the division problem 2/3 ÷ 1/12. Next, she finds the reciprocal of 1/12, which is 12. Then she multiplies 2/3 by 12 to get 24/3, which equals 8. She can bake 8 trays because 8 groups of 1/12 fit inside 2/3. Finally, she checks the answer. Since 8 × 1/12 = 8/12, and 8/12 simplifies to 2/3, the answer works.",
  },
  notes: [
    { sentence: "Next, she finds the reciprocal of 1/12, which is 12.", note: "reciprocal of 1/12 = 12" },
    { sentence: "Then she multiplies 2/3 by 12 to get 24/3, which equals 8.", note: "2/3 × 12 = 24/3 = 8" },
    { sentence: "She can bake 8 trays because 8 groups of 1/12 fit inside 2/3.", note: "8 trays b/c 8 groups of 1/12 fit" },
    { sentence: "Since 8 × 1/12 = 8/12, and 8/12 simplifies to 2/3, the answer works.", note: "check: 8 × 1/12 = 2/3 ✓" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Ms. Grant multiplies 2/3 by 12",
      because: "dividing by 1/12 is the same as multiplying by its reciprocal.",
      but: "the problem she started with was a division problem.",
      so: "she finds that she can bake 8 trays.",
    },
    {
      lesson: "A",
      kernel: "Four groups of 1/6 fit inside 2/3",
      because: "4/6 is equal to 2/3.",
      but: "the quotient 4 is greater than both fractions.",
      so: "2/3 ÷ 1/6 equals 4.",
    },
    {
      lesson: "C",
      kernel: "Ms. Grant packs 144 cookies into boxes of 12",
      because: "dividing 144 by 12 tells how many boxes she can fill.",
      but: "she still checks the quotient by multiplying 12 × 12.",
      so: "she knows she can fill 12 boxes.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Ms. Grant multiplied.",
      parts: { when: "After finding the reciprocal", what: "2/3 by 12", why: "to solve the division problem" },
      model: "After finding the reciprocal, Ms. Grant multiplied 2/3 by 12 to solve the division problem.",
    },
    {
      lesson: "D",
      kernel: "Marcus lined up the decimals.",
      parts: { when: "Before adding", how: "point over point", why: "so that each place value matched" },
      model: "Before adding, Marcus lined up the decimals point over point so that each place value matched.",
    },
  ],
  fragments: [
    { text: "The reciprocal of 1/12 is 12.", is_sentence: true },
    { text: "Multiplies 2/3 by 12.", is_sentence: false, fix: "Ms. Grant multiplies 2/3 by 12." },
    { text: "The quotient is the answer to a division problem.", is_sentence: true },
    { text: "When she divides by a unit fraction.", is_sentence: false, fix: "When she divides by a unit fraction, the quotient gets bigger." },
    { text: "Because 8 groups of 1/12 fit inside 2/3.", is_sentence: false, fix: "Ms. Grant can bake 8 trays because 8 groups of 1/12 fit inside 2/3." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Ms. Grant, ___, divides 2/3 by 1/12.",
      noun: "Ms. Grant",
      options: ["a baker at Lexington Market", "the answer to a division problem", "the number you divide by"],
      answer: 0,
      model: "Ms. Grant, a baker at Lexington Market, divides 2/3 by 1/12.",
    },
    {
      lesson: "A",
      sentence: "The quotient, ___, tells how many groups of 1/12 fit inside 2/3.",
      noun: "quotient",
      options: ["the answer to a division problem", "the number you divide by", "the fraction you get by flipping"],
      answer: 0,
      model: "The quotient, the answer to a division problem, tells how many groups of 1/12 fit inside 2/3.",
    },
    {
      lesson: "D",
      sentence: "Place value, ___, is why lining up decimal points matters.",
      noun: "Place value",
      options: ["the worth of a digit because of where it sits", "an answer that is close without every step", "a fraction with a 1 on top"],
      answer: 0,
      model: "Place value, the worth of a digit because of where it sits, is why lining up decimal points matters.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "before", stem: "Ms. Grant flips 1/12 to 12", model: "Before she multiplies, Ms. Grant flips 1/12 to 12." },
    { lesson: "A", conjunction: "since", stem: "eight groups of 1/12 fit inside 2/3", model: "Since 8/12 equals 2/3, eight groups of 1/12 fit inside 2/3." },
    { lesson: "D", conjunction: "after", stem: "Marcus compares his estimate to the exact answer", model: "After he adds 4.75 and 2.50, Marcus compares his estimate to the exact answer." },
  ],
  spo: {
    topic: {
      l1_2: "Ms. Grant divides [fractions] in [steps].",
      l3_4: "Ms. Grant divides 2/3 by 1/12 in [three steps]: [write the problem], [multiply by the reciprocal], and [check].",
      l5_6: "Although dividing by a fraction seems strange, Ms. Grant can [explain each step] because [dividing by 1/12 asks how many twelfths fit inside 2/3].",
    },
    starters: [
      { type: "question", text: "How many 1/12-pound portions of butter fit inside 2/3 of a pound?" },
      { type: "appositive", text: "Ms. Grant, a baker at Lexington Market, divides fractions to plan her cookie trays." },
      { type: "subordinate", text: "Although the problem looks tricky, the steps for dividing fractions never change." },
    ],
    details: [
      { note: "2/3 lb butter ÷ 1/12 lb per tray", lesson: "A" },
      { note: "reciprocal of 1/12 = 12", lesson: "B" },
      { note: "2/3 × 12 = 24/3 = 8", lesson: "B" },
      { note: "answer: 8 trays", lesson: "B" },
      { note: "8 groups of 1/12 fit in 2/3", lesson: "A" },
      { note: "check: 8 × 1/12 = 2/3", lesson: "B" },
    ],
    distractors: ["the market is busy on Saturdays", "Ms. Grant sells twelve kinds of cookies"],
    conclusion: {
      l1_2: "Ms. Grant can bake [8] [trays].",
      l3_4: "Because the check works, Ms. Grant knows she can bake [8 trays] with her [2/3 pound of butter].",
      l5_6: "Every step has a [reason], so the answer of [8 trays] is one [Ms. Grant can trust].",
    },
  },
  prompt: {
    l1_2: "Draw 2/3 pound of butter and the trays. Write 3-4 sentences about how Ms. Grant finds the number of trays. Use the words first, next, and then.",
    l3_4: "Write a paragraph that explains how Ms. Grant divides 2/3 by 1/12. Use your outline, order words, and because.",
    l5_6: "Write a paragraph that explains each step of 2/3 ÷ 1/12, why multiplying by the reciprocal works, and how Ms. Grant checks her answer. Include an appositive and a sentence that starts with before or since.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Because", "So", "Finally,", "Since"],
  model: {
    l1_2: "Ms. Grant has 2/3 pound of butter. Each tray needs 1/12 pound. She multiplies 2/3 by 12. She can bake 8 trays.",
    l3_4: "Ms. Grant divides 2/3 by 1/12 in three steps. First, she writes the problem 2/3 ÷ 1/12. Next, she finds the reciprocal of 1/12, which is 12. Then she multiplies 2/3 by 12 and gets 24/3, or 8. She can bake 8 trays because 8 groups of 1/12 fit inside 2/3. Finally, she checks that 8 × 1/12 equals 8/12, which is 2/3.",
    l5_6: "Although dividing by a fraction seems strange, Ms. Grant, a baker at Lexington Market, can explain every step. She has 2/3 pound of butter, and each tray needs 1/12 pound, so she writes 2/3 ÷ 1/12. Dividing by 1/12 asks how many twelfths fit inside 2/3. Because the reciprocal of 1/12 is 12, she multiplies 2/3 by 12. The product is 24/3, which equals 8. Before she bakes, she checks that 8 × 1/12 equals 8/12, and 8/12 simplifies to 2/3. Since the check works, she knows she can make exactly 8 trays. Every step has a reason, so the answer is one she can trust.",
  },
  mpo: {
    thesis: "I can divide 2/3 by 1/12 and explain each step, because the reciprocal turns a hard division into a multiplication that I can check.",
    paragraphs: [
      { topic: "Dividing by a fraction asks how many equal groups fit inside a number.", notes: ["2/3 ÷ 1/12", "how many 1/12 fit in 2/3", "unit fraction = 1 piece"] },
      { topic: "Multiplying by the reciprocal finds the quotient quickly.", notes: ["reciprocal of 1/12 = 12", "2/3 × 12 = 24/3", "24/3 = 8 trays"] },
      { topic: "Checking and estimating prove the answer makes sense.", notes: ["8 × 1/12 = 8/12 = 2/3", "estimate first", "decimals: line up points"] },
    ],
    conclusion: "Because every step has a reason and a check, Ms. Grant can trust that 2/3 pound of butter makes exactly 8 trays.",
  },
  revise: [
    "Did I use order words so each step comes in the right order?",
    "Did I say why the reciprocal is used, not only that I flipped the fraction?",
    "Did I write the quotient with a unit, such as 8 trays?",
    "Did I include a check or an estimate to show the answer makes sense?",
  ],
};

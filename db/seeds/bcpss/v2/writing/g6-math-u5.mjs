// BCPSS Writing Lab (TWR) — g6-math-u5 · Numerical & Algebraic Expressions and Equations. Contract: ../writing-schema.mjs

export default {
  title: "Who Solved It Right?",
  genre: "argue",
  tip: "Have students plug each answer back into the equation aloud before they decide who is right.",
  lessons: [
    { id: "A", title: "Writing and evaluating expressions with exponents" },
    { id: "B", title: "Equivalent expressions and coefficients" },
    { id: "C", title: "Solving one-step equations with inverse operations" },
    { id: "D", title: "Writing and graphing inequalities" },
  ],
  source: {
    title: "Skateboard Savings Debate",
    lesson: "C",
    text: "Nia saves 4 dollars every week for a new skateboard. After w weeks she has 28 dollars, so she writes the equation 4w = 28. Omar says she should subtract 4 from both sides, so w = 24. Nia disagrees. She says that 4w means 4 times w, and the inverse operation of multiplication is division. She divides both sides by 4 and gets w = 7. Then she checks her answer. Because 4 × 7 equals 28, the equation is true. Omar checks his answer too. Since 4 × 24 equals 96, his answer does not work. Nia also writes the inequality 4w ≥ 20 for the weeks she needs to save at least 20 dollars. Any w of 5 or more is a solution.",
  },
  notes: [
    { sentence: "She says that 4w means 4 times w, and the inverse operation of multiplication is division.", note: "4w = 4 × w, inverse = ÷" },
    { sentence: "She divides both sides by 4 and gets w = 7.", note: "÷ both sides by 4 → w = 7" },
    { sentence: "Because 4 × 7 equals 28, the equation is true.", note: "check: 4 × 7 = 28 ✓" },
    { sentence: "Since 4 × 24 equals 96, his answer does not work.", note: "4 × 24 = 96 ✗ Omar wrong" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Nia divides both sides of 4w = 28 by 4",
      because: "division is the inverse operation of multiplication.",
      but: "her classmate chose to subtract 4 from both sides.",
      so: "she finds that w = 7.",
    },
    {
      lesson: "C",
      kernel: "Omar's answer of w = 24 is wrong",
      because: "4 × 24 equals 96, not 28.",
      but: "24 is the right answer to the equation w + 4 = 28.",
      so: "he should have divided both sides by 4.",
    },
    {
      lesson: "D",
      kernel: "The inequality 4w ≥ 20 has many solutions",
      because: "any number of weeks that is 5 or more makes it true.",
      but: "w = 4 is not a solution since 4 × 4 equals 16.",
      so: "we graph it with a closed circle at 5 and an arrow to the right.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Nia divided both sides.",
      parts: { when: "After writing 4w = 28", how: "by 4", why: "because division undoes multiplication" },
      model: "After writing 4w = 28, Nia divided both sides by 4 because division undoes multiplication.",
    },
    {
      lesson: "A",
      kernel: "Omar evaluated 2³.",
      parts: { when: "During math class", how: "by multiplying 2 × 2 × 2", why: "to show that it equals 8" },
      model: "During math class, Omar evaluated 2³ by multiplying 2 × 2 × 2 to show that it equals 8.",
    },
  ],
  fragments: [
    { text: "The solution makes the equation true.", is_sentence: true },
    { text: "Divides both sides by 4.", is_sentence: false, fix: "Nia divides both sides by 4." },
    { text: "Because 4 × 7 equals 28.", is_sentence: false, fix: "Nia's answer is correct because 4 × 7 equals 28." },
    { text: "An equation says two amounts are equal.", is_sentence: true },
    { text: "When the inequality 4w ≥ 20 has many solutions.", is_sentence: false, fix: "When the inequality 4w ≥ 20 has many solutions, any w of 5 or more works." },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "Nia, ___, solved the equation 4w = 28.",
      noun: "Nia",
      options: ["a student saving for a skateboard", "a letter that stands for a number", "a number multiplied by a letter"],
      answer: 0,
      model: "Nia, a student saving for a skateboard, solved the equation 4w = 28.",
    },
    {
      lesson: "A",
      sentence: "A variable, ___, can take the place of the number of weeks.",
      noun: "variable",
      options: ["a letter that stands for an unknown number", "a small raised number", "a math sentence with an equal sign"],
      answer: 0,
      model: "A variable, a letter that stands for an unknown number, can take the place of the number of weeks.",
    },
    {
      lesson: "B",
      sentence: "A coefficient, ___, is the 4 in the term 4w.",
      noun: "coefficient",
      options: ["the number multiplied by a letter", "a value that makes an equation true", "an operation that undoes another"],
      answer: 0,
      model: "A coefficient, the number multiplied by a letter, is the 4 in the term 4w.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "Omar's method fails", model: "Because subtraction does not undo multiplication, Omar's method fails." },
    { lesson: "A", conjunction: "if", stem: "he multiplies 2 three times", model: "If Omar evaluates 2³, he multiplies 2 three times." },
    { lesson: "D", conjunction: "since", stem: "w = 5 is a solution of 4w ≥ 20", model: "Since 4 × 5 equals 20, w = 5 is a solution of 4w ≥ 20." },
  ],
  spo: {
    topic: {
      l1_2: "Nia is [right] because [she divides both sides].",
      l3_4: "Nia is right because she [divided both sides by 4], which is the [inverse operation] of multiplication.",
      l5_6: "Although Omar and Nia both want to solve 4w = 28, [Nia] is right because [she uses the inverse operation, and her check proves it].",
    },
    starters: [
      { type: "question", text: "Who is right about 4w = 28, Omar or Nia?" },
      { type: "appositive", text: "Nia, a sixth grader saving for a skateboard, solves 4w = 28 with an inverse operation." },
      { type: "subordinate", text: "Before anyone trusts an answer, the solution must make the equation true." },
    ],
    details: [
      { note: "4w means 4 × w", lesson: "B" },
      { note: "inverse of × is ÷", lesson: "C" },
      { note: "Nia ÷ both sides by 4, w = 7", lesson: "C" },
      { note: "check: 4 × 7 = 28, true", lesson: "C" },
      { note: "Omar subtract 4, w = 24", lesson: "C" },
      { note: "check: 4 × 24 = 96, false", lesson: "C" },
    ],
    distractors: ["the skateboard has bright blue wheels", "Omar skates on Saturdays"],
    conclusion: {
      l1_2: "So Nia's answer [w = 7] is [correct].",
      l3_4: "Because the check works, Nia's solution of [w = 7] is [correct] and Omar's [w = 24] is wrong.",
      l5_6: "Therefore, Nia's method is valid because [it uses the right inverse operation] and [a check that proves the answer].",
    },
  },
  prompt: {
    l1_2: "Draw Nia's skateboard savings. Write 3-4 sentences about who is right, Omar or Nia. Use the words divide, check, and right.",
    l3_4: "Write a paragraph that argues who is right about 4w = 28. Use your outline, because, and a check with numbers.",
    l5_6: "Write a paragraph that argues Nia is right and proves it with an inverse operation and a check. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["First,", "Because", "Since", "For example,", "However,", "Therefore,", "This proves that", "In conclusion,"],
  model: {
    l1_2: "Nia says w = 7. She divides both sides by 4. The check works because 4 × 7 = 28. Omar is wrong.",
    l3_4: "Nia is right because she divided both sides of 4w = 28 by 4. Multiplication and division are inverse operations, so division undoes 4 times w. She got w = 7. To check, she replaced w with 7, and 4 × 7 equals 28. Omar subtracted 4 instead, but 4 × 24 equals 96, which proves his answer is wrong. Therefore, Nia's solution is correct.",
    l5_6: "Although Omar and Nia both want to solve 4w = 28, Nia, the student who uses an inverse operation, is right. The coefficient 4 multiplies w, so dividing both sides by 4 undoes it. This step gives w = 7. When Nia replaces w with 7, she finds that 4 × 7 equals 28, which proves the equation is true. In contrast, Omar subtracted 4 from both sides and got w = 24. Since 4 × 24 equals 96, his answer fails the check. Subtraction would only help if the equation were w + 4 = 28. Therefore, Nia's method is valid because it uses the right inverse operation and a check that proves it.",
  },
  mpo: {
    thesis: "Nia's solution, w = 7, is correct because she used the inverse operation, and her check proves it.",
    paragraphs: [
      { topic: "Nia chose the right inverse operation for 4w = 28.", notes: ["4w = 4 × w", "÷ undoes ×", "÷ both sides by 4 → w = 7"] },
      { topic: "A check proves which answer really works.", notes: ["4 × 7 = 28, true", "4 × 24 = 96, false", "solution makes equation true"] },
      { topic: "An inequality has many solutions, not just one.", notes: ["4w ≥ 20", "w = 5 or more works", "w = 4 fails: 16 < 20"] },
    ],
    conclusion: "Because Nia used an inverse operation and a check that proves her answer, her solution is the one we can trust.",
  },
  revise: [
    "Did I name the inverse operation and say why it undoes the original operation?",
    "Did I check the answer by putting it back into the equation with real numbers?",
    "Did I say clearly who is right and give a reason with because or since?",
    "Did I explain what is wrong with the other answer, not only that it is wrong?",
  ],
};

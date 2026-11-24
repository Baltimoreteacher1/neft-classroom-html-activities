// BCPSS Writing Lab (TWR) — g7-math-u4 · Linear Expressions, Two-Step Equations & Inequalities. Contract: ../writing-schema.mjs

export default {
  title: "Undo It Step by Step",
  genre: "explain",
  tip: "Have students say the first undo step out loud and name the operation it reverses before they write the full explanation.",
  lessons: [
    { id: "A", title: "Simplifying linear expressions" },
    { id: "B", title: "Solving two-step equations" },
    { id: "C", title: "Equations with parentheses" },
    { id: "D", title: "Graphing inequalities" },
  ],
  source: {
    title: "Soccer at Patterson Park",
    lesson: "B",
    text: "Rashad joins a soccer league at Patterson Park. The league charges $15 to sign up and $4 for each game. Rashad has $47, so he writes the equation 4x + 15 = 47. First, he subtracts 15 from both sides to get 4x = 32. Next, he divides both sides by 4, so x = 8. Finally, he checks his answer: 4 times 8 plus 15 is 47. Rashad can play 8 games. Later, he solves 3(x + 2) = 24 by dividing both sides by 3 first. Then he gets x + 2 = 8, and x = 6. If he can spend at most $47, he writes 4x + 15 ≤ 47, so x ≤ 8.",
  },
  notes: [
    { sentence: "The league charges $15 to sign up and $4 for each game.", note: "$15 sign-up + $4 per game" },
    { sentence: "First, he subtracts 15 from both sides to get 4x = 32.", note: "subtract 15 both sides → 4x = 32" },
    { sentence: "Next, he divides both sides by 4, so x = 8.", note: "÷ 4 both sides → x = 8" },
    { sentence: "Finally, he checks his answer: 4 times 8 plus 15 is 47.", note: "check: 4(8) + 15 = 47" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Rashad subtracts 15 from both sides first",
      because: "subtraction undoes the 15 that was added.",
      but: "he cannot divide by 4 yet.",
      so: "the equation becomes 4x = 32.",
    },
    {
      lesson: "C",
      kernel: "Rashad divides both sides of 3(x + 2) = 24 by 3",
      because: "the 3 multiplies the whole group in parentheses.",
      but: "he could also distribute the 3 first.",
      so: "x + 2 equals 8.",
    },
    {
      lesson: "D",
      kernel: "The solution set of x ≤ 8 has many numbers",
      because: "every number less than or equal to 8 makes the inequality true.",
      but: "an equation like 4x = 32 has only one solution.",
      so: "the graph shows a closed circle at 8 and an arrow to the left.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Rashad divided both sides.",
      parts: { when: "after subtracting 15", how: "by 4", why: "to get x by itself" },
      model: "After subtracting 15, Rashad divided both sides by 4 to get x by itself.",
    },
    {
      lesson: "A",
      kernel: "Rashad simplified the expression.",
      parts: { when: "before solving the equation", how: "by combining like terms", why: "to make each step easier" },
      model: "Before solving the equation, Rashad simplified the expression by combining like terms to make each step easier.",
    },
  ],
  fragments: [
    { text: "An inverse operation undoes another operation.", is_sentence: true },
    { text: "Then divides both sides by 4.", is_sentence: false, fix: "Then Rashad divides both sides by 4." },
    { text: "Because subtraction undoes addition.", is_sentence: false, fix: "He subtracts 15 first because subtraction undoes addition." },
    { text: "The coefficient is the number that multiplies the variable.", is_sentence: true },
    { text: "When he checks the answer in the original equation.", is_sentence: false, fix: "When he checks the answer in the original equation, both sides equal 47." },
    { text: "The solution to 4x + 15 = 47 is x = 8.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The coefficient, ___, is 4 in the expression 4x + 15.",
      noun: "coefficient",
      options: ["the number that multiplies the variable", "a number by itself that never changes", "a letter that stands for an unknown number"],
      answer: 0,
      model: "The coefficient, the number that multiplies the variable, is 4 in the expression 4x + 15.",
    },
    {
      lesson: "B",
      sentence: "The constant, ___, is 15 in the expression 4x + 15.",
      noun: "constant",
      options: ["an operation that undoes another one", "a number by itself that never changes", "the number that multiplies the variable"],
      answer: 1,
      model: "The constant, a number by itself that never changes, is 15 in the expression 4x + 15.",
    },
    {
      lesson: "D",
      sentence: "A solution set, ___, shows every answer to an inequality.",
      noun: "solution set",
      options: ["a math sentence with an equal sign", "a letter that stands for a number", "all the numbers that make it true"],
      answer: 2,
      model: "A solution set, all the numbers that make it true, shows every answer to an inequality.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "after", stem: "he divides both sides by 4", model: "After he subtracts 15 from both sides, he divides both sides by 4." },
    { lesson: "C", conjunction: "because", stem: "he divides by 3 first", model: "Because 3 multiplies the whole group, he divides by 3 first." },
    { lesson: "D", conjunction: "if", stem: "he writes an inequality", model: "If Rashad can spend at most $47, he writes an inequality." },
  ],
  spo: {
    topic: {
      l1_2: "To solve 4x + 15 = 47, I [subtract 15] first and then [divide by 4].",
      l3_4: "To solve 4x + 15 = 47, I first [subtract 15 from both sides], next [divide both sides by 4], and finally [check my answer].",
      l5_6: "To undo each step of 4x + 15 = 47 in the right order, [I subtract 15 from both sides], then [divide by 4], and finally [check that x = 8 makes the equation true].",
    },
    starters: [
      { type: "question", text: "How do you undo an equation one step at a time?" },
      { type: "command", text: "Picture an equation as a locked box, and undo each step in reverse order." },
      { type: "appositive", text: "Rashad, a Patterson Park soccer player, uses an equation to find how many games he can pay for." },
    ],
    details: [
      { note: "4x + 15 = 47 (x = games)", lesson: "B" },
      { note: "subtract 15 both sides → 4x = 32", lesson: "B" },
      { note: "divide both sides by 4 → x = 8", lesson: "B" },
      { note: "check: 4(8) + 15 = 47", lesson: "B" },
      { note: "3(x + 2) = 24 → x = 6", lesson: "C" },
      { note: "at most $47 → 4x + 15 ≤ 47", lesson: "D" },
    ],
    distractors: ["soccer balls are black and white", "Patterson Park has a pagoda"],
    conclusion: {
      l1_2: "Last, I [check] that x = [8] works.",
      l3_4: "Finally, I check by putting [8] in for x, and [both sides] equal [47], so my answer is right.",
      l5_6: "Finally, I check by substituting [8] for x, which shows that [left side] equals [right side], so [Rashad can play 8 games].",
    },
  },
  prompt: {
    l1_2: "Look at 4x + 15 = 47. Write 3 sentences. Tell the steps in order. Use First, Next, and Then.",
    l3_4: "Write a paragraph that explains how to solve 4x + 15 = 47 and check your answer. Use First, Next, Then, and Finally, and name at least one math word.",
    l5_6: "Write a paragraph that explains how to solve 4x + 15 = 47, why each step happens in that order, and what changes if the problem asks for at most $47. Include an appositive and a sentence that starts with because, after, or if.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Finally,", "Because", "So", "To check,"],
  model: {
    l1_2: "First, I subtract 15 from both sides. Next, I divide both sides by 4. Then x equals 8.",
    l3_4: "To solve 4x + 15 = 47, I first subtract 15 from both sides. This undoes the addition, so I get 4x = 32. Next, I divide both sides by 4. That gives x = 8. Finally, I check my answer: 4 times 8 plus 15 is 47. Rashad can play 8 games.",
    l5_6: "To undo each step of 4x + 15 = 47 in the right order, I work backward. First, I subtract 15 from both sides, because subtraction undoes the 15 that was added. That leaves 4x = 32. Next, I divide both sides by 4, since 4, the coefficient, multiplies x. Then I find that x = 8. Finally, I check by putting 8 in for x, and 4 times 8 plus 15 equals 47. If Rashad can spend at most $47, he writes 4x + 15 ≤ 47, and every x less than or equal to 8 is a solution.",
  },
  mpo: {
    thesis: "To find the unknown number in an equation, I undo each step in reverse order and check my answer, and I use the same plan for parentheses and inequalities.",
    paragraphs: [
      { topic: "A two-step equation like 4x + 15 = 47 is solved by undoing the addition and then the multiplication.", notes: ["subtract 15 → 4x = 32", "divide by 4 → x = 8", "check: 4(8) + 15 = 47"] },
      { topic: "An equation with parentheses can be solved by dividing first or by distributing first.", notes: ["3(x + 2) = 24", "÷ 3 → x + 2 = 8", "x = 6"] },
      { topic: "An inequality has many solutions, so its answer is a solution set that I can graph.", notes: ["4x + 15 ≤ 47", "x ≤ 8", "closed circle at 8, arrow left"] },
    ],
    conclusion: "Undoing operations in the right order, and checking the result, works for equations of every kind.",
  },
  revise: [
    "Did I put the steps in the right order with First, Next, Then, and Finally?",
    "Did I tell which operation I used and why it undoes the one in the equation?",
    "Is every number correct, including 4x = 32 and x = 8?",
    "Did I include a check by putting my answer back into the original equation?",
  ],
};

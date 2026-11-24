// BCPSS Writing Lab (TWR) — g8-math-u2 · Linear Equations & Systems of Equations. Contract: ../writing-schema.mjs

export default {
  title: "Prove It at the Harbor",
  genre: "argue",
  tip: "Insist that every answer ends with a check in both equations, and let students say the check aloud before they write it.",
  lessons: [
    { id: "A", title: "Equations with variables on both sides" },
    { id: "B", title: "Solving systems by graphing" },
    { id: "C", title: "Solving systems by substitution" },
    { id: "D", title: "Solving systems by elimination" },
  ],
  source: {
    title: "Two Kayak Shops",
    lesson: "C",
    text: "Zara wants to rent a kayak at the Inner Harbor. Harbor Paddle charges 12 dollars plus 5 dollars for each hour. Dock Street charges 8 dollars for each hour. Zara writes y = 5x + 12 and y = 8x, where x is the number of hours and y is the cost. She chooses substitution because y is already alone in both equations. She sets 5x + 12 equal to 8x, so 12 equals 3x and x equals 4. Then she checks: 5(4) + 12 = 32 and 8(4) = 32. Both shops cost 32 dollars for 4 hours, so the solution (4, 32) is valid. For a 2-hour trip, Dock Street is cheaper.",
  },
  notes: [
    { sentence: "She chooses substitution because y is already alone in both equations.", note: "substitution b/c y alone" },
    { sentence: "She sets 5x + 12 equal to 8x, so 12 equals 3x and x equals 4.", note: "5x + 12 = 8x → 12 = 3x → x = 4" },
    { sentence: "Then she checks: 5(4) + 12 = 32 and 8(4) = 32.", note: "check: 32 = 32 in both" },
    { sentence: "Both shops cost 32 dollars for 4 hours, so the solution (4, 32) is valid.", note: "4 h, $32 both → (4, 32) works" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Zara chose substitution to solve the system",
      because: "y was already alone in both equations.",
      but: "elimination would have worked too.",
      so: "she set the two expressions equal to each other.",
    },
    {
      lesson: "B",
      kernel: "A solution to a system must work in both equations",
      because: "it is the point where the two lines cross.",
      but: "a point on only one line is not a solution.",
      so: "we always check the answer twice.",
    },
    {
      lesson: "D",
      kernel: "Adding two equations can eliminate a variable",
      because: "opposite terms like +y and −y cancel to zero.",
      but: "the terms must be opposites before we add.",
      so: "we get one equation with only x left.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Zara checked her answer.",
      parts: { when: "after solving", how: "in both equations", why: "to be sure the point works" },
      model: "After solving, Zara checked her answer in both equations to be sure the point works.",
    },
    {
      lesson: "A",
      kernel: "Zara solved the equation.",
      parts: { where: "in her notebook", how: "by subtracting 5x from both sides", why: "to find the hours" },
      model: "In her notebook, Zara solved the equation by subtracting 5x from both sides to find the hours.",
    },
  ],
  fragments: [
    { text: "The solution makes both equations true.", is_sentence: true },
    { text: "When the two lines cross at one point.", is_sentence: false, fix: "The system has one solution when the two lines cross at one point." },
    { text: "Substitution replaces a variable with an equal expression.", is_sentence: true },
    { text: "Because the y terms are opposites.", is_sentence: false, fix: "Elimination works because the y terms are opposites." },
    { text: "Checked the point in both equations.", is_sentence: false, fix: "Zara checked the point in both equations." },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "Substitution, ___, works well when y is alone in one equation.",
      noun: "Substitution",
      options: ["replacing a variable with an expression that is equal to it", "adding two equations so that a variable cancels", "the place where a line crosses the vertical axis"],
      answer: 0,
      model: "Substitution, replacing a variable with an expression that is equal to it, works well when y is alone in one equation.",
    },
    {
      lesson: "B",
      sentence: "The y-intercept, ___, is at 12 on the Harbor Paddle graph.",
      noun: "y-intercept",
      options: ["how steep a line is", "the place where a line crosses the vertical axis", "a value that makes an equation true"],
      answer: 1,
      model: "The y-intercept, the place where a line crosses the vertical axis, is at 12 on the Harbor Paddle graph.",
    },
    {
      lesson: "D",
      sentence: "Elimination, ___, is a good choice when the y terms are opposites.",
      noun: "Elimination",
      options: ["two lines that never cross", "the number that makes an equation true", "adding or subtracting two equations so that one variable cancels out"],
      answer: 2,
      model: "Elimination, adding or subtracting two equations so that one variable cancels out, is a good choice when the y terms are opposites.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "substitution is the fastest method", model: "Because y is already alone, substitution is the fastest method." },
    { lesson: "A", conjunction: "since", stem: "Zara can set them equal to each other", model: "Since both expressions equal y, Zara can set them equal to each other." },
    { lesson: "B", conjunction: "unless", stem: "a system of two linear equations has a solution", model: "Unless the lines are parallel, a system of two linear equations has a solution." },
  ],
  spo: {
    topic: {
      l1_2: "I chose [substitution] because [y is alone].",
      l3_4: "I chose [method] to solve the system because [reason], and I can justify my answer by [checking it].",
      l5_6: "Although [elimination or graphing] could also solve the system, [substitution] is the most efficient method because [reason], and a check proves the solution is valid.",
    },
    starters: [
      { type: "question", text: "How can you prove that a solution really works?" },
      { type: "command", text: "Choose a method, solve the system, and check your answer in both equations." },
      { type: "subordinate", text: "Before you trust an answer, check it in both equations." },
    ],
    details: [
      { note: "y = 5x + 12 and y = 8x", lesson: "A" },
      { note: "y alone → substitution works", lesson: "C" },
      { note: "5x + 12 = 8x → x = 4", lesson: "A" },
      { note: "check: 32 = 32 in both", lesson: "B" },
      { note: "lines cross at (4, 32)", lesson: "B" },
      { note: "2 hours: Dock Street is cheaper", lesson: "C" },
    ],
    distractors: ["kayak paddles come in different lengths", "kayaks can be red, blue, or yellow"],
    conclusion: {
      l1_2: "My answer is [(4, 32)]. I [checked] it.",
      l3_4: "Since [both equations are true], the solution [(4, 32)] is valid.",
      l5_6: "The method works because [every step keeps both sides equal], and the check proves that [(4, 32) is the only point on both lines].",
    },
  },
  prompt: {
    l1_2: "Dock Street costs 8 dollars an hour. Harbor Paddle costs 12 dollars plus 5 dollars an hour. Write 3-4 sentences. Tell when the two shops cost the same.",
    l3_4: "Find when the two kayak shops cost the same. Write a paragraph that names your method, shows the steps, and justifies the answer with a check.",
    l5_6: "Write a paragraph that finds when the costs match, justifies why your method works, and tells which shop is cheaper for a 2-hour trip. Include an appositive and a sentence that starts with because or since.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "Since", "Therefore,", "To check,", "In conclusion,"],
  model: {
    l1_2: "I set 5x + 12 equal to 8x. Then x is 4 hours. Both shops cost 32 dollars. I checked, so it works.",
    l3_4: "I chose substitution because y is already alone in both equations. First, I set 5x + 12 equal to 8x. Then I subtracted 5x from both sides, so 12 equals 3x and x equals 4. When I put 4 into both equations, I got 32 each time. Since 5(4) + 12 = 32 and 8(4) = 32, the solution (4, 32) is valid. Both shops cost the same for 4 hours.",
    l5_6: "Substitution, a method that replaces a variable with an equal expression, is the best way to find when the two kayak shops cost the same. Because y is alone in both equations, I can set 5x + 12 equal to 8x. Subtracting 5x from both sides gives 12 = 3x, so x = 4 hours. I checked the answer in both equations, since a solution must make both true. Harbor Paddle costs 5(4) + 12 = 32 dollars, and Dock Street costs 8(4) = 32 dollars. Although the shops match at 4 hours, they differ for a 2-hour trip. In that case, Harbor Paddle costs 22 dollars, whereas Dock Street costs only 16 dollars. The method works because every step keeps the two sides equal.",
  },
  mpo: {
    thesis: "I can justify the solution to a system of equations by choosing a method that fits, showing each step, and checking the answer in both equations.",
    paragraphs: [
      { topic: "Choose a method that fits the equations and explain why.", notes: ["y alone → substitution", "opposite terms → elimination", "graph → lines cross"] },
      { topic: "Solve step by step and keep both sides equal.", notes: ["5x + 12 = 8x", "subtract 5x → 12 = 3x", "x = 4 hours"] },
      { topic: "Check the answer and connect it to the situation.", notes: ["check: 32 = 32 in both", "(4, 32) = 4 h, $32", "2 h: $22 vs $16"] },
    ],
    conclusion: "A solution is only valid when it makes both equations true, so a clear method and a careful check prove that the answer to the kayak problem really works.",
  },
  revise: [
    "Did I name my method and say why it fits these equations?",
    "Did I show each step, such as subtracting 5x from both sides?",
    "Did I check my answer in both equations with real numbers?",
    "Did I connect the answer back to hours and dollars?",
  ],
};

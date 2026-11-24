// BCPSS Writing Lab (TWR) — g7-math-u1 · Proportional Relationships & Constant of Proportionality. Contract: ../writing-schema.mjs

export default {
  title: "Prove It Is Proportional",
  genre: "explain",
  tip: "Ask students to write the division for two rows aloud before they write the word proportional, so the numbers come first and the conclusion second.",
  lessons: [
    { id: "A", title: "Unit rates and equivalent ratios" },
    { id: "B", title: "Testing tables for proportional relationships" },
    { id: "C", title: "Graphs that are lines through the origin" },
    { id: "D", title: "Equations y = kx and the constant of proportionality" },
  ],
  source: {
    title: "Lemonade at Lexington Market",
    lesson: "B",
    text: "A vendor at Lexington Market sells lemonade by the cup. One cup costs $2, two cups cost $4, and five cups cost $10. Imani divides each cost by the number of cups, and she gets 2 every time. So the cost is proportional to the number of cups. She also graphs the points. They fall on a straight line that passes through the origin, (0, 0). The constant of proportionality is 2 dollars per cup, and the equation is y = 2x. A second vendor charges $3 for one cup and $5 for two cups. Imani divides again and gets 3 and 2.5, so this cost is not proportional.",
  },
  notes: [
    { sentence: "Imani divides each cost by the number of cups, and she gets 2 every time.", note: "cost ÷ cups = 2 every time" },
    { sentence: "They fall on a straight line that passes through the origin, (0, 0).", note: "straight line + thru origin (0, 0)" },
    { sentence: "The constant of proportionality is 2 dollars per cup, and the equation is y = 2x.", note: "k = $2 per cup → y = 2x" },
    { sentence: "Imani divides again and gets 3 and 2.5, so this cost is not proportional.", note: "$3 ÷ 1 = 3, $5 ÷ 2 = 2.5 → not proportional" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The cost of lemonade is proportional to the number of cups",
      because: "the cost divided by the cups is always 2.",
      but: "the second vendor's cost is not proportional to the cups.",
      so: "we can use y = 2x to find the cost of any number of cups.",
    },
    {
      lesson: "C",
      kernel: "The graph of the lemonade costs is a straight line",
      because: "each extra cup adds the same $2.",
      but: "a straight line alone does not prove the cost is proportional.",
      so: "we must also check that the line passes through the origin.",
    },
    {
      lesson: "D",
      kernel: "The constant of proportionality for Imani's lemonade is 2",
      because: "each cup costs $2, so y is always 2 times x.",
      but: "the constant would change if the price per cup changed.",
      so: "ten cups cost 2 times 10, which is $20.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Imani divided the costs.",
      parts: { when: "after making a table", how: "by the number of cups", why: "to test for a constant ratio" },
      model: "After making a table, Imani divided the costs by the number of cups to test for a constant ratio.",
    },
    {
      lesson: "C",
      kernel: "Imani graphed the costs.",
      parts: { when: "after finishing the table", where: "on a coordinate grid", how: "with a ruler", why: "to check for a straight line" },
      model: "After finishing the table, Imani graphed the costs on a coordinate grid with a ruler to check for a straight line.",
    },
  ],
  fragments: [
    { text: "The ratio of cost to cups is always 2.", is_sentence: true },
    { text: "Because the line passes through the origin.", is_sentence: false, fix: "The cost is proportional because the line passes through the origin." },
    { text: "Divided each cost by the number of cups.", is_sentence: false, fix: "Imani divided each cost by the number of cups." },
    { text: "The constant of proportionality is 2 dollars per cup.", is_sentence: true },
    { text: "If the ratios are not the same.", is_sentence: false, fix: "If the ratios are not the same, the relationship is not proportional." },
    { text: "The equation y = 2x gives the cost of any number of cups.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "The constant of proportionality, ___, is 2 dollars per cup.",
      noun: "constant of proportionality",
      options: ["the number you multiply x by to get y", "the point (0, 0) where the axes cross", "a comparison of two amounts, like 4 to 2"],
      answer: 0,
      model: "The constant of proportionality, the number you multiply x by to get y, is 2 dollars per cup.",
    },
    {
      lesson: "C",
      sentence: "The origin, ___, is where a proportional graph begins.",
      noun: "origin",
      options: ["the number that stays the same", "the point (0, 0) where the axes cross", "a list of ordered pairs"],
      answer: 1,
      model: "The origin, the point (0, 0) where the axes cross, is where a proportional graph begins.",
    },
    {
      lesson: "A",
      sentence: "A unit rate, ___, tells the cost of one cup.",
      noun: "unit rate",
      options: ["an equation with y and x", "a straight line on a graph", "a rate for exactly one of something"],
      answer: 2,
      model: "A unit rate, a rate for exactly one of something, tells the cost of one cup.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "since", stem: "the cost is proportional to the number of cups", model: "Since every cost divided by its cups equals 2, the cost is proportional to the number of cups." },
    { lesson: "C", conjunction: "if", stem: "the relationship is not proportional", model: "If the graph misses the origin, the relationship is not proportional." },
    { lesson: "A", conjunction: "although", stem: "the cost is not proportional to the cups", model: "Although the second vendor's prices go up, the cost is not proportional to the cups." },
  ],
  spo: {
    topic: {
      l1_2: "The [cost] is proportional to the [cups] because [cost ÷ cups] is always [2].",
      l3_4: "The cost of lemonade is proportional to the number of cups because the ratio of [cost] to [cups] is always [2], so the constant of proportionality is [2].",
      l5_6: "Since [the cost divided by the cups] is the same in every row, [the cost] is proportional to [the cups], and [the equation y = kx] describes it.",
    },
    starters: [
      { type: "question", text: "How can you prove that a price is proportional to the number of items you buy?" },
      { type: "statement", text: "Dividing every cost by its number of cups gives the same answer, 2." },
      { type: "appositive", text: "The constant of proportionality, the number you multiply x by to get y, is 2 for Imani's lemonade." },
    ],
    details: [
      { note: "1 cup $2, 2 cups $4, 5 cups $10", lesson: "A" },
      { note: "cost ÷ cups = 2 every time", lesson: "B" },
      { note: "second vendor: $3 ÷ 1, $5 ÷ 2 differ", lesson: "B" },
      { note: "graph = straight line thru origin", lesson: "C" },
      { note: "k = 2 dollars per cup", lesson: "D" },
      { note: "equation: y = 2x", lesson: "D" },
    ],
    distractors: ["lemonade needs lemons, sugar, and water", "the market has many food stalls"],
    conclusion: {
      l1_2: "So the constant of [proportionality] is [2].",
      l3_4: "Therefore, the equation [y = 2x] gives the cost of [any number of cups].",
      l5_6: "Because [the ratio never changes], the cost follows [y = 2x], so I can find the cost of [any number of cups] without a table.",
    },
  },
  prompt: {
    l1_2: "Look at the table: 1 cup $2, 2 cups $4, 5 cups $10. Write 3 sentences. Tell if the cost is proportional and why.",
    l3_4: "Write a paragraph that proves the lemonade cost is proportional to the number of cups. Use numbers from the table, the word because, and the constant of proportionality.",
    l5_6: "Write a paragraph that proves one vendor's cost is proportional and the other vendor's cost is not. Use numbers from the table, the graph, and the equation. Include an appositive and a sentence that starts with since or if.",
  },
  transitions: ["First,", "For example,", "Because", "So", "Since", "Therefore,", "In contrast,", "As shown by"],
  model: {
    l1_2: "The cost divided by the cups is always 2. So the cost is proportional to the cups. The constant is 2 dollars per cup.",
    l3_4: "The cost of lemonade is proportional to the number of cups because the ratio of cost to cups is always 2. For example, $2 divided by 1 cup is 2, and $10 divided by 5 cups is also 2. The graph is a straight line through the origin, so it also shows a proportional relationship. Therefore, the constant of proportionality is 2 dollars per cup. The equation y = 2x gives the cost of any number of cups.",
    l5_6: "Since every cost divided by its number of cups equals 2, the cost of Imani's lemonade is proportional to the cups. The constant of proportionality, the number you multiply x by to get y, is 2 dollars per cup. For example, 5 cups cost 2 times 5, which is $10. Her graph is a straight line that passes through the origin, (0, 0), as shown by the points (1, 2), (2, 4), and (5, 10). In contrast, the second vendor charges $3 for one cup and $5 for two cups. Because 3 divided by 1 is not equal to 5 divided by 2, that cost is not proportional. Therefore, only the first vendor's cost follows the equation y = 2x.",
  },
  mpo: {
    thesis: "The first vendor's lemonade cost is proportional to the number of cups because the ratio is constant, the graph is a line through the origin, and the equation is y = 2x, but the second vendor's cost is not proportional.",
    paragraphs: [
      { topic: "The table proves the first cost is proportional because every ratio of cost to cups is the same.", notes: ["$2 ÷ 1 = 2", "$4 ÷ 2 = 2", "$10 ÷ 5 = 2", "k = 2 dollars per cup"] },
      { topic: "The graph and equation give two more proofs of the same relationship.", notes: ["points (1, 2), (2, 4), (5, 10)", "straight line thru origin", "equation y = 2x"] },
      { topic: "The second vendor's cost is not proportional because its ratios are different.", notes: ["$3 ÷ 1 = 3", "$5 ÷ 2 = 2.5", "3 ≠ 2.5 → not proportional"] },
    ],
    conclusion: "To prove a relationship is proportional, I check that every ratio matches, and one different ratio is enough to show it is not.",
  },
  revise: [
    "Did I show the division for at least two rows, with the correct answers?",
    "Did I state the constant of proportionality with its units, such as dollars per cup?",
    "Did I use because, so, or since to connect my numbers to my conclusion?",
    "Did I check the graph or the equation as a second proof?",
  ],
};

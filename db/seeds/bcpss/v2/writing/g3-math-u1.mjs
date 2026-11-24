// BCPSS Writing Lab (TWR) — g3-math-u1 · Multiplication & Division Foundations. Contract: ../writing-schema.mjs

export default {
  title: "Peaches at Lexington Market",
  genre: "explain",
  tip: "Have students touch and say each equal group aloud before they write, so the first, then, so steps match the picture.",
  lessons: [
    { id: "A", title: "Equal groups and multiplication" },
    { id: "B", title: "Arrays with rows and columns" },
    { id: "C", title: "Division as sharing equally" },
    { id: "D", title: "Multiplication and division are connected" },
  ],
  source: {
    title: "Tamika's Peach Stand",
    lesson: "A",
    text: "Tamika sells peaches at Lexington Market. She has 4 baskets. Each basket holds 5 peaches. First, she sees 4 equal groups of 5. Then she multiplies 4 × 5 = 20, so she has 20 peaches. Later, a customer wants the peaches in 5 equal bags. Tamika divides 20 ÷ 5 = 4. Each bag gets 4 peaches. Multiplication and division are connected, because 4 × 5 = 20 and 20 ÷ 5 = 4.",
  },
  notes: [
    { sentence: "First, she sees 4 equal groups of 5.", note: "4 equal groups of 5" },
    { sentence: "Then she multiplies 4 × 5 = 20, so she has 20 peaches.", note: "4 × 5 = 20 peaches" },
    { sentence: "Tamika divides 20 ÷ 5 = 4.", note: "20 ÷ 5 = 4/bag" },
    { sentence: "Multiplication and division are connected, because 4 × 5 = 20 and 20 ÷ 5 = 4.", note: "× and ÷ connected: 4×5=20, 20÷5=4" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Tamika can multiply to find the total peaches",
      because: "there are 4 equal groups of 5.",
      but: "multiplying would not work if the baskets held different numbers.",
      so: "she knows she has 20 peaches in all.",
    },
    {
      lesson: "B",
      kernel: "An array has the same number in every row",
      because: "the objects are set in neat rows and columns.",
      but: "a messy pile of peaches has no rows to count.",
      so: "we can multiply rows by columns to find the total.",
    },
    {
      lesson: "C",
      kernel: "Tamika divided 20 peaches into 5 bags",
      because: "the customer wanted equal bags.",
      but: "there were not 20 peaches in each bag.",
      so: "each bag got 4 peaches.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Tamika packed peaches.",
      parts: { when: "on Saturday morning", where: "at Lexington Market", how: "into 4 equal baskets", why: "so each basket had 5 peaches" },
      model: "On Saturday morning, Tamika packed peaches into 4 equal baskets at Lexington Market so each basket had 5 peaches.",
    },
    {
      lesson: "B",
      kernel: "The students sat.",
      parts: { when: "after school", where: "on the bus", how: "in 6 equal rows", why: "so every row had 4 students" },
      model: "After school, the students sat in 6 equal rows on the bus so every row had 4 students.",
    },
  ],
  fragments: [
    { text: "Each basket has 5 peaches.", is_sentence: true },
    { text: "Groups of the same size.", is_sentence: false, fix: "Equal groups are groups of the same size." },
    { text: "The product of 4 × 5 is 20.", is_sentence: true },
    { text: "Because the rows are equal.", is_sentence: false, fix: "The array looks neat because the rows are equal." },
    { text: "Counts the columns going up and down.", is_sentence: false, fix: "Tamika counts the columns going up and down." },
    { text: "Division shares a total equally.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Tamika, ___, packs peaches into baskets.",
      noun: "Tamika",
      options: ["a number you multiply", "a friendly fruit seller", "objects set in rows and columns"],
      answer: 1,
      model: "Tamika, a friendly fruit seller, packs peaches into baskets.",
    },
    {
      lesson: "B",
      sentence: "An array, ___, helps us count equal groups.",
      noun: "array",
      options: ["objects set in neat rows and columns", "the answer to a multiplication problem", "a line of objects that goes across"],
      answer: 0,
      model: "An array, objects set in neat rows and columns, helps us count equal groups.",
    },
    {
      lesson: "D",
      sentence: "The product, ___, tells how many peaches are in all.",
      noun: "product",
      options: ["the number you divide into groups", "a line that goes up and down", "the answer you get when you multiply"],
      answer: 2,
      model: "The product, the answer you get when you multiply, tells how many peaches are in all.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "since", stem: "she has 20 peaches in all", model: "Since 4 × 5 = 20, she has 20 peaches in all." },
    { lesson: "C", conjunction: "when", stem: "each bag gets 4 peaches", model: "When Tamika shares 20 peaches into 5 equal bags, each bag gets 4 peaches." },
    { lesson: "D", conjunction: "before", stem: "Tamika checks her work with multiplication", model: "Before she hands over the bags, Tamika checks her work with multiplication." },
  ],
  spo: {
    topic: {
      l1_2: "I can find [how many in all].",
      l3_4: "To find how many peaches in all, I [multiply] [4 × 5] because [there are 4 equal groups of 5].",
      l5_6: "Because [Tamika has 4 equal baskets of 5 peaches], she can [multiply 4 × 5 = 20] and then [check with division, 20 ÷ 5 = 4].",
    },
    starters: [
      { type: "question", text: "How can equal groups help us find a total?" },
      { type: "command", text: "Picture 4 baskets with 5 peaches in each basket." },
      { type: "subordinate", text: "When the groups are equal, multiplication is a fast way to find the total." },
    ],
    details: [
      { note: "4 baskets, 5 peaches each", lesson: "A" },
      { note: "4 equal groups of 5", lesson: "A" },
      { note: "array = rows + columns", lesson: "B" },
      { note: "4 × 5 = 20 in all", lesson: "A" },
      { note: "20 ÷ 5 = 4 per bag", lesson: "C" },
      { note: "× and ÷ use same 3 numbers", lesson: "D" },
    ],
    distractors: ["peaches grow on trees", "Lexington Market opened long ago"],
    conclusion: {
      l1_2: "There are [20] peaches [in all].",
      l3_4: "So Tamika has [20] peaches because [4 × 5 = 20].",
      l5_6: "So the product is [20], and division checks it because [20 ÷ 5 = 4 uses the same three numbers].",
    },
  },
  prompt: {
    l1_2: "Draw 4 baskets with 5 peaches in each. Write 2-3 sentences. Tell how many peaches in all.",
    l3_4: "Explain how Tamika finds how many peaches she has in all, and how she checks her answer. Use first, then, so, and because.",
    l5_6: "Explain how Tamika uses multiplication to find the total and division to check it. Include an appositive and a sentence that starts with since or when.",
  },
  transitions: ["First,", "Then", "Next,", "So", "Because", "Which means", "To check,", "Finally,"],
  model: {
    l1_2: "First, I make 4 equal groups of 5. Then I multiply 4 × 5 = 20. So there are 20 peaches.",
    l3_4: "First, Tamika makes 4 equal groups of 5 peaches. Then she multiplies 4 × 5 = 20 because there are 4 baskets with 5 in each. So she has 20 peaches in all. To check, she divides 20 ÷ 5 = 4. The answer matches because multiplication and division use the same three numbers.",
    l5_6: "First, Tamika, a fruit seller at Lexington Market, sees 4 equal baskets with 5 peaches in each. Since the groups are equal, she multiplies 4 × 5 = 20, so the product is 20 peaches. Next, a customer wants the peaches in 5 equal bags. When Tamika divides 20 ÷ 5, each bag gets 4 peaches. This works because division undoes multiplication. Finally, she knows she is right, since both number sentences use 4, 5, and 20.",
  },
  revise: [
    "Did I use first, then, and so to put the steps in order?",
    "Did I say how many equal groups there are and how many are in each?",
    "Did I write a number sentence that matches my explanation?",
    "Did I explain WHY with because, and check with division?",
  ],
};

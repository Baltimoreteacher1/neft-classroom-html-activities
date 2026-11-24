// BCPSS Writing Lab (TWR) — g4-math-u4 · Operations with Fractions. Contract: ../writing-schema.mjs

export default {
  title: "Steps for the Lemonade Stand",
  genre: "explain",
  tip: "Have students touch each step on their outline as they say it aloud so the order words match the math.",
  lessons: [
    { id: "A", title: "Composing and decomposing fractions" },
    { id: "B", title: "Adding and subtracting fractions with like denominators" },
    { id: "C", title: "Mixed numbers and improper fractions" },
    { id: "D", title: "Multiplying a whole number by a fraction" },
  ],
  source: {
    title: "Nia's Lemonade Batches",
    lesson: "D",
    text: "Nia sells lemonade at the Waverly Farmers Market. Each batch needs 2/3 cup of lemon juice, and she makes 4 batches. First, she thinks of 4 groups of 2/3. That is 8 pieces of 1/3, so the product is 8/3. Next, she decomposes 8/3 into 6/3 and 2/3. Since 6/3 is 2 wholes, she writes the mixed number 2 2/3. Then she adds the 1 1/3 cups of juice she already has. She adds the whole numbers, 2 + 1 = 3. She adds the fractions, 2/3 + 1/3 = 3/3, which is 1 whole. Finally, she has 4 cups of juice in all.",
  },
  notes: [
    { sentence: "First, she thinks of 4 groups of 2/3.", note: "4 groups of 2/3" },
    { sentence: "That is 8 pieces of 1/3, so the product is 8/3.", note: "8 × 1/3 = 8/3" },
    { sentence: "Next, she decomposes 8/3 into 6/3 and 2/3.", note: "8/3 → 6/3 + 2/3" },
    { sentence: "She adds the fractions, 2/3 + 1/3 = 3/3, which is 1 whole.", note: "2/3 + 1/3 = 3/3 = 1 whole" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Nia decomposed 8/3 into 6/3 and 2/3",
      because: "6/3 is a whole-number amount that is easy to see.",
      but: "the total amount did not change.",
      so: "she could write 8/3 as the mixed number 2 2/3.",
    },
    {
      lesson: "B",
      kernel: "Nia added 2/3 and 1/3 by adding only the numerators",
      because: "both fractions had the same denominator.",
      but: "she did not add the denominators.",
      so: "the sum was 3/3, which is 1 whole.",
    },
    {
      lesson: "D",
      kernel: "Nia multiplied 4 × 2/3",
      because: "4 groups of 2/3 make 8 pieces of 1/3.",
      but: "the product 8/3 is an improper fraction, not a mixed number.",
      so: "she found that she needed 2 2/3 cups for four batches.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Nia made lemonade.",
      parts: { when: "on Saturday", where: "at the Waverly Farmers Market", how: "in four batches", why: "to sell to thirsty shoppers" },
      model: "On Saturday, Nia made lemonade at the Waverly Farmers Market in four batches to sell to thirsty shoppers.",
    },
    {
      lesson: "B",
      kernel: "Nia added the juice.",
      parts: { when: "after multiplying", how: "by adding the whole numbers first", why: "to find the total amount" },
      model: "After multiplying, Nia added the juice by adding the whole numbers first to find the total amount.",
    },
  ],
  fragments: [
    { text: "Nia thinks of 4 groups of 2/3.", is_sentence: true },
    { text: "Decomposes 8/3 into 6/3 and 2/3.", is_sentence: false, fix: "Nia decomposes 8/3 into 6/3 and 2/3." },
    { text: "Since 6/3 is 2 wholes.", is_sentence: false, fix: "She writes a mixed number since 6/3 is 2 wholes." },
    { text: "The sum is 4 cups of juice.", is_sentence: true },
    { text: "The product of 4 and 2/3.", is_sentence: false, fix: "The product of 4 and 2/3 is 8/3." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A unit fraction, ___, was the piece Nia counted to make 8/3.",
      noun: "unit fraction",
      options: ["a fraction that has 1 as its top number", "a number made of a whole number and a fraction", "the answer to an addition problem"],
      answer: 0,
      model: "A unit fraction, a fraction that has 1 as its top number, was the piece Nia counted to make 8/3.",
    },
    {
      lesson: "C",
      sentence: "A mixed number, ___, shows 2 wholes and 2/3 more.",
      noun: "mixed number",
      options: ["a fraction whose top number is greater than its bottom number", "a whole number and a fraction together", "a fraction that has 1 as its top number"],
      answer: 1,
      model: "A mixed number, a whole number and a fraction together, shows 2 wholes and 2/3 more.",
    },
    {
      lesson: "D",
      sentence: "The product, ___, was 8/3 before Nia decomposed it.",
      noun: "product",
      options: ["the answer to an addition problem", "the answer to a subtraction problem", "the answer to a multiplication problem"],
      answer: 2,
      model: "The product, the answer to a multiplication problem, was 8/3 before Nia decomposed it.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "when", stem: "she thinks of 4 groups of 2/3", model: "When Nia multiplies 4 × 2/3, she thinks of 4 groups of 2/3." },
    { lesson: "C", conjunction: "since", stem: "she writes the mixed number 2 2/3", model: "Since 6/3 is 2 wholes, she writes the mixed number 2 2/3." },
    { lesson: "B", conjunction: "because", stem: "Nia adds only the numerators", model: "Because both fractions have the same denominator, Nia adds only the numerators." },
  ],
  spo: {
    topic: {
      l1_2: "Nia [multiplies] and then [adds] fractions.",
      l3_4: "Nia finds the total cups of juice by [multiplying a fraction by a whole number] and then [adding mixed numbers].",
      l5_6: "Although [the problem has two operations], Nia explains each step in order by [decomposing and composing] fractions.",
    },
    starters: [
      { type: "question", text: "How can you turn 4 batches of 2/3 cup into one total?" },
      { type: "appositive", text: "Nia, a lemonade seller at the Waverly Farmers Market, uses fractions every Saturday." },
      { type: "subordinate", text: "When Nia multiplies 4 × 2/3, she thinks of 4 groups of 2/3." },
    ],
    details: [
      { note: "4 groups of 2/3 = 8/3", lesson: "D" },
      { note: "8/3 → 6/3 + 2/3", lesson: "A" },
      { note: "6/3 = 2 wholes → 2 2/3", lesson: "C" },
      { note: "add 1 1/3 cups already there", lesson: "B" },
      { note: "whole numbers: 2 + 1 = 3", lesson: "B" },
      { note: "fractions: 2/3 + 1/3 = 3/3 = 1", lesson: "B" },
    ],
    distractors: ["lemons are yellow and sour", "the market opens on Saturday morning"],
    conclusion: {
      l1_2: "Nia has [4] cups.",
      l3_4: "Finally, Nia has [4] cups of juice [in all].",
      l5_6: "In the end, [multiplying, decomposing, and adding] showed Nia she had [exactly 4 cups] of lemon juice.",
    },
  },
  prompt: {
    l1_2: "Draw Nia's lemonade. Write 2-3 sentences that tell the steps she takes. Use the words first and next.",
    l3_4: "Write a paragraph that explains, step by step, how Nia finds 4 × 2/3 and then adds 1 1/3. Use your outline and the order words first, next, then, and finally.",
    l5_6: "Write a paragraph that explains how Nia multiplies 4 × 2/3, writes the product as a mixed number, and adds 1 1/3. Include an appositive and a sentence that starts with when or since.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Since", "So", "When", "Finally,"],
  model: {
    l1_2: "First, Nia multiplies 4 × 2/3. The product is 8/3. Then she adds the juice.",
    l3_4: "Nia finds the total cups of juice by multiplying a fraction by a whole number and then adding mixed numbers. First, she thinks of 4 groups of 2/3, which is 8/3. Next, she decomposes 8/3 into 6/3 and 2/3, so the mixed number is 2 2/3. Then she adds the 1 1/3 cups she already has. Finally, 2 + 1 is 3 and 2/3 + 1/3 is 1 whole, so Nia has 4 cups.",
    l5_6: "Nia, a lemonade seller at the Waverly Farmers Market, explains each step in order. When she multiplies 4 × 2/3, she thinks of 4 groups of 2/3, which makes 8/3. Next, she decomposes 8/3 into 6/3 and 2/3. Since 6/3 is 2 wholes, she writes the mixed number 2 2/3. Then she adds the 1 1/3 cups of juice she already has. Because the denominators are the same, she adds the whole numbers first, 2 + 1 = 3, and then the fractions, 2/3 + 1/3 = 3/3. Finally, 3/3 is 1 whole, so Nia has 4 cups of juice in all.",
  },
  revise: [
    "Did I use first, next, then, and finally in the right order?",
    "Did I show the product 8/3 and how I wrote it as 2 2/3?",
    "Did I explain why I added only the numerators?",
    "Did I use words like decompose, mixed number, and denominator correctly?",
  ],
};

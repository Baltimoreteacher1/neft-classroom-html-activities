// BCPSS Writing Lab (TWR) — g5-math-u5 · Multiply & Divide Fractions (Scaling). Contract: ../writing-schema.mjs

export default {
  title: "Shrink It or Stretch It",
  genre: "inform",
  tip: "Show both problems on a number line first so students can see one product land left of 12 and the other land right of it.",
  lessons: [
    { id: "A", title: "Multiplication as scaling" },
    { id: "B", title: "Multiplying fractions and whole numbers" },
    { id: "C", title: "Area of rectangles with fraction sides" },
    { id: "D", title: "Dividing unit fractions and whole numbers" },
  ],
  source: {
    title: "Two Sizes of One Poster",
    lesson: "A",
    text: "Kenji's class is making posters for the school fair. A sample poster is 12 inches wide. Both 12 × 1/3 and 12 × 3 scale the width of the sample. Multiplying by 1/3 makes the poster smaller, because 1/3 is less than 1. The new poster is 4 inches wide. In contrast, multiplying by 3 makes it larger, because 3 is greater than 1. That poster is 36 inches wide. A factor less than 1 shrinks a number, whereas a factor greater than 1 stretches it.",
  },
  notes: [
    { sentence: "Both 12 × 1/3 and 12 × 3 scale the width of the sample.", note: "both scale: 12 × 1/3, 12 × 3" },
    { sentence: "Multiplying by 1/3 makes the poster smaller, because 1/3 is less than 1.", note: "× 1/3 = smaller (1/3 < 1)" },
    { sentence: "In contrast, multiplying by 3 makes it larger, because 3 is greater than 1.", note: "× 3 = larger (3 > 1)" },
    { sentence: "A factor less than 1 shrinks a number, whereas a factor greater than 1 stretches it.", note: "factor < 1 shrinks; > 1 stretches" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Multiplying 12 by 1/3 makes the poster smaller",
      because: "1/3 is less than 1.",
      but: "multiplying 12 by 3 makes the poster larger.",
      so: "the new poster is only 4 inches wide.",
    },
    {
      lesson: "B",
      kernel: "Both 1/2 × 6 and 2 × 6 are multiplication",
      because: "each one scales the number 6.",
      but: "one makes the product smaller and one makes it larger.",
      so: "we must look at the size of the factor.",
    },
    {
      lesson: "C",
      kernel: "A rectangle with sides of 1/2 foot and 1/4 foot is small",
      because: "its area is only 1/8 square foot.",
      but: "a rectangle with sides of 2 feet and 1/4 foot is bigger.",
      so: "the longer side makes the area four times as great.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Kenji scaled the poster.",
      parts: { when: "before the school fair", how: "with a factor of 1/3", why: "to make a small copy" },
      model: "Before the school fair, Kenji scaled the poster with a factor of 1/3 to make a small copy.",
    },
    {
      lesson: "C",
      kernel: "Rosa found the area.",
      parts: { what: "of the smaller window box", how: "by multiplying 1/2 by 1/4", why: "to compare it with the bigger box" },
      model: "Rosa found the area of the smaller window box by multiplying 1/2 by 1/4 to compare it with the bigger box.",
    },
  ],
  fragments: [
    { text: "A unit fraction has a numerator of 1.", is_sentence: true },
    { text: "Because 1/3 is less than 1.", is_sentence: false, fix: "The poster gets smaller because 1/3 is less than 1." },
    { text: "Multiplying by 3 makes the number larger.", is_sentence: true },
    { text: "Whereas a factor greater than 1 stretches a number.", is_sentence: false, fix: "A factor less than 1 shrinks a number, whereas a factor greater than 1 stretches it." },
    { text: "Finds the area of the rectangle.", is_sentence: false, fix: "Rosa finds the area of the rectangle." },
    { text: "Both 1/2 × 6 and 2 × 6 scaling the number 6.", is_sentence: false, fix: "Both 1/2 × 6 and 2 × 6 scale the number 6." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A factor, ___, tells how much to scale a number.",
      noun: "factor",
      options: ["a number that you multiply by another number", "the answer you get when you multiply", "a rectangle drawn to show a multiplication problem"],
      answer: 0,
      model: "A factor, a number that you multiply by another number, tells how much to scale a number.",
    },
    {
      lesson: "B",
      sentence: "A unit fraction, ___, can scale a number down.",
      noun: "unit fraction",
      options: ["a fraction with a 1 on top", "a fraction with a 1 on the bottom", "any fraction greater than 1"],
      answer: 0,
      model: "A unit fraction, a fraction with a 1 on top, can scale a number down.",
    },
    {
      lesson: "C",
      sentence: "An area model, ___, shows 1/2 × 1/4 as a small rectangle.",
      noun: "area model",
      options: ["a way to split a whole into equal parts", "the answer to a division problem", "a rectangle drawn to show a multiplication problem"],
      answer: 2,
      model: "An area model, a rectangle drawn to show a multiplication problem, shows 1/2 × 1/4 as a small rectangle.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the new poster is smaller", model: "Because 1/3 is less than 1, the new poster is smaller." },
    { lesson: "B", conjunction: "while", stem: "1/2 × 6 makes it smaller", model: "While 2 × 6 makes the number larger, 1/2 × 6 makes it smaller." },
    { lesson: "D", conjunction: "when", stem: "each part is 1/8", model: "When we divide the unit fraction 1/2 by 4, each part is 1/8." },
  ],
  spo: {
    topic: {
      l1_2: "Both [problems] scale the number, but one makes it [smaller].",
      l3_4: "Both [12 × 1/3] and [12 × 3] [scale] the number 12, but [12 × 1/3] makes it [smaller].",
      l5_6: "Although [both 12 × 1/3 and 12 × 3 scale the number 12], they [change it in opposite ways] because [one factor is less than 1 and the other is greater than 1].",
    },
    starters: [
      { type: "question", text: "How can multiplying make a number smaller instead of larger?" },
      { type: "appositive", text: "A factor like 1/3, a number less than 1, makes the product smaller than the starting number." },
      { type: "subordinate", text: "Although multiplying usually makes numbers bigger, a fraction factor can make them smaller." },
    ],
    details: [
      { note: "both scale the 12-inch poster", lesson: "A" },
      { note: "12 × 1/3 = 4 inches, smaller", lesson: "A" },
      { note: "12 × 3 = 36 inches, larger", lesson: "A" },
      { note: "factor < 1 shrinks; factor > 1 stretches", lesson: "B" },
      { note: "1/3 = unit fraction; 3 = whole number", lesson: "B" },
      { note: "area of 1/2 × 1/4 rectangle = 1/8", lesson: "C" },
    ],
    distractors: ["posters can be printed on paper", "Kenji likes to draw cartoons"],
    conclusion: {
      l1_2: "A factor less than 1 makes the product [smaller].",
      l3_4: "In contrast, [12 × 3] makes it [larger], because [3 is greater than 1].",
      l5_6: "In contrast, [a factor greater than 1] stretches the number, whereas [a factor less than 1] shrinks it, so [the size of the factor] tells what multiplying will do.",
    },
  },
  prompt: {
    l1_2: "Draw the two posters. Write 2-4 sentences. Tell one way the problems are alike and one way they are different.",
    l3_4: "Write a paragraph that compares 12 × 1/3 and 12 × 3. Use your outline, both, but, and whereas.",
    l5_6: "Write a paragraph that compares multiplying 12 by 1/3 and by 3 and explains what the size of the factor does. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["Both", "Similarly,", "But", "Whereas", "In contrast,", "However,", "While", "Therefore,"],
  model: {
    l1_2: "Both problems scale 12. Multiplying by 1/3 makes the poster smaller. Multiplying by 3 makes it larger.",
    l3_4: "Both 12 × 1/3 and 12 × 3 scale the width of the poster, but they change it in different ways. The product of 12 × 1/3 is 4 inches, whereas the product of 12 × 3 is 36 inches. Multiplying by 1/3 makes the poster smaller because 1/3 is less than 1. In contrast, multiplying by 3 makes it larger because 3 is greater than 1. The size of the factor tells us what happens to the number.",
    l5_6: "Although both 12 × 1/3 and 12 × 3 scale a 12-inch poster, they change it in opposite ways. A factor like 1/3, a number less than 1, shrinks the poster to 4 inches. In contrast, a factor like 3, a number greater than 1, stretches it to 36 inches. The same idea appears in an area model, where a rectangle that is 1/2 foot by 1/4 foot has an area of just 1/8 square foot. Both kinds of problems use multiplication, whereas the results are very different. Therefore, the size of the factor tells us whether multiplying will make a number smaller or larger.",
  },
  mpo: {
    thesis: "Multiplying by a fraction less than 1 and multiplying by a number greater than 1 are both scaling, but they change a quantity in opposite ways.",
    paragraphs: [
      { topic: "Both kinds of multiplication scale a number.", notes: ["both scale the 12-inch poster", "12 × 1/3 and 12 × 3"] },
      { topic: "A factor less than 1 shrinks a number.", notes: ["12 × 1/3 = 4 inches", "1/3 < 1", "1/3 = unit fraction"] },
      { topic: "A factor greater than 1 stretches a number.", notes: ["12 × 3 = 36 inches", "3 > 1", "product larger than 12"] },
    ],
    conclusion: "Comparing the two problems shows that the size of the factor tells us whether multiplying makes a number smaller or larger.",
  },
  revise: [
    "Did I name one way 12 × 1/3 and 12 × 3 are alike and one way they are different?",
    "Did I use both, but, whereas, or in contrast to show the comparison?",
    "Did I give the two products, 4 and 36, and explain why they are different?",
    "Did I explain what a factor less than 1 does and what a factor greater than 1 does?",
  ],
};

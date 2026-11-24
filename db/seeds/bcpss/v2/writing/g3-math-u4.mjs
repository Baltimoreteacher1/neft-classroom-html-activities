// BCPSS Writing Lab (TWR) — g3-math-u4 · Understand & Compare Fractions. Contract: ../writing-schema.mjs

export default {
  title: "Who Ate More Pizza?",
  genre: "argue",
  tip: "Have students draw both pizzas and a number line before they write, so the claim and the proof come from the same picture.",
  lessons: [
    { id: "A", title: "Unit fractions on a number line" },
    { id: "B", title: "Fractions that are not unit fractions on a number line" },
    { id: "C", title: "Equivalent fractions" },
    { id: "D", title: "Comparing fractions with the same numerator or denominator" },
  ],
  source: {
    title: "The Pizza Argument",
    lesson: "D",
    text: "Sam and Tia each have a same-size pizza from a shop in Fells Point. Sam cuts his pizza into 3 equal pieces and eats 1 piece. Tia cuts hers into 6 equal pieces and eats 1 piece. Tia says she ate more because 6 is greater than 3. Sam disagrees. The denominator tells how many equal parts make the whole, so more parts means smaller pieces. On a number line, 1/3 is farther to the right than 1/6. So 1/3 is greater than 1/6. Sam ate more pizza.",
  },
  notes: [
    { sentence: "Tia cuts hers into 6 equal pieces and eats 1 piece.", note: "Tia: 6 equal parts, eats 1/6" },
    { sentence: "Tia says she ate more because 6 is greater than 3.", note: "Tia thinks 6 > 3 → more" },
    { sentence: "The denominator tells how many equal parts make the whole, so more parts means smaller pieces.", note: "denominator = # equal parts; more parts → smaller pieces" },
    { sentence: "On a number line, 1/3 is farther to the right than 1/6.", note: "number line: 1/3 right of 1/6" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "The fraction 1/3 is greater than 1/6",
      because: "thirds are bigger pieces than sixths.",
      but: "6 is a greater number than 3.",
      so: "the person who ate 1/3 ate more pizza.",
    },
    {
      lesson: "A",
      kernel: "The denominator tells how many equal parts make the whole",
      because: "the whole is cut into that many pieces.",
      but: "a bigger denominator does not mean bigger pieces.",
      so: "1/8 is smaller than 1/4.",
    },
    {
      lesson: "C",
      kernel: "The fractions 1/2 and 2/4 name the same amount",
      because: "they land on the same point on the number line.",
      but: "their numerators and denominators are different numbers.",
      so: "we call them equivalent fractions.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Tia marked 1/6.",
      parts: { when: "after she folded the strip", where: "on the number line", how: "with a small dot", why: "to show where it belongs" },
      model: "After she folded the strip, Tia marked 1/6 on the number line with a small dot to show where it belongs.",
    },
    {
      lesson: "B",
      kernel: "Sam ate 1/3.",
      parts: { when: "at lunch", where: "in Fells Point", why: "because he was hungry" },
      model: "At lunch, Sam ate 1/3 of his pizza in Fells Point because he was hungry.",
    },
  ],
  fragments: [
    { text: "Tia cut her pizza into 6 equal pieces.", is_sentence: true },
    { text: "Because thirds are bigger than sixths.", is_sentence: false, fix: "Sam ate more because thirds are bigger than sixths." },
    { text: "The number line shows 1/3 to the right of 1/6.", is_sentence: true },
    { text: "Equal parts of the same size.", is_sentence: false, fix: "A fraction names equal parts of the same size." },
    { text: "Is greater than 1/6.", is_sentence: false, fix: "The fraction 1/3 is greater than 1/6." },
    { text: "The denominator tells how many equal parts.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "The denominator, ___, tells how many equal parts make the whole.",
      noun: "denominator",
      options: ["the top number in a fraction", "the bottom number in a fraction", "a fraction with 1 on top"],
      answer: 1,
      model: "The denominator, the bottom number in a fraction, tells how many equal parts make the whole.",
    },
    {
      lesson: "A",
      sentence: "A unit fraction, ___, counts just one equal part.",
      noun: "unit fraction",
      options: ["a fraction with 1 on top", "a line that shows numbers in order", "pieces that are exactly the same size"],
      answer: 0,
      model: "A unit fraction, a fraction with 1 on top, counts just one equal part.",
    },
    {
      lesson: "B",
      sentence: "A number line, ___, shows which fraction is greater.",
      noun: "number line",
      options: ["the full amount with nothing left out", "fractions that name the same amount", "a line with equal spaces that shows numbers in order"],
      answer: 2,
      model: "A number line, a line with equal spaces that shows numbers in order, shows which fraction is greater.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "Sam ate more pizza", model: "Because thirds are bigger than sixths, Sam ate more pizza." },
    { lesson: "A", conjunction: "although", stem: "Tia's pieces are smaller", model: "Although 6 is a greater number than 3, Tia's pieces are smaller." },
    { lesson: "C", conjunction: "when", stem: "we compare the denominators", model: "When the numerators are the same, we compare the denominators." },
  ],
  spo: {
    topic: {
      l1_2: "[1/3] is [greater] than [1/6].",
      l3_4: "[1/3] is greater than [1/6] because [thirds are bigger pieces than sixths].",
      l5_6: "Although [Tia's denominator, 6,] is greater than 3, [1/3] is greater than [1/6] because [the number line shows 1/3 farther to the right].",
    },
    starters: [
      { type: "question", text: "Does a bigger denominator mean a bigger fraction?" },
      { type: "statement", text: "Sam ate more pizza than Tia did." },
      { type: "subordinate", text: "Although 6 is greater than 3, sixths are smaller pieces than thirds." },
    ],
    details: [
      { note: "Sam: 3 equal parts, eats 1", lesson: "A" },
      { note: "Tia: 6 equal parts, eats 1", lesson: "A" },
      { note: "more parts → smaller pieces", lesson: "D" },
      { note: "number line: 1/3 right of 1/6", lesson: "B" },
      { note: "same numerator → compare denominators", lesson: "D" },
      { note: "1/3 and 2/6 are equivalent", lesson: "C" },
    ],
    distractors: ["Fells Point is near the harbor", "pizza can have pepperoni"],
    conclusion: {
      l1_2: "So [Sam] ate [more].",
      l3_4: "So I claim that [1/3] is greater than [1/6], as shown by [the number line].",
      l5_6: "Therefore, [Sam ate more pizza], since [with the same numerator, the smaller denominator has the bigger pieces].",
    },
  },
  prompt: {
    l1_2: "Draw Sam's pizza and Tia's pizza. Write 2-3 sentences. Tell who ate more.",
    l3_4: "Tia says 1/6 is greater than 1/3 because 6 is greater than 3. Is she right? Write a paragraph with your claim and a reason that proves it.",
    l5_6: "Argue whether Tia or Sam is right about the pizza. Include an appositive, a sentence that starts with although or because, and proof from the number line.",
  },
  transitions: ["I claim that", "Because", "Since", "As shown by", "For example,", "This proves that", "However,", "Therefore,"],
  model: {
    l1_2: "I think Sam ate more. The fraction 1/3 is greater than 1/6. Thirds are bigger pieces.",
    l3_4: "I claim that 1/3 is greater than 1/6 because thirds are bigger pieces than sixths. Sam cut his pizza into 3 equal parts, so each part is big. Tia cut hers into 6 equal parts, so each part is small. As shown by the number line, 1/3 is farther to the right than 1/6. Therefore, Sam ate more pizza than Tia.",
    l5_6: "Although 6 is a greater number than 3, Tia is not right. The denominator, the bottom number in a fraction, tells how many equal parts make the whole. When a whole is cut into more parts, each piece is smaller. Because both fractions have 1 on top, the bigger pieces win. As shown by the number line, 1/3 is farther to the right than 1/6. Therefore, 1/3 is greater than 1/6, so Sam ate more pizza.",
  },
  revise: [
    "Did I say which fraction is greater in my first sentence?",
    "Did I give a reason with because?",
    "Did I use equal parts or the number line as proof?",
    "Did I write each fraction with the right numerator and denominator?",
  ],
};

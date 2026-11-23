// Vocab Quest: the words students need to explain adding fractions with unlike denominators (grade 5 math).
export default {
  id: "g5-math-fraction-words-quest",
  engine: "vocab-quest",
  title: "Fraction Words Quest",
  grade: "5",
  band: "3-5",
  subject: "math",
  lessonId: "g5-math-add-unlike-fractions",
  standards: ["5.NF.A.1", "5.NF.A.2"],
  curriculum: {
    status: "district-referenced",
    unitId: "g5-math-u4",
    note: "Matches the Add & Subtract Fractions with Unlike Denominators unit in the BCPSS curriculum seed. Words and sentences are original.",
  },
  vocabIds: [
    "numerator",
    "denominator",
    "equivalent-fractions",
    "unlike-denominators",
    "common-denominator",
    "sum",
    "mixed-number",
    "benchmark-fraction",
  ],
  minutes: 18,
  intro:
    "Meet eight words for talking about fractions, then use them in sentences, remember them, and explain how to add fractions that have different size pieces.",
  collection: "g5-math-add-unlike-fractions",
  stages: [
    {
      id: "see",
      kind: "see",
      title: "See the words",
      intro: "Look at each picture and choose the fraction word it shows.",
      entryIds: ["numerator", "denominator", "equivalent-fractions", "unlike-denominators"],
    },
    {
      id: "use",
      kind: "use-in-context",
      title: "Use the words",
      intro: "Fill in each sentence, then choose the sentence that uses a word correctly.",
      entryIds: ["common-denominator", "equivalent-fractions", "sum", "mixed-number"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "common-denominator",
          prompt: "Which sentence uses common denominator correctly?",
          choices: [
            "To add 1/2 and 1/3, I rewrote both with 6 as the common denominator.",
            "To add 1/2 and 1/3, I used 5 as the common denominator because 2 plus 3 is 5.",
            "To add 1/2 and 1/3, the common denominator is the sum of the two top numbers.",
          ],
          answer: 0,
          hints: [
            "A common denominator is a bottom number that both fractions can be rewritten to use.",
            "Check whether both halves and thirds can be cut into that number of equal parts.",
            "Test each choice: can you write one half and one third with that bottom number?",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "adds-denominators",
              hint: "Adding the bottom numbers does not make pieces that both fractions can use. Look for a number both 2 and 3 fit into.",
            },
            {
              pick: 2,
              tag: "confuses-numerator-denominator",
              hint: "The top numbers count parts. A common denominator is about the bottom number, which names the size of the pieces.",
            },
          ],
          why: "Six is a number that both 2 and 3 fit into, so halves and thirds can both be written as sixths.",
        },
        {
          kind: "sentence-choice",
          entryId: "sum",
          prompt: "Which sentence uses sum correctly?",
          choices: [
            "The sum of 2/5 and 1/5 is 3/5, because 2 fifths and 1 fifth make 3 fifths.",
            "The sum of 2/5 and 1/5 is 1/5, because I took away 1 fifth from 2 fifths.",
            "The sum of 2/5 and 1/5 is 2/10, because I multiplied the numbers.",
          ],
          answer: 0,
          hints: [
            "A sum comes from putting amounts together, not from taking one away.",
            "Count how many fifths there are when the two amounts are joined.",
            "Both amounts have the same size pieces, so you can count the pieces together.",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "sum-as-difference",
              hint: "That choice takes an amount away. A sum puts amounts together.",
            },
            {
              pick: 2,
              tag: "sum-as-product",
              hint: "Multiplying does not combine the amounts into a total. Ask how many fifths there are altogether.",
            },
          ],
          why: "Two fifths and one fifth together are three fifths, and that total is the sum.",
        },
      ],
    },
    {
      id: "retrieve",
      kind: "retrieve",
      title: "Remember the words",
      intro: "Read the meaning and type the word from memory.",
      entryIds: ["numerator", "denominator", "sum", "benchmark-fraction"],
    },
    {
      id: "apply",
      kind: "apply",
      title: "Explain with the words",
      intro: "Say or write a sentence about adding fractions that uses each word.",
      entryIds: ["common-denominator", "unlike-denominators", "equivalent-fractions"],
    },
    {
      id: "revisit",
      kind: "revisit",
      title: "Revisit the words",
      intro: "Words that need more practice come back here in a different form.",
    },
  ],
  reflection: {
    prompt: "Which fraction word is hardest to explain, and what could you do to make it clearer?",
    frames: {
      ee: ["The word ___ is hard.", "A picture of ___ helps me."],
      dev: ["The word ___ is hard because ___.", "I can explain it by drawing ___."],
      exp: ["I find ___ hard to explain because ___, so I could ___."],
      br: ["I would make ___ clearer by connecting it to ___, which shows that ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

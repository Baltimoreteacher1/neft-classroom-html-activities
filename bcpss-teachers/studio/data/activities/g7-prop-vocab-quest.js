// vocab-quest: eleven words for proportional relationships and their graphs (7.RP.A.2). Words come from the lesson's vocab collection.
export default {
  id: "g7-prop-vocab-quest",
  engine: "vocab-quest",
  title: "Word Quest: Proportional Relationships",
  grade: "7",
  band: "6-8",
  subject: "math",
  lessonId: "g7-math-proportional-relationships-graphs",
  standards: ["7.RP.A.2", "7.RP.A.2b"],
  curriculum: {
    status: "district-referenced",
    unitId: "g7-math-u1",
    program: "Reveal Math",
    note: "7.RP.A.2 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
  },
  vocabIds: [
    "proportional-relationship",
    "constant-of-proportionality",
    "unit-rate",
    "origin",
    "ordered-pair",
    "non-proportional",
    "constant",
    "equivalent-ratios",
    "coordinate-plane",
    "verify",
    "justify",
  ],
  minutes: 18,
  intro:
    "Meet eleven words for talking about constant rates and their graphs. See each word in a picture, use it in a sentence, remember it, then say and write your own sentence.",
  collection: "g7-math-proportional-relationships-graphs",
  stages: [
    {
      id: "see",
      kind: "see",
      title: "See the words",
      intro: "Match each picture to the word it shows.",
      entryIds: [
        "proportional-relationship",
        "constant-of-proportionality",
        "unit-rate",
        "origin",
        "ordered-pair",
        "non-proportional",
        "constant",
      ],
      kinds: ["picture-word"],
      passMark: 0.67,
    },
    {
      id: "use",
      kind: "use-in-context",
      title: "Use the words",
      intro:
        "Finish the sentence with the word that fits, then choose the sentence that uses a word correctly.",
      entryIds: [
        "proportional-relationship",
        "constant-of-proportionality",
        "unit-rate",
        "equivalent-ratios",
        "non-proportional",
      ],
      kinds: ["cloze"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "constant-of-proportionality",
          prompt:
            "A table shows x is 2, 4, 6 and y is 10, 20, 30. Which sentence uses constant of proportionality correctly?",
          choices: [
            "The constant of proportionality is 30 because 30 is the largest y value.",
            "The constant of proportionality is 5 because y divided by x is 5 in every row.",
            "The constant of proportionality is 2 because 2 is the first x value.",
          ],
          answer: 1,
          hints: [
            "The constant is a ratio, so it comes from comparing y with x, not from one number in the table.",
            "Try dividing y by x in the first row and in the second row. What do you notice?",
            "Choose the reason that says what stays the same in every row.",
          ],
          misconceptions: [
            {
              pick: 0,
              tag: "largest-value-as-constant",
              hint: "The largest y value is only one output. The constant has to work in every row.",
            },
            {
              pick: 2,
              tag: "first-x-as-constant",
              hint: "The first x value is just where the table starts. The constant comes from comparing y with x.",
            },
          ],
          why: "Dividing y by x gives the same number in every row, and that unchanging ratio is the constant of proportionality.",
        },
        {
          kind: "sentence-choice",
          entryId: "non-proportional",
          prompt:
            "A gym charges a 20 dollar joining fee plus 10 dollars each month. Which sentence uses non-proportional correctly?",
          choices: [
            "The gym cost is non-proportional because it goes up each month.",
            "The gym cost is non-proportional because its graph would be curved.",
            "The gym cost is non-proportional because it already costs 20 dollars at 0 months.",
          ],
          answer: 2,
          hints: [
            "Think about what a proportional relationship needs at 0 months.",
            "Many relationships go up each month. Ask what is different about this one at the start.",
            "Look for the sentence that mentions the cost at the very start.",
          ],
          misconceptions: [
            {
              pick: 0,
              tag: "increasing-is-not-proportional",
              hint: "A proportional relationship can also go up each month. Ask what the cost is at 0 months.",
            },
            {
              pick: 1,
              tag: "curved-graph",
              hint: "The cost rises by the same amount each month, so the graph is straight. Look at where it starts.",
            },
          ],
          why: "A proportional relationship must cost nothing at 0. The joining fee means the gym is already 20 dollars at 0 months.",
        },
      ],
      passMark: 0.67,
    },
    {
      id: "retrieve",
      kind: "retrieve",
      title: "Remember the words",
      intro: "Read each meaning and type the word from memory.",
      entryIds: [
        "constant-of-proportionality",
        "unit-rate",
        "origin",
        "ordered-pair",
        "coordinate-plane",
        "constant",
      ],
      kinds: ["type-word"],
      passMark: 0.67,
    },
    {
      id: "apply",
      kind: "apply",
      title: "Apply the words",
      intro: "Say a sentence out loud, then write it. Your sentence must show what the word means.",
      entryIds: [
        "verify",
        "justify",
        "proportional-relationship",
        "constant-of-proportionality",
        "equivalent-ratios",
      ],
      kinds: ["say-write"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "verify",
          prompt: "Which sentence uses verify correctly?",
          choices: [
            "To verify that a table is proportional, I divided y by x in every row and compared the answers.",
            "To verify that a table is proportional, I guessed from the first row.",
            "To verify that a table is proportional, I circled the biggest number.",
          ],
          answer: 0,
          hints: [
            "To verify is to test something, not to guess at it.",
            "Which sentence describes a test you could repeat on every row?",
            "Look for the sentence that compares results from more than one row.",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "guess-is-not-a-test",
              hint: "One row cannot show what happens in the others. Ask how you could test every row.",
            },
            {
              pick: 2,
              tag: "biggest-number",
              hint: "The biggest number does not tell you whether a ratio stays the same. What test uses y and x?",
            },
          ],
          why: "Verifying means testing with numbers. Dividing y by x in every row and comparing the answers tests every row.",
        },
      ],
      passMark: 0.67,
    },
    {
      id: "revisit",
      kind: "revisit",
      title: "Revisit the words",
      intro: "Words you need more practice with come back in new forms.",
    },
  ],
  reflection: {
    prompt:
      "Which word will you use this week when you decide whether a relationship is proportional?",
    frames: {
      ee: ["I will use ___.", "It means ___."],
      dev: ["I will use ___ when I ___.", "It helps me say ___."],
      exp: ["I will use ___ when I explain ___ because it shows ___."],
      br: ["I will use ___ to ___, and I can tell it applies because ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

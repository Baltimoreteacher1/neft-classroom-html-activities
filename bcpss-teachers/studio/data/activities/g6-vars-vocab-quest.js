// vocab-quest: twelve words for two quantities that change together (6.EE.C.9). Words come from the lesson's vocab collection.
export default {
  id: "g6-vars-vocab-quest",
  engine: "vocab-quest",
  title: "Word Quest: Variables and Relationships",
  grade: "6",
  band: "6-8",
  subject: "math",
  lessonId: "g6-math-variables-relationships",
  standards: ["6.EE.C.9"],
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u5",
    program: "Reveal Math",
    note: "6.EE.C.9 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
  },
  vocabIds: [
    "variable",
    "independent-variable",
    "dependent-variable",
    "relationship",
    "table",
    "graph",
    "equation",
    "rate-of-change",
    "steeper",
    "represent",
    "compare",
    "justify",
  ],
  minutes: 18,
  intro:
    "Meet twelve words about two quantities that change together. See each word in a picture, use it in a sentence, remember it, then say and write your own sentence.",
  collection: "g6-math-variables-relationships",
  stages: [
    {
      id: "see",
      kind: "see",
      title: "See the words",
      intro: "Match each picture to the word it shows.",
      entryIds: [
        "variable",
        "independent-variable",
        "dependent-variable",
        "relationship",
        "table",
        "graph",
        "equation",
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
        "independent-variable",
        "dependent-variable",
        "rate-of-change",
        "equation",
        "steeper",
        "relationship",
      ],
      kinds: ["cloze"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "independent-variable",
          prompt:
            "A hose runs for some minutes and fills a barrel. Which sentence uses independent variable correctly?",
          choices: [
            "The gallons are the independent variable because they are measured after the minutes are chosen.",
            "The minutes are the independent variable because we choose how long the hose runs.",
            "The independent variable is the quantity that never changes.",
          ],
          answer: 1,
          hints: [
            "Think about which quantity a person decides on before anything is measured.",
            "One sentence describes the quantity that is found afterward. Ask whether that quantity is chosen or found.",
            "Look for the sentence that says why the quantity is chosen first.",
          ],
          misconceptions: [
            {
              pick: 0,
              tag: "swaps-the-variables",
              hint: "Those gallons are found after the time is set. Which quantity is chosen first?",
            },
            {
              pick: 2,
              tag: "independent-means-constant",
              hint: "Both quantities in a relationship change. The word is about what is chosen, not about staying the same.",
            },
          ],
          why: "The minutes are chosen first, so they are the quantity the other one depends on.",
        },
        {
          kind: "sentence-choice",
          entryId: "rate-of-change",
          prompt:
            "A table shows x is 1, 2, 3, 4 and y is 3, 6, 9, 12. Which sentence uses rate of change correctly?",
          choices: [
            "The rate of change is 12 because 12 is the last y value in the table.",
            "The rate of change is 3 because y goes up by 3 each time x goes up by 1.",
            "The rate of change is 4 because the table has four rows.",
          ],
          answer: 1,
          hints: [
            "The rate of change is about what happens between rows, not about one row.",
            "Subtract one y value from the next y value, then check whether x went up by 1.",
            "Pick the sentence whose reason describes a change from one row to the next.",
          ],
          misconceptions: [
            {
              pick: 0,
              tag: "last-value-as-rate",
              hint: "A single y value tells where you are, not how fast y changes. What is the gap between two y values?",
            },
            {
              pick: 2,
              tag: "counts-rows",
              hint: "The number of rows only says how many pairs were listed. Look at how the y values change.",
            },
          ],
          why: "Each step of 1 in x adds 3 to y, so 3 is the amount y changes for each 1 of x.",
        },
        {
          kind: "sentence-choice",
          entryId: "steeper",
          prompt:
            "Line A rises 5 for each 1 across and Line B rises 2 for each 1 across. Which sentence uses steeper correctly?",
          choices: [
            "Line A is steeper than Line B because it is drawn longer on the page.",
            "Line A is steeper than Line B because it rises more for each step across.",
            "Line A is steeper than Line B because it starts higher on the side.",
          ],
          answer: 1,
          hints: [
            "Steepness is about how a line climbs, not about where it is drawn.",
            "Compare the two numbers the problem gives for each step across.",
            "Choose the reason that mentions what happens for each step across.",
          ],
          misconceptions: [
            {
              pick: 0,
              tag: "longer-means-steeper",
              hint: "A line can be drawn longer and still climb slowly. What do the two rise numbers tell you?",
            },
            {
              pick: 2,
              tag: "start-height-as-steepness",
              hint: "Where a line starts does not tell how fast it climbs. Look at the amounts for each step across.",
            },
          ],
          why: "A rise of 5 for each step across climbs faster than a rise of 2, so Line A is steeper.",
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
        "variable",
        "independent-variable",
        "dependent-variable",
        "rate-of-change",
        "table",
        "graph",
      ],
      kinds: ["type-word"],
      passMark: 0.67,
    },
    {
      id: "apply",
      kind: "apply",
      title: "Apply the words",
      intro: "Say a sentence out loud, then write it. Your sentence must show what the word means.",
      entryIds: ["represent", "compare", "justify", "rate-of-change", "equation"],
      kinds: ["say-write"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "justify",
          prompt: "Which sentence uses justify correctly?",
          choices: [
            "To justify my answer, I wrote it in my best handwriting.",
            "To justify my answer, I showed that 4 times 3 equals 12, matching the row in the table.",
            "To justify my answer, I said it louder than everyone else.",
          ],
          answer: 1,
          hints: [
            "Justifying is about giving a reason, not about how the answer looks or sounds.",
            "Which sentence gives evidence that someone else could check?",
            "Look for the sentence that uses numbers that connect to the table.",
          ],
          misconceptions: [
            {
              pick: 0,
              tag: "neatness-as-reason",
              hint: "Neat writing does not tell why an answer makes sense. What evidence could you show?",
            },
            {
              pick: 2,
              tag: "volume-as-reason",
              hint: "How loudly you say something is not a reason. Ask what you could point to in the table.",
            },
          ],
          why: "Showing a calculation that matches a table row gives a reason someone else can check.",
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
      "Which word will you use this week when you explain how two quantities change together?",
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

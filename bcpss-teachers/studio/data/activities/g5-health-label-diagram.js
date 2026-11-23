// Concept Builder (label-diagram): place what each part of a Nutrition Facts label tells you (grade 5 health).
import { ROW, SNACK_A, SNACK_B, labelVisual, rowY } from "../kits/c8-nutrition-labels.js";

const BOTH_PLACED = {
  type: "all",
  checks: [
    { type: "equals", of: "wrong", value: "0" },
    { type: "equals", of: "unplaced", value: "0" },
  ],
};
const mid = (i) => rowY(i) - 5;
// Numbered spots sit in a clear margin beside the label so they never cover the numbers a learner must read.
const PAD = 44;
const spot = (id, side, y, answer, name) => ({ id, x: side === "L" ? PAD / 2 : 320 + PAD + PAD / 2, y, answer, name });

const explainFrames = {
  ee: ["The label tells me ___.", "One serving has ___."],
  dev: ["I placed ___ because the label says ___.", "The numbers are for one ___."],
  exp: ["I matched each part by checking what it measures, for example ___ measures ___."],
  br: [
    "Each part of the label answers a different question: ___ answers how much, and ___ answers how it compares with a whole day.",
  ],
};

const supportsFor = (visual, bank) => ({
  ee: {
    directions:
      "Tap a card, then tap the part of the label it describes. Read the words on the label before you decide.",
    frames: ["This part tells ___."],
    wordBank: bank,
    visual,
  },
  dev: { frames: ["I put this card here because the label says ___."], wordBank: bank.slice(0, 3) },
  exp: { frames: ["The part I chose measures ___, so the card fits."] },
  br: {},
});

export default {
  id: "g5-health-label-diagram",
  engine: "concept-builder",
  kind: "label-diagram",
  title: "What does each part of the label tell you?",
  grade: "5",
  band: "3-5",
  subject: "health-pe",
  lessonId: "g5-health-pe-nutrition-labels-and-choices",
  standards: ["NHES.3"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the National Health Education Standards on finding and judging health information; not mapped to a district unit sequence.",
  },
  vocabIds: [
    "serving-size",
    "servings-per-container",
    "calorie",
    "percent-daily-value",
    "dietary-fiber",
    "added-sugars",
  ],
  minutes: 12,
  intro:
    "Two invented snack labels are shown. Each card says what one part of the label tells you. Place every card on the part of the label it describes, then explain how you decided.",
  model: {
    visual: labelVisual(SNACK_A, { pad: PAD }),
    labels: [
      { id: "count", text: "How many servings are in the package" },
      { id: "size", text: "How much food is one serving" },
      { id: "energy", text: "The energy in one serving" },
      { id: "daily", text: "How much of a day's need one serving gives" },
      { id: "fiber", text: "A nutrient to get more of" },
      { id: "sugar", text: "Sugar the maker put in" },
      { id: "price", text: "The price of the package", distractor: true },
    ],
    hotspots: [
      spot("h-count", "R", 61, "count", "in the right margin beside the line just under the title"),
      spot("h-size", "R", 85, "size", "in the right margin beside the line above the thick bar"),
      spot("h-energy", "R", 134, "energy", "in the right margin beside the large number"),
      spot("h-daily", "R", 169, "daily", "in the right margin beside the column heading"),
      spot("h-fiber", "R", mid(ROW.fiber), "fiber", "in the right margin beside an indented line under carbohydrate"),
      spot("h-sugar", "R", mid(ROW.added), "sugar", "in the right margin beside the most indented line in the sugar group"),
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "Place each card on the part of the Crunchy Oat Rounds label that it describes. One card does not belong on a Nutrition Facts label.",
      goal: "Six cards placed on the label, one card left over",
      target: {
        placed: {
          "h-count": "count",
          "h-size": "size",
          "h-energy": "energy",
          "h-daily": "daily",
          "h-fiber": "fiber",
          "h-sugar": "sugar",
        },
      },
      check: BOTH_PLACED,
      answerText: "count",
      hints: [
        "Start with the top of the label. Which two lines are about the package and about one serving?",
        "Cards about energy and about a whole day each match a column or a big number.",
        "The leftover card is about money, and a Nutrition Facts label never lists a price.",
      ],
      misconceptions: [
        {
          match: "serving-vs-package",
          when: { type: "equals", of: "placed[h-count]", value: "size" },
          hint: "Check the line that you put the package card on. Does it say how many, or does it say how much one serving is?",
          model:
            "Servings per container is a count of servings in the whole package. Serving size is the amount in one serving.",
        },
        {
          match: "energy-vs-size",
          when: { type: "equals", of: "placed[h-energy]", value: "size" },
          hint: "Calories do not tell how much food there is. Think about what calories measure.",
        },
        {
          match: "daily-vs-energy",
          when: { type: "equals", of: "placed[h-daily]", value: "energy" },
          hint: "The % Daily Value compares a serving with a whole day. Which card talks about a day?",
        },
      ],
      model:
        "Servings per container sits under the title and counts the servings in the package. Serving size is the next line and names one serving. Calories is the large number and measures energy. The % Daily Value heading compares a serving with a day. Dietary fiber is the indented line under carbohydrate, and added sugars is the most indented line under total sugars.",
      right: "Every card is on the part of the label it describes.",
      supports: supportsFor(labelVisual(SNACK_A), [
        "servings per container",
        "serving size",
        "calories",
        "% Daily Value",
        "dietary fiber",
        "added sugars",
      ]),
      explain: {
        prompt:
          "Choose one card you placed. What does that part of the label tell you, and how did you know it belonged there?",
        frames: explainFrames,
        mustMention: [{ id: "serving", label: "one serving", any: ["serving"] }],
        criteria: [
          { id: "c1", label: "I named the part of the label." },
          { id: "c2", label: "I said what it tells about one serving." },
          { id: "c3", label: "I used a word from the label." },
        ],
      },
    },
    {
      id: "t2",
      prompt:
        "Now read the Berry Pop Bites label. Place each card on the number or line it describes.",
      goal: "Four cards placed, one card left over",
      setup: {
        visual: labelVisual(SNACK_B, { pad: PAD }),
        labels: [
          { id: "highest", text: "The highest % Daily Value on this label" },
          { id: "grams", text: "Grams of sugar the maker added" },
          { id: "one", text: "Calories in ONE serving" },
          { id: "pack", text: "How many servings are in the package" },
          { id: "whole", text: "Calories in the WHOLE package", distractor: true },
        ],
        hotspots: [
          spot("h-highest", "R", mid(ROW.added), "highest", "in the right margin beside the most indented sugar line"),
          spot("h-grams", "L", mid(ROW.added), "grams", "in the left margin beside the most indented sugar line"),
          spot("h-one", "R", 134, "one", "in the right margin beside the large number"),
          spot("h-pack", "R", 61, "pack", "in the right margin beside the line just under the title"),
        ],
      },
      target: {
        placed: { "h-highest": "highest", "h-grams": "grams", "h-one": "one", "h-pack": "pack" },
      },
      check: BOTH_PLACED,
      answerText: "highest",
      hints: [
        "Read every number in the right-hand column and find the biggest one.",
        "The sugar line has a gram amount on the left and a percent on the right. Match each card to the right side.",
        "The leftover card is a total for the whole package, but the label shows numbers for one serving.",
      ],
      misconceptions: [
        {
          match: "whole-package-calories",
          when: { type: "equals", of: "placed[h-one]", value: "whole" },
          hint: "The number beside Calories is for one serving. The whole package would need more math.",
        },
        {
          match: "percent-for-grams",
          when: { type: "equals", of: "placed[h-grams]", value: "highest" },
          hint: "Grams and percents are different units. Look at which side of the line shows grams.",
        },
      ],
      model:
        "The calories number is for one serving, so it goes with Calories in ONE serving. The sugar line shows grams on the left and a percent on the right, and 34% is the biggest % Daily Value on the label. The line under the title says how many servings are in the package.",
      right: "Every card is on the number or line it describes.",
      supports: supportsFor(labelVisual(SNACK_B), [
        "servings per container",
        "calories",
        "grams",
        "% Daily Value",
        "added sugars",
      ]),
      explain: {
        prompt:
          "Why does the calories number not tell you the calories in the whole package? What would you need to find the whole package?",
        frames: {
          ee: ["The number is for ___ serving.", "I need to know ___."],
          dev: ["The number is for one serving, so for the whole package I would ___."],
          exp: [
            "The calories number is for one serving; to find the whole package I would multiply ___ by ___.",
          ],
          br: [
            "Because every number on the label is for one serving, the calories for the whole package equal the calories in one serving times the servings per container.",
          ],
        },
        mustMention: [
          {
            id: "multiply",
            label: "multiplying by the servings per container",
            any: ["multipl", "times", "servings per container"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said the number is for one serving." },
          { id: "c2", label: "I named what I would need to find the whole package." },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "What is one fact on a label that could change which snack you choose? Say why it matters to you.",
    frames: {
      ee: ["One fact is ___.", "It matters because ___."],
      dev: ["A fact that could change my choice is ___ because ___."],
      exp: ["I would pay attention to ___ because ___, and I would compare it with ___."],
      br: [
        "The fact that would most affect my choice is ___ because ___; however I would also weigh ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

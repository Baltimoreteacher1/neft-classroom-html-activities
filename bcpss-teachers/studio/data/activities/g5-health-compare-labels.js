// Language Detective (diagram): compare two invented snack labels and build a claim from evidence (grade 5 health).
import { ROW, SNACK_A, SNACK_B, TWO_TOP, rowY, twoLabels } from "../kits/c8-nutrition-labels.js";

const OFF_B = 340;
const line = (ox, y, h = 22) => ({ x: ox + 10, y, w: 300, h });
const rowBox = (ox, i) => line(ox, rowY(i) - 17 + TWO_TOP);

const activity = {
  id: "g5-health-compare-labels",
  engine: "language-detective",
  title: "Label Detective: Two Snacks",
  grade: "5",
  band: "3-5",
  subject: "health-pe",
  lessonId: "g5-health-pe-nutrition-labels-and-choices",
  standards: ["NHES.3", "NHES.5"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the National Health Education Standards on finding health information and making decisions; not mapped to a district unit sequence.",
  },
  vocabIds: ["serving-size", "servings-per-container", "calorie", "dietary-fiber", "added-sugars"],
  minutes: 15,
  intro:
    "Two invented snacks have two labels. Tap the lines that are your proof, answer each question, and then build a claim about the snacks from your case notes.",
  scene: {
    kind: "diagram",
    title: "Crunchy Oat Rounds and Berry Pop Bites",
    source: "Original - The Language Page",
    caption:
      "Left label: Snack A. Right label: Snack B. Both labels use the same style, so you can compare line to line.",
    visual: twoLabels(SNACK_A, SNACK_B),
    regions: [
      { id: "a-calories", label: "Snack A, calories line", x: 10, y: 120 + TWO_TOP, w: 300, h: 34 },
      { id: "b-calories", label: "Snack B, calories line", x: OFF_B + 10, y: 120 + TWO_TOP, w: 300, h: 34 },
      { id: "a-count", label: "Snack A, servings per container line", x: 10, y: 52 + TWO_TOP, w: 300, h: 20 },
      {
        id: "b-count",
        label: "Snack B, servings per container line",
        x: OFF_B + 10,
        y: 52,
        w: 300,
        h: 20,
      },
      { id: "a-fiber", label: "Snack A, dietary fiber line", ...rowBox(0, ROW.fiber) },
      { id: "b-fiber", label: "Snack B, dietary fiber line", ...rowBox(OFF_B, ROW.fiber) },
      { id: "a-added", label: "Snack A, added sugars line", ...rowBox(0, ROW.added) },
      { id: "b-added", label: "Snack B, added sugars line", ...rowBox(OFF_B, ROW.added) },
    ],
  },
  questions: [
    {
      id: "q1",
      type: "detail",
      prompt: "Look at Snack B. How many calories are in ONE serving?",
      options: [
        { id: "a", text: "560 calories" },
        { id: "b", text: "140 calories" },
        { id: "c", text: "35 calories" },
        { id: "d", text: "4 calories" },
      ],
      answer: "b",
      evidence: [
        {
          id: "b-calories",
          why: "The calories line on the Snack B label gives the number for one serving.",
        },
      ],
      misconceptions: [
        {
          pick: "a",
          tag: "whole-package-for-one-serving",
          hint: "That number is not printed on the label. The label's numbers are for one serving, not for the whole package.",
        },
        {
          pick: "c",
          tag: "grams-for-calories",
          hint: "That number is the weight of a serving in grams. Calories measure energy.",
        },
        {
          pick: "d",
          tag: "servings-for-calories",
          hint: "That number counts servings in the package, not the energy in one serving.",
        },
      ],
      hints: [
        "Find the label on the right side of the picture and look for the line named Calories.",
        "The big number beside the word Calories is what you want.",
        "That number is for the serving size printed above it on the same label.",
      ],
      model:
        "I look at the Snack B label on the right. The line called Calories has a big number beside it, and the label says all the numbers are for one serving, so that number is the calories in one serving.",
      explain: "Right: the calories line on the Snack B label gives the energy in one serving.",
      supports: {
        ee: { frames: ["One serving has ___ calories."], wordBank: ["calories", "one serving"] },
        dev: { frames: ["The calories line says ___."] },
        exp: {},
        br: {},
      },
    },
    {
      id: "q2",
      type: "inference",
      prompt: "Which snack has MORE added sugar in one serving?",
      options: [
        { id: "a", text: "Snack A" },
        { id: "b", text: "Snack B" },
        { id: "c", text: "They are the same" },
        { id: "d", text: "The labels do not say" },
      ],
      answer: "b",
      evidence: [
        { id: "a-added", why: "Snack A's added sugars line gives a smaller amount." },
        { id: "b-added", why: "Snack B's added sugars line gives a larger amount." },
      ],
      misconceptions: [
        {
          pick: "a",
          tag: "compared-wrong-lines",
          hint: "Check that you compared the lines that say Added Sugars, not the lines that say Total Sugars or Calories.",
        },
        {
          pick: "c",
          tag: "same-calories-same-sugar",
          hint: "The calories are close, but that does not mean the sugar lines match. Read both sugar lines.",
        },
        {
          pick: "d",
          tag: "overlooked-label-info",
          hint: "Both labels have a line for added sugars. Look at the second part of each sugar group.",
        },
      ],
      hints: [
        "You need one line from each label. Look for the words Added Sugars.",
        "Compare the grams on the two lines and the percent beside each one.",
        "Both labels use the same serving idea, so a bigger gram number means more added sugar.",
      ],
      model:
        "I find the line that says Added Sugars on each label and compare the grams. The label with the larger number has more added sugar in one serving.",
      explain:
        "Right: the added sugars lines show the amount for one serving on each label, and Snack B's amount is larger.",
      transfer: {
        prompt:
          "One label says 2g Added Sugars and another says 9g Added Sugars. Which snack has more added sugar?",
        options: [
          { id: "a", text: "The label that says 2g" },
          { id: "b", text: "The label that says 9g" },
        ],
        answer: "b",
        explain: "9 grams is more than 2 grams, so the second snack has more added sugar.",
      },
      supports: {
        ee: { frames: ["___ has more added sugar."], wordBank: ["added sugars", "more", "less"] },
        dev: { frames: ["Snack ___ has more because ___ grams is more than ___ grams."] },
        exp: {},
        br: {},
      },
    },
    {
      id: "q3",
      type: "evidence",
      prompt: "Tap the two lines that show which snack has more dietary fiber in one serving.",
      answer: ["a-fiber", "b-fiber"],
      evidence: [
        { id: "a-fiber", why: "The fiber line on Snack A shows how much fiber one serving has." },
        { id: "b-fiber", why: "The fiber line on Snack B shows how much fiber one serving has." },
      ],
      misconceptions: [
        {
          pick: "a-calories",
          tag: "true-but-unrelated",
          hint: "That line is about energy. The question asks about fiber.",
        },
        {
          pick: "b-calories",
          tag: "true-but-unrelated",
          hint: "That line is about energy. The question asks about fiber.",
        },
        {
          pick: "a-added",
          tag: "wrong-nutrient-line",
          hint: "That line is about sugar. Look for the line that says Dietary Fiber.",
        },
      ],
      hints: [
        "To compare two snacks you need the same line from both labels.",
        "Look under Total Carbohydrate for an indented line.",
        "The line you want starts with the words Dietary Fiber.",
      ],
      model:
        "To compare, I need the same line on both labels. The fiber lines are indented under Total Carbohydrate, so I tap Dietary Fiber on Snack A and on Snack B.",
      explain: "Right: the two dietary fiber lines are the proof, one from each label.",
      supports: {
        ee: {
          frames: ["The fiber lines are under ___."],
          wordBank: ["dietary fiber", "carbohydrate"],
        },
        dev: {},
        exp: {},
        br: {},
      },
    },
    {
      id: "q4",
      type: "inference",
      prompt: "Jada eats the whole package of Snack B. About how many calories is that?",
      options: [
        { id: "a", text: "140 calories" },
        { id: "b", text: "280 calories" },
        { id: "c", text: "560 calories" },
        { id: "d", text: "700 calories" },
      ],
      answer: "c",
      evidence: [
        { id: "b-calories", why: "The calories line gives the calories in one serving." },
        {
          id: "b-count",
          why: "The servings per container line tells how many servings are in the package.",
        },
      ],
      misconceptions: [
        {
          pick: "a",
          tag: "one-serving-only",
          hint: "That is only one serving. Jada eats the whole package.",
        },
        {
          pick: "b",
          tag: "two-servings",
          hint: "Read the servings per container line again. How many servings are in the package?",
        },
        {
          pick: "d",
          tag: "wrong-count",
          hint: "Count the servings per container again before you multiply.",
        },
      ],
      hints: [
        "You need two numbers from the Snack B label and one operation.",
        "One number is the calories in one serving. The other is how many servings are in the package.",
        "Because each serving has the same calories, repeat the calories once for each serving.",
      ],
      model:
        "The calories line is for one serving and the label says how many servings are in the package. Since every serving has the same calories, I multiply the two numbers to find the whole package.",
      explain: "Right: 4 servings with 140 calories each is 560 calories.",
      transfer: {
        prompt:
          "A package has 3 servings and each serving has 100 calories. How many calories are in the whole package?",
        options: [
          { id: "a", text: "100 calories" },
          { id: "b", text: "300 calories" },
          { id: "c", text: "103 calories" },
        ],
        answer: "b",
        explain: "3 servings of 100 calories each is 3 times 100, or 300 calories.",
      },
      supports: {
        ee: {
          frames: ["There are ___ servings. Each has ___ calories."],
          wordBank: ["servings per container", "calories", "times"],
        },
        dev: { frames: ["I multiplied ___ by ___."] },
        exp: {},
        br: {},
      },
    },
  ],
  claimPrompt:
    "What can you say about Snack A and Snack B? Choose the claim your case notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "Snack A has more fiber and less added sugar per serving than Snack B, even though the calories are about the same.",
        strong: true,
      },
      {
        id: "c2",
        text: "Snack B is the better choice because it has fewer calories.",
        strong: false,
        tag: "calories-only",
        hint: "The calories are close, 150 and 140. Your notes show lines that differ much more.",
      },
      {
        id: "c3",
        text: "Both snacks are the same because the serving sizes are close.",
        strong: false,
        tag: "no-difference",
        hint: "Your notes show different numbers for fiber and added sugars.",
      },
      {
        id: "c4",
        text: "Snack B has more fiber than Snack A.",
        strong: false,
        tag: "reversed-comparison",
        hint: "Look again at the fiber lines in your notes. Which one has the bigger number?",
      },
    ],
    evidenceIds: ["a-fiber", "b-fiber", "a-added", "b-added"],
    evidenceMin: 3,
    why: "The fiber lines show 4 grams for Snack A and 1 gram for Snack B, and the added sugars lines show 5 grams for Snack A and 17 grams for Snack B.",
    hints: [
      "A strong claim uses more than one line from your notes.",
      "Compare the same nutrient on both labels before you decide who has more.",
      "Check the claim against fiber and added sugars. Make sure it does not use calories alone.",
    ],
    explainPrompt:
      "Explain how your evidence proves your claim. Use the words per serving and because.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because or so to connect my evidence to my claim.",
        test: { type: "contains-any", words: ["because", "so", "which means", "this shows"] },
      },
      {
        id: "evidence",
        label: "I used words or numbers from my evidence.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My explanation has at least 14 words.",
        test: { type: "min-words", n: 14 },
      },
      { id: "reread", label: "I read my explanation aloud once.", self: true },
    ],
  },
  explainFrames: {
    ee: ["Snack A has ___ grams of fiber.", "Snack B has ___ grams of added sugars."],
    dev: ["I think ___ because Snack A has ___ and Snack B has ___.", "One clue is the ___ line."],
    exp: ["Based on the labels, ___ per serving because ___ compared with ___."],
    br: [
      "The evidence suggests ___ per serving, since the ___ line shows ___ while the ___ line shows ___.",
    ],
  },
  supports: {
    ee: {
      directions: "Read the label lines. Tap a line to use it as proof.",
      wordBank: ["serving", "calories", "fiber", "added sugars", "more", "less"],
    },
    dev: { wordBank: ["per serving", "compare"] },
    exp: {},
    br: {},
  },
  reflection: {
    prompt:
      "Which label line helped you most? Why is it important to compare the same serving size?",
    frames: {
      ee: ["The ___ line helped me.", "I compared ___ and ___."],
      dev: ["The ___ line helped me because ___.", "I compare the same serving so ___."],
      exp: [
        "The line that helped most was ___ because ___; comparing the same serving size matters because ___.",
      ],
      br: [
        "Comparing per serving makes the labels fair, because ___; the line that mattered most was ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

// Parallel transfer questions for the questions that do not carry their own.
const TRANSFER = {
  q1: { prompt: "A label says 3 servings per container and 80 calories in one serving. How many calories are in ONE serving?", options: [{ id: "a", text: "80 calories" }, { id: "b", text: "240 calories" }, { id: "c", text: "3 calories" }], answer: "a", explain: "The calories line on a label is for one serving, so one serving has 80 calories." },
  q3: { prompt: "One label's fiber line says 5g and another label's fiber line says 2g. Which snack has more fiber in one serving?", options: [{ id: "a", text: "The one that says 5g" }, { id: "b", text: "The one that says 2g" }], answer: "a", explain: "5 grams is more than 2 grams." },
};

// A wrong pick that has its own hint also shows the question's worked model after repeated misses.
activity.questions = activity.questions.map((q) => ({
  ...q,
  misconceptions: q.misconceptions?.map((m) => ({ model: q.model, ...m })),
  transfer: q.transfer ?? TRANSFER[q.id],
}));

export default activity;

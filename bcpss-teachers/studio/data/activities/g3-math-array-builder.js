// Concept Builder (area-model, unit-square): build arrays row by row, turn them around, and test a classmate's idea.
const all = (n) => Array.from({ length: n }, (_, i) => i);
const shape = (rows, cols, shaded) => ({ rows, cols, on: all(shaded) });

const build = (rows, cols, total) => ({
  type: "all",
  checks: [
    { type: "equals", of: "rows", value: String(rows) },
    { type: "equals", of: "cols", value: String(cols) },
    { type: "equals", of: "shaded", value: String(total) },
  ],
});

const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });

const supports = (hint) => ({
  ee: {
    directions:
      "Use the plus and minus buttons to set the rows and the columns. Then tap each square to shade it.",
    frames: ["I made ___ rows.", "There are ___ in each row."],
    wordBank: ["array", "row", "column", "each", "in all"],
    oral: "Point to one row and count it out loud before you shade.",
    hint,
  },
  dev: {
    directions: "Set the rows and columns first. Shade every square last.",
    frames: ["My array has ___ rows with ___ in each row."],
    wordBank: ["row", "column", "total"],
  },
  exp: { frames: ["I built ___ rows of ___, so there are ___ in all."] },
  br: {},
});

const explain = (prompt, mustMention) => ({
  prompt,
  frames: fr(
    ["I changed the ___.", "The total is ___."],
    ["I changed the number of ___, and the total ___."],
    ["When I ___, the rows became ___, but the total stayed ___ because ___."],
    ["Turning the array swaps the rows and columns, so the same counters make the same total."],
  ),
  mustMention,
});

export default {
  id: "g3-math-array-builder",
  engine: "concept-builder",
  kind: "area-model",
  title: "Array Builder: Rows, Columns and Totals",
  grade: "3",
  band: "3-5",
  subject: "math",
  lessonId: "g3-math-multiplication-arrays",
  standards: ["3.OA.A.1", "3.OA.A.3", "3.OA.B.5"],
  curriculum: {
    status: "district-referenced",
    unitId: "g3-math-u1",
    note: "Matches the Multiplication & Division Foundations unit in the BCPSS curriculum seed. Problems and wording are original.",
  },
  vocabIds: ["array", "row", "column", "equal-groups", "factor", "product", "turn-around-facts"],
  minutes: 15,
  intro:
    "Build arrays with a grid. Set the number of rows and columns, shade the squares, and watch the total. Then turn an array around and test a classmate's idea.",
  model: {
    mode: "unit-square",
    rows: { min: 1, max: 10, start: 1 },
    cols: { min: 1, max: 10, start: 1 },
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "A garden has 3 rows of tomato plants with 4 plants in each row. Build the array and shade every square to show the plants.",
      goal: "3 rows, 4 columns, every square shaded",
      start: shape(1, 1, 0),
      target: shape(3, 4, 12),
      check: build(3, 4, 12),
      answerText: "12",
      hints: [
        "Read the problem for two numbers: the number of rows and the number in each row.",
        "The number in each row is the number of columns. Set the rows first, then the columns.",
        "When the grid has the right shape, tap every square so each plant is shaded, then read the total.",
      ],
      misconceptions: [
        {
          match: "rows-and-columns-swapped",
          when: build(4, 3, 12),
          hint: "Your array has the rows and columns the other way around. Check which number tells how many rows.",
        },
        {
          match: "not-all-shaded",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "rows", value: "3" },
              { type: "equals", of: "cols", value: "4" },
              { type: "relation", left: "shaded", op: "lt", right: { value: "12" } },
            ],
          },
          hint: "The grid has the right shape, but some plants are missing. Every square in the array holds one plant.",
        },
      ],
      model:
        "To show 2 rows of 5 apples, set 2 rows and 5 columns, then shade every square. Count by fives, 5 and 10, to find the total of 10 apples.",
      right:
        "That is an array: equal rows with the same number in each row, so you can count the total by rows.",
      supports: supports("Rows go across. Columns go up and down. How many plants are in one row?"),
      justify: {
        prompt: "Which facts help you find the total number of plants?",
        options: [
          { id: "j1", text: "Every row has the same number of plants.", ok: true },
          { id: "j2", text: "I can count by the number in one row, once for each row.", ok: true },
          {
            id: "j3",
            text: "I can add the number of rows and the number in each row.",
            ok: false,
            hint: "Adding the two numbers counts the numbers, not the plants. Count the squares in one row first.",
          },
          {
            id: "j4",
            text: "The columns must have more squares than the rows.",
            ok: false,
            hint: "Compare the number of squares in a row with the number in a column on your grid.",
          },
        ],
        min: 2,
        model:
          "In an array every row holds the same number, so counting by that number once for each row gives the total.",
      },
      explain: explain(
        "What did you set first, and how did the rows and columns help you find the total?",
        [
          { id: "rows", label: "the rows", any: ["row"] },
          { id: "each", label: "the number in each row", any: ["each", "every", "column"] },
        ],
      ),
    },
    {
      id: "t2",
      prompt:
        "Maya built 3 rows of 4. Turn her array around to make 4 rows of 3. Build it and shade every square.",
      goal: "4 rows, 3 columns, every square shaded",
      start: shape(3, 4, 12),
      target: shape(4, 3, 12),
      check: build(4, 3, 12),
      answerText: "12",
      hints: [
        "Look at Maya's grid: how many rows and how many columns does it have now?",
        "A turn-around array swaps the two numbers. The old number of rows becomes the new number of columns.",
        "Set the new rows and columns, then shade every square. Compare the total with Maya's array.",
      ],
      misconceptions: [
        {
          match: "no-change",
          when: build(3, 4, 12),
          hint: "That is Maya's array again. The turn-around array swaps the rows and the columns.",
        },
        {
          match: "only-one-number",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "rows", value: "4" },
              { type: "equals", of: "cols", value: "4" },
            ],
          },
          hint: "Check the columns. Turning an array keeps the same squares, so each number moves to the other side.",
        },
      ],
      model:
        "Take 2 rows of 6. Turn it around to get 6 rows of 2. Both grids have 12 squares, so 2 times 6 and 6 times 2 have the same product.",
      right: "You turned the array around and the number of squares stayed the same.",
      supports: supports("Maya's rows become your columns. What is her number of columns?"),
      justify: {
        prompt: "Why do 3 rows of 4 and 4 rows of 3 have the same total?",
        options: [
          {
            id: "j1",
            text: "Turning the array moves the squares to new places but does not add or remove any.",
            ok: true,
          },
          {
            id: "j2",
            text: "Both grids use the same two numbers and cover the same number of squares.",
            ok: true,
          },
          {
            id: "j3",
            text: "The grid with more rows always has more squares.",
            ok: false,
            hint: "Count the squares in each grid before you decide.",
          },
          {
            id: "j4",
            text: "Multiplying never changes the total, whatever numbers you use.",
            ok: false,
            hint: "Try 3 rows of 4 and 3 rows of 5. Does the total stay the same?",
          },
        ],
        min: 2,
        model:
          "A turn-around array has the same squares in new positions, so the total cannot change. That is why the turn-around facts match.",
      },
      explain: explain("What changed when you turned the array, and what stayed the same?", [
        {
          id: "swap",
          label: "the rows and columns swapped",
          any: ["swap", "switch", "turn", "row", "column"],
        },
        { id: "same", label: "the total stayed the same", any: ["same", "still", "equal"] },
      ]),
    },
    {
      id: "t3",
      prompt:
        "A sticker sheet holds 24 stickers in 4 equal rows. Build an array with 4 rows that holds all 24 stickers. How many are in each row?",
      goal: "4 rows and enough columns for every sticker, all shaded",
      start: shape(4, 1, 0),
      target: shape(4, 6, 24),
      check: build(4, 6, 24),
      answerText: "6",
      hints: [
        "The rows are equal, so every row has the same number of stickers. You know the number of rows and the total.",
        "Try different numbers of columns. After you shade every square, compare the shaded total with the stickers on the sheet.",
        "Keep changing the columns until the shaded total matches the number of stickers on the sheet.",
      ],
      misconceptions: [
        {
          match: "too-few-columns",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "rows", value: "4" },
              { type: "relation", left: "cols", op: "lt", right: { value: "6" } },
            ],
          },
          hint: "Your array holds fewer stickers than the sheet. Add columns until it holds all of them.",
        },
        {
          match: "too-many-columns",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "rows", value: "4" },
              { type: "relation", left: "cols", op: "gt", right: { value: "6" } },
            ],
          },
          hint: "Your array holds more squares than there are stickers. Take columns away.",
        },
      ],
      model:
        "A sheet has 20 stickers in 5 equal rows. Try 3 columns: 5 rows of 3 is 15. Try 4 columns: 5 rows of 4 is 20. So each row holds 4.",
      right: "You found the number in each row by building until the array matched the total.",
      supports: supports("Four equal rows. Try one column at a time and look at the shaded total."),
      explain: explain("How did you find the number of stickers in each row?", [
        { id: "equal", label: "the rows are equal", any: ["equal", "same", "each"] },
        {
          id: "try",
          label: "trying columns until the total matched",
          any: ["try", "tried", "match", "until", "add"],
        },
      ]),
    },
    {
      id: "t4",
      prompt:
        "Jo says 5 rows of 3 is 8 because 5 + 3 = 8. Build 5 rows of 3 with every square shaded to test Jo's idea.",
      goal: "5 rows, 3 columns, every square shaded",
      start: shape(2, 4, 8),
      target: shape(5, 3, 15),
      check: build(5, 3, 15),
      answerText: "15",
      hints: [
        "Jo's start grid has the same total as Jo's answer. Does it also have 5 rows of 3?",
        "Set the rows and columns to match the problem, then shade every square and read the total.",
        "Compare the total you see with Jo's number. Is Jo's number the number of squares or something else?",
      ],
      misconceptions: [
        {
          match: "adds-the-factors",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "rows", value: "5" },
              { type: "equals", of: "cols", value: "3" },
              { type: "equals", of: "shaded", value: "8" },
            ],
          },
          hint: "You shaded the number Jo got, but the array still has more squares. Shade all of them and read the total.",
        },
        {
          match: "not-all-shaded",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "rows", value: "5" },
              { type: "equals", of: "cols", value: "3" },
              { type: "relation", left: "shaded", op: "lt", right: { value: "15" } },
            ],
          },
          hint: "Some squares are not shaded yet. Each square is one object in the array.",
        },
      ],
      model:
        "Suppose someone says 2 rows of 6 is 8 because 2 + 6 = 8. Build 2 rows of 6 and count: there are 12 squares. Adding the rows and columns counts the numbers, not the objects.",
      right:
        "The array shows more squares than Jo's total, so adding the two numbers does not find the product.",
      supports: supports(
        "Does Jo's number count the squares in the grid, or does it count the numbers 5 and 3?",
      ),
      justify: {
        prompt: "Which reasons show that Jo's idea is not right?",
        options: [
          {
            id: "j1",
            text: "Jo added the number of rows and the number in each row, but the array has that many squares in every row.",
            ok: true,
          },
          {
            id: "j2",
            text: "The array has more squares than Jo's total when every square is shaded.",
            ok: true,
          },
          {
            id: "j3",
            text: "Jo should have subtracted the two numbers.",
            ok: false,
            hint: "The array holds equal rows. Subtracting does not find how many in all.",
          },
          {
            id: "j4",
            text: "Arrays can only have an even number of squares.",
            ok: false,
            hint: "Count the squares in a 3 by 5 array and see whether the total is even.",
          },
        ],
        min: 2,
        model:
          "A product counts every object in all the rows, so it is found by combining equal groups, not by adding the two factors.",
      },
      explain: explain("Explain to Jo, in your own words, why the array shows a different total.", [
        {
          id: "count",
          label: "the array counts every object",
          any: ["count", "square", "all", "every", "object"],
        },
        {
          id: "add",
          label: "adding the numbers is not the same as counting the squares",
          any: ["add", "plus", "5 + 3", "8"],
        },
      ]),
    },
  ],
  reflection: {
    prompt: "When you build an array, what do the rows and the columns tell you about the total?",
    frames: fr(
      ["The rows tell me ___.", "The total is ___."],
      ["The rows tell me how many ___ and the columns tell me how many ___."],
      ["I find the total by counting ___ once for each ___, and turning the array gives ___."],
      [
        "The two numbers tell the equal groups and the size of each group, and swapping them keeps the same product.",
      ],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

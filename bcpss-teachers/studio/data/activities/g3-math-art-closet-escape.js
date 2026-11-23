// Escape Challenge: the third-grade art closet is locked. Four array rooms give the pieces of the lock code.
const sup = (directions, frames, wordBank) => ({
  ee: {
    directions,
    frames,
    wordBank,
    oral: "Say your plan to a partner before you answer.",
  },
  dev: {
    directions: "Think about rows and columns before you decide.",
    frames: [frames[0]],
    wordBank: wordBank.slice(0, 3),
  },
  exp: { frames: [frames[0]] },
  br: {},
});

export default {
  id: "g3-math-art-closet-escape",
  engine: "escape-challenge",
  title: "The Art Closet Code",
  grade: "3",
  band: "3-5",
  subject: "math",
  lessonId: "g3-math-multiplication-arrays",
  standards: ["3.OA.A.1", "3.OA.A.3", "3.OA.B.5"],
  curriculum: {
    status: "district-referenced",
    unitId: "g3-math-u1",
    note: "Matches the Multiplication & Division Foundations unit in the BCPSS curriculum seed. Puzzles and story are original.",
  },
  vocabIds: ["array", "row", "column", "factor", "product", "turn-around-facts"],
  minutes: 20,
  intro:
    "The art closet is locked ten minutes before the class mural begins. Four rooms of arrays hold the pieces of the lock code. Solve each puzzle and read the pieces in the order the sign gives.",
  story: {
    title: "The Art Closet Code",
    setting: "The third-grade hallway, ten minutes before the class mural begins.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "Ms. Alvarez set out the paint for the mural, then the closet latch clicked shut with the brushes inside. The code is hidden in four displays along the hallway.",
      },
      {
        id: "after-stickers",
        after: "stickers",
        text: "The sticker sheet peels away and a small brass tag falls out. A note on the back points to the tile wall by the water fountain.",
      },
      {
        id: "after-tiles",
        after: "tiles",
        text: "The tiles slide into place and a drawer pops open with the next piece. A card inside mentions a lock box with three dials.",
      },
      {
        id: "after-lock",
        after: "lock",
        text: "The dials click and the lock box opens. Inside is a folded sign about the last display, the turn-around gallery.",
      },
      {
        id: "end",
        after: "end",
        text: "The closet door swings open. The class carries out the brushes, and the mural begins on time.",
      },
    ],
  },
  rooms: [
    {
      id: "stickers",
      title: "The Sticker Wall",
      narrative:
        "A giant sticker sheet hangs on the wall. The stickers are arranged in 4 neat rows with 6 stickers in each row, and a note says to count them all.",
      gate: { needs: "array-product", label: "Finding the total of an array" },
      puzzle: {
        type: "numeric",
        prompt:
          "The sticker sheet has 4 rows with 6 stickers in each row. How many stickers are on the sheet in all?",
        answer: "24",
        calc: "4*6",
        unit: "stickers",
        hints: [
          "Every row holds the same number of stickers, so you can count by that number once for each row.",
          "Count by the number in one row, and stop after you have said it once for every row.",
          "Skip count by the number in one row four times, or add that number four times.",
        ],
        misconceptions: [
          {
            tag: "adds-the-factors",
            pick: "10",
            hint: "You added the number of rows and the number in each row. That counts the two numbers, not the stickers.",
          },
          {
            tag: "counts-one-row",
            pick: "6",
            hint: "That is how many stickers are in only one row. How many rows are there?",
          },
        ],
        model: {
          text: "A tile wall has 3 rows with 5 tiles in each row. Count by fives once for each row: 5, 10, 15. So there are 15 tiles in all, and 3 times 5 equals 15.",
        },
        transfer: {
          type: "numeric",
          prompt:
            "A muffin tray has 6 rows with 3 muffins in each row. How many muffins fit in the tray in all?",
          answer: "18",
          calc: "6*3",
          unit: "muffins",
          hints: [
            "Every row holds the same number of muffins.",
            "Count by the number in one row, once for each row.",
            "Skip count by the number in one row six times.",
          ],
        },
        why: "Each of the 4 rows holds 6 stickers, so counting by sixes four times gives 6, 12, 18, 24.",
        supports: sup(
          "Type the total as a number. Count by the number in one row, once for each row.",
          ["There are ___ rows with ___ in each row.", "___ times ___ equals ___."],
          ["row", "each", "in all", "times"],
        ),
      },
      reveal: "Behind the sticker sheet is a brass tag stamped with a number for the lock code.",
    },
    {
      id: "tiles",
      title: "The Tile Wall",
      narrative:
        "Four tile displays line the wall by the water fountain. Each one is built as an array, and the keeper wants them lined up from the fewest tiles to the most tiles.",
      gate: { needs: "compare-products", label: "Comparing the totals of arrays" },
      puzzle: {
        type: "order",
        prompt:
          "Put the four tile displays in order from the fewest tiles to the most tiles. Find each total first.",
        endLabels: { start: "fewest", end: "most" },
        items: [
          { id: "a", text: "3 rows of 5 tiles", token: "T", value: "15" },
          { id: "b", text: "4 rows of 4 tiles", token: "I", value: "16" },
          { id: "c", text: "2 rows of 9 tiles", token: "L", value: "18" },
          { id: "d", text: "5 rows of 5 tiles", token: "E", value: "25" },
        ],
        answer: ["a", "b", "c", "d"],
        hints: [
          "You cannot order the displays by looking at the number of rows alone. Find each total first.",
          "Skip count or draw each array so you know how many tiles are in all.",
          "Write each total next to its display, then put the smallest total first.",
        ],
        misconceptions: [
          {
            tag: "compares-rows-only",
            has: ["c>b"],
            hint: "One display has fewer rows but more tiles in each row. Compare the totals, not just the number of rows.",
          },
          {
            tag: "compares-each-row-only",
            has: ["d>c"],
            hint: "Looking at only the number in each row can fool you. Find how many tiles are in the whole display.",
          },
        ],
        model: {
          text: "To order 2 rows of 7 and 3 rows of 4, find each total. Two rows of 7 is 14 and three rows of 4 is 12. So 3 rows of 4 has the fewest tiles and comes first.",
        },
        transfer: {
          type: "order",
          prompt: "Put these paint trays in order from the fewest cups to the most cups.",
          endLabels: { start: "fewest", end: "most" },
          items: [
            { id: "x", text: "2 rows of 6 cups", token: "P", value: "12" },
            { id: "y", text: "3 rows of 3 cups", token: "Q", value: "9" },
            { id: "z", text: "5 rows of 3 cups", token: "R", value: "15" },
          ],
          answer: ["y", "x", "z"],
          hints: [
            "Find the total of each tray before you compare.",
            "Count by the number in one row, once for each row.",
            "Order the three totals from smallest to greatest.",
          ],
        },
        why: "Finding the total of each array lets you compare the displays fairly: 15, 16, 18 and 25.",
        supports: sup(
          "Use the Move up and Move down buttons. Find each total first.",
          ["The total of the first display is ___.", "___ has fewer tiles than ___ because ___."],
          ["fewest", "most", "total", "compare"],
        ),
      },
      reveal:
        "The tiles slide into place and a drawer opens with four letters stamped in the order you chose.",
    },
    {
      id: "lock",
      title: "The Lock Box",
      narrative:
        "A lock box has three dials. Each dial is labeled with a story about equal groups, and the number it should be turned to is the total of that story.",
      gate: { needs: "equal-groups-to-product", label: "Matching equal groups to their product" },
      puzzle: {
        type: "match",
        prompt:
          "Match each story to the number its dial should show. Each number is the total of the equal groups.",
        lefts: [
          { id: "l1", text: "5 rows of 4 beads", calc: "5*4" },
          { id: "l2", text: "3 bags with 9 marbles in each bag", calc: "3*9" },
          { id: "l3", text: "6 rows of 6 chairs", calc: "6*6" },
        ],
        rights: [
          { id: "r1", text: "20", token: "A", value: "20" },
          { id: "r2", text: "27", token: "B", value: "27" },
          { id: "r3", text: "36", token: "C", value: "36" },
          { id: "r4", text: "9", token: "D", value: "9" },
          { id: "r5", text: "12", token: "E", value: "12" },
        ],
        answer: { l1: "r1", l2: "r2", l3: "r3" },
        hints: [
          "Each story is about equal groups. Find how many groups and how many are in each group.",
          "Skip count by the number in each group, once for each group.",
          "Check that your number is much larger than the two numbers in the story added together.",
        ],
        misconceptions: [
          {
            tag: "adds-the-factors",
            has: ["l1=r4"],
            hint: "That number comes from adding 5 and 4. Equal groups need to be combined to find how many in all.",
          },
          {
            tag: "adds-groups-and-size",
            has: ["l2=r5"],
            hint: "That number comes from adding 3 and 9. Count the marbles in all three bags instead.",
          },
        ],
        model: {
          text: "To match 2 rows of 8 buttons to a total, skip count by eights two times: 8, 16. The dial should show 16. Adding 2 and 8 would give 10, which counts the two numbers, not the buttons.",
        },
        transfer: {
          type: "match",
          prompt: "Match each story to the total of its equal groups.",
          lefts: [
            { id: "m1", text: "4 rows of 7 desks", calc: "4*7" },
            { id: "m2", text: "2 plates with 9 cookies on each plate", calc: "2*9" },
            { id: "m3", text: "5 rows of 6 plants", calc: "5*6" },
          ],
          rights: [
            { id: "n1", text: "28", token: "F", value: "28" },
            { id: "n2", text: "18", token: "G", value: "18" },
            { id: "n3", text: "30", token: "H", value: "30" },
            { id: "n4", text: "11", token: "J", value: "11" },
          ],
          answer: { m1: "n1", m2: "n2", m3: "n3" },
          hints: [
            "Each story has a number of groups and a number in each group.",
            "Skip count by the number in each group.",
            "Check that the total makes sense for equal groups, not for adding the two numbers.",
          ],
        },
        why: "Each total comes from combining equal groups: 5 times 4 is 20, 3 times 9 is 27 and 6 times 6 is 36.",
        supports: sup(
          "Choose the number for each story from the menu. Find the total of the equal groups.",
          ["There are ___ groups with ___ in each group.", "The total is ___."],
          ["groups", "each", "total", "skip count"],
        ),
      },
      reveal:
        "The dials click into place and the lock box opens, with a number stamped on a card inside.",
    },
    {
      id: "turn",
      title: "The Turn-Around Gallery",
      narrative:
        "Two posters hang side by side. One shows 6 rows of 4 stars and the other shows 4 rows of 6 stars. A classmate says the two posters have the same number of stars.",
      gate: { needs: "turn-around-facts", label: "Explaining turn-around facts" },
      puzzle: {
        type: "explain",
        stem: "A classmate says 6 x 4 and 4 x 6 have the same product.",
        prompt: "Choose all of the statements that explain why the classmate is right.",
        choices: [
          "Turning the 6 by 4 array a quarter turn makes a 4 by 6 array with the same stars.",
          "Both arrays contain the same stars, and only the rows and columns have swapped places.",
          "Multiplying always gives the same answer, no matter which numbers you use.",
          "The product is larger when the bigger number goes first.",
        ],
        answer: [0, 1],
        tokens: ["P", "Q", "R", "S"],
        hints: [
          "Think about what happens to the stars when you turn the poster.",
          "Decide whether any stars are added or taken away when the rows and columns change places.",
          "Try a different pair of numbers to test a statement that says something about all numbers.",
        ],
        misconceptions: [
          {
            tag: "overgeneralizes-multiplication",
            has: [2],
            hint: "Test that statement with 3 x 4 and 3 x 5. Does multiplying always give the same answer?",
          },
          {
            tag: "order-changes-product",
            has: [3],
            hint: "Work out 6 x 4 and 4 x 6 and compare the two answers. Does the order change the product?",
          },
        ],
        model: {
          text: "Take 2 x 7 and 7 x 2. Two rows of seven, turned a quarter turn, make seven rows of two. No counters are added or taken away, so both arrays have 14 counters.",
        },
        transfer: {
          type: "explain",
          stem: "A classmate says 3 x 8 and 8 x 3 are turn-around facts.",
          prompt: "Choose all of the statements that explain why the classmate is right.",
          choices: [
            "Turning a 3 by 8 array makes an 8 by 3 array with the same counters.",
            "Any two multiplication facts have the same product.",
            "Both facts use the same two numbers, so both arrays hold the same number of counters.",
            "The fact with the larger first number has the larger product.",
          ],
          answer: [0, 2],
          tokens: ["U", "V", "W", "X"],
          hints: [
            "Think about what stays the same when an array is turned.",
            "Check whether any counters are added or removed.",
            "Look for statements that talk about these two facts, not about every fact.",
          ],
        },
        why: "Turning an array swaps the rows and columns but keeps every counter, so the two facts have the same product.",
        supports: sup(
          "Choose every statement that explains why 6 x 4 and 4 x 6 match.",
          ["Turning the array swaps the ___ and ___.", "The total stays the same because ___."],
          ["turn", "same", "rows", "columns"],
        ),
      },
      reveal:
        "A folded sign drops from the poster. It has two letters stamped on it for the last piece of the code.",
    },
  ],
  door: {
    title: "The Closet Lock",
    prompt: "Type the code the sign describes.",
    order: ["tiles", "stickers", "lock", "turn"],
    success: "The latch clicks and the art closet door swings open.",
  },
  reflection: {
    prompt: "Which room needed you to find the total of equal groups, and how did you find it?",
    frames: {
      ee: ["I used the idea in the ___ room.", "I counted by ___."],
      dev: ["In the ___ room I found the total by ___.", "Then I checked that ___."],
      exp: ["The ___ room needed me to ___ because the groups were equal."],
      br: [
        "Finding the total of equal groups mattered most in the ___ room, where I used ___ to ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

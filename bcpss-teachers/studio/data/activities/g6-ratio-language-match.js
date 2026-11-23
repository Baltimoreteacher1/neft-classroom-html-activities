// Visual Match: connect ratio language to tape diagrams and models (grade 6 math).
const blocks = (n, color) => Array.from({ length: n }, () => ({ label: "1", units: 1, color }));
const tape = (alt, rows, extra = {}) => ({
  kind: "tape",
  alt,
  w: 480,
  h: 200,
  rows: rows.map(([label, n, color]) => ({ label, parts: blocks(n, color) })),
  ...extra,
});
const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });

export default {
  id: "g6-ratio-language-match",
  engine: "visual-match",
  title: "Match ratio language to tape diagrams",
  grade: "6",
  band: "6-8",
  subject: "math",
  lessonId: "g6-math-ratios-and-rates",
  standards: ["6.RP.A.1", "6.RP.A.3"],
  vocabIds: [
    "g6-math-ratios-and-rates:ratio",
    "g6-math-ratios-and-rates:equivalent-ratios",
    "g6-math-ratios-and-rates:ratio-table",
    "g6-math-ratios-and-rates:double-number-line",
    "g6-math-ratios-and-rates:unit-rate",
  ],
  minutes: 15,
  intro:
    "Match each ratio or ratio tool to the tape diagram, definition or sentence it describes. Count the blocks before you decide.",
  modes: ["term-visual", "term-definition", "term-example"],
  pairs: [
    {
      id: "p1",
      term: "3 to 2",
      visual: tape(
        "A tape diagram with a row of 3 sky-blue blocks labelled Blue and a row of 2 ochre blocks labelled Yellow.",
        [
          ["Blue", 3, "sky"],
          ["Yellow", 2, "ochre"],
        ],
      ),
      definition: "Three blue blocks go with every two yellow blocks.",
      example:
        "The tape shows 3 blue cups and 2 yellow cups, so the ratio of blue to yellow is 3 to 2.",
      why: "Count the blocks in the order the colors are named: three blue, then two yellow.",
      hints: [
        "Count the blocks in each row before you look at the words.",
        "The first color named in the ratio comes first in the pair of numbers.",
        "Blue has more blocks than yellow in this picture.",
      ],
      confusions: [
        {
          pick: "p3",
          tag: "count-mixup",
          hint: "Count every block in each row. The numbers in the ratio must match the counts.",
        },
      ],
      transfer: {
        prompt: "A bag has 5 red marbles and 2 green marbles. What is the ratio of red to green?",
        options: [
          { id: "a", text: "5 to 2" },
          { id: "b", text: "2 to 5" },
          { id: "c", text: "5 to 7" },
        ],
        answer: "a",
        explain: "Red is named first, so its number comes first: 5 red to 2 green.",
      },
    },
    {
      id: "p2",
      term: "4 to 7",
      visual: {
        kind: "tape",
        alt: "One tape of 7 equal blocks. Four blocks are teal and three are gray. A bracket over all the blocks says 7 in all.",
        w: 480,
        h: 200,
        parts: [
          { label: "4", units: 4, color: "teal" },
          { label: "3", units: 3, color: "line" },
        ],
        total: 7,
      },
      definition: "Four shaded blocks out of seven blocks in the whole bar.",
      example:
        "Four of the seven blocks in the bar are shaded, so the part-to-whole ratio is 4 to 7.",
      why: "The bracket shows the whole has seven blocks, and four of them are the part we are comparing.",
      hints: [
        "Look for a bracket or label that covers the entire bar.",
        "The second number in this ratio is the size of the whole.",
        "Add the shaded and unshaded blocks to find the whole.",
      ],
      confusions: [
        {
          pick: "p1",
          tag: "part-vs-whole",
          hint: "That ratio compares two separate rows. This picture compares one part with everything in the bar.",
        },
      ],
      transfer: {
        prompt:
          "A class has 9 students who walk and 15 students in all. Which ratio compares walkers to the whole class?",
        options: [
          { id: "a", text: "9 to 15" },
          { id: "b", text: "9 to 6" },
          { id: "c", text: "15 to 6" },
        ],
        answer: "a",
        explain: "The whole class is 15, so the part-to-whole ratio is 9 to 15.",
      },
    },
    {
      id: "p3",
      term: "1 to 4",
      visual: tape(
        "A tape diagram with a row of 1 coral block labelled Syrup and a row of 4 sky-blue blocks labelled Water.",
        [
          ["Syrup", 1, "coral"],
          ["Water", 4, "sky"],
        ],
      ),
      definition: "One block of syrup for every four blocks of water.",
      example: "A recipe has 1 cup of syrup and 4 cups of water, so syrup to water is 1 to 4.",
      why: "Syrup has one block and water has four, and syrup is named first.",
      hints: [
        "Compare the length of the top row with the length of the bottom row.",
        "The first row has the smaller number of blocks.",
        "Read the labels from top to bottom to get the order.",
      ],
      confusions: [
        {
          pick: "p1",
          tag: "count-mixup",
          hint: "Count the blocks again. Both rows here are very different lengths.",
        },
      ],
    },
    {
      id: "p4",
      term: "equivalent ratios",
      forms: ["equivalent ratio"],
      visual: tape(
        "A tape diagram with four rows. Rows one and two show 2 blue blocks and 3 white blocks. Rows three and four show 4 blue blocks and 6 white blocks.",
        [
          ["Blue", 2, "sky"],
          ["White", 3, "line"],
          ["Blue", 4, "sky"],
          ["White", 6, "line"],
        ],
        { h: 260 },
      ),
      definition:
        "Pairs of numbers that describe the same relationship, such as a pair and its double.",
      example: "The ratios 2 to 3 and 4 to 6 are equivalent ratios because both numbers doubled.",
      why: "The second pair of rows is the first pair repeated twice, so the relationship is the same.",
      hints: [
        "Compare the first two rows with the last two rows.",
        "Ask whether one pair is a scaled copy of the other.",
        "Both rows in the second pair are twice as long as in the first pair.",
      ],
      confusions: [
        {
          pick: "p5",
          tag: "tool-vs-idea",
          hint: "A table can list these pairs, but this picture shows the idea itself using blocks.",
        },
      ],
    },
    {
      id: "p5",
      term: "ratio table",
      visual: {
        kind: "table",
        alt: "A table with columns Blue cups and White cups and rows 2 and 3, 4 and 6, 6 and 9.",
        head: ["Blue cups", "White cups"],
        rows: [
          ["2", "3"],
          ["4", "6"],
          ["6", "9"],
        ],
      },
      definition:
        "Rows of paired numbers where every row has the same relationship as the first row.",
      example:
        "Each row of the ratio table multiplies both amounts from the first row by the same number.",
      why: "A table of paired amounts in rows, each equivalent to the first, is a ratio table.",
      hints: [
        "Look for the picture made of rows and columns of numbers.",
        "Each row holds one pair of amounts.",
        "Every row is a scaled copy of the first row.",
      ],
      confusions: [
        {
          pick: "p4",
          tag: "idea-vs-tool",
          hint: "That word names the idea. This picture is a table that lists the pairs.",
        },
      ],
    },
    {
      id: "p6",
      term: "double number line",
      visual: {
        kind: "shapes",
        alt: "Two horizontal lines, one above the other. The top line is marked 0, 3, 6, 9, 12 miles and the bottom line 0, 1, 2, 3, 4 hours, with dashed lines joining matching marks.",
        w: 480,
        h: 240,
        items: [
          { t: "line", x1: 50, y1: 80, x2: 450, y2: 80, stroke: "navy", strokeWidth: 3 },
          { t: "line", x1: 50, y1: 170, x2: 450, y2: 170, stroke: "coral", strokeWidth: 3 },
          ...[0, 1, 2, 3, 4].flatMap((i) => [
            {
              t: "line",
              x1: 70 + i * 90,
              y1: 70,
              x2: 70 + i * 90,
              y2: 90,
              stroke: "navy",
              strokeWidth: 2,
            },
            {
              t: "line",
              x1: 70 + i * 90,
              y1: 160,
              x2: 70 + i * 90,
              y2: 180,
              stroke: "coral",
              strokeWidth: 2,
            },
            {
              t: "line",
              x1: 70 + i * 90,
              y1: 90,
              x2: 70 + i * 90,
              y2: 160,
              stroke: "line",
              strokeWidth: 1.5,
              dash: "4 4",
            },
            {
              t: "text",
              x: 70 + i * 90,
              y: 64,
              text: String(i * 3),
              anchor: "middle",
              fill: "ink",
              size: 16,
            },
            {
              t: "text",
              x: 70 + i * 90,
              y: 200,
              text: String(i),
              anchor: "middle",
              fill: "ink",
              size: 16,
            },
          ]),
        ],
      },
      definition: "Two aligned lines that match amounts of one quantity with amounts of another.",
      example: "On the double number line, 6 miles lines up with 2 hours.",
      why: "Two lines stacked and lined up so matching amounts sit above and below each other is a double number line.",
      hints: [
        "Look for the picture with two long lines, one above the other.",
        "Dashed lines connect marks that match.",
        "Each mark on the top line has a partner on the bottom line.",
      ],
      confusions: [
        {
          pick: "p7",
          tag: "one-pair-vs-many",
          hint: "That picture shows a single amount for one unit. This one shows many matched pairs.",
        },
      ],
    },
    {
      id: "p7",
      term: "unit rate",
      visual: {
        kind: "shapes",
        alt: "A single box labelled 12 miles with an arrow and the words for 1 hour above it, showing the amount for exactly one unit.",
        w: 480,
        h: 220,
        items: [
          { t: "rect", x: 150, y: 40, w: 180, h: 50, fill: "paper", stroke: "navy", rx: 8 },
          {
            t: "text",
            x: 240,
            y: 72,
            text: "1 hour",
            anchor: "middle",
            fill: "ink",
            size: 20,
            weight: 700,
          },
          { t: "line", x1: 240, y1: 90, x2: 240, y2: 120, stroke: "ink", strokeWidth: 2 },
          { t: "rect", x: 150, y: 120, w: 180, h: 60, fill: "sky", stroke: "navy", rx: 8 },
          {
            t: "text",
            x: 240,
            y: 158,
            text: "12 miles",
            anchor: "middle",
            fill: "ink",
            size: 20,
            weight: 700,
          },
        ],
      },
      definition:
        "The amount for exactly one unit of the second quantity, such as miles in one hour.",
      example: "A cyclist's unit rate is 12 miles per hour, so she rides 12 miles in each hour.",
      why: "One hour is matched with one amount, 12 miles, so the picture shows the amount for exactly one unit.",
      hints: [
        "Look for a picture that matches one amount with just one of something.",
        "The second quantity here is exactly 1.",
        "The label above the arrow says one unit.",
      ],
      confusions: [
        {
          pick: "p6",
          tag: "many-pairs-vs-one",
          hint: "That picture lines up many marks. This one shows only the amount for one.",
        },
      ],
    },
  ],
  distractors: [
    {
      id: "d1",
      term: "2 to 3",
      tag: "order-reversed",
      hint: "Check which quantity is named first. The order of the numbers must match the order of the words.",
    },
    {
      id: "d2",
      term: "3 to 5",
      tag: "adds-parts",
      hint: "Adding two parts gives the whole. Ask whether the picture compares two parts or a part with the whole.",
    },
    {
      id: "d3",
      term: "7 to 4",
      tag: "whole-first",
      hint: "Check which number belongs to the whole and which belongs to the part.",
    },
    {
      id: "d4",
      definition: "Two amounts added together to find a total.",
      tag: "adding",
      hint: "A ratio compares amounts. It does not add them together.",
    },
    {
      id: "d5",
      visual: tape(
        "A tape diagram with a row of 3 sky-blue blocks labelled Blue and a row of 5 ochre blocks labelled Yellow.",
        [
          ["Blue", 3, "sky"],
          ["Yellow", 5, "ochre"],
        ],
      ),
      tag: "wrong-counts",
      hint: "Count the blocks in each row and compare them with the numbers in your ratio.",
    },
    {
      id: "d6",
      example: "The mural is painted on a wall that is twelve feet wide.",
      tag: "no-ratio",
      hint: "This sentence gives one measurement. It does not compare two quantities.",
    },
  ],
  supports: {
    ee: {
      frames: ["This picture shows ___ and ___.", "I counted ___ blocks."],
      wordBank: ["blocks", "rows", "to", "for every", "table"],
      directions: "Tap a word first. Then tap the card that matches it. Count the blocks out loud.",
    },
    dev: {
      frames: ["I matched it because ___.", "The first row has ___ and the second row has ___."],
      wordBank: ["ratio", "part", "whole", "rate"],
    },
    exp: {},
    br: {},
  },
  reflection: {
    prompt: "What did you look at first to decide which words belong with which picture?",
    frames: fr(
      ["I looked at ___.", "I counted ___."],
      ["I looked at the ___ first because ___.", "A clue was ___."],
      ["I started by counting ___, then I checked whether the picture compared ___ with ___."],
      [
        "I first decided whether the picture showed parts or a whole, then checked the order of the numbers.",
      ],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

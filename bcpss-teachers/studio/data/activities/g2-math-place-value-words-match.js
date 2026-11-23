// Grade 2 visual-match: place value words matched to base-ten pictures, definitions and example sentences.
// Picture cards never print the word they stand for (the digit and comparison cards show only numbers and symbols).
const txt = (text, x, y, size = 36) => ({ t: "text", text, x, y, size, weight: 700 });
const shapes = (alt, items) => ({ kind: "shapes", alt, w: 480, h: 280, items });
function blocks(t, o, x0 = 40, y0 = 60, sc = 1) {
  const rw = 18 * sc;
  const rh = 130 * sc;
  const gap = 5 * sc;
  const out = [];
  for (let i = 0; i < t; i++) {
    const x = x0 + i * (rw + gap);
    out.push({ t: "rect", x, y: y0, w: rw, h: rh, fill: "teal", stroke: "ink", sw: 2 });
    for (let k = 1; k < 10; k++)
      out.push({
        t: "line",
        x1: x,
        y1: y0 + (k * rh) / 10,
        x2: x + rw,
        y2: y0 + (k * rh) / 10,
        sw: 1,
      });
  }
  const ox = x0 + t * (rw + gap) + (t ? 14 * sc : 0);
  for (let j = 0; j < o; j++)
    out.push({
      t: "rect",
      x: ox + (j % 3) * (rw + gap),
      y: y0 + rh - rw - Math.floor(j / 3) * (rw + gap),
      w: rw,
      h: rw,
      fill: "ochre",
      stroke: "ink",
      sw: 2,
    });
  return out;
}
const flat = (x, y, s) => [
  { t: "rect", x, y, w: s, h: s, fill: "sky", stroke: "ink", sw: 3 },
  ...Array.from({ length: 9 }, (_, k) => ({
    t: "line",
    x1: x + ((k + 1) * s) / 10,
    y1: y,
    x2: x + ((k + 1) * s) / 10,
    y2: y + s,
    sw: 1,
  })),
  ...Array.from({ length: 9 }, (_, k) => ({
    t: "line",
    x1: x,
    y1: y + ((k + 1) * s) / 10,
    x2: x + s,
    y2: y + ((k + 1) * s) / 10,
    sw: 1,
  })),
];
const box = (x, y, w, h) => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 12,
  fill: "surface",
  stroke: "ink",
  sw: 3,
});

const pairs = [
  {
    id: "digit",
    term: "digit",
    forms: ["digits"],
    visual: shapes(
      "The number 47 written with two separate symbols, a 4 and a 7, each in its own box.",
      [
        box(130, 70, 100, 120),
        box(250, 70, 100, 120),
        txt("4", 180, 150, 90),
        txt("7", 300, 150, 90),
      ],
    ),
    definition: "One of the symbols from 0 to 9 used to write numbers.",
    example: "The number 47 has two digits.",
    why: "Each symbol from 0 to 9 used in a number is a digit. The number 47 uses the symbols 4 and 7.",
    hints: [
      "Look for the picture that splits a number into single symbols.",
      "Each box holds one symbol from zero to nine.",
      "Find the card where a number is split into two separate boxes.",
    ],
    confusions: [
      {
        pick: "place-value",
        tag: "digit-vs-value",
        hint: "That word tells what a symbol is worth in its place. This card only shows the separate symbols.",
      },
    ],
  },
  {
    id: "ones",
    term: "ones",
    visual: shapes(
      "Seven single unit squares, none joined together, arranged in three columns.",
      blocks(0, 7, 175, 90, 1.2),
    ),
    definition: "Single units. The right-hand digit of a two-digit number tells how many.",
    example: "In 47, the 7 means 7 ones.",
    why: "Single squares that are not joined into rods are ones. The digit on the right counts them.",
    hints: [
      "Look for pieces that are small and separate.",
      "Each square is one unit and none are joined.",
      "Find the card that has no long rods at all.",
    ],
    confusions: [
      {
        pick: "tens",
        tag: "ones-vs-tens",
        hint: "Tens are the long rods. This card shows single squares, so look at the size of each piece.",
      },
    ],
  },
  {
    id: "tens",
    term: "tens",
    visual: shapes(
      "Four ten-rods standing side by side. Each rod is ten units joined together.",
      blocks(4, 0, 170, 70, 1.2),
    ),
    definition: "Groups of ten units. The left-hand digit of a two-digit number tells how many.",
    example: "In 47, the 4 means 4 tens, or 40.",
    why: "Each long rod is a group of ten units joined together. Four rods are four groups of ten, which is 40.",
    hints: [
      "Look for the long pieces.",
      "Each long piece is a bundle of ten units.",
      "Find the card with only rods and no single squares.",
    ],
    confusions: [
      {
        pick: "ones",
        tag: "ones-vs-tens",
        hint: "Ones are single squares. This card shows long rods, and each rod is worth more than one.",
      },
    ],
    transfer: {
      prompt: "In the number 63, what does the 6 mean?",
      options: [
        { id: "a", text: "6 tens, which is 60" },
        { id: "b", text: "6 ones, which is 6" },
      ],
      answer: "a",
      explain: "The 6 is in the tens place, so it counts 6 groups of ten. That is 60.",
    },
  },
  {
    id: "place-value",
    term: "place value",
    visual: shapes(
      "The number 47 with base-ten blocks. Four ten-rods are above the digit 4 and seven unit squares are above the digit 7.",
      [...blocks(4, 7, 50, 50, 1), txt("4", 110, 252, 40), txt("7", 300, 252, 40)],
    ),
    definition: "What a digit is worth depends on where it sits in the number.",
    example: "The 4 in 47 and the 4 in 74 have different place value.",
    why: "The digit 4 means 40 in 47 but only 4 in 74. Its worth depends on its place.",
    hints: [
      "Look for the picture where each digit sits over its own blocks.",
      "The left digit sits over long rods and the right digit sits over squares.",
      "Find the card that shows a digit's worth changing with its position.",
    ],
    confusions: [
      {
        pick: "digit",
        tag: "digit-vs-value",
        hint: "That word names the symbol itself. This card shows what each symbol is worth in its position.",
      },
    ],
    transfer: {
      prompt: "Which number has a 7 that is worth 70?",
      options: [
        { id: "a", text: "73" },
        { id: "b", text: "37" },
      ],
      answer: "a",
      explain: "In 73 the 7 is in the tens place, so it is worth 70. In 37 the 7 is worth 7.",
    },
  },
  {
    id: "hundred",
    term: "hundred",
    visual: shapes(
      "One large flat made of one hundred small squares is equal to ten ten-rods side by side.",
      [...flat(26, 70, 130), txt("=", 190, 150, 54), ...blocks(10, 0, 235, 70, 1)],
    ),
    definition: "Ten tens joined together. It is the same as 100 single units.",
    example: "Ten tens make one hundred.",
    why: "Ten rods of ten make 100, the same amount as one big flat of one hundred squares.",
    hints: [
      "Look for the picture where one big piece equals many rods.",
      "Count the rods next to the big square.",
      "Find the card where ten rods equal one flat.",
    ],
    confusions: [
      {
        pick: "tens",
        tag: "tens-vs-hundred",
        hint: "One ten is a single rod. This card shows ten of those rods together as one big piece.",
      },
    ],
  },
  {
    id: "expanded-form",
    term: "expanded form",
    visual: shapes("The number 52 shown as 50 plus 2 with five ten-rods and two unit squares.", [
      txt("52 = 50 + 2", 240, 55, 44),
      ...blocks(5, 2, 120, 80, 1),
    ]),
    definition: "A number written as the sum of its tens and its ones, like 50 + 2.",
    example: "The expanded form of 52 is 50 + 2.",
    why: "The number is split into the amount in the tens place and the amount in the ones place and joined with a plus sign.",
    hints: [
      "Look for the picture that shows a number as an addition.",
      "The number is split by tens and by ones with a plus sign.",
      "Find the card where 52 equals 50 plus 2.",
    ],
    confusions: [
      {
        pick: "digit",
        tag: "digit-vs-value",
        hint: "That word names a single symbol. This card shows the whole number split into its worth by place.",
      },
    ],
    transfer: {
      prompt: "Which is the expanded form of 36?",
      options: [
        { id: "a", text: "30 + 6" },
        { id: "b", text: "3 + 6" },
      ],
      answer: "a",
      explain: "The 3 is in the tens place, so it is written as 30. The 6 stays 6.",
    },
  },
  {
    id: "greater-than",
    term: "greater than",
    visual: shapes(
      "The comparison 52 > 38 with blocks: five tens and two ones next to three tens and eight ones. The wide side of the symbol faces 52.",
      [txt("52 > 38", 240, 50, 46), ...blocks(5, 2, 40, 85, 0.75), ...blocks(3, 8, 290, 85, 0.75)],
    ),
    definition: "Larger in amount than another number.",
    example: "52 is greater than 38 because it has more tens.",
    why: "The left number has five tens and the right has only three, so the left is larger. The wide side of the symbol faces the larger number.",
    hints: [
      "Look at the tens first on both sides.",
      "One side has more rods than the other.",
      "Find the symbol whose wide side faces the number with more tens.",
    ],
    confusions: [
      {
        pick: "less-than",
        tag: "symbol-direction",
        hint: "Check the symbol. Its wide side faces the larger number. Which side has more rods?",
      },
    ],
    transfer: {
      prompt: "Which is true?",
      options: [
        { id: "a", text: "64 > 46" },
        { id: "b", text: "64 < 46" },
      ],
      answer: "a",
      explain: "64 has 6 tens and 46 has only 4 tens, so 64 is greater.",
    },
  },
  {
    id: "less-than",
    term: "less than",
    visual: shapes(
      "The comparison 38 < 52 with blocks: three tens and eight ones next to five tens and two ones. The wide side of the symbol faces 52.",
      [txt("38 < 52", 240, 50, 46), ...blocks(3, 8, 40, 85, 0.75), ...blocks(5, 2, 290, 85, 0.75)],
    ),
    definition: "Smaller in amount than another number.",
    example: "38 is less than 52 because it has fewer tens.",
    why: "The left number has three tens and the right has five, so the left is smaller. The wide side of the symbol still faces the larger number.",
    hints: [
      "Look at the tens first on both sides.",
      "The left side has fewer rods than the right side.",
      "Find the symbol whose wide side faces the number with more tens, on the right.",
    ],
    confusions: [
      {
        pick: "greater-than",
        tag: "symbol-direction",
        hint: "Check the symbol. Its wide side faces the larger number, and here the larger number is on the right.",
      },
    ],
  },
];

export default {
  id: "g2-math-place-value-words-match",
  engine: "visual-match",
  title: "Tens, ones and comparing words",
  grade: "2",
  band: "k-2",
  subject: "math",
  lessonId: "g2-math-place-value-to-100",
  standards: ["2.NBT.A.1", "1.NBT.B.2"],
  vocabIds: [
    "digit",
    "ones",
    "tens",
    "place-value",
    "hundred",
    "expanded-form",
    "greater-than",
    "less-than",
  ],
  minutes: 12,
  intro: "Match each place value word to its picture, its meaning or the sentence that uses it.",
  modes: ["term-visual", "term-definition", "term-example"],
  pairs,
  rounds: [
    {
      id: "r1",
      mode: "term-visual",
      level: "recognise",
      title: "Words and blocks",
      pairIds: ["digit", "ones", "tens", "hundred"],
    },
    {
      id: "r2",
      mode: "term-visual",
      level: "distinguish",
      title: "Place and compare",
      pairIds: ["place-value", "expanded-form", "greater-than", "less-than"],
    },
    {
      id: "r3",
      mode: "term-definition",
      level: "distinguish",
      title: "What does it mean?",
      pairIds: ["ones", "tens", "digit", "place-value"],
    },
    {
      id: "r4",
      mode: "term-example",
      level: "apply",
      title: "Finish the sentence",
      pairIds: ["place-value", "expanded-form", "greater-than", "less-than"],
    },
  ],
  distractors: [
    {
      id: "number",
      term: "number",
      tag: "too-general",
      hint: "That word could name any number. This card is about one special part of a number or how numbers are built.",
    },
    {
      id: "total",
      term: "total",
      tag: "adding-confusion",
      hint: "A total comes from adding. This card is about where a digit sits or how numbers compare.",
    },
  ],
  supports: {
    ee: {
      frames: ["This is ___.", "___ means ___.", "I see ___ rods and ___ squares."],
      wordBank: ["rod", "square", "tens", "ones", "greater", "less"],
      oral: "Say the word. Point to the rods. Point to the single squares.",
      directions:
        "Pick up a word, then place it on the card that matches the picture, meaning or sentence.",
    },
    dev: {
      frames: ["___ matches this picture because ___.", "The digit ___ means ___ tens."],
      wordBank: ["place value", "digit", "expanded form"],
      oral: "Tell your partner why before you place the word.",
    },
    exp: { frames: ["I matched ___ with this card because ___ in the picture shows ___."] },
    br: {},
  },
  reflection: {
    prompt:
      "Which word was hardest to match? Explain what it means and how you can show it with blocks.",
    frames: {
      ee: ["___ means ___.", "I can show ___ with blocks."],
      dev: ["___ was hard because ___.", "I can show ___ with ___ rods and ___ squares."],
      exp: ["___ was hard for me because ___. I can show it with blocks by ___."],
      br: ["The word ___ is important because ___, and I can model it with ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

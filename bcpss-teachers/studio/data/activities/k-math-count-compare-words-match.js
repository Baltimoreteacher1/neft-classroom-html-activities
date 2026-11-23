// Kindergarten visual-match: match counting and comparing words to pictures and to spoken sentences.
// Picture cards never print the word they stand for. Every chip and card is spoken aloud.
const dot = (cx, cy, fill = "teal", r = 17) => ({
  t: "circle",
  cx,
  cy,
  r,
  fill,
  stroke: "ink",
  sw: 2,
});
const row = (n, y, fill, x0 = 60, gap = 42) =>
  Array.from({ length: n }, (_, i) => dot(x0 + i * gap, y, fill));
const ring = (x, y, w, h) => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 16,
  fill: "none",
  stroke: "coral",
  sw: 4,
  dash: "8 6",
});
const txt = (text, x, y, size = 40) => ({ t: "text", text, x, y, size, weight: 700 });
const shapes = (alt, items) => ({ kind: "shapes", alt, w: 480, h: 280, items });
const tenFrame = (n) => [
  { t: "rect", x: 90, y: 100, w: 300, h: 120, fill: "surface", stroke: "ink", sw: 3 },
  { t: "line", x1: 90, y1: 160, x2: 390, y2: 160, sw: 3 },
  ...[1, 2, 3, 4].map((i) => ({
    t: "line",
    x1: 90 + i * 60,
    y1: 100,
    x2: 90 + i * 60,
    y2: 220,
    sw: 3,
  })),
  ...Array.from({ length: n }, (_, i) =>
    dot(120 + (i % 5) * 60, 130 + Math.floor(i / 5) * 60, "teal", 22),
  ),
];

const pairs = [
  {
    id: "count",
    term: "count",
    visual: {
      kind: "scene",
      bg: "plain",
      alt: "Five apples in a row with the numbers 1, 2, 3, 4 and 5 above them, one number for each apple.",
      items: [
        ...[0, 1, 2, 3, 4].map((i) => ({ icon: "apple", x: 52 + i * 80, y: 120, s: 64 })),
        ...[0, 1, 2, 3, 4].map((i) => txt(String(i + 1), 84 + i * 80, 100, 36)),
      ],
    },
    definition: "To say one number for each thing, in order.",
    example: "We count the apples one at a time.",
    why: "Each apple gets one number, said in order. That is what counting is.",
    hints: [
      "Think about what your finger does as you say each number.",
      "Look for the picture where every apple has its own number.",
      "Say the numbers in order and touch one apple for each.",
    ],
    confusions: [
      {
        pick: "number",
        tag: "number-vs-count",
        hint: "That word names a number you can say or write. This picture shows doing something, one thing at a time.",
      },
    ],
    transfer: {
      prompt: "What do we do first when we want to know how many?",
      options: [
        { id: "a", text: "Touch each one and say a number" },
        { id: "b", text: "Guess a big number" },
      ],
      answer: "a",
      explain: "We touch each one and say one number for each, so we do not miss any.",
    },
    es: {
      term: "contar",
      definition: "Decir un número por cada cosa, en orden.",
      example: "Contamos las manzanas una por una.",
      verified: true,
    },
  },
  {
    id: "number",
    term: "number",
    visual: shapes("The numeral 6 in large print above six dots arranged in two rows of three.", [
      txt("6", 240, 90, 90),
      ...[0, 1, 2].map((i) => dot(190 + i * 50, 160)),
      ...[0, 1, 2].map((i) => dot(190 + i * 50, 215)),
    ]),
    definition: "A word or a symbol that tells how many.",
    example: "The number on the card is six.",
    why: "The numeral 6 and the six dots both tell how many.",
    hints: [
      "Look for the picture with a symbol you can write.",
      "The symbol tells how many dots are below it.",
      "Find the card that has a numeral and matching dots.",
    ],
    confusions: [
      {
        pick: "count",
        tag: "number-vs-count",
        hint: "That word is about touching things one at a time. This picture shows a symbol that tells how many.",
      },
    ],
    es: {
      term: "número",
      definition: "Una palabra o un símbolo que dice cuántos hay.",
      example: "El número de la tarjeta es seis.",
      verified: true,
    },
  },
  {
    id: "group",
    term: "group",
    visual: {
      kind: "scene",
      bg: "water",
      alt: "A dashed ring around a group of four ducks. Two fish are outside the ring and are not part of the group.",
      items: [
        ring(34, 30, 270, 180),
        { icon: "duck", x: 50, y: 50, s: 64 },
        { icon: "duck", x: 130, y: 50, s: 64 },
        { icon: "duck", x: 210, y: 50, s: 64 },
        { icon: "duck", x: 130, y: 128, s: 64 },
        { icon: "fish", x: 340, y: 60, s: 56 },
        { icon: "fish", x: 380, y: 150, s: 56 },
      ],
    },
    definition: "Things that are together in one set.",
    example: "The ducks in the ring are one group.",
    why: "The ring shows which things are together. The ducks inside the ring are one group.",
    hints: [
      "Look for the picture where a ring keeps some things together.",
      "Some animals are inside the ring and some are outside.",
      "Find the card with a ring around the ducks.",
    ],
    es: {
      term: "grupo",
      definition: "Cosas que están juntas en un conjunto.",
      example: "Los patos dentro del círculo son un grupo.",
      verified: true,
    },
  },
  {
    id: "zero",
    term: "zero",
    visual: shapes("An empty bowl with nothing in it and the numeral 0 above it.", [
      txt("0", 240, 110, 90),
      {
        t: "path",
        d: "M130 160 L350 160 Q330 260 240 260 Q150 260 130 160 Z",
        fill: "sky",
        stroke: "ink",
        sw: 4,
      },
    ]),
    definition: "The number for none. There is nothing to count.",
    example: "The empty bowl has zero apples in it.",
    why: "The bowl is empty, so there are none. The number for none is zero.",
    hints: [
      "Look for a picture where there is nothing to count.",
      "The bowl has nothing in it.",
      "Find the card with an empty bowl and the numeral that stands for none.",
    ],
    es: {
      term: "cero",
      definition: "El número que quiere decir ninguno.",
      example: "El tazón vacío tiene cero manzanas.",
      verified: true,
    },
  },
  {
    id: "more",
    term: "more",
    visual: shapes(
      "A dashed ring marks the longer top row of seven circles. The bottom row has four circles.",
      [ring(36, 60, 330, 60), ...row(7, 90, "teal"), ...row(4, 190, "ochre")],
    ),
    definition: "A group with extra. It has a bigger number.",
    example: "The top row has more circles than the bottom row.",
    why: "The ringed row has circles left over after matching. It has the bigger number.",
    hints: [
      "Look at the ringed row and match each circle to one below it.",
      "After matching, is anything left over in the ringed row?",
      "Find the card where the ringed row has extras.",
    ],
    confusions: [
      {
        pick: "fewer",
        tag: "more-vs-fewer",
        hint: "That word is for the group that runs out first. Look at the ringed row: does it run out or have extras?",
      },
      {
        pick: "same",
        tag: "ignored-leftovers",
        hint: "That word is for groups that match with nothing left. Here the ringed row has circles left over.",
      },
    ],
    transfer: {
      prompt: "Which group has more?",
      options: [
        { id: "a", text: "9 stars" },
        { id: "b", text: "5 stars" },
      ],
      answer: "a",
      explain: "Nine is a bigger number than five, so nine stars is the group with extras.",
    },
    es: {
      term: "más",
      definition: "Un grupo que tiene extras. Su número es mayor.",
      example: "La fila de arriba tiene más círculos que la de abajo.",
      verified: true,
    },
  },
  {
    id: "fewer",
    term: "fewer",
    visual: shapes(
      "A dashed ring marks the shorter bottom row of four circles. The top row has seven circles.",
      [...row(7, 90, "teal"), ring(36, 160, 190, 60), ...row(4, 190, "ochre")],
    ),
    definition: "A group with a smaller number. It runs out first.",
    example: "The bottom row has fewer circles than the top row.",
    why: "The ringed row runs out first when we match. It has the smaller number.",
    hints: [
      "Look at the ringed row and match each circle to one above it.",
      "Does the ringed row have extras or does it run out?",
      "Find the card where the ringed row is the group that runs out first.",
    ],
    confusions: [
      {
        pick: "more",
        tag: "more-vs-fewer",
        hint: "That word is for the group with extras. Look at the ringed row: does it have extras or does it run out?",
      },
      {
        pick: "same",
        tag: "ignored-leftovers",
        hint: "That word is for groups that match with nothing left. Here the other row has circles left over.",
      },
    ],
    transfer: {
      prompt: "Which group has fewer?",
      options: [
        { id: "a", text: "3 cubes" },
        { id: "b", text: "8 cubes" },
      ],
      answer: "a",
      explain:
        "Three is a smaller number than eight, so three cubes is the group that runs out first.",
    },
    es: {
      term: "menos",
      definition: "Un grupo con un número menor. Se acaba primero.",
      example: "La fila de abajo tiene menos círculos que la de arriba.",
      verified: true,
    },
  },
  {
    id: "same",
    term: "same",
    visual: shapes(
      "Two rows of five circles. A straight line joins each circle in the top row to the circle below it, with none left over.",
      [
        ...[0, 1, 2, 3, 4].map((i) => ({
          t: "line",
          x1: 90 + i * 75,
          y1: 110,
          x2: 90 + i * 75,
          y2: 190,
          sw: 3,
        })),
        ...[0, 1, 2, 3, 4].map((i) => dot(90 + i * 75, 100, "teal")),
        ...[0, 1, 2, 3, 4].map((i) => dot(90 + i * 75, 200, "ochre")),
      ],
    ),
    definition: "Not different. Two groups match one to one with none left over.",
    example: "Both rows have the same number of circles.",
    why: "Every circle has a partner and none are left over. The rows have the same number.",
    hints: [
      "Look at the lines between the two rows.",
      "Does every circle have a partner?",
      "Find the card where nothing is left over on either side.",
    ],
    confusions: [
      {
        pick: "more",
        tag: "ignored-leftovers",
        hint: "That word is for a group with extras. Check this picture: does either row have circles left over?",
      },
    ],
    transfer: {
      prompt: "Two plates each have 4 crackers. What can you say?",
      options: [
        { id: "a", text: "The plates have the same number" },
        { id: "b", text: "One plate has more" },
      ],
      answer: "a",
      explain: "Four and four match with none left over, so the plates have the same number.",
    },
    es: {
      term: "igual",
      definition: "Lo mismo. Los grupos tienen la misma cantidad.",
      example: "Las dos filas tienen la misma cantidad de círculos.",
      verified: true,
    },
  },
  {
    id: "ten",
    term: "ten",
    visual: shapes(
      "A ten frame that is completely full with ten counters, five in each row, and the numeral 10 above it.",
      [txt("10", 240, 75, 52), ...tenFrame(10)],
    ),
    definition: "The number after nine. A frame with every space full shows it.",
    example: "I have ten fingers on my two hands.",
    why: "Every space in the frame is full, and a full frame has ten counters.",
    hints: [
      "Look for the frame where no space is empty.",
      "Count the counters in the top row and the bottom row.",
      "Find the card with a full frame and the numeral 10.",
    ],
    es: {
      term: "diez",
      definition: "El número que sigue después del nueve.",
      example: "Tengo diez dedos en mis dos manos.",
      verified: true,
    },
  },
];

export default {
  id: "k-math-count-compare-words-match",
  engine: "visual-match",
  title: "Words for counting and comparing",
  grade: "K",
  band: "k-2",
  subject: "math",
  lessonId: "k-math-count-and-compare-to-10",
  standards: ["K.CC.B.4", "K.CC.C.6"],
  vocabIds: ["count", "number", "group", "more", "fewer", "same", "zero", "ten"],
  minutes: 8,
  intro: "Listen to each word. Find the picture or the sentence that goes with it.",
  modes: ["term-visual", "term-example"],
  pairs,
  rounds: [
    {
      id: "r1",
      mode: "term-visual",
      level: "recognise",
      title: "Words and pictures",
      pairIds: ["count", "number", "group", "zero"],
    },
    {
      id: "r2",
      mode: "term-visual",
      level: "distinguish",
      title: "Which group?",
      pairIds: ["more", "fewer", "same", "ten"],
    },
    {
      id: "r3",
      mode: "term-example",
      level: "apply",
      title: "Finish the sentence",
      pairIds: ["more", "fewer", "same", "count"],
    },
  ],
  distractors: [
    {
      id: "bigger",
      term: "bigger",
      tag: "size-not-number",
      hint: "That word is about how large something looks. This card is about how many.",
    },
    {
      id: "plus",
      term: "plus",
      tag: "adding-not-comparing",
      hint: "That word is for putting groups together. This card is only looking at one group or comparing two.",
    },
  ],
  supports: {
    ee: {
      frames: ["This is ___.", "I hear ___."],
      oral: "Tap a word to hear it. Look at the picture. Do they go together?",
      directions: "Tap a word to hear it. Then tap the picture or sentence that goes with it.",
    },
    dev: {
      frames: ["This picture shows ___.", "___ goes with this picture."],
      oral: "Say the word to your partner before you choose.",
    },
    exp: { frames: ["I matched ___ with this picture because ___."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a grown-up one of the words you learned and show what it means.",
    frames: {
      ee: ["I know ___.", "___ means ___."],
      dev: ["___ means ___.", "I can show ___ with blocks."],
      exp: ["___ is when ___, and I can show it with ___."],
      br: ["I can explain ___ because ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

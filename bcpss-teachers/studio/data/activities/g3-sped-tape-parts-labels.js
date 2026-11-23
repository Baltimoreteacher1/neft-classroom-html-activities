// Concept Builder (label-diagram): put names on the parts of a tape diagram for three kinds of word problems. Original content.
const rect = (x, y, w, h, fill, o = {}) => ({ t: "rect", x, y, w, h, fill, stroke: "ink", sw: 3, rx: 6, ...o });
const line = (x1, y1, x2, y2) => ({ t: "line", x1, y1, x2, y2, stroke: "ink", sw: 3 });
const txt = (x, y, text, size = 26) => ({ t: "text", x, y, text, size, fill: "ink", anchor: "middle", weight: 700 });
const bracket = (x1, x2, y, label) => [line(x1, y, x2, y), line(x1, y, x1, y + 14), line(x2, y, x2, y + 14), txt((x1 + x2) / 2, y - 16, label, 28)];

const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });
const check = { type: "all", checks: [{ type: "equals", of: "wrong", value: "0" }, { type: "equals", of: "unplaced", value: "0" }] };

const addTape = {
  kind: "shapes",
  w: 480,
  h: 260,
  alt: "A tape diagram with a long bracket on top that has a question mark. Under the bracket are two blocks side by side: a long left block with 24 and a shorter right block with 15.",
  longDesc: "Story: Mia has 24 stickers and a friend gives her 15 more. The long left block holds 24. The shorter right block holds 15. The bracket above both blocks shows the whole, which is not known yet.",
  items: [...bracket(40, 440, 64, "?"), rect(40, 96, 240, 70, "sky"), rect(280, 96, 160, 70, "ochre"), txt(160, 140, "24"), txt(360, 140, "15")],
};
const subTape = {
  kind: "shapes",
  w: 480,
  h: 280,
  alt: "A tape diagram with a long top block marked 36. Below it are two blocks side by side: a left block marked 18 and a right dashed block with a question mark.",
  longDesc: "Story: a class has 36 pencils and gives out 18. The long top block is the whole, 36. The left block under it is 18. The dashed block on the right, with a question mark, is the number left.",
  items: [rect(40, 44, 400, 56, "sage"), txt(240, 82, "36"), rect(40, 140, 200, 56, "ochre"), rect(240, 140, 200, 56, "paper", { dash: "8 5" }), txt(140, 178, "18"), txt(340, 178, "?")],
};
const groupTape = {
  kind: "shapes",
  w: 480,
  h: 260,
  alt: "A tape diagram with a bracket on top that has a question mark. Under the bracket are four equal blocks in a row. Each block has the number 6.",
  longDesc: "Story: 4 tables with 6 students at each table. Four equal blocks each hold 6. The bracket above all four blocks shows the whole, which is not known yet.",
  items: [...bracket(40, 440, 64, "?"), ...[0, 1, 2, 3].flatMap((i) => [rect(40 + i * 100, 96, 100, 70, i % 2 ? "ochre" : "sky"), txt(90 + i * 100, 140, "6")])],
};

export default {
  id: "g3-sped-tape-parts-labels",
  engine: "concept-builder",
  kind: "label-diagram",
  title: "Name the parts of the tape diagram",
  grade: "3",
  band: "3-5",
  subject: "sped",
  lessonId: "g3-sped-solving-word-problems-with-visuals",
  standards: ["3.OA.D.8", "3.OA.A.3", "MP.4", "UDL.2.5"],
  vocabIds: ["part", "total", "unknown", "equal-groups"],
  minutes: 14,
  intro:
    "A tape diagram shows a story as blocks. Read the story, look at the picture, and put each name on the right place. Take your time. You can change your mind.",
  model: {
    visual: addTape,
    labels: [
      { id: "whole", text: "Whole: all the stickers" },
      { id: "p1", text: "Part: stickers Mia had" },
      { id: "p2", text: "Part: stickers the friend gave" },
      { id: "dis", text: "Difference", distractor: true },
    ],
    hotspots: [
      { id: "hw", x: 240, y: 26, answer: "whole", name: "above the long bracket" },
      { id: "h1", x: 160, y: 200, answer: "p1", name: "under the long left block" },
      { id: "h2", x: 360, y: 200, answer: "p2", name: "under the shorter right block" },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt: "Mia has 24 stickers. A friend gives her 15 more. Put the names on the tape diagram.",
      goal: "Every spot has a name",
      target: { placed: { hw: "whole", h1: "p1", h2: "p2" } },
      check,
      hints: [
        "Read the story again. The bracket on top holds the blocks together.",
        "The blocks under the bracket are pieces. Which piece came first in the story?",
        "A whole is everything put together. Which name says everything?",
      ],
      misconceptions: [
        { match: "whole-as-part", when: { type: "equals", of: "placed.hw", value: "p1" }, hint: "The bracket covers both blocks. Which name says all of the stickers together?", model: "The whole is all of the stickers together." },
        { match: "parts-swapped", when: { type: "all", checks: [{ type: "equals", of: "placed.h1", value: "p2" }, { type: "equals", of: "placed.h2", value: "p1" }] }, hint: "Check which block is the longer one. Which number did Mia start with?" },
      ],
      model: "The bracket on top shows all of the stickers together, so it is the whole. The long block is the 24 stickers Mia had. The short block is the 15 stickers her friend gave.",
      right: "Yes. Two parts make the whole.",
      supports: {
        ee: { frames: ["The bracket is the ___.", "24 stickers is a ___."], wordBank: ["whole", "part", "stickers"], directions: "Tap a name. Then tap a spot. Use the arrow keys if you like." },
        dev: { frames: ["The whole is ___ because ___."], wordBank: ["whole", "part"] },
        exp: { frames: ["The two parts are ___ and ___, and together they make ___."] },
        br: {},
      },
      explain: {
        prompt: "What does each block show? Say it in your own words.",
        frames: fr(["The long block is ___.", "The short block is ___."], ["The long block shows ___ and the short block shows ___."], ["The two blocks are parts. The bracket is the whole because ___."], ["The parts ___ and ___ combine to form the whole, which is ___."]),
        mustMention: [{ id: "parts", label: "parts together make the whole", any: ["whole", "together", "all"] }],
      },
    },
    {
      id: "t2",
      prompt: "A class has 36 pencils. The teacher gives out 18. Put the names on the tape diagram.",
      goal: "Every spot has a name",
      setup: {
        visual: subTape,
        labels: [
          { id: "whole", text: "Whole: all the pencils" },
          { id: "given", text: "Part: pencils given out" },
          { id: "left", text: "Part: pencils left (unknown)" },
          { id: "dis", text: "Total of 36 and 18", distractor: true },
        ],
        hotspots: [
          { id: "hw", x: 240, y: 22, answer: "whole", name: "above the long top block" },
          { id: "h1", x: 140, y: 222, answer: "given", name: "under the left lower block" },
          { id: "h2", x: 340, y: 222, answer: "left", name: "under the dashed block" },
        ],
      },
      target: { placed: { hw: "whole", h1: "given", h2: "left" } },
      check,
      hints: [
        "The long block on top is the starting amount. Read what the class has at the start.",
        "The dashed block is the number we do not know yet.",
        "The class gives some away. Which block shows what is given out?",
      ],
      misconceptions: [
        { match: "distractor-as-whole", when: { type: "equals", of: "placed.hw", value: "dis" }, hint: "The whole here is not 36 plus 18. It is the number the class had at the start." },
        { match: "unknown-as-given", when: { type: "equals", of: "placed.h2", value: "given" }, hint: "The dashed block shows a number we do not know yet. Is the number given out known?" },
      ],
      model: "The top block is all the pencils the class had at first, so it is the whole. The 18 is the part that was given out. The dashed block is the part that is left, and it is the unknown.",
      right: "Yes. The whole minus one part leaves the other part.",
      supports: {
        ee: { frames: ["The top block is the ___.", "The dashed block is the ___ part."], wordBank: ["whole", "unknown", "given out", "left"], directions: "Tap a name. Then tap a spot." },
        dev: { frames: ["The unknown part is ___ because ___."], wordBank: ["unknown", "whole", "part"] },
        exp: { frames: ["The whole is ___. One part is ___. The unknown part is ___."] },
        br: {},
      },
      explain: {
        prompt: "Which block is the unknown? How do you know?",
        frames: fr(["The unknown is the ___ block."], ["The unknown is the ___ block because it has a ___."], ["The unknown is the ___ because the story does not tell us ___."], ["The unknown part is the ___ because the story gives the whole and ___ but not ___."]),
        mustMention: [{ id: "unknown", label: "the unknown part", any: ["unknown", "dashed", "question", "left", "don't know", "do not know"] }],
      },
    },
    {
      id: "t3",
      prompt: "There are 4 tables with 6 students at each table. Put the names on the tape diagram.",
      goal: "Every spot has a name",
      setup: {
        visual: groupTape,
        labels: [
          { id: "whole", text: "Whole: all the students" },
          { id: "g1", text: "One group of 6" },
          { id: "g2", text: "Another equal group of 6" },
          { id: "dis", text: "A group of a different size", distractor: true },
        ],
        hotspots: [
          { id: "hw", x: 240, y: 26, answer: "whole", name: "above the long bracket" },
          { id: "h1", x: 90, y: 200, answer: "g1", name: "under the first block" },
          { id: "h2", x: 290, y: 200, answer: "g2", name: "under the third block" },
        ],
      },
      target: { placed: { hw: "whole", h1: "g1", h2: "g2" } },
      check,
      hints: [
        "Count the blocks. Do they all look the same size?",
        "Each block is one table. What do they all hold?",
        "The bracket shows the students at all of the tables together.",
      ],
      misconceptions: [
        { match: "whole-as-group", when: { type: "equals", of: "placed.hw", value: "g1" }, hint: "One block is only one table. Which name says all of the students?" },
        { match: "distractor-used", when: { type: "any", checks: [{ type: "equals", of: "placed.h1", value: "dis" }, { type: "equals", of: "placed.h2", value: "dis" }] }, hint: "Look at the blocks again. Are any of them a different size?" },
      ],
      model: "The four blocks are equal groups. Each block has 6 students, so any block is one group of 6 and another block is another equal group. The bracket shows all the students together, which is the whole.",
      right: "Yes. Equal groups make the whole.",
      supports: {
        ee: { frames: ["Each block is a ___ of ___.", "The bracket is the ___."], wordBank: ["group", "whole", "equal", "6"], directions: "Tap a name. Then tap a spot." },
        dev: { frames: ["There are ___ equal groups of ___."], wordBank: ["equal groups", "whole"] },
        exp: { frames: ["The groups are equal because ___, so I can ___."] },
        br: {},
      },
      explain: {
        prompt: "How do you know the groups are equal? What will you do to find the whole?",
        frames: fr(["Each group has ___."], ["The groups are equal because each has ___."], ["The groups are equal because each has ___, so I can ___."], ["Because each of the four groups has ___, I can find the whole by ___."]),
        mustMention: [{ id: "equal", label: "the groups are the same size", any: ["same", "equal", "each"] }],
      },
    },
  ],
  reflection: {
    prompt: "Which name was hardest to place, and what helped you?",
    frames: {
      ee: ["The hard one was ___.", "It helped to ___."],
      dev: ["The hardest was ___ because ___.", "What helped was ___."],
      exp: ["The hardest was ___; what helped me decide was ___."],
      br: ["I found ___ hardest, and rereading the story helped because ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

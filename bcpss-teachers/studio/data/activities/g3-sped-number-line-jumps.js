// Concept Builder (number-line): show a word problem as a jump on a number line, then say what the jump means. Original content.
const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });

export default {
  id: "g3-sped-number-line-jumps",
  engine: "concept-builder",
  kind: "number-line",
  title: "Show the story as a jump",
  grade: "3",
  band: "3-5",
  subject: "sped",
  lessonId: "g3-sped-solving-word-problems-with-visuals",
  standards: ["3.OA.D.8", "3.NBT.A.2", "MP.4"],
  vocabIds: ["total", "difference", "unknown", "equation"],
  minutes: 14,
  intro:
    "A number line can show a story. Start at the first number, then make a jump that matches the story. You can drag the end of the jump or use the arrow keys.",
  model: {
    min: "0",
    max: "50",
    step: "1",
    labelEvery: "5",
    format: "integer",
    points: [{ id: "start", label: "Start: 24 stickers", at: "24", fixed: true }],
    jumps: [{ id: "j1", label: "Stickers the friend gives", from: { point: "start" } }],
  },
  tasks: [
    {
      id: "t1",
      prompt: "Mia has 24 stickers. A friend gives her 15 more. Make a jump that shows the stickers the friend gives. Where do you land?",
      goal: "Land on the number of stickers Mia has now",
      target: { points: { start: "24" }, jumps: { j1: "15" } },
      check: { type: "equals", of: "jumps[j1].to", value: "39" },
      answerText: "39",
      hints: [
        "The friend gives more stickers. Does Mia have more or fewer now?",
        "Getting more means jumping to the right, toward bigger numbers.",
        "The size of the jump is the number of stickers the friend gives.",
      ],
      misconceptions: [
        { match: "jump-left", when: { type: "relation", left: "jumps[j1].len", op: "lt", right: { value: "0" } }, hint: "A jump to the left makes the number smaller. Does Mia have fewer stickers?" },
        { match: "short-jump", when: { type: "relation", left: "jumps[j1].len", op: "lt", right: { value: "15" } }, hint: "Check the size of your jump against how many stickers the friend gives." },
      ],
      model: "Start at 24. The friend gives 15 more, so jump 15 to the right. 24 plus 15 lands on 39. Mia has 39 stickers now.",
      right: "Yes. Adding is a jump to the right.",
      supports: {
        ee: { frames: ["I start at ___.", "I jump ___ to the right."], wordBank: ["jump", "right", "more", "start"], directions: "Drag the end of the jump to the right, or press the right arrow key." },
        dev: { frames: ["I jumped ___ so I landed on ___."], wordBank: ["add", "land", "jump"] },
        exp: { frames: ["The equation is ___ + ___ = ___ because ___."] },
        br: {},
      },
      explain: {
        prompt: "What does your jump show about the story? Which way did you go, and why?",
        frames: fr(["I jumped ___.", "I landed on ___."], ["I jumped to the right because Mia got ___ stickers."], ["I jumped ___ to the right because adding ___, so I landed on ___."], ["The jump of ___ to the right models adding, which gives ___."]),
        mustMention: [{ id: "dir", label: "the direction of the jump", any: ["right", "more", "add", "bigger"] }],
      },
    },
    {
      id: "t2",
      prompt: "A class has 36 pencils. The teacher gives out 18. Make a jump that shows the pencils given out. Where do you land?",
      goal: "Land on the number of pencils left",
      setup: {
        points: [{ id: "start", label: "Start: 36 pencils", at: "36", fixed: true }],
        jumps: [{ id: "j1", label: "Pencils given out", from: { point: "start" } }],
      },
      target: { points: { start: "36" }, jumps: { j1: "-18" } },
      check: { type: "equals", of: "jumps[j1].to", value: "18" },
      answerText: "18",
      hints: [
        "The teacher gives pencils away. Are there more or fewer pencils left?",
        "Fewer means jumping to the left, toward smaller numbers.",
        "The jump is as long as the number of pencils given out.",
      ],
      misconceptions: [
        { match: "jump-right", when: { type: "relation", left: "jumps[j1].len", op: "gt", right: { value: "0" } }, hint: "A jump to the right makes the number bigger. Are there more pencils?" },
        { match: "short-jump", when: { type: "relation", left: "jumps[j1].len", op: "gt", right: { value: "-18" } }, hint: "Check the size of your jump against how many pencils are given out." },
      ],
      model: "Start at 36. The teacher gives out 18, so jump 18 to the left. 36 minus 18 lands on 18. There are 18 pencils left.",
      right: "Yes. Taking away is a jump to the left.",
      supports: {
        ee: { frames: ["I start at ___.", "I jump ___ to the left."], wordBank: ["jump", "left", "fewer", "start"], directions: "Drag the end of the jump to the left, or press the left arrow key." },
        dev: { frames: ["I jumped ___ to the left so I landed on ___."], wordBank: ["subtract", "land", "left"] },
        exp: { frames: ["The equation is ___ - ___ = ___ because ___."] },
        br: {},
      },
      explain: {
        prompt: "How is this jump different from the sticker jump? Why?",
        frames: fr(["This jump goes ___.", "I landed on ___."], ["This jump goes left because the pencils ___."], ["This jump goes left, not right, because the teacher gives out pencils, so ___."], ["Unlike the first jump, this one goes ___ because the quantity ___."]),
        mustMention: [{ id: "dir", label: "the direction of the jump", any: ["left", "fewer", "subtract", "smaller", "take away"] }],
      },
    },
    {
      id: "t3",
      prompt: "Leo read 28 pages. Ava read 45 pages. Make a jump from Leo's number to Ava's number. How many more pages did Ava read?",
      goal: "A jump that lands on Ava's number",
      setup: {
        points: [
          { id: "leo", label: "Leo: 28 pages", at: "28", fixed: true },
          { id: "ava", label: "Ava: 45 pages", at: "45", fixed: true },
        ],
        jumps: [{ id: "j1", label: "How many more pages Ava read", from: { point: "leo" } }],
      },
      target: { points: { leo: "28", ava: "45" }, jumps: { j1: "17" } },
      check: { type: "equals", of: "jumps[j1].to", value: "45" },
      answerText: "17",
      hints: [
        "The jump starts at Leo's number. Where must it end?",
        "Count how far you move from Leo's number to Ava's number.",
        "The size of the jump is how many more pages Ava read.",
      ],
      misconceptions: [
        { match: "overshoot", when: { type: "relation", left: "jumps[j1].to", op: "gt", right: { value: "45" } }, hint: "Your jump goes past Ava's number. Check where Ava is on the line." },
        { match: "undershoot", when: { type: "relation", left: "jumps[j1].to", op: "lt", right: { value: "45" } }, hint: "Your jump stops before Ava's number. The jump must reach her number." },
      ],
      model: "Start at Leo's 28 and jump to the right until you reach Ava's 45. The jump is 17 long. The difference is 17, so Ava read 17 more pages.",
      right: "Yes. The length of the jump is the difference.",
      supports: {
        ee: { frames: ["I jump from ___ to ___.", "The jump is ___ long."], wordBank: ["difference", "more", "jump", "from"], directions: "Drag the end of the jump until it touches Ava's number." },
        dev: { frames: ["The jump is ___ long, so Ava read ___ more."], wordBank: ["difference", "subtract"] },
        exp: { frames: ["The difference is ___ because I jumped from ___ to ___."] },
        br: {},
      },
      explain: {
        prompt: "What does the length of the jump tell you about the story?",
        frames: fr(["The jump is ___.", "Ava read ___ more."], ["The jump shows how many ___ more Ava read."], ["The length of the jump is the difference, so Ava read ___ more pages than Leo."], ["The jump from ___ to ___ measures the difference, which is ___."]),
        mustMention: [{ id: "diff", label: "the jump length is the difference", any: ["difference", "more", "how many more", "length"] }],
      },
    },
  ],
  reflection: {
    prompt: "How does a number line help you understand a word problem?",
    frames: {
      ee: ["It shows ___.", "I can see ___."],
      dev: ["It helps me because I can see ___.", "A jump to the right means ___."],
      exp: ["A number line helps because the jump shows ___, so I know whether to ___."],
      br: ["Representing the story as a jump clarifies ___ because ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

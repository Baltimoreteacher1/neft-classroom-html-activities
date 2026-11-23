// Concept Builder (fraction-bar): add fractions with unlike denominators by cutting every bar into the same size pieces.
const same = (a, b) => ({ type: "relation", left: a, op: "eq", right: b });
const sumCheck = (a, b, total, fa, fb, ft) => ({
  type: "all",
  checks: [
    { type: "equals", of: `bars[${a}].frac`, value: fa },
    { type: "equals", of: `bars[${b}].frac`, value: fb },
    { type: "equals", of: `bars[${total}].frac`, value: ft },
    same(`bars[${a}].n`, `bars[${b}].n`),
    same(`bars[${b}].n`, `bars[${total}].n`),
  ],
});

const frames = {
  cut: {
    ee: ["I cut the bars into ___ equal parts.", "Now every part is the same ___."],
    dev: [
      "I cut every bar into ___ parts so the parts are the same size.",
      "First the bars were different, then they were ___.",
    ],
    exp: ["I changed the number of parts on each bar to ___ so I could add the shaded parts."],
    br: ["I partitioned each bar into ___ equal parts, which made the shaded pieces comparable."],
  },
  error: {
    ee: ["The answer ___ is not right because ___.", "The pieces were ___ sizes."],
    dev: ["The answer is not right because the bars have ___ size pieces, so you cannot ___."],
    exp: ["Adding the denominators does not work because ___, so the total must be ___."],
    br: [
      "The error comes from treating the denominators as amounts; the denominator names the size of the piece, so ___.",
    ],
  },
};

const supports = (task, tier) => ({
  ee: {
    directions:
      "Use the plus and minus buttons to change the parts. Then tap a part to shade from the left.",
    frames: ["First I cut the bars into ___ parts.", "Then I shaded ___ parts."],
    wordBank: ["equal parts", "shade", "same size", "denominator", "total"],
    oral: "Say it to a partner first: which number of parts works for both bars?",
    hint: task,
  },
  dev: {
    directions: "Make the number of parts the same on all three bars before you shade.",
    frames: ["The bars need ___ parts because ___."],
    wordBank: ["equal parts", "common denominator", "total"],
  },
  exp: { frames: ["I chose ___ parts because both fractions fit."] },
  br: {},
});

const explainFor = (prompt, mention, kind = "cut") => ({
  prompt,
  frames: frames[kind],
  mustMention: mention,
});

export default {
  id: "g5-math-fraction-bar-unlike",
  engine: "concept-builder",
  kind: "fraction-bar",
  title: "Fraction Bars: Add Unlike Fractions",
  grade: "5",
  band: "3-5",
  subject: "math",
  lessonId: "g5-math-add-unlike-fractions",
  standards: ["5.NF.A.1", "MP.3"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to 5.NF.A.1; not mapped to a district unit sequence.",
  },
  vocabIds: ["common-denominator", "equivalent-fractions", "unlike-denominators", "sum"],
  minutes: 15,
  intro:
    "Three bars show two amounts and their total. Cut all three bars into the same size pieces, shade each amount, then explain what changed and why.",
  model: {
    bars: [
      { id: "A", label: "First amount", nMin: 2, nMax: 12 },
      { id: "B", label: "Second amount", nMin: 2, nMax: 12 },
      { id: "T", label: "Total of both", nMin: 2, nMax: 12 },
    ],
    align: true,
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "Dara pours one half of a cup of pretzels and one third of a cup of raisins into a bowl. Show both amounts and their total on the bars.",
      goal: "Same number of parts on all three bars, both amounts shaded, and the total shaded",
      setup: {
        bars: [
          { id: "A", label: "Pretzels (one half cup)", nMin: 2, nMax: 12, n: 2 },
          { id: "B", label: "Raisins (one third cup)", nMin: 2, nMax: 12, n: 3 },
          { id: "T", label: "Total in the bowl", nMin: 2, nMax: 12, n: 2 },
        ],
      },
      start: { bars: { A: { n: 2, k: 0 }, B: { n: 3, k: 0 }, T: { n: 2, k: 0 } } },
      target: { bars: { A: { n: 6, k: 3 }, B: { n: 6, k: 2 }, T: { n: 6, k: 5 } } },
      check: sumCheck("A", "B", "T", "1/2", "1/3", "5/6"),
      answerText: "5/6",
      hints: [
        "Look at the size of the pieces on the first two bars. Can you add pieces that are different sizes?",
        "Find a number of parts that both 2 and 3 fit into evenly. Use it on every bar.",
        "Once all three bars have the same number of parts, count the shaded parts on the first two bars and shade that many on the total bar.",
      ],
      misconceptions: [
        {
          match: "add-tops-and-bottoms",
          when: { type: "equals", of: "bars[T].frac", value: "2/5" },
          hint: "You added the number of parts as if they were amounts. The bottom number tells the size of a piece, so it should not be added. Compare the total bar with the first bar.",
        },
        {
          match: "different-size-pieces",
          when: { type: "relation", left: "bars[A].n", op: "ne", right: "bars[B].n" },
          hint: "The first two bars still have different size pieces. Change the number of parts so every bar matches.",
        },
      ],
      model:
        "Cut every bar into sixths. One half is 3 of the 6 parts, one third is 2 of the 6 parts, so the total shows 3 + 2 = 5 parts out of 6.",
      right: "That works: every bar has the same size pieces, so the shaded parts can be added.",
      supports: {
        ee: supports("Think about 2 parts and 3 parts. What number can both split into?").ee,
        dev: supports("").dev,
        exp: supports("").exp,
        br: {},
      },
      justify: {
        prompt: "Why did you need the same number of parts on all three bars before you could add?",
        options: [
          {
            id: "j1",
            text: "Parts of different sizes cannot be counted together as one kind of piece.",
            ok: true,
          },
          {
            id: "j2",
            text: "Fractions always need exactly six parts.",
            ok: false,
            hint: "Six worked here, but the number of parts depends on the two fractions.",
          },
          {
            id: "j3",
            text: "Equal-size pieces let me add the shaded parts and name the total.",
            ok: true,
          },
          {
            id: "j4",
            text: "The total bar must have fewer parts than the others.",
            ok: false,
            hint: "Compare the number of parts on the three bars again.",
          },
        ],
        min: 2,
        model:
          "You can only add pieces that are the same size. Equal parts let you count shaded parts together and name what you have.",
      },
      explain: explainFor(
        "What changed on the bars, and why did the total bar need the same size pieces?",
        [
          {
            id: "same-size",
            label: "the pieces are the same size",
            any: ["same size", "equal", "match"],
          },
          {
            id: "common",
            label: "a number of parts that works for both fractions",
            any: ["both", "common", "six", "6"],
          },
        ],
      ),
    },
    {
      id: "t2",
      prompt:
        "A water bottle holds two thirds of a liter of juice. A cup holds one fourth of a liter. Show the amounts and the total on the bars.",
      goal: "Same number of parts on all three bars, both amounts shaded, and the total shaded",
      setup: {
        bars: [
          { id: "A", label: "Bottle (two thirds liter)", nMin: 2, nMax: 12, n: 3 },
          { id: "B", label: "Cup (one fourth liter)", nMin: 2, nMax: 12, n: 4 },
          { id: "T", label: "Total juice", nMin: 2, nMax: 12, n: 2 },
        ],
      },
      start: { bars: { A: { n: 3, k: 0 }, B: { n: 4, k: 0 }, T: { n: 2, k: 0 } } },
      target: { bars: { A: { n: 12, k: 8 }, B: { n: 12, k: 3 }, T: { n: 12, k: 11 } } },
      check: sumCheck("A", "B", "T", "2/3", "1/4", "11/12"),
      answerText: "11/12",
      hints: [
        "The two bars are cut into different numbers of parts. What do you have to do first?",
        "List the multiples of 3 and the multiples of 4. Find the first one they share.",
        "Use that shared number of parts on every bar, then shade each amount and count the total.",
      ],
      misconceptions: [
        {
          match: "add-tops-and-bottoms",
          when: { type: "equals", of: "bars[T].frac", value: "3/7" },
          hint: "That total is smaller than the bottle alone. Compare it with the first bar: can a total be less than one of its parts?",
        },
        {
          match: "different-size-pieces",
          when: { type: "relation", left: "bars[A].n", op: "ne", right: "bars[B].n" },
          hint: "The first two bars still have different size pieces. Change them so they match.",
        },
      ],
      model:
        "Cut every bar into twelfths. Two thirds is 8 of 12 parts and one fourth is 3 of 12 parts, so the total is 8 + 3 = 11 parts of 12.",
      right: "Right: the pieces match, so adding the shaded parts is meaningful.",
      supports: {
        ee: supports("Count by threes and by fours. Which number do you say in both lists?").ee,
        dev: supports("").dev,
        exp: supports("").exp,
        br: {},
      },
      explain: explainFor("Why did the bars have to change before you could find the total?", [
        {
          id: "multiple",
          label: "a shared number of parts (a common multiple)",
          any: ["twelve", "12", "common", "both", "multiple"],
        },
        {
          id: "same-size",
          label: "the pieces are the same size",
          any: ["same size", "equal", "match"],
        },
      ]),
    },
    {
      id: "t3",
      prompt:
        "Three eighths of a pan of cornbread is left, and a neighbor brings one fourth of a pan. Show the amounts and the total on the bars.",
      goal: "Same number of parts on all three bars, both amounts shaded, and the total shaded",
      setup: {
        bars: [
          { id: "A", label: "Left over (three eighths pan)", nMin: 2, nMax: 12, n: 8 },
          { id: "B", label: "Neighbor (one fourth pan)", nMin: 2, nMax: 12, n: 4 },
          { id: "T", label: "Total cornbread", nMin: 2, nMax: 12, n: 2 },
        ],
      },
      start: { bars: { A: { n: 8, k: 0 }, B: { n: 4, k: 0 }, T: { n: 2, k: 0 } } },
      target: { bars: { A: { n: 8, k: 3 }, B: { n: 8, k: 2 }, T: { n: 8, k: 5 } } },
      check: sumCheck("A", "B", "T", "3/8", "1/4", "5/8"),
      answerText: "5/8",
      hints: [
        "One of these bars already has pieces that the other could be cut into. Which one?",
        "Four parts can each be split in half. How many parts would that make?",
        "Keep the bar that is already cut as it is, and cut the others to match it.",
      ],
      misconceptions: [
        {
          match: "add-tops-and-bottoms",
          when: { type: "equals", of: "bars[T].frac", value: "4/12" },
          hint: "Adding the parts and adding the shaded counts treats the bottom number like an amount. Look at the sizes of the pieces instead.",
        },
        {
          match: "different-size-pieces",
          when: { type: "relation", left: "bars[A].n", op: "ne", right: "bars[B].n" },
          hint: "The bars still show different size pieces. Make them match before you shade the total.",
        },
      ],
      model:
        "Fourths can be cut in half to make eighths: one fourth is 2 of 8 parts. Three eighths plus two eighths is 5 parts of 8.",
      right:
        "Yes: you only had to change one fraction, because one denominator fits inside the other.",
      supports: {
        ee: supports("Cut each fourth in half. How many parts are there now?").ee,
        dev: supports("").dev,
        exp: supports("").exp,
        br: {},
      },
      explain: explainFor(
        "What did you change, and what stayed the same, when you made the pieces match?",
        [
          {
            id: "changed",
            label: "one fraction was rewritten with smaller pieces",
            any: ["half", "split", "cut", "eighth", "8"],
          },
          {
            id: "amount",
            label: "the amount stayed the same",
            any: ["same amount", "same", "still"],
          },
        ],
      ),
    },
    {
      id: "t4",
      prompt:
        "Dev says that one third plus one fourth equals two sevenths because 1 + 1 = 2 and 3 + 4 = 7. Build the real total on the bars to test his idea.",
      goal: "Show the real total on the bars and compare it to Dev's answer",
      setup: {
        bars: [
          { id: "A", label: "One third", nMin: 2, nMax: 12, n: 3 },
          { id: "B", label: "One fourth", nMin: 2, nMax: 12, n: 4 },
          { id: "T", label: "Real total", nMin: 2, nMax: 12, n: 7 },
        ],
      },
      start: { bars: { A: { n: 3, k: 0 }, B: { n: 4, k: 0 }, T: { n: 7, k: 2 } } },
      target: { bars: { A: { n: 12, k: 4 }, B: { n: 12, k: 3 }, T: { n: 12, k: 7 } } },
      check: sumCheck("A", "B", "T", "1/3", "1/4", "7/12"),
      answerText: "7/12",
      hints: [
        "Dev's bar is already shaded. Compare it to the first bar by itself: is his total smaller than one of the parts?",
        "To add, the pieces must be the same size. Which number of parts works for both a third and a fourth?",
        "Use that number of parts on all three bars and add the shaded parts instead of adding the denominators.",
      ],
      misconceptions: [
        {
          match: "dev-adds-denominators",
          when: { type: "equals", of: "bars[T].frac", value: "2/7" },
          hint: "That is Dev's answer. Compare it with the bar for one third alone: is the total larger or smaller?",
        },
        {
          match: "different-size-pieces",
          when: { type: "relation", left: "bars[A].n", op: "ne", right: "bars[B].n" },
          hint: "The first two bars still show different size pieces. Match them first.",
        },
      ],
      model:
        "Twelfths work for both. One third is 4 twelfths and one fourth is 3 twelfths, so the total is 4 + 3 = 7 twelfths. Dev's two sevenths is smaller than one third alone.",
      right: "You tested the claim with the bars: the real total is larger than Dev's answer.",
      supports: {
        ee: supports("Is two sevenths bigger or smaller than one third alone? Check on the bars.")
          .ee,
        dev: supports("").dev,
        exp: supports("").exp,
        br: {},
      },
      justify: {
        prompt: "Which reasons show that Dev's answer cannot be right?",
        options: [
          {
            id: "j1",
            text: "A total cannot be smaller than one of the amounts being added.",
            ok: true,
          },
          {
            id: "j2",
            text: "The bars for thirds and fourths have different size pieces, so the denominators are not amounts to add.",
            ok: true,
          },
          {
            id: "j3",
            text: "Dev should have multiplied the numerators.",
            ok: false,
            hint: "The problem asks for a total of two amounts, which is addition.",
          },
          {
            id: "j4",
            text: "Adding is always wrong for fractions.",
            ok: false,
            hint: "You added shaded parts on the bars and got a total.",
          },
        ],
        min: 2,
        model:
          "Two sevenths is smaller than one third, so it cannot be a total that includes one third. The bottoms name piece sizes, not amounts.",
      },
      explain: explainFor(
        "Explain to Dev, in your own words, what went wrong and how the bars show it.",
        [
          {
            id: "size",
            label: "the denominators name the size of the pieces",
            any: ["size", "piece", "parts"],
          },
          {
            id: "smaller",
            label: "the total is smaller than one of the amounts",
            any: ["smaller", "less", "bigger", "larger"],
          },
        ],
        "error",
      ),
    },
  ],
  reflection: {
    prompt:
      "When you add fractions with unlike denominators, what do you change first, and what must stay true about the amount?",
    frames: {
      ee: ["First I change the ___.", "The amount stays the ___."],
      dev: [
        "I first make the pieces the same size by ___.",
        "The amount stays the same because ___.",
      ],
      exp: [
        "Before adding, I rewrite each fraction so that ___; the value of each fraction stays the same because ___.",
      ],
      br: [
        "I rewrite each fraction with a shared denominator, which keeps its value because both parts are scaled by the same factor, and then add.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

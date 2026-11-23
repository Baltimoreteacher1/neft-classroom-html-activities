// Concept Builder: ratio table lab (grade 6 math). All arithmetic is exact; targets were recomputed by hand and by the validator.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

export default {
  id: "g6-ratio-table-lab",
  engine: "concept-builder",
  kind: "ratio-table",
  title: "Ratio table lab: paint, fertilizer and equivalent rows",
  grade: "6",
  band: "6-8",
  subject: "math",
  lessonId: "g6-math-ratios-and-rates",
  standards: ["6.RP.A.1", "6.RP.A.3"],
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u2",
    note: "Matches the Ratios & Rates unit in the BCPSS curriculum seed; tasks are original.",
  },
  vocabIds: [
    "g6-math-ratios-and-rates:ratio-table",
    "g6-math-ratios-and-rates:equivalent-ratios",
    "g6-math-ratios-and-rates:unit-rate",
  ],
  minutes: 20,
  intro:
    "A ratio table lists equivalent ratios. You will build rows by scaling, watch the linked tape diagram, and then say what changed and why.",
  model: {
    context: "Sky-blue paint is made from 2 cups of blue paint for every 3 cups of white paint.",
    columns: ["Blue (cups)", "White (cups)"],
    start: [["2", "3"]],
    maxRows: 8,
    rateLabel: "cups of white per 1 cup of blue",
  },
  tasks: [
    {
      id: "t1-scale-up",
      prompt: "Make a row for 10 cups of blue paint that keeps the same sky-blue color.",
      goal: "A row with 10 cups of blue that is the same mixture",
      target: {
        rows: [
          { a: "2", b: "3" },
          { a: "10", b: "15", via: { from: 0, k: "5" } },
        ],
        sel: 1,
      },
      check: { type: "equals", of: "byFirst[10]", value: "15" },
      answerText: "15",
      hints: [
        "Look at how the blue cups in the first row become the blue cups you want. What did you multiply by?",
        "Whatever you do to the blue cups, you must do to the white cups.",
        "Find the number that takes 2 to 10. Use that same number on the white cups.",
      ],
      misconceptions: [
        {
          match: "additive",
          when: { type: "equals", of: "byFirst[10]", value: "11" },
          hint: "Blue grew by 8 cups. Did white grow by 8, and does adding the same amount keep the same comparison between the colors?",
          model:
            "Adding the same number to both quantities changes the mixture. Multiplying both quantities by the same number keeps it.",
        },
        {
          match: "different-rate",
          when: { type: "equals", of: "proportional", value: "false" },
          hint: "The table marks one of your rows as a different rate. Compare it with the first row.",
        },
      ],
      model:
        "10 is 5 times as many blue cups as 2, so use 5 times as many white cups. 5 times 3 is 15, so the row is 10 blue and 15 white.",
      right: "That row keeps the same mixture.",
      supports: {
        ee: {
          frames: ["Blue goes from 2 to ___. White goes from 3 to ___."],
          wordBank: ["times", "same number", "row", "blue", "white"],
          directions: "Use Add row. Choose times and type the number. Look at both columns.",
        },
        dev: {
          frames: ["I multiplied both columns by ___ because ___."],
          wordBank: ["multiply", "same number"],
        },
        exp: { frames: ["Both quantities were multiplied by ___, so the mixture stays ___."] },
        br: {},
      },
      explain: {
        prompt: "What changed in the table, and why did white have to change the same way?",
        frames: fr(
          ["Blue changed from ___ to ___.", "White changed from ___ to ___."],
          ["I multiplied ___ by ___ and ___ by ___ because ___."],
          [
            "Because blue was multiplied by ___, white had to be multiplied by ___ so the mixture stays the same.",
          ],
          [
            "Scaling both quantities by one factor preserves the relationship, so the new row is equivalent to the first.",
          ],
        ),
        mustMention: [
          {
            id: "multiplier",
            label: "the number you multiplied by",
            any: ["times", "multipl", "factor", "scale"],
          },
        ],
      },
    },
    {
      id: "t2-unit-rate",
      prompt: "Find how many cups of white paint go with exactly 1 cup of blue paint.",
      goal: "A row where blue is 1 cup",
      target: {
        rows: [
          { a: "2", b: "3" },
          { a: "1", b: "3/2", via: { from: 0, k: "1/2" } },
        ],
        sel: 1,
      },
      check: { type: "equals", of: "byFirst[1]", value: "3/2" },
      answerText: "3/2",
      hints: [
        "To go from 2 blue cups down to 1 blue cup, do you multiply or divide?",
        "Cut the blue cups in half. Do exactly the same to the white cups.",
        "Half of 3 is not a whole number, so write the white amount as a fraction or mixed number.",
      ],
      misconceptions: [
        {
          match: "inverted",
          when: { type: "equals", of: "bySecond[1]", value: "2/3" },
          hint: "That row has 1 cup of white. The task asks for the row with 1 cup of blue.",
          model:
            "A unit rate depends on which quantity is 'per 1'. Here the quantity that equals 1 is blue.",
        },
      ],
      model:
        "Divide both numbers in the first row by 2. Blue is 1 cup, and white is 3 divided by 2, which is one and a half cups. The unit rate is one and a half cups of white per cup of blue.",
      right: "That is the unit rate for white per blue.",
      supports: {
        ee: {
          frames: ["Blue goes from 2 to ___. White goes from 3 to ___."],
          wordBank: ["divide", "half", "fraction", "per 1"],
          directions:
            "Use Add row and choose a number that makes the blue become 1. Fractions are allowed.",
        },
        dev: {
          frames: ["I divided both numbers by ___, so the white is ___ for 1 blue."],
          wordBank: ["divide", "unit rate"],
        },
        exp: {
          frames: [
            "The unit rate is ___ cups of white per 1 cup of blue because I divided both by ___.",
          ],
        },
        br: {},
      },
      explain: {
        prompt: "What changed in the table, and what does the white number in this row tell you?",
        frames: fr(
          ["Blue changed from 2 to 1.", "White changed from 3 to ___."],
          ["I divided both by ___, so each cup of blue goes with ___ cups of white."],
          [
            "The unit rate is ___ cups of white per cup of blue, because dividing both quantities by ___ keeps the mixture the same.",
          ],
          [
            "Dividing by the blue amount gives the amount of white for one unit of blue, which is the unit rate.",
          ],
        ),
        mustMention: [
          {
            id: "per-one",
            label: "the amount for 1 cup",
            any: ["per", "each", "for 1", "one cup", "every"],
          },
        ],
      },
    },
    {
      id: "t3-start-from-white",
      prompt:
        "A big batch uses 18 cups of white paint. Make a row that shows how many cups of blue go with it.",
      goal: "A row with 18 cups of white that is the same mixture",
      target: {
        rows: [
          { a: "2", b: "3" },
          { a: "12", b: "18", via: { from: 0, k: "6" } },
        ],
        sel: 1,
      },
      check: { type: "equals", of: "bySecond[18]", value: "12" },
      answerText: "12",
      hints: [
        "This time the white cups are the amount you know. Which column do you start from?",
        "How many times as many as 3 white cups is 18 white cups?",
        "Use that same number to scale the blue cups.",
      ],
      misconceptions: [
        {
          match: "additive",
          when: { type: "equals", of: "bySecond[18]", value: "17" },
          hint: "White grew by 15 cups. Does giving blue the same 15 cups keep the same comparison between the colors?",
        },
      ],
      model:
        "18 is 6 times as many white cups as 3, so multiply the blue cups by 6 too. 6 times 2 is 12, so the row is 12 blue and 18 white.",
      right: "That keeps the sky-blue mixture.",
      supports: {
        ee: {
          frames: ["White goes from 3 to 18. I multiply by ___. Blue goes from 2 to ___."],
          wordBank: ["times", "same number", "scale"],
          directions:
            "Add a row by multiplying the first row. Check that the white column says 18.",
        },
        dev: {
          frames: ["White was multiplied by ___, so blue is multiplied by ___."],
          wordBank: ["scale", "factor"],
        },
        exp: { frames: ["The scale factor from the first row is ___, so blue becomes ___."] },
        br: {},
      },
      explain: {
        prompt: "What changed in the table, and how did you decide what to multiply by?",
        frames: fr(
          ["White changed from 3 to 18.", "Blue changed from 2 to ___."],
          ["I found that ___ times 3 is 18, so I multiplied blue by ___."],
          [
            "I found the scale factor by comparing the white amounts, then applied it to blue so the mixture stays the same.",
          ],
          [
            "The scale factor is determined by whichever quantity is known; applying it to both columns preserves the ratio.",
          ],
        ),
        mustMention: [
          { id: "factor", label: "the scale factor", any: ["times", "multipl", "factor", "scale"] },
        ],
      },
    },
    {
      id: "t4-fertilizer",
      setup: {
        context:
          "A garden club mixes 4 scoops of powder with 10 liters of water to make plant food.",
        columns: ["Powder (scoops)", "Water (liters)"],
        start: [["4", "10"]],
        rateLabel: "liters of water per 1 scoop of powder",
      },
      prompt:
        "Make a row that uses exactly 15 liters of water and keeps the plant food the same strength.",
      goal: "A row with 15 liters of water that is the same mixture",
      target: {
        rows: [
          { a: "4", b: "10" },
          { a: "6", b: "15", via: { from: 0, k: "3/2" } },
        ],
        sel: 1,
      },
      check: { type: "equals", of: "bySecond[15]", value: "6" },
      answerText: "6 scoops",
      hints: [
        "Water goes from 10 to 15. Is there a whole number that takes 10 to 15 in one step?",
        "You can use a factor that is not a whole number, or make a smaller row first and then scale it.",
        "Try cutting the first row in half. Then use a whole number to reach the water amount you want.",
      ],
      misconceptions: [
        {
          match: "additive",
          when: { type: "equals", of: "bySecond[15]", value: "9" },
          hint: "Water grew by 5 liters. Did powder grow by the same 5 scoops, and does that keep the strength the same?",
        },
      ],
      model:
        "Halve the first row to get 2 scoops with 5 liters. Then multiply by 3 to get 6 scoops with 15 liters. Both numbers were scaled by the same amount each time.",
      right: "That row keeps the plant food the same strength.",
      justify: {
        prompt:
          "Which reasons show that your new row has the same strength as 4 scoops with 10 liters?",
        options: [
          {
            id: "j1",
            text: "Both numbers in the row were multiplied by the same factor.",
            ok: true,
          },
          {
            id: "j2",
            text: "Powder went up by 2 and water went up by 5.",
            ok: false,
            hint: "That describes the change, but adding different amounts does not show the strength is the same.",
          },
          {
            id: "j3",
            text: "Each row uses the same amount of water for 1 scoop of powder.",
            ok: true,
          },
          {
            id: "j4",
            text: "15 liters is more than 10 liters, so there is more plant food.",
            ok: false,
            hint: "More water alone does not tell you whether the strength changed.",
          },
        ],
        min: 2,
        model:
          "A new row is equivalent when both quantities were scaled by one factor, which also means the water per scoop is unchanged.",
      },
      supports: {
        ee: {
          frames: ["Powder goes from 4 to ___. Water goes from 10 to 15."],
          wordBank: ["half", "times", "scale", "scoops", "liters"],
          directions: "Make a smaller row first. Then multiply that row. Check the water column.",
        },
        dev: {
          frames: ["I first ___ the row, then I ___ it to get 15 liters."],
          wordBank: ["divide", "multiply"],
        },
        exp: {
          frames: ["I scaled the first row by ___ so the powder is ___ and the water is 15."],
        },
        br: {},
      },
      explain: {
        prompt:
          "What changed from the first row to your new row, and why is the strength the same?",
        frames: fr(
          ["Powder changed from 4 to ___.", "Water changed from 10 to 15."],
          ["I multiplied both numbers by ___ because ___."],
          [
            "Both quantities were scaled by ___, so the water per scoop is still ___ and the strength is the same.",
          ],
          [
            "Scaling both quantities by the same factor, here three halves, preserves the water per scoop.",
          ],
        ),
        mustMention: [
          { id: "same-factor", label: "the same factor for both", any: ["same", "both", "equal"] },
        ],
      },
    },
  ],
  reflection: {
    prompt: "What is one thing you check every time you add a row to a ratio table?",
    frames: fr(
      ["I check that ___.", "I look at ___ and ___."],
      ["I check that I ___ both numbers by the same ___."],
      ["Before I add a row, I make sure I used ___ on both quantities because ___."],
      ["I verify each row by confirming the unit rate does not change."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

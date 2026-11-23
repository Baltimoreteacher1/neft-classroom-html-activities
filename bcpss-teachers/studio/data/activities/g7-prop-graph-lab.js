// concept-builder / graph-line: build lines for stories, tell proportional from non-proportional, and read the unit rate from the table. Grade 7 math, 7.RP.A.2.
const curriculum = {
  status: "district-referenced",
  unitId: "g7-math-u1",
  program: "Reveal Math",
  note: "7.RP.A.2 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
};

export default {
  id: "g7-prop-graph-lab",
  engine: "concept-builder",
  kind: "graph-line",
  title: "Graph Lab: Peaches, Taxis and Plans",
  grade: "7",
  band: "6-8",
  subject: "math",
  lessonId: "g7-math-proportional-relationships-graphs",
  standards: ["7.RP.A.2", "7.RP.A.2a", "7.RP.A.2b", "7.RP.A.2d"],
  curriculum,
  vocabIds: [
    "proportional-relationship",
    "constant-of-proportionality",
    "unit-rate",
    "origin",
    "non-proportional",
    "ordered-pair",
    "justify",
  ],
  minutes: 16,
  intro:
    "Drag the two points to build a line. The table under the graph updates as you move them. Decide which lines are proportional, read the unit rate from the table, then explain what changed and why.",
  model: {
    xLabel: "Pounds of peaches",
    yLabel: "Cost in dollars",
    xmin: 0,
    xmax: 10,
    ymin: 0,
    ymax: 40,
    grid: 1,
    rateLabel: "dollars added for 1 more pound",
    points: [
      { id: "A", label: "Point A", at: ["1", "2"] },
      { id: "B", label: "Point B", at: ["3", "4"] },
    ],
    tableXs: ["0", "1", "2", "3", "4", "5", "6"],
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "A farm stand sells peaches at 3 dollars per pound. There is no bag fee. Build the line that shows the cost y in dollars for x pounds.",
      goal: "A line that costs 0 dollars for 0 pounds and adds the same amount for each pound",
      target: { pts: { A: ["0", "0"], B: ["5", "15"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "slope", value: "3" },
          { type: "equals", of: "intercept", value: "0" },
        ],
      },
      answerText: "y = 3x",
      hints: [
        "Start with the table. What should the cost be for a purchase of 0 pounds?",
        "The price per pound is the same for every pound. Compare the table rows for 1 pound and 2 pounds.",
        "Put Point A where the line begins on the vertical axis, then move Point B until the table grows by the price in the story for each pound.",
      ],
      misconceptions: [
        {
          match: "adds-a-fee",
          when: { type: "not", check: { type: "equals", of: "intercept", value: "0" } },
          hint: "Your line says the peaches already cost something at 0 pounds. Does the story mention a fee? Check the table at 0 pounds.",
          model:
            "With no bag fee, 0 pounds cost 0 dollars, so the line touches the corner where both axes are 0. A fee would make the line start higher up.",
        },
        {
          match: "price-too-low",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "intercept", value: "0" },
              { type: "relation", left: "slope", op: "lt", right: { value: "3" } },
            ],
          },
          hint: "Your peaches cost less per pound than the story says. Look at how much the table adds from one pound to the next.",
        },
        {
          match: "price-too-high",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "intercept", value: "0" },
              { type: "relation", left: "slope", op: "gt", right: { value: "3" } },
            ],
          },
          hint: "Your peaches cost more per pound than the story says. Look at how much the table adds from one pound to the next.",
        },
      ],
      model:
        "A different stand sells plums at 2 dollars per pound with no fee. The line starts at 0 and the table reads 0, 2, 4, 6: it goes up by 2 each pound, so the equation is y = 2x and the line passes through the origin.",
      right:
        "Yes. The line starts at the origin and the table grows by the same amount for each pound.",
      supports: {
        ee: {
          directions:
            "Read the story. Find where the line starts on the vertical axis. Then find how much it goes up for each pound.",
          frames: ["At 0 pounds the cost is ___.", "Each pound costs ___ dollars."],
          wordBank: ["pound", "dollar", "starts", "each", "same", "fee"],
        },
        dev: {
          frames: ["When x is 0, y is ___.", "Every time x goes up by 1, y goes up by ___."],
          wordBank: ["unit rate", "table", "line"],
        },
        exp: { frames: ["The constant of proportionality is ___ dollars per pound because ___."] },
        br: {},
      },
      explain: {
        prompt:
          "What changed in the table and on the graph when you made the line match the story, and why did it change that way?",
        frames: {
          ee: ["The line starts at ___.", "The table shows ___ dollars for 1 pound."],
          dev: [
            "As the pounds go up, the cost ___ because ___.",
            "The line passes through the origin because ___.",
          ],
          exp: [
            "When I moved Point B, the table changed so that ___, which matches the story because ___.",
          ],
          br: [
            "The line shows a proportional relationship because ___, and the table confirms it.",
          ],
        },
        mustMention: [
          {
            id: "rate",
            label: "the amount added for each pound",
            any: ["each pound", "every pound", "per pound", "rate", "goes up by", "adds", "unit"],
          },
          {
            id: "zero",
            label: "what happens at 0 pounds or the origin",
            any: ["origin", "zero", "0 pounds", "starts at 0", "corner"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said what changed in the table or on the graph." },
          { id: "c2", label: "I used pounds and dollars, not just x and y." },
          { id: "c3", label: "I said why it changed using the story." },
        ],
      },
    },
    {
      id: "t2",
      prompt:
        "A taxi charges a 2 dollar starting fee plus 3 dollars for each mile. Build the line that shows the cost y in dollars for x miles.",
      goal: "A line that costs the starting fee at 0 miles and adds the same amount for each mile",
      setup: {
        xLabel: "Miles",
        yLabel: "Cost in dollars",
        rateLabel: "dollars added for 1 more mile",
      },
      target: { pts: { A: ["0", "2"], B: ["4", "14"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "slope", value: "3" },
          { type: "equals", of: "intercept", value: "2" },
        ],
      },
      answerText: "y = 3x + 2",
      hints: [
        "Think about the ride that goes 0 miles. Does it cost nothing?",
        "The line should start at the cost of the starting fee and then rise by the same amount for each mile.",
        "Put Point A where the line begins on the vertical axis. Then check that the table adds the same amount for each mile.",
      ],
      misconceptions: [
        {
          match: "ignores-the-fee",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "intercept", value: "0" },
              { type: "equals", of: "slope", value: "3" },
            ],
          },
          hint: "Your line starts at the corner, so a 0-mile ride is free. Does the taxi story say that?",
        },
        {
          match: "fee-is-the-rate",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "slope", value: "2" },
              { type: "equals", of: "intercept", value: "3" },
            ],
          },
          hint: "Check which number is the fee and which number is added for each mile. Look at the table at 0 miles and 1 mile.",
        },
      ],
      model:
        "A different company charges a 5 dollar fee plus 4 dollars each mile. Its table reads 5, 9, 13 for 0, 1, 2 miles, so the line starts at 5 and rises 4 for each mile. It does not pass through the origin.",
      right: "Yes. The line starts at the fee and rises by the same amount for each mile.",
      supports: {
        ee: {
          directions:
            "Look at the table at 0 miles. The taxi charges a fee even before it moves. Then find how much each mile adds.",
          frames: ["At 0 miles the cost is ___ dollars.", "Each mile adds ___ dollars."],
          wordBank: ["fee", "mile", "start", "each", "adds"],
        },
        dev: {
          frames: ["When x is 0, y is ___, so the line starts at ___.", "Each mile adds ___."],
          wordBank: ["starting fee", "rate"],
        },
        exp: { frames: ["Because the cost at 0 miles is ___, the line ___ the origin."] },
        br: {},
      },
      justify: {
        prompt:
          "Which reasons show that this taxi relationship is not proportional? Choose all that apply.",
        options: [
          {
            id: "j1",
            text: "At 0 miles the cost is 2 dollars, so the line does not pass through the origin.",
            ok: true,
          },
          {
            id: "j2",
            text: "The cost divided by the miles is not the same in every row of the table.",
            ok: true,
          },
          {
            id: "j3",
            text: "The line is straight, so the relationship must be proportional.",
            ok: false,
            hint: "A straight line is only one of the two tests. A proportional line must also pass through the origin.",
          },
          {
            id: "j4",
            text: "The cost goes up as the miles go up, so the relationship must be proportional.",
            ok: false,
            hint: "Many relationships go up together. Ask what the cost is when the miles are 0.",
          },
        ],
        min: 2,
        model:
          "To test proportionality, ask what happens at 0 and whether the ratio of y to x is the same in every row. A fee at 0 and changing ratios both show the relationship is not proportional.",
      },
      explain: {
        prompt:
          "Compare this taxi line with the peach line. How are they alike and how are they different, and why is only one proportional?",
        frames: {
          ee: ["Both lines go ___.", "The taxi line starts at ___."],
          dev: [
            "They are alike because ___, but different because ___.",
            "Only the peach line is proportional because ___.",
          ],
          exp: [
            "Although both lines rise by the same amount each unit, only the ___ line passes through the origin, so ___.",
          ],
          br: [
            "Both relationships have a constant rate of change, but proportionality also requires ___, which the taxi line lacks because ___.",
          ],
        },
        mustMention: [
          {
            id: "alike",
            label: "one way the lines are alike",
            any: ["alike", "both", "same", "straight", "rise", "goes up"],
          },
          {
            id: "diff",
            label: "the starting fee or origin",
            any: ["fee", "origin", "start", "zero", "0"],
          },
        ],
      },
    },
    {
      id: "t3",
      prompt:
        "A taste test showed that 4 pounds of apples cost 20 dollars. That measurement is the diamond on the graph. The relationship is proportional. Build the line and read the cost of 1 pound in the table.",
      goal: "A line from 0 dollars that passes through the diamond, with the cost of 1 pound in the table",
      setup: { given: [{ id: "G", label: "Apples at 4 pounds", at: ["4", "20"] }] },
      target: { pts: { A: ["0", "0"], B: ["4", "20"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "passes[G]", value: "true" },
          { type: "equals", of: "intercept", value: "0" },
          { type: "equals", of: "table[1]", value: "5" },
        ],
      },
      answerText: "y = 5x",
      hints: [
        "The diamond is a measurement, so the line must go through it. The relationship is proportional, so it also has to pass through a second special point.",
        "A proportional line passes through the origin. Make sure the line includes both the origin and the diamond.",
        "After the line is built, read the table row for 1 pound. That row is the unit rate.",
      ],
      misconceptions: [
        {
          match: "misses-the-measurement",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "intercept", value: "0" },
              { type: "equals", of: "passes[G]", value: "false" },
            ],
          },
          hint: "Your line starts at the right place but does not go through the diamond. Ask whether it climbs too quickly or too slowly.",
        },
        {
          match: "ignores-the-origin",
          when: {
            type: "all",
            checks: [
              { type: "not", check: { type: "equals", of: "intercept", value: "0" } },
              { type: "equals", of: "passes[G]", value: "true" },
            ],
          },
          hint: "Your line reaches the diamond, but a proportional relationship must cost nothing for 0 pounds. Check the table at 0 pounds.",
        },
      ],
      model:
        "Different test: 6 pounds of pears cost 9 dollars, and the relationship is proportional. The line goes through the origin and the measured point, and the table at 1 pound shows the price of one pound.",
      right:
        "Yes. The line goes through the diamond and the origin, and the table shows the cost of 1 pound.",
      supports: {
        ee: {
          directions:
            "Look at the diamond. It shows pounds and dollars together. Make the line touch the diamond and start at 0. Then read the row for 1 pound.",
          frames: ["The diamond shows ___ pounds and ___ dollars.", "1 pound costs ___ dollars."],
          wordBank: ["diamond", "measurement", "through", "origin", "one pound"],
        },
        dev: {
          frames: [
            "The line goes through the diamond, so when x is ___, y is ___.",
            "The unit rate is ___ dollars per pound.",
          ],
          wordBank: ["unit rate", "ordered pair", "origin"],
        },
        exp: {
          frames: [
            "Because the line contains the origin and the measured point, the point (1, ___) shows the unit rate.",
          ],
        },
        br: {},
      },
      explain: {
        prompt:
          "What does the point (1, y) in the table tell you about the apples, and how is it connected to the diamond?",
        frames: {
          ee: ["The point (1, ___) means ___.", "The diamond shows ___."],
          dev: [
            "The point at 1 pound shows the cost of ___ pound, which is the unit rate.",
            "I found it by ___.",
          ],
          exp: [
            "The pair for 1 pound is the unit rate because ___, and it matches the diamond since ___.",
          ],
          br: [
            "The ordered pair (1, r) gives the constant of proportionality r, which also equals the diamond's y divided by its x.",
          ],
        },
        mustMention: [
          {
            id: "unit",
            label: "the cost of one pound or unit rate",
            any: ["unit rate", "one pound", "1 pound", "each pound", "per pound", "constant"],
          },
          {
            id: "link",
            label: "the diamond or the measured pair",
            any: ["diamond", "measure", "20", "4 pounds", "divide"],
          },
        ],
      },
    },
    {
      id: "t4",
      prompt:
        "Plan C must cost more per pound than Plan A (the lower diamond) and less per pound than Plan B (the upper diamond). All three are proportional. Build a line for Plan C.",
      goal: "A proportional line that rises faster than Plan A and slower than Plan B",
      setup: {
        given: [
          { id: "PA", label: "Plan A at 4 pounds", at: ["4", "8"] },
          { id: "PB", label: "Plan B at 4 pounds", at: ["4", "16"] },
        ],
      },
      target: { pts: { A: ["0", "0"], B: ["4", "12"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "intercept", value: "0" },
          { type: "relation", left: "slope", op: "gt", right: { value: "2" } },
          { type: "relation", left: "slope", op: "lt", right: { value: "4" } },
        ],
      },
      answerText: "y = 3x",
      hints: [
        "A plan that costs more per pound has more dollars at the same number of pounds. Compare the lines at the same x.",
        "Look at 4 pounds. Where should your line be: below, above or between the two diamonds?",
        "Several lines work. Make sure the line goes through the origin, because Plan C is proportional, and sits between the diamonds at 4 pounds.",
      ],
      misconceptions: [
        {
          match: "not-above-plan-a",
          when: { type: "relation", left: "slope", op: "le", right: { value: "2" } },
          hint: "Your line is not above Plan A's diamond at 4 pounds yet. A plan that costs more per pound has more dollars at the same weight.",
        },
        {
          match: "not-below-plan-b",
          when: { type: "relation", left: "slope", op: "ge", right: { value: "4" } },
          hint: "Your line reaches Plan B's diamond or goes above it at 4 pounds. Plan C must cost less per pound than Plan B.",
        },
      ],
      model:
        "A cheap plan costs 1 dollar per pound and an expensive plan costs 5 dollars per pound. A plan between them must have a constant of proportionality between 1 and 5, such as 3, and its line must still pass through the origin.",
      right:
        "Yes. Your line passes through the origin and sits between the two measurements, so its constant of proportionality is between them.",
      supports: {
        ee: {
          directions:
            "Look at the line at 4 pounds. It must be higher than one diamond and lower than the other, and it must start at 0.",
          frames: ["Plan C costs more than Plan ___.", "Plan C costs less than Plan ___."],
          wordBank: ["more", "less", "higher", "lower", "between", "origin"],
        },
        dev: {
          frames: [
            "At 4 pounds, my line is ___ than Plan A and ___ than Plan B.",
            "My constant of proportionality is between ___ and ___.",
          ],
          wordBank: ["steeper", "flatter", "compare"],
        },
        exp: {
          frames: [
            "My line is steeper than ___ but flatter than ___, so its constant of proportionality is between ___ and ___.",
          ],
        },
        br: {},
      },
      justify: {
        prompt:
          "Which reasons show that your line is a proportional plan between Plan A and Plan B? Choose all that apply.",
        options: [
          {
            id: "j1",
            text: "At 4 pounds my line is higher than Plan A's diamond and lower than Plan B's diamond.",
            ok: true,
          },
          {
            id: "j2",
            text: "My line passes through the origin, so 0 pounds cost 0 dollars.",
            ok: true,
          },
          {
            id: "j3",
            text: "My line is longer than the other two lines.",
            ok: false,
            hint: "How far a line is drawn does not show what each pound costs.",
          },
          {
            id: "j4",
            text: "My line starts higher on the vertical axis than the others.",
            ok: false,
            hint: "All proportional lines start at the origin, so none of them starts higher.",
          },
        ],
        min: 2,
        model:
          "Compare lines at the same x. A higher point at the same weight means a greater cost per pound, and a proportional line must also pass through the origin.",
      },
      explain: {
        prompt:
          "Use the words steeper and constant of proportionality to explain how you placed your line between the two diamonds.",
        frames: {
          ee: ["My line is steeper than ___.", "My line is flatter than ___."],
          dev: [
            "My line is steeper than Plan A because ___.",
            "The constant of proportionality tells us ___.",
          ],
          exp: [
            "Because the constant of proportionality of Plan C is greater than ___ and less than ___, its line is ___.",
          ],
          br: [
            "A greater constant of proportionality makes a steeper line: Plan C lies between ___ and ___ because ___.",
          ],
        },
        mustMention: [
          {
            id: "steep",
            label: "steeper or flatter",
            any: ["steeper", "flatter", "steep", "flat"],
          },
          {
            id: "k",
            label: "constant of proportionality or cost per pound",
            any: ["constant", "rate", "per pound", "each pound", "unit"],
          },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "How can you tell whether a graph shows a proportional relationship? What would you check first on a new graph?",
    frames: {
      ee: ["I look at where the line ___.", "A proportional line goes through ___."],
      dev: [
        "I check whether the line ___ and whether it passes through ___.",
        "If the line misses the origin, then ___.",
      ],
      exp: [
        "To decide whether a graph is proportional I first check ___ and then ___ because ___.",
      ],
      br: [
        "A graph shows a proportional relationship only when ___ and ___; I would also verify this with the table by ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

// concept-builder / graph-line: build lines from stories and read the linked table. Grade 6 math, 6.EE.C.9.
const curriculum = {
  status: "district-referenced",
  unitId: "g6-math-u5",
  program: "Reveal Math",
  note: "6.EE.C.9 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
};

export default {
  id: "g6-vars-graph-lab",
  engine: "concept-builder",
  kind: "graph-line",
  title: "Graph Lab: Hoses, Barrels and Ages",
  grade: "6",
  band: "6-8",
  subject: "math",
  lessonId: "g6-math-variables-relationships",
  standards: ["6.EE.C.9"],
  curriculum,
  vocabIds: [
    "independent-variable",
    "dependent-variable",
    "rate-of-change",
    "table",
    "graph",
    "equation",
    "steeper",
  ],
  minutes: 14,
  intro:
    "Drag the two points to build a line. The table under the graph updates as you move them. Match each story, read the table, then explain what changed and why.",
  model: {
    xLabel: "Minutes the hose runs",
    yLabel: "Gallons in the barrel",
    xmin: 0,
    xmax: 10,
    ymin: 0,
    ymax: 40,
    grid: 1,
    rateLabel: "gallons added per 1 minute",
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
        "A hose adds 4 gallons to a rain barrel every minute. The barrel is empty when the hose is turned on. Build the line that shows gallons y after x minutes.",
      goal: "A line that starts at 0 gallons and adds the same amount each minute",
      target: { pts: { A: ["0", "0"], B: ["5", "20"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "slope", value: "4" },
          { type: "equals", of: "intercept", value: "0" },
        ],
      },
      answerText: "y = 4x",
      hints: [
        "Start with the table. What should it show at 0 minutes, when the hose has just been turned on?",
        "The same number of gallons is added every minute. Compare the table row for 1 minute with the row for 2 minutes.",
        "Put Point A where the line begins on the y-axis. Then move Point B until the table grows by the amount in the story each minute.",
      ],
      misconceptions: [
        {
          match: "starts-full",
          when: { type: "not", check: { type: "equals", of: "intercept", value: "0" } },
          hint: "Your line says the barrel already has water in it at minute 0. Does the story say that? Check the table at 0 minutes.",
          model:
            "A barrel that is empty at the start has 0 gallons when x is 0, so the line touches the corner where both axes are 0.",
        },
        {
          match: "rate-too-small",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "intercept", value: "0" },
              { type: "relation", left: "slope", op: "lt", right: { value: "4" } },
            ],
          },
          hint: "Your barrel fills more slowly than the story says. Look at how much the table adds from one minute to the next.",
        },
        {
          match: "rate-too-big",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "intercept", value: "0" },
              { type: "relation", left: "slope", op: "gt", right: { value: "4" } },
            ],
          },
          hint: "Your barrel fills faster than the story says. Look at how much the table adds from one minute to the next.",
        },
      ],
      model:
        "Different hose: it adds 3 gallons every minute from an empty barrel. The line starts at 0 and the table reads 0, 3, 6, 9: it goes up by 3 each minute, so the equation is y = 3x.",
      right: "Yes. The line starts at 0 and the table grows by the same amount each minute.",
      supports: {
        ee: {
          directions:
            "Read the story. Find where the line starts on the y-axis. Then find how much it goes up each minute.",
          frames: ["The barrel starts with ___ gallons.", "Each minute the gallons go up by ___."],
          wordBank: ["minute", "gallon", "starts", "goes up", "each", "same"],
        },
        dev: {
          frames: ["When x is 0, y is ___.", "Every time x goes up by 1, y goes up by ___."],
          wordBank: ["rate", "table", "line"],
        },
        exp: { frames: ["The rate of change is ___ gallons per minute because ___."] },
        br: {},
      },
      explain: {
        prompt:
          "What changed in the table and on the graph when you made the line match the story, and why did it change that way?",
        frames: {
          ee: ["The line goes up ___.", "The table shows ___ gallons."],
          dev: [
            "As the minutes go up, the gallons ___ because ___.",
            "The line starts at ___ because ___.",
          ],
          exp: [
            "When I moved Point B, the table changed so that ___, which matches the story because ___.",
          ],
          br: ["Each representation shows the same relationship: ___."],
        },
        mustMention: [
          {
            id: "rate",
            label: "the amount added each minute",
            any: [
              "each minute",
              "every minute",
              "per minute",
              "rate",
              "goes up by",
              "increase",
              "adds",
            ],
          },
          { id: "vars", label: "minutes or gallons", any: ["minute", "gallon", "x ", "y "] },
        ],
        criteria: [
          { id: "c1", label: "I said what changed in the table or on the graph." },
          { id: "c2", label: "I used minutes and gallons, not just x and y." },
          { id: "c3", label: "I said why it changed using the story." },
        ],
      },
    },
    {
      id: "t2",
      prompt:
        "Hose B was tested. After 5 minutes it had put 15 gallons into an empty barrel. That measurement is the diamond on the graph. Build the line for Hose B.",
      goal: "A line from 0 gallons that passes through the diamond",
      setup: { given: [{ id: "G", label: "Hose B at 5 minutes", at: ["5", "15"] }] },
      target: { pts: { A: ["0", "0"], B: ["5", "15"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "passes[G]", value: "true" },
          { type: "equals", of: "intercept", value: "0" },
        ],
      },
      answerText: "y = 3x",
      hints: [
        "The diamond is a measurement, so the line for Hose B must go through it.",
        "Both the empty start and the diamond are on the line. How many gallons in total, over how many minutes?",
        "Find how many gallons Hose B adds in a single minute, then check the table at 1 minute and 2 minutes.",
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
          hint: "Your line starts at the right place but misses the diamond. Ask whether it climbs too quickly or too slowly.",
        },
        {
          match: "ignores-the-start",
          when: {
            type: "all",
            checks: [
              { type: "not", check: { type: "equals", of: "intercept", value: "0" } },
              { type: "equals", of: "passes[G]", value: "true" },
            ],
          },
          hint: "Your line reaches the diamond, but the barrel was empty when the hose started. Check the table at 0 minutes.",
        },
      ],
      model:
        "Different test: Hose E put 12 gallons into an empty barrel in 4 minutes. 12 gallons over 4 minutes is 3 gallons in 1 minute. Hose E has a line through 0 and the measured point.",
      right: "Yes. The line goes through the measurement and starts at 0.",
      supports: {
        ee: {
          directions:
            "Look at the diamond. It shows minutes and gallons together. Make the line touch the diamond and start at 0.",
          frames: [
            "The diamond shows ___ minutes and ___ gallons.",
            "Hose B adds ___ gallons each minute.",
          ],
          wordBank: ["diamond", "measurement", "through", "start", "each minute"],
        },
        dev: {
          frames: [
            "The line goes through the diamond, so when x is ___, y is ___.",
            "The rate is ___ gallons per minute.",
          ],
          wordBank: ["rate of change", "point", "pair"],
        },
        exp: {
          frames: [
            "Because the line passes through the measured point and (0, 0), its rate of change is ___.",
          ],
        },
        br: {},
      },
      explain: {
        prompt:
          "How did the diamond help you decide where to put the points, and what does the table tell you about Hose B?",
        frames: {
          ee: ["The diamond shows ___.", "The table shows ___ at 1 minute."],
          dev: [
            "I knew the line had to go through the diamond because ___.",
            "The table shows that Hose B adds ___ each minute.",
          ],
          exp: [
            "Since the line contains the measured point and starts at 0, the table shows ___, so the rate is ___.",
          ],
          br: ["The measured pair fixes the rate of change at ___, and the table confirms it."],
        },
        mustMention: [
          {
            id: "point",
            label: "the diamond or the measured pair",
            any: ["diamond", "measure", "point", "pair", "15"],
          },
          {
            id: "rate",
            label: "the amount added each minute",
            any: ["each minute", "every minute", "per minute", "rate", "goes up by", "adds"],
          },
        ],
      },
    },
    {
      id: "t3",
      prompt:
        "Your cousin is always 3 years older than you. Let x be your age and y your cousin's age. Build the line that shows how your cousin's age depends on your age.",
      goal: "A line where the cousin is always the same number of years older",
      setup: {
        xLabel: "Your age (years)",
        yLabel: "Cousin's age (years)",
        ymax: 14,
        rateLabel: "years older for each year you get older",
        tableXs: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
      },
      target: { pts: { A: ["0", "3"], B: ["5", "8"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "slope", value: "1" },
          { type: "equals", of: "intercept", value: "3" },
        ],
      },
      answerText: "y = x + 3",
      hints: [
        "Think about the age gap. Does it change as you both have birthdays?",
        "Choose an age for yourself, such as 4. What is your cousin's age? Check that the table shows that pair.",
        "Look at how much your cousin's age changes each time your age goes up by 1 year. Then look at where the line crosses the y-axis.",
      ],
      misconceptions: [
        {
          match: "cousin-ages-faster",
          when: { type: "relation", left: "slope", op: "gt", right: { value: "1" } },
          hint: "Your line makes your cousin gain more years than you in a single year. Does the age gap really grow?",
        },
        {
          match: "same-age",
          when: {
            type: "all",
            checks: [
              { type: "equals", of: "slope", value: "1" },
              { type: "equals", of: "intercept", value: "0" },
            ],
          },
          hint: "A line through the corner says you and your cousin are the same age at every point. Does the story say that?",
        },
      ],
      model:
        "A neighbor is 2 years younger than you: when your age is 5 the neighbor's age is 3. Each year you both get one year older, so the line climbs 1 for every 1 across, but it starts below the corner.",
      right: "Yes. Both ages go up together, and the cousin stays the same number of years older.",
      supports: {
        ee: {
          directions:
            "Pick an age for you. Find your cousin's age in the table. Check that the pairs follow the story.",
          frames: ["When I am ___, my cousin is ___.", "We both get older by ___ each year."],
          wordBank: ["older", "age", "year", "same", "cousin"],
        },
        dev: {
          frames: [
            "The independent variable is ___ and the dependent variable is ___.",
            "When x goes up by 1, y goes up by ___.",
          ],
          wordBank: ["independent variable", "dependent variable", "rate of change"],
        },
        exp: {
          frames: [
            "Even though y is always ___ more than x, the rate of change is ___ because ___.",
          ],
        },
        br: {},
      },
      explain: {
        prompt:
          "Which quantity is the independent variable, which is the dependent variable, and how can you tell from the graph?",
        frames: {
          ee: ["Your age is ___.", "Your cousin's age is ___."],
          dev: [
            "Your age is the independent variable because ___.",
            "Cousin's age depends on ___.",
          ],
          exp: [
            "The independent variable is ___ because ___, and the dependent variable is ___ because its value ___.",
          ],
          br: [
            "Because the cousin's age is determined by yours, ___ is dependent; the graph shows this as ___.",
          ],
        },
        mustMention: [
          {
            id: "ind",
            label: "which variable you choose or start with",
            any: ["independent", "your age", "choose", "x"],
          },
          {
            id: "dep",
            label: "which variable depends on the other",
            any: ["dependent", "depends", "cousin", "y"],
          },
        ],
      },
    },
    {
      id: "t4",
      prompt:
        "Hose C must be faster than Hose B (the lower diamond) but slower than Hose D (the upper diamond). All the barrels start empty. Build a line for Hose C.",
      goal: "A line from 0 gallons that rises faster than Hose B and slower than Hose D",
      setup: {
        given: [
          { id: "HB", label: "Hose B at 5 minutes", at: ["5", "15"] },
          { id: "HD", label: "Hose D at 5 minutes", at: ["5", "25"] },
        ],
      },
      target: { pts: { A: ["0", "0"], B: ["5", "20"] } },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "intercept", value: "0" },
          { type: "relation", left: "slope", op: "gt", right: { value: "3" } },
          { type: "relation", left: "slope", op: "lt", right: { value: "5" } },
        ],
      },
      answerText: "y = 4x",
      hints: [
        "A faster hose puts more water into the barrel in the same amount of time. Compare lines at the same number of minutes.",
        "Look at 5 minutes. Where should your line be: below, above or between the two diamonds?",
        "Several lines work. Make sure it starts at the corner and that the table adds more per minute than Hose B and fewer than Hose D.",
      ],
      misconceptions: [
        {
          match: "not-faster-than-b",
          when: { type: "relation", left: "slope", op: "le", right: { value: "3" } },
          hint: "Your line is not above Hose B's diamond at 5 minutes yet. A faster hose has more gallons at the same time.",
        },
        {
          match: "not-slower-than-d",
          when: { type: "relation", left: "slope", op: "ge", right: { value: "5" } },
          hint: "Your line reaches Hose D's diamond or goes above it at 5 minutes. Hose C must stay lower.",
        },
      ],
      model:
        "A slow pump adds 2 gallons a minute and a fast pump adds 6. A pump between them at 4 minutes must hold more than 8 gallons and fewer than 24, because the speeds are different at the same time.",
      right:
        "Yes. Your line sits between the two measurements, so Hose C is faster than B and slower than D.",
      supports: {
        ee: {
          directions:
            "Look at the line at 5 minutes. It must be higher than one diamond and lower than the other.",
          frames: ["Hose C is faster than Hose ___.", "Hose C is slower than Hose ___."],
          wordBank: ["faster", "slower", "higher", "lower", "between"],
        },
        dev: {
          frames: [
            "At 5 minutes, my line is ___ than Hose B and ___ than Hose D.",
            "A steeper line means ___.",
          ],
          wordBank: ["steeper", "flatter", "compare"],
        },
        exp: {
          frames: [
            "My line is steeper than ___ but flatter than ___, so its rate of change is between ___ and ___.",
          ],
        },
        br: {},
      },
      justify: {
        prompt:
          "Which reasons show your line is faster than Hose B and slower than Hose D? Choose all that apply.",
        options: [
          {
            id: "j1",
            text: "At 5 minutes my line is higher than Hose B's diamond and lower than Hose D's diamond.",
            ok: true,
          },
          {
            id: "j2",
            text: "My table adds more gallons each minute than Hose B and fewer than Hose D.",
            ok: true,
          },
          {
            id: "j3",
            text: "My line is longer than the other two lines.",
            ok: false,
            hint: "How far a line is drawn does not show how fast the barrel fills.",
          },
          {
            id: "j4",
            text: "My line starts higher on the y-axis than the others.",
            ok: false,
            hint: "All three barrels start empty, so the lines start in the same place.",
          },
        ],
        min: 2,
        model:
          "Compare lines at the same x. A higher point at the same time means more gallons, which means a faster fill rate.",
      },
      explain: {
        prompt:
          "Use the words steeper and rate of change to explain how you placed your line between the two diamonds.",
        frames: {
          ee: ["My line is steeper than ___.", "My line is flatter than ___."],
          dev: ["My line is steeper than Hose B because ___.", "The rate of change tells us ___."],
          exp: [
            "Because the rate of change of Hose C is greater than ___ and less than ___, its line is ___.",
          ],
          br: [
            "A line with a greater rate of change is steeper: Hose C lies between ___ and ___ because ___.",
          ],
        },
        mustMention: [
          {
            id: "steep",
            label: "steeper or flatter",
            any: ["steeper", "flatter", "steep", "flat"],
          },
          {
            id: "rate",
            label: "rate of change or gallons each minute",
            any: ["rate", "each minute", "per minute", "faster", "slower"],
          },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "A table, a graph and an equation can show the same relationship. How are they alike, and how is each one different?",
    frames: {
      ee: ["A table shows ___.", "A graph shows ___."],
      dev: [
        "They are alike because they all show ___.",
        "A graph is different from a table because ___.",
      ],
      exp: [
        "Although a table, a graph and an equation all show ___, the graph is easiest for ___ and the table is easiest for ___.",
      ],
      br: [
        "Each representation reveals the same relationship from a different angle; I would choose ___ when ___ because ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

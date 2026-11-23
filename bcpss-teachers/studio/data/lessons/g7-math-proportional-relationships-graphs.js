// Lesson pack: Proportional Relationships and Graphs (grade 7 math, 7.RP.A.2). Original problems; every numeric answer carries a calc the validator recomputes.
const table = (alt, head, rows, extra = {}) => ({
  kind: "table",
  alt,
  w: 480,
  h: 260,
  head,
  rows,
  ...extra,
});

const twoPlans = {
  kind: "coord",
  alt: "A coordinate plane with miles along the bottom and dollars up the side. Line A starts at the corner and rises 3 dollars for each mile. Line B crosses the vertical axis at 4 dollars and also rises 3 dollars for each mile.",
  longDesc:
    "Line A passes through (0, 0), (1, 3) and (2, 6). Line B passes through (0, 4), (1, 7) and (2, 10). Both lines are straight and rise at the same steepness, but only Line A passes through the origin.",
  xmax: 6,
  ymax: 24,
  xLabel: "Miles (x)",
  yLabel: "Dollars (y)",
  lines: [
    { m: 3, b: 0, label: "Line A" },
    { m: 3, b: 4, label: "Line B" },
  ],
};

const peachGraph = {
  kind: "coord",
  alt: "A coordinate plane with pounds along the bottom and dollars up the side. Points at (1, 2.5), (2, 5), (4, 10) and (6, 15) sit on a straight line that rises from the corner.",
  longDesc:
    "The points (1, 2.5), (2, 5), (4, 10) and (6, 15) lie on a line through (0, 0). The point (1, 2.5) shows the cost of one pound.",
  xmax: 8,
  ymax: 20,
  xLabel: "Pounds of peaches (x)",
  yLabel: "Cost in dollars (y)",
  points: [
    { x: 1, y: 2.5 },
    { x: 2, y: 5 },
    { x: 4, y: 10 },
    { x: 6, y: 15 },
  ],
  lines: [{ m: 2.5, b: 0 }],
};

export default {
  id: "g7-math-proportional-relationships-graphs",
  kind: "lesson",
  title: "Proportional Relationships and Graphs",
  subtitle:
    "Decide with a table and a graph, find the constant of proportionality, and write y = kx",
  grade: "7",
  band: "6-8",
  subject: "math",
  duration: 50,
  curriculum: {
    status: "district-referenced",
    unitId: "g7-math-u1",
    program: "Reveal Math",
    note: "Matches the Proportional Relationships & Constant of Proportionality unit in the BCPSS curriculum seed (standard 7.RP.A.2 is listed there). Problems, pictures and wording are original; lesson order within the unit is not taken from any publisher sequence.",
  },
  standards: ["7.RP.A.2", "7.RP.A.2a", "7.RP.A.2b", "7.RP.A.2c", "7.RP.A.2d", "MP.3"],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain", "Argue"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "6-8",
  },
  contentObjective:
    "I can decide whether a relationship is proportional using a table and a graph, find the constant of proportionality, write y = kx, and explain what a point on the graph means.",
  languageObjective:
    "I can justify a claim about a relationship by saying 'it is proportional because ___' and by naming evidence from a table or a graph.",
  languageDemands: {
    functions: [
      "make and justify a claim with evidence",
      "describe a graph with precise positions",
      "explain what a point means in a situation",
    ],
    structures: [
      "The relationship is (not) proportional because ___.",
      "y divided by x is ___ in every row, so the constant of proportionality is ___.",
      "The point (___, ___) means that ___ for ___.",
    ],
    discourse:
      "Claim, reason and evidence in a two-turn partner discussion, followed by a written justification that cites one row of a table and one feature of a graph.",
    barriers: [
      "'proportional' sounds like 'portion' and 'proportion', and students read it as 'a part of'",
      "'constant' is an adjective in everyday speech ('constant noise') and a noun in math ('the constant')",
      "'passes through' and 'starts at' describe the same graph feature in different ways",
      "the order of the quantities inside an ordered pair (x, y) matches the order of the words in 'pounds, dollars'",
    ],
    oralRehearse: [
      "The relationship is proportional because y divided by x is 3 in every row.",
      "The point (1, 3) means that 1 pound costs 3 dollars.",
    ],
    writeScaffold:
      "The relationship is (not) proportional because ___. The constant of proportionality is ___ per ___. The equation is y = ___x. The point (___, ___) means ___.",
  },
  vocab: {
    collection: "g7-math-proportional-relationships-graphs",
    ids: [
      "proportional-relationship",
      "constant-of-proportionality",
      "unit-rate",
      "equivalent-ratios",
      "ordered-pair",
      "origin",
      "coordinate-plane",
      "non-proportional",
      "constant",
      "verify",
      "justify",
    ],
  },
  launch: {
    title: "Notice and Wonder: two taxi lines",
    visual: twoPlans,
    prompts: [
      "What do you notice about the two lines?",
      "What do you wonder about the two taxi companies?",
      "If you took a 0-mile ride with each company, what would each one cost?",
    ],
    teacherNote:
      "Show only the graph, without the story. Take noticings such as 'they slope the same' and 'one starts higher'. Then reveal that both lines are taxi companies, x is miles and y is dollars, and ask the third prompt. Write 0 miles beside each line. The class will say Line A costs 0 and Line B costs 4, which surfaces the idea that a starting fee breaks proportionality before the lesson names it. Do not teach the term yet; collect the students' words for 'starts at the corner' and keep them on the chart.",
  },
  teach: {
    model: [
      "In a proportional relationship, one quantity is always the same number times the other. Buying peaches at 2.50 dollars per pound is an example: 2 pounds cost 5 dollars, 4 pounds cost 10 dollars, 6 pounds cost 15 dollars. The ratio of cost to weight is 2.50 every time. That unchanging ratio is the constant of proportionality. It is also the unit rate: the cost for exactly 1 pound.",
      "To test a table, divide y by x in every row. For x = 2, 4, 6 and y = 5, 10, 15 the quotients are all 2.5, so the table is proportional. For x = 1, 2, 3 and y = 7, 9, 11 the quotients are 7, 4.5 and about 3.67. The ratio changes, so the relationship is non-proportional. Always test every row; one matching row proves nothing.",
      "To test a graph, check two things: the points lie on a straight line, and the line passes through the origin, (0, 0). A line that is straight but crosses the vertical axis at 4 is not proportional, because at 0 miles the cost is already 4 dollars. In a proportional relationship, 0 of one quantity always goes with 0 of the other.",
      "We write a proportional relationship as y = kx, where k is the constant of proportionality. For the peaches k is 2.5, so y = 2.5x. To find the cost of 8 pounds, replace x with 8: y = 2.5 times 8 is 20 dollars. To find the pounds for 20 dollars, divide: 20 divided by 2.5 is 8 pounds.",
      "Every point on the graph is an ordered pair (x, y) and has a meaning in the story. The point (4, 10) means 4 pounds cost 10 dollars. The point (0, 0) means 0 pounds cost 0 dollars. The point (1, 2.5) is special: its y value is the unit rate, the cost for 1 pound. A strong explanation justifies a claim with evidence from the table and the graph.",
    ],
    moves: [
      "Run the same two-test routine every time: 'Does y divided by x stay the same? Does the line go through (0, 0)?' Students answer with evidence, not just yes or no.",
      "Record the y divided by x column beside every table, including the non-proportional ones, so students see the quotients change.",
      "Ask students to read points aloud as sentences with units: 'The point (4, 10) means 4 pounds cost 10 dollars.' Reject 'x is 4 and y is 10' as incomplete.",
      "Pair a proportional and a non-proportional example in every task so students are forced to find the difference, not recall a rule.",
      "Teach 'passes through the origin' with a pointer: trace the line to the corner and ask what 0 of the first quantity should cost.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "A table shows x is 3, 6, 9, 12 and y is 12, 24, 36, 48. Is the relationship proportional? Choose the best reason.",
      choices: [
        "No, because y gets bigger by different amounts than x.",
        "Yes, because y divided by x is 4 in every row.",
        "Yes, because both x and y increase.",
        "No, because the first x value is not 1.",
      ],
      answer: 1,
      hint: "Divide y by x in the first row, then check whether the second and third rows give the same number.",
      supports: {
        ee: {
          frames: [
            "12 divided by 3 is ___.",
            "24 divided by 6 is ___.",
            "The answers are the ___.",
          ],
          wordBank: ["divide", "same", "every row", "proportional"],
          visual: table(
            "A table with x values 3, 6, 9, 12 and y values 12, 24, 36, 48.",
            ["x", "y"],
            [
              ["3", "12"],
              ["6", "24"],
              ["9", "36"],
              ["12", "48"],
            ],
          ),
        },
        dev: {
          frames: ["y divided by x is ___ in every row, so the relationship is ___."],
          wordBank: ["proportional", "constant"],
        },
        exp: { frames: ["The relationship is proportional because ___ is the same in every row."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt:
        "A car travels 156 miles on 6 gallons of gas at a steady rate. What is the constant of proportionality, in miles per gallon?",
      answer: 26,
      calc: "156/6",
      hint: "The constant is the amount of y for exactly 1 unit of x. Decide which operation gives the miles for 1 gallon.",
      supports: {
        ee: {
          frames: ["The car goes 156 miles on ___ gallons.", "For 1 gallon it goes ___ miles."],
          wordBank: ["divide", "per", "one gallon", "miles"],
        },
        dev: {
          frames: ["I divided ___ by ___ to find the miles for one gallon."],
          wordBank: ["constant of proportionality", "unit rate"],
        },
        exp: {
          frames: [
            "The constant of proportionality is ___ miles per gallon because ___ divided by ___ is ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt:
        "Peaches cost 2.50 dollars per pound at a steady price. How many dollars do 8 pounds of peaches cost?",
      answer: 20,
      calc: "2.5*8",
      hint: "The cost is the constant of proportionality times the number of pounds. Write the equation y = kx first.",
      supports: {
        ee: {
          frames: ["1 pound costs ___ dollars.", "8 pounds cost ___ times ___."],
          wordBank: ["times", "pounds", "dollars", "each"],
          visual: peachGraph,
        },
        dev: {
          frames: ["k is ___ and x is ___, so y is ___ times ___."],
          wordBank: ["equation", "multiply"],
        },
        exp: { frames: ["Since y = ___x and x = 8, the cost y is ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt:
        "On the graph of a proportional relationship, x is pounds and y is dollars. What does the point (1, 3) mean?",
      choices: [
        "3 pounds cost 1 dollar.",
        "The line starts at 1 dollar.",
        "The relationship has only one pound in it.",
        "1 pound costs 3 dollars, which is the unit price.",
      ],
      answer: 3,
      hint: "Read the ordered pair in order, x first and y second, and attach the units to each number.",
      supports: {
        ee: {
          frames: ["The first number is ___ pounds.", "The second number is ___ dollars."],
          wordBank: ["first", "second", "pound", "dollar", "costs"],
        },
        dev: {
          frames: ["The point (___, ___) means ___ pounds cost ___ dollars."],
          wordBank: ["ordered pair", "unit rate"],
        },
        exp: { frames: ["The point (1, 3) shows the unit rate because ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Which plan is proportional?",
    task: "Partner A and Partner B receive two rental plans for scooters. Plan A: 4 dollars for each ride. Plan B: a 10 dollar joining fee plus 2 dollars for each ride. Partner A makes a table for 0, 1, 2, 3 and 4 rides for both plans and adds a y divided by x column (and notes what happens at 0 rides). Partner B plots both plans on a coordinate plane. They swap, then decide together which plan is proportional, and write a justification that names evidence from the table and evidence from the graph. Last, they write the equation of the proportional plan and say what the point (1, 4) means.",
    roles: ["Table builder", "Graph builder"],
    discussionCards: [
      {
        prompt: "What does each plan cost for 0 rides? What does that say about the origin?",
        frame: "At 0 rides, Plan ___ costs ___, so its line ___ the origin.",
      },
      {
        prompt: "What is y divided by x for Plan A in every row? For Plan B?",
        frame: "For Plan A, y divided by x is ___ in every row. For Plan B it is ___, ___ and ___.",
      },
      {
        prompt:
          "How would you convince someone who says 'both plans go up by the same amount every ride, so both are proportional'?",
        frame: "Both plans rise steadily, but only Plan ___ is proportional because ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the same slope, different starts",
      visualOrModel: twoPlans,
      teacherNote:
        "Place the graph next to two tables: Line A (0, 0; 1, 3; 2, 6) and Line B (0, 4; 1, 7; 2, 10). Add a y divided by x column to the A table (all 3) and to the B table (7, 5, and the 0-mile row has no ratio because you cannot divide by 0). Ask students to explain why two lines with the same steepness can be different kinds of relationships.",
    },
    discuss: {
      title: "Say it: claim, reason, evidence",
      structure:
        "Turn and talk with a new situation card. Partner 1 states a claim ('The relationship is proportional') and gives a reason. Partner 2 asks 'What is your evidence?' and checks the evidence against the table or the graph. Swap roles with a non-proportional card.",
      frames: [
        "The relationship is (not) proportional because ___.",
        "What is your evidence?",
        "In the table, y divided by x is ___. On the graph, the line ___.",
        "I agree because ___. / I disagree because ___.",
      ],
    },
    apply: {
      title: "Use it: a fair price",
      task: "A farm stand sells 3 pounds of green beans for 7.50 dollars and 5 pounds for 12.50 dollars. A second stand charges a 2 dollar bag fee plus 2 dollars per pound. Decide whether each stand's cost is proportional to the weight. For the proportional stand, find the constant of proportionality, write the equation, and find the cost of 10 pounds. For the other stand, explain with numbers why its cost is not proportional.",
      successCriteria: [
        "I test at least two rows for each stand and show the quotients.",
        "I state the constant of proportionality with units.",
        "I write y = kx and use it to find the cost of 10 pounds.",
        "I name the starting fee as the reason the other stand is not proportional.",
      ],
    },
  },
  activities: [
    { engine: "escape-challenge", id: "g7-prop-escape" },
    { engine: "concept-builder", id: "g7-prop-graph-lab" },
    { engine: "argument-builder", id: "g7-prop-argument" },
    { engine: "vocab-quest", id: "g7-prop-vocab-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "A table shows a proportional relationship: x is 4, 8, 12 and y is 18, 36, 54. What is the constant of proportionality?",
        answer: 4.5,
        calc: "18/4",
        explain:
          "Divide y by x in any row: 18 divided by 4 is 4.5. Check 36 divided by 8 and 54 divided by 12 for the same value.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt: "Cheese costs y = 0.75x dollars for x ounces. How many dollars do 12 ounces cost?",
        answer: 9,
        calc: "0.75*12",
        explain: "Replace x with 12: 0.75 times 12 is 9 dollars.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which table shows a proportional relationship?",
        choices: [
          "x: 1, 2, 3, 4 and y: 5, 7, 9, 11",
          "x: 1, 2, 3, 4 and y: 3, 6, 12, 24",
          "x: 2, 4, 6, 8 and y: 7, 14, 21, 28",
          "x: 1, 2, 3, 4 and y: 4, 8, 12, 15",
        ],
        answer: 2,
        explain:
          "In the second table y divided by x is 3.5 in every row. The first table adds 2 each time, the third doubles, and the fourth breaks the pattern in the last row.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "A graph is a straight line that crosses the vertical axis at 6. Which statement is correct?",
        choices: [
          "It does not show a proportional relationship because it does not pass through the origin.",
          "It shows a proportional relationship because it is a straight line.",
          "It shows a proportional relationship because y increases as x increases.",
          "It cannot be decided without a table.",
        ],
        answer: 0,
        explain:
          "A proportional relationship must pass through (0, 0). A line that crosses the vertical axis at 6 has y equal to 6 when x is 0.",
      },
      {
        id: "i5",
        type: "numeric",
        prompt:
          "A proportional table shows x is 5, 10, 15 and y is 12.5, 25, and then a missing value. What is the missing y value when x is 15?",
        answer: 37.5,
        calc: "12.5*3",
        explain:
          "The constant is 12.5 divided by 5, which is 2.5. Then 2.5 times 15 is 37.5. Or: 15 is 3 times 5, so y is 3 times 12.5.",
      },
      {
        id: "i6",
        type: "numeric",
        prompt:
          "The graph of a proportional relationship passes through the point (6, 15). What is the y value when x is 10?",
        answer: 25,
        calc: "15/6*10",
        explain: "The constant is 15 divided by 6, which is 2.5. Then 2.5 times 10 is 25.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A taxi charges a 3 dollar starting fee plus 2 dollars for each mile. A student says the cost is proportional to the miles because the cost goes up by the same amount each mile. Explain why this is not a proportional relationship.",
        answer:
          "It is not proportional because a 0-mile ride already costs 3 dollars, so the graph does not pass through the origin, and the cost divided by miles is not the same in every row.",
        explain:
          "The cost for 1 mile is 5 and for 2 miles is 7, so cost divided by miles is 5 and 3.5. The starting fee means the line misses (0, 0).",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt: "A proportional relationship has the equation y = 6.5x. What is y when x is 4?",
        answer: 26,
        calc: "6.5*4",
        explain: "Replace x with 4: 6.5 times 4 is 26.",
      },
      {
        id: "f2",
        type: "choice",
        prompt:
          "On the graph of a proportional relationship of dollars y for pounds x, the point (4, 10) is on the line. What does it mean?",
        choices: [
          "10 pounds cost 4 dollars.",
          "The unit price is 4 dollars.",
          "4 pounds cost 10 dollars.",
          "The line starts at 4.",
        ],
        answer: 2,
        explain: "Read x first and y second: 4 pounds and 10 dollars.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "A table shows x is 2, 4, 6 and y is 9, 18, 27. Is it proportional? Give the constant of proportionality and the equation.",
        answer:
          "Yes. y divided by x is 4.5 in every row, so k is 4.5 and the equation is y = 4.5x.",
        explain: "9 divided by 2, 18 divided by 4 and 27 divided by 6 are all 4.5.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you decide whether a relationship is proportional.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "A proportional table shows x is 3, 6, 9 and y is 21, 42, 63. What is the constant of proportionality?",
        answer: 7,
        calc: "21/3",
        explain: "21 divided by 3 is 7, and 42 divided by 6 and 63 divided by 9 are also 7.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt:
          "A garden hose fills a tank at a steady rate and the cost is y = 1.5x dollars for x gallons. How many dollars do 18 gallons cost?",
        answer: 27,
        calc: "1.5*18",
        explain: "Replace x with 18: 1.5 times 18 is 27 dollars.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Name two tests you can use on a graph to decide whether a relationship is proportional.",
        answer: "The points lie on a straight line, and the line passes through the origin (0, 0).",
        explain:
          "Both conditions are needed. A straight line that misses the origin is not proportional.",
      },
    ],
    successCriteria: [
      "I tested y divided by x for the constant.",
      "I used y = kx to find a value.",
      "I named both graph tests.",
    ],
  },
  answerKey: {
    notes:
      "Accept equivalent forms of a constant (for example 4.5 or 9/2). For the short-answer items look for the ideas 'y divided by x is not constant' and 'the line does not pass through the origin', not a specific sentence. For ordered-pair meaning require both units.",
    items: {
      g1: "Yes, y divided by x is 4 in every row: 12 divided by 3, 24 divided by 6, 36 divided by 9 and 48 divided by 12.",
      g2: "26 miles per gallon. 156 divided by 6 is 26.",
      g3: "20 dollars. 2.50 times 8 is 20.",
      g4: "1 pound costs 3 dollars, which is the unit price.",
      i1: "4.5. 18 divided by 4 is 4.5.",
      i2: "9 dollars. 0.75 times 12 is 9.",
      i3: "The second table: y divided by x is 3.5 in every row.",
      i4: "It does not pass through the origin, so it is not proportional.",
      i5: "37.5. The constant is 2.5 and 2.5 times 15 is 37.5.",
      i6: "25. The constant is 15 divided by 6, or 2.5, and 2.5 times 10 is 25.",
      i7: "A 0-mile ride costs 3 dollars, so the line misses the origin, and cost divided by miles is 5, then 3.5, so it is not constant.",
      f1: "26. 6.5 times 4 is 26.",
      f2: "4 pounds cost 10 dollars.",
      f3: "Yes. y divided by x is 4.5 in every row, so y = 4.5x.",
      e1: "7. 21 divided by 3 is 7.",
      e2: "27 dollars. 1.5 times 18 is 27.",
      e3: "Straight line, and through the origin (0, 0).",
    },
  },
  extension: {
    title: "Two lines, one starting fee",
    task: "Line A is y = 3x and Line B is y = 3x + 4 (miles x, dollars y). Make a table for 0 to 5 miles for each and add a y divided by x column. As the miles get very large, what happens to the ratio y divided by x for Line B? Explain in words why the ratio for Line B gets closer to 3 but never equals it, and why that does not make Line B proportional.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo decidir si una relación es proporcional usando una tabla y una gráfica, y explicar qué significa un punto de la gráfica.",
      vocab: [
        { en: "proportional relationship", es: "relación proporcional", verified: true },
        { en: "constant of proportionality", es: "constante de proporcionalidad", verified: true },
        { en: "unit rate", es: "tasa unitaria", verified: true },
        { en: "ordered pair", es: "par ordenado", verified: true },
        { en: "origin", es: "origen", verified: true },
      ],
      familyPrompt:
        "Busquen un precio por peso en una tienda, por ejemplo el costo por libra de fruta. Calculen el costo de 2, 4 y 6 libras. Digan si el costo dividido entre el peso es siempre el mismo.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Partner work or the activities 20. Exit ticket 7. Closing language share 3. If time is short, run the escape room in one sitting and give the argument builder as a second-day writing task.",
    misconceptions: [
      "Straight line means proportional: students call every straight line proportional. Ask 'What does this line cost at 0 miles?' and have them trace it to the vertical axis.",
      "Steady increase means proportional: students say a table that adds the same amount each row is proportional. Add a y divided by x column and ask why the quotients differ.",
      "Testing only one row: students divide one row and stop. Require two more rows before any claim.",
      "Constant as the largest value: students report 12 or 48 from the last row as the constant. Ask for the cost of exactly one unit.",
      "Reversed ordered pair: students read (4, 10) as 10 pounds and 4 dollars. Have them label each number with its unit before they speak.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames and word banks in each item, point to table rows and graph points while speaking, and keep the same tasks and answers as every other tier. Expanding and Bridging learners justify in complete sentences and write the claim, reason and evidence in separate sentences. Never reduce the mathematics; reduce only the language load.",
    languageNotes:
      "Chorally practice 'proportional' and 'proportion' side by side so students hear the stress move. Teach 'passes through' with a gesture tracing the line. Connect 'constant' in everyday English (constant noise) to its math meaning (the same every time).",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

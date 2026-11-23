// Lesson pack: Variables and Relationships (grade 6 math, 6.EE.C.9). Original problems; every numeric answer carries a calc the validator recomputes.
const table = (alt, head, rows, extra = {}) => ({
  kind: "table",
  alt,
  w: 480,
  h: 260,
  head,
  rows,
  ...extra,
});

const hoseTable = table(
  "A table with columns minutes x and gallons y. The rows read 0 and 0, 1 and 4, 2 and 8, 3 and 12, 4 and 16.",
  ["x (minutes)", "y (gallons)"],
  [
    ["0", "0"],
    ["1", "4"],
    ["2", "8"],
    ["3", "12"],
    ["4", "16"],
  ],
);

const hoseGraph = {
  kind: "coord",
  alt: "A coordinate plane with minutes along the bottom and gallons up the side. Points at (1, 4), (2, 8), (3, 12) and (4, 16) sit on a straight line that rises from the corner.",
  longDesc:
    "The points (1, 4), (2, 8), (3, 12) and (4, 16) lie on a line through (0, 0). The line rises 4 gallons for each 1 minute.",
  xmax: 6,
  ymax: 24,
  xLabel: "Minutes (x)",
  yLabel: "Gallons (y)",
  points: [
    { x: 1, y: 4 },
    { x: 2, y: 8 },
    { x: 3, y: 12 },
    { x: 4, y: 16 },
  ],
  lines: [{ m: 4, b: 0 }],
};

const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

export default {
  id: "g6-math-variables-relationships",
  kind: "lesson",
  title: "Variables and Relationships",
  subtitle:
    "Name the independent and dependent variables, find the rate of change, and connect a table, a graph and an equation",
  grade: "6",
  band: "6-8",
  subject: "math",
  duration: 50,
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u5",
    program: "Reveal Math",
    note: "6.EE.C.9 is one of the standards listed for the Numerical & Algebraic Expressions and Equations unit in the BCPSS curriculum seed. Problems, pictures and wording are original; lesson order within the unit is not taken from any publisher sequence.",
  },
  pathway: {
    id: "g6-math-reference",
    position: 1,
    next: "g6-math-ratios-and-rates",
    note: "First lesson of the Grade 6 math reference pathway. It introduces two quantities changing together; the next lesson uses the same ideas for ratios and unit rates.",
  },
  standards: ["6.EE.C.9"],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain", "Argue"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "6-8",
  },
  contentObjective:
    "I can name the independent and dependent variables in a situation, find the rate of change, and connect a table, a graph and an equation of the form y = kx.",
  languageObjective:
    "I can explain a relationship between two quantities by saying 'as ___ increases, ___ increases by ___ each time' and justify my equation with a row from the table.",
  languageDemands: {
    functions: [
      "describe how two quantities change together",
      "compare a table, a graph and an equation",
      "justify an equation with evidence",
    ],
    structures: [
      "___ is the independent variable because ___.",
      "As ___ increases, ___ increases by ___ each time.",
      "The equation y = ___x matches because when x is ___, y is ___.",
    ],
    discourse:
      "Two-turn partner explanation (claim about the variables, then evidence from a representation), then a written justification of one equation.",
    barriers: [
      "'depends on' and 'depend' are used for the dependent variable but 'independent' starts with a prefix that students read as 'not allowed to change'",
      "'table', 'graph', 'rate' and 'change' have everyday meanings that differ from their math meanings",
      "'per' and 'for each' name the quantity that goes up by 1, and the order of the two units matters",
      "a number written next to a letter (4x) means multiply, which students read as the digits 4 and x side by side",
    ],
    oralRehearse: [
      "The number of gallons depends on the number of minutes.",
      "As the minutes increase, the gallons increase by 4 each time.",
    ],
    writeScaffold:
      "The independent variable is ___ and the dependent variable is ___. The rate of change is ___ per ___. The equation is y = ___ because ___.",
  },
  vocab: {
    collection: "g6-math-variables-relationships",
    ids: [
      "variable",
      "independent-variable",
      "dependent-variable",
      "relationship",
      "equation",
      "table",
      "graph",
      "rate-of-change",
      "steeper",
      "represent",
      "compare",
      "justify",
    ],
  },
  launch: {
    title: "Notice and Wonder: one hose, five measurements",
    visual: hoseTable,
    prompts: [
      "What do you notice about the numbers in each column?",
      "What do you wonder about how the two columns are connected?",
      "If the hose ran for 10 minutes, how could you find out the gallons without a table that long?",
    ],
    teacherNote:
      "Show only the table first. Do not say what x and y stand for until students have named two or three patterns, such as 'the y column goes up by 4' and 'the first row is 0 and 0'. Then reveal the story: a hose fills an empty rain barrel and x is the minutes the hose has run. Write the students' words for the pattern on the board; they become the first lines of the class relationship chart. Ask 'Which column would I change first if I wanted to test the hose?' to surface the idea of the independent variable before it has a name.",
  },
  teach: {
    model: [
      "Many situations have two quantities that change together. A hose fills a rain barrel: the number of minutes and the number of gallons in the barrel are two quantities in one relationship. We use a letter for each quantity. Here x stands for minutes and y stands for gallons. A letter that stands for a quantity that can change is a variable.",
      "The independent variable is the quantity we choose or change first: we decide how many minutes the hose runs. The dependent variable is the quantity that depends on it: the gallons are found after the time is chosen. A useful test is to ask 'Which quantity do I pick, and which one do I find?' The independent variable is usually on the horizontal axis of a graph and in the first column of a table.",
      "A table lists pairs of values. The table 1, 4; 2, 8; 3, 12 shows that every time x goes up by 1, y goes up by 4. That amount is the rate of change: 4 gallons per minute. The rate of change tells how much the dependent variable changes when the independent variable goes up by exactly 1.",
      "An equation puts the pattern in one sentence. Because the gallons are always 4 times the minutes, y = 4x. A number next to a letter means multiply. To find the gallons after 10 minutes, replace x with 10: y = 4 times 10, which is 40 gallons. The number in front of x is the rate of change.",
      "A graph shows the same relationship as points on a coordinate plane. The points (1, 4), (2, 8) and (3, 12) lie on a straight line that starts at the corner. A line with a greater rate of change is steeper. A table, a graph and an equation are three ways to represent one relationship, and a strong explanation compares them and justifies a choice with numbers.",
    ],
    moves: [
      "Always ask the same two questions aloud: 'Which quantity do we choose? Which quantity do we find?' Students answer with the quantity names, not x and y.",
      "Build the table on the board with the change written between the rows: write '+1' beside the x values and '+4' beside the y values so students see both changes at once.",
      "Say the rate of change as a full sentence with units: '4 gallons per minute'. Reject a bare number.",
      "Move across representations in the same order every time (table, then graph, then equation) and point to the same pair, such as (3, 12), in each one.",
      "When a student says 'x and y', ask 'Which quantity is x? What are its units?' until the variable is attached to a quantity.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "A cyclist rides at a steady speed. Let m be the minutes riding and d the distance in miles. Which quantity is the independent variable?",
      choices: [
        "d, the distance, because it is the bigger number",
        "m, the minutes, because we choose how long to ride",
        "d, the distance, because it comes first in the alphabet",
        "Neither one, because both quantities change",
      ],
      answer: 1,
      hint: "Ask which quantity you could choose freely, and which one you would measure afterward.",
      supports: {
        ee: {
          frames: ["We choose the ___.", "We find the ___."],
          wordBank: ["minutes", "distance", "choose", "find"],
          visual: {
            kind: "flow",
            alt: "Two steps with an arrow. Step 1: choose how many minutes to ride. Step 2: find how many miles you went.",
            steps: [
              { label: "Choose the minutes (m)", icon: "clock" },
              { label: "Find the miles (d)", icon: "bicycle" },
            ],
            w: 480,
            h: 180,
          },
          oral: "Point to the quantity you choose first. Say its name.",
        },
        dev: {
          frames: ["___ is the independent variable because ___."],
          wordBank: ["independent variable", "choose"],
        },
        exp: { frames: ["The independent variable is ___ since it is the quantity that ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt:
        "A pump follows the equation y = 6x, where x is the minutes it runs and y is the gallons it moves. How many gallons has it moved after 7 minutes?",
      answer: 42,
      calc: "6*7",
      hint: "Replace the letter x with the number of minutes, then use the operation that a number written next to a letter shows.",
      supports: {
        ee: {
          frames: ["I put ___ where x is.", "___ times ___ is ___ gallons."],
          wordBank: ["replace", "times", "minutes", "gallons"],
          visual: table(
            "A table with minutes 1, 2, 3 and gallons 6, 12, 18.",
            ["x (minutes)", "y (gallons)"],
            [
              ["1", "6"],
              ["2", "12"],
              ["3", "18"],
            ],
          ),
        },
        dev: {
          frames: ["x is ___, so y is ___ times ___."],
          wordBank: ["equation", "multiply"],
        },
        exp: { frames: ["Since y = 6x and x = ___, the dependent variable y is ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt:
        "A table shows a steady pattern: when x is 2, y is 14; when x is 4, y is 28; when x is 6, y is 42. What is the rate of change, in units of y for each 1 unit of x?",
      answer: 7,
      calc: "14/2",
      hint: "Look at how much y changes when x goes up by 2, then decide how much that is for a step of just 1.",
      supports: {
        ee: {
          frames: [
            "When x goes up by 2, y goes up by ___.",
            "When x goes up by 1, y goes up by ___.",
          ],
          wordBank: ["goes up", "each", "same", "rate"],
          visual: table(
            "A table with x values 2, 4, 6 and y values 14, 28, 42.",
            ["x", "y"],
            [
              ["2", "14"],
              ["4", "28"],
              ["6", "42"],
            ],
          ),
        },
        dev: {
          frames: ["y changes by ___ when x changes by ___, so the rate of change is ___ per 1."],
          wordBank: ["rate of change", "divide"],
        },
        exp: {
          frames: [
            "The rate of change is ___ because dividing the change in y by the change in x gives ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt:
        "A table shows x is 1, 2, 3 and y is 5, 10, 15. Which equation gives y in terms of x?",
      choices: ["y = x + 4", "y = x / 5", "y = 15x", "y = 5x"],
      answer: 3,
      hint: "Test an equation on the second row of the table, not just the first one.",
      supports: {
        ee: {
          frames: ["When x is 2, y is ___.", "This equation works because ___."],
          wordBank: ["test", "row", "times", "plus"],
        },
        dev: {
          frames: ["I tested the equation with x = ___ and got ___, which matches the table."],
          wordBank: ["equation", "row", "matches"],
        },
        exp: {
          frames: [
            "The equation y = ___x matches because every row satisfies it, for example when x is ___, y is ___.",
          ],
        },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Three ways, one hose",
    task: "Partner A and Partner B receive a short story card, for example 'A garden hose adds 5 gallons to a bucket every minute, and the bucket starts empty'. Partner A builds a four-row table and writes the equation. Partner B plots the points on a coordinate plane and draws the line. They swap and check: does every point sit on the line, and does every table row satisfy the equation? Then they write two sentences that name the independent variable, the dependent variable and the rate of change with units, and one sentence comparing the table and the graph.",
    roles: ["Table and equation builder", "Graph builder"],
    discussionCards: [
      {
        prompt:
          "Which quantity did you choose first, and which did you find? How can the table show that?",
        frame: "The independent variable is ___ because ___.",
      },
      {
        prompt: "Where can you see the rate of change in the table and in the graph?",
        frame:
          "In the table, y goes up by ___ when x goes up by 1. In the graph, the line rises ___ for each 1 across.",
      },
      {
        prompt: "When would you use the equation instead of the table or the graph?",
        frame: "I would use the equation when ___ because ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the same hose in a table and a graph",
      visualOrModel: hoseGraph,
      teacherNote:
        "Put the graph beside the five-row table from the launch and the equation y = 4x. Ask students to find the pair (3, 12) in all three and say what it means with units. Then ask which representation makes it easiest to find the gallons after 10 minutes and why.",
    },
    discuss: {
      title: "Say it: variables, pattern, evidence",
      structure:
        "Turn and talk. Partner 1 names the variables and describes the pattern. Partner 2 asks 'Where in the table do you see that?' and restates the evidence. Swap, using a new situation card.",
      frames: [
        "___ is the independent variable and ___ is the dependent variable.",
        "As ___ increases, ___ increases by ___ each time.",
        "Where in the table do you see that?",
        "In the row where x is ___, y is ___, so the rate of change is ___.",
      ],
    },
    apply: {
      title: "Use it: a school fundraiser",
      task: "The student council sells wristbands for 3 dollars each. Let x be the number of wristbands sold and y the money collected in dollars. Write an equation that gives y in terms of x. Make a table for 1, 2, 3 and 4 wristbands. Use your equation to find the money collected when 25 wristbands are sold. State the independent variable, the dependent variable and the rate of change.",
      successCriteria: [
        "I name the independent and dependent variables with their quantities and units.",
        "I write an equation and test it with at least one row of my table.",
        "I state the rate of change with both units.",
        "I use the equation to answer the 25-wristband question and show the calculation.",
      ],
    },
  },
  activities: [
    { engine: "conversation-studio", id: "g6-vars-conversation" },
    { engine: "escape-challenge", id: "g6-vars-escape" },
    { engine: "concept-builder", id: "g6-vars-graph-lab" },
    { engine: "vocab-quest", id: "g6-vars-vocab-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "A pool fills by the rule y = 9x, where x is the minutes the hose runs and y is the gallons in the pool. How many gallons are in the pool after 8 minutes?",
        answer: 72,
        calc: "9*8",
        explain: "Replace x with 8: 9 times 8 is 72 gallons.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "A bakery tracks cookies and trays. One tray holds 6 cookies, so a table shows 1 tray and 6 cookies, 2 trays and 12 cookies, 3 trays and 18 cookies, 4 trays and 24 cookies. How many cookies are on 10 trays at that steady pattern?",
        answer: 60,
        calc: "6*10",
        explain:
          "Each tray adds 6 cookies, so the equation is y = 6x and 6 times 10 is 60 cookies.",
      },
      {
        id: "i3",
        type: "choice",
        prompt:
          "Notebooks cost 3 dollars each. The total cost depends on how many notebooks you buy. Which statement names the variables correctly?",
        choices: [
          "The number of notebooks is the independent variable and the cost is the dependent variable.",
          "The cost is the independent variable and the number of notebooks is the dependent variable.",
          "Both are independent variables because both change.",
          "Neither is a variable because the price is always 3 dollars.",
        ],
        answer: 0,
        explain:
          "You choose how many notebooks to buy, so that quantity is independent. The cost is found from it, so the cost is dependent.",
      },
      {
        id: "i4",
        type: "numeric",
        prompt:
          "A drone climbs 45 meters in 5 seconds at a steady rate. What is the rate of change, in meters per second?",
        answer: 9,
        calc: "45/5",
        explain:
          "Divide the change in height by the time: 45 divided by 5 is 9 meters for each second.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "A ticket costs 12 dollars. Let x be the number of tickets and y the total cost in dollars. Which equation gives y in terms of x?",
        choices: ["y = x + 12", "x = 12y", "y = 12x", "y = x / 12"],
        answer: 2,
        explain:
          "Each ticket adds 12 dollars, so the cost is 12 times the number of tickets: y = 12x.",
      },
      {
        id: "i6",
        type: "numeric",
        prompt:
          "A printer prints 8 pages each minute at a steady rate. After how many minutes has it printed 56 pages?",
        answer: 7,
        calc: "56/8",
        explain: "The equation is y = 8x. When y is 56, x is 56 divided by 8, which is 7 minutes.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A student says the rate of change in this table is 5 because the first y value is 5. The table is x: 1, 2, 3 and y: 5, 7, 9. Explain the mistake, then state the correct rate of change with its meaning.",
        answer:
          "The rate of change is how much y changes when x goes up by 1, not the first y value. y goes up by 2 each time, so the rate of change is 2.",
        explain:
          "The y values go 5, 7, 9, which is an increase of 2 each time x goes up by 1. The first value only says where y starts.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt:
          "A faucet adds 5 gallons to a tub each minute, so y = 5x. How many gallons are in the tub after 12 minutes?",
        answer: 60,
        calc: "5*12",
        explain: "Replace x with 12 and multiply: 5 times 12 is 60.",
      },
      {
        id: "f2",
        type: "choice",
        prompt:
          "A graph shows height of a plant (y) after some weeks (x). Which quantity is the dependent variable?",
        choices: [
          "The number of weeks",
          "The color of the plant",
          "The height of the plant",
          "The size of the pot",
        ],
        answer: 2,
        explain:
          "The height is measured after the weeks are chosen, so it depends on the number of weeks.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "A table shows x is 1, 2, 3 and y is 4, 8, 12. Write an equation that gives y in terms of x and say what the 4 means.",
        answer: "y = 4x. The 4 is the rate of change: y goes up by 4 each time x goes up by 1.",
        explain:
          "Each y value is 4 times its x value, so y = 4x, and 4 is how much y increases for 1 more x.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you know about two quantities that change together.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "A machine makes 7 toys each minute, so y = 7x, where y is the toys made and x is the minutes. How many toys does it make in 9 minutes?",
        answer: 63,
        calc: "7*9",
        explain: "Replace x with 9: 7 times 9 is 63 toys.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt:
          "A car travels 180 miles in 3 hours at a steady speed. What is the rate of change in miles per hour?",
        answer: 60,
        calc: "180/3",
        explain:
          "Divide the change in distance by the change in time: 180 divided by 3 is 60 miles per hour.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "In one or two sentences, explain how you would tell which variable is independent and which is dependent in a new situation.",
        answer:
          "The independent variable is the quantity you choose or change first. The dependent variable is the quantity that is found from it.",
        explain:
          "Ask which quantity you pick and which one you find or measure afterward. The one you find depends on the one you pick.",
      },
    ],
    successCriteria: [
      "I attached each variable to a quantity with units.",
      "I used the equation to find a value.",
      "I stated a rate of change with both units.",
    ],
  },
  answerKey: {
    notes:
      "Accept variable names in any order as long as each variable is paired with the correct quantity (for example 'minutes is independent'). For rates of change require both units. For the three short-answer items look for the ideas 'choose first versus found from it' and 'change in y for one step of x', not a specific sentence.",
    items: {
      g1: "The minutes (m). We choose how long to ride, and the distance is found from the time.",
      g2: "42 gallons. Replace x with 7: 6 times 7 is 42.",
      g3: "7. When x goes up by 2, y goes up by 14, so for each 1 of x it goes up by 7.",
      g4: "y = 5x. Each y value is 5 times its x value: 5, 10, 15.",
      i1: "72 gallons. 9 times 8 is 72.",
      i2: "60 cookies. Each tray adds 6 cookies, so y = 6x and 6 times 10 is 60.",
      i3: "The number of notebooks is independent and the cost is dependent.",
      i4: "9 meters per second. 45 divided by 5 is 9.",
      i5: "y = 12x.",
      i6: "7 minutes. 56 divided by 8 is 7.",
      i7: "The rate of change is not the first y value. y goes up by 2 each time x goes up by 1, so the rate of change is 2.",
      f1: "60 gallons. 5 times 12 is 60.",
      f2: "The height of the plant. It depends on the number of weeks.",
      f3: "y = 4x. The 4 is the rate of change: 4 more y for each 1 more x.",
      e1: "63 toys. 7 times 9 is 63.",
      e2: "60 miles per hour. 180 divided by 3 is 60.",
      e3: "The independent variable is chosen first. The dependent variable is found from it.",
    },
  },
  extension: {
    title: "A relationship that does not start at zero",
    task: "A savings jar already holds 5 dollars, and 2 dollars are added each week. Make a table for 0, 1, 2, 3 and 4 weeks. Find how much the total changes each week (the rate of change) and explain why the rate of change is 2 even though the first total is 5. Compare this table to the table for y = 2x: how are the two tables alike and how are they different? Then write an equation for the jar and test it with one row.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo nombrar la variable independiente y la variable dependiente, y explicar cómo cambian dos cantidades juntas.",
      vocab: [
        { en: "variable", es: "variable", verified: true },
        { en: "independent variable", es: "variable independiente", verified: true },
        { en: "dependent variable", es: "variable dependiente", verified: true },
        { en: "equation", es: "ecuación", verified: true },
        { en: "rate of change", es: "tasa de cambio", verified: true },
      ],
      familyPrompt:
        "Busquen una situación en casa donde una cantidad dependa de otra, por ejemplo el costo y la cantidad de frutas que compran. Digan cuál cantidad eligen primero y cuál se calcula después.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Partner work or the activities 20. Exit ticket 7. Closing language share 3. If time is short, run the escape room in one sitting and move the conversation activity to the next day as a speaking routine.",
    misconceptions: [
      "Swapped variables: students say the gallons are independent because the barrel is the bigger object in the picture. Ask 'Which quantity can I choose, and which one do I have to measure afterward?'",
      "Bare letters: students answer 'x is independent' without naming a quantity. Require the quantity name and its units every time.",
      "Last value as rate: students report the y value in the last row as the rate of change. Ask them to write the change between two rows of the table.",
      "Additive thinking about 4x: students read 4x as 'x plus 4' or the digits 4 and x. Test it with a table row so they see that 4 times 3 is 12 and 3 plus 4 is not.",
      "Longer means steeper: students call a line steeper because it is drawn longer. Compare the rise for one step across in both lines.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames and word banks in each item, point to table rows while speaking, and keep the same tasks and answers as every other tier. Expanding and Bridging learners justify in complete sentences and compare two representations. Never reduce the mathematics; reduce only the language load.",
    languageNotes:
      "Teach 'depends on' with a daily example (your lunch bill depends on what you order) before the word dependent. Chorally practice 'The independent variable is ___ because ___.' Point out that 'independent' does not mean the quantity never changes; it means it is not found from the other quantity.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

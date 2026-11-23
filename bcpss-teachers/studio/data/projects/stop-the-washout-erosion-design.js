// Project: grade 4 science and engineering design. Model a schoolyard slope, test ways to hold soil in place, redesign from data. Original.
const lv = (score, label, descriptor) => ({ score, label, descriptor });
const tiers = (ee, dev, exp, br) => ({ ee, dev, exp, br });

const designCycle = {
  kind: "cycle",
  w: 480,
  h: 320,
  alt: "A design cycle in six steps that leads back to the start: ask, imagine, plan, build, test, improve.",
  stages: [
    { label: "Ask" },
    { label: "Imagine" },
    { label: "Plan" },
    { label: "Build" },
    { label: "Test" },
    { label: "Improve" },
  ],
};

const costSheet = {
  kind: "table",
  w: 480,
  h: 270,
  alt: "Materials price list for the erosion models. The prices are invented for this project.",
  longDesc:
    "Mulch, one scoop: 1 dollar. Gravel, one scoop: 2 dollars. Grass sod square: 3 dollars. Craft sticks, one: 1 dollar. Cardboard strip: 1 dollar. Each team has 12 dollars to spend.",
  head: ["Material", "Price"],
  rows: [
    ["Mulch (1 scoop)", "$1"],
    ["Gravel (1 scoop)", "$2"],
    ["Grass sod square", "$3"],
    ["Craft stick (1)", "$1"],
    ["Cardboard strip (1)", "$1"],
    ["Team budget", "$12"],
  ],
};

const testTable = {
  kind: "table",
  w: 480,
  h: 260,
  alt: "Example test record with three columns: design, cost and the depth of soil in the collecting cup. The numbers are an example for learning the table.",
  longDesc:
    "Bare slope: 0 dollars, 14 millimeters of soil in the cup. Mulch only: 3 dollars, 9 millimeters. Sod and craft-stick terrace: 9 dollars, 3 millimeters. These numbers are an example, not what your class will measure.",
  head: ["Design", "Cost", "Soil in cup (mm)"],
  rows: [
    ["Bare slope (control)", "$0", "14"],
    ["Mulch only", "$3", "9"],
    ["Sod and craft-stick terrace", "$9", "3"],
  ],
};

export default {
  id: "stop-the-washout-erosion-design",
  kind: "project",
  title: "Stop the Washout: Design a Slope That Holds Its Soil",
  subtitle: "A model of a schoolyard hill, fair tests and a design review",
  drivingQuestion:
    "How can we design a way to keep soil on a schoolyard slope when heavy rain pours over it, and how do we know our design works?",
  studentQuestion:
    "What happens to soil on a hill when water runs over it, and what could we add to keep it in place?",
  grade: "4",
  grades: ["4"],
  band: "3-5",
  bands: ["3-5"],
  subject: "science",
  subjects: ["science"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS 4-ESS2-1 and 4-ESS3-2 plus CCSS W.4.2 and SL.4.4; not mapped to a district unit sequence. Prices are invented for this project.",
  },
  standards: ["4-ESS2-1", "4-ESS3-2", "W.4.2", "SL.4.4"],
  wida: {
    eld: ["ELD-SC", "ELD-SI"],
    klus: ["Explain", "Argue"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "4-5",
  },
  sessions: 10,
  sessionMinutes: 45,
  duration: 450,
  intro:
    "A grassy bank next to a school path has worn bare. After every hard rain, a fan of mud spreads across the path. The principal has asked fourth graders to design a fix. Your team will build a small model of the slope, pour measured rain over it and measure the soil that washes away. Then you will test designs that use only a limited set of materials, compare the data, improve the best design and present your evidence to a design review panel. Engineers do exactly this: they test models first, because a model is cheaper than a mistake.",
  hook: "Show a photo or a real example of a bare slope with a fan of mud at the bottom. Ask: where did the soil come from, and what moved it?",
  contentTargets: [
    "I can make observations and measurements that show how running water moves soil down a slope (erosion).",
    "I can use a fair test, changing one design at a time, to compare solutions.",
    "I can use my data to say which design worked best within the budget and why.",
    "I can improve a design after a test and show how the numbers changed.",
  ],
  languageTargets: [
    {
      function: "Justify a design with evidence",
      structure:
        "Our ___ design held more soil because ___. The data shows ___ millimeters of soil compared with ___.",
      text: "I can explain why one design works better than another using numbers and because.",
    },
    {
      function: "Ask and answer questions in a design review",
      structure: "How did you ___? What would happen if ___? We tested ___ and found ___.",
      text: "I can ask a team a question about their data and answer questions about mine.",
    },
  ],
  materials: [
    "One aluminum baking pan or plastic tray per team, filled with 2 cups of a sand and soil mix",
    "Books or blocks to raise one end of the pan to the same height for every test",
    "A measuring cup or bottle of water (250 mL per test) and a plastic cup with small holes to make rain",
    "A clear plastic cup per test to collect runoff, and a ruler in millimeters",
    "Design materials: mulch, gravel, grass sod squares or pre-grown grass, craft sticks, cardboard strips",
    "Paper towels, a bucket for dumping water, and trays for cleanup",
    "Data tables, graph paper and the materials price list",
  ],
  prep: [
    "Test the model yourself before class. Make one slope with the end raised 8 cm, pour 250 mL over 30 seconds and look at the cup. Adjust the slope height so a bare slope sends a clearly visible amount of soil into the cup.",
    "Decide the three fixed rules for every test: the same slope height, the same amount of water and the same pouring time. Write them on a poster so fairness is visible.",
    "To measure soil lost, pour the runoff into a clear cup, let it settle for 10 minutes and measure the depth of the settled layer in millimeters. This is a measure of how much soil washed away.",
    "Grass sod or grass seed grown a week earlier gives the best roots example. If you cannot grow grass, use sod squares from a garden store.",
    "Place trays under every pan. Plan for cleanup with a pail for muddy water, never a classroom sink.",
  ],
  facilitation: [
    {
      day: 1,
      title: "The problem and the criteria",
      checkpoint: "cp1",
      minutes: 45,
      teacher: [
        "Present the principal's request. As a class write the problem in one sentence, then list criteria (what a good solution does) and constraints (the limits, such as budget and materials).",
        "Show the price list and the $12 budget.",
      ],
      students: [
        "Write the problem and two criteria in a notebook.",
        "Underline the constraints in the price list.",
      ],
      watchFor:
        "Criteria like 'looks nice'. Ask, 'How could we measure that?' and steer toward 'less soil in the cup'.",
    },
    {
      day: 2,
      title: "Build the model and test the bare slope",
      checkpoint: "cp1",
      minutes: 45,
      teacher: [
        "Teams fill pans, raise one end and run the control test on the bare slope. Measure the soil that settles in the cup after 10 minutes.",
        "Collect the control data. Ask: what does this number mean for a design?",
      ],
      students: ["Run the control test.", "Draw the slope and the path of the water."],
      watchFor: "Teams that change the slope height or pour faster. Point to the fairness poster.",
    },
    {
      day: 3,
      title: "Explain what the water did",
      checkpoint: "cp2",
      minutes: 45,
      teacher: [
        "Ask students to describe where soil started, where it moved and where it stopped. Introduce the words erosion, deposit and runoff with the model in front of them.",
        "Students write two sentences explaining how running water moves soil.",
      ],
      students: ["Label the diagram with erosion, runoff and deposit.", "Write the two sentences."],
      watchFor: "Using wind or animals as the cause. Ask what moved soil in this model.",
    },
    {
      day: 4,
      title: "Imagine and plan three designs",
      checkpoint: "cp2",
      minutes: 45,
      teacher: [
        "Show examples of real solutions without choosing for them: plants whose roots hold soil, steps cut into a slope, gravel at the base, mulch on top.",
        "Teams sketch three possible designs, cost each one and choose which to test first.",
      ],
      students: ["Sketch three designs with labels.", "Add up the cost of each design."],
      watchFor: "Plans over $12. Ask which part could be traded.",
    },
    {
      day: 5,
      title: "Build and test design one",
      checkpoint: "cp3",
      minutes: 45,
      teacher: [
        "Teams rebuild the slope with the same soil and build their first design. Run the same rain test and measure settled soil.",
        "Record cost and soil depth in the table.",
      ],
      students: ["Build and test.", "Record the data."],
      watchFor:
        "Changing two things at once. Ask what changed since the control, and require one change for each test.",
    },
    {
      day: 6,
      title: "Build and test design two",
      checkpoint: "cp3",
      minutes: 45,
      teacher: [
        "Teams test a second design the same way. Gather results on the board.",
        "Ask: what do you notice when we compare designs with the same cost?",
      ],
      students: ["Build and test design two.", "Add the row to the table."],
      watchFor: "A design that looks great but measures about the same. Let the data lead.",
    },
    {
      day: 7,
      title: "Graph and compare",
      checkpoint: "cp3",
      minutes: 45,
      teacher: [
        "Teams make a bar graph of settled soil for each design, including the control.",
        "Model reading the graph: which design held the most soil, and how many millimeters less was in the cup compared with the bare slope?",
      ],
      students: ["Make the graph.", "Write two comparison sentences."],
      watchFor: "Graph bars that do not match the table. Ask a partner to check each bar.",
    },
    {
      day: 8,
      title: "Improve the best design",
      checkpoint: "cp4",
      minutes: 45,
      teacher: [
        "Teams choose their best design and decide one change to improve it. Remind them to stay within $12.",
        "Teams build and test the improved design.",
      ],
      students: ["Write what they will change and why.", "Test and record."],
      watchFor: "Improvements that spend over the budget. Ask what they can remove to pay for it.",
    },
    {
      day: 9,
      title: "Write the evidence explanation",
      checkpoint: "cp4",
      minutes: 45,
      teacher: [
        "Model a claim, evidence and reasoning paragraph about the best design. Use a sentence from one team's data as the model.",
        "Teams write their own paragraph and prepare a two-minute design review.",
      ],
      students: ["Write the paragraph.", "Rehearse the review with a partner."],
      watchFor: "Evidence without numbers. Ask, 'How many millimeters?'",
    },
    {
      day: 10,
      title: "Design review",
      checkpoint: "cp5",
      minutes: 45,
      teacher: [
        "Teams present to a panel of staff or visiting students who ask questions. Use the review frames on this page.",
        "Close with the self-assessment and ask: which design would you recommend to the principal and why?",
      ],
      students: ["Present for two minutes.", "Answer two questions with evidence."],
      watchFor: "Panels asking only about how it looks. Have them ask about the numbers.",
    },
  ],
  studentDirections: [
    "Write the problem in one sentence. List two criteria and the constraints.",
    "Fill the pan with soil. Raise one end the same height every test.",
    "Run the bare slope test with 250 mL of water in 30 seconds. Measure the settled soil in millimeters.",
    "Sketch three designs. Add up what each one costs. Stay at or under $12.",
    "Build one design at a time. Run the same test. Record the cost and the soil depth.",
    "Make a bar graph of the soil depth for every design.",
    "Choose the best design. Change one thing to improve it. Test again.",
    "Write your claim, your evidence and your reasoning.",
    "Present to the design review panel and answer their questions.",
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Problem, criteria and control test",
      days: "Sessions 1 and 2",
      evidence:
        "A one-sentence problem statement, at least two criteria and two constraints, and a control test record with the soil depth for the bare slope.",
      prompt: "Write the problem, two criteria and the constraints. Then record the control test.",
      teacherLook: [
        "Criteria can be measured (less soil in the cup).",
        "Constraints include the $12 budget and the materials list.",
        "The control used the same slope height, water and time as every later test.",
      ],
      tool: null,
    },
    {
      id: "cp2",
      title: "Explaining erosion and planning three designs",
      days: "Sessions 3 and 4",
      evidence:
        "A labeled diagram using erosion, runoff and deposit, two explaining sentences, and sketches of three designs with costs.",
      prompt:
        "Label the slope. Explain how running water moves soil. Sketch and cost three designs.",
      teacherLook: [
        "The explanation says water carried soil downhill and left it at the bottom.",
        "Each sketch names materials and a total cost within $12.",
        "At least one design uses plant roots or a barrier that slows water.",
      ],
      tool: null,
    },
    {
      id: "cp3",
      title: "Test data and graph",
      days: "Sessions 5 to 7",
      evidence:
        "A data table with the control and at least two designs (cost and soil depth) and a bar graph that matches it.",
      prompt:
        "Test two designs. Record the data. Graph the soil depth for the control and each design.",
      teacherLook: [
        "Only one thing changed between tests.",
        "The bars match the numbers.",
        "Students compare designs with numbers, for example 'about 6 mm less than the bare slope'.",
      ],
      tool: null,
    },
    {
      id: "cp4",
      title: "Improved design and evidence explanation",
      days: "Sessions 8 and 9",
      evidence:
        "An improved design test, a note on what changed and why, and a claim, evidence and reasoning paragraph.",
      prompt:
        "Change one thing in your best design, test again and write a paragraph that uses your data.",
      teacherLook: [
        "The improved design has a measurable result.",
        "The paragraph states a claim, uses at least two numbers as evidence and explains why the design worked.",
        "The design stays within the budget.",
      ],
      tool: null,
    },
    {
      id: "cp5",
      title: "Design review",
      days: "Session 10",
      evidence: "A two-minute presentation with a graph and answers to two panel questions.",
      prompt: "Show your best design, say what the data shows and answer two questions.",
      teacherLook: [
        "The talk includes cost and soil depth.",
        "Answers refer to the data rather than opinion.",
        "The team names one thing they would test next.",
      ],
      tool: null,
    },
  ],
  visuals: [
    {
      id: "cycle",
      title: "The engineering design cycle",
      caption:
        "Teams go around the cycle more than once. The second trip uses what the first test taught.",
      visual: designCycle,
    },
    {
      id: "cost",
      title: "Materials and budget",
      caption: "Prices are invented for this project. Each team has $12.",
      visual: costSheet,
    },
    {
      id: "data",
      title: "Reading a test record",
      caption:
        "Compare each design with the bare slope. The numbers here are an example for learning the table.",
      visual: testTable,
      teacherNote:
        "Ask: which design is the best value, not just the best result? A design that costs $9 and saves 11 mm may not beat one that costs $3 and saves 5 mm. Let the class argue it with numbers.",
    },
  ],
  organizers: [
    { template: "cer", use: "Claim, evidence and reasoning for the best design (checkpoint 4)." },
    {
      template: "science-journal",
      use: "Test records with a drawing and measurements (checkpoint 3).",
    },
    { template: "sequence", use: "Order the steps of a fair test (session 2)." },
    { template: "gallery-walk", use: "Design review stations (checkpoint 5)." },
  ],
  vocab: {
    entries: [
      {
        id: "erosion",
        word: "erosion",
        def: "When water, wind or ice moves soil and rock from one place to another.",
        example: "Rain caused erosion on the bare slope.",
      },
      {
        id: "runoff",
        word: "runoff",
        def: "Water that flows over the land instead of soaking in.",
        example: "The runoff carried soil into the cup.",
      },
      {
        id: "deposit",
        word: "deposit",
        def: "To drop soil or rock in a new place.",
        example: "The water deposited mud at the bottom.",
      },
      {
        id: "slope",
        word: "slope",
        def: "A surface that is higher on one side than the other.",
        example: "A steeper slope makes water move faster.",
      },
      {
        id: "criteria",
        word: "criteria",
        def: "What a good solution must do.",
        example: "One criterion is to keep soil in the pan.",
      },
      {
        id: "constraint",
        word: "constraint",
        def: "A limit on what you can use or do.",
        example: "Our budget of $12 is a constraint.",
      },
      {
        id: "prototype",
        word: "prototype",
        def: "A first model of a design that you test and improve.",
        example: "Our prototype used sod and craft sticks.",
      },
      {
        id: "evidence",
        word: "evidence",
        def: "Facts and measurements that show something is true.",
        example: "The soil depth is our evidence.",
      },
      {
        id: "control",
        word: "control",
        def: "A test with no change so you have something to compare to.",
        example: "The bare slope is our control.",
      },
    ],
  },
  supports: {
    ee: {
      directions:
        "Work with a partner. Point to the model and say each step before you write. Use the word bank and the pictures.",
      frames: ["The water moves ___.", "The soil is ___ millimeters.", "Design ___ is better."],
      wordBank: ["water", "soil", "slope", "hill", "test", "design", "measure", "more", "less"],
      oral: "Partner A pours and says what happens. Partner B measures and says the number. Switch.",
    },
    dev: {
      directions: "Use the frames to write and speak. Check your numbers with a partner.",
      frames: [
        "Design ___ held more soil than ___ because ___.",
        "The soil in the cup was ___ millimeters.",
        "We changed ___ and the soil changed from ___ to ___.",
      ],
      wordBank: ["erosion", "runoff", "deposit", "criteria", "constraint", "evidence", "budget"],
      oral: "Tell a partner how your design slows the water.",
    },
    exp: {
      directions: "Write in full sentences with because. Use frames only to start.",
      frames: [
        "Our design reduced erosion because ___, which the data shows: ___ compared with ___.",
        "If we could test again, we would change ___ because ___.",
      ],
      wordBank: ["prototype", "control", "variable", "compare", "reduce", "effective"],
      oral: "Defend your best design to a partner who chose a different one.",
    },
    br: {
      directions:
        "Write a precise claim, evidence and reasoning. Evaluate your design against the criteria and constraints.",
      frames: [],
      wordBank: ["trade-off", "effectiveness", "cost-effective", "limitation", "variable"],
      oral: "Evaluate another team's data for fairness and suggest an improvement.",
    },
  },
  rubric: {
    criteria: [
      {
        id: "problem-criteria",
        label: "Problem, criteria and constraints",
        levels: [
          lv(
            4,
            "Extending",
            "States a measurable problem, criteria and constraints, and checks each design against all three.",
          ),
          lv(
            3,
            "Meeting",
            "States the problem, two measurable criteria and the budget constraint.",
          ),
          lv(
            2,
            "Approaching",
            "States the problem and a criterion that cannot be measured, or misses the budget.",
          ),
          lv(1, "Beginning", "Restates the task without criteria or constraints."),
        ],
      },
      {
        id: "fair-test-data",
        label: "Fair testing and data",
        levels: [
          lv(
            4,
            "Extending",
            "Changes one thing per test, repeats a test to check, and records and graphs data accurately.",
          ),
          lv(
            3,
            "Meeting",
            "Changes one thing per test, records cost and soil depth, and the graph matches the table.",
          ),
          lv(
            2,
            "Approaching",
            "Records data, but more than one thing changed or one bar does not match.",
          ),
          lv(1, "Beginning", "Gives observations without measurements."),
        ],
      },
      {
        id: "explanation",
        label: "Explanation with evidence",
        levels: [
          lv(
            4,
            "Extending",
            "Claim, at least two numbers as evidence and reasoning about how the design slows water or holds soil.",
          ),
          lv(3, "Meeting", "Claim with evidence from the data and a reason that links to erosion."),
          lv(2, "Approaching", "Claim with one fact but little reasoning."),
          lv(1, "Beginning", "A claim without data."),
        ],
      },
      {
        id: "improvement",
        label: "Improvement",
        levels: [
          lv(
            4,
            "Extending",
            "Improves the design from data, stays in budget and shows the change in soil depth.",
          ),
          lv(3, "Meeting", "Changes one thing from the data and retests."),
          lv(2, "Approaching", "Changes the design but without using the data."),
          lv(1, "Beginning", "Does not retest."),
        ],
      },
      {
        id: "communication",
        label: "Design review",
        levels: [
          lv(
            4,
            "Extending",
            "Presents clearly with the graph and answers panel questions with specific numbers.",
          ),
          lv(
            3,
            "Meeting",
            "Presents the design, cost and soil depth and answers questions with the data.",
          ),
          lv(2, "Approaching", "Presents the design but answers without data."),
          lv(1, "Beginning", "Needs prompts to explain."),
        ],
      },
    ],
  },
  selfAssessment: [
    "I can explain how running water moves soil.",
    "I can run a fair test and measure the result.",
    "I can compare designs with numbers.",
    "I can improve a design using what the test showed.",
    "I can explain my design to a panel.",
  ],
  peerFeedback: {
    structure: [
      "The panel looks at the graph before the team speaks.",
      "Each panelist asks one question about the data and gives one suggestion.",
      "The team answers using numbers and records one change they would make.",
    ],
    frames: tiers(
      ["I see ___ on your graph.", "My question is ___."],
      ["Your graph shows ___. Why did ___ work better?", "You could try ___."],
      ["Your data shows ___. I wonder whether ___ because ___."],
      ["Given your data, one limitation is ___. A test that would address it is ___."],
    ),
  },
  revision: {
    when: "After the first designs are tested (session 7) and after the design review (session 10).",
    steps: [
      "Read the graph and find the design with the least soil in the cup.",
      "Decide one change and say what you expect it to do.",
      "Test it with the same slope, water and time.",
      "Write what changed and what the data shows.",
    ],
    evidence: "A before-and-after soil depth and a sentence that explains the change.",
  },
  finalProduct: {
    title: "A tested slope design and a design review",
    description:
      "A model slope design with test data, a bar graph, a claim, evidence and reasoning paragraph, and a two-minute design review for a panel.",
    parts: [
      "The problem, criteria and constraints",
      "The control test and at least two designs with cost and soil depth",
      "A bar graph of all tests",
      "An improved design test",
      "A claim, evidence and reasoning paragraph",
      "A two-minute design review",
    ],
    successCriteria: [
      "Every test used the same slope, water and time.",
      "The recommended design stays within $12.",
      "The explanation uses measurements.",
    ],
    audience: "The principal or a panel of staff and visiting students",
  },
  tools: [],
  studioTools: [],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

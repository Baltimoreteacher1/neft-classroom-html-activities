// Flagship project 1 (math, grades 6-7): design a neighborhood park to scale. Original; no publisher text.
const lv = (score, label, descriptor) => ({ score, label, descriptor });

const parkPlan = {
  kind: "labeled",
  w: 480,
  h: 320,
  alt: "Plan view of a rectangular lot with a playground, a basketball court, a garden, a picnic area and a straight path across the middle.",
  longDesc:
    "A rectangle stands for the whole lot, 120 meters by 80 meters. A playground sits in the top left corner, a half-court in the top right corner, a garden in the bottom left, a picnic area in the bottom right, and a narrow path runs left to right across the middle of the lot.",
  base: {
    kind: "shapes",
    w: 480,
    h: 320,
    alt: "Plain plan of the lot with four zones and a path.",
    items: [
      { t: "rect", x: 60, y: 40, w: 360, h: 240, fill: "paper", stroke: "navy" },
      { t: "rect", x: 80, y: 60, w: 45, h: 36, fill: "ochre", stroke: "ink" },
      { t: "rect", x: 355, y: 60, w: 45, h: 42, fill: "coral", stroke: "ink" },
      { t: "rect", x: 80, y: 215, w: 30, h: 24, fill: "sage", stroke: "ink" },
      { t: "rect", x: 320, y: 220, w: 60, h: 30, fill: "sky", stroke: "ink" },
      { t: "rect", x: 60, y: 157, w: 360, h: 6, fill: "line", stroke: "ink" },
    ],
  },
  labels: [
    { text: "Playground 15 m by 12 m", x: 102, y: 78, tx: 150, ty: 20 },
    { text: "Half-court 15 m by 14 m", x: 377, y: 81, tx: 330, ty: 20 },
    { text: "Garden 10 m by 8 m", x: 95, y: 227, tx: 130, ty: 305 },
    { text: "Picnic area 20 m by 10 m", x: 350, y: 235, tx: 340, ty: 305 },
    { text: "Path 2 m wide", x: 240, y: 160, tx: 240, ty: 140 },
  ],
};

const scaleTape = {
  kind: "tape",
  w: 480,
  h: 220,
  alt: "Two matching bars: one centimeter on the drawing lines up with five meters in the park.",
  rows: [
    { label: "Drawing (cm)", parts: [{ label: "1 cm", units: 1, color: "teal" }] },
    { label: "Park (m)", parts: [{ label: "5 m", units: 5, color: "ochre" }] },
  ],
};

const scaleTable = {
  kind: "table",
  w: 480,
  h: 280,
  alt: "A ratio table for the scale of 1 centimeter to 5 meters, showing five matching pairs of drawing length and park length.",
  longDesc:
    "Drawing length in centimeters and park length in meters: 1 and 5, 2 and 10, 6 and 30, 20 and 100, 24 and 120.",
  head: ["Drawing (cm)", "Park (m)"],
  rows: [
    ["1", "5"],
    ["2", "10"],
    ["6", "30"],
    ["20", "100"],
    ["24", "120"],
  ],
  highlight: [
    [4, 0],
    [4, 1],
  ],
};

const costSheet = {
  kind: "table",
  w: 480,
  h: 260,
  alt: "Committee cost sheet listing the price per square meter for four surfaces.",
  longDesc:
    "Safety surface for playground: 60 dollars per square meter. Court surface: 45 dollars. Paved path: 40 dollars. Garden beds: 15 dollars. Grass and trees are donated and cost nothing.",
  head: ["Surface", "Cost per square meter"],
  rows: [
    ["Playground safety surface", "$60"],
    ["Court surface", "$45"],
    ["Paved path", "$40"],
    ["Garden beds", "$15"],
    ["Grass and donated trees", "$0"],
  ],
};

const areaScale = {
  kind: "table",
  w: 480,
  h: 250,
  alt: "Table comparing a length scale factor with the area it produces: lengths grow by a factor of 5 in meters per centimeter, areas grow by a factor of 25.",
  longDesc:
    "On the drawing a 3 cm by 2 cm rectangle has an area of 6 square centimeters. In the park it is 15 m by 10 m, an area of 150 square meters. Each square centimeter on the drawing stands for 25 square meters.",
  head: ["", "Drawing", "Park", "Park area per drawing area"],
  rows: [
    ["Length", "3 cm", "15 m", "5 m for each 1 cm"],
    ["Width", "2 cm", "10 m", "5 m for each 1 cm"],
    ["Area", "6 sq cm", "150 sq m", "25 sq m for each 1 sq cm"],
  ],
  highlight: [[2, 3]],
};

const tiers = (ee, dev, exp, br) => ({ ee, dev, exp, br });

export default {
  id: "neighborhood-park-scale",
  kind: "project",
  title: "Design a Neighborhood Park to Scale",
  subtitle: "A scale drawing, a cost check and a pitch to the neighborhood committee",
  drivingQuestion:
    "How can we use scale to design a park that fits an empty lot, stays inside a budget and works for the people who live nearby?",
  studentQuestion:
    "How do you shrink a whole park onto one page without changing its shape, and how do you know your drawing tells the truth?",
  grade: "7",
  grades: ["6", "7"],
  band: "6-8",
  bands: ["6-8"],
  subject: "math",
  subjects: ["math"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS 7.G.A.1, 7.RP.A.2, 6.RP.A.3 and 6.G.A.1; not mapped to a district unit sequence. Prices on the cost sheet are invented for this project.",
  },
  standards: ["7.G.A.1", "7.RP.A.2", "6.RP.A.3", "6.G.A.1", "SL.6.1"],
  wida: {
    eld: ["ELD-MA", "ELD-SI"],
    klus: ["Explain", "Argue"],
    domains: ["Speaking", "Writing"],
    cluster: "6-8",
  },
  sessions: 10,
  sessionMinutes: 50,
  duration: 500,
  intro:
    "A neighborhood group has been given an empty lot, 120 meters by 80 meters, and a small budget. They want a park, but nobody can walk the whole plan on paper. Your team is the design studio. You will choose a scale, turn real sizes into drawing sizes, check each other's measuring, count what the surfaces will cost, and then defend your plan to the committee. A scale drawing only works if every length is changed by the same rule, so the mathematics is the thing that makes the park believable.",
  hook: "Show the class the plain 120 m by 80 m lot outline on the board and ask: how big is that on a sheet of paper, and who decides?",
  contentTargets: [
    "I can choose a scale and use it to find the drawing length for a real length, and the real length for a drawing length.",
    "I can use a table of equivalent ratios to check that every measurement in a scale drawing follows the same scale.",
    "I can find real areas from a scale drawing and explain why area changes by the square of the length scale.",
    "I can redraw part of a plan at a different scale and explain what changed and what stayed the same.",
  ],
  languageTargets: [
    {
      function: "Explain a scale and justify a measurement",
      structure:
        "One centimeter on the drawing stands for ___ meters in the park, so ___ centimeters stands for ___ meters.",
      text: "I can explain how my scale works using the words scale, drawing length, actual length and because.",
    },
    {
      function: "Give and respond to critique of a plan",
      structure:
        "I measured ___ and I got ___. With the scale, that means ___ in the park. That matches / does not match your table because ___.",
      text: "I can give a partner precise feedback on the measurements in their drawing and respond to feedback on mine.",
    },
  ],
  materials: [
    "1-centimeter grid paper, one sheet per team (landscape, at least 24 cm by 16 cm of grid)",
    "Rulers marked in centimeters and millimeters, one per student",
    "Colored pencils or markers",
    "Calculators for the cost step (computing by hand is fine for strong teams; the thinking is in the setup)",
    "The committee brief and the cost sheet (printed from this page)",
    "Sticky notes in two colors for peer feedback",
  ],
  prep: [
    "Print the committee brief (the lot is 120 m by 80 m; features must include a playground, a half-court, a garden, a picnic area and a 2-meter-wide path) and the cost sheet.",
    "Decide whether all teams use the default scale of 1 cm to 5 m or choose their own. The tool and the numbers in this guide assume 1 cm to 5 m; other scales work if students complete the ratio table first.",
    "Draw the plain lot outline on the board at 1 cm to 5 m (24 cm by 16 cm) so students can see what the scale does to the real lot.",
    "Pre-sort teams of three with roles: Measurer, Recorder, Presenter. Rotate roles each checkpoint.",
    "Run the scale-calculator activity once yourself so you know where students get stuck (dividing versus multiplying, and the area step).",
  ],
  facilitation: [
    {
      day: 1,
      title: "The lot and the first scale",
      checkpoint: "cp1",
      minutes: 50,
      teacher: [
        "Launch with the board outline. Ask: if this whole page is the lot, what does one centimeter on it stand for? Take three guesses and write each as 'one centimeter stands for ___ meters'.",
        "Introduce the committee brief. Read it aloud, then have teams underline every real measurement in it.",
        "Model one ratio table on the board: 1 cm : 5 m, then 2 cm : 10 m, then 24 cm : 120 m. Ask students to say what stays the same in every row (each cm is 5 m).",
      ],
      students: [
        "Choose a scale as a team and justify it (does the lot fit the page?).",
        "Fill a ratio table with at least five rows covering the lot's length and width.",
      ],
      watchFor:
        "Students add the same amount to both columns (2 cm : 6 m because 1 + 1 and 5 + 1). Return to the tape diagram: each centimeter is a group of 5 meters.",
    },
    {
      day: 2,
      title: "Convert both ways",
      checkpoint: "cp1",
      minutes: 50,
      teacher: [
        "Students open the scale-calculator tool. Circulate during the first two tasks; do not rescue early.",
        "Run a 5-minute number talk: a 7.5 cm path is how long in the park? A 45 m path is how long on the drawing? Collect the two operations and have students name which direction multiplies and which divides.",
        "Collect each team's table as the checkpoint evidence.",
      ],
      students: [
        "Complete the scale-calculator activity (all four tasks).",
        "Write one sentence per direction: drawing to park, park to drawing.",
      ],
      watchFor:
        "Putting 100 in the drawing column when 100 m is a park length. Ask 'where does this measurement live: on the paper or in the park?'.",
    },
    {
      day: 3,
      title: "Features and sizes",
      checkpoint: "cp2",
      minutes: 50,
      teacher: [
        "Give each team the feature list with real sizes (playground at least 15 m by 12 m; half-court 15 m by 14 m; garden at least 10 m by 8 m; picnic area at least 20 m by 10 m; path 2 m wide). Teams may enlarge a feature but not shrink it below the minimum.",
        "Model the feature table: real length, real width, drawing length, drawing width, real area. Do one row together.",
        "Introduce the green space goal: at least 40% of the lot must stay grass, garden or trees.",
      ],
      students: [
        "Choose sizes for each feature and fill the feature table.",
        "Find the real area of each feature.",
      ],
      watchFor:
        "Area computed from drawing lengths and reported in square meters. Ask 'which lengths did you multiply, and what unit is that area in?'.",
    },
    {
      day: 4,
      title: "Green space check and layout sketch",
      checkpoint: "cp2",
      minutes: 50,
      teacher: [
        "Ask: what is the total area of the lot? (9,600 square meters) and what is 40% of it? (3,840 square meters). Have teams subtract the built areas to see how much green space is left.",
        "Teams sketch their layout on scrap grid paper before touching the final sheet.",
        "Use the exit prompt: 'One thing my layout does for the neighbors is ___ because ___.'",
      ],
      students: [
        "Calculate the percent of the lot that stays green and decide whether the plan passes.",
        "Make a rough sketch with feature positions.",
      ],
      watchFor:
        "Teams that forget the 2 m path takes area too (2 m by 120 m is 240 square meters). Ask them to count every surface.",
    },
    {
      day: 5,
      title: "Draw the plan to scale",
      checkpoint: "cp3",
      minutes: 50,
      teacher: [
        "Teams draw the lot outline first, then place each feature with measured lengths from the feature table.",
        "Remind teams that the tool's ratio table is their ruler: if a measurement is not in their table, they add it.",
        "Hold a mini-lesson on measuring to the nearest half centimeter, and how drawing errors turn into park errors (a 2 mm slip is 1 m).",
      ],
      students: ["Draw the outline and at least three features, labeling each with its real size."],
      watchFor:
        "Drawing features by eye, then labeling them with the intended sizes. Ask the Measurer to check one length with a ruler.",
    },
    {
      day: 6,
      title: "Finish the drawing and check each other's measuring",
      checkpoint: "cp3",
      minutes: 50,
      teacher: [
        "Finish the drawing. Add a title, a scale statement and a scale bar.",
        "Run the measurement exchange: partners from a different team pick three lengths on the drawing, measure them, convert to real lengths and compare with the labels. Record matches and gaps in the table.",
      ],
      students: [
        "Complete the drawing.",
        "Complete a three-row measurement check for another team's plan.",
      ],
      watchFor: "A check that only says 'looks good'. Require measured numbers in the table.",
    },
    {
      day: 7,
      title: "Cost the plan",
      checkpoint: "cp4",
      minutes: 50,
      teacher: [
        "Hand out the cost sheet. Ask teams to predict whether they will go over the $40,000 budget before computing anything.",
        "Model the cost line: area in square meters times price per square meter. Do the playground together.",
        "Students compute cost for each surface and total the plan.",
      ],
      students: [
        "Calculate the cost of each surface and the total.",
        "Compare with the $40,000 budget.",
      ],
      watchFor:
        "Using the drawing area (square centimeters) in the cost formula. Ask 'does the cost sheet price a square centimeter or a square meter?'.",
    },
    {
      day: 8,
      title: "Revise, then redraw one part at a new scale",
      checkpoint: "cp4",
      minutes: 50,
      teacher: [
        "Teams over budget decide what to trade away; teams under budget decide what to add. Each team writes a revision note: what we changed, why, and what it did to the cost and the green space.",
        "Challenge: redraw the playground zone alone at 1 cm to 2 m on a fresh grid. Ask what stayed the same (the real sizes, the shape) and what changed (the drawing sizes, the area on paper).",
      ],
      students: [
        "Revise the plan and recompute cost and green space.",
        "Redraw the playground at the new scale and write one sentence comparing the two drawings.",
      ],
      watchFor:
        "Students scaling the drawing instead of the park (halving every length rather than using the new scale). Return to real sizes.",
    },
    {
      day: 9,
      title: "Prepare the pitch",
      checkpoint: "cp5",
      minutes: 50,
      teacher: [
        "Teams write a 90-second pitch: the scale, one measurement checked, the cost, the green space, one choice made for neighbors.",
        "Rehearse in pairs with the Presenter speaking and the Recorder holding the evidence.",
      ],
      students: [
        "Write and rehearse the pitch.",
        "Prepare the evidence folder: drawing, ratio table, feature table, cost table, revision note.",
      ],
      watchFor:
        "Pitches that list features without explaining the mathematics. Push for 'we know our drawing is accurate because ___'.",
    },
    {
      day: 10,
      title: "Present to the committee",
      checkpoint: "cp5",
      minutes: 50,
      teacher: [
        "Run a gallery walk with two teams presenting at a time. Visitors leave two sticky notes: one on the mathematics, one on the design.",
        "Close with the self-assessment and a whole-class discussion: what is the hardest part of keeping a drawing honest?",
      ],
      students: [
        "Present the plan.",
        "Complete the self-assessment and one piece of peer feedback.",
      ],
      watchFor: "Visitors giving only praise. Hold them to the feedback frames on this page.",
    },
  ],
  studentDirections: [
    "Read the committee brief. The lot is 120 meters by 80 meters. Underline every real measurement.",
    "Choose a scale as a team. Make a ratio table with at least five rows that includes the lot's length and width.",
    "Choose a size for the playground, the half-court, the garden, the picnic area and the path. Each must be at least as big as the brief says.",
    "For each feature, find the drawing length, the drawing width and the real area. Put them in the feature table.",
    "Check that at least 40 percent of the lot stays green. Show how you know.",
    "Draw the lot and every feature on grid paper. Add a title, your scale and a scale bar.",
    "Trade drawings with another team. Measure three lengths, convert each to real meters and compare with the labels.",
    "Use the cost sheet to find what your plan costs. Compare it with the $40,000 budget.",
    "Revise your plan. Write what you changed and why. Then redraw one feature at a different scale.",
    "Present your plan to the committee. Say your scale, one measurement you checked, your cost and your green space.",
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Our scale and ratio table",
      days: "Sessions 1 and 2",
      evidence:
        "A scale statement and a ratio table with at least five rows, including the lot's 120 m length and 80 m width converted to drawing lengths. The team can say in one sentence why the scale lets the lot fit the page.",
      prompt:
        "Write the scale as 'one centimeter on the drawing stands for ___ meters in the park', then fill the ratio table.",
      teacherLook: [
        "Every row keeps the same comparison (the unit rate is the same in each row).",
        "The lot's real sizes appear in the park column, not the drawing column.",
        "The scale is a reasonable fit for the paper.",
      ],
    },
    {
      id: "cp2",
      title: "Features, areas and green space",
      days: "Sessions 3 and 4",
      evidence:
        "A feature table with real length and width, drawing length and width, and real area for each feature; the total built area; the percent of the lot that stays green with the working shown.",
      prompt: "Fill the feature table. Then show that at least 40 percent of the lot is green.",
      teacherLook: [
        "Real areas are computed from real lengths and are in square meters.",
        "The path's area is counted.",
        "The green percent compares green area with the whole lot area (9,600 square meters).",
      ],
    },
    {
      id: "cp3",
      title: "Scale drawing and measurement check",
      days: "Sessions 5 and 6",
      evidence:
        "A completed scale drawing with title, scale and scale bar, plus a three-row measurement exchange table completed by another team (measured length, converted real length, label, match or gap).",
      prompt:
        "Finish your drawing. Then measure three lengths on another team's drawing and decide whether each matches its label.",
      teacherLook: [
        "At least three lengths agree within half a centimeter of drawing, which is under 2.5 m of park.",
        "The drawing is neat enough to measure: straight edges, labeled features.",
        "The gaps recorded in the exchange are real measurements, not guesses.",
      ],
      tool: null,
    },
    {
      id: "cp4",
      title: "Cost, revision and a second scale",
      days: "Sessions 7 and 8",
      evidence:
        "A cost table (area times price, one line per surface, with a total), a comparison with the $40,000 budget, a written revision note, and the playground redrawn at 1 cm to 2 m with one sentence comparing the two drawings.",
      prompt:
        "Find the cost of your plan, decide what to change, and then redraw the playground at a new scale.",
      teacherLook: [
        "Costs use real square meters, not drawing square centimeters.",
        "The revision note names what changed and what that did to the cost or green space.",
        "The redrawn playground has the same real size, so its drawing sides are 7.5 cm and 6 cm at the new scale.",
      ],
    },
    {
      id: "cp5",
      title: "Committee pitch",
      days: "Sessions 9 and 10",
      evidence:
        "A 90-second pitch and an evidence folder (drawing, tables, revision note). The pitch states the scale, one checked measurement, the cost against the budget and the green space, and one choice made for neighbors.",
      prompt: "Pitch your plan and show one measurement you checked.",
      teacherLook: [
        "The pitch uses mathematics words correctly and explains why the drawing is accurate.",
        "Evidence in the folder matches what is said.",
        "The presenter responds to at least one question using the evidence.",
      ],
      tool: null,
    },
  ],
  visuals: [
    {
      id: "plan",
      title: "A finished plan looks like this",
      caption:
        "Every feature is labeled with its real size. The lot is drawn on 1-centimeter grid at 1 cm to 5 m, so the lot is 24 cm by 16 cm.",
      visual: parkPlan,
      teacherNote:
        "Notice that the drawing is only a model: the picture is bigger than a student's real plan will be. Ask what would change if the scale were 1 cm to 10 m.",
    },
    {
      id: "scale",
      title: "What a scale says",
      caption:
        "One bar for the drawing, one for the park. Every centimeter on paper lines up with five meters.",
      visual: scaleTape,
    },
    {
      id: "table",
      title: "A ratio table that checks every row",
      caption: "The highlighted row is the whole 120 m length: 24 cm on the drawing.",
      visual: scaleTable,
    },
    {
      id: "cost",
      title: "The committee's cost sheet",
      caption:
        "Cost is area in square meters times the price in this table. The prices are invented for this project.",
      visual: costSheet,
    },
    {
      id: "area",
      title: "Why area grows faster than length",
      caption:
        "Lengths use a factor of 5 meters for each centimeter, but area uses 25 square meters for each square centimeter.",
      visual: areaScale,
      teacherNote:
        "This is the heart of 7.G.A.1. Have students draw a 1 cm by 1 cm square and count five-by-five meters inside it.",
    },
  ],
  organizers: [
    {
      template: "math-explain",
      use: "Each team member explains one conversion with a picture and numbers (checkpoint 1).",
    },
    {
      template: "partner-project",
      use: "Roles, plan and reflection for the design team (all checkpoints).",
    },
    {
      template: "error-analysis",
      use: "Peers analyze a drawing with one deliberate measurement error (checkpoint 3).",
    },
    {
      template: "gallery-walk",
      use: "Committee gallery walk with visitor feedback stations (checkpoint 5).",
    },
  ],
  vocab: {
    ids: [
      "scale",
      "scale-drawing",
      "actual-length",
      "scale-factor",
      "area",
      "dimensions",
      "budget",
      "revise",
    ],
  },
  supports: {
    ee: {
      directions:
        "Work with a partner. Say each step aloud before you write it. Use the pictures on this page and the word bank.",
      frames: [
        "One centimeter is ___ meters.",
        "The drawing is ___ centimeters. The park is ___ meters.",
        "I multiply / divide because ___.",
      ],
      wordBank: [
        "scale",
        "drawing",
        "park",
        "meter",
        "centimeter",
        "longer",
        "shorter",
        "area",
        "cost",
      ],
      oral: "Partner A reads the real length. Partner B says the drawing length. Switch.",
    },
    dev: {
      directions:
        "Use the frames to explain each conversion. Check your numbers with a partner before you move on.",
      frames: [
        "On the drawing it is ___ centimeters, so in the park it is ___ meters.",
        "The scale is ___, so I ___ to find ___.",
        "My plan costs ___ because the area is ___ square meters.",
      ],
      wordBank: [
        "scale",
        "scale drawing",
        "actual length",
        "convert",
        "ratio",
        "square meters",
        "budget",
        "revise",
      ],
      oral: "Explain one row of your ratio table to a partner using 'because'.",
    },
    exp: {
      directions:
        "Explain your reasoning in full sentences. Use the frames only to start, and add precise mathematics language.",
      frames: [
        "Because every ___ on the drawing stands for ___, a length of ___ becomes ___.",
        "The area changes by a factor of ___ because ___.",
        "If we changed the scale to ___, then ___.",
      ],
      wordBank: [
        "scale factor",
        "equivalent ratios",
        "proportional",
        "unit rate",
        "dimensions",
        "reasonable",
      ],
      oral: "Defend your scale choice to a partner who disagrees.",
    },
    br: {
      directions:
        "Write and speak with precision. Use the checklist: scale named with units, every claim backed by a calculation, area and length distinguished.",
      frames: [],
      wordBank: [
        "scale factor",
        "proportional relationship",
        "constant of proportionality",
        "area scales by the square of the length scale",
      ],
      oral: "Critique another team's plan using measured evidence, and revise your own in response.",
    },
  },
  rubric: {
    criteria: [
      {
        id: "scale-accuracy",
        label: "Scale and accuracy",
        levels: [
          lv(
            4,
            "Extending",
            "States the scale with units. Every length checked in the exchange agrees with its label within half a centimeter, and the team explains and corrects one near-miss.",
          ),
          lv(
            3,
            "Meeting",
            "States the scale with units. At least three lengths in the exchange agree with their labels within half a centimeter.",
          ),
          lv(
            2,
            "Approaching",
            "States a scale, but one or more lengths in the exchange do not match, or the units are missing on some labels.",
          ),
          lv(
            1,
            "Beginning",
            "The scale is missing or the drawing is not consistent with the stated scale in most places.",
          ),
        ],
      },
      {
        id: "proportional-reasoning",
        label: "Proportional reasoning",
        levels: [
          lv(
            4,
            "Extending",
            "The ratio table covers every length used, and the team explains the same-rate rule and what the area factor of 25 means in their own words.",
          ),
          lv(
            3,
            "Meeting",
            "The ratio table has at least five rows with the same comparison in every row, and conversions go the right direction every time.",
          ),
          lv(
            2,
            "Approaching",
            "The ratio table has fewer than five rows, or one conversion goes the wrong direction or adds instead of multiplying.",
          ),
          lv(
            1,
            "Beginning",
            "Conversions are guessed or use addition, and no ratio table is shown.",
          ),
        ],
      },
      {
        id: "area-cost",
        label: "Area, cost and constraints",
        levels: [
          lv(
            4,
            "Extending",
            "All areas, costs and the green-space percent are correct, the path is included, and the revision shows the effect of each trade on both cost and green space.",
          ),
          lv(
            3,
            "Meeting",
            "Areas are computed from real lengths in square meters, the total cost is compared with the budget, and the green percent is correct with working shown.",
          ),
          lv(
            2,
            "Approaching",
            "Most areas are correct, but one uses drawing units or the path is left out of the totals.",
          ),
          lv(
            1,
            "Beginning",
            "Areas or costs are missing, or the budget and green space are not checked.",
          ),
        ],
      },
      {
        id: "communication",
        label: "Mathematical communication",
        levels: [
          lv(
            4,
            "Extending",
            "The pitch explains why the drawing is accurate using a measured check, answers a question with evidence, and links design choices to neighbors.",
          ),
          lv(
            3,
            "Meeting",
            "The pitch states the scale, one checked measurement, the cost and the green space, using mathematics words correctly.",
          ),
          lv(
            2,
            "Approaching",
            "The pitch lists features and numbers but does not say how the team knows the drawing is accurate.",
          ),
          lv(
            1,
            "Beginning",
            "The pitch is missing key information or the evidence does not match what is said.",
          ),
        ],
      },
      {
        id: "revision",
        label: "Revision",
        levels: [
          lv(
            4,
            "Extending",
            "The revision note names the change, the reason and the effect on the numbers, and the playground is redrawn correctly at the second scale with a comparison.",
          ),
          lv(
            3,
            "Meeting",
            "The revision note names what changed and why, and the playground is redrawn at 1 cm to 2 m with sides of 7.5 cm and 6 cm.",
          ),
          lv(
            2,
            "Approaching",
            "A revision is described but the reason or the effect is missing, or the redraw has one wrong side.",
          ),
          lv(1, "Beginning", "No revision is shown, or the redraw changes the shape."),
        ],
      },
    ],
  },
  selfAssessment: [
    "I can write my scale and use it to convert in both directions.",
    "I can check a ratio table row by comparing it with the first row.",
    "I can find a real area from real lengths and explain the units.",
    "I can explain why one square centimeter on my drawing is not one square meter in the park.",
    "I can tell a partner how I know my drawing is accurate.",
  ],
  peerFeedback: {
    structure: [
      "Partners from another team trade drawings and evidence folders.",
      "The reviewer measures three lengths and records them before saying anything.",
      "The reviewer gives one glow (something exact), one grow (one measurement that does not match) and one question.",
      "The author responds with a revision plan using the frame for their support level.",
    ],
    frames: tiers(
      [
        "I measured ___ centimeters.",
        "That is ___ meters. It matches / does not match.",
        "A question I have is ___.",
      ],
      [
        "I measured ___ and I got ___ meters in the park. That matches / does not match your label because ___.",
        "One thing that is exact is ___.",
      ],
      [
        "Using your scale, ___ centimeters should be ___ meters, but your label says ___. One way to fix it is ___.",
      ],
      [
        "Your scale predicts ___ for this length, which differs from your label by ___. I would revise by ___ because ___.",
      ],
    ),
  },
  revision: {
    when: "After the measurement exchange (checkpoint 3) and again after the cost check (checkpoint 4).",
    steps: [
      "Read your partner's three measurements. Mark each as a match or a gap.",
      "For every gap, decide whether the label or the drawing is wrong, using the scale.",
      "Fix the drawing or the label. Update the feature table and the cost table to match.",
      "Write the revision note: what changed, why and what it did to cost and green space.",
    ],
    evidence: "A dated before-and-after for at least one length and a revision note.",
  },
  finalProduct: {
    title: "A scale plan and a committee pitch",
    description:
      "A scale drawing of the park on grid paper with title, scale and scale bar, an evidence folder, and a 90-second pitch to the committee.",
    parts: [
      "The scale drawing with every feature labeled with its real size",
      "A ratio table that shows the scale",
      "A feature table with real and drawing sizes and real areas",
      "A cost table compared with the $40,000 budget and a green-space check",
      "A revision note and the playground redrawn at 1 cm to 2 m",
      "The pitch (about 90 seconds)",
    ],
    successCriteria: [
      "The drawing follows one scale everywhere.",
      "Areas are reported in square meters from real lengths.",
      "The plan is within budget or the team explains the trade-offs.",
      "At least 40 percent of the lot stays green.",
    ],
    audience: "The neighborhood committee (visiting classes, staff or family)",
  },
  tools: [],
  studioTools: [],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

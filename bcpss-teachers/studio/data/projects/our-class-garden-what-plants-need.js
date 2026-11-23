// Project: grade 2 science with early math. A fair test of what plants need, then a garden plan. Original; no publisher text.
const lv = (score, label, descriptor) => ({ score, label, descriptor });
const tiers = (ee, dev, exp, br) => ({ ee, dev, exp, br });

const investigationFlow = {
  kind: "flow",
  w: 480,
  h: 200,
  alt: "Five steps in order: plant seeds in four cups, give each cup its own conditions, look and draw, measure, make a graph.",
  steps: [
    { label: "Plant seeds in 4 cups" },
    { label: "Change one thing in each cup" },
    { label: "Look and draw" },
    { label: "Measure" },
    { label: "Make a graph" },
  ],
};

const cupPlan = {
  kind: "table",
  w: 480,
  h: 250,
  alt: "Plan for four cups. Every cup has the same seeds, soil and cup. Cup A gets light and water, cup B gets light and no water, cup C gets water and no light, cup D gets no light and no water.",
  longDesc:
    "Cup A: light and water. Cup B: light, no water. Cup C: no light, water. Cup D: no light, no water. The seeds, the soil and the cup are the same in all four.",
  head: ["Cup", "Light", "Water"],
  rows: [
    ["A", "Yes, by the window", "Yes, a little each day"],
    ["B", "Yes, by the window", "No"],
    ["C", "No, inside a box", "Yes, a little each day"],
    ["D", "No, inside a box", "No"],
  ],
};

const sampleGraph = {
  kind: "bars",
  w: 480,
  h: 260,
  alt: "Example bar graph of plant height after ten days: cup A 8 centimeters, cup B 0, cup C 10, cup D 0.",
  longDesc:
    "This is an example for learning to read a graph, not what your class will see. Cup A is 8 centimeters tall, cup B is 0, cup C is 10 centimeters tall and pale, and cup D is 0.",
  data: [
    { label: "Cup A", value: 8 },
    { label: "Cup B", value: 0 },
    { label: "Cup C", value: 10 },
    { label: "Cup D", value: 0 },
  ],
  unit: "cm",
};

export default {
  id: "our-class-garden-what-plants-need",
  kind: "project",
  title: "Our Class Garden: What Do Plants Need?",
  subtitle: "A fair test with four cups, a picture graph and a garden plan",
  drivingQuestion:
    "What do plants need to grow, and how can we use what we find out to plan a garden for our class?",
  studentQuestion:
    "If we plant the same seeds in four cups and change only one thing, what will happen to each plant?",
  grade: "2",
  grades: ["2"],
  band: "k-2",
  bands: ["k-2"],
  subject: "science",
  subjects: ["science", "math"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS 2-LS2-1 and CCSS 2.MD.D.10; not mapped to a district unit sequence.",
  },
  standards: ["2-LS2-1", "2.MD.D.10", "W.2.7", "SL.2.1"],
  wida: {
    eld: ["ELD-SC", "ELD-SI"],
    klus: ["Inform", "Explain"],
    domains: ["Speaking", "Listening", "Writing"],
    cluster: "2-3",
  },
  sessions: 8,
  sessionMinutes: 40,
  duration: 320,
  intro:
    "Your class will find out what plants need by running a fair test. Four cups get the same seeds and the same soil. Each cup gets a different mix of light and water. Children look, draw, measure and talk about what they see over about two weeks, then make a graph and use it to plan where a class garden should go. The big idea is that a fair test changes one thing at a time, so the plants can tell us the answer.",
  hook: "Hold up a dry seed and a healthy small plant. Ask: what does the seed need to become the plant? Write three guesses on the board and keep them for the end.",
  contentTargets: [
    "I can plan a fair test with my class: the seeds, soil and cups stay the same, and only light or water changes.",
    "I can look closely at a plant, draw it and measure how tall it is.",
    "I can make a bar graph of our plant heights and say which cup grew the tallest.",
    "I can use what we found to say what plants need and where a garden should go.",
  ],
  languageTargets: [
    {
      function: "Describe what we observe",
      structure: "The plant in cup ___ is ___ centimeters tall. It is ___ (green / pale / yellow).",
      text: "I can describe a plant with numbers and color words.",
    },
    {
      function: "Explain a result with because",
      structure: "The plant in cup ___ grew / did not grow because it got / did not get ___.",
      text: "I can explain why a plant grew or did not grow using because.",
    },
  ],
  materials: [
    "Four clear plastic cups with drainage holes (or small pots) per team, labeled A to D",
    "Potting soil and quick-sprouting seeds such as bean or radish seeds, 3 seeds per cup",
    "A cardboard box or dark cabinet to keep two cups out of the light",
    "A sunny window ledge",
    "A small measuring cup so every watered cup gets the same amount",
    "Rulers in centimeters, or paper strips and linking cubes",
    "Observation sheets with a box for a drawing and a line for words",
    "Grid paper, crayons and sticky notes for the class graph",
  ],
  prep: [
    "Plant the cups on session 1 so the seeds have time to sprout. Sessions 2 to 6 can be short observation visits of about 10 minutes and the rest of the period can be used for the math and writing pieces.",
    "Decide the watering amount, for example a quarter cup every other day, and tape it on the water cup so every team uses the same amount.",
    "Know what to expect: seeds that get no water usually never sprout. Seeds without light often sprout using food stored in the seed, grow tall and thin, look pale, and become weak. Height alone does not tell the whole story, so children record color and strength as well.",
    "Keep a few spare cups planted in full light and water in case a team's cup fails for another reason, such as a spilled cup.",
  ],
  facilitation: [
    {
      day: 1,
      title: "A question and a fair test",
      checkpoint: "cp1",
      minutes: 40,
      teacher: [
        "Show the four-cup plan. Ask children what is the same in every cup (seeds, soil, cup) and what is different (light, water). Write 'same' and 'different' on the board.",
        "Plant three seeds in each cup. Label cups A to D and place A and B by the window and C and D in the box.",
        "Children draw the cups and predict which cup will grow best.",
      ],
      students: [
        "Plant the seeds with a partner.",
        "Draw the four cups and write or say a prediction.",
      ],
      watchFor:
        "Children who say a plant needs 'love' or 'music'. Accept the idea and say, 'Our test can check light and water.'",
    },
    {
      day: 2,
      title: "First look",
      checkpoint: "cp1",
      minutes: 40,
      teacher: [
        "Visit the cups. Ask what each child sees. Model the sentence 'I see ___. I wonder ___.'",
        "Add water to cups A and C only, in the same measured amount.",
      ],
      students: [
        "Draw each cup.",
        "Tell a partner one thing that is the same and one that is different.",
      ],
      watchFor: "Watering cups B and D by accident. Use a sticky note 'no water' on those cups.",
    },
    {
      day: 3,
      title: "Observe and measure",
      checkpoint: "cp2",
      minutes: 40,
      teacher: [
        "Show how to measure from the soil to the top of the tallest sprout with a paper strip or a ruler. Measure one plant together.",
        "Teams record height and color for each cup in the class table.",
      ],
      students: ["Measure each cup.", "Draw a plant and write one sentence with the frame."],
      watchFor:
        "Measuring from the bottom of the cup. Point to the soil line and say 'start here'.",
    },
    {
      day: 4,
      title: "Observe again",
      checkpoint: "cp2",
      minutes: 40,
      teacher: [
        "Repeat the observation routine and water cups A and C. Ask children what changed since the last visit.",
        "Add a second row to the class table. Ask: which cup is changing the most?",
      ],
      students: ["Measure and draw again.", "Say what changed using 'before' and 'now'."],
      watchFor: "Children who guess instead of looking. Ask, 'Where do you see that?'",
    },
    {
      day: 5,
      title: "The last measure and a first claim",
      checkpoint: "cp2",
      minutes: 40,
      teacher: [
        "Do the final measure after about ten days of growth. Ask about color and strength too: is the plant standing up or falling over?",
        "Gather the final heights on sticky notes on the board for the graph.",
      ],
      students: ["Take the last measure.", "Write what each cup looks like with color words."],
      watchFor:
        "Declaring the tallest plant the best. If cup C is tall but pale and floppy, ask, 'Is it healthy?'",
    },
    {
      day: 6,
      title: "Make the graph",
      checkpoint: "cp3",
      minutes: 40,
      teacher: [
        "Show how to make a bar graph with one square for each centimeter. Do cup A together.",
        "Teams graph all four cups, then answer: which is tallest, which is shortest, and how many centimeters is the difference?",
      ],
      students: ["Make the bar graph.", "Answer two questions about it."],
      watchFor: "Bars that do not start at zero. Remind children to start at the line.",
    },
    {
      day: 7,
      title: "What do plants need?",
      checkpoint: "cp3",
      minutes: 40,
      teacher: [
        "Revisit the three guesses from the hook. Ask which the cups can tell us about.",
        "Model a claim with because: 'Plants need water, because the cups with no water did not grow.' Children write their own claim for light, using what they saw.",
      ],
      students: [
        "Write a claim for water and a claim for light.",
        "Share with a partner using the frame.",
      ],
      watchFor:
        "Claims without evidence. Ask, 'Which cup shows that?' and have children point to the graph.",
    },
    {
      day: 8,
      title: "Plan the garden and teach a visitor",
      checkpoint: "cp4",
      minutes: 40,
      teacher: [
        "Show a drawing of the school yard or a windowsill. Ask where a garden would get light and where water could come from.",
        "Children draw a garden plan with a sun, a water source and plants, and practice a 30-second talk for a visiting class.",
      ],
      students: ["Draw the garden plan.", "Give the talk to a partner, then to a visitor."],
      watchFor: "Plans that put plants in a shady corner. Ask, 'What did cups C and D teach us?'",
    },
  ],
  studentDirections: [
    "Look at the four cups. Say what is the same and what is different.",
    "Plant three seeds in each cup. Put cups A and B by the window. Put cups C and D in the box.",
    "Give water only to cups A and C. Use the same amount each time.",
    "Look at the cups on each observation day. Draw one plant and write one sentence about it.",
    "Measure the tallest plant in each cup. Write the number in the class table.",
    "Make a bar graph of the four heights.",
    "Write what plants need and use the word because. Point to the cup that shows it.",
    "Draw a garden plan. Show where the sun and the water are.",
    "Tell a visitor what you found out.",
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Our fair test plan",
      days: "Sessions 1 and 2",
      evidence:
        "A drawing of the four cups with the same things and the different things labeled, and a prediction in words or a spoken sentence.",
      prompt:
        "Draw the four cups. Write or say what is the same and what is different. Say which cup you think will grow best.",
      teacherLook: [
        "The child can name at least two things that stay the same (seeds, soil, cup).",
        "The child says light or water is what changes.",
        "The prediction is a guess, and it is kept, not corrected.",
      ],
      tool: null,
    },
    {
      id: "cp2",
      title: "Observation log",
      days: "Sessions 3 to 5",
      evidence:
        "At least two observation pages, each with a drawing, a measure in centimeters, a color word and one sentence.",
      prompt:
        "Draw one plant from cup A. Measure it. Write: The plant in cup ___ is ___ centimeters tall. It is ___.",
      teacherLook: [
        "The measure starts at the soil line.",
        "The sentence matches the drawing.",
        "The child records cups with no sprouts as 0 and says why that matters.",
      ],
      tool: null,
    },
    {
      id: "cp3",
      title: "Graph and claim",
      days: "Sessions 6 and 7",
      evidence:
        "A bar graph of the four heights with a title and labels, and a written or spoken claim with because that points to a cup.",
      prompt:
        "Make a bar graph of the heights. Then write: Plants need ___ because the plant in cup ___ ___.",
      teacherLook: [
        "The bars match the numbers in the table.",
        "The claim says plants need water and light.",
        "Color and strength are part of the reason for light, not height alone.",
      ],
      tool: null,
    },
    {
      id: "cp4",
      title: "Garden plan and visitor talk",
      days: "Session 8",
      evidence:
        "A garden plan drawing with sun and water shown and a 30-second talk that names what plants need.",
      prompt:
        "Draw your garden plan. Tell a visitor what plants need and where our garden should go.",
      teacherLook: [
        "The plan puts plants where there is light and where water can reach.",
        "The talk uses one fact from the class graph.",
        "The child answers one question from the visitor.",
      ],
      tool: null,
    },
  ],
  visuals: [
    {
      id: "flow",
      title: "Our investigation in five steps",
      caption: "We plant, change one thing, look, measure and graph.",
      visual: investigationFlow,
    },
    {
      id: "plan",
      title: "The four cups",
      caption: "The seeds, soil and cup are the same. Only light and water are different.",
      visual: cupPlan,
      teacherNote:
        "Cup D shows what happens when both are missing. It is the cup children often forget, and it helps them see that each need is separate.",
    },
    {
      id: "graph",
      title: "Reading a bar graph",
      caption: "This graph is an example for learning to read bars. Your class will make its own.",
      visual: sampleGraph,
      teacherNote:
        "The tall bar for cup C is on purpose. Ask: is a tall plant always a healthy plant? Show a photo or a real plant with a pale stem if you have one.",
    },
  ],
  organizers: [
    {
      template: "science-journal",
      use: "An observation page with a drawing box and a sentence line (sessions 2 to 5).",
    },
    {
      template: "sequence",
      use: "Order the steps of the investigation from planting to graphing (session 1).",
    },
    {
      template: "kwl",
      use: "What we know, what we want to find out, what we learned (start and end).",
    },
  ],
  vocab: {
    entries: [
      {
        id: "plant",
        word: "plant",
        def: "A living thing that grows in soil and makes its own food from light.",
        example: "The plant in cup A has two green leaves.",
      },
      {
        id: "seed",
        word: "seed",
        def: "A small part of a plant that can grow into a new plant.",
        example: "We put three seeds in each cup.",
      },
      {
        id: "sunlight",
        word: "sunlight",
        def: "Light that comes from the sun.",
        example: "The window ledge gets sunlight.",
      },
      {
        id: "water",
        word: "water",
        def: "The clear liquid plants take in through their roots.",
        example: "We gave cup A a quarter cup of water.",
      },
      {
        id: "soil",
        word: "soil",
        def: "The dirt that plants grow in.",
        example: "The soil in every cup is the same.",
      },
      {
        id: "roots",
        word: "roots",
        def: "The parts of a plant under the soil that take in water.",
        example: "Roots hold the plant in the soil.",
      },
      {
        id: "fair-test",
        word: "fair test",
        def: "A test where you change only one thing and keep the rest the same.",
        example: "A fair test keeps the same seeds in every cup.",
      },
      {
        id: "measure",
        word: "measure",
        def: "To find out how long or tall something is with a ruler or other tool.",
        example: "We measure from the soil to the top.",
      },
      {
        id: "graph",
        word: "graph",
        def: "A picture that shows numbers so we can compare them.",
        example: "The bar graph shows how tall each plant is.",
      },
    ],
  },
  supports: {
    ee: {
      directions:
        "Work with a partner and point to the cups as you talk. Use the pictures and say the sentence before you write it.",
      frames: [
        "I see ___.",
        "The plant is ___ centimeters.",
        "Cup ___ has water. Cup ___ has no water.",
      ],
      wordBank: ["plant", "seed", "water", "light", "tall", "green", "cup", "measure"],
      oral: "Partner A points to a cup. Partner B says what the plant looks like. Switch.",
    },
    dev: {
      directions: "Use the sentence frames. Say your idea to a partner first, then write it.",
      frames: [
        "The plant in cup ___ is ___ centimeters tall. It is ___.",
        "Cup ___ grew because it got ___.",
        "Cup ___ did not grow because ___.",
      ],
      wordBank: ["plant", "sunlight", "water", "soil", "roots", "fair test", "measure", "graph"],
      oral: "Tell a partner what is the same in all four cups and what is different.",
    },
    exp: {
      directions: "Write full sentences with because. Use the word bank for science words.",
      frames: [
        "Plants need ___ because the plant in cup ___ ___.",
        "The graph shows that cup ___ is ___ centimeters taller than cup ___.",
      ],
      wordBank: ["fair test", "same", "different", "evidence", "healthy", "pale", "weak"],
      oral: "Explain to a partner how you know the test was fair.",
    },
    br: {
      directions:
        "Write a short paragraph with a claim, two pieces of evidence and one way the test could be made fairer.",
      frames: [],
      wordBank: ["evidence", "variable", "healthy", "stored food", "compare", "conclusion"],
      oral: "Tell a visitor what the graph shows and one thing you would test next.",
    },
  },
  rubric: {
    criteria: [
      {
        id: "fair-test",
        label: "A fair test",
        levels: [
          lv(
            3,
            "Meeting",
            "Names what stays the same and what changes, and keeps the water amount the same each time.",
          ),
          lv(
            2,
            "Approaching",
            "Names what changes but misses one thing that should stay the same.",
          ),
          lv(1, "Beginning", "Needs help to say what is the same and what is different."),
        ],
      },
      {
        id: "observe-measure",
        label: "Observing and measuring",
        levels: [
          lv(
            3,
            "Meeting",
            "Drawings, measures from the soil line and color words match the plant on at least two days.",
          ),
          lv(
            2,
            "Approaching",
            "Records a drawing and a number, but the measure or the color is missing or off by a lot.",
          ),
          lv(1, "Beginning", "Records a drawing only, with help."),
        ],
      },
      {
        id: "graph-claim",
        label: "Graph and claim with evidence",
        levels: [
          lv(
            3,
            "Meeting",
            "The bar graph matches the table, and the claim says plants need water and light and points to a cup as evidence.",
          ),
          lv(2, "Approaching", "The graph is correct or the claim has a reason, but not both."),
          lv(1, "Beginning", "States an idea without a graph or a reason."),
        ],
      },
      {
        id: "garden-talk",
        label: "Garden plan and talk",
        levels: [
          lv(
            3,
            "Meeting",
            "The plan shows sun and water, and the talk uses a fact from the graph.",
          ),
          lv(
            2,
            "Approaching",
            "The plan shows sun or water, and the talk names what plants need without a fact.",
          ),
          lv(1, "Beginning", "Draws plants without sun or water, or needs prompts to talk."),
        ],
      },
    ],
  },
  selfAssessment: [
    "I can tell what stayed the same in our test.",
    "I can measure a plant from the soil to the top.",
    "I can read a bar graph.",
    "I can say what plants need and use because.",
  ],
  peerFeedback: {
    structure: [
      "Partners look at each other's observation page together.",
      "One partner says one thing that is clear (a glow) and one question.",
      "The author answers the question and may fix the page.",
    ],
    frames: tiers(
      ["I like your ___.", "My question is ___."],
      ["I like your ___ because ___.", "I wonder ___."],
      ["Your drawing shows ___. Your measure is ___. I wonder ___."],
      ["Your evidence for ___ is ___. One thing to add is ___."],
    ),
  },
  revision: {
    when: "After the graph (session 6) and after the first practice of the talk (session 8).",
    steps: [
      "Look at your graph. Check each bar against the number in the table.",
      "Fix any bar that does not match.",
      "Read your claim. Add the cup that shows it.",
    ],
    evidence: "A graph with a checked bar and a claim with a cup named.",
  },
  finalProduct: {
    title: "A class garden plan and a plant guide talk",
    description:
      "A bar graph of plant heights, a written claim about what plants need, a garden plan drawing and a short talk for a visiting class.",
    parts: [
      "The observation log with at least two pages",
      "The bar graph of four heights",
      "A claim with because that names a cup",
      "The garden plan drawing with sun and water shown",
      "A 30-second talk for a visitor",
    ],
    successCriteria: [
      "The test was fair: only light or water changed.",
      "The graph matches the numbers.",
      "The garden plan has light and water.",
    ],
    audience: "A visiting class, a family member or school staff",
  },
  tools: [],
  studioTools: [],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

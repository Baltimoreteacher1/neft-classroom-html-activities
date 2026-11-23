// Lesson pack: Ratios and Rates (grade 6 math). Original problems; every numeric answer carries a calc the validator recomputes.
const blocks = (n, color) => Array.from({ length: n }, () => ({ label: "1", units: 1, color }));
const tape = (alt, rows, extra = {}) => ({
  kind: "tape",
  alt,
  w: 480,
  h: 200,
  rows: rows.map(([label, n, color]) => ({ label, parts: blocks(n, color) })),
  ...extra,
});
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const paint = tape(
  "A tape diagram with a row of 2 sky-blue blocks labelled Blue paint and a row of 3 white blocks labelled White paint.",
  [
    ["Blue paint", 2, "sky"],
    ["White paint", 3, "line"],
  ],
);

export default {
  id: "g6-math-ratios-and-rates",
  kind: "lesson",
  title: "Ratios and Rates",
  subtitle: "Describe, extend and compare ratios with tape diagrams, ratio tables and unit rates",
  grade: "6",
  band: "6-8",
  subject: "math",
  duration: 50,
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u2",
    note: "Matches the Ratios & Rates unit in the BCPSS curriculum seed (standards 6.RP.A.1 and 6.RP.A.3 are both listed there). Problems, pictures and wording are original; lesson order within the unit is not taken from any publisher sequence.",
  },
  pathway: {
    id: "g6-math-reference",
    position: 2,
    previous: "g6-math-variables-relationships",
    note: "Second lesson of the Grade 6 math reference pathway. It assumes students have met two quantities changing together in the first lesson but does not depend on that lesson's files.",
  },
  standards: ["6.RP.A.1", "6.RP.A.3"],
  wida: {
    eld: ["ELD-MA"],
    klus: ["Explain", "Inform"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "6-8",
  },
  contentObjective:
    "I can use ratio language, tape diagrams and ratio tables to find equivalent ratios and a unit rate.",
  languageObjective:
    "I can explain why two ratios are equivalent by saying 'for every' and 'because both numbers were multiplied by'.",
  languageDemands: {
    functions: [
      "describe a ratio relationship",
      "justify that two ratios are equivalent",
      "compare two rates",
    ],
    structures: [
      "There are ___ for every ___.",
      "___ to ___ is equivalent to ___ to ___ because both numbers were multiplied by ___.",
      "The unit rate is ___ per ___.",
    ],
    discourse:
      "Two-turn partner explanation (claim, then reason), then a written justification of one ratio table row.",
    barriers: [
      "'to' names a ratio ('2 to 3') and also means adding ('add 3 to both')",
      "'for every' and 'per' sound alike but 'per' names the quantity that equals 1",
      "'rate', 'table' and 'scale' have everyday meanings that do not match their math meanings",
      "the order of the quantities is built into 'the ratio of blue to white'",
    ],
    oralRehearse: [
      "There are 2 blue cups for every 3 white cups.",
      "Both numbers were multiplied by 5, so 10 to 15 is equivalent to 2 to 3.",
    ],
    writeScaffold:
      "Row ___ is equivalent to row 1 because both numbers were multiplied by ___. The unit rate is ___ per ___.",
  },
  vocab: {
    collection: "g6-math-ratios-and-rates",
    ids: [
      "ratio",
      "quantity",
      "for-every",
      "part-to-part",
      "part-to-whole",
      "equivalent-ratios",
      "ratio-table",
      "tape-diagram",
      "double-number-line",
      "rate",
      "unit-rate",
      "per",
    ],
  },
  launch: {
    title: "Notice and Wonder: the sky-blue mural",
    visual: paint,
    prompts: [
      "What do you notice about the two rows?",
      "What do you wonder about this paint mixture?",
      "If the art club needs a lot more sky-blue paint, what would stay the same and what would change?",
    ],
    teacherNote:
      "Show only the picture first. Take two noticings (for example 'blue has fewer blocks') and one wondering before you reveal that each block is one cup. Record the words students use for the comparison; they become the first entries on the ratio language chart. Do not correct 'blue is smaller' yet. Ask 'smaller than what?' so the comparison is stated with quantities.",
  },
  teach: {
    model: [
      "A ratio compares two quantities. In the sky-blue paint there are 2 cups of blue for every 3 cups of white. We write that ratio of blue to white as 2 to 3 (or 2:3). The order matters: the ratio of white to blue is 3 to 2.",
      "A part-to-part ratio compares two parts of the mixture, like blue to white. A part-to-whole ratio compares one part to the whole. The mixture has 2 + 3 = 5 cups in all, so blue to whole is 2 to 5.",
      "Equivalent ratios describe the same relationship. If we make two batches, we have 4 cups of blue and 6 cups of white. In a ratio table each new row multiplies both numbers by the same factor: 2 to 3, 4 to 6, 6 to 9, 10 to 15. Adding the same number to both would change the color.",
      "A tape diagram and a double number line show the same thing. In the tape diagram every block is one cup. On the double number line, blue cups on the top line sit directly above white cups on the bottom line.",
      "A unit rate tells how much of one quantity goes with exactly one of the other. Divide the cups of white by the cups of blue: 3 divided by 2 is 3/2. The unit rate is 3/2 cups of white per cup of blue. A car that goes 150 miles in 3 hours has a unit rate of 150 divided by 3, or 50 miles per hour.",
    ],
    moves: [
      "Say each ratio in two ways: 'for every' and 'to'. Have students echo it before writing it.",
      "Build the ratio table on the board with arrows between rows. Write the multiplier on the arrow beside both columns so students see one factor acting on two numbers.",
      "Ask 'What did you do to the blue? Then what must you do to the white?' every time a row is added.",
      "Keep one tape diagram visible all lesson and point back to it when a number such as 15 appears in a table.",
      "Name the unit rate in a full sentence with units: '3/2 cups of white per cup of blue'. Reject a bare number.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "short",
      prompt:
        "The art club mixes 2 cups of blue paint for every 3 cups of white paint. Write the ratio of blue to white. Then write the ratio of white to blue.",
      answer: "2 to 3; 3 to 2",
      hint: "Say which quantity is named first, then write its number first.",
      supports: {
        ee: {
          frames: [
            "The ratio of blue to white is ___ to ___.",
            "The ratio of white to blue is ___ to ___.",
          ],
          wordBank: ["blue", "white", "to", "for every"],
          visual: paint,
          oral: "Point to the blue row, then the white row. Say the numbers.",
        },
        dev: {
          frames: ["blue to white is ___ to ___; white to blue is ___ to ___"],
          wordBank: ["ratio", "order"],
        },
        exp: { frames: ["The order changes when the quantities swap, so ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt:
        "The same mixture is used for the whole mural: 2 cups of blue for every 3 cups of white. How many cups of blue go with 15 cups of white?",
      answer: 10,
      calc: "15/3*2",
      hint: "Find how many groups of 3 white cups are in 15 white cups. Then use that many groups of blue.",
      supports: {
        ee: {
          frames: ["15 is ___ times 3. Blue is ___ times 2."],
          wordBank: ["times", "groups", "same number"],
          visual: tape(
            "A tape diagram showing 5 repeated groups, each with 2 blue blocks and 3 white blocks.",
            [
              ["Blue", 10, "sky"],
              ["White", 15, "line"],
            ],
          ),
        },
        dev: {
          frames: ["I multiplied 3 by ___ to get 15, so I multiplied 2 by ___."],
          wordBank: ["scale factor", "multiply"],
        },
        exp: { frames: ["The scale factor is ___ because ___, so blue is ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt:
        "A bus travels 150 miles in 3 hours at a steady pace. What is the unit rate in miles per hour?",
      answer: 50,
      calc: "150/3",
      hint: "The unit rate is for 1 hour. Which operation turns 3 hours into 1 hour?",
      supports: {
        ee: {
          frames: ["The bus goes ___ miles in 1 hour."],
          wordBank: ["divide", "per", "hour", "miles"],
          visual: tape(
            "A tape diagram of 3 equal blocks, each block standing for one hour, with a bracket marking 150 miles in all.",
            [["Hours", 3, "ochre"]],
          ),
        },
        dev: { frames: ["I divided ___ by ___ because ___."], wordBank: ["divide", "unit rate"] },
        exp: {
          frames: [
            "The unit rate is ___ miles per hour because dividing by ___ gives the miles for 1 hour.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Which ratio is equivalent to 4 to 6?",
      choices: ["6 to 8", "6 to 9", "8 to 10", "2 to 4"],
      answer: 1,
      hint: "Find the number you multiply 4 by to get the first number. Does the same number take 6 to the second number?",
      supports: {
        ee: {
          frames: ["4 to 6 and ___ to ___ use the same ___."],
          wordBank: ["times", "same number", "equivalent"],
        },
        dev: {
          frames: ["I can get from 4 to 6 by ___, so the second ratio must ___."],
          wordBank: ["multiply", "equivalent"],
        },
        exp: { frames: ["The ratio is equivalent because both numbers were scaled by ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Recipe remix: two models, one ratio",
    task: "Partner A and Partner B receive the same recipe card, for example 3 scoops of cocoa for every 4 cups of milk. Partner A builds a ratio table with four rows. Partner B draws a double number line with at least four matching marks. They swap and check each other's work: does every pair keep the same relationship? Then they write one sentence naming the unit rate with units.",
    roles: ["Table builder", "Number line builder"],
    discussionCards: [
      {
        prompt:
          "What did you multiply the first row by to get the second row? Did you multiply both numbers?",
        frame: "I multiplied both numbers by ___ because ___.",
      },
      {
        prompt: "Where does the unit rate appear in your model?",
        frame: "The unit rate shows up when the first quantity is ___ and the second is ___.",
      },
      {
        prompt: "How can you tell the two models show the same ratio?",
        frame: "The two models match because both show ___ for every ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the same ratio in three pictures",
      visualOrModel: tape(
        "A tape diagram of 2 blue blocks above 3 white blocks, repeated three times so that blue is 6 blocks and white is 9 blocks.",
        [
          ["Blue", 6, "sky"],
          ["White", 9, "line"],
        ],
      ),
      teacherNote:
        "Place the tape diagram beside a ratio table (2 to 3, 4 to 6, 6 to 9) and a double number line. Ask students to find the pair 6 to 9 in each representation and say it with 'for every'.",
    },
    discuss: {
      title: "Say it: claim and reason",
      structure:
        "Turn and talk. Partner 1 states a ratio and an equivalent ratio. Partner 2 asks 'How do you know?' and restates the reason. Swap.",
      frames: [
        "___ to ___ is equivalent to ___ to ___.",
        "How do you know?",
        "Because both numbers were multiplied by ___.",
        "So you are saying that ___.",
      ],
    },
    apply: {
      title: "Use it: a rate in the real world",
      task: "A school garden pump moves 48 gallons in 6 minutes at a steady rate. Find the unit rate in gallons per minute. Then use it to find how many gallons the pump moves in 10 minutes.",
      successCriteria: [
        "I name the unit rate with both units.",
        "I show a ratio table row or division that supports my unit rate.",
        "I use the unit rate to answer the 10-minute question.",
        "I explain why the rate stays the same.",
      ],
    },
  },
  activities: [
    { engine: "visual-match", id: "g6-ratio-language-match" },
    { engine: "concept-builder", id: "g6-ratio-table-lab" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "Trail mix uses 3 cups of raisins for every 5 cups of peanuts. How many cups of peanuts go with 12 cups of raisins?",
        answer: 20,
        calc: "12/3*5",
        explain: "12 is 4 times 3, so peanuts are 4 times 5.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "A printer prints 90 pages in 6 minutes at a steady rate. How many pages does it print per minute?",
        answer: 15,
        calc: "90/6",
        explain: "Divide the pages by the minutes to get pages for 1 minute.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt: "Five pencils cost 2.50 dollars. What is the cost in dollars per pencil?",
        answer: 0.5,
        calc: "2.5/5",
        explain: "Divide the cost by the number of pencils: 2.50 divided by 5 is 0.50.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "A class has 12 girls and 16 boys. Which ratio compares the number of girls to the number of students in the whole class?",
        choices: ["12 to 16", "12 to 28", "16 to 28", "28 to 12"],
        answer: 1,
        explain:
          "The whole class is 12 + 16 = 28 students, so the part-to-whole ratio is 12 to 28.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "Is 8 to 12 equivalent to 6 to 9?",
        choices: [
          "Yes. Dividing 8 and 12 by 4 gives 2 to 3, and dividing 6 and 9 by 3 gives 2 to 3.",
          "No. The numbers are different, so the ratios are different.",
          "No. 12 minus 8 is 4 but 9 minus 6 is 3, so the differences are not equal.",
        ],
        answer: 0,
        explain:
          "Both reduce to 2 to 3, so they describe the same relationship. Comparing the differences is the additive mistake.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "A student says 2 to 3 is equivalent to 5 to 6 because 3 was added to both numbers. Explain the mistake. Then write a ratio equivalent to 2 to 3 whose second number is 15.",
        answer:
          "Adding the same amount changes the relationship; both numbers must be multiplied by the same number. 10 to 15 is equivalent to 2 to 3.",
        explain: "2 times 5 is 10 and 3 times 5 is 15, so 10 to 15 is equivalent to 2 to 3.",
      },
      {
        id: "i7",
        type: "numeric",
        prompt:
          "Bike A rides 36 miles in 3 hours. Bike B rides 50 miles in 5 hours. How many more miles per hour does Bike A ride than Bike B?",
        answer: 2,
        calc: "36/3-50/5",
        explain:
          "Bike A rides 12 miles per hour and Bike B rides 10 miles per hour, so A rides 2 more.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt: "Six tickets cost 24 game tokens. What is the unit rate in tokens per ticket?",
        answer: 4,
        calc: "24/6",
        explain: "Divide the tokens by the tickets: 24 divided by 6 is 4.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "A tape diagram has 3 red blocks and 5 blue blocks. Which ratio is blue to red?",
        choices: ["3 to 5", "5 to 3", "5 to 8", "8 to 5"],
        answer: 1,
        explain: "Blue is named first and there are 5 blue blocks, so the ratio is 5 to 3.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "Complete the ratio table row and explain how you know it is equivalent: 4 to 10, then ___ to 15.",
        answer:
          "6 to 15, because 4 to 10 is scaled by 3 halves, or both numbers are halved to 2 to 5 and multiplied by 3.",
        explain: "Halving gives 2 to 5, and multiplying by 3 gives 6 to 15.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can do with a ratio and a rate.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "A snack mix uses 3 cups of oats for every 2 cups of raisins. How many cups of oats go with 8 cups of raisins?",
        answer: 12,
        calc: "8/2*3",
        explain: "8 is 4 times 2, so oats are 4 times 3.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt:
          "A tank fills 45 gallons in 9 minutes at a steady rate. What is the unit rate in gallons per minute?",
        answer: 5,
        calc: "45/9",
        explain: "45 divided by 9 is 5 gallons for each minute.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "In one sentence, explain how a ratio table row is made equivalent to the row above it.",
        answer: "Multiply or divide both numbers in the row by the same number.",
        explain: "Both quantities must be scaled by the same factor.",
      },
    ],
    successCriteria: [
      "I scaled both numbers by the same factor.",
      "I named a unit rate with both units.",
      "I used the words 'for every' or 'per' correctly.",
    ],
  },
  answerKey: {
    notes:
      "Accept equivalent ratio statements in any order as long as the quantities match their numbers (for example 'white to blue is 3 to 2'). For unit rates require both units. For the two short-answer items look for the idea 'multiply both by the same number', not a specific sentence.",
    items: {
      g1: "Blue to white is 2 to 3. White to blue is 3 to 2.",
      g2: "10 cups of blue. 15 divided by 3 is 5 groups, and 5 times 2 is 10.",
      g3: "50 miles per hour. 150 divided by 3 is 50.",
      g4: "6 to 9. 4 times 1.5 is 6 and 6 times 1.5 is 9, or both reduce to 2 to 3.",
      i1: "20 cups. 12 divided by 3 is 4, and 4 times 5 is 20.",
      i2: "15 pages per minute. 90 divided by 6 is 15.",
      i3: "0.50 dollars per pencil. 2.50 divided by 5 is 0.50.",
      i4: "12 to 28. The whole class is 12 plus 16, which is 28 students.",
      i5: "Yes. Both ratios are equivalent to 2 to 3.",
      i6: "The student added instead of multiplying. Multiply 2 and 3 by 5 to get 10 to 15.",
      i7: "2 miles per hour more. Bike A is 36 divided by 3, or 12 miles per hour. Bike B is 50 divided by 5, or 10 miles per hour. The difference is 2.",
      f1: "4 tokens per ticket. 24 divided by 6 is 4.",
      f2: "5 to 3.",
      f3: "6 to 15. Halve 4 to 10 to get 2 to 5, then multiply by 3.",
      e1: "12 cups. 8 divided by 2 is 4, and 4 times 3 is 12.",
      e2: "5 gallons per minute. 45 divided by 9 is 5.",
      e3: "Multiply or divide both numbers by the same number.",
    },
  },
  extension: {
    title: "Which is the better buy?",
    task: "A 12-ounce bottle of juice costs 3.00 dollars. A 20-ounce bottle costs 4.60 dollars. Find the unit price in dollars per ounce for each bottle (3.00 divided by 12 is 0.25; 4.60 divided by 20 is 0.23). Decide which bottle is the better buy and write one sentence that uses 'per' to justify your choice. Then find a third size of bottle that would cost the same per ounce as the cheaper one.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo usar el lenguaje de razones para comparar dos cantidades y encontrar razones equivalentes.",
      vocab: [
        { en: "ratio", es: "razón", verified: false },
        { en: "equivalent ratios", es: "razones equivalentes", verified: false },
        { en: "ratio table", es: "tabla de razones", verified: false },
        { en: "rate", es: "tasa", verified: false },
        { en: "unit rate", es: "tasa unitaria", verified: false },
      ],
      familyPrompt:
        "Busquen una receta o una etiqueta en casa. Digan una razón, por ejemplo 2 tazas de agua por cada 1 taza de arroz, y escriban una razón equivalente.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Partner work or the two activities 20. Exit ticket 7. Closing language share 3. If time is short, run the ratio table lab and move the visual match to the next day as vocabulary review.",
    misconceptions: [
      "Additive thinking: students believe 2 to 3 and 4 to 5 are equivalent because both numbers went up by 2. Ask them to draw the tape diagram for each ratio and compare the blocks.",
      "Order reversal: students write 3 to 2 for 'blue to white' when blue is 2. Have them point to each quantity while saying the ratio.",
      "Part-to-whole confusion: students write 2 to 3 for the blue to the whole mixture. Ask 'How many cups are in the whole mixture?' before they write the second number.",
      "Unit rate inversion: students divide in the wrong direction and report hours per mile. Always ask 'per what?' and write the units with the answer.",
      "Bare numbers: students report '50' as a unit rate with no units. Require the sentence 'The unit rate is ___ per ___.'",
    ],
    differentiation:
      "Entering and Emerging learners use the frames and word banks in each item, point to blocks while speaking, and keep the same tasks and answers as every other tier. Expanding and Bridging learners justify in complete sentences and compare two representations. Never reduce the mathematics; reduce only the language load.",
    languageNotes:
      "Teach 'for every' with gestures and objects before 'per'. Chorally practice 'blue to white' and 'white to blue' so the order feels natural. Point out the two meanings of 'to' on the chart.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

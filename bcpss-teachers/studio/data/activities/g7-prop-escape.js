// escape-challenge: four rooms that each test one idea about proportional relationships (7.RP.A.2).
// Every code piece is derived from the learner's own correct answer.
const sup = (ee, dev, exp) => ({
  ee: { directions: ee.d, frames: ee.f, wordBank: ee.w },
  dev: { frames: dev.f, wordBank: dev.w || [] },
  exp: { frames: exp },
  br: {},
});

export default {
  id: "g7-prop-escape",
  engine: "escape-challenge",
  title: "Escape the Night Market Scale House",
  grade: "7",
  band: "6-8",
  subject: "math",
  lessonId: "g7-math-proportional-relationships-graphs",
  standards: ["7.RP.A.2", "7.RP.A.2a", "7.RP.A.2b", "7.RP.A.2c"],
  curriculum: {
    status: "district-referenced",
    unitId: "g7-math-u1",
    program: "Reveal Math",
    note: "7.RP.A.2 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
  },
  vocabIds: [
    "proportional-relationship",
    "constant-of-proportionality",
    "unit-rate",
    "origin",
    "non-proportional",
    "ordered-pair",
  ],
  minutes: 25,
  intro:
    "The night market's scale house is locked and the evening price board will not light up. Solve one puzzle in each room to collect the four pieces of the door code.",
  story: {
    title: "The Night Market Price Board",
    setting: "A night market at dusk, with a locked scale house behind the fruit stalls.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "The market opens in ten minutes, but the scale house is locked and the price board is dark. A note on the door says the keeper hid four code pieces, one in each room.",
      },
      {
        id: "b1",
        after: "price-desk",
        text: "The first piece is in your pocket. The keeper's note now points to a wall of cards that must be sorted before anything else will move.",
      },
      {
        id: "b2",
        after: "sorting-wall",
        text: "Two pieces found. The next room holds a graph of a taxi company, pinned up because the keeper could not decide whether it fit the market's pricing rule.",
      },
      {
        id: "b3",
        after: "graph-gallery",
        text: "Three pieces. Only the vault is left, where the keeper wrote down what three stalls charge and locked each price rule in its own drawer.",
      },
      {
        id: "end",
        after: "end",
        text: "The lock clicks and the price board flickers on, showing a steady price for every stall. The night market opens right on time.",
      },
    ],
  },
  rooms: [
    {
      id: "price-desk",
      title: "The Price Desk",
      narrative:
        "A tag on the grape crate says that 4 pounds cost 10 dollars at a steady price. The keeper needs the constant of proportionality before the board can show a price per pound.",
      gate: {
        needs: "constant-of-proportionality",
        label: "Finding the constant of proportionality",
      },
      puzzle: {
        type: "numeric",
        prompt:
          "A market sells 4 pounds of grapes for 10 dollars at a steady price. What is the constant of proportionality, in dollars per pound?",
        answer: "5/2",
        calc: "10/4",
        unit: "dollars per pound",
        visual: {
          kind: "table",
          alt: "A table with columns x pounds and y dollars and one row that reads 4 and 10.",
          head: ["x (pounds)", "y (dollars)"],
          rows: [["4", "10"]],
        },
        hints: [
          "The constant of proportionality is the amount of y for exactly 1 unit of x. Decide how many dollars go with 1 pound.",
          "Think about sharing the total cost equally among the pounds. Which operation does that?",
          "Put the total dollars first and the total pounds second, then do the operation. Check by multiplying your answer by 4 pounds.",
        ],
        misconceptions: [
          {
            tag: "flips-the-ratio",
            pick: "2/5",
            hint: "That number tells how many pounds you get for each dollar. The constant here is dollars for 1 pound, so which quantity goes on top?",
          },
          {
            tag: "subtracts-instead-of-divides",
            pick: "6",
            hint: "Subtracting finds a difference. The constant of proportionality compares the quantities, so think about how many equal shares of dollars fit each pound.",
          },
          {
            tag: "adds-instead-of-divides",
            pick: "14",
            hint: "Adding pounds and dollars mixes two different units. Look for the dollars that go with exactly 1 pound.",
          },
        ],
        model: {
          text: "A bakery sells 8 muffins for 12 dollars at a steady price. To find the cost of 1 muffin, divide the total dollars by the total muffins: 12 divided by 8 is 1.5. The constant of proportionality is 1.5 dollars per muffin, and 8 times 1.5 gets back to 12.",
        },
        transfer: {
          type: "numeric",
          prompt:
            "A bus covers 6 miles for 9 dollars at a steady fare. What is the constant of proportionality, in dollars per mile?",
          answer: "3/2",
          calc: "9/6",
          unit: "dollars per mile",
          hints: [
            "Find the dollars that go with exactly 1 mile.",
            "Share the total dollars equally among the miles.",
            "Put dollars first and miles second, then check by multiplying back.",
          ],
        },
        why: "Dividing the total cost by the total weight gives the cost for 1 pound. That unchanging ratio is the constant of proportionality, and it is the unit rate.",
        supports: sup(
          {
            d: "Find how many dollars go with 1 pound. Share the 10 dollars equally among the pounds.",
            f: ["10 dollars for ___ pounds.", "For 1 pound the cost is ___ dollars."],
            w: ["divide", "each", "per", "pound", "dollars"],
          },
          {
            f: [
              "I divided ___ by ___ to get the cost for 1 pound.",
              "The unit rate is ___ per ___.",
            ],
            w: ["constant of proportionality", "unit rate"],
          },
          [
            "The constant of proportionality is ___ because ___ divided by ___ gives the amount for 1.",
          ],
        ),
      },
      reveal:
        "Under the grape crate you find a brass tag stamped with the first code piece, and the number on it matches the price for one pound.",
    },
    {
      id: "sorting-wall",
      title: "The Sorting Wall",
      narrative:
        "Six cards hang on the wall, each describing a price or a distance. The keeper wants each one sorted by whether it is a proportional relationship.",
      gate: {
        needs: "proportional-versus-not",
        label: "Telling proportional from non-proportional",
      },
      puzzle: {
        type: "sort",
        prompt:
          "Sort each situation. A situation is proportional only if 0 of one quantity always goes with 0 of the other and the ratio never changes.",
        bins: [
          { id: "prop", label: "Proportional" },
          { id: "not", label: "Not proportional" },
        ],
        cards: [
          {
            id: "c1",
            text: "The cost of oranges at 1.20 dollars for every pound.",
            bin: "prop",
            token: "A",
          },
          {
            id: "c2",
            text: "A taxi fare with a 3 dollar fee plus 2 dollars each mile.",
            bin: "not",
            token: "B",
          },
          {
            id: "c3",
            text: "The distance a jogger runs at a steady 6 miles per hour, starting at the gate.",
            bin: "prop",
            token: "C",
          },
          {
            id: "c4",
            text: "A gym that charges a 25 dollar joining fee plus 10 dollars each month.",
            bin: "not",
            token: "D",
          },
          {
            id: "c5",
            text: "The gallons moved by a pump that starts empty and moves 5 gallons each minute.",
            bin: "prop",
            token: "E",
          },
          {
            id: "c6",
            text: "A plant that is 4 inches tall when measured and grows 2 inches each week.",
            bin: "not",
            token: "F",
          },
        ],
        hints: [
          "For each card ask what happens at 0: does 0 of the first quantity go with 0 of the second?",
          "Look for a fee, a head start or a starting amount. Those break the match between zero and zero.",
          "Cards that grow by the same amount each step are not always proportional. Check whether the total is already something at the start.",
        ],
        misconceptions: [
          {
            tag: "steady-increase-is-proportional",
            has: ["c2:prop"],
            hint: "The fare goes up by the same amount each mile, but what does a ride of 0 miles cost? Check whether zero goes with zero.",
          },
          {
            tag: "fee-is-ignored",
            has: ["c4:prop"],
            hint: "A joining fee means the cost is not 0 at 0 months. Does the cost divided by months stay the same?",
          },
          {
            tag: "head-start-is-ignored",
            has: ["c6:prop"],
            hint: "The plant already has a height before any weeks pass. Ask whether 0 weeks goes with 0 inches.",
          },
        ],
        model: {
          text: "A cell phone plan costs 15 dollars each month with no setup fee, so 0 months cost 0 dollars and the ratio stays 15: proportional. A phone plan with a 40 dollar setup fee plus 15 dollars each month already costs 40 at 0 months, so it is not proportional.",
        },
        transfer: {
          type: "sort",
          prompt: "Sort each situation by whether it is a proportional relationship.",
          bins: [
            { id: "prop", label: "Proportional" },
            { id: "not", label: "Not proportional" },
          ],
          cards: [
            {
              id: "t1",
              text: "The cost of rice at 0.80 dollars for each ounce.",
              bin: "prop",
              token: "R",
            },
            {
              id: "t2",
              text: "A rental bike that costs 5 dollars to unlock plus 3 dollars each hour.",
              bin: "not",
              token: "S",
            },
            {
              id: "t3",
              text: "The cups of water used by a faucet that drips 2 cups every minute from the moment it opens.",
              bin: "prop",
              token: "T",
            },
            {
              id: "t4",
              text: "A candle that is 10 inches tall and burns down 1 inch each hour.",
              bin: "not",
              token: "U",
            },
          ],
          hints: [
            "Ask what happens at 0 for each card.",
            "Look for a fee or a starting amount.",
            "Check whether the ratio of the two quantities would be the same in every row.",
          ],
        },
        why: "Proportional situations have no starting fee or head start: 0 of one quantity goes with 0 of the other, and the ratio never changes. The cards with a fee or a starting amount break that.",
        supports: sup(
          {
            d: "For each card ask: what is the total at 0? If it is not 0, the card goes in Not proportional.",
            f: ["At 0, the total is ___.", "There is a ___, so it is ___."],
            w: ["fee", "starts", "zero", "same"],
          },
          {
            f: [
              "This situation is proportional because at 0 ___.",
              "It is not proportional because ___.",
            ],
            w: ["ratio", "starting amount"],
          },
          ["The relationship is proportional only when ___ and the ratio ___."],
        ),
      },
      reveal:
        "Behind the last card a small door opens, and a second brass tag slides out with a code on it.",
    },
    {
      id: "graph-gallery",
      title: "The Graph Gallery",
      narrative:
        "The keeper pinned up a graph of a taxi company. Miles are on the horizontal axis and dollars are on the vertical axis. The keeper needs to know whether it fits a proportional pricing rule.",
      gate: { needs: "graph-through-origin", label: "Reading a graph for proportionality" },
      puzzle: {
        type: "choice",
        prompt:
          "The graph shows taxi cost y in dollars for x miles. Does it show a proportional relationship?",
        visual: {
          kind: "coord",
          alt: "A coordinate plane with miles along the bottom and dollars up the side. Points at (1, 5), (2, 8) and (3, 11) sit on a straight line that crosses the vertical axis at 2 dollars.",
          longDesc:
            "The points are (1, 5), (2, 8) and (3, 11). The line through them rises 3 dollars for each mile and starts at 2 dollars when the miles are 0, so it does not pass through the origin.",
          xmax: 6,
          ymax: 24,
          xLabel: "Miles (x)",
          yLabel: "Dollars (y)",
          points: [
            { x: 1, y: 5 },
            { x: 2, y: 8 },
            { x: 3, y: 11 },
          ],
          lines: [{ m: 3, b: 2 }],
        },
        choices: [
          "Yes, because the points lie on a straight line.",
          "Yes, because the cost goes up as the miles go up.",
          "No, because the line does not pass through the origin (0, 0).",
          "No, because a graph cannot show whether a relationship is proportional.",
        ],
        answer: 2,
        tokens: ["S", "U", "N", "P"],
        hints: [
          "A proportional relationship needs two things on its graph. Check both of them.",
          "Trace the line back to the vertical axis. What does the cost equal at 0 miles?",
          "A straight line is only part of the test. Where the line meets the vertical axis matters too.",
        ],
        misconceptions: [
          {
            tag: "straight-line-is-enough",
            pick: 0,
            hint: "Being straight is one test, not both. What else must be true about where the line starts?",
          },
          {
            tag: "increasing-is-proportional",
            pick: 1,
            hint: "Many relationships go up together. Ask whether 0 miles goes with 0 dollars here.",
          },
          {
            tag: "graphs-cannot-decide",
            pick: 3,
            hint: "Graphs are one of the main ways to test this. Look at the two features a proportional graph must have.",
          },
        ],
        model: {
          text: "A different graph shows a gym plan: the line is straight and passes through (0, 0) and (4, 12). It has both features, so it is proportional. A graph of a plant's height that is straight but starts at 6 inches at week 0 has only one feature, so it is not.",
        },
        transfer: {
          type: "choice",
          prompt:
            "A graph of a gym plan is a straight line that crosses the vertical axis at 10 dollars. Is the relationship proportional?",
          choices: [
            "Yes, because it is a straight line.",
            "No, because it does not pass through the origin.",
            "Yes, because it rises to the right.",
          ],
          answer: 1,
          tokens: ["A", "B", "C"],
          hints: [
            "Check both features a proportional graph needs.",
            "Where does the line cross the vertical axis?",
            "Zero of the first quantity must go with zero of the second.",
          ],
        },
        why: "A proportional graph is a straight line that passes through the origin. This line is straight but meets the vertical axis at 2 dollars, so a 0-mile ride already costs something.",
        supports: sup(
          {
            d: "Look where the line meets the vertical axis. Ask what the cost is when the miles are 0.",
            f: ["At 0 miles the cost is ___.", "The line ___ the origin."],
            w: ["origin", "straight", "zero", "passes through"],
          },
          {
            f: ["The graph is (not) proportional because ___.", "At 0 miles, y is ___."],
            w: ["proportional", "origin"],
          },
          ["A proportional graph must ___ and ___, so this graph ___."],
        ),
      },
      reveal:
        "A glass frame slides open behind the graph, and a third piece of the code sits in a small drawer.",
    },
    {
      id: "equation-vault",
      title: "The Equation Vault",
      narrative:
        "Three stalls locked their price rules in three drawers. Each rule is an equation y = kx. Match each stall's measurements to the drawer with the correct constant of proportionality.",
      gate: { needs: "write-y-equals-kx", label: "Writing y = kx from a situation" },
      puzzle: {
        type: "match",
        prompt:
          "Match each stall's measurements to the equation with the correct constant of proportionality. Some equations will not be used.",
        lefts: [
          {
            id: "l1",
            text: "A bike travels 36 miles in 3 hours. x is hours and y is miles.",
            calc: "36/3",
          },
          {
            id: "l2",
            text: "A printer prints 90 pages in 6 minutes. x is minutes and y is pages.",
            calc: "90/6",
          },
          {
            id: "l3",
            text: "A faucet drips 3 cups in 6 minutes. x is minutes and y is cups.",
            calc: "3/6",
          },
        ],
        rights: [
          { id: "r1", text: "y = 12x", token: "T", value: "12" },
          { id: "r2", text: "y = 15x", token: "H", value: "15" },
          { id: "r3", text: "y = (1/2)x", token: "R", value: "1/2" },
          { id: "r4", text: "y = 2x", token: "E", value: "2" },
          { id: "r5", text: "y = (1/15)x", token: "S", value: "1/15" },
        ],
        answer: { l1: "r1", l2: "r2", l3: "r3" },
        hints: [
          "The number in front of x is the constant of proportionality, the amount of y for each 1 of x.",
          "Divide the total y by the total x to find the amount for 1.",
          "Test a drawer: put the given x into the equation and see whether it gives the given y.",
        ],
        misconceptions: [
          {
            tag: "flips-the-ratio",
            has: ["l3=r4"],
            hint: "That equation makes y bigger than x, but the faucet drips fewer cups than minutes. Which quantity goes on top?",
          },
          {
            tag: "uses-the-total-as-the-constant",
            has: ["l2=r5"],
            hint: "That equation makes y much smaller than x. Is the printer's page count smaller than its minutes?",
          },
        ],
        model: {
          text: "A different test: a worker packs 24 boxes in 6 minutes. Divide 24 by 6 to get 4 boxes for each minute, so the constant of proportionality is 4 and the equation is y = 4x. Check: x = 6 gives y = 24.",
        },
        transfer: {
          type: "match",
          prompt:
            "Match each measurement to the equation with the correct constant of proportionality.",
          lefts: [
            {
              id: "m1",
              text: "A cart rolls 20 meters in 4 seconds. x is seconds and y is meters.",
              calc: "20/4",
            },
            {
              id: "m2",
              text: "A tap fills 9 liters in 6 minutes. x is minutes and y is liters.",
              calc: "9/6",
            },
            {
              id: "m3",
              text: "A snail crawls 2 feet in 8 minutes. x is minutes and y is feet.",
              calc: "2/8",
            },
          ],
          rights: [
            { id: "n1", text: "y = 5x", token: "A", value: "5" },
            { id: "n2", text: "y = (3/2)x", token: "B", value: "3/2" },
            { id: "n3", text: "y = (1/4)x", token: "C", value: "1/4" },
          ],
          answer: { m1: "n1", m2: "n2", m3: "n3" },
          hints: [
            "The constant is the amount of y for each 1 of x.",
            "Divide the total y by the total x.",
            "Test your drawer with the given x.",
          ],
        },
        why: "Dividing the total by the time gives the amount for one unit of time. That amount is the constant of proportionality, the number in front of x in y = kx.",
        supports: sup(
          {
            d: "For each stall, find how much happens in 1 hour or 1 minute. Then find the equation with that number in front of x.",
            f: ["In 1 hour the bike goes ___ miles.", "The equation has ___ in front of x."],
            w: ["constant", "each", "equation", "divide"],
          },
          {
            f: ["I divided ___ by ___ to find k.", "The equation is y = ___x."],
            w: ["constant of proportionality", "divide"],
          },
          ["The constant of proportionality is ___ divided by ___, so the equation is y = ___x."],
        ),
      },
      reveal:
        "The last drawer slides open and clicks into a slot. The fourth piece of the code is stamped on its back.",
    },
  ],
  door: {
    title: "The Scale House Door",
    prompt: "Type the code the keeper's note describes.",
    order: ["price-desk", "sorting-wall", "graph-gallery", "equation-vault"],
    success:
      "The lock clicks and the scale house opens. The price board lights up and the market opens.",
  },
  reflection: {
    prompt:
      "Which room made you think hardest about whether a relationship is proportional? What helped you decide?",
    frames: {
      ee: ["The hardest room was ___.", "It helped me to look at ___."],
      dev: ["The room that was hardest was ___ because ___.", "What helped me was ___."],
      exp: ["I found the ___ room hardest because ___; I decided by checking ___."],
      br: [
        "The ___ room made me connect the table, the graph and the equation because ___, and ___ helped me check my claim.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

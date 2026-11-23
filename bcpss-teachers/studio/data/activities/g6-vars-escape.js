// escape-challenge: four rooms that each test one idea about variables and relationships (6.EE.C.9).
// Every code piece is derived from the learner's own correct answer.
const sup = (ee, dev, exp) => ({
  ee: { directions: ee.d, frames: ee.f, wordBank: ee.w },
  dev: { frames: dev.f, wordBank: dev.w || [] },
  exp: { frames: exp },
  br: {},
});

export default {
  id: "g6-vars-escape",
  engine: "escape-challenge",
  title: "Escape the Garden Shed",
  grade: "6",
  band: "6-8",
  subject: "math",
  lessonId: "g6-math-variables-relationships",
  standards: ["6.EE.C.9"],
  curriculum: {
    status: "district-referenced",
    unitId: "g6-math-u5",
    program: "Reveal Math",
    note: "6.EE.C.9 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
  },
  vocabIds: ["independent-variable", "dependent-variable", "equation", "table", "rate-of-change"],
  minutes: 25,
  intro:
    "The community garden shed is locked and the rain barrel valve will not open. Solve one puzzle in each room to collect the pieces of the door code.",
  story: {
    title: "The Garden Water Controller",
    setting:
      "A community garden shed on a hot afternoon, with a rain barrel valve behind a locked door.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "The garden club needs water for the bean rows, but the valve box has a lock. A note on the door says the keeper hid four code pieces, one in each room.",
      },
      {
        id: "b1",
        after: "tool-shed",
        text: "The first piece is in your pocket. The keeper's note now points to a wall of tables that all look almost alike.",
      },
      {
        id: "b2",
        after: "table-wall",
        text: "Two pieces found. The next room holds a graph of the barrel filling, drawn by the keeper before the lock was fitted.",
      },
      {
        id: "b3",
        after: "graph-gallery",
        text: "Three pieces. Only the control room is left, where the keeper tested three different hoses and wrote down what each one did.",
      },
      {
        id: "end",
        after: "end",
        text: "The lock clicks and the valve box swings open. Clean water runs into the barrel at a steady rate, and the bean rows will be watered before sunset.",
      },
    ],
  },
  rooms: [
    {
      id: "tool-shed",
      title: "The Tool Shed",
      narrative:
        "Hoses hang on the wall. A tag on the pump says y = 7x, where x is the minutes the pump runs and y is the gallons it moves. The keeper wants a total.",
      gate: {
        needs: "evaluate-equation",
        label: "Using an equation to find the dependent variable",
      },
      puzzle: {
        type: "numeric",
        prompt: "The pump follows the rule y = 7x. How many gallons has it moved after 9 minutes?",
        answer: "63",
        calc: "7*9",
        unit: "gallons",
        visual: {
          kind: "table",
          alt: "A table with minutes x of 1, 2 and 3 and gallons y of 7, 14 and 21.",
          head: ["x (minutes)", "y (gallons)"],
          rows: [
            ["1", "7"],
            ["2", "14"],
            ["3", "21"],
          ],
        },
        hints: [
          "The letter x stands for the number of minutes. Decide what number goes where x is.",
          "Look at the table: the gallons for 2 minutes are twice the gallons for 1 minute. What operation connects 7 and x?",
          "Replace x with the minutes in the question, then do the operation the equation shows between the number and the letter.",
        ],
        misconceptions: [
          {
            tag: "adds-instead-of-multiplies",
            pick: "16",
            hint: "A number written next to a letter means multiply. Does the table add 7 or multiply by 7 as x grows?",
          },
          {
            tag: "divides-instead-of-multiplies",
            pick: "9/7",
            hint: "The equation gives y in terms of x. Check the table: does y get smaller or bigger than x?",
          },
        ],
        model: {
          text: "A different pump follows y = 5x. After 6 minutes, replace x with 6. The number next to the letter means multiply, so 5 times 6 gives 30 gallons. The independent variable x was chosen and the dependent variable y was found.",
        },
        transfer: {
          type: "numeric",
          prompt:
            "Another pump follows the rule y = 8x. How many gallons has it moved after 5 minutes?",
          answer: "40",
          calc: "8*5",
          unit: "gallons",
          hints: [
            "Decide what number replaces x.",
            "The equation shows a number written next to a letter. Think about what that means.",
            "Multiply the number in front of the letter by the number of minutes.",
          ],
        },
        why: "In y = 7x each minute adds 7 gallons, so x minutes add 7 times x gallons. Replacing x with 9 gives the dependent variable y.",
        supports: sup(
          {
            d: "Put 9 where the letter x is. Then multiply.",
            f: ["I put ___ where x is.", "Then I multiply ___ times ___."],
            w: ["replace", "minutes", "gallons", "multiply"],
          },
          {
            f: ["x is 9, so y is ___ times ___.", "The independent variable is ___."],
            w: ["variable", "equation"],
          },
          ["Since y = 7x and x = ___, I calculate y = ___."],
        ),
      },
      reveal:
        "Behind the hose reel you find a brass tag stamped with the first code piece, and the number on it matches your answer.",
    },
    {
      id: "table-wall",
      title: "The Table Wall",
      narrative:
        "Four chalkboard tables hang side by side, each with the same x values. The keeper left a rule on the wall: y = 3x. Only one table follows it.",
      gate: { needs: "table-matches-equation", label: "Matching a table to an equation" },
      puzzle: {
        type: "choice",
        prompt: "Which table follows the rule y = 3x?",
        choices: [
          "x: 1, 2, 3, 4 and y: 4, 5, 6, 7",
          "x: 1, 2, 3, 4 and y: 3, 6, 9, 12",
          "x: 1, 2, 3, 4 and y: 3, 5, 7, 9",
          "x: 1, 2, 3, 4 and y: 3, 6, 12, 24",
        ],
        answer: 1,
        tokens: ["F", "T", "R", "K"],
        hints: [
          "Test the first row of each table: put x = 1 into the rule and compare it with y.",
          "Now test x = 2 and x = 3. A table that follows a rule must work for every row, not just the first.",
          "Look at how y changes each time x goes up by 1. A rule with one multiplier changes by the same amount each step.",
        ],
        misconceptions: [
          {
            tag: "adds-instead-of-multiplies",
            pick: 0,
            hint: "That table adds the same number to x. Does y = 3x add 3 to x, or multiply x by 3?",
          },
          {
            tag: "matches-first-row-only",
            pick: 2,
            hint: "The first row works, but check the second and third rows against the rule. Does the pattern keep going?",
          },
          {
            tag: "doubles-each-step",
            pick: 3,
            hint: "That table doubles each time. A rule like y = 3x changes by the same amount each time x goes up by 1.",
          },
        ],
        model: {
          text: "A different rule is y = 2x. The table with y values 2, 4, 6 works, because 2 times 1 is 2, 2 times 2 is 4 and 2 times 3 is 6. A table with y values 3, 4, 5 only adds 1 each time, so it does not fit.",
        },
        transfer: {
          type: "choice",
          prompt: "Which table follows the rule y = 5x?",
          choices: [
            "x: 1, 2, 3 and y: 6, 7, 8",
            "x: 1, 2, 3 and y: 5, 10, 15",
            "x: 1, 2, 3 and y: 5, 25, 125",
          ],
          answer: 1,
          tokens: ["A", "B", "C"],
          hints: [
            "Put x = 1 into the rule and compare it with each table.",
            "Check the rows after the first one as well.",
            "Look at how much y changes when x goes up by 1.",
          ],
        },
        why: "In y = 3x every y value is 3 times its x value, so y goes up by 3 each time x goes up by 1. Only one table does that in every row.",
        supports: sup(
          {
            d: "Test each table with x = 1, then x = 2. Cross out a table when a row does not fit.",
            f: ["For x = 1, y should be ___.", "This table does not fit because ___."],
            w: ["rule", "row", "times", "fits"],
          },
          {
            f: [
              "The rule says y is ___ times x.",
              "When x goes up by 1, y goes up by ___ in the right table.",
            ],
            w: ["multiply", "pattern"],
          },
          ["The table that follows the rule is the one where every row satisfies ___."],
        ),
      },
      reveal:
        "Under the table that matches, a second brass tag hangs from a nail. A letter is stamped on it.",
    },
    {
      id: "graph-gallery",
      title: "The Graph Gallery",
      narrative:
        "The keeper drew a graph of the barrel filling and hung it on the wall. Gallons are on the vertical axis. Minutes are on the horizontal axis.",
      gate: {
        needs: "name-the-variables",
        label: "Naming the independent and dependent variables",
      },
      puzzle: {
        type: "choice",
        prompt:
          "The graph shows gallons in the barrel (y) after some minutes (x). Which statement names the variables correctly?",
        visual: {
          kind: "coord",
          alt: "A graph with minutes on the horizontal axis and gallons on the vertical axis. Points at 1 minute and 4 gallons, 2 minutes and 8 gallons, 3 minutes and 12 gallons lie on a straight line rising from the corner.",
          longDesc:
            "The points are (1, 4), (2, 8), (3, 12) and (4, 16). The line through them starts at (0, 0) and rises 4 gallons for every 1 minute.",
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
        },
        choices: [
          "Gallons is the independent variable and minutes is the dependent variable.",
          "Minutes is the independent variable and gallons is the dependent variable.",
          "Both variables are independent because both of them change.",
          "A graph has only one variable, so neither one is dependent.",
        ],
        answer: 1,
        tokens: ["G", "M", "P", "V"],
        hints: [
          "Ask which quantity you could choose freely, such as letting the hose run for any number of minutes.",
          "Ask which quantity you would have to measure after you chose the time. That quantity depends on the other.",
          "The independent variable is usually on the horizontal axis. The dependent variable is the one whose value is found from it.",
        ],
        misconceptions: [
          {
            tag: "swaps-the-variables",
            pick: 0,
            hint: "Think about cause. Does the barrel's water decide how long the hose runs, or does the running time decide the water?",
          },
          {
            tag: "both-change-so-both-independent",
            pick: 2,
            hint: "Both quantities change, but one of them is found from the other. Which one waits for the other to be chosen?",
          },
          {
            tag: "graph-has-one-variable",
            pick: 3,
            hint: "Look at the two axes. How many quantities do they name?",
          },
        ],
        model: {
          text: "A different graph shows the height of a plant (y) after some weeks (x). You choose the number of weeks; the height is measured afterward. So weeks is the independent variable, and height is the dependent variable that depends on it.",
        },
        transfer: {
          type: "choice",
          prompt:
            "A graph shows the cost of apples (y) for different weights of apples (x). Which quantity is the dependent variable?",
          choices: [
            "The weight of the apples",
            "The cost of the apples",
            "The color of the apples",
          ],
          answer: 1,
          tokens: ["W", "C", "L"],
          hints: [
            "Which quantity can a shopper choose first?",
            "Which quantity does the store calculate after the weight is known?",
            "The dependent variable depends on the other quantity.",
          ],
        },
        why: "You choose the minutes the hose runs, and the gallons depend on that time. So minutes is independent and gallons is dependent.",
        supports: sup(
          {
            d: "Look at both axes. Ask which one you choose first and which one you measure after.",
            f: ["I choose ___ first.", "___ depends on the other quantity."],
            w: ["independent", "dependent", "axis", "depends"],
          },
          {
            f: [
              "The independent variable is ___ because ___.",
              "The dependent variable is ___ because it ___.",
            ],
            w: ["choose", "measure"],
          },
          ["___ is the independent variable because it determines ___, the dependent variable."],
        ),
      },
      reveal:
        "A glass frame slides open behind the graph, and a third piece of the code sits in a small drawer.",
    },
    {
      id: "control-room",
      title: "The Control Room",
      narrative:
        "Three hoses were tested and the keeper wrote down what each one did. The three equations are on small cards. Match each test to the card that describes it.",
      gate: { needs: "rate-from-situation", label: "Finding the rate of change from a situation" },
      puzzle: {
        type: "match",
        prompt:
          "Match each test result to the equation that has the correct rate of change. One equation will not be used.",
        lefts: [
          {
            id: "l1",
            text: "A bike travels 18 miles in 3 hours. x is hours and y is miles.",
            calc: "18/3",
          },
          {
            id: "l2",
            text: "A printer prints 20 pages in 4 minutes. x is minutes and y is pages.",
            calc: "20/4",
          },
          {
            id: "l3",
            text: "A tap fills 21 liters in 7 minutes. x is minutes and y is liters.",
            calc: "21/7",
          },
        ],
        rights: [
          { id: "r1", text: "y = 6x", token: "6", value: "6" },
          { id: "r2", text: "y = 5x", token: "5", value: "5" },
          { id: "r3", text: "y = 3x", token: "3", value: "3" },
          { id: "r4", text: "y = 18x", token: "8", value: "18" },
          { id: "r5", text: "y = x/6", token: "1", value: "1/6" },
        ],
        answer: { l1: "r1", l2: "r2", l3: "r3" },
        hints: [
          "The rate of change is how much y changes when x goes up by 1.",
          "Find the amount for 1 hour or 1 minute. Think about sharing the total equally among the hours or minutes.",
          "Check your card by putting the given x into the equation. Does it give the total in the description?",
        ],
        misconceptions: [
          {
            tag: "uses-the-total-as-the-rate",
            has: ["l1=r4"],
            hint: "That equation gives the total for 1 hour. The total of 18 miles was for several hours. How far did the bike go in just one?",
          },
          {
            tag: "flips-the-rate",
            has: ["l1=r5"],
            hint: "That equation makes y smaller than x. Is the number of miles smaller than the number of hours here?",
          },
        ],
        model: {
          text: "A different test: a worker packs 24 boxes in 6 minutes. To find the boxes in 1 minute, share 24 equally among 6 minutes, which gives 4. The rate of change is 4 boxes per minute, so the equation is y = 4x.",
        },
        transfer: {
          type: "match",
          prompt: "Match each test result to the equation that has the correct rate of change.",
          lefts: [
            {
              id: "m1",
              text: "A cart rolls 10 meters in 2 seconds. x is seconds and y is meters.",
              calc: "10/2",
            },
            {
              id: "m2",
              text: "A faucet fills 9 cups in 3 minutes. x is minutes and y is cups.",
              calc: "9/3",
            },
            {
              id: "m3",
              text: "A reader finishes 8 pages in 4 minutes. x is minutes and y is pages.",
              calc: "8/4",
            },
          ],
          rights: [
            { id: "n1", text: "y = 2x", token: "2", value: "2" },
            { id: "n2", text: "y = 3x", token: "3", value: "3" },
            { id: "n3", text: "y = 5x", token: "5", value: "5" },
          ],
          answer: { m1: "n3", m2: "n2", m3: "n1" },
          hints: [
            "The rate of change is how much y changes for each 1 of x.",
            "Share the total equally among the minutes or seconds.",
            "Test your card: put in the given x and see whether you get the given total.",
          ],
        },
        why: "Dividing the total by the time gives the amount for one unit of time. That amount is the rate of change, which is the number in front of x.",
        supports: sup(
          {
            d: "For each test, find how much happens in just 1 hour or 1 minute. Then find the card with that number.",
            f: ["In 1 hour the bike goes ___ miles.", "The card with ___ in front of x matches."],
            w: ["rate", "each", "equation", "one"],
          },
          {
            f: ["I divided ___ by ___ to get the rate.", "The rate of change is ___ per ___."],
            w: ["rate of change", "divide"],
          },
          ["The rate of change is the ratio of y to x, so ___ divided by ___ equals ___."],
        ),
      },
      reveal:
        "The last card slides from the wall and clicks into a slot. The fourth piece of the code is stamped on the back.",
    },
  ],
  door: {
    title: "The Valve Box Door",
    prompt: "Type the code the keeper's note describes.",
    order: ["tool-shed", "table-wall", "graph-gallery", "control-room"],
    success: "The lock clicks and the valve box opens. Water begins to run at a steady rate.",
  },
  reflection: {
    prompt:
      "Which room made you think hardest about how two quantities change together? What helped you solve it?",
    frames: {
      ee: ["The hardest room was ___.", "It helped me to ___."],
      dev: ["The room that was hardest was ___ because ___.", "What helped me was ___."],
      exp: ["I found the ___ room hardest because ___; I solved it by ___."],
      br: [
        "The ___ room made me connect the table, graph and equation because ___, and ___ helped me check my thinking.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

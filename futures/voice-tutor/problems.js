/* problems.js — Grade 6 (Reveal/BCPS) word-problem bank + Socratic question ladders.
 *
 * Each problem has a `stages` array. Every stage is one rung of the Socratic
 * ladder: identify what's being asked -> identify knowns -> identify the
 * operation/relationship -> estimate -> solve -> check.
 *
 * The tutor NEVER states the answer. Each stage carries:
 *   - prompt:   the Socratic question the tutor speaks/shows.
 *   - keywords: arrays of accepted-response signals. The student's transcript
 *               is keyword-matched (rule based, on-device) to decide whether to
 *               advance. `any` = at least one group must hit. Each group is an
 *               array of synonyms; ONE synonym in a group satisfies that group.
 *   - hint:     a gentler nudge (still a question) if the student is stuck.
 *   - encourage:a short affirmation used when the student advances.
 *
 * No answers are ever spoken. Even the "solve" stage only confirms the student
 * reached *a* number and pivots to checking it.
 */

window.TUTOR_PROBLEMS = [
  {
    id: "ratio",
    tag: "Ratios & Proportional Reasoning (6.AT)",
    title: "Trail Mix Ratio",
    text:
      "A trail mix recipe uses 3 cups of peanuts for every 2 cups of raisins. " +
      "Maya wants to make a bigger batch using 12 cups of peanuts. " +
      "How many cups of raisins should she use?",
    stages: [
      {
        prompt: "What is the problem asking you to find?",
        keywords: [["raisin"], ["how many", "cups", "amount", "number"]],
        match: "all",
        hint: "Read the last sentence again. What quantity has a question mark on it?",
        encourage: "Yes — we're finding the cups of raisins.",
      },
      {
        prompt:
          "Good. Now, what do we already know? What two amounts are being compared in the recipe?",
        keywords: [
          ["peanut", "3"],
          ["raisin", "2"],
        ],
        match: "all",
        hint: "The recipe gives a ratio. How many peanuts go with how many raisins?",
        encourage: "Right — 3 cups of peanuts for every 2 cups of raisins.",
      },
      {
        prompt:
          "How does the ratio of peanuts to raisins stay the same when the batch gets bigger? What operation keeps a ratio equal?",
        keywords: [
          [
            "multipl",
            "times",
            "scale",
            "divide",
            "equivalent",
            "proportion",
            "same ratio",
            "times",
          ],
        ],
        match: "any",
        hint: "If you multiply one part of a ratio by a number, what must you do to the other part?",
        encourage: "Exactly — you scale both parts by the same factor.",
      },
      {
        prompt:
          "Before solving, estimate. The peanuts went from 3 cups up to 12 cups — roughly how much bigger is the batch?",
        keywords: [["4", "four", "times", "quadruple", "bigger", "more"]],
        match: "any",
        hint: "What do you multiply 3 by to get 12?",
        encourage: "Nice estimate — the batch is about 4 times bigger.",
      },
      {
        prompt:
          "Now work it out on your paper. What scale factor did you use, and what number of raisins did you get?",
        keywords: [
          ["8", "eight"],
          ["4", "four", "factor", "scale"],
        ],
        match: "any",
        hint: "Multiply the raisins by the same factor you found for the peanuts.",
        encourage: "You found a value — let's make sure it's right.",
      },
      {
        prompt:
          "Last step: check it. Does your raisins answer keep the ratio 3 to 2 when you compare 12 peanuts to your raisins?",
        keywords: [
          [
            "yes",
            "equal",
            "same",
            "3 to 2",
            "proportion",
            "check",
            "twelve to eight",
            "12 to 8",
          ],
        ],
        match: "any",
        hint: "Simplify 12 to your raisins number. Does it reduce back to 3 to 2?",
        encourage:
          "Great checking — the ratio holds. You reasoned all the way through it.",
      },
    ],
  },

  {
    id: "expression",
    tag: "Expressions & Equations (6.AT)",
    title: "Concert Tickets",
    text:
      "Each concert ticket costs $9. There is also a one-time $5 service fee for the whole order. " +
      "Write an expression for the total cost of buying t tickets, then find the cost of 6 tickets.",
    stages: [
      {
        prompt: "What is the problem asking you to find?",
        keywords: [["total", "cost", "expression", "how much", "price"]],
        match: "any",
        hint: "There are two parts: an expression, and then a specific total. What total?",
        encourage:
          "Right — an expression for total cost, then the cost of 6 tickets.",
      },
      {
        prompt:
          "What do we know? What does each ticket cost, and what extra charge happens only once?",
        keywords: [
          ["9", "nine"],
          ["5", "five", "fee", "service"],
        ],
        match: "all",
        hint: "Look for the per-ticket price and the one-time fee.",
        encourage: "Good — $9 per ticket and a single $5 fee.",
      },
      {
        prompt:
          "Which part changes with the number of tickets, and which part stays the same? What operation joins them?",
        keywords: [["multipl", "times", "add", "plus", "9t", "9 t", "9 times"]],
        match: "any",
        hint: "The ticket cost depends on t, so it gets multiplied. The fee is added once.",
        encourage: "Exactly — multiply 9 by t, then add the 5.",
      },
      {
        prompt:
          "Estimate first. Without the fee, about what would 6 tickets cost? Roughly.",
        keywords: [["54", "fifty", "about 50", "around 50", "60", "50"]],
        match: "any",
        hint: "6 tickets times about $9 each — what's that close to?",
        encourage: "Good estimate — somewhere around $50.",
      },
      {
        prompt:
          "Now compute the real total for 6 tickets on your paper. What expression did you write, and what total did you get?",
        keywords: [["59"], ["9t", "9 t", "9 times t", "plus 5", "+ 5"]],
        match: "any",
        hint: "Substitute t = 6 into your expression, then add the fee.",
        encourage: "You've got a value — let's verify it.",
      },
      {
        prompt:
          "Check it: is your total a little more than your estimate, because of the $5 fee? Does that make sense?",
        keywords: [
          ["yes", "more", "5 more", "makes sense", "fee", "59", "checks"],
        ],
        match: "any",
        hint: "Your total should be exactly $5 above the no-fee estimate. Is it?",
        encourage:
          "Perfect — the fee accounts for the difference. Well reasoned.",
      },
    ],
  },

  {
    id: "unitrate",
    tag: "Unit Rates (6.AT.A.2/3)",
    title: "Best Buy on Juice",
    text:
      "A 32-ounce bottle of juice costs $4.80. A 48-ounce bottle costs $6.72. " +
      "Which bottle is the better buy per ounce?",
    stages: [
      {
        prompt: "What is the problem asking you to find?",
        keywords: [
          [
            "better buy",
            "cheaper",
            "per ounce",
            "unit rate",
            "which bottle",
            "best",
            "value",
          ],
        ],
        match: "any",
        hint: "It's a comparison. What measurement lets you compare fairly?",
        encourage: "Right — which bottle costs less per ounce.",
      },
      {
        prompt: "What do we know? Name the price and the size of each bottle.",
        keywords: [
          ["32"],
          ["48"],
          ["4.80", "4 80", "four eighty"],
          ["6.72", "6 72", "six seventy"],
        ],
        match: "any",
        hint: "There are two bottles. Each has a number of ounces and a price.",
        encourage: "Good — two bottles, each with a size and a price.",
      },
      {
        prompt:
          "To compare fairly, what should you find for each bottle? What operation gives you cost per ounce?",
        keywords: [
          [
            "divide",
            "division",
            "per ounce",
            "unit rate",
            "price by ounce",
            "split",
          ],
        ],
        match: "any",
        hint: "A unit rate is cost FOR ONE ounce. How do you get a 'per one' amount?",
        encourage: "Exactly — divide the price by the number of ounces.",
      },
      {
        prompt:
          "Estimate before dividing. Both are roughly 15 cents an ounce — do you expect them to be close or very different?",
        keywords: [
          [
            "close",
            "similar",
            "near",
            "about the same",
            "different",
            "15",
            "cents",
          ],
        ],
        match: "any",
        hint: "Roughly: about $5 for 32 oz, about $7 for 48 oz. Are those rates close?",
        encourage: "Good instinct — the rates will be close, so be careful.",
      },
      {
        prompt:
          "Now divide for each bottle on your paper. What cost-per-ounce did you get for each one?",
        keywords: [
          ["0.15", ".15", "15 cents", "0.14", ".14", "14 cents", "per ounce"],
        ],
        match: "any",
        hint: "Divide each price by its ounces. Compare the two results.",
        encourage: "You have two rates — let's confirm which is smaller.",
      },
      {
        prompt:
          "Check it: the better buy has the SMALLER cost per ounce. Which bottle had the smaller rate, and does that answer the question?",
        keywords: [
          [
            "48",
            "bigger bottle",
            "larger",
            "smaller rate",
            "yes",
            "better",
            "cheaper per ounce",
          ],
        ],
        match: "any",
        hint: "Lower price per ounce wins. Which bottle was lower?",
        encourage:
          "Nicely checked — the lower per-ounce rate is the better buy.",
      },
    ],
  },

  {
    id: "area",
    tag: "Area of Composite Figures (6.GR.A.1)",
    title: "L-Shaped Garden",
    text:
      "A garden is shaped like an L. It can be split into two rectangles. " +
      "The first rectangle is 8 meters by 3 meters. The second is 4 meters by 2 meters. " +
      "What is the total area of the garden?",
    stages: [
      {
        prompt: "What is the problem asking you to find?",
        keywords: [
          ["area", "total area", "how much", "space", "square meters"],
        ],
        match: "any",
        hint: "The last sentence asks for one measurement of the whole shape. Which one?",
        encourage: "Right — the total area of the L-shaped garden.",
      },
      {
        prompt:
          "What do we know? The L splits into two rectangles. What are the dimensions of each one?",
        keywords: [
          ["8", "eight"],
          ["3", "three"],
          ["4", "four"],
          ["2", "two"],
        ],
        match: "any",
        hint: "One rectangle is 8 by 3. What is the other one?",
        encourage: "Good — an 8-by-3 rectangle and a 4-by-2 rectangle.",
      },
      {
        prompt:
          "How do you find the area of ONE rectangle, and then how do you combine the two areas?",
        keywords: [
          ["multipl", "times", "length times width", "add", "plus", "sum"],
        ],
        match: "any",
        hint: "Area of a rectangle is length times width. Then what do you do with the two areas?",
        encourage:
          "Exactly — multiply each rectangle's sides, then add the two areas.",
      },
      {
        prompt:
          "Estimate. The big rectangle alone is about 8 times 3. Roughly how many square meters is that?",
        keywords: [["24", "twenty", "about 24", "around 25", "25"]],
        match: "any",
        hint: "8 times 3 — what's that product, roughly?",
        encourage:
          "Good — the big rectangle is about 24 square meters, so the total is a bit more.",
      },
      {
        prompt:
          "Now compute each area and add them on your paper. What total area did you get?",
        keywords: [
          ["32", "thirty"],
          ["24", "8"],
          ["8", "eight"],
        ],
        match: "any",
        hint: "Find 8 times 3, find 4 times 2, then add the two results.",
        encourage: "You have a total — let's make sure it's reasonable.",
      },
      {
        prompt:
          "Check it: is your total bigger than the big rectangle alone, and are the units in square meters?",
        keywords: [
          [
            "yes",
            "bigger",
            "more",
            "square meters",
            "makes sense",
            "32",
            "checks",
          ],
        ],
        match: "any",
        hint: "Adding the second rectangle should make the total larger than 24. Is it? And what unit?",
        encourage:
          "Great — the total is larger and in square meters. Fully reasoned!",
      },
    ],
  },

  {
    id: "volume",
    tag: "Volume with Fractions (6.GR.A.2)",
    title: "Fish Tank Volume",
    text:
      "A rectangular fish tank is 5 meters long, 3 meters wide, and 2 and a half meters tall. " +
      "What is the volume of water it can hold when full?",
    stages: [
      {
        prompt: "What is the problem asking you to find?",
        keywords: [
          ["volume", "how much water", "capacity", "cubic", "hold", "space"],
        ],
        match: "any",
        hint: "A tank holds water in three dimensions. What measurement describes that?",
        encourage: "Right — the volume of the tank.",
      },
      {
        prompt: "What do we know? Name the three measurements of the tank.",
        keywords: [
          ["5", "five"],
          ["3", "three"],
          ["2.5", "2 and a half", "two and a half", "two point five"],
        ],
        match: "any",
        hint: "A box has length, width, and height. What are they here?",
        encourage: "Good — 5 long, 3 wide, and 2 and a half tall.",
      },
      {
        prompt:
          "What operation gives the volume of a rectangular prism from its three dimensions?",
        keywords: [
          [
            "multipl",
            "times",
            "length times width times height",
            "lwh",
            "product",
          ],
        ],
        match: "any",
        hint: "Volume of a box is length times width times... what? And joined by which operation?",
        encourage: "Exactly — multiply length by width by height.",
      },
      {
        prompt:
          "Estimate. If the height were 2 instead of 2 and a half, the volume would be about 5 times 3 times 2. Roughly how much?",
        keywords: [["30", "thirty", "about 30", "around 30"]],
        match: "any",
        hint: "5 times 3 is 15, times 2 — what's that, roughly?",
        encourage: "Good — about 30, so the real answer is a little more.",
      },
      {
        prompt:
          "Now multiply all three on your paper, using two and a half for the height. What volume did you get?",
        keywords: [["37.5", "37 and a half", "thirty-seven", "thirty seven"]],
        match: "any",
        hint: "Multiply 5 times 3, then multiply by 2 and a half.",
        encourage: "You have a value — let's check it makes sense.",
      },
      {
        prompt:
          "Check it: is your volume a bit MORE than your estimate of 30, since the real height was taller? And what are the units?",
        keywords: [
          [
            "yes",
            "more",
            "bigger",
            "cubic",
            "cubic meters",
            "makes sense",
            "checks",
            "37.5",
          ],
        ],
        match: "any",
        hint: "A taller tank holds more than the 'height 2' estimate. Is your answer above 30? Units?",
        encourage:
          "Excellent — more than 30 and in cubic meters. You reasoned through the whole problem!",
      },
    ],
  },
];

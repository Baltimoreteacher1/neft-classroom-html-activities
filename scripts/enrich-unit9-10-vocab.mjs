#!/usr/bin/env node
// enrich-unit9-10-vocab.mjs — the same scaffolding pass Unit 1 got, for the two
// other starved units.
//
//   node scripts/enrich-unit9-10-vocab.mjs [--dry-run]
//
// Units 9 (two-variable relationships) and 10 (the Math Is… closing unit) shipped
// with bare definitions: 1 `visual` between the two of them, 0 clozes, 0 example
// pairs, against 75/75 visuals in Unit 2 and 96/96 in Unit 6. Unit 9 is where a
// student first has to hold "independent" and "dependent" apart, which is exactly
// the kind of word pair that needs an example, not a definition.
//
// Same contract as scripts/enrich-unit1-vocab.mjs: adds `visual`, `cloze` and an
// is/is-not `examples` pair, in the lesson's own context, never overwriting a
// field that is already there, across base lessons and their small-group and
// catch-up variants.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const LESSONS = "lessons";
const UNITS_9_10 = /^(9|10)-\d(?:-(?:group1|group2|catchup))?$/;

/** "unit|term" → fields. Keyed by unit because both units define `pattern`,
 *  `predict` and `volume`, and each unit means its own thing by them. */
const ENRICHMENT = {
  // ── Unit 9 · relationships between two variables ────────────────────────
  "9|independent variable": {
    visual: "Miguel picks the number of MONTHS — nothing else decides it for him.",
    cloze: "The quantity that is subject to choice is the ___ ___.",
    examples: [
      {
        text: "The number of tickets you decide to buy",
        isExample: true,
        why: "You choose it; nothing in the problem forces the value.",
      },
      {
        text: "The total cost of those tickets",
        isExample: false,
        why: "The cost is the result of your choice, so it depends.",
      },
    ],
  },
  "9|dependent variable": {
    visual: "Total cost = $24.95 × months — the cost RESPONDS to the months.",
    cloze: "The quantity that changes in response to the other is the ___ ___.",
    examples: [
      {
        text: "Calories burned during a jog of the length you chose",
        isExample: true,
        why: "It moves because the minutes moved.",
      },
      {
        text: "The minutes you decided to jog",
        isExample: false,
        why: "That is the choice, not the response.",
      },
    ],
  },
  "9|depends on": {
    visual: "“Total cost depends on the number of months.” Responder first, chooser last.",
    cloze: "Say it in order: the responding quantity ___ ___ the chosen one.",
    examples: [
      {
        text: "Pages printed depends on minutes running",
        isExample: true,
        why: "The printer's output responds to the time you let it run.",
      },
      {
        text: "Minutes running depends on pages printed",
        isExample: false,
        why: "It reverses the roles — you set the time, not the pages.",
      },
    ],
  },
  "9|quantity": {
    visual: "24.95 dollars per month, 12 months — each is a number with a meaning.",
    cloze: "Something that can be counted or measured is a ___.",
    examples: [
      {
        text: "6 hours of canoe rental",
        isExample: true,
        why: "A number together with what it measures.",
      },
      {
        text: "The name of the gym",
        isExample: false,
        why: "A name cannot be counted or measured.",
      },
    ],
  },
  "9|relationship": {
    visual: "1 month → $24.95, 2 months → $49.90: the two quantities move together.",
    cloze: "How two quantities change together is a ___.",
    examples: [
      {
        text: "Tickets bought and total cost",
        isExample: true,
        why: "Change one and the other changes with it.",
      },
      {
        text: "Pizzas sold and how many employees the shop has",
        isExample: false,
        why: "The staff list does not move when a pizza sells.",
      },
    ],
  },
  "9|graph": {
    visual: "Points (1, 45), (2, 90), (3, 135) climbing left to right — cost by tickets.",
    cloze: "A picture on the coordinate plane showing how two quantities relate is a ___.",
    examples: [
      {
        text: "Plotted points where each one is a (tickets, cost) pair",
        isExample: true,
        why: "Every point carries both quantities at once.",
      },
      {
        text: "A drawing of the stadium",
        isExample: false,
        why: "A picture with no quantities on it shows no relationship.",
      },
    ],
  },
  "9|table of values": {
    visual: "months 1, 2, 4 beside cost 24.95, 49.90, 99.80 — one row per pair.",
    cloze: "A list of matched pairs that shows a relationship in numbers is a ___ ___ ___.",
    examples: [
      {
        text: "Hours in one column, kilometers in the other",
        isExample: true,
        why: "Each row pairs the two quantities at the same moment.",
      },
      {
        text: "A column of costs with nothing to pair them to",
        isExample: false,
        why: "One quantity alone shows no relationship.",
      },
    ],
  },
  "9|ordered pair": {
    visual: "(3, 135): 3 tickets cost $135 — the independent quantity comes first.",
    cloze: "Two numbers written (x, y) that name one point are an ___ ___.",
    examples: [
      {
        text: "(4, 60) for 4 hours at $15 an hour",
        isExample: true,
        why: "Hours first, cost second.",
      },
      {
        text: "(60, 4) for the same rental",
        isExample: false,
        why: "Reversed, it plots a different point.",
      },
    ],
  },
  "9|axis": {
    visual: "Horizontal axis: months. Vertical axis: total cost.",
    cloze: "Each number line framing a graph, labeled with a quantity, is an ___.",
    examples: [
      {
        text: "The horizontal line labeled “number of tickets”",
        isExample: true,
        why: "It is one of the two lines, and it names a quantity.",
      },
      {
        text: "The line connecting the plotted points",
        isExample: false,
        why: "That shows the trend; it does not frame the graph.",
      },
    ],
  },
  "9|coordinates": {
    visual: "In (4, 105), 4 says how far across and 105 how far up.",
    cloze: "The numbers in an ordered pair that tell how far to move are its ___.",
    examples: [
      {
        text: "The 2 and the 90 in (2, 90)",
        isExample: true,
        why: "They locate the point on each axis.",
      },
      {
        text: "The label “total cost”",
        isExample: false,
        why: "A label names an axis; it is not a number.",
      },
    ],
  },
  "9|equation": {
    visual: "c = 24.95m — the cost for ANY number of months, not just the rows listed.",
    cloze: "A mathematical sentence with an equals sign is an ___.",
    examples: [
      {
        text: "c = 15h",
        isExample: true,
        why: "It has an equals sign and relates two quantities.",
      },
      {
        text: "15h",
        isExample: false,
        why: "With no equals sign it is an expression, not an equation.",
      },
    ],
  },
  "9|variable": {
    visual: "In c = 24.95m, the m can be 1, 2, or 12 — it varies.",
    cloze: "A letter standing for a quantity that can change is a ___.",
    examples: [
      {
        text: "The m in c = 24.95m",
        isExample: true,
        why: "It takes different values as the months change.",
      },
      {
        text: "The 24.95 in c = 24.95m",
        isExample: false,
        why: "That value is fixed — it is the rate.",
      },
    ],
  },
  "9|rate": {
    visual: "$24.95 for every 1 month — the amount attached to one unit.",
    cloze: "A fixed amount of one quantity for every one unit of the other is a ___.",
    examples: [
      {
        text: "2.5 cars produced each hour",
        isExample: true,
        why: "It gives the amount for exactly one hour.",
      },
      {
        text: "20 cars produced in one shift",
        isExample: false,
        why: "That is a total for 8 hours, not a per-hour rate.",
      },
    ],
  },
  "9|represent": {
    visual: "The same membership shown as a table, a graph, AND c = 24.95m.",
    cloze: "To show a relationship with a table, graph, or equation is to ___ it.",
    examples: [
      {
        text: "Turning each table row into a plotted point",
        isExample: true,
        why: "The same relationship, shown a second way.",
      },
      {
        text: "Computing one answer and stopping",
        isExample: false,
        why: "One answer does not show the relationship.",
      },
    ],
  },
  "9|define the variables": {
    visual: "“Let m = months and c = total cost” — written before you solve.",
    cloze: "To state what each letter stands for is to ___ ___ ___.",
    examples: [
      {
        text: "“Let h = hours of operation”",
        isExample: true,
        why: "It says exactly what the letter measures.",
      },
      { text: "“Let h = a number”", isExample: false, why: "It never says a number of WHAT." },
    ],
  },
  "9|solution": {
    visual: "h = 8 makes 2.5h = 20 true, so 8 is the solution.",
    cloze: "A value of the variable that makes an equation true is a ___.",
    examples: [
      {
        text: "x = 7 for x + 8 = 15",
        isExample: true,
        why: "Substituting 7 makes both sides equal.",
      },
      { text: "x = 3 for x + 5 = 9", isExample: false, why: "3 + 5 = 8, which is not 9." },
    ],
  },
  "9|substitute": {
    visual: "c = 15h with h = 5 becomes c = 15 × 5 = 75.",
    cloze: "To replace a variable with a number so you can compute is to ___.",
    examples: [
      {
        text: "Putting 12 in for m in c = 24.95m",
        isExample: true,
        why: "The letter is swapped for a value.",
      },
      {
        text: "Rewriting c = 24.95m as c = 19.95m",
        isExample: false,
        why: "That changes the rate, not the variable.",
      },
    ],
  },
  "9|at least": {
    visual: "“At least $500” means $500 counts, and so does anything more.",
    cloze: "That amount or more — the smallest amount that still works — is ___ ___.",
    examples: [
      {
        text: "42 cars when the goal is at least 42",
        isExample: true,
        why: "The boundary value itself is allowed.",
      },
      {
        text: "41 cars when the goal is at least 42",
        isExample: false,
        why: "It falls below the boundary.",
      },
    ],
  },
  "9|predict": {
    visual:
      "We measured up to 5 minutes → 6,000 feet. Reach PAST what was measured: 6 minutes should be about 7,200.",
    cloze: "To use what you already know to say what a future amount will be is to ___.",
    examples: [
      {
        text: "Using c = 24.95m to find the cost of a year you have not paid for yet",
        isExample: true,
        why: "The rule lets you reach a value you never measured.",
      },
      {
        text: "Reading a value straight off the table",
        isExample: false,
        why: "That is looking it up, not predicting it.",
      },
    ],
  },
  "9|justify": {
    visual: "“35 cars at $14.30 raises $500.50, which clears the $500 goal.”",
    cloze: "To explain WHY your answer makes sense using the mathematics is to ___ it.",
    examples: [
      {
        text: "Showing the computation that backs your recommendation",
        isExample: true,
        why: "The reason is mathematical and checkable.",
      },
      { text: "“It just seems right.”", isExample: false, why: "No mathematics is offered." },
    ],
  },

  // ── Unit 10 · Math Is… ──────────────────────────────────────────────────
  "10|profession": {
    visual: "A chef prices a menu; a nurse measures a dose; a carpenter cuts to length.",
    cloze: "A job someone is trained to do, like chef or nurse, is a ___.",
    examples: [
      {
        text: "A chef planning portions for 120 guests",
        isExample: true,
        why: "It is trained work, and it uses math.",
      },
      {
        text: "A hobby you do on weekends",
        isExample: false,
        why: "A hobby is not the job someone trained for.",
      },
    ],
  },
  "10|inventory": {
    visual: "The kitchen counts 40 lb of flour and 12 dozen eggs on hand.",
    cloze: "The supply a business keeps on hand, tracked by counting, is its ___.",
    examples: [
      {
        text: "A list of what is in stock this morning",
        isExample: true,
        why: "It counts what the business actually has.",
      },
      {
        text: "The menu prices",
        isExample: false,
        why: "Prices are what things cost, not what is in stock.",
      },
    ],
  },
  "10|portion": {
    visual: "Each bowl of soup uses 2 cups of broth — one person's serving.",
    cloze: "The measured amount of food served to one person is a ___.",
    examples: [
      {
        text: "2 cups of broth per bowl",
        isExample: true,
        why: "It is the amount one person receives.",
      },
      {
        text: "The 120 customers expected tonight",
        isExample: false,
        why: "That is a count of people, not an amount of food.",
      },
    ],
  },
  "10|area": {
    visual: "A 4 ft by 2 ft planter covers 8 square feet of ground.",
    cloze: "The flat space a surface covers, in square units, is its ___.",
    examples: [
      {
        text: "The square feet of floor in a store space",
        isExample: true,
        why: "It measures flat space, in square units.",
      },
      {
        text: "The soil that fills the planter",
        isExample: false,
        why: "Filling a space is volume, in cubic units.",
      },
    ],
  },
  "10|volume": {
    visual: "4 ft × 2 ft × 1 ft of soil = 8 cubic feet.",
    cloze: "The space something fills, in cubic units, is its ___.",
    examples: [
      {
        text: "The soil needed to fill a planter",
        isExample: true,
        why: "It fills a space, so it is measured in cubic units.",
      },
      {
        text: "The paper needed to wrap the planter",
        isExample: false,
        why: "Covering the outside is surface area.",
      },
    ],
  },
  "10|symmetric": {
    visual: "A butterfly: the left wing is the mirror of the right.",
    cloze: "Having two halves that match as mirror images is being ___.",
    examples: [
      {
        text: "A butterfly's two wings",
        isExample: true,
        why: "One side reflects the other exactly.",
      },
      {
        text: "A brightly coloured but lopsided leaf",
        isExample: false,
        why: "Colour is not the test — matching halves are.",
      },
    ],
  },
  "10|mirror image": {
    visual: "Fold the layer down the middle: each leaf lands on its partner.",
    cloze: "A copy of a figure flipped across a line is its ___ ___.",
    examples: [
      {
        text: "The right half of a butterfly compared to the left",
        isExample: true,
        why: "Flipping one across the line gives the other.",
      },
      {
        text: "The same shape slid to the side",
        isExample: false,
        why: "Sliding is not flipping — nothing is reversed.",
      },
    ],
  },
  "10|bilateral symmetry": {
    visual: "All 17,000+ butterfly species have it — two sides, one mirror line.",
    cloze: "Reflective symmetry in plants and animals is called ___ ___.",
    examples: [
      {
        text: "A flower whose two halves mirror across a slanted line",
        isExample: true,
        why: "The direction of the line does not matter.",
      },
      {
        text: "A leaf with more veins on one side",
        isExample: false,
        why: "The halves do not match, so nothing mirrors.",
      },
    ],
  },
  "10|line of symmetry": {
    visual: "The line straight down the butterfly's body.",
    cloze: "The line you draw so each side reflects the other is the ___ ___ ___.",
    examples: [
      {
        text: "A line through a figure where both sides match",
        isExample: true,
        why: "It is the line the reflection happens across.",
      },
      {
        text: "Any line drawn through the middle",
        isExample: false,
        why: "It only counts when the two sides actually mirror.",
      },
    ],
  },
  "10|balance": {
    visual: "Two matching halves — neither side feels heavier than the other.",
    cloze: "An even arrangement where neither side feels heavier is ___.",
    examples: [
      {
        text: "A symmetric garden with the same planting on each side",
        isExample: true,
        why: "Both sides carry equal visual weight.",
      },
      {
        text: "A design with everything crowded on the left",
        isExample: false,
        why: "One side clearly outweighs the other.",
      },
    ],
  },
  "10|puzzle": {
    visual: "Tower of Hanoi: three rods, a stack of discs, and two rules.",
    cloze: "A problem designed to be played with — rules, a goal, room to imagine — is a ___.",
    examples: [
      {
        text: "Moving a tower of discs without stacking big on small",
        isExample: true,
        why: "It has rules, a goal, and many ways in.",
      },
      {
        text: "A page of the same computation twenty times",
        isExample: false,
        why: "There is nothing to figure out, only to repeat.",
      },
    ],
  },
  "10|pattern": {
    visual: "Circle, square, triangle, circle, square, triangle …",
    cloze: "Objects or shapes repeated in a regular order form a ___.",
    examples: [
      {
        text: "1, 3, 7, 15, 31 — each is double the last plus 1",
        isExample: true,
        why: "The change follows a rule you can predict.",
      },
      {
        text: "Shapes dropped in random order",
        isExample: false,
        why: "Nothing lets you say what comes next.",
      },
    ],
  },
  "10|pattern rule": {
    visual: "1 → 3 → 7 → 15: the rule is “double it and add 1”.",
    cloze: "The rule for getting the next value from the one before is the ___ ___.",
    examples: [
      {
        text: "“Double the steps, then add 1”",
        isExample: true,
        why: "It produces the next term from this one.",
      },
      {
        text: "“The numbers grow quickly”",
        isExample: false,
        why: "True, but it names no next value.",
      },
    ],
  },
  "10|predict": {
    visual:
      "We counted towers of 1, 2 and 3 discs. Reach PAST them: the rule says 5 discs takes 31 steps — before moving one.",
    cloze: "To say what will happen before it happens, using a pattern, is to ___.",
    examples: [
      {
        text: "Using the rule to find the steps for a six-disc tower",
        isExample: true,
        why: "The pattern reaches a case you never played.",
      },
      {
        text: "Counting the moves after you finish",
        isExample: false,
        why: "That is recording, not predicting.",
      },
    ],
  },
  "10|organize": {
    visual: "Discs 1, 2, 3 in one column and steps 1, 3, 7 in the next.",
    cloze: "To arrange information so patterns become easier to see is to ___ it.",
    examples: [
      {
        text: "Putting the results in a table, in order",
        isExample: true,
        why: "Order is what makes the pattern visible.",
      },
      {
        text: "Writing results wherever there is room",
        isExample: false,
        why: "Scattered results hide the pattern.",
      },
    ],
  },
  "10|ingenuity": {
    visual: "The Penny Farthing's huge wheel, then chains and gears — two clever fixes.",
    cloze: "Coming up with a different, sometimes unique solution is ___.",
    examples: [
      {
        text: "Adding gears so one pedal turn moves the wheel farther",
        isExample: true,
        why: "It solves the problem a new way.",
      },
      {
        text: "Making the same bicycle again, unchanged",
        isExample: false,
        why: "Nothing was invented or improved.",
      },
    ],
  },
  "10|rotation": {
    visual: "One full turn of the pedal — 360° all the way around.",
    cloze: "One full turn of a wheel, gear, or pedal is a ___.",
    examples: [
      {
        text: "The rear wheel going around once",
        isExample: true,
        why: "A complete turn, back to where it started.",
      },
      {
        text: "The wheel moving a quarter of the way",
        isExample: false,
        why: "A part of a turn is not a full rotation.",
      },
    ],
  },
  "10|gear": {
    visual: "A 48-tooth pedal gear pulling a 12-tooth wheel gear through the chain.",
    cloze: "A toothed wheel that passes motion through a chain is a ___.",
    examples: [
      {
        text: "The 32-tooth wheel the chain sits on",
        isExample: true,
        why: "Its teeth carry the chain's motion.",
      },
      { text: "The bicycle seat", isExample: false, why: "It carries the rider, not the motion." },
    ],
  },
  "10|ratio": {
    visual: "48 pedal teeth to 12 wheel teeth — 4 wheel turns for every pedal turn.",
    cloze: "A comparison of two quantities, like pedal turns to wheel turns, is a ___.",
    examples: [
      {
        text: "1 pedal rotation to 4 wheel rotations",
        isExample: true,
        why: "It compares two quantities directly.",
      },
      {
        text: "The 48 teeth by itself",
        isExample: false,
        why: "One number alone compares nothing.",
      },
    ],
  },
  "10|equivalent ratios": {
    visual: "1 : 4 and 3 : 12 describe the same gear, at different sizes.",
    cloze: "Ratios that make the same comparison with different numbers are ___ ___.",
    examples: [
      { text: "2 : 8 and 1 : 4", isExample: true, why: "Both parts scaled by the same factor." },
      {
        text: "1 : 4 and 2 : 5",
        isExample: false,
        why: "Only one part was scaled, so the comparison changed.",
      },
    ],
  },
  "10|repetition": {
    visual: "The same tile, over and over, all the way along the border.",
    cloze: "The same object or shape repeated multiple times is ___.",
    examples: [
      {
        text: "One shape used again and again, unchanged",
        isExample: true,
        why: "A single form repeats exactly.",
      },
      {
        text: "The same shape in four different sizes",
        isExample: false,
        why: "Varying the size makes it rhythm, not repetition.",
      },
    ],
  },
  "10|pattern unit": {
    visual: "circle · square · triangle — the chunk that starts over.",
    cloze: "The smallest chunk of a pattern that repeats is the ___ ___.",
    examples: [
      {
        text: "The three shapes before the pattern starts again",
        isExample: true,
        why: "It is the smallest repeating piece.",
      },
      {
        text: "The first six shapes of that pattern",
        isExample: false,
        why: "That is the unit twice, not the unit.",
      },
    ],
  },
  "10|rhythm": {
    visual: "The same circles, but sizes and spacing change as your eye travels.",
    cloze: "Varying the placement, size, or order of the same shapes creates ___.",
    examples: [
      {
        text: "Circles that grow and shift along a row",
        isExample: true,
        why: "Same objects, varied appearance — flow without predictability.",
      },
      {
        text: "Identical circles evenly spaced",
        isExample: false,
        why: "Nothing varies, so that is a pattern.",
      },
    ],
  },
  "10|predictability": {
    visual: "Shape 25 must be a circle — the unit repeats every 3.",
    cloze: "Knowing what comes next because the design follows a rule is ___.",
    examples: [
      {
        text: "Naming shape 20 without drawing shapes 1–19",
        isExample: true,
        why: "The rule tells you before you look.",
      },
      {
        text: "Guessing the next shape in a rhythm design",
        isExample: false,
        why: "Rhythm varies on purpose, so it often cannot be predicted.",
      },
    ],
  },
  "10|math biography": {
    visual: "September: “I am not a math person.” June: “I can explain why it works.”",
    cloze: "The story of your relationship with math over time is your ___ ___.",
    examples: [
      {
        text: "How your thinking changed between September and June",
        isExample: true,
        why: "It tracks the story, not a single moment.",
      },
      {
        text: "Your grade on one quiz",
        isExample: false,
        why: "One score is a moment, not a story.",
      },
    ],
  },
  "10|reflect": {
    visual: "Looking back at the tram problem: what worked, what you would change.",
    cloze: "To look back at what you did and think about what it means is to ___.",
    examples: [
      {
        text: "Naming the strategy that finally worked and why",
        isExample: true,
        why: "You examined your own thinking.",
      },
      {
        text: "Writing the answer down again",
        isExample: false,
        why: "Copying an answer examines nothing.",
      },
    ],
  },
  "10|growth": {
    visual: "In Unit 1 you estimated 80 riders; now you find 480 riders per hour.",
    cloze: "The change between what you could do before and what you can do now is ___.",
    examples: [
      {
        text: "Explaining WHY a method works, which you could not do in the fall",
        isExample: true,
        why: "It compares then with now.",
      },
      {
        text: "Finishing a worksheet faster",
        isExample: false,
        why: "Speed alone is not evidence your reasoning grew.",
      },
    ],
  },
  "10|confidence": {
    visual: "Starting a hard problem before you are sure it will work.",
    cloze: "Trusting yourself to try, even when the first attempt may fail, is ___.",
    examples: [
      {
        text: "Trying a strategy and adjusting when it stalls",
        isExample: true,
        why: "You trusted your reasoning enough to begin.",
      },
      {
        text: "Waiting for someone else to start",
        isExample: false,
        why: "Nothing was risked or tried.",
      },
    ],
  },
  "10|community": {
    visual: "The people and places where math shows up — home, work, the neighborhood.",
    cloze: "The people and places around you where math shows up are your ___.",
    examples: [
      {
        text: "The shop, the bus schedule, and your family's budget",
        isExample: true,
        why: "Math in the places around you.",
      },
      {
        text: "Only the math classroom",
        isExample: false,
        why: "The point is that math is not confined to class.",
      },
    ],
  },
};

const lessons = readdirSync(LESSONS)
  .filter((name) => UNITS_9_10.test(name))
  .sort();

let fields = 0;
let files = 0;
const seen = new Set();

for (const lesson of lessons) {
  const file = join(LESSONS, lesson, "config.json");
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  const unit = String(config.unit);
  let changed = 0;
  for (const entry of config.vocabulary || []) {
    const key = `${unit}|${String(entry.term || "").toLowerCase()}`;
    const add = ENRICHMENT[key];
    if (!add) continue;
    seen.add(key);
    for (const [field, value] of Object.entries(add)) {
      if (entry[field]) continue;
      entry[field] = value;
      changed++;
    }
  }
  if (!changed) continue;
  fields += changed;
  files++;
  if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

const unused = Object.keys(ENRICHMENT).filter((key) => !seen.has(key));
if (unused.length) {
  console.error(`authored here but never matched a lesson term: ${unused.join(", ")}`);
  process.exit(1);
}
console.log(
  `${DRY ? "[dry-run] " : ""}units 9–10 vocabulary: ${fields} field(s) added across ${files} config(s)`,
);

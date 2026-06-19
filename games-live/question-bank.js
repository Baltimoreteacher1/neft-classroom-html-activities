/*
 * Server-side question bank (ESM) for live rooms. Lives ONLY in the Worker —
 * answer keys (answerIndex) are NEVER sent to clients except transiently in a
 * /reveal response after the question closes. host.html selects a standard; the
 * Worker builds the room from this bank so no answer key is embedded in any
 * publicly-served page.
 */
"use strict";

const BANK = {
  "6.RP.A.2": [
    {
      prompt: "12 apples cost $6. What is the unit price?",
      choices: ["$0.50 each", "$2 each", "$3 each", "$6 each"],
      answerIndex: 0,
      skill: "unit-rate",
    },
    {
      prompt: "A car goes 150 miles in 3 hours. Unit rate?",
      choices: ["30 mph", "45 mph", "50 mph", "60 mph"],
      answerIndex: 2,
      skill: "unit-rate",
    },
    {
      prompt: "8 pencils for $4. Cost per pencil?",
      choices: ["$0.50", "$2", "$4", "$0.25"],
      answerIndex: 0,
      skill: "unit-rate",
    },
  ],
  "6.RP.A.3": [
    {
      prompt: "If 3 notebooks cost $9, how much do 5 cost?",
      choices: ["$12", "$15", "$18", "$45"],
      answerIndex: 1,
      skill: "ratio-reasoning",
    },
    {
      prompt: "A recipe uses 2 cups flour per 3 eggs. Flour for 9 eggs?",
      choices: ["4 cups", "5 cups", "6 cups", "9 cups"],
      answerIndex: 2,
      skill: "ratio-reasoning",
    },
    {
      prompt: "20% of 50 is…",
      choices: ["5", "10", "15", "20"],
      answerIndex: 1,
      skill: "percent",
    },
  ],
  "6.NS.C.7": [
    {
      prompt: "Which is greater: -3 or -7?",
      choices: ["-3", "-7", "they're equal", "can't tell"],
      answerIndex: 0,
      skill: "order-integers",
    },
    {
      prompt: "|-8| equals…",
      choices: ["-8", "8", "0", "16"],
      answerIndex: 1,
      skill: "absolute-value",
    },
    {
      prompt: "On a number line, which is farthest from 0?",
      choices: ["-9", "4", "7", "-2"],
      answerIndex: 0,
      skill: "absolute-value",
    },
  ],
  "6.G.A.1": [
    {
      prompt: "Area of a triangle with base 10 and height 6?",
      choices: ["16", "30", "60", "120"],
      answerIndex: 1,
      skill: "triangle-area",
    },
    {
      prompt: "Area of a parallelogram, base 8, height 5?",
      choices: ["13", "26", "40", "80"],
      answerIndex: 2,
      skill: "parallelogram-area",
    },
    {
      prompt: "A rectangle is 7 by 4. Its area?",
      choices: ["11", "22", "28", "14"],
      answerIndex: 2,
      skill: "rectangle-area",
    },
  ],
  "6.EE.B.7": [
    {
      prompt: "Solve: x + 5 = 12",
      choices: ["x = 5", "x = 7", "x = 17", "x = 60"],
      answerIndex: 1,
      skill: "one-step-equations",
    },
    {
      prompt: "Solve: 4x = 20",
      choices: ["x = 4", "x = 5", "x = 16", "x = 80"],
      answerIndex: 1,
      skill: "one-step-equations",
    },
    {
      prompt: "Solve: x - 3 = 10",
      choices: ["x = 7", "x = 13", "x = 30", "x = 3"],
      answerIndex: 1,
      skill: "one-step-equations",
    },
  ],
};

const STANDARDS = Object.keys(BANK);

// Build a question set for a standard (falls back to the first standard if unknown).
export function questionsFor(standard, limitMs) {
  const list = BANK[standard] || BANK[STANDARDS[0]];
  return list.map((q) => ({ ...q, limitMs: limitMs || 20000 }));
}

export function availableStandards() {
  return STANDARDS.slice();
}

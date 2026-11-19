// Expression Factory — Word Crates (Lesson 6-5, after the "Words to Math
// Symbols" practice sheet, Version B). No DOM.
//
// Every crate on the belt is one item. A words crate asks for the expression a
// phrase names; an evaluate crate asks the student to substitute, then (for
// two-step expressions) multiply first, then solve. Each step is one pick from
// a few cards; a wrong card names the slip it shows when there is a site tag
// for it. No grouped (distributive) forms anywhere in this level.

const words = (en, es, answer, wrong, slips) => ({
  mechanic: "words-to-symbols",
  phrase: { en, es },
  steps: [{ ask: "pickExpr", choices: mix(answer, wrong), answer, slips }],
});

// One-step evaluate: substitute, then solve.
const eval1 = (show, when, sub, subWrong, value, valueWrong, slips) => ({
  mechanic: "evaluate-expression",
  show,
  when,
  steps: [
    { ask: "askSub", choices: mix(sub, subWrong), answer: sub, slips },
    { ask: "askSolve", choices: mix(String(value), valueWrong.map(String)), answer: String(value) },
  ],
});

// Two-step evaluate: substitute, multiply first, then add or subtract.
const eval2 = (show, when, sub, subWrong, mult, multWrong, value, valueWrong, slips) => ({
  mechanic: "evaluate-expression",
  show,
  when,
  steps: [
    { ask: "askSub", choices: mix(sub, subWrong), answer: sub },
    { ask: "askMult", choices: mix(mult, multWrong), answer: mult, slips },
    { ask: "askSolve", choices: mix(String(value), valueWrong.map(String)), answer: String(value) },
  ],
});

// Cards in a fixed, varied order so the right one is not always first.
let turn = 0;
function mix(answer, wrong) {
  const out = wrong.slice();
  out.splice(turn++ % (wrong.length + 1), 0, answer);
  return out;
}

const REV_SUB = "op-reversed-subtraction";
const REV_DIV = "op-reversed-division";
const ORDER = "order-of-operations-left-to-right";

export const WORD_ROOMS = [
  // Part A: + and −
  [
    words("3 more than y", "3 más que y", "y + 3", ["3y", "y − 3"]),
    words("The sum of m and 5", "La suma de m y 5", "m + 5", ["5m", "m − 5"]),
    words("p increased by 6", "p aumentado en 6", "p + 6", ["p − 6", "6p"]),
    words("Take away 5 from c", "Quita 5 de c", "c − 5", ["5 − c", "c + 5"], { "5 − c": REV_SUB }),
    words("w fewer than 7", "w menos que 7", "7 − w", ["w − 7", "7 + w"], { "w − 7": REV_SUB }),
    words("A number plus 9", "Un número más 9", "n + 9", ["9n", "n − 9"]),
    words("A number decreased by 6", "Un número disminuido en 6", "n − 6", ["6 − n", "n + 6"], {
      "6 − n": REV_SUB,
    }),
    words(
      "The difference between z and 12",
      "La diferencia entre z y 12",
      "z − 12",
      ["12 − z", "z + 12"],
      {
        "12 − z": REV_SUB,
      },
    ),
  ],
  // Part A: × and ÷
  [
    words("The product of 6 and k", "El producto de 6 y k", "6k", ["k + 6", "k ÷ 6"]),
    words("Triple b", "El triple de b", "3b", ["b + 3", "b ÷ 3"]),
    words("Double a number", "El doble de un número", "2n", ["n + 2", "n ÷ 2"]),
    words("t divided by 9", "t dividido entre 9", "t ÷ 9", ["9 ÷ t", "9t"], { "9 ÷ t": REV_DIV }),
    words("d split into 4 equal groups", "d repartido en 4 grupos iguales", "d ÷ 4", [
      "4d",
      "d − 4",
    ]),
    words("Half of j", "La mitad de j", "j ÷ 2", ["2j", "j − 2"]),
    words("5 times r", "5 veces r", "5r", ["r + 5", "r ÷ 5"]),
  ],
  // Part 2, steps 1-2: substitute and solve
  [
    eval1("n + 6", "n = 4", "4 + 6", ["6 + 6", "n + 4"], 10, [46, 24]),
    eval1("9 − w", "w = 5", "9 − 5", ["5 − 9", "9 + 5"], 4, [14, 95], { "5 − 9": REV_SUB }),
    eval1("3k", "k = 7", "3 × 7", ["37", "3 + 7"], 21, [10, 37]),
    eval1("t ÷ 4", "t = 20", "20 ÷ 4", ["4 ÷ 20", "20 × 4"], 5, [80, 16], { "4 ÷ 20": REV_DIV }),
    eval1("x + 8", "x = 3", "3 + 8", ["3 × 8", "x + 3"], 11, [24, 38]),
    eval1("y − 5", "y = 12", "12 − 5", ["5 − 12", "12 + 5"], 7, [17, 8], { "5 − 12": REV_SUB }),
    eval1("6p", "p = 4", "6 × 4", ["64", "6 + 4"], 24, [10, 64]),
    eval1("d ÷ 3", "d = 15", "15 ÷ 3", ["15 × 3", "3 ÷ 15"], 5, [45, 12], { "3 ÷ 15": REV_DIV }),
  ],
  // Part 2, steps 3-4: two steps, multiply first; then the challenge
  [
    eval2(
      "3n + 2",
      "n = 4",
      "3 × 4 + 2",
      ["34 + 2", "3 + 4 + 2"],
      "12 + 2",
      ["3 × 6"],
      14,
      [18, 36],
      {
        "3 × 6": ORDER,
      },
    ),
    eval2("5m − 6", "m = 3", "5 × 3 − 6", ["53 − 6", "5 + 3 − 6"], "15 − 6", ["8 − 6"], 9, [2, 21]),
    eval2(
      "2x + 9",
      "x = 6",
      "2 × 6 + 9",
      ["26 + 9", "2 + 6 + 9"],
      "12 + 9",
      ["2 × 15"],
      21,
      [30, 35],
      {
        "2 × 15": ORDER,
      },
    ),
    eval2(
      "3x + 4",
      "x = 5",
      "3 × 5 + 4",
      ["35 + 4", "3 + 5 + 4"],
      "15 + 4",
      ["3 × 9"],
      19,
      [27, 39],
      {
        "3 × 9": ORDER,
      },
    ),
    eval2(
      "6n − 8",
      "n = 4",
      "6 × 4 − 8",
      ["64 − 8", "6 + 4 − 8"],
      "24 − 8",
      ["10 − 8"],
      16,
      [2, 56],
    ),
    eval2(
      "3a + 2b",
      "a = 4, b = 5",
      "3 × 4 + 2 × 5",
      ["34 + 25", "3 + 4 + 2 + 5"],
      "12 + 10",
      ["7 + 7"],
      22,
      [14, 59],
    ),
  ],
  // Mixed Shift: everything together, new numbers
  [
    words("8 less than q", "8 menos que q", "q − 8", ["8 − q", "q + 8"], { "8 − q": REV_SUB }),
    eval1("v + 9", "v = 6", "6 + 9", ["69", "v + 6"], 15, [69, 3]),
    words("The quotient of h and 3", "El cociente de h y 3", "h ÷ 3", ["3 ÷ h", "3h"], { "3 ÷ h": REV_DIV }),
    eval1("8r", "r = 5", "8 × 5", ["85", "8 + 5"], 40, [13, 85]),
    words("Twice g", "Dos veces g", "2g", ["g + 2", "g ÷ 2"]),
    eval1("a ÷ 6", "a = 42", "42 ÷ 6", ["6 ÷ 42", "42 × 6"], 7, [36, 252], { "6 ÷ 42": REV_DIV }),
    words("The total of s and 11", "El total de s y 11", "s + 11", ["11s", "s − 11"]),
    eval1("15 − c", "c = 9", "15 − 9", ["9 − 15", "15 + 9"], 6, [24, 159], { "9 − 15": REV_SUB }),
    eval2("4k + 1", "k = 6", "4 × 6 + 1", ["46 + 1", "4 + 6 + 1"], "24 + 1", ["4 × 7"], 25, [28, 47], {
      "4 × 7": ORDER,
    }),
    eval2("7p − 10", "p = 3", "7 × 3 − 10", ["73 − 10", "7 + 3 − 10"], "21 − 10", ["10 − 10"], 11, [0, 63]),
  ],
];

/** The prompt a crate carries, in the student's language. */
export function quizPrompt(item, lang, when) {
  return item.phrase ? item.phrase[lang] || item.phrase.en : `${item.show}, ${when} ${item.when}`;
}

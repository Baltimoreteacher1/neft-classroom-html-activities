// MathSense missions for Grades 7-8. Same schema as missions.js: kind set | between | type | choose; slips name a known
// mistake by its exact value; hints climb from "notice" to "try this" and never state the answer.

export const MISSIONS_78 = [
  {
    id: "g78-repeating-seven-elevenths",
    band: "7-8",
    topic: "repeating",
    skill: "7:fraction-ops",
    kind: "type",
    prompt: "Write 7/11 as a decimal. Show which digits repeat, like 0.1(6) does.",
    setup: {
      a: "1/11",
      parts: 11
    },
    target: {
      value: "7/11",
      form: "decimal"
    },
    slips: [
      {
        when: {
          value: "63/100"
        },
        say: "0.63 stops after two digits, so it is exactly 63/100. The block of digits has to keep repeating."
      }
    ],
    hints: [
      "Use long division on 7 divided by 11 and watch the remainders.",
      "When a remainder comes back, the same digits come back too.",
      "Write the digits that repeat inside ( ) after the decimal point. How many digits are in the block?"
    ],
    done: "7/11 = 0.(63). The block 63 repeats forever."
  },
  {
    id: "g78-repeating-to-fraction",
    band: "7-8",
    topic: "repeating",
    skill: "7:fraction-ops",
    kind: "type",
    prompt: "Write 0.(45) as a fraction in lowest terms. The 45 repeats forever.",
    setup: {
      a: "9/20",
      parts: 20
    },
    target: {
      value: "5/11",
      form: "fraction",
      lowest: true
    },
    slips: [
      {
        when: {
          value: "9/20"
        },
        say: "0.45 stops after two digits, but 0.(45) keeps going, so it is a little more than 0.45."
      }
    ],
    hints: [
      "Let x = 0.(45). What happens to the digits when you multiply x by 100?",
      "Subtract x from 100x so the repeating part cancels.",
      "You get a whole number equal to a multiple of x. Write x as a fraction and simplify. Then type it into the workspace: its decimal should repeat the same block."
    ],
    done: "0.(45) = 45/99 = 5/11. 100x − x = 45, so 99x = 45."
  },
  {
    id: "g78-percent-multiplier",
    band: "7-8",
    topic: "percent-over-100",
    skill: "7:percent-change",
    kind: "type",
    prompt: "A quantity is 240% of the original. Write 240% as a decimal.",
    setup: {
      a: "1/2",
      parts: 100
    },
    target: {
      value: "12/5",
      form: "decimal"
    },
    slips: [
      {
        when: {
          value: "6/25"
        },
        say: "0.24 is 24%. 240% is more than 100%, so the decimal must be greater than 1."
      }
    ],
    hints: [
      "Percent means per 100. Which way does the decimal point move when you divide by 100?",
      "More than 100% means more than one whole. Predict whether the decimal is above or below 1.",
      "Shade the decimal grid until its shading matches the percent bar. How many grids are full?"
    ],
    done: "240% = 240/100 = 2.4."
  },
  {
    id: "g78-percent-thirteen-eighths",
    band: "7-8",
    topic: "conversion",
    skill: "7:percent-change",
    kind: "type",
    prompt: "Write 13/8 as an exact percent.",
    setup: {
      a: "1/8",
      parts: 8
    },
    target: {
      value: "13/8",
      form: "percent"
    },
    slips: [
      {
        when: {
          value: "13/80"
        },
        say: "That moved the decimal point the wrong way. 13/8 is more than one whole, so its percent is over 100%."
      },
      {
        when: {
          value: "69/50"
        },
        say: "138% puts the 13 and the 8 side by side. Divide 13 by 8 instead."
      },
      {
        when: {
          value: "163/100"
        },
        say: "163% is rounded. The task asks for the exact percent, so keep every digit."
      }
    ],
    hints: [
      "13/8 is more than one whole. Is its percent more or less than 100%?",
      "Divide 13 by 8 exactly, with long division, until the remainder is 0.",
      "A percent is the decimal times 100, so move the decimal point two places to the right."
    ],
    done: "13/8 = 1.625 = 162.5%."
  },
  {
    id: "g78-order-four-forms",
    band: "7-8",
    topic: "ordering",
    skill: "7:fraction-ops",
    kind: "choose",
    prompt: "Which list is in order from least to greatest? The amounts are 5/8, 0.6, 61% and 0.(6).",
    setup: {
      a: "5/8",
      b: "3/5"
    },
    options: [
      {
        text: "0.6, 5/8, 61%, 0.(6)",
        say: "61% and 5/8 are out of order. Write both as decimals with three places and compare place by place."
      },
      {
        text: "61%, 0.6, 5/8, 0.(6)",
        say: "0.6 and 61% are out of order. Write both with the same number of decimal places."
      },
      {
        text: "0.6, 61%, 5/8, 0.(6)"
      },
      {
        text: "0.6, 61%, 0.(6), 5/8",
        say: "The repeating decimal does not stop. Write several of its digits and compare it with 5/8 digit by digit."
      }
    ],
    answer: 2,
    hints: [
      "Write every value as a decimal first.",
      "For 5/8 divide, for 61% divide by 100, and for the repeating decimal write several repeating digits.",
      "Line the decimals up with the same number of places, then check two at a time in compare mode."
    ],
    done: "0.6 = 0.600, 61% = 0.610, 5/8 = 0.625, 0.(6) = 0.666... so the order is 0.6, 61%, 5/8, 0.(6)."
  },
  {
    id: "g78-locate-twenty-two-sevenths",
    band: "7-8",
    topic: "improper",
    skill: "7:fraction-ops",
    kind: "choose",
    prompt: "Between which two whole numbers is 22/7?",
    setup: {
      a: "1/7",
      parts: 7
    },
    options: [
      {
        text: "2 and 3",
        say: "Check how many sevenths three wholes need. Is 22 sevenths more than that?"
      },
      {
        text: "3 and 4"
      },
      {
        text: "4 and 5",
        say: "Check how many sevenths four wholes need. Is 22 sevenths that many?"
      },
      {
        text: "7 and 8",
        say: "That looks at the denominator, not at the amount. The amount is the whole fraction 22/7."
      }
    ],
    answer: 1,
    hints: [
      "How many sevenths make one whole? Two wholes? Three wholes?",
      "Count by sevenths until you pass 22.",
      "Type 22/7 into the fraction box and read where the marker lands on the number line."
    ],
    done: "22/7 = 3 1/7, which is a little more than 3."
  },
  {
    id: "g78-eighths-three-hundred-seventy-five",
    band: "7-8",
    topic: "equivalence",
    skill: "7:fraction-ops",
    kind: "set",
    prompt: "Show 0.375 on the bar using 8 equal pieces.",
    setup: {
      a: "1/10",
      parts: 10
    },
    target: {
      value: "3/8",
      parts: 8
    },
    slips: [
      {
        when: {
          value: "3/10"
        },
        say: "0.3 is 3/10. 0.375 has three decimal places, so it is not just three tenths."
      },
      {
        when: {
          value: "1/3"
        },
        say: "1/3 is 0.(3). It is close to 0.375 but not equal to it."
      }
    ],
    hints: [
      "0.375 is 375 thousandths. Can that fraction be simplified?",
      "Find a number that divides both 375 and 1000, then keep dividing until you cannot.",
      "Set the cut to the denominator you found, then check that the marker matches 0.375 on the decimal grid."
    ],
    done: "0.375 = 375/1000 = 3/8. Dividing both numbers by 125 gives eighths."
  },
  {
    id: "g78-honest-third",
    band: "7-8",
    topic: "repeating",
    skill: "7:fraction-ops",
    kind: "choose",
    prompt: "Marco says 0.333 = 1/3. Is Marco right?",
    setup: {
      a: "1/3",
      parts: 3
    },
    options: [
      {
        text: "Yes. 0.333 is exactly 1/3.",
        say: "0.333 is exactly 333/1000, which is a little less than 1/3. The decimal stopped too soon."
      },
      {
        text: "No. 1/3 cannot be written as a decimal.",
        say: "1/3 can be written exactly as a decimal. The digits just never stop, so we show the repeating block."
      },
      {
        text: "No. 0.333 is close, but it stops. 1/3 needs the 3s to repeat forever."
      },
      {
        text: "Yes. Rounding makes a decimal exact.",
        say: "Rounding gives an estimate and changes the value. An exact decimal for 1/3 needs every digit."
      }
    ],
    answer: 2,
    hints: [
      "Type 0.333 into the decimal box and read the fraction it equals.",
      "Compare that fraction with 1/3 by cross-multiplying.",
      "Divide 1 by 3. Does the decimal stop, or do the digits repeat?"
    ],
    done: "0.333 = 333/1000, a little less than 1/3. 1/3 = 0.(3), and the 3 never stops."
  },
  {
    id: "g78-between-thirds",
    band: "7-8",
    topic: "ordering",
    skill: "7:fraction-ops",
    kind: "between",
    prompt: "Find an amount between 0.(3) and 0.34. Make quantity A that amount, then check it.",
    setup: {
      a: "1/3",
      b: "17/50"
    },
    target: {
      lo: "1/3",
      hi: "17/50"
    },
    slips: [],
    hints: [
      "Line up 0.(3) and 0.34 and compare them digit by digit.",
      "Find the first digit where they are different. An amount between them can use that spot.",
      "Try three decimal places: which three-digit decimal sits between the two?"
    ],
    done: "Any amount strictly between them works, for example 0.335. There is always another number between two different numbers."
  }
];

// MathSense missions for Grade 6. Same schema as missions.js: kind set | between | type | choose; slips name a known
// mistake by its exact value; hints climb from "notice" to "try this" and never state the answer.

export const MISSIONS_6 = [
  {
    id: "g6-mixed-seventeen-fifths",
    band: "6",
    topic: "improper",
    skill: "6:order-rational",
    kind: "type",
    prompt: "Write 17/5 as a mixed number, like 2 1/3.",
    setup: {
      a: "1/5",
      parts: 5
    },
    target: {
      value: "17/5",
      form: "mixed",
      lowest: true
    },
    slips: [
      {
        when: {
          value: "18/5"
        },
        say: "That is one fifth more than the amount. After you take out the whole bars, count carefully what is left over."
      },
      {
        when: {
          value: "12/5"
        },
        say: "You took out only 2 wholes, but there are more whole bars to fill."
      }
    ],
    hints: [
      "How many fifths make one whole? Use the fraction bar with fifths.",
      "Fill whole bars with 5 fifths each. How many bars can you fill, and how many fifths are left?",
      "Move the marker to the amount and read which two whole numbers it sits between."
    ],
    done: "17/5 = 3 2/5: three whole bars use 15 fifths, and 2 fifths are left."
  },
  {
    id: "g6-percent-over-hundred",
    band: "6",
    topic: "percent-over-100",
    skill: "6:percent",
    kind: "set",
    prompt: "Make the percent bar show 175%. Then look at the fraction bar and the number line.",
    setup: {
      a: "1/2",
      parts: 2
    },
    target: {
      value: "7/4"
    },
    slips: [
      {
        when: {
          value: "3/4"
        },
        say: "That is 75%. The shading stopped inside one whole. 175% is more than 100%."
      },
      {
        when: {
          value: "7/400"
        },
        say: "1.75% is less than one hundredth of a whole. 175% is 175 per hundred."
      },
      {
        when: {
          value: "7/40"
        },
        say: "17.5% is ten times too small. Check how many hundredths you need."
      }
    ],
    hints: [
      "100% is one whole bar. What does a percent over 100% say about the amount compared with the whole?",
      "Count 100% for the first whole, then decide how much more is needed.",
      "Type the percent in the percent box, or use the arrow keys on the percent bar (Shift moves 10% at a time)."
    ],
    done: "175% = 1.75 = 1 3/4. The bar goes past the 100% mark by 75%."
  },
  {
    id: "g6-percent-nine-fourths",
    band: "6",
    topic: "percent-over-100",
    skill: "6:percent",
    kind: "type",
    prompt: "Write 9/4 as a percent.",
    setup: {
      a: "1/4",
      parts: 4
    },
    target: {
      value: "9/4",
      form: "percent"
    },
    slips: [
      {
        when: {
          value: "9/40"
        },
        say: "22.5% moved the decimal point the wrong way. Percent means per hundred, so the decimal point moves two places to the right."
      },
      {
        when: {
          value: "47/50"
        },
        say: "94% puts the 9 and the 4 side by side. 9/4 is more than two wholes."
      }
    ],
    hints: [
      "9/4 is greater than 1. Will its percent be more or less than 100%?",
      "Divide 9 by 4 to find how many wholes it is, then think about per 100.",
      "Check with the percent bar: where does the shading end compared with the 200% mark?"
    ],
    done: "9/4 = 2.25 = 225%."
  },
  {
    id: "g6-repeating-two-thirds",
    band: "6",
    topic: "repeating",
    skill: "6:order-rational",
    kind: "type",
    prompt: "Write 2/3 as a decimal that is exactly equal to 2/3. Put the repeating digits in brackets, like 0.(7).",
    setup: {
      a: "1/3",
      parts: 3
    },
    target: {
      value: "2/3",
      form: "decimal"
    },
    slips: [],
    hints: [
      "Divide 2 by 3 with long division. What do you notice about the remainders?",
      "When a remainder comes back, the same digits repeat forever. Name the block that repeats.",
      "Write the digits that repeat inside ( ) after the decimal point."
    ],
    done: "2/3 = 0.(6). The 6 repeats forever, so 0.67 is only about 2/3."
  },
  {
    id: "g6-repeating-five-sixths",
    band: "6",
    topic: "repeating",
    skill: "6:order-rational",
    kind: "choose",
    prompt: "Which decimal is exactly equal to 5/6?",
    setup: {
      a: "5/6",
      parts: 6
    },
    options: [
      {
        text: "0.83",
        say: "0.83 stops after two digits, so it is exactly 83/100, a little less than 5/6."
      },
      {
        text: "0.8333",
        say: "0.8333 stops after four digits, so it is exactly 8333/10000. The 3 must keep going forever."
      },
      {
        text: "0.84",
        say: "0.84 is rounded up, so it is a little more than 5/6, not equal to it."
      },
      {
        text: "0.8(3)"
      }
    ],
    answer: 3,
    hints: [
      "Use long division on 5 divided by 6 and keep going until a remainder repeats.",
      "Only the digits after the remainder repeats are in the repeating block.",
      "A decimal that stops can only equal a fraction whose denominator has no prime factors except 2 and 5. Is 6 like that?"
    ],
    done: "5/6 = 0.8(3). The digit 3 repeats forever, so only 0.8(3) is exactly 5/6."
  },
  {
    id: "g6-order-mixed-forms",
    band: "6",
    topic: "ordering",
    skill: "6:order-rational",
    kind: "choose",
    prompt: "Which of these is the greatest: 0.7, 2/3, 71% or 3/4?",
    setup: {
      a: "7/10",
      b: "2/3"
    },
    options: [
      {
        text: "0.7",
        say: "0.7 looks small, but 0.7 = 0.70. Write all four with the same number of decimal places before you compare."
      },
      {
        text: "2/3",
        say: "2/3 repeats as a decimal. Write it with three digits and compare it with the others."
      },
      {
        text: "71%",
        say: "71% and 0.7 are close to each other, but not to every choice. Change all four into the same form first."
      },
      {
        text: "3/4"
      }
    ],
    answer: 3,
    hints: [
      "Pick one form and change every choice into it.",
      "Decimals with two places line up well. Write each choice as hundredths.",
      "Use compare mode and the number line: put two choices at a time and keep the one farther to the right."
    ],
    done: "3/4 is the greatest. As decimals: 0.7, 0.(6), 0.71 and 0.75."
  },
  {
    id: "g6-hundredths-four-tenths",
    band: "6",
    topic: "equivalence",
    skill: "6:order-rational",
    kind: "set",
    prompt: "Show 0.4 on the bar using 100 equal pieces.",
    setup: {
      a: "1/10",
      parts: 10
    },
    target: {
      value: "2/5",
      parts: 100
    },
    slips: [
      {
        when: {
          value: "1/25"
        },
        say: "4 of 100 pieces is 0.04, ten times too small. The 4 in 0.4 is in the tenths place."
      }
    ],
    hints: [
      "0.4 has a 4 in the tenths place. How many hundredths make one tenth?",
      "If one tenth is that many hundredths, four tenths is four times as many.",
      "Check the decimal grid: each whole column is one tenth."
    ],
    done: "0.4 = 40/100. One tenth is 10 hundredths, so four tenths is 40 hundredths."
  },
  {
    id: "g6-benchmark-seven-twelfths",
    band: "6",
    topic: "benchmark",
    skill: "6:order-rational",
    kind: "choose",
    prompt: "Is 7/12 more than 1/2, less than 1/2, or equal to 1/2?",
    setup: {
      a: "1/2",
      parts: 12
    },
    options: [
      {
        text: "Less than 1/2",
        say: "A bigger denominator does not make a smaller fraction. Compare the numerator with half of the denominator."
      },
      {
        text: "More than 1/2"
      },
      {
        text: "Equal to 1/2",
        say: "To equal 1/2, the shaded pieces must be exactly half of the pieces in the whole. Work out how many pieces half of 12 would be and compare."
      }
    ],
    answer: 1,
    hints: [
      "Think of the benchmark 1/2 as half of the pieces in the whole.",
      "How many twelfths are in one half?",
      "Set the bar to the benchmark first, then to the amount, and watch the marker on the number line."
    ],
    done: "7/12 is more than 1/2: half of 12 is 6 twelfths, and 7 is one twelfth more."
  },
  {
    id: "g6-fraction-forty-five-percent",
    band: "6",
    topic: "conversion",
    skill: "6:percent",
    kind: "type",
    prompt: "Write 45% as a fraction in lowest terms.",
    setup: {
      a: "1/2",
      parts: 100
    },
    target: {
      value: "9/20",
      form: "fraction",
      lowest: true
    },
    slips: [
      {
        when: {
          value: "9/2"
        },
        say: "45/10 is 4.5. 45% means 45 per hundred, not per ten."
      }
    ],
    hints: [
      "Percent means per 100. Write 45% as a fraction with 100 on the bottom.",
      "Look for a number that divides both the top and the bottom.",
      "Use the cut chooser to find the smallest cut where the shading still ends exactly on a line."
    ],
    done: "45% = 45/100 = 9/20."
  }
];

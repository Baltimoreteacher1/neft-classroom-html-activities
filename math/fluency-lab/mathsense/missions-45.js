// MathSense missions for Grades 4-5. Same schema as missions.js: kind set | between | type | choose; slips name a known
// mistake by its exact value; hints climb from "notice" to "try this" and never state the answer.

export const MISSIONS_45 = [
  {
    id: "g45-equiv-sixths",
    band: "4-5",
    topic: "equivalence",
    skill: "4:fraction-equiv",
    kind: "set",
    prompt: "The bar shows 1/2. Cut it into 6 equal pieces without changing how much is shaded.",
    setup: {
      a: "1/2",
      parts: 2
    },
    target: {
      value: "1/2",
      parts: 6
    },
    slips: [
      {
        when: {
          value: "1/6"
        },
        say: "You changed the number of pieces but kept 1 shaded. When the pieces get smaller, more of them are needed to shade the same amount."
      },
      {
        when: {
          value: "1/3"
        },
        say: "That shading is less than before. The marker on the number line should stay where it was."
      }
    ],
    hints: [
      "Look at where the shading ends now. Which mark on the number line is that, and does it have to move?",
      "Changing the cut changes the size of each piece, not how much is shaded.",
      "Cut the bar into the new size first, then add or remove shaded pieces until the shading ends at the same spot as before."
    ],
    done: "1/2 = 3/6. Six smaller pieces, three of them shaded, reach the same spot as one of two bigger pieces."
  },
  {
    id: "g45-equiv-twelfths",
    band: "4-5",
    topic: "equivalence",
    skill: "4:fraction-equiv",
    kind: "set",
    prompt: "Show 3/4 using 12 equal pieces. The marker on the number line should stay at the same spot.",
    setup: {
      a: "3/4",
      parts: 4
    },
    target: {
      value: "3/4",
      parts: 12
    },
    slips: [
      {
        when: {
          value: "3/12"
        },
        say: "You changed the bottom number but not the top. The top number counts shaded pieces, so it has to change too."
      },
      {
        when: {
          value: "11/12"
        },
        say: "It looks like you added the same amount to the top and the bottom. Adding to both changes the fraction. Multiplying both by the same number keeps it equal."
      }
    ],
    hints: [
      "How many times as many pieces does the whole bar have now, compared with before?",
      "If every old piece is cut into the same number of smaller pieces, the shaded part is cut up the same way.",
      "Whatever you multiply the pieces in the whole by, multiply the shaded pieces by too. Then check that the marker stayed put."
    ],
    done: "3/4 = 9/12. Each fourth became 3 twelfths, so 3 fourths became 9 twelfths."
  },
  {
    id: "g45-benchmark-half",
    band: "4-5",
    topic: "benchmark",
    skill: "4:fraction-compare",
    kind: "choose",
    prompt: "Which fraction is closest to 1/2? Use the workspace to look at each one.",
    setup: {
      a: "1/2",
      parts: 2
    },
    options: [
      {
        text: "1/8",
        say: "1/8 is close to 0. Half of 8 is 4, and 1 is far from 4."
      },
      {
        text: "4/5",
        say: "4/5 has a big numerator, but compare it with half of the denominator. It sits close to 1, not close to 1/2."
      },
      {
        text: "5/9"
      },
      {
        text: "9/10",
        say: "9/10 is close to 1. Half of 10 is 5, and 9 is far from 5."
      }
    ],
    answer: 2,
    hints: [
      "A benchmark helps: find half of each denominator and compare it with the numerator.",
      "A fraction is close to 1/2 when its numerator is close to half of its denominator.",
      "Type each fraction and see how near its marker is to the 1/2 mark on the number line."
    ],
    done: "5/9 is the closest: half of 9 is 4 and a half, and 5 is only a half piece away."
  },
  {
    id: "g45-improper-seven-fourths",
    band: "4-5",
    topic: "improper",
    skill: "4:mixed-numbers",
    kind: "set",
    prompt: "Show 7/4 on the bar. Use 4 pieces in each whole.",
    setup: {
      a: "1/4",
      parts: 4
    },
    target: {
      value: "7/4",
      parts: 4
    },
    slips: [
      {
        when: {
          value: "4/7"
        },
        say: "That is 4 sevenths. The 7 counts pieces and the 4 tells how many make one whole, so the numbers are swapped."
      },
      {
        when: {
          value: "3/4"
        },
        say: "3/4 is less than one whole. The amount you need is more than a whole bar, so keep going into the next bar."
      }
    ],
    hints: [
      "In fourths, how many pieces make one whole bar? What happens when you have more pieces than that?",
      "The numerator can be bigger than the denominator. Fill the first bar, then keep going.",
      "Count in fourths from 0 on the number line. Every mark after the fourth one is past 1."
    ],
    done: "7/4 = 1 3/4: one whole bar of 4 fourths and 3 more fourths."
  },
  {
    id: "g45-between-half-three-quarters",
    band: "4-5",
    topic: "ordering",
    skill: "4:fraction-compare",
    kind: "between",
    prompt: "Find a fraction between 1/2 and 3/4. Make quantity A that amount, then check it.",
    setup: {
      a: "1/2",
      b: "3/4"
    },
    target: {
      lo: "1/2",
      hi: "3/4"
    },
    slips: [],
    hints: [
      "Change both fractions to the same size of piece so you can compare them.",
      "Cutting both into more pieces leaves room between them.",
      "Choose a cut where at least one whole piece is strictly between the two markers."
    ],
    done: "Any amount strictly between the two markers works, for example 5/8. There is always room between two different fractions."
  },
  {
    id: "g45-decimal-five-eighths",
    band: "4-5",
    topic: "conversion",
    skill: "5:decimal-place",
    kind: "type",
    prompt: "Write 5/8 as a decimal.",
    setup: {
      a: "1/8",
      parts: 8
    },
    target: {
      value: "5/8",
      form: "decimal"
    },
    slips: [
      {
        when: {
          value: "29/50"
        },
        say: "0.58 puts the 5 and the 8 side by side. A fraction means the top divided by the bottom, not two digits after a decimal point."
      },
      {
        when: {
          value: "8/5"
        },
        say: "1.6 is 8 divided by 5. The fraction 5/8 means 5 divided by 8: the top is divided by the bottom."
      },
      {
        when: {
          value: "3/5"
        },
        say: "0.6 is close, but it is rounded. Keep dividing until the remainder is 0."
      }
    ],
    hints: [
      "A fraction is a division: the top number divided by the bottom number.",
      "Think of the amount as thousandths. What do you multiply 8 by to get 1000?",
      "Check your decimal on the decimal grid. Does it match the marker for 5/8 on the number line?"
    ],
    done: "5/8 = 5 ÷ 8 = 0.625."
  },
  {
    id: "g45-fraction-thirty-five-hundredths",
    band: "4-5",
    topic: "conversion",
    skill: "5:decimal-place",
    kind: "type",
    prompt: "Write 0.35 as a fraction in lowest terms.",
    setup: {
      a: "7/10",
      parts: 10
    },
    target: {
      value: "7/20",
      form: "fraction",
      lowest: true
    },
    slips: [
      {
        when: {
          value: "7/2"
        },
        say: "That is 3.5, ten times too big. 0.35 has two decimal places, so use hundredths, not tenths."
      },
      {
        when: {
          value: "7/200"
        },
        say: "That is 0.035. Count the digits after the decimal point to name the place value."
      }
    ],
    hints: [
      "Look at the last digit. What is the name of its place? That is the denominator.",
      "Write the digits over that place value, then look for a number that divides both the top and the bottom.",
      "Use the cut chooser on the fraction bar to find the smallest cut where the shading still ends exactly on a line."
    ],
    done: "0.35 = 35/100 = 7/20. Dividing the top and bottom by 5 gives the same amount in bigger pieces."
  },
  {
    id: "g45-percent-three-fifths",
    band: "4-5",
    topic: "conversion",
    skill: "5:decimal-place",
    kind: "type",
    prompt: "Write 3/5 as a percent.",
    setup: {
      a: "1/5",
      parts: 5
    },
    target: {
      value: "3/5",
      form: "percent"
    },
    slips: [
      {
        when: {
          value: "7/20"
        },
        say: "35% comes from writing the 3 and the 5 side by side. A percent means out of 100, so change the denominator to 100 first."
      },
      {
        when: {
          value: "3/500"
        },
        say: "0.6% is a very small percent, less than one hundredth of a whole. The percent sign already means per hundred, so a percent is the decimal times 100."
      }
    ],
    hints: [
      "Percent means out of 100. What do you multiply the denominator by to get 100?",
      "Whatever you multiply the bottom by, multiply the top by too.",
      "Check on the percent bar: the shading should end where the marker on the number line is."
    ],
    done: "3/5 = 60/100 = 60%."
  },
  {
    id: "g45-order-three",
    band: "4-5",
    topic: "ordering",
    skill: "4:fraction-compare",
    kind: "choose",
    prompt: "Which list puts 2/3, 3/4 and 5/8 in order from least to greatest?",
    setup: {
      a: "2/3",
      b: "5/8"
    },
    options: [
      {
        text: "2/3, 3/4, 5/8",
        say: "This puts 5/8 last, as if the biggest numbers make the biggest fraction. Compare how much of a whole each one shades."
      },
      {
        text: "5/8, 2/3, 3/4"
      },
      {
        text: "3/4, 2/3, 5/8",
        say: "This list is in order from greatest to least, the reverse of what was asked."
      },
      {
        text: "5/8, 3/4, 2/3",
        say: "2/3 and 3/4 are swapped. Compare how far each one is from a whole: which has the smaller piece missing?"
      }
    ],
    answer: 1,
    hints: [
      "Pick one way to compare them: same-size pieces, a number line, or decimals.",
      "A fraction is closer to 1 when the piece missing from a whole is smaller.",
      "Use compare mode to put two of them on the number line at a time, then place the third."
    ],
    done: "5/8, 2/3, 3/4. As decimals they are 0.625, 0.(6) and 0.75."
  }
];

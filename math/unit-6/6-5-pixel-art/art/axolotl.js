// Axel the Axolotl — Lesson 6-5 pixel art (WRITE + EVALUATE mode).
// Step 1: choose the expression that matches the words. Step 2: evaluate it.
// The value is the paint can's code. Codes are computed by engine.js.
window.PIXEL_ARTS = window.PIXEL_ARTS || {};

const mc = (ok, ...wrong) => [{ t: ok, ok: true }, ...wrong.map(([t, why]) => ({ t, why }))];

window.PIXEL_ARTS.axolotl = {
  id: "axolotl",
  mode: "write",
  title: "Axel the Axolotl",
  emoji: "🦎",
  tagline: "Write the expression, then evaluate it to unlock each colour.",
  story:
    "Axel the axolotl is hiding in the reef and his colours are locked in paint cans! Each can has a word phrase. Write the matching expression, then evaluate it. The answer is the can's code.",
  next: { href: "/math/unit-6/6-5-pixel-art/boombox/", label: "Boombox Beats" },
  accent: "#ff7eb3",
  bg: "#0f5f8f",
  grid: [
    "................",
    "...A............",
    ".............A..",
    ".A..KKKKKKKK....",
    "HHHKPPPPPPPPKHHH",
    ".HKPPPPPPPPPPKH.",
    "HHKPPPPPPPPPPKHH",
    ".HKPKWPPPPWKPKH.",
    "HHKPKKPPPPKKPKHH",
    ".HKCCPPPPPPCCKH.",
    ".HKPPPMPPMPPPKH.",
    ".HKPPPPMMPPPPKH.",
    "..KKPPPPPPPPKK..",
    ".A.KLLLLLLLLK...",
    "..KPPKLLLLKPPK..",
    "..KKKK....KKKK..",
  ],
  colors: {
    A: {
      name: "Bubble Aqua",
      hex: "#7fdcff",
      tier: 1,
      q: {
        phrase: "5 more than a number n",
        vars: { n: 9 },
        choices: mc(
          "n + 5",
          ["5n", "5n means 5 times n. “More than” signals addition."],
          ["n − 5", "Subtracting makes n smaller. “More than” means add."],
          ["5 − n", "That takes n away from 5. “More than” means add 5 to n."],
        ),
      },
    },
    L: {
      name: "Cream",
      hex: "#fff0d9",
      tier: 1,
      q: {
        phrase: "the product of 4 and a number x",
        vars: { x: 7 },
        choices: mc(
          "4x",
          ["x + 4", "“Product” means multiply, not add."],
          ["x ÷ 4", "“Product” means multiply, not divide."],
          ["4 − x", "“Product” means multiply, not subtract."],
        ),
      },
    },
    W: {
      name: "Sparkle White",
      hex: "#ffffff",
      tier: 1,
      q: {
        phrase: "a number y divided by 3",
        vars: { y: 27 },
        choices: mc(
          "y ÷ 3",
          ["3 ÷ y", "Order matters in division. y is being divided, so y goes first."],
          ["y − 3", "“Divided by” means ÷, not subtraction."],
          ["3y", "3y means 3 times y."],
        ),
      },
    },
    C: {
      name: "Blush Coral",
      hex: "#ff8f8f",
      tier: 2,
      q: {
        phrase: "7 less than a number m",
        vars: { m: 25 },
        choices: mc(
          "m − 7",
          ["7 − m", "“7 less than m” starts at m and takes 7 away. Watch the order!"],
          ["m + 7", "“Less than” means subtract."],
          ["7m", "7m means 7 times m."],
        ),
      },
    },
    P: {
      name: "Axel Pink",
      hex: "#ffb6c9",
      tier: 2,
      q: {
        phrase: "8 more than twice a number n",
        vars: { n: 6 },
        choices: mc(
          "2n + 8",
          ["2(n + 8)", "That doubles the whole sum. Only n is doubled."],
          ["8n + 2", "The 2 and 8 are swapped. Twice n is 2n."],
          ["n + 2 + 8", "“Twice” means multiply by 2, not add 2."],
        ),
      },
    },
    M: {
      name: "Berry Smile",
      hex: "#c2185b",
      tier: 2,
      q: {
        phrase: "6 more than 3 times a number k",
        vars: { k: 7 },
        choices: mc(
          "3k + 6",
          ["3(k + 6)", "Only k is multiplied by 3. The 6 is added afterward."],
          ["6k + 3", "The numbers are swapped. k is multiplied by 3."],
          ["9k", "3k and 6 are different kinds of terms. They can't be combined."],
        ),
      },
    },
    H: {
      name: "Gill Hot Pink",
      hex: "#ff4f8b",
      tier: 3,
      q: {
        phrase: "2 less than the quotient of a number d and 4",
        vars: { d: 40 },
        choices: mc(
          "d ÷ 4 − 2",
          ["2 − d ÷ 4", "The quotient comes first, then 2 is subtracted from it."],
          ["4 ÷ d − 2", "“The quotient of d and 4” is d ÷ 4, with d first."],
          ["(d − 2) ÷ 4", "The 2 is subtracted from the quotient, not from d first."],
        ),
      },
    },
    K: {
      name: "Deep Plum",
      hex: "#4b2142",
      tier: 3,
      q: {
        phrase: "3 times the sum of a number a and 5",
        vars: { a: 5 },
        choices: mc(
          "3(a + 5)",
          [
            "3a + 5",
            "Only a is multiplied. “The sum” needs parentheses so the 5 is multiplied too.",
          ],
          ["3 + (a + 5)", "“Times” means multiply, not add."],
          ["5(a + 3)", "The 3 and 5 are swapped. It is 3 times the sum of a and 5."],
        ),
      },
    },
  },
};

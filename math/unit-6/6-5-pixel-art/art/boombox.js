// Boombox Beats — Lesson 6-5 pixel art (TRANSLATE + USE mode: situation -> expression -> evaluate).
// Each paint can is locked behind a real-world situation. Students write the expression that
// models it, then use it for a given value; that value is the can's code number.
// Codes are computed from the correct choice + `vars` by engine.js (single source of truth).
(() => {
window.PIXEL_ARTS = window.PIXEL_ARTS || {};

const mc = (ok, ...wrong) => [
  { t: ok, ok: true },
  ...wrong.map(([t, why]) => ({ t, why })),
];
window.PIXEL_ARTS.boombox = {
  id: "boombox",
  mode: "write",
  title: "Boombox Beats",
  emoji: "📻",
  tagline: "Translate each situation into an expression, then use it to unlock the paint cans.",
  story:
    "A power cut drained every colour from a hidden picture! Each paint can is locked behind a real-world situation. Write the expression that models it, then use it for the given value. The answer is the can's code. Paint by number to reveal the mystery picture.",
  mystery: { n: 1, title: "Mystery Picture 1" },
  next: { href: "/math/unit-6/6-5-pixel-art/picture-2/", label: "Mystery Picture 2" },
  accent: "#ffc933",
  bg: "#1fa39b",
  grid: [
    "................",
    "....KKKKKKKK....",
    "...K........K...",
    "...K........K...",
    "KKKKKKKKKKKKKKKK",
    "KRRRRRRRRRRRRRRK",
    "KGGGGGKKKKGGGGGK",
    "KGLLLGCCCCGLLLGK",
    "KGLYLGWWWWGLYLGK",
    "KGLLLGPYPYGLLLGK",
    "KGGGGGBBBBGGGGGK",
    "KRRRRRPPPPRRRRRK",
    "KDDDDDDDDDDDDDDK",
    "KKKKKKKKKKKKKKKK",
    "..KK........KK..",
    "................",
  ],
  colors: {
    W: {
      name: "Cloud White", hex: "#ffffff", tier: 1,
      q: {
        situation: "A practice room costs $12 for each hour. Let h be the number of hours.",
        use: "The band books 3 hours. How many dollars is that?",
        vars: {h: 3},
        choices: mc("12h",
          ["h + 12", "Adding 12 would charge a flat $12. The cost grows $12 every hour, so multiply."],
          ["12 ÷ h", "Dividing would make more hours cost less. Each hour adds $12."],
          ["h − 12", "Subtracting would shrink the cost as hours grow."]),
      },
    },
    Y: {
      name: "Gold", hex: "#ffc933", tier: 1,
      q: {
        situation: "A drummer starts with 20 drumsticks and loses p of them at a gig.",
        use: "The drummer loses 6. How many sticks are left?",
        vars: {p: 6},
        choices: mc("20 − p",
          ["p − 20", "That takes 20 away from p. The 20 is the starting amount, so p comes off 20."],
          ["20p", "Multiplying would make more sticks, not fewer."],
          ["20 + p", "Losing sticks means taking away, not adding."]),
      },
    },
    L: {
      name: "Silver", hex: "#d1d5db", tier: 1,
      q: {
        situation: "A track is 9 minutes long. The DJ adds m more minutes of encore.",
        use: "The DJ adds 8 minutes. How long is the whole set?",
        vars: {m: 8},
        choices: mc("m + 9",
          ["9m", "9m means 9 groups of m. The encore is added once."],
          ["m − 9", "The encore makes the set longer, so add."],
          ["9 − m", "That subtracts m from 9. The encore adds time instead."]),
      },
    },
    R: {
      name: "Hot Red", hex: "#e63946", tier: 2,
      q: {
        situation: "Concert tickets cost $3 each. There is also a one-time $5 booking fee. Let n be the number of tickets.",
        use: "A family buys 6 tickets. What is the total cost?",
        vars: {n: 6},
        choices: mc("3n + 5",
          ["3(n + 5)", "That adds the fee to every ticket. The $5 is charged just once."],
          ["5n + 3", "The numbers are swapped. Each ticket is $3 and the fee is $5."],
          ["8n", "3n and 5 are different kinds of terms. They cannot be combined."]),
      },
    },
    G: {
      name: "Steel Grey", hex: "#6b7280", tier: 2,
      q: {
        situation: "Five friends split a pizza bill of k dollars equally. Each friend also adds a $9 delivery share.",
        use: "The bill is $35. How much does each friend pay?",
        vars: {k: 35},
        choices: mc("k ÷ 5 + 9",
          ["5 ÷ k + 9", "The bill k is being split, so k is divided by 5, not the other way around."],
          ["(k + 9) ÷ 5", "That splits the delivery share too. Each friend adds $9 after the split."],
          ["5k + 9", "Multiplying would make the bill bigger. Splitting means dividing."]),
      },
    },
    D: {
      name: "Brick Red", hex: "#9d1b2a", tier: 2,
      q: {
        situation: "A music store sells keyboard stands for $7 each and takes $4 off the whole order. Let a be the number of stands.",
        use: "Rey buys 5 stands. What does the order cost?",
        vars: {a: 5},
        choices: mc("7a − 4",
          ["7(a − 4)", "That takes 4 stands off, not $4 off the total."],
          ["4 − 7a", "The coupon comes off the cost, so subtract 4 from 7a."],
          ["7a + 4", "A coupon lowers the price. It does not add to it."]),
      },
    },
    C: {
      name: "Electric Cyan", hex: "#2ec4ff", tier: 2,
      q: {
        situation: "A recording studio charges an $8 sign-in fee plus $6 for each hour. Let c be the number of hours.",
        use: "A band records for 4 hours. What is the cost?",
        vars: {c: 4},
        choices: mc("8 + 6c",
          ["6 + 8c", "The fee and rate are swapped. $8 is charged once and $6 every hour."],
          ["(8 + 6)c", "That charges the sign-in fee every hour."],
          ["14c", "8 and 6c are different kinds of terms. They cannot be combined."]),
      },
    },
    P: {
      name: "Neon Pink", hex: "#ff5fa2", tier: 3,
      q: {
        situation: "Each of 2 roadies carries n cables and 4 microphones.",
        use: "Each roadie carries 7 cables. How many items do the two roadies carry in all?",
        vars: {n: 7},
        choices: mc("2(n + 4)",
          ["2n + 4", "That doubles only the cables. Each roadie also carries mics, so double the whole load."],
          ["n + 8", "That doubles only the microphones."],
          ["2 + n + 4", "Two roadies means multiply by 2, not add 2."]),
      },
    },
    B: {
      name: "Royal Blue", hex: "#3a6ff7", tier: 3,
      q: {
        situation: "A square stage has sides of x feet. A small drum riser adds 3 square feet.",
        use: "Each side is 5 feet. What is the total area in square feet?",
        vars: {x: 5},
        choices: mc("x² + 3",
          ["2x + 3", "2x is x doubled. The area of a square is side times side."],
          ["x + 3", "x + 3 adds lengths. Area multiplies the side by itself."],
          ["(x + 3)²", "That squares the riser too. Only the side is squared."]),
      },
    },
    K: {
      name: "Midnight", hex: "#1d1a3a", tier: 3,
      q: {
        situation: "A band sells a T-shirts for $4 each and b posters for $2 each, then pays a $1 table fee.",
        use: "They sell 7 shirts and 3 posters. How much do they keep?",
        vars: {a: 7, b: 3},
        choices: mc("4a + 2b − 1",
          ["4a + 2b + 1", "The table fee is paid, so it is subtracted."],
          ["4(a + b) − 1", "That prices posters at $4. Posters are $2 each."],
          ["6ab − 1", "Shirts and posters have different prices. They cannot be combined this way."]),
      },
    },
  },
};
})();

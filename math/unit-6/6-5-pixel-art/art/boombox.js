// Boombox Beats — Lesson 6-5 pixel art (EVALUATE mode).
// Each paint can is locked behind an expression; its value is the can's code number.
// Codes are computed from `expr` + `vars` by engine.js (single source of truth).
window.PIXEL_ARTS = window.PIXEL_ARTS || {};
window.PIXEL_ARTS.boombox = {
  id: "boombox",
  mode: "evaluate",
  title: "Boombox Beats",
  emoji: "📻",
  tagline: "Evaluate expressions to unlock the paint cans.",
  story:
    "The studio blackout drained every colour from Mia's boombox! Each paint can is locked behind an algebra label. Evaluate the expression to crack the can's code, then paint by number.",
  next: { href: "/math/unit-6/6-5-pixel-art/axolotl/", label: "Axel the Axolotl" },
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
    W: { name: "Cloud White", hex: "#ffffff", tier: 1, q: { expr: "4x", vars: { x: 3 } } },
    Y: { name: "Gold", hex: "#ffc933", tier: 1, q: { expr: "20 − p", vars: { p: 6 } } },
    L: { name: "Silver", hex: "#d1d5db", tier: 1, q: { expr: "m + 9", vars: { m: 8 } } },
    R: { name: "Hot Red", hex: "#e63946", tier: 2, q: { expr: "3n + 5", vars: { n: 6 } } },
    G: { name: "Steel Grey", hex: "#6b7280", tier: 2, q: { expr: "k ÷ 5 + 9", vars: { k: 35 } } },
    D: { name: "Brick Red", hex: "#9d1b2a", tier: 2, q: { expr: "7a − 4", vars: { a: 5 } } },
    C: { name: "Electric Cyan", hex: "#2ec4ff", tier: 2, q: { expr: "8 + 6c", vars: { c: 4 } } },
    P: { name: "Neon Pink", hex: "#ff5fa2", tier: 3, q: { expr: "2(n + 4)", vars: { n: 7 } } },
    B: { name: "Royal Blue", hex: "#3a6ff7", tier: 3, q: { expr: "x² + 3", vars: { x: 5 } } },
    K: {
      name: "Midnight",
      hex: "#1d1a3a",
      tier: 3,
      q: { expr: "4a + 2b − 1", vars: { a: 7, b: 3 } },
    },
  },
};

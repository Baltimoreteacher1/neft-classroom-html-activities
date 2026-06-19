// ════════════════════════════════════════════════════════════════════════
//  GAMES-2D CANONICAL DATA — single source of truth
// ════════════════════════════════════════════════════════════════════════
//  This file is the ONE editable place for the standards / vocab /
//  misconceptions / tier labels that the hand-built 2D + Phaser math games
//  display. Each entry is keyed by a stable game id (the game's folder name).
//
//  The games are standalone static HTML pages (served as-is by Cloudflare
//  Pages), so they cannot `import` a Node module at runtime. Instead, run
//
//      npm run generate-games2d-data
//
//  to emit the browser artifact `assets/games2d-data.js`, which exposes the
//  SAME object as `window.Games2DData`. Each wired game reads its block from
//  `window.Games2DData["<id>"]` (with a small inline fallback so the page is
//  never blank if the script fails to load). Edit metadata HERE, regenerate,
//  and every wired game updates — instead of hunting through 39 HTML files.
//
//  Shape per game id:
//    {
//      ccss: "6.RP.A.1",                 // canonical standard code (analytics + UI)
//      title: "Ratio Kitchen",           // display name
//      vocab: [ { term, defn, img } ],   // term + student-facing (ESOL-level) definition + optional image
//      misconceptions: [ { tag, trigger, feedback } ],  // canonical nudge copy
//      tiers: {                          // never label "ESOL" — Level 1 / Level 2 (and Level 0 where present)
//        0?: { label, sub, desc },
//        1:  { label, sub, desc },
//        2:  { label, sub, desc },
//      },
//    }
// ════════════════════════════════════════════════════════════════════════

export const GAMES_2D = {
  // ── Ratio Kitchen (math/unit-3/6-rp-1game) — REAL_GAME ────────────────
  "6-rp-1game": {
    ccss: "6.RP.A.1",
    title: "Ratio Kitchen",
    vocab: [
      {
        term: "ratio",
        defn: "A way to compare two amounts, like 2 scoops of berry to 3 scoops of mango (2:3).",
        img: "",
      },
      {
        term: "equivalent ratios",
        defn: "Ratios that show the same comparison, like 2:3 and 4:6 — bigger batch, same taste.",
        img: "",
      },
      {
        term: "scale (a ratio)",
        defn: "To make a bigger or smaller batch by multiplying both parts by the same number.",
        img: "",
      },
    ],
    misconceptions: [
      {
        tag: "added-instead-of-scaled",
        trigger: "Student adds the same number to each part instead of multiplying.",
        feedback: "Equivalent ratios MULTIPLY both parts by the same number — adding changes the taste.",
      },
      {
        tag: "scaled-one-part",
        trigger: "Student scales only one ingredient.",
        feedback: "Scale BOTH tubes by the same factor so the ratio stays the same.",
      },
    ],
    tiers: {
      1: { label: "Level 1", sub: "Support", desc: "Small ratios · always shows the rule · 5 lives" },
      2: { label: "Level 2", sub: "Challenge", desc: "Scaling & missing values · less help · 3 lives" },
    },
  },

  // ── Factor Frenzy (math/games/u1-factor-frenzy) — arcade ──────────────
  "u1-factor-frenzy": {
    ccss: "6.NS.4",
    title: "Factor Frenzy",
    vocab: [
      {
        term: "prime number",
        defn: "A number greater than 1 whose only factors are 1 and itself (like 7).",
        img: "",
      },
      {
        term: "composite number",
        defn: "A number with more than two factors (like 12 = 1, 2, 3, 4, 6, 12).",
        img: "",
      },
      {
        term: "GCF (greatest common factor)",
        defn: "The largest number that divides evenly into two numbers.",
        img: "",
      },
      {
        term: "LCM (least common multiple)",
        defn: "The smallest number that two numbers both divide into evenly.",
        img: "",
      },
    ],
    misconceptions: [
      {
        tag: "one-is-prime",
        trigger: "Student labels 1 as prime.",
        feedback: "1 is neither prime nor composite — a prime needs exactly two factors.",
      },
      {
        tag: "gcf-lcm-swap",
        trigger: "Student gives the LCM when the GCF is asked (or vice-versa).",
        feedback: "GCF is the biggest shared FACTOR; LCM is the smallest shared MULTIPLE.",
      },
    ],
    tiers: {
      1: { label: "Level 1", sub: "Support", desc: "Smaller numbers · slower fall · more time to sort" },
      2: { label: "Level 2", sub: "Challenge", desc: "Bigger numbers · faster fall · GCF & LCM rounds" },
    },
  },

  // ── Variable Blaster (math/unit-9/6-ee-c-9game) — REAL_GAME ───────────
  "6-ee-c-9game": {
    ccss: "6.EE.C.9",
    title: "Variable Blaster",
    vocab: [
      {
        term: "independent variable",
        defn: "The input you choose; it does not depend on the other variable (often x).",
        img: "",
      },
      {
        term: "dependent variable",
        defn: "The output that changes because of the independent variable (often y).",
        img: "",
      },
      {
        term: "equation",
        defn: "A rule with an equals sign that links the two variables, like y = 2x + 1.",
        img: "",
      },
    ],
    misconceptions: [
      {
        tag: "swapped-variables",
        trigger: "Student treats the output as the input.",
        feedback: "The dependent variable DEPENDS on the independent one — find the input first, then apply the rule.",
      },
      {
        tag: "order-of-operations",
        trigger: "Student adds before multiplying in the rule.",
        feedback: "In y = 2x + 1, multiply 2 × x first, then add 1.",
      },
    ],
    tiers: {
      1: { label: "Level 1", sub: "Support", desc: "One-step rules · slower asteroids · the table is shown" },
      2: { label: "Level 2", sub: "Challenge", desc: "Two-step rules · faster asteroids · find the rule yourself" },
    },
  },
};

export default GAMES_2D;

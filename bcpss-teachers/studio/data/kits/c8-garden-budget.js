// Shared data and pictures for the grade 8 CTE lesson on planning a small budget project (worker c8).
// Every price is invented for practice. Line totals are computed here so the pictures and the lesson text cannot drift apart.

export const ITEMS = [
  { id: "lumber", name: "Lumber, 8-ft board", qty: 12, unit: 9.75 },
  { id: "screws", name: "Screws, box of 100", qty: 2, unit: 6.5 },
  { id: "soil", name: "Garden soil, 40-lb bag", qty: 10, unit: 4.8 },
  { id: "seeds", name: "Seed packets", qty: 12, unit: 2.25 },
  { id: "gloves", name: "Work gloves, pair", qty: 4, unit: 3.75 },
];

export const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;
export const lineTotal = (it) => Math.round(it.qty * it.unit * 100) / 100;
export const PLAN_TOTAL = Math.round(ITEMS.reduce((s, it) => s + lineTotal(it), 0) * 100) / 100; // 220
export const BUDGET = 240;
export const RESERVE = BUDGET * 0.1; // 24
export const LIMIT = BUDGET - RESERVE; // 216

export const quoteTable = ({ totals = true, highlight } = {}) => ({
  kind: "table",
  alt: `A quote for the garden beds. ${ITEMS.map((it) => `${it.name}: ${it.qty} at ${money(it.unit)} each${totals ? `, ${money(lineTotal(it))}` : ""}`).join(". ")}.${totals ? ` Plan total ${money(PLAN_TOTAL)}.` : ""}`,
  head: totals
    ? ["Item", "Quantity", "Unit cost", "Line total"]
    : ["Item", "Quantity", "Unit cost"],
  rows: [
    ...ITEMS.map((it) =>
      totals
        ? [it.name, String(it.qty), money(it.unit), money(lineTotal(it))]
        : [it.name, String(it.qty), money(it.unit)],
    ),
    ...(totals ? [["Plan total", "", "", money(PLAN_TOTAL)]] : []),
  ],
  ...(highlight ? { highlight } : {}),
});

export const BUDGET_BARS = {
  kind: "bars",
  alt: "A bar chart in dollars. Budget 240. Reserve 24. Amount the crew can spend 216.",
  w: 480,
  h: 300,
  xLabel: "Part of the budget",
  yLabel: "Amount",
  unit: "dollars",
  data: [
    { label: "Budget", value: BUDGET },
    { label: "Reserve", value: RESERVE },
    { label: "Can spend", value: LIMIT },
  ],
};

export const CONSTRAINT_BARS = {
  kind: "bars",
  alt: "A bar chart in dollars. The plan total is 220. The spending limit is 216. The plan bar is taller than the limit bar.",
  w: 480,
  h: 300,
  xLabel: "Plan and limit",
  yLabel: "Amount",
  unit: "dollars",
  data: [
    { label: "Plan total", value: PLAN_TOTAL },
    { label: "Spending limit", value: LIMIT },
  ],
};

export const RESERVE_TAPE = {
  kind: "tape",
  alt: "A bar for the 240 dollar budget. The long part is marked 216 dollars to spend. The short part at the end is marked 24 dollars, the reserve, which is 10 percent of the budget.",
  w: 480,
  h: 160,
  parts: [
    { label: "$216 to spend", units: 216, color: "teal" },
    { label: "$24", units: 24, color: "ochre" },
  ],
  total: 240,
};

export const TRADE_OFF_TABLE = {
  kind: "table",
  alt: "A table of two options for a plan that is over the limit. Buy 9 bags of soil instead of 10: saves 4 dollars and 80 cents, the beds are still filled and everyone stays safe. Skip the gloves: saves 15 dollars, but crew members could get hurt.",
  head: ["Option", "Saves", "What it costs the project"],
  rows: [
    ["9 bags of soil instead of 10", "$4.80", "Nothing: the beds are still filled"],
    ["Skip the gloves", "$15.00", "Safety: hands are not protected"],
  ],
  highlight: [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
};

export const SCOPE_TABLE = {
  kind: "table",
  alt: "A table with two columns. In scope: build 3 raised beds, fill the beds with soil, plant 12 seed packets. Out of scope: build a greenhouse, install a watering system, sell the vegetables.",
  head: ["In scope", "Out of scope"],
  rows: [
    ["Build 3 raised beds", "Build a greenhouse"],
    ["Fill the beds with soil", "Install a watering system"],
    ["Plant 12 seed packets", "Sell the vegetables"],
  ],
};

export const DELIVERABLE_FLOW = {
  kind: "flow",
  alt: "Four steps in order: Plan the beds, Order supplies, Build the beds, then Deliver 3 planted garden beds.",
  w: 480,
  h: 200,
  steps: [
    { label: "Plan the beds", icon: "notebook" },
    { label: "Order supplies", icon: "store" },
    { label: "Build the beds", icon: "hammer" },
    { label: "Deliver 3 planted beds", icon: "sprout" },
  ],
};

export const PPE_PICTURE = {
  kind: "labeled",
  alt: "A student wearing safety glasses and work gloves, with two callouts pointing to the glasses and the gloves.",
  w: 480,
  h: 300,
  base: {
    kind: "shapes",
    w: 480,
    h: 300,
    alt: "A student icon in the middle of the picture.",
    items: [
      { t: "icon", name: "student", x: 150, y: 40, s: 190 },
      {
        t: "rect",
        x: 205,
        y: 100,
        w: 82,
        h: 18,
        rx: 9,
        fill: "ochre",
        opacity: 0.5,
        stroke: "ink",
        sw: 3,
      },
      {
        t: "rect",
        x: 152,
        y: 190,
        w: 40,
        h: 26,
        rx: 10,
        fill: "teal",
        opacity: 0.6,
        stroke: "ink",
        sw: 3,
      },
      {
        t: "rect",
        x: 296,
        y: 190,
        w: 40,
        h: 26,
        rx: 10,
        fill: "teal",
        opacity: 0.6,
        stroke: "ink",
        sw: 3,
      },
    ],
  },
  labels: [
    { text: "safety glasses", x: 246, y: 109, tx: 390, ty: 80 },
    { text: "work gloves", x: 316, y: 203, tx: 400, ty: 240 },
  ],
};

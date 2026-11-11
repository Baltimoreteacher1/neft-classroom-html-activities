// The live-model panel draws from the game's own state, never from a constant picture and
// never from another topic. Renderer behaviour is driven in jsdom against the shipped
// assets/game-studio.js; the equation parser is lifted out of the shipped flagship-studio.js.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadRenderer, SAMPLES } from "./lib/arcade-models-check.mjs";

const root = new URL("../", import.meta.url);
const render = loadRenderer(root);
/** Visible words only: attribute names like y="40" are not the rule y = kx. */
const words = (svg) => svg.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

// ── Renderers ────────────────────────────────────────────────────────────────
for (const [kind, params] of Object.entries(SAMPLES)) {
  const svg = render(kind, params);
  assert.match(
    svg,
    /^<svg[^>]+role="img"[^>]+aria-label="[^"]{12,}"/,
    `${kind} is a labelled image`,
  );
}
assert.equal(render("nonsense", { a: 2, b: 3 }), "", "unknown kind draws nothing");
assert.match(
  render("ratios", { a: 2, b: 3 }),
  /Target Ratio 2 : 3/,
  "ratios still draw when asked for by name",
);

// Data display shows the data and withholds the statistics it is asking about.
const dots = render("data-display", { values: [12, 18, 15, 21, 14] });
assert.equal(dots.match(/<circle/g).length, 5, "one dot per value");
assert.doesNotMatch(words(dots), /mean|median|mode|range/i, "no summary statistic is printed");
assert.equal(render("data-display", { values: [7] }), "", "one value is not a distribution");

// Percent grid shades exactly the stated count and refuses an impossible one.
const grid = render("percent-grid", { pct: 35 });
assert.equal((grid.match(/fill="#0D9488"/g) || []).length, 35);
assert.equal(render("percent-grid", { pct: 140 }), "");
assert.equal(render("percent-grid", { pct: -5 }), "");

// Balance: blocks match the equation; a quantity too big to draw is one labelled bar.
const bal = render("balance", {
  v: "x",
  xs: 1,
  units: 6,
  unitsSign: "+",
  right: 11,
  left: "x + 6",
  rightLabel: "11",
});
assert.equal((bal.match(/fill="#0D9488"/g) || []).length, 6 + 11, "6 unit blocks left, 11 right");
assert.match(bal, /x \+ 6/);
const big = render("balance", {
  v: "x",
  xs: 1,
  units: 4,
  right: 40,
  left: "x + 4",
  rightLabel: "40",
});
assert.match(big, />40</, "40 is printed as a number, not 24 blocks");
assert.equal(
  render("balance", { xs: 9, units: 1, right: 2 }),
  "",
  "more x-blocks than can be drawn: nothing",
);
const neg = render("balance", {
  v: "n",
  xs: 1,
  units: 3,
  unitsSign: "-",
  right: 5,
  left: "n − 3",
  rightLabel: "5",
});
assert.match(
  neg,
  /stroke-dasharray="3 2"/,
  "subtracted units are drawn dashed, not as added blocks",
);

// Area / volume draw the stated dimensions and refuse invalid ones.
assert.match(
  render("area-shapes", { type: "parallelogram", b: 8, h: 3 }),
  /parallelogram with base 8 and height 3/,
);
assert.equal(render("area-shapes", { type: "triangle", b: 0, h: 3 }), "");
assert.match(render("volume-cubes", { l: 3, w: 2, h: 4 }), /3 by 2 by 4/);
assert.equal(render("volume-cubes", { l: 3, w: 2, h: 40 }), "");

// Rule table copies rows and never prints a rule.
const table = render("rule-table", {
  rows: [
    ["1", "5"],
    ["2", "10"],
    ["3", "15"],
  ],
});
assert.doesNotMatch(words(table), /=/, "the rule is the answer");
assert.equal(render("rule-table", { rows: [["1", "5"]] }), "");

// Text is escaped (a custom label must not become markup).
assert.doesNotMatch(
  render("balance", { xs: 1, units: 1, right: 2, left: "<img src=x onerror=1>" }),
  /<img/,
);

// ── Equation parser (lifted from the shipped flagship-studio.js) ─────────────
const src = readFileSync(new URL("math/games/shared/flagship-studio.js", root), "utf8");
const start = src.indexOf("  function parseEquation(text) {");
const end = src.indexOf("  function modelState(", start);
assert.ok(start > 0 && end > start, "parseEquation still exists in flagship-studio.js");
const parseEquation = new Function(`${src.slice(start, end)}; return parseEquation;`)();

assert.deepEqual(
  (({ v, xs, units, unitsSign, right }) => ({ v, xs, units, unitsSign, right }))(
    parseEquation("Choose the key for  x + 8 = 13:  which move gets x alone?"),
  ),
  { v: "x", xs: 1, units: 8, unitsSign: "+", right: 13 },
);
assert.equal(parseEquation("Test each value. Which one is a solution of  x + 6 = 11?").units, 6);
assert.equal(parseEquation("Solve 3x = 21").xs, 3);
assert.equal(parseEquation("What is n ÷ 4 = 7?").left, "n ÷ 4");
assert.equal(parseEquation("Solve x − 6 = 8").unitsSign, "-", "a unicode minus is a subtraction");
assert.equal(parseEquation("x + 3 ≥ 5"), null, "an inequality is not drawn as a balance");
assert.equal(parseEquation("Which move gets the variable alone?"), null);
assert.equal(
  parseEquation("Evaluate 9x when x = 3"),
  null,
  "evaluation is not an equation to balance",
);
assert.equal(parseEquation("2x + 3 = 11")?.xs, 2, "a coefficient is kept");

console.log("arcade model renderer + parser checks passed.");
process.exit(0);

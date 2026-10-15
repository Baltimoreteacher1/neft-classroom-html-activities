// Typed table cells in the studios: what counts as right (assets/studio/kinds-basic.js, RT.util.cellOk).
//   node tools/studio-table-cells.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const w = new JSDOM("<!doctype html><body></body>", { runScripts: "outside-only" }).window;
w.eval(readFileSync(join(REPO_ROOT, "assets/studio-gen/core.js"), "utf8"));
w.eval(readFileSync(join(REPO_ROOT, "assets/studio/kinds-basic.js"), "utf8"));
const ok = w.StudioRT.util.cellOk;
const yes = (typed, want) =>
  assert.ok(
    ok(typed, want),
    `${JSON.stringify(typed)} should be right for ${JSON.stringify(want)}`,
  );
const no = (typed, want) =>
  assert.ok(
    !ok(typed, want),
    `${JSON.stringify(typed)} should be wrong for ${JSON.stringify(want)}`,
  );

// numbers and units
yes("12", "12");
yes("12.0", "12");
yes(" 12 ", "12");
yes("12", "12 cm²");
yes("12 cm²", "12 cm²");
yes("12cm²", "12 cm²");
yes("$3.50", "3.5");
yes("3.5", "$3.50");
yes("1,250", "1250");
yes("3/4", "0.75");
yes("−5", "-5");
no("13", "12 cm²");
no("12 m²", "12 cm²");
no("", "12");
// a key with a second number must match whole (the leading-number shortcut used to accept "9" for "9 to 15")
yes("9 to 15", "9 to 15");
yes("9:15", "9 to 15");
yes("9 : 15", "9:15");
yes("9 TO 15", "9:15");
no("9", "9 to 15");
no("9:99", "9 to 15");
no("9 to 14", "9 to 15");
yes("(2, 6)", "(2,6)");
yes("(2,6)", "(2, 6)");
no("(6, 2)", "(2, 6)");
no("2", "(2, 6)");
yes("1, 2, 3, 4, 6, 9, 12, 18, 36", "1,2,3,4,6,9,12,18,36");
no("1, 2, 3", "1, 2, 3, 4, 6");
// words and expressions
yes("median", "Median");
yes("Median", "median");
no("Mean", "Median");
yes("5n", "3n + 2n or 5n");
yes("3n + 2n", "3n + 2n or 5n");
yes("3n+2n", "3n + 2n or 5n");
no("6n", "3n + 2n or 5n");
yes("4(x + 2)", "4(x+2)");
yes("2 × 50 × 13", "2 · 50 · 13");
yes("2*50*13", "2 × 50 × 13");
no("2 × 50 × 12", "2 × 50 × 13");
yes("2⁵", "2⁵");
no("2^5", "2⁵");
console.log(
  "studio-table-cells: numbers, units, ratios, pairs, lists, alternatives and expressions graded as specified.",
);

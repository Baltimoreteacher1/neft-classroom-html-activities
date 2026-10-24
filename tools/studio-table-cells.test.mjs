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
// a leading plus sign is a positive number ("+18" is 18), in a table cell and in a typed answer
yes("+18", "18");
yes("+ 18", "18");
yes("+3.5", "$3.50");
no("+18", "-18");
assert.equal(w.StudioGen.value("+18"), 18);
assert.equal(w.StudioGen.value("+2 1/3"), 2 + 1 / 3);
assert.ok(Number.isNaN(w.StudioGen.value("+")), "a lone plus is not a number");
assert.ok(w.StudioRT.util.same("+18", "18", 0), "typed answer +18 equals 18");
assert.ok(!w.StudioRT.util.same("+18", "-18", 0), "+18 is not -18");
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

// the table kind types IN its cells: each blank cell is a real input, a wrong cell is marked, and the check needs every cell right
{
  const host = w.document.createElement("div");
  w.document.body.append(host);
  const calls = { solve: 0, miss: 0 };
  const it = {
    k: "tbl",
    id: "tc",
    t: "Fill in the table",
    hd: ["Cups of juice", "Cups of water"],
    rows: [
      ["2", "3"],
      ["4", ""],
      ["", "9"],
    ],
    cells: [
      { r: 1, c: 1, a: "6" },
      { r: 2, c: 0, a: "6" },
    ],
  };
  w.StudioRT.kinds.tbl.mount({
    it,
    host,
    state: { cells: {}, notes: {}, picks: {}, hints: {} },
    solved: false,
    es: () => false,
    save() {},
    say() {},
    fb() {},
    misses: () => 0,
    hintBlock: () => "",
    solve: () => calls.solve++,
    miss: () => calls.miss++,
  });
  const cells = [...host.querySelectorAll("td > input[data-cell]")];
  assert.equal(cells.length, 2, "both blank cells are inputs inside the table");
  assert.ok(
    cells.every((c) => c.getAttribute("aria-label")),
    "each cell has an accessible name",
  );
  const type = (c, v) => {
    c.value = v;
    c.dispatchEvent(new w.Event("input", { bubbles: true }));
  };
  type(cells[0], "6");
  type(cells[1], "7");
  host.querySelector("[data-check-table]").click();
  assert.equal(calls.miss, 1, "one wrong cell is a miss");
  assert.ok(
    cells[1].classList.contains("err") && cells[0].classList.contains("ok"),
    "the wrong cell is marked, the right one is not",
  );
  type(cells[1], "6 ");
  host.querySelector("[data-check-table]").click();
  assert.equal(calls.solve, 1, "every cell right solves the table");
}

console.log(
  "studio-table-cells: numbers, units, ratios, pairs, lists, alternatives and expressions graded as specified; typed cells check.",
);

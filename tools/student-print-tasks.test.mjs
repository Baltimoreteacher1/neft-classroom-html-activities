/** Regression checks for answer-free, complete printed student tasks. */
import assert from "node:assert/strict";
import { normalizeFillTable } from "@eduwonderlab/engine/components/fill-table.js";
import { JSDOM } from "jsdom";
import { renderItem } from "../scripts/lib/student-print-tasks.mjs";
import { listLessonDirs, loadLessonConfig } from "./lib/curriculum-source.mjs";

const dom = (item) => new JSDOM(renderItem(item, 0)).window.document;
let doc = dom({
  type: "drag-sort",
  label: "Sort these.",
  categories: ["Even", "Odd"],
  cards: [
    { text: "12", correct: 0 },
    { text: "7", correct: 1 },
  ],
});
assert.deepEqual(
  [...doc.querySelectorAll(".sorthd")].map((e) => e.textContent),
  ["Even", "Odd"],
);
assert.deepEqual([...doc.querySelectorAll(".chip")].map((e) => e.textContent).sort(), ["12", "7"]);
doc = dom({
  type: "drag-sort",
  categories: [{ label: "A" }, { id: "B" }],
  items: [{ text: "first" }, "second"],
});
assert.equal(doc.querySelectorAll(".chip").length, 2);
assert.equal(doc.querySelector(".sorthd").textContent, "A");
doc = dom({
  type: "drag-sort",
  categories: [
    {
      label: "Statistical",
      items: ["How tall is each person?", "How far does each student walk?"],
    },
    { label: "Not statistical", items: ["How many sides does a triangle have?"] },
  ],
});
assert.deepEqual([...doc.querySelectorAll(".chip")].map((e) => e.textContent).sort(), [
  "How far does each student walk?",
  "How many sides does a triangle have?",
  "How tall is each person?",
]);
assert(doc.querySelectorAll(".sortbox").length === 2);
doc = dom({
  type: "drag-sort",
  categories: [
    {
      label: "Steps in order",
      items: [
        "Step 1: Add the values",
        "Step 2: Count the values",
        "Step 3: Divide the total by the count",
      ],
    },
  ],
});
assert.equal(doc.querySelectorAll(".ordering-work li").length, 3);
assert(!doc.body.textContent.includes("Step 1:"));
assert(doc.body.textContent.includes("Divide the total by the count"));
assert.throws(() => renderItem({ type: "drag-sort", categories: ["A", "B"] }), /no cards/);
doc = dom({
  type: "drag-sort",
  categories: [{ label: "Correctly matched" }],
  items: [{ text: "twice k → 2k" }],
});
assert(
  !doc.querySelector(".ordering-work"),
  "A flat one-category grouping task is not an ordering task",
);
assert(doc.querySelector(".sortbox"));
doc = dom({
  type: "drag-sort",
  items: [{ text: "double n → 2n" }, { text: "triple n → 3n" }],
  categories: [{ label: "Correctly matched" }],
  studentPrint: {
    prompt: "Match each phrase to its expression.",
    matchingPairs: [
      { left: "double n", right: "2n" },
      { left: "triple n", right: "3n" },
    ],
  },
});
assert.equal(doc.querySelectorAll(".matchtbl tr").length, 2);
assert(!doc.body.textContent.includes("double n → 2n"));
assert(!doc.querySelector(".sortbox"));

const table = {
  type: "fill-table",
  columns: ["Problem", "Rewrite", "Quotient"],
  items: [
    { problem: "8.4 ÷ 2.1", problemEs: "translated problem", rewrite: "84 ÷ 21", answer: "4" },
    { problem: "5.6 ÷ 0.7", problemEs: "translated problem two", rewrite: "56 ÷ 7", answer: "8" },
  ],
};
doc = dom(table);
assert.equal(doc.querySelectorAll("th").length, 3);
assert.equal(
  doc.querySelectorAll("td.fill").length,
  4,
  "All computed columns must be blank, not only final answers",
);
assert(!doc.body.textContent.includes("84 ÷ 21"));
assert(!doc.body.textContent.includes("translated problem"));
doc = dom({
  type: "fill-table",
  headers: ["Given", "Answer"],
  rows: [["4+4", "KEY-SHOULD-STAY-HIDDEN"]],
  editableCells: [{ row: 0, col: 1, answer: "KEY-SHOULD-STAY-HIDDEN" }],
});
assert(!doc.body.textContent.includes("KEY-SHOULD-STAY-HIDDEN"));
assert(doc.body.textContent.includes("4+4"));

doc = dom({
  type: "bar-model",
  instructions: "Compare the two recipes.",
  label: "ANSWER-SHOULD-STAY-HIDDEN",
  parts: [{ value: 10, label: "oil" }],
  answer: 10,
});
assert(!doc.body.textContent.includes("ANSWER-SHOULD-STAY-HIDDEN"));
assert(doc.querySelector(".model-space"));
doc = dom({
  type: "bar-model",
  instructions: "Count the pieces.",
  bars: [{ label: "1/3", annotation: "whole 1" }, { label: "1/3" }, { label: "1/3" }],
});
assert.equal(doc.querySelectorAll("svg rect").length, 3);
doc = dom({
  type: "bar-model",
  label: "Compare segments of lengths 6 and 4.",
  bars: [
    { value: 6, label: "6" },
    { value: 4, label: "4" },
  ],
});
const widths = [...doc.querySelectorAll("rect")].map((node) => Number(node.getAttribute("width")));
assert(
  Math.abs(widths[0] / widths[1] - 1.5) < 1e-9,
  "Unequal segments must retain their 6:4 proportion",
);
assert(doc.querySelector("svg").getAttribute("aria-label").includes("proportional"));
doc = dom({
  type: "bar-model",
  label: "Total 222; known parts 120 and 60. Find the missing part.",
  bars: [
    { value: 120, label: "Top" },
    { value: 60, label: "Front" },
    { value: 42, editable: true },
  ],
});
assert(
  doc.querySelector(".model-space"),
  "A hidden answer cannot determine the visible segment width",
);
assert(!doc.body.textContent.includes("42"));

doc = dom({
  type: "balance-scale",
  label: "Build the equation.",
  equation: "n + 15 = 42",
  answer: 27,
});
assert(doc.body.textContent.includes("n + 15 = 42"));
assert(!doc.body.textContent.includes("27"));
doc = dom({
  type: "balance-scale",
  label: "ANSWER 14",
  instructions: "ANSWER 14",
  left: "6 + 4 + 4 = 14",
  right: "10 + 4 = 14",
  studentPrint: { prompt: "Test x = 2: are 3x + 2x + 4 and 5x + 4 equivalent?" },
});
assert(doc.body.textContent.includes("3x + 2x + 4"));
assert(!doc.body.textContent.includes("14"));
assert(
  !doc.querySelector(".task-directions"),
  "Unreviewed legacy instructions must not return after studentPrint override",
);

doc = dom({
  type: "coordinate-grid",
  instructions: "Plot each point.",
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  targets: [{ x: -2, y: 3, label: "A" }],
});
assert.equal(doc.querySelector('[data-axis="y"]').getAttribute("x1"), "210");
assert.equal(doc.querySelector('[data-axis="x"]').getAttribute("y1"), "210");
assert(doc.body.textContent.includes("A: (-2, 3)"));
assert.equal(doc.querySelectorAll("circle").length, 0, "No plotted solution points");
doc = dom({ type: "coordinate-grid", points: [{ x: -8, y: 12, label: "P" }] });
assert(doc.querySelector("svg").getAttribute("aria-label").includes("y from -13 to 13"));
doc = dom({ type: "coordinate-grid", targets: [{ x: 4, y: 3, label: "Clue A (I)" }] });
assert(
  doc.body.textContent.includes("Clue A (I): (4, 3)"),
  "Parentheses around a quadrant are not an ordered pair",
);
doc = dom({
  type: "coordinate-grid",
  targets: [
    { x: 1, y: 4, label: "Original" },
    { x: 1, y: -4, label: "Over x-axis" },
  ],
  studentPrint: {
    prompt: "Plot the original and find its reflection.",
    pointTasks: [
      { label: "Original", x: 1, y: 4 },
      { label: "Reflection", task: "Reflect the original over the x-axis." },
    ],
  },
});
assert(doc.body.textContent.includes("Original: (1, 4)"));
assert(doc.body.textContent.includes("Reflect the original over the x-axis"));
assert(
  !doc.body.textContent.includes("(1, -4)"),
  "Derived reflection coordinates are not student givens",
);
assert.throws(
  () => renderItem({ type: "open-response", studentPrint: {} }),
  /studentPrint requires/,
);
assert.throws(
  () =>
    renderItem({
      type: "coordinate-grid",
      studentPrint: {
        prompt: "Reflect",
        pointTasks: [{ label: "Answer", x: 1, y: -4, task: "Reflect" }],
      },
    }),
  /never both/,
);

doc = dom({
  type: "number-line",
  range: { min: 0, max: 7, step: 0.5 },
  items: [{ label: "Add 1.25 to 3.4", value: 4.65 }],
  solveFirst: true,
});
assert(doc.body.textContent.includes("Add 1.25 to 3.4"));
assert(!doc.body.textContent.includes("4.65"), "Solve-first answer must not be printed");
assert.equal(doc.querySelectorAll("svg line").length, 16);
doc = dom({
  type: "number-line",
  problems: [
    { inequality: "x > 4", boundary: 4, circleType: "open", direction: "right" },
    { inequality: "x ≤ 7", boundary: 7, circleType: "closed", direction: "left" },
  ],
});
assert.equal(doc.querySelectorAll("svg").length, 2);
assert(doc.body.textContent.includes("x > 4"));
assert(!doc.body.textContent.includes("closed"));
assert.throws(() => renderItem({ type: "number-line", step: 0 }), /Invalid printable/);
assert.throws(() => renderItem({ type: "coordinate-grid", xMin: 2, xMax: 2 }), /Invalid printable/);
assert(
  !renderItem({ type: "open-response", prompt: "<script>alert(1)</script>" }).includes("<script>"),
);

// Concrete curricular expectations from the independent review. These are
// independently authored student givens and withheld answers, not counts
// inferred from the same renderer inputs that caused the original failures.
const lesson = loadLessonConfig;
const practiceDoc = (id, band, index) => dom(lesson(id).practice[band][index]);
for (const [id, index, required, hidden] of [
  ["5-5", 2, [/10 inches/, /4 inches/, /3 inches/, /two equal/], [/60\s*(?:in|cubic)/]],
  ["5-6", 2, [/222 in²/, /120 in²/, /60 in²/], [/42\s*in²/]],
  ["5-7", 2, [/340 cm²/, /150 cm²/, /120 cm²/], [/70\s*cm²/]],
  ["5-10", 0, [/8 feet/, /4 feet/, /3 feet/, /half full/], [/48\s*(?:ft|cubic)/]],
]) {
  const text = practiceDoc(id, "onLevel", index).body.textContent;
  for (const pattern of required)
    assert(pattern.test(text), `${id}: missing reviewed given ${pattern}`);
  for (const pattern of hidden)
    assert(!pattern.test(text), `${id}: printed computed answer ${pattern}`);
}
doc = dom(lesson("7-8").explore);
for (const coordinate of ["(4, 3)", "(-5, 2)", "(-3, -4)", "(2, -5)", "(-1, 6)"])
  assert(
    doc.querySelector(".point-tasks").textContent.includes(coordinate),
    `7-8: missing given ${coordinate}`,
  );
assert(
  !/\((?:I|II|III|IV)\)/.test(doc.querySelector(".point-tasks").textContent),
  "7-8: quadrant answers must not be supplied",
);
doc = practiceDoc("7-9", "onLevel", 0);
assert(doc.body.textContent.includes("(1, 4)"));
for (const answer of ["(1, -4)", "(-1, 4)", "(-1, -4)"])
  assert(!doc.body.textContent.includes(answer), `7-9: reflection answer leaked ${answer}`);
doc = dom(lesson("7-9").explore);
for (const given of ["(3, 5)", "(-4, 2)", "(-2, -3)"]) assert(doc.body.textContent.includes(given));
for (const answer of ["(3, -5)", "(4, 2)", "(-2, 3)"])
  assert(!doc.body.textContent.includes(answer));
doc = dom(lesson("8-1").explore);
assert(doc.body.textContent.includes("n + 15 = 42"));
assert(doc.querySelectorAll(".wl").length >= 4);
for (const [id, index, required, hidden] of [
  ["6-5", 4, /3 \+ n/, /Both expressions are equivalent/],
  ["6-6", 3, /3x \+ 2x \+ 4/, /(?:=\s*14|Both equal 14)/],
  ["6-14", 3, /4\(x \+ 3\)/, /(?:=\s*32|Both equal 32)/],
  ["6-15", 3, /3x \+ 4x \+ 2/, /Both simplify to/],
]) {
  const document = practiceDoc(id, "onLevel", index);
  assert(required.test(document.body.textContent), `${id}: missing original expression`);
  assert(!hidden.test(document.body.textContent), `${id}: worked answer leaked`);
  assert(document.querySelectorAll(".wl").length >= 4);
}
doc = practiceDoc("7-2", "extending", 2);
assert(
  doc.body.textContent.replaceAll("−", "-").includes("-2/3") &&
    doc.body.textContent.replaceAll("−", "-").includes("-3/4"),
);
assert(!/left side is greater|−?0\.667|-0\.75/.test(doc.body.textContent));
doc = practiceDoc("8-3", "onLevel", 3);
assert(doc.body.textContent.includes("72") && doc.body.textContent.includes("6 bags"));
assert(!doc.body.textContent.includes("72 ÷ 6 = 12"));
assert(doc.querySelector(".model-space"));
doc = practiceDoc("2-1", "onLevel", 3);
assert.equal(
  doc.querySelectorAll(".chip").length,
  2,
  "The two rewritten statistical questions must both be present",
);
assert(doc.body.textContent.includes("How many hours does each 6th grader study per week?"));
assert(doc.body.textContent.includes("What time does each student arrive at school?"));
doc = practiceDoc("5-7", "onLevel", 3);
assert.equal(
  doc.querySelectorAll(".chip").length,
  4,
  "The four prisms with surface areas 54, 94, 158, 248 must all be provided",
);
assert.equal(doc.querySelectorAll(".ordering-work li").length, 4);
assert.deepEqual(
  [...doc.querySelectorAll(".chip")].map((element) => element.textContent).sort(),
  [
    "Cube 3×3×3: SA = 54",
    "Rect prism 5×4×3: SA = 94",
    "Rect prism 8×5×3: SA = 158",
    "Rect prism 10×6×4: SA = 248",
  ].sort(),
);
for (const id of ["6-5", "6-6"]) {
  doc = practiceDoc(id, "onLevel", 0);
  assert.equal(
    doc.querySelectorAll(".matchtbl tr").length,
    6,
    `${id}: each of the six reviewed pairs must appear`,
  );
  assert(!doc.querySelector(".ordering-work"));
  assert(!doc.body.textContent.includes("Correctly Matched"));
  assert(
    !doc.body.textContent.includes("→"),
    `${id}: do not print an already-completed phrase-to-answer arrow`,
  );
}
doc = dom(lesson("2-6").explore);
assert(doc.body.textContent.includes("2,184") && doc.body.textContent.includes("14"));
assert(doc.querySelector(".division-space"));
assert(!doc.body.textContent.includes("156"));
assert(!/tool below|checks each step/i.test(doc.body.textContent));

// Exhaustive static contract sweep: every task emitted in Units 2–9's full
// packets and all three practice bands, not a sample of renderer types.
const counts = {};
let lessons = 0;
let tables = 0;
for (const id of listLessonDirs({ filter: /^[2-9]-\d+(-flagship)?$/ })) {
  const config = loadLessonConfig(id);
  lessons++;
  const items = [
    config.explore,
    ...["approaching", "onLevel", "extending"].flatMap((k) => config.practice?.[k] || []),
  ].filter(Boolean);
  for (const item of items) {
    counts[item.type] = (counts[item.type] || 0) + 1;
    const html = renderItem(item, 0);
    assert(!/\[object Object\]|(?:="|>)NaN(?:"|<)/.test(html), `${id}: malformed ${item.type}`);
    if (item.type === "fill-table") {
      const normal = normalizeFillTable(item);
      assert(normal.rows.length > 0, `${id}: missing table rows`);
      assert.equal(
        (html.match(/class="fill"/g) || []).length,
        normal.editableCells.length,
        `${id}: paper work differs from interactive table`,
      );
      tables++;
    }
    if (item.type === "drag-sort") {
      if (item.studentPrint?.matchingPairs) {
        assert.equal(
          (html.match(/class="mnum"/g) || []).length,
          item.studentPrint.matchingPairs.length,
        );
        assert(!html.includes('class="sortbox"'));
        continue;
      }
      const expectedCards =
        Array.isArray(item.cards) && item.cards.length
          ? item.cards
          : Array.isArray(item.items) && item.items.length
            ? item.items
            : (item.categories || []).flatMap((category) => category.items || []);
      assert(expectedCards.length > 0, `${id}: sort must give students something to classify`);
      assert.equal(
        (html.match(/class="chip"/g) || []).length,
        expectedCards.length,
        `${id}: missing sort cards`,
      );
    }
    assert.equal(renderItem(item, 0), html, `${id}: generation is not deterministic`);
  }
}
console.log(
  `PASS student-print-tasks: renderer regressions; ${lessons} lessons; ${Object.values(counts).reduce((a, b) => a + b, 0)} tasks; ${tables} tables match engine work-cell contract.`,
);
console.log(JSON.stringify(counts));

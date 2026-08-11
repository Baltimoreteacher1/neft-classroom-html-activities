import assert from "node:assert/strict";
import test from "node:test";

import {
  originalStrategyCategory,
  resolveAlternativeStrategies,
  resolveStrategyDomain,
  strategyModel,
} from "../engine/core/small-group-strategies.js";

const lesson = (title, objective = title) => ({ title, contentObjective: objective });

test("classifies representative Grade 6 domains from shared lesson and item data", () => {
  assert.equal(resolveStrategyDomain(lesson("Ratio and Rate Problem Solving")), "ratio");
  assert.equal(
    resolveStrategyDomain(
      lesson("Ratio and Rate Problem Solving", "Find a unit rate, then multiply to compare."),
    ),
    "ratio",
  );
  assert.equal(resolveStrategyDomain(lesson("Percent of a Quantity")), "percent");
  assert.equal(resolveStrategyDomain(lesson("Surface Area of Rectangular Prisms")), "surface-area");
  assert.equal(resolveStrategyDomain(lesson("Choose a Measure of Center")), "statistics");
  assert.equal(resolveStrategyDomain(lesson("Solve One-Step Equations")), "equation");
});

test("prefers the current problem domain when a lesson includes cross-domain review", () => {
  assert.equal(
    resolveStrategyDomain(lesson("Statistics and Data"), {
      stem: "Write an inequality: x is greater than 5.",
    }),
    "equation",
  );
  assert.equal(
    resolveStrategyDomain(lesson("Surface Area of Prisms"), {
      stem: "Evaluate the exponent 3 squared.",
    }),
    "number",
  );
});

test("filters the known original proof-path category", () => {
  const result = resolveAlternativeStrategies(
    lesson("Ratio and Rate Problem Solving"),
    { stem: "A store sells 4 notebooks for $12." },
    "model",
  );

  assert.equal(originalStrategyCategory("Draw Visual Model"), "visual");
  assert.deepEqual(
    result.strategies.map((strategy) => strategy.id),
    ["unit-rate", "explain-scaling"],
  );
  assert.ok(result.strategies.every((strategy) => strategy.category !== "visual"));
});

test("returns math-specific alternatives instead of generic drawing advice", () => {
  const percent = resolveAlternativeStrategies(lesson("Find a Percent of a Number"));
  const surfaceArea = resolveAlternativeStrategies(lesson("Surface Area of Rectangular Prisms"));
  const statistics = resolveAlternativeStrategies(lesson("Mean, Median, and Outliers"));

  assert.match(percent.strategies[0].direction, /0 and 100%|double number line/i);
  assert.match(surfaceArea.strategies[0].direction, /six faces|matching faces/i);
  assert.match(statistics.strategies[0].direction, /cluster|gaps|far from/i);
});

test("strategy models derive only from the stem and never consume the answer", () => {
  const item = {
    stem: "The data are 5, 6, 7, 8, and 50. Which measure best represents the data?",
    answer: "DO-NOT-REVEAL-999",
    explanation: "The final answer is DO-NOT-REVEAL-999.",
  };
  const strategy = resolveAlternativeStrategies(lesson("Statistics and Data"), item).strategies[0];
  const model = strategyModel(strategy, item);

  assert.equal(model.kind, "bar-chart");
  assert.deepEqual(
    model.bars.map((bar) => bar.value),
    [5, 6, 7, 8, 50],
  );
  assert.doesNotMatch(JSON.stringify(model), /DO-NOT-REVEAL|999/);
});

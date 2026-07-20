import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("curriculum/math-workbench/index.html", "utf8");

const topic = html.match(/id: "dec",[\s\S]*?\n        \},\n        \{\n          id: "ratio"/)?.[0];
assert.ok(topic, "Decimals & Percents topic is present before ratios");

for (const name of [
  "Decimal place value",
  "Add / subtract decimals",
  "Percent means per 100",
  "Percent of a number",
  "Fraction ↔ decimal ↔ %",
]) {
  assert.match(topic, new RegExp(`name: "${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
}

for (const type of ["place-value", "decimal-align", "hundred-grid", "percent-bar", "conversion"]) {
  assert.match(topic, new RegExp(`type: "${type}"`), `${type} visual is configured`);
}

assert.match(html, /function referenceVisualHTML\(visual\)/, "visual renderer is defined once");
assert.match(html, /role="img" aria-label="/, "visuals expose a text alternative");
assert.match(html, /class="fc-visual"/, "reference cards render the visual");
assert.match(
  html,
  /referenceVisualHTML\(it\.visual\)[\s\S]*?makeObject\("formula"/,
  "the same visual is included when a reference is added to the board",
);
assert.match(html, /\.ref-hundred-grid/, "hundred-grid presentation is styled");
assert.match(html, /\.ref-percent-bar/, "percent-bar presentation is styled");
assert.match(html, /\.ref-place-value/, "place-value presentation is styled");
assert.match(html, /\.ref-conversion/, "conversion presentation is styled");

console.log("Math Workbench decimal and percent visuals: all assertions passed");

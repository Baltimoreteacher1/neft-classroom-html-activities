import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("curriculum/math-workbench/index.html", "utf8");

assert.match(html, /id="multPrimeBtn"/, "Prime numbers button is present");
assert.match(html, /id="multCompositeBtn"/, "Composite numbers button is present");
assert.match(html, /id="multClassClearBtn"/, "Clear highlights button is present");
assert.match(html, /id="multClassControls"[\s\S]*?role="group"/, "controls form a labeled group");
assert.match(
  html,
  /id="multClassStatus"[\s\S]*?aria-live="polite"/,
  "status is announced politely",
);
assert.match(html, /id="multPrimeBtn"[\s\S]*?aria-pressed="false"/, "Prime is a toggle button");
assert.match(
  html,
  /id="multCompositeBtn"[\s\S]*?aria-pressed="false"/,
  "Composite is a toggle button",
);
assert.match(html, /min-height:\s*44px/, "controls have accessible touch targets");
assert.match(html, /classList\.toggle\("is-prime"/, "prime cells receive a semantic class");
assert.match(html, /classList\.toggle\("is-composite"/, "composite cells receive a semantic class");
assert.match(
  html,
  /classControls\.hidden\s*=\s*div/,
  "classification controls hide in division mode",
);
assert.match(html, /clearClassification\(\)/, "classification has an independent clear path");

const functionSource = html.match(/function isPrime\(value\) \{[\s\S]*?\n        \}/)?.[0];
assert.ok(functionSource, "isPrime helper is defined");
const context = {};
vm.runInNewContext(`${functionSource}; this.isPrime = isPrime;`, context);

for (const value of [2, 3, 5, 7, 11, 13, 97]) {
  assert.equal(context.isPrime(value), true, `${value} is prime`);
}
for (const value of [0, 1, 4, 6, 8, 9, 12, 100]) {
  assert.equal(context.isPrime(value), false, `${value} is not prime`);
}

console.log("Math Workbench prime/composite highlights: all assertions passed");

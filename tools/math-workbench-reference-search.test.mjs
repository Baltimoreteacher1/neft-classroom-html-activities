import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("curriculum/math-workbench/index.html", "utf8");

assert.match(html, /id="referenceSearch"[^>]*type="search"/, "reference search field is present");
assert.match(
  html,
  /id="referenceSearch"[^>]*aria-describedby="referenceSearchStatus"/,
  "search field is connected to its result status",
);
assert.match(
  html,
  /id="referenceSearchClear"[^>]*aria-label="Clear reference search"/,
  "search can be cleared without deleting text manually",
);
assert.match(
  html,
  /id="referenceSearchStatus"[^>]*role="status"[^>]*aria-live="polite"/,
  "result counts are announced politely",
);
assert.match(html, /referenceSearch\.addEventListener\("input"/, "results update while typing");
assert.match(
  html,
  /referenceSearch\.addEventListener\("keydown"/,
  "search supports keyboard clearing",
);
assert.match(
  html,
  /referenceItemMatches\(t, it, referenceSearchQuery\)/,
  "search filters TOPICS items",
);
assert.match(html, /buildFormulaCard\(t, it\)/, "results reuse the canonical insertion cards");

const normalizeSource = html.match(
  /function normalizeReferenceSearch\(value\) \{[\s\S]*?\n      \}/,
)?.[0];
const matchSource = html.match(
  /function referenceItemMatches\(topic, item, query\) \{[\s\S]*?\n      \}/,
)?.[0];
assert.ok(normalizeSource, "search normalization helper is defined");
assert.ok(matchSource, "reference matching helper is defined");

const context = {};
vm.runInNewContext(
  `${normalizeSource}; ${matchSource}; this.referenceItemMatches = referenceItemMatches;`,
  context,
);

const geometry = { name: "2-D Geometry" };
const circle = {
  name: "Area of a circle",
  eq: "A = πr²",
  note: "Multiply pi by the radius squared.",
};

assert.equal(context.referenceItemMatches(geometry, circle, "circle"), true, "matches a name");
assert.equal(
  context.referenceItemMatches(geometry, circle, "radius squared"),
  true,
  "matches a note",
);
assert.equal(
  context.referenceItemMatches(geometry, circle, "geometry"),
  true,
  "matches a category",
);
assert.equal(context.referenceItemMatches(geometry, circle, "πr²"), true, "matches an equation");
assert.equal(
  context.referenceItemMatches(geometry, circle, "circle radius"),
  true,
  "matches all words across fields",
);
assert.equal(
  context.referenceItemMatches(geometry, circle, "volume"),
  false,
  "rejects unrelated terms",
);

console.log("Math Workbench reference search: all assertions passed");

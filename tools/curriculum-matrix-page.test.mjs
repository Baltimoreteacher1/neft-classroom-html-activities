/* The matrix page: search ranking (pure) and the rendered grid, inspector and omnibar (jsdom). */
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";

// Plain browser script (the package is ESM, so load it the way a page does).
const sandbox = {};
new Function("window", `${fs.readFileSync("assets/curriculum-matrix-search.js", "utf8")}`).call(
  sandbox,
  sandbox,
);
const Search = sandbox.CurriculumMatrixSearch;
const matrix = JSON.parse(fs.readFileSync("data/curriculum/matrix.json", "utf8"));
const all = matrix.units.flatMap((u) => u.lessons);

assert.equal(Search.search(matrix, "6-3")[0].id, "6-3", "id match ranks first");
assert.equal(Search.search(matrix, "6.3")[0].id, "6-3", "dotted id works");
assert.ok(
  Search.search(matrix, "6-").every((l) => l.id.startsWith("6-")),
  "unit prefix",
);
assert.deepEqual(Search.search(matrix, ""), [], "empty query");
assert.deepEqual(Search.search(matrix, "zzzzqq"), [], "no match");
const std = all.find((l) => l.standards.length).standards[0];
assert.ok(
  Search.search(matrix, std).some((l) => l.standards.includes(std)),
  "standard code finds lessons",
);
const topic = all.find((l) => l.topics.length).topics[0];
assert.ok(Search.search(matrix, topic).length > 0, "topic search");
assert.ok(Search.search(matrix, "a").length <= 12, "capped");

const dom = new JSDOM(`<body><div id="matrix-root"></div></body>`, {
  url: "https://eduwonderlab.com/curriculum/matrix/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;
window.fetch = async () => ({ ok: true, json: async () => matrix });
window.eval(fs.readFileSync("assets/curriculum-matrix-search.js", "utf8"));
window.eval(fs.readFileSync("assets/curriculum-matrix.js", "utf8"));
await new Promise((r) => setTimeout(r, 20));
const doc = window.document;
assert.equal(doc.querySelectorAll(".mx-unit").length, 9, "9 units");
assert.equal(doc.querySelectorAll(".mx-cell").length, all.length, "every lesson has a cell");

doc.querySelector('.mx-cell[data-id="6-3"]').click();
const insp = doc.querySelector(".mx-inspector");
assert.equal(insp.hidden, false, "inspector opens");
assert.equal(window.location.pathname, "/curriculum/matrix/", "inspector does not navigate");
assert.ok(insp.querySelector('a[href="/math/lesson-path/6-3/"]'), "lesson path link");
assert.equal(doc.querySelector('.mx-cell[data-id="6-3"]').getAttribute("aria-pressed"), "true");
doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
assert.equal(insp.hidden, true, "Escape closes inspector");

doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
const omni = doc.querySelector(".mx-omni");
assert.equal(omni.hidden, false, "Ctrl+K opens omnibar");
const input = omni.querySelector("input");
input.value = "8-5";
input.dispatchEvent(new window.Event("input", { bubbles: true }));
assert.equal(omni.querySelector("[role=option]").dataset.id, "8-5");
input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
assert.equal(omni.hidden, true, "Enter closes omnibar");
assert.equal(insp.hidden, false, "Enter opens the lesson in the inspector");
assert.match(insp.textContent, /8-5/);
console.log(`curriculum-matrix-page: search + ${all.length} cells, inspector and omnibar OK.`);

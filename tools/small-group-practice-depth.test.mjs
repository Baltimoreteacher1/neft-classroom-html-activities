// Verifies the Phase A engine changes against REAL lesson configs.
import fs from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id=app></div></body></html>", {
  url: "https://eduwonderlab.com/lessons/6-13-group1/",
});
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.matchMedia =
  dom.window.matchMedia ||
  (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
dom.window.matchMedia = global.matchMedia;
global.localStorage = dom.window.localStorage;
global.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [] };
dom.window.speechSynthesis = global.speechSynthesis;

const { collectPracticeItems } = await import("@eduwonderlab/engine/core/small-group-practice.js");

const load = (id) => JSON.parse(fs.readFileSync(`lessons/${id}/config.json`, "utf8"));

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const summarize = (id) => {
  const items = collectPracticeItems(load(id));
  const types = {};
  for (const item of items) types[item.type || "?"] = (types[item.type || "?"] || 0) + 1;
  return { items, types, kinds: Object.keys(types).length };
};

for (const id of ["6-13-group1", "5-2-group1", "7-2-group1"]) {
  const { items, types, kinds } = summarize(id);
  check(
    `${id} gains format variety`,
    kinds >= 2,
    `${items.length} items, types=${JSON.stringify(types)}`,
  );
  check(`${id} still leads with guided-fill`, items[0]?.type === "guided-fill");
  check(
    `${id} every item carries a standard`,
    items.every((i) => i._standard),
  );
}

for (const id of ["6-12-catchup", "5-8-catchup"]) {
  const { items, types, kinds } = summarize(id);
  check(
    `${id} gains format variety`,
    kinds >= 2,
    `${items.length} items, types=${JSON.stringify(types)}`,
  );
}

// Level 2 must be untouched by the variety append (it has its own extending path).
// The expected count is DERIVED (parallel bank + authored extending), not a
// frozen number — a frozen 20 broke the moment a new extending item was
// authored, which is exactly the kind of churn a pin should not create.
for (const id of ["6-13-group2", "5-2-group2"]) {
  const { items, types } = summarize(id);
  const config = load(id);
  const expected =
    (config.parallelPractice?.length || 0) + (config.practice?.extending?.length || 0);
  check(`${id} keeps its extending append`, items.length === expected, `${items.length} items`);
  check(`${id} untouched by variety slice`, Object.keys(types).length >= 2, JSON.stringify(types));
}

// Save/Resume contract: _practiceIndex must stay dense and ordered.
const { items } = summarize("6-13-group1");
check(
  "practice indices stay dense + ordered",
  items.every((item, index) => item._practiceIndex === index),
);
// Appended items must not duplicate the guided-fill bank. Mirror the engine's
// own key (error-analysis items carry `title` instead of `stem`).
const keys = items.map((i) => i.stem || i.title || JSON.stringify(i).slice(0, 60));
const dupes = keys.filter((key, index) => keys.indexOf(key) !== index);
check("no duplicate items after append", dupes.length === 0, dupes.join(" | "));

// The exit ticket must actually render, and carry a second independent item.
const { createCheckSection } = await import("@eduwonderlab/engine/core/small-group-practice.js");
for (const id of ["6-13-group1", "6-13-group2", "6-12-catchup"]) {
  const memory = new Map();
  const store = { get: (k) => memory.get(k), set: (k, v) => memory.set(k, v) };
  const tally = { total: 0, solved: 0, update() {} };
  let section = null;
  let error = null;
  try {
    section = createCheckSection(load(id), () => {}, tally, {}, store);
  } catch (thrown) {
    error = thrown;
  }
  check(`${id} check section renders`, Boolean(section) && !error, error ? error.message : "");
  check(
    `${id} has a transfer item`,
    Boolean(section?.querySelector(".sg-check-transfer .choices")),
  );
  check(`${id} transfer does not add a completion gate`, tally.total === 1, `total=${tally.total}`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nall checks passed");
process.exit(failures ? 1 : 0);

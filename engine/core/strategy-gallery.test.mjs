// strategy-gallery.test.mjs — "Sample solutions", grouped by strategy.
//
// The gallery's whole premise is that it shows NO student's work: authored
// samples, labelled as such, with nothing read from or written to a server. The
// tests pin that, pin the deterministic strategy classifier against every
// authored solution, and pin the rule that a sample is never the student's own
// problem (it must not become a place to read the answer).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const { JSDOM } = await import("jsdom");
const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
  url: "https://eduwonderlab.com/lessons/2-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.localStorage = dom.window.localStorage;

const HERE = dirname(fileURLToPath(import.meta.url));
const { COMPARE_PROMPTS, STRATEGY_GROUPS, classifyStrategy, groupByStrategy, mountStrategyGallery, pickSample } =
  await import("./strategy-gallery.js");
const { SAMPLE_PROBLEMS } = await import("./strategy-gallery-samples.js");
const { resolveAlternativeStrategies } = await import("./small-group-strategies.js");

const ratio = { lessonId: "2-1", tryAnotherWay: { domain: "ratio" } };
// The order every sample problem is written in.
const WRITTEN_ORDER = ["visual", "calculate", "verbal"];

test("classifier: every authored solution lands in the strategy it was written to show", () => {
  let checked = 0;
  for (const [domain, problems] of Object.entries(SAMPLE_PROBLEMS)) {
    for (const problem of problems) {
      const got = problem.solutions.map((solution) => classifyStrategy(solution.en));
      assert.deepEqual(got, WRITTEN_ORDER, `${domain}/${problem.id}`);
      checked += problem.solutions.length;
    }
  }
  assert.ok(checked >= 18, `classified ${checked} solutions`);
});

test("classifier: student-style phrasing, ties, and no evidence", () => {
  assert.equal(classifyStrategy("I used a number line and jumped by tens"), "visual");
  assert.equal(classifyStrategy("I made a table of equal ratios"), "visual");
  assert.equal(classifyStrategy("I multiplied 4 × 3 = 12"), "calculate");
  assert.equal(classifyStrategy("I wrote an equation and solved it"), "calculate");
  assert.equal(classifyStrategy("I talked it through because both parts get bigger"), "verbal");
  assert.equal(classifyStrategy("It is 5 times as many, so it works"), "verbal");
  assert.equal(classifyStrategy("I drew a table and wrote 2 × 3 = 6"), "visual", "a tie goes to the model");
  assert.equal(classifyStrategy("ok"), null);
  assert.equal(classifyStrategy(""), null);
  assert.equal(classifyStrategy(undefined), null);
  // A hyphenated word is not subtraction.
  assert.equal(classifyStrategy("a well-known trick"), null);
});

test("grouping: teaching order, empty groups dropped, unclassifiable kept under Another approach", () => {
  const groups = groupByStrategy([
    { en: "I explained it in words." },
    { en: "I drew a table." },
    { en: "hmm" },
  ]);
  assert.deepEqual(
    groups.map((g) => g.id),
    ["visual", "verbal", "other"],
  );
  assert.equal(groups[2].solutions[0].en, "hmm");
  assert.deepEqual(groupByStrategy([]), []);
});

test("group ids are the categories the studio's Try Another Way already uses", () => {
  const categories = new Set();
  for (const domain of ["ratio", "percent", "equation", "statistics", "general"]) {
    const { strategies } = resolveAlternativeStrategies({ tryAnotherWay: { domain } }, {}, null);
    for (const strategy of strategies) categories.add(strategy.category);
  }
  assert.deepEqual([...categories].sort(), STRATEGY_GROUPS.map((g) => g.id).sort());
});

test("authored data: bilingual, three distinct strategies, and the arithmetic is right", () => {
  const sums = { "×": (a, b) => a * b, "÷": (a, b) => a / b, "+": (a, b) => a + b, "−": (a, b) => a - b };
  let verified = 0;
  for (const [domain, problems] of Object.entries(SAMPLE_PROBLEMS)) {
    for (const problem of problems) {
      assert.ok(problem.problem.en && problem.problem.es, `${problem.id} problem has both languages`);
      assert.equal(problem.solutions.length, 3, `${problem.id} shows three ways`);
      for (const { en, es } of problem.solutions) {
        assert.ok(en.length > 30 && es.length > 30, `${problem.id} has real text in both languages`);
        assert.notEqual(en, es, "Spanish is not the English copied over");
        assert.match(es, /[áéíóúñ¿]|\b(?:el|la|los|las|de|que|es|y)\b/i, "Spanish reads as Spanish");
        assert.doesNotMatch(`${en} ${es}`, /\b(?:timer|countdown|race|faster than)\b/i, "no speed language");
        for (const m of en.matchAll(/(?<![×÷+−]\s)(\d+(?:\.\d+)?) ([×÷+−]) (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?)(?!\d|\.\d|\/)/g)) {
          const [, a, op, b, c] = m;
          assert.ok(Math.abs(sums[op](Number(a), Number(b)) - Number(c)) < 1e-9, `${domain}/${problem.id}: ${m[0]}`);
          verified += 1;
        }
      }
    }
  }
  assert.ok(verified >= 7, `verified ${verified} equations`);
});

test("pickSample: a domain with no samples, and a problem too close to the student's own, show nothing", () => {
  assert.equal(pickSample({ tryAnotherWay: { domain: "general" } }), null, "no invented filler");
  assert.equal(pickSample({ tryAnotherWay: { domain: "geometry" } }), null);
  assert.ok(pickSample(ratio), "ratio has samples");
  // Same lesson + item -> same sample every time.
  assert.equal(pickSample(ratio, { stem: "x" }).id, pickSample(ratio, { stem: "x" }).id);

  const smoothie = pickSample(ratio, { stem: "3 cups of oats for every 2 cups of milk" });
  assert.equal(smoothie.id, "ratio-bike", "the smoothie shares 3 and 2 with the item, so the bike is used");
  const both = pickSample(ratio, { stem: "3 2 12 15 5", answer: "8" });
  assert.equal(both, null, "when every sample is the student's problem, show none");
});

test("mount: labelled Sample solutions, grouped by strategy, with the three comparison prompts", () => {
  document.body.innerHTML = "<div id='host'></div>";
  const host = document.getElementById("host");
  const root = mountStrategyGallery(host, { config: ratio, language: "en" });
  assert.equal(host.firstElementChild, root);
  assert.equal(root.tagName, "DETAILS");
  assert.equal(root.open, false, "opt-in: collapsed until the student opens it");
  const text = root.textContent;
  assert.match(text, /Sample solutions/);
  assert.match(text, /not your classmates' work/i);
  assert.doesNotMatch(text, /how (?:your )?classmates solved|your classmates solved it/i, "never claims student work");
  assert.deepEqual(
    [...root.querySelectorAll(".sgal-card")].map((c) => c.dataset.strategy),
    WRITTEN_ORDER,
  );
  for (const prompt of COMPARE_PROMPTS) assert.ok(text.includes(prompt.en), prompt.en);
  assert.ok(text.includes("¿Qué es igual?"), "Spanish sibling for the prompts");
  assert.ok(root.querySelector("[lang='es']"), "Spanish lines are marked lang=es");
});

test("mount: a Spanish student sees Spanish first", () => {
  document.body.innerHTML = "<div id='host'></div>";
  const root = mountStrategyGallery(document.getElementById("host"), { config: ratio, language: "es" });
  assert.match(root.querySelector("summary").textContent, /^Ver soluciones de ejemplo/);
  assert.match(root.textContent, /Soluciones de ejemplo/);
  assert.match(root.querySelector(".sgal-problem").textContent, /^Otro problema, resuelto de tres maneras/);
});

test("mount: nothing for a lesson without samples; nothing is left in the page", () => {
  document.body.innerHTML = "<div id='host'></div>";
  const host = document.getElementById("host");
  assert.equal(mountStrategyGallery(host, { config: { tryAnotherWay: { domain: "general" } } }), null);
  assert.equal(host.childElementCount, 0);
  assert.equal(mountStrategyGallery(null, { config: ratio }), null);
});

test("privacy: the gallery makes no request and writes to no storage", () => {
  let touched = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => {
    touched += 1;
    throw new Error("the gallery must not use the network");
  };
  const setItem = dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.setItem = () => {
    touched += 1;
  };
  try {
    document.body.innerHTML = "<div id='host'></div>";
    const root = mountStrategyGallery(document.getElementById("host"), { config: ratio });
    root.open = true;
    root.querySelector("summary").click();
  } finally {
    globalThis.fetch = realFetch;
    dom.window.Storage.prototype.setItem = setItem;
  }
  assert.equal(touched, 0);
  const code = readFileSync(join(HERE, "strategy-gallery.js"), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  assert.doesNotMatch(code, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(code, /api\/progress|exemplars/, "the unauthenticated student-work route is not used");
});

test("accessibility: native disclosure, 44px summary, focus ring, reduced-motion safe", () => {
  document.body.innerHTML = "<div id='host'></div>";
  mountStrategyGallery(document.getElementById("host"), { config: ratio });
  const css = document.getElementById("sgal-styles").textContent;
  assert.match(css, /\.sgal>summary\{[^}]*min-height:44px/);
  assert.match(css, /\.sgal>summary:focus-visible\{outline:3px/);
  assert.doesNotMatch(css, /animation|transition/, "no motion at all");
  assert.equal(document.querySelector(".sgal > summary").tagName, "SUMMARY");
});

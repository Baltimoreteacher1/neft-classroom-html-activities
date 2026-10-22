// Help from a model, solver, drawer or column board before the first answer is never counted as independent; a
// checkup offers no solver or drawer; a power of ten never opens the multiplication board; and a division that is
// split into tens and ones does not show the split before the learner answers.
// Run: node tools/fluency-help-evidence.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

// The page is built first: the column board registers its listener when its module loads.
const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=4&skill=add-large",
  pretendToBeVisual: true,
});
const win = dom.window;
win.HTMLElement.prototype.scrollIntoView = () => {};
win.print = () => {};
for (const [key, value] of Object.entries({
  window: win,
  document: win.document,
  location: win.location,
  history: win.history,
  localStorage: win.localStorage,
  CustomEvent: win.CustomEvent,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
await import("../math/fluency-lab/app.js");
const { ALL_SKILLS, generateProblem, seededRandom } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { plainProduct } = await import("../math/fluency-lab/problem-numbers.js");
const { leakCap, peekCap } = await import("../math/fluency-lab/step-leak.js");

// 1. Powers of ten are not plain products; plain products are.
assert.equal(plainProduct("3 × 10^2 = ?"), null);
assert.equal(plainProduct("3 × 10^-2 = ?"), null);
assert.equal(plainProduct("3.5 × 10 = ?"), null);
assert.deepEqual(plainProduct("47 × 12 = ?"), [47, 12]);
const powerSkill = ALL_SKILLS.find((skill) => skill.id === "powers-ten");
let powers = 0;
for (let seed = 1; seed <= 300; seed += 1) {
  const item = generateProblem(powerSkill, seededRandom(seed));
  if (/\^/.test(item.question)) {
    powers += 1;
    assert.equal(
      plainProduct(item.question),
      null,
      `a power must not open the product board: ${item.question}`,
    );
  }
}
assert.ok(powers > 20, "the sample includes powers of ten");

// 2. Division: the framing step may show; the tens-and-ones split may not. The generator's own test is unchanged.
const division = ALL_SKILLS.filter((skill) => ["division", "divide-whole"].includes(skill.id));
let splits = 0;
for (const skill of division)
  for (let seed = 1; seed <= 200; seed += 1) {
    const item = generateProblem(skill, seededRandom(seed * 31));
    assert.ok(leakCap(item) >= peekCap(item), "the display cap is never looser than the leak test");
    if (/^[\d,]+ × \? = /.test(item.steps[0]) && item.steps.length > 2) {
      splits += 1;
      assert.ok(
        peekCap(item) <= 1,
        `only the framing step may show: ${item.question} | ${item.steps.join(" / ")}`,
      );
    }
  }
assert.ok(splits > 30, `the sample includes split divisions (${splits})`);

const $ = (selector) => win.document.querySelector(selector);
const session = () => JSON.parse(win.localStorage.getItem("ewl-fluency-session-v2"));

const answerNow = () => {
  $("#answer-input").value = String(session().item.answers[0]);
  $("#answer-form").dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
};
const withoutHelp = () => Number($("#session-accuracy").textContent.match(/(\d+) without help/)[1]);

// Control: a first-try right answer with no help counts as independent.
$("[data-start-independent]").click();
answerNow();
assert.equal(withoutHelp(), 1, "a right first answer with no help is independent");
$("#next-problem").click();

// Opening the solver before answering is help: the right answer still counts as solved, but not as independent.
$("#toggle-interactive-solver").click();
assert.equal(
  session().hintBeforeFirst,
  true,
  "opening the solver before answering is recorded as help",
);
answerNow();
assert.equal(withoutHelp(), 1, "a solver-assisted answer does not add to 'without help'");
$("#next-problem").click();

// A missed column box in the model panel is help too (ones place, a digit that is certainly wrong).
const cells = [...win.document.querySelectorAll("#problem-visual-scaffold .vc-result")];
assert.ok(cells.length, "the model panel shows the column board for add-large");
const ones = cells[cells.length - 1];
const rightDigit = Number(String(session().item.answers[0]).slice(-1));
ones.value = String((rightDigit + 1) % 10);
ones.dispatchEvent(new win.Event("input", { bubbles: true }));
assert.equal(session().hintBeforeFirst, true, "a missed column box is recorded as help");

console.log("fluency-help-evidence: powers, division split, and help-before-answer pinned");
process.exit(0);

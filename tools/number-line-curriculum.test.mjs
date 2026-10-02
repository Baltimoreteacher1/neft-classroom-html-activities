import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { listLessonDirs, loadLessonConfig } from "./lib/curriculum-source.mjs";

const tasks = [];
function visit(node, id, path = "") {
  if (!node || typeof node !== "object") return;
  if (node.type === "number-line" && Array.isArray(node.targets))
    tasks.push({ id, path, task: node });
  for (const [key, child] of Object.entries(node)) visit(child, id, `${path}.${key}`);
}
for (const id of listLessonDirs({ filter: /^[2-9]-\d+(?:-.+)?$/ })) visit(loadLessonConfig(id), id);
let checked = 0;
for (const { id, path, task } of tasks) {
  if (!task.snapToTick || task.sequential) continue;
  assert.ok(Number.isFinite(task.step) && task.step > 0, `${id}${path}: invalid step`);
  for (const target of task.targets) {
    assert.ok(
      target.value >= task.min && target.value <= task.max,
      `${id}${path}: target outside line`,
    );
    const reachable = Math.round(target.value / task.step) * task.step;
    assert.ok(
      Math.abs(reachable - target.value) <= task.step * 0.4 + 1e-9,
      `${id}${path}: ${target.value} cannot be reached with step ${task.step}`,
    );
    checked++;
  }
}
assert.ok(
  tasks.length >= 60 && checked >= 100,
  "Number-line fleet check must exercise actual authored tasks.",
);
const meanTask = loadLessonConfig("2-10").practice.onLevel.find(
  (item) => item.type === "number-line",
);
const data = meanTask.label
  .match(/^Data: ([\d, ]+)\./)[1]
  .split(",")
  .map(Number);
const mean = data.reduce((sum, n) => sum + n, 0) / data.length;
assert.equal(
  meanTask.targets.find((target) => /mean/i.test(target.label)).value,
  mean,
  "The plotted mean must match the supplied data, not the nearest large tick.",
);

const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
  url: "https://eduwonderlab.com/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
window.matchMedia = () => ({ matches: true }); // no decorative animation in assertions
const { renderNumberLine } = await import("@eduwonderlab/engine/components/number-line.js");
const host = document.querySelector("main");
let completed = false;
const fractionTask = loadLessonConfig("4-2").practice.onLevel.find(
  (item) => item.type === "number-line",
);
renderNumberLine(host, {
  ...fractionTask,
  onComplete: () => {
    completed = true;
  },
});
const sliders = [...host.querySelectorAll('[role="slider"]')];
assert.equal(sliders.length, fractionTask.targets.length);
for (const [i, slider] of sliders.entries()) {
  const target = fractionTask.targets[i].value;
  for (
    let moves = 0;
    moves < 100 && Math.abs(Number(slider.getAttribute("aria-valuenow")) - target) > 1e-8;
    moves++
  ) {
    slider.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: Number(slider.getAttribute("aria-valuenow")) < target ? "ArrowRight" : "ArrowLeft",
        bubbles: true,
      }),
    );
  }
  assert.equal(
    Number(slider.getAttribute("aria-valuenow")),
    target,
    "Keyboard must reach every fraction target.",
  );
}
assert.equal(sliders[0].getAttribute("aria-valuetext"), "0.375", "Do not announce 3/8 as 0.38.");
assert.ok(sliders[0].textContent.includes("0.375"), "Visible value must preserve thousandths too.");
host.querySelector("button").click();
assert.ok(completed, "A fully correct keyboard response must be graded complete.");
assert.doesNotMatch(
  host.textContent,
  /each mark is one unit/i,
  "Feedback must not misdescribe fractional ticks.",
);
dom.window.close();
console.log(
  `Number lines: ${tasks.length} tasks, ${checked} snap targets, exact mean, keyboard completion and thousandths display verified.`,
);

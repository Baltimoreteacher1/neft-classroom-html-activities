import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=4&skill=division",
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
const $ = (selector) => win.document.querySelector(selector);
const click = (selector) => {
  assert.ok($(selector), `Missing ${selector}`);
  $(selector).click();
};
const fill = (selector, value) => {
  $(selector).value = String(value);
};
const submit = (selector) =>
  $(selector).dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const savedTutor = () => JSON.parse(win.localStorage.getItem("ewl-fluency-tutor-v2") || "{}");
const savedSession = () => JSON.parse(win.localStorage.getItem("ewl-fluency-session-v2") || "null");
const solveCurrent = () => {
  const item = savedSession().item;
  if (item.choices)
    [...win.document.querySelectorAll("[data-answer]")]
      .find((button) => button.dataset.answer === item.answers[0])
      .click();
  else {
    fill("#answer-input", item.answers[0]);
    submit("#answer-form");
  }
};

assert.equal(
  $("#workspace-title").textContent,
  "Whole-number division",
  "A deep link opens its requested skill",
);
click('[data-mode="visual"]');
assert.match($("#visual-panel").textContent, /360 ÷ 6/);
fill("#visual-answer", 999);
submit("[data-visual-form]");
assert.match($(".visual-feedback").textContent, /Try this/);
for (const answer of [60, 4, 64]) {
  fill("#visual-answer", answer);
  submit("[data-visual-form]");
  click("[data-visual-next]");
}
assert.equal(savedTutor().records["4:division"].lessonCompleted, true);
click("[data-visual-practice]");
assert.equal(savedSession().session.mode, "adaptive");
const originalQuestion = $("#question").textContent;
submit("#answer-form");
assert.equal(savedSession().itemAttempts, 0, "Empty input does not spend an attempt");
fill("#answer-input", -999);
submit("#answer-form");
assert.equal(savedTutor().mistakes.length, 1, "First mistakes enter the notebook");
click("#back-library");
assert.ok($("[data-resume-practice]"), "Leaving practice exposes a resume action");
click("[data-resume-practice]");
assert.equal($("#question").textContent, originalQuestion, "Resume preserves the problem");
assert.equal(savedSession().itemAttempts, 1, "Resume preserves used attempts");
solveCurrent();
let record = savedTutor().records["4:division"];
assert.equal(
  record.recent.at(-1).correct,
  false,
  "A corrected answer does not become first-try success",
);
assert.equal(
  record.recent.at(-1).independent,
  true,
  "The initial independent miss remains evidence",
);
click("#next-problem");
fill("#answer-input", -999);
submit("#answer-form");
fill("#answer-input", -999);
submit("#answer-form");
click("#next-problem");
assert.equal($("#guided-coach").hidden, false, "Two misses produce coached support");
for (let i = 0; i < 2; i++) {
  solveCurrent();
  click("#next-problem");
}
assert.equal($("#guided-coach").hidden, true, "Two supported successes fade the coach");
click("#show-hint");
solveCurrent();
record = savedTutor().records["4:division"];
assert.equal(
  record.recent.at(-1).independent,
  false,
  "A pre-answer hint cannot inflate independent mastery",
);

click("#back-library");
const priorRecent = savedTutor().records["4:division"].recent.length;
click("#add-profile");
assert.equal($("#profile-select").value, "1");
assert.equal(
  $("#overall-stats strong").textContent,
  "0",
  "New learner starts with separate progress",
);
fill("#profile-select", "0");
$("#profile-select").dispatchEvent(new win.Event("change", { bubbles: true }));
assert.equal(
  savedTutor().records["4:division"].recent.length,
  priorRecent,
  "Switching profiles preserves previous progress",
);

click('[data-view="teacher"]');
fill("#assignment-label", "Division <Club>");
fill("#assignment-count", "5");
$('[name="assignment-skill"][value="4:division"]').checked = true;
submit("#assignment-builder");
assert.equal($("#assignment-result h3").textContent, "Division <Club>");
assert.ok($("#assignment-link").value.includes("#assignment="));
assert.equal($("#assignment-result Club"), null, "Assignment text is not HTML");
click("[data-launch-assignment]");
assert.equal(savedSession().session.mode, "assignment");
for (let i = 0; i < 5; i++) {
  solveCurrent();
  click("#next-problem");
}
assert.equal($("#session-summary").hidden, false, "Assignments reach a real completion state");
assert.equal(savedSession(), null, "Completed sessions do not remain resumable");
click('[data-view="library"]');
click('[data-skill="division"]');
assert.equal($("label[for='mastery-meter']").textContent, "Recent independent accuracy");
assert.match($("#mastery-label").textContent, /of \d+ recent checks correct/);

click('[data-view="library"]');
const recordsBefore = JSON.stringify(savedTutor().records);
click("[data-start-checkup]");
for (let i = 0; i < 10; i++) {
  click("#skip-checkup");
  click("#next-problem");
}
assert.equal(
  Object.keys(savedTutor().diagnostics[4].results).length,
  10,
  "Checkup records every skill once",
);
assert.equal(JSON.stringify(savedTutor().records), recordsBefore, "Checkups do not award mastery");
assert.match($("#summary-title").textContent, /starting-point/);

click('[data-view="notebook"]');
click('[data-repair-key="4:division"]');
for (let i = 0; i < 6; i++) {
  solveCurrent();
  click("#next-problem");
}
assert.ok(
  savedTutor()
    .mistakes.filter((entry) => entry.key === "4:division")
    .every((entry) => entry.resolvedAt),
  "Fresh independent success repairs notebook entries",
);
click('[data-view="path"]');
assert.equal(win.document.querySelectorAll(".path-skill").length, 10);
assert.match($("#path-view").textContent, /two different days/);

click('[data-view="library"]');
click("[data-start-daily]");
assert.equal(savedSession().session.queue.length, 10);
assert.ok(new Set(savedSession().session.queue.map((entry) => entry.key)).size >= 2);
click("#back-library");
win.close();
console.log(
  "Fluency UI: deep links, visual lessons, wrong-answer recovery, resume, adaptive support, profile isolation, teacher assignments, checkups, repair, and daily plans passed.",
);

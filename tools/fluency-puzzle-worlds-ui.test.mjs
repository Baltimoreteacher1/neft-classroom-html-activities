import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { worldLevel } from "../math/fluency-lab/puzzle-worlds.js";

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 4), ...rest);
const wait = (ms = 12) => new Promise((resolve) => realSetTimeout(resolve, ms));
const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=6&view=games",
  pretendToBeVisual: true,
});
const win = dom.window;
win.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 4), ...rest);
win.HTMLElement.prototype.scrollIntoView = () => {};
for (const [key, value] of Object.entries({
  window: win,
  document: win.document,
  location: win.location,
  history: win.history,
  localStorage: win.localStorage,
  CustomEvent: win.CustomEvent,
  Event: win.Event,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
await import("../math/fluency-lab/app.js");

const $ = (selector) => win.document.querySelector(selector);
const click = (selector) => {
  assert.ok($(selector), `Missing control ${selector}`);
  $(selector).click();
};
const set = (selector, value) => {
  const input = $(selector);
  assert.ok(input, `Missing input ${selector}`);
  input.value = String(value);
  input.dispatchEvent(new win.Event("input", { bubbles: true }));
};
const setAll = (selector, value) =>
  [...win.document.querySelectorAll(selector)].forEach((input) => {
    input.value = String(value);
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
  });
await wait();
assert.ok($(".gm-menu"), "Grade 6 opens the Game Room");
for (const id of [
  "equationfactory",
  "fractionbridge",
  "balancestation",
  "ratiocity",
  "decimaldashboards",
  "integerexpedition",
])
  assert.ok($(`[data-game="${id}"]`), `${id} is available to Grade 6`);

for (const id of [
  "equationfactory",
  "fractionbridge",
  "balancestation",
  "ratiocity",
  "decimaldashboards",
  "integerexpedition",
]) {
  click(`[data-game="${id}"]`);
  await wait();
  for (let round = 0; round < 5; round += 1) {
    const level = worldLevel(id, 6, round);
    if (id === "fractionbridge" && round === 0) {
      click("[data-pw-pause]");
      assert.equal(
        $("[data-pw-pause]").getAttribute("aria-pressed"),
        "true",
        "Model motion can be paused",
      );
      click("[data-pw-pause]");
      assert.equal(
        $("[data-pw-pause]").getAttribute("aria-pressed"),
        "false",
        "Model motion can resume",
      );
      click("[data-pw-replay]");
      assert.ok(
        $(".pw-scene").classList.contains("pw-replay"),
        "Replay animates the displayed model",
      );
      set('[name="pw-num1"]', 4);
      click("[data-pw-reset]");
      assert.equal($('[name="pw-num1"]').value, "1", "Reset restores the stage's starting model");
    }
    if (id === "equationfactory" && round === 0) {
      set('[name="pw-answer"]', 1);
      click("[data-pw-check]");
      assert.equal(
        $("[data-pw-feedback]").dataset.state,
        "retry",
        "A failed machine attempt gets revision feedback",
      );
      click("[data-pw-hint]");
      assert.equal($("[data-pw-hint-copy]").hidden, false, "A learner can reveal an optional hint");
      click("[data-pw-reset]");
      assert.equal($("[data-pw-hint-copy]").hidden, true, "Reset clears the displayed hint");
    }
    if (level.mode === "input") set('[name="pw-answer"]', level.answer);
    if (id === "integerexpedition")
      assert.equal(
        $(`[data-integer-value="${level.answer}"]`).dataset.current,
        "true",
        "the learner's number-line value appears on the live model",
      );
    if (level.mode === "choice") {
      const radio = $(`[name="pw-choice"][value="${level.answer}"]`);
      assert.ok(radio, `${id} stage ${round + 1} has its generated answer choice`);
      radio.checked = true;
      radio.dispatchEvent(new win.Event("change", { bubbles: true }));
    }
    if (level.mode === "fraction-single") {
      set('[name="pw-num"]', level.answer[0]);
      set('[name="pw-den"]', level.answer[1]);
    }
    if (level.mode === "fraction-pair") {
      set('[name="pw-num1"]', level.answer[0][0]);
      set('[name="pw-den1"]', level.answer[0][1]);
      set('[name="pw-num2"]', level.answer[1][0]);
      set('[name="pw-den2"]', level.answer[1][1]);
    }
    if (level.mode === "decimal") set('[name="pw-answer"]', level.answer);
    if (level.mode === "coordinate") {
      set('[name="pw-x"]', level.answer[0]);
      set('[name="pw-y"]', level.answer[1]);
    }
    if (level.mode === "harbor") setAll('[name="pw-dock"]', level.answer);
    click("[data-pw-check]");
    assert.equal(
      $("[data-pw-feedback]").dataset.state,
      "right",
      `${id} stage ${round + 1} accepts the mathematical solution`,
    );
    if (round < 4) await wait();
  }
  await wait();
  assert.ok($(".gm-result"), `${id} finishes and returns a result`);
  if (id === "equationfactory")
    assert.match(
      $(".tr-score").textContent,
      /4 of 5 stages solved independently/,
      "Hinted/reset work remains supported rather than inflating independent evidence",
    );
  click("[data-gm-menu]");
  await wait();
}

const chooseGrade = async (grade) => {
  click(`#grade-tabs [data-grade="${grade}"]`);
  await wait();
  assert.ok($(".gm-menu"), `Grade ${grade} Game Room is available`);
};
await chooseGrade(4);
assert.ok($('[data-game="divisionharbor"]'), "Division Harbor is available in Grades 3–5");
click('[data-game="divisionharbor"]');
await wait();
for (let round = 0; round < 5; round += 1) {
  const level = worldLevel("divisionharbor", 4, round);
  setAll('[name="pw-dock"]', level.answer);
  click("[data-pw-check]");
  assert.equal(
    $("[data-pw-feedback]").dataset.state,
    "right",
    `Division Harbor round ${round + 1} accepts equal shares`,
  );
  if (round < 4) await wait();
}
await wait();
assert.ok($(".gm-result"), "Division Harbor completes its five-stage cargo run");
click("[data-gm-menu]");
await wait();

await chooseGrade(8);
assert.ok($('[data-game="graphcity"]'), "Graph City is available in Grades 7–8");
click('[data-game="graphcity"]');
await wait();
for (let round = 0; round < 5; round += 1) {
  const level = worldLevel("graphcity", 8, round);
  set('[name="pw-x"]', level.answer[0]);
  set('[name="pw-y"]', level.answer[1]);
  assert.equal(
    $(".pw-graph-point").hidden,
    false,
    "coordinate edits plot a point on the live graph",
  );
  click("[data-pw-check]");
  assert.equal(
    $("[data-pw-feedback]").dataset.state,
    "right",
    `Graph City round ${round + 1} validates the plotted point`,
  );
  if (round < 4) await wait();
}
await wait();
assert.ok($(".gm-result"), "Graph City completes its five-stage route");
click("[data-gm-menu]");
await wait();

await chooseGrade(0);
assert.ok($('[data-game="tenframefactory"]'), "Ten-Frame Factory is available to Kindergarten");
assert.ok($('[data-game="numberquest"]'), "Number Garden is available to Kindergarten");
click('[data-game="tenframefactory"]');
await wait();
for (let round = 0; round < 5; round += 1) {
  const level = worldLevel("tenframefactory", 0, round);
  const buttons = [...win.document.querySelectorAll("[data-frame-counter]")];
  for (let i = level.model.filled; i < level.answer; i += 1) buttons[i].click();
  click("[data-pw-check]");
  assert.equal(
    $("[data-pw-feedback]").dataset.state,
    "right",
    `Ten-Frame Factory round ${round + 1} checks the built quantity`,
  );
  if (round < 4) await wait();
}
await wait();
assert.ok($(".gm-result"), "Ten-Frame Factory completes its five-stage build");
click("[data-gm-menu]");
await wait();
click('[data-game="numberquest"]');
await wait();
for (let round = 0; round < 5; round += 1) {
  const target = Number($("[data-target-number]").dataset.targetNumber);
  set("[data-number-position]", target);
  click("[data-check]");
  assert.match(
    $("[data-feedback]").textContent,
    /planted|matches the quantity/i,
    `Number Garden round ${round + 1} checks an exact Kindergarten quantity`,
  );
  if (round < 4) await wait();
}
await wait();
assert.ok($(".gm-result"), "Number Garden completes its five-stage seed placement");
click("[data-gm-menu]");
await wait();

await chooseGrade(6);
click("#lang-toggle");
await wait();
click('[data-game="fractionbridge"]');
await wait();
assert.match(
  $(".pw-head h2").textContent,
  /Puente de fracciones/,
  "Puzzle world names are available in Spanish",
);
assert.match(
  $(".pw-prompt").textContent,
  /Une dos segmentos/,
  "Puzzle world directions are available in Spanish",
);
assert.match(
  $(".pw-built-track").getAttribute("aria-label"),
  /Piezas/,
  "The live bridge model remains localized",
);

const rewardsKey = Object.keys(win.localStorage).find((key) =>
  key.includes("ewl-fluency-rewards-v1"),
);
const rewards = JSON.parse(win.localStorage.getItem(rewardsKey));
for (const id of [
  "equationfactory",
  "fractionbridge",
  "balancestation",
  "ratiocity",
  "decimaldashboards",
  "integerexpedition",
  "divisionharbor",
  "graphcity",
  "tenframefactory",
  "numberquest",
])
  assert.ok(
    rewards.best[id] >= 1,
    `${id} saves its earned result; recorded: ${JSON.stringify(rewards.best)}`,
  );
const tutorKey = Object.keys(win.localStorage).find((key) => key.includes("ewl-fluency-tutor-v2"));
const tutor = JSON.parse(win.localStorage.getItem(tutorKey));
const evidence = Object.values(tutor.records).flatMap((record) => record.recent || []);
assert.ok(
  evidence.some((entry) => entry.correct === false && entry.independent),
  "An unsupported error is recorded separately",
);
assert.ok(
  evidence.some((entry) => entry.correct === true && !entry.independent),
  "A hinted revision is not independent mastery evidence",
);
console.log(
  "fluency-puzzle-worlds-ui: all nine puzzle worlds, model controls, revisions, hints, progression, rewards, and local evidence passed",
);
process.exit(0);

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><main id='app'></main>", {
  url: "https://thelanguagepage.com/access-practice-lab/reality",
});
for (const key of [
  "window",
  "document",
  "location",
  "localStorage",
  "navigator",
  "HTMLElement",
  "Node",
  "MutationObserver",
])
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
    writable: true,
  });
const reality = await import("../access-practice-lab/src/views/reality.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { REALITY_STORAGE_KEY } = await import("../access-practice-lab/src/reality-engine.js");
const ctx = {
  band: "3-5",
  bands: ["3-5", "6-8"],
  prefs: { lang: "en" },
  route: { id: "" },
  rerender() {},
};
const root = document.querySelector("#app");
async function render() {
  root.innerHTML = toHtml((await reality.render(ctx)).html);
}
function click(selector) {
  const target = root.querySelector(selector);
  assert.ok(target, selector);
  reality.onClick({ target }, ctx);
}
function input(key, value) {
  const target = root.querySelector(`[data-sb-field="${key}"]`);
  target.value = value;
  reality.onInput({ target }, ctx);
}

test("branching story preview follows the author's choices and restores safely", async () => {
  localStorage.clear();
  await render();
  click('[data-reality-tab="story-builder"]');
  await render();
  assert.equal(root.querySelector('[data-sb-path="A"]').disabled, true);
  input("sequence1", "The garden needed water.");
  assert.equal(
    root.querySelector('[data-sb-preview="sequence1"]').textContent,
    "The garden needed water.",
  );
  input("choiceA", "Check the tank");
  input("sceneTitleA", "The tank room");
  input("scenePlaceA", "Greenhouse");
  input("sceneObjectA", "Water gauge");
  input("outcomeA", "The tank is empty.");
  input("choiceB", "Inspect the pipe");
  input("sceneTitleB", "Under the sink");
  input("scenePlaceB", "Workshop");
  input("outcomeB", "A loose joint is leaking.");
  click('[data-sb-path="A"]');
  assert.equal(root.querySelector("[data-sb-scene]").hidden, false);
  assert.equal(root.querySelector("[data-sb-scene-title]").textContent, "The tank room");
  assert.equal(root.querySelector("[data-sb-scene-place]").textContent, "Place: Greenhouse");
  assert.equal(root.querySelector("[data-sb-scene-object]").textContent, "Object: Water gauge");
  assert.equal(root.querySelector("[data-sb-path-result]").textContent, "The tank is empty.");
  click('[data-sb-path="B"]');
  assert.equal(root.querySelector("[data-sb-scene-title]").textContent, "Under the sink");
  assert.equal(root.querySelector("[data-sb-scene-object]").textContent, "");
  assert.equal(
    root.querySelector("[data-sb-path-result]").textContent,
    "A loose joint is leaking.",
  );
  click("[data-sb-publish]");
  const saved = JSON.parse(localStorage.getItem(REALITY_STORAGE_KEY));
  assert.equal(saved.storyBuilder.outcomeA, "The tank is empty.");
  const entry = JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger")).entries.at(-1);
  assert.equal(entry.stage, "guided");
  assert.deepEqual(entry.m, {}, "saving a template does not invent writing scores");
  await render();
  assert.equal(root.querySelector('[data-sb-field="choiceB"]').value, "Inspect the pipe");
  assert.equal(root.querySelector('[data-sb-field="sceneTitleB"]').value, "Under the sink");
  click('[data-sb-path="B"]');
  assert.equal(
    root.querySelector("[data-sb-path-result]").textContent,
    "A loose joint is leaking.",
  );
  input("outcomeB", "<img src=x onerror=alert(1)>");
  click('[data-sb-path="B"]');
  assert.equal(
    root.querySelector("[data-sb-path-result]").querySelector("img"),
    null,
    "authored text is not HTML",
  );
  assert.equal(root.querySelector("[data-sb-saved]"), null, "edits clear the saved confirmation");
});

test("older saved story remains readable without scene metadata", async () => {
  localStorage.setItem(
    REALITY_STORAGE_KEY,
    JSON.stringify({ storyBuilder: { choiceA: "Open it", outcomeA: "A map appears." } }),
  );
  await render();
  click('[data-sb-path="A"]');
  assert.equal(root.querySelector("[data-sb-scene-title]").textContent, "Path A");
  assert.equal(root.querySelector("[data-sb-path-result]").textContent, "A map appears.");
  assert.ok(root.querySelector('[data-sb-preview="resolution"]').textContent);
});

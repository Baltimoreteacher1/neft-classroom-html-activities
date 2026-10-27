import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { evaluateHiveExpression, hiveTilesFor, personalGhostScore, playPersonalGhost, playStrategyMatch, strategyMatchPairs } from "./strategy-games.js";

assert.equal(evaluateHiveExpression("2 + 2", [2, 2, 5, 1], 4).ok, true);
assert.equal(evaluateHiveExpression("5 − 1", [2, 2, 5, 1], 4).ok, true);
assert.equal(evaluateHiveExpression("(5 - 1) / 2", [2, 2, 5, 1], 2).ok, true);
assert.equal(evaluateHiveExpression("2 + 2 + 2", [2, 2, 5, 1], 6).reason, "tiles");
assert.equal(evaluateHiveExpression("2 / 0", [2, 2, 5, 1], 2).reason, "syntax");
assert.equal(evaluateHiveExpression("alert(1)", [2, 2, 5, 1], 2).reason, "syntax");
for (const target of [-12, -1, 0, 1, 2, 3, 4, 20, 2.5]) {
  const tiles = hiveTilesFor(target);
  assert.equal(tiles.length, 4);
  const combos = target === 0 ? [[tiles[0], "+", tiles[1]], [tiles[2], "+", tiles[3]]]
    : [[tiles[0], "+", tiles[1]], [tiles[2], "-", tiles[3]]];
  for (const [a, op, b] of combos) assert.equal(evaluateHiveExpression(`${a} ${op} ${b}`, tiles, target).ok, true);
}
assert.equal(personalGhostScore(8, 10, 60), 6.4);
assert.ok(personalGhostScore(8, 10, 30) > personalGhostScore(8, 10, 60));
assert.ok(personalGhostScore(10, 10, 60) > personalGhostScore(8, 10, 60));
assert.equal(personalGhostScore(0, 0, 20), 0);

assert.deepEqual(strategyMatchPairs([
  { question: "2 × 3 = ?", answers: [6] },
  { question: "4 + 5 = ?", answers: [9] },
  { question: "1/3 + 1/6 = ?", answers: ["1/2"] },
]).map((pair) => pair.modelKind), ["array", "numberline", "fraction"]);

const dom = new JSDOM("<div id='root'></div>", { url: "https://example.test/", pretendToBeVisual: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: dom.window.localStorage, configurable: true });
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
const root = dom.window.document.querySelector("#root");
let finishResult = null; let factCount = 0; const evidence = [];
playStrategyMatch(root, { grade: 3, stop: "all", finish: (result) => { finishResult = result; }, onFact: () => { factCount += 1; }, onEvidence: (item) => evidence.push(item) });
const cards = () => [...root.querySelectorAll(".gm-match-card")];
cards()[0].click();
assert.ok(cards()[0].querySelector(".gm-match-expression"));
cards()[4].click();
assert.equal(cards()[4].getAttribute("aria-pressed"), "true", "Both mismatched cards stay revealed for review");
root.querySelector(".gm-play button.outline-action")?.click();
for (const [expressionIndex, modelIndex] of [[0, 3], [1, 4], [2, 5]]) {
  cards()[expressionIndex].click();
  cards()[modelIndex].click();
}
assert.equal(factCount, 3);
assert.equal(evidence.length, 4);
assert.equal(finishResult?.stars, 2, "The untimed game completes with a calm badge after one mismatch");
const ghostEvidence = [];
let ghostFinish = null;
playPersonalGhost(root, {
  grade: 3,
  stop: "all",
  finish: (result) => { ghostFinish = result; },
  onEvidence: (item) => ghostEvidence.push(item),
});
assert.match(root.textContent, /10 cards · untimed/);
assert.doesNotMatch(root.textContent, /60-second|Zen Mode|Time left|countdown/i);
root.querySelector(".gm-ghost-sprint .tr-go").click();
assert.match(root.textContent, /Card 1 of 10/);
for (let index = 0; index < 10; index += 1) root.querySelectorAll(".gm-ghost-sprint button.outline-action")[1].click();
assert.equal(ghostEvidence.length, 10, "Skipped personal cards still count as attempts");
assert.ok(ghostFinish, "The personal ghost completes after exactly ten cards");
dom.window.close();
delete globalThis.document; delete globalThis.localStorage; delete globalThis.window;
console.log("strategy games: safe hive arithmetic, accuracy-adjusted pace, and expression/model matching passed");

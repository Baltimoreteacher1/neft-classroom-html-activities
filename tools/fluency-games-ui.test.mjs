// Plays every Game Room game end to end in jsdom, answering from the visible problems, to catch UI breakage
// that the data-level test cannot see: wiring, focus, result screens, stickers, and the way back to the menu.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 4), ...rest);
const wait = (ms = 15) => new Promise((resolve) => realSetTimeout(resolve, ms));

const html = readFileSync(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/?grade=3&view=games",
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
  Event: win.Event,
}))
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
await import("../math/fluency-lab/app.js");

const $ = (selector) => win.document.querySelector(selector);
const $$ = (selector) => [...win.document.querySelectorAll(selector)];
const click = (selector) => {
  assert.ok($(selector), `Missing ${selector}`);
  $(selector).click();
};
const sum = (text) =>
  Function(
    `return ${text
      .replaceAll(",", "")
      .replace(/=\s*\?/, "")
      .replaceAll("×", "*")
      .replaceAll("÷", "/")
      .replaceAll("−", "-")}`,
  )();
const results = [];
const toMenu = async () => {
  click("[data-gm-menu]");
  await wait();
  assert.ok($(".gm-menu"), "The way back reaches the menu");
  assert.equal(win.document.activeElement?.tagName, "H2", "Focus lands on the Game Room heading");
};

await wait();
assert.ok($(".gm-menu"), "The Game Room opens from ?view=games");
assert.equal($$("[data-game]").length, 8, "Eight games are offered to Grade 3");

// ---- Fact Match: brute-force the pairs
click('[data-game="match"]');
await wait();
assert.equal(win.document.activeElement?.tagName, "B", "Focus moves into the game");
{
  const kinds = $$(".gm-card").map((card) => (card.classList.contains("q") ? "q" : "a"));
  for (let q = 0; q < kinds.length; q += 1) {
    if (kinds[q] !== "q") continue;
    for (
      let a = 0;
      a < kinds.length && $(`[data-i="${q}"]`) && !$(`[data-i="${q}"]`).classList.contains("done");
      a += 1
    ) {
      if (
        kinds[a] !== "a" ||
        !$(`[data-i="${a}"]`) ||
        $(`[data-i="${a}"]`).classList.contains("done")
      )
        continue;
      $(`[data-i="${q}"]`).click();
      $(`[data-i="${a}"]`).click();
      await wait();
    }
  }
}
await wait(40);
assert.ok($(".gm-result"), "Fact Match ends on a result screen");
results.push(["match", $(".gm-result").textContent.includes("★")]);
await toMenu();

// ---- Target Hunt
click('[data-game="hunt"]');
await wait();
for (let round = 0; round < 3; round += 1) {
  const target = Number($(".gm-target strong").textContent.replaceAll(",", ""));
  for (const [i, card] of $$(".gm-card").entries())
    if (Math.abs(sum(card.textContent) - target) < 1e-9) $(`[data-i="${i}"]`).click();
  await wait();
  if (round < 2) click("[data-gm-next]");
  await wait();
}
await wait(40);
assert.ok($(".gm-result"), "Target Hunt ends on a result screen");
results.push(["hunt", true]);
await toMenu();

// ---- Answer Sort
click('[data-game="sort"]');
await wait();
{
  const line = Number(
    $('[data-bin="low"] b').textContent.replace("Less than ", "").replaceAll(",", ""),
  );
  while ($(".gm-sort .gm-card")) {
    const card = $(".gm-sort .gm-card");
    card.click();
    await wait(2);
    $(sum(card.textContent) < line ? '[data-bin="low"]' : '[data-bin="high"]').click();
    await wait(2);
  }
}
await wait(40);
assert.ok($(".gm-result"), "Answer Sort ends on a result screen");
results.push(["sort", true]);
await toMenu();

// ---- Spot the Mistake
click('[data-game="mistake"]');
await wait();
for (let round = 0; round < 5; round += 1) {
  if ($(".gm-steps")) {
    const steps = $$(".gm-step").map((b) => b.textContent.replace(/^\d+\s*/, "").trim());
    let bad = -1;
    let truth = 0;
    steps.forEach((text, i) => {
      const m = text.match(/^([\d.,]+) ([+−×÷]) ([\d.,]+) = ([\d.,]+)\.?$/);
      if (m && Math.abs(sum(`${m[1]} ${m[2]} ${m[3]}`) - Number(m[4].replaceAll(",", ""))) > 1e-6) {
        bad = i;
        truth = sum(`${m[1]} ${m[2]} ${m[3]}`);
      }
    });
    assert.ok(bad >= 0, "A steps round holds exactly one wrong step");
    $(`[data-pick="${bad}"]`).click();
    $("#gm-fix-in").value = String(truth);
    $(".gm-fix").dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  } else {
    const truth = sum($("#gm-q").textContent.replace(/^.*?:\s*/, ""));
    const shown = Number($(".gm-claim b").textContent.replaceAll(",", ""));
    if (Math.abs(shown - truth) < 1e-9) $('[data-claim="right"]').click();
    else {
      $('[data-claim="wrong"]').click();
      $("#gm-fix-in").value = String(truth);
      $(".gm-fix").dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
    }
  }
  await wait(30);
}
await wait(60);
assert.ok($(".gm-result"), "Spot the Mistake ends on a result screen");
results.push(["mistake", true]);
await toMenu();

// ---- Mystery Picture
click('[data-game="picture"]');
await wait();
for (let n = 0; n < 12; n += 1) {
  $(".gm-tile:not(.clear)").click();
  $("#gm-input").value = String(sum($("#gm-q").textContent));
  $(".gm-ask-form").dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  await wait(5);
}
await wait(60);
assert.ok($(".gm-result .gm-final"), "Mystery Picture ends with the finished picture");
results.push(["picture", true]);
await toMenu();

// ---- Make It: find every pair for each target
click('[data-game="make"]');
await wait();
for (let round = 0; round < 3; round += 1) {
  const target = Number($(".gm-target strong").textContent);
  const op = $(".gm-target").textContent.includes("multiply") ? "*" : "+";
  const values = $$(".gm-card").map((card) => Number(card.textContent));
  const free = new Set(values.keys());
  for (const i of values.keys()) {
    if (!free.has(i)) continue;
    const j = [...free].find(
      (k) => k !== i && (op === "+" ? values[i] + values[k] : values[i] * values[k]) === target,
    );
    if (j === undefined) continue;
    $(`[data-m="${i}"]`).click();
    $(`[data-m="${j}"]`).click();
    free.delete(i);
    free.delete(j);
  }
  await wait();
  if (round < 2) click("[data-gm-next]");
  await wait();
}
await wait(40);
assert.ok($(".gm-result"), "Make It ends on a result screen");
await toMenu();

// ---- Fact Family Builder: fill all four equations in both orders
click('[data-game="family"]');
await wait();
for (let round = 0; round < 3; round += 1) {
  const tiles = $$("[data-t]").map((tile) => Number(tile.textContent));
  const [a, b, c] = [...tiles].sort((x, y) => x - y);
  const place = (frame, values) => {
    values.forEach((v, slot) => {
      $(`[data-t="${tiles.indexOf(v)}"]`).click();
      $(`[data-slot="${frame}:${slot}"]`).click();
    });
  };
  place(0, [a, b, c]);
  place(1, [b, a, c]);
  place(2, [c, a, b]);
  place(3, [c, b, a]);
  click("[data-check]");
  assert.match(
    $(".gm-note").textContent,
    /All four are right/,
    "Four correct equations are accepted",
  );
  await wait();
  if (round < 2) click("[data-gm-next]");
  await wait();
}
await wait(60);
assert.ok($(".gm-result"), "Fact Family Builder ends on a result screen");
await toMenu();

// ---- Balance It: the scale answers every wrong try with a direction, never the number
click('[data-game="balance"]');
await wait();
for (let n = 0; n < 5; n += 1) {
  const tiles = $$("[data-b]");
  const note = () => $(".gm-note").textContent;
  let solved = false;
  for (const tile of tiles) {
    if (!$(`[data-b="${tile.dataset.b}"]`) || $(`[data-b="${tile.dataset.b}"]`).disabled) continue;
    $(`[data-b="${tile.dataset.b}"]`).click();
    if (/Balanced/.test(note())) {
      solved = true;
      break;
    }
    assert.match(note(), /heavier/, "A wrong try says which side is heavier");
  }
  assert.ok(solved, "Trying the tiles reaches a balanced scale");
  await wait(20);
}
await wait(60);
assert.ok($(".gm-result"), "Balance It ends on a result screen");
await toMenu();

// ---- Everything above is remembered
const rewards = JSON.parse(win.localStorage.getItem("ewl-fluency-rewards-v1"));
assert.equal(rewards.plays, 8, "Eight finished games are recorded");
for (const game of ["match", "hunt", "sort", "mistake", "make", "family", "balance", "picture"])
  assert.ok(rewards.best[game] >= 1, `${game} recorded a best result`);
assert.ok($$(".rw-shelf li.on").length >= 3, "The sticker book shows earned stickers");
assert.ok(rewards.scenes.length >= 1, "The finished picture is kept");

// ---- Spanish: the toggle switches the page and the Game Room, and back again
click("#lang-toggle");
await wait();
assert.equal(win.document.documentElement.lang, "es", "The page language becomes Spanish");
assert.equal($("#lang-toggle").textContent, "English", "The toggle offers English once in Spanish");
assert.match($(".gm-head h2").textContent, /Sala de juegos/, "The Game Room heading is Spanish");
assert.match($('[data-view="games"]').textContent, /Juegos/, "The page tabs are Spanish");
click("#lang-toggle");
await wait();
assert.equal(win.document.documentElement.lang, "en", "English returns");
assert.match($(".gm-head h2").textContent, /Game Room/, "The Game Room heading is English again");

console.log(
  `fluency-games-ui: ${results.length + 3} games played to the end in a DOM; results, focus, stickers, menu return and the Spanish toggle hold`,
);
process.exit(0);

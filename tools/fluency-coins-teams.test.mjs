// Buddy shop (coins, buying, backup integrity) and Team Relay (turn order, scoring, full play in jsdom).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 4), ...rest);
const wait = (ms = 15) => new Promise((resolve) => realSetTimeout(resolve, ms));

const html = readFileSync(new URL("../math/fluency-lab/lab.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/math/fluency-lab/lab.html?grade=4&view=games",
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

const { buyItem, cleanRewards, coinBalance, recordGame, summarize } = await import(
  "../math/fluency-lab/rewards.js"
);
const { SHOP } = await import("../math/fluency-lab/buddy-items.js");
const { unlockedIds } = await import("../math/fluency-lab/buddy.js");
const { starsFor, teamForTurn } = await import("../math/fluency-lab/team-relay-game.js");

// ---- Coins and shop rules
const fresh = () => cleanRewards({});
let data = fresh();
assert.equal(coinBalance(data), 0);
assert.equal(buyItem(data, "beanie"), null, "Cannot buy with no coins");
recordGame(data, "make", 3);
recordGame(data, "make", 2);
assert.equal(coinBalance(data), 5, "One coin per star");
assert.equal(buyItem(data, "beanie"), null, "5 coins is not enough for a 6-coin item");
recordGame(data, "make", 1);
const bought = buyItem(data, "beanie");
assert.equal(bought.id, "beanie");
assert.equal(coinBalance(data), 0);
assert.equal(data.buddy.hat, "beanie", "A bought item is worn at once");
assert.equal(buyItem(data, "beanie"), null, "Cannot buy the same item twice");
assert.equal(buyItem(data, "nope"), null, "Unknown ids are refused");
assert.ok(
  unlockedIds(summarize(undefined, data)).includes("beanie"),
  "Owned shop items unlock in the buddy list",
);
assert.ok(
  !unlockedIds(summarize(undefined, data)).includes("tophat"),
  "Unowned shop items stay locked",
);

// A backup cannot give away items or negative coins.
const forged = cleanRewards({
  coins: { earned: 3, spent: 99 },
  shop: ["tophat", "tophat", "bogus"],
  buddy: { hat: "crown", face: "mustache" },
});
assert.equal(coinBalance(forged), 0, "Spent never exceeds earned");
assert.deepEqual(forged.shop, ["tophat"], "Unknown and duplicate ids are dropped");
assert.equal(forged.buddy.face, "", "A shop item that is not owned is not worn");
const roundTrip = cleanRewards(JSON.parse(JSON.stringify(data)));
assert.deepEqual(roundTrip.shop, data.shop);
assert.deepEqual(roundTrip.coins, data.coins);
assert.ok(SHOP.every((item) => item.price > 0 && Number.isInteger(item.price)));

// ---- Team Relay rules
assert.deepEqual(
  [0, 1, 2, 3, 4, 5].map((turn) => teamForTurn(turn, 3)),
  [0, 1, 2, 0, 1, 2],
);
assert.equal(starsFor(8, 8), 3);
assert.equal(starsFor(4, 8), 2);
assert.equal(starsFor(1, 8), 1);

// ---- Both in the Game Room
await import("../math/fluency-lab/app.js");
const $ = (selector) => win.document.querySelector(selector);
const $$ = (selector) => [...win.document.querySelectorAll(selector)];
const click = (selector) => {
  assert.ok($(selector), `Missing ${selector}`);
  $(selector).click();
};
const submit = (form) =>
  form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const answerOf = (text) =>
  Function(
    `return ${text
      .replaceAll(",", "")
      .replace(/=\s*\?/, "")
      .replaceAll("×", "*")
      .replaceAll("÷", "/")
      .replaceAll("−", "-")}`,
  )();
await wait();
assert.ok($(".shop-panel"), "The shop shows in the Game Room");
assert.equal($$("[data-buy]").length, SHOP.length, "Every shop item is offered");
assert.ok(
  $$("[data-buy]").every((button) => button.disabled),
  "Nothing is affordable with 0 coins",
);

click('[data-game="teamrelay"]');
await wait();
$("input[name='teams'][value='3']").checked = true;
submit($("[data-team-form]"));
await wait();
assert.equal($$(".team-board li").length, 3, "Three teams on the board");
assert.match($(".team-turn").textContent, /Red team, it is your turn/);
for (let turn = 0; turn < 12; turn += 1) {
  const expectedTeam = ["Red", "Blue", "Green"][turn % 3];
  assert.match(
    $(".team-turn").textContent,
    new RegExp(`${expectedTeam} team`),
    `Turn ${turn + 1} belongs to ${expectedTeam}`,
  );
  $("#gm-input").value = String(answerOf($("#gm-q").textContent));
  submit($(".gm-ask-form"));
  const next = $("[data-feedback-action='next']");
  assert.ok(next, "A right answer waits for Next");
  next.click();
  await wait();
}
await wait(60);
assert.ok($(".gm-result"), "Team Relay ends on the result screen");
assert.match(
  $(".tr-score").textContent,
  /Red team 4 · Blue team 4 · Green team 4/,
  "Each team answered four first tries correctly",
);
assert.equal($$(".tr-star.on").length, 3, "A perfect class earns three stars");
assert.match($(".gm-coins").textContent, /\+3 coins/);
const stored = JSON.parse(win.localStorage.getItem("ewl-fluency-rewards-v1"));
assert.equal(stored.coins.earned, 3, "The three stars became three coins");
assert.equal(stored.best.teamrelay, 3);
const trail = JSON.parse(win.localStorage.getItem("ewl-fluency-trail-v1") || "{}");
assert.equal(
  Object.keys(trail.facts || {}).length,
  0,
  "A team answer never writes to the personal fact chart",
);

click("[data-gm-menu]");
await wait();
assert.match($(".shop-balance").textContent, /3 coins/);
// Buying through the page
stored.coins.earned = 20;
win.localStorage.setItem("ewl-fluency-rewards-v1", JSON.stringify(stored));
click('[data-game="teamrelay"]');
await wait();
click("[data-gm-menu]");
await wait();
assert.match($(".shop-balance").textContent, /20 coins/);
// The Daily Green Light opens the shop: before it, nothing can be bought even with coins.
assert.ok(
  $$("[data-buy]").every((button) => button.disabled),
  "The shop waits for today's Green Light",
);
click('[data-buy="tophat"]');
await wait();
assert.equal(JSON.parse(win.localStorage.getItem("ewl-fluency-rewards-v1")).shop.length, 0);
const nowMs = Date.now();
win.localStorage.setItem(
  "ewl-fluency-tutor-v2",
  JSON.stringify({
    version: 2,
    records: {
      "1:add-10": {
        recent: Array.from({ length: 10 }, (_, i) => ({
          correct: true,
          independent: true,
          level: 1,
          at: nowMs - i,
        })),
      },
    },
    mistakes: [],
    diagnostics: {},
    sessions: [],
  }),
);
click('[data-game="teamrelay"]');
await wait();
click("[data-gm-menu]");
await wait();
assert.match($(".fl-green-light").textContent, /Green Light!/);
click('[data-buy="tophat"]');
await wait();
assert.match($(".gm-note").textContent, /You bought Top hat/);
const after = JSON.parse(win.localStorage.getItem("ewl-fluency-rewards-v1"));
assert.deepEqual(after.shop, ["tophat"]);
assert.equal(after.coins.spent, 12);
assert.equal(after.buddy.hat, "tophat");
assert.match($(".shop-balance").textContent, /8 coins/);
assert.ok(
  $$("[data-buy]").some((button) => button.disabled),
  "Items above the balance stay disabled",
);
console.log("fluency-coins-teams: ok");
process.exit(0);

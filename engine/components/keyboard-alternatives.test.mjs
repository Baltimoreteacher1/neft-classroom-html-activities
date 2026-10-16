#!/usr/bin/env node
/* =============================================================================
 * keyboard-alternatives.test.mjs — every drag has a way to do it without
 * dragging, and that way TELLS the student what happened.
 * -----------------------------------------------------------------------------
 * Drag-sort, the matcher and the algebra tiles are used all over the curriculum.
 * A student who cannot drag (keyboard, switch, screen reader, a tablet with a
 * tremor) must be able to pick an item up, choose where it goes, and hear the
 * result. These tests drive the REAL components in jsdom through that path, and
 * also pin that the mouse path is untouched: same click-then-click behaviour,
 * and no focus ring or hidden control appearing for a pointer user.
 * ========================================================================== */

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CSS: { escape: (s) => String(s) },
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
});

const { renderDragSort } = await import("./drag-sort.js");
const { renderMatchingGame } = await import("./matching-game.js");
const { renderAlgebraTiles } = await import("./algebra-tiles.js");

const mount = () => document.body.appendChild(document.createElement("div"));
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
/** A keyboard Enter on a native button is a click with no pointer position. */
const press = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, detail: 0 }));
/** A real mouse click carries a pointer position (detail 1). */
const tap = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, detail: 1 }));
const live = (host) => host.querySelector("[data-sp-live]")?.textContent ?? "";

function sorter(onComplete) {
  const host = mount();
  renderDragSort(host, {
    categories: [
      { id: "prime", label: "Prime", labelEs: "Primo" },
      { id: "comp", label: "Composite", labelEs: "Compuesto" },
    ],
    items: [
      { text: "7", category: "prime" },
      { text: "9", category: "comp" },
    ],
    onComplete,
  });
  return host;
}
const itemNamed = (host, text) =>
  [...host.querySelectorAll(".drag-item")].find((i) => i.querySelector("span")?.textContent.includes(text));
const zoneNamed = (host, name) => host.querySelector(`.drag-zone[aria-label="${name}"]`);

test("no control sits inside another control", () => {
  const host = sorter();
  for (const outer of host.querySelectorAll("[role=button], button")) {
    assert.equal(
      outer.querySelector("button, [tabindex], a[href], input, select"),
      null,
      `nested interactive control inside ${outer.className || outer.tagName}`,
    );
  }
  // Drop zones are labelled regions, not focusable fake buttons.
  for (const zone of host.querySelectorAll(".drag-zone")) {
    assert.equal(zone.getAttribute("role"), "group");
    assert.ok(zone.getAttribute("aria-label"));
    assert.equal(zone.hasAttribute("tabindex"), false);
  }
});

test("keyboard: pick an item up, place it in a category, hear both", () => {
  const host = sorter();
  const seven = itemNamed(host, "7");
  const pick = seven.querySelector(".sp-pick");
  assert.equal(pick.getAttribute("aria-pressed"), "false");
  assert.match(pick.getAttribute("aria-label"), /^7\. Press Enter to pick it up/);

  press(pick);
  assert.equal(pick.getAttribute("aria-pressed"), "true");
  const prime = zoneNamed(host, "Prime");
  const place = prime.querySelector(".sp-place");
  assert.equal(place.disabled, false, "a place button is offered once something is picked up");
  assert.equal(document.activeElement, host.querySelector(".sp-place:not([disabled])"));

  press(place);
  assert.equal(seven.parentElement, prime, "the item moved into the category");
  assert.equal(pick.getAttribute("aria-pressed"), "false");
  assert.equal(document.activeElement, pick, "focus returns to the item that moved");
});

test("announcements say what happened", async () => {
  const host = sorter();
  const seven = itemNamed(host, "7");
  press(seven.querySelector(".sp-pick"));
  await tick();
  assert.match(live(host), /7 picked up\. Choose where it goes/);
  press(zoneNamed(host, "Prime").querySelector(".sp-place"));
  await tick();
  assert.match(live(host), /7 placed in Prime\. 1 item there\./);
});

test("Escape puts the item down and moves nothing", async () => {
  const host = sorter();
  const seven = itemNamed(host, "7");
  const home = seven.parentElement;
  const pick = seven.querySelector(".sp-pick");
  press(pick);
  zoneNamed(host, "Prime")
    .querySelector(".sp-place")
    .dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await tick();
  assert.equal(seven.parentElement, home);
  assert.equal(pick.getAttribute("aria-pressed"), "false");
  assert.match(live(host), /7 put down\. Nothing moved\./);
  assert.equal(document.activeElement, pick);
});

test("the item's own zone is not offered as a place to put it", () => {
  const host = sorter();
  const seven = itemNamed(host, "7");
  press(seven.querySelector(".sp-pick"));
  const bank = host.querySelector(".drag-zone[data-zone=bank]");
  assert.equal(bank.querySelector(".sp-place").disabled, true);
});

test("a finished sort by keyboard still grades", () => {
  let done = null;
  const host = sorter((c, t) => {
    done = [c, t];
  });
  for (const [text, zone] of [
    ["7", "Prime"],
    ["9", "Composite"],
  ]) {
    press(itemNamed(host, text).querySelector(".sp-pick"));
    press(zoneNamed(host, zone).querySelector(".sp-place"));
  }
  host.querySelector(".btn-primary").click();
  assert.deepEqual(done, [2, 2]);
});

test("the mouse path is unchanged: tap an item, tap a category", () => {
  const host = sorter();
  const seven = itemNamed(host, "7");
  const before = document.activeElement;
  tap(seven);
  assert.equal(seven.classList.contains("ds-selected"), true);
  tap(zoneNamed(host, "Prime"));
  assert.equal(seven.parentElement, zoneNamed(host, "Prime"));
  assert.equal(seven.classList.contains("ds-selected"), false);
  assert.equal(document.activeElement, before, "a mouse user's focus is never moved");
});

test("Spanish: the announcements and the category names follow the student's language", async () => {
  localStorage.setItem("nt-lang", "es");
  try {
    const host = sorter();
    const seven = itemNamed(host, "7");
    press(seven.querySelector(".sp-pick"));
    await tick();
    assert.match(live(host), /7 recogido\./);
    press(zoneNamed(host, "Primo").querySelector(".sp-place"));
    await tick();
    assert.match(live(host), /7 puesto en Primo\./);
  } finally {
    localStorage.removeItem("nt-lang");
  }
});

test("ordering: the arrow buttons keep keyboard focus and announce the new position", async () => {
  const host = mount();
  renderDragSort(host, {
    items: ["a", "b", "c"],
    correctOrder: ["First", "Second", "Third"],
    label: "Order",
  });
  const down = host.querySelectorAll("button[aria-label^='Move']")[1]; // first row, "down"
  const name = down.getAttribute("aria-label").replace("Move ", "").replace(" down", "");
  press(down);
  await tick();
  assert.match(live(host), new RegExp(`${name} moved to position 2 of 3`));
  assert.ok(
    document.activeElement?.getAttribute("aria-label")?.includes(name),
    "focus is back on a control of the row that moved",
  );
});

test("matcher: each press is announced and the pick is exposed as pressed", async () => {
  const host = mount();
  renderMatchingGame(host, { pairs: [{ term: "2:4", match: "1:2" }, { term: "3:9", match: "1:3" }] });
  const tiles = [...host.querySelectorAll(".mg-item")];
  const left = tiles.find((t) => t.textContent.includes("2:4"));
  const right = tiles.find((t) => t.textContent.includes("1:2"));
  const wrong = tiles.find((t) => t.textContent.includes("1:3"));
  assert.equal(left.getAttribute("aria-pressed"), "false");
  left.click();
  await tick();
  assert.equal(left.getAttribute("aria-pressed"), "true");
  assert.match(live(host), /2:4 selected/);
  wrong.click();
  await tick();
  assert.match(live(host), /2:4 and 1:3 do not match/);
  left.click();
  right.click();
  await tick();
  assert.match(live(host), /Matched: 2:4 with 1:2/);
  assert.equal(left.dataset.matched, "1");
});

test("tiles: Enter moves a tile, keeps focus on it, and says where it went", () => {
  const host = mount();
  renderAlgebraTiles(host, {
    tileSet: [
      { type: "x", value: 1, count: 1 },
      { type: "unit", value: 1, count: 1 },
    ],
    target: { x: 2, value: 3 },
  });
  const tile = host.querySelector(".algebra-tile");
  const work = host.querySelector("[data-zone=work]");
  tile.focus();
  assert.match(tile.getAttribute("aria-label"), /in the tray\. Press Enter to move it to the workspace/);
  tile.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.equal(tile.parentElement, work);
  assert.equal(document.activeElement, tile, "focus stays on the tile after it moves");
  assert.match(tile.getAttribute("aria-label"), /in the workspace/);
  assert.match(host.querySelector(".sr-live").textContent, /x tile moved to the workspace\./);
  // And back out with Delete.
  tile.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
  assert.equal(tile.parentElement.dataset.zone, "tray");
  assert.equal(document.activeElement, tile);
});

test("tiles: both zones are named regions", () => {
  const host = mount();
  renderAlgebraTiles(host, { tileSet: [{ type: "x", value: 1, count: 1 }], target: { x: 2, value: 2 } });
  assert.equal(host.querySelector("[data-zone=tray]").getAttribute("role"), "group");
  assert.equal(host.querySelector("[data-zone=work]").getAttribute("aria-label"), "Workspace");
});

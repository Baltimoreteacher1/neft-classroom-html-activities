#!/usr/bin/env node
/* =============================================================================
 * invent-scene.test.mjs — the invent-first scene as a student meets it.
 * -----------------------------------------------------------------------------
 * The scene is an invitation. These tests hold the product rules around it:
 * every number on screen is one the student typed; the problem's answer never
 * appears; nothing is timed, scored or required; what is kept is only the
 * numbers, in this browser, and a blocked or broken store changes nothing; and
 * everything a child reads has a Spanish sibling.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", {
  url: "http://localhost/lessons/4-3/",
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  Event: dom.window.Event,
});

const { renderInventFirst, compareHTML } = await import("./invent-scene.js");
const { classifyStrategy } = await import("../core/invent-first.js");

const config = JSON.parse(
  readFileSync(new URL("../../data/invent-first/4-3.json", import.meta.url), "utf8"),
);
const KEY = "nt-invent-first:v1:4-3";
const EXACT = String((config.problem.percent / 100) * config.problem.whole); // 55.2

const mount = async (extra = {}) => {
  const host = document.body.appendChild(document.createElement("div"));
  const handle = await renderInventFirst(host, { lesson: "4-3", config, ...extra });
  return { host, handle };
};
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const field = (h, name) => h.querySelector(`[name="${name}"]`);
function addMark(h, p, x = "") {
  field(h, "p").value = String(p);
  field(h, "x").value = String(x);
  h.querySelector("[data-add]").dispatchEvent(new window.Event("submit", { cancelable: true }));
}
const setField = (h, name, value) => {
  field(h, name).value = String(value);
  field(h, name).dispatchEvent(new window.Event("change"));
};
const fresh = () => localStorage.clear();

test("opens as an invitation: blank, optional, untimed, ungraded", async () => {
  fresh();
  const { host } = await mount();
  assert.equal(field(host, "p").value, "");
  assert.equal(field(host, "x").value, "");
  assert.equal(field(host, "whole").value, "", "no easier number is suggested");
  assert.equal(field(host, "estimate").value, "", "no estimate is suggested");
  assert.equal(host.querySelectorAll("[data-marks] li").length, 0, "no marks are pre-placed");
  const text = host.textContent;
  assert.match(text, /Optional/);
  assert.match(text, /no timer/i);
  assert.match(text, /nothing here is graded/i);
  assert.ok(host.querySelector("[data-skip]"), "the lesson's ways are one tap away without trying");
  assert.equal(host.querySelector("[data-compare-panel]").hidden, true);
});

test("every number the student adds appears, and no other number does", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, 25, 60);
  addMark(host, 10);
  const items = [...host.querySelectorAll("[data-marks] li span")].map((s) => s.textContent);
  assert.deepEqual(items, ["25% → $60", "10%"]);
  const label = host.querySelector("svg.ifx-line").getAttribute("aria-label");
  assert.match(label, /25% with \$60/);
  assert.match(label, /10%/);
  assert.match(label, /the problem asks about 23%/);
  assert.ok(!host.textContent.includes(EXACT), "the exact answer must never be printed");
});

test("a mark needs a percent; anything else is a calm note, not an error wall", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, "", 40);
  addMark(host, "abc");
  addMark(host, -5);
  assert.equal(host.querySelectorAll("[data-marks] li").length, 0);
  assert.match(host.querySelector(".ifx-msg").textContent, /Type a percent first/);
  assert.equal(host.querySelector(".ifx-msg").getAttribute("aria-live"), "polite");
});

test("marks can be removed, and a limit keeps the line readable", async () => {
  fresh();
  const { host } = await mount();
  for (let i = 1; i <= 14; i += 1) addMark(host, i);
  assert.equal(host.querySelectorAll("[data-marks] li").length, 12);
  assert.match(host.querySelector(".ifx-msg").textContent, /plenty/);
  click(host.querySelector('[data-remove="0"]'));
  assert.equal(host.querySelectorAll("[data-marks] li").length, 11);
});

test("Compare shows the student's way beside the lesson's, with a question to talk over", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, 25, 60);
  setField(host, "estimate", 60);
  click(host.querySelector("[data-compare]"));
  const panel = host.querySelector("[data-compare-panel]");
  assert.equal(panel.hidden, false);
  const cards = [...panel.querySelectorAll(".ifx-card")];
  assert.equal(cards.length, 2);
  assert.match(cards[0].textContent, /Your way/);
  assert.match(cards[0].textContent, /A friendly percent/);
  assert.match(cards[0].textContent, /25% → \$60/, "evidence is the student's own marks");
  assert.match(cards[1].textContent, /The lesson's way/);
  assert.match(cards[1].textContent, /Benchmark percent/);
  assert.match(cards[1].textContent, /Use benchmark percents: 10%/);
  assert.match(panel.textContent, /What did you do about the small difference/);
  assert.equal(document.activeElement, panel, "focus moves to the comparison");
  assert.ok(!panel.textContent.includes(EXACT));
});

test("when it cannot tell, it says so and offers the lesson's ways instead of guessing", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, 3, 1);
  setField(host, "estimate", 7);
  click(host.querySelector("[data-compare]"));
  const body = host.querySelector("[data-compare-body]");
  assert.match(body.textContent, /We cannot tell your way/);
  assert.ok(!/Your way/.test(body.textContent), "no label is invented");
  assert.equal(body.querySelectorAll(".ifx-card").length, config.methods.length);
});

test("mixed ideas: it names the lesson's matching ways and not a single favourite", async () => {
  const html = compareHTML(config, {
    marks: [
      { p: 40, x: 96 },
      { p: 20, x: 48 },
      { p: 5, x: 12 },
    ],
    estimate: 60,
  });
  assert.match(html, /more than one idea/);
  assert.match(html, /Half and quarter/);
  assert.match(html, /Combine benchmarks/);
  assert.ok(!/Your way/.test(html));
});

test("Skip shows the lesson's ways with no attempt and asks for nothing first", async () => {
  fresh();
  const { host } = await mount();
  click(host.querySelector("[data-skip]"));
  const body = host.querySelector("[data-compare-body]");
  assert.equal(host.querySelector("[data-compare-panel]").hidden, false);
  assert.equal(body.querySelectorAll(".ifx-card").length, config.methods.length);
  assert.ok(!/Your way/.test(body.textContent));
});

test("editing anything puts the comparison away until the student asks again", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, 25, 60);
  click(host.querySelector("[data-compare]"));
  assert.equal(host.querySelector("[data-compare-panel]").hidden, false);
  addMark(host, 10, 24);
  assert.equal(host.querySelector("[data-compare-panel]").hidden, true);
});

test("an easier number and an estimate are read when Compare is pressed, even unsent", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, 25, 62.5);
  field(host, "whole").value = "250";
  field(host, "estimate").value = "62";
  click(host.querySelector("[data-compare]"));
  assert.match(host.querySelector("[data-compare-body]").textContent, /A friendly percent and an easier number/);
});

test("only the numbers are kept, in this browser, and they come back", async () => {
  fresh();
  const first = await mount();
  addMark(first.host, 25, 60);
  setField(first.host, "estimate", 61);
  const kept = JSON.parse(localStorage.getItem(KEY));
  assert.deepEqual(Object.keys(kept).sort(), ["compared", "estimate", "marks", "whole"]);
  assert.deepEqual(kept.marks, [{ p: 25, x: 60 }]);
  first.handle.destroy();

  const again = await mount();
  assert.deepEqual(
    [...again.host.querySelectorAll("[data-marks] li span")].map((s) => s.textContent),
    ["25% → $60"],
  );
  assert.equal(field(again.host, "estimate").value, "61");
});

test("junk in storage is cleaned, and Start over forgets everything", async () => {
  localStorage.setItem(KEY, JSON.stringify({ marks: [{ p: "x" }, { p: 25, x: 60 }, 7], estimate: "no" }));
  const { host } = await mount();
  assert.equal(host.querySelectorAll("[data-marks] li").length, 1);
  click(host.querySelector("[data-reset]"));
  assert.equal(host.querySelectorAll("[data-marks] li").length, 0);
  assert.equal(localStorage.getItem(KEY), null);
});

test("a blocked or throwing store never stops the scene", async () => {
  const real = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const broken = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: broken, configurable: true });
  try {
    const { host } = await mount();
    addMark(host, 25, 60);
    click(host.querySelector("[data-compare]"));
    assert.equal(host.querySelectorAll("[data-marks] li").length, 1);
    assert.equal(host.querySelector("[data-compare-panel]").hidden, false);
    click(host.querySelector("[data-reset]"));
  } finally {
    Object.defineProperty(globalThis, "localStorage", real);
  }
});

test("a missing or invalid file is a calm note and the lesson carries on", async () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false, status: 404 });
    const missing = document.body.appendChild(document.createElement("div"));
    const a = await renderInventFirst(missing, { lesson: "9-9" });
    assert.match(missing.textContent, /could not load right now/);
    assert.match(missing.textContent, /no se pudo cargar/);
    a.destroy();
    globalThis.fetch = realFetch;
    const bad = document.body.appendChild(document.createElement("div"));
    await renderInventFirst(bad, { lesson: "4-3", config: { schemaVersion: 1 } });
    assert.match(bad.textContent, /could not load right now/);
  } finally {
    console.warn = warn;
  }
});

test("the file is fetched from the data folder, for the lesson asked for", async () => {
  const realFetch = globalThis.fetch;
  const asked = [];
  globalThis.fetch = async (url, init) => {
    asked.push({ url, init });
    return { ok: true, json: async () => config };
  };
  try {
    const host = document.body.appendChild(document.createElement("div"));
    await renderInventFirst(host, { lesson: "4-3" });
    assert.equal(asked[0].url, "/data/invent-first/4-3.json");
    assert.equal(asked[0].init.credentials, "omit");
    assert.ok(host.querySelector("[data-add]"));
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("everything a child reads has a Spanish sibling", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, 25, 60);
  click(host.querySelector("[data-compare]"));
  const stacks = host.querySelectorAll(".i18n-stack");
  assert.ok(stacks.length >= 14, `only ${stacks.length} bilingual lines`);
  for (const stack of stacks) {
    assert.ok(stack.querySelector('.i18n-en[lang="en"]')?.textContent.trim());
    assert.ok(stack.querySelector('.i18n-es[lang="es"]')?.textContent.trim());
  }
  // The unsure message and the lesson cards too.
  const unsure = compareHTML(config, {});
  assert.equal((unsure.match(/lang="es"/g) || []).length > 5, true);
});

test("fields are labelled, controls are big and keyboard-native, results are announced", async () => {
  fresh();
  const { host } = await mount();
  for (const input of host.querySelectorAll("input")) {
    assert.ok(input.closest("label")?.textContent.trim(), `unlabelled input ${input.name}`);
  }
  for (const control of host.querySelectorAll("button")) {
    assert.ok(control.textContent.trim() || control.getAttribute("aria-label"), "unnamed button");
  }
  addMark(host, 25, 60);
  assert.match(
    host.querySelector('[data-remove="0"]').getAttribute("aria-label"),
    /Remove mark 25% → \$60/,
  );
  const css = document.getElementById("invent-scene-styles").textContent;
  assert.match(css, /min-height:44px/);
  assert.ok(!/animation|transition/.test(css), "calm: nothing animates");
  assert.equal(host.querySelector("[data-compare-body]").getAttribute("aria-live"), "polite");
  assert.equal(host.querySelector("[data-compare-panel]").getAttribute("tabindex"), "-1");
});

test("no pressure anywhere on screen: no timer, score, stars or wrong-answer language", async () => {
  fresh();
  const { host } = await mount();
  addMark(host, 25, 60);
  click(host.querySelector("[data-compare]"));
  const text = host.textContent.toLowerCase();
  for (const word of ["seconds", "countdown", "score", "points", "stars", "wrong", "incorrect", "try again"]) {
    assert.ok(!text.includes(word), `"${word}" on screen`);
  }
});

test("the scene never reaches for the network to judge a student's marks", async () => {
  fresh();
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { ok: false };
  };
  try {
    const { host } = await mount(); // config supplied: no fetch at all
    addMark(host, 25, 60);
    click(host.querySelector("[data-compare]"));
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("the comparison is built from the classifier — it cannot show a label the classifier did not give", () => {
  for (const moves of [
    { marks: [{ p: 25, x: 60 }], estimate: 60 },
    { marks: [{ p: 10, x: 24 }, { p: 25, x: 60 }], estimate: 45 },
    { marks: [{ p: 23, x: 50 }, { p: 23, x: 55 }, { p: 23, x: 58 }] },
  ]) {
    const id = classifyStrategy(config, moves).id;
    const name = config.strategies.find((s) => s.id === id).name.en;
    assert.ok(compareHTML(config, moves).includes(name), `${id}: ${name}`);
  }
});

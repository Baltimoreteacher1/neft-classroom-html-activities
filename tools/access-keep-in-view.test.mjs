#!/usr/bin/env node
// Calm scrolling (access-practice-lab/src/keep-in-view.js): a click redraws a panel, it must not also move the page.
// keepInView scrolls only when the element is out of sight and only to the nearest edge; programmatic focus() no
// longer recentres the window, but an explicit preventScroll is still honoured.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><button id=b>x</button>", { url: "https://lab.test/" });
for (const k of ["window", "document", "HTMLElement", "getComputedStyle", "innerHeight"])
  globalThis[k] = dom.window[k];
globalThis.matchMedia = () => ({ matches: false });
globalThis.innerHeight = 800;
document.documentElement.style.setProperty("--lab-top-h", "70px");

const { inView, installCalmFocus, keepInView } = await import(
  "../access-practice-lab/src/keep-in-view.js"
);
const box = (el, top, bottom) => {
  el.getBoundingClientRect = () => ({ top, bottom, width: 100, height: bottom - top });
};
const spy = (el) => {
  const calls = [];
  el.scrollIntoView = (o) => calls.push(o);
  return calls;
};

test("an element already on screen does not move the page", () => {
  const el = document.getElementById("b");
  box(el, 200, 260);
  const calls = spy(el);
  assert.equal(inView(el), true);
  assert.equal(keepInView(el), false);
  assert.deepEqual(calls, []);
});

test("an element behind the sticky header or below the fold scrolls only to the nearest edge", () => {
  const el = document.getElementById("b");
  for (const [top, bottom] of [
    [20, 60],
    [760, 900],
  ]) {
    box(el, top, bottom);
    const calls = spy(el);
    assert.equal(keepInView(el), true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].block, "nearest", "never start or centre");
  }
});

test("an element taller than the window that fills it is left alone; a hidden one is ignored", () => {
  const el = document.getElementById("b");
  box(el, -100, 1200);
  assert.equal(keepInView(el), false);
  el.getBoundingClientRect = () => ({ top: 0, bottom: 0, width: 0, height: 0 });
  assert.equal(keepInView(el), false);
});

test("focus() no longer recentres the window, and an explicit preventScroll is honoured", () => {
  const seen = [];
  const original = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (o) {
    seen.push(o);
  };
  installCalmFocus();
  const el = document.getElementById("b");
  box(el, 200, 260);
  el.focus();
  el.focus({ preventScroll: false });
  assert.deepEqual(seen, [{ preventScroll: true }, { preventScroll: false }]);
  HTMLElement.prototype.focus = original;
});

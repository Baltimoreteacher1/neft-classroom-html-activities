// The part-whole reader must see a DECOMPOSITION, not only a computation.
//
// Small-group walkthroughs break a number apart to make it friendlier — "78.5 =
// 70 + 8.5" — and that is exactly the step a part-whole bar explains best. The
// reader required whole numbers written forward ("a + b = c"), so the lines that
// most wanted a picture were the ones that never got one: 30 lines across the
// generated small-group fleet drew nothing.
//
// The second half of this file matters more than the first: a model that
// disagrees with its own sentence is worse than no model, so a line whose
// arithmetic is false must still draw NOTHING.

import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
globalThis.window = dom.window;

const { createBuildVisualizer } = await import("./small-group-build-visuals.js");

const draws = (line) => {
  try {
    return Boolean(createBuildVisualizer()(line));
  } catch {
    return false;
  }
};

test("a decimal decomposition written in reverse draws a model", () => {
  assert.ok(draws("78.5 = 70 + 8.5."), "78.5 = 70 + 8.5 is the friendly-number split");
  assert.ok(draws("105.76 = 100 + 5.76."), "same shape, different lesson");
});

test("a decomposition by subtraction draws a model", () => {
  assert.ok(draws("78.5 = 80 − 1.5."), "rounding up then backing off is still a decomposition");
});

test("the forward computation still draws — the old behaviour is intact", () => {
  assert.ok(draws("150 + 12 = 162"));
  assert.ok(draws("162 − 12 = 150"));
});

test("whole-number decompositions draw too", () => {
  assert.ok(draws("162 = 150 + 12."));
});

test("a line whose arithmetic is FALSE draws nothing, in either direction", () => {
  assert.equal(draws("78.5 = 70 + 9.5."), false, "reversed form must still be verified");
  assert.equal(draws("2 + 2 = 5"), false, "forward form must still be verified");
  assert.equal(draws("100 = 40 + 50."), false);
});

test("prose with no equation draws nothing", () => {
  assert.equal(draws("Try the practice problems below."), false);
  assert.equal(draws("Be ready to say why your answer makes sense."), false);
});

test("floating point does not rob a student of a correct model", () => {
  // 0.1 + 0.2 !== 0.3 in binary; a student would call this exact, so it draws.
  assert.ok(draws("0.3 = 0.1 + 0.2."));
});

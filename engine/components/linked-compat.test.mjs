#!/usr/bin/env node
/* =============================================================================
 * linked-compat.test.mjs — a component handed NO model draws exactly what it drew
 * before the `model` option existed.
 * -----------------------------------------------------------------------------
 * The ratio table, tape diagram, hundred grid and bar model are mounted in
 * lessons and family pages today. Linking them is additive, so the proof is not
 * "it still seems to work": each scenario below records the full markup after
 * mount and after every interaction, and the digests were captured from the
 * unpatched files at origin/main (aa873132f0). Any change to what a model-less
 * component draws — a stray class, a reordered node, a different default —
 * changes a digest and fails here.
 *
 * Run in its own process on purpose: the tape diagram numbers its answer field
 * from a module-level counter, so the markup depends on mount order.
 * ========================================================================== */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
});

const digest = (states) =>
  states.map((html) => createHash("sha256").update(html).digest("hex").slice(0, 12)).join(" ");
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const newHost = () => document.body.appendChild(document.createElement("div"));
const row = (label, ...values) => ({
  label,
  parts: values.map((value) => ({ value, label: String(value) })),
});

test("ratio table builder, model-less", async () => {
  const { renderRatioTableBuilder } = await import("./ratio-table-builder.js");
  const host = newHost();
  renderRatioTableBuilder(host, { labelA: "juice", labelB: "total" });
  const states = [host.innerHTML];
  host.querySelector('[data-p="3:4"]').click();
  states.push(host.innerHTML);
  host.querySelector('[data-inp="a"]').value = "7";
  host.querySelector('[data-inp="b"]').value = "5";
  click(host.querySelector(".rtlab-go"));
  states.push(host.innerHTML);
  host.querySelector('[data-inp="a"]').value = "500";
  click(host.querySelector(".rtlab-go"));
  states.push(host.innerHTML);
  assert.equal(digest(states), "b0aaa10b2d10 bebfc88d88be 0f0460e6f3e7 897119a45253");
  assert.equal(host.querySelectorAll(".rtlab-col").length, 0, "no scale buttons without a model");
});

test("tape diagram, model-less (ratio shape, then whole and parts)", async () => {
  const { renderTapeDiagram } = await import("./tape-diagram-lab.js");
  const host = newHost();
  renderTapeDiagram(host, {
    title: "Ferris",
    rows: [row("cars", 5, 5, 5, 5), row("riders", 20, 20, 20, 20)],
  });
  const states = [host.innerHTML];
  click(host.querySelector(".tdl-more"));
  states.push(host.innerHTML);
  click(host.querySelector(".tdl-fewer"));
  click(host.querySelector(".tdl-fewer"));
  states.push(host.innerHTML);
  click(host.querySelector(".tdl-reset"));
  states.push(host.innerHTML);
  const whole = newHost();
  renderTapeDiagram(whole, { rows: [row("total", 24), row("parts", 6, 6, 6, 6)] });
  states.push(whole.innerHTML);
  whole.querySelector(".tdl-input").value = "4";
  click(whole.querySelector(".tdl-check"));
  states.push(whole.innerHTML);
  assert.equal(
    digest(states),
    "9fe4ce969686 8affd456c530 8078a770072b 9fe4ce969686 056c45bc4919 d48d1c977375",
  );
  // One group is not a pattern: an authored single-group figure stays static,
  // while two groups is the smallest figure that gets the scaling control.
  const single = newHost();
  renderTapeDiagram(single, { title: "One group", rows: [row("cars", 5), row("riders", 20)] });
  assert.equal(digest([single.innerHTML]), "47728af89aa5");
  assert.equal(single.querySelector(".tdl-explore"), null);
  const pair = newHost();
  renderTapeDiagram(pair, { rows: [row("cars", 5, 5), row("riders", 20, 20)] });
  assert.equal(digest([pair.innerHTML]), "93ef101c0530");
  assert.ok(pair.querySelector(".tdl-explore"));
});

test("hundred grid, model-less", async () => {
  const { renderPercentGridLab } = await import("./percent-grid-lab.js");
  const host = newHost();
  renderPercentGridLab(host, { percent: 30 });
  const states = [host.innerHTML];
  click(host.querySelectorAll(".pgl-cell")[50]);
  states.push(host.innerHTML);
  click(host.querySelector('[data-el="reveal"]'));
  states.push(host.innerHTML);
  click(host.querySelector('[data-el="reset"]'));
  states.push(host.innerHTML);
  states.push(String(renderPercentGridLab(newHost(), {})));
  assert.equal(digest(states), "f78ef32c569e a9cf808339ad 9656f91f7dac 79df47d8348b 74234e98afe7");
  assert.equal(states[4], "null", "an unauthored grid still declines to render");
});

test("bar model, model-less (ratio path, then answer path)", async () => {
  const { renderBarModel } = await import("./bar-model.js");
  const host = newHost();
  const handle = renderBarModel(host, {
    parts: [
      { label: "a", value: 80 },
      { label: "b", value: 12 },
    ],
    whole: 92,
    instructions: "Find",
    label: "sol",
  });
  const states = [String(handle), host.innerHTML];
  click(host.querySelector(".btn"));
  states.push(host.innerHTML);
  const answer = newHost();
  const answerHandle = renderBarModel(answer, {
    bars: [
      { label: "x", value: 3 },
      { label: "y", value: 4 },
    ],
    totalLabel: "T",
    questionText: "q?",
    answer: 7,
  });
  states.push(String(answerHandle), answer.innerHTML);
  assert.equal(digest(states), "eb045d78d273 7fc38bfe6673 15ad18c374d9 eb045d78d273 4cef0c1227c1");
  assert.equal(handle, undefined, "the model-less bar still returns nothing");
});

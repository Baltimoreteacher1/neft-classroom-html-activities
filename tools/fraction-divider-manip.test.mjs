#!/usr/bin/env node
/* ==========================================================================
 * fraction-divider-manip.test.mjs
 *
 * The "🍰 Fraction Divider" manipulative (shared/projects/manip-frac-divide.js)
 * used to print the full "whole ÷ piece = N" equation and a plain-language
 * "you can make exactly N pieces" note the instant a student set the two
 * numbers — before they had counted anything. It sits beside a GRADED
 * question in several lessons' Explore phase (see lessons/6-1/config.json
 * explore.diagram), so a student could read the manip's own printed answer
 * instead of doing the bar-model problem next to it. Reported directly: "it
 * automatically answers the question for students — do not do that."
 *
 * The bar itself is the model (full pieces light up) and stays visible; the
 * equation and note are now gated behind the student typing their own count
 * of full pieces and checking it, or explicitly asking to see the answer.
 *
 * Also covers the separate ask to allow a larger denominator (was clamped to
 * 12; now 60).
 * ========================================================================== */

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='h'></div></body></html>", {
  url: "https://eduwonderlab.com/lessons/6-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;

await import("../shared/projects/manip-frac-divide.js");

let checks = 0;
// jsdom does not apply CSS [hidden]{display:none}, so read the attribute directly.
function getComputedVisible(el) {
  return !el.hidden;
}
function mount(attrs) {
  const host = document.getElementById("h");
  host.innerHTML = "";
  const div = document.createElement("div");
  div.className = "pki-manip";
  div.setAttribute("data-manip", "frac-divide");
  for (const [k, v] of Object.entries(attrs || {})) div.setAttribute(k, v);
  host.appendChild(div);
  window.NeftManips["frac-divide"](div);
  return div;
}

// ── 1. On mount, the answer is not visible. ─────────────────────────────────
{
  const el = mount({});
  checks += 1;
  assert.equal(el.querySelector("[data-reveal]").hidden, true, "equation/note must start hidden");
  checks += 1;
  assert.equal(
    getComputedVisible(el.querySelector("[data-reveal]")),
    false,
    "the reveal container is not visible before any check",
  );
}

// ── 2. Default state (3/4 whole, 1/8 piece) — the correct count is 6. Wrong
//      guesses stay hidden; the right guess reveals. ───────────────────────
{
  const el = mount({});
  const input = el.querySelector("[data-count-input]");
  const checkBtn = el.querySelector("[data-check-btn]");
  const reveal = el.querySelector("[data-reveal]");
  const status = el.querySelector("[data-check-status]");

  input.value = "5";
  checkBtn.click();
  checks += 1;
  assert.equal(reveal.hidden, true, "a wrong count must not reveal the answer");
  checks += 1;
  assert.match(status.textContent, /not quite/i, `status: "${status.textContent}"`);

  input.value = "6";
  checkBtn.click();
  checks += 1;
  assert.equal(reveal.hidden, false, "the correct count should reveal the answer");
  checks += 1;
  assert.match(el.querySelector("[data-eq]").textContent, /=\s*6/, "equation should show 6");
}

// ── 3. "Show me" reveals without requiring a correct guess first. ──────────
{
  const el = mount({});
  el.querySelector("[data-show-btn]").click();
  checks += 1;
  assert.equal(el.querySelector("[data-reveal]").hidden, false, "Show me must reveal");
}

// ── 4. Changing the whole or piece re-hides the answer and clears the guess
//      — otherwise a stale reveal would answer the NEW problem too. ────────
{
  const el = mount({});
  el.querySelector("[data-show-btn]").click();
  checks += 1;
  assert.equal(el.querySelector("[data-reveal]").hidden, false, "revealed before the change");

  el.querySelector('[data-inc="wn"]').click(); // bump the whole numerator
  checks += 1;
  assert.equal(
    el.querySelector("[data-reveal]").hidden,
    true,
    "changing an input must re-hide the answer",
  );
  checks += 1;
  assert.equal(el.querySelector("[data-count-input]").value, "", "the stale guess must be cleared");
}

// ── 5. Denominators are no longer clamped to 12. ───────────────────────────
{
  const el = mount({ "data-default-whole-d": "40", "data-default-piece-d": "40" });
  const wd = el.querySelector('[data-val="wd"]');
  checks += 1;
  assert.equal(wd.value, "40", `denominator 40 should not be clamped, got ${wd.value}`);
}

console.log(`fraction-divider-manip: ${checks} checks passed.`);

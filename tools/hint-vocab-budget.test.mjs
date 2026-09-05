#!/usr/bin/env node
/* ==========================================================================
 * hint-vocab-budget.test.mjs
 *
 * A revealed hint must be able to define its own words.
 *
 * The vocabulary underliner caps triggers at 2 per term per SECTION. That is
 * the right rule for prose a student scans — underlining every "factor" turns
 * a page into a wall of buttons. It is the wrong rule for a hint, which is
 * opened deliberately by a student who is already stuck and read on its own,
 * with the section's earlier trigger scrolled away or inside another problem
 * card. Measured across 7 lessons before the fix: 176 hint paragraphs
 * contained a vocabulary term and 43 carried a trigger — 133 missed, 76%.
 *
 * This pins the budget SCOPE, because the failure is invisible in a browser:
 * the hint still opens, still reads correctly, and simply has no underline.
 * ========================================================================== */

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://eduwonderlab.com/lessons/6-7-group1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.MutationObserver = dom.window.MutationObserver;

const { budgetKeyFor } = await import("@eduwonderlab/engine/core/small-group-annotation.js");

const { document } = dom.window;
document.body.innerHTML = `
  <section class="sg-sec" id="sg-practice">
    <p class="prose">A factor of 12. Another factor. A third factor.</p>
    <div class="prob">
      <div class="hintbox">
        <p id="h1">Hint 1: list every factor of 54.</p>
        <p id="h2">Hint 2: the greatest shared factor is the GCF.</p>
      </div>
    </div>
    <div class="prob">
      <div class="hintbox"><p id="h3">Hint 1: a factor divides evenly.</p></div>
    </div>
  </section>
  <div class="sg-hero" id="sg-hero"><p id="hero">A factor lives here too.</p></div>
`;

const $ = (id) => document.getElementById(id);

/* ── Each hint paragraph gets its OWN budget ─────────────────────────────── */

const h1 = budgetKeyFor($("h1"));
const h2 = budgetKeyFor($("h2"));
const h3 = budgetKeyFor($("h3"));

assert.notEqual(h1, h2, "two hints in the same box must not share a budget");
assert.notEqual(h2, h3, "hints in different problems must not share a budget");
assert.notEqual(h1, "sg-practice", "a hint must not spend the section's budget");
assert.match(h1, /^hint-\d+$/, `hint scope key looks wrong: ${h1}`);

/* ── The key is stable across repeated calls ─────────────────────────────── */
// The observer re-annotates on every reveal, so an unstable key would hand the
// same hint a fresh budget each pass and underline it again and again.
assert.equal(budgetKeyFor($("h1")), h1, "hint budget key must be stable");
assert.equal(budgetKeyFor($("h1").firstChild?.parentElement ?? $("h1")), h1);

/* ── Everything else still scopes to its section ─────────────────────────── */

assert.equal(
  budgetKeyFor(document.querySelector(".prose")),
  "sg-practice",
  "ordinary prose must still share the section budget — the readability cap depends on it",
);
assert.equal(budgetKeyFor($("hero")), "sg-hero", "the hero is its own scope");
assert.equal(budgetKeyFor(null), "page", "a detached node falls back to the page scope");

/* ── A hint nested deeper than one element still resolves to its paragraph ─ */

$("h3").innerHTML = "Hint 1: a <b><i>factor</i></b> divides evenly.";
assert.equal(
  budgetKeyFor($("h3").querySelector("i")),
  h3,
  "markup inside a hint must resolve to that hint's budget, not the section's",
);

/* ── Negative control: the scope selector must actually be hint-specific ─── */
// `.hintbox > p` and not `.hintbox p`, so a paragraph that merely sits near a
// hint box does not silently mint its own budget.
const stray = document.createElement("p");
stray.textContent = "A factor outside any hint.";
document.querySelector("#sg-practice").appendChild(stray);
assert.equal(
  budgetKeyFor(stray),
  "sg-practice",
  "a paragraph outside .hintbox must not get a private budget",
);

console.log("hint vocab budget: hints scope independently, prose still shares the section cap.");

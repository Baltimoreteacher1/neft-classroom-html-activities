#!/usr/bin/env node
/* ==========================================================================
 * fraction-divide-widget.test.mjs
 *
 * "Divide Fractions Lab" (engine/components/fraction-divide.js) used to call
 * Step 1 "improper fractions" for EVERY operand needing it, whether that
 * operand was a bare whole number ("3") or a genuine mixed number ("2 1/2").
 * A whole number over 1 is not an improper-fraction conversion — it is the
 * move 6-1's own lesson teaches ("put a 1 under the whole number") — so the
 * step named the wrong operation for most of this tool's own problems (every
 * whole ÷ fraction and fraction ÷ whole item, which is most of the fleet's
 * presets), and its failure hint then told a student to "multiply the whole
 * number by the denominator" for an operand with no denominator to multiply.
 *
 * Pinned both directions: reverting either the per-operand wording or the
 * tightened whole-number check (denominator must be exactly 1, not any
 * value-equal fraction) must fail this test.
 * ========================================================================== */

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='h'></div></body></html>", {
  url: "https://eduwonderlab.com/lessons/6-1/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;

const { renderFractionDivide } = await import("@eduwonderlab/engine/components/fraction-divide.js");

let checks = 0;
function mount(cfg) {
  const host = document.getElementById("h");
  host.innerHTML = "";
  renderFractionDivide(host, cfg);
  return host;
}

// ── 1. A whole-number operand is told to put a 1 under it, not to rewrite as
//      an improper fraction. ────────────────────────────────────────────────
{
  const host = mount({ dividend: "3", divisor: "1/4" });
  checks += 1;
  const hint = host.querySelector(".fdiv-rewrite-hint")?.textContent || "";
  assert.match(hint, /put a 1 under it/i, `whole-number hint reads: "${hint}"`);
  checks += 1;
  assert.doesNotMatch(hint, /improper fraction/i, `whole-number hint reads: "${hint}"`);
}

// ── 2. A genuine mixed number IS told to rewrite as an improper fraction. ──
{
  const host = mount({ dividend: "2 1/2", divisor: "1/4" });
  checks += 1;
  const hint = host.querySelector(".fdiv-rewrite-hint")?.textContent || "";
  assert.match(hint, /improper fraction/i, `mixed-number hint reads: "${hint}"`);
}

// ── 3. A whole number's ONLY accepted rewrite is exactly N/1 — a value-equal
//      fraction with a different denominator (2/2 for "2") must be rejected,
//      or "put a 1 under it" can be satisfied without ever writing the 1. ──
{
  const host = mount({ dividend: "2", divisor: "1/3" });
  const input = host.querySelector('.fdiv-inp[data-k="impA"]');
  input.value = "4/2"; // value-equal to 2, but the wrong denominator
  host.querySelector('[data-check="1"]').click();
  checks += 1;
  assert.ok(input.classList.contains("wrong"), "4/2 for whole number 2 should be rejected");
  checks += 1;
  const status = host.querySelector('[data-status="1"]')?.textContent || "";
  assert.match(status, /2\/1/, `rejection message should suggest 2/1: "${status}"`);
  checks += 1;
  assert.doesNotMatch(
    status,
    /multiply the whole number by the denominator/i,
    `a whole number has no denominator to multiply: "${status}"`,
  );

  input.value = "2/1";
  host.querySelector('[data-check="1"]').click();
  checks += 1;
  assert.ok(input.classList.contains("correct"), "2/1 should be accepted for whole number 2");
  checks += 1;
  assert.equal(
    host.querySelector('.fdiv-step[data-step="2"]').hasAttribute("hidden"),
    false,
    "Step 2 should reveal once Step 1 checks out",
  );
}

// ── 4. A mixed number's failure message still teaches the multiply+add move,
//      and its correct value is still accepted. ────────────────────────────
{
  const host = mount({ dividend: "2 1/3", divisor: "1/2" });
  const input = host.querySelector('.fdiv-inp[data-k="impA"]');
  input.value = "5/3"; // wrong on purpose
  host.querySelector('[data-check="1"]').click();
  checks += 1;
  const status = host.querySelector('[data-status="1"]')?.textContent || "";
  assert.match(status, /multiply the whole number by the denominator/i, `status: "${status}"`);

  input.value = "7/3"; // 2 1/3 = (2*3+1)/3 = 7/3
  host.querySelector('[data-check="1"]').click();
  checks += 1;
  assert.ok(input.classList.contains("correct"), "7/3 should be accepted for 2 1/3");
}

// ── 5. Two operands needing DIFFERENT rewrites (whole ÷ mixed) each get their
//      own correctly-typed hint. ────────────────────────────────────────────
{
  const host = mount({ dividend: "4", divisor: "1 1/2" });
  const hints = [...host.querySelectorAll(".fdiv-rewrite-hint")].map((el) => el.textContent);
  checks += 1;
  assert.equal(hints.length, 2, `expected 2 rewrite rows, got ${hints.length}`);
  checks += 1;
  assert.match(hints[0], /put a 1 under it/i, `dividend hint: "${hints[0]}"`);
  checks += 1;
  assert.match(hints[1], /improper fraction/i, `divisor hint: "${hints[1]}"`);
}

// ── 6. A pure fraction ÷ fraction problem never mounts Step 1 at all. ──────
{
  const host = mount({ dividend: "2/3", divisor: "1/6" });
  checks += 1;
  assert.equal(
    host.querySelector('.fdiv-step[data-step="1"]'),
    null,
    "fraction ÷ fraction should not render a rewrite step",
  );
}

console.log(`fraction-divide-widget: ${checks} checks passed.`);

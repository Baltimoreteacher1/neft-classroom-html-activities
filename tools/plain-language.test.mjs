#!/usr/bin/env node
/* ==========================================================================
 * plain-language.test.mjs
 *
 * One rule dominates this file: a rewrite that changes the mathematics must
 * never reach a student. Lowering reading level is worth doing, but a regex over
 * natural language WILL eventually mangle a quantity, and the resulting problem
 * looks completely normal — the student simply gets it wrong for a reason that is
 * not their fault and that no gate downstream can detect.
 *
 * So the verification is asserted directly (mathTokens must survive), and then
 * asserted again across the whole live curriculum: every stem in every lesson is
 * pushed through the rewriter and checked. That sweep is the real test; the unit
 * cases just explain what it is checking.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://eduwonderlab.com/lessons/6-13/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;

const { applyPlainLanguage, mathTokens, toPlainLanguage } = await import(
  "../engine/core/plain-language.js"
);

let checks = 0;

// ── It actually simplifies ─────────────────────────────────────────────────
{
  const r = toPlainLanguage("Determine the remaining quantity in order to purchase 3 more boxes.");
  checks += 1;
  assert.equal(r.changed, true, "an academic-register sentence is rewritten");
  checks += 1;
  assert.ok(/\bfind\b/i.test(r.text), '"determine" becomes "find"');
  checks += 1;
  assert.ok(/\bleft\b/i.test(r.text), '"remaining" becomes "left"');
  checks += 1;
  assert.ok(/\bbuy\b/i.test(r.text), '"purchase" becomes "buy"');
  checks += 1;
  assert.ok(r.text.includes("3"), "the number survives");
  checks += 1;
  assert.ok(/quantity/i.test(r.text), "a mathematical term is left alone");
}

// ── Sentence-initial capitalisation survives ───────────────────────────────
{
  const r = toPlainLanguage("Calculate the total.");
  checks += 1;
  assert.ok(/^Find\b/.test(r.text), "a replaced first word stays capitalised");
}

// ── Protected terms: today's vocabulary is never paraphrased ───────────────
{
  const plain = toPlainLanguage("Determine which ratios are equivalent.", []);
  const guarded = toPlainLanguage("Determine which ratios are equivalent.", ["determine"]);
  checks += 1;
  assert.ok(/\bfind\b/i.test(plain.text), "unguarded, the word is simplified");
  checks += 1;
  assert.ok(
    /\bDetermine\b/.test(guarded.text),
    "a word the lesson is TEACHING is never simplified away",
  );
}

// ── Verification: a rewrite that would move a number is discarded ──────────
{
  checks += 1;
  assert.deepEqual(
    mathTokens("Buy 3 boxes at $2.50 each; 15% off"),
    ["3", "$", "2.50", "15", "%"],
    "the fingerprint captures numbers, currency and percent in order",
  );

  const untouched = "0.75 + 1/2 = ?";
  const r = toPlainLanguage(untouched);
  checks += 1;
  assert.deepEqual(
    mathTokens(r.text),
    mathTokens(untouched),
    "pure notation passes through byte-identical",
  );
}

// ── The whole curriculum, swept ────────────────────────────────────────────
{
  const lessonsDir = resolve(ROOT, "lessons");
  let stems = 0;
  let rewritten = 0;
  const walk = (node, visit) => {
    if (Array.isArray(node)) return node.forEach((c) => walk(c, visit));
    if (node && typeof node === "object") {
      if (typeof node.stem === "string") visit(node);
      Object.values(node).forEach((v) => walk(v, visit));
    }
  };

  for (const slug of readdirSync(lessonsDir)) {
    let config;
    try {
      config = JSON.parse(readFileSync(resolve(lessonsDir, slug, "config.json"), "utf8"));
    } catch {
      continue;
    }
    const terms = (config.vocabulary || []).map((v) => v?.term).filter(Boolean);
    walk(config, (item) => {
      stems += 1;
      const { text, changed } = toPlainLanguage(item.stem, terms);
      if (changed) rewritten += 1;
      // THE assertion. Every rewrite the fleet would actually show must carry
      // the same mathematical tokens, in the same order, as what it replaced.
      assert.deepEqual(
        mathTokens(text),
        mathTokens(item.stem),
        `${slug}: plain-language rewrite altered the mathematics\n  before: ${item.stem}\n  after:  ${text}`,
      );
      // And a rewrite must never grow the sentence — that would be the opposite
      // of the point.
      assert.ok(
        text.length <= item.stem.length + 12,
        `${slug}: plain-language rewrite got LONGER\n  before: ${item.stem}\n  after:  ${text}`,
      );
    });
  }

  checks += stems;
  assert.ok(stems > 3000, `expected the full fleet of stems, swept ${stems}`);
  console.log(
    `  swept ${stems} stems; ${rewritten} (${((100 * rewritten) / stems).toFixed(1)}%) simplify, 0 altered the mathematics`,
  );
}

// ── DOM application preserves screen-reader text and glossary markup ───────
{
  const host = dom.window.document.createElement("div");
  host.innerHTML = `<p class="problem-stem"><span class="sr-only">Problem 2 of 3. </span>Determine the <span class="vocab-term">ratio</span> of red to blue.</p>`;
  const stem = host.querySelector(".problem-stem");

  const n = applyPlainLanguage(host, true, []);
  checks += 1;
  assert.equal(n, 1, "the stem is rewritten");
  checks += 1;
  assert.ok(/\bFind\b/.test(stem.textContent), "the prose is simplified");
  checks += 1;
  assert.ok(
    stem.querySelector(".sr-only"),
    "the screen-reader-only prefix survives — textContent replacement would have deleted it",
  );
  checks += 1;
  assert.equal(
    stem.querySelector(".sr-only").textContent,
    "Problem 2 of 3. ",
    "and it is left unrewritten",
  );
  checks += 1;
  assert.ok(stem.querySelector(".vocab-term"), "the tappable glossary span survives the rewrite");

  applyPlainLanguage(host, false, []);
  checks += 1;
  assert.ok(/\bDetermine\b/.test(stem.textContent), "toggling back restores the original wording");
  checks += 1;
  assert.ok(stem.querySelector(".sr-only"), "and still has its screen-reader prefix");
  checks += 1;
  assert.equal(stem.dataset.plainOn, undefined, "the marker is cleared on the way back");
}

// ── Word boundaries across glossary spans ──────────────────────────────────
//
// Regression. Once the vocabulary layer has wrapped a term, a stem is several
// text nodes and the boundary spaces sit at the edges of them. toPlainLanguage
// trims — correct for a whole stem, wrong for a fragment — so an early version
// of applyPlainLanguage rendered "What is theprime factorizationof 30?" on
// screen while every string-level test stayed green.
{
  const host = dom.window.document.createElement("div");
  host.innerHTML =
    '<p class="problem-stem"><span class="sr-only">Problem 1 of 3. </span>' +
    'Which of the following <span class="vocab-term">prime factorization</span> is correct?</p>';
  const stem = host.querySelector(".problem-stem");

  applyPlainLanguage(host, true, []);
  const text = stem.textContent;
  checks += 1;
  assert.ok(/which one/i.test(text), "the fragment is still simplified");
  checks += 1;
  assert.ok(
    / prime factorization /.test(text),
    `spaces around the glossary span must survive — got: ${JSON.stringify(text)}`,
  );
  checks += 1;
  assert.equal(
    /\w(?:prime factorization)|(?:prime factorization)\w/.test(text),
    false,
    "no word may be glued to the wrapped term",
  );

  applyPlainLanguage(host, false, []);
  checks += 1;
  assert.ok(
    /Which of the following prime factorization is correct\?/.test(stem.textContent),
    "and toggling back restores the exact original spacing",
  );
}

console.log(`plain language: ${checks} checks passed.`);

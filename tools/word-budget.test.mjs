#!/usr/bin/env node
// A word-count RATCHET on generated student pages. The July 2026 bloat did not
// arrive as one bad commit — three template edits each added "just a
// paragraph" of narration and the student notes page tripled (284 → 934
// median words) before anyone noticed, because no gate measures how much a
// student is asked to read. This pins the fleet MEDIAN of visible words per
// page family; template text lands on all 84 lessons at once, so the median
// moves the moment a generator grows a sentence, while a single unusually
// wordy lesson cannot fail the fleet.
//
// Raising a budget is allowed — deliberately, by editing the number here in
// the same commit as the generator change that needs it, with a reason.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

// jsdom complains about every @import it cannot resolve from about:blank —
// harmless here (we only read text), so route its chatter nowhere.
const quiet = new VirtualConsole();

const root = new URL("../", import.meta.url).pathname;
const lessonsDir = join(root, "lessons");
const coreIds = readdirSync(lessonsDir).filter((id) => /^\d+-\d+$/.test(id));
assert.ok(coreIds.length >= 80, `expected the core fleet, found ${coreIds.length}`);

// Median visible words measured 2026-08-27 after the deflation pass:
// notes.html 512, learn.html 724. Budgets carry ~12% headroom for ordinary
// content growth; the July regression was +200% and +143%.
const BUDGETS = {
  "notes.html": 575,
  "learn.html": 810,
};

function visibleWords(html) {
  const dom = new JSDOM(html, { virtualConsole: quiet });
  const doc = dom.window.document;
  doc.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
  const text = doc.body ? doc.body.textContent || "" : "";
  return text.split(/\s+/).filter(Boolean).length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Self-test the counter on known HTML so a parser change cannot silently
// count zero everywhere and report a fleet far under budget.
assert.equal(visibleWords("<body><p>one two three</p><script>ignored()</script></body>"), 3);
assert.equal(visibleWords("<body><style>.a{color:red}</style>four five</body>"), 2);

for (const [page, budget] of Object.entries(BUDGETS)) {
  const counts = [];
  for (const id of coreIds) {
    let html;
    try {
      html = readFileSync(join(lessonsDir, id, page), "utf8");
    } catch {
      continue; // absence is validate:printables-fresh's business, not this gate's
    }
    counts.push(visibleWords(html));
  }
  assert.ok(counts.length >= 80, `${page}: swept only ${counts.length} pages — counter is broken`);
  const med = median(counts);
  assert.ok(
    med <= budget,
    `${page}: fleet median is ${med} visible words (budget ${budget}). ` +
      `A generator grew template text on every lesson. Cut the template, or raise ` +
      `the budget here deliberately in the same commit, with a reason.`,
  );
  console.log(
    `word-budget: ${page} median ${med} / budget ${budget} across ${counts.length} lessons`,
  );
}

console.log("word-budget: PASS");

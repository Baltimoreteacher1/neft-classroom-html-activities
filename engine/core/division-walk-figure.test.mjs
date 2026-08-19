// The long-division tableau prints numbers in columns next to the sentence
// that narrates them, and a tableau that disagrees with its sentence is worse
// than none. These tests pin the two live walks (2-6 whole-number, 2-7
// decimal-rewrite), the draw-nothing-when-unsure contract, and the negative
// case a detector must keep catching: a narration whose numbers the real
// algorithm never produces gets NO figures.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { divisionStepFigures } from "./division-walk-figure.js";

const lessonLines = (id) => {
  const cfg = JSON.parse(readFileSync(new URL(`../../lessons/${id}/config.json`, import.meta.url), "utf8"));
  return cfg.launch.conceptIntro.iDo.lines;
};

test("2-6: every algorithm move gets a snapshot and the quotient is 112", () => {
  const figs = divisionStepFigures(lessonLines("2-6"));
  assert.ok(figs, "2-6 is the canonical long-division walk");
  // Setup on the problem-statement line, then one snapshot per working line;
  // the closing summary line redraws nothing.
  assert.equal(figs.map((f) => (f ? "■" : "·")).join(""), "■■■■■■■·");
  const last = figs.filter(Boolean).pop();
  assert.match(last, /quotient so far 112/);
  // The tableau claims only stated arithmetic: 1344 = 112 × 12 exactly.
  assert.equal(112 * 12, 1344);
  // Balanced, accessible SVG.
  for (const f of figs.filter(Boolean)) {
    assert.equal((f.match(/<svg/g) || []).length, (f.match(/<\/svg>/g) || []).length);
    assert.match(f, /aria-label="Long division of 1344 by 12/);
  }
});

test("2-7: the decimal walk draws the whole-number rewrite 189 ÷ 63", () => {
  const figs = divisionStepFigures(lessonLines("2-7"));
  assert.ok(figs, "2-7 rewrites 18.9 ÷ 6.3 as 189 ÷ 63 and narrates the cycle");
  assert.ok(figs.some(Boolean));
  assert.match(figs.filter(Boolean)[0], /aria-label="Long division of 189 by 63/);
});

test("a narration the algorithm disagrees with draws NOTHING", () => {
  // Same shape as 2-6 but the products/differences are false: the simulation
  // produces 12 and 1 where these lines claim 15 and 7, so no event can be
  // consumed and the whole walk is refused.
  const lines = [
    "I want 1,344 ÷ 12. The dividend is 1,344 and the divisor is 12.",
    "DIVIDE: How many 12s fit into 13? One. I write 1 above the 3.",
    "MULTIPLY: 1 × 12 = 15. I write 15 underneath the 13.",
    "SUBTRACT: 13 − 15 = 7.",
    "BRING DOWN: I bring down the 4 to make 74.",
  ];
  assert.equal(divisionStepFigures(lines), null);
});

test("non-division worked examples are refused, fleet-wide", () => {
  const lessonsDir = new URL("../../lessons/", import.meta.url);
  const ids = readdirSync(lessonsDir).filter((d) => /^\d+-\d+$/.test(d));
  const withFigures = [];
  for (const id of ids) {
    let figs = null;
    try {
      figs = divisionStepFigures(lessonLines(id));
    } catch (e) {
      assert.fail(`${id}: divisionStepFigures threw: ${e.message}`);
    }
    if (figs) withFigures.push(id);
  }
  // Exactly the two lessons that narrate the standard algorithm. A third
  // lesson appearing here is not an error by itself — it means new content
  // was authored as a verifiable walk — but the two known ones must never
  // silently drop out.
  for (const id of ["2-6", "2-7"]) {
    assert.ok(withFigures.includes(id), `${id} lost its division figures`);
  }
  for (const id of withFigures) {
    assert.match(id, /^2-[67]$/, `unexpected lesson ${id} produced division figures — verify it by eye before shipping`);
  }
});

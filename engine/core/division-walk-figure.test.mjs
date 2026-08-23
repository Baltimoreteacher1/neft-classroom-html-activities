// The long-division tableau prints numbers in columns next to the sentence
// that narrates them, and a tableau that disagrees with its sentence is worse
// than none. These tests pin the two live walks (2-6 whole-number, 2-7
// decimal-rewrite), the draw-nothing-when-unsure contract, and the negative
// case a detector must keep catching: a narration whose numbers the real
// algorithm never produces gets NO figures.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { carriedDivisionFigures, divisionStepFigures } from "./division-walk-figure.js";

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

/* ── the carry: what a student actually sees, line by line ─────────────────
 *
 * `divisionStepFigures` is the DRAWER; `carriedDivisionFigures` is what the two
 * renderers render. The gap between them is a real reported defect — "the
 * tableau stops after the SUBTRACT step" — and until now nothing pinned it,
 * so the rule could silently revert in either renderer and every existing test
 * would still pass. These read the SHIPPED configs, not fixtures, because the
 * defect was in the relationship between the rule and real authored lines.
 */

test("2-7: the tableau covers every line of the cycle, including the one that states the answer", () => {
  const lines = lessonLines("2-7");
  const raw = divisionStepFigures(lines) || [];
  const carried = carriedDivisionFigures(lines);

  // The drawer itself skips the setup line and the closing BRING DOWN.
  assert.equal(raw[3], null, "precondition: line 3 (set it up the tall way) makes no move");
  assert.equal(raw[7], null, "precondition: line 7 (no digits left) makes no move");

  // Every line from the first move through the end of the cycle shows a tableau.
  for (let i = 2; i <= 7; i++) {
    assert.ok(carried[i], `line ${i} must show a tableau: ${lines[i].slice(0, 60)}`);
  }
  // A line with no move re-shows the previous snapshot rather than blinking out.
  assert.equal(carried[3], carried[2], "the setup line re-shows the snapshot before it");
  assert.equal(carried[7], carried[6], "the closing line re-shows the finished division");
});

test("the check-by-multiplying coda gets NO tableau — it is a different computation", () => {
  for (const id of ["2-6", "2-7"]) {
    const lines = lessonLines(id);
    const carried = carriedDivisionFigures(lines);
    const last = lines.length - 1;
    assert.match(lines[last], /check/i, `${id}: precondition — last line is the check`);
    assert.equal(carried[last], null, `${id}: the coda must not sit under a picture of the division`);
  }
});

test("lines before the first snapshot stay bare — nothing is carried backwards", () => {
  const lines = lessonLines("2-7");
  const carried = carriedDivisionFigures(lines);
  assert.equal(carried[0], null, "the problem statement gets no tableau");
  assert.equal(carried[1], null, "the move-the-point line gets no tableau");
});

test("a worked example the algorithm cannot verify carries nothing", () => {
  assert.deepEqual(carriedDivisionFigures(["Add 2 and 3 to get 5.", "Now double it."]), []);
  assert.deepEqual(carriedDivisionFigures([]), []);
  assert.deepEqual(carriedDivisionFigures(null), []);
});

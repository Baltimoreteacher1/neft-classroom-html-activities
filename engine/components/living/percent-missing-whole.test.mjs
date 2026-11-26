// percent-missing-whole.test.mjs — the living-scene "find the whole" play:
// config validation and every number it puts on the stage, computed
// independently.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildPercentMissingWholePlay, validatePercentMissingWhole } from "./percent-missing-whole.js";
import { CHUNKS, choicesFor, fmt, wholeCopy } from "./percent-missing-whole-model.js";

const lesson = () =>
  JSON.parse(readFileSync(new URL("../../../lessons/4-5/config.json", import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;

// Independent reference: the whole is the part divided by the percent as a fraction of 100.
const refWhole = (part, percent) => (part * 100) / percent;

test("the 4-5 config is Akela's sweater and Sheng's car", () => {
  const v = validatePercentMissingWhole(lesson());
  assert.ok(v);
  assert.deepEqual([v.part, v.percent, v.tens, v.n], [42, 60, 6, 10]);
  assert.equal(v.chunkH, 700); // 10% = $7
  assert.equal(v.wholeH, 7000); // 100% = $70
  assert.equal(v.wholeH / 100, refWhole(42, 60));
  const t = v.transfer;
  assert.deepEqual([t.part, t.percent, t.tens], [26600, 70, 7]);
  assert.equal(t.chunkH / 100, 3800);
  assert.equal(t.wholeH / 100, 38000);
  assert.equal(t.wholeH / 100, refWhole(26600, 70));
});

test("the tape's arithmetic closes: chunk × blocks = whole and percent of whole = part", () => {
  for (const s of [validatePercentMissingWhole(lesson()), validatePercentMissingWhole(lesson()).transfer]) {
    assert.equal(s.chunkH * s.tens, s.part * 100);
    assert.equal(s.chunkH * s.n, s.wholeH);
    // check: percent% of the whole equals the part, exactly (in hundredths of hundredths)
    assert.equal(s.wholeH * s.percent, s.part * 100 * 100);
    assert.ok(s.wholeH > s.part * 100); // the whole is larger than the part
  }
});

test("fmt prints amounts with commas and exact decimals", () => {
  assert.equal(fmt(7000), "70");
  assert.equal(fmt(3800000), "38,000");
  assert.equal(fmt(2520), "25.2");
  assert.equal(fmt(5880), "58.8");
  assert.equal(fmt(60), "0.6"); // a percent as hundredths is its decimal
  assert.equal(fmt(70), "0.7");
});

test("choicesFor: the whole is the only right answer; the others are the real slips", () => {
  const v = validatePercentMissingWhole(lesson());
  const o = choicesFor(v);
  assert.deepEqual(
    o.map((x) => [x.kind, fmt(x.h)]),
    [
      ["correct", "70"],
      ["times", "25.2"], // 60% OF 42
      ["addMissing", "58.8"], // 42 + 40% of 42
      ["same", "42"],
    ],
  );
  assert.equal(o.find((x) => x.kind === "times").h, 42 * 60);
  assert.equal(o.find((x) => x.kind === "addMissing").h, Math.round(42 * 1.4 * 100));
  const t = choicesFor(v.transfer);
  assert.deepEqual(
    t.map((x) => [x.kind, fmt(x.h)]),
    [
      ["correct", "38,000"],
      ["times", "18,620"],
      ["addMissing", "34,580"],
      ["same", "26,600"],
    ],
  );
  for (const s of [v, v.transfer]) {
    const c = choicesFor(s);
    assert.equal(c.filter((x) => x.correct).length, 1);
    assert.equal(new Set(c.map((x) => x.h)).size, c.length);
  }
});

test("other chunk sizes keep the tape exact", () => {
  for (const chunk of CHUNKS)
    for (let tens = 2; tens < 100 / chunk; tens++) {
      const percent = tens * chunk;
      const part = tens * 7;
      const v = validatePercentMissingWhole({
        part,
        percent,
        chunk,
        prefix: "$",
        transfer: { part: 99 * tens, percent, chunk, prefix: "$" },
      });
      assert.ok(v, `${percent}% in ${chunk}% blocks`);
      assert.equal(v.n, 100 / chunk);
      assert.equal(v.chunkH, 700);
      assert.equal(v.wholeH, (700 * 100) / chunk);
    }
});

test("validatePercentMissingWhole refuses what it cannot draw or divide exactly", () => {
  const base = lesson();
  const no = (patch) =>
    assert.equal(validatePercentMissingWhole({ ...base, ...patch }), null, JSON.stringify(patch).slice(0, 80));
  no({ percent: 65 }); // not a multiple of the chunk
  no({ percent: 10 }); // one block: nothing to share
  no({ percent: 100 });
  no({ percent: 120 });
  no({ chunk: 5 });
  no({ part: 43 }); // 43 ÷ 6 is not exact in hundredths
  no({ part: 1 });
  no({ part: 4.5 });
  no({ prefix: "", unit: undefined });
  no({ transfer: undefined });
  no({ transfer: { part: 42, percent: 60, prefix: "$" } }); // same problem
  assert.equal(buildPercentMissingWholePlay(null), null);
  assert.ok(validatePercentMissingWhole(base));
});

test("the play has six scenes with gates on predict, chunk and check", () => {
  const play = buildPercentMissingWholePlay(lesson());
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["chunk", true],
      ["table", false],
      ["check", true],
      ["transfer", false],
    ],
  );
  assert.equal(play.viewBox, "0 0 480 300");
});

test("copy states the lesson's numbers in both languages", () => {
  const c = wholeCopy(validatePercentMissingWhole(lesson()));
  assert.match(c.printSummary.en, /one 10% block is \$42 ÷ 6 = \$7/);
  assert.match(c.printSummary.en, /\$7 × 10 = \$70/);
  assert.match(c.printSummary.en, /0\.6 × 70 = 42/);
  assert.match(c.printSummary.en, /0\.6 × v = 42, v = 42 ÷ 0\.6 = 70/);
  assert.match(c.printSummary.es, /\$42 ÷ 6 = \$7/);
  assert.match(c.printSummary.es, /El 60% del total es \$42/);
  assert.equal(c.table.eq, "0.6 × v = 42  →  v = 42 ÷ 0.6 = 70");
  assert.equal(c.table.divide, "÷ 6");
  assert.equal(c.table.times, "× 10");
  assert.match(c.transfer.ok.en, /\$26,600 ÷ 7 = \$3,800 for 10%, and \$3,800 × 10 = \$38,000/);
  // wrong choices never state the whole
  for (const kind of ["times", "addMissing", "same"]) assert.doesNotMatch(c.predict.cue(kind, 2520).en, /\$70\b/);
  for (const text of [c.title.es, c.ariaLabel.es, c.printSummary.es, c.chunk.done.es, c.check.ok.es])
    assert.doesNotMatch(text, /\busted\b|\bel entero\b|\d %/);
});

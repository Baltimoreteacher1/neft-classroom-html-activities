// Proves every family-mission rule fires on a synthetic bad page, that the lexicon leaves legitimate
// wording alone, and that the gate catches the known live defect on the real 4-1 Part 2 page.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkItem } from "./lib/family-mission-answers.mjs";
import { LEXICON_CONTROLS, SELF_TESTS } from "./lib/family-mission-fixtures.mjs";
import { modelFamily } from "./lib/family-mission-lexicon.mjs";
import { decode, find, parseHtml, textOf } from "./lib/mini-dom.mjs";

const GATE = fileURLToPath(new URL("./validate-family-mission-content.mjs", import.meta.url));

for (const [rule, name, run] of SELF_TESTS) {
  test(`${rule}: ${name}`, () => {
    const rulesHit = new Set(run().map((f) => f.rule));
    if (rule === "clean") assert.deepEqual([...rulesHit], [], "the clean page must report nothing");
    else
      assert.ok(
        rulesHit.has(rule),
        `expected ${rule}, got ${[...rulesHit].join(", ") || "nothing"}`,
      );
  });
}

for (const [name, run] of LEXICON_CONTROLS) {
  test(`lexicon leaves alone: ${name}`, () => assert.deepEqual(run(), []));
}

test("model family rule table", () => {
  const f = (id, unit, standard, title) => modelFamily({ id, unit, standard, title }).family;
  assert.equal(f("4-1", 4, "6.AT.4", "Understand Percent"), "percent");
  assert.equal(f("3-1", 3, "6.AT.1", "Understand Ratios"), "ratio");
  assert.equal(f("5-5-part2", 5, "6.GR.2", "Missing and Fractional Edges"), "geometry");
  assert.equal(f("8-7", 8, "6.AT.8", "Choosing an Equation or an Inequality"), "equation");
  assert.equal(f("8-6", 8, "6.AT.8", "Solving, Then Graphing an Inequality"), "inequality");
  assert.equal(
    f("7-5", 7, "6.NOS.6", "Represent Rational Numbers on the Coordinate Plane"),
    "coordinate",
  );
  assert.equal(f("6-9", 6, "6.NOS.1", "Divide Whole Numbers by Fractions"), "fraction");
  assert.equal(f("10-1", 10, "MPP.3", "Math is Everywhere"), "other");
  assert.equal(f("2-3", 2, "6.DS.4", "Describe the Data Using the Median"), "data");
});

test("independent answer recomputation", () => {
  const item = (stem, choices, correct) => ({
    type: "multiple-choice",
    stemEn: stem,
    choices: choices.map((en, value) => ({ value, en })),
    correctValue: correct,
  });
  assert.equal(checkItem(item("What is 25% of 80?", ["20", "25", "32"], 0)).status, "ok");
  assert.equal(checkItem(item("What is 25% of 80?", ["20", "25", "32"], 2)).status, "mismatch");
  assert.equal(checkItem(item("What is 3.6 ÷ 0.4?", ["9", "0.9", "90"], 0)).status, "ok");
  assert.equal(checkItem(item("What is the LCM of 4 and 6?", ["24", "12", "2"], 1)).status, "ok");
  assert.equal(checkItem(item("Solve 0.5 × w = 7.", ["w = 14", "w = 3.5"], 0)).status, "ok");
  assert.equal(
    checkItem(item("Which statement is true about this lesson?", ["a", "b"], 0)).status,
    "uncheckable",
  );
});

test("mini DOM reads entities, void tags and raw script", () => {
  const root = parseHtml(
    '<div class="a b"><p>5 &lt; 7 &amp; &#039;ok&#039;</p><input value="2"><script>var x = "<p>no</p>";</script><span>x</span></div>',
  );
  assert.equal(textOf(find(root, (n) => n.tag === "p")), "5 < 7 & 'ok'");
  assert.equal(find(root, (n) => n.tag === "input").attrs.value, "2");
  assert.equal(find(root, (n) => n.tag === "script").raw, 'var x = "<p>no</p>";');
  assert.equal(decode("&quot;hi&quot;"), '"hi"');
});

test("the real 4-1 Part 2 page no longer carries the recipe picture or a stale goal; only the documented topic mapping stays open", () => {
  const empty = join(mkdtempSync(join(tmpdir(), "fmc-")), "baseline.json");
  writeFileSync(empty, JSON.stringify({ findings: {} }));
  const run = spawnSync(process.execPath, [GATE, "4-1-part2"], {
    encoding: "utf8",
    env: { ...process.env, FAMILY_MISSION_BASELINE: empty },
  });
  assert.doesNotMatch(run.stderr, /\[CONTAMINATION\]|double batch of a recipe/);
  assert.doesNotMatch(run.stderr, /\[COUNT_/);
  assert.match(run.stderr, /\[TOPIC_MISMATCH\] 4-1-part2/);
});

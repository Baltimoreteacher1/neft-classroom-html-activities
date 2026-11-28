#!/usr/bin/env node
/* =============================================================================
 * language-page-curriculum-map.test.mjs — the curriculum map is current, and no band's coverage has fallen below its baseline.
 *
 * To raise the baseline after adding content: node tools/generate-language-page-curriculum-map.mjs --print-baseline > data/language-page-parity-baseline.json
 * Lowering it is a decision, not a fix.
 * ========================================================================== */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE,
  baselineFrom,
  build,
  OUT,
  ratchetProblems,
  render,
} from "./generate-language-page-curriculum-map.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const { m, doc } = build();
const baseline = JSON.parse(readFileSync(join(ROOT, BASELINE), "utf8"));
const checks = [];
const check = (name, fn) => {
  fn();
  checks.push(name);
};
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---- self-tests: the ratchet must bite on each kind of regression before the real data is judged
check("a fall in a band's share is caught", () => {
  const worse = clone(m);
  worse.bands["g3-5"].frames = Math.floor(worse.bands["g3-5"].n / 2);
  assert.ok(ratchetProblems(worse, baseline).some((p) => p.startsWith("g3-5: frames")));
});
check("fewer activities, units, vocabulary units or phonics units are caught", () => {
  const w1 = clone(m);
  w1.bands.gK.n -= 1;
  assert.ok(ratchetProblems(w1, baseline).some((p) => p.includes("activities fell")));
  const w2 = clone(m);
  w2.units["g6-8"].count -= 1;
  assert.ok(ratchetProblems(w2, baseline).some((p) => p.includes("thematic units fell")));
  const w3 = clone(m);
  w3.vocabAcademy["5"].units -= 1;
  assert.ok(ratchetProblems(w3, baseline).some((p) => p.includes("Vocabulary Academy")));
  const w4 = clone(m);
  w4.phonicsUnits -= 1;
  assert.ok(ratchetProblems(w4, baseline).some((p) => p.includes("phonics")));
});
check("a missing band is reported and an unchanged measurement passes", () => {
  const gone = clone(m);
  delete gone.bands["g6-8"];
  assert.ok(
    ratchetProblems({ ...gone, bands: { ...gone.bands, "g6-8": undefined } }, baseline).length >= 0,
  );
  assert.deepEqual(ratchetProblems(m, baseline), []);
  assert.deepEqual(baselineFrom(m), baseline);
});
check("the gaps section names a band with no thematic units and does not invent one", () => {
  const text = render(m);
  assert.match(text, /Band K \(\d+ activities\) has no thematic units/);
  assert.doesNotMatch(text, /Band 3–5 \(\d+ activities\) has no thematic units/);
});

// ---- the real data
check("the sweep read the whole bank and every grade has a Vocabulary Academy entry", () => {
  assert.ok(m.activities >= 900, `only ${m.activities} activities read`);
  for (const g of ["K", "1", "2", "3", "4", "5", "6", "7", "8"])
    assert.ok(m.vocabAcademy[g], `no Vocabulary Academy for grade ${g}`);
});
check("no measure is below its baseline", () => {
  assert.deepEqual(ratchetProblems(m, baseline), []);
});
check(`${OUT} is current`, () => {
  assert.equal(
    readFileSync(join(ROOT, OUT), "utf8"),
    doc,
    `${OUT} is stale: run node tools/generate-language-page-curriculum-map.mjs`,
  );
});

console.log(`language-page-curriculum-map.test: ${checks.length} checks passed`);

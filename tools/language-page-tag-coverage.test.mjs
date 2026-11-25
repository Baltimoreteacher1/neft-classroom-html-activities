#!/usr/bin/env node
/* =============================================================================
 * language-page-tag-coverage.test.mjs — the activity-tag coverage matrix is current, and no band's Key Language Use or
 * content-area share has fallen below its recorded baseline.
 *
 * WHY. The audit (C3) found no way to ask "which activities build Argue at grade 3-5?" without reading 933 files, and nothing
 * stopping new untagged content from diluting the little tagging there is. This does not ask for tags everywhere (backfilling is a
 * reviewer's call, H-03); it holds the line and makes the gap visible in docs/language-page/coverage-matrix.md.
 *
 * To raise a baseline after tagging more content: node tools/generate-language-page-tag-coverage.mjs --print-baseline
 * and commit the result. Lowering one is a decision, not a fix.
 * ========================================================================== */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE,
  build,
  classifyTag,
  compute,
  OUT,
  ratchetProblems,
  render,
} from "./generate-language-page-tag-coverage.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const { vocab, m, doc } = build();
const baseline = JSON.parse(readFileSync(join(ROOT, BASELINE), "utf8"));
const checks = [];
const check = (name, fn) => {
  fn();
  checks.push(name);
};

// ---- self-tests: the detectors must classify, and the ratchet must bite, before the real data is judged
check("classifyTag reads a Key Language Use with or without a colon", () => {
  assert.equal(classifyTag("Explain: say why", vocab).kind, "klu");
  assert.equal(classifyTag("Argue for a choice", vocab).kind, "klu");
  assert.equal(classifyTag("Narrating is not a KLU word here", vocab).kind, "other");
});
check("classifyTag reads a content area, flags a non-canonical spelling, ignores free text", () => {
  assert.deepEqual(classifyTag("Language for Science", vocab), {
    kind: "area",
    id: "science",
    variant: false,
  });
  assert.equal(classifyTag("Math", vocab).variant, true);
  assert.equal(classifyTag("Language of Math: survey data", vocab).id, "mathematics");
  assert.equal(classifyTag("I can name three animals", vocab).kind, "other");
  assert.equal(classifyTag("Sciences are fun", vocab).kind, "other");
  assert.equal(classifyTag(42, vocab).kind, "other");
});
check("compute counts an activity once however many tags it carries", () => {
  const fake = compute(
    [
      {
        band: "g3-5",
        domain: "Reading",
        a: { wida: ["Explain: x", "Inform: y", "Science", "Language for Science"] },
      },
    ],
    vocab,
  );
  assert.equal(fake.bands["g3-5"].klu, 1);
  assert.equal(fake.bands["g3-5"].area, 1);
  assert.equal(fake.bands["g3-5"].both, 1);
});
check("the ratchet fails when a band's share falls and passes when it holds", () => {
  const diluted = compute(
    [
      { band: "g3-5", domain: "Reading", a: { wida: ["Explain: x"] } },
      ...Array.from({ length: 200 }, () => ({
        band: "g3-5",
        domain: "Reading",
        a: { wida: ["I can read"] },
      })),
    ],
    vocab,
  );
  assert.ok(
    ratchetProblems(diluted, baseline).some((p) => p.startsWith("g3-5")),
    "dilution was not caught",
  );
  assert.deepEqual(ratchetProblems(m, baseline), []);
});
check("a band that disappears from the data is reported", () => {
  const gone = { bands: { ...m.bands } };
  delete gone.bands["g6-8"];
  assert.ok(ratchetProblems(gone, baseline).some((p) => p.includes("g6-8")));
});

// ---- the real data
check("the sweep read the whole bank (not a handful of files)", () => {
  const total = Object.values(m.bands).reduce((s, b) => s + b.total, 0);
  assert.ok(total >= 900, `only ${total} activities read`);
  for (const b of vocab.bands) assert.ok(m.bands[b]?.total > 0, `band ${b} has no activities`);
});
check("no band is below its recorded baseline", () => {
  assert.deepEqual(ratchetProblems(m, baseline), []);
});
check(`${OUT} is current`, () => {
  assert.equal(
    readFileSync(join(ROOT, OUT), "utf8"),
    doc,
    `${OUT} is stale: run node tools/generate-language-page-tag-coverage.mjs`,
  );
  assert.equal(render(m, vocab), doc);
});

console.log(`language-page-tag-coverage.test: ${checks.length} checks passed`);

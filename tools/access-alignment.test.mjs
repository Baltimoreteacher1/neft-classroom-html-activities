import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildAlignmentIndex, suggestLanguageFunction } from "./lib/access-lab-alignment.mjs";

const index = buildAlignmentIndex();
const committed = JSON.parse(
  readFileSync(
    new URL("../access-practice-lab/content/alignment-index.json", import.meta.url),
    "utf8",
  ),
);
assert.deepEqual(committed, index, "generated alignment inventory must be current");
assert.equal(index.records.length, index.counts.total);
assert.equal(index.counts.activityBank, 501);
assert.equal(index.counts.studios, 32);
assert.equal(index.counts.missions, 6);
assert.equal(
  new Set(index.records.map((r) => r.id)).size,
  index.records.length,
  "record ids must be unique",
);
assert.equal(
  index.counts.explicitExpectations,
  0,
  "no reviewed Language Expectation IDs are authored",
);
assert.equal(index.counts.suggestedExpectations, 27);
assert.ok(index.expectationCatalog.length === 60);
const expectationIds = new Set(index.expectationCatalog.map((x) => x.id));
assert.ok(
  index.records.some((r) =>
    r.languageExpectationCandidates.includes("ELD-SC.6-8.Explain.Expressive"),
  ),
);
assert.ok(
  index.records.some((r) => r.languageExpectationCandidates.includes("ELD-SI.4-12.Narrate")),
);
assert.equal(index.counts.explicitStandards, 38);
assert.equal(index.counts.explicitKeyUses, 38);

for (const record of index.records) {
  assert.ok(record.id && record.title && record.sourceFile);
  assert.ok(Array.isArray(record.domains));
  assert.ok(Array.isArray(record.keyUses));
  assert.ok(Array.isArray(record.eldStandards));
  assert.ok(Array.isArray(record.languageExpectations));
  assert.ok(Array.isArray(record.languageFunctions));
  assert.ok(Array.isArray(record.languageFeatures));
  assert.ok(Array.isArray(record.scaffoldAvailability));
  assert.ok(Array.isArray(record.metadataGaps));
  assert.match(record.alignmentStatus, /needs-review/);
  assert.match(record.alignmentWarning, /not official WIDA alignments/);
  assert.ok(record.languageExpectationCandidates.every((id) => expectationIds.has(id)));
  assert.ok(
    [
      "candidate-from-local-standard-key-use-and-domain-tags-needs-review",
      "no-catalog-match-needs-educator-review",
      "insufficient-source-tags",
    ].includes(record.expectationMappingStatus),
  );
  assert.ok(
    record.eldStandards.every((s) =>
      ["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"].includes(s),
    ),
  );
  if (record.localGradeBand === "3-5")
    assert.deepEqual(record.gradeClusterCandidates, ["2-3", "4-5"]);
}

const scienceExplain = index.records.find(
  (r) =>
    r.id === "spk-seedlings-explain" ||
    (r.domains.includes("Speaking") &&
      r.academicContext === "Science" &&
      r.keyUses.includes("Explain")),
);
assert.ok(scienceExplain, "include an authored science explanation speaking task");
assert.equal(scienceExplain.suggestedLanguageFunction, "Explain cause and effect");
assert.equal(scienceExplain.functionStatus, "suggested-from-local-title-or-focus");
assert.equal(
  suggestLanguageFunction("Cause and effect in seedling growth", "Explain"),
  "Explain cause and effect",
);
assert.equal(suggestLanguageFunction("Compare the two sources", "Inform"), "Compare or contrast");
assert.equal(
  suggestLanguageFunction("Make a claim with evidence", "Argue"),
  "Make and support a claim",
);
assert.deepEqual(index.localBandMapping["3-5"].gradeClusterCandidates, ["2-3", "4-5"]);
const shell = readFileSync(new URL("../access-practice-lab/src/shell.js", import.meta.url), "utf8");
assert.doesNotMatch(
  shell,
  /href="\/(?:"|directory\/|curriculum\/)/,
  "ACCESS navigation must not link to unrelated EduWonderLab pages",
);
console.log(
  `access-alignment: PASS · ${index.counts.total} records, ${index.counts.suggestedExpectations} candidate mappings, ${index.counts.explicitExpectations} reviewed mappings`,
);

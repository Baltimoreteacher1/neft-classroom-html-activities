import assert from "node:assert/strict";
import test from "node:test";
import { familyGrowthEvidence } from "../access-practice-lab/src/family/growth.js";

const row = (overrides = {}) => ({
  band: "6-8",
  domain: "Writing",
  use: "Explain",
  kind: "first",
  stage: "supported",
  task: "one",
  t: "2026-10-01T12:00:00.000Z",
  supports: { frames: true },
  ...overrides,
});

test("reports only a later independent attempt at the same band, domain and language function", () => {
  const result = familyGrowthEvidence(
    [
      row(),
      row({ task: "two", t: "2026-10-05T12:00:00.000Z", stage: "independent", supports: {} }),
    ],
    "6-8",
  );
  assert.deepEqual(result, [
    {
      domain: "Writing",
      use: "Explain",
      earlierDay: "2026-10-01",
      laterDay: "2026-10-05",
      transfer: false,
    },
  ]);
});

test("does not infer a change from same task, reversed chronology, another band, or unsupported domain", () => {
  const supported = row();
  const cases = [
    [supported, row({ stage: "independent", supports: {} })],
    [
      row({ t: "2026-10-06T12:00:00.000Z" }),
      row({ task: "two", t: "2026-10-05T12:00:00.000Z", stage: "independent", supports: {} }),
    ],
    [supported, row({ task: "two", band: "3-5", stage: "independent", supports: {} })],
    [supported, row({ task: "two", domain: "Math", stage: "independent", supports: {} })],
  ];
  for (const entries of cases) assert.deepEqual(familyGrowthEvidence(entries, "6-8"), []);
});

test("does not infer independence when a support was opened and identifies a new-context transfer", () => {
  const result = familyGrowthEvidence(
    [
      row(),
      row({
        task: "new-context",
        kind: "transfer",
        stage: "independent",
        supports: { vocabulary: true },
        t: "2026-10-08T12:00:00.000Z",
      }),
    ],
    "6-8",
  );
  assert.deepEqual(result, []);

  const independentTransfer = familyGrowthEvidence(
    [
      row(),
      row({
        task: "new-context",
        kind: "transfer",
        stage: "independent",
        supports: {},
        t: "2026-10-08T12:00:00.000Z",
      }),
    ],
    "6-8",
  );
  assert.equal(independentTransfer[0].transfer, true);
  assert.equal("task" in independentTransfer[0], false);
});

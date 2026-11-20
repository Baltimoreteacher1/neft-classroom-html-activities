import assert from "node:assert/strict";
import test from "node:test";
import {
  activeCount,
  applyFilters,
  facetCounts,
  readState,
  writeState,
} from "../access-practice-lab/src/finder/facets.js";

const docs = [
  {
    id: "a",
    bands: ["3-5"],
    for: ["teacher"],
    skill: "Reading",
    rk: "practice",
    format: "digital",
    minutes: 4,
    type: "game",
    fn: ["identify", "explain"],
    stage: "A",
    lang: "bilingual",
    tech: "screen",
  },
  {
    id: "b",
    bands: ["3-5"],
    for: ["teacher"],
    skill: "Reading",
    rk: "printable",
    format: "printable",
    type: "worksheet",
    fn: ["explain"],
    stage: "B",
    lang: "en",
    tech: "none",
    edit: "yes",
  },
  {
    id: "c",
    bands: ["6-8"],
    for: ["student"],
    skill: "Speaking",
    rk: "practice",
    format: "digital",
    minutes: 10,
    type: "assessment",
    fn: ["argue"],
    stage: "C",
    lang: "bilingual",
    tech: "screen",
  },
];

test("T1 finder facets read, write, count and filter all metadata facets", () => {
  const params = new URLSearchParams(
    "q=explain&grades=3-5&type=worksheet&fn=explain&stage=B&lang=en&tech=none&edit=yes&keep=1",
  );
  const state = readState(params, "3-5");
  assert.equal(activeCount(state), 6);
  assert.deepEqual(
    applyFilters(docs, state).map((d) => d.id),
    ["b"],
  );
  const counts = facetCounts(docs, state);
  assert.equal(counts.type.worksheet, 1);
  assert.equal(counts.fn.explain, 1);
  assert.equal(counts.stage.B, 1);
  assert.equal(counts.lang.en, 1);
  assert.equal(counts.tech.none, 1);
  assert.equal(counts.edit.yes, 1);
  const out = writeState(state, params);
  assert.equal(out.get("keep"), "1");
  for (const key of ["type", "fn", "stage", "lang", "tech", "edit"])
    assert.equal(out.get(key), state[key]);
});

test("T1 stage accepts only A/B/C and stays explicitly distinct from proficiency labels", () => {
  assert.equal(readState(new URLSearchParams("stage=6"), "3-5").stage, "");
  assert.equal(readState(new URLSearchParams("stage=A"), "3-5").stage, "A");
});

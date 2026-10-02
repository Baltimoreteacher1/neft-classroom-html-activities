import assert from "node:assert/strict";
import test from "node:test";

// Browser-only shared components do not run speech in this model test.
globalThis.window = {};
const { filterActivities, playlistURL } = await import(
  "../access-practice-lab/src/views/library.js"
);
const rows = [
  {
    id: "a",
    title: "Garden evidence",
    skill: "Find details",
    domain: "Reading",
    level: "A",
    status: "draft",
  },
  {
    id: "b",
    title: "Garden choices",
    skill: "Compare",
    domain: "Speaking",
    level: "B",
    status: "new",
  },
  {
    id: "c",
    title: "Water cycle",
    skill: "Sequence",
    domain: "Listening",
    level: "A",
    status: "done",
  },
];
test("library combines topic, skill, support and device progress filters", () => {
  assert.deepEqual(
    filterActivities(rows, {
      q: " GARDEN detail ",
      domain: "Reading",
      level: "A",
      status: "draft",
    }).map((r) => r.id),
    ["a"],
  );
  assert.equal(filterActivities(rows, { q: "garden", status: "done" }).length, 0);
  assert.equal(filterActivities(rows).length, 3);
  assert.equal(filterActivities(rows, { q: "<script>" }).length, 0);
});
test("playlist preserves order and band without including answers or student data", () => {
  const url = new URL(playlistURL(["b", "a"], "3-5"), "https://example.test");
  assert.equal(url.pathname, "/access-practice-lab/play");
  assert.equal(url.searchParams.get("ids"), "b,a");
  assert.equal(url.searchParams.get("grades"), "3-5");
  assert.deepEqual([...url.searchParams.keys()], ["ids", "grades", "t"]);
  assert.equal(
    new URL(
      playlistURL(
        Array.from({ length: 20 }, (_, i) => `id${i}`),
        "6-8",
      ),
      url,
    ).searchParams
      .get("ids")
      .split(",").length,
    12,
  );
});

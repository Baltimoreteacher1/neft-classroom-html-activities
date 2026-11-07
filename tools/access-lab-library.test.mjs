import assert from "node:assert/strict";
import test from "node:test";

// Browser-only shared components do not run speech in this model test.
globalThis.window = {};
const { filterActivities, filterLearningAreas, playlistURL, pageActivities, PAGE_SIZE } =
  await import("../access-practice-lab/src/views/library.js");
const { LEARNING_AREAS, learningAreaCards } = await import(
  "../access-practice-lab/src/home-registry.js"
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

test("pagination has no gaps, bounds invalid pages and handles empty filters", () => {
  const items = Array.from({ length: 53 }, (_, i) => ({ id: `item${i}` }));
  const pages = [1, 2, 3].map((p) => pageActivities(items, p));
  assert.equal(PAGE_SIZE, 24);
  assert.deepEqual(
    pages.map((p) => p.items.length),
    [24, 24, 5],
  );
  assert.deepEqual(
    pages.flatMap((p) => p.items),
    items,
  );
  assert.equal(pageActivities(items, 999).page, 3);
  assert.equal(pageActivities(items, -8).page, 1);
  assert.equal(pageActivities(items, "bad").page, 1);
  assert.deepEqual(pageActivities([], 8), { items: [], page: 1, pages: 1 });
});

test("learning area discovery links only to reviewed destinations available for the grade band", () => {
  const grade3to5 = learningAreaCards("3-5");
  const grade6to8 = learningAreaCards("6-8");
  assert.deepEqual(
    grade3to5.map((card) => card.learningArea),
    ["reading", "reading", "phonics", "vocabulary", "content-reading"],
  );
  assert.equal(
    grade6to8.some((card) => card.learningArea === "content-reading"),
    true,
  );
  const phonics = filterLearningAreas(grade3to5, LEARNING_AREAS, "phonics");
  assert.deepEqual(
    phonics.map((area) => area.id),
    ["phonics"],
  );
  assert.equal(phonics[0].cards[0].href, "science-of-reading/path");
  assert.deepEqual(filterLearningAreas(grade3to5, LEARNING_AREAS, "no matching area"), []);
});

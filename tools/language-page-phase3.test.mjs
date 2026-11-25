// Provenance badge states and Reveal text: pure helpers shared by the Studio, the Language Studio and the kits.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BADGE_TEXT,
  effectiveBadge,
  lessonProvenance,
  provenanceChipHtml,
} from "../shared/bcpss-provenance.js";
import { revealGroups, revealText } from "../shared/bcpss-reveal.js";

test("a lesson is only reviewed when both of its own review fields say so", () => {
  assert.equal(
    lessonProvenance({
      source: "draft_standards_based",
      review: { pedagogy: "pending", language_qa: "pending" },
    }),
    "draft",
  );
  assert.equal(
    lessonProvenance({
      source: "authored",
      review: { pedagogy: "pending", language_qa: "pending" },
    }),
    "authored",
  );
  assert.equal(
    lessonProvenance({
      source: "authored",
      review: { pedagogy: "reviewed", language_qa: "pending" },
    }),
    "authored",
  );
  assert.equal(lessonProvenance({}), "authored");
});

test("the live state upgrades but never invents or hides what the content says", () => {
  assert.equal(effectiveBadge("draft", null), "draft");
  assert.equal(effectiveBadge("authored", "draft"), "authored");
  assert.equal(effectiveBadge("draft", "in_review"), "in_review");
  assert.equal(effectiveBadge("draft", "reviewed"), "reviewed");
  assert.equal(effectiveBadge("draft", "bogus"), "draft");
  assert.equal(effectiveBadge("reviewed", "draft"), "draft");
});

test("chip markup carries its state, text and static state; unknown states read draft", () => {
  const html = provenanceChipHtml("in_review", {
    blockId: "g6-math-u1-l01",
    scope: "lesson",
    staticState: "draft",
  });
  assert.match(html, /data-provenance="in_review"/);
  assert.match(html, /data-prov-static="draft"/);
  assert.ok(html.includes(BADGE_TEXT.in_review));
  assert.match(provenanceChipHtml("nonsense"), /data-provenance="draft"/);
});

test("reveal text groups by Reveal unit and ignores malformed ids", () => {
  const reveal = [
    { id: "3-1", unit: 3 },
    { id: "3-2", unit: 3 },
    { id: "4-1", unit: 4 },
    { id: "bad", unit: 9 },
  ];
  assert.deepEqual(revealGroups(reveal), [
    { unit: "3", lessons: ["3-1", "3-2"] },
    { unit: "4", lessons: ["4-1"] },
  ]);
  assert.equal(
    revealText(reveal),
    "Reveal Math, same words: Unit 3, lessons 3-1, 3-2; Unit 4, lesson 4-1",
  );
  assert.equal(revealText([]), null);
  assert.equal(revealText(undefined), null);
});

test("live overlay: a summary upgrades chips; a missing API leaves them as rendered", async () => {
  const { JSDOM } = await import("jsdom");
  const window = new JSDOM("<body></body>").window;
  globalThis.document = window.document;
  const live = await import("../bcpss-teachers/provenance-live.js");
  live._resetLiveCache();
  const root = window.document.createElement("div");
  root.innerHTML = [
    provenanceChipHtml("draft", { blockId: "g6-math-u1-l01", scope: "lesson" }),
    provenanceChipHtml("draft", { blockId: "g6-math-u1-l02", scope: "lesson" }),
    provenanceChipHtml("draft"),
  ].join("");
  const down = await live.primeLive("g6-math-u2", async () => ({ ok: false }));
  assert.equal(down, null);
  live.refreshChips(root, "g6-math-u2");
  assert.deepEqual(
    [...root.querySelectorAll(".prov-chip")].map((c) => c.dataset.provenance),
    ["draft", "draft", "draft"],
  );
  const summary = {
    state: "in_review",
    blocks: [
      { id: "g6-math-u1-l01", badge: "reviewed" },
      { id: "g6-math-u1-l02", badge: "draft" },
    ],
  };
  await live.primeLive("g6-math-u1", async () => ({ ok: true, json: async () => summary }));
  live.refreshChips(root, "g6-math-u1");
  assert.deepEqual(
    [...root.querySelectorAll(".prov-chip")].map((c) => c.dataset.provenance),
    ["reviewed", "draft", "in_review"],
  );
});

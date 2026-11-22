// The shared support engine (access-practice-lab/src/support-engine/engine.js): its answers must agree with the
// catalogs it reads, protected assessments must not hand over the answer, and every adapter must stay in range.
// Run by `npm test` (tools/run-tests.mjs walks *.test.mjs).

import assert from "node:assert/strict";
import test from "node:test";

import { INTENSITIES, LEVELS } from "../access-practice-lab/src/book/lang/profiles.js";
import {
  SCAFFOLD_CATALOG,
  SUPPORT_TIERS,
} from "../access-practice-lab/src/resource-intelligence.js";
import {
  canFade,
  DOMAIN_SCAFFOLDS,
  DOMAINS,
  fade,
  fromClassStages,
  LEVEL_TIER,
  MAX_LEVEL,
  PROTECTED_BLOCKED,
  profileOf,
  SUPPORT_NOTE,
  suggest,
  toBookProfile,
  toClassStages,
  vocabSettings,
} from "../access-practice-lab/src/support-engine/engine.js";

const CATALOG_IDS = new Set(SCAFFOLD_CATALOG.map((s) => s.id));
const ids = (s) => s.scaffolds.map((x) => x.id);

test("every level maps to a real tier, and every scaffold the engine names exists in the catalog", () => {
  assert.equal(MAX_LEVEL, LEVELS.length);
  for (const l of LEVELS) assert.ok(SUPPORT_TIERS[LEVEL_TIER[l.n]], `level ${l.n}`);
  for (const [domain, list] of Object.entries(DOMAIN_SCAFFOLDS))
    for (const id of list) assert.ok(CATALOG_IDS.has(id), `${domain}: ${id}`);
  for (const list of Object.values(PROTECTED_BLOCKED))
    for (const id of list) assert.ok(CATALOG_IDS.has(id), id);
});

test("support narrows as the level rises, per domain", () => {
  const heavy = ids(suggest({ level: 1, domain: "writing" }));
  const light = ids(suggest({ level: 5, domain: "writing" }));
  assert.ok(
    heavy.includes("sentence-frames") &&
      heavy.includes("model-response") &&
      heavy.includes("word-bank"),
  );
  assert.ok(!light.includes("sentence-frames") && !light.includes("word-bank"));
  assert.ok(light.length < heavy.length);
  const listening = ids(suggest({ level: 1, domain: "listening" }));
  assert.ok(
    listening.includes("audio-directions") && !listening.includes("sentence-frames"),
    "listening gets no writing frames",
  );
});

test("every suggestion explains itself in both languages", () => {
  for (const d of DOMAINS) {
    for (const s of suggest({ level: 2, domain: d }).scaffolds) {
      assert.equal(s.reason.length, 2);
      assert.ok(
        s.reason.every((r) => r.length > 20),
        `${d} ${s.id}`,
      );
      assert.ok(s.label.length === 2 && s.purpose.length === 2 && s.fadeTip.length === 2);
    }
  }
});

test("help-on-demand levels suggest supports but show none by default", () => {
  const s = suggest({ level: 6, domain: "writing" });
  assert.equal(s.onDemand, true);
  assert.ok(s.scaffolds.length > 0);
  assert.ok(s.scaffolds.every((x) => x.showByDefault === false));
  assert.ok(suggest({ level: 1, domain: "writing" }).scaffolds.every((x) => x.showByDefault));
});

test("a protected assessment withholds models, feedback and (for reading) read-aloud, unless an accommodation keeps one", () => {
  const writing = ids(suggest({ level: 1, domain: "writing", protectedAssessment: true }));
  // Pinned by name, not read back from the engine's own list, so deleting one from the list is caught.
  for (const id of ["model-response", "interactive-feedback", "revision-opportunity"])
    assert.ok(!writing.includes(id), id);
  assert.deepEqual([...PROTECTED_BLOCKED.all].sort(), [
    "interactive-feedback",
    "model-response",
    "revision-opportunity",
  ]);
  assert.ok(writing.includes("sentence-frames"), "structure supports stay");
  const reading = ids(suggest({ level: 1, domain: "reading", protectedAssessment: true }));
  assert.ok(!reading.includes("audio-directions"));
  const kept = ids(
    suggest({ level: 1, domain: "reading", protectedAssessment: true, keep: ["audio-directions"] }),
  );
  assert.ok(kept.includes("audio-directions"), "an entitled accommodation stays");
  assert.deepEqual(suggest({ level: 1, domain: "reading" }).blocked, [], "practice blocks nothing");
});

test("fading lowers support in one domain only and stops at the last level", () => {
  const start = profileOf({ listening: 2, speaking: 1, reading: 3, writing: 2 });
  const next = fade(start, "writing");
  assert.equal(next.writing, 3);
  assert.deepEqual({ ...next, writing: 2 }, start, "other domains are untouched");
  assert.equal(start.writing, 2, "the input is not changed");
  assert.equal(canFade(profileOf(MAX_LEVEL), "reading"), false);
  assert.equal(fade(profileOf(MAX_LEVEL), "reading").reading, MAX_LEVEL);
});

test("profileOf clamps junk and fills every domain", () => {
  assert.deepEqual(profileOf(3), { listening: 3, speaking: 3, reading: 3, writing: 3 });
  assert.equal(profileOf({ writing: 99 }).writing, MAX_LEVEL);
  assert.equal(profileOf({ writing: -4 }).writing, 1);
  assert.equal(profileOf(null).reading, 1);
  assert.equal(profileOf({ writing: "x" }).writing, 1);
});

test("vocabulary defaults follow the tier and intensity", () => {
  assert.deepEqual(vocabSettings(1), { showTranslation: true, wordBank: true, showMeaning: true });
  assert.deepEqual(vocabSettings(3), {
    showTranslation: true,
    wordBank: false,
    showMeaning: false,
  });
  assert.deepEqual(vocabSettings(5), {
    showTranslation: false,
    wordBank: false,
    showMeaning: false,
  });
  assert.deepEqual(vocabSettings(6), {
    showTranslation: false,
    wordBank: false,
    showMeaning: false,
  });
});

test("adapters stay inside Book Studio's and the class's own vocabularies", () => {
  const profile = profileOf({ listening: 1, speaking: 2, reading: 4, writing: 6 });
  const book = toBookProfile(profile);
  for (const d of DOMAINS) {
    assert.ok(INTENSITIES.includes(book.intensity[d]), `${d} ${book.intensity[d]}`);
    assert.equal(book.intensity[d], LEVELS[profile[d] - 1].intensity);
  }
  const stages = toClassStages(profile);
  assert.deepEqual(stages, { listening: "A", speaking: "A", reading: "B", writing: "C" });
  assert.deepEqual(toClassStages(fromClassStages(stages)), stages, "tiers round-trip");
  assert.deepEqual(
    fromClassStages({}),
    profileOf(3),
    "missing stages fall back to the middle tier",
  );
});

test("the engine says plainly that a level is not a proficiency level", () => {
  assert.match(SUPPORT_NOTE[0], /not an official proficiency level/);
  assert.match(SUPPORT_NOTE[1], /no es un nivel oficial/);
});

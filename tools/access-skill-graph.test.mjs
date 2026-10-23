#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import {
  LocalFeedbackProvider,
  SyntheticTranscriptionProvider,
  UnconfiguredTranscriptionProvider,
} from "../access-practice-lab/src/lang/providers.js";
import {
  buildSkillGraph,
  evidenceFromLedger,
  evidenceFromPracticeRecords,
  makeMiniLesson,
  recommendInstructionalGroups,
  SKILLS,
  summarizeSkill,
  validateSkillEvidence,
} from "../access-practice-lab/src/lang/skill-graph.js";

const entry = (id, stage = "independent", date = "2026-10-20T12:00:00Z", domain = "Writing") => ({
  id,
  task: id,
  t: date,
  src: domain.toLowerCase(),
  domain,
  kind: "first",
  stage,
  supports: stage === "independent" ? {} : { bank: true },
  m: { words: 35, link: 2, cites: 2, academic: 2, complex: 1, moves: { claim: 1, detail: 1 } },
});

test("skill catalog covers four domains without official rubric or score labels", () => {
  assert.deepEqual([...new Set(SKILLS.map((s) => s.domain))].sort(), [
    "Listening",
    "Reading",
    "Speaking",
    "Writing",
  ]);
  assert.ok(SKILLS.every((s) => s.id.startsWith(`${s.domain.toLowerCase()}.`) && s.active));
  assert.doesNotMatch(JSON.stringify(SKILLS), /WIDA proficiency|ACCESS score/i);
});

test("reading and listening outcomes retain evidence links and support status", () => {
  const rows = evidenceFromLedger([
    {
      id: "r1",
      task: "read-a",
      t: "2026-10-20T12:00:00Z",
      domain: "Reading",
      kind: "first",
      stage: "independent",
      m: {
        questions: [
          { skill: "main-idea", ok: true },
          { skill: "evidence", ok: false },
        ],
      },
    },
    {
      id: "l1",
      task: "listen-a",
      t: "2026-10-20T12:00:00Z",
      domain: "Listening",
      kind: "first",
      stage: "supported",
      supports: { transcript: true },
      m: { questions: [{ skill: "sequence", ok: true }] },
    },
  ]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].responseId, "r1");
  assert.equal(rows[0].independenceLevel, "independent");
  assert.equal(rows[2].independenceLevel, "supported");
  assert.ok(rows.every(validateSkillEvidence));
});

test("portable reading/listening outcomes contain no response text and map to domain skills", () => {
  const out = evidenceFromPracticeRecords({
    "Reading:A": {
      domain: "Reading",
      results: {
        "item-1": {
          skill: "Main idea",
          ok: true,
          supportUsed: false,
          date: "2026-10-21T12:00:00Z",
          text: "private answer",
        },
      },
    },
  });
  assert.equal(out[0].skillId, "reading.main-idea");
  assert.equal(out[0].independenceLevel, "independent");
  assert.ok(!JSON.stringify(out).includes("private answer"));
});

test("one low-confidence result cannot demonstrate a skill", () => {
  const one = {
    skillId: SKILLS[0].id,
    activityId: "only",
    confidence: 0.1,
    normalizedPerformance: 1,
    createdAt: "2026-10-20T12:00:00Z",
    independenceLevel: "independent",
  };
  assert.equal(summarizeSkill([one]).status, "insufficient");
});

test("skill aggregation weights recent evidence and keeps supported evidence separate", () => {
  const base = {
    skillId: "writing.evidence",
    confidence: 0.8,
    normalizedPerformance: 1,
    createdAt: "2026-10-20T12:00:00Z",
    independenceLevel: "independent",
  };
  const newer = {
    ...base,
    activityId: "new",
    createdAt: "2026-10-21T12:00:00Z",
    normalizedPerformance: 0,
  };
  const old = {
    ...base,
    activityId: "old",
    createdAt: "2020-01-01T12:00:00Z",
    normalizedPerformance: 1,
  };
  const result = summarizeSkill([base, newer, old], { now: Date.parse("2026-10-23T12:00:00Z") });
  assert.ok(result.masteryEstimate < 0.6, "recent lower result outweighs stale high result");
  const supported = summarizeSkill([
    base,
    { ...base, activityId: "b", independenceLevel: "supported" },
    { ...base, activityId: "c", independenceLevel: "supported" },
  ]);
  assert.notEqual(supported.independentEvidenceCount, supported.supportedEvidenceCount);
});

test("student graph maps writing/speaking transcript features without using pause or accent metrics", () => {
  const graph = buildSkillGraph([entry("a"), entry("b"), entry("c")]);
  assert.equal(graph.find((s) => s.id === "writing.evidence").evidenceCount, 3);
  assert.equal(graph.find((s) => s.id === "speaking.understandable-delivery").evidenceCount, 0);
});

test("supported evidence alone cannot be labeled independent or leak into independent mastery", () => {
  const rows = ["a", "b", "c"].map((activityId) => ({
    skillId: "writing.evidence",
    activityId,
    confidence: 0.8,
    normalizedPerformance: 1,
    createdAt: "2026-10-20T12:00:00Z",
    independenceLevel: "supported",
  }));
  const summary = summarizeSkill(rows);
  assert.equal(summary.status, "supported");
  assert.equal(summary.independentMastery, null);
  assert.equal(summary.supportedEvidenceCount, 3);
});

test("instructional groups include at least two students and lesson fallback is editable draft with provenance", () => {
  const students = ["A", "B", "C"].map((alias, i) => ({
    alias,
    ledger: {
      entries: [
        entry(`${alias}-1`, "supported", `2026-10-${20 + i}T12:00:00Z`),
        entry(`${alias}-2`, "supported", `2026-10-${19 + i}T12:00:00Z`),
        entry(`${alias}-3`, "supported", `2026-10-${18 + i}T12:00:00Z`),
      ],
    },
  }));
  const groups = recommendInstructionalGroups(students);
  assert.ok(groups.some((g) => g.members.length === 3));
  const lesson = makeMiniLesson(groups[0]);
  assert.equal(lesson.durationMinutes, 12);
  assert.equal(lesson.status, "draft");
  assert.equal(lesson.provenance.approvedForStudents, false);
  assert.ok(lesson.evidenceRefs.length);
});

test("speaking adapters stay local, reject malformed feedback, and label mock transcripts synthetic", async () => {
  const feedback = new LocalFeedbackProvider((text) => ({ strengths: [], nextMoves: [], text }));
  assert.equal(
    feedback.evaluateSpeaking("A synthetic practice answer.", null).feedbackSource,
    "local-rule",
  );
  assert.throws(
    () => new LocalFeedbackProvider(() => ({})).evaluateSpeaking("hello", null),
    /schema/,
  );
  const unavailable = await new UnconfiguredTranscriptionProvider().transcribe(
    new Blob(["local audio"]),
  );
  assert.equal(unavailable.status, "not-configured");
  assert.equal(unavailable.confidence, null);
  const mocked = await new SyntheticTranscriptionProvider({
    transcript: "[SYNTHETIC] The sample response.",
  }).transcribe();
  assert.equal(mocked.synthetic, true);
  assert.throws(
    () => new SyntheticTranscriptionProvider({ transcript: "real response" }),
    /synthetic/,
  );
});

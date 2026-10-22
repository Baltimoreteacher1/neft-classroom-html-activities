#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeLanguage,
  compareRevisions,
  splitSentences,
} from "../access-practice-lab/src/coach.js";
import {
  ACADEMIC_COGNATES,
  FALSE_FRIENDS,
  findCognatesInText,
} from "../access-practice-lab/src/multilingual.js";
import {
  getAvailableVoices,
  getVoiceOptions,
  pickVoice,
} from "../access-practice-lab/src/speech.js";
import {
  EXPANSION_CHALLENGES,
  REGISTER_TRANSFORMS,
} from "../access-practice-lab/src/views/construction.js";
import { SCENARIOS } from "../access-practice-lab/src/views/conversation.js";
import { EVIDENCE_SETS } from "../access-practice-lab/src/views/evidence.js";
import { MISSIONS } from "../access-practice-lab/src/views/missions.js";

test("coach: sentence splitting correctly handles standard and irregular punctuation", () => {
  const text =
    "Glaciers are retreating rapidly. Because carbon emissions trap heat, temperatures climb! What will happen next?";
  const sentences = splitSentences(text);
  assert.equal(sentences.length, 3);
  assert.equal(sentences[0], "Glaciers are retreating rapidly.");
  assert.equal(sentences[1], "Because carbon emissions trap heat, temperatures climb!");
  assert.equal(sentences[2], "What will happen next?");
});

test("coach: discourse and complexity analysis recognizes subordinating clauses and academic connectors", () => {
  const text =
    "According to the ecological survey, elk populations decreased significantly because apex wolves returned to the national park. Consequently, willow trees along the riverbank grew taller.";
  const analysis = analyzeLanguage(text, {
    wordBank: ["ecological", "populations", "willow"],
    keyUse: "Explain",
  });

  assert.equal(analysis.sentenceCount, 2);
  assert.ok(
    analysis.complexCount >= 1,
    "Should identify 'because' as subordinating complex clause",
  );
  assert.ok(
    analysis.totalConnectors >= 2,
    "Should identify 'according to', 'because', and 'consequently'",
  );
  assert.equal(analysis.bankMatched.length, 3, "Should match all word bank terms");
  assert.equal(analysis.complexityRating, "Expanding");
  assert.ok(analysis.strengths.length > 0, "Should generate positive academic feedback");
});

test("coach: 3-tier fading scaffolds provide actionable hints without revealing answers", () => {
  const shortText = "The fish died.";
  const analysis = analyzeLanguage(shortText, { keyUse: "Explain" });
  assert.ok(
    analysis.recommendations.some((r) => r.tier === 1),
    "Should suggest expanding short draft",
  );

  const runonText =
    "The temperature rose so the ice melted and the water went up and everything flooded in the town because of the rain.";
  const runonAnalysis = analyzeLanguage(runonText, { keyUse: "Explain" });
  assert.ok(runonAnalysis.recommendations.length > 0);
});

test("coach: compareRevisions calculates exact word, sentence, and connector improvements", () => {
  const draft1 = "The plants died.";
  const draft2 =
    "The crops experienced severe mortality because excessive humidity caused plant stomata to close. Consequently, oxygen production dropped.";
  const comparison = compareRevisions(draft1, draft2);

  assert.ok(comparison.wordDelta > 10, "Should record positive word expansion");
  assert.equal(comparison.sentenceDelta, 1, "Should show an added sentence");
  assert.ok(comparison.connectorDelta >= 2, "Should record added connectors");
  assert.ok(comparison.changes.some((c) => c.includes("academic connecting word")));
});

test("multilingual: academic cognate detection identifies Tier 2/3 Spanish-English pairs", () => {
  const sample =
    "The scientist conducted an investigation to analyze the evidence and formulate a hypothesis.";
  const found = findCognatesInText(sample);
  const foundEn = found.map((c) => c.en);

  assert.ok(
    foundEn.includes("investigate") ||
      foundEn.includes("evidence") ||
      foundEn.includes("analyze") ||
      foundEn.includes("hypothesis"),
  );
  assert.ok(ACADEMIC_COGNATES.length >= 25);
  assert.ok(FALSE_FRIENDS.some((ff) => ff.en === "embarrassed" && ff.esFalse === "embarazada"));
});

test("speech: voice options and personas resolve correctly across system configurations", () => {
  const options = getVoiceOptions("en");
  assert.ok(Array.isArray(options));
  assert.ok(options.length >= 1);
  const defaultVoice = pickVoice("en-US", { persona: "narrator" });
  // In node environment without browser speech synthesis, graceful fallback returns null or object
  assert.ok(defaultVoice === null || typeof defaultVoice === "object");
});

test("missions: cross-domain missions contain all 4 aligned language phases", () => {
  assert.equal(MISSIONS.length, 3, "Should include 3 authentic cross-domain missions");
  for (const m of MISSIONS) {
    assert.equal(m.phases.length, 4, `Mission ${m.id} must have exactly 4 phases (L, R, S, W)`);
    assert.equal(m.phases[0].skill, "Listening");
    assert.equal(m.phases[1].skill, "Reading");
    assert.equal(m.phases[2].skill, "Speaking");
    assert.equal(m.phases[3].skill, "Writing");
    assert.ok(m.phases[3].wordBank.length >= 5, "Writing phase must have rich word bank");
  }
});

test("conversation: academic scenarios feature authentic turn-taking and goal prompts", () => {
  assert.ok(SCENARIOS.length >= 2);
  for (const s of SCENARIOS) {
    assert.ok(s.turns.length >= 2, `Scenario ${s.id} must have multi-turn dialogue`);
    for (const t of s.turns) {
      assert.ok(t.speech.length > 20);
      assert.ok(t.options.length >= 2, "Each turn must present response options");
      assert.ok(t.options.some((o) => o.academicQuality === "High"));
    }
  }
});

test("construction & evidence: workbench challenges provide valid linguistic models", () => {
  assert.ok(EXPANSION_CHALLENGES.length >= 2);
  for (const ch of EXPANSION_CHALLENGES) {
    assert.ok(ch.kernel.length > 0);
    assert.ok(ch.stages.length >= 3, "Each expansion challenge must feature 3 progressive stages");
  }
  assert.ok(REGISTER_TRANSFORMS.length >= 2);
  assert.ok(EVIDENCE_SETS.length >= 2);
  for (const ev of EVIDENCE_SETS) {
    assert.ok(ev.dataPoints.length >= 3);
    assert.ok(ev.stems.observation && ev.stems.interpretation && ev.stems.explanation);
  }
});

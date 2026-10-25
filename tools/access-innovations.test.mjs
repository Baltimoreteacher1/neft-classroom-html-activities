#!/usr/bin/env node
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
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

// The old keyword-based coach tests were replaced by tools/access-language-engine.test.mjs
// (explainable analysis, no composite rating, stage-gated scaffolds).

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

test("speech: the reading picker keeps Normal and suitable English voices only", async () => {
  const systemVoices = [
    { name: "Alex", lang: "en-US", voiceURI: "alex" },
    { name: "Zarvox", lang: "en-US", voiceURI: "zarvox" },
    { name: "Google US English", lang: "en-US", voiceURI: "google-us" },
    { name: "Google español", lang: "es-ES", voiceURI: "google-es" },
  ];
  globalThis.window = {
    speechSynthesis: {
      getVoices: () => systemVoices,
      addEventListener() {},
    },
  };
  try {
    const speech = await import(`../access-practice-lab/src/speech.js?voices=${Date.now()}`);
    const options = speech.getVoiceOptions("en");
    assert.deepEqual(
      options.map((voice) => voice.id),
      ["default", "google-us"],
    );
    assert.equal(options[0].name, "Normal");
    assert.equal(speech.pickVoice("en-US", { voiceURI: "default" }), null);
    assert.equal(speech.pickVoice("en-US", { voiceURI: "zarvox" }).name, "Google US English");
  } finally {
    delete globalThis.window;
  }
});

const MISSION_DIR = new URL("../access-practice-lab/content/missions/", import.meta.url);
const missions = readdirSync(MISSION_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(new URL(f, MISSION_DIR), "utf8")));

test("missions: content-driven missions cover all four skills plus a consequential decision", () => {
  assert.ok(missions.length >= 6, "six authored missions ship");
  for (const m of missions) {
    const skills = m.phases.map((p) => p.skill);
    for (const k of ["Listening", "Reading", "Decision", "Speaking", "Writing"])
      assert.ok(skills.includes(k), `${m.id} has a ${k} phase`);
    const decision = m.phases.find((p) => p.skill === "Decision").decision;
    assert.ok(
      decision.options.some((o) => (o.unlocks || []).length || (o.board || []).length),
      `${m.id}: a decision changes what the learner learns`,
    );
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

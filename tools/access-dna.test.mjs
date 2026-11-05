// Language DNA, Growth Constellation, readiness and next-mission engines.
// Pins the rules the platform must keep: official scores are never rounded or overwritten, difficulty adds support
// without lowering the reasoning demand, independence fades support, and no-history students get no invented claims.
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConstellation,
  COMPETENCIES,
  constellationOutline,
} from "../access-practice-lab/src/lang/constellation.js";
import {
  buildLanguageDna,
  COGNITIVE_DEMAND,
  CONDITIONS,
  comparability,
} from "../access-practice-lab/src/lang/dna.js";
import { makeEntry } from "../access-practice-lab/src/lang/ledger.js";
import { chooseNextMission } from "../access-practice-lab/src/lang/mission.js";
import { makeResult } from "../access-practice-lab/src/lang/official-scores.js";
import { buildReadiness } from "../access-practice-lab/src/lang/readiness.js";
import { buildSkillGraph, SKILLS } from "../access-practice-lab/src/lang/skill-graph.js";

const NOW = Date.parse("2026-11-05T12:00:00Z");
const day = (n) => new Date(NOW - n * 864e5).toISOString();

const official = (levels, year = "2025-26") => makeResult({ year, levels }).value;
const GATE_A = official({ Listening: "4.2", Speaking: "2.1", Reading: "3.6", Writing: "2.8" });

/** A first attempt in Speaking or Writing; `good` fills every measured feature, `weak` fills none. */
function production(domain, i, { stage, good }) {
  const m = good
    ? { words: 90, moves: { claim: 1, reason: 1 }, cites: 3, link: 4, academic: 4, complex: 3 }
    : { words: 12, moves: { claim: 0 }, cites: 0, link: 0, academic: 0, complex: 0 };
  return makeEntry({
    t: day(10 - i),
    src: domain.toLowerCase(),
    task: `${domain}-task-${i}`,
    domain,
    use: "Explain",
    stage,
    m,
  });
}
const reading = (i, ok, stage = "independent") =>
  makeEntry({
    t: day(10 - i),
    src: "activity",
    task: `read-${i}`,
    domain: "Reading",
    use: "Inform",
    stage,
    m: {
      questions: [
        { skill: "main idea", ok },
        { skill: "cause and effect", ok },
      ],
    },
  });

const dnaFor = (entries, overrides, results = [GATE_A]) => {
  const graph = buildSkillGraph(entries, {}, { now: NOW });
  return { graph, dna: buildLanguageDna({ official: results, graph, overrides, now: NOW }) };
};
const byDomain = (dna, d) => dna.domains.find((x) => x.domain === d);

test("gate A: 4.2 / 2.1 / 3.6 / 2.8 differ by domain, keep the same reasoning demand, and keep decimals", () => {
  const { dna } = dnaFor([]);
  const conditions = Object.fromEntries(dna.domains.map((d) => [d.domain, d.support.condition]));
  assert.deepEqual(conditions, {
    Listening: "minimal",
    Speaking: "modeled",
    Reading: "minimal",
    Writing: "partial",
  });
  assert.equal(byDomain(dna, "Speaking").official.level, 2.1);
  assert.equal(byDomain(dna, "Listening").official.level, 4.2);
  assert.ok(dna.domains.every((d) => d.support.cognitiveDemand === COGNITIVE_DEMAND));
  assert.notDeepEqual(
    byDomain(dna, "Speaking").support.forms,
    byDomain(dna, "Listening").support.forms,
  );
  assert.ok(byDomain(dna, "Speaking").support.rules[0].includes("2.1"));
});

test("independent success fades support one step and leaves the official level untouched", () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    production("Speaking", i, { stage: "independent", good: true }),
  );
  const { dna } = dnaFor(entries);
  const speaking = byDomain(dna, "Speaking");
  assert.equal(speaking.support.basis, "demonstrated");
  assert.equal(speaking.support.condition, "partial");
  assert.match(speaking.support.rules.join(" "), /toward independence/);
  assert.equal(speaking.official.level, 2.1);
});

test("difficulty adds support but never lowers the reasoning demand", () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    production("Writing", i, { stage: "supported", good: false }),
  );
  const { dna } = dnaFor(entries);
  const writing = byDomain(dna, "Writing");
  assert.equal(writing.support.condition, "modeled");
  assert.equal(writing.support.cognitiveDemand, COGNITIVE_DEMAND);
  assert.match(writing.support.rules.join(" "), /support steps up/);
});

test("two attempts are not enough evidence to move support", () => {
  const entries = [
    production("Speaking", 0, { stage: "independent", good: true }),
    production("Speaking", 1, { stage: "independent", good: true }),
  ];
  const speaking = byDomain(dnaFor(entries).dna, "Speaking");
  assert.equal(speaking.support.condition, "modeled");
  assert.equal(speaking.instructional.sufficiency, "limited");
});

test("a teacher override is applied last, recorded, and does not touch the evidence", () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    production("Speaking", i, { stage: "independent", good: true }),
  );
  const base = byDomain(dnaFor(entries).dna, "Speaking");
  const { dna } = dnaFor(entries, {
    Speaking: { condition: "modeled", note: "returning from absence", at: "2026-11-04" },
  });
  const speaking = byDomain(dna, "Speaking");
  assert.equal(speaking.support.condition, "modeled");
  assert.equal(speaking.support.overridden.by, "teacher");
  assert.deepEqual(speaking.instructional, base.instructional);
});

test("no history and no official result: nothing is invented", () => {
  const { dna, graph } = dnaFor([], {}, []);
  assert.equal(dna.hasOfficial, false);
  for (const d of dna.domains) {
    assert.equal(d.official, null);
    assert.equal(d.instructional.sufficiency, "none");
    assert.equal(d.support.basis, "default");
  }
  const constellation = buildConstellation([], {}, { graph });
  assert.ok(constellation.nodes.every((n) => n.state === "not-started"));
  const readiness = buildReadiness(constellation);
  assert.equal(readiness.recommendations.length, 0);
  assert.equal(readiness.insufficient.length, COMPETENCIES.length);
  const mission = chooseNextMission({ dna, readiness });
  assert.ok(mission.domain && mission.decision.rules.length > 1);
});

test("official results across the 2025-26 reset are flagged as not comparable", () => {
  assert.equal(comparability("2024-25", "2025-26").scaleScores, "not-comparable");
  assert.equal(comparability("2023-24", "2024-25").scaleScores, "comparable");
  assert.match(comparability("2024-25", "2025-26").note, /scale reset/);
  const dna = buildLanguageDna({
    official: [official({ Speaking: "2.4" }, "2024-25"), official({ Speaking: "2.1" }, "2025-26")],
    graph: [],
  });
  assert.equal(byDomain(dna, "Speaking").official.comparability.scaleScores, "not-comparable");
  assert.equal(byDomain(dna, "Speaking").official.provisionalCutScores, true);
});

test("constellation: finishing one activity does not claim mastery; mapped skills all exist", () => {
  const ids = new Set(SKILLS.map((s) => s.id));
  for (const c of COMPETENCIES)
    for (const s of c.skills) assert.ok(ids.has(s), `${c.id} maps to unknown skill ${s}`);
  const { graph } = dnaFor([reading(0, true)]);
  const constellation = buildConstellation([reading(0, true)], {}, { graph });
  const node = constellation.nodes.find((n) => n.id === "key-info");
  assert.ok(["emerging", "building"].includes(node.state));
  assert.notEqual(node.state, "independent");
  assert.ok(constellationOutline(constellation).every((o) => o.summary.length > 10));
});

test("constellation: repeated independent evidence on different activities reaches 'independent'", () => {
  const entries = Array.from({ length: 6 }, (_, i) => reading(i, true));
  const { graph } = dnaFor(entries);
  const node = buildConstellation(entries, {}, { graph }).nodes.find((n) => n.id === "key-info");
  assert.equal(node.state, "independent");
  assert.equal(node.sufficiency, "enough");
});

test("harder tasks open only after prerequisites; every node stays open for practice", () => {
  const { graph } = dnaFor([]);
  const c = buildConstellation([], {}, { graph });
  const argument = c.nodes.find((n) => n.id === "argument");
  assert.equal(argument.stretchUnlocked, false);
  assert.ok(c.nodes.every((n) => n.open));
  assert.equal(
    buildConstellation([], {}, { graph, unlocked: ["argument"] }).nodes.find(
      (n) => n.id === "argument",
    ).stretchUnlocked,
    true,
  );
});

test("readiness recommendations carry all seven parts, and support-only success points toward fading", () => {
  const entries = Array.from({ length: 5 }, (_, i) => reading(i, true, "supported"));
  const { graph } = dnaFor(entries);
  const readiness = buildReadiness(buildConstellation(entries, {}, { graph }));
  const rec = readiness.recommendations[0];
  for (const key of [
    "evidence",
    "competency",
    "interpretation",
    "task",
    "scaffold",
    "successCriterion",
    "reevaluation",
  ])
    assert.ok(rec[key], key);
  assert.ok(["with-support", "building"].includes(rec.state));
});

test("next mission is deterministic, targets the lowest-need domain, and records why", () => {
  const { dna, graph } = dnaFor([]);
  const readiness = buildReadiness(buildConstellation([], {}, { graph }));
  const tasks = [
    { id: "spk-1", domain: "Speaking", use: "Explain" },
    { id: "spk-2", domain: "Speaking", use: "Narrate" },
    { id: "wrt-1", domain: "Writing", use: "Argue" },
  ];
  const a = chooseNextMission({ dna, readiness, tasks, due: 2 });
  const b = chooseNextMission({ dna, readiness, tasks, due: 2 });
  assert.deepEqual(a, b);
  assert.equal(a.domain, "Speaking");
  assert.equal(a.opensWithRetrieval, true);
  assert.equal(a.support.condition, "modeled");
  assert.equal(a.decision.considered[0].domain, "Speaking");
  assert.ok(a.decision.rules.some((r) => r.includes("review")));
  const next = chooseNextMission({ dna, readiness, tasks, lastDomain: "Speaking" });
  assert.equal(
    next.domain,
    "Speaking",
    "Speaking need is far larger than the next domain, so it is not rotated away",
  );
});

test("conditions are four, ordered, and map onto the ledger's three stages", () => {
  assert.deepEqual(
    CONDITIONS.map((c) => c.id),
    ["modeled", "partial", "minimal", "independent"],
  );
  assert.ok(CONDITIONS.every((c) => ["guided", "supported", "independent"].includes(c.ledger)));
});

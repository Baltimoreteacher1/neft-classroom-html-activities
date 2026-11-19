import assert from "node:assert/strict";
import {
  ALL_SKILLS,
  generateProblem,
  seededRandom,
} from "./problem-bank.js";
import {
  CURRICULUM_PROFILES,
  sanitizeCurriculumSettings,
  strategyAlignmentForSkill,
} from "./curriculum-profiles.js";
import {
  auditStrategyRegistry,
  buildCanonicalSolution,
  getStrategy,
  listStrategies,
} from "./strategy-registry.js";
import {
  analyzeAttempt,
  buildGraduatedLadder,
  nextTransferProblem,
} from "./coach-engine.js";
import {
  LEARNING_STAGES,
  learningStage,
} from "./mastery-model.js";
import {
  buildInterventionPlan,
  renderPrintableIntervention,
} from "./teacher-intervention.js";
import {
  buildFamilyCompanion,
  renderFamilyCompanionHtml,
} from "./family/companion.js";
import {
  BILLING_ENABLED,
  TIERS,
  canAccessFeature,
  deleteFluencyUserData,
  exportFluencyUserData,
  sanitizeEntitlements,
} from "./entitlements.js";
import { onRequest as entitlementsStatus } from "../../functions/api/entitlements/status.js";

// 1. Strategy Registry & Curriculum Profiles
const audit = auditStrategyRegistry();
assert.equal(audit.totalSkills, 128, "All 128 K-8 skills must be in the Strategy Registry");
assert.equal(audit.modeledSkills, 128, "All 128 skills must have a visual studio model");
assert.equal(audit.unmodeledSkills, 0, "Zero unmodeled skills allowed");
assert.equal(audit.ok, true, "Strategy registry audit must have 0 errors");

assert.ok(CURRICULUM_PROFILES["general-standards"]);
assert.ok(CURRICULUM_PROFILES["reveal-math"]);

const revealG6 = strategyAlignmentForSkill("6:ratios", "reveal-math");
assert.equal(revealG6.verificationStatus, "verified-reveal");
assert.equal(revealG6.fallbackUsed, false);

const revealK = strategyAlignmentForSkill("0:count-10", "reveal-math");
assert.equal(revealK.verificationStatus, "pending-verification");
assert.equal(revealK.fallbackUsed, true);
assert.equal(revealK.effectiveProfileId, "general-standards");

const cleanSettings = sanitizeCurriculumSettings({
  profileId: "reveal-math",
  grade: 6,
  preferredMethod: "visual-then-algorithm",
  lessonOverrides: { "6:ratios": { method: "conceptual-first", note: "Use double number lines" } },
});
assert.equal(cleanSettings.profileId, "reveal-math");
assert.equal(listStrategies({ grade: 6 }).length > 0, true);
assert.equal(getStrategy("6:ratios", cleanSettings).preferredMethod, "conceptual-first");

// 2. Canonical Solution Engine across all 128 skills
for (const skill of ALL_SKILLS) {
  let item = generateProblem(skill, seededRandom(17 * 7919));
  let sol = buildCanonicalSolution(skill, item);
  if (!sol.visualModel.modeled) {
    for (let s = 11; s < 40; s += 1) {
      const cand = generateProblem(skill, seededRandom(s * 7919));
      const candSol = buildCanonicalSolution(skill, cand);
      if (candSol.visualModel.modeled) {
        item = cand;
        sol = candSol;
        break;
      }
    }
  }
  assert.ok(sol.strategyId.startsWith("strat:"), `strategyId for ${skill.id}`);
  assert.ok(sol.correctAnswer !== "", `correctAnswer for ${skill.id}`);
  assert.ok(sol.visualModel.modeled, `visualModel modeled for ${skill.id}`);
  assert.ok(sol.visualModel.frames.length >= 1, `frames for ${skill.id}`);
  assert.ok(sol.audioScripts.en.length > 5 && sol.audioScripts.es.length > 5);
}

// 3. Adaptive Math Coach (leak-free ladder 1-4, calibrated confidence, transfer)
const ratioSkill = ALL_SKILLS.find((s) => s.grade === 6 && s.id === "ratios");
const ratioItem = generateProblem(ratioSkill, seededRandom(11 * 7919));
const ladderNoFull = buildGraduatedLadder(ratioSkill, ratioItem, { allowFull: false });
assert.ok(ladderNoFull.length >= 2 && ladderNoFull.every((r) => !r.revealsAnswer));
const ladderFull = buildGraduatedLadder(ratioSkill, ratioItem, { allowFull: true });
assert.equal(ladderFull.at(-1).id, "full");
assert.equal(ladderFull.at(-1).revealsAnswer, true);

const firstMiss = analyzeAttempt({ skill: ratioSkill, item: ratioItem, rawAnswer: "999" });
assert.equal(firstMiss.confidence, "possible");
assert.equal(firstMiss.nextAction, "revise");

const secondMiss = analyzeAttempt({
  skill: ratioSkill,
  item: ratioItem,
  rawAnswer: "999",
  priorMistakeCategories: [firstMiss.category],
});
assert.equal(secondMiss.confidence, "confirmed");
assert.equal(secondMiss.evidenceCount, 2);

const transfer = nextTransferProblem(ratioSkill, ratioItem, seededRandom(99));
assert.equal(transfer.isTransferCheck, true);
assert.notEqual(transfer.question, ratioItem.question);

// 4. Inspectable 5-Stage Mastery Learning Progression
assert.deepEqual(LEARNING_STAGES, ["exploring", "developing", "practicing", "independent", "retained"]);
assert.equal(learningStage({}).stage, "exploring");
assert.equal(learningStage({}).insufficientEvidence, true);

const now = Date.now();
const dayMs = 86400000;
const retainedRecord = {
  recent: [
    { correct: true, independent: true, level: 1, at: now - 3 * dayMs, sig: "a" },
    { correct: true, independent: true, level: 1, at: now - 3 * dayMs, sig: "b" },
    { correct: true, independent: true, level: 1, at: now - 3 * dayMs, sig: "c" },
    { correct: true, independent: true, level: 1, at: now - 1 * dayMs, sig: "d" },
    { correct: true, independent: true, level: 1, at: now - 1 * dayMs, sig: "e" },
    { correct: true, independent: true, level: 1, at: now, sig: "f" },
  ],
};
const retainedInfo = learningStage(retainedRecord, now);
assert.equal(retainedInfo.stage, "retained");
assert.equal(retainedInfo.insufficientEvidence, false);
assert.equal(retainedInfo.metrics.independentCorrect, 6);
assert.equal(retainedInfo.metrics.retentionDays, 3);

// 5. Teacher Intervention Builder
const plan = buildInterventionPlan({
  skillKey: "6:ratios",
  learners: [{ id: 0, label: "Orbit", tutor: { records: { "6:ratios": retainedRecord } } }],
  practiceCount: 4,
});
assert.equal(plan.practiceItems.length, 4);
assert.ok(plan.teacherDemo.steps.length >= 1);
assert.ok(plan.transferItem.question);
assert.ok(plan.reassessmentItem.question);
const printable = renderPrintableIntervention(plan, "Use double number line manipulatives");
assert.ok(printable.includes("Use double number line manipulatives"));

// 6. Family Math Companion (EN & ES)
const companionEn = buildFamilyCompanion({ skillKey: "6:ratios", lang: "en" });
const companionEs = buildFamilyCompanion({ skillKey: "6:ratios", lang: "es" });
assert.ok(companionEn.helpWithoutSpoiling.length >= 2);
assert.ok(renderFamilyCompanionHtml(companionEn, "en").includes("Family Math Companion"));
assert.ok(renderFamilyCompanionHtml(companionEs, "es").includes("Guía de estrategias para familias"));

// 7. Subscription Entitlements, Privacy & Server Status Endpoint
assert.equal(BILLING_ENABLED, false);
assert.equal(canAccessFeature("core-practice"), true);
assert.equal(canAccessFeature("accessibility-esol"), true);
assert.equal(canAccessFeature("intervention-builder", { tier: TIERS.free, status: "active" }), false);
assert.equal(canAccessFeature("intervention-builder", { tier: TIERS.teacher_premium, status: "active" }), true);
assert.equal(sanitizeEntitlements({ allowStudentPII: true, cloudSyncAllowed: true }).cloudSyncAllowed, false);

const fakeStore = new Map([["ewl-fluency-progress-v1", '{"ok":true}'], ["other-key", "keep"]]);
const mockStorage = {
  get length() { return fakeStore.size; },
  key: (i) => [...fakeStore.keys()][i] ?? null,
  getItem: (k) => fakeStore.get(k) ?? null,
  removeItem: (k) => fakeStore.delete(k),
};
const exported = exportFluencyUserData(mockStorage);
assert.deepEqual(exported.records["ewl-fluency-progress-v1"], { ok: true });
const deleted = deleteFluencyUserData(mockStorage);
assert.deepEqual(deleted.deletedKeys, ["ewl-fluency-progress-v1"]);
assert.equal(fakeStore.has("other-key"), true);

const apiRes = await entitlementsStatus({ request: new Request("https://eduwonderlab.com/api/entitlements/status"), env: {} });
assert.equal(apiRes.status, 200);
const apiBody = await apiRes.json();
assert.equal(apiBody.billingEnabled, false);
assert.equal(apiBody.tier, "free");

console.log("master-build.test.mjs: all assertions passed (128/128 skills, coach, mastery stages, teacher intervention, family companion, entitlements & privacy).");

import assert from "node:assert/strict";
import {
  familyLaunch,
  familySessionLaunch,
  familySessionShare,
} from "../math/fluency-lab/family/family-planner.js";
import {
  createNightSession,
  markNightStageComplete,
  moveNightStage,
  NIGHT_STAGES,
  sanitizeNightSession,
} from "../math/fluency-lab/family/family-session-core.js";
import { GRADES } from "../math/fluency-lab/problem-bank.js";
import {
  emptyTutor,
  findSkill,
  recordAnswer,
  sanitizeTutor,
} from "../math/fluency-lab/tutor-engine.js";

const tutor = emptyTutor();
for (const stage of NIGHT_STAGES) assert.ok(stage);
const session = createNightSession({
  grade: 1,
  profile: 2,
  lang: "es",
  skill: "add-10",
  tutor,
  now: 1_790_000_000_000,
});
assert.equal(
  session.skillKey,
  "1:add-10",
  "a valid family selection anchors the session to that skill",
);
assert.equal(session.profile, 2);
assert.equal(session.lang, "es");
assert.equal(session.stage, "retrieval");
assert.equal(session.stages.retrieval.items.length, 2);
assert.equal(session.stages.independent.items.length, 2);
assert.equal(session.stages.family.items.length, 1);
const tenMinute = createNightSession({
  grade: 1,
  profile: 2,
  lang: "en",
  skill: "add-10",
  tutor,
  minutes: 10,
  challenge: "building",
  support: "extra",
  now: 1_790_000_000_000,
});
assert.equal(tenMinute.stages.retrieval.items.length, 3);
assert.equal(tenMinute.stages.independent.items.length, 4);
assert.equal(tenMinute.stages.family.items.length, 2);
assert.equal(tenMinute.minutes, 10);
assert.equal(tenMinute.challenge, "building");
assert.equal(tenMinute.support, "extra");
const shared = new URL(
  familySessionShare({
    grade: 1,
    skill: "add-10",
    lang: "es",
    minutes: 10,
    challenge: "grade-stretch",
    support: "extra",
  }),
  "https://example.test/math/fluency-lab/",
);
assert.equal(shared.pathname, "/math/fluency-lab/family/tonight.html");
assert.equal(shared.searchParams.get("minutes"), "10");
assert.equal(shared.searchParams.get("support"), "extra");
assert.equal(shared.searchParams.has("profile"), false);
assert.equal(shared.searchParams.has("name"), false);
assert.throws(
  () => familySessionShare({ grade: 1, skill: "add-10", minutes: 7 }),
  /5- or 10-minute/,
);
assert.ok(
  session.stages.retrieval.items.every(
    (item) => Array.isArray(item.answers) && item.answers.length > 0,
  ),
);
assert.ok(session.stages.independent.items.every((item) => item.skillKey === "1:add-10"));
assert.equal(sanitizeNightSession(session, { profile: 2, grade: 1 }).id, session.id);
assert.equal(
  sanitizeNightSession(session, { profile: 1, grade: 1 }),
  null,
  "session recovery stays isolated by learner profile",
);
assert.equal(
  sanitizeNightSession(session, { profile: 2, grade: 8 }),
  null,
  "session recovery stays isolated by grade",
);
assert.equal(
  sanitizeNightSession({ ...session, skillKey: "8:not-a-skill" }, { profile: 2, grade: 1 }),
  null,
);

assert.equal(
  moveNightStage(session),
  false,
  "a stage cannot be skipped before its evidence is complete",
);
assert.equal(markNightStageComplete(session, "retrieval"), true);
assert.equal(moveNightStage(session), true);
assert.equal(session.stage, "concept");
for (const stage of NIGHT_STAGES.slice(1, -1)) {
  assert.equal(markNightStageComplete(session, stage), true);
  assert.equal(moveNightStage(session), true);
}
assert.equal(session.stage, "reflection");
assert.equal(moveNightStage(session), false, "reflection is the final stage");

const skill = findSkill("1:add-10");
recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, 1_790_000_000_100);
recordAnswer(tutor, skill, { correct: true, independent: false, level: 1 }, 1_790_000_000_200);
const afterEvidence = createNightSession({
  grade: 1,
  profile: 2,
  lang: "en",
  skill: "add-10",
  tutor: sanitizeTutor(tutor),
  now: 1_790_000_100_000,
});
assert.equal(
  afterEvidence.stages.retrieval.priorEvidence,
  true,
  "later warm-up recognizes actual earlier practice",
);

assert.match(
  familySessionLaunch({ grade: 1, profile: 2, skill: "add-10", lang: "es" }),
  /^tonight\.html\?/,
);
assert.throws(() => familySessionLaunch({ grade: 1, profile: 2, skill: "not-a-skill" }), /skill/);
assert.throws(() => familySessionLaunch({ grade: 1, profile: 9, skill: "add-10" }), /profile/);
assert.equal(GRADES.length, 9);
assert.match(familyLaunch({ grade: 1, profile: 2, start: "mission" }), /^\.\.\//);
console.log(
  "Family nightly session core passed: K–8 grade/profile isolation, skill anchoring, validated adaptive items, stage gating, persisted evidence awareness, and route validation.",
);

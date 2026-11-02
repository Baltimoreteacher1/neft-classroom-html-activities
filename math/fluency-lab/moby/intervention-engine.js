// Intervention engine: closes the loop  diagnose -> learn -> practice -> feedback -> revise -> reassess -> master -> retain.
// One deterministic, persisted state machine per (learner, skill):
//   flagged -> mini-lesson -> guided-practice -> independent-practice -> reassess -> mastered | needs-teacher   (+ paused)
// It ORCHESTRATES what the Lab already has and replaces none of it: error-diagnosis.js names the cause, rescue.js still
// owns the prerequisite repair flow (the engine offers it, then carries on), mini-lesson.js still teaches, tutor-engine
// records the answers, mastery-model.js owns the 1/3/7/14/30 ladder, difficulty-levels.js owns the three
// representations. This module only decides WHAT comes next and WHEN a stage is over.
//
// Honesty rules baked in: every exit criterion lives in THRESHOLDS (the tests and the stage descriptions read the same
// constants), a hint is never promoted to an independent answer, very fast or repeated answers never advance a stage,
// two failed reassessments end in a named hand-off to the teacher (never a silent loop), and observed counts stay
// separate from inferred suggestions. Pure: no DOM, no clock (callers pass `now`), randomness only through `rng`.
import { adaptiveItem } from "../adaptive-item.js";
import { prerequisiteGaps } from "../diagnostic-engine.js";
import { tierToLevel } from "../difficulty-levels.js";
import { profileKey } from "../family/fm2/profile-key.js";
import { t } from "../i18n.js";
import { REVIEW_LADDER, itemSignature, masteryScore, masteryState } from "../mastery-model.js";
import { seededRandom } from "../problem-bank.js";
import { MASTERY_RULE } from "../recommendation-engine.js";
import { reteachTip } from "../reteach-table.js";
import { isStuck } from "../reports-rows.js";
import { planRescue } from "../rescue.js";
import { profiles, readLocal, writeLocal } from "../school-tools.js";
import { DAY, evidence, findSkill, localDay, skillKey } from "../tutor-engine.js";
import {
  DIAGNOSIS,
  categoryHint,
  categoryName,
  detectorHint,
  detectorLabel,
  diagnoseSkill,
  diagnosisFor,
  diagnosisStrings,
  isBasicFact,
  isDiagnosisId,
  isVulnerableTo,
} from "./error-diagnosis.js";

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
};

// ---- The rules, in one place --------------------------------------------------------------------------------
export const THRESHOLDS = deepFreeze({
  trigger: {
    window: 8, // latest answers looked at for repeated misses
    days: 14, // ...and only those this recent
    misses: 3, // independent misses in that window (with a dominant diagnosis) that flag a skill
    staleDays: 30, // an "isStuck" row older than this is history, not a trigger
    maxActive: 2, // missions open at once per learner (a teacher assignment may exceed it)
  },
  miniLesson: { minMs: 8000 }, // when the lesson reports its time, finishing sooner than this asks the learner to read on
  guided: {
    minProblems: 4,
    minCorrect: 3,
    lastCorrect: 2, // the last two guided problems must both be right...
    maxHintedInLast: 1, // ...with at most one of them needing a hint (the scaffold has faded by then)
    maxProblems: 10, // a ceiling, so guided practice can never go on forever
    scaffolds: ["model-and-steps", "model-and-steps", "hint-on-request", "hint-on-request"],
  },
  independent: {
    minAnswers: 6, // answers given with no hint, no steps and no model
    minAccuracy: 0.8,
    maxSupported: 1, // answers that needed help; more than this goes back to guided practice
    maxAnswers: 12,
    graduateStreak: 2, // right answers in a row before problems move to the grade-level representation
  },
  reassess: {
    size: 4, // a fresh set, from a new seed, of problems the learner has never seen in this mission
    passCorrect: 3, // right, with no help, to pass
    maxFailures: 2, // the second failed reassessment hands the learner to the teacher
  },
  revision: { maxTries: 2 }, // fresh problems after a repair; then the miss is recorded as unresolved
  retention: {
    ladder: REVIEW_LADDER, // days since the last success: 1, 3, 7, 14, 30 (the same ladder as mastery-model.js)
    items: 3, // a retention check is a fresh set of this size
    passCorrect: 2,
    maxRelapses: 2, // a skill that slips after mastery this many times goes to the teacher
  },
  regressions: { max: 2 }, // times a mission may step back before it goes to the teacher
  guess: {
    rapidMsFact: DIAGNOSIS.rapidMsFact,
    rapidMsOther: DIAGNOSIS.rapidMsOther,
    rapidStreak: 3, // this many very fast answers in a row are not counted
    sameWrongRun: 3, // the same wrong answer typed this many times in a row is a pattern, not a method
    pauseAfter: 4, // uncounted guesses in a row pause the mission for the teacher
  },
  mastery: { score: MASTERY_RULE.score, checks: MASTERY_RULE.checks, days: MASTERY_RULE.days }, // the dashboard's rule, for comparison
});
const TH = THRESHOLDS;

export const STAGES = Object.freeze([
  "flagged",
  "mini-lesson",
  "guided-practice",
  "independent-practice",
  "reassess",
  "mastered",
  "needs-teacher",
  "paused",
]);
const ACTIVE = new Set([
  "flagged",
  "mini-lesson",
  "guided-practice",
  "independent-practice",
  "reassess",
]);
export const isActiveStage = (stage) => ACTIVE.has(stage);
export const TRIGGER_KINDS = Object.freeze(["misses", "checkup", "stuck", "teacher"]);

// Concrete -> pictorial -> abstract, from the Lab's own tiers (difficulty-levels.js).
export const REPRESENTATIONS = deepFreeze(
  ["concrete", "pictorial", "abstract"].map((id, index) => ({
    id,
    tier: index + 1,
    level: tierToLevel(index + 1),
  })),
);
const repOf = (tier) => REPRESENTATIONS[Math.min(2, Math.max(0, tier - 1))];

// The route a diagnosis picks. `representation` is where the mini-lesson starts; practice tiers climb from there.
const ROUTES = deepFreeze({
  conceptual: {
    mode: "model-first",
    supportLevel: 4,
    representation: 0,
    guidedTiers: [1, 1, 2, 2],
    independentTier: 2,
    graduateTier: 3,
  },
  calculation: {
    mode: "worked-example",
    supportLevel: 2,
    representation: 1,
    guidedTiers: [2, 2, 3, 3],
    independentTier: 3,
    graduateTier: 3,
  },
  fluency: {
    mode: "strategy",
    supportLevel: 1,
    representation: 2,
    guidedTiers: [3, 3, 3, 3],
    independentTier: 3,
    graduateTier: 3,
  },
  unsure: {
    mode: "model-first",
    supportLevel: 3,
    representation: 1,
    guidedTiers: [1, 2, 2, 2],
    independentTier: 2,
    graduateTier: 3,
  },
});
const PLAN_CATEGORIES = ["conceptual", "calculation", "fluency"];

// ---- Words (every string goes through t(); Spanish lives in i18n-es-intervention.js) ----------------------------
const TEXT = Object.freeze({
  stageFlagged: "Mission ready",
  stageMiniLesson: "Mini-lesson",
  stageGuided: "Practice with help",
  stageIndependent: "Practice on your own",
  stageReassess: "Show what you know",
  stageMastered: "Mastered",
  stageNeedsTeacher: "Your teacher will help",
  stagePaused: "Paused",
  modeModel: "Start with a picture or model",
  modeWorked: "Study a worked example, then check each step",
  modeStrategy: "Practise a strategy for the fact",
  repConcrete: "Build it",
  repPictorial: "Draw it",
  repAbstract: "Numbers and symbols",
  purposeGuided: "Practice with help",
  purposeIndependent: "Try it on your own",
  purposeReassess: "Fresh check, no help",
  purposeRevise: "Fix it, then try a new one",
  purposeRetention: "Keep it strong",
  scaffoldModelSteps: "Model and steps showing",
  scaffoldHint: "Hint when you ask",
  scaffoldNone: "No help",
  scaffoldRevise: "Look at the repair, then try",
  // learner messages
  begin: "Let's work on {skill} together. First, a short lesson.",
  notNow: "That is not part of this step right now.",
  lessonDone: "Nice. Now practice with help. The help fades as you go.",
  lessonTooFast: "Take a little more time with the lesson. Read each part, then continue.",
  guidedProgress: "Right. {done} of {total} so far.",
  guidedAdvance: "You are ready to try on your own, with little or no help.",
  independentProgress: "Right. That is {done} of {total} on your own.",
  independentAdvance: "Great work. One last check with brand-new problems and no help.",
  wrongRevise: "Not yet. Look at the repair, then try a fresh one like it.",
  reviseGood: "That repair worked. Keep going.",
  reviseAgain: "Close. Look at the repair once more, then try one more.",
  reviseUnresolved: "We will keep working on this idea. Keep going.",
  guess:
    "Slow down a little. Read the problem and take your time. Very quick answers do not count toward the mission.",
  guessPause: "Let's take a break and come back. Your teacher can see where you are.",
  repeat: "You have already seen that problem. A new one is coming.",
  reassessCount: "Answer saved. {done} of {total}.",
  reassessPass:
    "You did it! You showed this on your own with new problems. It is mastered. We will check again later so it stays strong.",
  reassessFail: "Not quite yet, and that is okay. Let's look at it a different way.",
  needsTeacher: "You have worked hard on this. Your teacher will help with the next step.",
  retentionNotDue: "This skill is mastered. Its next check is not due yet.",
  retentionCount: "Answer saved. {done} of {total}.",
  retentionPass: "Still strong! See you again on a later day.",
  retentionDone: "You kept this skill strong over a whole month. Wonderful.",
  retentionFail: "This one slipped a little. A short refresher will bring it back.",
  hintReliant: "Let's go back to practice with help for a bit, then try on your own again.",
  stepBack: "Let's go back and try a different way in.",
  paused: "Paused. Come back when you are ready.",
  resumed: "Welcome back. Let's keep going.",
  rescueBack: "Back to the mission.",
  restarted: "A fresh start with your teacher's plan. First, a short lesson.",
  // teacher reasons
  tStartMisses:
    "Started because {misses} of the last {window} independent answers were misses and the main cause looks like: {cause}.",
  tStartStuck:
    "Started because only {correct} of {total} independent answers were right (the dashboard's stuck rule).",
  tStartCheckup:
    "Started because this skill was missed on the learner's checkup and practice has not shown it is working.",
  tStartTeacher: "Started because a teacher assigned it.",
  tRoute: "Route: {mode}, beginning at the {rep} level.",
  tBegin: "Learner accepted the mission.",
  tLessonDone: "Mini-lesson finished.",
  tGuidedPass:
    "Guided practice complete: {correct} of {answered} right, with the last {last} right and at most {hinted} needing a hint.",
  tIndependentPass:
    "Independent practice complete: {correct} of {answered} right with no help ({percent}%), {supported} answer(s) with help.",
  tHintReliant:
    "{supported} answers needed help; promotion allows at most {max}. Returned to guided practice at a more concrete level.",
  tGuidedCap: "Guided practice reached {max} problems without meeting its exit rule.",
  tIndependentCap:
    "Independent practice reached {max} answers at {percent}%, below the {need}% needed.",
  tWrongRecorded: "Wrong answer on {skill}: {reason}",
  tReviseSuccess: "Revised successfully after the repair ({done} of {total} repairs so far).",
  tReviseUnresolved:
    "The same idea was missed again after {tries} repairs; recorded as unresolved.",
  tGuess: "{n} answer(s) in a row were very fast or repeated, so they were not counted.",
  tGuessPause:
    "Paused: {n} answers in a row were very fast or repeated. Check whether the learner is rushing or stuck.",
  tRepeat: "A problem the learner had already seen was shown again; it was not counted.",
  tReassessPass:
    "Reassessment on {size} fresh problems: {correct} right with no help (needs {need}). Mastery recorded; retention checks scheduled on the 1, 3, 7, 14 and 30 day ladder.",
  tReassessFail:
    "Reassessment on {size} fresh problems: only {correct} right with no help (needs {need}). Failed reassessments: {failures} of {max}. Teaching again at a more concrete level.",
  tReassessFailFinal:
    "Failed reassessment {failures} of {max}: only {correct} of {size} right with no help.",
  tRetentionPass:
    "Retention check {step} of {total} passed ({correct} of {answered} right). Next check in {days} days.",
  tRetentionDone: "Retention check {step} of {total} passed. The ladder is complete.",
  tRetentionFail:
    "Retention check {step} failed ({correct} of {answered} right). Mastery relapse {relapses} of {max}; practice resumes with help.",
  tRelapseFinal: "Retention check failed again (relapse {relapses} of {max}).",
  tRegressionLimit: "The mission stepped back more than {max} times.",
  tPaused: "Paused.",
  tResumed: "Resumed.",
  tRescue: "Prerequisite rescue finished: {outcome}.",
  tRestarted: "Restarted by the teacher.",
  // exit criteria
  exitFlagged: "Start the mission",
  exitLesson: "Finish the short lesson",
  exitGuidedCount: "At least {n} guided problems",
  exitGuidedRight: "At least {n} of them right",
  exitGuidedLast: "The last {n} right, with at most {hinted} needing a hint",
  exitIndependentCount: "At least {n} answers with no help",
  exitIndependentRight: "At least {percent}% of them right",
  exitIndependentSupported: "No more than {n} answer needing help",
  exitReassessSet: "{n} brand-new problems, no help",
  exitReassessRight: "At least {n} of {size} right",
  exitRetention: "Retention checks after 1, 3, 7, 14 and 30 days ({done} of {total} passed)",
  // progress text
  progressLesson: "Lesson",
  progressCount: "{done} of {total}",
  // teacher summary
  disclosure:
    "This is a short screening of the learner's own answers, not a validated or standardized assessment. Observed counts are separate from suggestions.",
  causeNone: "No single cause yet",
  inferredNote: "Suggested from patterns in wrong answers and the skill map. It is not measured.",
  nextFlagged: "Offer the mission. Reteach idea: {tip}",
  nextRunning:
    "Let the mission run. Check in after the next stage. Reteach idea if the learner stalls: {tip}",
  nextReassess: "Let the learner finish the fresh check without help.",
  nextMasteredDue: "A retention check is due now (step {step} of {total}).",
  nextMasteredLater: "Next retention check on {date} (step {step} of {total}).",
  nextMasteredDone: "All five retention checks passed. Keep the skill in regular review.",
  nextPaused: "Talk with the learner, then resume. Ask whether they are rushing, tired or stuck.",
  nextHints:
    "The learner is right only with help. Work a few problems together and remove one support at a time: {tip}",
  nextReassessFailed:
    "Meet with the learner for a short one-to-one, then repeat the check. Reteach idea: {tip}",
  nextRegressions:
    "The learner stepped back several times. Check the prerequisite ({prereq}) before returning to this skill. Reteach idea: {tip}",
  nextRelapsed:
    "The skill was mastered and then slipped twice. Plan spaced review and ask what they do when it slips: {tip}",
  nextPool: "The lab ran out of new problems for this skill. Use a teacher-made set for the check.",
  tipConceptual: "Use a concrete or pictorial model of the idea before any symbols.",
  tipCalculation: "Have the learner write each step and check it against an estimate.",
  tipFluency:
    "Practise one strategy for the fact without a timer, then check recall on a later day.",
  tipUnsure: "Ask the learner to explain their first step out loud.",
  prereqNone: "none found",
});
export const INTERVENTION_TEXT = TEXT;
const say = (id, vars) => t(TEXT[id], vars);
// Every English key this module (and error-diagnosis.js) can pass to t(), for Spanish coverage.
export const interventionStrings = () => [
  ...new Set([...Object.values(TEXT), ...diagnosisStrings()]),
];

const STAGE_TEXT = {
  flagged: "stageFlagged",
  "mini-lesson": "stageMiniLesson",
  "guided-practice": "stageGuided",
  "independent-practice": "stageIndependent",
  reassess: "stageReassess",
  mastered: "stageMastered",
  "needs-teacher": "stageNeedsTeacher",
  paused: "stagePaused",
};
const MODE_TEXT = {
  "model-first": "modeModel",
  "worked-example": "modeWorked",
  strategy: "modeStrategy",
};
const REP_TEXT = { concrete: "repConcrete", pictorial: "repPictorial", abstract: "repAbstract" };
export const stageLabel = (stage) => say(STAGE_TEXT[stage] || "stageFlagged");

// ---- State ----------------------------------------------------------------------------------------------------
export const STORAGE_KEY = "ewl-fluency-moby-interventions-v1";
const SEEN_MAX = 80;
const LOG_MAX = 30;
const clone = (value) => structuredClone(value);
const int = (value, max = 1e6) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
const blankGuided = () => ({ answered: 0, correct: 0, last: [] });
const blankIndependent = () => ({ answered: 0, correct: 0, supported: 0, streak: 0 });
const blankSet = () => ({ answered: 0, correct: 0, supported: 0, sigs: [] });
const blankGuard = () => ({ rapidRun: 0, sameWrong: 0, lastWrong: null, guessRun: 0 });

function newState(key, now, trigger, route, rescue) {
  return {
    v: 1,
    key,
    stage: "flagged",
    pausedFrom: null,
    startedAt: now,
    updatedAt: now,
    stageAt: now,
    trigger,
    route,
    rescue,
    lessonDone: false,
    guided: blankGuided(),
    independent: blankIndependent(),
    reassess: { ...blankSet(), attempts: 0, seed: null, exclude: [], lastPass: null },
    retention: { ladderStep: 0, dueAt: null, relapses: 0, current: blankSet(), history: [] },
    pending: null,
    revised: { success: 0, unresolved: 0 },
    failures: 0,
    regressions: 0,
    seen: [],
    seeds: [],
    guard: blankGuard(),
    counts: { answers: 0, guessed: 0, repeats: 0, hints: 0 },
    misconceptions: {},
    unresolved: [],
    masteredAt: null,
    handoff: null,
    log: [],
  };
}

const note = (state, now, event, text) => {
  state.log = [
    ...state.log,
    { at: now, stage: state.stage, event, text: String(text || "").slice(0, 240) },
  ].slice(-LOG_MAX);
};

// ---- Persistence ---------------------------------------------------------------------------------------------
const KEY_PATTERN = /^\d:[a-z0-9-]{1,60}$/;
const SIG_PATTERN = /^[a-z0-9]{1,12}$/;
const IDS = (list, max) =>
  (Array.isArray(list) ? list : [])
    .filter((id) => typeof id === "string" && SIG_PATTERN.test(id))
    .slice(-max);
const finite = (value, fallback = null) => (Number.isFinite(value) ? value : fallback);
const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const setOf = (raw) => ({
  answered: int(raw?.answered, 50),
  correct: int(raw?.correct, 50),
  supported: int(raw?.supported, 50),
  sigs: IDS(raw?.sigs, 40),
});

function cleanState(raw) {
  if (!raw || typeof raw !== "object" || !KEY_PATTERN.test(String(raw.key)) || !findSkill(raw.key))
    return null;
  const now = finite(raw.updatedAt, 0);
  const category = oneOf(raw.route?.category, Object.keys(ROUTES), "unsure");
  const stage = oneOf(raw.stage, STAGES, null);
  if (!stage) return null;
  const state = newState(raw.key, finite(raw.startedAt, now), null, null, null);
  const kind = oneOf(raw.trigger?.kind, TRIGGER_KINDS, "teacher");
  Object.assign(state, {
    stage,
    pausedFrom: stage === "paused" ? oneOf(raw.pausedFrom, [...ACTIVE], "flagged") : null,
    updatedAt: now,
    stageAt: finite(raw.stageAt, now),
    trigger: {
      kind,
      at: finite(raw.trigger?.at, now),
      misses: int(raw.trigger?.misses, 50),
      dominant: oneOf(
        raw.trigger?.dominant,
        [...PLAN_CATEGORIES, "mixed", "not-enough-evidence"],
        "not-enough-evidence",
      ),
    },
    route: {
      category,
      shift: int(raw.route?.shift, 2),
      misconception: isDiagnosisId(raw.route?.misconception) ? raw.route.misconception : null,
    },
    rescue:
      raw.rescue &&
      KEY_PATTERN.test(String(raw.rescue.prereq)) &&
      KEY_PATTERN.test(String(raw.rescue.goal))
        ? {
            goal: raw.rescue.goal,
            prereq: raw.rescue.prereq,
            outcome: oneOf(raw.rescue.outcome, ["verified", "not-yet", "declined", "left"], null),
          }
        : null,
    lessonDone: Boolean(raw.lessonDone),
    guided: {
      answered: int(raw.guided?.answered, 50),
      correct: int(raw.guided?.correct, 50),
      last: (Array.isArray(raw.guided?.last) ? raw.guided.last : [])
        .slice(-2)
        .map((entry) => [Boolean(entry?.[0]), entry?.[1] ? 1 : 0]),
    },
    independent: {
      answered: int(raw.independent?.answered, 50),
      correct: int(raw.independent?.correct, 50),
      supported: int(raw.independent?.supported, 50),
      streak: int(raw.independent?.streak, 50),
    },
    reassess: {
      ...setOf(raw.reassess),
      attempts: int(raw.reassess?.attempts, 20),
      seed: Number.isInteger(raw.reassess?.seed) ? raw.reassess.seed >>> 0 : null,
      exclude: IDS(raw.reassess?.exclude, SEEN_MAX),
      lastPass: raw.reassess?.lastPass
        ? {
            correct: int(raw.reassess.lastPass.correct, 20),
            size: int(raw.reassess.lastPass.size, 20),
          }
        : null,
    },
    retention: {
      ladderStep: Math.min(TH.retention.ladder.length, int(raw.retention?.ladderStep, 10)),
      dueAt: finite(raw.retention?.dueAt),
      relapses: int(raw.retention?.relapses, 20),
      current: setOf(raw.retention?.current),
      history: (Array.isArray(raw.retention?.history) ? raw.retention.history : [])
        .slice(-12)
        .map((entry) => ({
          step: int(entry?.step, 10),
          at: finite(entry?.at, 0),
          passed: Boolean(entry?.passed),
          correct: int(entry?.correct, 20),
          answered: int(entry?.answered, 20),
        })),
    },
    pending:
      raw.pending && typeof raw.pending === "object"
        ? {
            sig:
              typeof raw.pending.sig === "string" && SIG_PATTERN.test(raw.pending.sig)
                ? raw.pending.sig
                : null,
            id: isDiagnosisId(raw.pending.id) ? raw.pending.id : null,
            category: oneOf(
              raw.pending.category,
              ["conceptual", "calculation", "fluency", "unsure"],
              "unsure",
            ),
            tries: int(raw.pending.tries, 5),
            tier: Number.isInteger(raw.pending.tier)
              ? Math.min(5, Math.max(1, raw.pending.tier))
              : 3,
            supported: Boolean(raw.pending.supported),
          }
        : null,
    revised: {
      success: int(raw.revised?.success, 500),
      unresolved: int(raw.revised?.unresolved, 500),
    },
    failures: int(raw.failures, 20),
    regressions: int(raw.regressions, 20),
    seen: IDS(raw.seen, SEEN_MAX),
    seeds: (Array.isArray(raw.seeds) ? raw.seeds : [])
      .filter(Number.isInteger)
      .slice(-20)
      .map((seed) => seed >>> 0),
    guard: {
      rapidRun: int(raw.guard?.rapidRun, 50),
      sameWrong: int(raw.guard?.sameWrong, 50),
      lastWrong: typeof raw.guard?.lastWrong === "string" ? raw.guard.lastWrong.slice(0, 40) : null,
      guessRun: int(raw.guard?.guessRun, 50),
    },
    counts: {
      answers: int(raw.counts?.answers),
      guessed: int(raw.counts?.guessed),
      repeats: int(raw.counts?.repeats),
      hints: int(raw.counts?.hints),
    },
    misconceptions: Object.fromEntries(
      Object.entries(
        raw.misconceptions && typeof raw.misconceptions === "object" ? raw.misconceptions : {},
      )
        .filter(([id, count]) => isDiagnosisId(id) && Number.isFinite(count))
        .slice(0, 12)
        .map(([id, count]) => [id, int(count, 500)]),
    ),
    unresolved: (Array.isArray(raw.unresolved) ? raw.unresolved : [])
      .filter(isDiagnosisId)
      .slice(-6),
    masteredAt: finite(raw.masteredAt),
    handoff:
      raw.handoff && typeof raw.handoff === "object"
        ? {
            reason: oneOf(
              raw.handoff.reason,
              ["reassess-failed", "hint-reliant", "regressions", "relapsed", "pool"],
              "regressions",
            ),
            at: finite(raw.handoff.at, now),
          }
        : null,
    log: (Array.isArray(raw.log) ? raw.log : [])
      .slice(-LOG_MAX)
      .map((entry) => ({
        at: finite(entry?.at, 0),
        stage: oneOf(entry?.stage, STAGES, "flagged"),
        event: String(entry?.event || "").slice(0, 40),
        text: String(entry?.text || "").slice(0, 240),
      })),
  });
  // A stage must hold the data it needs: a "needs-teacher" or "mastered" save with none is not trusted as finished work.
  if (stage === "needs-teacher" && !state.handoff)
    state.handoff = { reason: "regressions", at: now };
  if (stage === "mastered" && !state.masteredAt) return null;
  if (stage === "reassess" && !Number.isInteger(state.reassess.seed))
    state.reassess.seed = freshSeed(state);
  return state;
}

export const emptyInterventions = () => ({ version: 1, states: {} });

export function sanitizeInterventions(value) {
  const clean = emptyInterventions();
  const source =
    value &&
    typeof value === "object" &&
    value.states &&
    typeof value.states === "object" &&
    !Array.isArray(value.states)
      ? value.states
      : null;
  if (!source || value.version !== 1) return clean;
  for (const key of Object.keys(source).slice(0, 200)) {
    if (!Object.hasOwn(source, key)) continue;
    const state = cleanState(source[key]);
    if (state && state.key === key && Object.keys(clean.states).length < 40)
      clean.states[key] = state;
  }
  return clean;
}

const storageName = (profile) =>
  profileKey(STORAGE_KEY, Number.isInteger(profile) ? profile : profiles().active);
export function loadInterventions(profile) {
  return sanitizeInterventions(readLocal(storageName(profile), null));
}
export function saveInterventions(container, profile) {
  return writeLocal(storageName(profile), sanitizeInterventions(container));
}
export function putState(container, state) {
  return { version: 1, states: { ...(container?.states || {}), [state.key]: state } };
}
const listStates = (states) =>
  (Array.isArray(states)
    ? states
    : states?.states
      ? Object.values(states.states)
      : states && typeof states === "object"
        ? Object.values(states)
        : []
  ).filter((entry) => entry && entry.key);

// ---- Triggers --------------------------------------------------------------------------------------------------
// Pure: should this skill become a mission right now, and why? `reasons` lists every rule that fired; `kind` is the
// first by priority (teacher, misses, stuck, checkup). `blocked` says why a firing rule did not start anything.
export function shouldStart(
  tutor,
  skill,
  now = Date.now(),
  { states = [], teacherAssigned = false } = {},
) {
  const key = skillKey(skill);
  const open = listStates(states);
  const existing = open.find((state) => state.key === key);
  const diagnosis = diagnoseSkill(tutor, skill, now);
  const record = tutor?.records?.[key];
  const recent = (record?.recent || [])
    .slice(-TH.trigger.window)
    .filter((entry) => now - entry.at <= TH.trigger.days * DAY);
  const misses = recent.filter((entry) => entry.independent && !entry.correct).length;
  const status = evidence(tutor || { records: {} }, skill, now);
  const reasons = [];
  if (teacherAssigned) reasons.push({ kind: "teacher" });
  if (misses >= TH.trigger.misses && PLAN_CATEGORIES.includes(diagnosis.dominant))
    reasons.push({ kind: "misses", misses, dominant: diagnosis.dominant });
  const fresh =
    Number.isFinite(record?.lastAt) && now - record.lastAt <= TH.trigger.staleDays * DAY;
  if (fresh && isStuck({ independent: status.independent, ratio: status.ratio }))
    reasons.push({ kind: "stuck", independent: status.independent, correct: status.successes });
  const grade = skill.grade;
  const checkup = tutor?.diagnostics?.[grade];
  const missedCheckup =
    checkup?.results?.[key] === false ||
    Object.entries(checkup?.foundations || {}).some(
      ([foundation, ok]) => foundation === key && ok === false,
    );
  const practiced = status.independent >= 3 && status.ratio >= 0.75;
  if (missedCheckup && !practiced) reasons.push({ kind: "checkup" });

  let blocked = null;
  if (existing) {
    if (existing.stage === "mastered" && !teacherAssigned) blocked = "mastered";
    else if (existing.stage === "needs-teacher" && !teacherAssigned) blocked = "awaiting-teacher";
    else if (existing.stage !== "mastered" && existing.stage !== "needs-teacher")
      blocked = "already-active";
  } else if (
    !teacherAssigned &&
    open.filter((state) => ACTIVE.has(state.stage) || state.stage === "paused").length >=
      TH.trigger.maxActive
  )
    blocked = "too-many-active";
  return {
    start: reasons.length > 0 && !blocked,
    kind: reasons[0]?.kind || null,
    reasons,
    blocked,
    diagnosis,
    misses,
    evidence: {
      kind: "observed",
      misses,
      window: TH.trigger.window,
      independent: status.independent,
      correct: status.successes,
    },
  };
}

// Creates a flagged mission. The route comes from the diagnosis; a prerequisite rescue is offered (not forced) when
// rescue.js would offer one for this skill today.
export function startIntervention(
  tutor,
  skill,
  now = Date.now(),
  { kind = null, teacherAssigned = false, sessionRescues = 0 } = {},
) {
  const check = shouldStart(tutor, skill, now, { states: [], teacherAssigned });
  const chosen = oneOf(kind, TRIGGER_KINDS, check.kind || (teacherAssigned ? "teacher" : "stuck"));
  const category = PLAN_CATEGORIES.includes(check.diagnosis.dominant)
    ? check.diagnosis.dominant
    : "unsure";
  const plan = planRescue(tutor, skill, { now, sessionCount: sessionRescues });
  const key = skillKey(skill);
  const state = newState(
    key,
    now,
    { kind: chosen, at: now, misses: check.misses, dominant: check.diagnosis.dominant },
    { category, shift: 0, misconception: check.diagnosis.top?.id || null },
    plan && category !== "fluency" ? { goal: plan.goal, prereq: plan.prereq, outcome: null } : null,
  );
  note(state, now, "start", teacherReasonForStart(state, check));
  return state;
}

function teacherReasonForStart(state, check) {
  const kind = state.trigger.kind;
  if (kind === "misses")
    return say("tStartMisses", {
      misses: check.misses,
      window: TH.trigger.window,
      cause: categoryName(state.route.category),
    });
  if (kind === "stuck")
    return say("tStartStuck", {
      correct: check.evidence.correct,
      total: check.evidence.independent,
    });
  if (kind === "checkup") return say("tStartCheckup");
  return say("tStartTeacher");
}

// ---- Seeds and fresh items --------------------------------------------------------------------------------------
const hash = (text) => Number.parseInt(itemSignature(text).slice(0, 7), 36) >>> 0;
// A seed that no earlier reassessment of this mission used, derived from the mission itself so a reload gives the same one.
export function freshSeed(state) {
  let seed =
    hash(
      `${state.key}|${state.failures}|${state.retention.relapses}|${state.seen.length}|${state.reassess.attempts}`,
    ) || 1;
  while (state.seeds.includes(seed)) seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
}

const sigOf = (item) => itemSignature(item.question);
const decorate = (item, extra) => ({
  ...item,
  sig: sigOf(item),
  representation: repOf(item.tier || extra.tier || 3).id,
  ...extra,
});

// Draws a problem at `tier` that is not in `exclude`, preferring one that could expose `prefer` (a misconception id).
function draw(skill, rng, tier, exclude, prefer = null) {
  let fallback = null;
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const item = adaptiveItem(skill, rng, tier);
    if (!item || !item.question || exclude.has(sigOf(item))) continue;
    if (prefer && isVulnerableTo(item, prefer)) return item;
    fallback ||= item;
    if (!prefer) return fallback;
  }
  return fallback;
}

const hintFor = (item, route, id = null) => {
  const target = id || route.misconception;
  return target && isVulnerableTo(item, target)
    ? detectorHint(target)
    : categoryHint(route.category);
};

// A fresh set of problems for a skill, never repeating anything in `exclude` (signatures) and never repeating itself.
// The engine calls this with a seeded rng so the same mission always rebuilds the same set.
export function reassessSet(
  skill,
  rng,
  { exclude = [], size = TH.reassess.size, tier = 3, prefer = null } = {},
) {
  const taken = new Set(exclude);
  const set = [];
  for (let slot = 0; slot < size; slot += 1) {
    const item = draw(skill, rng, tier, taken, slot < 2 ? prefer : null);
    if (!item) break;
    taken.add(sigOf(item));
    set.push(decorate(item, { tier, reassess: true, independent: true, scaffold: "none" }));
  }
  return set;
}

const route = (state) => ROUTES[state.route.category];
const shifted = (state, tier) => Math.max(1, tier - state.route.shift);
const guidedTier = (state, index) =>
  shifted(state, route(state).guidedTiers[Math.min(index, route(state).guidedTiers.length - 1)]);
const independentTier = (state) =>
  shifted(
    state,
    state.independent.streak >= TH.independent.graduateStreak
      ? route(state).graduateTier
      : route(state).independentTier,
  );
const scaffoldOf = (index) => TH.guided.scaffolds[Math.min(index, TH.guided.scaffolds.length - 1)];
const purposes = {
  guided: "purposeGuided",
  independent: "purposeIndependent",
  reassess: "purposeReassess",
  revise: "purposeRevise",
  retention: "purposeRetention",
};
const SCAFFOLD_TEXT = {
  "model-and-steps": "scaffoldModelSteps",
  "hint-on-request": "scaffoldHint",
  none: "scaffoldNone",
  revise: "scaffoldRevise",
};
export const scaffoldLabel = (scaffold) => say(SCAFFOLD_TEXT[scaffold] || "scaffoldNone");

// What to put in front of the learner next. Returns an array of problems (empty while a lesson, a pause or a hand-off
// is the next thing). Each problem carries its stage, tier, representation, scaffold, signature, a targeted hint and
// `independent` (whether the app may offer supports). A pending repair always comes first.
export function nextItems(state, tutor, skill, rng = null, now = Date.now()) {
  const random =
    rng || seededRandom(hash(`${state.key}|${state.updatedAt}|${state.counts.answers}`));
  const seen = new Set(state.seen);
  const record = tutor?.records?.[state.key]?.recent || [];
  void now;
  if (
    state.pending &&
    (state.stage === "guided-practice" || state.stage === "independent-practice")
  ) {
    const tier = Math.max(1, Math.min(state.pending.tier || 3, 3));
    const item = draw(skill, random, tier, seen, state.pending.id);
    return item
      ? [
          decorate(item, {
            tier,
            stage: state.stage,
            revision: true,
            independent: false,
            scaffold: "revise",
            purpose: say("purposeRevise"),
            targets: state.pending.id,
            targetedHint: hintFor(item, state.route, state.pending.id),
          }),
        ]
      : [];
  }
  if (state.stage === "guided-practice") {
    const index = state.guided.answered;
    const tier = guidedTier(state, index);
    const prefer = state.route.misconception && index % 2 === 0 ? state.route.misconception : null;
    const item = draw(skill, random, tier, seen, prefer);
    return item
      ? [
          decorate(item, {
            tier,
            stage: state.stage,
            independent: false,
            scaffold: scaffoldOf(index),
            purpose: say("purposeGuided"),
            targets: prefer,
            targetedHint: hintFor(item, state.route),
            stepCheck: state.route.category === "calculation",
            strategyPrompt: state.route.category === "fluency",
          }),
        ]
      : [];
  }
  if (state.stage === "independent-practice") {
    const tier = independentTier(state);
    const prefer =
      state.route.misconception && state.independent.answered % 3 === 2
        ? state.route.misconception
        : null;
    const item = draw(skill, random, tier, seen, prefer);
    return item
      ? [
          decorate(item, {
            tier,
            stage: state.stage,
            independent: true,
            scaffold: "none",
            purpose: say("purposeIndependent"),
            targets: prefer,
            targetedHint: hintFor(item, state.route),
          }),
        ]
      : [];
  }
  if (state.stage === "reassess") {
    const exclude = new Set([
      ...state.reassess.exclude,
      ...record.map((entry) => entry.sig).filter(Boolean),
    ]);
    let set = reassessSet(skill, seededRandom(state.reassess.seed), {
      exclude,
      prefer: state.route.misconception,
    });
    // A skill with very few distinct problems may have used up its history: keep this mission's own problems out and relax the rest.
    if (set.length < TH.reassess.size)
      set = reassessSet(skill, seededRandom(state.reassess.seed), {
        exclude: state.reassess.exclude,
        prefer: state.route.misconception,
      });
    return set
      .filter((item) => !state.reassess.sigs.includes(item.sig))
      .map((item) => ({
        ...item,
        stage: state.stage,
        purpose: say("purposeReassess"),
        targetedHint: hintFor(item, state.route),
      }));
  }
  if (
    state.stage === "mastered" &&
    state.retention.dueAt !== null &&
    state.retention.dueAt <= now
  ) {
    const remaining = TH.retention.items - state.retention.current.answered;
    const set = reassessSet(
      skill,
      seededRandom(
        hash(`${state.key}|retention|${state.retention.ladderStep}|${state.retention.relapses}`),
      ),
      { exclude: state.seen, size: TH.retention.items },
    );
    return set
      .filter((item) => !state.retention.current.sigs.includes(item.sig))
      .slice(0, remaining)
      .map((item) => ({
        ...item,
        stage: state.stage,
        retention: true,
        purpose: say("purposeRetention"),
        reassess: false,
      }));
  }
  return [];
}

// ---- Transitions -------------------------------------------------------------------------------------------------
function move(state, to, why, now) {
  const transition = { from: state.stage, to, why };
  state.stage = to;
  state.stageAt = now;
  return transition;
}
const resetPractice = (state) => {
  state.guided = blankGuided();
  state.independent = blankIndependent();
  state.pending = null;
  state.guard = blankGuard();
};
function toTeacher(state, why, reason, now) {
  state.pending = null;
  state.handoff = { reason, at: now };
  return move(state, "needs-teacher", why, now);
}
// Steps back one stage at a more concrete representation, or hands over once the mission has stepped back too often.
function regress(state, to, why, reason, now) {
  state.regressions += 1;
  if (state.regressions > TH.regressions.max)
    return toTeacher(state, "regression-limit", "regressions", now);
  state.route.shift = Math.min(2, state.route.shift + 1);
  resetPractice(state);
  if (to === "mini-lesson") state.lessonDone = false;
  note(state, now, why, reason);
  return move(state, to, why, now);
}
const pendingRepair = (diagnosis, item) => ({
  category: diagnosis?.category || "unsure",
  id: diagnosis?.misconception || null,
  label: diagnosis?.misconception
    ? detectorLabel(diagnosis.misconception)
    : categoryName(diagnosis?.category || "unsure"),
  note: diagnosis?.misconception
    ? detectorHint(diagnosis.misconception)
    : categoryHint(diagnosis?.category),
  steps: Array.isArray(item?.steps) ? item.steps.slice(0, 8) : [],
  explanation: typeof item?.explanation === "string" ? item.explanation : null,
  confidence: diagnosis?.confidence || "check",
});
const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const skillTitle = (state) => findSkill(state.key)?.title || "";

function enterReassess(state, now) {
  const seed = freshSeed(state);
  state.seeds = [...state.seeds, seed].slice(-20);
  state.reassess = {
    ...blankSet(),
    attempts: state.reassess.attempts,
    seed,
    exclude: state.seen.slice(-SEEN_MAX),
    lastPass: state.reassess.lastPass,
  };
  return move(state, "reassess", "ready-to-reassess", now);
}

function evaluateGuided(state, now) {
  const g = state.guided;
  const last = g.last.slice(-TH.guided.lastCorrect);
  const hinted = last.filter((entry) => entry[1]).length;
  if (
    g.answered >= TH.guided.minProblems &&
    g.correct >= TH.guided.minCorrect &&
    last.length === TH.guided.lastCorrect &&
    last.every((entry) => entry[0]) &&
    hinted <= TH.guided.maxHintedInLast
  ) {
    note(
      state,
      now,
      "guided-pass",
      say("tGuidedPass", {
        correct: g.correct,
        answered: g.answered,
        last: TH.guided.lastCorrect,
        hinted: TH.guided.maxHintedInLast,
      }),
    );
    return {
      transition: move(state, "independent-practice", "guided-complete", now),
      message: say("guidedAdvance"),
      teacherReason: say("tGuidedPass", {
        correct: g.correct,
        answered: g.answered,
        last: TH.guided.lastCorrect,
        hinted: TH.guided.maxHintedInLast,
      }),
    };
  }
  if (g.answered >= TH.guided.maxProblems) {
    const reason = say("tGuidedCap", { max: TH.guided.maxProblems });
    const transition = regress(state, "mini-lesson", "guided-cap", reason, now);
    return {
      transition,
      message: state.stage === "needs-teacher" ? say("needsTeacher") : say("stepBack"),
      teacherReason:
        state.stage === "needs-teacher"
          ? say("tRegressionLimit", { max: TH.regressions.max })
          : reason,
    };
  }
  return null;
}

function evaluateIndependent(state, now) {
  const i = state.independent;
  if (i.supported > TH.independent.maxSupported) {
    const reason = say("tHintReliant", {
      supported: i.supported,
      max: TH.independent.maxSupported,
    });
    const transition = regress(state, "guided-practice", "hint-reliant", reason, now);
    if (state.stage === "needs-teacher") state.handoff.reason = "hint-reliant";
    return {
      transition,
      message: state.stage === "needs-teacher" ? say("needsTeacher") : say("hintReliant"),
      teacherReason:
        state.stage === "needs-teacher"
          ? say("tRegressionLimit", { max: TH.regressions.max })
          : reason,
    };
  }
  if (
    i.answered >= TH.independent.minAnswers &&
    i.correct / i.answered >= TH.independent.minAccuracy
  ) {
    const reason = say("tIndependentPass", {
      correct: i.correct,
      answered: i.answered,
      percent: percent(i.correct, i.answered),
      supported: i.supported,
    });
    note(state, now, "independent-pass", reason);
    return {
      transition: enterReassess(state, now),
      message: say("independentAdvance"),
      teacherReason: reason,
    };
  }
  if (i.answered >= TH.independent.maxAnswers) {
    const reason = say("tIndependentCap", {
      max: TH.independent.maxAnswers,
      percent: percent(i.correct, i.answered),
      need: Math.round(TH.independent.minAccuracy * 100),
    });
    const transition = regress(state, "guided-practice", "independent-cap", reason, now);
    return {
      transition,
      message: state.stage === "needs-teacher" ? say("needsTeacher") : say("stepBack"),
      teacherReason:
        state.stage === "needs-teacher"
          ? say("tRegressionLimit", { max: TH.regressions.max })
          : reason,
    };
  }
  return null;
}

function resolveReassess(state, now) {
  const r = state.reassess;
  const pass = r.correct >= TH.reassess.passCorrect;
  if (pass) {
    r.lastPass = { correct: r.correct, size: r.answered };
    state.masteredAt = now;
    state.retention = {
      ...state.retention,
      ladderStep: 0,
      dueAt: now + TH.retention.ladder[0] * DAY,
      current: blankSet(),
    };
    const reason = say("tReassessPass", {
      size: r.answered,
      correct: r.correct,
      need: TH.reassess.passCorrect,
    });
    note(state, now, "reassess-pass", reason);
    return {
      transition: move(state, "mastered", "reassess-passed", now),
      message: say("reassessPass"),
      teacherReason: reason,
    };
  }
  state.failures += 1;
  r.attempts += 1;
  const vars = {
    size: r.answered,
    correct: r.correct,
    need: TH.reassess.passCorrect,
    failures: state.failures,
    max: TH.reassess.maxFailures,
  };
  if (state.failures >= TH.reassess.maxFailures) {
    note(state, now, "reassess-fail", say("tReassessFailFinal", vars));
    return {
      transition: toTeacher(state, "reassess-failed-twice", "reassess-failed", now),
      message: say("needsTeacher"),
      teacherReason: say("tReassessFailFinal", vars),
    };
  }
  state.route.shift = Math.min(2, state.route.shift + 1);
  resetPractice(state);
  state.lessonDone = false;
  state.reassess = {
    ...blankSet(),
    attempts: r.attempts,
    seed: null,
    exclude: [],
    lastPass: r.lastPass,
  };
  note(state, now, "reassess-fail", say("tReassessFail", vars));
  return {
    transition: move(state, "mini-lesson", "reassess-failed", now),
    message: say("reassessFail"),
    teacherReason: say("tReassessFail", vars),
  };
}

function resolveRetention(state, now) {
  const cur = state.retention.current;
  const pass = cur.correct >= TH.retention.passCorrect;
  const step = state.retention.ladderStep + 1;
  const total = TH.retention.ladder.length;
  state.retention.history = [
    ...state.retention.history,
    { step, at: now, passed: pass, correct: cur.correct, answered: cur.answered },
  ].slice(-12);
  if (pass) {
    state.retention.ladderStep = step;
    state.retention.current = blankSet();
    if (step >= total) {
      state.retention.dueAt = null;
      const reason = say("tRetentionDone", { step, total });
      note(state, now, "retention-complete", reason);
      return {
        transition: null,
        retention: "complete",
        message: say("retentionDone"),
        teacherReason: reason,
      };
    }
    state.retention.dueAt = now + TH.retention.ladder[step] * DAY;
    const reason = say("tRetentionPass", {
      step,
      total,
      correct: cur.correct,
      answered: cur.answered,
      days: TH.retention.ladder[step],
    });
    note(state, now, "retention-pass", reason);
    return {
      transition: null,
      retention: "passed",
      message: say("retentionPass"),
      teacherReason: reason,
    };
  }
  state.retention.relapses += 1;
  const vars = {
    step,
    total,
    correct: cur.correct,
    answered: cur.answered,
    relapses: state.retention.relapses,
    max: TH.retention.maxRelapses,
  };
  state.retention.ladderStep = 0;
  state.retention.dueAt = null;
  state.retention.current = blankSet();
  if (state.retention.relapses >= TH.retention.maxRelapses) {
    note(state, now, "retention-fail", say("tRelapseFinal", vars));
    return {
      transition: toTeacher(state, "relapse-limit", "relapsed", now),
      retention: "failed",
      message: say("needsTeacher"),
      teacherReason: say("tRelapseFinal", vars),
    };
  }
  resetPractice(state);
  state.masteredAt = null;
  note(state, now, "retention-fail", say("tRetentionFail", vars));
  return {
    transition: move(state, "guided-practice", "retention-failed", now),
    retention: "failed",
    message: say("retentionFail"),
    teacherReason: say("tRetentionFail", vars),
  };
}

// ---- Answers --------------------------------------------------------------------------------------------------------
const typed = (raw) =>
  String(raw ?? "")
    .trim()
    .replaceAll("−", "-")
    .replace(/\s+/g, "")
    .toLowerCase()
    .slice(0, 40);
const remember = (state, sig) => {
  state.seen = [...state.seen.filter((entry) => entry !== sig), sig].slice(-SEEN_MAX);
};

// Finishes a held miss: it now counts toward the stage's exit rule.
function applyMiss(state, supported) {
  if (state.stage === "guided-practice") {
    state.guided.answered += 1;
    state.guided.last = [...state.guided.last, [false, supported ? 1 : 0]].slice(-2);
  } else if (supported) state.independent.supported += 1;
  else {
    state.independent.answered += 1;
    state.independent.streak = 0;
  }
}

function noteMisconception(state, diagnosis) {
  const id = diagnosis?.misconception;
  if (!id) return;
  state.misconceptions[id] = (state.misconceptions[id] || 0) + 1;
  if (!state.route.misconception && diagnosis.confidence === "high") state.route.misconception = id;
}

function onAnswer(state, r, now) {
  const base = { counted: false, flag: null };
  if (!["guided-practice", "independent-practice", "reassess", "mastered"].includes(state.stage))
    return { ...base, message: say("notNow") };
  const item = r.item && typeof r.item === "object" ? r.item : null;
  const correct = Boolean(r.correct);
  const hints = int(r.hints, 20);
  const supported = Boolean(r.supported) || hints > 0;
  const sig =
    typeof r.sig === "string" && SIG_PATTERN.test(r.sig)
      ? r.sig
      : item?.question
        ? itemSignature(item.question)
        : null;
  const ms = Number(r.ms);
  const basic = item ? isBasicFact(item) : Boolean(r.basicFact);
  const rapid = Number.isFinite(ms) && ms < (basic ? TH.guess.rapidMsFact : TH.guess.rapidMsOther);
  const submitted = typed(r.submitted);
  const guard = state.guard;
  guard.rapidRun = rapid ? guard.rapidRun + 1 : 0;
  if (correct) {
    guard.sameWrong = 0;
    guard.lastWrong = null;
  } else if (submitted) {
    guard.sameWrong = submitted === guard.lastWrong ? guard.sameWrong + 1 : 1;
    guard.lastWrong = submitted;
  }
  state.counts.answers += 1;

  const guessed =
    (!correct && rapid) ||
    guard.rapidRun >= TH.guess.rapidStreak ||
    guard.sameWrong >= TH.guess.sameWrongRun;
  if (guessed) {
    state.counts.guessed += 1;
    guard.guessRun += 1;
    note(state, now, "guess", say("tGuess", { n: guard.guessRun }));
    if (guard.guessRun >= TH.guess.pauseAfter) {
      const n = guard.guessRun;
      state.pausedFrom = state.stage;
      guard.guessRun = 0;
      return {
        ...base,
        flag: "guess",
        transition: move(state, "paused", "guessing", now),
        message: say("guessPause"),
        teacherReason: say("tGuessPause", { n }),
      };
    }
    return {
      ...base,
      flag: "guess",
      message: say("guess"),
      teacherReason: say("tGuess", { n: guard.guessRun }),
    };
  }
  guard.guessRun = 0;
  if (sig && state.seen.includes(sig)) {
    state.counts.repeats += 1;
    return { ...base, flag: "repeat", message: say("repeat"), teacherReason: say("tRepeat") };
  }
  if (sig) remember(state, sig);
  state.counts.hints += hints;
  const diagnosis = !correct
    ? r.diagnosis ||
      (item
        ? diagnosisFor(item, r.submitted, {
            record: r.record,
            responseMs: Number.isFinite(ms) ? ms : undefined,
            now,
          })
        : null)
    : null;
  if (diagnosis) noteMisconception(state, diagnosis);

  if (state.stage === "mastered") return onRetention(state, { correct, supported, sig }, now, base);
  if (state.stage === "reassess") {
    const set = state.reassess;
    set.answered += 1;
    if (sig) set.sigs = [...set.sigs, sig].slice(-40);
    if (supported) set.supported += 1;
    if (correct && !supported) set.correct += 1;
    if (set.answered < TH.reassess.size)
      return {
        ...base,
        counted: true,
        message: say("reassessCount", { done: set.answered, total: TH.reassess.size }),
      };
    return { ...base, counted: true, ...resolveReassess(state, now) };
  }
  if (state.pending) return onRevision(state, { correct, diagnosis, item }, now, base);
  if (!correct) {
    const repair = pendingRepair(diagnosis, item);
    state.pending = {
      sig,
      id: diagnosis?.misconception || null,
      category: diagnosis?.category || "unsure",
      tries: 0,
      tier: Number.isInteger(r.tier) ? r.tier : item?.tier || 3,
      supported,
    };
    note(
      state,
      now,
      "wrong",
      say("tWrongRecorded", {
        skill: skillTitle(state),
        reason: diagnosis?.reason || categoryName("unsure"),
      }),
    );
    return {
      ...base,
      needsRevision: true,
      repair,
      message: say("wrongRevise"),
      teacherReason: diagnosis?.reason || categoryName("unsure"),
      diagnosis,
    };
  }
  return { ...base, counted: true, ...onCorrect(state, supported, now) };
}

function onCorrect(state, supported, now) {
  if (state.stage === "guided-practice") {
    const g = state.guided;
    g.answered += 1;
    g.correct += 1;
    g.last = [...g.last, [true, supported ? 1 : 0]].slice(-2);
    const done = evaluateGuided(state, now);
    return (
      done || { message: say("guidedProgress", { done: g.correct, total: TH.guided.minCorrect }) }
    );
  }
  const i = state.independent;
  if (supported) i.supported += 1;
  else {
    i.answered += 1;
    i.correct += 1;
    i.streak += 1;
  }
  const done = evaluateIndependent(state, now);
  return (
    done || {
      message: say("independentProgress", { done: i.correct, total: TH.independent.minAnswers }),
    }
  );
}

// The answer after a repair. It is a fresh problem, so it never counts toward the stage; it releases the held miss.
function onRevision(state, { correct, diagnosis, item }, now, base) {
  const held = state.pending;
  held.tries += 1;
  if (!correct && held.tries < TH.revision.maxTries) {
    return {
      ...base,
      needsRevision: true,
      repair: pendingRepair(diagnosis || { category: held.category, misconception: held.id }, item),
      message: say("reviseAgain"),
      teacherReason: diagnosis?.reason || categoryName(held.category),
    };
  }
  if (correct) state.revised.success += 1;
  else {
    state.revised.unresolved += 1;
    if (held.id)
      state.unresolved = [...state.unresolved.filter((id) => id !== held.id), held.id].slice(-6);
  }
  state.pending = null;
  applyMiss(state, held.supported);
  const done =
    state.stage === "guided-practice"
      ? evaluateGuided(state, now)
      : evaluateIndependent(state, now);
  const teacherReason = correct
    ? say("tReviseSuccess", {
        done: state.revised.success,
        total: state.revised.success + state.revised.unresolved,
      })
    : say("tReviseUnresolved", { tries: held.tries });
  note(state, now, correct ? "revise-success" : "revise-unresolved", teacherReason);
  return {
    ...base,
    counted: true,
    revised: correct,
    message: correct ? say("reviseGood") : say("reviseUnresolved"),
    teacherReason,
    ...(done || {}),
    ...(done ? { message: done.message } : {}),
  };
}

function onRetention(state, { correct, supported, sig }, now, base) {
  if (state.retention.dueAt === null || state.retention.dueAt > now)
    return { ...base, flag: "not-due", message: say("retentionNotDue") };
  const cur = state.retention.current;
  cur.answered += 1;
  if (sig) cur.sigs = [...cur.sigs, sig].slice(-40);
  if (supported) cur.supported += 1;
  if (correct && !supported) cur.correct += 1;
  if (cur.answered < TH.retention.items)
    return {
      ...base,
      counted: true,
      message: say("retentionCount", { done: cur.answered, total: TH.retention.items }),
    };
  return { ...base, counted: true, ...resolveRetention(state, now) };
}

// One call after anything the learner does. `result` is one of
//   { type: "begin" }                      accept the mission (flagged -> mini-lesson)
//   { type: "rescueDone", outcome }        the existing prerequisite rescue finished ("verified" | "not-yet" | "declined" | "left")
//   { type: "lessonDone", ms? }            the mini-lesson was finished
//   { type: "answer", correct, hints?, supported?, ms?, submitted?, sig?, item?, record?, diagnosis? }   (type may be omitted)
//   { type: "pause" } | { type: "resume" } | { type: "teacherRestart", category? }
// Returns { state, transition?, message, teacherReason, counted?, flag?, needsRevision?, repair?, revised?, retention? }.
export function recordResult(state, result = {}, now = Date.now()) {
  const next = clone(state);
  next.updatedAt = now;
  const type = result.type || (typeof result.correct === "boolean" ? "answer" : "unknown");
  let out;
  switch (type) {
    case "begin":
      out =
        next.stage === "flagged"
          ? {
              transition: move(next, "mini-lesson", "begun", now),
              message: say("begin", { skill: skillTitle(next) }),
              teacherReason: say("tBegin"),
            }
          : { message: say("notNow") };
      break;
    case "rescueDone":
      if (
        next.stage === "flagged" &&
        next.rescue &&
        Object.hasOwn({ verified: 1, "not-yet": 1, declined: 1, left: 1 }, result.outcome)
      ) {
        next.rescue.outcome = result.outcome;
        out = {
          message: say("rescueBack"),
          teacherReason: say("tRescue", { outcome: result.outcome }),
        };
      } else out = { message: say("notNow") };
      break;
    case "lessonDone":
      if (next.stage !== "mini-lesson") out = { message: say("notNow") };
      else if (
        Number.isFinite(Number(result.ms)) &&
        Number(result.ms) < TH.miniLesson.minMs &&
        !result.force
      )
        out = { message: say("lessonTooFast") };
      else {
        next.lessonDone = true;
        next.guided = blankGuided();
        next.independent = blankIndependent();
        out = {
          transition: move(next, "guided-practice", "lesson-done", now),
          message: say("lessonDone"),
          teacherReason: say("tLessonDone"),
        };
      }
      break;
    case "answer":
      out = onAnswer(next, result, now);
      break;
    case "pause":
      if (ACTIVE.has(next.stage)) {
        next.pausedFrom = next.stage;
        out = {
          transition: move(next, "paused", "paused", now),
          message: say("paused"),
          teacherReason: say("tPaused"),
        };
      } else out = { message: say("notNow") };
      break;
    case "resume":
      if (next.stage === "paused") {
        const to = oneOf(next.pausedFrom, [...ACTIVE], "flagged");
        next.pausedFrom = null;
        next.guard = blankGuard();
        out = {
          transition: move(next, to, "resumed", now),
          message: say("resumed"),
          teacherReason: say("tResumed"),
        };
      } else out = { message: say("notNow") };
      break;
    case "teacherRestart":
      if (["needs-teacher", "paused", "mastered"].includes(next.stage)) {
        if (result.category && PLAN_CATEGORIES.includes(result.category))
          next.route.category = result.category;
        next.route.shift = 0;
        next.failures = 0;
        next.regressions = 0;
        next.handoff = null;
        next.pausedFrom = null;
        next.lessonDone = false;
        next.masteredAt = null;
        next.reassess = {
          ...blankSet(),
          attempts: next.reassess.attempts,
          seed: null,
          exclude: [],
          lastPass: null,
        };
        next.retention = {
          ladderStep: 0,
          dueAt: null,
          relapses: 0,
          current: blankSet(),
          history: [],
        };
        resetPractice(next);
        out = {
          transition: move(next, "mini-lesson", "teacher-restart", now),
          message: say("restarted"),
          teacherReason: say("tRestarted"),
        };
      } else out = { message: say("notNow") };
      break;
    default:
      out = { message: say("notNow") };
  }
  const { transition = null, ...rest } = out;
  return { state: next, transition, ...rest };
}

// After a wrong answer in guided or independent practice the engine holds the miss until the learner has tried a
// fresh problem after seeing the repair. It does not count toward the stage's exit rule before then.
export const supportsRevision = (state) =>
  state.stage === "guided-practice" || state.stage === "independent-practice";
export const pendingRevision = (state) => (state.pending ? { ...state.pending } : null);

// ---- Describing a mission ----------------------------------------------------------------------------------------
export function miniLessonPlan(state) {
  const base = route(state);
  const rep = REPRESENTATIONS[Math.max(0, base.representation - state.route.shift)];
  return {
    mode: base.mode,
    modeText: say(MODE_TEXT[base.mode]),
    supportLevel: Math.min(4, base.supportLevel + state.route.shift),
    representation: rep.id,
    representationText: say(REP_TEXT[rep.id]),
    tier: rep.tier,
    level: rep.level,
    firstStep: "learn",
    misconception: state.route.misconception,
    why: detectorHint(state.route.misconception) || categoryHint(state.route.category),
  };
}

export function describeStage(state) {
  const g = state.guided;
  const i = state.independent;
  const r = state.reassess;
  const exit = [];
  const row = (id, text, met) => exit.push({ id, text, met: Boolean(met) });
  let progress = { done: 0, total: 1, text: "" };
  switch (state.stage) {
    case "flagged":
      row("start", say("exitFlagged"), false);
      break;
    case "mini-lesson":
      row("lesson", say("exitLesson"), state.lessonDone);
      progress = { done: state.lessonDone ? 1 : 0, total: 1, text: say("progressLesson") };
      break;
    case "guided-practice": {
      const last = g.last.slice(-TH.guided.lastCorrect);
      row(
        "count",
        say("exitGuidedCount", { n: TH.guided.minProblems }),
        g.answered >= TH.guided.minProblems,
      );
      row(
        "right",
        say("exitGuidedRight", { n: TH.guided.minCorrect }),
        g.correct >= TH.guided.minCorrect,
      );
      row(
        "last",
        say("exitGuidedLast", { n: TH.guided.lastCorrect, hinted: TH.guided.maxHintedInLast }),
        last.length === TH.guided.lastCorrect &&
          last.every((entry) => entry[0]) &&
          last.filter((entry) => entry[1]).length <= TH.guided.maxHintedInLast,
      );
      progress = {
        done: Math.min(g.answered, TH.guided.minProblems),
        total: TH.guided.minProblems,
        text: say("progressCount", {
          done: Math.min(g.answered, TH.guided.minProblems),
          total: TH.guided.minProblems,
        }),
      };
      break;
    }
    case "independent-practice":
      row(
        "count",
        say("exitIndependentCount", { n: TH.independent.minAnswers }),
        i.answered >= TH.independent.minAnswers,
      );
      row(
        "right",
        say("exitIndependentRight", { percent: Math.round(TH.independent.minAccuracy * 100) }),
        i.answered >= TH.independent.minAnswers &&
          i.correct / i.answered >= TH.independent.minAccuracy,
      );
      row(
        "supported",
        say("exitIndependentSupported", { n: TH.independent.maxSupported }),
        i.supported <= TH.independent.maxSupported,
      );
      progress = {
        done: Math.min(i.answered, TH.independent.minAnswers),
        total: TH.independent.minAnswers,
        text: say("progressCount", {
          done: Math.min(i.answered, TH.independent.minAnswers),
          total: TH.independent.minAnswers,
        }),
      };
      break;
    case "reassess":
      row("set", say("exitReassessSet", { n: TH.reassess.size }), r.answered >= TH.reassess.size);
      row(
        "right",
        say("exitReassessRight", { n: TH.reassess.passCorrect, size: TH.reassess.size }),
        r.correct >= TH.reassess.passCorrect,
      );
      progress = {
        done: r.answered,
        total: TH.reassess.size,
        text: say("progressCount", { done: r.answered, total: TH.reassess.size }),
      };
      break;
    case "mastered":
      row(
        "retention",
        say("exitRetention", {
          done: state.retention.ladderStep,
          total: TH.retention.ladder.length,
        }),
        state.retention.ladderStep >= TH.retention.ladder.length,
      );
      progress = {
        done: state.retention.ladderStep,
        total: TH.retention.ladder.length,
        text: say("progressCount", {
          done: state.retention.ladderStep,
          total: TH.retention.ladder.length,
        }),
      };
      break;
    default:
  }
  const plan = miniLessonPlan(state);
  const tier =
    state.stage === "reassess"
      ? 3
      : state.stage === "guided-practice"
        ? guidedTier(state, g.answered)
        : state.stage === "independent-practice"
          ? independentTier(state)
          : plan.tier;
  const rep = repOf(tier);
  return {
    stage: state.stage,
    label: stageLabel(state.stage),
    route: {
      category: state.route.category,
      label: categoryName(state.route.category),
      mode: plan.mode,
      modeText: plan.modeText,
    },
    representation: { id: rep.id, tier: rep.tier, text: say(REP_TEXT[rep.id]) },
    miniLesson: state.stage === "mini-lesson" || state.stage === "flagged" ? plan : null,
    scaffold:
      state.stage === "guided-practice"
        ? { id: scaffoldOf(g.answered), text: scaffoldLabel(scaffoldOf(g.answered)) }
        : null,
    progress,
    exit,
    pendingRevision: pendingRevision(state),
    rescue:
      state.rescue && !state.rescue.outcome && state.stage === "flagged"
        ? { ...state.rescue }
        : null,
  };
}

// The same verdict the dashboard shows. "mastered" here means the loop was completed: a fresh unsupported reassessment
// was passed. `retention` is the ladder that keeps it honest; the dashboard's own score is reported beside it.
export function masteryEvidence(state, { tutor = null, now = Date.now() } = {}) {
  const record = tutor?.records?.[state.key] || null;
  const mastered = state.stage === "mastered";
  const retention = state.retention;
  const dashboard = record
    ? {
        state: masteryState(record, now),
        score: masteryScore(record, now),
        rule: { ...MASTERY_RULE },
      }
    : null;
  const verdict = mastered
    ? "mastered"
    : state.stage === "needs-teacher"
      ? "needs-teacher"
      : retention.relapses > 0 && state.stage !== "reassess"
        ? "relapsed"
        : "in-progress";
  return {
    kind: "observed",
    key: state.key,
    verdict,
    mastered,
    masteredAt: state.masteredAt,
    reassess: {
      passed: Boolean(state.reassess.lastPass) && mastered,
      correct: state.reassess.lastPass?.correct ?? null,
      size: state.reassess.lastPass?.size ?? null,
      failures: state.failures,
    },
    retention: {
      passed: retention.ladderStep,
      of: TH.retention.ladder.length,
      nextDueAt: retention.dueAt,
      nextAfterDays:
        retention.dueAt === null
          ? null
          : TH.retention.ladder[Math.min(retention.ladderStep, TH.retention.ladder.length - 1)],
      complete: retention.ladderStep >= TH.retention.ladder.length,
      relapses: retention.relapses,
      confirmed: retention.ladderStep >= 1,
    },
    dashboard: dashboard && {
      ...dashboard,
      agrees: !mastered || ["proficient", "mastered"].includes(dashboard.state),
    },
  };
}

// Retention checks that are scheduled, soonest first. `states` may be the stored container, an object or an array.
export function retentionDue(states, now = Date.now()) {
  return listStates(states)
    .filter((state) => state.stage === "mastered" && state.retention.dueAt !== null)
    .map((state) => ({
      key: state.key,
      step: state.retention.ladderStep + 1,
      of: TH.retention.ladder.length,
      days: TH.retention.ladder[state.retention.ladderStep],
      dueAt: state.retention.dueAt,
      due: state.retention.dueAt <= now,
      overdueDays: Math.max(0, Math.floor((now - state.retention.dueAt) / DAY)),
    }))
    .sort((a, b) => a.dueAt - b.dueAt);
}

// ---- Teacher summary --------------------------------------------------------------------------------------------
function tipFor(state) {
  return (
    (state.route.misconception && reteachTip(state.route.misconception)) ||
    say(
      { conceptual: "tipConceptual", calculation: "tipCalculation", fluency: "tipFluency" }[
        state.route.category
      ] || "tipUnsure",
    )
  );
}

function nextAction(state, tutor, now) {
  const tip = tipFor(state);
  switch (state.stage) {
    case "flagged":
      return say("nextFlagged", { tip });
    case "reassess":
      return say("nextReassess");
    case "paused":
      return say("nextPaused");
    case "mastered": {
      if (state.retention.dueAt === null) return say("nextMasteredDone");
      const step = state.retention.ladderStep + 1;
      const total = TH.retention.ladder.length;
      return state.retention.dueAt <= now
        ? say("nextMasteredDue", { step, total })
        : say("nextMasteredLater", { date: localDay(state.retention.dueAt), step, total });
    }
    case "needs-teacher": {
      const reason = state.handoff?.reason;
      if (reason === "hint-reliant") return say("nextHints", { tip });
      if (reason === "reassess-failed") return say("nextReassessFailed", { tip });
      if (reason === "relapsed") return say("nextRelapsed", { tip });
      if (reason === "pool") return say("nextPool");
      const gap = findSkill(state.key)
        ? prerequisiteGaps(tutor || { records: {} }, findSkill(state.key), now)[0]
        : null;
      return say("nextRegressions", { prereq: gap?.skill?.title || say("prereqNone"), tip });
    }
    default:
      return say("nextRunning", { tip });
  }
}

// What the learner knows, where the gap is, how much evidence stands behind it, and what to do next. OBSERVED counts
// (from the learner's own answers) are kept apart from INFERRED suggestions (from patterns and the skill map).
const ATTENTION_ORDER = ["needs-teacher", "paused", "reassess", "independent-practice", "guided-practice", "mini-lesson", "flagged", "mastered"];
export function summarizeForTeacher(states, tutor, now = Date.now()) {
  const list = listStates(states);
  const items = list
    .map((state) => {
      const skill = findSkill(state.key);
      if (!skill) return null;
      const status = evidence(tutor || { records: {}, mistakes: [] }, skill, now);
      const diagnosis = diagnoseSkill(tutor || { records: {}, mistakes: [] }, skill, now);
      const gaps = prerequisiteGaps(tutor || { records: {} }, skill, now);
      return {
        key: state.key,
        title: skill.title,
        grade: skill.grade,
        stage: state.stage,
        stageLabel: stageLabel(state.stage),
        route: {
          category: state.route.category,
          label: categoryName(state.route.category),
          mode: miniLessonPlan(state).mode,
        },
        observed: {
          kind: "observed",
          independentAnswers: status.independent,
          independentCorrect: status.successes,
          masteryState: status.state,
          masteryScore: status.score,
          wrongAnswersRead: diagnosis.considered,
          causeCounts: diagnosis.counts,
          dominantCause: diagnosis.dominant,
          missionAnswers: state.counts.answers,
          uncountedGuesses: state.counts.guessed,
          hintsUsed: state.counts.hints,
          revisedAfterRepair: state.revised.success,
          unresolvedAfterRepair: state.revised.unresolved,
          failedReassessments: state.failures,
          stepsBack: state.regressions,
          misconceptions: Object.entries(state.misconceptions)
            .sort((a, b) => b[1] - a[1])
            .map(([id, count]) => ({ id, label: detectorLabel(id), count })),
          retention: {
            passed: state.retention.ladderStep,
            of: TH.retention.ladder.length,
            nextDueAt: state.retention.dueAt,
            relapses: state.retention.relapses,
          },
        },
        inferred: {
          kind: "inferred",
          likelyCause: PLAN_CATEGORIES.includes(diagnosis.dominant) ? diagnosis.dominant : null,
          causeText: PLAN_CATEGORIES.includes(diagnosis.dominant)
            ? diagnosis.reason
            : say("causeNone"),
          causeConfidence: diagnosis.confidence,
          prerequisites: gaps.map((gap) => ({
            key: gap.key,
            title: gap.skill.title,
            basis: gap.kind,
          })),
          note: say("inferredNote"),
        },
        nextAction: nextAction(state, tutor, now),
        reason: state.log.at(-1)?.text || "",
        startedBecause: state.log[0]?.text || "",
        mastery: masteryEvidence(state, { tutor, now }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => ATTENTION_ORDER.indexOf(a.stage) - ATTENTION_ORDER.indexOf(b.stage) || a.key.localeCompare(b.key));
  const count = (stage) => items.filter((item) => item.stage === stage).length;
  return {
    disclosure: say("disclosure"),
    totals: {
      missions: items.length,
      active: items.filter((item) => ACTIVE.has(item.stage)).length,
      mastered: count("mastered"),
      needsTeacher: count("needs-teacher"),
      paused: count("paused"),
      retentionDue: retentionDue(list, now).filter((entry) => entry.due).length,
    },
    items,
  };
}

// The first rows a teacher should read: hand-offs, then pauses.
export const needsAttention = (summary) =>
  summary.items.filter((item) => item.stage === "needs-teacher" || item.stage === "paused");

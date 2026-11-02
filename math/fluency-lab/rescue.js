// Prerequisite rescue: a pure state machine plus the decisions around it. After repeated independent misses on a
// skill, find the idea underneath it, offer a short mini-lesson, three guided repair problems, ONE required
// independent check on a fresh problem, then hand the learner back to the original skill with a clear message.
// Nobody is trapped: every phase has a way out, the machine ends at "return" and never leaves it, rescues are
// capped (one per skill per day, a few per day and per session), a failed check returns to the goal with
// scaffolds instead of looping, and the goal's own difficulty is never lowered.
import { skillStatus } from "./diagnostic-engine.js";
import { t } from "./i18n.js";
import { RESCUE_LIMITS, rescueBlock } from "./rescue-history.js";
import { DAY, findSkill, prerequisites, skillKey } from "./tutor-engine.js";

export { RESCUE_LIMITS };
export const REPAIR_COUNT = 3;
export const SCAFFOLD_PROBLEMS = 3;
const TRIGGER = Object.freeze({ lastEntries: 4, misses: 2, days: 7, slipEstimate: 0.8, repeatedCategory: 2, deeperDays: 30 });
const REPAIR_TIERS = [1, 2, 2]; // concrete first, then foundational application; all with steps on screen
const VERIFY_TIER = 3;

// A misconception points at the part of the prerequisite it belongs to.
const MISCONCEPTION_FOCUS = {
  subtractInsteadOfAdding: /add|make-10|compose|tens-ones/,
  omittedAddend: /add|make-10|compose|missing/,
  addedInsteadOfSubtracting: /subtract|missing-addend|add-sub/,
  reversedSubtraction: /subtract|missing-addend|add-sub/,
  addedFactors: /mul|array|area/,
  oneGroupOff: /mul|array/,
  subtractedInsteadOfDividing: /div/,
  multipliedInsteadOfDividing: /div/,
  addedInsteadOfDividing: /div/,
  addedDenominators: /fraction|equiv/,
  confusedGcfLcm: /gcf|lcm|factor|multiple/,
  swappedCoordinates: /coordinate|plane|integer/,
};

const secure = (status) => status.observed && status.p >= 0.8 && status.independent >= 4;

// The misconception named by repeated open notebook entries for this skill, or null.
export function repeatedCategory(tutor, key, now = Date.now()) {
  const counts = new Map();
  for (const entry of tutor.mistakes || [])
    if (entry.key === key && entry.category && now - entry.at <= TRIGGER.days * DAY) counts.set(entry.category, (counts.get(entry.category) || 0) + 1);
  const [category, count] = [...counts].sort((a, b) => b[1] - a[1])[0] || [];
  return count >= TRIGGER.repeatedCategory ? category : null;
}

// Repeated errors: the answer just given was a miss and at least two of the last few independent answers
// within the week were misses. Nearly-always-right learners are treated as slipping, not stuck.
export function shouldTrigger(tutor, skill, now = Date.now()) {
  const key = skillKey(skill);
  const recent = (tutor.records?.[key]?.recent || []).slice(-TRIGGER.lastEntries).filter((entry) => now - entry.at <= TRIGGER.days * DAY);
  const misses = recent.filter((entry) => entry.independent && !entry.correct).length;
  const last = tutor.records?.[key]?.recent?.at(-1);
  if (!last || last.correct || misses < TRIGGER.misses) return null;
  const category = repeatedCategory(tutor, key, now);
  const status = skillStatus(tutor, skill, now);
  if (!category && status.p !== null && status.p >= TRIGGER.slipEstimate) return null;
  return { misses, category };
}

// A failed prerequisite sends the next rescue one step deeper, until a rescue of something beneath it verified.
function needsDeeper(history, candidate, now) {
  const failed = history.filter((entry) => entry.prereq === skillKey(candidate) && entry.outcome === "not-yet" && now - entry.at <= TRIGGER.deeperDays * DAY);
  if (!failed.length) return false;
  const under = new Set(prerequisites(candidate).map(skillKey));
  const latest = Math.max(...failed.map((entry) => entry.at));
  return !history.some((entry) => entry.outcome === "verified" && entry.at > latest && under.has(entry.prereq));
}

// The probable prerequisite: the weakest not-yet-secure prerequisite, with a lean toward the one a repeated
// misconception points at, following a prerequisite that already failed a rescue one step deeper.
export function pickPrerequisite(tutor, skill, { category = null, now = Date.now() } = {}) {
  const history = tutor.rescues || [];
  const chain = [];
  let current = skill;
  for (let depth = 0; depth < 3; depth += 1) {
    const focus = category ? MISCONCEPTION_FOCUS[category] : null;
    const candidates = prerequisites(current)
      .filter((candidate) => candidate.grade >= 1 && skillKey(candidate) !== skillKey(skill) && !chain.includes(candidate))
      .map((candidate) => ({ candidate, status: skillStatus(tutor, candidate, now) }))
      .filter(({ status }) => !secure(status))
      .map(({ candidate, status }) => ({
        candidate,
        status,
        score: (status.observed ? status.p : 0.5) - (focus && (focus.test(candidate.id) || focus.test(candidate.generator)) ? 0.25 : 0),
      }))
      .sort((a, b) => a.score - b.score);
    if (!candidates.length) break;
    chain.push(candidates[0].candidate);
    if (!needsDeeper(history, candidates[0].candidate, now)) break;
    current = candidates[0].candidate;
  }
  return chain.length ? { prereq: chain.at(-1), chain } : null;
}

// One call for the app after a miss: a plan, or null when no rescue should be offered right now.
export function planRescue(tutor, skill, { now = Date.now(), sessionCount = 0 } = {}) {
  const trigger = shouldTrigger(tutor, skill, now);
  if (!trigger) return null;
  const pick = pickPrerequisite(tutor, skill, { category: trigger.category, now });
  if (!pick) return null;
  const goal = skillKey(skill);
  const prereq = skillKey(pick.prereq);
  if (rescueBlock(tutor.rescues, goal, prereq, now, sessionCount)) return null;
  const status = skillStatus(tutor, pick.prereq, now);
  return {
    goal,
    prereq,
    chain: pick.chain.map(skillKey),
    category: trigger.category,
    evidence: { misses: trigger.misses, prerequisite: status.observed ? { kind: "observed", estimate: status.p, independent: status.independent, correct: status.correct } : { kind: "inferred" } },
  };
}

// ---- The state machine --------------------------------------------------------------------------------------
// phases: offered -> lesson -> repair -> verify -> return. Events: accept, decline, lessonDone, answer, leave.
export const startRescue = (plan, now = Date.now()) => ({ phase: "offered", goal: plan.goal, prereq: plan.prereq, category: plan.category || null, startedAt: now, repairAnswered: 0, repairCorrect: 0, outcome: null, scaffold: null });

const finish = (state, outcome) => ({
  ...state,
  phase: "return",
  outcome,
  // After an unverified check the learner goes back to the goal with the steps visible, never with an easier goal.
  scaffold: outcome === "not-yet" ? { key: state.goal, left: SCAFFOLD_PROBLEMS } : null,
});

export function rescueStep(state, event) {
  if (state.phase === "return") return state;
  if (event.type === "leave") return finish(state, "left");
  switch (state.phase) {
    case "offered":
      if (event.type === "accept") return { ...state, phase: "lesson" };
      if (event.type === "decline") return finish(state, "declined");
      return state;
    case "lesson":
      return event.type === "lessonDone" ? { ...state, phase: "repair" } : state;
    case "repair": {
      if (event.type !== "answer") return state;
      const repairAnswered = state.repairAnswered + 1;
      const next = { ...state, repairAnswered, repairCorrect: state.repairCorrect + (event.correct ? 1 : 0) };
      return repairAnswered >= REPAIR_COUNT ? { ...next, phase: "verify" } : next;
    }
    default:
      // verify: only a right answer given without help counts as showing it.
      if (event.type !== "answer") return state;
      return finish(state, event.correct && event.independent ? "verified" : "not-yet");
  }
}

// The practice queue for the prerequisite: three guided repair problems, then the required independent check.
export function rescueQueue(state) {
  const repair = REPAIR_TIERS.map((tier, index) => ({ key: state.prereq, purpose: t("Repair practice {n} of 3", { n: index + 1 }), forceGuided: true, tier, rescue: "repair" }));
  return [...repair, { key: state.prereq, purpose: t("Show it on your own"), independent: true, tier: VERIFY_TIER, rescue: "verify" }];
}

// Learner-facing return message. It names both skills and says what happens next.
export function returnMessage(state) {
  const goal = findSkill(state.goal)?.title || "";
  const prereq = findSkill(state.prereq)?.title || "";
  if (state.outcome === "verified") return t("You showed {prereq} on your own. Back to {goal}: try again with what you just practiced.", { prereq, goal });
  if (state.outcome === "not-yet") return t("{prereq} needs a little more time, and that is okay. Back to {goal} with the steps showing; {prereq} will be waiting in your plan.", { prereq, goal });
  return t("Back to {goal}.", { goal });
}

export const rescueOfferText = (plan) => t("Two tough problems in a row can mean an earlier idea needs a look. Try a short rescue on {skill}, then come right back.", { skill: findSkill(plan.prereq)?.title || "" });

// Writes a rescue into the tutor's log, keyed by when it started, so a rescue that is abandoned half way still
// counts against the day's cap and a finished one replaces its own entry.
export function recordRescue(tutor, state) {
  const entry = { goal: state.goal, prereq: state.prereq, at: state.startedAt, outcome: state.outcome || "left" };
  const log = (tutor.rescues || []).filter((old) => !(old.goal === entry.goal && old.prereq === entry.prereq && old.at === entry.at));
  tutor.rescues = [...log, entry].slice(-RESCUE_LIMITS.keep);
}

// Scaffold bookkeeping on the resumed session: true (and one fewer left) while the goal skill still has steps owed.
export function consumeScaffold(session, key) {
  const scaffold = session?.rescueScaffold;
  if (!scaffold || scaffold.key !== key || scaffold.left <= 0) return false;
  scaffold.left -= 1;
  return true;
}

// Moby skill quests: 3-5 personal quests a day built from the recommendation engine and the mastery model, plus
// daily/weekly effort goals. Pure logic over a plain state object: no DOM, no clock except `now`, no randomness.
//
// Quests are met only through learning behaviour (independent correct answers, a revised answer after feedback, a
// written explanation, a strategy chosen on a right answer, a lesson worked through). Speed, click volume, streaks,
// hint use and repeating a mastered skill earn nothing (see quest-guard.js), and nothing here ever takes a reward
// away: counters only move forward, and a supportive retry is always available.
//
// Typical flow for the UI:
//   const { state, quests, goals } = dayQuests(state, tutor, grade, now, { learnerId })   // pins today's quests
//   const r = progressQuest(state, { type: "answer", correct, firstTry, supported, skillKey, sig, ... }, now)
//   state = r.state; show r.completed, r.noCredit (the reason text), r.goalsDone; saveQuests(state)
import { t } from "../i18n.js";
import { MASTERY_RULE, recommend } from "../recommendation-engine.js";
import { findSkill, localDay, skillKey } from "../tutor-engine.js";
import {
  dailyGoalProgress,
  emptyCounters,
  emptyWeek,
  pickDailyGoals,
  weekOf,
  weeklyGoalProgress,
  welcomeBack,
} from "./quest-goals.js";
import {
  GUARD,
  advance,
  judge,
  normalizeEvent,
  sanitizeGuard,
  whyNoCredit,
  whyText,
} from "./quest-guard.js";
import {
  MAX_DAYS,
  MAX_QUESTS,
  MAX_WEEKS,
  MIN_QUESTS,
  cleanCounts,
  cleanEvidence,
  daySnapshot,
  questDone,
  sanitizeQuests,
  stepComplete,
  stepDefs,
} from "./quest-state.js";

export { GUARD, whyNoCredit };
export {
  QUEST_KEY,
  QUEST_KINDS,
  emptyQuests,
  loadQuests,
  sanitizeQuests,
  saveQuests,
  daySnapshot,
} from "./quest-state.js";

const THINK_GROUP = {
  explain: "explain",
  strategy: "strategy",
  repair: "repair",
  revised: "repair",
};
const ACTION_MODE = {
  fixGap: "guided",
  keepFresh: "adaptive",
  learnNew: "visual",
  think: "adaptive",
  challenge: "adaptive",
  keepBuilding: "adaptive",
  showIt: "adaptive",
  teachBack: "adaptive",
  strategyPick: "adaptive",
};
const clone = (value) => structuredClone(value);

// ---- building today's quests -----------------------------------------------------------------------------------------
const evidenceOf = (entry) =>
  cleanEvidence({
    counts: cleanCounts(entry?.evidence?.counts),
    basis: entry?.evidence?.basis,
    state: entry?.evidence?.state,
  });
// Core quest candidates in priority order: [kind, recommendation section, index within it].
const PLAN = [
  ["fixGap", "fixAGap", 0],
  ["keepFresh", "review", 0],
  ["learnNew", "learnNext", 0],
  ["showIt", "readyToMaster", 0],
  ["keepBuilding", "keepPracticing", 0],
  ["fixGap", "fixAGap", 1],
  ["keepFresh", "review", 1],
  ["learnNew", "learnNext", 1],
  ["keepBuilding", "keepPracticing", 1],
  ["learnNew", "learnNext", 2],
];
const THINK_FROM = [
  "keepPracticing",
  "readyToMaster",
  "fixAGap",
  "review",
  "learnNext",
  "challenge",
];

// The day's quest definitions for one learner. Deterministic: the same tutor record on the same day gives the same quests
// and the same ids (`<learner>:<day>:<slot>`). ctx: { learnerId, sections } (sections = recommend() output, injectable).
export function buildQuests(tutor, grade, now = Date.now(), ctx = {}) {
  const learner = String(ctx.learnerId ?? "0").slice(0, 8);
  const day = localDay(now);
  const sections = ctx.sections || recommend(tutor, grade, now);
  const items = Object.fromEntries(sections.map((section) => [section.id, section.items]));
  const quests = [];
  const make = (kind, entry, slot, keys) => {
    const lessonDone =
      kind === "learnNew" && Boolean(tutor?.records?.[skillKey(entry.skill)]?.lessonCompleted);
    const steps = stepDefs(kind).filter((step) => !(lessonDone && step.id === "idea"));
    quests.push({
      id: `${learner}:${day}:${slot}`,
      kind,
      slot,
      keys,
      skillKey: keys[0] || "",
      optional: kind === "challenge",
      steps: steps.map((step) => step.id),
      progress: Object.fromEntries(steps.map((step) => [step.id, { have: 0, kinds: [] }])),
      evidence: evidenceOf(entry),
      status: "active",
      retries: 0,
    });
  };
  const used = new Set();
  const core = [];
  for (const [kind, section, index] of PLAN) {
    const entry = items[section]?.[index];
    if (!entry || used.has(skillKey(entry.skill)) || core.length >= MIN_QUESTS) continue;
    used.add(skillKey(entry.skill));
    const keys =
      kind === "fixGap" && entry.alt?.key
        ? [skillKey(entry.skill), entry.alt.key]
        : [skillKey(entry.skill)];
    core.push([kind, entry, keys]);
  }
  const seen = {};
  for (const [kind, entry, keys] of core) {
    seen[kind] = (seen[kind] || 0) + 1;
    make(kind, entry, seen[kind] > 1 ? `${kind}${seen[kind]}` : kind, keys);
  }
  const lead =
    THINK_FROM.map((id) => items[id]?.[0]).find(Boolean) ||
    sections.flatMap((section) => section.items)[0];
  if (lead) make("think", lead, "think", [skillKey(lead.skill)]);
  const stretch = items.challenge?.[0];
  if (stretch && quests.length < MAX_QUESTS && !used.has(skillKey(stretch.skill)))
    make("challenge", stretch, "challenge", [skillKey(stretch.skill)]);
  // A learner with everything mastered and nothing due still gets thinking work, never repetition.
  for (const kind of ["teachBack", "strategyPick"])
    if (lead && quests.length < MIN_QUESTS) make(kind, lead, kind, [skillKey(lead.skill)]);
  return quests;
}

// ---- how a quest reads ------------------------------------------------------------------------------------------------
const skillTitle = (key) => (findSkill(key) ? t(findSkill(key).title) : "");
const sentence = (...parts) => parts.filter(Boolean).join(" ");
const solved = (c) =>
  c.independent
    ? t("You solved {s} of {n} on your own.", { s: c.successes, n: c.independent })
    : "";

function whyFor(quest) {
  const c = quest.evidence.counts;
  switch (quest.kind) {
    case "fixGap":
      return c.openMistakes
        ? sentence(
            c.openMistakes === 1
              ? t("One mistake is still open in your notebook.")
              : t("{m} mistakes are still open in your notebook.", { m: c.openMistakes }),
            solved(c),
          )
        : sentence(
            solved(c),
            c.independent
              ? t("This idea needs another look.")
              : t(
                  "In your starting-point check, this one was worth another look. You have tried {n} problems on your own so far.",
                  { n: c.independent },
                ),
          );
    case "keepFresh":
      return sentence(
        c.independent
          ? solved(c)
          : t("You have tried {n} problems on your own so far.", { n: c.independent }),
        t(
          "Your review is due, and your mastery score is {score} out of 100. A quick refresh keeps it strong.",
          { score: c.score },
        ),
      );
    case "learnNew":
      return quest.steps.includes("idea")
        ? t(
            "New for you. You have tried {n} problems on your own so far, so start with the picture lesson.",
            { n: c.independent },
          )
        : t("You explored the picture lesson, but have tried {n} problems on your own so far.", {
            n: c.independent,
          });
    case "keepBuilding":
      return c.independent
        ? sentence(
            solved(c),
            t(
              "Your mastery score is {score} out of 100, so a few more tries on your own will build it.",
              { score: c.score },
            ),
          )
        : t("You have used help {n} times here. Next, try some on your own.", { n: c.supported });
    case "showIt":
      return sentence(
        solved(c),
        t("Your mastery score is {score} out of 100, and mastery starts at {target}.", {
          score: c.score,
          target: MASTERY_RULE.score,
        }),
        t(
          "You have {checks} checks on {days} days. Mastery needs {needChecks} checks on {needDays} days.",
          {
            checks: c.checks,
            days: c.days,
            needChecks: MASTERY_RULE.checks,
            needDays: MASTERY_RULE.days,
          },
        ),
      );
    case "challenge":
      return sentence(
        solved(c),
        t(
          "Your mastery score is {score} out of 100, and you have not solved a stretch problem yet, so this is a chance to go further.",
          { score: c.score },
        ),
      );
    default:
      return c.independent
        ? t(
            "Explaining makes ideas stick. You have solved {s} of {n} on your own in {skill}, so show how you think.",
            { s: c.successes, n: c.independent, skill: skillTitle(quest.skillKey) },
          )
        : t(
            "Explaining makes ideas stick. You have tried {n} problems on your own so far, so show how you think.",
            { n: c.independent },
          );
  }
}

const titleOf = (kind) =>
  ({
    fixGap: t("Fix a Gap"),
    keepFresh: t("Keep it Fresh"),
    learnNew: t("Learn Something New"),
    think: t("Think Like a Mathematician"),
    challenge: t("Challenge"),
    keepBuilding: t("Keep Building"),
    showIt: t("Show What You Know"),
    teachBack: t("Teach It Back"),
    strategyPick: t("Compare Ways"),
  })[kind];
const stepLabel = (step) =>
  ({
    repair: t("Fix a mistake: read the feedback and revise your answer"),
    reassess: t("Show it on your own with a fresh problem"),
    recall: t("Solve {n} fresh problems on your own", { n: step.need }),
    idea: t("Explore the picture lesson"),
    try: t("Solve {n} problems, with help if you need it", { n: step.need }),
    own: t("Show one on your own"),
    think: t(
      "Do {n} different kinds of thinking: explain, choose a strategy, or repair a mistake",
      { n: step.need },
    ),
    stretch: t("Solve {n} stretch problems", { n: step.need }),
    build: t("Solve {n} on your own", { n: step.need }),
    show: t("Solve {n} on your own", { n: step.need }),
    explain: t("Explain how you solved a problem in your own words"),
    strategy: t("Solve a problem and pick the strategy you used"),
  })[step.id];

export function describeQuest(quest) {
  const skill = skillTitle(quest.skillKey);
  const objective = {
    fixGap: t(
      "Fix a tricky spot in {skill}: revise a mistake after feedback, then show it on your own with a fresh problem.",
      { skill },
    ),
    keepFresh: t("Refresh {skill} so it stays strong: solve 2 fresh problems on your own.", {
      skill,
    }),
    learnNew: t(
      "Meet {skill}: explore the idea, try some with help if you want it, then show one on your own.",
      { skill },
    ),
    think: t(
      "Show how you think: do two different kinds of thinking, like explaining an answer, choosing a strategy, or repairing a mistake.",
    ),
    challenge: t(
      "Stretch {skill}: solve 2 stretch-level problems. A revised answer after feedback counts too.",
      { skill },
    ),
    keepBuilding: t("Build {skill}: solve 3 problems on your own at your grade level.", { skill }),
    showIt: t(
      "Show what you know in {skill}: solve 3 problems on your own to move toward mastery.",
      { skill },
    ),
    teachBack: t("Teach it back: explain in your own words how you solved a problem."),
    strategyPick: t("Compare ways: solve a problem and pick the strategy you used."),
  }[quest.kind];
  const basis = {
    observed: t("Based on your own answers."),
    mixed: t("Based on your answers and how skills connect."),
    inferred: t("A guess from how skills connect."),
  }[quest.evidence.basis];
  const steps = stepDefs(quest.kind, quest.steps).map((step) => {
    const have = Math.min(step.need, quest.progress?.[step.id]?.have || 0);
    return { id: step.id, text: stepLabel(step), need: step.need, have, done: have >= step.need };
  });
  return {
    title: titleOf(quest.kind),
    objective,
    why: whyFor(quest),
    basisText: basis,
    skillTitle: skill,
    steps,
  };
}

export const viewQuest = (quest) => ({
  ...quest,
  ...describeQuest(quest),
  done: quest.status === "done",
  progressText: t("{done} of {total} steps", {
    done: stepDefs(quest.kind, quest.steps).filter((step) => stepComplete(step, quest.progress))
      .length,
    total: quest.steps.length,
  }),
  action: { kind: "open", key: quest.skillKey, mode: ACTION_MODE[quest.kind] },
});

// ---- the day ---------------------------------------------------------------------------------------------------------
export function goals(state, now = Date.now()) {
  const today = localDay(now);
  const rec = state.days[today];
  const lastDay =
    Object.values(state.weeks)
      .flatMap((week) => week.days)
      .filter((day) => day < today)
      .sort()
      .at(-1) || null;
  return {
    daily: rec ? dailyGoalProgress(rec.goals, rec.counters) : [],
    weekly: weeklyGoalProgress(state.weeks, now),
    retry: {
      available: true,
      text: t(
        "Want another go? A supportive retry is always here, and you keep everything you have earned.",
      ),
    },
    welcome: welcomeBack(lastDay, now),
  };
}

// Pins today's quests (building them once) and returns the new state plus what the UI shows.
export function dayQuests(state, tutor, grade, now = Date.now(), ctx = {}) {
  const next = clone(sanitizeQuests(state, ctx.learnerId));
  const day = localDay(now);
  if (!next.days[day]) {
    const snapshot = daySnapshot(tutor, now);
    next.days[day] = {
      quests: buildQuests(tutor, grade, now, { ...ctx, learnerId: ctx.learnerId ?? next.learner }),
      goals: pickDailyGoals(snapshot, day, next.learner),
      counters: emptyCounters(),
      snapshot,
    };
    for (const old of Object.keys(next.days).sort().slice(0, -MAX_DAYS)) delete next.days[old];
  }
  next.guard = sanitizeGuard(next.guard, day);
  return { state: next, quests: next.days[day].quests.map(viewQuest), goals: goals(next, now) };
}

export function questSummary(state, now = Date.now()) {
  const list = state.days[localDay(now)]?.quests || [];
  const required = list.filter((quest) => !quest.optional);
  return {
    total: required.length,
    done: required.filter((quest) => quest.status === "done").length,
    optionalDone: list.filter((quest) => quest.optional && quest.status === "done").length,
  };
}

export const questStats = (state) => ({
  ...state.stats,
  questsDone: Object.values(state.stats.quests).reduce((sum, n) => sum + n, 0),
  activeDays: new Set(Object.values(state.weeks).flatMap((week) => week.days)).size,
});

// ---- progress --------------------------------------------------------------------------------------------------------
function accepts(step, quest, ev, verdict) {
  if (step.scope === "target" && ev.skillKey !== quest.keys[0]) return false;
  if (step.scope === "quest" && !quest.keys.includes(ev.skillKey)) return false;
  const kind = verdict.kind;
  switch (step.type) {
    case "lesson":
      return kind === "lesson";
    case "repair":
      return ["revised", "repair", "supported"].includes(kind);
    case "engage":
      return ["independent", "supported", "revised"].includes(kind);
    case "independent":
      return (
        (kind === "independent" || (step.allowRevised && kind === "revised")) &&
        ev.level >= (step.minLevel ?? 0)
      );
    case "stretch":
      return (kind === "independent" || kind === "revised") && ev.level === 2;
    case "explain":
      return kind === "explain";
    case "strategy":
      return kind === "strategy";
    case "think":
      return (
        THINK_GROUP[kind] !== undefined && !quest.progress.think.kinds.includes(THINK_GROUP[kind])
      );
    default:
      return false;
  }
}

// Fills the first open step this event can fill (ordered steps wait for the ones before them). Returns the step id.
function creditQuest(quest, ev, verdict) {
  const defs = stepDefs(quest.kind, quest.steps);
  for (const [index, step] of defs.entries()) {
    if (stepComplete(step, quest.progress)) continue;
    if (step.ordered && !defs.slice(0, index).every((prior) => stepComplete(prior, quest.progress)))
      continue;
    if (!accepts(step, quest, ev, verdict)) continue;
    const slot = quest.progress[step.id];
    slot.have += 1;
    if (step.type === "think") slot.kinds = [...slot.kinds, THINK_GROUP[verdict.kind]];
    return step.id;
  }
  return null;
}

// What an accepted event adds to the day's goal counters (independent of which quests it filled).
function goalDeltas(ev, verdict, rec, seen) {
  const kind = verdict.kind;
  return {
    repairs: kind === "revised" || kind === "repair" ? 1 : 0,
    explains: kind === "explain" ? 1 : 0,
    newStrategies:
      kind === "strategy" &&
      !rec.snapshot.strategies.includes(ev.strategy) &&
      !seen.includes(ev.strategy)
        ? 1
        : 0,
    reviewItems:
      kind === "independent" && ev.level >= 1 && rec.snapshot.pool.includes(ev.skillKey) ? 1 : 0,
  };
}

// Consumes one learning event. Returns { state, verdict, credited, completed, goalsDone, noCredit } where `noCredit` is
// the plain-language reason when nothing counted (empty when something did). `state` must come from dayQuests.
export function progressQuest(state, event, now = Date.now()) {
  const next = clone(sanitizeQuests(state));
  const day = localDay(now);
  const rec = next.days[day];
  const out = (verdict, extra = {}) => ({
    state: next,
    verdict,
    credited: [],
    completed: [],
    goalsDone: [],
    noCredit: whyText(verdict.reason),
    ...extra,
  });
  if (!rec) return out({ credit: false, kind: null, reason: "no-quests" });
  next.guard = sanitizeGuard(next.guard, day);
  const ev = normalizeEvent(event);
  let verdict = judge(next.guard, ev, {
    masteredKeys: rec.snapshot.mastered,
    isSkill: (key) => Boolean(findSkill(key)),
  });
  const credited = [];
  const completed = [];
  const deltas = verdict.credit ? goalDeltas(ev, verdict, rec, next.strategiesSeen) : null;
  if (verdict.credit) {
    for (const quest of rec.quests) {
      if (quest.status === "done") continue;
      const stepId = creditQuest(quest, ev, verdict);
      if (!stepId) continue;
      credited.push({ questId: quest.id, stepId });
      if (questDone(quest)) {
        quest.status = "done";
        completed.push({ id: quest.id, kind: quest.kind, skillKey: quest.skillKey });
      }
    }
    if (!credited.length && !Object.values(deltas).some(Boolean))
      verdict = {
        credit: false,
        kind: null,
        reason: verdict.kind === "supported" ? "supported-only" : "not-in-quest",
      };
  }
  next.guard = advance(next.guard, ev, verdict);
  if (!verdict.credit) return out(verdict);

  const before = dailyGoalProgress(rec.goals, rec.counters).map((goal) => goal.done);
  const reassess = credited.some((entry) => entry.stepId === "reassess") ? 1 : 0;
  rec.counters.credited += 1;
  rec.counters.reassess += reassess;
  for (const [name, n] of Object.entries(deltas)) rec.counters[name] += n;
  if (ev.type === "strategy" && !next.strategiesSeen.includes(ev.strategy))
    next.strategiesSeen = [...next.strategiesSeen, ev.strategy].slice(-30);
  const week = (next.weeks[weekOf(now)] ||= emptyWeek());
  if (!week.days.includes(day)) week.days = [...week.days, day].sort();
  const add = (name, n, weekName = name) => {
    if (!n) return;
    week[weekName] += n;
    next.stats[name] = Math.min(100000, next.stats[name] + n);
  };
  add("repairs", deltas.repairs);
  add("explains", deltas.explains);
  add("strategies", verdict.kind === "strategy" ? 1 : 0);
  add("reassess", reassess);
  add("reviews", deltas.reviewItems);
  for (const entry of completed) {
    week.quests += 1;
    next.stats.quests[entry.kind] = Math.min(100000, (next.stats.quests[entry.kind] || 0) + 1);
  }
  for (const old of Object.keys(next.weeks).sort().slice(0, -MAX_WEEKS)) delete next.weeks[old];
  const goalsDone = dailyGoalProgress(rec.goals, rec.counters)
    .filter((goal, index) => goal.done && !before[index])
    .map((goal) => goal.id);
  return out(verdict, { credited, completed, goalsDone, noCredit: "" });
}

// A supportive retry: clears the day's pauses (the burst and support-loop checks) and keeps everything already earned.
// It is always available and never costs a reward.
export function supportiveRetry(state, questId, now = Date.now()) {
  const next = clone(sanitizeQuests(state));
  const day = localDay(now);
  const quest = next.days[day]?.quests.find((entry) => entry.id === questId);
  if (!quest) return { state: next, ok: false, text: whyText("no-quests") };
  if (quest.status !== "done") {
    quest.retries = Math.min(99, quest.retries + 1);
    next.retries = Math.min(100000, next.retries + 1);
    next.guard = { ...sanitizeGuard(next.guard, day), recent: [], supportRun: 0 };
  }
  return {
    state: next,
    ok: true,
    text: t(
      "Fresh start. Take your time, read each problem, and use hints whenever you want. You keep everything you have earned.",
    ),
  };
}

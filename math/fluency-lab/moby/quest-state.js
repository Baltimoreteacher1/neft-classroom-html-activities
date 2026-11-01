// Saved state for the Moby quests: the step templates, the shape of the record, its sanitizer, and persistence.
// Everything loads through sanitizeQuests, so a hand-edited or corrupted save can never crash the Lab or hand out
// credit it did not earn: step progress is clamped to what each step needs and "done" is recomputed, never trusted.
import { MASTERY_STATES } from "../mastery-model.js";
import { profileKey, profiles, readLocal, writeLocal } from "../school-tools.js";
import { DAY, evidence, findSkill } from "../tutor-engine.js";
import { sanitizeGuard } from "./quest-guard.js";
import { DAILY_GOALS, emptyCounters, emptyWeek } from "./quest-goals.js";

export const QUEST_KEY = "ewl-fluency-moby-quests-v1";
export const QUEST_KINDS = Object.freeze([
  "fixGap",
  "keepFresh",
  "learnNew",
  "think",
  "challenge",
  "keepBuilding",
  "showIt",
  "teachBack",
  "strategyPick",
]);
export const MAX_DAYS = 21;
export const MAX_WEEKS = 12;
export const MAX_QUESTS = 5;
export const MIN_QUESTS = 3;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const STRATEGY_RE = /^[a-z][a-z0-9-]{1,30}$/;

// Step templates. `scope`: target = the quest's skill, quest = any skill the quest names, any = any skill.
// `ordered` steps only count once every earlier step is done.
export const STEP_DEFS = Object.freeze({
  fixGap: [
    { id: "repair", type: "repair", need: 1, scope: "quest" },
    { id: "reassess", type: "independent", need: 1, scope: "target", ordered: true, minLevel: 1 },
  ],
  keepFresh: [{ id: "recall", type: "independent", need: 2, scope: "target", minLevel: 1 }],
  learnNew: [
    { id: "idea", type: "lesson", need: 1, scope: "target" },
    { id: "try", type: "engage", need: 2, scope: "target" },
    { id: "own", type: "independent", need: 1, scope: "target", ordered: true, minLevel: 0 },
  ],
  think: [{ id: "think", type: "think", need: 2, scope: "any" }],
  challenge: [{ id: "stretch", type: "stretch", need: 2, scope: "target" }],
  keepBuilding: [
    { id: "build", type: "independent", need: 3, scope: "target", minLevel: 1, allowRevised: true },
  ],
  showIt: [{ id: "show", type: "independent", need: 3, scope: "target", minLevel: 1 }],
  teachBack: [{ id: "explain", type: "explain", need: 1, scope: "any" }],
  strategyPick: [{ id: "strategy", type: "strategy", need: 1, scope: "any" }],
});
export const stepDefs = (kind, ids) =>
  STEP_DEFS[kind].filter((step) => !ids || ids.includes(step.id));
export const stepComplete = (step, progress) => (progress?.[step.id]?.have || 0) >= step.need;
export const questDone = (quest) =>
  stepDefs(quest.kind, quest.steps).every((step) => stepComplete(step, quest.progress));

const int = (value, max = 100000) => Math.max(0, Math.min(max, Math.floor(Number(value)) || 0));

export const emptyQuests = (learner = "0") => ({
  version: 1,
  learner: String(learner).slice(0, 8),
  days: {},
  guard: sanitizeGuard(null),
  weeks: {},
  stats: { quests: {}, repairs: 0, explains: 0, strategies: 0, reassess: 0, reviews: 0 },
  strategiesSeen: [],
  retries: 0,
});

export const cleanCounts = (counts) => {
  const out = {};
  for (const name of [
    "independent",
    "successes",
    "supported",
    "checks",
    "days",
    "score",
    "openMistakes",
  ])
    out[name] = int(counts?.[name]);
  return out;
};
export const cleanEvidence = (value) => ({
  counts: cleanCounts(value?.counts),
  basis: ["observed", "mixed", "inferred"].includes(value?.basis) ? value.basis : "observed",
  state: MASTERY_STATES.includes(value?.state) ? value.state : "new",
});

function cleanQuest(raw, day, learner) {
  if (!raw || typeof raw !== "object" || !STEP_DEFS[raw.kind]) return null;
  const keys = [
    ...new Set(
      (Array.isArray(raw.keys) ? raw.keys : []).filter(
        (key) => typeof key === "string" && findSkill(key),
      ),
    ),
  ].slice(0, 2);
  if (!keys.length && stepDefs(raw.kind).some((step) => step.scope === "target")) return null;
  const chosen = (Array.isArray(raw.steps) ? raw.steps : []).filter((id) =>
    STEP_DEFS[raw.kind].some((step) => step.id === id),
  );
  const steps = stepDefs(raw.kind, chosen.length ? chosen : null).map((step) => step.id);
  const progress = {};
  for (const step of stepDefs(raw.kind, steps)) {
    const saved = raw.progress?.[step.id] || {};
    progress[step.id] = {
      have: Math.min(step.need, int(saved.have, 99)),
      kinds: (Array.isArray(saved.kinds) ? saved.kinds : [])
        .filter((kind) => ["explain", "strategy", "repair"].includes(kind))
        .slice(0, 3),
    };
  }
  const slot = /^[A-Za-z0-9]{1,24}$/.test(String(raw.slot)) ? raw.slot : raw.kind;
  const quest = {
    id: /^[\w:-]{1,80}$/.test(String(raw.id)) ? raw.id : `${learner}:${day}:${slot}`,
    kind: raw.kind,
    slot,
    keys,
    skillKey: keys[0] || "",
    optional: raw.kind === "challenge",
    steps,
    progress,
    evidence: cleanEvidence(raw.evidence),
    status: "active",
    retries: int(raw.retries, 99),
  };
  if (questDone(quest)) quest.status = "done";
  return quest;
}

const skillKeys = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((key) => typeof key === "string" && findSkill(key))
    .slice(0, 200);
const cleanSnapshot = (value) => ({
  mastered: skillKeys(value?.mastered),
  pool: skillKeys(value?.pool),
  strategies: (Array.isArray(value?.strategies) ? value.strategies : [])
    .filter((id) => STRATEGY_RE.test(String(id)))
    .slice(0, 30),
  openMistakes: int(value?.openMistakes, 1000),
});
const cleanCounters = (value) =>
  Object.fromEntries(Object.keys(emptyCounters()).map((name) => [name, int(value?.[name], 10000)]));

function cleanWeeks(source) {
  const out = {};
  const keys = Object.keys(source && typeof source === "object" ? source : {})
    .filter((day) => DAY_RE.test(day))
    .sort()
    .slice(-MAX_WEEKS);
  for (const week of keys) {
    const rec = source[week] || {};
    out[week] = {
      ...emptyWeek(),
      days: [
        ...new Set((Array.isArray(rec.days) ? rec.days : []).filter((day) => DAY_RE.test(day))),
      ]
        .sort()
        .slice(0, 7),
      ...Object.fromEntries(
        ["repairs", "reassess", "explains", "strategies", "reviews", "quests"].map((name) => [
          name,
          int(rec[name], 10000),
        ]),
      ),
    };
  }
  return out;
}

// Accepts anything (storage, a restored backup, a hand edit) and returns a well-formed state. Never throws.
export function sanitizeQuests(value, learner = "0") {
  const clean = emptyQuests(
    typeof value?.learner === "string" && value.learner ? value.learner : learner,
  );
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1)
    return clean;
  const days = Object.keys(value.days && typeof value.days === "object" ? value.days : {})
    .filter((day) => DAY_RE.test(day))
    .sort()
    .slice(-MAX_DAYS);
  for (const day of days) {
    const rec = value.days[day];
    if (!rec || typeof rec !== "object") continue;
    clean.days[day] = {
      quests: (Array.isArray(rec.quests) ? rec.quests : [])
        .map((q) => cleanQuest(q, day, clean.learner))
        .filter(Boolean)
        .slice(0, MAX_QUESTS),
      goals: (Array.isArray(rec.goals) ? rec.goals : [])
        .filter((goal) => goal && DAILY_GOALS[goal.id])
        .slice(0, 2)
        .map((goal) => ({ id: goal.id, target: Math.max(1, int(goal.target, 20)) })),
      counters: cleanCounters(rec.counters),
      snapshot: cleanSnapshot(rec.snapshot),
    };
  }
  clean.guard = sanitizeGuard(value.guard, days.at(-1) || "");
  clean.weeks = cleanWeeks(value.weeks);
  const stats = value.stats || {};
  clean.stats = {
    quests: Object.fromEntries(
      QUEST_KINDS.filter((kind) => int(stats.quests?.[kind])).map((kind) => [
        kind,
        int(stats.quests[kind]),
      ]),
    ),
    ...Object.fromEntries(
      ["repairs", "explains", "strategies", "reassess", "reviews"].map((name) => [
        name,
        int(stats[name]),
      ]),
    ),
  };
  clean.strategiesSeen = (Array.isArray(value.strategiesSeen) ? value.strategiesSeen : [])
    .filter((id) => STRATEGY_RE.test(String(id)))
    .slice(0, 30);
  clean.retries = int(value.retries);
  return clean;
}

const storeKey = (id = profiles().active) => profileKey(QUEST_KEY, id);
export const loadQuests = (id) =>
  sanitizeQuests(readLocal(storeKey(id), null), String(id ?? profiles().active));
export const saveQuests = (state, id) =>
  writeLocal(storeKey(id), sanitizeQuests(state, String(id ?? profiles().active)));

// What the day's guard and goals need to know about the learner, frozen when the quests are pinned.
// mastered = mastered, not due, practised in the last week: more practice there is repetition.
// pool = proficient or mastered skills that are due or have rested a week: the "review what you mastered" set.
export function daySnapshot(tutor, now = Date.now()) {
  const mastered = [];
  const pool = [];
  const strategies = new Set();
  for (const [key, record] of Object.entries(tutor?.records || {})) {
    const skill = findSkill(key);
    if (!skill) continue;
    for (const tag of record.strategyTags || []) strategies.add(tag);
    const ev = evidence(tutor, skill, now);
    const strong = ev.state === "proficient" || ev.state === "mastered";
    const stale = !Number.isFinite(record.lastAt) || record.lastAt <= now - 7 * DAY;
    if (strong && (ev.due || stale)) pool.push(key);
    else if (ev.state === "mastered" && !ev.due) mastered.push(key);
  }
  return {
    mastered: mastered.sort(),
    pool: pool.sort(),
    strategies: [...strategies].sort(),
    openMistakes: (tutor?.mistakes || []).filter((entry) => !entry.resolvedAt).length,
  };
}

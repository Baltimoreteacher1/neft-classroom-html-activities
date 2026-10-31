// Achievements 4: pure rules that turn saved evidence into recognition. Nothing here reads storage or the clock on its
// own, so every rule can be tested from fixtures. Recognition is earned only from independent, spaced evidence (the same
// 0-100 mastery model as the rest of the lab): hints, repeats of one problem and supported answers never add to it.
// There are no timers, no points, and no loss framing: a break in practice days never removes anything earned.
import { MASTERY_STATES, masteryParts, masteryScore, masteryState } from "./mastery-model.js";
import { mistakeCategoryLabel } from "./mistake-notes.js";
import { ALL_SKILLS } from "./problem-bank.js";
import { DAY, findSkill, localDay, skillKey } from "./tutor-engine.js";
import { t } from "./i18n.js";

const rankOf = (state) => Math.max(0, MASTERY_STATES.indexOf(state));
const PROFICIENT = rankOf("proficient");
export const STRAND_LEVELS = 3;
// Cumulative challenges climb in three tiers; each tier is one recognition, never a repeating loop.
export const CHALLENGES = Object.freeze({
  proficient: Object.freeze([3, 10, 25]),
  explored: Object.freeze([5, 15, 40]),
  days: Object.freeze([5, 15, 30]),
  rhythm: Object.freeze([3, 7, 14]),
  corrected: Object.freeze([1, 3, 6]),
  retained: Object.freeze([1, 3, 6]),
});
export const GROWTH_MIN_DELTA = 10;
export const RETAIN_MIN_DAYS = 7;
const MAX_GOALS = 3;

export const stateLabel = (state) =>
  ({
    new: t("Not started"),
    learning: t("Learning"),
    developing: t("Developing"),
    proficient: t("Proficient"),
    mastered: t("Mastered"),
  })[state] || t("Not started");

// ---- per-skill view of the saved record --------------------------------------------------------------------------------
export function skillStates(tutor, now = Date.now()) {
  const states = new Map();
  for (const [key, record] of Object.entries(tutor?.records || {})) {
    const skill = findSkill(key);
    const score = masteryScore(record, now);
    if (!skill || score === null) continue;
    states.set(key, {
      key,
      skill,
      score,
      state: masteryState(record, now),
      parts: masteryParts(record, now),
    });
  }
  return states;
}

// A repeated identical problem is one piece of evidence, so it adds one day at most: keep the latest entry per signature.
const distinct = (recent) => {
  const last = new Map();
  recent.forEach((entry, index) => entry.sig && last.set(entry.sig, index));
  return recent.filter((entry, index) => !entry.sig || last.get(entry.sig) === index);
};
const independentDays = (record) => [...new Set(distinct(record?.recent || []).filter((entry) => entry.independent).map((entry) => localDay(entry.at)))];

// ---- tiered recognition -----------------------------------------------------------------------------------------------
const tiers = (kind, value, thresholds) =>
  thresholds.map((at, index) => ({
    id: `${kind}:${index + 1}`,
    kind,
    tier: index + 1,
    at,
    value,
    earned: value >= at,
  }));

// Practice days from independent attempts and from the practice-day record, as sets of local dates.
export function practiceDays(tutor, rewards) {
  const days = new Set(Array.isArray(rewards?.days) ? rewards.days : []);
  for (const record of Object.values(tutor?.records || {}))
    for (const day of independentDays(record)) days.add(day);
  return days;
}

// Consecutive days ending today or yesterday (an evening visit never erases a run), and the best run on record.
export function runs(days, now = Date.now()) {
  const set = days instanceof Set ? days : new Set(days);
  const step = (date, by) => {
    const next = new Date(date);
    next.setDate(next.getDate() + by);
    return next;
  };
  let cursor = new Date(now);
  if (!set.has(localDay(cursor.getTime()))) cursor = step(cursor, -1);
  let current = 0;
  while (set.has(localDay(cursor.getTime()))) {
    current += 1;
    cursor = step(cursor, -1);
  }
  let best = 0;
  for (const day of set) {
    const [y, m, d] = day.split("-").map(Number);
    const before = new Date(y, m - 1, d - 1);
    if (set.has(localDay(before.getTime()))) continue;
    let length = 0;
    let at = new Date(y, m - 1, d);
    while (set.has(localDay(at.getTime()))) {
      length += 1;
      at = step(at, 1);
    }
    best = Math.max(best, length);
  }
  return { current, best };
}

// ---- strand milestones (interactive on the page: each opens to its skills) --------------------------------------------
export function strandMilestones(states) {
  const groups = new Map();
  for (const skill of ALL_SKILLS) {
    const id = `${skill.grade}:${skill.strand}`;
    if (!groups.has(id))
      groups.set(id, { id, grade: skill.grade, strand: skill.strand, skills: [] });
    groups.get(id).skills.push(skill);
  }
  return [...groups.values()].map((group) => {
    const rows = group.skills.map((skill) => {
      const found = states.get(skillKey(skill));
      return {
        key: skillKey(skill),
        title: skill.title,
        state: found?.state || "new",
        score: found?.score ?? null,
      };
    });
    const proficient = rows.filter((row) => rankOf(row.state) >= PROFICIENT).length;
    const total = rows.length;
    const level =
      proficient === total
        ? 3
        : proficient * 2 >= total && proficient > 0
          ? 2
          : proficient > 0
            ? 1
            : 0;
    return {
      id: `strand:${group.id}`,
      kind: "strand",
      grade: group.grade,
      strand: group.strand,
      total,
      proficient,
      mastered: rows.filter((row) => row.state === "mastered").length,
      level,
      earned: level > 0,
      skills: rows,
    };
  });
}

// ---- growth, corrected misconceptions, retention ----------------------------------------------------------------------
// With the teacher growth log, growth is measured against the first recorded snapshot. Without it, the only honest start is
// a starting-point checkup miss on that skill, so celebrate only a skill that moved from that miss to proficient or better.
export function growthEvents(tutor, states, log, api, now) {
  const events = [];
  for (const state of states.values()) {
    const found = api?.growthFor && log ? api.growthFor(log, state.key) : null;
    if (found?.start && found?.now) {
      const advanced = rankOf(found.now.state) > rankOf(found.start.state);
      if (advanced && found.now.score - found.start.score >= GROWTH_MIN_DELTA)
        events.push({
          key: state.key,
          from: found.start.state,
          to: found.now.state,
          delta: found.now.score - found.start.score,
          basis: "log",
        });
      continue;
    }
    const checkup = tutor?.diagnostics?.[state.skill.grade]?.results?.[state.key];
    if (checkup === false && rankOf(state.state) >= PROFICIENT)
      events.push({
        key: state.key,
        from: "learning",
        to: state.state,
        delta: null,
        basis: "checkup",
      });
  }
  return events.sort((a, b) => a.key.localeCompare(b.key));
}

// Distinct (skill, idea) pairs the learner repaired: two fresh independent successes resolved the notebook entry.
export function correctedList(tutor, api) {
  const listed = api?.correctedMisconceptions ? api.correctedMisconceptions(tutor) : null;
  const rows =
    listed ||
    (tutor?.mistakes || [])
      .filter((entry) => entry.resolvedAt && entry.category)
      .map((entry) => ({ key: entry.key, category: entry.category, resolvedAt: entry.resolvedAt }));
  const seen = new Set();
  return rows.filter((row) => {
    const id = `${row.key}|${row.category}`;
    if (!findSkill(row.key) || !row.category || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// A skill is retained when it is proficient or better now and independent correct answers (grade-level work) on at least
// two different days are a week or more apart. daysHeld is the whole days between the first and the latest.
export function retainedList(log, tutor, states, api, now) {
  if (api?.retainedSkills)
    return api.retainedSkills(log, tutor, now).filter((row) => findSkill(row.key));
  const rows = [];
  for (const state of states.values()) {
    if (rankOf(state.state) < PROFICIENT) continue;
    const entries = (tutor.records[state.key]?.recent || []).filter(
      (entry) => entry.independent && entry.correct && entry.level >= 1,
    );
    if (new Set(entries.map((entry) => localDay(entry.at))).size < 2) continue;
    const span =
      Math.max(...entries.map((entry) => entry.at)) - Math.min(...entries.map((entry) => entry.at));
    if (span >= RETAIN_MIN_DAYS * DAY)
      rows.push({ key: state.key, daysHeld: Math.floor(span / DAY) });
  }
  return rows.sort((a, b) => a.key.localeCompare(b.key));
}

// ---- student-selected goals -------------------------------------------------------------------------------------------
export const GOALS_KEY = "ewl-fluency-goals-v1";
export function sanitizeGoals(value) {
  const list = Array.isArray(value?.goals) ? value.goals : [];
  const seen = new Set();
  const goals = [];
  for (const goal of list) {
    if (
      !goal ||
      !findSkill(goal.key) ||
      seen.has(goal.key) ||
      !MASTERY_STATES.includes(goal.startState)
    )
      continue;
    seen.add(goal.key);
    goals.push({
      key: goal.key,
      setAt: Number(goal.setAt) || 0,
      startState: goal.startState,
      startScore: Math.max(0, Math.min(100, Number(goal.startScore) || 0)),
    });
  }
  return { goals: goals.slice(0, MAX_GOALS) };
}
export const maxGoals = () => MAX_GOALS;

export function addGoal(store, key, tutor, now = Date.now()) {
  const current = sanitizeGoals(store);
  if (
    !findSkill(key) ||
    current.goals.length >= MAX_GOALS ||
    current.goals.some((goal) => goal.key === key)
  )
    return current;
  const found = skillStates(tutor, now).get(key);
  return {
    goals: [
      ...current.goals,
      { key, setAt: now, startState: found?.state || "new", startScore: found?.score ?? 0 },
    ],
  };
}
export const removeGoal = (store, key) => ({
  goals: sanitizeGoals(store).goals.filter((goal) => goal.key !== key),
});

// A goal is reached when the skill is proficient or better on independent evidence; the page shows growth since it was set.
export function goalProgress(goals, states) {
  return sanitizeGoals(goals).goals.map((goal) => {
    const found = states.get(goal.key);
    const state = found?.state || "new";
    return {
      ...goal,
      state,
      score: found?.score ?? 0,
      met: rankOf(state) >= PROFICIENT,
      gained: Math.max(0, (found?.score ?? 0) - goal.startScore),
    };
  });
}

// ---- the one entry point ----------------------------------------------------------------------------------------------
// tutor = saved tutor record, progress = trail progress (loadTrail()), rewards = loadRewards(), log = teacher growth log.
// options: { api (growth-log.js exports), goals (sanitized goal store), now }.
export function earnedAchievements(tutor, progress, rewards, log, options = {}) {
  const now = options.now ?? Date.now();
  const api = options.api || null;
  const states = skillStates(tutor, now);
  const stateList = [...states.values()];
  const badges = [];

  for (const state of stateList)
    if (rankOf(state.state) >= PROFICIENT)
      badges.push({
        id: `mastery:${state.key}`,
        kind: "mastery",
        key: state.key,
        level: state.state === "mastered" ? 2 : 1,
        state: state.state,
        score: state.score,
      });

  const milestones = strandMilestones(states);
  for (const milestone of milestones) if (milestone.earned) badges.push(milestone);

  const proficientCount = stateList.filter((s) => rankOf(s.state) >= PROFICIENT).length;
  const exploredCount = stateList.filter(
    (s) => s.parts.count >= 3 && s.parts.independence > 0,
  ).length;
  const days = practiceDays(tutor, rewards);
  const independentDayCount = new Set(Object.values(tutor?.records || {}).flatMap(independentDays))
    .size;
  const run = runs(days, now);
  const best = Math.max(run.best, Number(rewards?.bestStreak) || 0);
  const corrected = correctedList(tutor, api);
  const retained = retainedList(log, tutor, states, api, now);
  const growth = growthEvents(tutor, states, log, api, now);

  const challenges = [
    {
      id: "proficient",
      value: proficientCount,
      tiers: tiers("proficient", proficientCount, CHALLENGES.proficient),
    },
    {
      id: "explored",
      value: exploredCount,
      tiers: tiers("explored", exploredCount, CHALLENGES.explored),
    },
    {
      id: "days",
      value: independentDayCount,
      tiers: tiers("days", independentDayCount, CHALLENGES.days),
    },
    { id: "rhythm", value: best, tiers: tiers("rhythm", best, CHALLENGES.rhythm) },
    {
      id: "corrected",
      value: corrected.length,
      tiers: tiers("corrected", corrected.length, CHALLENGES.corrected),
    },
    {
      id: "retained",
      value: retained.length,
      tiers: tiers("retained", retained.length, CHALLENGES.retained),
    },
  ];
  for (const challenge of challenges)
    for (const tier of challenge.tiers)
      if (tier.earned)
        badges.push({
          ...tier,
          id: `challenge:${tier.id}`,
          kind: "challenge",
          challenge: challenge.id,
        });

  for (const event of growth) badges.push({ id: `growth:${event.key}`, kind: "growth", ...event });
  for (const row of corrected)
    badges.push({
      id: `corrected:${row.key}:${row.category}`,
      kind: "corrected",
      key: row.key,
      category: row.category,
      resolvedAt: row.resolvedAt,
    });
  for (const row of retained)
    badges.push({
      id: `retained:${row.key}`,
      kind: "retained",
      key: row.key,
      daysHeld: row.daysHeld,
    });

  const goals = goalProgress(options.goals, states);
  for (const goal of goals)
    if (goal.met)
      badges.push({ id: `goal:${goal.key}`, kind: "goal", key: goal.key, gained: goal.gained });

  const stops = Object.values(progress?.stations || {}).filter(
    (entry) => (entry.stars || 0) >= 2,
  ).length;
  return {
    badges,
    milestones,
    challenges,
    goals,
    growth,
    corrected,
    retained,
    streak: {
      current: run.current,
      best,
      thisWeek: weekCount(days, now),
      practiceDays: days.size,
      weeklyGoal: Number(rewards?.goal) || 3,
    },
    summary: { skills: stateList.length, proficient: proficientCount, trailStops: stops },
  };
}

// Days practiced in the Monday-to-Sunday week that contains `now`.
export function weekCount(days, now = Date.now()) {
  const date = new Date(now);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const start = localDay(date.getTime());
  const today = localDay(now);
  return [...days].filter((day) => day >= start && day <= today).length;
}

// ---- earned stays earned ---------------------------------------------------------------------------------------------------
// Badges are recomputed from the evidence, and evidence can fade (a skill not visited for weeks scores lower). Recognition must
// not fade with it, so the page saves what was earned and merges it back: a badge or level, once earned, is kept.
export const EARNED_KEY = "ewl-fluency-achievements-v1";
const KINDS = new Set(["mastery", "strand", "challenge", "growth", "corrected", "retained", "goal"]);
const MAX_KEPT = 600;
const slim = (badge) => {
  const { skills, ...rest } = badge;
  return rest;
};
export function sanitizeEarned(value) {
  const badges = {};
  for (const [id, badge] of Object.entries(value?.badges || {}).slice(0, MAX_KEPT)) {
    if (!badge || badge.id !== id || !KINDS.has(badge.kind)) continue;
    if (badge.kind !== "strand" && badge.kind !== "challenge" && !findSkill(badge.key)) continue;
    badges[id] = slim(badge);
  }
  return { badges };
}
export function keepEarned(saved, data) {
  const badges = sanitizeEarned(saved).badges;
  for (const badge of data.badges) {
    const before = badges[badge.id];
    badges[badge.id] = before && (before.level ?? 0) > (badge.level ?? 0) ? before : slim(badge);
  }
  const store = { badges };
  const level = (id) => badges[id]?.level ?? 0;
  const milestones = data.milestones.map((milestone) => (level(milestone.id) > milestone.level ? { ...milestone, level: level(milestone.id), earned: true } : milestone));
  const challenges = data.challenges.map((challenge) => ({ ...challenge, tiers: challenge.tiers.map((tier) => (badges[`challenge:${tier.id}`] ? { ...tier, earned: true } : tier)) }));
  const kept = Object.values(badges).map((badge) => (badge.kind === "strand" ? (data.badges.find((entry) => entry.id === badge.id) ?? badge) : badge));
  return { data: { ...data, badges: kept, milestones, challenges }, store };
}

// ---- words for a recognition (the page and the certificate both read these) ------------------------------------------
export function achievementText(item) {
  const skill = item.key ? findSkill(item.key) : null;
  const name = skill?.title || "";
  switch (item.kind) {
    case "mastery":
      return {
        title: name,
        detail:
          item.level === 2
            ? t("Mastered: you solved these on your own, on different days.")
            : t("Proficient: you solved these on your own and kept getting them right."),
      };
    case "strand": {
      const title =
        item.level === 3
          ? t("{strand} complete", { strand: item.strand })
          : item.level === 2
            ? t("Halfway through {strand}", { strand: item.strand })
            : t("First step in {strand}", { strand: item.strand });
      return {
        title,
        detail: t("{n} of {total} skills at proficient or better", {
          n: item.proficient,
          total: item.total,
        }),
      };
    }
    case "challenge":
      return challengeText(item.challenge, item.at);
    case "growth":
      return {
        title: t("Real growth in {skill}", { skill: name }),
        detail: t("You moved from {from} to {to} on your own.", {
          from: stateLabel(item.from),
          to: stateLabel(item.to),
        }),
      };
    case "corrected":
      return {
        title: t("You fixed a tricky idea"),
        detail: `${name}: ${mistakeCategoryLabel(item.category)}`,
      };
    case "retained":
      return {
        title: t("Still remembered: {skill}", { skill: name }),
        detail: t("You still solve it on your own after {n} days.", { n: item.daysHeld }),
      };
    case "goal":
      return {
        title: t("Goal reached: {skill}", { skill: name }),
        detail: t("You chose this goal and you reached it."),
      };
    default:
      return { title: "", detail: "" };
  }
}

export function challengeText(id, at) {
  switch (id) {
    case "proficient":
      return {
        title: t("Skill collector"),
        detail: t("{n} skills at proficient or better", { n: at }),
      };
    case "explored":
      return {
        title: t("Wide explorer"),
        detail: t("{n} skills practiced on your own", { n: at }),
      };
    case "days":
      return {
        title: t("Steady learner"),
        detail: t("{n} days of practice on your own", { n: at }),
      };
    case "rhythm":
      return {
        title: t("Learning rhythm"),
        detail: t("{n} days in a row, at your pace", { n: at }),
      };
    case "corrected":
      return { title: t("Idea fixer"), detail: t("{n} tricky ideas corrected", { n: at }) };
    case "retained":
      return { title: t("Memory keeper"), detail: t("{n} skills remembered over time", { n: at }) };
    default:
      return { title: "", detail: "" };
  }
}

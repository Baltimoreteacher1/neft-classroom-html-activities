// Moby Progress Journey: the skill map as a model (nodes, regions, "You are here", next step), count-based mastery
// milestones, and celebrations that are only EARNED by authentic accomplishment. Pure: no DOM, no clock except `now`.
//
// Honesty: a node's learning state is always OBSERVED (counted from the learner's own answers through mastery-model.js).
// What the prerequisite graph suggests ("ready to start") is INFERRED and labelled as such; it never sets a state.
// Celebrations never pay for speed, streaks, volume or a single right answer.
import { t } from "../i18n.js";
import { MASTERY_STATES } from "../mastery-model.js";
import { ALL_SKILLS } from "../problem-bank.js";
import { continueTarget, recommend } from "../recommendation-engine.js";
import { layoutSkillMap } from "../skill-map.js";
import { RETAINED_MIN_DAYS, correctedMisconceptions, retainedSkills } from "../growth-log.js";
import { DAY, evidence, findSkill, prerequisiteGraph, skillKey } from "../tutor-engine.js";

export const JOURNEY_STATES = Object.freeze([
  "not-started",
  "learning",
  "developing",
  "proficient",
  "mastered",
  "due-for-review",
]);
const STRONG = new Set(["proficient", "mastered"]);
const RANK = (state) => Math.max(0, MASTERY_STATES.indexOf(state));
const RECENT_DAYS = 14;

export const journeyStateLabel = (status) =>
  ({
    "not-started": t("Not started"),
    learning: t("Learning"),
    developing: t("Developing"),
    proficient: t("Proficient"),
    mastered: t("Mastered"),
    "due-for-review": t("Due for review"),
  })[status] || t("Not started");

// ---- the map ---------------------------------------------------------------------------------------------------------
function nodeFor(tutor, placed, now) {
  const skill = placed.skill;
  const ev = evidence(tutor, skill, now);
  const attempted = ev.recent.length > 0;
  const status = !attempted
    ? "not-started"
    : ev.due && STRONG.has(ev.state)
      ? "due-for-review"
      : ev.state === "new"
        ? "learning"
        : ev.state;
  const parents = prerequisiteGraph[placed.key]?.prerequisiteSkills || [];
  const parentStates = parents.map((key) => evidence(tutor, findSkill(key), now).state);
  // Readiness is a suggestion from how skills connect, so it is labelled inferred and never changes `status`.
  const readiness = attempted
    ? null
    : parents.length === 0 || parentStates.every((state) => STRONG.has(state))
      ? "ready"
      : "build-first";
  return {
    key: placed.key,
    title: t(skill.title),
    strand: placed.strand,
    kind: placed.kind,
    column: placed.column,
    row: placed.row,
    x: placed.x,
    y: placed.y,
    grade: skill.grade,
    status,
    state: ev.state,
    score: ev.score,
    basis: attempted ? "observed" : "inferred",
    readiness,
    reviewDue: status === "due-for-review",
    lessonExplored: Boolean(tutor?.records?.[placed.key]?.lessonCompleted),
    counts: { independent: ev.independent, successes: ev.successes, checks: ev.recent.length },
    lastAt: Number.isFinite(ev.lastAt) ? ev.lastAt : null,
    prerequisites: parents,
  };
}

const tally = (nodes) => ({
  total: nodes.length,
  notStarted: nodes.filter((n) => n.status === "not-started").length,
  learning: nodes.filter((n) => n.status === "learning").length,
  developing: nodes.filter((n) => n.status === "developing").length,
  proficient: nodes.filter((n) => n.status === "proficient").length,
  mastered: nodes.filter((n) => n.status === "mastered").length,
  dueForReview: nodes.filter((n) => n.status === "due-for-review").length,
  strong: nodes.filter((n) => STRONG.has(n.state)).length,
});

// Three levels like the strand milestones in the achievements page: some, half or all skills proficient or better.
const regionLevel = (strong, total) =>
  strong === total && total ? 3 : strong * 2 >= total && strong > 0 ? 2 : strong > 0 ? 1 : 0;

// journeyMap(tutor, grade, now, ctx?) -> { grade, nodes, edges, regions, totals, here, next }
// ctx.sections lets a caller pass recommend() output it already has.
export function journeyMap(tutor, grade, now = Date.now(), ctx = {}) {
  const layout = layoutSkillMap(grade);
  const nodes = layout.nodes.map((placed) => nodeFor(tutor, placed, now));
  const own = nodes.filter((node) => node.kind === "grade");
  const regions = layout.lanes.map((lane) => {
    const members = own.filter((node) => node.strand === lane.strand);
    const counts = tally(members);
    return {
      strand: lane.strand,
      keys: members.map((node) => node.key),
      counts,
      level: regionLevel(counts.strong, counts.total),
      complete: counts.total > 0 && counts.strong === counts.total,
    };
  });

  // "You are here": where the learner has actually been working (observed). With no recent work, the first skill in
  // path order that the graph says is ready (inferred), or null when there is nothing left to start.
  const recent = own
    .filter(
      (node) => node.lastAt && now - node.lastAt <= RECENT_DAYS * DAY && node.status !== "mastered",
    )
    .sort((a, b) => b.lastAt - a.lastAt || a.column - b.column)[0];
  const starter = own.find((node) => node.status === "not-started" && node.readiness === "ready");
  const here = recent
    ? { key: recent.key, basis: "observed" }
    : starter
      ? { key: starter.key, basis: "inferred" }
      : null;

  const sections = ctx.sections || recommend(tutor, grade, now);
  const target = continueTarget(sections);
  const next = target
    ? {
        key: skillKey(target.skill),
        section: target.section,
        why: target.why,
        basis: target.evidence?.basis || "observed",
        action: target.action,
      }
    : null;
  for (const node of nodes) {
    node.isHere = node.key === here?.key;
    node.isNext = node.key === next?.key;
  }
  return { grade, nodes, edges: layout.edges, regions, totals: tally(own), here, next };
}

// ---- milestones ------------------------------------------------------------------------------------------------------
export const MILESTONE_TIERS = Object.freeze({
  mastered: [1, 3, 5, 10],
  proficient: [3, 6, 10],
  repaired: [1, 3, 5],
  retained: [1, 3],
  explained: [1, 5, 10],
  quests: [1, 5, 15],
});

const TIER_TITLES = {
  mastered: (n) => (n === 1 ? t("Your first skill mastered") : t("{n} skills mastered", { n })),
  proficient: (n) => t("{n} skills proficient or better", { n }),
  repaired: (n) => (n === 1 ? t("Your first mistake repaired") : t("{n} mistakes repaired", { n })),
  retained: (n) =>
    n === 1
      ? t("A skill you still remember after {d} days", { d: RETAINED_MIN_DAYS })
      : t("{n} skills you still remember after {d} days", { n, d: RETAINED_MIN_DAYS }),
  explained: (n) => (n === 1 ? t("Your first answer explained in your own words") : t("{n} answers explained", { n })),
  quests: (n) => (n === 1 ? t("Your first quest complete") : t("{n} quests complete", { n })),
};

// The display title for a count-based milestone id such as "mastered:3" ("" for an id this module does not make).
export function milestoneTitle(id) {
  const [kind, at] = String(id).split(":");
  return TIER_TITLES[kind] && MILESTONE_TIERS[kind]?.includes(Number(at)) ? TIER_TITLES[kind](Number(at)) : "";
}

const tierRows = (kind, have, thresholds) =>
  thresholds.map((at, index) => ({
    id: `${kind}:${at}`,
    kind,
    at,
    have: Math.min(have, at),
    earned: have >= at,
    next: have < at && (index === 0 || have >= thresholds[index - 1]),
    title: TIER_TITLES[kind](at),
  }));

// Count-based milestones, all derived from real saved evidence.
// milestones(tutor, grade, now, extra?) where extra = { stats (questStats()), log (growth log) } is optional; a milestone
// whose evidence the caller did not supply is simply left out rather than shown as zero.
export function milestones(tutor, grade, now = Date.now(), extra = {}) {
  const states = new Map();
  for (const [key] of Object.entries(tutor?.records || {})) {
    const skill = findSkill(key);
    if (skill) states.set(key, evidence(tutor, skill, now).state);
  }
  const all = [...states.values()];
  const mastered = all.filter((state) => state === "mastered").length;
  const strong = all.filter((state) => STRONG.has(state)).length;
  const rows = [
    ...tierRows("mastered", mastered, MILESTONE_TIERS.mastered),
    ...tierRows("proficient", strong, MILESTONE_TIERS.proficient),
    ...tierRows("repaired", correctedMisconceptions(tutor).length, MILESTONE_TIERS.repaired),
  ];
  const own = ALL_SKILLS.filter((skill) => skill.grade === grade);
  const ownStrong = own.filter((skill) => STRONG.has(states.get(skillKey(skill)))).length;
  for (const strand of [...new Set(own.map((skill) => skill.strand))]) {
    const group = own.filter((skill) => skill.strand === strand);
    const have = group.filter((skill) => STRONG.has(states.get(skillKey(skill)))).length;
    rows.push({
      id: `strand:${grade}:${strand}`,
      kind: "strand",
      at: group.length,
      have,
      earned: have === group.length,
      next: have > 0 && have < group.length,
      title: t("Finished {strand}", { strand: t(strand) }),
    });
  }
  if (own.length) {
    const half = Math.ceil(own.length / 2);
    rows.push({
      id: `grade:${grade}:half`,
      kind: "grade",
      at: half,
      have: Math.min(ownStrong, half),
      earned: ownStrong >= half,
      next: ownStrong < half,
      title: t("Half of Grade {grade} proficient", { grade }),
    });
    rows.push({
      id: `grade:${grade}:all`,
      kind: "grade",
      at: own.length,
      have: ownStrong,
      earned: ownStrong === own.length,
      next: ownStrong >= half && ownStrong < own.length,
      title: t("All of Grade {grade} proficient", { grade }),
    });
  }
  if (extra.log) rows.push(...tierRows("retained", retainedSkills(extra.log, tutor, now).length, MILESTONE_TIERS.retained));
  if (extra.stats) {
    rows.push(...tierRows("explained", extra.stats.explains || 0, MILESTONE_TIERS.explained));
    rows.push(...tierRows("quests", extra.stats.questsDone || 0, MILESTONE_TIERS.quests));
  }
  return rows;
}

export const earnedMilestoneIds = (rows) => rows.filter((row) => row.earned).map((row) => row.id);

// ---- celebrations ----------------------------------------------------------------------------------------------------
const titleOf = (key) => (findSkill(key) ? t(findSkill(key).title) : "");
const celebrate = (kind, size, message, extra = {}) => ({
  earned: true,
  kind,
  size,
  message,
  ...extra,
});

// celebrationFor(event) -> a celebration object, or null when nothing authentic happened.
// Earned events: skill-state (to mastered / proficient from a lower state), gap-repaired (only with reassessPassed),
// retention (a held skill confirmed after RETAINED_MIN_DAYS), quest-complete, milestone. An event the guard refused
// ({ credited: false }), and anything else (one right answer, speed, streaks, coins, time spent), returns null.
export function celebrationFor(event) {
  if (!event || typeof event !== "object" || event.credited === false) return null;
  const skill = typeof event.skillKey === "string" ? titleOf(event.skillKey) : "";
  const known = typeof event.skillKey === "string" && Boolean(findSkill(event.skillKey));
  switch (event.type) {
    case "skill-state": {
      if (
        !known ||
        !MASTERY_STATES.includes(event.to) ||
        !MASTERY_STATES.includes(event.from) ||
        RANK(event.to) <= RANK(event.from)
      )
        return null;
      if (event.to === "mastered")
        return celebrate(
          "mastery",
          "big",
          t("You mastered {skill}! Your own answers, spread over different days, showed it.", {
            skill,
          }),
          { skillKey: event.skillKey },
        );
      if (event.to === "proficient")
        return celebrate(
          "proficient",
          "medium",
          t("You reached Proficient in {skill}. Keep going toward mastery.", { skill }),
          { skillKey: event.skillKey },
        );
      return null;
    }
    case "gap-repaired":
      return known && event.reassessPassed === true
        ? celebrate(
            "repair",
            "medium",
            t("You fixed it. {skill} is stronger because you went back and corrected it.", {
              skill,
            }),
            { skillKey: event.skillKey },
          )
        : null;
    case "retention": {
      const days = Math.floor(Number(event.daysHeld));
      return known && event.confirmed === true && days >= RETAINED_MIN_DAYS
        ? celebrate(
            "retention",
            "big",
            t("You still remember {skill} after {n} days. That is real, lasting learning.", {
              skill,
              n: days,
            }),
            { skillKey: event.skillKey },
          )
        : null;
    }
    case "quest-complete":
      return event.completed === true && typeof event.title === "string" && event.title
        ? celebrate(
            "quest",
            "small",
            t("Quest complete: {title}.", { title: event.title.slice(0, 60) }),
          )
        : null;
    case "milestone":
      return event.earned === true && typeof event.title === "string" && event.title
        ? celebrate(
            "milestone",
            "medium",
            t("Milestone: {title}.", { title: event.title.slice(0, 80) }),
          )
        : null;
    default:
      return null;
  }
}

// ---- turning saved evidence into events ----------------------------------------------------------------------------
// snapshotJourney(tutor, now) before a study session, journeyEvents(before, tutor, now) after it: the events to hand to
// celebrationFor. Everything is read from the saved record, so nothing can be celebrated that the record does not show.
export function snapshotJourney(tutor, now = Date.now()) {
  const states = {};
  for (const key of Object.keys(tutor?.records || {})) {
    const skill = findSkill(key);
    if (skill) states[key] = evidence(tutor, skill, now).state;
  }
  return {
    states,
    repaired: (tutor?.mistakes || [])
      .filter((entry) => entry.resolvedAt)
      .map((entry) => String(entry.id)),
  };
}

export function journeyEvents(before, tutor, now = Date.now()) {
  const after = snapshotJourney(tutor, now);
  const events = [];
  for (const [key, to] of Object.entries(after.states)) {
    const from = before?.states?.[key] || "new";
    if (RANK(to) > RANK(from)) events.push({ type: "skill-state", skillKey: key, from, to });
  }
  const seen = new Set(before?.repaired || []);
  for (const mistake of tutor?.mistakes || []) {
    if (!mistake.resolvedAt || seen.has(String(mistake.id))) continue;
    // Authentic only when the skill was then answered correctly on its own after the repair.
    const reassessPassed = (tutor.records?.[mistake.key]?.recent || []).some(
      (entry) => entry.independent && entry.correct && entry.at >= mistake.resolvedAt,
    );
    events.push({ type: "gap-repaired", skillKey: mistake.key, reassessPassed });
  }
  return events;
}

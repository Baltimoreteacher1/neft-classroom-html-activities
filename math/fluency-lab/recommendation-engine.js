// Recommendation engine for the Fluency Lab 4.0 dashboard. Pure functions over the tutor record: no DOM, no clock
// except the `now` argument, no randomness, so the same learner on the same day always gets the same plan.
//
// recommend(tutor, grade, now) returns six sections (Learn Next, Fix a Gap, Keep Practicing, Review, Challenge,
// Ready to Master). A skill is the primary subject of at most one section. Every entry is
//   { skill, why, evidence: { counts, dates, basis, state, ... }, action }
// where `why` is a plain-language sentence built only from numbers in `evidence`. `basis` says whether the advice
// rests on the learner's own answers ("observed"), on how skills connect ("inferred"), or both ("mixed").
import { masteryParts } from "./mastery-model.js";
import { ALL_SKILLS } from "./problem-bank.js";
import { t } from "./i18n.js";
import { DAY, evidence, prerequisiteGraph, prerequisites, skillKey } from "./tutor-engine.js";
import { mistakeCategoryLabel } from "./mistake-notes.js";

// The mastery rule from mastery-model.js masteryState(), restated so a sentence can say what is still missing.
// tools/fluency-recommendations.test.mjs proves these values against the model itself.
export const MASTERY_RULE = Object.freeze({ score: 90, checks: 8, days: 2, proficient: 70 });
export const SECTION_IDS = Object.freeze([
  "learnNext",
  "fixAGap",
  "keepPracticing",
  "review",
  "challenge",
  "readyToMaster",
]);
// What "Continue learning" opens first when nothing is saved: finish gaps and refreshes, then new ideas.
export const CONTINUE_ORDER = Object.freeze([
  "fixAGap",
  "review",
  "keepPracticing",
  "readyToMaster",
  "learnNext",
  "challenge",
]);
const CAPS = {
  learnNext: 3,
  fixAGap: 3,
  keepPracticing: 3,
  review: 3,
  challenge: 2,
  readyToMaster: 3,
};
const LOW_ACCURACY = 0.6;

export const sectionTitle = (id) =>
  ({
    learnNext: t("Learn Next"),
    fixAGap: t("Fix a Gap"),
    keepPracticing: t("Keep Practicing"),
    review: t("Review"),
    challenge: t("Challenge"),
    readyToMaster: t("Ready to Master"),
  })[id];

export const sectionBlurb = (id) =>
  ({
    learnNext: t("New ideas that fit what you already know."),
    fixAGap: t("Skills where your own answers say another look will help."),
    keepPracticing: t("Skills you are building. A few more tries will help."),
    review: t("Skills due for a quick refresh so they stay strong."),
    challenge: t("Stretch yourself once a skill feels solid."),
    readyToMaster: t("Skills that are close to mastered."),
  })[id];

export const weekdayName = (index) =>
  [
    t("Sunday"),
    t("Monday"),
    t("Tuesday"),
    t("Wednesday"),
    t("Thursday"),
    t("Friday"),
    t("Saturday"),
  ][index];
const startOfDay = (time) => {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY);

// "today", "yesterday", "on Tuesday" (within the last six days) or "12 days ago".
export function whenText(time, now) {
  const days = daysBetween(time, now);
  if (days <= 0) return t("today");
  if (days === 1) return t("yesterday");
  if (days <= 6) return t("on {day}", { day: weekdayName(new Date(time).getDay()) });
  return t("{n} days ago", { n: days });
}

const listJoin = (parts) =>
  parts.length === 1
    ? parts[0]
    : parts.length === 2
      ? t("{a} and {b}", { a: parts[0], b: parts[1] })
      : t("{a}, {b}, and {c}", { a: parts[0], b: parts[1], c: parts[2] });
const sentence = (...parts) => parts.filter(Boolean).join(" ");

// Everything the dashboard may say about one skill, recounted from the stored answers.
export function skillSignals(tutor, skill, now = Date.now()) {
  const key = skillKey(skill);
  const ev = evidence(tutor, skill, now);
  const record = tutor.records[key] || {};
  const recent = ev.recent;
  const solid = recent.filter((entry) => entry.independent && entry.level >= 1);
  const wins = solid.filter((entry) => entry.correct);
  const parts = masteryParts(record, now);
  const open = (tutor.mistakes || []).filter((entry) => entry.key === key && !entry.resolvedAt);
  const byCategory = new Map();
  for (const entry of open)
    if (entry.category) byCategory.set(entry.category, (byCategory.get(entry.category) || 0) + 1);
  const [slipId, slipCount] =
    [...byCategory.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || [];
  const practiced = solid.length >= 3 && ev.ratio >= 0.75;
  const checkupMiss = tutor.diagnostics?.[skill.grade]?.results?.[key] === false && !practiced;
  return {
    skill,
    key,
    state: ev.state,
    score: ev.score,
    secure: ev.secure,
    due: ev.due,
    lessonCompleted: Boolean(record.lessonCompleted),
    attempted: recent.length > 0,
    ratio: ev.ratio,
    checkupMiss,
    counts: {
      independent: solid.length,
      successes: wins.length,
      supported: recent.filter((entry) => !entry.independent).length,
      checks: parts.count,
      days: parts.days,
      score: ev.score,
      openMistakes: open.length,
    },
    dates: {
      lastSuccess: wins.length ? Math.max(...wins.map((entry) => entry.at)) : null,
      lastPractice: Number.isFinite(record.lastAt)
        ? record.lastAt
        : recent.length
          ? Math.max(...recent.map((entry) => entry.at))
          : null,
      due: Number.isFinite(record.dueAt) ? record.dueAt : null,
    },
    slip: slipId ? { id: slipId, label: mistakeCategoryLabel(slipId), count: slipCount } : null,
    stretchTried: solid.some((entry) => entry.level === 2 && entry.correct),
  };
}

const entryOf = (signal, why, action, basis, extra = {}) => ({
  skill: signal.skill,
  why,
  evidence: { counts: signal.counts, dates: signal.dates, basis, state: signal.state, ...extra },
  action: { kind: "open", key: signal.key, ...action },
});
const solvedLine = (c) =>
  c.independent
    ? t("You solved {s} of {n} on your own.", { s: c.successes, n: c.independent })
    : "";
const solvedWhen = (signal, now) => {
  const c = signal.counts;
  if (!c.independent) return "";
  return signal.dates.lastSuccess
    ? t("You solved {s} of {n} on your own, last {when}.", {
        s: c.successes,
        n: c.independent,
        when: whenText(signal.dates.lastSuccess, now),
      })
    : solvedLine(c);
};

// The first prerequisite the learner has not shown yet: a probable cause of a gap, offered as a guess.
const weakPrerequisite = (tutor, skill, now) =>
  prerequisites(skill)
    .map((p) => skillSignals(tutor, p, now))
    .find((s) => s.state === "new" || s.state === "learning") || null;

function gapEntry(tutor, signal, now) {
  const c = signal.counts;
  let why;
  if (c.openMistakes) {
    why = sentence(
      c.openMistakes === 1
        ? t("One mistake is still open in your notebook.")
        : t("{m} mistakes are still open in your notebook.", { m: c.openMistakes }),
      solvedWhen(signal, now),
      signal.slip ? t("The slip I see most: {label}.", { label: signal.slip.label }) : "",
    );
  } else if (c.independent >= 3 && signal.ratio < LOW_ACCURACY) {
    why = sentence(solvedWhen(signal, now), t("This idea needs another look."));
  } else {
    why = t("In your starting-point check, this one was worth another look.");
  }
  const weak = weakPrerequisite(tutor, signal.skill, now);
  let basis = "observed";
  let extra = { slip: signal.slip };
  let alt = null;
  if (weak) {
    basis = "mixed";
    const pc = weak.counts;
    why = sentence(
      why,
      pc.independent
        ? t(
            "It builds on {prereq}, where you solved {ps} of {pn} on your own, so a warm-up there may help. This part is a guess from how skills connect.",
            { prereq: t(weak.skill.title), ps: pc.successes, pn: pc.independent },
          )
        : t(
            "It builds on {prereq}, which you have not tried on your own yet, so a warm-up there may help. This part is a guess from how skills connect.",
            { prereq: t(weak.skill.title) },
          ),
    );
    extra = { ...extra, prerequisite: { key: weak.key, counts: weak.counts, state: weak.state } };
    alt = {
      kind: "open",
      key: weak.key,
      mode: "visual",
      label: t("Warm up with {prereq}", { prereq: t(weak.skill.title) }),
    };
  }
  const entry = entryOf(
    signal,
    why,
    { mode: "guided", label: t("Fix it with steps") },
    basis,
    extra,
  );
  return alt ? { ...entry, alt } : entry;
}

function reviewEntry(signal, now) {
  const overdue = signal.dates.due == null ? 0 : daysBetween(signal.dates.due, now);
  const due =
    overdue <= 0
      ? t("Your review is due today.")
      : overdue === 1
        ? t("Your review was due yesterday.")
        : t("Your review was due {n} days ago.", { n: overdue });
  const last = signal.dates.lastSuccess
    ? t("You last solved this on your own {when}.", {
        when: whenText(signal.dates.lastSuccess, now),
      })
    : solvedLine(signal.counts);
  return entryOf(
    signal,
    sentence(last, due, t("A quick refresh keeps it strong.")),
    { mode: "adaptive", label: t("Quick refresh") },
    "observed",
  );
}

function masteryNeeds(signal) {
  const { checks, days, score } = signal.counts;
  const parts = [];
  const moreChecks = Math.max(0, MASTERY_RULE.checks - checks);
  const moreDays = Math.max(0, MASTERY_RULE.days - days);
  if (moreChecks)
    parts.push(moreChecks === 1 ? t("1 more check") : t("{n} more checks", { n: moreChecks }));
  if (moreDays)
    parts.push(
      moreDays === 1 ? t("1 more day of success") : t("{n} more days of success", { n: moreDays }),
    );
  const lead =
    score >= MASTERY_RULE.score
      ? t("Your mastery score is {score} out of 100, which is high enough.", { score })
      : t("Your mastery score is {score} out of 100, and mastery starts at {target}.", {
          score,
          target: MASTERY_RULE.score,
        });
  return sentence(
    lead,
    parts.length
      ? t("Mastery also needs {list}.", { list: listJoin(parts) })
      : t("Keep solving on your own to raise it."),
  );
}

function keepEntry(signal, now) {
  const c = signal.counts;
  let why;
  if (c.independent && c.successes)
    why = sentence(solvedWhen(signal, now), t("A few more tries on a new day will build it up."));
  else if (c.independent)
    why = t(
      "You have tried {n} on your own and have not solved one yet. Try again with a model or steps first.",
      { n: c.independent },
    );
  else
    why =
      c.supported === 1
        ? t("You have worked on this once with help. Next, try some on your own.")
        : t("You have worked on this with help {c} times. Next, try some on your own.", {
            c: c.supported,
          });
  return entryOf(
    signal,
    why,
    { mode: "adaptive", label: c.independent ? t("Keep practicing") : t("Try it on your own") },
    "observed",
  );
}

function learnEntry(tutor, signal, now) {
  if (signal.lessonCompleted)
    return entryOf(
      signal,
      t("You explored the picture lesson, but have not tried any problems on your own yet."),
      { mode: "adaptive", label: t("Practice on your own") },
      "observed",
    );
  const prereq = prerequisites(signal.skill)
    .map((p) => skillSignals(tutor, p, now))
    .find((s) => s.attempted);
  let why = t(
    "New for you in Grade {grade}. Start with the picture lesson, then try some on your own.",
    { grade: signal.skill.grade },
  );
  let basis = "observed";
  if (prereq && (prereq.state === "proficient" || prereq.state === "mastered")) {
    why = t(
      "New for you. It builds on {prereq}, and your mastery score there is {score} out of 100.",
      { prereq: t(prereq.skill.title), score: prereq.counts.score },
    );
    basis = "inferred";
  } else if (prereq && prereq.counts.independent) {
    why = t(
      "New for you. It builds on {prereq}, where you solved {ps} of {pn} on your own, so a quick look there first may help. This part is a guess from how skills connect.",
      { prereq: t(prereq.skill.title), ps: prereq.counts.successes, pn: prereq.counts.independent },
    );
    basis = "inferred";
  }
  return entryOf(signal, why, { mode: "visual", label: t("See the idea first") }, basis);
}

function stretchEntry(signal, now) {
  const c = signal.counts;
  return entryOf(
    signal,
    sentence(
      solvedWhen(signal, now),
      t(
        "Your mastery score is {score} out of 100. You have not solved a stretch-level problem yet, so this is a chance to go further.",
        { score: c.score },
      ),
    ),
    { mode: "adaptive", label: t("Try the stretch") },
    "observed",
  );
}

function nextGradeEntry(signal, mastered) {
  const why = t(
    "You have mastered {prereq}, and this next-grade skill builds on it. This part is a guess from how skills connect.",
    { prereq: t(mastered.skill.title) },
  );
  return entryOf(signal, why, { mode: "visual", label: t("See the idea first") }, "inferred", {
    prerequisite: { key: mastered.key, counts: mastered.counts, state: mastered.state },
  });
}

const take = (list, id, claimed, build) => {
  const out = [];
  for (const item of list) {
    if (out.length >= CAPS[id]) break;
    if (claimed.has(item.key)) continue;
    claimed.add(item.key);
    out.push(build(item));
  }
  return out;
};
export const gradeSkills = (grade) => ALL_SKILLS.filter((skill) => skill.grade === grade);
const byOrder = (a, b) => a.index - b.index;

export function recommend(tutor, grade, now = Date.now()) {
  const signals = gradeSkills(grade).map((skill, index) => ({
    ...skillSignals(tutor, skill, now),
    index,
  }));
  const claimed = new Set();
  const sections = {};

  const gaps = signals
    .filter(
      (s) =>
        s.counts.openMistakes ||
        (s.counts.independent >= 3 && s.ratio < LOW_ACCURACY) ||
        (s.checkupMiss && !s.counts.independent),
    )
    .sort(
      (a, b) =>
        b.counts.openMistakes * 5 +
          (b.checkupMiss ? 3 : 0) +
          (b.counts.independent >= 3 ? 10 * (LOW_ACCURACY - b.ratio) : 0) -
          (a.counts.openMistakes * 5 +
            (a.checkupMiss ? 3 : 0) +
            (a.counts.independent >= 3 ? 10 * (LOW_ACCURACY - a.ratio) : 0)) || byOrder(a, b),
    );
  sections.fixAGap = take(gaps, "fixAGap", claimed, (s) => gapEntry(tutor, s, now));

  const reviews = signals
    .filter((s) => s.attempted && s.due)
    .sort((a, b) => a.dates.due - b.dates.due || byOrder(a, b));
  sections.review = take(reviews, "review", claimed, (s) => reviewEntry(s, now));

  const ready = signals
    .filter((s) => s.state === "proficient")
    .sort((a, b) => b.counts.score - a.counts.score || byOrder(a, b));
  sections.readyToMaster = take(ready, "readyToMaster", claimed, (s) => {
    const base = solvedWhen(s, now);
    return entryOf(
      s,
      sentence(base, masteryNeeds(s)),
      { mode: "adaptive", label: t("Go for mastery") },
      "observed",
    );
  });

  const keeping = signals
    .filter((s) => s.attempted && (s.state === "learning" || s.state === "developing"))
    .sort((a, b) => (b.dates.lastPractice || 0) - (a.dates.lastPractice || 0) || byOrder(a, b));
  sections.keepPracticing = take(keeping, "keepPracticing", claimed, (s) => keepEntry(s, now));

  // Challenge: a mastered skill with no stretch success yet, then next-grade skills that build on a mastered one.
  const stretch = signals
    .filter((s) => s.state === "mastered" && !s.stretchTried)
    .sort((a, b) => b.counts.score - a.counts.score || byOrder(a, b));
  const challenge = take(stretch, "challenge", claimed, (s) => stretchEntry(s, now));
  if (challenge.length < CAPS.challenge && grade < 8) {
    const masteredKeys = new Set(signals.filter((s) => s.state === "mastered").map((s) => s.key));
    const ups = ALL_SKILLS.filter((s) => s.grade === grade + 1 && !claimed.has(skillKey(s)))
      .map((s, index) => ({
        s,
        index,
        via: (prerequisiteGraph[skillKey(s)]?.prerequisiteSkills || []).find((key) =>
          masteredKeys.has(key),
        ),
      }))
      .filter((c) => c.via && !tutor.records[skillKey(c.s)]?.recent?.length);
    for (const c of ups) {
      if (challenge.length >= CAPS.challenge) break;
      claimed.add(skillKey(c.s));
      challenge.push(
        nextGradeEntry(
          { ...skillSignals(tutor, c.s, now) },
          signals.find((s) => s.key === c.via),
        ),
      );
    }
  }
  sections.challenge = challenge;

  const rank = (s) => {
    const first = prerequisites(s.skill)
      .map((p) => skillSignals(tutor, p, now))
      .find((p) => p.attempted);
    return first ? (first.state === "proficient" || first.state === "mastered" ? 0 : 2) : 1;
  };
  const fresh = signals
    .filter((s) => !s.attempted)
    .map((s) => ({ ...s, tier: s.lessonCompleted ? -1 : rank(s) }))
    .sort((a, b) => a.tier - b.tier || byOrder(a, b));
  sections.learnNext = take(fresh, "learnNext", claimed, (s) => learnEntry(tutor, s, now));

  return SECTION_IDS.map((id) => ({
    id,
    title: sectionTitle(id),
    blurb: sectionBlurb(id),
    items: sections[id],
  }));
}

// The single best next step for "Continue learning", following CONTINUE_ORDER.
export function continueTarget(sections) {
  for (const id of CONTINUE_ORDER) {
    const item = sections.find((section) => section.id === id)?.items[0];
    if (item) return { section: id, ...item };
  }
  return null;
}

// Skills with something recorded whose review date has passed, most overdue first.
export function dueSkills(tutor, grade, now = Date.now()) {
  return gradeSkills(grade)
    .map((skill) => skillSignals(tutor, skill, now))
    .filter((s) => s.attempted && s.due)
    .sort((a, b) => a.dates.due - b.dates.due);
}

// Reviews coming up soon (not yet due), soonest first, so the dashboard can remind without nagging.
export function upcomingReviews(tutor, grade, now = Date.now(), withinDays = 3) {
  return gradeSkills(grade)
    .map((skill) => skillSignals(tutor, skill, now))
    .filter(
      (s) => s.attempted && !s.due && s.dates.due != null && s.dates.due - now <= withinDays * DAY,
    )
    .sort((a, b) => a.dates.due - b.dates.due)
    .map((s) => ({
      skill: s.skill,
      dueAt: s.dates.due,
      days: Math.max(0, daysBetween(now, s.dates.due)),
    }));
}

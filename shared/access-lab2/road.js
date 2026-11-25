// Road to ACCESS 2.0: a 12-week practice plan built from a skill profile and a calendar.
//
// Week 1-5 and 7-10 build skills (daily 10-20 minute sessions with built-in retrieval of earlier work), week 6 holds a
// mini practice test, week 11 a final practice set (one domain per day) and week 12 is test-readiness. Sessions are
// planning guidance; nothing is timed. generateRoad is the only generator: pass `completed` dates and `today` and it
// refreshes a plan the student has drifted from, in kind wording, keeping every teacher pin. A "pin" puts a chosen
// activity into a slot (pinning over a generated activity is how a teacher swaps it).
import { allStrings, assertAlias, DOMAINS, isObj, isStr, KLUS, TASK_TYPES } from "./constants.js";
import { DISCLAIMER, DISCLAIMER_ES, disclaimerOk, withDisclaimer } from "./disclaimer.js";
import { domainPriority, KLU_FRIENDLY } from "./profile.js";
import { READINESS_CHECKLIST, READINESS_IDS } from "./readiness.js";
import { ES_STATUS, FAMILY_TEXT, MILESTONES, REFRESH_NOTE, THEMES, TIPS } from "./road-strings.js";
import { findBanned } from "./wording.js";

export const WEEKS = 12;
export const MINI_TEST_WEEK = 6;
export const FINAL_WEEK = 11;
export const READINESS_WEEK = 12;
export const MIN_DAY_MINUTES = 10;
export const MAX_DAY_MINUTES = 20;
const BEHIND_MIN_DAYS = 3;
const BEHIND_SHARE = 0.3;
const PROTECTED = ["mini-test", "final-set"]; // slot types a pin may not replace
const FOCUS_ROTATION = [
  [0, 1],
  [0, 2],
  [1, 3],
  [0, 3],
]; // indexes into the weakest-first domain list
const DAY_MS = 86400000;

// ---- calendar (pure date strings, UTC) ----
const toMs = (d) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`date must be YYYY-MM-DD: ${d}`);
  return Date.parse(`${d}T00:00:00Z`);
};
const fromMs = (ms) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d, n) => fromMs(toMs(d) + n * DAY_MS);
const weekday = (d) => new Date(toMs(d)).getUTCDay();

function weekDates(startDate, n, daysOfWeek, breaks) {
  const first = addDays(startDate, 7 * (n - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(first, i)).filter(
    (d) => daysOfWeek.includes(weekday(d)) && !breaks.includes(d),
  );
}

// ---- activities and slots ----
const slot = (i, type, activity, minutes) => ({ slot: i, type, minutes, activity, pinned: false });
const reflect = (minutes) => ({
  id: "reflect.daily",
  title: "Reflect: what went well today, and what do I want to try next?",
  minutes,
});

function learn(domain, klu, band, pick, gradeBand) {
  const types = Object.keys(TASK_TYPES[domain]);
  const taskType = types[pick % types.length];
  return {
    id: `${domain.toLowerCase()}.${taskType}.${klu.toLowerCase()}`,
    domain,
    taskType,
    klu,
    minutes: 8,
    title: `${domain}: ${taskType.replaceAll("-", " ")} (${KLU_FRIENDLY[klu]})`,
    itemQuery: { domain, gradeBand, klu, band },
  };
}

/** Pads a day with reflection time so it lands inside 10-20 minutes. */
function dayOf(date, dayIndex, slots) {
  const used = slots.reduce((s, x) => s + x.minutes, 0);
  const r = slots.find((x) => x.type === "reflect");
  if (r && used < MIN_DAY_MINUTES) {
    r.minutes += MIN_DAY_MINUTES - used;
    r.activity = { ...r.activity, minutes: r.minutes };
  }
  return {
    date,
    dayIndex,
    state: "upcoming",
    minutes: slots.reduce((s, x) => s + x.minutes, 0),
    slots,
  };
}

const retrievalSlot = (history, week, d) => {
  const from = week > 3 && d % 2 === 1 ? week - 3 : week - 1;
  const pool = history.filter((h) => h.week === from);
  const src = pool.length ? pool[d % pool.length] : null;
  const activity = src
    ? {
        ...src.activity,
        minutes: 5,
        title: `Review: ${src.activity.title}`,
        retrievalOf: { week: src.week, dayIndex: src.dayIndex },
      }
    : {
        id: "recap.strengths",
        title: "Review: look at the strengths from your first check-in",
        minutes: 5,
      };
  return slot(1, "retrieval", activity, 5);
};

function buildWeek({ theme, dates, priority, profile, gradeBand, history, buildIndex }) {
  const n = theme.n;
  const rot = FOCUS_ROTATION[buildIndex % FOCUS_ROTATION.length];
  const focus = [priority[rot[0]], priority[rot[1]]];
  const normal = (date, d) => {
    const domain = focus[d % 2];
    const klu = theme.klu ?? KLUS[(d + n) % KLUS.length];
    const band = profile.domains[domain].band ?? "building";
    const activity = learn(domain, klu, band, n + d, gradeBand);
    history.push({ week: n, dayIndex: d, activity });
    return dayOf(date, d, [
      slot(0, "new", activity, 8),
      retrievalSlot(history, n, d),
      slot(2, "reflect", reflect(2), 2),
    ]);
  };
  const days = dates.map(normal);
  if (theme.type === "mini-test" && days.length) {
    const last = days.length - 1;
    const test = {
      id: "test.mini",
      title: "Mini practice test, 10 items, no timer",
      minutes: 15,
      build: { length: "mini", gradeBand },
    };
    days[last] = dayOf(dates[last], last, [
      slot(0, "mini-test", test, 15),
      slot(1, "reflect", reflect(5), 5),
    ]);
  } else if (theme.type === "final-practice" && days.length) {
    const k = Math.min(4, days.length);
    const groups = Array.from({ length: k }, () => []);
    DOMAINS.forEach((d, i) =>
      groups[Math.min(k - 1, Math.floor((i * k) / DOMAINS.length))].push(d),
    );
    groups.forEach((domains, g) => {
      const idx = days.length - k + g;
      const set = {
        id: `test.final.${domains.join("+").toLowerCase()}`,
        title: `Final practice set: ${domains.join(" and ")}, no timer`,
        minutes: 15,
        build: { length: "standard", gradeBand, domains },
      };
      days[idx] = dayOf(dates[idx], idx, [
        slot(0, "final-set", set, 15),
        slot(1, "reflect", reflect(5), 5),
      ]);
    });
  } else if (theme.type === "readiness" && days.length) {
    const cap = days.length >= 4 ? 13 : 18; // leaves room for retrieval (5) and reflection (2) inside 20
    const per = days.map(() => []);
    let d = 0;
    for (const r of READINESS_CHECKLIST) {
      const used = per[d].reduce((s, x) => s + x.minutes, 0);
      if (used + r.minutes > cap && d < days.length - 1) d += 1;
      per[d].push(r);
    }
    per.forEach((rs, i) => {
      const slots = rs.map((r, j) =>
        slot(
          j,
          "readiness",
          { id: r.id, title: r.title, minutes: r.minutes, steps: r.steps },
          r.minutes,
        ),
      );
      if (!slots.length)
        slots.push(
          slot(
            0,
            "readiness",
            { id: "calming-routine", title: "My calming routine", minutes: 3 },
            3,
          ),
        );
      if (days.length >= 4)
        slots.push(
          slot(
            slots.length,
            "retrieval",
            { id: "recap.practice", title: "Review: one thing I practiced this week", minutes: 5 },
            5,
          ),
        );
      slots.push(slot(slots.length, "reflect", reflect(2), 2));
      days[i] = dayOf(dates[i], i, slots);
    });
  }
  return {
    n,
    type: theme.type,
    theme: { en: theme.en, es: theme.es },
    focusDomains: theme.type === "build" ? focus : [],
    days,
  };
}

// ---- pins ----
const COORDS = ["week", "dayIndex", "slot"];
const validActivity = (a) =>
  isObj(a) &&
  isStr(a.id) &&
  isStr(a.title) &&
  Number.isInteger(a.minutes) &&
  a.minutes >= 3 &&
  a.minutes <= MAX_DAY_MINUTES;

/** Returns a new pins list with `pin` added (replacing any pin on the same slot). pin: { week, dayIndex, slot, activity }. */
export function addPin(pins, pin) {
  if (!COORDS.every((k) => Number.isInteger(pin?.[k]) && pin[k] >= (k === "week" ? 1 : 0)))
    throw new Error("pin needs integer week (1-12), dayIndex and slot");
  if (pin.week > WEEKS) throw new Error("pin week must be 1 to 12");
  if (!validActivity(pin.activity))
    throw new Error("pin activity needs id, title and minutes 3 to 20");
  return [
    ...removePin(pins, pin),
    { week: pin.week, dayIndex: pin.dayIndex, slot: pin.slot, activity: pin.activity },
  ];
}

export const removePin = (pins, at) => pins.filter((p) => !COORDS.every((k) => p[k] === at[k]));

function applyPins(plan, pins) {
  const unapplied = [];
  for (const pin of pins) {
    const day = plan.weeks[pin.week - 1]?.days[pin.dayIndex];
    const target = day?.slots[pin.slot];
    const reason = !day
      ? "no session that day"
      : !target
        ? "no such slot"
        : PROTECTED.includes(target.type)
          ? "practice-test slot"
          : null;
    const total = day && !reason ? day.minutes - target.minutes + pin.activity.minutes : 0;
    if (reason || total > MAX_DAY_MINUTES) {
      unapplied.push({ ...pin, reason: reason ?? "session would be longer than 20 minutes" });
      continue;
    }
    day.minutes = total;
    Object.assign(target, {
      activity: { ...pin.activity },
      minutes: pin.activity.minutes,
      pinned: true,
    });
  }
  return unapplied;
}

// ---- falling behind: refresh without shaming ----
function refresh(plan, today, done) {
  const days = plan.weeks.flatMap((w) => w.days.map((d) => ({ w, d })));
  const past = days.filter(({ d }) => d.date < today);
  const open = past.filter(({ d }) => !done.has(d.date));
  if (open.length < BEHIND_MIN_DAYS || open.length / past.length < BEHIND_SHARE) return false;
  const carry = [];
  for (const { d } of open) {
    const a = d.slots.find((s) => s.type === "new")?.activity;
    if (a && !carry.some((c) => c.id === a.id)) carry.push(a);
  }
  const future = days.filter(
    ({ d }) => d.date >= today && d.slots[0].type === "new" && d.slots.length === 3,
  );
  const miniOpen = open.find(({ d }) => d.slots[0].type === "mini-test");
  if (miniOpen && future.length) {
    const target = future.shift().d;
    const test = miniOpen.d.slots[0];
    target.slots = [{ ...test, slot: 0 }, slot(1, "reflect", reflect(5), 5)];
    target.minutes = 20;
    // The original day stays in the history, marked as moved, so the test appears exactly once.
    Object.assign(test, {
      type: "moved",
      activity: { id: "test.mini.moved", title: "This check-in moved to a later day", minutes: 15 },
    });
  }
  future.slice(0, carry.length).forEach(({ d }, i) => {
    const a = { ...carry[i], minutes: 5, title: `Revisit: ${carry[i].title}` };
    d.slots.push(slot(3, "revisit", a, 5));
    d.minutes += 5;
  });
  return true;
}

function markStates(plan, today, done) {
  for (const w of plan.weeks)
    for (const d of w.days)
      d.state = done.has(d.date)
        ? "done"
        : d.date === today
          ? "today"
          : d.date < today
            ? "open"
            : "upcoming";
}

/** Calendar problems the teacher can fix by adding session days. */
function calendarWarnings(weeks) {
  return weeks.flatMap((w) => {
    if (w.days.length === 0) return [`Week ${w.n} has no session days in this calendar.`];
    return w.days.some((d) => d.minutes > MAX_DAY_MINUTES)
      ? [`Week ${w.n} fits best with three or more session days.`]
      : [];
  });
}

/**
 * @param {{ profile: object, startDate: string, daysOfWeek?: number[], breaks?: string[], pins?: object[],
 *           completed?: string[], today?: string|null }} opts  daysOfWeek: 0=Sunday..6; default Monday-Friday.
 * @returns a "road-plan" output with 12 weeks, the pins, any pins that could not be applied, and the disclaimer.
 */
export function generateRoad({
  profile,
  startDate,
  daysOfWeek = [1, 2, 3, 4, 5],
  breaks = [],
  pins = [],
  completed = [],
  today = null,
}) {
  if (profile?.kind !== "skill-profile")
    throw new Error("profile must be a skill profile (from a diagnostic or practice test)");
  assertAlias(profile.alias);
  const priority = domainPriority(profile);
  const history = [];
  let buildIndex = 0;
  const weeks = THEMES.map((theme) => {
    const dates = weekDates(startDate, theme.n, daysOfWeek, breaks);
    const week = buildWeek({
      theme,
      dates,
      priority,
      profile,
      gradeBand: profile.gradeBand,
      history,
      buildIndex,
    });
    if (theme.type === "build") buildIndex += 1;
    return week;
  });
  const plan = withDisclaimer({
    kind: "road-plan",
    version: 1,
    alias: profile.alias,
    gradeBand: profile.gradeBand,
    startDate,
    endDate: weeks.at(-1).days.at(-1)?.date ?? addDays(startDate, 7 * WEEKS - 1),
    status: "new",
    note: null,
    untimed: true,
    weeks,
    pins,
    unappliedPins: [],
    warnings: calendarWarnings(weeks),
  });
  if (today) {
    const done = new Set(completed);
    const refreshed = refresh(plan, today, done);
    plan.status = today > plan.endDate ? "complete" : refreshed ? "refreshed" : "on-track";
    plan.note = refreshed ? { ...REFRESH_NOTE } : null;
    markStates(plan, today, done);
  }
  plan.unappliedPins = applyPins(plan, pins);
  return plan;
}

/** Strings in a plan that a student or family may read (everything except ids and the disclaimer). */
const planText = (plan) =>
  allStrings({ weeks: plan.weeks, note: plan.note, warnings: plan.warnings }).filter(
    (t) => !/^[a-z0-9.+-]+$/.test(t),
  );

/** Phrases that would shame or rush a student, found anywhere in the plan. */
export const shamingPhrases = (plan) =>
  planText(plan).flatMap((t) => findBanned(t).map((p) => `${p} in "${t}"`));

/** Structural and wording checks for a plan. @returns {string[]} problems; [] means valid. */
export function validateRoad(plan) {
  const errors = [];
  if (plan?.kind !== "road-plan") return ["not a road plan"];
  if (!disclaimerOk(plan.disclaimer)) errors.push("plan is missing the mandatory disclaimer");
  if (plan.weeks.length !== WEEKS) errors.push(`plan must have ${WEEKS} weeks`);
  const slots = plan.weeks.flatMap((w) => w.days.flatMap((d) => d.slots));
  for (const w of plan.weeks)
    for (const d of w.days) {
      if (d.minutes < MIN_DAY_MINUTES || d.minutes > MAX_DAY_MINUTES)
        errors.push(
          `week ${w.n} ${d.date}: session is ${d.minutes} minutes (must be ${MIN_DAY_MINUTES}-${MAX_DAY_MINUTES})`,
        );
      if (d.minutes !== d.slots.reduce((s, x) => s + x.minutes, 0))
        errors.push(`week ${w.n} ${d.date}: minutes do not add up`);
      if (d.slots[0].type === "new" && !d.slots.some((s) => s.type === "retrieval"))
        errors.push(`week ${w.n} ${d.date}: no built-in retrieval`);
    }
  const minis = slots.filter((s) => s.type === "mini-test");
  const hasDays = (n) => plan.weeks[n - 1].days.length > 0;
  if (hasDays(MINI_TEST_WEEK) && minis.length !== 1)
    errors.push("the mini practice test must appear exactly once");
  if (
    plan.status !== "refreshed" &&
    hasDays(MINI_TEST_WEEK) &&
    !plan.weeks[MINI_TEST_WEEK - 1].days.some((d) => d.slots.some((s) => s.type === "mini-test"))
  )
    errors.push(`week ${MINI_TEST_WEEK} must hold the mini practice test`);
  const finalDomains = new Set(
    plan.weeks[FINAL_WEEK - 1].days.flatMap((d) =>
      d.slots.filter((s) => s.type === "final-set").flatMap((s) => s.activity.build?.domains ?? []),
    ),
  );
  if (hasDays(FINAL_WEEK) && DOMAINS.some((d) => !finalDomains.has(d)))
    errors.push(`week ${FINAL_WEEK} final practice set must cover all four domains`);
  const ready = new Set(
    plan.weeks[READINESS_WEEK - 1].days.flatMap((d) =>
      d.slots.filter((s) => s.type === "readiness").map((s) => s.activity.id),
    ),
  );
  if (hasDays(READINESS_WEEK) && READINESS_IDS.some((id) => !ready.has(id)))
    errors.push(`week ${READINESS_WEEK} must cover every readiness skill`);
  for (const p of shamingPhrases(plan)) errors.push(`shaming or rushing wording: ${p}`);
  return errors;
}

/** Printable family version: bilingual EN/ES strings, Spanish marked as a draft translation. No bands or labels. */
export function familyPrintData(plan) {
  if (plan?.kind !== "road-plan") throw new Error("plan must be a road plan");
  const weeks = plan.weeks.map((w) => {
    const mins = w.days.map((d) => d.minutes);
    return {
      n: w.n,
      dates: w.days.length ? { start: w.days[0].date, end: w.days.at(-1).date } : null,
      theme: w.theme,
      tip: TIPS[w.n - 1],
      milestone: MILESTONES[w.type] ?? null,
      minutesPerDay: mins.length ? { min: Math.min(...mins), max: Math.max(...mins) } : null,
    };
  });
  return {
    kind: "family-print",
    title: FAMILY_TEXT.title,
    intro: FAMILY_TEXT.intro,
    minutesLabel: FAMILY_TEXT.minutes,
    weeks,
    translation: { es: { ...ES_STATUS } },
    disclaimer: { en: DISCLAIMER, es: DISCLAIMER_ES },
  };
}

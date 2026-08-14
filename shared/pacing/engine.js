/* =============================================================================
 * shared/pacing/engine.js — the re-pacing engine for the Live Pacing Planner.
 * -----------------------------------------------------------------------------
 * Pure functions over plain data. No DOM, no fetch, no storage — so the browser
 * and `npm test` run the identical code, and every rule below is testable
 * without a page. This module decides WHAT a pacing change does; the surface
 * decides how it looks and the API decides where it is stored.
 *
 * THE ONE PRIMITIVE
 *   Everything the teacher can do to the schedule is `insertAt` — put a payload
 *   on an instructional date and let what was there ripple forward until
 *   something absorbs it. Move a lesson, continue a lesson, convert a flex day:
 *   all three are an insert with a different payload. Writing them as three
 *   cascades is how three subtly different shift rules end up in one codebase.
 *
 * WHAT THE RIPPLE MUST NEVER DO
 *   - schedule anything on a date school is closed;
 *   - move a locked day (an assessment, a project presentation, a benchmark);
 *   - run past the last student day and silently drop a lesson off the end.
 *   The first two route AROUND the day; the third is refused with a reason.
 *
 * NOTHING HERE MUTATES. Every function returns a plan of `changes`, which the
 * caller previews and only then applies. That is the difference between "move
 * everything" being a decision and being an accident.
 * ========================================================================== */

/** Plan day types. `Lost Day` and `Continued Lesson` are the two the engine
 * itself can create; the rest come from the baseline import. */
export const DAY_TYPES = /** @type {const} */ ([
  "Core Lesson",
  "Continued Lesson",
  "Catch-Up",
  "Review",
  "Assessment",
  "Project",
  "Flex",
  "MCAP / Testing",
  "Lost Day",
  "No Instruction",
]);

/** What the teacher records about what actually happened. Deliberately not the
 * same vocabulary as the plan: a plan says what a day is FOR, an actual says
 * how it WENT, and collapsing them loses the year's history. */
export const ACTUAL_STATUSES = /** @type {const} */ ([
  "not-yet-taught",
  "taught-as-planned",
  "continued",
  "moved",
  "skipped",
  "flex-catch-up",
  "assessment",
  "project",
  "no-instruction",
]);

export const ACTUAL_LABELS = {
  "not-yet-taught": "Not yet taught",
  "taught-as-planned": "Taught as planned",
  continued: "Continued",
  moved: "Moved",
  skipped: "Skipped",
  "flex-catch-up": "Flex / catch-up",
  assessment: "Assessment",
  project: "Project",
  "no-instruction": "No instruction",
};

/* A day whose plan can be overwritten without losing planned content. These are
 * the shock absorbers: a Flex day holds nothing, and a Catch-Up day holds
 * revision that can be re-scheduled or dropped. A ripple that reaches one stops
 * there instead of pushing the rest of the year. */
const ABSORBING = new Set(["Flex", "Catch-Up", "Lost Day", "Review"]);

/* Day types that carry a commitment the engine will not quietly relocate unless
 * the teacher has explicitly left them unlocked. Locking is the teacher's
 * control; this set only decides what gets WARNED about when it is not locked. */
const COMMITTED = new Set(["Assessment", "Project", "MCAP / Testing"]);

/* ── Resolving a year ──────────────────────────────────────────────────────── */

/**
 * Merge the immutable baseline with the live overlay from D1.
 *
 * Three layers survive here on purpose, and the planner shows all three:
 *   original — the August baseline, never written to
 *   plan     — the schedule as it stands now
 *   actual   — what was taught
 *
 * @param {any} baseline data/pacing-baseline-2026-27.json
 * @param {Record<string, any>} overlay date -> stored delta
 * @returns {any[]} one resolved row per school date, in date order
 */
export function resolveYear(baseline, overlay = {}) {
  return baseline.days.map((day) => {
    const o = overlay[day.date] || {};
    return {
      date: day.date,
      weekday: day.weekday,
      week: day.week,
      quarter: day.quarter,
      schoolStatus: day.schoolStatus,
      eventKind: day.eventKind,
      earlyRelease: day.earlyRelease,
      statusLabel: day.statusLabel,
      calendarNote: day.calendarNote,
      mcapWindow: day.mcapWindow,
      original: { ...day.plan },
      plan: { ...day.plan, ...(o.plan || {}) },
      actual: o.actual || null,
      note: o.note ?? null,
      locked: Boolean(o.locked),
      updatedAt: o.updatedAt ?? null,
      origin: o.plan ? "teacher-edit" : "planning-decision",
    };
  });
}

export const isInstructional = (day) => day.schoolStatus === "school";

/** Index of `date` in a resolved year, or -1. */
export const indexOfDate = (days, date) => days.findIndex((d) => d.date === date);

/* ── The primitive ─────────────────────────────────────────────────────────── */

/**
 * Place `payload` on the instructional date at `startIndex`, rippling whatever
 * is displaced forward until it is absorbed or the year runs out.
 *
 * @param {any[]} days resolved year
 * @param {number} startIndex index into `days`
 * @param {any} payload the plan object to place
 * @returns {{changes: {date: string, from: any, to: any}[], absorbedAt: string|null,
 *            routedAround: string[], blocked: string|null, crossesQuarter: boolean,
 *            warnings: string[]}}
 */
export function insertAt(days, startIndex, payload) {
  const changes = [];
  const routedAround = [];
  const warnings = [];
  let carry = payload;
  let absorbedAt = null;
  let blocked = null;
  const startQuarter = days[startIndex]?.quarter ?? null;
  let crossesQuarter = false;

  for (let i = startIndex; i < days.length; i++) {
    const day = days[i];

    /* School closures are not obstacles to route around — they are simply not
     * dates. Skipping them silently is correct; naming them would make every
     * preview read like a list of holidays. */
    if (!isInstructional(day)) continue;

    /* A locked day keeps both its date and its content. The ripple passes over
     * it, which is what "route around" means: the lessons either side of a
     * locked assessment shift, the assessment does not. */
    if (day.locked) {
      routedAround.push(day.date);
      continue;
    }

    if (day.quarter !== startQuarter) crossesQuarter = true;

    const displaced = day.plan;
    changes.push({ date: day.date, from: displaced, to: carry });

    if (ABSORBING.has(displaced.dayType)) {
      absorbedAt = day.date;
      if (displaced.dayType === "Review") {
        warnings.push(
          `The ripple stopped on the Review day of ${day.date}, which sits immediately before a unit assessment.`,
        );
      }
      break;
    }

    if (COMMITTED.has(displaced.dayType)) {
      warnings.push(
        `${displaced.dayType} on ${day.date} is not locked, so it moved. Lock it if it must hold its date.`,
      );
    }

    carry = displaced;

    if (i === days.length - 1) {
      blocked = `There is no room left in the year — ${describe(carry)} would fall past the last student day (${days[days.length - 1].date}). Free a day first, or lock less.`;
    }
  }

  if (!absorbedAt && !blocked && changes.length === 0) {
    blocked = "There is no instructional date available from here onward.";
  }
  if (!absorbedAt && !blocked && changes.length > 0) {
    blocked = `The change ripples to the end of the year without a Flex or Catch-Up day to absorb it — ${describe(carry)} has nowhere to go.`;
  }

  return { changes, absorbedAt, routedAround, blocked, crossesQuarter, warnings };
}

function describe(plan) {
  if (!plan) return "a day";
  if (plan.lessonId) return `${plan.lessonId}${plan.planTitle ? ` (${plan.planTitle})` : ""}`;
  return plan.planTitle || plan.dayType || "a day";
}

/* ── The four teacher actions ──────────────────────────────────────────────── */

const LOST_DAY = {
  unitKey: null,
  dayType: "Lost Day",
  lessonId: null,
  planTitle: "Day lost — content moved forward",
  note: null,
  softDayReason: null,
};

/**
 * "We lost today — move today's lesson forward."
 * Today's plan moves to the next open instructional date; today becomes a lost
 * day that still shows what it was going to be, via `original`.
 */
export function moveLater(days, date) {
  const i = indexOfDate(days, date);
  if (i < 0) return refusal(`${date} is not a date in this school year.`);
  const day = days[i];
  if (!isInstructional(day)) return refusal(`${date} is not a school day (${day.statusLabel}).`);
  if (day.locked) return refusal(`${date} is locked. Unlock it before moving what is on it.`);

  const next = nextInstructional(days, i);
  if (next < 0)
    return refusal(`${date} is the last instructional day — there is nothing after it.`);

  const result = insertAt(days, next, day.plan);
  result.changes.unshift({ date: day.date, from: day.plan, to: LOST_DAY });
  return summarize("move-later", `Move ${describe(day.plan)} forward from ${date}`, result);
}

/**
 * "We didn't finish today." Today's record stands; a continuation is inserted
 * tomorrow and everything after it ripples. This is a first-class action because
 * it is the single most common real adjustment, and faking it by moving the next
 * lesson loses the fact that the lesson ran long.
 */
export function continueTomorrow(days, date) {
  const i = indexOfDate(days, date);
  if (i < 0) return refusal(`${date} is not a date in this school year.`);
  const day = days[i];
  if (!isInstructional(day)) return refusal(`${date} is not a school day (${day.statusLabel}).`);
  if (!day.plan.lessonId && day.plan.dayType !== "Project") {
    return refusal(`${date} has no lesson on it to continue.`);
  }

  const next = nextInstructional(days, i);
  if (next < 0)
    return refusal(
      `${date} is the last instructional day — there is no tomorrow to continue into.`,
    );

  const continuation = {
    ...day.plan,
    dayType: "Continued Lesson",
    planTitle: `${day.plan.planTitle || describe(day.plan)} — continued`,
    softDayReason: null,
  };
  const result = insertAt(days, next, continuation);
  return summarize(
    "continue-tomorrow",
    `Continue ${describe(day.plan)} on ${days[next].date}`,
    result,
    { markContinued: date, markContinuedFrom: day.actual ?? null },
  );
}

/**
 * Swap a day's plan with the previous instructional day's. A local exchange, not
 * a cascade: pulling a lesson earlier by rippling the whole year backwards is
 * never what a teacher means.
 */
export function moveEarlier(days, date) {
  const i = indexOfDate(days, date);
  if (i < 0) return refusal(`${date} is not a date in this school year.`);
  const day = days[i];
  if (!isInstructional(day)) return refusal(`${date} is not a school day (${day.statusLabel}).`);
  if (day.locked) return refusal(`${date} is locked. Unlock it before moving what is on it.`);

  const prev = prevInstructional(days, i);
  if (prev < 0)
    return refusal(`${date} is the first instructional day — there is nothing before it.`);
  if (days[prev].locked) {
    return refusal(`${days[prev].date} is locked, so nothing can trade places with it.`);
  }

  return summarize("move-earlier", `Swap ${date} with ${days[prev].date}`, {
    changes: [
      { date: days[prev].date, from: days[prev].plan, to: day.plan },
      { date: day.date, from: day.plan, to: days[prev].plan },
    ],
    absorbedAt: day.date,
    routedAround: [],
    blocked: null,
    crossesQuarter: days[prev].quarter !== day.quarter,
    warnings: [],
  });
}

/** Move a day's plan onto a chosen date, rippling from there. */
export function moveToDate(days, date, targetDate) {
  const i = indexOfDate(days, date);
  const t = indexOfDate(days, targetDate);
  if (i < 0) return refusal(`${date} is not a date in this school year.`);
  if (t < 0) return refusal(`${targetDate} is not a date in this school year.`);
  if (t === i) return refusal("That is already where it is.");
  const day = days[i];
  const target = days[t];
  if (!isInstructional(day)) return refusal(`${date} is not a school day (${day.statusLabel}).`);
  if (!isInstructional(target)) {
    return refusal(
      `${targetDate} is not a school day (${target.statusLabel}), so nothing can be taught on it.`,
    );
  }
  if (day.locked) return refusal(`${date} is locked. Unlock it before moving what is on it.`);
  if (target.locked) return refusal(`${targetDate} is locked, so nothing new can be placed on it.`);

  const result = insertAt(days, t, day.plan);
  result.changes.unshift({ date: day.date, from: day.plan, to: LOST_DAY });
  return summarize("move-to-date", `Move ${describe(day.plan)} to ${targetDate}`, result);
}

/**
 * Turn a Flex day into a taught day. An explicit action rather than an implicit
 * one: an unused flex day is a resource, and it should take a decision to spend
 * it.
 */
export function convertFlex(days, date, payload) {
  const i = indexOfDate(days, date);
  if (i < 0) return refusal(`${date} is not a date in this school year.`);
  const day = days[i];
  if (!isInstructional(day)) return refusal(`${date} is not a school day (${day.statusLabel}).`);
  if (!ABSORBING.has(day.plan.dayType)) {
    return refusal(
      `${date} is a ${day.plan.dayType} day, not a flex day. Move what is on it first.`,
    );
  }
  return summarize("convert-flex", `Use the flex day on ${date}`, {
    changes: [{ date, from: day.plan, to: { ...day.plan, ...payload } }],
    absorbedAt: date,
    routedAround: [],
    blocked: null,
    crossesQuarter: false,
    warnings: [],
  });
}

/* ── Shaping the result ────────────────────────────────────────────────────── */

function refusal(reason) {
  return {
    ok: false,
    kind: null,
    summary: reason,
    reason,
    changes: [],
    absorbedAt: null,
    routedAround: [],
    crossesQuarter: false,
    warnings: [],
    markContinued: null,
    markContinuedFrom: null,
  };
}

function summarize(kind, summary, result, extra = {}) {
  return {
    ok: !result.blocked,
    kind,
    summary,
    reason: result.blocked,
    changes: result.changes,
    absorbedAt: result.absorbedAt,
    routedAround: result.routedAround,
    crossesQuarter: result.crossesQuarter,
    warnings: result.warnings,
    markContinued: extra.markContinued ?? null,
    markContinuedFrom: extra.markContinuedFrom ?? null,
  };
}

function nextInstructional(days, from) {
  for (let i = from + 1; i < days.length; i++) if (isInstructional(days[i])) return i;
  return -1;
}

function prevInstructional(days, from) {
  for (let i = from - 1; i >= 0; i--) if (isInstructional(days[i])) return i;
  return -1;
}

/* ── Applying and undoing ──────────────────────────────────────────────────── */

/**
 * Turn a previewed operation into the overlay writes it implies, plus the
 * inverse writes that undo it. The inverse is computed HERE, from the same
 * `from` values the preview showed, so undo can never disagree with what the
 * teacher was told would change.
 */
export function toWrites(op, nowMs = 0) {
  if (!op.ok) return { writes: [], inverse: [] };
  const writes = op.changes.map((c) => ({
    date: c.date,
    plan: c.to,
    updatedAt: nowMs,
  }));
  const inverse = op.changes.map((c) => ({
    date: c.date,
    plan: c.from,
    updatedAt: nowMs,
  }));
  /* Undoing a Continue Tomorrow must also un-mark the day as continued, or the
   * year's history keeps a record of something that was rolled back. The
   * previous actual is captured at preview time for exactly this. */
  if (op.markContinued) {
    writes.push({ date: op.markContinued, actual: { status: "continued" }, updatedAt: nowMs });
    inverse.push({ date: op.markContinued, actual: op.markContinuedFrom, updatedAt: nowMs });
  }
  return { writes, inverse };
}

/* ── Reading the year ──────────────────────────────────────────────────────── */

/** Flex capacity remaining from `fromDate` onward — the real pacing reserve. */
export function flexCapacity(days, fromDate = "0000-00-00") {
  const forward = days.filter((d) => d.date >= fromDate && isInstructional(d));
  const count = (t) => forward.filter((d) => d.plan.dayType === t).length;
  return {
    flex: count("Flex"),
    catchUp: count("Catch-Up"),
    review: count("Review"),
    lost: count("Lost Day"),
    total: count("Flex") + count("Catch-Up"),
  };
}

/**
 * Ahead / on plan / behind, stated as days and in neutral language. "Behind" is
 * a fact about the calendar, not a judgement about the teacher, so the label
 * says where the plan sits rather than how it is doing.
 */
export function pacingPosition(days, todayIso) {
  /* Days STRICTLY before today. Today is not yet evidence of anything — counting
   * it made the planner open on the first morning of the year announcing that
   * the teacher was already a day behind. */
  const past = days.filter((d) => d.date < todayIso && isInstructional(d));
  const taughtish = new Set([
    "taught-as-planned",
    "continued",
    "assessment",
    "project",
    "flex-catch-up",
  ]);
  const recorded = past.filter((d) => d.actual && d.actual.status !== "not-yet-taught");
  const covered = past.filter((d) => d.actual && taughtish.has(d.actual.status)).length;
  const lostDays = past.filter((d) => d.plan.dayType === "Lost Day").length;
  const drift = covered - past.length;

  /* Three distinct situations, and only one of them is a pacing statement.
   * Silence is not "behind" — a teacher who has not been recording has not
   * fallen behind, and saying so is both wrong and discouraging. */
  let label;
  if (past.length === 0) label = "not started";
  else if (recorded.length === 0) label = "nothing recorded yet";
  else if (drift > 0) label = "ahead of plan";
  else if (drift === 0) label = "on plan";
  else label = "behind plan";

  return {
    instructionalDaysElapsed: past.length,
    daysRecorded: recorded.length,
    daysCovered: covered,
    lostDays,
    drift: recorded.length === 0 ? 0 : drift,
    label,
  };
}

/** Unit rollup: planned vs actual range, and how much is left. */
export function unitSummary(days, unitKey) {
  const mine = days.filter((d) => d.plan.unitKey === unitKey && isInstructional(d));
  const originally = days.filter((d) => d.original.unitKey === unitKey && isInstructional(d));
  const taught = mine.filter((d) => d.actual && d.actual.status !== "not-yet-taught");
  return {
    unitKey,
    plannedStart: originally[0]?.date ?? null,
    plannedEnd: originally[originally.length - 1]?.date ?? null,
    currentStart: mine[0]?.date ?? null,
    currentEnd: mine[mine.length - 1]?.date ?? null,
    days: mine.length,
    lessons: mine.filter((d) => d.plan.dayType === "Core Lesson").length,
    assessments: mine.filter((d) => d.plan.dayType === "Assessment").length,
    projectDays: mine.filter((d) => d.plan.dayType === "Project").length,
    flexDays: mine.filter((d) => ABSORBING.has(d.plan.dayType)).length,
    completed: taught.length,
    remaining: mine.length - taught.length,
  };
}

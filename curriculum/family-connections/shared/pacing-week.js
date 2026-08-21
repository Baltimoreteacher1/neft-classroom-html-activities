/* =============================================================================
 * shared/pacing-week.js — turn the Live Pacing Planner's schedule into a
 * Family Connections week.
 * -----------------------------------------------------------------------------
 * The teacher already keeps a dated, day-by-day plan (data/pacing-baseline-*.json
 * plus the D1 overlay behind /api/pacing). Re-picking those same five lessons by
 * hand in this publisher is duplicated work AND a second source of truth: the two
 * can disagree, and families are the ones who find out.
 *
 * Pure functions over plain data — no DOM, no fetch — so `npm test` runs exactly
 * what the browser runs.
 *
 * WHAT NEVER CROSSES THIS BOUNDARY
 *   The planner's `plan.note` and the teacher's overlay `note` are private
 *   working language ("absorb slippage", "confirm with admin", "targeted
 *   repair"). Family-facing notes come only from the calendar's `statusLabel`
 *   and `planTitle`, both of which are written for a reader. Everything this
 *   produces is a DRAFT the teacher reviews before publishing.
 * ========================================================================== */

import { DAYS, WEEK_STATUSES } from "./model.js";

/* Family-facing lesson ids only. The planner also schedules `-catchup` days,
 * which have no family homework page at all — those become a review day rather
 * than a broken link. */
const FAMILY_LESSON_ID = /^\d{1,2}-\d{1,2}(?:-flagship)?$/;

/* Planner day type -> what a family should be told. `Catch-Up`, `Flex` and
 * `Project` carry no family-facing lesson id, so they read as practice days. */
const STATUS_BY_DAY_TYPE = Object.freeze({
  "Core Lesson": "lesson",
  "Continued Lesson": "lesson",
  Review: "review",
  "Catch-Up": "review",
  Flex: "review",
  Project: "review",
  Assessment: "assessment",
  "MCAP / Testing": "assessment",
  "No Instruction": "no-class",
  "Lost Day": "no-class",
});

/* Every family-facing day note comes from one of these two closed vocabularies,
 * both authored in English and Spanish. `planTitle` is deliberately NOT used:
 * it is free text ("Flex / Catch-Up"), so it can neither be translated honestly
 * nor guaranteed to read like something written for a parent. */
const CLOSED_DAY_STATUS = Object.freeze({
  Break: { en: "Break — no school", es: "Vacaciones — no hay clases" },
  "Holiday / School Closed": {
    en: "Holiday — school closed",
    es: "Día feriado — escuela cerrada",
  },
  "PD — No Students": {
    en: "Teacher training day — no students",
    es: "Día de formación docente — sin estudiantes",
  },
  "Half Day / Early Release": {
    en: "Half day — early release",
    es: "Medio día — salida temprana",
  },
  "Wellness Day": { en: "Wellness day — no school", es: "Día de bienestar — no hay clases" },
});

const CLOSED_DAY_TYPE = Object.freeze({
  Review: { en: "Review and practice", es: "Repaso y práctica" },
  "Catch-Up": { en: "Catch-up and practice", es: "Repaso y práctica adicional" },
  Flex: { en: "Practice and questions", es: "Práctica y preguntas" },
  Project: { en: "Project work", es: "Trabajo en el proyecto" },
  Assessment: { en: "Learning check", es: "Evaluación de aprendizaje" },
  "MCAP / Testing": { en: "State testing", es: "Exámenes estatales" },
});

const NO_SCHOOL = Object.freeze({ en: "No school", es: "No hay clases" });

const isIsoDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const clean = (value, maximum = 180) =>
  String(value ?? "")
    .trim()
    .slice(0, maximum);

/** Date arithmetic in UTC so a teacher's timezone never shifts the week. */
function addDays(iso, count) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** The Monday on or before `iso`. Weekend dates roll forward to the next Monday
 * so "this week" during a weekend means the week that is about to start. */
export function weekStartFor(iso) {
  if (!isIsoDate(iso)) return "";
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay();
  if (weekday === 0) return addDays(iso, 1);
  if (weekday === 6) return addDays(iso, 2);
  return addDays(iso, 1 - weekday);
}

function formatWeekLabel(startDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${addDays(startDate, 4)}T00:00:00Z`);
  const month = (date) =>
    new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
  const first = `${month(start)} ${start.getUTCDate()}`;
  const last =
    start.getUTCMonth() === end.getUTCMonth()
      ? String(end.getUTCDate())
      : `${month(end)} ${end.getUTCDate()}`;
  return `${first}-${last}`;
}

/**
 * Every Monday the plan covers, newest first is NOT what a teacher wants here —
 * they scan forward, so this stays in date order.
 * @param {any[]} resolvedDays output of resolveYear(baseline, overlay)
 */
export function pacingWeekStarts(resolvedDays) {
  const starts = new Map();
  for (const day of resolvedDays ?? []) {
    if (!isIsoDate(day?.date)) continue;
    const start = weekStartFor(day.date);
    if (!start || starts.has(start)) continue;
    starts.set(start, { startDate: start, label: formatWeekLabel(start) });
  }
  return [...starts.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Build one Family Connections week from the resolved pacing plan.
 *
 * @returns {{
 *   label: string,
 *   startDate: string,
 *   days: {day: string, status: string, lessonId: string, note: string}[],
 *   lessonCount: number,
 *   needsReview: {day: string, reason: string}[],
 * }}
 */
export function buildWeekFromPacing(resolvedDays, startDate, knownLessonIds) {
  if (!isIsoDate(startDate)) {
    throw new Error("A pacing week needs a start date in YYYY-MM-DD form.");
  }
  const known = knownLessonIds ? new Set(knownLessonIds) : null;
  const byDate = new Map((resolvedDays ?? []).map((day) => [day.date, day]));
  const needsReview = [];
  const days = DAYS.map((dayName, index) => {
    const source = byDate.get(addDays(startDate, index));
    const entry = { day: dayName, status: "no-class", lessonId: "", note: "", noteEs: "" };
    if (!source) {
      needsReview.push({ day: dayName, reason: "This date is outside the pacing plan." });
      return entry;
    }
    if (source.schoolStatus !== "school") {
      const label = CLOSED_DAY_STATUS[clean(source.statusLabel, 60)] ?? NO_SCHOOL;
      entry.note = label.en;
      entry.noteEs = label.es;
      return entry;
    }
    const plan = source.plan ?? {};
    const dayType = clean(plan.dayType, 40);
    const status = STATUS_BY_DAY_TYPE[dayType] ?? (plan.lessonId ? "lesson" : "no-class");
    entry.status = WEEK_STATUSES.includes(status) ? status : "no-class";
    const lessonId = clean(plan.lessonId, 40);
    if (entry.status === "lesson") {
      if (FAMILY_LESSON_ID.test(lessonId) && (!known || known.has(lessonId))) {
        entry.lessonId = lessonId;
      } else {
        /* A lesson day the family page cannot link is worse than an honest
         * review day — say so instead of publishing an empty lesson card. */
        entry.status = "review";
        const label = CLOSED_DAY_TYPE.Review;
        entry.note = label.en;
        entry.noteEs = label.es;
        needsReview.push({
          day: dayName,
          reason: lessonId
            ? `Lesson ${lessonId} has no family practice page — pick one or leave it as review.`
            : "The plan has no lesson on this day.",
        });
      }
    } else if (entry.status !== "no-class") {
      const label = CLOSED_DAY_TYPE[dayType];
      if (label) {
        entry.note = label.en;
        entry.noteEs = label.es;
      }
    }
    if (dayType === "Catch-Up" || dayType === "Flex" || dayType === "Project") {
      needsReview.push({
        day: dayName,
        reason: `${dayType} day — add a lesson if you want practice posted.`,
      });
    }
    return entry;
  });
  return {
    label: formatWeekLabel(startDate),
    startDate,
    days,
    lessonCount: days.filter((day) => day.status === "lesson" && day.lessonId).length,
    needsReview,
  };
}

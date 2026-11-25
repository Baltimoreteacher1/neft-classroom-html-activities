// Formative engine constants and small pure helpers. Browser-safe ESM: no Node imports, no clock (callers pass `now`).
// Used by Pages Functions (functions/api/formative) and the Studio view (bcpss-teachers/studio/views/formative).

/** Rubric levels in teaching order. Labels are teacher-side only; students never see a level name. */
export const LEVELS = Object.freeze(["emerging", "developing", "proficient"]);
export const LEVEL_LABEL = Object.freeze({
  emerging: "Emerging",
  developing: "Developing",
  proficient: "Proficient",
});

/** The teacher's score and a student's own score live in separate rows and are never merged. */
export const SCORERS = Object.freeze(["teacher", "self"]);

/** Student self-scoring exists only for the older scaffold band (a teacher-chosen band, never a student property). */
export const SELF_BAND = "5_6";

export const LIMITS = Object.freeze({
  /** Same ceiling as a class (class-platform LIMITS.maxStudents). */
  maxScoresPerCall: 60,
  maxErrorsPerCall: 12,
  maxErrorDelta: 50,
  trendWeeks: 8,
  topErrors: 3,
});

export const NOTE =
  "Inspired by WIDA ACCESS, not official, not a score, not a placement tool. A quick classroom check for the teacher.";

export const isLevel = (v) => LEVELS.includes(v);
export const isScorer = (v) => SCORERS.includes(v);

const UNIT_ID = "[a-zA-Z0-9_-]{2,80}";
export const UNIT_ID_RE = new RegExp(`^${UNIT_ID}$`);
export const TICKET_RE = new RegExp(`^(${UNIT_ID}):exit(?::([1-9]))?$`);
export const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

/** One exit ticket per unit; `round` (2-9) is a repeat of the same ticket later in the unit. */
export const ticketIdFor = (unitId, round = 1) =>
  round > 1 ? `${unitId}:exit:${round}` : `${unitId}:exit`;

/** The unit a ticket id belongs to, or null when the id is malformed. */
export const unitOfTicket = (ticketId) => TICKET_RE.exec(String(ticketId))?.[1] ?? null;

const DAY_MS = 86_400_000;

/** ISO date (YYYY-MM-DD) of the Monday, UTC, of the week containing `ms`. */
export function weekStart(ms) {
  const day = Math.floor(ms / DAY_MS);
  const sinceMonday = (day + 3) % 7; // 1970-01-01 was a Thursday
  return new Date((day - sinceMonday) * DAY_MS).toISOString().slice(0, 10);
}

/** `count` consecutive week starts ending with the week of `ms`, oldest first. */
export function recentWeeks(ms, count = LIMITS.trendWeeks) {
  const end = Date.parse(`${weekStart(ms)}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) =>
    new Date(end - (count - 1 - i) * 7 * DAY_MS).toISOString().slice(0, 10),
  );
}

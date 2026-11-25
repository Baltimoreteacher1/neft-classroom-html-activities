// Single source of truth for the BCPSS usage-telemetry contract.
// Imported by the Pages Functions (functions/api/bcpss/{telemetry,insights}.js, functions/_lib/bcpss/db.js,
// functions/_lib/security/schema.js for WIDA_TIERS; request limits and the unit registry live in functions/_lib/security/)
// AND the browser (bcpss-teachers/bcpss-teachers.js, bcpss-teachers/insights/insights.js).
// The insights dashboard once read keys the server never sent (top_klus vs top_klu_demand) and a
// permissive fallback chain hid it, so this module names every key and the client reads exactly these.

export const TELEMETRY_EVENT_TYPES = Object.freeze([
  "scaffold_toggle",
  "vocab_lookup",
  "activity_copy",
  "lab_launch",
  "esol_routine",
  "projection_mode",
]);

export const WIDA_TIERS = Object.freeze(["1_2", "3_4", "5_6"]);

export const TELEMETRY_V2_GRADES = Object.freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]);

export const TELEMETRY_V2_SUBJECTS = Object.freeze(["ELA", "Math", "Science", "Social Studies"]);

export const TELEMETRY_V2_ACTIVITY_TYPES = Object.freeze([
  "vocab",
  "reading",
  "listening",
  "speaking",
  "writing",
  "game",
  "routine",
  "packet",
  "week_plan",
  "search",
  "practice_test",
]);

export const TELEMETRY_V2_FEATURE_RE = /^[a-z0-9_-]{2,40}$/;

export const TELEMETRY_V2_OPTIONAL_KEYS = Object.freeze([
  "grade",
  "subject",
  "activity_type",
  "feature",
]);

export const TELEMETRY_BODY_KEYS = Object.freeze([
  "unit_id",
  "wida_tier",
  "event_type",
  "internal",
  ...TELEMETRY_V2_OPTIONAL_KEYS,
]);

/**
 * Strictly validate optional Telemetry v2 dimensions.
 * Returns null when valid, or an error string when invalid.
 * Keeps all v1 payloads (where v2 keys are omitted) 100% valid.
 */
export function validateTelemetryV2Dimensions(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "telemetry body must be an object.";
  }
  const unexpected = Object.keys(body).filter((k) => !TELEMETRY_BODY_KEYS.includes(k));
  if (unexpected.length) {
    return "unexpected field in telemetry body.";
  }
  if (body.grade !== undefined) {
    if (typeof body.grade !== "string" || !TELEMETRY_V2_GRADES.includes(body.grade.trim())) {
      return `grade must be one of: ${TELEMETRY_V2_GRADES.join(", ")}.`;
    }
  }
  if (body.subject !== undefined) {
    if (typeof body.subject !== "string" || !TELEMETRY_V2_SUBJECTS.includes(body.subject.trim())) {
      return `subject must be one of: ${TELEMETRY_V2_SUBJECTS.join(", ")}.`;
    }
  }
  if (body.activity_type !== undefined) {
    if (
      typeof body.activity_type !== "string" ||
      !TELEMETRY_V2_ACTIVITY_TYPES.includes(body.activity_type.trim())
    ) {
      return `activity_type must be one of: ${TELEMETRY_V2_ACTIVITY_TYPES.join(", ")}.`;
    }
  }
  if (body.feature !== undefined) {
    if (typeof body.feature !== "string" || !TELEMETRY_V2_FEATURE_RE.test(body.feature.trim())) {
      return "feature must be a lowercase slug matching /^[a-z0-9_-]{2,40}$/.";
    }
  }
  return null;
}

/** Top-level keys of GET /api/bcpss/insights. The client may read only these. */
export const INSIGHTS_KEYS = Object.freeze({
  window: "window_days",
  total: "total_events",
  grades: "top_grades",
  units: "top_units",
  tiers: "top_wida_tiers",
  klus: "top_klu_demand",
  events: "event_breakdown",
  backend: "backend",
});

/** localStorage flag a teacher sets on their own device so their testing is not counted. */
export const INTERNAL_TRAFFIC_FLAG = "nt-internal-traffic";

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

export const TELEMETRY_BODY_KEYS = Object.freeze([
  "unit_id",
  "wida_tier",
  "event_type",
  "internal",
]);

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

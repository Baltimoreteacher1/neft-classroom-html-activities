/**
 * edupulse-config.js — LEGACY config for the standalone EduPulse gradebook.
 *
 * NOT USED FOR WRITING SCORES ANY MORE (changed 2026-07-29).
 * assets/edupulse-bridge.js now posts to the same-origin /api/scores (classroom
 * D1 `game_scores`) and reads nothing from this file. The only remaining
 * consumer is teacher-tools/canvas-dashboard, which uses `apiBase` to read the
 * pre-July-2026 archive.
 *
 * WHY THE MOVE: this key and the Worker's INGEST_KEY secret had drifted apart,
 * so every score POST 401'd. 37 graded activities recorded nothing for weeks and
 * nothing detected it, because from the client a rejected write and an unused
 * feature are indistinguishable. `npm run audit:scores` now surfaces that class
 * of failure by cross-checking wiring against rows actually written.
 *
 * `ingestKey` below is STALE — it does not authenticate against the Worker and
 * is kept only so the legacy dashboard's config object keeps its shape. Do not
 * treat it as a working credential, and do not wire new activities to it; point
 * them at /api/scores like everything else.
 *
 * NEVER put the ADMIN_KEY (x-admin-key) here or anywhere client-side.
 */
window.EDUPULSE_CONFIG = {
  apiBase: "https://edupulse-gradebook-api.neftjd.workers.dev",
  ingestKey: "ek_00cd771b2b55efc730e60ecbddaa686b99139d6337ed7350",
};

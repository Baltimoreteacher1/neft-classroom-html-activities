/**
 * edupulse-config.js — single configuration point for the EduPulse score bridge.
 *
 * This is the ONLY place the ingest key lives. Paste the write-only ingest key
 * once here and every graded activity that loads edupulse-bridge.js will report
 * scores to the EduPulse gradebook Worker.
 *
 * SECURITY NOTES:
 *   - `ingestKey` is the WRITE-ONLY key (x-ingest-key). It can submit scores but
 *     cannot read the gradebook. It is safe to ship in static client HTML.
 *   - NEVER put the ADMIN_KEY (x-admin-key) here or anywhere client-side. The
 *     admin key protects /api/scores (GET) and /api/summary and stays a Worker
 *     secret only.
 *
 * To activate: replace PASTE_INGEST_KEY_HERE with the real ingest key.
 * Until then the bridge stays inert (records are no-ops) so activities keep
 * working normally with zero errors.
 */
window.EDUPULSE_CONFIG = {
  apiBase: "https://edupulse-gradebook-api.neftjd.workers.dev",
  ingestKey: "PASTE_INGEST_KEY_HERE",
};

/**
 * edupulse-config.js — single configuration point for the EduPulse score bridge.
 *
 * This is the ONLY place the ingest key lives. Every graded activity that loads
 * edupulse-bridge.js reports scores to the EduPulse gradebook Worker using it.
 *
 * SECURITY NOTES:
 *   - `ingestKey` is the WRITE-ONLY key (x-ingest-key). It can submit scores but
 *     cannot read the gradebook. It is safe to ship in static client HTML.
 *   - NEVER put the ADMIN_KEY (x-admin-key) here or anywhere client-side. The
 *     admin key protects /api/scores (GET) and /api/summary and stays a Worker
 *     secret only.
 *
 * The ingest key below is live. To rotate it, run
 *   cd edupulse-gradebook && npx wrangler secret put INGEST_KEY
 * and paste the same new value here, then rebuild + redeploy the site.
 */
window.EDUPULSE_CONFIG = {
  apiBase: "https://edupulse-gradebook-api.neftjd.workers.dev",
  ingestKey: "ek_00cd771b2b55efc730e60ecbddaa686b99139d6337ed7350",
};

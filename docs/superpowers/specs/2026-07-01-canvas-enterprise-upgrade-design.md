# Canvas Integration — Enterprise Upgrade (Design + Delivery)

**Date:** 2026-07-01
**Repo:** `neft-classroom-html-activities`
**Status:** Part A1 delivered & deployed; Parts A2–C planned
**Supersedes framing of:** `2026-06-23-canvas-lti-seamless-design.md` (SCORM reframed from "weak fallback" to primary working path)

## Reframing (why this differs from the 2026-06-23 spec)

The earlier LTI spec treated SCORM as a weak fallback that needed IT to enable.
**Confirmed with Joel: the SCORM upload tool already works in his BCPS Canvas** —
uploaded packages report a score to the gradebook. That makes SCORM the
**primary, zero-IT, auto-grading path today.** So the priority inverts:

- **SCORM = primary** (works now, auto-grades, no IT). Make it premium & effortless.
- **LTI 1.3 = the dormant future upgrade** (built + deployed inert; flips on if IT
  ever registers a Developer Key). Adds only what SCORM cannot: SSO across every
  lesson, Deep Linking placement, roster sync.

The SCORM wrapper (`functions/_lib/scorm.js`) live-iframes the real activity, so
content edits never require re-packaging — a genuine strength worth building on.

## Part A — SCORM made premium (no IT)

### A1 — Canvas auto-identify (DELIVERED, deployed 2026-07-01)

Kills the name-entry screen inside Canvas. The SCORM SCO reads the LMS-provided
identity and hands it to the live activity; the engine launches straight in,
already identified.

- **`functions/_lib/scorm.js`** — after `LMSInitialize`, read
  `cmi.core.student_name` (SCORM 1.2 "Last, First" → normalized "First Last")
  and `cmi.core.student_id`; set the iframe `src` at runtime to
  `…?…&sn=<name>&si=<id>`. The score-report listener is registered before launch
  so no early completion is missed.
- **`engine/core/app.js`** — `showIdentityScreen()` short-circuits when `sn` is
  present: sets `NeftIdentity`, derives a stable `studentId` from `si` (roster
  id) or the name, and calls `initMainApp` directly.
- **Dormant-safe:** guarded on the `sn` param. A normal visit to the live site is
  byte-identical to before (no param → original name-entry screen).
- **Resume:** because `studentId` is now keyed to the Canvas roster id, and the
  activity origin (`eduwonderlab.com`) owns its `localStorage`, same-device
  resume inside Canvas is automatic.

### A2 — Cross-device resume via `cmi.suspend_data` (planned, YAGNI-gated)

Same-device resume already works via localStorage + stable id (A1). Cross-device
resume would relay a compact state snapshot through `cmi.suspend_data`. Deferred
until there is a real cross-device need — it adds bidirectional sync risk for a
marginal gain.

### A3 — One-click / bulk SCORM download in the Console (planned)

Surface the existing on-demand SCORM endpoint (`functions/api/scorm.js`) and the
batch builder (`tools/scorm/`) as one-click `.zip` downloads — per lesson and as
a whole-library / per-unit bundle with a printable rollout INDEX, mirroring the
Canvas Studio cartridge flow.

## Part B — Console consolidation (no IT, planned)

Collapse the six `teacher-tools/canvas-*` tools (command-center, dashboard,
grades, scorm, setup, studio) into one **Canvas Console** with three tabs:
**Package** (SCORM / cartridge / QTI download), **Grades** (code decode + roster
merge), **Setup & Status**. Old URLs become **redirects** to the Console —
redirect-backed migration only, no bare folder moves (routes are load-bearing).

## Part C — LTI 1.3 Worker, dormant (planned, per 2026-06-23 spec)

Build `lti-worker/` (OIDC login, launch/JWT-verify, JWKS, Deep Linking, AGS
score) + `engine/core/grade-emit.js` channel selector (LTI → SCORM → code) + the
IT Developer-Key email carrying real URLs. Deployed but inert until IT returns
`client_id` + `deployment_id`; two pasted values flip it live. Zero student
impact while dormant. Positioned as the future SSO/placement/roster upgrade —
grades are already handled by SCORM.

## Constraints honored

- Deploy = push to `main` (Cloudflare Git auto-build); no manual `wrangler`.
- The LTI Worker (Part C) deploys separately via `wrangler` and never touches the
  Pages site.
- No route/folder restructuring; consolidation is redirect-backed.
- `npm run build` exit 0 + `npm run validate` before each push.

## Verification (A1)

- `node --check` on both files: OK.
- `buildScormFiles()` runtime test: SCO contains `data-src`, reads
  `cmi.core.student_name` / `student_id`, emits `sn=` / `si=`, calls `launchUrl()`.
- `npm run build`: exit 0; bundled engine chunk contains the `get("sn")` guard.
- `npm run validate`: 13 passed, 0 failed.

# Canvas Integration — Enterprise Upgrade (Design + Delivery)

**Date:** 2026-07-01
**Repo:** `neft-classroom-html-activities`
**Status:** Parts A1, A3, B, C delivered; A2 deferred (YAGNI). LTI Worker built + tested (16/16), deploy-ready, dormant.
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

### A3 — One-click SCORM download in the Console (DELIVERED)

The **Package** tab of the new Canvas Console surfaces the existing on-demand
SCORM endpoint (`functions/api/scorm.js`) as a one-click `.zip` — enter a lesson
id/path, download the auto-grade or completion-code package. Whole-library /
per-unit packages link out to Canvas Studio (already one-click) and the batch
SCORM builder. A printable per-unit rollout INDEX remains available via the
`--split` cartridge flow.

## Part B — Canvas Console (DELIVERED, additive)

New `teacher-tools/canvas-console/` unifies the six `canvas-*` tools into one hub
with three tabs — **Package** (SCORM one-click / cartridge / QTI), **Grades**
(code decode + live dashboard), **Setup & Status** (setup wizard, command center,
**live LTI status check** via the Worker's `/health`). Additive and safe: the six
existing tools keep working and are linked in; no folder moves, no route changes
(routes are load-bearing). Redirect-based retirement of the redundant tools can
follow later if desired.

## Part C — LTI 1.3 Worker, dormant (DELIVERED, deploy-ready)

Built `lti-worker/` (OIDC login, launch/JWT-verify via cached platform JWKS,
public JWKS, Deep Linking picker + signed response, AGS client-credentials token

- Score POST) + `engine/core/grade-emit.js` channel selector (LTI → SCORM/code) +
  `migrations/0001_init.sql` (nonce/replay + audit) + `tools/gen-keypair.mjs` +
  README + a 16-assertion conformance test against a mock Canvas. The IT
  Developer-Key email (`docs/canvas/it-lti-developer-key-email.md`) already carries
  the real Worker URLs. **Fails closed (503) until `LTI_PRIVATE_JWK` +
  `LTI_CLIENT_ID` + `LTI_DEPLOYMENT_ID` are set** — zero student impact while
  dormant. Two pasted values from IT flip it live. Positioned as the future
  SSO/placement/roster upgrade; grades already work via SCORM today.

The LTI launch redirect appends `sn`/`si` too, so LTI launches reuse the same
A1 auto-identify path — one identity mechanism for both channels.

### Deploy note

`lti-worker/` deploys **separately** via `wrangler` (see its README) and never
touches the Pages site. It is committed here but NOT auto-deployed by the Pages
push — deploying the Worker requires an authenticated `wrangler` + generating the
keypair secret, done when the IT email goes out.

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

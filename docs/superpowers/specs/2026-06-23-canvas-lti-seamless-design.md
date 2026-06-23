# Canvas LTI 1.3 Seamless Integration — Design (Spec 1)

**Date:** 2026-06-23
**Repo:** `neft-classroom-html-activities`
**Status:** Design — pending user review

## Problem

Joel is moving grading to BCPS Canvas. The current integration is a pile of
clever **workarounds for a missing API token**: Common Cartridge import, native
QTI quizzes, iframe embed, completion-code paste + CSV merge, EduPulse→CSV
dashboards, a Setup Wizard, and a Command Center. They work, but four seams
remain:

1. **Grades back into Canvas** — interactive lessons require a manual step
   (student pastes a completion code; teacher merges a CSV).
2. **Setup** — getting lessons/quizzes into Canvas each unit is multi-tool.
3. **Student experience** — name-entry screen + code-paste, sometimes leaving Canvas.
4. **Tool sprawl** — ~5 separate Canvas teacher tools.

BCPS gives no personal API token and no teacher-addable LTI/SCORM. Joel **can**
send one IT email but **does not know if it will be approved.**

## Design principle: "LTI-ready, seamless-today"

A single standard — **LTI 1.3** — collapses all four seams (AGS = auto grades,
Deep Linking = in-Canvas placement, OIDC launch = SSO, the tool itself = one
integration). But because IT approval is **uncertain**, the design must never
_depend_ on it:

- Everything that needs IT is **built and dormant behind config**. The moment
  IT approves and returns `client_id` + `deployment_id`, Joel pastes two values
  and auto-everything turns on. If IT never replies, this code sits inert and
  harms nothing.
- Everything that **doesn't** need IT (Spec 2: console consolidation, one-tap
  codes, QTI-default) ships independently and stands alone.

**Honest limit, stated up front:** without LTI (or SCORM/API), Canvas
_physically cannot_ receive a lesson grade automatically. Quizzes already
auto-grade (QTI, zero IT). Interactive-lesson grades become automatic **only on
approval**. This spec builds the thing that makes that switch instant.

## Scope of THIS spec (Spec 1)

The **LTI 1.3 tool** (one Cloudflare Worker) + the **engine grade-emit hook** +
the **IT registration email**. Console consolidation and code-flow polish are
**Spec 2** (separate, no-IT, ships in parallel).

## Architecture

Three units, each independently understandable and testable.

### Unit A — Engine grade-emit hook (`engine/core/grade-emit.js`)

A small channel selector at the lesson's all-phases-complete point
(`engine/core/app.js:506–507`, today calling `reportScore` + `showCanvasCode`).
It already has a SCORM-launch precedent in `canvas-code.js` (`isScormLaunch` →
`reportToParent` postMessage). Generalize that:

- **Input:** `(state, config)` at completion + the launch context.
- **Detect launch channel** (in priority order):
  1. **LTI** — the lesson was opened in an LTI session (a signed, short-lived
     `lti_session` cookie/token set by the Worker at launch, carrying the AGS
     line-item URL + a server callback). → `POST` the score to the Worker's
     `/lti/score` endpoint, which forwards to Canvas AGS.
  2. **SCORM** — existing `reportToParent` postMessage (unchanged).
  3. **Default** — existing completion-code modal / EduPulse (unchanged).
- **Output:** exactly one channel fires. Pure routing; no Canvas knowledge in
  the engine beyond "post this JSON to this URL."
- **Dormant-safe:** with no LTI session present, behavior is byte-identical to
  today.

### Unit B — LTI 1.3 Worker (`lti-worker/` → `neft-lti`)

A Cloudflare Worker (convention mirrors `results-worker/`: `src/worker.js` +
`wrangler.toml` + D1 + `README.md`). Endpoints:

| Route                   | Purpose                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `GET /lti/login`        | OIDC third-party-initiated login → redirect to Canvas auth with `state`+`nonce`                    |
| `GET\|POST /lti/launch` | Receive `id_token` (launch JWT), verify against platform JWKS, branch by message type              |
| `GET /lti/jwks`         | Tool's **public** JWKS (so Canvas can verify our AGS/DeepLink JWTs)                                |
| `POST /lti/deeplink`    | Deep Linking response — returns a signed JWT placing the chosen lesson/quiz as a Canvas assignment |
| `POST /lti/score`       | Called by the lesson on completion → mints an AGS token → `POST` score to Canvas line item         |

- **Launch flow:** `ResourceLink` launch → verify JWT (iss/aud/exp/nonce, sig via
  platform JWKS, cached in KV) → mint short-lived `lti_session` (AGS line-item
  URL, context, user sub) → 302 to the live lesson on Pages with the session.
- **Deep Linking flow:** `LtiDeepLinkingRequest` → render a lesson/quiz picker →
  on choose, return the signed `ContentItem` JWT to Canvas → assignment created
  in-Canvas (replaces Unit Plan Builder / CSV for placement).
- **Score flow:** `/lti/score` validates the `lti_session`, gets an OAuth2
  client-credentials token from Canvas (signed JWT grant), `POST`s an AGS Score
  to the line item → grade appears in the Canvas gradebook.
- **Storage:** D1 for nonce/replay table + (optional) launch audit; KV for
  cached platform JWKS + OAuth tokens.

### Unit C — Config & secrets (no code-change activation)

- **Secrets (wrangler):** tool RSA keypair (private key signs our JWTs; public
  key served at `/lti/jwks`), `CANVAS_PLATFORM` endpoints (auth, token, JWKS),
  `LTI_CLIENT_ID`, `LTI_DEPLOYMENT_ID`.
- **Activation = paste two values:** until `LTI_CLIENT_ID`/`LTI_DEPLOYMENT_ID`
  are set, the Worker's URLs exist and the keypair/JWKS are live (so IT _can_
  register), but no Canvas course points at it → zero effect on students.
- Lesson Pages need no rebuild to activate: the `lti_session` is set by the
  Worker at launch; the engine hook reads it at runtime.

## Data flow (happy path, post-approval)

1. Teacher, in Canvas, adds an assignment → "Neft Lessons" (Deep Linking) →
   picks Lesson 3-1 → Canvas creates the assignment. _(Setup — #2)_
2. Student clicks the assignment → Canvas OIDC → `/lti/login` → `/lti/launch`
   verifies → 302 into Lesson 3-1, already identified, inside Canvas. _(Student — #3)_
3. Student finishes → engine grade-emit detects LTI → `POST /lti/score` → AGS →
   score in the Canvas gradebook automatically. _(Grades — #1)_
4. One Worker + a thin status page = the whole integration. _(Sprawl — #4)_

If no LTI session (lesson opened outside Canvas, or IT never approved): step 3
falls back to today's completion code. Nothing breaks.

## Security

- **JWT verification:** validate `iss`, `aud` (= client_id), `exp`/`iat`,
  `nonce` (single-use, D1-backed), and signature against the **platform JWKS**
  (cached in KV with TTL). Reject on any failure.
- **Replay protection:** nonce + `jti` stored; reused → 401.
- **Our signing key:** RSA private key in Worker secret store only; public key
  via `/lti/jwks`. Rotation-ready (kid-based).
- **AGS token:** client-credentials JWT grant, short-lived, never logged.
- **PII:** only the LTI `sub` + name already in Canvas roster; no new student
  data collected. No secrets in client code or logs.
- **CSP/embedding:** existing `_headers` `frame-ancestors ... *.instructure.com`
  already allows the framed launch.

## Testing

- **Unit (Worker):** JWT verify (valid / bad-sig / expired / replayed-nonce /
  wrong-aud), JWKS cache, deep-link `ContentItem` shape, AGS score payload —
  with a mock platform (local RSA keypair standing in for Canvas).
- **Unit (engine):** grade-emit channel selection — LTI present → posts to
  `/lti/score`; absent → identical to today (snapshot the existing path).
- **Conformance:** validate against the IMS LTI 1.3 / Advantage reference
  certification suite before sending the IT email, so the registration "just
  works" for them.
- **End-to-end:** Joel's real Canvas, one lesson, after approval — launch → SSO
  → complete → grade lands. (Only Joel can run the BCPS side.)
- Repo gates unchanged: `npm run build` exit 0; `npm run validate`.

## The IT email (deliverable in this spec)

A tight, standard-framed request, ready to send the day we deploy the Worker
endpoints (so it carries **real URLs**, not placeholders):

- What: register **one LTI 1.3 Developer Key** (the IMS standard Canvas natively
  supports — same mechanism as Google Drive/Nearpod, just teacher-scoped).
- The four URLs they need: OIDC login (`/lti/login`), redirect/launch
  (`/lti/launch`), public JWKS (`/lti/jwks`), Deep Linking (`/lti/deeplink`).
- Scope: AGS (grades) + Deep Linking + Names/Roles (optional) for one teacher's
  courses; no extra PII; hosted on existing Cloudflare infra.
- They return: `client_id` + `deployment_id` → Joel relays them → paste → live.
- **Fallback ask (one line):** if LTI is declined, enabling the **SCORM
  uploader** gives auto-grading alone (weaker, but unblocks #1).

Drafted to `docs/canvas/it-lti-developer-key-email.md`.

## What this spec deliberately excludes

- **Spec 2 (separate, no-IT, parallel):** consolidate the ~5 Canvas teacher
  tools into one **Canvas Console**, retire redundant ones, make the
  completion-code flow one-tap, default anything gradeable to QTI. Ships and
  delivers a "more seamless" win **regardless of IT's answer.**
- Native QTI quizzes stay as-is (already auto-grade, zero IT).
- No change to lesson content, routing, or the deploy model.

## Sequencing

1. Stand up the **Worker endpoints** (stable URLs + live JWKS) → send the IT
   email **day one** so their approval clock runs while we build.
2. Build launch/SSO + AGS score + grade-emit hook (works the moment a key
   exists).
3. Build Deep Linking picker.
4. (Spec 2) Console consolidation + code polish, in parallel — does not wait on IT.

## Open items (resolved at registration time, not blockers to build)

- Exact BCPS Canvas platform endpoints (auth/token/JWKS URLs) — standard
  `*.instructure.com` paths; confirmed from the Developer Key screen on approval.
- Whether BCPS approves LTI vs only SCORM — the design degrades gracefully to
  either, or to no-IT.

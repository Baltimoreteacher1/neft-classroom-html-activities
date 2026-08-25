# AUTH_CONTRACT.md — the frozen authentication model

**Baseline: `4c2e13dab`** (tag `auth-known-good`), production 2026-08-16.

This file describes authentication as it actually behaves in production. It is
not a design document and not a roadmap. It is the thing `validate:auth-contract`
checks the source against, so **every statement here is either enforced by that
gate or explicitly marked as unenforced context.**

> ## Read this before changing anything under "Files that implement auth"
>
> This model was arrived at by **rolling back** a more sophisticated one. On
> 2026-08-16 a unified teacher session — signed HttpOnly cookie, per-teacher key
> slots, a `/teacher-login/` page, a Sec-Fetch-Mode heuristic to tell a person
> from a machine — shipped at 08:04, grew four follow-up commits over eleven
> hours, and **never signed a single teacher in**. The root cause was found only
> at 18:51 (www and the apex were independent hosts, so a credential never
> travelled). The rollback restored the three-gate model below, which had worked
> for months.
>
> The lesson is not "cookies are bad". It is that **this system's auth is a
> casual gate over material that is merely inappropriate for students** —
> facilitation notes, answer keys, dashboards — and every increase in
> sophistication has cost more classroom time than it bought. A teacher locked
> out on a Monday morning is the failure that matters here.
>
> **Do not consolidate these three gates into one.** They look redundant. They
> are not: they never appear in the same flow, and that separation is the entire
> reason the model is predictable. See "Why three gates" below.
>
> **One extension is sanctioned, and only one** (§2a, added 2026-08-25): a
> signed 24-hour *receipt* issued after a successful Basic sign-in, so the
> browser stops re-challenging. It authenticates nobody — it records that
> `SITE_PASSWORD` was already checked. Delete `_lib/teacher-session.js` and
> every gate still works exactly as described here, one challenge at a time.
> That reversibility is the property that makes it safe, and it is what
> `validate:auth-contract` checks.

---

## 1. Canonical host

`www.eduwonderlab.com` → **308** → `eduwonderlab.com`, in
`functions/_middleware.js`, as the **first thing `onRequest` does** — before the
password gate, before the redirect map, before anything reads a credential.

- **308, not 301/302.** 301 and 302 turn a POST into a GET and drop the body.
- **Why the middleware and not `_redirects`.** Cloudflare honours only the first
  100 rules of this project's `_redirects` (measured live; it had already
  silently killed 231 short links once). A must-be-first rule would push rule 100
  off the cliff.
- **Why it matters even without cookies.** A browser scopes a stored Basic Auth
  credential to the host it was typed on. Two live hostnames = a second challenge
  on the same site, which is indistinguishable from a rejected password.
- `*.pages.dev` is **exempt** — preview deployments must serve themselves, and
  `ship.sh` smoke-tests them.

**Known gap, deliberately not fixed:** bare `https://www.eduwonderlab.com/` (no
path, no query) does **not** canonicalize. A separate Worker,
`eduwonderlab-home-redirect` (repo `~/eduwonderlab-home`), owns the route
`www.eduwonderlab.com/` and never reaches this middleware. Cosmetic: every other
path canonicalizes, so a credential is always entered on the apex. Fixing it is a
change to a different Worker and a different deploy.

## 2. SITE_PASSWORD — HTTP Basic, on teacher surfaces only

The site is **student-open**. There is no site-wide entry password and has not
been one since 2026-06-18. This is the single most misremembered fact about this
system: `SITE_PASSWORD` is *the teacher password*, not a front door.

- Teacher surfaces challenge with `WWW-Authenticate: Basic realm="EduWonderLab"`.
- **Any username** plus the shared password authenticates. The username is
  ignored.
- An authenticated teacher response carries `Cache-Control: private, no-store`.
- Everything else — every lesson, game, tool, and activity — is open, anonymous,
  no prompt.

## 2a. The 24-hour receipt — no second password before tomorrow

A browser forgets a cached Basic credential when it closes, so before this a
teacher retyped `SITE_PASSWORD` every morning, and again after every restart.

On a **successful** Basic sign-in the middleware sets one cookie:

    nt_teacher_day=<expiryMs>.<HMAC-SHA256>; Path=/; Max-Age=86400;
                    HttpOnly; Secure; SameSite=Lax

For the next 24 hours a request carrying it is authorized with no challenge. It
is a *receipt*, not a credential, and the difference is load-bearing:

- **It is only ever issued where the password was just verified.** One call
  site, inside the `supplied === password` branch. Pinned by a detector.
- **Its HMAC key is `SITE_PASSWORD` itself.** There is no second secret to
  configure, and rotating the password revokes every outstanding receipt for
  free.
- **It carries an expiry and a signature and nothing else** — no identity, no
  role, no key material.
- **It expires.** 24 hours, fixed from sign-in, not sliding.
- **HttpOnly**, so no page script can read or mint one.

What it is *not*: a login page, a per-teacher key slot, or an endpoint. Those
were the rolled-back architecture and remain banned — `validate:auth-contract`
fails on `teacher-auth` or `teacher-login` appearing in the middleware.

**There is no sign-out.** A browser that has authenticated will keep replaying
its Basic credential for the session regardless of the cookie, so a "sign out"
control could not keep its promise. To hand a device to students, use the
student surfaces directly (§2b).

## 2b. The Curriculum Hub is the teacher console

`/curriculum/` — the index, **exact match only** — is teacher-only. It has no
student view and no mode toggle: everything that reaches it has already passed
§2, so Teacher view is the only view.

Unauthorized, it does **not** 401. It **302s to `/curriculum/units/`**, the
student lesson picker:

| request for `/curriculum/` | answer |
| --- | --- |
| valid receipt, or correct Basic password | **200**, the console, `private, no-store` |
| anything else | **302** → `/curriculum/units/` |
| `SITE_PASSWORD` unset | **302** → `/curriculum/units/` (fails closed to students) |
| `/curriculum/?teacher=1` | **401** + Basic challenge — the deliberate sign-in |

**Why a redirect and not a 401.** `/curriculum/` is linked as "the Curriculum
Hub" from ~600 pages, including every lesson page and every SCORM launch page a
class opens from Canvas. A password prompt there is a dead end for a student on
a surface with no other way back. The redirect keeps the link working and keeps
the console private. It is the reason `isCurriculumHub()` is a **separate**
predicate from `isTeacherSurface()` (§5): the other two callers of that
predicate read it as "this path 401s".

**Exact match, never a prefix.** `/curriculum/units/`, `/curriculum/arcade/`,
`/curriculum/projects/`, `/curriculum/student-launch/`, `/curriculum/my-progress/`
and every other child stay open to students.

## 3. TEACHER_KEY — the API credential

`/api/*` endpoints carry **their own** policy; the page gate never runs for them.
A teacher-gated endpoint requires the `x-teacher-key` request header to equal
`TEACHER_KEY`. Anonymous → **401**.

This is what the Pacing Planner sends when it saves, and what the cron/CLI
consumers (`scripts/brief.mjs`, `scripts/daily-do-now.mjs`,
`scripts/parent-updates.mjs`, `tools/insight-brief-cli.mjs`) use.

## 4. Teacher Mode PIN — a classroom deterrent, not a secret

Lesson pages carry a client-side Teacher Mode toggle behind a PIN hardcoded in
shipped JavaScript. **It is not `SITE_PASSWORD` and not `TEACHER_KEY`.**

Its threat model is a student clicking around on a projected screen. A determined
student can read it from source, and that is accepted. It exists because the
alternative — putting the teacher's real password into a lesson page a class is
looking at — is worse.

Canonical copy: `engine/core/teacher-mode.js`. The literal is duplicated in five
other files; **the rotation list is in that file's header comment and all six
must rotate together.**

> **Never promote a Teacher Mode PIN to a server credential.** The 2026-08-16
> refactor rotated these PINs onto `TEACHER_KEY_*_ALT` bindings, which made one
> string simultaneously a public classroom deterrent and a server secret in a
> public repo. That collision is closed; do not reopen it.

## Why three gates

They never meet:

| A teacher opens… | is asked for | asked how many times |
| --- | --- | --- |
| a teacher page (`/teacher-tools/`, a planner, an answer key, the hub) | `SITE_PASSWORD` | once a day, by the browser (§2a) |
| Teacher Mode on a student lesson page | the PIN | once, in-page |
| nothing — the Planner saving in the background | `TEACHER_KEY` | never; it is a header |

There is no flow in which a human is prompted twice. Merging them is what
produced a flow nobody could follow.

The Curriculum Hub used to be the exception: it sat in the first row *and* the
second, because a teacher who had already typed `SITE_PASSWORD` to reach a
teacher tool still had to type the PIN to see the hub in Teacher view. §2b
removed the second prompt by removing the hub's student view, not by merging
the gates — the PIN still guards lesson pages and still knows nothing about
`SITE_PASSWORD`.

## 5. Protected routes

Decided by `isTeacherSurface()` in `functions/_lib/teacher-surface.js` — **one
predicate, three callers** (the middleware, the SCORM endpoint, the download
taxonomy). It normalizes first (case, repeated percent-encoding, duplicate
slashes, `..` traversal, backslashes) so two spellings of one path cannot
disagree.

**Gated** — path contains `teacher`, `dashboard`, or `answer-key`, or is prefixed
`/curriculum/plan-notes`, `/curriculum/planning`, or `/admin`.

`isCurriculumHub()` lives in the same file and is **deliberately separate**: it
matches `/curriculum`, `/curriculum/` and `/curriculum/index.html` exactly, and
only the middleware calls it, because the hub redirects where a teacher surface
401s (§2b). Folding it into `isTeacherSurface()` would make the SCORM builder
refuse a URL that never prompts anyone.

**Never gated, and this is load-bearing:**

- `/assets/**` and `/data/**` — shared bundles and curriculum data. Some are
  *named* for teacher features (`curriculum-teacher-workflow.js`) and are fetched
  unconditionally by the public hub. Gating them by filename substring 401s every
  student on `/curriculum/` and breaks the hub.
- `/api/**` — endpoints carry their own policy (§3).
- `/lessons/*/config.json` for `-group1`/`-group2`/`-catchup` — served with
  `smallGroup` and `listenFor` **stripped**, so the student variant is safe
  without a gate.

## 6. Fail-closed

If `SITE_PASSWORD` is unset, a teacher surface returns **503 "Teacher access is
not configured."** — never 200, never public. Public pages stay open in that
state; family-publishing writes fail closed with the teacher surfaces.

A missing credential must never widen access. Pinned by
`tools/auth-contract.test.mjs`.

## 7. Expected browser behavior — identical in Chromium and WebKit

There is **one flow**, not a per-engine flow. The Sec-Fetch-Mode heuristic that
once branched them is deleted and must not return.

| Step | Expected |
| --- | --- |
| `www.eduwonderlab.com/curriculum/planning/` | 308 → apex |
| apex `/curriculum/planning/`, anonymous | **401** + `WWW-Authenticate: Basic realm="EduWonderLab"` |
| same, correct password | **200**, `Cache-Control: private, no-store` |
| refresh | **200** — the browser replays the credential |
| wrong password | **401**, no content |
| `/`, `/curriculum/units/`, any lesson, anonymous | **200**, no prompt |
| `/curriculum/`, anonymous | **302** → `/curriculum/units/`, no prompt |
| `/curriculum/`, with a valid 24-hour receipt | **200**, the teacher console |
| any teacher page, within 24h of a sign-in | **200**, no second prompt |
| `/api/pacing/*` without `x-teacher-key` | **401** |

Enforced end to end by `npm run e2e:auth` in **both engines**.

## 8. Files that implement auth

Changing any of these triggers the full auth QA suite via `qa:fast` coverage, and
`validate:auth-contract` fails until `data/auth-baseline.json` is deliberately
updated.

| File | Role |
| --- | --- |
| `functions/_middleware.js` | canonical host, Basic gate, fail-closed, config stripping |
| `functions/_lib/teacher-surface.js` | the one protected-route predicate, plus `isCurriculumHub()` |
| `functions/_lib/teacher-session.js` | the 24-hour receipt (§2a) |
| `engine/core/teacher-mode.js` | Teacher Mode PIN (canonical copy) |
| `curriculum/planning/planning-store.js` | Planner credential handling (`x-teacher-key`) |
| `functions/api/pacing/[[path]].js` | the Planner's gated endpoint |

Verified by: `tools/validate-auth-contract.mjs`, `tools/auth-contract.test.mjs`,
`functions/canonical-host.test.mjs`, `functions/redirect-fallback.test.mjs`,
`tools/scorm/teacher-surface.test.mjs`, `tools/e2e-auth.mjs`.

## 9. Secrets

**Live and required:** `SITE_PASSWORD` (§2), `TEACHER_KEY` (§3).

**Removed 2026-08-16**, after proving zero consumers in tracked source, `dist/`,
`workers/`, `.github/workflows/`, and the `eduwonderlab-home` repo:
`TEACHER_KEY_NEFT`, `TEACHER_KEY_NEFT_ALT`, `TEACHER_KEY_ALBA`,
`TEACHER_KEY_ALBA_ALT`. They existed only for the reverted session architecture.

Secrets bind at **deploy**, not at set time — a newly set secret is not live
until the next build.

## 10. Cloudflare Access is not a fourth gate

The student site is open. Cloudflare Access on `eduwonderlab.com` /
`www.eduwonderlab.com` with no path restriction intercepts the live lesson
iframe that every Canvas SCORM package launches. That is a classroom outage,
not extra security.

Teacher/admin protection stays on `SITE_PASSWORD` and `TEACHER_KEY` (§2–§3).
Access may wrap teacher path prefixes as defense in depth. It must not wrap
student lessons, `/assets`, `/data`, or public student APIs.

See [`docs/cloudflare-access.md`](docs/cloudflare-access.md). Check with
`npm run diagnose:production-access`.

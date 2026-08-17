# SCORM packaging — architecture, contract and limits

What a teacher downloads from the Curriculum Hub, what is inside it, what the
LMS actually receives, and what this design deliberately does not do.

## The pipeline

```
curriculum activity (live on eduwonderlab.com)
        │
        │  target: lesson id "3-4" | site path "/ratio-color-mixer/" | full URL
        ▼
functions/_lib/scorm.js  ── resolveTarget() → { lessonUrl, id, origin }
        │                    buildScormFiles() → { imsmanifest.xml, index.html }
        ▼
assets/lib/zip-store.js  ── zipStore() → stored (uncompressed) .zip bytes
        │
        ├── GET /api/scorm?activity=…            one package
        ├── GET /api/scorm-bundle?activities=…   one zip of packages (unit pack)
        └── node tools/scorm/build-scorm.mjs     same code, from the CLI
        ▼
teacher uploads the .zip to Canvas as a SCORM assignment
        ▼
LMS extracts it and launches index.html (the SCO) in a frame
        ▼
the SCO finds window.API, initializes, and iframes the LIVE activity
```

**There is one SCO builder**: `sco()` in `functions/_lib/scorm.js`. The endpoints
and the CLI all go through it. `tools/scorm/template/` used to hold a second
copy; it was removed, because keeping two SCOs in step by grepping for invariant
strings only ever pins the invariants someone thought to write down.

## SCORM version

**SCORM 1.2**, and deliberately not SCORM 2004. The manifest declares
`<schemaversion>1.2</schemaversion>` with the `imscp_rootv1p1p2` and
`adlcp_rootv1p2` namespaces, and the runtime uses the `LMS*` API on
`window.API`. Nothing here mixes 2004 conventions (`API_1484_11`,
`Initialize`/`Terminate`, `cmi.completion_status` + `cmi.success_status`).

1.2 is the right target for this site: Canvas imports it, every other major LMS
still accepts it, and the sequencing and objectives model 2004 adds is of no use
to a single-SCO package. The one real cost is the data-model size limit — see
**Persistence** below. Do not migrate casually; the version is a contract with
every already-uploaded assignment.

## What is in a package

Two files. That is the whole archive.

```
imsmanifest.xml    the SCORM manifest: one organization, one item, one SCO
index.html         the SCO — a wrapper that iframes the live activity
```

## Self-containment: what this design does NOT do

**A package is not self-contained, and is not intended to be.** The SCO iframes
`https://eduwonderlab.com/…`; every HTML page, script, stylesheet, image,
visual-model dependency and data file comes from the live site at launch time.

That is a deliberate trade, and it is the reason the system is maintainable at
this scale: **editing a lesson updates every Canvas assignment that uses it**,
with no re-export and no re-upload across ~277 packages. The alternative —
bundling each lesson's assets — means every content edit silently strands every
package a teacher already uploaded.

The consequences are real and must not be papered over:

- **Students need an internet connection**, and access to eduwonderlab.com.
- **A network block or a site outage breaks the assignment**, where a
  self-contained package would still run.
- **Cloudflare Access in front of eduwonderlab.com breaks Canvas SCORM.** The
  LMS hosts only the two-file wrapper; the lesson iframe is a normal browser
  GET of the live site. If that GET is intercepted, the student sees an Access
  sign-in (or a blank frame), not the lesson. Direct-link Access and Canvas
  SCORM Access are the same origin.
- Anything the site serves under authentication is not reachable from inside a
  package (this is also why no teacher-only material can leak into one).
- Offline/air-gapped LMS installs cannot use these packages at all.

`npm run validate:scorm-self-contained` holds this contract: representative
packages stay two-file wrappers of the allowlisted host, and a blocked-origin
browser probe fails the lesson on purpose so a 200 from production cannot be
misread as self-containment.

If a genuinely self-contained package is ever required (a district policy that
forbids iframed external content is the realistic trigger), that is a **second
delivery format**, not a change to this one — see `docs/canvas-bridge.md` for
the related Common Cartridge path and its own constraints.

## LMS runtime contract

| Stage         | What the SCO does                                                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API discovery | Walks up to 12 parent frames, then `window.opener`. Every window access is individually try/caught — in Canvas the SCO is commonly framed cross-origin, where reading `win.API` throws.                                                                          |
| No API found  | Logs one explanatory line, launches the activity anyway, reports nothing. A lesson outside an LMS is a supported mode, not an error state.                                                                                                                       |
| Initialize    | `LMSInitialize("")` exactly once, before any read or write. A `"false"` return is final: the session is abandoned rather than producing a stream of failed writes that look like reporting.                                                                      |
| First read    | `cmi.core.lesson_status` is **read before it is written**. A fresh attempt is set to `incomplete`; an existing `passed`/`completed`/`failed` is left alone.                                                                                                      |
| Identity      | `cmi.core.student_name` (normalized from `"Last, First"`) and `cmi.core.student_id` are read and passed to the activity as `?sn=`/`?si=`, so a student inside Canvas is auto-identified. They are never written back.                                            |
| Scoring       | On a `score` message from the activity: `score.min=0`, `score.max=100`, `score.raw` as a **high-water mark**, and `lesson_status` = `passed` at or above the mastery score (70, matching `<adlcp:masteryscore>`) else `completed`. `passed` is never downgraded. |
| State         | `cmi.suspend_data` + `cmi.core.lesson_location`, coalesced to at most one write per 3 s, flushed on the hidden transition and at exit.                                                                                                                           |
| Termination   | Flush → `LMSSetValue("cmi.core.session_time", …)` → `LMSCommit` → `LMSFinish`, once. No write ever follows `LMSFinish`.                                                                                                                                          |
| Errors        | Every call's return value is checked and `LMSGetLastError` / `GetErrorString` / `GetDiagnostic` recorded. After three consecutive failures the student sees a plain-language notice; the error code stays in the diagnostics.                                    |

### Message contract with the activity

Both directions are origin-checked. `assets/canvas-bridge.js` is the lesson side.

```
lesson → SCO   { source: "neft-lesson", type: "ready" }
lesson → SCO   { source: "neft-lesson", type: "score",   percent }
lesson → SCO   { source: "neft-lesson", type: "state",   state, location }
SCO → lesson   { source: "neft-sco",    type: "restore", state, location }
```

## Persistence and the 4096-character ceiling

SCORM 1.2 caps `cmi.suspend_data` at **4096 characters** (`CMIString4096`) and
`cmi.core.lesson_location` at **255**. These are not advisory: LMS behaviour past
them is undefined — some truncate silently, some reject the write.

The rules here:

- The **lesson side** (`compactForScorm` in `canvas-bridge.js`) trims toward a
  4000-character budget, dropping `custom`, then `dragDrop`, then `navigation`.
  Typed answers are last. If even those do not fit it sends nothing, because a
  half-record restores as wrong answers, which is worse than an empty resume.
- The **SCO side** refuses any payload over 4096 rather than truncating, and
  records why in the diagnostics.
- `lesson_location` is capped at 255 characters.

**Two persistence systems coexist and must not be confused.** The activity's own
save/resume (localStorage, `shared/save-resume/save-resume-engine.js`) is
authoritative for this browser; `suspend_data` is what follows the student across
devices. On restore, local work wins: the SCO's stored state is applied **only**
when this browser holds no work, so returning to a machine mid-lesson can never
wipe answers that are on screen.

## Completion and scoring semantics

- `not attempted` → the LMS's own initial state; the SCO never writes it.
- `incomplete` → written once, on the first launch of a fresh attempt.
- `completed` → the activity reported a score below mastery.
- `passed` → the activity reported a score at or above 70.
- `failed` → **never written.** Nothing in this curriculum is designed to fail a
  student on an automated threshold.

Only activities that emit a score message produce a score. Open-response,
drawing, speaking and self-check work is not auto-graded, and no numeric score is
invented for it — those activities report completion and nothing else. A lesson
that merely loaded is never marked complete.

## The teacher boundary

`/api/scorm` builds packages only for **student** surfaces. A teacher-only
target (`/teacher-tools/`, teacher notes, answer keys, dashboards, Plan Notes,
`/admin`) is refused with **403** before any package is created.

This was never a content leak — the launch URL 401s either way — but the
endpoint should not manufacture an assignment that opens a password prompt for a
class.

The rules live in **one** place, `functions/_lib/teacher-surface.js`, imported by:

- `functions/_middleware.js` — the HTTP Basic Auth gate, the definition of record
- `functions/_lib/scorm.js` — the generation boundary
- `scripts/lib/download-taxonomy.mjs` — the bulk downloader

It previously existed three times, once inline in the middleware and once as a
comment-labelled "mirror". A duplicated security predicate fails silently in the
dangerous direction: the stale copy does not throw, it answers "student".

The check runs on a **normalized** path — percent-decoded (repeatedly, so
`%2574` is caught), backslashes folded, query and fragment stripped, duplicate
slashes collapsed, `.`/`..` resolved, lowercased — so every spelling of a
teacher path is judged the same as the plain one. The refusal message says what
happened and nothing about how the gate decides.

## Gates

| Command                                      | What it proves                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run validate:scorm`                     | Source-level: the SCO still contains all 20 hardening guards, the CLI still imports the shared builder and does not shell out, the endpoint still probes the target. Instant; catches a deletion.                                                                                                                                                                                              |
| `npm run validate:scorm:fleet`               | Builds **every** SCORM-capable package, opens each archive through a real ZIP parser, CRC-checks every entry, parses the manifest, and asserts the launch file and every referenced file exist, identifiers and download names are unique fleet-wide, no path can escape extraction, no teacher-only material is packaged, and two builds are byte-identical. Self-tests every detector first. |
| `npm test` → `scorm-lifecycle.test.mjs`      | Behavioural: boots the real generated SCO against a mock SCORM 1.2 LMS in jsdom and asserts the call **order** and resulting `cmi` values across launch, scoring, suspend/resume, relaunch, termination and five failure modes.                                                                                                                                                                |
| `npm test` → `scorm-self-contained.test.mjs` | Static: representative ZIPs are two files; a third-party URL in the SCO fails; the live lesson host is allowlisted.                                                                                                                                                                                                                                                                            |
| `npm run validate:scorm-self-contained`      | Architecture + blocked-origin probe: the SCO iframes eduwonderlab.com, and with that origin aborted the lesson does not render. Prints PRODUCTION-DEPENDENT.                                                                                                                                                                                                                                   |
| `npm run validate:canvas-coverage`           | Every assignable surface has a grade path and a unique package slug.                                                                                                                                                                                                                                                                                                                           |

`tools/scorm/mock-lms.mjs` is **test-only** and never packaged; the fleet gate
fails if the string `mock-lms` appears in any archive.

## Status

- SCORM runtime/package hardening: **production-ready**
- Canvas interoperability: **awaiting real-course acceptance testing** — run
  [`docs/scorm-canvas-acceptance.md`](scorm-canvas-acceptance.md) in a real Canvas
  course. Nothing in this repo can change that second line.

## Known limitations

- **Not verified against a live Canvas instance in this pass.** Everything above
  is proven by package-level validation and a mock-LMS runtime suite. Import,
  launch and gradebook behaviour in a real Canvas course still need a human with
  a course shell.
- **Not verified against any other LMS.** The runtime is written to the 1.2
  standard and contains no Canvas-specific URLs, frame assumptions or origin
  checks, so it _should_ port — but "standards-compliant" is a claim about the
  code, not a test result.
- **Packages depend on the live site** (see above). Nothing makes them work
  offline.
- **Resume across devices requires the activity to emit state.** Activities
  without a save/resume engine report scores only.

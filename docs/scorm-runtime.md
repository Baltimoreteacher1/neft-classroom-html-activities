# EduWonderLab SCORM Runtime v2

How an EduWonderLab lesson becomes a Canvas assignment, and what the wrapper
around it does once a student clicks it.

This document is the contract. A future agent should not have to rediscover any
of it by reading the generator.

---

## 1. The teacher workflow (all manual, by design)

```
EduWonderLab  →  Download Canvas SCORM  →  upload .zip to Canvas
              →  configure the assignment  →  publish  →  student clicks it
```

EduWonderLab's job ends at "a .zip you can trust". Canvas is where you upload
and publish. There is **no Canvas API integration** here — no OAuth, no
automatic upload, no automatic assignment creation, no automatic publishing —
and that is a deliberate scope boundary, not a missing feature.

### What you do, step by step

1. In EduWonderLab, find the lesson/activity and click **Download Canvas
   SCORM**. A `.zip` downloads with a name that tells you what it is.
2. In Canvas, open the course's SCORM area and upload the `.zip`
   **without unzipping it**.
3. Use the assignment Canvas creates for the uploaded package.
4. Set points and availability as you normally would.
5. Publish the assignment.
6. Open it once in **Student View** to confirm the lesson launches.

Canvas's SCORM UI differs by institution and by which SCORM tool the account
has enabled, so only the stable parts are described above. Steps 2–5 are
whatever your Canvas shows; nothing in this repo can substantiate more detail
than that.

---

## 2. Architecture: a live launcher, not a frozen copy

```
Canvas assignment
  └── SCORM 1.2 package (.zip — 2 files, ~37 KB)
        ├── imsmanifest.xml     ← identity, title, mastery score, metadata
        └── index.html          ← the Runtime v2 shell
              └── <iframe> ──→ https://eduwonderlab.com/lessons/1-1/?lms=scorm&embed=1
                                 ↑ THE LIVE LESSON
```

The package contains **no lesson content**. It is a launcher.

That is the single most valuable property of this design: improve a lesson on
EduWonderLab tomorrow and every already-uploaded Canvas assignment serves the
improved lesson, with no re-upload. The alternative — bundling the lesson —
produces a canonical live lesson plus a stale duplicate frozen inside Canvas,
diverging from the day it is uploaded.

The cost is an explicit production dependency: a student needs to reach
`eduwonderlab.com`. `npm run validate:scorm-self-contained` exists to hold that
contract honestly and prints `VERDICT: PRODUCTION-DEPENDENT`. **Do not rename
that gate or its verdict** — the live dependency is intentional, and calling it
self-contained would be a lie the next agent would act on.

### Ownership boundary

| The **wrapper** owns                      | The **lesson** owns              |
| ----------------------------------------- | -------------------------------- |
| LMS discovery and initialization          | the mathematics                  |
| the loading state                         | the instructional sequence       |
| launching the live lesson                 | interactions and feedback        |
| the lesson-ready handshake                | scaffolds and supports           |
| retries, timeouts, failure classification | completion criteria              |
| forwarding progress / score / completion  | _what_ the score is              |
| resume plumbing                           | _what_ the resume state contains |
| iframe sizing, diagnostics, safe shutdown | lesson content                   |

The wrapper never decides whether a student is done. It translates what the
lesson says into SCORM 1.2 fields.

---

## 3. Files

| File                              | Role                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `functions/_lib/scorm-sco.js`     | **The Runtime v2 shell.** Versions, error codes, and the SCO document.            |
| `functions/_lib/scorm.js`         | Target resolution, manifest, pre-flight, filenames, `buildScormFiles()`.          |
| `functions/_lib/scorm-catalog.js` | Canonical titles + route existence, read from `plan-vocab.js`.                    |
| `functions/api/scorm.js`          | On-demand download endpoint.                                                      |
| `functions/api/scorm-probe.js`    | The reachability contract the wrapper uses to detect Cloudflare Access.           |
| `functions/api/scorm-bundle.js`   | Bulk download (many packages in one zip).                                         |
| `assets/canvas-bridge.js`         | **The lesson side of the protocol.** Live — improvements reach uploaded packages. |
| `tools/scorm/build-scorm.mjs`     | CLI build of one package.                                                         |
| `tools/scorm/build-all-scorm.mjs` | Bulk build (all lessons, or one unit).                                            |
| `tools/scorm/mock-lms.mjs`        | Test-only SCORM 1.2 LMS. Never packaged.                                          |

There is exactly **one** SCO implementation. `tools/scorm/template/` was a
second, hand-maintained copy kept in step by a list of invariant strings; every
hardening fix had to land twice, and a package downloaded from the site could
differ materially from one built by the script. It is gone. Keep it gone.

---

## 4. Versions and the compatibility contract

```
SCORM_RUNTIME_VERSION  = 2   // the shell itself
SCORM_PROTOCOL_VERSION = 2   // the lesson ↔ wrapper message shapes
```

They are separate because the runtime can improve without the protocol moving,
and a v2 wrapper must keep talking to a lesson that still speaks v1.

- A message with **no `protocol` field is protocol 1**, and Runtime v2 supports
  it in full. `ready`, `score` and `state` are unchanged from v1.
- A **v1 wrapper receiving a v2-only message** (`height`, `heartbeat`,
  `progress`, `error`) ignores it — its handler switches on the types it knows
  and falls through. So live-side protocol additions are safe to deploy ahead of
  the packages that understand them.
- A message whose `protocol` is **greater** than the wrapper understands is
  handled on its v1 subset and recorded in diagnostics, never dropped wholesale.
  A newer lesson must not break an older uploaded package.

Bump `SCORM_RUNTIME_VERSION` when the shell changes in a way that requires a
re-download. Bump `SCORM_PROTOCOL_VERSION` only when a message shape changes.

---

## 5. The message protocol

All messages carry `source`, and the wrapper **validates `event.origin` before
anything else**. A frame that is not the lesson origin can never write a grade.

### lesson → wrapper

| type        | payload                             | since | effect                                                   |
| ----------- | ----------------------------------- | ----- | -------------------------------------------------------- |
| `ready`     | —                                   | v1    | handshake complete; reveal the lesson, send resume state |
| `score`     | `percent` (finite number)           | v1    | high-water score + completion status → SCORM             |
| `state`     | `state` (string ≤ 4000), `location` | v1    | coalesced write to `cmi.suspend_data`                    |
| `progress`  | `percent`                           | v2    | diagnostics only; no LMS write                           |
| `location`  | `location` (string)                 | v2    | `cmi.core.lesson_location`                               |
| `height`    | `px` (200–20000)                    | v2    | validated, recorded, applied only at top level           |
| `heartbeat` | —                                   | v2    | proof of life; reveals a lesson that never handshook     |
| `error`     | `detail`                            | v2    | diagnostics only                                         |

### wrapper → lesson (posted to the lesson origin, never `*`)

| type      | payload                                    | effect                                                 |
| --------- | ------------------------------------------ | ------------------------------------------------------ |
| `restore` | `state`, `location`, `protocol`, `runtime` | resume; the lesson only applies it to an empty session |
| `hello`   | `protocol`, `runtime`                      | tells the lesson which wrapper it is inside            |

**Rejected safely:** anything from another origin, a non-object payload, a
`source` that is not `neft-lesson`, an unlisted `type`, a `score` without a
finite `percent`, a `state` that is not a string, a height outside bounds. Every
one of these is covered by a scenario in `scorm-runtime.test.mjs`.

`assets/canvas-bridge.js` posts to the parent with `"*"` because a SCO served
from an arbitrary LMS host has no origin the lesson can know in advance. The
security boundary is therefore enforced on the **receiving** side, which is the
side that can write to the gradebook.

---

## 6. Canvas LMS lifecycle

**Discovery.** `window.API` is found by walking parent frames then the opener,
with every window access wrapped — in Canvas the SCO is commonly framed
cross-origin, where reading `win.API` throws `SecurityError`, and an uncaught
throw would abort the shell before the lesson ever launched.

**Canvas can be late.** The search retries on a bounded backoff
(`0, 250, 750, 1500, 3000, 6000 ms`). A one-shot search at boot is how a lesson
reports a perfect score into nothing.

**Event queue.** Anything the lesson says before the LMS session is live is
queued — keyed by kind, **last-wins**, flushed in the order
`state → score → complete` — so a burst of activity becomes one write and the
final committed record is the one the student ended on. A repeated identical
completion is a no-op, not another commit.

**Initialization** happens exactly once. A refused `LMSInitialize` is final
(SCORM 1.2 has no "already initialized" code to forgive) and is recorded as
`EWL-SCORM-LMS`; the lesson keeps running.

**Every call is checked.** SCORM 1.2 signals failure by _return value_, not by
throwing, so an unchecked call is indistinguishable from a successful one —
that is how a lesson appears to save all period and lands nothing. Failures are
counted and read back through `LMSGetLastError` / `GetErrorString` /
`GetDiagnostic`. After three consecutive failures a student sees a calm notice
saying their work may not be reaching the course — never an error code.

**Score and completion.**

```
lesson says: percent 84
wrapper writes: score.min=0  score.max=100  score.raw=84
                lesson_status = "passed"   (>= 70) else "completed"
```

`score.raw` is a **high-water mark**, and `passed` is never downgraded — SCORM
1.2 has no ordering rule, so an LMS keeps whatever was written last, and a
student reviewing a finished lesson would otherwise overwrite a 100.

**Status is read before it is written.** Blindly stamping `incomplete` on every
launch erases a completed attempt the moment a student reopens the assignment.

**Shutdown** flushes pending state, drains the queue, writes
`cmi.core.session_time`, commits, then `LMSFinish`. `pagehide` and the hidden
transition both flush first; `unload` is the last line of defence, not the
strategy.

---

## 7. Loading, retry, recovery

The Canvas assignment never begins as a blank iframe.

1. The shell paints **"Loading your math lesson…"** immediately —
   `role="status" aria-live="polite"`, reduced-motion aware. The lesson request
   starts at the same moment; nothing is delayed to show a spinner.
2. After 6s a secondary line appears: **"Still loading. This can take a few
   seconds."**
3. The lesson is revealed on `LESSON_READY`, or on a heartbeat.
4. If the iframe **rendered** but never spoke within 12s, the lesson is shown
   anyway in **degraded mode** — a standalone activity without the bridge is
   working perfectly, and putting an error card over a good lesson is the worst
   thing this shell could do. Resume relay is unavailable in that mode.
5. If the iframe **never loaded**, the shell retries: `+2s`, then `+6s`. Two
   retries, then it stops. Retries cache-bust; the first attempt does not.
6. After that, the failure is classified and the student sees a recovery state.

### The failure state

> **We couldn't load your lesson.**
> Check your internet connection, then try again. If it keeps happening, tell
> your teacher.
> **[ Try Again ]**
> Reference: `EWL-SCORM-TIMEOUT`

**Try Again** resets the attempt budget. A student never sees a blank frame, a
Cloudflare login page, a stack trace, an HTTP status, a SCORM message, JSON, or
console output. The reference code is the only opaque token, and it is the one
thing that lets a teacher say _which_ failure this was.

### Reference codes

| Code                | Means                                 | What a developer should check                                                                    |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `EWL-SCORM-ACCESS`  | origin reachable but gated            | **Cloudflare Access is in front of the student site.** Run `npm run diagnose:production-access`. |
| `EWL-SCORM-LOAD`    | origin unreachable                    | network, DNS, or a Pages outage                                                                  |
| `EWL-SCORM-TIMEOUT` | origin healthy, lesson never rendered | the lesson itself — `npm run validate:lesson-boot`                                               |
| `EWL-SCORM-LMS`     | the LMS refused the SCORM session     | Canvas-side; the lesson still runs                                                               |

### How Cloudflare Access is detected

A hostname-wide Access app once broke every Canvas SCORM assignment in
production, and it presented to a student as a blank iframe — indistinguishable
from an outage. The wrapper now discriminates:

1. `fetch(<origin>/api/scorm-probe)`. It answers `{"ok":true,…}` with permissive
   CORS. If it resolves, the origin is **public and healthy** → `TIMEOUT`.
2. If that is blocked or rewritten, re-probe the host with
   `{mode:"no-cors", redirect:"manual"}`. If it **resolves**, the host is up but
   something is intercepting → `ACCESS` (an `opaqueredirect` is the Access
   sign-in bounce). If it **rejects**, the host is unreachable → `LOAD`.

The student message is identical in every case. Only the reference code and the
diagnostics differ. See [`cloudflare-access.md`](cloudflare-access.md).

---

## 7a. Engine lessons and the Canvas bridge

Every EduWonderLab lesson family now speaks the same protocol. It did not
always, and the difference was invisible to every gate.

**What was already working.** An engine lesson has always reported its SCORE.
`engine/core/app.js` fires once when *every* phase reaches `completed` →
`grade-emit.js` `completeLesson()` → `canvas-code.js` `showCanvasCode()` →
`assets/canvas-code-ui.js`, which posts `{type:"score", percent}` to the
wrapper. `percent` is `totalCorrect / totalAttempts`. That is the lesson's own
instructional contract and this integration does not touch it.

**What was missing.** Engine lessons never loaded `assets/canvas-bridge.js`.
The build-time injector (`tools/inject-canvas-bridge.js`) targets the activity
catalog plus every `lessons/<id>/homework.html`; `lessons/<id>/index.html` was
never in that set. So an engine lesson sent no `ready` handshake — the wrapper
fell back to its degraded reveal — and, more seriously, **nothing was ever
written to `cmi.suspend_data` or `cmi.core.lesson_location`**. A student who
closed a Canvas assignment half-way through and came back started over, on any
device, with no warning.

**The fix, in one shared place.** `engine/core/scorm-bridge.js` exports
`ensureCanvasBridge(config)`, called from the boot every engine lesson already
passes through:

| Boot | Lessons | Where |
| --- | --- | --- |
| `bootLesson` | 55 standard | `engine/core/lesson-renderer.js` |
| `bootFlagship` | 30 flagship | `engine/templates/flagship/flagship.js` |
| `bootSmallGroup` | 204 small-group | `engine/core/small-group-renderer.js` |

No per-lesson script tag, no second list of SCORM-capable lesson ids. A new
lesson inherits the behaviour by existing.

`bootFlagship` calls it **directly** rather than relying on its delegation to
`bootLesson` — that delegation happens inside `showMissionIntro`'s callback,
i.e. only after the student presses Start, so a flagship lesson would have sat
on its story screen past the wrapper's handshake timeout.

**Detection and cost.** The hook is a no-op unless `?lms=scorm`, using the same
predicate `canvas-bridge.js` itself uses. A normal lesson launch, a hub launch,
a teacher preview and every print/export path download nothing extra and behave
byte-identically to before. Verified in a browser: on a direct launch there are
**zero** requests for `canvas-bridge.js`.

**No duplicate scoring.** The bridge is loaded with two options:

- `manual: true` — disables its save/resume auto-watcher, which would otherwise
  post a *second* score. Its percent is "how much of the lesson was touched",
  a different quantity from the lesson's percent correct, and two sources would
  race. This also removes a 1.5s `setInterval`.
- `finishButton: false` — suppresses its floating "I'm finished" button, which
  posts a hardcoded `100`. On a lesson with a real completion contract that
  would both cover the UI and let a student send a perfect score without doing
  the work.

Both default to the old behaviour, so the 109 catalog activities and 84
homework pages are untouched.

**What Canvas receives from an engine lesson now**

| Signal | Source | When |
| --- | --- | --- |
| `ready` (protocol 2) | canvas-bridge | on lesson boot |
| `cmi.suspend_data` | canvas-bridge ← `NeftSaveResume` | on activity, coalesced |
| `cmi.core.lesson_location` | the save/resume phase name | with state |
| `cmi.core.score.raw` + `lesson_status` | **the engine**, at full phase completion | once |
| `height`, `heartbeat` | canvas-bridge | on change / activity |

A lesson a student has started but not finished now reports `incomplete` with
real resume state, instead of `incomplete` with nothing.

**Gates.** `tools/scorm/engine-lesson-passback.test.mjs` drives the SCO against
the mock LMS and asserts `suspend_data`/`lesson_location` actually land, that a
duplicate completion does not write twice, and that the working families are
untouched. `validate:scorm-runtime` derives every engine lesson from
`data/curriculum-manifest.json` — never a hardcoded list — and fails if any of
them stops booting through a shared renderer, or if a renderer stops calling
the hook.

## 8. Resume: who owns what

Three stores exist. Without an explicit split they become three competing
sources of truth, and a student's work goes missing in whichever direction the
last write happened to run.

| Store                                                                                  | Owns                                                 | Scope                                                          |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **Canvas SCORM state** (`cmi.suspend_data`, `cmi.core.lesson_location`, status, score) | the ASSIGNMENT's portable resume point and its grade | follows the student across devices, keyed to the Canvas roster |
| **Browser localStorage** (`NeftSaveResume`)                                            | the full, fast, detailed working state               | this browser only                                              |
| **EduWonderLab `/api/progress`**                                                       | optional cross-device detail and teacher reporting   | best-effort                                                    |

**Conflict rule, and it is one sentence:** local work wins. The lesson applies a
`restore` **only into an empty session** — if this browser already holds
answers, they are newer than whatever the LMS was last told, and overwriting
them would destroy work the student can see on screen.

**SCORM 1.2 limits are respected, never silently.** `cmi.suspend_data` is capped
at 4096 characters and `cmi.core.lesson_location` at 255. The lesson compacts
its own payload to a 4000-character budget by dropping the least resume-critical
slices in order (`custom`, `dragDrop`, `navigation`), and persists **nothing**
rather than a half-record — a lesson that resumes _wrong_ is worse than one that
resumes empty. The wrapper refuses an oversize write and records why. Detailed
student work stays in EduWonderLab storage, where it belongs.

Writes are coalesced on a 3-second timer: a lesson emits state on every answered
item, and hammering `LMSCommit` per keystroke is what makes an LMS throttle.

**`/api/progress` is not load-bearing.** If it fails after the lesson has
loaded, the student keeps working. The shell never tears down a live lesson for
a failed background fetch, and never reports a successful server save that did
not happen.

---

## 9. Iframe sizing, Chromebook, accessibility

The frame fills the SCO viewport using `height: 100dvh` with `100vh` as the
fallback, so a Chromebook or tablet browser toolbar cannot crop the lesson.

`LESSON_HEIGHT` is validated (integer, 200–20000) and recorded always, but
**applied only when the SCO document is the top-level window** — direct launch
or preview. Inside Canvas the SCO's own frame is a fixed size the page cannot
change; growing the inner iframe there only creates a second scrollbar. Filling
the frame and letting the lesson scroll internally is the correct behaviour in
Canvas, and that is what happens.

Accessibility of the shell (the lesson has its own coverage):

- loading is `role="status" aria-live="polite"`; failure is `role="alert"`
- **Try Again** is a real `<button>` with a text label and a `:focus-visible`
  ring, and receives focus when the failure state appears
- the lesson iframe carries a `title`; the document carries `lang="en"`
- the spinner respects `prefers-reduced-motion`
- the shell adds no focus trap and no keyboard interception — nothing stands
  between the student and the lesson once it is ready
- a dark-mode palette is defined so the shell does not flash white

---

## 10. Package naming and titles

```
<activity-id>_<Short_Title>[_SaveCodes]_SCORM.zip
```

```
1-1_Math_is_Mine_SCORM.zip
5-1_Determine_the_Area_of_Parallelograms_and_Rho_SCORM.zip
1-1-homework_Homework_SCORM.zip
ratio-color-mixer_Ratio_Paint_Mixer_Lab_SCORM.zip
```

Names carry no brand prefix. Every package would repeat the same one, so it
only pushed the id and title — the part a teacher scans in Canvas's file
picker — further right. The manifest `<title>` Canvas displays is still
branded; only the filename changed, and the SCORM identifier never depended
on it.

No random names, no hash as the primary name, no spaces, and none of the
characters Windows rejects (`\ / : * ? " < > |`). Deterministic: the same id
always produces the same filename, in **every** builder.

The short title is derived from the id inside `packageFileName()` and from
nothing a caller passes in. Three builders write packages and one of them copies
files _by name_; a filename that varied with an optional title argument would
reproduce the ENOENT class of bug that once broke all 84 homework packages.

**Canvas titles** come from the canonical curriculum (`plan-vocab.js`, generated
from the curriculum manifest) — never from a second copy of the titles, because
a second copy is how a renamed lesson keeps its old name in Canvas forever:

```
EduWonderLab — Lesson 1-1: Math is Mine
EduWonderLab — Lesson 1-1 Homework
EduWonderLab — Ratio Paint Mixer Lab
```

Routes the compiled vocabulary does not cover (the arcade/game entries live in
`tools/scorm/activity-catalog.json`, which a Pages Function cannot read at
runtime) get a **humanized** title from the route — `Practice Arcade (Unit 3)` —
never a raw slug.

SCORM identifiers stay machine-oriented (`NEFT-<id>`) and are unaffected by any
of this, so renaming a download can never re-key an existing Canvas assignment.

### Embedded metadata

Non-sensitive, and enough to diagnose a package found in a Canvas course months
later: runtime version, protocol version, activity id, live target URL,
generation date (day-granular), and generator. Never a secret, a teacher key, or
anything about a student.

Day granularity is deliberate: it keeps two builds on the same day
byte-identical, which is what `validate:scorm:fleet` asserts and what makes a
re-download comparable to the file already uploaded.

---

## 11. Pre-flight — a broken package is never downloaded

A broken package is worse than a refused one: a teacher only finds out after
uploading it, configuring an assignment, and publishing it to a class.

Before any zip is returned, `preflight()` asserts:

- `imsmanifest.xml` and the SCO entry both exist
- the manifest declares SCORM 1.2, and its identifier matches the package id
- the launch `href` and every `<file href>` resolve to real entries in the zip
- the Runtime v2 wrapper code is present
- the SCO targets the resolved lesson URL
- every absolute URL is an allowed production host — no localhost, no `:port`,
  no `.pages.dev`, no `.workers.dev`, no third-party origin
- no `TEACHER_KEY` / `SITE_PASSWORD` / `x-teacher-key` appears anywhere

And before that, `buildScormFiles()` refuses a **lesson id the curriculum has
never heard of** — `9-9` is a typo, and packaging it would hand a teacher a zip
that iframes a 404. Non-lesson activity paths are reported _unknown_, never
missing: a pre-flight that fails on everything it has not heard of stops
teachers shipping working packages.

`/api/scorm` additionally probes the live target and blocks on a definitive 404,
failing **open** on auth gates, 405s, 5xx and timeouts so a hiccup never blocks
a legitimate download.

A refusal is an HTML page with the reason and a way back — never a corrupt zip.

---

## 12. Building packages

```bash
npm run scorm:build -- 1-1                    # one lesson
npm run scorm:build -- /lessons/1-1/homework.html
npm run scorm:build -- /ratio-color-mixer/
npm run scorm:build -- 1-1 "Custom Title" --codes   # save-codes mode
npm run scorm:build:unit -- 6                 # every lesson in unit 6
npm run scorm:build:all                       # the whole course
```

Output: `scorm-packages/`, plus `UPLOAD-CHECKLIST.md` for the bulk builds.

Because every package targets the live lesson, a rebuild is only needed when a
lesson is **added or removed**, or when the runtime version changes. Editing
lesson content never requires one.

The teacher UI reaches the same code through `/api/scorm`, so a package
downloaded from the site and one built by the CLI are byte-identical on the same
day.

---

## 13. Validation

| Command                                     | Holds                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run validate:scorm-runtime`            | **The Runtime v2 contract.** One shell across all 7 package families, version coherence across wrapper/bridge/probe, pre-flight actually refuses what it claims, filenames stable + unique + cross-platform safe, canonical titles, byte-determinism. Self-tests every detector against deliberately broken inputs first. |
| `npm run validate:scorm`                    | 38 source-level hardening invariants in the SCO + 7 endpoint invariants. Greps: proves a line exists, never that it behaves.                                                                                                                                                                                              |
| `npm run validate:scorm:fleet`              | All 554 buildable packages open, CRC-check, parse, and have unique ids and names.                                                                                                                                                                                                                                         |
| `npm run validate:scorm-self-contained`     | The packages are LIVE wrappers. Prints `VERDICT: PRODUCTION-DEPENDENT`. **Do not rename.**                                                                                                                                                                                                                                |
| `node tools/scorm/scorm-lifecycle.test.mjs` | 21 checks: the SCORM 1.2 data model, call order, resume, relaunch.                                                                                                                                                                                                                                                        |
| `node tools/scorm/scorm-runtime.test.mjs`   | 19 scenarios: loading, slow LMS, slow lesson, retry, permanent failure, Access, resume, duplicate completion, hostile messages, protocol compatibility, a11y.                                                                                                                                                             |
| `npm run diagnose:production-access`        | Against the live origin: student runtime public, teacher surfaces protected. Not a deploy gate.                                                                                                                                                                                                                           |

Both jsdom suites run the **shipped** SCO — the same bytes `/api/scorm` serves
— under `?ewlfast=1`, which compresses the runtime's own timeouts 100× so real
timer paths execute in about a second. Nothing in them re-implements the
runtime.

`?scormdebug=1` on a SCO URL opens a read-only diagnostics panel;
`window.EduWonderLabScorm()` returns the live state object including an event
log (runtime started, LMS found, LMS initialized, lesson requested, lesson
ready, timeout, retry, queue flushed, completion sent, commit ok/failed). No
third-party analytics, and nothing personal is collected.

---

## 14. Do these packages need re-uploading?

**Wrapper-side** improvements live in the `.zip` and need a fresh download:
the loading state, the failure/retry UI, Cloudflare Access classification,
retried LMS discovery, the event queue, duplicate-completion suppression,
message-type allow-listing, height validation, the new filenames and canonical
titles, embedded metadata, `100dvh` sizing.

**Live-side** improvements reach every already-uploaded package automatically,
because they ship inside the lesson: the `protocol: 2` handshake field,
heartbeat, height reporting, and every lesson/content/scaffold change.

So: a package uploaded before Runtime v2 keeps working and keeps receiving
lesson improvements, but it does not gain the v2 shell. Replace a package only
when you want the v2 student experience on that assignment.

---

## 15. Scope boundary

Not built, deliberately: Canvas OAuth, Canvas API calls, automatic package
upload, automatic assignment creation, automatic publishing, roster changes.
The deliverable is a perfect Canvas-ready package, not Canvas course
administration. Do not add any of it without an explicit request.

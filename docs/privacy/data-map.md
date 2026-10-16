# Data map: what eduwonderlab.com collects, sends, stores and deletes

Snapshot of branch `feat/award-gold-wave` (cut from `origin/main` aa873132f0), written 2026-10-16.
Every statement is either **READ** (from the cited file and line), **MEASURED** (a headless
Chromium run on 2026-10-16, method in section 9) or **NOT VERIFIABLE FROM THIS REPO** (said so). Line
numbers drift; re-find with `rg -n "<phrase>" <file>`.

This is a description of practices. It is not a legal analysis and it does not claim compliance with
COPPA, FERPA, the Maryland Student Data Privacy Act, or any other law. Section 8 lists, per
principle, what the code does and what is not done.

Public companion page: `about/privacy-and-data/index.html`. Older pages that make claims this map
contradicts in places: `about/privacy.html`, `curriculum/data-privacy/index.html` (section 7).

---

## 1. Findings (read these first)

Severity is my judgment of privacy impact for a Grade 6 classroom. "Fix" is a suggestion only; no
file outside `docs/` and `about/privacy-and-data/` was changed.

### F1 (high) The curriculum hub sends a student's typed name and class section to a separate Worker

- `assets/curriculum-progress-bridge.js:11` falls back to `https://neft-school-hub-api.neftjd.workers.dev`
  when `window.CURRICULUM_SYNC.apiBase` is falsy. `curriculum/index.html:4943-4946` sets `apiBase` to
  `""` on every non-localhost host, which is falsy, so the fallback is used in production.
- `studentKey()` (`:26-48`) returns the shared identity name (the name the student typed), then
  `nt_student_ref`, `nt_student.alias`, `edupulse_student_name`, `nsr:identity.name`.
  `postProgress` (`:72-80`) sends it as `student_key` in a POST body, and the GET at `:123` puts it in
  the query string.
- **MEASURED:** with `nt_student = {alias:"Testy T.", section:"601"}` on a non-localhost host,
  opening `/curriculum/` issued `GET https://neft-school-hub-api.neftjd.workers.dev/api/curriculum/progress?tenant_id=harbor-view&student_key=Testy+T.&section=601`,
  and `CurriculumProgressBridge.syncToggle()` issued a `POST` with
  `{"tenant_id":"harbor-view","student_key":"Testy T.","section":"601","lesson_id":"1-1",...}`. The test
  aborted both requests; nothing was sent to the real Worker.
- Also loaded on `/curriculum/units/` (`curriculum/units/index.html:10040`) and lazily on core lesson
  pages (`assets/nt-page-enhance.js:30-39`, `assets/lesson-telemetry.js:457`).
- The file's own header says "never real names" (`:3`, `:24`). `docs/data-layer-map.md` says the
  `neft-hub` D1 is staff-only and must not hold student progress. What that Worker stores is outside
  this repo (NOT VERIFIABLE FROM THIS REPO).
- Fix: point `apiBase` at same-origin or delete the hard-coded default; never send `NeftIdentity` names
  off-origin; send a roster-issued `student_id` instead.

### F2 (high) The Save/Resume panel asks for a full name

- `shared/save-resume/save-resume-engine.js:1627-1628`: label "Your first and last name", placeholder
  "e.g. Jordan Nguyen". The roster design is "First L." (`migrations/0003_class_roster.sql`).
- That name is written to `nsr:identity`, `nt_student`, `edupulse_student_name`, `nt_student_ref`
  (`assets/edupulse-bridge.js:129-136`) and is then read by lesson telemetry (section 4, `lesson_telemetry`),
  by the hub bridge (F1) and by `nt-sync.js` (F3).
- `about/privacy.html:74` says "no last names required anywhere". The field is not enforced as required,
  but the prompt invites a full name.
- Fix: label "First name and last initial", placeholder "Jordan N.", clamp to that shape in
  `NeftIdentity.set`.

### F3 (medium) `nt-sync.js` says it never sends the typed name, but it does

- Header `assets/nt-sync.js:14-15`: "the student's typed NAME ... is never sent". `studentRef()`
  (`:64-92`) returns `NeftIdentity.get().name` first, so a typed name becomes `student_ref` in the
  queue item (`record()`, `:123-137`) posted to the results Worker.
- Only one page configures it: `pre-test/unit2-review.html:474-481` (endpoint
  `https://neft-results.neftjd.workers.dev`, per-class `write_key` shipped in the HTML, which the Worker
  README calls "NOT secret").
- The Worker "rejects any payload with a name field" (`results-worker/src/worker.js:26-31`), but a name
  inside `student_ref` is not a name field, so it is accepted. The schema comment
  (`results-worker/migrations/0001_init.sql:28`) says "NEVER a real name".
- Fix: send `NeftIdentity.studentId()` only when it comes from a roster id, otherwise the anon id.

### F4 (medium) Student text and photos go to Anthropic; no on-screen notice, no PII filter

- `/api/tutor` forwards `itemText` (2,000 chars), `studentWork` (2,000), up to 8 history turns of 1,200
  chars, and for `photo`/`recognize` modes a base64 image up to 4,000,000 characters to
  `https://api.anthropic.com/v1/messages`, model `claude-haiku-4-5-20251001`
  (`functions/api/tutor/[[path]].js:46-70,398-430`).
- Callers include the lesson tutor panel, hint ladders, Socratic mode, translate, `work-coach` (photo of
  handwritten work), `write-math` (handwriting recognition), math RPG, projects coach, the Workbench
  reasoning tools and AI Hub (list: `rg -n "api/tutor"`).
- Nothing strips a name a student types or writes at the top of a photo. The server comment (`:29`) says
  "No student PII is accepted"; that is a promise about the schema, not a filter.
- `work-coach/index.html:247` says "Your photo is read once ... It is never saved." True of this site's
  storage (no persistence in `callClaude`); it omits that the photo is processed by an outside AI company.
  Anthropic's retention terms for this API key are NOT VERIFIABLE FROM THIS REPO.
- `/api/tutor` has no authentication, `Access-Control-Allow-Origin: *` (`:38`), and only an in-memory
  per-isolate rate limit (`:97`). Any site can spend the API key. Cost and abuse, not privacy, but it is
  an open proxy to a paid model.
- `/api/reasoning` and `/api/teach-machine` can fall back to Cloudflare Workers AI
  (`@cf/meta/llama-3.1-8b-instruct`, `reasoning:90,278`; `teach-machine:338`). `teach-machine` tries
  `claude-opus-5` first (`:60`).
- Stale doc: `wrangler.toml:50-53` says the tutor "uses Workers AI"; the code is Claude-only
  (`tutor:503-508`).
- Fix: a one-line notice at every free-text AI entry ("This is sent to an AI service. Do not type your
  last name."), a client-side name/e-mail/phone scrub, an Origin allow-list like `/api/reasoning` has,
  and a signed short-lived token instead of an open proxy.

### F5 (medium) A classmate can look up whether a student has accommodations

- `GET /api/supports/for?section=&initials=` is public (`functions/api/supports/[[path]].js:355-392`).
  A known pair returns `items` (generic tool keys) and `lessons` (assigned lesson ids); an unknown pair
  returns empty arrays. Section labels are listed by the public `GET /api/supports/sections` (`:329`).
  Rate limit: 60 misses per IP per 5 minutes (`:157`).
- The response never names an IEP or a WIDA level (good, `:358-359`), but a non-empty `items` list for
  "601 / JM" tells anyone who guesses that pair that this student has an assigned support bundle.
- Fix: bind lookups to a class join code that the student device already holds; return the same shape
  for hit and miss; do not expose `lessons` publicly.

### F6 (medium) Save codes are short bearer secrets

- Suffix: 4 characters from a 31-character alphabet (`shared/save-resume/save-resume-engine.js:108-109`),
  so 31^4 = 923,521 values per prefix. The prefix is the first up to 6 letters of the activity title
  (`:300-318`), so it is guessable.
- `/api/progress/load` allows 50 misses per IP per 5-minute window (`progress:55`). That is about 14,400
  guesses per IP per day. A hit returns the whole row: name, section, answers (`:1771-1799`).
- `create`/`save` are unauthenticated upserts with `ON CONFLICT(save_code) DO UPDATE` (`:473-512`), so
  anyone holding or guessing a code can overwrite that work.
- Mitigating fact: the shared engine defaults to `localStorage` (`save-resume-engine.js:99-105`) and no
  HTML page or script sets `backend: "cloudflare"` (`rg 'backend:\s*["'\'']cloudflare'` finds only
  `functions/`). Whether production D1 holds rows is NOT VERIFIABLE FROM THIS REPO (migration
  `0004_usage_signal.sql` says `student_progress` was empty when written).
- `family-share/share-picker.js` does call `/api/progress/save`; see section 3.
- Fix: 8+ character suffix for new rows, or drop the public write route if no page uses it.

### F7 (medium) Third-party requests exist, and the ledger cannot see them

`data/external-script-debt.json` is pinned at 0 and `node tools/validate-external-scripts.mjs` passes
(MEASURED: "5347 pages, 0 third-party reference(s)"). That gate only matches script hosts in `*.html`
(`tools/validate-external-scripts.mjs:41`: jsdelivr, unpkg, jspm, cdnjs, jquery, ajax.googleapis, esm.sh,
skypack). It does not look at stylesheets, `@import`, images, JS-initiated fetches or iframes. Found by
static scan:

| Where                                                                              | What leaves the browser                                                                                                     |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `curriculum/monster-math-academy/assets/index-Cp34ETro.css:1`                      | `@import` of Google Fonts. **MEASURED:** requests `fonts.googleapis.com/css2` on load. IP address and Referer reach Google. |
| `family-jeopardy/index.html:11-15`                                                 | Google Fonts preconnect and stylesheet                                                                                      |
| `lessons/3-2/simulator/index.html:12-15`, `lessons/3-2-simulator/index.html:12-15` | Google Fonts                                                                                                                |
| `teacher-tools/classroom-arcade-projector/index.html:149,196`                      | QR image from `api.qrserver.com`, the page URL in the query (teacher tool)                                                  |
| `correlation-playground/index.html:244`                                            | user-initiated "fetch public data": CoinGecko and World Bank APIs                                                           |
| `teacher-tools/canvas-console/index.html:393`                                      | `https://neft-lti.neftjd.workers.dev/health` (own Worker, teacher tool)                                                     |

Fix: vendor the fonts (the repo already ships self-hosted font bundles, `public/assets/fonts/`), then
widen the validator to stylesheets and `@import`.

### F8 (medium) There is no deletion or retention tooling for server-side student records

- No Function route and no script deletes rows from `student_progress`, `lesson_telemetry`,
  `game_scores`, `game_progress`, `monster_saves`, `board_codes`, `family_meeting_scheduler_state`.
  Existing deletes: roster (teacher), manual gradebook rows (`progress:1151`), expired small-group rooms
  (`sg-room:147`), expired manipulative points, IP guard buckets, the Results Worker `DELETE /purge`
  (`results-worker/src/worker.js:301`).
- D1 dumps are written to `~/neft-backups/d1` with 30-day pruning (`scripts/backup-d1.mjs:43,66`). The
  repo also documents a daily offsite copy of the working tree to a personal Google Drive
  (`docs/backup-recovery.md`). Operator notes outside the repo say a weekly job copies D1 exports to
  Drive; that is NOT VERIFIABLE FROM THIS REPO. A deletion request would have to reach every copy.
- `about/privacy.html:121` says deletion "is honored promptly". Today that means a manual `wrangler d1
execute`.
- "Delete curriculum data on this device" (`curriculum/data-privacy/index.html:87-105`) removes 5 named
  keys and 5 prefixes. It leaves `nt_student`, `nsr:*`, `edupulse_*`, `nt_student_ref`, `nt_anon_id`,
  `nt_telemetry_q_v1`, `nt_sync_queue`, `nt_results_*`, `hw_*` and others on the device.

### F9 (low-medium) An unused endpoint accepts parent names

- `POST /api/progress/family-signoff` stores `parent_name`, `note`, `student_name`, `section`
  (`progress:215-243,612-628`). It is unauthenticated and returns 204 for everything.
- No client posts to it: the current homework bundle keeps the sign-off in `localStorage` only
  (`assets/homework/homework-core-*.bundle.js`, `saveParentSignoff`; the hash changes on rebuild, checked against `09038b20a8` and `673a859b00`). Its only
  reader is `curriculum/family-connections/teacher/family-response.js:19`.
- Fix: remove the POST route and table.

### F10 (low-medium) Public "exemplars" return a section label and have no consent record

- `GET /api/progress/exemplars` returns `firstNameInitial`, `section`, whitelisted excerpts and a note
  for rows a teacher flagged `exemplar_approved` (`progress:940-993`). Unlike `showcase.js`
  (`CONSENT AND SAFETY MODEL`, line 12: consent record, fail-closed display name), nothing records who
  consented.
- `about/privacy.html:97-99` says the showcase exposes "never scores, codes, or identifiers"; the class
  section is an identifier.
- Fix: reuse the showcase consent record, or drop `section` from the response.

### F11 (low) Spoken words reach telemetry; browser speech recognition is undisclosed

- `assets/voice-native-lesson.js:258` tracks `voice_input_processed` with `transcript: text`. Telemetry
  keeps strings up to 120 characters (`assets/lesson-telemetry.js:230-250`) and posts them with
  `studentName` (`:268-280`) into `lesson_telemetry.payload_json`. The module is loaded by
  `assets/lesson-platform.js:103-107` on the 42 pages that include it (Unit 9 lessons among them).
- About a dozen files use the browser Web Speech API (`rg -l SpeechRecognition`, 12 non-test files). In some browsers the audio is
  processed by the browser vendor's cloud. That is browser behaviour and NOT VERIFIABLE FROM THIS REPO;
  no site page says so.
- Audio recorded with `MediaRecorder` stays in memory as blob URLs: `access-practice-lab/src/recorder.js:2`
  ("never uploaded or written to storage"), `wida-access/speaking/index.html:4545`, homework voice memo
  (`localStorage`, local only).

### F12 (low) Teacher credentials

- A single shared `TEACHER_KEY` gates every teacher API and is accepted in the query string
  (`progress:285,630,671`), where it lands in URLs, history and request logs. `AUTH_CONTRACT.md` describes
  the Basic-auth `SITE_PASSWORD` gate as "a casual gate over material that is merely inappropriate for
  students ... not a secret-protection boundary".
- The public pages say "key-gated", which is accurate, but it is a shared password, not per-teacher access.

### F13 (low) Family conference scheduler collects family contact data

- `functions/api/family-connections/scheduler.js:70-77` requires guardian name, student first name and a
  valid e-mail; `meeting-notification.js:48-50` forwards them by e-mail through the
  `FAMILY_MEETING_EMAIL_SERVICE` Worker (`wrangler.toml:45-47`) to a hard-coded district address (`meeting-notification.js:1`, `to: jdneft@bcps...`). The request endpoints are public
  (`functions/_middleware.js:159-168`). Retention is not defined in code.
- `about/privacy.html:74` says "No accounts, passwords, or email addresses." That is true for students and
  false for this family feature.

### F14 (info) Stale documentation

`functions/api/progress/[[path]].js:19-21` says the D1 binding is "intentionally NOT added to
wrangler.toml"; it is there (`wrangler.toml:28`). See also the tutor comment in F4.

### F15 (info) Lesson telemetry ignores the opt-out signals the page counters honour

`assets/nt-usage.js` skips Do-Not-Track, Global Privacy Control and teacher mode. `assets/lesson-telemetry.js`
checks only `navigator.webdriver` and `NT_TELEMETRY_CONFIG.enabled` (`:53-60`), so a student or a teacher
in teacher mode who has typed a name is recorded regardless. This matters for demos and filming: use a
fresh browser profile with no stored name.

### What is done well (also verifiable)

- No cookies set on any student page (**MEASURED**, 18 pages, 0 cookies). Cookies exist only on teacher
  and Noam-school surfaces: the 24-hour teacher receipt (`functions/_lib/teacher-session.js:86,98`) and
  the Google OAuth session for the Noam planner (`functions/api/google/*`).
- `assets/nt-usage.js` honours Do-Not-Track and Global Privacy Control (`:71-79`), skips teacher mode and
  dev hosts (`:124`), and `signal` stores only per-day counters with no per-person key
  (`migrations/0004_usage_signal.sql`).
- `assets/lesson-telemetry.js:53-59` does not record automated browsers (`navigator.webdriver`).
- `/api/class-pulse` applies a k-anonymity floor (`class-pulse.js:18,243-244`); `/api/class-boss` stores only
  a device bucket 0-63 (`class-boss.js:15`); `/api/reasoning` is stateless and refuses foreign origins
  (`reasoning:41`); `/api/screener-assist` sends de-identified results only (`screener-assist:8`);
  `showcase.js` fails closed to an anonymous label.
- `/api/scores` has no name column (`scores:51-63`); `assets/edupulse-bridge.js:43-45,232-251` keeps names out
  of the payload (verified in `toGameScore`).
- The shared homework link strips responses, photo and voice memo (`homeworkShareUrl` in the homework
  bundle) and keeps only `route` and `lang`.
- The Save/Resume engine is local-only by default and says so (`save-resume-engine.js:96-105`).

---

## 2. Browser storage (no cookies on student pages)

All keys are in `localStorage` unless noted. Reads are wrapped in try/catch throughout the files cited.
Identity-bearing keys are marked **ID**. Full list is by code search; the inventory below is grouped, and a
group name lists the key prefix.

| Group and keys                                                                                                                                                                                                                                                                   | Holds                                                                              | Leaves device?                                                                                                                                | Cited                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **ID** `nt_student` `{alias, section}`, `nt_student_ref`, `edupulse_student_name`, `edupulse_class_period`, `ewl_student_name`, `nsr:identity` `{name, section}`, `nt_student_name`                                                                                              | Name and class period the student typed once                                       | Read by lesson telemetry (section 3), hub bridge (F1), family letter (`assets/family-letter.js:218-226`), `nt-sync` (F3). Not by `/api/scores`. | `assets/edupulse-bridge.js:100-146`, `assets/nt-page-enhance.js:96`                             |
| **ID** `ewl-supports:v2:me` (section, initials), `ewl-supports:v2:assigned:<section>:<initials>`                                                                                                                                                                                 | Initials and section; assigned tool bundle cache                                   | Initials+section sent to `/api/supports/for` (F5)                                                                                             | `assets/shared-identity.js:47`, `assets/learning-supports/learning-supports.js`                 |
| **ID** `nt_anon_id`                                                                                                                                                                                                                                                              | Random per-device id (`anon-xxxxxxxx`)                                             | Used as `student_ref` by `nt-sync` when no name                                                                                               | `assets/nt-sync.js:34,82-90`                                                                    |
| `nt-class-code`, `nt_class_code`, `nt-board-section`                                                                                                                                                                                                                             | Class join code / section                                                          | Sent to `/api/roster/get`                                                                                                                     | `engine/core/app.js:410`                                                                        |
| Save/Resume: `nsr:rec:<code>`, `nsr:activity:*`, `nt-student-save-code`, `nt-active-session*`, `nt-active-student:*`                                                                                                                                                             | Full work records, including the typed name and answers                            | No (local backend). Cloud mirror only if a page opts in (F6).                                                                                 | `shared/save-resume/save-resume-engine.js:91-105`                                               |
| Lesson engine `rma_*`, `rma_gradebook`; `hw_state_lesson_<id>`, `nt-godeeper:*`, `nt-spiral:v1`, `nt-obj:*`                                                                                                                                                                      | Lesson answers and progress                                                        | No                                                                                                                                            | `engine/core/state.js:3`, `engine/core/grade.js:12`                                             |
| Results: `nt_results_v1`, `nt_results_log`, `nt_tracker_manual`                                                                                                                                                                                                                  | Activity results with the student name (CSV export source)                         | No (user downloads a CSV)                                                                                                                     | `assets/nt-results.js:46`, `assets/nt-activity-kit.js:16-17`                                    |
| Telemetry queue `nt_telemetry_q_v1`; `nt_sync_queue`                                                                                                                                                                                                                             | Queued events with student name until flushed                                      | Yes, to `/api/progress/telemetry` and the results Worker                                                                                      | `assets/lesson-telemetry.js:65`, `assets/nt-sync.js:32`                                         |
| `nt-signal:v1`, `nt-signal:code`, `ntj:v1`                                                                                                                                                                                                                                       | Per-standard attempts, misconception tags, last lesson                             | No ("never talks to the network", `assets/nt-signal.js:1-10`)                                                                                 | `assets/nt-signal.js:45,331`                                                                    |
| Homework: `hw_route_*`, `hw_lang_mode`, `hw_last_tab_*`, `hw_family_streak_history`, `hw_journey_*`, `hw_family_mission_*`, `hw_vocab_review_deck`, `hw_mathpad_off`                                                                                                             | Route, language, tab, streak dates                                                 | No                                                                                                                                            | homework bundle                                                                                 |
| Homework sign-off `hw_parent_signoff_<lesson>`                                                                                                                                                                                                                                   | Optional partner name, note, reflection, **data-URL photo of work and voice memo** | No                                                                                                                                            | homework bundle, `saveParentSignoff`                                                            |
| Language and display: `nt-lang`, `ewl_lang`, `ewl:lang`, `nt-plain-language`, `nt-calm-mode`, `nt-text-size`, `nt-feedback-mode`, `neft-theme`, `nt-celebration-style`, `gfx-muted`, `nt-read-aloud-voice`, `nt-translate-lang`, `ewl_comfort_v1`, `ewl-supports:v1:preferences` | Preferences                                                                        | No                                                                                                                                            | e.g. `engine/core/i18n.js:424`, `assets/game-access.js:25-26`                                   |
| Student notes `ewl-supports:v1:notes:<lesson>`, checklist keys                                                                                                                                                                                                                   | Student-typed notes                                                                | No                                                                                                                                            | `assets/learning-supports/learning-supports.js:1905,2806`                                       |
| Fluency Lab `ewl-fluency-profiles-v1`, `ewl-fluency-progress-v1*`, `ewl-fluency-tutor-v2*` (+ sessionStorage `ewl-fluency-tab-profile`)                                                                                                                                          | Profile names from a fixed list (Orbit, River, Comet ...) and progress             | No                                                                                                                                            | `math/fluency-lab/school-tools.js:5,22`, `assets/my-progress/progress-stores.js`                |
| Games and studios: `ewl-expedition-*`, `ewl.studio.best.*`, `ewl-wonderpass-v1`, `nt_passport`, `ewl_state_v1`, `mma-rematch-v1`, `nt_boss.*`, `nt_ttm.*`, `arl_progress`, `pa-summary-*`, `pa-itemlog`, `choiceboard-u*`                                                        | Scores, streaks, unlocked items                                                    | No (Class Boss posts counters, see section 3)                                                                                                 | respective files                                                                                |
| Tool state: `neft.mathWorkbench.*`, `mw_*`, `eduwonderlab:learning-lab:*`, `ewl_lab_draft*`, `nt-community-math-studio:v1:*`, `nt-pub:*`, `nt-fut:*`                                                                                                                             | Workbench documents, lab drafts, project drafts (can hold free text)               | No                                                                                                                                            | `curriculum/math-workbench/wb-storage.js:21`, `assets/ewl/lab-investigate.js:12`                |
| Curriculum hub: `curriculumProgress`, `curriculumStudentLaunch:*`, `nt-curriculum-*`, `ewl:curriculum:*`, `nt-hub-*`                                                                                                                                                             | Checkmarks, saved lessons, launch timing                                           | Checkmarks sync via the hub bridge (F1) when a name is stored                                                                                 | `assets/curriculum-enhancements.js:37`                                                          |
| **Teacher only** `nt-teacher-mode`, `nt-teacher-pin-role`, `neft.teacher.key`, `curriculumTeacherWorkflow:v1`                                                                                                                                                                    | Teacher mode flag and the teacher key                                              | The key is sent as `x-teacher-key`                                                                                                            | `engine/core/teacher-mode.js:23`, `curriculum/family-connections/teacher/family-response.js:17` |
| `sessionStorage`                                                                                                                                                                                                                                                                 | `ewl-fluency-tab-profile` only in the measured run                                 | No                                                                                                                                            | MEASURED                                                                                        |

MEASURED keys written on first load (anonymous visit, 18 pages): `nt-signal:code`, `ewl_state_v1`,
`nt-hub-supports-open` (`/curriculum/`); `hw_route_<id>`, `hw_lang_mode`, `hw_last_tab_<id>`
(homework); `mma:web:sound`; `nt_boss.device`; `ewl-fluency-profiles-v1`; `mw_a11y`,
`neft.mathWorkbench.*`, `mw_snap`; `nt_passport`. No name or id key appeared before a student typed one.

Photos of work in `hw_parent_signoff_*` stay on the device (data URL in `localStorage`); on a shared
Chromebook the next user of that profile can read them.

---

## 3. First-party endpoints (Cloudflare Pages Functions, `functions/api/**`)

Auth column: **none** = anyone; **key** = `TEACHER_KEY` (header `x-teacher-key` or `?key=`); **code** =
possession of a code; **origin** = same-site Origin check. "IP" = the endpoint reads `CF-Connecting-IP`
and keeps it in a throttle table pruned on a rolling bucket.

| Endpoint                                                                                                                          | Auth                                                                           | Written by (client)                                                                                                                                                 | Fields received                                                                                  | Stored in                                                                              | Notes                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/signal/view,error,vital,practice`                                                                                      | none (writes) / key (reads)                                                    | `assets/nt-usage.js`                                                                                                                                                | path, dwell ms, device bucket, error message (300 chars, no stack), vital value, practice source | `usage_signal`, `client_error`, `web_vital`, `family_practice_open` (daily counters)   | No name, code or id (`signal:21-26`). Skipped on DNT/GPC, teacher mode, dev hosts.                                               |
| `POST /api/progress/telemetry`                                                                                                    | none (write, always 204) / key (read)                                          | `assets/lesson-telemetry.js`, `engine/core/small-group-evidence.js`, `assets/family-letter.js:227`, `shared/projects/projects-complete.js`, `projects-publisher.js` | lesson slug, standard, **studentName (60), section (40)**, events with props (strings 120 chars) | `lesson_telemetry` (student_name, section, event_type, payload_json)                   | Names stored when known (F2). Small-group events carry no name (`progress:721-726`).                                             |
| `POST /api/progress/create,save`, `GET /load,/mine`                                                                               | code (bearer)                                                                  | save-resume cloud backend (no page enables it), `assets/family-share/share-picker.js`, `assets/nt-signal.js` (load/save), `today/index.html` (mine)                 | save code, activity id/title, **student name, section**, state JSON, student id, class code, url | `student_progress`                                                                     | F6. `/mine` takes class code + student id and returns titles, percent, save codes (no state).                                    |
| `POST /api/progress/family-signoff`                                                                                               | none                                                                           | nobody (F9)                                                                                                                                                         | lesson, **parent name**, note, **student name**, section                                         | `family_signoff`                                                                       | Dead write path.                                                                                                                 |
| `GET /api/progress/exemplars`                                                                                                     | none (IP throttle)                                                             | `engine/core/strategy-gallery.js`, `shared/projects/projects-publisher.js`                                                                                          | activity id                                                                                      | reads `student_progress` rows flagged by a teacher                                     | F10.                                                                                                                             |
| `GET /api/progress/small-group-summary`, `/next-move`                                                                             | none                                                                           | engine, `assets/curriculum-next-move.js`                                                                                                                            | lesson or section                                                                                | aggregates of `lesson_telemetry`                                                       | Counts and averages only.                                                                                                        |
| `GET /api/progress/digest,mastery-rollup,standards-matrix,struggles,telemetry,roster,grades,insight`                              | key                                                                            | teacher tools                                                                                                                                                       |                                                                                                  |                                                                                        | `format=csv                                                                                                                      | xls | json` exports (`progress:1215-1310`). |
| `POST /api/scores/*`                                                                                                              | none                                                                           | `assets/edupulse-bridge.js`, `assets/game-score.js`, `engine3d`, arcades                                                                                            | game id, standard, level, points, correct, total, steps, misconception tag, save code            | `game_scores`, `game_progress` (`state_json` = whole body)                             | No name column. `GET /api/scores` is unauthenticated (its comment says "teacher view") and returns the latest 200 events without save code or name (`scores:154-166,208-216`). `GET /api/scores/progress?gameId=&saveCode=` returns the saved state for a code (bearer). |
| `GET /api/roster/get?code=`                                                                                                       | none (IP throttle) / key (write, delete)                                       | `engine/core/app.js`, `today/index.html`                                                                                                                            | join code                                                                                        | `class_roster` ("First L.", section, stable student id)                                | Public by join code, like a seating chart (`roster:19-22`).                                                                      |
| `GET /api/supports/for,sections`                                                                                                  | none (IP throttle) / key (roster)                                              | `assets/shared-identity.js`, `learning-supports.js`, `small-group-renderer.js`                                                                                      | section, initials                                                                                | `supports_roster` (WIDA level, IEP items, lessons)                                     | F5. Public response is generic tool keys.                                                                                        |
| `GET/PUT /api/board/*`; `POST /api/board/codes`                                                                                   | none (read board, write codes with IP throttle) / key (save board, read codes) | `math/student-board/index.html`, `assets/class-board-strip.js`                                                                                                      | student (40), assignment, save code                                                              | `class_board`, `board_codes`                                                           | Student name + code stored; read is teacher-only. Error responses include `detail: String(e.message)`.                           |
| `POST/GET /api/monster-save/*`                                                                                                    | code                                                                           | Monster Math Academy bundle                                                                                                                                         | `state` JSON up to 50,000 bytes                                                                  | `monster_saves`                                                                        | No identity columns (`:11`). Content of `state` is client-defined; free text inside is NOT VERIFIED.                             |
| `POST/GET /api/class-boss`                                                                                                        | none                                                                           | `curriculum/class-boss/boss.js`                                                                                                                                     | week key, tag, correct, device                                                                   | `class_boss_*` (counters, device hashed to 64 buckets)                                 |                                                                                                                                  |
| `GET /api/class-pulse`                                                                                                            | none                                                                           | several                                                                                                                                                             | days                                                                                             | reads `lesson_telemetry`, tag counts only, suppressed below a cohort floor             |                                                                                                                                  |
| `POST/GET /api/sg-room/*`                                                                                                         | none (room code)                                                               | `engine/core/small-group-room.js`                                                                                                                                   | room code, seat number, short answer                                                             | `sg_room`, `sg_room_commit`                                                            | Expires 4 hours, pruned on creation (`sg-room:147`). No names.                                                                   |
| `POST/GET /api/manip-room/*`                                                                                                      | none                                                                           | `class-manip/index.html`                                                                                                                                            | room, x, colour, author (2 chars)                                                                | `manip_points`                                                                         | Rows expire in 6 hours, 400 per room.                                                                                            |
| `GET /api/family-broadcast`                                                                                                       | code                                                                           | `curriculum/family-connections/broadcast/*`                                                                                                                         | save code                                                                                        | reads `student_progress`, `lesson_telemetry`, `game_scores`                            | Returns one named child's week; no CORS, no cache (`:14-40`).                                                                    |
| `GET/POST /api/showcase`                                                                                                          | none (submit, approved reads) / key (approve)                                  | `assets/student-showcase.js`, `curriculum/showcase/showcase.js`                                                                                                     | caption, explanation, standard, consent                                                          | `showcase_items`                                                                       | Pending until teacher approves; no uploads (`showcase.js:12-60`).                                                                |
| `POST /api/tutor`, `/reasoning/review`, `/teach-machine`, `/study-pack`, `/screener-assist`                                       | none (reasoning: origin)                                                       | many                                                                                                                                                                | see section 5                                                                                    | not stored                                                                             | Calls Anthropic or Workers AI.                                                                                                   |
| `/api/family-connections/*`                                                                                                       | key (publishing) / none (published feed, scheduling)                           | `curriculum/family-connections/**`                                                                                                                                  | guardian name, student first name, e-mail, note                                                  | `family_connections_*`, `family_meeting_scheduler_state`, `family_canvas_meeting_sync` | F13.                                                                                                                             |
| `/api/pacing`, `/api/plan-notes`, `/api/forge`, `/api/grade`, `/api/settings/*`, `/api/osamr-board`, `/api/misconception-heatmap` | key                                                                            | teacher tools                                                                                                                                                       | teacher content                                                                                  | various                                                                                | Teacher-authored; `forge`, `grade`, `plan-notes` call Anthropic with teacher input. `ai/daily-update.js` calls OpenAI (teacher). |
| `/api/scorm*`, `/api/worksheet-pdf`, `/api/curriculum/content`, `/api/config`                                                     | none                                                                           | download tools                                                                                                                                                      | worksheet paths, no student data                                                                 | none                                                                                   | `worksheet-pdf` renders only matching student worksheet paths.                                                                   |
| `/api/google/*`, `/api/state` (Noam planner)                                                                                      | session / pairing code                                                         | `focus-school/`, `shai-school/`                                                                                                                                     | teacher's personal planner                                                                       | KV, Google APIs                                                                        | Not student-facing; out of scope.                                                                                                |
| Results Worker `neft-results` (`results-worker/`)                                                                                 | write key (public) / read key                                                  | `assets/nt-sync.js`                                                                                                                                                 | `student_ref`, class code, score, tags                                                           | `results`                                                                              | F3. `DELETE /purge`.                                                                                                             |
| LTI Worker `neft-lti` (`lti-worker/`)                                                                                             | LTI                                                                            | Canvas                                                                                                                                                              | launch nonce, audit event                                                                        | `nonces`, `launch_audit`                                                               | Not examined past the schema.                                                                                                    |

Cloudflare itself sees every request (IP, user agent, URL) as host. Log retention at Cloudflare and any
log shipping are NOT VERIFIABLE FROM THIS REPO; `wrangler.toml` configures no observability or Logpush.

---

## 4. D1 tables with identifiers (database `neft-student-progress`, binding `DB`)

Created lazily by each Function (`CREATE TABLE IF NOT EXISTS`) and, for nine of them, by
`migrations/*.sql`. Names of columns that can identify a child are in bold.

| Table                                                                                                                          | Identifier columns                                                                                     | Defined                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `student_progress`                                                                                                             | **student_name**, **section**, student_id, class_code, save_code, state_json (answers), exemplar flags | `migrations/0001`, `0007`; `progress:113-131` |
| `lesson_telemetry`                                                                                                             | **student_name**, **section**, payload_json                                                            | `progress:174-188`                            |
| `family_signoff`                                                                                                               | **parent_name**, **student_name**, section, note                                                       | `progress:193-211`                            |
| `insight_signal`                                                                                                               | **student_name**, **section**, tier, risk, standards                                                   | `migrations/0002`                             |
| `class_roster`                                                                                                                 | **student_name ("First L.")**, section, student_id                                                     | `migrations/0003`                             |
| `supports_roster`                                                                                                              | **initials**, **section**, WIDA level, IEP items, lessons                                              | `supports:273-283`                            |
| `board_codes`                                                                                                                  | **student**, assignment, save code                                                                     | `board:95-104`                                |
| `game_scores`, `game_progress`                                                                                                 | save_code only                                                                                         | `scores:51-80`                                |
| `monster_saves`                                                                                                                | save_code only                                                                                         | `monster-save:53-60`                          |
| `showcase_items`                                                                                                               | display_name (first name + initial, consented), consent_json                                           | `showcase:350-364`                            |
| `family_meeting_scheduler_state`, `family_connections_*`                                                                       | **guardian name, e-mail, student first name** inside state                                             | `family-connections/*`                        |
| `usage_signal`, `client_error`, `web_vital`, `family_practice_open`, `class_boss_*`, `sg_room*`, `manip_points`, `osamr_board` | none (counters, short-lived rows)                                                                      | migrations 0004-0009 and Functions            |
| `load_miss`, `supports_guard`, `board_codes_guard`, `class_roster_guard`                                                       | **ip** (rolling window rows, pruned)                                                                   | e.g. `progress:86-102`                        |
| `plan_doc`, `plan_note`, `forged_lessons`, `site_settings`, `pacing_*`                                                         | none (teacher content)                                                                                 |                                               |
| Results Worker `results`, `classes`, `teachers`                                                                                | student_ref, class_code                                                                                | `results-worker/migrations/0001`              |

Other stores: KV `NOAM_SCHOOL_KV` (Noam planner), KV `PLAN_DOCS` (teacher plan files), D1
`TENANT_DB_STAGING` (staging tenant).

---

## 5. What is sent to AI services

| Endpoint                                                                               | Text/media sent                                                                              | Names?                                           | Service and model                                                     | Persisted by this site?            | Cited                                                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `/api/tutor` modes hint, explain, another, diagnose, teach, socratic, translate, solve | standard (40 chars), problem text (2,000), student work (2,000), history 8 x 1,200, language | Never added by the code; a student can type one  | Anthropic `claude-haiku-4-5-20251001`, `api.anthropic.com`            | No                                 | `tutor:46-60,398-430`                                                           |
| `/api/tutor` photo, recognize                                                          | JPEG/PNG/WebP of handwritten work, base64, up to 4,000,000 chars                             | A name written on the page would be in the image | same                                                                  | No                                 | `tutor:86-95,404-420`; `work-coach/index.html:342`; `write-math/index.html:294` |
| `/api/tutor` plan                                                                      | anonymised class counts (teacher)                                                            | "Student names are never included" (`:77`)       | same                                                                  | No                                 | `teacher-tools/insight-brief/app.js`                                            |
| `/api/reasoning/review`                                                                | prompt and the student's written reasoning, standard, level, language                        | No fields for names (`:41`)                      | Anthropic, else Cloudflare Workers AI llama-3.1-8b                    | No ("Nothing is persisted at all") | `reasoning:251-292`                                                             |
| `/api/teach-machine`                                                                   | the student's explanation turns, tag                                                         | No                                               | `claude-opus-5`, then Haiku, then Workers AI, then a scripted persona | No ("no storage, no logging")      | `teach-machine:36-60`                                                           |
| `/api/study-pack`                                                                      | pasted notes, a question                                                                     | "No student PII accepted"                        | Anthropic Haiku                                                       | No                                 | `study-pack:15`                                                                 |
| `/api/screener-assist`                                                                 | grade band, home language, tier, domain results                                              | Explicitly none (`:8-10`)                        | Anthropic Haiku                                                       | No                                 | `personal/leia/speech-screener` (personal tool)                                 |
| `/api/forge`, `/api/grade`, `/api/plan-notes`                                          | teacher-authored lesson/plan text                                                            | n/a                                              | Anthropic                                                             | Results stored as teacher content  | teacher-gated                                                                   |
| `/api/ai/daily-update`                                                                 | teacher text                                                                                 | n/a                                              | OpenAI                                                                | n/a                                | `daily-update.js`                                                               |

`ANTHROPIC_API_KEY` and the `AI` binding are runtime secrets and bindings: whether either is live in
production is NOT VERIFIABLE FROM THIS REPO. With no key, `/api/tutor` answers 503 "offline" and the
lessons continue.

---

## 6. Cookies and third-party requests

- Cookies: none set on student pages (**MEASURED**). Teacher receipt cookie and Google session cookie
  exist on teacher/Noam routes only (section 1, "done well").
- Third-party requests found: F7 table. **MEASURED** on 18 student pages with all non-localhost requests
  blocked and logged: the only external host requested was `fonts.googleapis.com` (Monster Math Academy).
- Analytics: no Google Analytics, Cloudflare Web Analytics, tag manager, pixel, session replay or ad
  script in the repository's served files (`rg` over `*.html`, `*.js`; no match outside tooling and
  false positives). The first-party counters are `nt-usage.js` and `web_vital`.
- 56 files in `public/assets/fonts/*.css` mention `fonts.googleapis.com`, but only in header comments: none contains an `@import` or `url(https://...)` (**READ**, `rg`). The font files are self-hosted.

---

## 7. Claim audit of existing public pages

`about/privacy.html` (policy last reviewed 2026-07-14):

| Claim (line)                                                                        | Status                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "No accounts, passwords, or email addresses; no last names required anywhere" (:74) | Students: true (no accounts). Email: false for the family conference scheduler (F13). Last names: invited by the Save/Resume prompt (F2).                                                                                            |
| "no third-party trackers" (:75-77)                                                  | No tracker found. Google Fonts requests on 4 pages (F7) and AI services are not mentioned.                                                                                                                                           |
| "No photos, video, audio recordings" (:80)                                          | Audio never uploaded (read). Photos of handwritten work are sent to an AI service on demand (F4).                                                                                                                                    |
| "Every roster, gradebook, and analytics endpoint requires a teacher key" (:89)      | Over-broad: `GET /api/roster/get`, `/api/supports/for`, `/api/supports/sections`, `/api/board/get`, `/api/class-pulse`, `/api/progress/small-group-summary` and `/next-move` are public by design (aggregates or join-code lookups). |
| Showcase "never scores, codes, or identifiers" (:97)                                | `exemplars` returns the section (F10).                                                                                                                                                                                               |
| "Families may request to view or delete ... deletion is honored promptly" (:121)    | No tooling (F8).                                                                                                                                                                                                                     |
| "FERPA & COPPA alignment" (:107)                                                    | An assertion the code does not prove. The new page lists behaviours instead.                                                                                                                                                         |

`curriculum/data-privacy/index.html`: its description of the AI tutor inputs (problem text, student work,
standard, language, recent messages, optional image) matches `tutor` (**READ**). "Progress and preferences
normally stay in this browser" omits the telemetry that carries `studentName` (section 3). English only. Its
"Delete curriculum data on this device" is partial (F8).

Recommended: link `about/privacy.html` to `/about/privacy-and-data/` and soften the legal headings.

---

## 8. Principles: what the code supports, what is not done

No legal conclusion is drawn. "Supports" cites behaviour; "Not done" is what a reviewer should ask about.

| Principle                    | The code does                                                                                                                                                                                                     | Not done                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data minimisation            | No student accounts, passwords or e-mail. Roster is "First L." only. Usage/error/vitals are daily counters. Game scores have no name column. Class Boss hashes device ids to 64 buckets.                          | Full name invited (F2). Name in telemetry (F2). Name off-origin (F1, F3). Parent name endpoint unused but live (F9).                                                      |
| Purpose limitation           | Student data endpoints serve the teacher dashboards and resume; telemetry is not shared with ad services (none exist).                                                                                            | No written purpose register per table. `lesson_telemetry` is also used for family broadcast and class pulse.                                                              |
| Transparency                 | Two public pages; `about/privacy-and-data` and `curriculum/data-privacy` describe flows.                                                                                                                          | AI free-text entry points show no notice (F4). Voice recognition not disclosed (F11). Existing pages disagree with code in places (section 7).                            |
| Access control               | Teacher APIs need `TEACHER_KEY`; teacher pages need the Basic-auth password; student-safe aggregates have a k-anonymity floor; family broadcast requires a save code; supports public output is generic.          | Shared single key, key in query string (F12). Public lookups by section+initials (F5). Short save codes (F6).                                                             |
| Child-specific safeguards    | No ads, no cookies, no third-party scripts (gate at 0), DNT/GPC honoured, mic audio stays on device, showcase is moderated and fail-closed.                                                                       | No age gate or parental-consent flow in code. Consent for exemplars not recorded (F10). Third-party font requests (F7).                                                   |
| Retention                    | Short-lived rooms (4 h), manipulative points (6 h), IP buckets (rolling), pending sync queues. Local D1 dumps pruned at 30 days.                                                                                  | No retention schedule for `student_progress`, `lesson_telemetry`, `game_*`, `monster_saves`, `board_codes`, scheduler data (F8). Backups are copies outside the database. |
| Access, correction, deletion | Students can export their own progress (`assets/my-progress/progress-view.js`, `my-math-progress.json`) and clear this device's curriculum data. Roster delete and Results Worker purge exist for teachers.       | No family-facing request path in code, no deletion script, partial device clearing (F8).                                                                                  |
| Security                     | HTTPS only (Cloudflare), CSP `frame-ancestors`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a tight `Permissions-Policy` (`_headers`), per-IP throttles, closed vocabularies, input clamps. | Open `/api/tutor` proxy (F4). No documented audit or penetration test. `AUTH_CONTRACT.md` calls the teacher gate "casual".                                                |
| Vendors and sub-processors   | Cloudflare (hosting, D1, KV, Workers AI, e-mail, Browser Run); Anthropic (tutor family); OpenAI (one teacher tool); Google (fonts on 4 pages, Noam planner OAuth).                                                | No data-processing agreements or vendor terms are stored in the repo. Anthropic and Cloudflare retention settings are not verifiable here.                                |
| Breach response              | None in repo.                                                                                                                                                                                                     | No incident plan or contact address.                                                                                                                                      |

The signed agreements and district approvals a district will ask for (data privacy agreement, Maryland
MSDPA registration, vendor questionnaire, accessibility conformance report) do not exist in this repo.

---

## 9. How this was measured and how to re-run

Static: `rg` over the worktree, `node tools/validate-external-scripts.mjs`.

Runtime (headless Chromium, `playwright` from the worktree, static server `python3 -m http.server`;
script `scratchpad/e3/measure.mjs`, not committed): every request to a host other than the local server
was aborted and logged, `/api/*` answered with `{"ok":true}`, cookies and storage keys read at the end.
Pages: `/`, `/curriculum/`, `/about/privacy.html`, `/curriculum/data-privacy/`, `/families/`,
`/families/lessons/1-1/`, `/lessons/2-4/homework.html`, `/work-coach/`, `/write-math/`,
`/math/intervention/`, `/curriculum/my-progress/`, `/curriculum/teach-the-machine/`,
`/curriculum/monster-math-academy/`, `/curriculum/class-boss/`, `/math/fluency-lab/`,
`/curriculum/math-workbench/`, `/today/`, `/math/games/practice-arcade/`; run once anonymous and once
with `nt_student` set. The F1 run used a hostname mapped to 127.0.0.1 (not `localhost`) so the production
branch of `apiBase` was exercised.

Limits: engine-rendered lesson pages (`/lessons/<id>/`) need `dist/` (Vite) and were not loaded; their
behaviour is READ from `engine/core/*` only. Production D1 contents, Worker secrets and Cloudflare
dashboard settings were not inspected.

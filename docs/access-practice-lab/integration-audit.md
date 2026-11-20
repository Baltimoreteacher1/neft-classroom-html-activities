# Language Page integration audit

Updated 2026-11-20. Feature branch `feat/lp-integration`, rebased onto the
current `origin/main` in the existing worktree. Generated shell files were
regenerated with `node tools/sync-access-shell.mjs` after the rebase. The main
working checkout was not modified.

## Release boundary

Joel's latest instruction is to complete the Revision 2 scope and deploy it through
the guarded `ship` workflow after required checks pass. Local mock/offline work can
ship only with explicit partial labels below. No production resource, email
provider, OAuth client, LMS registration, or secret is provisioned. The build is
not represented as complete where a capability depends on those STOP items or
human review.

## Reference checks

Playwright reached all four public URLs on 2026-11-19 (HTTP 200, no login):

- [Starfall Learn to Read](https://www.starfall.com/h/ltr-classic/): public 15-row
  sequence confirmed. Exact feedback/audio behavior is still unverified.
- [Twinkl Create](https://www.twinkl.com/teaching-wiki/twinkl-create): public editor
  description confirmed. Whether every resource is editable remains unverified.
- [Extempore Help Center](https://help.extemporeapp.com/en/): public help index
  reached; the full assessment flow was not exercised in an authenticated account.
- [Ellevation Instruction](https://ellevationeducation.com/instruction): the old
  strategies URL redirects here. Public page describes a 100+ activity library,
  organizers and domain-linked instruction. Exact forms and recommendation rules
  remain unverified.

No third-party curriculum, artwork, audio or code was copied. Original LP text,
existing LP engines and Unicode pictograms are used. Provenance log is empty.
Browser captures and detailed test logs are local under `/tmp/lp-integration-qa`.

## Existing Science of Reading path (formerly Unknown)

`src/sor/sequence.js` assembles three original structured-literacy levels from
`src/content/phonics/level-{1,2,3}.js`. `sor/player.js` runs model, build, decode,
sort, spell, connected text, dictation and independent transfer. `sor/path.js`
tracks lesson completion and offers a scope table. Those routes and keys remain.
The additive `/reading-path` uses the shared Sound Builder placement and tile
functions, speech service, recorder, audio retention and print service.

## Feature coverage

Coverage describes implemented behavior in this branch; partial rows name material
acceptance criteria still missing. No row is “full integration” unless its stated
criteria are met.

| ID | Coverage | Implementation / remaining work |
| --- | --- | --- |
| 0.1 | Covered | Speaking Lab text clarifies practice scope and limits. |
| S1 | Partial | 15 open units, begin/resume and progress; keyboard persona and full accessibility sweep remain. |
| S2 | Partial | Eight untimed engines, seeded rounds, A/B/C, count choices, shared machine data, silent-e split, and before/after Switch picture/audio are covered. Hunt still uses pictograms; full item-level axe sweep remains. |
| S3 | Partial | 15 original readers, six bilingual pages and read controls; parser is not a pronunciation lexicon, human review and proficiency output remain. |
| S4 | Partial | Original fluency library and explicit local recording retention; device and distinct-voice checks remain. |
| S5 | Partial | 26 letter tracing experiences; supplied song/captions and fingerspelling media remain absent. |
| S6 | Partial | Adults word-list scope and print views; six-card-per-sheet pagination is unit-tested. DOCX export remains. |
| T1 | Partial | Generated registry metadata and facet read/write/count/filter behavior are unit-tested. Bundling saved collections into T3 remains. |
| T2 | Partial | Generated survival vocabulary and eight companion packs exist; new-arrival audio, actual Passport integration for All About Me, exact print outputs and human content review remain. |
| T3 | Partial | Lesson-pack ZIP and combined print markup include plan, projector link, A/B/C sheets, six challenges, vocab, home task and teacher-only key; combined PDF artifact and some source data fidelity need final verification. |
| T4 | Partial | `/print-studio` reuses Book Studio templates; requested design canvas, full editing toolbar, PNG/PDF/DOCX export and tagged-PDF validation are not complete. |
| T5 | Partial | Reading Path round controls and class assignment link exist; fleet-wide game randomization, level/count controls and Add to class are not wired across every game. |
| T6 | Covered | Date/band-stable daily plan, five weekly words, bilingual one-language view, checklist and Monday–Friday print planner are implemented and deterministic content is tested. |
| T7 | Partial | Role preference reorders initial Teacher Hub cards; six task cards still exceed the CTA budget and role labels show EN/ES together. |
| X1 | Partial | Local task-pack schema/editor, duplicate/archive/view-as-student; multi-question editing, complete assignment scheduling/class lifecycle remain. |
| X2 | Partial | Optional review/respond timers, 3-2-1 countdown and minimum-response gate are browser-tested. Class-linked attempt locks, navigation warning, extended time and refresh lifecycle remain. |
| X3 | Partial | Local text/audio/video/screen capture/choice/conversation branches exist; teacher-configured choice media, conversation turn sequencing and paste control remain. |
| X4 | Partial | Local rubric builder, points entered by teacher and signed-language preset; student rubric popup, student self-rating and global library behavior remain. |
| X5 | Missing | Review desk filters, bulk actions, waveforms, interjected feedback and submission export are not built. |
| X6 | Partial | Local question bank import/export and seeded alias pool draws; shared-code copy and full retake lifecycle remain. |
| X7 | Partial | Mock provider, state machine, consent copy and disabled Cloudflare adapter; no live audio, attendance integration, room drag/drop or X5 delivery. Provisioning is a STOP. |
| X8 | Partial | Offline role cards, turn prompts, recorder and printable checklist are implemented; full task pack turn configuration and independent offline/browser verification remain. |
| X9 | Partial | Local report page and small-count suppression; completion/question counts, local time counters and criterion aggregates need full data plumbing. |
| X10 | Partial | Alias-only roster CSV import/template exists; scores import, OneRoster mapping, class completion passthrough and LMS adapters remain. Real LMS registration/OAuth is a STOP. |
| X11 | Missing | Draft-only prompt generator, guarded model endpoint and fallback are not built. |
| E1 | Partial | Teacher-local profile store, checksummed export/import and remove-everything; list status chips, support taxonomy and existing official-score flow are not fully integrated. |
| E2 | Partial | Six bilingual neutral templates and local draft records; complete field controls, comments/history/signatures and teacher-local file support remain. |
| E3 | Partial | Bilingual local outbox templates with disabled email adapter; token route, receipt/signature tracking and PDF/link delivery are not built. Provider and storage are STOPs. |
| E4 | Partial | 25 validated original strategies and six pathway lists; 100-item target, full facets and print integration remain. |
| E5 | Partial | Deterministic, teacher-entered evidence count, draft accept/dismiss flow; existing evidence ledger/skill graph integration and group/stage filters remain. |
| E6 | Partial | Objective composer and one selected group scaffold; per-group assignment and saved objective attachment to Lesson Builder/T3 remain. |
| E7 | Partial | Teacher-entered benchmark values, repeat-form warning and CSV; between-window growth comparison is missing. |
| E8 | Partial | 12 ten-minute local modules and completion tracking; printable participation certificate is missing. |
| E9 | Partial | Roster/scores templates and local alias-only CSV mapping; scores mapping/import and vendor-neutral generic score validation need completion. |

## Decisions and data

Seven Joel decisions are recorded in `data/product-decisions.json`, pinned to
`integration-decisions.md`. Rule 3 of PLATFORM records six scoped data-path
exceptions with guards, fallbacks and retention. These authorize implementation;
they do not claim those later paths are implemented or enabled.

This slice adds no student upload, model call, cloud processing or score. Reading
completion uses `accessPracticeLab:v1:reading-path`; old lesson/progress keys are
not migrated. Teacher role is a preference, never authorization. Recordings kept
from a play use the existing 30-day local media store and Passport delete control.

## STOP items for later waves

- Realtime app and object storage provisioning, bindings, retention and secrets.
- Email provider, letter-token storage and any production tables/migrations.
- Real LMS tool registration/OAuth/secrets and real roster/student-data work.
- Any real email or message delivery.
- Joel-supplied ABC song audio plus WebVTT captions, and 26 fingerspelling images.
- Any redirect, gate, move or replacement of an existing URL's answer.

## Verification record

The branch was rebased onto current `origin/main` and generated shell assets were
refreshed with `node tools/sync-access-shell.mjs`. The latest upstream style
changes were retained alongside the feature, and the shell and worker were
regenerated. Focused Reading Path,
integration, predictive, content, pack, sitemap and save/resume checks passed in
the working tree. Desktop and 320px Reading Path captures were visually reviewed;
navigation, responsive layout, practice disclaimer and footer render as expected.

After rebase, the retrieval-bank and acronym tests pass; the earlier handoff's
main-debt claims were stale. `npm run test:reads` recorded 954 test scripts, with
952 passing and two explicitly skipped because they verified nothing: the opt-in
Workbench Live runtime test was not enabled, and the build idempotency test
declined to run on a modified tree. The module-cache regression was fixed by
regenerating the shell. `data/test-reads.json` was generated by the command and
never hand-edited.

## Final verification, 2026-11-20

- `npm run typecheck` passed: 587/673 files typed, with 86 registered exceptions.
- `npm run validate:no-purple` passed after the touched pixel-art page backgrounds
  were changed to the approved navy.
- `npm run validate:access-lab` passed standalone and in the final gate (1,212
  seconds in the gate).
- `npm run build` passed. The fresh curriculum context and plan vocabulary
  outputs are included in the feature commit. Retrieval-bank and teacher-status
  build side effects were unchanged.
- Built-preview `e2e:access-reading-path` passed all 15 units, bilingual renders,
  silent-e picture change, keyboard rounds, reader and letter views,
  responsive/a11y checks, teacher role, Finder, Today, speaking drafts, survival
  pack and lesson-pack print flow. The adults' word-list print PDF was visually
  inspected: an intro sheet, a six-card sheet and a final two-card sheet.
- Built-preview offline reload passed with the service worker controlling the
  page and local reading progress retained. This check found the shared
  class-platform contract missing from the generated critical cache. The sync
  generator now includes it; the worker tests pass 10/10.
- `QA_TIMEOUT_MS=1800000 npm run qa:fast -- --push` passed 19/19 after rebase
  (1,679 seconds; log `.qa-logs/qa-2026-11-20T08-44-19-852Z.log`). The override
  covers the full Access Lab check's runtime; no gate check was skipped or
  suppressed. Repository tests, build, validation and formatting passed.
- Source screenshots in `/tmp/lp-integration-qa/screenshots/` were visually
  reviewed at desktop, tablet and phone widths in English and Spanish. No
  horizontal page overflow or clipped page content was observed.

## Production deployment and route check, 2026-11-20

- Feature release `d18cc6d2b6` was pushed to `origin/main` by the guarded ship
  workflow. Its build stamp matched production after 220 seconds and the
  post-deploy smoke passed 41/41.
- Live route check confirmed `/access-practice-lab/reading-path` and
  `/access-teacher/` return 200. It found `/library` and `/letters/a` were
  redirecting to unrelated missing pages on `eduwonderlab.com`.
- Route fix `3916674b1b` added query-preserving Language Page redirects for the
  library and letter short links. The guarded ship matched its production build
  stamp after 175 seconds; post-deploy smoke passed 41/41.
- After that release, all four requested paths were checked on
  `thelanguagepage.com`: Reading Path and Teacher Hub returned 200 directly;
  `/library` resolved to `/access-practice-lab/library` and `/letters/a` to
  `/access-practice-lab/reading-path/letters/a`, both returning 200.
- The exact route mapping is covered by `functions/language-page-host.test.mjs`.
  Its focused test passed, and the route-fix push gate and normal commit hook
  each passed 4/4.

The integration remains partial at the boundaries named in the feature matrix.
Passing gates and production routes do not mean Revision 2 is fully integrated.
No credential, production resource, real student record, or live communication
was used.

# Language Page integration audit

Updated 2026-11-19. Feature branch `feat/lp-integration`, rebased onto the
current `origin/main` in the existing worktree. Generated shell files were
regenerated with `node tools/sync-access-shell.mjs` after the rebase. The main
working checkout was not modified.

## Release boundary

Joel's follow-up, “great-- let's get it live”, authorizes deploying the currently
implemented Reading Path and teacher role preference after verification. This is
an incremental release. It is **not completion of the full four-product build**.
Missing and partial items below are not relabelled Built-up-to-STOP. No production
resource, email provider, OAuth client or secret is provisioned in this release.

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

“Covered” means an implemented capability, not a claim that every acceptance
criterion of the full specification has passed. “Partial” names the remaining
work. “Missing” means this slice did not implement the requested feature.

| ID | Coverage | Implementation / remaining work |
| --- | --- | --- |
| 0.1 | Covered | Speaking Lab header now describes LP behavior and practice limits. |
| S1 | Partial | 15 open units, first unfinished Begin, done-only progress, early/older wording and vocabulary. Full unit-completion keyboard persona and all-item axe sweep remain. |
| S2 | Partial | Eight untimed engines with wrong-move invariants, seeded rounds and choices. Silent-e segmentation now represents split graphemes (`a_e`); Word Machine render and click use one shared reel/lexicon module; card, round, stage and reel inputs are clamped. Hunt uses named pictograms; Silent-e picture changes remain. |
| S3 | Partial | 15 original books, six bilingual pages each, 30–80 words; conservative taught-spelling validator; read modes, word tap, boundary highlighting, sentence fallback, arrow turns and end bookmark. The parser is not a pronunciation lexicon; no human phonics or translation review and no proficiency output. |
| S4 | Partial | 3 plays, 12 poems, 12 riddles, 10 tongue twisters, fiction and nonfiction. Shared recorder and explicit local keep. Real-device voice differentiation and microphone checks remain. |
| S5 | Partial | 26 letters, pointer tracing, stroke demonstration, keyboard alternative, three named pictograms and mouth note. Supplied audio/VTT player and 26 fingerspelling slots have honest missing-media states. Letter-name TTS does not replace a human phoneme recording. |
| S6 | Partial | Adults disclosure, full scope, bilingual read-together guidance and word/strip/card print view. DOCX export and exact six-card pagination remain. |
| T1 | Missing | Existing finder untouched. New facets not added. |
| T2 | Missing | Newcomer pack generator and 144-word pack not built. |
| T3 | Missing | Existing download engine retained; combined lesson ZIP/PDF not built. |
| T4 | Missing | Print Studio not built. |
| T5 | Partial | New Reading Path games have seeded New round, A/B/C and 5/10/15 round choices. Fleet-wide adoption and Add to class remain. |
| T6 | Missing | Today at home not built. |
| T7 | Partial | Four-role preference in existing audience key; only first three Teacher Hub cards reorder; old audience strings still read. Teacher Hub still has six task cards, the three-CTA target is unmet, and role labels show EN/ES together. |
| X1 | Missing | Speaking pack schema/editor and assignment settings not built. |
| X2 | Missing | Rehearsal-limit lifecycle not built; games remain untimed. |
| X3 | Missing | New video/screen/choice/conversation response extensions not built. |
| X4 | Missing | Rubric builder and teacher-entered points not built. |
| X5 | Missing | Review desk extensions not built. |
| X6 | Missing | Question banks/pools not built. |
| X7 | Missing | Live provider interface, mock flow and disabled cloud adapter not built. |
| X8 | Missing | Same-device partner assessment flow not built. |
| X9 | Missing | New class report not built. |
| X10 | Missing | Existing LTI/SCORM/Google code retained; new passthrough/import not built. |
| X11 | Missing | Teacher prompt generator not built. |
| E1 | Missing | EL profile IndexedDB store not built. |
| E2 | Missing | Forms engine and six neutral templates not built. |
| E3 | Missing | Letter token route, receipt log and transport interfaces not built. |
| E4 | Missing | Strategy library and pathways not built. |
| E5 | Missing | Deterministic evidence-to-strategy rules not built. |
| E6 | Missing | Objective composer/group scaffolds not built. |
| E7 | Missing | Benchmark panel extensions not built. |
| E8 | Missing | 12 teacher learning modules not built. |
| E9 | Missing | CSV mapping/import not built. |

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

Baseline direct lab, studio, quality and generated-index checks passed. Baseline
changed-scope QA waited on a concurrent worktree's lock; because it later read
this branch during active edits, its module-map/format/read-manifest failures are
not an immutable baseline measurement. Final checks must run after shell sync.

After rebase, `tools/retrieval.test.mjs` passes against current `origin/main`, so
the separate retrieval-bank regeneration/commit is unnecessary. The
`tools/math-acronyms.test.mjs` test still fails on `STAY`, `EL`, and `DOBLE` in
main content; this is main-branch debt and the test/content were not weakened or
changed. That run also reports current-main drift in `tools/content-preservation.test.mjs`
(`6-5.links` baseline) and `tools/math-studio.test.mjs` (generated
`math/studio/6-5/index.html`). Their generators are outside this feature slice.
Consequently `npm run test:reads` cannot yet regenerate `data/test-reads.json`,
and the normal feature commit hook cannot be considered green. No generated read
manifest was hand-edited. See the release verification section appended after
final checks. No unrun check is represented as passing. The five full integration
personas remain outstanding until their dependent features exist.

## Handoff verification, 2026-11-19

The dedicated Reading Path browser test passed its 60 unit renders, 15 book
openings, 26 letter canvases, keyboard-activated Build a Word, role persistence,
responsive screenshots and representative `.rp-page` axe checks at 375/1440.
The build exited 0, but predates the latest early-band/focus edits. Route contract,
sitemap, microcopy, 11 new unit tests and decision tests passed. Full changed-scope
QA is **not green**; its earlier failure and remaining release checks are detailed
in `HANDOFF-CLAUDE-CODE.md`. Nothing is committed, pushed or deployed. Joel requested
a handoff to Claude Code; implementation and deployment stop here for that handoff.

# Claude Code handoff — Language Page integration

## Start here

Continue in **`/Users/joelneft/wt-lp-integration`**, branch **`feat/lp-integration`**.
Do not recreate the worktree, reinstall unnecessarily, or switch to the dirty main
working checkout. This worktree was created fresh from `origin/main` at
`723405a647`; `npm ci` succeeded (125 packages, no reported vulnerabilities).

**Nothing has been committed, pushed or deployed.** All implementation changes
are currently unstaged, including new untracked files. Preserve them.

Joel's latest request is to hand this work to Claude Code. Earlier follow-ups were:
“great-- let's get it live” and “open a preview for me”. Deployment is authorized,
but do not mistake this incomplete implementation for the entire specification.
There was no explicit confirmation that Joel accepts dropping the later waves.
The audit's incremental-release paragraph is Codex's interpretation, not a new
product decision. Complete/reconcile the remaining scope honestly before claiming
completion. Use the repo's guarded ship path when ready; never bypass hooks.

The complete Revision 2 specification is already on disk at:
`/Users/joelneft/wt-lp-integration-prompt/docs/access-practice-lab/integration-prompt.md`.
That reference worktree is a separate task: read the spec there, do not edit it.
Read this worktree's AGENTS.md, CLAUDE.md and applicable platform/content contracts.
Joel's final deploy request supersedes the original push/ship STOP for this task;
provisioning, secrets, real email/messages, real student records and route moves
remain STOP points. Do not copy secure WIDA items or claim affiliation.

## Preview

A source preview is running at:
`http://127.0.0.1:4579/access-practice-lab/reading-path?grades=6-8`

Useful other URLs:

- `/access-practice-lab/reading-path?grades=K`
- `/access-practice-lab/reading-path/short-a/build?grades=6-8`
- `/access-practice-lab/reading-path/short-a/reader?grades=6-8`
- `/access-practice-lab/reading-path/library?grades=6-8`
- `/access-practice-lab/reading-path/letters/a?grades=6-8`
- `/access-teacher/` (role selector above the existing task cards)

The server is an ephemeral Node process using `tools/lib/access-serve.mjs`,
started by Codex exec session 91900. If it exits, restart from the worktree:

```sh
node --input-type=module -e 'import { serveAccess } from "./tools/lib/access-serve.mjs"; const {base}=await serveAccess({port:4579}); console.log(base+"/access-practice-lab/reading-path?grades=6-8");'
```

The browser host was unavailable, so automatic opening failed. Joel received the
clickable preview URL. Do not claim the tab was opened. This source server has
the known bare `web-vitals` module-specifier console error, which the repo's source
browser tests exempt; a built-preview clean-console test is still required.

## What changed

1. **Wave 0 authorization/docs:** Seven requested decisions added to
   `data/product-decisions.json`, pinned to
   `docs/access-practice-lab/integration-decisions.md`. PLATFORM rule 3 has six
   scoped data-path exceptions with guards/fallback/retention. No cloud path was
   enabled. Speaking Lab's inaccurate header was replaced with an LP description.
   `integration-audit.md` has a feature-by-feature partial/missing inventory.
   `provenance.json` is `[]`: no third-party curriculum/art/audio/code was reused.
2. **T7:** `src/audience.js` reads old audience strings and new
   `{audience,role}` JSON records under the existing audience key. Four roles
   reorder only the first three Teacher Hub task cards. The remaining cards keep
   their order. `intro/family-start.js` now uses `rememberAudience` to retain role
   preference. `access-teacher/command-center.js` renders the selector. This is a
   preference, not authorization. No new top navigation link.
3. **Reading Path:** New `content/reading-path/phonics-scope.json`, 15 unit books,
   original fluency and letter content under `content/reading-path/library/`.
   New `src/reading-path/{model,view,library,letters}.js` and
   `games/{engine,pictures}.js`. New `reading-path.css` linked from shell.
   - 15 open units, Begin targets first unfinished unit, done-only local storage
     `accessPracticeLab:v1:reading-path`.
   - Early/older headings and word pools. Same canonical engine; existing
     Science of Reading routes/storage were not replaced.
   - Eight untimed game transitions, shared Sound Builder `place`/`tilesFor`,
     seeded rounds, A/B/C and 5/10/15 round choices.
   - 15 six-page original bilingual readers, 30–80 words each; three read modes,
     tap word, TTS boundary highlighting/sentence fallback, arrow turns, bookmark.
   - 39 fluency texts: 3 plays, 12 poems, 12 riddles, 10 tongue twisters, one fiction
     and one nonfiction text. Plays reuse recorder and existing explicit local
     keep/30-day expiry/Passport delete behavior.
   - 26 letter pages with pointer canvas, stroke demonstration and keyboard
     alternative; pictograms and mouth notes. ABC audio/VTT and fingerspelling
     images are honestly absent; player/slots exist for supplied files.
   - Adults disclosure: scope, read-together guidance, browser-print word list,
     cards and sentence strip.
4. **Wiring:** route parser/loader, sitemap destination, language-host sitemap
   path, early-band allow-list, Student Hub's reading door, feature-flag entries.
   `index.html`, `app-shell` and generated SW block were regenerated with
   `tools/sync-access-shell.mjs`, never hand-edited in their generated blocks.
5. **Checks:** New `validate-reading-path.mjs`, `validate-decodables.mjs`,
   `access-reading-path.test.mjs`, `access-reading-path-e2e.mjs`.
   The first three are wired into `validate:access-lab`; QA coverage includes the
   new tool names. The new e2e exists but is **not yet wired** into a package script
   or the gate. Check gate-coverage. CONTENT.md schema documentation is not yet
   added. The seven validators for later waves do not exist yet.

## Verification evidence (not a release pass)

Logs are under **`/tmp/lp-integration-qa/`**.

Passed:

- `node tools/product-decisions.test.mjs`: 32 decisions, 7 mutations.
- `node tools/validate-reading-path.mjs`: all 15 unit shapes, EN/ES, item counts.
- `node tools/validate-decodables.mjs`: all 15 books, page/word counts and
  conservative taught-spelling parser; known-bad words/counts/Spanish fail.
- `node --test tools/access-reading-path.test.mjs`: 11 tests, all eight wrong-move
  invariants, all unit/game completion, seeded order, bookmark and audience roles.
- `node --test tools/access-sitemap.test.mjs`: 5 tests; existing six-place nav
  contract still passes. This does not prove the full CTA budget.
- `npm run validate:route-contract`: 19 existing route answers, six self-tests.
- `npm run validate:microcopy`: passed the repo gate, but that gate reports lesson
  and engine strings; do not claim exhaustive new LP-copy grade-5 coverage.
- Direct baseline lab/studio/quality/index checks passed. Baseline typecheck
  passed (debt ratchet, 587/673 files, 86 marked); rerun after final edits.
- `npm run build` exited **0**. Its snapshot predates the most recent
  early-band-gate fix and minor game-focus change. Rebuild final code.
- **Latest `node tools/access-reading-path-e2e.mjs` exited 0:**
  all 15 unit pages × two skins × EN/ES (60 renders); five Build a Word rounds
  using keyboard activation and wrong-move recovery; completion reload; opening
  all 15 books and arrow-key page turns/end bookmark; all 26 letter canvases and
  Show me; 39 library links; teacher-role ordering/reload; screenshots and overflow
  at 1440/768/375/320 EN/ES; axe scoped to `.rp-page` for six representative surfaces
  at 375/1440; no unexpected source page errors.
  It is NOT full-unit keyboard completion, every-game browser coverage, full-site
  axe, true tab-only unaided persona coverage, or real-device microphone testing.
- `git diff --check`: clean at handoff.

Failed/not yet resolved:

- Initial `npm run qa:fast` queued on another worktree's QA lock, then ran while
  files were being edited. It failed formatting, stale generated module map,
  test-read manifest, and a browser select timeout. It is NOT green.
  `baseline-fast.log` has details. The scheduler labelled the browser timeout a
  contention signature; do not assume that establishes the cause—rerun alone.
- Subsequent explicit formatting and shell sync occurred, but **no final qa:fast**.
- `data/test-reads.json` must be regenerated via the supported `npm run test:reads`
  process after adding/staging the new files. Earlier trace verification explicitly
  failed because newly traversed files were untracked/unlisted. Do not hand-edit
  the generated manifest or bypass this gate.
- Full `validate:access-lab`, studio/lab regression e2e, full axe sweep, offline
  reload, built-preview console check, print rendering and source diff review have
  not passed for the final state. Screenshots exist but were not visually inspected.

## Known implementation gaps / review targets

Do not ship under a “full integration complete” claim.

- S1: full keyboard unit completion/persona remains; older skin is mostly wording
  and different game words, not a fully authored older reader catalog.
- S2: Silent-e Switch lacks before/after picture changes. Its base/post words are
  fixed by unit. Build segmentation currently matches contiguous chunks and does
  **not** correctly represent a split silent-e grapheme such as a_e.
  Word Machine has duplicated reel arrays in render/click code and a small
  hardcoded word list; some real words may incorrectly say “Not a word”. Fix its
  canonical lexicon/classification before release. Hunt uses labelled Unicode
  pictograms, not authored picture assets; unit 15's /ai/ and /ee/ y sounds need
  precise instructions. Card/round/stage selections lack hardened boundary
  sanitization. The pure tests prove state transitions, not all pedagogy/UI behavior.
- S3: review the phonics parser for sound accuracy. It is a conservative spelling
  checker, not a complete pronunciation lexicon. Scope example words are not
  exhaustively pronunciation-validated. No human translation/content review.
- S4: real-device audio capture and distinct available voices are untested. If the
  device has one voice it falls back to pitch variation; do not promise distinct
  voices everywhere.
- S5: several pictograms are approximate (e.g. igloo illustrated as ice); human
  phoneme recordings absent, TTS currently reads example words. Verify spelling
  images/player accessibility and lowercase/stroke guidance before claiming S5 done.
- S6: no DOCX export/exact six-up pagination yet; print calls `printSheet` directly.
- T7: existing home still has six task cards. CTA <=3 requirement is not satisfied
  merely by reordering. Role selector shows EN/ES together rather than following
  site language mode. Runtime consumers of the two new feature flags are absent.
- Reading home has only one sitemap entry, but library and letters also need
  explicit findability/reachability review; K–3 home entry and Family home entry
  have not been added. Student reading door changed destination; confirm its
  label/description match the new destination and existing content is still reachable.
- `CONTENT.md`/`STUDIO-CONTENT.md` need the new schemas documented.
- The new validators cover their schemas, not every cross-cutting rule demanded
  by §6. Self-tests should run before sweeping; currently some sweep computations
  precede mutation assertions. Do not overstate them.
- **T1–T4, T6, X1–X11 and E1–E9 remain unbuilt.** T5 is only partially present
  on new reading games, not all LP games and no Add to class. There are no mock
  provider implementations for X7/E3 yet. Do not call these Built-up-to-STOP.

## Build side effects to keep out of the feature commit

The initial worktree was clean. The build changed these unrelated generated files:

- `data/retrieval-bank.json` (42 additions/42 removals)
- `teacher-tools/canvas-command-center/status.json` (two additions/two removals)

Inspect before selectively restoring only those generator side effects; don't
blanket-reset the worktree. No other session's work should be removed. Review
all generated changes in final git status. The main working checkout at
`/Users/joelneft/neft-classroom-html-activities` had extensive pre-existing changes;
none were touched, and it must stay untouched.

## Recommended continuation

1. Preserve this dirty worktree. Read full spec and audit; fix the concrete game,
   content and integration gaps above before presenting the slice as release-ready.
2. Review rendered screenshots in `/tmp/lp-integration-qa/screenshots/`; test
   print, keyboard, source/built console, offline reload and existing routes/keys.
3. Document schemas, wire the browser test, stage intended files, regenerate index,
   shell and test-read manifest with their supported tools. Run meaningful narrow
   checks and the required changed-scope/release gate; don't rerun unrelated checks
   without reason. Never suppress or route around a failing gate.
4. Finish remaining waves from the full spec unless Joel explicitly narrows the
   release. Keep missing features visible in the audit and report actual scope.
5. Commit only the reviewed feature branch. When truly ready and within Joel's
   live authorization, use `ALLOW_DEPLOY=1 npm run ship -- <reviewed-sha>` as defined
   in this checkout's `docs/deploy.md`, then verify production stamp and actual
   thelanguagepage.com routes. Do not use manual wrangler deploy, --no-verify,
   force push, secrets, production provisioning or real student records.

Codex's active build/test jobs finished before handoff. Only the local preview
server was intentionally left running. No deployment job is running.

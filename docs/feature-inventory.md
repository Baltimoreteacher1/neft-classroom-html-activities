# Language Page feature inventory (F0, 2026-11-25)

How this was made: `node tools/audit/data-ui-coverage.mjs` (data-to-UI matrix over 162 units and their lesson documents),
G-13 (the coverage floor, `node tools/validate-language-page.mjs --only G-13`), reading the code, and running the Studio tab
in Chromium. "Run" below means exercised in a browser or by a gate in this change; "read" means the code and its registry
entry were read and nothing more. The matrix is a static name-based heuristic, so every verdict that matters was checked by hand.

## 1. Data to UI: what the matrix says

570 populated field paths; 132 block-level paths (`root.field`, arrays counted once). Before the routine blocks, 28 block paths
had no reader that draws them. After, 12 remain, every one in `tools/audit/data-ui-allowlist.json` with a written reason and
re-checked by G-13 on every run (a stale entry fails).

Hand check of the "rendered" column: 26 block paths were read in the source (path, reader file, the line that reads it). 24 were
true reads. 2 were false positives, both identity keys (`reading.unit_id`, `lessons[].id`). So the heuristic can over-credit
id-like fields; it did not over-credit a teaching block in the sample. Identity keys are listed so nobody mistakes them for gaps.

### Data present, UI missing: ranked by teacher value x effort (before A1)

| #   | Block                                                                               | Units | Was on screen?     | Print                  | Value  | Effort | Status after A1                                                                    |
| --- | ----------------------------------------------------------------------------------- | ----: | ------------------ | ---------------------- | ------ | ------ | ---------------------------------------------------------------------------------- |
| 1   | `connections[].partner_talk_protocol` (roles, prompts, talk moves)                  |   162 | no                 | unit packet            | high   | low    | Studio card + `rt-partner`                                                         |
| 2   | `connections[].language_exit_ticket_json` (quick rubric, look-fors, frame, model)   |   162 | no                 | packet                 | high   | low    | `rt-exit` (teacher)                                                                |
| 3   | `connections[].common_language_misconception` (teacher redirect) and `l1_watchouts` |   162 | no                 | packet                 | high   | low    | `rt-redirect` (teacher)                                                            |
| 4   | `esol_pack.info_gap` (cards A/B, stems, rules, task)                                |   162 | no                 | packet page            | high   | low    | `rt-infogap`                                                                       |
| 5   | `esol_pack.dictogloss` (steps, key words, tier note)                                |   162 | no                 | packet (text only)     | high   | low    | `rt-dictogloss`, `rt-dictokey`                                                     |
| 6   | `esol_pack.doctor` (error-correction items with the rule)                           |   162 | no                 | packet key             | medium | low    | `rt-doctor`, `rt-doctorkey`                                                        |
| 7   | `esol_pack.ladder` (tiers by band)                                                  |   162 | no                 | packet (one band)      | medium | low    | `rt-ladder`                                                                        |
| 8   | `esol_pack.talk_line` (four corners, stems by band)                                 |   162 | no                 | packet statements only | medium | low    | `rt-talkline`                                                                      |
| 9   | `esol_pack.retrieval`, `double_duty`, `routines`, `cognates`                        |   162 | no                 | partial                | medium | low    | `rt-retrieval`/`rt-retrkey`, `rt-doubleduty`, `rt-routines`, `rt-cognates`         |
| 10  | `esol_pack.objectives`, `klu`, `passport`, `newcomer`, `family`                     |   162 | no                 | partial                | medium | low    | `rt-goals`, `rt-passport`, `rt-newcomer`, `rt-homeplan`                            |
| 11  | `connections[].lesson_arc`                                                          |   162 | no                 | packet                 | medium | low    | `rt-arc`                                                                           |
| 12  | `esol_pack.week_plan` (5 days, minutes, sections)                                   |   162 | no                 | packet                 | high   | medium | NOT done: A2 My Week planner owns it (needs the block-length budget). Allowlisted. |
| 13  | `family_card.*` (legacy two-line card)                                              |   162 | no                 | packet                 | low    | n/a    | Allowlisted: superseded by the family guide.                                       |
| 14  | `connections[].interactive_cloze_items`                                             |   162 | via cloze activity | packet                 | low    | n/a    | Allowlisted: derived from `studio.vocab`.                                          |

Not gaps, though the matrix first flagged them: `connections[].mentor_sentence_unpacking` (drawn through `studio.mentor` in the
Overview tab, same text), `esol_pack.version`, `*.unit_id`, `provenance.source`/`notice` (shown through the shared draft label).
`lessons[].reveal` is populated for 6 units only (Grade 6 Math), not 162; `module.*` for 27 ELA units. Both are read by the
Language Studio lesson and module views.

Content notes for the authors (not changed here): the authored exit-ticket rubric and the home-language watch-outs sometimes
mention "blocks" as a model (for example the Grade 2 Math Unit 1 rubric and watch-outs, `g2-math-u1`; not counted across all units). These blocks render the authored text as
written; nothing was reworded.

## 2. Existing platform features

Not rebuilt. The lab home registers 96 cards (`access-practice-lab/src/home-registry.js`): 11 start, 57 explore, 18 teach,
10 family, each checked by `tools/access-home-start.test.mjs` for a real route.

| Feature                                                                                             | Where                                                                  | State                                         | Checked by                                                    |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Teacher hub: unit picker, WIDA band toggle, tabs (Studio, Overview, Vocab, Reading, Create, Family) | `bcpss-teachers/`                                                      | exists, works                                 | **run** (Studio tab at 1366, 768, 320; band switch redraws)   |
| Studio tab shelf: activities, lessons, printables, Assign                                           | `bcpss-teachers/studio-tab.js`                                         | exists, works                                 | **run** (Assign dialog opens; export links answer 200)        |
| Routines and checks (new)                                                                           | `bcpss-teachers/routines/`                                             | new in this change                            | **run** + G-13, G-61..G-63                                    |
| Quick Print Kit, Share Plan, Project to Board                                                       | hub header and toolbar                                                 | buttons exist                                 | read (`bcpss-teachers/index.html`, `renderPrintKit`); not run |
| Class platform: join by code, alias-only roster, assignments, class view                            | `shared/class-platform/`, lab `class` views                            | exists                                        | read; the assign dialog was run, the class API was not        |
| Save/Resume                                                                                         | `shared/save-resume/save-resume-engine.js`, injected into the hub page | exists                                        | read; see note below                                          |
| Speaking recorder (Speaking Studio `speak`, Speaking Lab `extempore-speak`)                         | lab views                                                              | exists                                        | read (registry); not run                                      |
| Practice tests, Road to ACCESS (`road`), WIDA practice studios (`studios`)                          | lab views                                                              | exist                                         | read (registry); not run                                      |
| Create a Book (`book-studio`), Find My Next Step (home shortcut to `path`)                          | lab nav and `home-start.js`                                            | exist                                         | read; not run                                                 |
| Voice, Comfort, More menus; Display (Aa)                                                            | lab `comfort.js`, hub comfort disclosure                               | exist                                         | read (files present); not run                                 |
| Service worker                                                                                      | `access-practice-lab/sw.js` (lab only)                                 | exists; the teacher hub is not pinned offline | read                                                          |

Save/Resume note: the new routine "used this week" ticks have stable ids (`rt-used-<unit>-<block>`) that the engine keys on, and
their open/ticked state also survives the redraw a band switch causes (verified in Chromium). Capture by the engine itself was NOT
verified: with no student session started `NeftSaveResume.getState()` returned null in the probe.

## 3. The three lists

**Exists and works (run this session):** teacher hub Studio tab, band switch, Assign dialog, export endpoint for every routine
part (web page and Word), routine blocks on screen and in print at three bands, G-01..G-12 (see the gate report).

**Exists but incomplete:** `esol_pack.week_plan` is print-only (A2); the unit packet's ESOL page shows one band of the ladder
and no routines, retrieval, passport, newcomer or cognate detail (now covered by the `rt-*` parts); Language Studio dictogloss and
info-gap activities read `studio.activities[].payload`, not `esol_pack` (two separate sources; whether their text matches was not compared);
Reveal numbering exists for Grade 6 Math only (6 units).

**Data present, UI missing, still:** `esol_pack.week_plan` (A2), legacy `family_card.*`, the `interactive_cloze_items` copy. Everything
else the matrix found now has a card and a print part.

## 4. Where this leaves Prompt 2

A1 is done for every block F0 found except the week plan. A2 (My Week planner) is the next highest value and only needs the
`week_plan` data plus a block-length budget. The matrix and G-13 now fail if a new authored block is added without a renderer or
a written reason, so the next "wire the unused data" audit is a gate result, not a project.

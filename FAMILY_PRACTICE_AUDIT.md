# Family Practice Audit

Audited 2026-11-20 against `origin/main` (`d18cc6d2b6`) in a fresh worktree. Live site checked read-only. Scope, per Joel's latest message: **the per-lesson family practice pages** (`/lessons/<id>/homework`, e.g. 6-6) for every lesson. Hub, weekly sheet, Math Studio, letter and Broadcast are covered only where they touch those pages (Appendix A).

## Decisions already made (do not ask about these)

- Family practice is OPTIONAL and UNGRADED everywhere. Remove all bonus-point language from the weekly sheet, the hub, the family letter, the Broadcast, print/PDF versions, and the teacher publishing flow. Replace it with encouraging, no-pressure wording in EN and ES (e.g., "Optional practice. No grades. A few minutes together helps." / "Práctica opcional. Sin calificaciones. Unos minutos juntos ayudan."). The weekly sheet becomes a personal progress tracker, not something to turn in.
- Family practice is INTERACTIVE first, with print as a backup. Every weekly homework item should work on screen with instant feedback; the printed version is a simplified companion, not the main experience.

## What exists already (this changes the plan)

The brief reads as if the family practice were a worksheet to be upgraded. It is not. `main` already ships the **Family Math Studio v3** system, and most of the "interactive first" goal is built:

| Piece                                                                                                                           | Where                                                                                                                                                                            | State                        |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 166 generated pages (87 base pages + 79 `-part2`/`-part3` pages; 84 of them also have a publisher homework PDF)                                                       | `lessons/<id>/homework.html`, built by `scripts/generate-homework-html.mjs` (+ `scripts/lib/homework-*`, `scripts/homework-*.mjs`)                                               | live                         |
| Per-lesson content                                                                                                              | `data/family-homework-notes/<id>.json` (`v3` block: hook, model, transfer, glitch, spiral, kitchen-table, vocab, confused-grown-up; contract `docs/specs/family-homework-v3.md`) | 166/166 authored, EN+ES      |
| Route picker (5 / 10–15 / 15–20 min), Start button on the first screen, 5 stops (Discover, Build, Practice, Improve, Finish)    | page + `assets/homework/homework-core-*.bundle.js`                                                                                                                               | live                         |
| Instant feedback, hint ladder, retry, "Show me another way / Practice more / Challenge me"                                      | same bundle, `engine/core/hint-ladder.js`                                                                                                                                        | live                         |
| Hands-on models (12 draggables and 23 canvases on 3-3), math-visual grammar                                                     | `assets/design/family/art/math-models.mjs`, `assets/family-studio/picture-*.mjs`, `assets/family-mission/{models,explain,rescue,celebrate}`                                      | live                         |
| Almost-right ("spot the glitch"), Confused Grown-Up role play, Talk it through                                                  | v3 `glitch`, `confused`; `curriculum/almost-right-lab/` is the separate lab                                                                                                      | live                         |
| Print: Family Take-Home Sheet (≤2 pp, Letter) with QR to the page, plus 1-page grown-up answers-and-talk PDF, EN+ES, per lesson | `scripts/generate-family-takehome.mjs`; `lessons/<id>/downloads/<id>-family-{sheet,guide}[-es].pdf`                                                                              | 166/166 present              |
| Gates: content, v3 math recompute, Spanish, a11y (axe), design tokens, print, performance, experience (390px)                   | `npm run validate:family-*`                                                                                                                                                      | exist; not run in this audit |

So Phase 2 should be **a thin "week" layer plus fixes on top of v3**, not a second template. Details in "Proposed plan".

## Findings

Severity: Critical = blocks the stated decisions or misleads families. Major = real clarity or engagement loss. Minor = polish.

### Critical

**C1. Grading language still ships on every lesson page and print surface, against the decision.** A family sees "Optional. No grades" and, one card later, the weekly-sheet block that leads to "show it on Friday for bonus points".

- Weekly-sheet card on every lesson page: `scripts/lib/homework-hero.mjs:225-231` (links to the sheet; the sheet carries the language).
- Sheet screen copy: `curriculum/family-connections/weekly-sheet/weekly-sheet.js:11,19,21,31` (EN intro "earn bonus points", "bonus goal reached!", ES "puntos extra", "punto extra"), the "Show my teacher" dialog (`weekly-sheet.js:151-171`).
- Sheet print/PDF: `weekly-sheet/sheet-render.js:22,36,39,48,64,67,180` ("Bonus goal: practice 3 of 4 nights", "Teacher use: Nights counted / Bonus given", grown-up signature line). All 80 weekly PDFs plus `all-weeks*.pdf` in `weekly-sheet/downloads/` carry it (verified: week of Nov 16 EN/ES, Nov 23).
- Hub header: `curriculum/family-connections/index.html:18` and `shared/weekly-sheet-links.js:9,15` ("show it on Friday for bonus points"); sheet meta description `weekly-sheet/index.html:9`, intro `:32`.
- Data and test: `weekly-sheet/weeks.json` `bonusNights: 3`, `week.goal`, `week.turnIn`; `weekly-sheet.test.mjs:11-21` asserts the goal and turn-in day. `scripts/generate-weekly-sheets.mjs:91`.
- **Also inside the lesson pages themselves**, the word "bonus" names extra problems: `scripts/generate-homework-html.mjs:1578` and `scripts/homework-guided-notes.mjs:8497` (the "+N bonus / extra" chip, on all 166 pages), `assets/homework/homework-core-*.bundle.js:4926-4930,5889-5901`, and `assets/family-mission/celebrate/index.mjs:26,42,135,165` ("N bonus solved", `earned: d.bonus >= 1`). This is not grading, but it fails the "no bonus anywhere" sweep and reads as reward-for-more. Proposal: rename to "Challenge".
- Live proof: `https://eduwonderlab.com/curriculum/family-connections/` first screen, `https://eduwonderlab.com/curriculum/family-connections/weekly-sheet/`.

The teacher publishing flow (`teacher/*`, `functions/api/family-connections/domain.js`) has **no** bonus wording; only the hub text above needs changing there. The family letter and Broadcast contain no bonus/points/turn-in text (grep clean).

**C2. The lesson page never talks to the weekly sheet, so "progress" is a separate chore.** The page only _links_ to the sheet (`assets/homework/homework-core-*.bundle.js:6359-6384`, `weeklySheet()`; it just picks the week's PDF URL). Completing practice writes `hw_exp_<id>_solved`, `hw_family_path_<id>`, `hw_mission_evidence_<id>` but never `ws:v1:<weekStart>` (`weekly-sheet.js:61-95`). A family must finish on one page, then go tick a box on another. The sheet also needs a grown-up to check the box and add initials by hand, i.e. it is built as a turn-in form, not a tracker.

**C3. The "this week" start path is broken in practice.** The hub's current plan comes from `/api/family-connections/published`, and the live snapshot is **revision 14, published 2026-10-02**, week of Sep 28 (lessons 3-8, 3-9, 3-10). Today is Nov 20. The hub shows "Waiting for this week's homework … Tonight anyway" (graceful, no error) but there is nothing to start. Meanwhile the weekly sheet (from `weeks.json`, the pacing plan) says this week is lessons 6.9–6.12. Two sources of truth for "this week" disagree by seven weeks. A "Start here" button must derive the week from the pacing plan when nothing is published, and the teacher flow should not be the only way a week appears.

### Major

**M1. Time to first math is long.** On 6-6 at 375px: Start Quick Practice (tap) → lands on Step 1 _Discover_ (read key concept, "Tap to enlarge", "Why this works", "Watch it step by step", "Try the interactive model →") → Next → Build → Next → Practice. The "5 min · Problems with hints" route still opens on reading. First problem is ≥3 taps and a long scroll away. Quick Practice should open on problem 1.

**M2. First screen answers "what / how long / graded?" but not "what is done?".** Present at 375px: lesson title, a real-life hook card, three route cards with minutes, "Optional. No grades, no account. Saved on this device." and "Today's mission: 5 practice problems." Missing: what "done" looks like in a sentence, and what the grown-up's job is (the grown-up card is below the fold, ~"For the grown-up · Help My Child" deep in the page). Page height on 3-3 is ~3,520 px at 375px and 98 `<details>`, so the first screen carries the weight but the rest is a long scroll of optional panels.

**M3. Reading level above target in the family-facing sidecar text (rough).** My heuristic Flesch-Kincaid (own syllable counter, English fields only; single short vocabulary-heavy sentences inflate it) puts **868 of 3,932** strings above grade 7. Worst groups: `learningTonight` 127/166 pages, `bridge` 132/441, `watchFor` 237/507 (e.g. `3-1-part2`: "Listen for 'scale factor' … 'equivalent ratios'"), `corner` 120/865; `bigIdea` 86/166; hooks 1/166. The existing gate `validate:family-plain-definitions` only covers glossary definitions. Needs a real readability tool in Phase 3 before I rely on these numbers.

**M4. "Almost right" and "Talk about it" are present but not a consistent, tap-to-reveal pair.** v3 has `glitch` (spot-the-glitch, base pages exclude it by contract: "`-part2/-part3` pages carry a spot-the-glitch … base pages none", `docs/specs/family-homework-v3.md`) and Confused-Grown-Up rounds. So 87 of 166 pages (every base page: 78 math, 9 mindset) have no `glitch`, so no "almost right" at all; the 79 `-part2`/`-part3` pages all do. No read-aloud on "Talk about it" prompts (read-aloud exists only for stops and the big idea).

**M5. Answer key and "why" are split, and the "why" is sometimes empty.** Printed keys live on the separate grown-up PDF (good). On the grown-up PDF for 8-4, item 5 reads "n is more than 19. n is more than 19 matches n > 19." — a restatement, not a reason (`lessons/8-4/downloads/8-4-family-guide.pdf`, p1). The gate checks "the explanation states the answer", not "gives a reason". Needs a sweep of the six `basicPractice` explanations per lesson.

**M6. Native or silent failure modes.** Math Studio reset uses a native `confirm()` (`math-studio/studio.js:35`), which the homework pages' own gate forbids. The lesson page without JavaScript shows the hook, route picker and a fallback sentence for the models only (`<noscript>` in `lessons/6-6/homework.html`), and no problems; the hub shows one sentence (`index.html:23`). Practice needs the JS bundle, so with scripts blocked a family sees a hook card and no math. Print is the real no-JS path, and the page doesn't say so.

**M7. Weekly sheet tap targets and sheet-to-page ordering.** On the live sheet at 375px, the check boxes measure 40×40 and initials 55×40 (below 44). The sheet's row lists "Family homework · Lesson 6.9 …" with a link but no hint of which route to take or that the lesson page exists in Spanish.

**M8. Math Studio has 4 worlds for 10 units** (recipe, market, garden, sale; `math-studio/studio.js:2-12`). `defaultWorld` is chosen only for `?lesson=4-` and `5-` (`:13`); every other lesson defaults to "recipe". Units 1, 2, 6, 7, 8, 9 have no matching world. Lesson pages link to the Studio only via the hub, not per lesson.

### Minor

- m1. Context variety is skewed by unit: Unit 7 hooks are 13 map + 5 scoreboard, no recipe/price/receipt; Unit 3 is 9 of 19 recipe (`data/family-homework-notes/*.json` `v3.hook.style`; overall ticket 34, map 38, price-tag 26, scoreboard 30, receipt 22, recipe 16). Styles are six card templates, not six lives; check the stories themselves in Phase 3.
- m2. Spanish term variants: "razón unitaria" (8 strings, e.g. `3-6`) vs "tasa unitaria" (103); "por ciento" (4) vs "porcentaje" (219). Mostly consistent. No English left in Spanish strings. `validate:family-spanish` and the glossary exist and were not re-run.
- m3. Printed sheet has Name and Date lines (`lessons/3-3/downloads/3-3-family-sheet.pdf`). Not a turn-in or signature line. Flagged only because the brief now says "no signature or turn-in line".
- m4. Weekly sheet prints "Bring this sheet to class today" on non-Friday days in short weeks (week of Nov 23: Tuesday), and "Bonus goal: practice 1 of 1 night" (a one-night week). Goes away with C1.

### What is already good (do not rebuild)

- The first screen on lesson pages already has a language switch, a real-life hook, three timed routes, a Start button inside one phone screen, and "Optional. No grades, no account. Saved on this device."
- All 166 pages: EN+ES sidecars, six EN/ES multiple-choice skill items (158 pages; the 8 Unit 10 mindset pages have none, by contract), per-wrong-choice feedback, 3-step hint ladders.
- All weekly-sheet and take-home download links return 200 and `application/pdf` live (`week-2026-11-16[-es].pdf`, `week-2026-11-23.pdf`, `all-weeks.pdf`, 3-3 and 8-4 sheets and guides). Take-home sheets are Letter, two pages, with a QR and short link. The previous `href="#"` in the sheet HTML (`weekly-sheet/index.html`) is rewritten by JS (`weekly-sheet.js:paintChrome`), not left dead, except with JS off.

## Clarity checklist (lesson pages)

| Check                                              | Result                                                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| First screen says what the math is                 | Yes: title + hook + "Tonight's idea" chip                                                                                   |
| How long                                           | Yes: route cards                                                                                                            |
| What "done" looks like                             | Partly: "Today's mission: 5 practice problems"; nothing about the grown-up's part (M2)                                      |
| Graded or not                                      | Yes on the page; **contradicted** by the sheet card (C1)                                                                    |
| One action per sentence, grade 6–7 reading level   | Mostly in hooks; not in `learningTonight`/`watchFor`/`bridge` (M3)                                                          |
| Same model and vocabulary as class                 | Yes by design (`classModel`, `model.kind` per lesson, `docs/specs/family-homework-v3.md`)                                   |
| Worked example and key with a one-line why         | Worked example yes; why sometimes tautological (M5)                                                                         |
| Hub / sheet / lesson / Studio relationship obvious | No (C2, C3, M8)                                                                                                             |
| Spanish complete and natural                       | Appears complete (no empty `es` for `{en,es}` pairs; 158/158 skill items parity); naturalness not judged by a native reader |

## Engagement checklist (lesson pages)

| Check                            | Result                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Time to first action             | ≥3 taps + reading on Quick route (M1)                                                                              |
| Real, varied, inclusive contexts | Six card styles, food/shopping/maps/scores; Unit 7 lopsided (m1)                                                   |
| Reason to talk together          | Yes: "Talk it through", Confused Grown-Up, Kitchen table; not tap-to-reveal, no read-aloud (M4)                    |
| Visible progress without shame   | Per-page goal meter (0/5) and "Finished for today"; **no week view** (C2); no per-night tracking tied to the sheet |
| Reward moment worth showing      | `assets/family-mission/celebrate` badge and "Photobooth Studio"; shows "bonus solved" (C1)                         |
| Reason to return next week       | None beyond the teacher's weekly note (C3)                                                                         |
| PDF and print links work         | Yes (verified live)                                                                                                |
| Without JavaScript               | Hook, route cards, fallback text, no problems (M6)                                                                 |

## Top 10 (ranked)

1. **C1** Bonus and turn-in language on the sheet, hub text, sheet PDFs (80 + 2), and the "bonus" chip on all 166 lesson pages.
2. **C2** Lesson pages don't update the weekly tracker; the tracker is a manual turn-in form.
3. **C3** "This week" has two disagreeing sources; live hub is stale since 2026-10-02.
4. **M1** Quick Practice opens on reading, not problem 1.
5. **M4** Base pages (87) have no "almost right"; talk prompts aren't tap-to-reveal and have no read-aloud.
6. **M3** Reading level above grade 7 in a large share of sidecar text (needs a proper tool to confirm).
7. **M5** Some printed "why" lines restate the answer.
8. **M8** Math Studio: 4 worlds for 10 units; no per-lesson link.
9. **M6** No-JS leaves families with no problems; Math Studio uses a native `confirm()`.
10. **M7** Sheet check boxes under 44px; the sheet doesn't point to the exact lesson route.

## Proposed plan

1. **Template = v3 + a week layer, not a new page.** Keep the 5 stops and the six skill items. Add: (a) a one-line "done looks like" + grown-up-job line on the first screen; (b) Quick route opens on problem 1; (c) base lessons gain "Almost right", using v3 `glitch` data authored for the 78 base math pages (EN+ES), with `glitch`, "Talk about it" and "Almost right" as tap-to-reveal with an EN/ES read-aloud button reusing the existing `Listen` engine.
2. **One shared "week" module** (`assets/family-week/`) that is the only source for "this week": reads the pacing plan (`weekly-sheet/weeks.json`), overrides with a teacher publish when one exists. The lesson page marks tonight done in `ws:v1:<weekStart>` (existing key and shape, so saved sheets keep working). Sheet becomes a tracker: nights shown as check marks, no goal, no "teacher use", no signature, no "Show my teacher" dialog (becomes "Show a grown-up" replay card).
3. **Hub:** "Start here" button for this week's lesson (Quick route, one tap) with the sheet and the Studio labeled as next steps.
4. **Replay card:** adapt `assets/family-mission/celebrate` (already a badge) into an end-of-week card from the sheet's local state, no names.
5. **Math Studio:** add worlds for units 1, 2, 6, 7, 8, 9 (the same `worlds` shape) and a `?lesson=` mapping for every unit, plus a link from each lesson page's Finish stop.
6. **Print:** keep the take-home sheet and grown-up page (already 1–2 pages + QR + separate key); remove the weekly-sheet signature and teacher block; regenerate the 82 weekly PDFs.
7. **Rename "bonus" to "Challenge"** in the page, Celebrate and docs; wording per your decision on the sheet, hub, PDFs.
8. **Reuse, not build:** `engine/core/hint-ladder.js` (hints), `assets/family-mission/{models,explain,rescue,celebrate}` (models, talk, rescue, badge), `curriculum/almost-right-lab/equations/mission-coach.js` (almost-right pattern), `assets/family-studio/picture-*.mjs` (models), `shared/qr/qr-code.mjs` (QR), `scripts/generate-weekly-sheets.mjs` (sheet PDFs). The "Living Math Canvas" lives at `curriculum/learning-labs/shared/ewl-bridge.mjs` and `tools/ewl-canvas.test.mjs`; I will confirm what it offers before using it.
9. **Gates:** extend the existing ones instead of adding parallel ones: add a "no grading words" sweep and an EN/ES parity check to `validate:family-homework-content`; a readability gate with a real tool; re-run `validate:family-*` and the a11y/experience browsers.

Open items I will not decide for you:

- Replace the Name and Date lines on the take-home sheet with a free line, or keep them?
- Phase 3 originally asked for a signature line; your latest message says none. I am following the later one.
- Your latest message limits scope to the lesson pages. The bonus decision names the sheet, hub, Broadcast and teacher flow too, so I will make only the wording and sheet-tracker changes there, and leave the letter, Broadcast and Studio otherwise alone unless you say to widen scope.

## Appendix A: adjacent surfaces (touched only where listed above)

- Hub `/curriculum/family-connections/`: data from `/api/family-connections/published`; stale snapshot (C3); `family-app.js:512-513`.
- Weekly sheet: `weekly-sheet/{index.html,weekly-sheet.js,sheet-render.js,weeks.json}`; 80 weekly PDFs + 2 all-weeks, generated by `scripts/generate-weekly-sheets.mjs`.
- Math Studio: `math-studio/{index.html,studio.js,studio.css}`.
- Teacher publishing: `/family-connections/teacher/` returns 401 without sign-in (expected). Not inspected past static source; contains no bonus language.
- Family letter and Broadcast: no grading language found.
- Another worktree, `~/wt-family-engage` (`feat/family-engagement`), has unmerged "Family Language Story" and "Share with families" commits. Check for overlap before building the share link and replay card.

## Not verified

- Gates (`npm run validate:family-*`) were not run: the fresh worktree has no `node_modules`.
- Math accuracy of the 166 × 6 skill items and answer keys: not yet re-solved (Phase 3).
- Axe, contrast, keyboard paths and offline/Chromebook behaviour: not measured here.
- Teacher flow beyond a source grep; letter and Broadcast read only for grading words.
- My clipboard note: one synthetic click on 6-6 triggered the page's copy handler once. Nothing was changed on the site.

## Appendix B: inventory (all 166 pages)

"Kind" is the v3 `kind` (`mindset` = Unit 10 style, no model or skill items). ✓/✗ columns are EN/ES. "Answers" = the on-page Answer sheet section.
| Lesson | Title | Standard | Kind | Page EN/ES | Answers | 6 skill items EN/ES | Take-home sheet EN/ES | Grown-up answer page EN/ES | Homework PDF | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| 1-1 | Math is Mine | MPP.3 | mindset | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/1-1/homework.html` ← `data/family-homework-notes/1-1.json` |
| 1-2 | Math is Exploring and Thinking | 5.NF.B.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/1-2/homework.html` ← `data/family-homework-notes/1-2.json` |
| 1-3-part2 | 1.3 · Part II | 5.NBT.B.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/1-3-part2/homework.html` ← `data/family-homework-notes/1-3-part2.json` |
| 1-3 | Math is In My World | 5.NBT.B.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/1-3/homework.html` ← `data/family-homework-notes/1-3.json` |
| 1-4-part2 | 1.4 · Part II | 5.MD.C.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/1-4-part2/homework.html` ← `data/family-homework-notes/1-4-part2.json` |
| 1-4 | Math is Explaining and Sharing | 5.MD.C.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/1-4/homework.html` ← `data/family-homework-notes/1-4.json` |
| 1-5-part2 | 1.5 · Part II | 5.OA.B.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/1-5-part2/homework.html` ← `data/family-homework-notes/1-5-part2.json` |
| 1-5 | Math is Finding Patterns | 5.OA.B.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/1-5/homework.html` ← `data/family-homework-notes/1-5.json` |
| 1-6 | Math is Ours | MPP.3 | mindset | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/1-6/homework.html` ← `data/family-homework-notes/1-6.json` |
| 1-practice | Unit 1 Practice Test | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/1-practice/homework.html` ← `data/family-homework-notes/1-practice.json` |
| 1-review | Pre-Unit 1 · Review | MPP.3 | mindset | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/1-review/homework.html` ← `data/family-homework-notes/1-review.json` |
| 10-1-part2 | 10.1 · Part II | MPP.3 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | — | `lessons/10-1-part2/homework.html` ← `data/family-homework-notes/10-1-part2.json` |
| 10-1 | Math is Everywhere | MPP.3 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | ✓ | `lessons/10-1/homework.html` ← `data/family-homework-notes/10-1.json` |
| 10-2 | Math is Beauty | MPP.7 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | ✓ | `lessons/10-2/homework.html` ← `data/family-homework-notes/10-2.json` |
| 10-3-part2 | 10.3 · Part II | MPP.7 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | — | `lessons/10-3-part2/homework.html` ← `data/family-homework-notes/10-3-part2.json` |
| 10-3 | Math is Playful | MPP.7 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | ✓ | `lessons/10-3/homework.html` ← `data/family-homework-notes/10-3.json` |
| 10-4 | Math is Ingenuity | MPP.4 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | ✓ | `lessons/10-4/homework.html` ← `data/family-homework-notes/10-4.json` |
| 10-5 | Math is Boundless | MPP.7 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | ✓ | `lessons/10-5/homework.html` ← `data/family-homework-notes/10-5.json` |
| 10-6 | Math is Mine | MPP.3 | mindset | ✓/✓ | ✓ | 0/0 | ✓/✓ | ✓/✓ | ✓ | `lessons/10-6/homework.html` ← `data/family-homework-notes/10-6.json` |
| 2-1-part2 | 2.1 · Part II | 6.DS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-1-part2/homework.html` ← `data/family-homework-notes/2-1-part2.json` |
| 2-1 | Understand Statistical Questions | 6.DS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-1/homework.html` ← `data/family-homework-notes/2-1.json` |
| 2-10-part2 | 2.10 · Part II | 6.DS.6d | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-10-part2/homework.html` ← `data/family-homework-notes/2-10-part2.json` |
| 2-10 | Choose Appropriate Measures | 6.DS.6d | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-10/homework.html` ← `data/family-homework-notes/2-10.json` |
| 2-11-part2 | 2.11 · Part II | 6.NOS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-11-part2/homework.html` ← `data/family-homework-notes/2-11-part2.json` |
| 2-11 | Add and Subtract Decimals | 6.NOS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-11/homework.html` ← `data/family-homework-notes/2-11.json` |
| 2-12-part2 | 2.12 · Part II | 6.NOS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-12-part2/homework.html` ← `data/family-homework-notes/2-12-part2.json` |
| 2-12 | Multiply Decimals | 6.NOS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-12/homework.html` ← `data/family-homework-notes/2-12.json` |
| 2-2-part2 | 2.2 · Part II | 6.DS.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-2-part2/homework.html` ← `data/family-homework-notes/2-2-part2.json` |
| 2-2 | Represent and Describe Data in a Histogram | 6.DS.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-2/homework.html` ← `data/family-homework-notes/2-2.json` |
| 2-3-part2 | 2.3 · Part II | 6.DS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-3-part2/homework.html` ← `data/family-homework-notes/2-3-part2.json` |
| 2-3 | Describe the Data Using the Median | 6.DS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-3/homework.html` ← `data/family-homework-notes/2-3.json` |
| 2-4-part2 | 2.4 · Part II | 6.DS.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-4-part2/homework.html` ← `data/family-homework-notes/2-4-part2.json` |
| 2-4 | Represent and Describe Data in a Box Plot | 6.DS.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-4/homework.html` ← `data/family-homework-notes/2-4.json` |
| 2-5-part2 | 2.5 · Part II | 6.DS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-5-part2/homework.html` ← `data/family-homework-notes/2-5-part2.json` |
| 2-5 | Describe Data by Range and Interquartile Range | 6.DS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-5/homework.html` ← `data/family-homework-notes/2-5.json` |
| 2-6-part2 | 2.6 · Part II | 6.NOS.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-6-part2/homework.html` ← `data/family-homework-notes/2-6-part2.json` |
| 2-6 | Divide Multi-Digit Numbers Using an Algorithm | 6.NOS.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-6/homework.html` ← `data/family-homework-notes/2-6.json` |
| 2-7-part2 | 2.7 · Part II | 6.NOS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-7-part2/homework.html` ← `data/family-homework-notes/2-7-part2.json` |
| 2-7 | Divide Decimals Using an Algorithm | 6.NOS.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-7/homework.html` ← `data/family-homework-notes/2-7.json` |
| 2-8-part2 | 2.8 · Part II | 6.DS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-8-part2/homework.html` ← `data/family-homework-notes/2-8-part2.json` |
| 2-8 | Describe Data Using the Mean | 6.DS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-8/homework.html` ← `data/family-homework-notes/2-8.json` |
| 2-9-part2 | 2.9 · Part II | 6.DS.6c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/2-9-part2/homework.html` ← `data/family-homework-notes/2-9-part2.json` |
| 2-9 | Describe Data by Mean Absolute Deviation | 6.DS.6c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/2-9/homework.html` ← `data/family-homework-notes/2-9.json` |
| 3-1-part2 | 3.1 · Part II | 6.AT.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-1-part2/homework.html` ← `data/family-homework-notes/3-1-part2.json` |
| 3-1 | Understand Ratios | 6.AT.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-1/homework.html` ← `data/family-homework-notes/3-1.json` |
| 3-10-part2 | 3.10 · Part II | 6.AT.3c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-10-part2/homework.html` ← `data/family-homework-notes/3-10-part2.json` |
| 3-10 | Convert Measurement Units | 6.AT.3c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-10/homework.html` ← `data/family-homework-notes/3-10.json` |
| 3-2-part2 | 3.2 · Part II | 6.AT.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-2-part2/homework.html` ← `data/family-homework-notes/3-2-part2.json` |
| 3-2-part3 | 3.2 · Section 3 | 6.AT.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-2-part3/homework.html` ← `data/family-homework-notes/3-2-part3.json` |
| 3-2 | Understand Rates and Unit Rates | 6.AT.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-2/homework.html` ← `data/family-homework-notes/3-2.json` |
| 3-3-part2 | 3.3 · Part II | 6.AT.3a | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-3-part2/homework.html` ← `data/family-homework-notes/3-3-part2.json` |
| 3-3 | Determine Equivalent Ratios Using Tables | 6.AT.3a | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-3/homework.html` ← `data/family-homework-notes/3-3.json` |
| 3-4-part2 | 3.4 · Part II | 6.AT.3a | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-4-part2/homework.html` ← `data/family-homework-notes/3-4-part2.json` |
| 3-4 | Determine Equivalent Ratios Using Graphs | 6.AT.3a | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-4/homework.html` ← `data/family-homework-notes/3-4.json` |
| 3-5-part2 | 3.5 · Part II | 6.AT.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-5-part2/homework.html` ← `data/family-homework-notes/3-5-part2.json` |
| 3-5 | Compare Ratio Relationships | 6.AT.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-5/homework.html` ← `data/family-homework-notes/3-5.json` |
| 3-6-part2 | 3.6 · Part II | 6.AT.3c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-6-part2/homework.html` ← `data/family-homework-notes/3-6-part2.json` |
| 3-6 | Ratio Reasoning: Convert Measurements within the | 6.AT.3c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-6/homework.html` ← `data/family-homework-notes/3-6.json` |
| 3-7-part2 | 3.7 · Part II | 6.AT.3c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-7-part2/homework.html` ← `data/family-homework-notes/3-7-part2.json` |
| 3-7 | Ratio Reasoning: Convert Measurements Between Sy | 6.AT.3c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-7/homework.html` ← `data/family-homework-notes/3-7.json` |
| 3-8-part2 | 3.8 · Part II | 6.AT.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-8-part2/homework.html` ← `data/family-homework-notes/3-8-part2.json` |
| 3-8 | Solve Problems with Unit Rates | 6.AT.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-8/homework.html` ← `data/family-homework-notes/3-8.json` |
| 3-9-part2 | 3.9 · Part II | 6.AT.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/3-9-part2/homework.html` ← `data/family-homework-notes/3-9-part2.json` |
| 3-9 | Equivalent Ratios | 6.AT.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/3-9/homework.html` ← `data/family-homework-notes/3-9.json` |
| 4-1-part2 | 4.1 · Part II | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/4-1-part2/homework.html` ← `data/family-homework-notes/4-1-part2.json` |
| 4-1 | Understand Percent | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/4-1/homework.html` ← `data/family-homework-notes/4-1.json` |
| 4-2-part2 | 4.2 · Part II | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/4-2-part2/homework.html` ← `data/family-homework-notes/4-2-part2.json` |
| 4-2 | Relate Fractions, Decimals, and Percentages | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/4-2/homework.html` ← `data/family-homework-notes/4-2.json` |
| 4-3-part2 | 4.3 · Part II | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/4-3-part2/homework.html` ← `data/family-homework-notes/4-3-part2.json` |
| 4-3 | Estimate the Percent of a Number | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/4-3/homework.html` ← `data/family-homework-notes/4-3.json` |
| 4-4-part2 | 4.4 · Part II | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/4-4-part2/homework.html` ← `data/family-homework-notes/4-4-part2.json` |
| 4-4 | Find and Compare with Percentages | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/4-4/homework.html` ← `data/family-homework-notes/4-4.json` |
| 4-5-part2 | 4.5 · Part II | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/4-5-part2/homework.html` ← `data/family-homework-notes/4-5-part2.json` |
| 4-5 | Determine the Whole Given the Part and Percent | 6.AT.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/4-5/homework.html` ← `data/family-homework-notes/4-5.json` |
| 5-1-part2 | 5.1 · Part II | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-1-part2/homework.html` ← `data/family-homework-notes/5-1-part2.json` |
| 5-1 | Determine the Area of Parallelograms and Rhombus | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-1/homework.html` ← `data/family-homework-notes/5-1.json` |
| 5-10-part2 | 5.10 · Part II | 6.GR.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-10-part2/homework.html` ← `data/family-homework-notes/5-10-part2.json` |
| 5-10 | Volume of Rectangular Prisms | 6.GR.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-10/homework.html` ← `data/family-homework-notes/5-10.json` |
| 5-2-part2 | 5.2 · Part II | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-2-part2/homework.html` ← `data/family-homework-notes/5-2-part2.json` |
| 5-2 | Determine the Area of Triangles | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-2/homework.html` ← `data/family-homework-notes/5-2.json` |
| 5-3-part2 | 5.3 · Part II | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-3-part2/homework.html` ← `data/family-homework-notes/5-3-part2.json` |
| 5-3 | Determine the Area of Trapezoids | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-3/homework.html` ← `data/family-homework-notes/5-3.json` |
| 5-4-part2 | 5.4 · Part II | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-4-part2/homework.html` ← `data/family-homework-notes/5-4-part2.json` |
| 5-4 | Apply Area Concepts to Solve Problems | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-4/homework.html` ← `data/family-homework-notes/5-4.json` |
| 5-5-part2 | 5.5 · Part II | 6.GR.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-5-part2/homework.html` ← `data/family-homework-notes/5-5-part2.json` |
| 5-5 | Determine the Volume of Rectangular Prisms | 6.GR.2 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-5/homework.html` ← `data/family-homework-notes/5-5.json` |
| 5-6-part2 | 5.6 · Part II | 6.GR.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-6-part2/homework.html` ← `data/family-homework-notes/5-6-part2.json` |
| 5-6 | Represent Three-Dimensional Figures in Two Dimen | 6.GR.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-6/homework.html` ← `data/family-homework-notes/5-6.json` |
| 5-7-part2 | 5.7 · Part II | 6.GR.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-7-part2/homework.html` ← `data/family-homework-notes/5-7-part2.json` |
| 5-7 | Determine Surface Area of Prisms | 6.GR.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-7/homework.html` ← `data/family-homework-notes/5-7.json` |
| 5-8-part2 | 5.8 · Part II | 6.GR.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-8-part2/homework.html` ← `data/family-homework-notes/5-8-part2.json` |
| 5-8 | Determine Surface Area of Pyramids | 6.GR.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-8/homework.html` ← `data/family-homework-notes/5-8.json` |
| 5-9-part2 | 5.9 · Part II | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/5-9-part2/homework.html` ← `data/family-homework-notes/5-9-part2.json` |
| 5-9 | Area of Regular Polygons | 6.GR.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/5-9/homework.html` ← `data/family-homework-notes/5-9.json` |
| 6-1-6-2-practice-part2 | 6.1–6.2 · Extra Practice — Part 2 | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-1-6-2-practice-part2/homework.html` ← `data/family-homework-notes/6-1-6-2-practice-part2.json` |
| 6-1-6-2-practice | 6.1–6.2 · Extra Practice | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-1-6-2-practice/homework.html` ← `data/family-homework-notes/6-1-6-2-practice.json` |
| 6-1-part2 | 6.1 · Part II | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-1-part2/homework.html` ← `data/family-homework-notes/6-1-part2.json` |
| 6-1 | Division Expressions with Fractions and Whole Nu | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-1/homework.html` ← `data/family-homework-notes/6-1.json` |
| 6-10-part2 | 6.10 · Part II | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-10-part2/homework.html` ← `data/family-homework-notes/6-10-part2.json` |
| 6-10 | Divide Mixed Numbers | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-10/homework.html` ← `data/family-homework-notes/6-10.json` |
| 6-11-part2 | 6.11 · Part II | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-11-part2/homework.html` ← `data/family-homework-notes/6-11-part2.json` |
| 6-11 | Fraction Division Problem Solving | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-11/homework.html` ← `data/family-homework-notes/6-11.json` |
| 6-12-part2 | 6.12 · Part II | 6.NOS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-12-part2/homework.html` ← `data/family-homework-notes/6-12-part2.json` |
| 6-12 | Least Common Multiple | 6.NOS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-12/homework.html` ← `data/family-homework-notes/6-12.json` |
| 6-13-part2 | 6.13 · Part II | 6.NOS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-13-part2/homework.html` ← `data/family-homework-notes/6-13-part2.json` |
| 6-13 | Prime Factorization | 6.NOS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-13/homework.html` ← `data/family-homework-notes/6-13.json` |
| 6-14-part2 | 6.14 · Part II | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-14-part2/homework.html` ← `data/family-homework-notes/6-14-part2.json` |
| 6-14 | The Distributive Property | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-14/homework.html` ← `data/family-homework-notes/6-14.json` |
| 6-15-part2 | 6.15 · Part II | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-15-part2/homework.html` ← `data/family-homework-notes/6-15-part2.json` |
| 6-15 | Simplify Algebraic Expressions | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-15/homework.html` ← `data/family-homework-notes/6-15.json` |
| 6-2-part2 | 6.2 · Part II | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-2-part2/homework.html` ← `data/family-homework-notes/6-2-part2.json` |
| 6-2 | Division Expressions with Fractions and Mixed Nu | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-2/homework.html` ← `data/family-homework-notes/6-2.json` |
| 6-3-part2 | 6.3 · Part II | 6.AT.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-3-part2/homework.html` ← `data/family-homework-notes/6-3-part2.json` |
| 6-3 | Explore Numerical Expressions with Exponents | 6.AT.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-3/homework.html` ← `data/family-homework-notes/6-3.json` |
| 6-4-part2 | 6.4 · Part II | 6.AT.6c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-4-part2/homework.html` ← `data/family-homework-notes/6-4-part2.json` |
| 6-4 | Write and Evaluate Numerical Expressions with Ex | 6.AT.6c | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-4/homework.html` ← `data/family-homework-notes/6-4.json` |
| 6-5-part2 | 6.5 · Part II | 6.AT.6a | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-5-part2/homework.html` ← `data/family-homework-notes/6-5-part2.json` |
| 6-5 | Write and Evaluate Algebraic Expressions | 6.AT.6a | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-5/homework.html` ← `data/family-homework-notes/6-5.json` |
| 6-6-part2 | 6.6 · Part II | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-6-part2/homework.html` ← `data/family-homework-notes/6-6-part2.json` |
| 6-6 | Identify Equivalent Algebraic Expressions | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-6/homework.html` ← `data/family-homework-notes/6-6.json` |
| 6-7-part2 | 6.7 · Part II | 6.NOS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-7-part2/homework.html` ← `data/family-homework-notes/6-7-part2.json` |
| 6-7 | Find Factors and Multiples | 6.NOS.4 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-7/homework.html` ← `data/family-homework-notes/6-7.json` |
| 6-8-part2 | 6.8 · Part II | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-8-part2/homework.html` ← `data/family-homework-notes/6-8-part2.json` |
| 6-8 | Generate Equivalent Expressions | 6.AT.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-8/homework.html` ← `data/family-homework-notes/6-8.json` |
| 6-9-part2 | 6.9 · Part II | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/6-9-part2/homework.html` ← `data/family-homework-notes/6-9-part2.json` |
| 6-9 | Divide Whole Numbers by Fractions | 6.NOS.1 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/6-9/homework.html` ← `data/family-homework-notes/6-9.json` |
| 7-1-part2 | 7.1 · Part II | 6.NOS.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-1-part2/homework.html` ← `data/family-homework-notes/7-1-part2.json` |
| 7-1 | Explore Integers and Their Opposites | 6.NOS.5 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-1/homework.html` ← `data/family-homework-notes/7-1.json` |
| 7-2-part2 | 7.2 · Part II | 6.NOS.6 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-2-part2/homework.html` ← `data/family-homework-notes/7-2-part2.json` |
| 7-2 | Represent Rational Numbers and Their Opposites o | 6.NOS.6 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-2/homework.html` ← `data/family-homework-notes/7-2.json` |
| 7-3-part2 | 7.3 · Part II | 6.NOS.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-3-part2/homework.html` ← `data/family-homework-notes/7-3-part2.json` |
| 7-3 | Understand Absolute Value of Rational Numbers | 6.NOS.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-3/homework.html` ← `data/family-homework-notes/7-3.json` |
| 7-4-part2 | 7.4 · Part II | 6.NOS.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-4-part2/homework.html` ← `data/family-homework-notes/7-4-part2.json` |
| 7-4 | Compare and Order Integers and Rational Numbers | 6.NOS.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-4/homework.html` ← `data/family-homework-notes/7-4.json` |
| 7-5-part2 | 7.5 · Part II | 6.NOS.6 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-5-part2/homework.html` ← `data/family-homework-notes/7-5-part2.json` |
| 7-5 | Represent Rational Numbers on the Coordinate Pla | 6.NOS.6 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-5/homework.html` ← `data/family-homework-notes/7-5.json` |
| 7-6-part2 | 7.6 · Part II | 6.NOS.9 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-6-part2/homework.html` ← `data/family-homework-notes/7-6-part2.json` |
| 7-6 | Determine Distance on the Coordinate Plane | 6.NOS.9 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-6/homework.html` ← `data/family-homework-notes/7-6.json` |
| 7-7-part2 | 7.7 · Part II | 6.GR.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-7-part2/homework.html` ← `data/family-homework-notes/7-7-part2.json` |
| 7-7 | Represent Polygons on the Coordinate Plane | 6.GR.3 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-7/homework.html` ← `data/family-homework-notes/7-7.json` |
| 7-8-part2 | 7.8 · Part II | 6.NOS.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-8-part2/homework.html` ← `data/family-homework-notes/7-8-part2.json` |
| 7-8 | Ordered Pairs in All Four Quadrants | 6.NOS.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-8/homework.html` ← `data/family-homework-notes/7-8.json` |
| 7-9-part2 | 7.9 · Part II | 6.NOS.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/7-9-part2/homework.html` ← `data/family-homework-notes/7-9-part2.json` |
| 7-9 | Reflect Points Across Axes | 6.NOS.7 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/7-9/homework.html` ← `data/family-homework-notes/7-9.json` |
| 8-1-part2 | 8.1 · Part II | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/8-1-part2/homework.html` ← `data/family-homework-notes/8-1-part2.json` |
| 8-1 | Understand Equations and Their Solutions | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/8-1/homework.html` ← `data/family-homework-notes/8-1.json` |
| 8-2-part2 | 8.2 · Part II | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/8-2-part2/homework.html` ← `data/family-homework-notes/8-2-part2.json` |
| 8-2 | Write and Solve Equations Using Addition or Subt | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/8-2/homework.html` ← `data/family-homework-notes/8-2.json` |
| 8-3-part2 | 8.3 · Part II | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/8-3-part2/homework.html` ← `data/family-homework-notes/8-3-part2.json` |
| 8-3 | Write and Solve Equations Using Multiplication o | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/8-3/homework.html` ← `data/family-homework-notes/8-3.json` |
| 8-4-part2 | 8.4 · Part II | 6.AT.9 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/8-4-part2/homework.html` ← `data/family-homework-notes/8-4-part2.json` |
| 8-4 | Write and Represent Inequalities | 6.AT.9 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/8-4/homework.html` ← `data/family-homework-notes/8-4.json` |
| 8-5-part2 | 8.5 · Part II | 6.AT.9 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/8-5-part2/homework.html` ← `data/family-homework-notes/8-5-part2.json` |
| 8-5 | Understand Inequalities and Their Solutions | 6.AT.9 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/8-5/homework.html` ← `data/family-homework-notes/8-5.json` |
| 8-6-part2 | 8.6 · Part II | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/8-6-part2/homework.html` ← `data/family-homework-notes/8-6-part2.json` |
| 8-6 | Solve and Graph Inequalities | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/8-6/homework.html` ← `data/family-homework-notes/8-6.json` |
| 8-7-part2 | 8.7 · Part II | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/8-7-part2/homework.html` ← `data/family-homework-notes/8-7-part2.json` |
| 8-7 | Equations and Inequalities Problem Solving | 6.AT.8 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/8-7/homework.html` ← `data/family-homework-notes/8-7.json` |
| 9-1-part2 | 9.1 · Part II | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/9-1-part2/homework.html` ← `data/family-homework-notes/9-1-part2.json` |
| 9-1 | Explore Relationships Between Two Variables | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/9-1/homework.html` ← `data/family-homework-notes/9-1.json` |
| 9-2-part2 | 9.2 · Part II | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/9-2-part2/homework.html` ← `data/family-homework-notes/9-2-part2.json` |
| 9-2 | Analyze Graphs of Relationships Between Two Vari | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/9-2/homework.html` ← `data/family-homework-notes/9-2.json` |
| 9-3-part2 | 9.3 · Part II | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/9-3-part2/homework.html` ← `data/family-homework-notes/9-3-part2.json` |
| 9-3 | Write Equations to Represent Relationships Betwe | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/9-3/homework.html` ← `data/family-homework-notes/9-3.json` |
| 9-4-part2 | 9.4 · Part II | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | — | `lessons/9-4-part2/homework.html` ← `data/family-homework-notes/9-4-part2.json` |
| 9-4 | Apply Two-Variable Relationships to Solve Proble | 6.AT.11 | math | ✓/✓ | ✓ | 6/6 | ✓/✓ | ✓/✓ | ✓ | `lessons/9-4/homework.html` ← `data/family-homework-notes/9-4.json` |
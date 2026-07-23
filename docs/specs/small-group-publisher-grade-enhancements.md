# Small-Group Lessons — Publisher-Grade Enhancement List

Status: audit 2026-07-23. **Wave 1 shipped** (items 1–5); **Wave 2 shipped**
(items 6, 7, 17, 18); **item 8 shipped** (Small-Group Rotation Console at
`teacher-tools/small-group-rotation/`, registered in the teacher-tools hub —
lesson picker → variant/assigned/deep-link launcher + live name-free class
evidence from `/api/progress/small-group-summary`). Remaining: 9–16, 19, 20.
Scope: all 128 small-group lessons + 20 catch-ups (engine modules, generators,
teacher route, worksheets), benchmarked against professional publishers
(Illustrative Mathematics, Eureka Math², enVision, Amplify).

> **Dark mode (19/20) — blocked on a token refactor, do not rush.** The inline
> stylesheet in `small-group-ui.js` overloads `--sg-deep`: it serves both as
> *dark ink on light surfaces* (must go light in dark mode) and as a *dark
> surface behind white text* (`.sg-operator-chip`, `.col-rule`, tree branches —
> must stay dark). A correct dark theme first needs `--sg-deep` split into
> `--sg-ink-accent` vs `--sg-surface-accent` across ~40 usages, then per-panel
> screenshot QA in both themes. Groundwork: the site already ships a theme
> convention (`document.documentElement.dataset.theme` via `assets/neft-theme.js`,
> plus `@media (prefers-color-scheme: dark)`), so the dark block should key on
> both `:root[data-theme="dark"]` and the media query. Attempted in Wave 2,
> deferred to keep from shipping a half-correct dark experience to students.

The system is already unusually deep for a classroom-built product: bilingual
EN/ES scaffolds everywhere, real manipulative labs, typed visual workspaces,
adaptive coaching, A/B worksheet forms **with answer keys**, print CSS, SCORM
export, gated teacher mode, and name-free telemetry. The gaps below are what
still separates it from a commercial curriculum product, ranked by impact.

---

## Top 5 (highest impact)

1. **Teacher evidence sync — real student data in teacher mode.** The
   Facilitation Console is a manual tap-to-tally checklist; the rich student
   `state` (attempts, hints used, pulses, solved items) is passed in but
   discarded (`small-group-renderer.js:827` → `createTeacherEvidenceConsole()`
   takes no arguments, `small-group-innovation.js:475`). Publishers ship live
   item analysis. Pipe studio state into NTSignal/D1 (opt-in POST — hooks
   already exist in `events`/`store`) and add a class rotation card so the
   teacher sees who's stuck *during* the rotation. (Roadmap #1, unbuilt.)
2. **Rubrics + mastery bands.** No rubric exists anywhere in the small-group
   line: open-response is keyword + min-length matched, the exit ticket is one
   MC item framed as encouragement, and there is no approaching/meeting/
   exceeding scale or per-standard mastery rollup. The repo's own Factory doc
   demands rubrics (`LESSON_PRODUCT_FACTORY.md:94`) but that QA only governs
   the CardForge pipeline. Add a 3–4 point rubric per constructed response +
   exit ticket, and a simple mastery band per lesson.
3. **Surface the orphaned worksheets.** `lessons/*/worksheet.html` is a
   genuinely publisher-styled printable — Level 0 + parallel Versions A/B +
   three labeled answer-key pages, misconception "Watch for" notes, print CSS —
   and **nothing links to it**. Neither the student shell nor teacher mode
   references it; a teacher must guess the URL. Add a teacher-mode "Print
   worksheet (A/B + keys)" link and a student-safe "Print practice page" link
   (key pages stripped).
4. **Catch-up variant parity.** Most differentiation branches on
   `group1`/`group2`, so `catchup` silently falls through: no per-step build
   visuals (`small-group-renderer.js:184`, group1-only — yet catch-up students
   need the most concrete support), no challenge bridge
   (`small-group-practice.js:790` hard-codes `-group1`→`-group2`), can never be
   recommended the stretch path (`small-group-innovation.js:31` requires
   group2), no catchup case in scaffold defaults, no `smallGroupPractice`
   config block. Give catch-up an explicit branch everywhere.
5. **Standards as text, not just codes.** Every surface shows the bare code
   (`6.NOS.4`) with no descriptive standard text and no per-item alignment —
   a hallmark of every publisher teacher edition. `data/ccss-standards.json`
   is already the SoT; render the full standard wording in the teacher panel
   and worksheet header, and tag practice items with the standard they hit.

## Teacher & assessment materials

6. **Structured misconception tables.** One prose `commonMistake` string per
   lesson vs. publishers' 3–5 anticipated wrong answers with per-distractor
   rationale. The MC `choiceFeedback` fields already exist — promote them into
   a teacher-visible "anticipated responses" table per item.
7. **Pacing margin notes.** Only a fixed 2·4·3·7·2 rhythm exists. Add "if
   students struggle → / if time is short → / if they finish early →"
   branch guidance per section, the way IM prints margin decisions.
8. **Small-group rotation console in `teacher-tools/`.** No teacher-tools
   surface mentions small groups (grep confirms). Add a card to the class
   dashboard: group composer deep-links (`?group=1|2` already works,
   roadmap #8) + the evidence-sync class view from item 1.
9. **Exit ticket depth.** Move from 1 MC item to 2–3 mixed-format items with
   a scored threshold and a printable class exit-ticket tracker.

## Print & family materials

10. **Family letter (EN/ES) per lesson band.** `familyNotes` is explicitly
    stripped by the generator (`generate-small-group-lessons.mjs:54`), and no
    small-group family letter exists — a standard publisher deliverable. The
    ES content pipeline already exists to feed it.
11. **One-click consolidated studio packet.** Evidence card + solved practice
    + Apply-Lab work already have `printOnly()` lanes; bundle them into one
    printable (roadmap #6, unbuilt).
12. **Printed manipulative masters.** The labs are screen-only; publishers
    ship cut-out masters (number lines, factor cards, balance mats) so the
    same lesson runs paper-first when devices are short.

## Editorial & content quality

13. **Wire the Factory editorial QA to this product line.**
    `LESSON_PRODUCT_FACTORY.md:104-113` defines a real style guide (B/W-safe,
    ≥12.5pt, AI-filler word linter, teacher voice) but only the CardForge
    pipeline enforces it; `validate-small-group-lessons.mjs` checks structure
    only. Add the copy-QA pass to the small-group validator.
14. **Authored art.** `launch.contextImage` is a prose *description* of an
    image, not an asset; the space-station theme is carried by copy + emoji.
    All visuals are code-drawn SVG (a strength for math models, a gap for
    narrative pages). Commission/generate consistent scene + character art
    for lesson heroes and mission briefings.
15. **Voice recording for Talk** (roadmap #3): MediaRecorder "record our best
    explanation," device-local playback — publishers increasingly ship
    discourse-capture tools.

## Data hygiene & consistency (cheap wins)

16. **Dead data in student configs.** `stripHeavy()`
    (`generate-small-group-lessons.mjs:50-57`) deletes `googleForms` etc. but
    **not** `noticeAndWonder`/`turnAndTalk`, so both ship in every group1/2
    student config despite the "no notice/wonder anywhere" directive
    (roadmap:23,61). The catch-up generator deletes them correctly. Extra
    payload + drift risk — strip them.
17. **Orphaned proof-path state.** `state.proofPath`/`proofResponse` are
    initialized and *read* by the Evidence Card and Studio Packet
    (`small-group-innovation.js:395,438`) but never *written* — those cells
    always render "Not selected yet." Remove the cells or re-wire to the
    Consensus Lab choice. Related vestiges: `.sg-proof-button` CSS rules with
    no JS, dead group2 branches in `createTalkSection`, `weDo`/`youDo` omitted
    from group2 concept intro (`generate-small-group-lessons.mjs:248`).
18. **Doc drift.** `docs/small-group-lessons.md:46-47` credits the shell with
    Print + SCORM (both actually renderer-added; SCORM is teacher-only);
    roadmap #7 ("catch-ups lack `revealWordProblem`") is stale — `1-3-catchup`
    has one. Update both docs.

## Design & accessibility

19. **Dark mode / `prefers-contrast` / `forced-colors` — entirely absent**
    across all small-group CSS; colors are hard-coded light. The biggest
    remaining a11y-polish gap (the rest — ARIA tabs, focus rings,
    reduced-motion, Atkinson Hyperlegible, 44px targets — is already strong).
20. **Tokenize `small-group-visual-practice.js` inline styles.** Heavy
    `style.cssText` with hard-coded hex (`:829-1546`) bypasses the `--sg`
    variant tokens, so those workspaces won't follow any future theming
    (including item 19).

---

## What's already publisher-grade (don't rebuild)

Dual kid-facing content + language objectives; EN/ES throughout with lane
flip; parallel worksheet forms A/B with labeled answer keys; misconception
"Watch for" notes on keys; hint ladders + error-analysis items; ≥10-problem
guarantee asserted by the generator; teacher gating that degrades safely to
student mode; name-free telemetry; print handling that force-opens hidden
panels; reduced-motion-safe celebration; SCORM/Canvas export.

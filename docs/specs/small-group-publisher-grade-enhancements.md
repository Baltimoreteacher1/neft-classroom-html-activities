# Small-Group Lessons — Publisher-Grade Enhancement List

> ## Wave 8 — depth pass (2026-07-27)
>
> A fresh measured pass over all 148 variant configs surfaced gaps the original
> audit did not, because it read `practice.*` (largely unrendered) rather than the
> bank the renderer actually builds. Corrected findings and what shipped:
>
> **D1. Level 1 and Catch-Up practice was 100% one item format.** All 768 Level 1
> and 240 catch-up rendered items were `guided-fill` — twelve identical typed-step
> drills — while only Level 2 ever received the authored multiple-choice /
> error-analysis / sort items sitting in the _same_ config. `collectPracticeItems`
> now appends a balanced, tier-appropriate slice (`varietySlice`, cap 6,
> round-robin across item types so it cannot collapse into six MC questions).
> Level 1 and Catch-Up go 12 → 18 items with 3–5 formats; Level 2's existing
> `extending` append is untouched.
>
> **D2. Per-item standard alignment.** `tagPracticeItem` now stamps `_standard` on
> every rendered item, so evidence can roll up per standard and not only per
> lesson. (Closes the residue of item 5.)
>
> **D3. Exit ticket was one item on all 148 lessons.** Item 9 was only half-done —
> Wave 3 added a written "how you know", but a single MC item is not a mastery
> decision. Added `createTransferCheck`: a second, independent transfer item drawn
> from an authored tier the student has _not_ practised, plus a 3-level band
> (Keep building / Approaching / Meeting) scored on FIRST attempt across both
> items and persisted as `checkBand`. Deliberately not wired into `tally` — this is
> evidence depth, not another completion gate.
>
> **D4. Level 2 had no Build-the-idea visual at all.** Now gated rather than
> absent: Level 2 gets the same arithmetic-verified models behind a "🧩 Check my
> model" toggle, so the picture confirms reasoning instead of replacing it. Support
> tiers keep them open. One `visualMode` value reverts it.
>
> **D5. EN/ES parity broke on enrichment items, and hint/feedback coverage was
> thin.** 40% of Level 2's rendered items had no `stemEs`; 30% of its distractors
> had blank `choiceFeedback`; 181 items had no hint ladder and 114 no explanation.
> Root cause is architectural: every variant copies `practice.*` verbatim from its
> BASE lesson, and the base bank was authored English-only. Enrichment was authored
> against the 64 base configs and propagated by item identity
> (`tools/merge-practice-enrichment.mjs`) — no regeneration, so no base drift.
>
> **D6. The generator was dropping authored vocabulary.**
> `generate-small-group-lessons.mjs` sliced `base.vocabulary` to the first 4 terms,
> so 1–3 authored terms per lesson never reached a variant even after Wave 4 raised
> the _render_ cap to 8. Generator now slices to 8, and
> `tools/backfill-variant-vocabulary.mjs` restored 188 terms across 126 configs
> without a regen.
>
> **Considered and declined:** giving Level 2 a distinct warm-up / Connect scenario.
> Level 1 and Level 2 share those byte-for-byte in all 64 pairs, but the only
> non-authoring way to differentiate them is a generic "generalize it / take the
> challenge" prompt — exactly the content-free Group 2 card that was killed on
> 2026-07-17. Doing this properly needs per-lesson authored content, not an engine
> wrapper. Left open deliberately.
>
> **Regression guard:** `tools/small-group-practice-depth.test.mjs` (auto-discovered
> by `npm test`) asserts variety, standard tagging, dense `_practiceIndex` for
> Save/Resume, no duplicate items, and that Level 2's bank is unchanged.

Status: audit 2026-07-23. **Wave 1** (items 1–5), **Wave 2** (6, 7, 17, 18),
**item 8** (Small-Group Rotation Console), and **Wave 3** (9, 13, 15) all
shipped. **Item 16** investigated → finding invalid, no-op (see below).
**Wave 4** shipped 19/20 (dark mode). **Wave 5** shipped 10 + 12:

- **10 — Family Math Letter** (`/curriculum/family-letter/`): a bilingual
  EN/ES printable that fetches any lesson's config and renders objective +
  standard text + a key-vocabulary table (real ES from `termEs`/`definitionEs`)
  - derived "help at home" prompts + the common-mistake "gently check". Linked
    from the curriculum Teacher Tools panel.
- **12 — Printable Manipulative Masters** (`/curriculum/manipulatives/`):
  print-optimized SVG cut-out masters (number lines, four-quadrant grid,
  fraction bars, number cards 1–24 with primes shaded, algebra tiles,
  place-value mat) with per-master toggles. Linked from Teacher Tools.

**Item 14 (authored art) — engine now art-ready (Wave 7).** The one part that's
code — the slot — is done: `mountAuthoredArt` renders an authored illustration
(`config.sceneArt` / `heroImage` / `launch.sceneImage`) in the hero mark and
mission visual, lazy-loaded, alt/`aria-hidden` per whether it's decorative, and
falling back to today's code-drawn theme SVG / emoji if the asset is absent or
404s (zero regression — no lesson has the field yet). The remaining part is the
**art itself**, a design commission spec'd in
[`docs/small-group-art-brief.md`](../small-group-art-brief.md) (themes, style,
palette that works in dark mode, asset dimensions, a11y, drop-in config). Not
auto-generated: the audit notes the code-drawn SVG math models are a strength,
and a pile of inconsistent AI images would lower quality, not raise it.
Scope: all 128 small-group lessons + 20 catch-ups (engine modules, generators,
teacher route, worksheets), benchmarked against professional publishers
(Illustrative Mathematics, Eureka Math², enVision, Amplify).

> **Dark mode (19/20) — SHIPPED (Wave 4, 2026-07-23).** The `--sg-deep`
> overload was resolved by splitting it into three roles: `--sg-ink` (text,
> flips light in dark), `--sg-rule` (thin lines, flips light), and `--sg-deep`
> (dark surface behind white text — hero gradient, operator chip — stays dark).
> Status/figure/fill colors were tokenized (`--sg-good-bg`, `--sg-bad`,
> `--sg-figure`, `--sg-fill`, …), the shared `--sg`/`--sg-deep`/`--sg-soft`
> moved from inline `setProperty` into the stylesheet `:root` so the dark block
> can override them, and the dark theme keys on BOTH `:root[data-theme="dark"]`
> (site convention via `assets/neft-theme.js`) and
> `@media (prefers-color-scheme: dark)`. Secondary components (innovation.css,
> annotation, storyboard beats, the go-deeper + facilitation-rhythm injected
> styles, publisher-polish) each got tokenized or a dark override. `@media
print` resets the tokens to light so a dark-theme user still prints on white.
> Verified with Playwright screenshots in both themes (light mode pixel-identical
> to before) and a light-surface probe.
>
> **High-contrast completion (Wave 6):** the two accessibility modes the audit
> also named under item 19 — `@media (prefers-contrast: more)` (darker lines/ink,
> heavier focus ring, thicker card borders) and `@media (forced-colors: active)`
> (Windows High Contrast) — are now in the inline stylesheet. Because
> forced-colors flattens fill/border colors to the system palette, every state
> conveyed by color alone (selected tab, correct/wrong, on/off, pressed votes)
> re-asserts with a system `Highlight`/`GrayText` outline so it stays visible.
> Verified via Playwright `forcedColors:'active'` + `contrast:'more'`.

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
   teacher sees who's stuck _during_ the rotation. (Roadmap #1, unbuilt.)
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
    - Apply-Lab work already have `printOnly()` lanes; bundle them into one
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
14. **Authored art.** `launch.contextImage` is a prose _description_ of an
    image, not an asset; the space-station theme is carried by copy + emoji.
    All visuals are code-drawn SVG (a strength for math models, a gap for
    narrative pages). Commission/generate consistent scene + character art
    for lesson heroes and mission briefings.
15. **Voice recording for Talk** (roadmap #3): MediaRecorder "record our best
    explanation," device-local playback — publishers increasingly ship
    discourse-capture tools.

## Data hygiene & consistency (cheap wins)

16. ~~**Dead data in student configs**~~ — **finding INVALID (verified
    2026-07-23), do not strip.** The original audit claimed
    `noticeAndWonder`/`turnAndTalk` are dead in group1/2 configs. They are NOT:
    the compact renderer reads `noticeAndWonder.context` as the mission
    narrative (`createMissionSection`, `small-group-engagement.js:68`) and reads
    `turnAndTalk` for the entire Talk section (`talkFor`,
    `small-group-engagement.js:426`) on group1/catch-up lessons — and
    `validate-small-group-lessons.mjs:109-111` correctly _requires_ both.
    Stripping them deletes the Talk section from all 64 group1 lessons and
    degrades the mission. Only `noticeAndWonder.noticeStarters/wonderStarters`
    are truly dead (a few lines of payload) — not worth a risky 128-file regen.
    Catch-up strips the whole objects only because it renders no Talk/mission
    from them. No action taken.
17. **Orphaned proof-path state.** `state.proofPath`/`proofResponse` are
    initialized and _read_ by the Evidence Card and Studio Packet
    (`small-group-innovation.js:395,438`) but never _written_ — those cells
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

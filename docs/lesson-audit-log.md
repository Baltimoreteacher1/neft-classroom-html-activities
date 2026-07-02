# Lesson Audit Log

Findings log for `docs/lesson-quality-rubric.md` audit passes. Each wave is a dated section.
Per the rubric's "Engine-Level vs Per-Unit Fix" guidance, findings that recur 3+ times across
lessons in the same way are logged once as a schema/engine gap, not repeated per lesson.

## Wave 1 — 2026-07-02 — Full-corpus human-judgment pass (74 lessons)

Read-only audit, 7 parallel passes covering all lessons in `lessons/`, scored against all 9
rubric dimensions. Structural/mechanical criteria (DOK-tier presence, vocab translation
completeness, exit-ticket validity, printables completeness, generic-commonMistake detection)
are separately enforced continuously by `npm run validate:lesson-quality` (0 fail / 0 warn as
of this wave) — this pass covers the human-judgment dimensions that script can't check:
engagement, narrative quality, standards precision, and content correctness that requires
actually working the problems.

Arithmetic in every exit ticket, worked example, and word problem was independently
re-derived by the auditing agents, not just read. Vocabulary Spanish/Vietnamese/Arabic
translations were checked for accuracy, not just presence.

### Schema / Engine-Level Gaps (fix once, not per-lesson)

1. **`noticeAndWonder` + `revealWordProblem` entirely missing — 17 of 74 lessons (23%).**
   Both fields are completely absent from `config.json` (not weak — missing keys), so these
   lessons have no Notice/Wonder launch hook and no Reveal Math "Apply" word problem at all,
   failing Rubric Dimension 1 by construction. Confirmed via `grep` that this is a missing-key
   issue, not a rendering issue (the renderer is config-driven). Affected lessons:
   `1-1, 1-1-flagship, 1-3, 1-5, 1-6, 2-1, 2-1-flagship, 2-3, 2-5, 3-4, 3-6, 3-7, 6-4, 6-5,
7-6, 7-7, 8-7`.
   Looks like a generator run that skipped these lessons rather than 17 independent content
   gaps — recommend a single regeneration pass for `noticeAndWonder`/`revealWordProblem`
   targeting exactly this lesson list.

2. **`noticeAndWonder`/`revealWordProblem` present but missing the `image` field, or the
   asset exists on disk but was never wired into config — 8 lessons.** Milder variant of #1:
   `5-4, 6-7` (no `reveal-assets/` folder on disk at all); `4-1-flagship, 4-2, 4-3` (the image
   file exists in `reveal-assets/` but `config.json` never references it); `9-5`
   (`revealWordProblem.image` reuses `noticeAndWonder`'s image — no distinct asset was ever
   produced); `9-7` (no `image` key for either field); `10-5` (`noticeAndWonder.context` is a
   bare one-line question, not descriptive narrative/alt-text content).
   Recommend an automated check asserting every file in a lesson's `reveal-assets/` is
   referenced by its config, to catch the image-generation/config-wiring desync going forward.

3. **`noticeAndWonder.image` shows a scene unrelated to `noticeAndWonder.context` — 5 lessons
   in Unit 8 alone, confirmed by actually viewing the images.** `8-1-flagship` (context
   describes a basketball stat sheet; image is the Unit 8-1 national-park photo collage),
   `8-2` (context: teacher-tenure data; image: unrelated "community circle" stock photo, no
   data), `8-3` (context: weekly temperature forecast; image: unrelated school photo, no
   data), `8-4` (image is a generic unlabeled histogram that doesn't match the stated
   context), `8-6` (context: basketball points-per-game histogram; image: plant seedlings in
   soil). This looks like a stock-photo placeholder step that was never swapped for a
   lesson-specific data graphic, isolated to the `noticeAndWonder` image slot —
   `revealWordProblem` images were checked in the same lessons and were consistently
   accurate. Recommend auditing this asset slot across all units, not just Unit 8.

4. **`printables` incomplete — ships only `activity` + `color-by-number`, missing
   `word-search` and `mcap` — confirmed in 12 lessons, always the same two kinds missing.**
   `3-4, 3-6, 3-7, 5-4, 6-4, 6-7, 4-3, 4-7, 9-5, 9-7, 10-1, 10-1-flagship`.
   **Correction (2026-07-02, verified before acting on the "recommend re-running" note
   above):** this is not a skipped generator run. `scripts/integrate-lesson-printables.mjs`
   sources word-search/MCAP content from one-shot import folders (matched to classroom
   lessons via a hardcoded `CLASSROOM_TO_REVEAL` table, keyed by confident CCSS
   standard+topic match to a Reveal Math lesson). All 12 lessons above are absent from
   that table — 100% correlation, not a coincidence — and the script's own comment says
   lessons absent from the table "have no Reveal word search / MCAP counterpart by
   design." The source folders (`~/Desktop/Grade_6_Math_Lesson_Wordsearches_DOCX_PDF`,
   `~/Desktop/G6_MCAP_Practice_Sheets_CCSS_MCAP_Final_Flawless`) no longer exist on disk,
   so there is nothing to re-run even if this weren't intentional. Closing this gap for
   these 12 lessons would mean sourcing/authoring new word-search and MCAP content from
   scratch, not running an existing generator — a real content-creation task, not a fix.

5. **Vocabulary `examples`/`sentences` field sparsely populated or degrading within a unit.**
   Unit 3 shows a clear within-unit gradient (3-1: 5/5 terms have examples → 3-1-flagship:
   3/5 → 3-2/3-4/3-5: 1/5 → 3-3/3-6/3-7: 0/5), suggesting the field was populated early in a
   generation run and progressively dropped. Also recurs in `8-6`/`8-7` (only the first
   vocabulary term in each lesson has `examples`; the other 4 don't). Recommend a
   full-corpus check of `vocabulary[].examples` presence, then a single backfill pass.

6. **Vocab-icon fallback substitutes an unrelated existing SVG when no dedicated icon exists
   for a term, instead of omitting the image or using an honest generic placeholder —
   confirmed in 6 of 8 Unit 4 lessons.** E.g. "Per" → `unit-rate.svg`, "Markup"/"Tax"/"Tip" →
   all fall back to `percent.svg`, "Conversion Factor"/"Customary units"/"Metric units" → all
   fall back to `measurement.svg`. This is an asset-library gap (missing per-term SVGs) or a
   renderer gap (should suppress rather than substitute a mismatched icon) — not a per-lesson
   content issue. Recommend adding the missing per-term icons: `per.svg`, `better-buy.svg`,
   `markup.svg`, `tax.svg`, `tip.svg`, `conversion-factor.svg`, `customary-units.svg`,
   `metric-units.svg`, `benchmark.svg`.

7. **Graphic novel episode pool is smaller than the lesson count, so multiple lessons
   (sometimes with different standards) share one episode, and Unit 4 lessons sometimes
   point at Unit 3-prefixed episode files.** Unit 9: one episode
   (`axiom-city-u7-e3-the-grid-map.html`) is reused by 5 lessons (9-1, 9-1-flagship, 9-5, 9-6,
   9-7) spanning three different standards. Unit 10: two episodes cover all 5 lessons. Unit 4:
   `4-3/4-4/4-5` share one episode; `4-6/4-7/4-1-flagship` point at `u3`-prefixed episodes.
   This reads as "too few episodes were authored for the lesson count," not a per-lesson bug —
   recommend either producing more distinct episodes or documenting that graphic novels
   intentionally map at the unit/arc level, not the lesson level, so this isn't re-flagged
   every audit.

### Critical Per-Lesson Findings (fix directly in that lesson's `config.json`)

- **10-3** — `connect.turnAndTalk.listenFor` and `connect.keywords` state the gift box's
  surface area as **688 in²**; the correct value is **568 in²** (280 + 168 + 120 = 568, not
  688 — the 120 term appears double-counted). The final "2 sheets needed" answer still holds
  either way, but the wrong total is baked into the discourse script and the keyword bank used
  to assess student answers — a student who correctly computes 568 could be marked against the
  wrong keyword. All ~15 other surface-area calculations in this lesson were verified correct.

- **7-5** — `standard` is listed as `6.EE.9`, but the lesson teaches graphing inequality
  solutions on a number line, which is `6.EE.8`. `6.EE.9` (representing dependent/independent
  variable relationships) is an unrelated skill never touched in this lesson. Confirmed via
  repo-wide grep that `6.EE.9` doesn't appear elsewhere, so this is an isolated mislabel, not a
  convention. Note 7-4 (writing inequalities) is correctly labeled `6.EE.8` — the write/graph
  halves of the same standard are now split across two codes, one of them wrong.

- **2-3** — `graphicNovel.href` points to an episode tagged (in-file) with standards 6.NS.B.2,
  6.NS.B.3, 6.SP.B.5c/6.SP.A.2 (whole-number/decimal division and mean) — the episode never
  mentions "fraction," while the lesson itself teaches fraction division (6.NS.1). The config's
  own `graphicNovel.standard: "6.NS.1"` tag is therefore also inaccurate. This is a genuine
  wrong-episode link, distinct from the "too-few-episodes" reuse pattern in gap #7 above.

### Major Per-Lesson Findings

- **6-4 (Properties of Operations)** — Standard is `6.EE.3`, which requires _generating_
  equivalent expressions using properties (CCSS's own example: `3(2+x) → 6+3x`). This lesson's
  practice is almost entirely property-_identification_ on numeric equations ("which property
  is shown: `5+13=13+5`?"), not production tasks that transform algebraic expressions — a
  narrower, nearby-but-different skill than the standard demands. (Also affected by schema gap
  #1: missing `noticeAndWonder`/`revealWordProblem`.)

- **4-6 (Convert Measurement Units)** — The lesson's one Apply problem (Golden Gate Bridge
  capacity ÷ average car weight) never requires a unit conversion — both quantities are
  already in pounds, so it's a plain division problem that doesn't exercise 6.RP.3d's actual
  target skill. Separately, the `noticeAndWonder` hook (km/h vs. mph) requires a
  customary↔metric conversion factor that is never taught anywhere in `explore`/`practice`
  (which only convert within one system: ft↔in, yd↔ft, lb↔oz, km↔m).

- **3-1-flagship** — `familyNotes.conceptSteps[].es` and `tryTogether.scenarioEs` are not
  translations of the paired English text; they're generic boilerplate unrelated to the
  lesson's actual mission story. A Spanish-speaking parent gets different, generic content
  instead of the real story their child is working through.

- **8-5** — The onLevel error-analysis item ("The Quartile-Is-One-Value Mistake") has two
  independently wrong computed values in its worked example (Q1 stated as 10, should be 9; Q3
  stated as 26, should be 24), but the structural `errorStep` field only flags one of the two
  (the prose `correctWork` does catch both) — a content-authoring defect in the error-pointer
  field, not just a difficulty issue.

- **7-6** — `projects[0].title` says "Unit 8 Project" (should be Unit 7) — visible wrong-number
  copy-paste, distinct from the unit's known/accepted href-path numbering convention.

- **9-7** — `projects[0].title`/`.desc` say "Unit 7 Project"/"for Unit 7" (should be Unit 9) —
  same wrong-number copy-paste pattern as 7-6, in a different unit.

### Minor Findings (polish, not urgent)

- **4-7** — The extending "Find the Unit Rate Error" item doesn't actually demonstrate a
  consequential error: the "wrong" and "correct" methods reach the identical conclusion
  ("Deal 2 is the better buy"), undercutting the error-analysis premise.
- **3-3** — Project card shows "6.AT.3a" instead of the lesson's actual "6.RP.3a" — likely the
  same known catalog.json-vs-config.json legacy-naming mismatch already flagged (as WARN, not
  blocking) by `npm run audit`; low priority.
- **2-1** — `graphicNovel.desc` says "Interactive Axiom City episode" but the linked episode
  isn't an Axiom City title; sibling lessons use correct wording for the same href pattern.

### Lessons audited with no findings (all 9 dimensions scored 3+)

`1-1, 1-1-flagship, 1-2, 1-3, 1-4, 1-5, 1-6, 1-7, 2-1-flagship, 2-2, 2-4, 2-5, 3-1,
3-1-flagship, 3-5, 4-1, 4-4, 4-5, 5-1, 5-2, 5-3, 5-3-flagship, 5-5, 6-1, 6-1-flagship, 6-2,
6-3, 6-6, 7-1, 7-1-flagship, 7-2, 7-3, 7-4, 8-1, 9-1, 9-1-flagship, 9-2, 9-3, 9-4, 9-6, 10-1,
10-1-flagship, 10-2, 10-4`

(Several of these still carry the schema-level gaps above — e.g. 1-1 is missing
`noticeAndWonder`/`revealWordProblem` per gap #1 even though its other 8 dimensions are
solid — "no findings" here means no _additional_ per-lesson content-quality issue beyond
what's already logged as a schema gap.)

# Projects Upgrade — "Stats of My Life" Standard

Date: 2026-06-03
Author: Neft Teacher (with Claude)
Status: DESIGN — awaiting approval before implementation

## Goal

Lift every unit culminating project (and, later, per-lesson projects) to the
pedagogical caliber of the exemplar **"Statistics of My Life"**
(`statistics-data/statistics-of-my-life/index.html`) — same inquiry/creativity DNA,
different math + scenarios per unit — to TpT professional-seller quality.

## The Exemplar's Winning DNA (the bar / rubric, 8 dimensions)

1. **Authentic personal inquiry** — students use their OWN real data, not canned defaults.
2. **Self → Peer → World arc** — my data → interview a classmate → compare to a real-world/global sample.
3. **Live interactive tools** — `oninput` auto-calc + check, plus an investigation/"what-if" hook.
4. **Show-your-work + data-story narrative** — reasoning fields and a written data story.
5. **Embedded supports** — Visual Math Notes (vocab + ESOL def + image, BEFORE activities), Formula Bank, ESOL Sentence Frames, EN/ES toggle.
6. **Resource use & output** — generate report + Copy/.txt/.csv, localStorage save, print.
7. **Cross-topic connections** — bridge the unit's math to other units / real domains.
8. **Differentiation** — true Level 1 (support) vs Level 2 (enrichment), never labeled "ESOL".

## Critique Synthesis (11 unit projects, both versions, scored 1–5/dim)

Scores were remarkably uniform: **~15–21 / 40** per project vs **~37 / 40** for the bar.

**Already strong (KEEP):**

- Live per-phase calculators with worked-step output (dim 3–4).
- Genuinely excellent teacher **answer keys** (often exceed the exemplar).
- Clean, on-brand TpT visual polish, rubrics, hint `<details>`, print CSS, sticky progress.

**Universal gaps (every unit):**

1. **No Self→Peer→World arc** (1–2/5 everywhere) — the single biggest miss.
2. **No authentic personal data** — fixed defaults instead of the student's own numbers.
3. **No embedded supports** — missing Visual Math Notes vocab, Formula Bank, ESOL Sentence Frames, EN/ES toggle (violates house rules: vocab-before-activities, Level labeling).
4. **No real Level 1/Level 2 tiers** — versions A/B are parallel _contexts_, not difficulty tiers.
5. **No report/export suite** (Copy/.txt/.csv) and no project-level localStorage.
6. **Calculators click-not-live** (no `oninput`); no What-If Lab / investigation hook.

**Per-lesson projects:** only 1 of 74 lessons (`8-6`) has `config.projects`; 73 show "coming soon." (Separate, larger scope — deferred.)

**Key leverage:** every missing piece already exists as copy-ready code in the exemplar
(`toggleEs()`, `world[]`+`worldCompare()` meter, `whatIf()`, `compare()`, `checkWork()`,
`report()/dl()/downloadCsv()`, `save()/load()`, and vocab/formula/frames card markup).
So this is a **reusable module graft**, not 11 from-scratch rewrites.

## Per-unit upgrade themes (personal-data hook → self/peer/world)

- **U1 Number System** — plan a real party/build with my real counts/budget; GCF/LCM; peer compare; world cost-per-guest meter.
- **U2 Fraction Division** — my real recipe/material share-out; partner swap; world recipe yields.
- **U3 Ratios** — my home recipe / a real athlete's stats; partner ratios; world per-unit prices.
- **U4 Rates & Percents** — my real receipt/item + budget; partner "smarter shopper"; state tax / national price meter.
- **U5 Area** — measure my own room/wall/plot; partner's space; world avg room/plot sizes.
- **U6 Expressions** — my own game-scoring / subscription formula; trade formulas with a partner; world plans.
- **U7 Integers/Coordinate Plane** — map my real places / my elevation+temp life; partner compare; world depths/temps.
- **U8 Equations & Inequalities** — build my escape room / my real fundraiser; partner crack/compare; world fundraiser sample.
- **U9 Two-Variable (y=kx)** — my real growth rate / family plan price; interview a classmate; world benchmark plans.
- **U10 Volume & Surface Area** — measure a real box/space; partner compare (SA÷V efficiency); world product sizes.
- **Statistics** — UPGRADE-IN-PLACE + LINK: keep A/B (rigorous MAD/shape/display) and add the exemplar as the suite's "Personal Data" project; layer personal/peer/world into Version A.

## Proposed Approach

**Build a shared reusable module** (`engine/projects/` — CSS + JS) extracting the exemplar's
patterns (EN/ES toggle, vocab/formula/frames cards, self-check, peer compare, world meter,
what-if, report/export, save/load). Each unit project includes the module and supplies only
its unit-specific data (vocab terms, formulas, world[] dataset, personal-data prompts,
calculators). Benefits: one place to maintain, consistent UX, far less duplication than
copy-pasting into 33+ files.

Alternative considered: copy-paste exemplar code into each file (faster to start, but 33×
duplication and a maintenance nightmare). Rejected.

## Sequencing (recommended)

1. **Build the shared module** + **pilot Unit 1** end-to-end (both versions + answer-key + Level 1/2).
2. **You review the pilot** (visual + pedagogy). Adjust the module/standard from feedback.
3. **Roll out** to Units 2–10 + Statistics using the validated module (parallelizable).
4. **Verify** each: `npm run build` passes; spot-check rendering; keep answer keys extended.
5. (Later, separate effort) **Per-lesson projects** for ~74 lessons via `config.projects`.

## Risks / Notes

- Large scope (~33 files for unit projects). Pilot-first contains risk.
- Preserve existing answer keys (strong asset) — extend, don't rebuild.
- House rules: "Level 1/Level 2" labels only; vocab-before-activities; no folder reorg; content edits in place.
- Deploy is manual `wrangler pages deploy dist` (not auto on push).

```

```

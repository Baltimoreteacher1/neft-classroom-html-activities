# Brief — Unit 2 (lessons 2-1 … 2-12)

You own: `data/practice-studio/2-*.json`, new/edited stats + decimal generators in `assets/studio-gen/stats.js` and the decimal/division parts of
`assets/studio-gen/numbers.js` (localized Edits only), new `assets/studio-act/<kind>.js`, the stats/decimal lab models if a model must change
(`curriculum/learning-labs/shared/models/`), and their tests. Read `RULES.md` first.

## Priority 1 — defects (fix all)

- **2-1:** 16 pool items, 11 multiple choice; students only select. The bench asks students to compute a Range, which is taught in 2-5 → replace with
  a task that needs only what 2-1 teaches (asking vs answering a statistical question; variability). Add non-MC items (see activities).
- **2-3 / 2-4 / 2-5 / 2-8 Spanish:** `cuarto` means room in 2-3 ("reunidos en cinco cuartos", "un cuarto típico") → rewrite; 2-4 "un cuarto de los
  datos" is fine as "una cuarta parte"; use "cuartil" for quartile. 2-1: "La pregunta pareja…" (calque) → "La pregunta compañera…"? No: reword to
  "la otra pregunta"; `razón` as "reason" in 2-1 ("¿Cuál es la mejor razón?") → "¿Cuál es el mejor motivo?".
- **2-10:** rubric keyword `jala` (substring match; "hala/tira" fail). Replace with keywords students actually write, accept variants.
  8 mc / 1 num: add 2 typed or built items.
- **2-6:** the lab computes a ÷ b as a decimal (143 ÷ 12 → 11.9167 "shipments"), so remainders cannot be modeled. Keep the lab honest (say so in
  `labels`/task) and let the written/act items carry remainders.
- **2-7:** the remainder-interpretation idea misleads for decimal divisors (2.4 ÷ 0.35 = 240 ÷ 35 = 6 R 30; the leftover is 0.30, not 30). Do not add
  remainder-in-context items to 2-7 except as clearly labeled enrichment with the 0.30 handled correctly.
- **2-11 / 2-12:** only 2 stem shapes in 2-12 L3; magnitude reasoning for multipliers < 1 thin (22 tagged slips in 320). 2-11 bench must not multiply.
- **Answer-length bias:** in every `mc` of your lessons the correct choice must not be the longest and choices should be within ~25% of length (EN and
  ES). Rewrite distractors (keep their misconception tags and feedback), do not shorten the right answer into vagueness.
- **Mastery:** every 2-x lesson already has `mastery`; keep it, rebalance bias there too.
- Rubric `kw` matching is by substring: write keywords that are stems students really type.

## Priority 2 — new activities (build, test, wire into the lesson data)

1. **2-1 "Ask It Six Times"** (new act `askdots`): menus for Who and When build a question; student predicts "stack or spread"; six simulated respondents
   appear as dots. A fixed-answer question stacks all six on one value (visibly not statistical). Targets `stat-question-no-variability`,
   `stat-question-judged-by-surface`. Deterministic by seed (never random at grade time).
2. **2-2 "Skew Sculptor":** drag five bars (20 students total) to build a right-skewed histogram, then a symmetric one. Feedback names where the data
   sits ("most data on the left, tail to the right") never the finished shape. Do not make bin width a guessable multiple choice (3 options reveal by
   elimination) — let the student set it with a slider and judge the result.
3. **2-3 "Count-off":** histogram of 9 values (10-14:4, 15-19:1, 20-24:2, 25-29:2 as seed-varied shapes). Student taps bars left to right while a tally builds
   and stops at the middle value. Tallest-bar guess stops at tally 4 and visibly fails. Median interval = the middle by count. Targets `stat-mode-mixup`,
   `stat-median-middle-wrong`. Keep the mean readout OFF in 2-3 (mean is 2-8).
4. **2-4/2-5 "Box Twins":** given a five-number summary and n = 12, drag 12 dots; live quarter-counts (3,3,3,3) and per-statistic check marks with direction
   ("Q1 too low"); then build a second, different dataset with the same box. 2-5 variant: same range, IQR 4 vs 12. Validate by constraints, not one answer.
5. **2-6 "One division, four questions":** 150 ÷ 12 = 12 R 6; student sorts chips (12, 13, 6, 12.5) onto "full boxes", "boxes to ship all", "items left over",
   "if partial boxes allowed". A wrong drop shows what that number counts, never the right chip.
6. **2-9 "MAD twins":** four dots, mean 10, MAD 2 (total distance 8 shown as a meter the student must divide). Many valid builds (8,8,12,12; 7,9,11,13;
   6,10,10,14). Target `stat-summed-instead-of-averaged`.
7. **2-10 "Headline Court":** prices 120,125,130,135,140,150,170,200,240 (thousands): mean ≈157, median 140, no outlier by 1.5×IQR. Student matches a
   headline ("$157k typical" vs "$140k typical") to a buyer and a tax assessor who needs the total (mean × 9 = 1,410; median × 9 = 1,260). Choice depends on
   purpose. Seeded variants with different data.
8. **2-11 / 2-12 magnitude zones + receipt checker:** before showing a subtotal the student taps a size zone (<$1, $1-10, $10-100) from rounded numbers; a
   misplaced decimal lands outside the zone. Receipt lines include misaligned addition (13.39 for 7.4 + 12.65) and 0.1-versus-10 point slips.
9. **Faulty-build (2-3):** a lab/act state where the dot plot is deliberately unordered; the student diagnoses before fixing.

## Priority 3 — problem shapes

Add `shapes` to the generators your lessons use (medianFind, meanFind, meanMissing, rangeIqr, boxplotRead, histogramRead, madCalc, chooseMeasure,
longDivision, decimalDivision, decimalAddSub, decimalMultiply): forward (existing), reverse ("the median is 8; build/choose a set that gives it"),
which-input-gives-output, and compare-two where natural. Wire at least two shapes into each lesson's `fresh` and `climb` (`{k:"gen", g, level, shape}`).
Each shape needs `check()` and wrong choices with named traps. Test with `tools/studio-gen.test.mjs`.

## Priority 4 — estimate-first, why-chip, contrasting case data

For 2-11, 2-12: add an `estimate` field on 2 items per lesson (benchmark + choice set bigger/smaller/about the same, derived from the answer). For 2-8
and 2-10: add a `contrast` item (two worked solutions: correct vs trap, or two valid methods) in `moves` or a new `contrast` array if the runtime kind
exists by the time you finish (ask the integrator via your report if not; do not invent runtime).

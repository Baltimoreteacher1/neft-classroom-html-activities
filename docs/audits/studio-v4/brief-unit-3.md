# Brief — Unit 3 (lessons 3-1 … 3-10)

You own: `data/practice-studio/3-*.json`, `assets/studio-gen/ratio.js` (localized Edits), `assets/studio-act/ratiomix.js` + `convchain.js` + new act
files, ratio/rate/conversion lab models in `curriculum/learning-labs/shared/models/` (e.g. `ratio-unit-rate`, growth-table) and their tests.
Read `RULES.md` first.

## Priority 1 — defects

- **3-1:** the lab readout is "Juice per cup of water" (a ÷ b = a unit rate, which is 3-2). The stretch asks "juice to whole drink = 6:11, target 1.2" but the
  lab never shows 6:11, so part-to-whole can't be verified. Fix the readout/task so 3-1 only needs ratios (part:part and part:whole). Top trap is
  part-whole mix-up (275 of 320 items).
- **3-6 / 3-10:** 3-10 duplicates 3-6 (same generator `convertUnits`, same `convchain {system:"same"}`, same lab) and its stems say "use the double
  number line / ratio table" so conversion factors as fractions and cancellation are never taught. 3-10 must teach conversion factors (e.g. 1 yd = 3 ft as
  3 ft / 1 yd) with units that cancel; keep 3-6 on same-system conversions by ratio reasoning. Reveal alignment: keep content within the lesson names.
- **3-7 Spanish:** hint "Un litro es un poco más que un cuarto" vs stems "cuarto de galón": use "cuarto de galón" everywhere and gloss `qt`.
  **3-8:** "bridas" → "amarres" (zip ties).
- **3-8 math flaw:** ~22% of L3 "least pay" items (45 of 200) are box items that price partial boxes ("Box A holds 10 bars for $10.50, Box B 8 for $9.20,
  Kai needs 21 bars" keyed 21 × $1.05 = $22.05 though boxes are sold whole). Restrict least-pay to by-weight / by-GB contexts, or ask only for the unit
  price. Bigger-isn't-better is already balanced (158 vs 142 of 300): keep that.
- **3-4:** the lab's "Starting passengers" control is locked at 0 → unlock for the new activity.
- **3-5 color-blind safety:** do not use blended-color overlays; patterned unit bars only.
- **Answer-length bias** in all `mc` (correct must not be the longest; lengths within ~25%, EN and ES). 14-lesson hole: **mastery sections are missing
  for 3-7, 3-8, 3-9, 3-10** — author 4–6 mastery items each (a mix of kinds), computed answers, bilingual.
- 3-3 / 3-9 already strong (additive vs multiplicative scaling trap is the key); 3-2, 3-5, 3-7 strong.

## Priority 2 — new activities

1. **3-1 "Tag the tape":** tape of 3 red + 5 blue; student drags four ratio cards (red:blue, blue:red, red:all, all:red) onto it; the studio highlights what
   the student's ratio actually compares ("your 3:8 spans the whole tape").
2. **3-4 "Add a rider":** unlock a start of 2 on 3 per carriage: points (1,5),(2,8),(3,11) are straight but NOT through the origin (y÷x = 5, 4, 3.67). The
   student predicts, then adds a y ÷ x column and decides proportional or not. Target: any straight line is proportional.
3. **3-10 "Cancel it":** tile chain 2.5 yd → in: 2.5 yd × (3 ft / 1 yd) × (12 in / 1 ft) = 90 in. A flipped tile leaves visible leftover units (yd²/ft). Seeded
   unit pairs (length, capacity, mass), never an answer in the stem. The Mars Climate Orbiter (lbf·s vs N·s, factor ≈ 4.45) story belongs HERE only, as an
   `err` item.
4. **3-3 contrasting case:** two worked tables side by side — add-the-same vs multiply-the-same — student marks "what stayed the same / what changed".
5. **3-5 patterned bars** compare tool (hatched unit bars, not colors) for "which mixture is more X".
6. **3-6 / 3-7 / 3-9:** keep; add reverse and which-input shapes.

## Priority 3 — problem shapes

`shapes` for eqRatioTable, eqRatioMissing, ratioWrite, unitRate, unitRateWord, compareRatios, ratioGraphRead, convertUnits, convertBetween: forward,
reverse ("the ratio is 7:3; which table/graph belongs"), which-input-gives-output, compare-two. Wire ≥2 shapes into each lesson's `fresh` and `climb`.
Check every shape independently in `check()`; run `tools/studio-gen.test.mjs`.

## Priority 4 — data for runtime features

Add `estimate` (bigger/smaller/about the same benchmark) on 2 items in 3-2; a `contrast` item for 3-3; one "Same Numbers" friendly item (no randomness at
grade time) is automatic via seeds.

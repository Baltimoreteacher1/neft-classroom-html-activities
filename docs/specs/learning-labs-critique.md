# Learning labs: critique and what changed

Audited 2026-10-15 by loading every lab as a student (46 labs, six steps each: Mission, Learn, Investigate,
Practice, Create, Games) and reading the shared engine (`curriculum/learning-labs/shared/`).

## What a student actually experienced

| Finding | Evidence | Status |
| --- | --- | --- |
| **The "interactive" model was a picture redrawn from number boxes.** The task said "Shade 35 out of 100 squares", but the grid could not be touched; you typed 35 into a field. | Hundred-Square Studio, Investigate. `model.mjs` renders SVG from `controls()` only. | **Fixed for 33 of 46 labs** (`direct.mjs`): tap or drag the model itself. |
| **Practice was a quiz in a box.** Seven multiple-choice items with no model in sight, even though every lab is built around one. | Practice step of every lab. | **Fixed:** "Open the lab model" panel on every problem, remembered between problems. |
| **No sense of reward or progress across labs.** Labs felt like 46 separate pages. | No stars, no completion moment, "Not started" text on cards. | **Fixed:** star message per finished activity, a collectible stamp per finished lab, a 46-slot passport on the index. |
| **Learning labs was mixed with unrelated things.** Neft City, Hero Novels, XR Math, Math Lab Missions, NetFold and others were filed under "Labs & Projects", and every lab had a "Go deeper" box to the Canvas and Reality Lab. | Catalog "labs" section had 99 entries for 46 labs. | **Fixed:** only the labs remain under Learning Labs; the rest moved to Tools, Games and Activities. |
| Page was a pale gray wall. | `/curriculum/` background `#f5f6f3`. | **Fixed:** soft aqua, AA contrast kept. |

## Still open (not done, in priority order)

1. **13 models are still controlled by number fields only**: histogram, decimal receipt and budget, division,
   rate, conversion (2), factors (2), power, solid nets (2), regular polygon. Each needs its own direct gesture.
2. **Investigations are free-text prompts.** The model never checks them ("Shade 35 squares" is not verified).
   A per-lab goal definition (`target` values per prompt) would let the model confirm and celebrate.
3. **Create is a text box** with a word count. A publisher-quality version would save the student's own model
   state as a shareable picture.
4. **Learn is a stepper of text lines.** Worked examples should animate on the same model the lab uses.
5. **One template for 46 labs.** The six-part shell is consistent, but each lab's story and art are thin; the
   expedition worlds in Games are the strongest part and the other steps should borrow that look.
6. **No sound or voice.** Read-aloud exists site-wide but not inside a lab's model feedback.

## Verification

`tools/learning-labs-direct.test.mjs` (geometry + every lab's pointer sweep), `tools/learning-labs-celebrate.test.mjs`
(stars, silent catch-up, single stamp), `tools/learning-labs.test.mjs` and the in-browser lab check
(`validate:learning-labs-browser`) all run in the gate.

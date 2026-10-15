# Learning labs: critique and what changed

Audited 2026-10-15 by loading every lab as a student (46 labs, six steps each: Mission, Learn, Investigate,
Practice, Create, Games) and reading the shared engine (`curriculum/learning-labs/shared/`).

## What a student actually experienced

| Finding | Evidence | Status |
| --- | --- | --- |
| **The "interactive" model was a picture redrawn from number boxes.** The task said "Shade 35 out of 100 squares", but the grid could not be touched; you typed 35 into a field. | Hundred-Square Studio, Investigate. `model.mjs` renders SVG from `controls()` only. | **Fixed for all 46 labs** (`direct.mjs`): tap or drag the model itself. |
| **Practice was a quiz in a box.** Seven multiple-choice items with no model in sight, even though every lab is built around one. | Practice step of every lab. | **Fixed:** "Open the lab model" panel on every problem, remembered between problems. |
| **No sense of reward or progress across labs.** Labs felt like 46 separate pages. | No stars, no completion moment, "Not started" text on cards. | **Fixed:** star message per finished activity, a collectible stamp per finished lab, a 46-slot passport on the index. |
| **Learning labs was mixed with unrelated things.** Neft City, Hero Novels, XR Math, Math Lab Missions, NetFold and others were filed under "Labs & Projects", and every lab had a "Go deeper" box to the Canvas and Reality Lab. | Catalog "labs" section had 99 entries for 46 labs. | **Fixed:** only the labs remain under Learning Labs; the rest moved to Tools, Games and Activities. |
| Page was a pale gray wall. | `/curriculum/` background `#f5f6f3`. | **Fixed:** soft aqua, AA contrast kept. |

## Round 2 (all items from "still open" are now built)

| Item | What was added |
| --- | --- |
| All 46 models touchable | Histogram (drag a bar to move observations in or out) and both solid nets (drag across the net) joined the other 43. |
| Investigations are checked | "Predict first": say up, down or same, change the model, and the model's own math answers; score kept. Plus the Model challenge (three reachable targets per lab). |
| Create is more than a text box | "Build it on the model": touch the model, add its equation to the write-up, and save a PNG of it. |
| Learn is tied to the model | "Try this idea on the lab model" panel next to each worked example. |
| Sound | Optional, off by default, toggle in the toolbar; cues for a hit target, right prediction, finished activity and stamp. |
| Thin story and art | The Mission step opens on the lab's own world scene; each pair of finished activities lights one of its three stops. |

## Still open

1. Each lab's story is still one scene and three place names; a full per-lab narrative arc would need authored copy for 46 labs.
2. Worked examples are stepped text beside a live model, not animated on the model.
3. Sound has four cues; no voice.

## Verification

`tools/learning-labs-direct.test.mjs` (geometry + every lab's pointer sweep), `tools/learning-labs-celebrate.test.mjs`
(stars, silent catch-up, single stamp), `learning-labs-challenge`, `learning-labs-predict`, `learning-labs-sound`, `tools/learning-labs.test.mjs` and the in-browser lab check
(`validate:learning-labs-browser`) all run in the gate.

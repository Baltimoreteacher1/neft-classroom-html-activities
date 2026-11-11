# Small-group investigations — authored content spec (v1)

Source of truth for the **Group 2 (Challenge) investigation** in every small-group studio:
`data/small-group-investigations/<unit>-<lesson>.json`, one file per base lesson (84).
`tools/lib/small-group-build.mjs` copies it to `launch.practice.investigate` of the
`<id>-group2` studio config. Gate: `node tools/validate-small-group-investigations.mjs [lesson…]`
(`npm run validate:small-group-investigations`, part of `validate`).

Group 2 must deepen reasoning, not add harder arithmetic. The investigation is three short
tasks, each a different habit of mind. The studio shows them one at a time in the
"Solve Together" and "Prove It" stages.

```json
{
  "lesson": "3-1",
  "conjecture": {
    "claim": "If I switch the order of the numbers in a ratio, it still compares the same two things.",
    "claimEs": "…",
    "verdict": "never",
    "evidence": "5:2 compares grapes to strawberries. 2:5 compares strawberries to grapes. The order names which quantity comes first.",
    "evidenceEs": "…",
    "frames": ["I think this is ___ because ___.", "A counterexample is ___."],
    "framesEs": ["…", "…"]
  },
  "errorAnalysis": {
    "scenario": "Mia solved the problem. Find her mistake.",
    "scenarioEs": "…",
    "problem": "The ratio of boys to girls is 4:5. There are 20 girls. How many boys?",
    "problemEs": "…",
    "work": [
      { "line": "4 + 5 = 9", "lineEs": "…" },
      { "line": "20 ÷ 9 is not a whole number, so I will use 20 − 5 = 15", "lineEs": "…" },
      { "line": "15 boys", "lineEs": "…" }
    ],
    "flawed": 1,
    "flaw": "She subtracted instead of finding the scale factor. 5 × 4 = 20, so the boys are 4 × 4.",
    "flawEs": "…",
    "fix": "16 boys. The scale factor from 5 girls to 20 girls is 4, so boys are 4 × 4 = 16.",
    "fixEs": "…"
  },
  "compare": {
    "problem": "…",
    "problemEs": "…",
    "methods": [
      { "name": "Ratio table", "nameEs": "…", "lines": ["…"], "linesEs": ["…"] },
      { "name": "Unit rate", "nameEs": "…", "lines": ["…"], "linesEs": ["…"] }
    ],
    "ask": "Which method is faster here? Would your choice change if the numbers changed?",
    "askEs": "…",
    "insight": "Both reach the same answer. The table is faster when the scale factor is a whole number; the unit rate is faster when you must compare many pairs.",
    "insightEs": "…"
  }
}
```

## Rules (all checked by the gate unless marked reading task)

- **Same lesson.** Every task uses the mathematics of THIS lesson's objective and vocabulary
  (read `lessons/<id>-group2/config.json` `contentObjective` and
  `data/small-group-practice/<id>.json`). No other lesson's content. (reading task)
- **Verdict is true.** `conjecture.verdict` is `always`, `sometimes` or `never`; the evidence
  proves it (a counterexample for `sometimes`/`never`, a short general reason for `always`).
  Across the 84 files no verdict may exceed 45% of the set. (reading task + count)
- **The error is a real misconception**, one a Grade 6 student makes on this lesson — never a
  slip of arithmetic only. `flawed` is the 0-based index into `work`; every other line is
  correct reasoning. `work` has 3 to 5 lines. The fix restates the right answer.
- **Compare**: exactly two methods, both valid, both reaching the same answer, using different
  representations (table vs unit rate, bar model vs equation, number line vs fraction, …).
  Each has 2 to 4 `lines` with a Spanish `linesEs` of equal length.
- **Bilingual.** Every English field has an `…Es` sibling; Spanish is not a copy of English
  (numbers and symbols aside). Tú form for students. No Arabic/French/Dari.
- **Plain language.** Sentences of 22 words or fewer. No "below", "above", "the picture"
  (layout references). No timer language.
- **Notation.** Use × ÷ − (not `x`, `*`, hyphen-minus between spaced numbers).
- **Every `a op b = c` the gate can parse must be true.**
- Do not edit any other file. Do not copy a claim, scenario or problem between lessons; the
  gate fails duplicate claims and duplicate scenarios.
- No violet/purple words or colours (palette gate).

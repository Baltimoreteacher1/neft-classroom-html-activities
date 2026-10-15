# Forensic audit of the Grade 6 HTML practice studios (feeds AUDIT_REPORT.md)

Joel (2026-10-15): audit every HTML practice activity against the canonical lesson, classify each widget, and upgrade what fails.
The activities audited are the studios linked as "HTML practice" and "HTML practice (Challenge)" on /curriculum/units/ for every lesson in
Units 2-9 (72 lessons; Unit 4's five are hand-built pages under `math/unit-4/`, the other 67 are generated from `data/practice-studio/<id>.json`).

## Laws (from the brief; they decide every classification)

1. **Canonical lesson source authority.** Judge a widget against the lesson's own objective, warm-up, worked example (`launch.conceptIntro`), vocabulary,
   its position in the unit, and what earlier lessons taught. Never judge from the title alone. A procedural formula (A = ½bh, keep-change-flip,
   cross-multiplication, y = kx...) may not appear before the lesson that derives it. Use `scripts/audit/dump-studio.mjs <id>` for the unit position and
   the studio contents, and read earlier lessons' `config.json` when a formula or method looks early.
2. **Math typography.** Visible text and figure labels use × ÷ − (U+2212) ≤ ≥ ≠, tidy equation spacing; fractions in the lesson's notation.
3. **SVG model standards.** Every mathematical graphic is parametric inline SVG with explicit width/height/viewBox and a figure that is mathematically right.

## Classes (one per widget; a widget is one kind of task in one place: e.g. "Practice §2 items 1-3 (mc)")

- `ALIGNED`: matches the lesson's mathematics, representation and cognitive demand.
- `QUESTIONABLE`: weak interactivity (passive, click-to-reveal) that needs no mathematical reasoning.
- `MISALIGNED`: violates scope/sequence (formula or method not yet taught, wrong model, mismatches the objective).
- `REDUNDANT`: a multiple-choice or fill-in digital worksheet disguised as an interactive widget (the lesson's idea has a manipulable model and
  the studio does not use it).
- `BROKEN-MODEL`: the representation itself is flawed (non-perpendicular base/height, unaligned zero on a double number line, unproportional partitions,
  wrong labels, broken drag/touch).

## What you produce: one file per lesson, `data/audit/studio-audit/<id>.json`

```jsonc
{
  "lesson": "5-8", "unit": 5, "title": "...", "objective": "I can ...", "position": "8 of 10",
  "model": "the representation the lesson teaches with, in a phrase (e.g. net of a pyramid with slant height)",
  "widgets": [
    { "where": "Practice §4 (gen:surfaceAreaPyramid L1-3, 7 items)",
      "component": "generated pyramid surface-area word problems with a labeled shape figure",
      "class": "ALIGNED|QUESTIONABLE|MISALIGNED|REDUNDANT|BROKEN-MODEL",
      "root": "why (one sentence; for ALIGNED say what was checked)",
      "replacement": "for anything not ALIGNED: the exact build (model, interaction, the misconception it must trap); '' for ALIGNED" }
  ],
  "formulaOrder": [ { "formula": "½ × b × h", "taughtIn": "5-2", "earliestUseInStudio": "5-8" } ],   // [] when the lesson has no formula
  "typography": [ "Practice §1.2 prints 'x' for multiplication" ],                                      // [] when clean
  "missingModel": "true when the lesson has a canonical manipulable model that no studio widget lets the student manipulate",
  "lessonClass": "the worst class among the widgets (order: BROKEN-MODEL, MISALIGNED, REDUNDANT, QUESTIONABLE, ALIGNED)"
}
```

Honesty rules: a typical studio is mostly multiple-choice and generated numeric items; that is REDUNDANT only when the lesson's idea is a model
students should manipulate and the studio offers none, otherwise it is ALIGNED. Do not mark everything REDUNDANT, and do not mark everything ALIGNED to be
kind. Check at least: that each item's mathematics matches the lesson; that no item needs a formula the unit has not yet taught; that figures are right
(open `scripts/audit/dump-studio.mjs` output, and where in doubt render the item through `loadStudio` in `tools/lib/studio-vm.mjs`); that Unit 4's hand-built pages
(math/unit-4/...) are read directly from their HTML. Cite item numbers in `where`.
Your lessons are listed in your brief. Edit only your `data/audit/studio-audit/<id>.json` files. Do not run generators, gates or commit.
Report: files written, counts per class, and the three worst findings.

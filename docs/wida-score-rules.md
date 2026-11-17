# WIDA score rules used by the Data Studio

Source of truth: `access-teacher/predictive/rules.js` (`RULES_VERSION`). Verified 2026-11-17 by web search; the Interpretive Guide tables themselves were **not** read in full.

## Assessments

ACCESS (1-12), ACCESS for Kindergarten, MODEL Online, MODEL Paper, MODEL for Kindergarten. ACCESS families are annual; MODEL is interim. Families are never compared numerically with each other.

## Scale reset (2025-26)

WIDA revised ACCESS for 2025-26 to the 2020 ELD Standards Framework and reset the scale; 2025-26 scale scores cannot be compared with earlier years ([WIDA](https://wida.wisc.edu/news/what-know-wida-assessments-2025-2026-school-year), [revising ACCESS](https://wida.wisc.edu/revisingaccess)).

- `scaleVersionOf`: `access-2016-scale` before 2025-26, `access-2025-scale` from 2025-26 (Kindergarten: `access-k-…`).
- Levels are compared only when assessment family, scale version **and** cut-score version all match (`levelComparable`). No growth is calculated across the reset; charts break the line there.

## 2026 standard setting

WIDA set new cut scores in summer 2026 ([standard setting](https://wida.wisc.edu/standardsetting)). 2025-26 levels were first reported on the 2016 cuts and re-issued afterwards.

- `levelVersionOf`: before 2025-26 → `2016-cuts`; 2025-26 → `2016-cuts` unless the teacher marks the updated report (`2026-cuts`); 2026-27 onward → `2026-cuts`.
- Forecasts use only levels on the target year's cut-score version, so a 2026-27 forecast from 2016-cut levels is refused.

## Composites

| Composite | Weights (2016 ACCESS scale) |
| --- | --- |
| Oral Language | Listening 50%, Speaking 50% |
| Literacy | Reading 50%, Writing 50% |
| Comprehension | Listening 30%, Reading 70% |
| Overall | Listening 15%, Speaking 15%, Reading 35%, Writing 35% |

Sources: [WIDA scoring article](https://wida.wisc.edu/news/everything-youve-ever-wanted-know-scoring-access-ells) (Oral equal, Comprehension weighted to Reading), [Wisconsin DPI table](https://dpi.wi.gov/wisedash/districts/about-data/access) (percentages), WIDA TR-2019-3 (Overall).

- Reported composites are always used when present.
- A missing composite **scale score** may be illustrated from reported domain scale scores on the 2016 scale and is labelled *Calculated (illustrative)*.
- A composite **proficiency level** is never calculated and never averaged from domain levels (WIDA converts with cut tables).
- No weights are applied to the reset scale, Kindergarten or MODEL until checked against WIDA's documentation for that version.

## Validation ranges

Levels 1.0-6.0 with at most one decimal. Scale scores 100-600 on the 2016 scale; no documented range is applied to other versions (a warning says so). School years `YYYY-YY`, not in the future. Measurement error must be positive.

# Small-group audit — false-positive log

Automated analysis **identifies candidates**. Direct inspection **confirms
instructional defects**. A fleet-level detector result is never converted
straight into curriculum edits.

This file is the memory of that rule. Every entry below is a finding that looked
real, was investigated, and turned out to be the detector or a wrong assumption
about where the data lives. Without this record the same "defect" gets
rediscovered and, next time, "fixed" — which would damage lessons that are
working correctly.

## The ratchet

| Share of a population flagged    | Required before acting                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| ~25% or more                     | Manually inspect representative **positives and negatives**                           |
| Nearly the whole population      | Assume the detector or its source-of-truth assumption is wrong until proven otherwise |
| Any "content is missing" finding | Verify every schema field and data file that could hold it                            |

Prefer **needs inspection** over a fabricated grade. A detector that cannot tell
"absent" from "somewhere else" must report unknown, not bad.

---

## FP-1 — "82 of 84 challenge lessons have low cognitive demand"

**Claimed:** challenge lessons are almost entirely procedural; depth comes from
bigger numbers rather than deeper thinking.

**Reality:** the classifier read only `item.stem`. `error-analysis` items have no
`stem` at all — their text lives in `title` and `workedExample[].work`. The
detector was scoring the fleet's _strongest_ challenge tasks as procedural,
because it could not see them.

**Why it was convincing:** the grade was low on exactly the lessons that had
invested in richer item types, so the fleet looked uniformly weak.

**Fix:** `itemText()` reads every authored text field, and the authored item
`type` is treated as the strongest demand signal — a type is a decision someone
made, not an inference from wording.

**After correction:** 24 of 84, and those survive inspection (see FP-note below).

**Rule learned:** a classifier that cannot see the task cannot grade the task.
Before trusting a text detector, print what it actually read for a known-good item.

## FP-2 — "36 lessons have no teacher facilitation"

**Claimed:** 36 lessons ship with no ASK / LOOK FOR / IF STUCK / EXTEND.

**Reality:** all 36 were the catch-up lessons, which deliberately do not
participate in `functions/teacher-small-group/_facilitation-data.js` — a
different delivery model. The finding described the file being read, not the
lessons.

**Fix:** catch-up is excluded from the facilitation check.

**Rule learned:** "content is absent" is only a finding once every place that
content could live has been checked. Absence from one data source is not absence.

## FP-3 — "31 catch-up lessons have too many practice items"

**Claimed:** 31 of 36 catch-up lessons exceed a sane small-group item count
(15–72 items against a >14 threshold).

**Reality:** a catch-up lesson is a **multi-lesson spiral review** —
`6-15-catchup` covers Lessons 6.4–6.15, twelve lessons, in 72 items.
Measured across all 36, every catch-up lesson sits at **5–6 items per reviewed
lesson**, and none exceeds 9. The item count scales with how much is being
reviewed, which is the design working, not bloat.

**Why it was convincing:** raw counts of 42, 53 and 72 look indefensible for a
small group until you divide by the number of lessons under review.

**Fix:** catch-up is judged per reviewed lesson (`lessonsCovered`, parsed from
the objective's "Lessons 6.4–6.15" range); single-lesson support/challenge groups
keep the raw threshold.

**Rule learned:** before flagging a quantity, check what the quantity is _per_.
A flat threshold across populations with different jobs measures the population,
not the quality.

---

## Confirmed, not false positives

Kept here so the log is not read as "every finding was noise":

- **`9-1-group2` is 100% identification multiple-choice.** Inspected in full:
  "which pair correctly names the variables", "which is NOT a dependent
  relationship", "which table row is correct". For a lesson whose students have
  already mastered the core target, this is precisely the "challenge = more
  questions" anti-pattern. A genuine C.
- **9 support lessons carry no misconception tag on any item.** Verified against
  the item schema (`misconceptionTags`), not inferred from absence in one file.

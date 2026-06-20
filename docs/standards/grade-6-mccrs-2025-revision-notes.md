# Grade 6 Math Standards — 2025 Maryland MCCRS Revision (planning notes)

**Status: research + plan. NOT yet applied to the curriculum.**
The canonical taxonomy (`data/standards-taxonomy.json`) and the `standard` field
on the 74 lesson configs are still on the **old CCSS-based codes** and have NOT
been changed. This file records what we confirmed about the revision and exactly
what is needed to finish the re-code safely.

---

## Why this isn't done yet (the blocker)

The request was to update all Grade 6 standards to match the Maryland guide and
build lessons for any standard with no lesson. Investigation showed the second
half is straightforward (done — see "Unit 0" below), but the first half is a
**major re-code, not a wording refresh**, and the authoritative source could not
be retrieved from this environment.

- Maryland adopted a **revised** set of math standards (Maryland State Board,
  **2025-07-29**), taking effect **SY 2026–2027**. Grade 6 is therefore **no
  longer identical to the 2010 CCSS** the repo currently encodes.
- Every host carrying the official text is blocked by this environment's network
  egress allowlist: `marylandpublicschools.org`, `ixl.com`,
  `satchel.commongoodlt.com`, `resources.finalsite.net`, `webassets.zearn.org`,
  and reader-proxies (`r.jina.ai`, `corsproxy.io`). Only GitHub raw is reachable
  (no copy exists there). WebSearch returns only short, **internally
  inconsistent** summaries — not enough to re-code ~40 standards verbatim.
- Re-coding the canonical taxonomy + 74 lesson `standard` fields on guessed codes
  would corrupt `data/content-graph.json`, `data/content-coverage.json`, and
  `data/curriculum-search-index.json` (the platform spine). So it was
  intentionally **not** fabricated.

### To unblock (any one)

1. Add `marylandpublicschools.org` to the environment's network egress settings,
   then the official Grade 6 crosswalk + companion guide can be fetched directly.
2. Commit the crosswalk PDF into the repo (e.g.
   `docs/standards/grade-6-mccrs-crosswalk.pdf`) — GitHub is reachable.
3. Paste the revised Grade 6 standards (or the old→new crosswalk table) into chat.

### Authoritative source documents (to pull once unblocked)

- Revised standards landing page:
  `https://marylandpublicschools.org/about/pages/dcaa/math/revised-standards.aspx`
- Grade 6 crosswalk (old→new):
  `https://marylandpublicschools.org/about/Documents/DCAA/Math/revised/Grade-6-MCCRS-Math-Crosswalk-A.pdf`
- Grade 6 standards companion guide:
  `https://marylandpublicschools.org/about/documents/dcaa/math/revised/grade-6-mccrs-math-standards-companion-guide-a.pdf`
- Full adopted standards (State Board, 2025-07-29):
  `https://www.marylandpublicschools.org/stateboard/Documents/2025/0729/Maryland-College-and-Career-Ready-Standards-for-Math-A.pdf`

---

## What is CONFIRMED about the revision (multiple consistent sources)

- A new **Algebraic Thinking (AT)** domain **merges** the old
  **Ratios & Proportional Relationships (RP)** and **Expressions & Equations (EE)**.
- Old **Geometry (G)** is reframed as **Geometric Reasoning and Measurement (GR)**.
- Ratio content lands in a **6.AT.A** cluster (e.g. the ratio-language standard,
  old 6.RP.A.1, appears as **6.AT.A.1**).
- Stated goals: clarify expectations, elevate fluency with a focus on algebraic
  thinking, and create a more cohesive geometry experience across middle grades.
- The format is a **crosswalk** that shows each revised standard beside its prior
  version — i.e. the underlying Grade 6 *content* carries forward; it is
  **reorganized and renumbered**, not replaced with new topics.

## What is NOT yet verified (must come from the source before applying)

- Whether **The Number System** stays `NS` or becomes `NOS` (WebSearch summaries
  conflict — both appear).
- The **Statistics** domain abbreviation (`SP` vs `STATS`).
- Exact **cluster letters**, **sub-standard numbering**, and **verbatim wording**
  for every standard.

Because of the above, the draft crosswalk below fills in only the high-confidence
structural mapping and marks every uncertain code as **`⟨confirm⟩`**. Do not ship
any `⟨confirm⟩` value without checking it against the source document.

---

## Draft old→new crosswalk (structural; confirm exact codes from source)

Old codes are the current repo taxonomy (`data/standards-taxonomy.json`).

| Old (CCSS, in repo) | Old description (short) | New domain (confirmed) | New code |
|---|---|---|---|
| 6.RP.A.1 | Ratio concept / language | Algebraic Thinking (AT) | 6.AT.A.1 |
| 6.RP.A.2 | Unit rate a/b | Algebraic Thinking (AT) | 6.AT.A.⟨confirm⟩ |
| 6.RP.A.3 | Ratio/rate reasoning to solve | Algebraic Thinking (AT) | 6.AT.A.⟨confirm⟩ |
| 6.RP.A.3.A | Equivalent-ratio tables; plot | Algebraic Thinking (AT) | 6.AT.A.⟨confirm⟩ |
| 6.RP.A.3.B | Unit-rate / pricing / speed | Algebraic Thinking (AT) | 6.AT.A.⟨confirm⟩ |
| 6.RP.A.3.C | Percent of a quantity | Algebraic Thinking (AT) | 6.AT.A.⟨confirm⟩ |
| 6.RP.A.3.D | Convert measurement units | Algebraic Thinking (AT) | 6.AT.A.⟨confirm⟩ |
| 6.EE.A.1 | Whole-number exponents | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.A.2 / .2A–.2C | Read/write/evaluate expressions | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.A.3 | Equivalent expressions (properties) | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.A.4 | Identify equivalent expressions | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.B.5 | Solving as a truth question | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.B.6 | Variables to represent numbers | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.B.7 | One-step equations x+p=q, px=q | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.B.8 | Inequalities x>c / x<c | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.EE.C.9 | Dependent/independent variables | Algebraic Thinking (AT) | 6.AT.⟨confirm⟩ |
| 6.NS.A.1 | Divide fractions by fractions | Number System (NS/NOS ⟨confirm⟩) | 6.⟨confirm⟩.A.1 |
| 6.NS.B.2 | Fluently divide multi-digit | Number System ⟨confirm⟩ | 6.⟨confirm⟩.B.2 |
| 6.NS.B.3 | Decimal operations | Number System ⟨confirm⟩ | 6.⟨confirm⟩.B.3 |
| 6.NS.B.4 | GCF, LCM, distributive | Number System ⟨confirm⟩ | 6.⟨confirm⟩.B.4 |
| 6.NS.C.5 | Pos/neg in context | Number System ⟨confirm⟩ | 6.⟨confirm⟩.C.5 |
| 6.NS.C.6 / .6A–.6C | Rational numbers on the line/plane | Number System ⟨confirm⟩ | 6.⟨confirm⟩.C.6 |
| 6.NS.C.7 / .7A–.7D | Order & absolute value | Number System ⟨confirm⟩ | 6.⟨confirm⟩.C.7 |
| 6.NS.C.8 | Four-quadrant graphing; distance | Number System ⟨confirm⟩ | 6.⟨confirm⟩.C.8 |
| 6.G.A.1 | Area by compose/decompose | Geometric Reasoning & Measurement (GR) | 6.GR.⟨confirm⟩ |
| 6.G.A.2 | Volume w/ fractional edges | Geometric Reasoning & Measurement (GR) | 6.GR.⟨confirm⟩ |
| 6.G.A.3 | Polygons in coordinate plane | Geometric Reasoning & Measurement (GR) | 6.GR.⟨confirm⟩ |
| 6.G.A.4 | Nets & surface area | Geometric Reasoning & Measurement (GR) | 6.GR.⟨confirm⟩ |
| 6.SP.A.1 | Statistical question | Statistics (SP/STATS ⟨confirm⟩) | 6.⟨confirm⟩.A.1 |
| 6.SP.A.2 | Distribution: center/spread/shape | Statistics ⟨confirm⟩ | 6.⟨confirm⟩.A.2 |
| 6.SP.A.3 | Center vs variability | Statistics ⟨confirm⟩ | 6.⟨confirm⟩.A.3 |
| 6.SP.B.4 | Dot plots/histograms/box plots | Statistics ⟨confirm⟩ | 6.⟨confirm⟩.B.4 |
| 6.SP.B.5 / .5A–.5D | Summarize numerical data | Statistics ⟨confirm⟩ | 6.⟨confirm⟩.B.5 |

---

## Execution plan once the source is available

1. Replace `data/standards-taxonomy.json` with the revised domains/codes/wording;
   keep an `oldCode`/`crosswalk` field on each entry so legacy links stay traceable.
2. Sweep the 74 `lessons/<id>/config.json` `standard` fields old→new (scripted,
   using the confirmed crosswalk), plus the standalone-activity tags.
3. Regenerate the spine: content-graph → coverage → curriculum manifest →
   search index. Re-run `npm run validate` and `npm run audit`.
4. Recompute coverage gaps under the new codes and confirm the Unit 0 lessons
   still fill them; re-tag the Unit 0 lessons to the new codes.
5. Review diff, commit, push.

---

## Already delivered (independent of the re-code)

Six standards were flagged `NO_CONTENT` in `data/content-coverage.json` (no
activity tagged to them). Their content is unchanged by renumbering, so lessons
were built now in a self-contained **Unit 0** holding area (`math/unit-0/`):

| Current code | Lesson |
|---|---|
| 6.NS.C.7.A | Comparing Rational Numbers on the Number Line |
| 6.NS.C.7.B | Writing & Explaining Order in Real-World Contexts |
| 6.NS.C.7.D | Absolute Value vs. Order |
| 6.EE.A.2.B | Naming the Parts of an Expression |
| 6.SP.B.5.A | Number of Observations |
| 6.SP.B.5.B | Attribute & Units |

Generator: `scripts/generate-unit0.mjs`. Hub: `/math/unit-0/`. These standard
tags are part of step 4 above when the re-code runs.

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

## Reconstructed framework (search-derived; verify wording/numbering vs PDF)

The full machine-readable reconstruction lives in
`data/standards-crosswalk-2025.json` (`proposedNewDomain` / `proposedNewId` +
`confidence` per standard). Summary:

**Domains**

| Old domain | New domain | Confidence |
|---|---|---|
| RP — Ratios & Proportional Relationships | **AT** — Algebraic Thinking | high |
| EE — Expressions & Equations | **AT** — Algebraic Thinking | high |
| NS — The Number System | **NOS** — Number & Operation Sense | high |
| G — Geometry | **GR** — Geometric Reasoning & Measurement | high |
| SP — Statistics & Probability | **DS** — Data & Statistics | medium (sources also showed STATS / DR) |

**Verbatim-confirmed standards (quoted consistently across sources)**

- `6.AT.A.1` — "Use ratio language in context (… 'to', 'for every', 'per') to
  describe a ratio relationship between two quantities, including part-to-part
  and part-to-whole."
- `6.AT.A.4` — find a percent of a quantity as a rate per 100, incl. finding the
  whole given a part and the percent (tables, tape diagrams, double number lines).
- `6.NOS.A.1` — "Divide fractions by fractions in context."
- `6.NOS.C.8` — order & absolute value; distinguish comparisons of absolute value
  from order (e.g. a balance less than −$30 is a debt greater than $30).
- `6.NOS.C.9` — solve problems by graphing points in all four quadrants
  (same first / same second coordinate).
- `6.GR.A.1` — "Find the area of triangles, quadrilaterals, and polygons by
  composing into rectangles or decomposing into triangles and quadrilaterals."
- `6.DS.A.1` — recognize a statistical question as one that anticipates variability.

**Cluster structure (reconstructed)**

- `6.AT.A` ratios/rates/percent · `6.AT.B` algebraic expressions ·
  `6.AT.C` one-variable equations & inequalities · `6.AT.D` dependent/independent
  variables.
- `6.NOS.A` divide fractions · `6.NOS.B` fluent computation, GCF/LCM ·
  `6.NOS.C` rational-number system (coordinate plane, order, absolute value).
- `6.GR.A` area / volume / surface area / polygons on the plane.
- `6.DS.A`–`6.DS.B` statistical questions, distributions, displays, summaries.

### ⚠️ Two cautions before applying

1. **Clusters are renumbered, not 1:1.** Confirmed example: old `6.NS.C.6` →
   `6.NOS.C.7`, old `6.NS.C.7` → `6.NOS.C.8`, old `6.NS.C.8` → `6.NOS.C.9`. A
   formula-based shift will be wrong — every sub-number must be read from the PDF.
2. **Reconstruction ≠ verification.** Everything above is synthesized from web
   search, not a direct read of the official document. In the crosswalk JSON these
   are `proposedNewId` values; `newId` stays `null` until each is confirmed, and
   the apply tool refuses to run until then. Confirm especially the **DS** domain
   abbreviation and all `low`-confidence sub-numbers.

---

## Execution — staged and ready (one command once codes are known)

The re-code is automated and safe. Tooling is already committed:

- `scripts/apply-standards-crosswalk.mjs` — does the re-code.
- `data/standards-crosswalk-2025.json` — the editable old→new map (47 entries),
  generated from the live taxonomy. `newDomain` is pre-filled where confirmed
  (AT, GR); NS/SP are marked `<CONFIRM>`. Every `newId` is `null` until filled.

Steps:

1. Fill `data/standards-crosswalk-2025.json`: for each entry set `newId`
   (e.g. `"6.AT.A.1"`) and resolve any `<CONFIRM>` `newDomain`, copying verbatim
   from the authoritative crosswalk PDF. Re-init the skeleton anytime with
   `npm run standards-crosswalk:init`.
2. Dry-run report (shows what's still unresolved / what will change):
   `npm run standards-crosswalk`.
3. Apply (guarded — refuses while anything is unresolved):
   `npm run standards-crosswalk:apply`. This rewrites
   `data/standards-taxonomy.json` (new ids, keeps `oldId` + domain map) and
   sweeps every `lessons/<id>/config.json` `standard` field old→new.
4. Regenerate the spine and verify:
   `npm run generate-curriculum-manifest && npm run validate && npm run audit`
   (plus the content-graph / coverage / search-index generators).
5. Recompute coverage gaps under the new codes, re-tag the Unit 0 lessons
   (`math/unit-0/`) to the new codes, review the diff, commit, push.

The deterministic taxonomy↔lesson code transform (`6.RP.A.3.A` ⇄ `6.RP.3a`) is
handled by the script, so filling `newId` is the only manual step.

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

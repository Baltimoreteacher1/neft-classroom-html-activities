# ACCESS Practice Lab publisher-grade transformation: checklist

Status values: **done** (built and a named check passes), **partial** (works, scope still open), **open**.
Last updated 2026-10-31. Checks: `npm run validate:publisher-journey`, `npm run e2e:access-publisher`, `npm run validate:access-lab`.

| # | Category | Status | Evidence / what remains |
|---|---|---|---|
| 1 | Interface redesign | partial | New journey uses the existing `ds.css` tokens (`publisher.css`). Rest of lab unchanged; a lab-wide pass is open. |
| 2 | WIDA alignment | done (journey) | `content/publisher/demo-evidence.json` matrix; every ELD id is checked against `alignment-index.json`. Support choices are never called WIDA levels. |
| 3 | ACCESS-style practice | partial | Support vs independent modes with a visible badge; "unofficial" labels. Existing practice tests unchanged. |
| 4 | Reading Room 3.0 | partial | Journey reading: illustrated text, table, evidence pinning, paired text, vocabulary in context. Existing Reading Room untouched. |
| 5 | Speaking Studio 3.0 | partial | Journey speaking has no selection step; record, playback, device-only measures, self-check, re-record. Existing Studio untouched. Quick-practice multiple-choice items are now labelled "Warm-up, not speaking evidence". |
| 6 | Writing Studio 3.0 | partial | Journey writing: draft → rule-based feedback → revision → comparison → reflection. |
| 7 | Listening Studio 3.0 | partial | Journey listening: replay limit, notes, ordering, inference, transcript only after answering. Six quick-practice Listening directions that said "Read" now say "Listen". Natural recorded audio is open (browser speech only). |
| 8 | Adaptive scaffolding | partial | Per-domain stage (supported vs independent) recorded; a supported result never reads as independent. |
| 9 | Feedback | partial | Distractor-specific feedback; writing feedback quotes the learner's own words; all rule-based. |
| 10 | Practice tests | open | Not changed in this pass. |
| 11 | Passport | open | Journey uses its own storage key; not merged into the Passport. |
| 12 | Teacher hub | partial | Evidence page: next instructional step and small-group suggestions on labelled synthetic data. Real roster analytics unchanged. |
| 13 | Family experience | open | Not changed in this pass. |
| 14 | Original visuals | partial | One original diagram with alt text. More are open. |
| 15 | Publisher demo | done (v1) | `/access-practice-lab/publisher-demo/` + `/publishers` page (matrix, inventory verified against files, roadmap). |
| 16 | Accessibility/reliability | partial | axe WCAG 2.2 AA clean on all 7 journey pages, 375px overflow check, mic-denied fallback, reload persistence. No screen-reader pass or Safari/Firefox run yet. |

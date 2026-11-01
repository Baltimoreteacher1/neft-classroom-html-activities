# ACCESS Practice Lab publisher-grade transformation: checklist

Status values: **done** (built and a named check passes), **partial** (works, scope still open), **open**.
Last updated 2026-10-31. Checks: `npm run validate:publisher-journey`, `npm run e2e:access-publisher`, `npm run validate:access-lab`.

| # | Category | Status | Evidence / what remains |
|---|---|---|---|
| 1 | Interface redesign | partial | Lab-wide pass done: home gains a "one topic, four skills" entry; a WebKit-only 375px overflow on `/launch` and `/classroom` fixed (`ds.css`); `e2e:access-sweep` checks all 28 routes at 375/768/1280 in Chromium, Firefox and WebKit (axe WCAG 2.2 AA, overflow, keyboard focus). Not a visual rebrand: the existing design was kept. |
| 2 | WIDA alignment | done (journey) | `content/publisher/demo-evidence.json` matrix; every ELD id is checked against `alignment-index.json`. Support choices are never called WIDA levels. |
| 3 | ACCESS-style practice | partial | Support vs independent modes with a visible badge; "unofficial" labels. Existing practice tests unchanged. |
| 4 | Reading Room 3.0 | partial | Journey reading: illustrated text, table, evidence pinning, paired text, vocabulary in context. Existing Reading Room untouched. |
| 5 | Speaking Studio 3.0 | partial | Journey speaking has no selection step; record, playback, device-only measures, self-check, re-record. Existing Studio untouched. Quick-practice multiple-choice items are now labelled "Warm-up, not speaking evidence". |
| 6 | Writing Studio 3.0 | partial | Journey writing: draft → rule-based feedback → revision → comparison → reflection. |
| 7 | Listening Studio 3.0 | partial | Journey listening: replay limit, notes, ordering, inference, transcript only after answering, and **recorded audio** (computer-generated voice, labelled as such, speech fallback). Human-voice recordings and recordings for the other Listening items are open. |
| 8 | Adaptive scaffolding | partial | Per-domain stage (supported vs independent) recorded; a supported result never reads as independent. |
| 9 | Feedback | partial | Distractor-specific feedback; writing feedback quotes the learner's own words; all rule-based. |
| 10 | Practice tests | done (existing) | The lab's practice tests already separate Guided Practice (supports on, results labelled "Supported Practice") from Independent Rehearsal (timed, single-pass audio, no frames or word bank, own result slot) in `views/test-modes.js`; `e2e:access-lab` drives them. Checked this pass; not rebuilt. Not official WIDA tasks. |
| 11 | Passport | partial | Passport shows a "Connected journey" card from the journey's own record (supported vs on-my-own per domain, no score). Rest of Passport unchanged. `e2e:access-publisher` asserts it. |
| 12 | Teacher hub | partial | Evidence page: next instructional step and small-group suggestions on labelled synthetic data. Real roster analytics unchanged. |
| 13 | Family experience | partial | `/publisher-demo/family`: bilingual plain-language page built from the learner's saved evidence, home activities in any language, print view. The existing `/family` hub is unchanged. |
| 14 | Original visuals | partial | Three original diagrams with text alternatives (Figure 1, the data chart, the steps picture shown only in supported writing). More lab-wide are open. |
| 15 | Publisher demo | done (v1) | `/access-practice-lab/publisher-demo/` + `/publishers` page (matrix, inventory verified against files, roadmap). |
| 16 | Accessibility/reliability | partial | Journey e2e passes in Chromium, Firefox and WebKit (`E2E_BROWSER=firefox\|webkit npm run e2e:access-publisher`), with axe WCAG 2.2 AA on 8 pages and a 375px overflow check. No tablet, keyboard-only recording or screen-reader pass yet. |

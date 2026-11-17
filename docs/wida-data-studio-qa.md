# WIDA Data Studio — QA

## Automated

- `node --test tools/access-predictive-ui.test.mjs` — 17 tests: CSV/TSV parsing; WIDA header mapping; wide import (ranges, years, duplicates, future years, roster matching, MODEL routing); long-format pivot; conflict, provenance, undo; reported vs calculated composites (no calculated level, no weights on the reset scale); comparability across the reset, 2026 cut scores and assessment families; cut-score forecast refusal; scenarios; MODEL to ACCESS refusal; profile measurement error and planner resources; report-text parsing; plus the existing bottleneck, analyst, data-quality and forecast-gate tests.
- `node tools/access-predict.test.mjs` — engine invariants (unchanged).
- `npm run e2e:access-predictive` — 41 browser checks: hub card links; empty real mode has no numbers; keyboard tabs; wizard with a corrected error; storage routing (ACCESS to the hub store, MODEL to the interim store) with provenance; MODEL to ACCESS refusal; manual entry of a post-reset result and the growth refusal; undo; demo validated intervals; hypothetical labelling; demo never written to real stores; Data Explorer supported and unsupported questions; Teacher tour Part 2 (10 steps); no horizontal overflow at 1280 and 390 in both modes; axe (serious/critical) when `@axe-core/playwright` is installed.

## Acceptance tests (brief §23)

| Test | Status |
| --- | --- |
| A Individual entry | e2e manual entry + overview |
| B Import with correction | e2e wizard |
| C Longitudinal growth | unit comparable steps; demo growth view |
| D Incompatible years | unit + e2e reset refusal |
| E MODEL interpretation | unit + e2e concordance refusal |
| F Forecast shown / disabled | e2e demo intervals; real mode no numbers; cut-score unit test |
| G Scenarios | unit + e2e hypothetical label |
| H Instructional planning | manual browser check: finding → Create assignment → Save to Teacher Hub |
| I Reporting | manual browser check of all five report types |
| J Demo mode | e2e |

## Not verified

- Real-format files were exercised in a browser (2026-11-17): an AMS-style .xlsx (openpyxl; first/last name and state ID columns, ACCESS + MODEL rows) imported 3/3 with provenance; a LibreOffice-generated PDF score report was read by the self-hosted PDF.js (student, year, grade, 8 scores) and imported. Actual WIDA-issued files were still not available.
- axe was not run locally (package not installed); no screen-reader pass.
- Spanish family summary is machine-drafted, not native-reviewed.
- No validation on real student data (only synthetic).

# Independent curriculum audit — September 29, 2026

Scope: public curriculum hub and unit browser, canonical curriculum/search/launch/download manifests, student launch links, reading controls, and selected authorization contracts. Branch inspected: `codex/curriculum-comprehensive-upgrade-20260929`, initially `df629746b`. This is one part of the parent agent's combined audit, not a claim that every activity has been manually exercised.

## Findings and repairs

| Priority | Finding | Evidence and exact repair | Status |
| --- | --- | --- | --- |
| P1 | Teacher-selected supports erased the final-check destination. | `assets/curriculum-student-launch.js:66`: `forceStudentMode` replaced `#reflect` with `#supports=...`, so Final check lost its lesson-section anchor. Supports already accept query transport (`assets/learning-supports/learning-supports.js:584`). Carry sanitized supports with `url.searchParams.set("supports", ...)`, retain `student=1`, and preserve the fragment. | Fixed. Regression test covers valid/invalid support values, default links, two playlist lessons, and final-check anchors. Both affected source validators updated to require the supported query transport. |
| P1 | Language-support toggle falsely claimed that Spanish sentence frames had been enabled. | Previous `assets/curriculum-hub-pedagogy.js` implementation only called `alert`. It changed no lesson card, language setting, or frame. Replace the checkbox with a real `/esol/` link and describe that collection honestly. | Fixed jointly: parent changed HTML; owned JS removed the false toggle. The target exists and provides language/study-guide links. |
| P1 | Teaching overview asserted unsupported external awards and complete accessibility compliance. | Previous `assets/curriculum-hub-pedagogy.js` strings claimed CODiE finalist, Bett winner, an ISTE award, and full WCAG compliance without supporting evidence. Replace with descriptions and links for actual curriculum, small-group, Math Workbench, NetFold, and language-support features. | Fixed in `assets/curriculum-hub-pedagogy.js:14`. No award or certification is implied by replacement text. |
| P2 | Contrast control changed the body's CSS filter rather than defining readable colors. | Previous body `filter: contrast(1.15) brightness(1.05)` neither guaranteed text contrast nor preserved viewport positioning of fixed descendants. It created a containing block for floating controls. | Fixed in `assets/curriculum-hub-pedagogy.js:134`: real foreground/background colors, underlined links, focus outline, selected-state outline, and no body filter. |
| P2 | Reading controls and teaching overlay lacked complete keyboard behavior. | Popover only toggled `display`; overlay was an unlabelled div without modal focus containment or Escape handling. Font switch repeated the page's existing body font. | Fixed: native named dialog with `showModal`, Escape, light-dismiss fallback, focus containment and return; popover initial focus, Escape, outside/focus dismissal, and synchronized `aria-expanded`; font changes headings and controls. Parent supplied responsive markup and 44 px/16 px styles. |
| P1 release risk | Production had newer curriculum content than this feature branch. | 49 rendered URLs were absent from the initial checkout: Math Fluency Lab, Learning Labs index, and 46 learning labs. All answered HTTP 200 live. Three sampled bodies had distinct expected titles, while an intentional nonexistent route answered 404. `origin/main` at `766d1132c` contains the missing learning-lab source. | Parent notified and integrating current main before release. These are **not broken production links**. A build from the stale branch alone would risk dropping newer content. |

Additional public integration/privacy claims were reported to the parent for its HTML cleanup: OneRoster ingestion, SCORM 2004, Common Cartridge for Classroom, and named compliance documents or pledges without corresponding implementation/evidence. These were not treated as proof of a legal/compliance problem; the repair is to describe demonstrated functionality accurately.

## Resource and link coverage

Checks use public authored curriculum files only. No student records or credentials were read. Browser sessions were fresh, service workers blocked, and every `**/api/**` request fulfilled locally with an empty 401 response.

- Canonical core curriculum: **84 lessons** across **10 units**.
- Launch groups: **168 small-group**, **36 catch-up**, **77 Apply Day**, **10 unit projects**, and **16 unit assessments**.
- **3,545** manifest/launch resource entries, representing **2,630 unique URLs**, checked against source paths: **zero missing declared resources**.
- **3,955** download-manifest URL entries, representing **3,926 unique URLs**, checked against source paths: **zero missing static paths**. API download endpoints were excluded from filesystem and HTTP checks.
- Search index joins exactly to all **84** canonical lesson IDs: no missing or unknown IDs.
- Every core lesson has declared lesson, notes HTML/PDF/DOCX, handout, two worksheets, level-0 worksheet, homework HTML/DOCX, slides, family page, teacher notes, student help, and exit-ticket resources.
- Readiness is correctly optional: **64** lessons declare it; remaining lessons do not expose nonexistent readiness links. MSTAR worksheets/PDFs exist for **72** lessons; the **12** absent pairs are correctly marked `exists: false`.
- Parent baseline browser inventory: **3,126 unique rendered links**. **2,810** same-site non-API paths checked locally. The **49** initial source misses are explained by the newer `origin/main` content above.
- Bounded live checks: **51 HEAD probes** of core HTML/PDF/DOCX/help/readiness resources and the sole external Google document, all HTTP 200. A further **49 HEAD probes** investigated the source-drift URLs, all HTTP 200. Three public HTML bodies confirmed expected destinations; an intentional missing route returned 404. HEAD success alone does not prove every page's content correctness.

## Verification evidence

| Check | Result |
| --- | --- |
| `node tools/validate-curriculum-links.mjs` | Pass: 332 hub lesson links, 84 manifest lessons, 10 unit blocks. |
| `node tools/validate-unit-resource-placement.mjs` | Pass: 94 unit resource placements; legacy path-number mismatches are expected and mapped explicitly. |
| `node tools/validate-auth-contract.mjs` | Pass: 39 checks. |
| `node tools/validate-route-contract.mjs` | Pass: 17 pinned routes. |
| `node tools/curriculum-student-launch.test.mjs` | Pass: final-check fragment, sanitized supports, forced student mode, and playlist transitions. Uses real launcher HTML/JS with public manifest fixtures and no network. |
| `node tools/validate-curriculum-guided-path.mjs` | Pass: 23 checks. |
| `node tools/validate-curriculum-product-upgrades.mjs` | Pass: 22 checks. |
| Biome check on all five changed JS/test/validator files | Pass. |
| Standalone strict TypeScript check on `assets/curriculum-hub-pedagogy.js` | Pass, without adding `@ts-nocheck`. |
| Chromium reading-controls workflow, 390 px and 320 px | Popover opens and focuses first checkbox; actual heading-font change; high contrast uses no body filter; controls remain fixed; both settings survive reload; Escape restores launcher focus. |
| Chromium native dialog workflow | Focus enters title; seven Tab presses remain inside; Escape closes and restores trigger focus. |
| Chromium narrow layout | Reading panel stays within 320 px viewport; zero horizontal overflow; launcher at least 44 px tall after parent CSS update; zero page script errors. |

Independent evidence is under `output/playwright/independent-audit/`: `manifest-results.json`, `http-results.json`, `rendered-link-results.json`, `missing-live-results.json`, `pedagogy-results.json`, and rendered screenshots. The files in `output/` are local QA artifacts; durable source regression coverage is in `tools/curriculum-student-launch.test.mjs`.

Native dialog behavior follows [WAI's HTML dialog guidance](https://www.w3.org/WAI/WCAG22/Techniques/html/H102) and the [ARIA modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Modern Web Guidance's dialog close/light-dismiss recommendations were read before implementing the dialog behavior.

## Limits and release handoff

- Full validation, production build, merge/conflict review, deployment, and production smoke checks belong to the parent agent. This agent did not commit, deploy, or mutate remote data.
- A direct repository TypeScript invocation reports pre-existing errors across unrelated modules; the modified pedagogy module independently type-checks cleanly. The parent owns the required project-wide gate and baseline accounting.
- No authenticated teacher API flows, classroom records, messaging, grade submission, remote saves, or roster operations were exercised.
- This audit verifies resource presence and sampled destinations, not the instructional accuracy of every worksheet or activity. Readiness/MSTAR coverage is measured, not described as universal.
- Parent integration must preserve newer live Learning Labs, Fluency Lab, and family changes before final build and release verification.

## Integration status

Resolved: current `origin/main` was integrated before release. The learning labs, fluency lab, family editor, and Word-download additions are preserved; all 84 learning-lab links and labels match the integrated production source.

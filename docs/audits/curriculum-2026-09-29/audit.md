# Curriculum experience audit and upgrade

September 29, 2026 · EduWonderLab `/curriculum/`, `/curriculum/units/`, and student-launch handoff.

## Scope and method

Reviewed the live public hub and units browser in an empty browser profile; inspected the canonical manifests, search index, resource inventories, route guards, build contracts, and source. Browser audits blocked classroom API requests, so this work did not retrieve student records. Tested local student and teacher views, expanded collections, desktop/mobile layouts, keyboard controls, search, navigation history, no-JavaScript fallback, local preferences, and error recovery.

This is an audit of curriculum discovery and launch, including inventory coverage. It is not a claim that every interaction in every linked game, private integration, or individual lesson was manually exercised. Automated curriculum and math gates provide additional coverage; results are recorded below.

## Findings and repairs

| Finding | Evidence before | Change |
|---|---|---|
| The hub offers competing starting points before usable lesson content | 10,580px public page at 390px width; duplicated mode notices and large tool galleries | A lesson desk leads the page; optional workflows, visual models, and full library use native disclosures |
| Hub search requires navigating elsewhere before selecting a lesson | Existing search only redirects to the units page | Immediate search by topic, standard, title, or lesson number; unit/saved filters, result counts, reset, and pagination |
| Frequently used lessons require repeated browsing | No common saved lesson shortlist | Local saved lessons and recent selections, containing lesson IDs only; storage failure has explicit feedback |
| Lesson resources are distributed across different launchers | Separate unit, teacher, and student workflows | One manifest-backed preview with actual targets, notes, practice, homework, language supports, and related pathways |
| Sharing and returning to selections is fragile | Multiple independent selectors | URL state and Back/Forward restoration; existing teacher selection bridge; student link copy with a selectable fallback |
| Units browser overwhelms small screens | 34,614px at 390px; 9,804 DOM nodes | One unit shown at a time, previous/next navigation, full-unit overview, and global search |
| Unit selections can reset after asynchronous refresh | One-time deep-link application followed by card rebuilds | Lesson/activity and unit selection are restored without auto-opening the launch modal |
| No-JavaScript units fallback is hidden by shared CSS | Static details.unit hidden unconditionally | Native fallback restored with stable unit fragment IDs |
| Four text contrast failures on the public hub | axe: white text on white pacing card; three pale enterprise headings | Scoped readable colors and expanded-state accessibility checks |
| Language-support checkbox claims success without changing anything | Handler only calls alert | Real link to language support collection; working readable-font and high-contrast preferences |
| Accessibility popup and overview lack complete keyboard handling | Missing focus/dismiss behavior; custom overlay | Native dialog; Escape, outside dismissal, focus restoration, appropriate labels, and larger controls |
| Teacher setup notice has a low-contrast secondary button | Incoming production CSS applies the orange primary-button background to “Not now” | Exclude secondary buttons from the primary setup style |
| Planning print rules assume the old page structure | Independent review found hidden ancestors could blank weekly-plan output | Preserve the planning panel’s ancestor chain in print; browser regression checks printing and cleanup |
| Lesson desk and teaching tools can disagree under slow loading | Independent review reproduced cockpit initialization before the catalog | Wait for catalog and URL restoration before subscribing; tests cover both loading orders |
| Closed support drawer can leave offscreen controls focusable | Transform-only hiding | Hidden/inert closed panel with focus transfer and restoration |
| Transient HTTP/malformed JSON responses can poison the page cache | Fetch resolves for HTTP errors; only network rejects were evicted | Failed responses evicted; regression tests cover concurrent callers, HTTP 503, and invalid JSON |
| Student support links overwrite exit-ticket anchors | #reflect replaced by #supports=… | Supports use the existing query transport; phase anchor and student mode survive |
| Recorded work is described as readiness | Any checked activity produced “You’re ready” | Wording describes the available evidence and suggests a quick check without asserting mastery |
| The newer pacing downloader breaks the development page | Its dynamic import caused Vite to inject a module import into a classic script | Load the pacing controller as a module and retain its on-demand downloader; clean browser load confirms its actions are available |
| Product copy overstates verified capability | Award, certification, OneRoster, and blanket privacy/accessibility claims | Descriptions of implemented tools; SCORM 1.2 and Canvas cartridge wording; links to feature-specific data information |
| Local checkout predates newer production features | 49 live links absent from initial checkout, all live HTTP 200 | Integrate current origin/main before verification/release; preserve fluency, learning labs, family editor, and Word download work |

## Inventory coverage

The independent audit checked 3,545 curriculum/launch resource entries (2,630 unique paths) and 3,955 download entries (3,926 unique paths): no missing files in those inventories. All 84 search-index records joined the curriculum manifest. Fifty-one read-only live resource probes succeeded, including HTML, PDF, DOCX, help/readiness pages, and the external document link.

See [independent findings](independent-findings.md) for detailed checks and the distinction between initial checkout drift and broken production routes.

## Verification and release

### Integrated implementation checks

- Production build passed. The hub bundles 21 ordered scripts into one generated asset; the new code adds no dependency or analytics service.
- Twenty lesson-desk behavior checks passed: all 84 records, filters, pagination, URL/history, variants, unsafe inputs/links, denied storage, clipboard fallback, HTTP failure/retry, composition input, and both teacher-selector initialization orders.
- Unit-navigation checks passed: ten units, 84 lessons retained, exact lesson/group deep links, refresh, global search, history, and silent restoration. All 84 learning-lab links and labels match the current production branch.
- Eight Chromium journey tests passed against the built site, including teacher first-click navigation, keyboard entry, mobile overflow, student-safe unit navigation, accessibility, and weekly-plan printing/cleanup.
- Additional built-site acceptance checks passed for save/reload, filters, empty-result recovery, selection history, the search keyboard shortcut, student preview, and a simulated HTTP 503 followed by Retry.
- JSON cache, student-launch anchor/support transport, guided-path (23), product integration (22), asset cache hashes (9 assets / 11 references), curriculum links, content baseline, and formatting checks passed.
- Public built hub and units scans reported no WCAG A/AA violations or page exceptions. Expanded teacher-view scanning found the setup-button contrast issue recorded above; the corrected source passed all four student/teacher × closed/expanded scans. Automated scans complement the keyboard and visual checks; they are not an accessibility certification.

### Responsive results

Initial visible page height, before and after; existing resources remain accessible through disclosures and unit navigation.

| Surface and width | Before | After |
|---|---:|---:|
| Hub, 390 px | 10,580 px | 2,279 px |
| Hub, 1366 px | 4,669 px | 1,739 px |
| Units, 390 px | 34,614 px | 3,816 px |
| Units, 1366 px | 14,387 px | 2,511 px |

No horizontal overflow at 320, 390, 768, or 1366 px. The hub kept 50 resource requests; decoded resource bytes increased by about 51 KB for the added navigation functionality. The units page retains its existing DOM nodes to preserve resource indexing and printing contracts; the improvement is visible organization, not DOM virtualization.

### Release controls and evidence

The refreshed production baseline passed all 117 repository checks before integration. The release commit and guarded ship workflow rerun required QA, including the build, automated tests, type-check ratchet, route/auth contracts, curriculum validators, save/resume, and browser smoke checks. Publication is authorized by Joel and must use `ALLOW_DEPLOY=1 npm run ship -- <reviewed commit>`, followed by the public build-stamp check and browser verification.

Local evidence is under `output/playwright/curriculum-audit/` (screenshots, measurements, acceptance results, and build log) and `.qa-logs/` (full gate logs). Temporary audit captures are intentionally excluded from the published site. The final delivery message records the shipped commit and verified live result.

## Boundaries

No student records or credentials were inspected. Classroom APIs were replaced with empty unauthorized responses in browser audits. Authenticated student-data retrieval, live roster changes, Canvas grade passback, and teacher publishing were not exercised. The existing server authorization and deploy guard remain in place. Saved lessons and reading preferences stay on the current device; no account sync is claimed.

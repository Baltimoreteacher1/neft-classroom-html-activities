# Audit — eduwonderlab.com/curriculum — 2026-09-20

Branch `audit/curriculum-page-2026-09-20`, cut from `origin/main` at `8cca0500d`.
Live target: https://eduwonderlab.com/curriculum/ (Cloudflare Pages, repo
`neft-classroom-html-activities`; the task brief named a Next.js/Vercel repo
`Baltimoreteacher1/eduwonderlab` — no such repo exists, this is the page's real home).

## Executive summary

- **The page's own search and filter toolbar was dead.** `/curriculum/` lost its
  units browser on 2026-08-11 but kept the search box, six filter chips, a
  result counter and a progress line. In production it rendered "0 lessons · 0
  pathways" and "Your progress: 0%", and the chips filtered nothing. Fixed: the
  box now hands the query to `/curriculum/units/?q=…` (which already honours
  it); the browser-only controls no longer render on the hub.
- **77 dead links reachable from `/curriculum/*`.** 24 "Get Ready (Pre-Lesson)"
  links on `/curriculum/units/` pointed at 20 lessons that have no readiness
  page (404). 53 "Google Drive copy (legacy)" links answered 410 Gone at Google.
  Both classes fixed at the source (manifest now records which lessons have a
  pre-lesson; legacy Drive links are no longer offered).
- **Hard content rule:** the public HTML carried "IEP Accommodations & Supports",
  "Accessibility · IEP Accommodations", "Personalized IEP accommodations", "no
  IEP data is stored", "SPED access", and "Student Supports & Accommodations".
  All were behind the client-side Teacher-view gate, but the HTML and JS are
  public. Reworded (P0). No student initials or student data anywhere.
- **Lighthouse mobile: Perf 74 → 97 (local, same build pipeline); CLS 0.516 → 0.**
  Lighthouse blamed the web-font swap, but preloading the fonts left CLS at
  0.53. The real cause: the mode banner and the four audience cards were built
  by JS after load and pushed the 1,000 px-tall actions nav down the page. Both
  now ship as static markup that the scripts bind to (fonts are preloaded too).
  Structured data was JS-injected (invisible to non-JS crawlers) and, on this
  page, listed zero units; a static Course schema now ships in the HTML and a
  gate pins it to the manifest.
- **Content accuracy is gated and green:** all 37 distinct lesson standard codes
  resolve in `data/ccss-standards.json` (Maryland 2025 MCCRS with a verified
  CCSS crosswalk), scope-and-sequence check passes, and `validate:math` covers
  arithmetic. The JSON-LD claimed these were CCSS ids with corestandards.org
  URLs that 404 — corrected.

## Method

- Live recon: Playwright (Chromium) fresh profile, service worker blocked,
  student view (public default) and teacher view (`nt-teacher-mode=1`),
  `/curriculum/` and `/curriculum/units/`; every `<details>` opened; all 2,439
  unique rendered hrefs HEAD/GET-checked with redirect following and soft-404
  body sniffing. axe-core (WCAG 2.1 A/AA) on the hub. Viewports 320/390/768/1024/1280.
- Lighthouse 12 mobile (default throttling) against production.
- Local reproduction: `npm ci` in a fresh worktree, `vite` dev server and full
  `npm run build` (dist) — page reproduced identically before editing.
- Repo gates: `validate:ccss`, `validate:scope`, `validate:curriculum-top1`,
  `validate:curriculum-links`, `validate:teacher-reachability`,
  `validate:route-contract`, `validate:hub`, `perf:curriculum`, hub-asset stamp
  test, `lint`, `typecheck`, `npm test`.

## Findings

Severity: P0 must fix now · P1 fix this pass · P2 fix if low-risk · P3 note.
`file:line` refers to `origin/main` (`8cca0500d`) before this pass.

| ID | Sev | Dimension | file:line | Issue | Fix |
|----|-----|-----------|-----------|-------|-----|
| C-01 | P0 | Content rule | `curriculum/index.html:593-594` | Teacher card "IEP Accommodations & Supports 🛠️ — Build and assign student IEP accommodations, WIDA levels, and modifications." in public HTML | Reworded to "Learning Supports Manager — Build and assign lesson supports, WIDA language levels, and scaffolds." ✅ |
| C-02 | P0 | Content rule | `curriculum/index.html:3535-3540` | Featured card tag "Accessibility · IEP Accommodations", sub "Personalized IEP accommodations…", "no IEP data is stored" | Reworded to "Learning Supports" / "no student data is stored" ✅ |
| C-03 | P0 | Content rule | `curriculum/index.html:3555-3560` | Link-builder copy "Check every accommodation and modification from the student's IEP… No names or IEP data are stored." | Reworded ✅ |
| C-04 | P0 | Content rule | `assets/curriculum-teacher-planning.js:1259` | Rendered H2 "Student Supports & Accommodations" | "Student Supports" ✅ |
| C-05 | P0 | Content rule | `assets/curriculum-teacher-workflow.js:624,877` | Lesson-readiness label "SPED access" | "Access supports" ✅ |
| C-06 | P0 | Content rule | `assets/curriculum-hub-options.js:49,199` | "District IEP accommodations & modifications" group note; "IEP accommodations — Lesson N" clipboard header | Reworded ✅ |
| C-07 | P2 | Content rule | `assets/learning-supports/supports-schema.js:34` | Group heading "IEP Modifications/Accommodations" (rendered inside the teacher-only link builder) comes from the shared district schema used by every lesson page | **Deferred** — shared schema outside `/curriculum`, labels are the district document lines verbatim; renaming needs Joel's call |
| B-01 | P1 | Broken | `curriculum/index.html:966-981`, `assets/curriculum-enhancements.js:629-690,1522-1560` | Orphan search toolbar: "0 lessons · 0 pathways", six no-op chips, "Your progress: 0%"; `#curr-search` filtered nothing (hub validator pins the control so it cannot be removed) | Browserless mode: chips/summary not built, count blank, box hands off to `/curriculum/units/?q=` on Enter or via a 44px **Search** control, one-line hint ✅ |
| B-02 | P1 | Broken | `assets/curriculum-enhancements.js:1717-1745,1750-1763` | "🚀 Get Ready (Pre-Lesson)" injected for every lesson; 20/84 lessons have no `readiness/` → 24 dead links (8 visible by default) on `/curriculum/units/` | `scripts/generate-curriculum-manifest.mjs` now records `resources.readiness` when the page exists (64/84); the hub only links when the manifest says so ✅ |
| B-03 | P1 | Broken | `assets/curriculum-enhancements.js:1623-1672,1685-1712,2421-2431` | 53 "↗ Google Drive copy (legacy)" links → every one HTTP 410 Gone at Google; one extra JSON fetch per load to build them | Legacy inserts removed; `google-slides-urls.json` fetch dropped (−1 request) ✅ |
| B-04 | P1 | Broken | `curriculum/my-progress/index.html:330` | "Practise this" linked to `/curriculum/?q=<code>` — lands on a hub with nothing to filter | Now `/curriculum/units/?q=` ✅ |
| B-05 | P3 | Broken | live | 174 links answer 401 and 10 `/api/scorm` links 403 in the student crawl | Expected: server-side teacher gate; all carry `hub-teacher-only` / `teacher-only` and are hidden in student view. No action |
| P-01 | P1 | Performance | `assets/curriculum-enhancements.js:604-627`, `assets/curriculum-product-upgrades.js:74-119`, `curriculum/index.html:209,529` | CLS 0.516 — `#hub-mode-banner` and `nav#curriculum-audiences` (four cards, ~500 px on a phone) were created by JS after load, above the 1,000 px actions nav. Lighthouse attributed it to the font swap because the two land together | Banner and audience nav are static HTML; both scripts bind to the existing nodes (and still build them on other pages) ✅ |
| P-01b | P2 | Performance | `curriculum/index.html:43-46`, `public/assets/fonts/hub-curriculum.css` | Faces are `font-display: swap` and discovered only after the font stylesheet | Preload the three latin woff2 used above the fold on hub + units page ✅ |
| P-02 | P2 | Performance | live | 54 requests / 457 KB; 12 stylesheets (41 KB) render-blocking; 55 KB of the 117 KB hub JS bundle unused on first paint | **Deferred** — CSS bundling would mirror `tools/bundle-hub-scripts.mjs`; worth its own pass with the perf history file |
| P-03 | P2 | Performance / code | `curriculum/index.html:98-105,983-3864` | `#hub-side` is `display:none !important` since 2026-07-15 yet 114 KB of its markup (64 % of the document) still ships; only `.features-grid` is lifted out by an inline script | **Deferred** — 15+ hub scripts anchor on nodes inside it (`details.teacher-tools`, `mailbox-feature`, `class-board-strip`); a removal is a structure change per repo rules and needs its own verified pass |
| S-01 | P2 | SEO | `assets/curriculum-enhancements.js:707-750` | Course JSON-LD only injected by JS; on `/curriculum/` it lists 0 course instances (units live on the other page) | Static Course schema with 10 unit sub-courses in the HTML; `tools/validate-curriculum-hub.mjs` pins it to the manifest ✅ |
| S-02 | P2 | Content / SEO | `assets/curriculum-enhancements.js:693-705` | JSON-LD alignment claimed "Common Core" and built `corestandards.org/Math/Content/6/AT.1`-style URLs that 404 (codes are Maryland 2025 MCCRS) | Framework corrected, bogus `targetUrl` removed ✅ |
| S-03 | P3 | SEO | `curriculum/index.html:5-52` | title, description, canonical, robots, OG, Twitter, favicon, manifest all present and correct | None |
| M-01 | P2 | Mobile / a11y | `assets/curriculum-enhancements.css:100,165`, `assets/curriculum-top1.css:530`, `assets/curriculum-polish.css:707`, `assets/curriculum-guided-path.css:99`, `curriculum/index.html:699` | Touch targets under 44 px: mode links 32 px, filter chips 34–38 px, five hero links 28 px, toolbelt summary 19 px | min-height 44 px on each ✅ |
| A-03 | P2 | Accessibility | `assets/curriculum-enhancements.css:114-117` | `.hub-hint-link:focus-visible` set `outline: none` and changed only colour — the "Switch to Teacher view" buttons had no visible focus | 3 px outline on `:focus-visible` ✅ |
| M-02 | P3 | Mobile | live | Math Workbench FAB 38×38 (`assets/math-workbench-launcher.js`, on 1,096 pages) | **Deferred** — site-wide asset, out of page scope |
| M-03 | P3 | Mobile | live | No horizontal overflow at 320/390/768/1024/1280; no table overflow | None |
| A-01 | P3 | Accessibility | live | axe: 0 violations (WCAG 2.1 A/AA); one `h1`; `role="main"` wrapper; `aria-live` result count; `:focus-visible` rules in every hub stylesheet; `prefers-reduced-motion` honoured in hub/enhancements/top1/polish CSS | None |
| A-02 | P3 | Accessibility | `assets/curriculum-teacher-workflow.css`, `assets/mobile-access.css` | No `prefers-reduced-motion` block, but neither file animates | None |
| N-01 | P2 | Navigation / IA | `curriculum/index.html` | "Unit 5, ratios, assign tomorrow" path: hub → Explore by unit → units browser → unit → lesson → activity. Search on the hub was a dead end (B-01). Filter by unit / standard / type exists on `/curriculum/units/` with URL state (`?u=&l=&a=`, `?q=`) | B-01 closes the dead end; the hub is a launcher by design (units moved 2026-08-11) |
| N-02 | P3 | Navigation | live | Footer sentence links ("Data, privacy, and AI use") are inline text ~22 px | WCAG 2.5.8 inline exception; no action |
| D-01 | P2 | Design consistency | `curriculum/index.html` | 31 inline `<style>` blocks and 67 `style=""` attributes; 11 hub stylesheets + 37 script tags (bundled to one in dist) | **Deferred** — stylistic drift, no visible defect; consolidation belongs with P-02 |
| Q-01 | P1 | Code quality | `scripts/generate-curriculum-manifest.mjs:42-145` | Manifest (the SoT) had no notion of the readiness pre-lesson, so no surface could ask whether one exists | Added as an optional resource (present-only, like `studentPractice`) ✅ |
| Q-02 | P2 | Code quality | `data/curriculum-launch-manifest.json` | Committed generated file was stale vs. lesson 3-2's config (objective text) | Regenerated by the build; committed separately ✅ |
| Q-03 | P3 | Code quality | `assets/curriculum-enhancements.js` | 2,400-line IIFE, `var`-era, no types; `@ts-nocheck` ratchet covers it | Out of scope for this pass |

## Lighthouse (mobile, Lighthouse 12)

| Run | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|-----|-------------|---------------|----------------|-----|-----|-----|-----|
| Before — production 2026-09-20 | 74 | 100 | 100 | 100 | 2.8 s | 0.516 | 0 ms |
| Before — local build of `origin/main` (`vite preview`) | 74 | 100 | 96 | 100 | 2.4 s | 0.516 | 0 ms |
| After — local build of this branch (`vite preview`) | **97** | 100 | 96 | 100 | 2.4 s | **0** | 0 ms |

Local Best Practices is 96 in both rows for one reason: `vite preview` has no
Pages Functions, so `/api/supports/sections` 404s in the console. Production
serves it (100 before; expected 100 after). A `PerformanceObserver`
layout-shift probe on a throttled 390 px mobile profile agrees: 0.505 before,
0 after.

Production "after" numbers can only be taken once the branch ships (deploys go
through `ALLOW_DEPLOY=1 npm run ship`, which needs Joel's authorization).

## Shipping this pass (ranked)

1. B-01 orphan toolbar → search hand-off (student-facing dead end)
2. B-02 + Q-01 readiness links from the manifest (24 dead links)
3. B-03 legacy Drive links removed (53 dead links, −1 request)
4. C-01…C-06 content rule wording
5. P-01 static header (CLS 0.52 → 0) + font preloads
6. S-01/S-02 static Course schema + corrected alignment, pinned by a gate
7. M-01 touch targets
8. B-04 My Progress deep link
9. Q-02 regenerated launch manifest / search index

## Deferred, and why

- **P-03 / D-01 hidden `#hub-side` markup and inline-style drift.** 114 KB of
  shipped-but-hidden HTML is the single biggest weight problem, but a dozen hub
  scripts use nodes inside it as mount anchors and the repo rule is explicit
  that curriculum page structure does not change without Joel asking. Needs a
  dedicated pass with `perf:curriculum --record` before and after.
- **P-02 CSS bundling.** Same shape as the existing JS bundler; do it with the
  perf history, not inside an audit commit.
- **C-07 district schema label.** Shared by every lesson page; the labels are
  the district document's own wording. Joel decides whether that changes.
- **M-02 Math Workbench launcher.** Site-wide asset on 1,096 pages.
- **Filter-by-standard chips on the units page** were deliberately retired
  ("By standard chip row retired to declutter the hub", `curriculum-enhancements.js:2009`);
  standard codes remain searchable via `?q=6.AT.1`.

## Verification (this branch, final build)

| Check | Result |
|-------|--------|
| `npm run build` | clean, exit 0; committed generated data stable across three consecutive builds |
| `npm test` | 273/274 scripts pass (1 opt-in runtime test not run, same as `origin/main`) |
| `npm run lint` / `npm run typecheck` | pass / pass (ratchet unchanged) |
| `npm run qa:fast` (pre-commit gate, 112 checks) | pass on every commit |
| `validate:hub` (incl. new JSON-LD pin, negative-tested), `validate:curriculum-top1`, `validate:curriculum-links`, `validate:teacher-reachability`, `validate:route-contract`, `validate:downloads`, `validate:lesson-catalogues`, `validate:ccss`, `validate:scope`, `validate:supports`, `validate:curriculum-product-upgrades`, `validate:curriculum-teacher-workflow`, `validate:curriculum-guided-path`, hub-asset stamp test, `curriculum-json-cache`, `hub-lesson-picker`, `curriculum-supports-card` | all pass |
| `perf:curriculum` (local dist) | within budget: 48 requests (budget 60, was 49), 482 KB transfer (900), LCP 116 ms |
| Lighthouse mobile (local build) | 97 / 100 / 96 / 100 — CLS 0 (before 74 / 100 / 96 / 100, CLS 0.516) |
| Layout-shift observer, throttled 390 px | 0 (before 0.505) |
| Rendered link check, hub + units, student + teacher, all details open | 2,362 unique URLs, **0 unresolved** (before: 24 × 404, 53 × 410) |
| Behaviour | hub: no chips, no "0 lessons", no progress line, Search control 88×44, Enter → `/curriculum/units/?q=ratio` → "Showing 19 lessons · 39 pathways (of 260) in 7 units"; units page: 64 Get Ready links = the 64 pages on disk, 0 dead, 0 legacy Drive links; `?q=` deep link still pre-fills; `/` focuses, Esc clears |
| Restricted strings (IEP / SPED / 504 / accommodat) in rendered text | student view 0; teacher view 1 — the deferred district-schema heading (C-07) |
| axe-core WCAG 2.1 A/AA on the hub | 0 violations (before 0) |
| Horizontal overflow at 320 / 390 / 768 / 1024 / 1280 | none |
| Touch targets < 44 px in the hub (non-inline) | 1 — the site-wide Math Workbench launcher (M-02, deferred) |
| Keyboard-only pass | 53 tab stops, every focused element visible with a ring (`#curr-search` shows its container's focus-within ring), nothing reachable-but-unusable, no console errors |
| Console errors on the built hub | none (local preview only lacks Pages Functions, so `/api/supports/sections` 404s there) |

Screenshots (final build): `docs/audits/curriculum-2026-09-20/` — `before-*` from production,
`after-*` from the local build at 320 / 768 / 1280, plus the search toolbar region.

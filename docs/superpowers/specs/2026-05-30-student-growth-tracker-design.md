# Neft Teacher — Student Growth Tracker (Design)

Date: 2026-05-30
Location: `math/student-tracker/` (Grade 6 Math Curriculum section)
Status: Approved (autonomous build — user delegated "you decide the rest; when finished, gold-standard audit then deploy")

## Purpose

A local-first, per-student **longitudinal** analytics tracker that auto-populates
from student work already captured on the device, recalculates advanced statistics
on every change, and also accepts manual teacher input. It complements (does not
duplicate) the existing **Class Dashboard** (a read-only class/standard snapshot)
by focusing on _growth over time, early-warning risk, and intervention grouping_.

## Why this is distinct from existing tools

- `class-dashboard` → class × standard snapshot, mastery bands now.
- `data-studio` → general CSV charting.
- **student-tracker (new)** → per-student trajectory: trend slope, projection,
  volatility, recency-weighted mastery, composite risk score, and auto group
  suggestions. The "tracker" the request asks for.

## Data sources (same-origin localStorage — zero network)

Auto-ingested and merged into one normalized record set:

| Key                                        | Shape                                                                                               | Source                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------- |
| `rma_gradebook`                            | `{studentName, studentPeriod, lessonId, lessonTitle, standard, correct, attempts, pct, band, date}` | engine `grade.js`         |
| `rma_game_results`, `rma_activity_results` | same shape                                                                                          | games/activities          |
| `nt_results_log`                           | nt-results.js CSV rows; we read the `Skill:"Overall"` rows                                          | assessment activities     |
| `nt_tracker_manual`                        | manual entries this tool writes                                                                     | teacher input (this tool) |

Normalized record: `{ student, period, standard, label, pct, correct, total, date, source }`.

**Auto-update:** re-reads on `storage` events (cross-tab), `visibilitychange`/focus,
and a manual Refresh button. Manual entries are written only to `nt_tracker_manual`
so source feeds are never mutated.

## Statistics (per student)

- **Recency-weighted mastery** — exponential decay, ~21-day half-life (recent work counts more).
- **Mastery band** — engine-consistent: ≥85 Strong, ≥70 Likely Ready, ≥60 Approaching, else Needs Reteach.
- **Trend** — least-squares linear regression of pct over time → slope in **pts/week**; classified Improving / Flat / Declining (needs ≥2 points).
- **Volatility** — population standard deviation of scores.
- **Projection** — regression extrapolated to **today + 14 days**, clamped 0–100, with projected band.
- **Engagement** — total attempts, last-active date, days since last work.
- **Risk score (0–100)** — composite: low recency mastery (0.45) + declining trend (0.25) + volatility (0.15) + disengagement (0.15) → On Track / Watch / At Risk.

## Class-level rollups

- Band distribution per standard → reteach priority ranking.
- **Auto intervention groups** — students below "Likely Ready" on a shared standard, grouped by weakest shared standard.
- Class average trend, at-risk count, headline KPIs.

## Views

1. **Class overview** — KPI cards, standards-needing-reteach list, suggested groups.
2. **Roster** — sortable table (mastery, trend, risk, last active); band/risk color chips.
3. **Student detail** — inline SVG sparkline of pct over time, per-standard breakdown, projection, recommended next move.

Filters: period, standard, student search. CSV export of the active roster. Print-friendly. Empty-state guidance when no data yet.

## Tech

Single self-contained app: `index.html` + `app.js` + `styles.css`. Vanilla JS,
**zero dependencies, no network**, links `/assets/shared.css` for shell consistency.
Inline SVG charts (no chart lib). Accessible: skip link, ARIA, keyboard nav, semantic tables.

## Registration

Card added to `math/index.html` (Math Curriculum) and the data section of
`teacher-tools/index.html`. Naming uses "Neft Teacher" brand.

## Out of scope (YAGNI)

No backend, no auth, no roster import beyond manual entry, no ML clustering beyond
deterministic weakest-standard grouping, no cross-device sync (device-local by design).

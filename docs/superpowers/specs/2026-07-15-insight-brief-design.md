# Insight Brief — one-click student-work analysis

**Date:** 2026-07-15 · **Status:** Approved for build (autonomous session; Joel asked to "figure it out")

## Problem

Joel has rich student-work data flowing into D1 (save/resume progress, lesson telemetry,
game scores) and several single-lens dashboards (Intervention Radar = live risk,
Standards Heatmap = mastery grid, Gradebook = scores). What's missing is the
_synthesis step he does by hand_: pull everything, sort it, decide who needs what,
and turn it into a plan. That analysis should be one click.

## Decision

Build **Insight Brief** at `/teacher-tools/insight-brief/` — a client-side tool that,
on one click, fetches the four existing TEACHER_KEY analytics endpoints
(`digest`, `mastery-rollup`, `struggles`, `grades` on `/api/progress/`), runs a
**deterministic insight engine** in the browser, and renders a sorted, printable,
exportable class brief with concrete planning ideas that deep-link into tools that
already exist (Lesson Plan Generator autogen, catch-up station lessons, Practice
Arcade per-lesson games, Radar/Heatmap/Gradebook).

### Approaches considered

1. **Client-side tool over existing APIs (chosen)** — zero API changes, zero risk to
   student paths, instant, private (data never leaves the site), works today.
2. New `/api/progress/insights` server route — "one call," but edits the live 44 KB
   API function used by every lesson; the client can already compose the same data.
3. Extend an existing dashboard — each existing tool has one job (taxonomy rule);
   bolting synthesis onto one of them muddies both.

AI narrative was considered and deliberately **excluded** from v1: `/api/tutor` is
student-voiced (Socratic), and rule-based templates grounded in the real curriculum
registry give trustworthy, instant, zero-cost ideas. An AI "polish" pass can be a
later additive layer.

## Components

- `teacher-tools/insight-brief/insight-engine.js` — pure function
  `NTInsightEngine.buildBrief(inputs)`; no DOM, no fetch; also `module.exports` for
  node tests. Computes: headline stats; per-student profiles (avg score, completion,
  struggle/misconception counts, mastery, weak standards, risk score, tier:
  support/watch/on-track/enrichment); per-standard need ranking with evidence;
  top-3 priority actions; auto small groups (support+watch students grouped by
  shared weakest standard, ≤5 per group) with a teaching move; per-section planning
  ideas; a plain-text summary for copy/paste.
- `teacher-tools/insight-brief/app.js` — key gate (shared `neft.teacher.key`),
  window/section filters, parallel fetches, sortable tables, print/CSV/copy exports,
  last-brief cache in `localStorage` (`neft.insight.brief.v1`).
- `teacher-tools/insight-brief/index.html` + `insight-brief.css` — hub-consistent
  light design, print stylesheet.
- `tools/test-insight-brief.mjs` — node unit test with fixture API payloads.

### Data contract (inputs, all optional/graceful)

- `digest` → `students[{studentName, section, activities[{activityId, activityTitle,
progressPercent, scorePct}], telemetryCounts{}, masteryReached[]}]`
- `rollup` → `sections[{section, standards[{standard, attempts, correctRate,
masteryCount, struggleCount, misconceptionCount, topMisconceptions[{tag,count}]}]}]`
- `struggles` → `rows[{at, signal, studentName, section, standard, tag, ...}]`
- `grades` → `{activities[], headers[], rows[[name, section, ...cells, avg]]}`
- `lessons` → `window.REVEAL_MATH_LESSONS` (`{id:"1.1", title, unit, standard}`)

### Deep links (all existing, verified)

lesson `/lessons/{N-x}/` · catch-up `/lessons/{N-b}-catchup/` (bands u1:[3,7]
u2:[3,5] u3:[3,7] u4:[3,7] u5:[3,5] u6:[3,7] u7:[3,7] u8:[3,7] u9:[3,7] u10:[3,5]) ·
arcade `/math/games/practice-arcade/?lesson={N-x}` · plan generator
`/teacher-tools/lesson-plan-generator/?standard=&topic=&autogen=1`.

## Placement

1. `/teacher-tools/` hub — new card in **Data & evidence** (taxonomy family `data`),
   kind `Dashboard · Key required`, CTA "Generate today's brief".
2. `/curriculum/` hub — new `hub-teacher-only` featured card (`mailbox-feature`
   pattern, next to Gradebook) so it lives where Joel plans. Inserted via node
   string-splice (not Edit) to avoid formatter reflow of the 9k-line file.

## Error handling

No key → inline key gate. 401 → "key rejected" with re-enter. 503 → "backend not
configured" notice. Empty data → honest empty states ("no signals in this window —
widen it"), never fabricated insights. Every insight cites its evidence counts.

## Testing

`node tools/test-insight-brief.mjs` (fixtures → tier/priority/group/link
assertions), `node --check` on both JS files, `npm run validate:hub` after the
curriculum card insert, Biome via repo hooks.

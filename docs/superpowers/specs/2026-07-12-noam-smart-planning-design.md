# Noam Smart Planning Design

## Goal

Make captured schoolwork more accurate and actionable while keeping Focus School local-first, calm, and safe for existing student data.

## Decisions

- Parsing remains deterministic and local. It recognizes configured class names and subjects, common aliases such as ELA/English, due dates and times, teacher names, URLs, and lightweight assignment-type labels.
- Imported candidates preserve a validated `https:` source URL through review and assignment creation. Inbox and assignment views expose the link with safe `target="_blank"` and `rel="noopener"` behavior.
- Academic Help receives only assignment context already stored locally: class, title, due date, notes/directions, incomplete steps, estimate, and source label. Prompts explicitly request scaffolding rather than answers and never include the source URL.
- Workload forecasting starts at 60 minutes per school day. When at least three completed focus sessions exist in the recent activity window, capacity adapts to the median daily focused minutes, clamped to 45–90 minutes.
- A day is overloaded when open due work exceeds capacity. Forecasting suggests moving flexible, non-overdue work to the earliest prior day with capacity; it never changes dates automatically.

## Data and UI

`normalizeTask` and `normalizeImportCandidate` gain bounded `sourceUrl`, `teacher`, and `assignmentType` fields. Sync continues using the existing last-write-wins assignment and inbox merge paths.

The Import Inbox shows extracted metadata and an “Open source” link when available. Assignment rows expose the same link without changing their primary Start/Help actions. Daily Briefing gains a seven-day workload strip, overload warnings, and explicit “Move earlier” suggestions that open the existing assignment editor.

## Failure Handling

Unrecognized lines remain assignment titles rather than being discarded. Invalid or non-HTTPS links are dropped. Forecasting falls back to 60 minutes when history is insufficient. Missing due dates are excluded from dated load totals and remain visible in the normal assignment list.

## Verification

Add deterministic tests for aliases, metadata extraction, URL validation, enriched help prompts, adaptive capacity, overload detection, and move-earlier suggestions. Run Focus School tests, repository tests, build, QA loop, desktop/mobile browser flows, and live asset verification before deployment.

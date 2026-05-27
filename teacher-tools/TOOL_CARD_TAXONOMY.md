# Teacher Tools Card Taxonomy

This file keeps the Teacher Tools hub from becoming a flat, inconsistent link board as more tools are added.

## Primary audience

The page is primarily a teacher productivity hub. It can include internal tooling and student-facing sections, but every card must explain the practical teacher job it supports.

## Approved task families

Use one or more of these task families in `data-category`:

| Family | Use when the card helps with... | Example CTA pattern |
|---|---|---|
| `command` | Planning, prioritizing, capturing tasks, QA, or shipping work | Launch command center |
| `data` | Reviewing evidence, dashboards, grouping, summaries, analysis | Review learning evidence |
| `instruction` | Classroom activities, student-facing practice, teaching supports | Browse resources |
| `curriculum` | Unit sections, content collections, ESOL/math/reading hubs | Browse math resources |
| `deployment` | GitHub, Cloudflare, build checks, publishing workflow | Check deployment |

## Required card slots

Each card should include:

1. **Badge** — category/status such as `Core`, `New`, `Data tool`, `Curriculum`, or `Reading`.
2. **Tool kind** — what type of destination it is, such as `Dashboard`, `Local-first`, `Student-facing`, or `Instruction`.
3. **Title** — plain name of the tool or section.
4. **Description** — one short paragraph using this structure:
   - What it is
   - What it helps with
   - Who should use it
5. **Metadata chips** — role and use case.
6. **Unique CTA** — must identify the destination or action clearly.

## Copy rules

- Avoid generic CTA text such as “Open activity.”
- Avoid internal-only terms such as “Related section.”
- Use teacher-facing language first.
- Explain opaque brand names in practical language.
- Keep descriptions parallel in length and structure.
- Prefer clarity over hype.

## Accessibility rules

- Cards remain anchor elements, not divs with click handlers.
- Full-card links must preserve keyboard focus states.
- Breadcrumbs use `nav > ol > li`, with the current page marked by `aria-current="page"`.
- Decorative separators must be generated with CSS instead of announced as text.
- Search results update through an `aria-live` status line.
- The page must include a skip link.
- All CTA labels must be unique enough for screen-reader link scans.

## Interaction rules

- Filtering must not remove content permanently; it only hides cards temporarily.
- Local usage tracking is optional and must never block navigation.
- Keyboard shortcut `/` or `Ctrl/Cmd+K` may focus search, but it must not interfere when the user is typing.
- If JavaScript fails, all cards must remain visible and clickable.

## Visual rules

- Use fluid responsive grids.
- Avoid fixed card heights that cause overflow on small screens.
- Preserve strong focus-visible outlines.
- Keep badges functional, not decorative.
- Maintain readable contrast on text, chip, and card backgrounds.

## Adding a new card checklist

Before committing a new card, verify:

- [ ] The destination route is correct.
- [ ] The title is plain and searchable.
- [ ] The category matches an approved task family.
- [ ] The visible CTA is unique and specific.
- [ ] The card description is teacher-friendly.
- [ ] The card works without JavaScript.
- [ ] Keyboard focus is visible.
- [ ] The card appears in the correct group.

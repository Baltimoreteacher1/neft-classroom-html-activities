# Teacher Tools Card Taxonomy

This file keeps the Teacher Tools hub from becoming a flat, inconsistent link board as more tools are added.

## Primary audience

The page is primarily a teacher productivity hub. It can include internal tooling and student-facing sections, but every card must explain the practical teacher job it supports.

## Approved task families

Use exactly one primary task family in `data-category` (extra keywords may follow
it to improve search — e.g. `data dashboard mastery standards`). The primary
family MUST match one of the five directory filters and its group section.

| Family       | Group heading         | Use when the card helps with...                                      | Example CTA           |
| ------------ | --------------------- | -------------------------------------------------------------------- | --------------------- |
| `plan`       | Plan & create         | Planning, prioritizing, generating lessons / Do Nows / playlists, QA | Generate a lesson     |
| `teach`      | Teach live            | Projecting, pacing, and facilitating the class in the moment         | Open the Class Board  |
| `data`       | Data & evidence       | Dashboards, mastery, growth, standards, gradebook, analysis          | Review evidence       |
| `canvas`     | Canvas & publishing   | SCORM, cartridges, deploy-to-Canvas, roster links, Google Forms      | Open Canvas Console   |
| `curriculum` | Curriculum & sections | Student-facing unit sections and activity collections                | Browse math resources |

## Required card slots

Each card is a full-card anchor with exactly these parts, in order (kept minimal
on purpose — no badge pills, no metadata chip rows):

1. **Kind label** — one quiet uppercase `.tool-kind` line naming the destination
   type, optionally with a qualifier: `Dashboard`, `Command · Local-first`,
   `Live · Projector-ready`, `Canvas · Setup`, `Section · Math`.
2. **Title** (`h4`) — plain, searchable name of the tool or section.
3. **Description** — one short paragraph: what it is and the job it does. Keep
   descriptions parallel in length across a group.
4. **Unique CTA** (`.tool-cta`) — a specific verb + object that names the
   destination (`Open Canvas Console`, `Make a Do Now`), never generic “Open”.

A hidden `[data-local-use]` span and rich `data-category`/`data-audience`
keywords stay on the card to power local-usage counts and search — they are not
shown as chips.

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

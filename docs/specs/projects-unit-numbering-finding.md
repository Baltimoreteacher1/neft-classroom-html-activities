# Projects: legacy folder numbers vs current units (finding, 2026-11-03)

Status: **open defect, not fixed**. Needs a sequencing decision from Joel because the fix changes
student-visible picker rows, SCORM entries and pinned counts.

## What the footer count means

The hub footer reads `84 lessons · 214 pathways (168 small-group / 36 catch-up / 10 unit projects)`.
`10` is `endOfUnitCount` in `data/curriculum-launch-manifest.json`, built by
`scripts/generate-curriculum-launch-manifest.mjs` ("End-of-unit culminating projects"). It is pinned
by `tools/validate-pathway-counts.mjs` (214 = 168 + 36 + 10). It is a count of **routes**, and it is
not "one project per curriculum unit".

## The defect

That generator takes each CURRENT unit number from the lessons and then looks for a LEGACY folder
with the same number: `math/unit-${unit}/projects/index.html`. The two numberings differ (the
2026-08-10 Reveal-TOC renumber). `data/project-registry.json` (`hubs[].currentUnit`) records the
truth:

| legacy folder          | current unit its content belongs to |
| ---------------------- | ----------------------------------- |
| `pre-unit`             | 0 (assembled Pre-Unit)              |
| `statistics`, `unit-2` | 2 (mirrors each other)              |
| `unit-3` … `unit-9`    | 3 … 9 (match)                       |
| `unit-1`               | **6**                               |
| `unit-10`              | **5**                               |

Effects today:

- The Lesson picker's row "Unit 1 Culminating Project" opens `/math/unit-1/projects/`, whose content
  is a Unit 6 project. "Unit 10 Culminating Project" opens `/math/unit-10/projects/`, a Unit 5
  (area/volume) project.
- Current Unit 1 (Math Is Discovery) has a Studio mission (`discovery`) but no legacy page, so no row
  is correct for it. Current Unit 10 is not taught this year.
- Current Units 2, 5 and 6 each map to two legacy hubs.
- `curriculum/units/index.html` is hand-authored and already places each "Culminating Project" link
  under the right current unit. Only the launch manifest (and so the picker and the footer total) is
  keyed by folder number.

## Why it was not changed in the redesign branch

Correcting it is a data-model change, not a label edit. It touches: the launch-manifest generator,
`endOfUnit` and the picker's "project stays the unit's last row" rule
(`tools/hub-lesson-picker.test.mjs`), the SCORM catalogue entries for those routes (Canvas packages
already handed out must keep opening), `validate:pathway-counts` (214 would change), and the download
taxonomy's unit placement. No URL's answer changes, but a teacher's picker does.

## Recommended fix (for sign-off)

1. Derive `endOfUnit` from `data/project-registry.json` hubs: one canonical hub per current unit
   (Unit 2 → `statistics`, Unit 5 → `unit-5`, Unit 6 → `unit-6`), no row where there is no project
   page (Units 1 and 10 until a project exists; Unit 1 can point at the Studio `discovery` mission).
2. Keep every legacy `/math/unit-N/projects/` URL and SCORM package resolving (they stay in All
   resources and the gallery).
3. Re-pin `validate:pathway-counts` with the registry-derived count and update the footer text from
   the same source in one commit.

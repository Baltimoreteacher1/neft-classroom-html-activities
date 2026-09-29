# Grade 6 Fluency & Readiness

## Access

In Teacher view, use the Fluency & Readiness shortcut at the top of Curriculum Hub. It is also featured under Resources & tools, where it can be pinned on this device. For a specific lesson, open Teach today, select the lesson, then choose Fluency & readiness or Fluency student practice.

- Teacher: `/curriculum/fluency/teacher/` (existing teacher access gate).
- Student: `/curriculum/fluency/` (public practice with worked feedback).
- Unit PDFs: `/curriculum/fluency/teacher/printables/`.

Select a lesson, then Build foundations (4 tasks), Connect & apply (8), or Extend & explain (4). Print a worksheet, run a partner activity, or copy the student link into Canvas or Class Board. Use another check the next class to revisit the skill.

Covers 54 district lessons in Units 2–9: 216 original foundation exercises, 162 A/B/C checks, 54 extensions, 54 partner activities, and 12 core-skill drills. The eight unit PDF packets contain 108 student pages plus 108 separate key pages. Units 1 and 10 do not receive a link.

Lesson 2-6 is whole-number division, matching the site's launch manifest; an older desktop guide incorrectly called it a second median session.

## Data and privacy

The public edition excludes teacher diagnostics, reteach scripts, and key screens. Worked practice solutions are intentionally available. Typed responses stay in the current tab and clear on reload. No student records, analytics, server persistence, Canvas grade passback, or save-code synchronization are added. Existing site routes and access behavior are preserved.

## Maintenance

Source: `tools/fluency-guide/src/`. Edit `src/data/practice.json` for new exercises or the existing core/enrichment data for checks and teacher notes.

```sh
node tools/fluency-guide/build.mjs --check
node tools/fluency-guide/build.mjs
node tools/fluency-readiness.test.mjs
```

The build writes both hosted HTML editions. The public edition is an allowlisted subset of the shared source. The site Vite build copies the committed pages and PDFs normally; no runtime dependencies or additional deployment service are needed. Unit PDFs are committed exports; when worksheet content changes, re-export affected packets from the Studio and replace the corresponding files in `teacher/printables/`. The adapter and resource manifest map only known district lesson IDs.

Desktop verification covered all 162 worksheet sets, numeric feedback/retries/equivalents, self-review, dialogs, print separation, direct links, Chrome file access, desktop/mobile views, and public edition isolation. All 16 PDFs were checked for page counts and packet separation; visual checks sampled printed pages. Safari/Firefox and full independent math review were not performed.

Site integration checks passed for the built hub card and bundled adapter, unsupported lesson handling, the 3-2 teacher/student links, desktop/mobile reflow, solution and key dialogs, and PDF access. The accessibility audit sampled 24 pages, including both fluency editions, with zero automated WCAG violations. Its shared-footer contrast finding was fixed by giving the footer an opaque light background and darker text.

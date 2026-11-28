# Math Literacy Studio: changelog

## 2026-11-28: first release

Grades 1 to 8, reached from the Teachers area at `/access-practice-lab/math-literacy` (see the route decision in `deployment-readiness.md`).

- **Content:** 85 skills, original text, with a locked inventory (`content/mls/inventory.json`); 10 progressions; 30 roles.
- **Teach, Create, Support:** three doors; search that understands ordinary teacher language; 22 resource types with independent mathematics and language dials; edits that survive regenerate, hide and compare; save, duplicate and collections on the device.
- **Exports:** print and PDF, HTML, DOCX and PPTX, with a separate answer key.
- **Student activities:** 12 engines, 30 manipulatives, 12 games, 30 picture kinds, 60 problem families whose generated problems are re-solved by independent solvers.
- **Wiring:** sitemap and teacher site guide, home registry, early-grade gate, QA coverage rule, `validate:mls` and `e2e:mls` chained into `validate:access-lab`.

### Fixed during release testing

- A resource's teacher edits (directions, replaced questions) were lost when a question was regenerated, hidden or the compare view toggled, because the page unmounted on every re-render. Edits now carry across re-renders of the same resource only. Found by the builder scenario.
- The in-page preview frame carried the Print button's script, which its sandbox blocks. The preview now omits the button and script.
- A game's Back button did nothing useful inside the studio; the host now returns to the skill page (`onBack`).
- The Studio had no "you are here" entry in the lab sitemap (`locate()` returned nothing); fixed, and the generated site directory guide was regenerated.
- Check harnesses made portable (macOS select keys and select-all, font lookup, browser path, Python path).

### Known limits

See `deployment-readiness.md`.

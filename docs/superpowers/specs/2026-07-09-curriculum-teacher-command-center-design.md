# Curriculum Teacher Command Center Design

## Goal

Turn `/curriculum/` into a teacher-first instructional command center while preserving every existing unit, lesson, resource, route, and public student-safety rule. Teachers should be able to choose today's lesson, prepare it, launch a focused student experience, arrange a week or playlist, scan a unit, and turn exit evidence into tomorrow's groups without creating accounts or sending student data to a server.

## Existing Foundation

The hand-maintained curriculum hub remains the content source of truth. `window.CurriculumHub.unitsData`, `data/curriculum-manifest.json`, `data/curriculum-supports.json`, and `data/curriculum-uifr-level4.json` already provide lesson resources, objectives, language scaffolds, assessment guidance, and instructional routines. The implementation extends these sources; it does not replace or regenerate `curriculum/index.html`.

## Architecture

Add a scoped teacher-workflow layer in `assets/curriculum-teacher-workflow.js` and `.css`. It reads the existing curriculum data, renders only in Teacher Mode, and persists teacher preferences in local storage. The existing `curriculum-top1` role panel remains available and becomes the instructional foundation beneath the new workflow.

Generate a public-safe launch manifest from `data/curriculum-manifest.json`. A new `/curriculum/student-launch/` route uses only that manifest and support data. It exposes student lesson, notes, help, homework, objective, language objective, vocabulary, and progress controls; it never exposes slides, teacher notes, answer keys, dashboards, or teacher-only downloads.

## Teacher Experiences

### Today's Teaching

- Class, unit, and lesson selectors using the existing saved selection.
- Previous and next lesson controls.
- Primary actions for teaching the lesson, opening the student launcher, copying the student link, and printing.
- QR code rendered locally in the browser without a network request.
- Estimated time, materials, objective, language objective, success criteria, vocabulary, prerequisite, common misconception, and response move.
- Expandable 45-minute and 90-minute sequences using the existing UIFR classroom flow.
- WIDA 1–2, WIDA 3–4, SPED, TWR, and enrichment supports from the existing support taxonomy.
- Favorites and recent lessons stored locally.
- One-action substitute-plan copy/print support.

### Weekly Pacing

- Five weekday slots with lesson selectors.
- Save locally, clear individual days, copy the week, and print.
- No calendar integration, account, or network storage.

### Student Playlist

- Add ordered lessons from the canonical curriculum.
- Reorder and remove items.
- Copy one student-safe playlist URL.
- The student launcher reads the playlist from the URL and shows one focused lesson at a time.

### Unit Map

- One card per lesson with standard, objective, time, readiness status, and safe launch actions.
- Unit-level resources remain linked from the existing hub rather than duplicated.

### Next-Day Loop

- Teacher enters only aggregate counts for Ready, Developing, and Reteach; no names or identifiers.
- The tool recommends extension, core practice, language support, or reteach resources using the existing `dataNextSteps` and support family.
- Results remain in the current browser and can be copied or printed.

## Student Launcher

The launcher has a readable, high-contrast, distraction-free layout. It presents a short numbered routine, large primary action, objective, language objective, vocabulary, sentence frame, optional read-aloud, local completion checkboxes, and previous/next playlist navigation. It contains no teacher-mode switch, answer key, analytics, remote submission, or student identity field.

## Safety and Compatibility

- Public `/curriculum/` continues to default to Student Mode.
- Teacher-only content remains PIN-gated by the existing mechanism.
- No existing routes or lesson markup are removed, renamed, or rewritten.
- All new state is namespaced in local storage and has visible reset controls.
- No dependency, lockfile, Cloudflare configuration, secret, or deployment guard changes.
- The existing curriculum lock and integrity audit remain mandatory.

## Verification

Add a deterministic validator for manifest safety, route wiring, accessibility landmarks, local-only persistence, and teacher-only rendering. Add Playwright coverage for Teacher Mode, daily selection, student-safe launcher, weekly pacing, playlist navigation, and mobile accessibility. Run the full curriculum validation, integrity audit, build, focused Playwright spec, and deployment smoke checks before merging.

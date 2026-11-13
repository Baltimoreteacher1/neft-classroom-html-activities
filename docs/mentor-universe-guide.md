# Math Mentor Universe: teacher guide and deployment contract

Math Mentor Universe extends the existing static `/mentor-lab/` route. It does
not replace the curriculum, create a separate app, or introduce a second
student identity. The 44 mentor IDs, eight thinking-move IDs, `nt_mentor`
storage key, lesson-platform injection, Save/Resume export, SCORM wrappers, and
course routing remain the contracts.

## A 36-week classroom rhythm

Use one five-minute Mentor Moment each week. Students may complete the matching
reflection in **My Math Journey**; the writing remains on their device.

| Weeks | Classroom use |
| --- | --- |
| 1–2 | Complete the 60–90 second match, browse the full gallery, or use Surprise Me. Build a strategy card in My Mentor Studio. |
| 3–5 | Notice before calculating. Compare what students noticed without ranking observations. |
| 6–8 | Draw or model before using symbols. Ask what each part represents. |
| 9–11 | Try a small or friendly case, then return to the original problem. |
| 12–14 | Keep a record of an unsuccessful try and annotate the useful evidence. |
| 15–17 | Use Strategy Switchboard: solve, switch strategies, and compare. |
| 18–20 | Track equality and equivalent forms with the Balance move. |
| 21–23 | Use the complete Lesson 6-5 Discovery Archive: model `7t − 24`, respond to misconception feedback, revise, evaluate, and transfer. |
| 24–26 | Estimate and test whether results fit units and context. |
| 27–29 | Find what changes, repeats, and predicts the next case. |
| 30–32 | Use Mentor Mash-Up to combine two genuinely different moves. |
| 33–34 | Complete the current unit investigation and collect evidence in more than one representation. |
| 35 | Revisit the first strategy card. Revise it using evidence from the year. |
| 36 | Build a small synthesis exhibit: one problem, two moves, one revision, and one next question. |

The ten unit investigations are rendered from `assets/mentor-universe.js`.
Every entry in `data/curriculum-launch-manifest.json` receives a deterministic
Mentor Moment from its current title and standard. The lesson panel reads that
same generated manifest; no duplicate 84-lesson list is maintained.

## Teacher command-center use

Open `/mentor-lab/#mu-moments` to preview the moment for any lesson, and use
this guide to plan the weekly rhythm. There is **no secure automatic class
aggregation** for mentor choices, reflections, or experience completion.
Teachers can review a student's device, a student-presented export, or a
deliberately imported local progress backup. Do not describe the feature as
syncing a class roster or reporting to a private dashboard.

## Persistence and migration

`assets/mentor-universe.js` migrates state to schema version 2 while preserving:

- `id`, `chosenAt`, `moves`, `seenStories`, and `lang`
- legacy `mentorId` or `selectedMentor` choice fields
- new `studio` and `journey` branches

`assets/lesson-mentor.js` and `mentor-lab/mentor-lab.js` preserve the same
branches whenever they write. `/assets/my-progress/progress-view.js` already
includes `nt_mentor` in backup/restore, so no parallel storage system is added.

## Static deployment

No dependency, server route, database, secret, build preset, redirect, or
Cloudflare configuration is required. Vite copies the existing static routes
and assets into `dist/`. Deploy through the repository's documented `ship`
workflow only; never use a direct Wrangler deploy.

Before release:

1. Run `node tools/mentor-universe.test.mjs`.
2. Run the roster, syntax, static-link, Save/Resume, CSS, palette, and
   change-scoped QA checks.
3. Build and open `/mentor-lab/` at phone and desktop widths.
4. Keyboard-walk onboarding, gallery, profile interaction, all three signature
   experiences, the journey, and a lesson Mentor Moment.
5. Confirm an existing version-1 `nt_mentor` record retains its choice and
   collected moves.

Historical profile copy is bilingual and now links to MacTutor and Britannica
search paths for further reading. Those links are research starting points, not
automatic claim-level citations. A human editorial review should verify
individual biographical claims and Spanish historical terminology before the
site describes the profiles as fully source-reviewed.

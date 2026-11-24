# BCPSS Language Studio — premium audit, 2026-11-24

Scope: the student-facing activity player at `/bcpss-teachers/language-studio/` and its 14 activity
kinds, covering all 162 authored units, all three WIDA bands, and all six domains.

## Method

- Local server (`/tmp` harness, not in the repo) serving the source tree plus the real
  `GET /api/bcpss/units/<unitId>` payload from `functions/_lib/bcpss/db.js` (`fallback-seed` backend,
  no D1, no network).
- Playwright/Chromium render sweep: 162 units x 3 levels x every activity (5,803 activity screens),
  plus 486 studio-home screens, at 1366x768. A second pass at 360x640 on a stratified subset
  (g5-math-u3/u4/u5, every kind) plus manual screenshots at 360 and 1366.
- Per screen: console/page errors, stage rendered, horizontal overflow, control target size
  (<44px), body type size (<14px), presence of a stated language goal.
- Source served directly cannot resolve the build-time bare specifier `web-vitals` and the hashed
  font paths; those are known source-tree artefacts (the repo's own browser harnesses ignore them
  too) and are excluded from the console counts below.

## What the sweep found

| Finding | Count | Verdict |
| --- | --- | --- |
| Console/page errors | 0 | Clean on every unit, level and kind |
| Horizontal overflow | 0 / 5,803 | Clean at 1366 and 360 |
| Activity screens with no stated language goal or "I can" line | every activity | **Real gap — fixed** |
| Activity screens with no end-of-activity recap of what the student can now do | every activity | **Real gap — fixed** |
| Self-checking kinds with no student-controlled hint ladder | 6 kinds | **Real gap — fixed** |
| Starter (WIDA 1-2) screens with no on-demand Spanish / picture word support inside an activity | every activity | **Real gap — fixed** |
| No visible progress ribbon on the activity screen (text counter only) | every activity | **Real gap — fixed** |
| Micro-labels (chips, eyebrow labels) at 12.5-12.8px | 5,980 flags | Raised to 14px; body copy was already 16px+ |
| Controls under 44px | 759 flags | Not defects: inline tappable words in `read_annotate` (60px tall, inline by design) and elements sampled mid-animation. No standalone control is under 44px. |
| Empty activity stage | 0 | (First pass flagged 1; that was the harness sampling before the async kind import resolved.) |

Content-layer audit (`scripts/audit-bcpss-content.mjs --check`, 162 units, 2,011 activities):
0 template leaks, 0 missions reused across more than 3 units, 0 unit titles pasted into student
text, 82 distinct Error Doctor rule sets. Domain mix per unit meets the schema minimums
(Listening, Speaking 2+, Reading 2+, Writing 2+, Vocabulary 2+, Game 2+). The content layer was
already in good shape; the gaps were all in the shared player.

## Ranked defects and fixes

1. **No language objective on the activity screen** (instructional, all 162 units). A student saw a
   mission and a tip but never what language move they were practising, so the activity read as a
   game rather than language work.
   Fix: `studio-objective.js` — one authored language goal per kind, graduated across the three
   bands (Starter names the move, Core adds the reason, Stretch adds a second step). Rendered with
   the mission in the activity header. 14 kinds + 8 companion kinds authored; no unit repeats
   another unit's sentence because the goal belongs to the kind, not the unit.
   Files: `studio-objective.js` (new), `studio-app.js`, `studio-run.css`.

2. **Feedback had no hint ladder** (instructional). Wrong answers gave one line, and only after N
   misses; there was no way for a student to ask for help, and nothing between "not quite" and the
   answer.
   Fix: `kit.hints()` in `studio-kinds/_kit.js` — a three-step ladder (nudge, think-it-through,
   worked example), student-controlled, announced to screen readers, never the answer. Wired with
   content-specific steps into `quiz`/`error_analysis`, `cloze`, `word_sort`, `match` and
   `sequence`; steps read the current item (the word's picture cue, the gap's part of speech, the
   unit's sentence frame) so the help is about *this* question.
   Files: `studio-kinds/_kit.js`, `quiz.js`, `cloze.js`, `word_sort.js`, `match.js`, `sequence.js`,
   `studio-games.css`.

3. **No end-of-activity recap** (instructional). The celebration showed stars and a next button but
   never named what the student could now do.
   Fix: the win card adds "What you can say now" from the same authored goal, plus the existing
   effort detail and next step.
   Files: `studio-app.js`, `studio-run.css`.

4. **Starter band had no in-activity Spanish or picture support** (ESOL/WIDA). Spanish existed only
   on the word wall, two screens away, while a WIDA 1-2 student was mid-task.
   Fix: a "Word help: pictures and Spanish" disclosure in the activity header on the Starter band,
   listing each unit word with its picture cue, Spanish word and kid definition (all authored
   content, nothing invented).
   Files: `studio-app.js`, `studio-run.css`.

5. **Progress was a text counter, not a ribbon** (engagement). Students could not see where they were
   in the set without reading.
   Fix: a `role="progressbar"` ribbon under the activity bar, coloured by domain.
   Files: `studio-app.js`, `studio-run.css`.

6. **Micro-labels below the body-text floor** (accessibility). Chips and eyebrow labels at 12.5px.
   Fix: `.st-tag` to 0.875rem, `.sg-label` to 0.875rem. Body copy was already 16px+.

7. **Dark theme on BCPSS surfaces** (operator direction: light only). With the operating system in dark
   mode, the studio, the Teachers hub and the Family Guide all flipped to a dark palette. A classroom
   projector, a Chromebook in dark mode and a printed page should look the same.
   Fix: the dark token blocks are gone from `studio.css`, `studio-sentence.css`, `bcpss-teachers/overview.css`
   and `family/bcpss/family-bcpss.css`, and `color-scheme` is `light` on the studio page. This landed on
   `main` as ad8ff387c while this batch was in flight, so it ships with the same deploy; verified live with
   Chromium emulating a dark OS: every surface renders `#faf9f6`, ink `#182230`, no page errors.

## Not changed, and why

- **Content, answers, standards, unit and activity ids**: untouched. Nothing in
  `db/seeds/bcpss/**` or the generators changed, so no regeneration was required.
- **Layout of `match` on a 360px phone**: two columns stay; both columns wrap and there is no
  overflow, but the meanings column is dense. A single-column phone layout is a follow-up because
  it changes the interaction model.
- **Dyslexia-friendly type option**: not added in this batch. A global font override needs its own
  visual pass at all three viewports; it is listed as the next accessibility item.
- **Stretch-task chooser on the home screen**: the Stretch band already changes task demand; a
  separate opt-in Stretch task per activity is a content change and was left out of this batch.

## Deploy status (2026-11-24)

Shipped via `ALLOW_DEPLOY=1 npm run ship -- 6b2127160f` as `62ee02a89b` on `main`; the live build stamp
reports `62ee02a89b` and the post-deploy smoke ran 41/41. Live Playwright checks on
`https://thelanguagepage.com/bcpss-teachers/language-studio/` (6 units x 3 bands x 1366px and 390px,
dark OS emulated) were clean: activity rendered, language goal and ribbon present, light background,
no console errors, no horizontal overflow. The Teachers hub and the Family Guide also returned 200,
light, no page errors.

This document and the `ajv` devDependency declaration could not ship in the same pass: both map to no
narrow QA rule, so they escalate to the full 161-check gate, which is currently red on `main` for
reasons unrelated to this work — `audit:links` (4 unresolved links in `access-teacher/maker/index.html`),
`validate:test-writes` (`tools/access-critical-styles.test.mjs` unreviewed) and `audit` (1 mapping
finding). Those belong to other in-flight branches and were left alone rather than papered over.

## Remaining known gaps (deferred, ranked)

1. Phone layout for `match` / `word_sort` (dense two-column reading at 360px).
2. Dyslexia-friendly reading option with a visual pass at 360/768/1366.
3. Hint ladders for the remaining nine kinds (they already give item-specific feedback, but no
   student-controlled ladder).
4. `read_annotate` inline word targets are 60px tall but can be narrower than 44px; a zoomed word
   picker would meet 2.2 target-size more literally.

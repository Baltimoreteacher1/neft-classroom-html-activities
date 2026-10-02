# Interactive Learning Labs

## Scope and acceptance

Create an original lab for every one or two adjacent core lessons in all ten
Grade 6 units. The current source has 84 lessons. Pair by mathematical purpose,
not by a blind odd/even rule. Every core lesson must link to exactly one lab.

Each lab includes a specific mission, lessons and objectives, vocabulary,
step-by-step worked examples, a hands-on investigation with a live model,
Support / Core / Stretch practice, a create-and-explain task, and two finale
games. Navigation, local save/resume, print, and accessibility are shared;
stories, mathematical controls, investigations, creation tasks, and finales vary.

Source: tools/lib/curriculum-source.mjs and the existing core lesson configs.
Instruction and selected practice retain their lesson attribution. Original
investigations and games are supplementary, not publisher-authored source text.
No roster, new backend, analytics, remote submissions, or new dependencies.

## Implementation

1. Author the lesson coverage and distinct lab briefs in tools/learning-labs/.
2. Implement the shared shell, activity widgets, math models, and game rules in
   curriculum/learning-labs/shared/. Generate an HTML route and content per lab.
3. Add an Interactive Learning Labs category to the curriculum resource outline,
   static lesson resources, resource taxonomy, and a browsable lab catalogue.
4. Check source coverage, numeric answers, level banks, links, deterministic
   generation, keyboard/touch flows, save/resume, mobile/tablet/desktop layouts,
   and game completion. Run repository validation and build; inspect output.
5. Commit only this work and use ALLOW_DEPLOY=1 npm run ship -- <reviewed SHA>.
   Verify the production stamp and the new live routes.

## Design

Use the site's local Nunito display and Atkinson Hyperlegible reading faces.
Ink #17344b, paper #ffffff, sky #eaf4fb, ocean #075f80, leaf #176746,
signal #f9cf55. Additional unit colors must pass text contrast checks.
Readable 18px body text, large touch targets, short left-aligned instructions.
The distinctive visual is the working mathematical model, not decorative art.

    Curriculum / Labs / Unit and lessons       saved status
    [Lab title and one clear mission]           [level]
    Brief | Learn | Investigate | Practice | Create | Games
    [current activity: model/workspace] [one instruction / hint]

Review: a grid of identical quiz cards would not meet this brief. Use different
workspaces: survey desk, dot plot, price comparison, ratio mixer, percent grid,
cut-and-rearrange geometry, prism/net display, fraction strips, factor arrays,
number-line explorer, coordinate board, and equation balance.

## Verification record

2026-09-24, before release:

- 46 labs cover all 84 core lessons exactly once; each spans one or two adjacent
  lessons. All 84 links were exercised through the curriculum's lesson selector.
- The full browser sweep submitted 1,247 practice responses, completed 414
  construction puzzles and 138 matching games, and visited all 276 tabs and 138
  level selections. No lab-page runtime errors were recorded.
- Six representative desktop, tablet, and phone screens passed automated
  WCAG A/AA checks and horizontal-overflow checks. Rendered samples were visually
  inspected; this is sampling, not an accessibility certification.
- Keyboard tabs, retries, invalid input, local save/resume, unavailable browser
  storage, download, print, pyramid/prism switching, and game completion were
  exercised. Written responses are saved for teacher/partner review, not
  automatically graded.
- Structural tests verify source fidelity, coverage, practice banks, curriculum
  links, 414 mathematically reachable game goals, independent numerical fixtures,
  and 500 arithmetic/statistics property checks. Regeneration is deterministic.
- Production build passed. Source seam, engine import, generator safety,
  typecheck ratchet, catalogue, cache stamps, test-write safety, and changed-file
  lint checks passed.
- The first broad validation reported a Part 2 renderer mismatch. Investigation
  traced it to a shared node_modules workspace link importing another checkout's
  engine. The authorized repair keeps engine test imports in their own checkout;
  its regression test and all 15 Part 2 warm-up checks pass. No lesson renderer or
  student data changed.

Publisher-grade is the design target, not a claim of third-party certification.
Instruction is grounded in the existing lesson configs. Browser answer checks
verify scoring against the keyed answers; independent math checks and the repo's
curriculum validators provide additional evidence, not human review of every
possible student response. Final repository gate and deployment results are
recorded in the release handoff.

Integration follow-up: main advanced to 410721eca1 during the first release
gate. The guarded ship refused the conflicting cherry-pick without publishing.
The labs were integrated on a fresh branch without rewriting history; generated
indexes were rebuilt and all newer family/fluency work was preserved. Sixteen
labs were refreshed from updated lesson sources, bringing the final practice
count to 1,248. A full affected-content sweep of those labs plus the rounded-target
case passed 487 answer submissions, 153 construction puzzles, 51 matching games,
and the six responsive/accessibility samples. The earlier full-series sweep and
this affected-content sweep together cover every current practice item.

## Upgrade record, 2026-10-02

Shared-engine upgrade applied to every lab (the engine is shared, so Units 1 and
10 receive the same shell; content review focused on Units 2–9):

- Course navigation replaces the arcade toolbar on lab pages, so a lab no longer
  offers a "← Games" link back to the arcade. The catalog gained a lesson
  finder (number, title, topic), lesson titles and model tags on each card, and
  an "in progress on this device" badge.
- Progress is visible everywhere: numbered tabs with done/in-progress marks, a
  progress pill in the toolbar, a status list on the mission page with a
  "Continue with …" button, and the same summary in the downloaded report.
- Learn renders the lesson's key idea as a numbered callout, shows the
  "Let's try together" example as a second reveal stepper, and offers the
  worked examples in Spanish (every lesson source carries `linesEs`).
- Investigate adds a predict/change/explain strip, per-model "what the picture
  shows / try this first" guidance (`guidance()` in `model.mjs`), level-specific
  sentence frames, a Done check per investigation, and an "Add what the model
  shows now" button that copies the live readout into the evidence note.
- The histogram now draws only the occupied intervals (minimum four) with
  staggered labels, fixing overlapping axis text on the live site.
- Practice shows a progress bar, hint counts ("2 of 3 shown"), in-progress and
  complete states in the activity picker, a completion card that points to the
  next level, and focuses Next after a correct answer.
- Create offers sentence-starter buttons, a word count, and a "ready to share"
  check tied to the three criteria. Games show the current value against the
  goal while a student adjusts the unlocked control.
- Engine modules: `app.mjs` (shell, mission, report), `activities.mjs` (learn,
  investigate, practice, create), `progress.mjs` (completion rules, key-idea
  parsing), `catalog.mjs` (finder). `tools/learning-labs.test.mjs` covers the
  completion rules, key-idea parsing, Spanish parity, model guidance and the
  histogram binning. The full browser sweep and the scoped QA gate passed
  before release.

# Lesson-to-Product Factory

Turn any Grade 6 math lesson into a complete, classroom-ready, TPT-quality
product bundle — student lesson page, emergency sub packet, activity pack,
interactive practice, answer keys, and a QA report — then attach it to the right
curriculum card.

It is built as an extension of **CardForge** (`tools/cardforge/`): one canonical
system, local-first, staging-only by default. It never auto-publishes to live
curriculum or changes deployment settings.

## What it generates (per lesson)

| Artifact                 | File                                         | Notes                                                                               |
| ------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| Teacher guide            | `teacher-guide.md`                           | overview, pacing, examples, supports                                                |
| Student lesson/practice  | `student-practice.md`                        | objective, vocab, formulas, modeled, practice, writing prompt                       |
| Answer key               | `answer-key.md`                              | every problem, work shown, teacher-only                                             |
| Exit ticket              | `exit-ticket.md`                             | quick check + key                                                                   |
| **Emergency sub packet** | `sub-packet.html`                            | 3-day, B/W printable, cover + sub directions + answer key                           |
| **Activity pack**        | `activity-pack.html`                         | word search, vocab match, error analysis, exit ticket, challenge + key              |
| **Interactive practice** | `interactive.html`                           | name entry (no PIN), hint-after-wrong, stronger hint after 2 tries, progress, print |
| Card metadata            | `card.json`                                  | matches the curriculum-manifest card schema + Factory fields                        |
| Card buttons + report    | `card-buttons.json`, `card-update-report.md` | the 5 lesson-card buttons, before/after                                             |
| QA report                | `qa-report.md`                               | content + math + design + links                                                     |

## Where things live

```
tools/cardforge/
  schemas/            job / card / lesson-analysis JSON Schemas
  lib/
    generate.mjs      renders the .md artifacts + wires the HTML generators
    sub-packet.mjs    emergency 3-day sub packet (HTML)
    activity-pack.mjs activity pack (HTML)
    interactive.mjs   interactive student activity (HTML)
    print-style.mjs   shared B/W print CSS + helpers
    card-updater.mjs  computes the 5 card buttons + before/after report
    qa.mjs            QA gate
  examples/           job.json bundles (sources of truth)
  staged/             generated bundles (review here; not live)
  reports/            inspection + factory plan
```

## How to create a new lesson bundle

1. Copy an example: `tools/cardforge/examples/ratio-unit-rate/job.json`.
2. Edit the `card` block (unit, lesson, title, standard, skillFocus, objectives)
   and the `lesson` block (vocabulary, formulas, modeledExamples, practice with
   answers + work, exitTicket, misconceptions, esolSupports, spedSupports,
   extension). See `schemas/job.schema.json`.
3. Keep the math correct — answer keys are checked.

## How to run it

```
npm run cardforge:build       -- <job.json>     # render the full bundle → staged/
npm run cardforge:qa          -- <package-dir>  # QA gate (exit 2 if blocked)
npm run cardforge:update-card -- <package-dir>  # compute card buttons + before/after report
npm run cardforge:stage       -- <job.json>     # build + qa
npm run cardforge:audit                          # audit live cards (read-only)
npm run cardforge:publish     -- <package-dir>  # guarded manual publish (no live writes)
```

The three sample bundles:

```
npm run cardforge:stage -- tools/cardforge/examples/ratio-unit-rate/job.json
npm run cardforge:stage -- tools/cardforge/examples/expressions-evaluate/job.json
npm run cardforge:stage -- tools/cardforge/examples/geometry-surface-area/job.json
```

## How card updates work (safe by design)

`cardforge:update-card` finds the matching live lesson (by `unit-lesson` in
`data/curriculum-manifest.json`), computes the five buttons (Student Lesson,
Printable Packet, Activity Pack, Emergency Sub Plan, Interactive Practice),
checks for ones already present (idempotent), and writes a **before/after
report** + `card-buttons.json`. It does **not** mutate live cards for demo/sample
bundles. Promoting to a live card is the deliberate publish step:

1. Author the lesson under `lessons/<unit>-<lesson>/` with a `bundleResources`
   block referencing the generated files.
2. `npm run generate-curriculum-manifest` → `npm run validate` → `npm run audit`.
3. Review the diff, commit, push to `main` (Cloudflare Git deploy — the only
   deploy path; never run `wrangler` manually).

## How to run QA / repair failures

`cardforge:qa` checks: required card fields, resource completeness (teacher,
student, answer key), answer-key coverage of every problem, inline math claims,
ESOL/SPED presence, AI-slop phrases, stray TODOs, fake links, and scaffolding
depth. On a ⛔ block: read `qa-report.md`, fix the `job.json`, rebuild, re-QA.
Common fixes: add an answer-key entry for every practice `n`; remove a bare
"answers may vary" (add a rubric); fix a mismatched number.

## How to add a new activity type

Add a builder function in `lib/activity-pack.mjs` (return an HTML `<section
class="page">…</section>` using `print-style.mjs` helpers), then add it to the
`parts` array in `renderActivityPack`. Keep it B/W-friendly and include a real
answer key in `buildKey`.

## Keeping printables TPT-quality

- Black-and-white friendly: no color-only instructions; structure with borders
  and bold, not color.
- Large readable fonts (the print CSS is ≥12.5pt); no tiny cramped text.
- Real problems, real directions, real answer keys — never outlines.
- Teacher voice: direct, warm, practical. No AI filler ("unlock", "delve",
  "robust", "seamless", "game-changing" are flagged by QA).
- Keep the answer key on its own page, labeled teacher-only.

## Reusable Claude prompts

See `docs/prompts/`: `generate-lesson-bundle.md`, `audit-curriculum-card.md`,
`repair-lesson-bundle.md`, `create-emergency-packet.md`,
`create-interactive-activity.md`, `qa-all-lesson-products.md`.

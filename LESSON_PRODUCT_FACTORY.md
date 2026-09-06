# Lesson-to-Product Factory

Turn any Grade 6 math lesson into a complete, classroom-ready, TPT-quality bundle
— student lesson page, emergency sub packet, activity pack, interactive practice,
answer keys, and a QA report — then attach it to the right curriculum card.

It is an extension of **CardForge** (`tools/cardforge/`): one canonical system,
local-first, staging-only by default. It never auto-publishes to live curriculum
and never changes deployment settings.

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

## Creating a new lesson bundle

1. Copy an example: `tools/cardforge/examples/ratio-unit-rate/job.json`.
2. Edit the `card` block (unit, lesson, title, standard, skillFocus, objectives)
   and the `lesson` block (vocabulary, formulas, modeledExamples, practice with
   answers and work, exitTicket, misconceptions, esolSupports, spedSupports,
   extension). Schema: `schemas/job.schema.json`.
3. Get the math right — the answer keys are checked.

## Running it

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

## How card updates stay safe

`cardforge:update-card` finds the matching live lesson by `unit-lesson` in
`data/curriculum-manifest.json`, computes the five buttons (Student Lesson,
Printable Packet, Activity Pack, Emergency Sub Plan, Interactive Practice), skips
any already present (idempotent), and writes a before/after report plus
`card-buttons.json`. It does not mutate live cards for demo or sample bundles.

Promoting to a live card is a deliberate, separate step:

1. Author the lesson under `lessons/<unit>-<lesson>/` with a `bundleResources`
   block referencing the generated files.
2. `npm run generate-curriculum-manifest` → `npm run validate` → `npm run audit`.
3. Review the diff, commit, push to `main`. Cloudflare's Git deploy is the only
   deploy path — never run `wrangler` by hand.

## QA and repair

`cardforge:qa` checks required card fields, resource completeness (teacher,
student, answer key), answer-key coverage of every problem, inline math claims,
ESOL/SPED presence, AI-slop phrases, stray TODOs, fake links, and scaffolding
depth.

On a ⛔ block: read `qa-report.md`, fix the `job.json`, rebuild, re-QA. The common
fixes are adding an answer-key entry for every practice `n`, replacing a bare
"answers may vary" with a rubric, and correcting a mismatched number.

## Adding an activity type

Add a builder function in `lib/activity-pack.mjs` that returns an HTML
`<section class="page">…</section>` using `print-style.mjs` helpers, then add it to
the `parts` array in `renderActivityPack`. Keep it B/W-friendly and give it a real
answer key in `buildKey`.

## Keeping printables TPT-quality

- Black-and-white friendly: structure with borders and bold, never color alone.
- Large readable fonts — the print CSS floor is 12.5pt. No cramped text.
- Real problems, real directions, real answer keys. Never outlines.
- Teacher voice: direct, warm, practical. QA flags AI filler ("unlock", "delve",
  "robust", "seamless", "game-changing").
- Answer key on its own page, labeled teacher-only.

## Reusable prompts

`docs/prompts/`: `generate-lesson-bundle.md`, `audit-curriculum-card.md`,
`repair-lesson-bundle.md`, `create-emergency-packet.md`,
`create-interactive-activity.md`, `qa-all-lesson-products.md`.

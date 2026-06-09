# EduWonderLab CardForge

A universal **Lesson → EduWonderLab Math Card** engine. Take any lesson source
and turn it into a complete, classroom-ready math card package: teacher guide,
student practice, answer key, exit ticket, card metadata, resource manifest, and
a QA report.

> **Honesty first.** CardForge v1 is a **local, staging-only** tool. It does not
> upload anything, does not run a backend, and does **not** auto-publish to the
> live site. The Math Card Builder page (`/math/card-builder/`) explains the
> workflow and links to a real generated sample; it never shows fake live
> buttons.

## What it can do now

- **Analyze** a lesson source into a normalized analysis object (with conservative
  inference and explicit uncertainty flags).
- **Build** a complete staged package from a single `job.json` (one source of
  truth → all artifacts, deterministically).
- **QA** a package against a real checklist (metadata, resource completeness,
  math accuracy spot-checks, AI-slop / TODO / fake-link scan, scaffolding depth).
- **Audit** existing live Math cards for missing fields/resources (read-only).
- **Publish** via a _guarded manual procedure_ that performs collision checks and
  prints exact steps — it never writes live curriculum data automatically.

## What it cannot do yet

- Parse binary sources (`pptx`, `pdf`, `docx`, Google Slides). These adapters are
  scaffolded and return an honest "not yet supported" message — no invented
  content. Export to text/markdown/html first, or author a `job.json`.
- Auto-publish a card to the live Math page (intentional safety choice for v1).

## Commands

```
npm run cardforge:audit                  # audit live Math cards (read-only)
npm run cardforge:analyze -- <file>      # normalize a source → generated/analysis-*.json
npm run cardforge:build   -- <job.json>  # render a staged package
npm run cardforge:qa      -- <pkg-dir>   # run the QA gate (exit 2 if blocked)
npm run cardforge:stage   -- <job.json>  # build + qa in one step
npm run cardforge:publish -- <pkg-dir>   # guarded manual publish (no live writes)
```

## Quick start (the sample)

```
npm run cardforge:stage -- tools/cardforge/examples/mean-median-mode-range/job.json
```

Outputs to `tools/cardforge/staged/unit-8/lesson-demo-mean-median-mode-and-range-demo/`:
`teacher-guide.md`, `student-practice.md`, `answer-key.md`, `exit-ticket.md`,
`card.json`, `resource-manifest.json`, `qa-report.md`, `README.md`.

A web preview of this sample is served at **`/math/card-builder/sample/`**.

## How to add a lesson source

1. **Easiest — author a job file.** Copy
   `examples/mean-median-mode-range/job.json`, edit the `card` and `lesson`
   blocks (see `schemas/job.schema.json`), then `cardforge:build` it. This gives
   the highest-quality, math-checked output.
2. **From an existing source.** Run `cardforge:analyze -- <file>` to get a
   starting analysis, then fold the useful pieces into a job file. Implemented
   source types: text, markdown, html, json (EduWonderLab `config.json`).

## Folder layout

```
tools/cardforge/
  README.md                 ← this file
  cardforge.config.json     ← paths, adapter status, QA policy, safety flags
  schemas/                  ← card / lesson-analysis / job JSON Schemas
  adapters/README.md        ← adapter docs (code in lib/adapters.mjs)
  templates/                ← reference skeletons for each artifact
  lib/                      ← engine: util, adapters, analyze, generate, qa, audit, publish
  scripts/cardforge.mjs     ← CLI dispatcher (backs npm run cardforge:*)
  examples/                 ← sample job files
  staged/                   ← generated packages (review here; not live)
  generated/                ← scratch analysis output
  reports/                  ← repo-inspection.md and other reports
```

## Staged vs live

- **Staged** (`tools/cardforge/staged/...`) — generated packages for review. Not
  served to students. `.md` files are excluded from the published site by
  `vite.config.js`.
- **Live** — the real curriculum lives in `lessons/<id>/` and is cataloged in
  `data/curriculum-manifest.json`. CardForge never edits these automatically; the
  guarded `publish` step documents how to promote a card by hand.

## Safe publishing (v1)

`cardforge:publish` checks for demo flags, a clean QA pass, and route/id
collisions against the live manifest, then prints the manual promotion steps
(author under `lessons/<unit>-<lesson>/`, regenerate the manifest, validate,
optionally add a hub card, review the diff, commit, push). It writes nothing to
live data. This keeps the existing site safe and every change reviewable.

## Troubleshooting

- **QA blocked on "answer key covers every problem"** — a practice item has no
  matching answer-key entry, or numbering is off. Make `lesson.answerKey` cover
  every `lesson.practice` `n`.
- **QA blocked on a math claim** — a clean inline `mean/median/range of … = x`
  claim recomputed differently. Fix the number.
- **"not yet supported" on a deck/PDF** — expected; export to text/md/html or
  author a job file.
- **Manifest audit says "not found"** — run `npm run generate-curriculum-manifest`.

## Example artifacts

- Example job: `examples/mean-median-mode-range/job.json`
- Example card metadata: `templates/card-metadata.md`
- Example QA report shape: `templates/qa-report.md`
- A full generated package: `staged/unit-8/lesson-demo-mean-median-mode-and-range-demo/`

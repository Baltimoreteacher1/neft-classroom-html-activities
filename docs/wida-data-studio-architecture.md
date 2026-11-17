# WIDA Data Intelligence Studio — architecture

**Route:** `/access-teacher/predictive/` (the existing analytics route, kept so bookmarks and links still answer; renamed in the UI). Teacher Hub card **WIDA Data Intelligence** → *Open Data Studio* and *Try with Sample Data* (`?demo=1`). `?tab=<section>` opens a section; `?demo=1&tour=1` starts **Teacher tour, Part 2** (linked from the end of Part 1 at `/start/tour`, `src/intro/tour/views-kit.js`).

**Hosting and access:** static ES modules served by Cloudflare Pages. `/access-teacher/*` sits behind the site's teacher gate (HTTP Basic on eduwonderlab.com); thelanguagepage.com redirects these paths to eduwonderlab.com (`functions/_lib/language-page.js`). Pages are `noindex`.

## Sections (`app.js`)

| Section | View | What it does |
| --- | --- | --- |
| Overview | `view-overview.js` | One student: latest result, domains, composites (reported / calculated / missing), relative profile, previous comparable result, data quality, next action. Whole class: coverage, overall-level distribution per assessment version (never pooled), comparable histories. |
| Students | `view-students.js` | Levels or scale scores (never one axis), composite cards, language-development starting points, every assessment on file, teacher and student-friendly goals linked to activities. |
| Growth | `view-growth.js` | Longitudinal charts (the line breaks at the scale reset and at cut-score changes), comparable change table with measurement-error test, "What changed / What is uncertain / What can I do / How was this calculated". |
| Forecasts & Scenarios | `view-forecasts.js` | Validated forecast ranges (`view-forecast-table.js`), targets (`view-probability.js`), Scenario Studio, MODEL to ACCESS, model quality (`view-validation.js`). Actual / validated / hypothetical are labelled apart. |
| Classroom Insights | `view-classroom.js` | Domain spread (median, middle half), temporary groups the teacher approves, distributions, coverage, practice-evidence groups, Data Explorer (`view-analyst.js`, `analyst.js`). |
| Instructional Planner | `view-planner.js`, `planner.js` | Findings → evidence to gather → what to teach → Language Page resources (`src/sitemap.js` ids) → assignment in the Teacher Hub's own format (`src/acc/adapt/assign.js`, saved to the hub's `assignments` setting). Practice-evidence bottlenecks below. |
| Reports | `view-reports.js` | Student, growth, classroom, family (English or Spanish), forecast (only when validated). Print/PDF via the browser, CSV export. |
| Toolkit | `view-toolkit.js` | Level guide (EN/ES), words to know, talking with families (EN/ES), student conference sheet, practice library by domain and band, the testing year, official WIDA links, templates. |
| Import data (header) | `view-data.js` | Seven-step wizard, data quality, record deletion, undo, audit log. |

## Logic modules

- `rules.js` — assessment registry, scale and cut-score versions, comparability, composite weights with sources.
- `records.js` — canonical ScoreRecord, draft validation, save/replace/remove.
- `import.js` — CSV/TSV parsing, header mapping, wide and long tables, validation against stores, apply, undo, CSV export.
- `file-readers.js` — XLSX (ZIP + XML via `DecompressionStream`), PDF text layer, score-report text parser.
- `interpret.js` — profile, comparable steps, guidance bands, class summary, quartiles.
- `scenario.js`, `concordance.js` (WIDA TR-2019-4 table), `planner.js`, `tour.js`.
- `practice.js` — Language Page activities for a domain, level and grade band, read from `src/sitemap.js` and `src/prep/registry.js` (no second list); links carry `?grades=`.
- `outlook.js` / `view-outlook.js` — Outlook card (validated forecast, WIDA MODEL estimate, goal math) and Practice next card on each student; Class outlook range chart under Forecasts.
- `usage.js`, `charts2.js` — practice-usage analytics and the visual kit.
- Forecast engine (unchanged, gated): `access-practice-lab/src/predict/*`; workspace layer `forecast.js`.

## Storage (browser, this device)

| Key | Owner | Holds |
| --- | --- | --- |
| `accessTeacher:v1:officialResults` | Teacher Hub (`evidence.js`) | Annual ACCESS / Kindergarten ACCESS rows, one per school year; schema 2 adds assessment, date, grade, form, scale/sem per score, composites, provenance, verified. Older rows read unchanged. |
| `accessTeacher:v1:predictive:interim` | Studio | MODEL Online / Paper / Kindergarten MODEL rows (several per year). |
| `accessTeacher:v1:predictive:real` / `:demo` | Studio | Targets, plans, goals, groups, scenarios, notes (demo never mixes with real). |
| `accessTeacher:v1:predictive:imports` | Studio | Last 10 import logs (undo). |
| `accessTeacher:v1:predictive:audit` | Studio | Last 500 events: action, time, counts. No names or scores. |

Forecasts are computed on demand and never stored over measured results.

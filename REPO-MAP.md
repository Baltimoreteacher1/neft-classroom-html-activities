# REPO-MAP — neft-classroom-html-activities

A maintainer's map of this repo: what lives where, the naming conventions, the
key systems, the build/deploy flow, and a "where do I add X?" cheat-sheet.

> This is an **organizational layer only**. It documents the existing site; it
> does not change any paths. The live site depends on current absolute paths, so
> nothing here is moved, renamed, or deleted.

For a live, searchable index of every navigable page, open
[`/directory/`](directory/index.html) (generated from `data/catalog.json` by
`scripts/generate-catalog.mjs`).

---

## 1. What this repo is

A mostly-static HTML collection of classroom activities for Mr. Neft's Grade 6
ESOL, Reading, Writing, and Math classes (Reveal Math curriculum). It deploys to
**Cloudflare Pages**. Most activities are self-contained HTML folders; the Reveal
Math **lesson launchers** are built by **Vite** and rendered by a shared
**engine**.

---

## 2. Top-level folder structure

| Path                     | What it is                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `index.html`             | Root student-facing hub (custom sidebar SPA-style nav; 200+ activities).               |
| `assets/`                | Shared CSS/JS used site-wide. **`assets/shared.css` is the canonical theme.**          |
| `engine/`                | Lesson rendering engine (`core/`, `components/`, `templates/`, `styles/`).             |
| `lessons/`               | Reveal Math lesson launchers, one folder per lesson (`<unit>-<lesson>/`).              |
| `math/`                  | Math curriculum hub + reusable math tools, games, hubs, and unit folders.              |
| `data/`                  | Generated/structured data (`catalog.json`, `routes.json`).                             |
| `scripts/`               | Node generators (catalog, notes, curriculum, novels, PDF/DOCX, homework).              |
| `tools/`                 | Validation scripts (`validate-static-site.mjs`, etc.).                                 |
| `directory/`             | The "Everything in One Place" master directory page (this org layer).                  |
| `dist/`                  | **Build output** (Vite). Never edit by hand.                                           |
| `functions/`, `workers/` | Cloudflare Pages Functions / Workers (server-side; **do not hand-edit** without care). |
| `docs/`                  | Maintainer docs (not shipped — `.md` is filtered out of `dist/`).                      |
| Standalone app dirs      | Each first-level dir with an `index.html` is a navigable app (see below).              |

### Standalone top-level apps (each is a folder with `index.html`)

These are independent activities/tools that live at the repo root. Categories
(see `data/catalog.json` for the curated, current set):

- **Tools / studios** — `reveal-evidence-studio/`, `math-lab-missions/`,
  `misconception-museum/`, `misconception-lab/`, `activity-studio/`,
  `vocab-hub/`, `graphic-novels/`, `webquests/`, `hyperdocs/`,
  `word-to-equations/`, `ratiolab/`, `correlation-playground/`,
  `forecast-engine/`, `sports-analytics/`, `world-architect-math-project/`,
  `refugee/`, `blood-on-the-river/`, `ecology-noam/`, `esol*/`.
- **Hubs** — `neft-school-hub/`, plus the math hubs under `math/`.
- **Games** — `cartesian-odyssey/`, `fractions-soccer/`, `netfold-pro/`,
  `fix-it-design-challenge/`.
- **Practice / review** — `spiral-review/`, `summer-bridge/`, `bridge-to-grade-6/`,
  `practice-engine/`, `mcap-review/`, `geometry-prep/`, `surface-area-review/`,
  `ratios-proportions/`, `expressions-equations/`, `number-system/`,
  `statistics-data/`, `unit-1/`, `unit-4/`, `unit-5/`, `unit-5-practice/`,
  `wida-access/`.
- **Teacher** — `teacher-tools/`, `teacher-data-dashboard/`, `dashboard/`,
  `neft-data-studio/`.
- **Family / personal** — `personal/`, `noam-bar-mitzvah/`.

> `noam-school-v10/` and `functions/` are touched by other processes — treat as
> off-limits for this org layer.

---

## 3. Naming conventions

- **Lessons:** `lessons/<unit>-<lesson>/` (e.g. `lessons/3-12/`). Each has a
  `config.json` (`title`, `standard`, `unit`, `lesson`, `theme`, objectives,
  `turnAndTalk`, etc.) and an `index.html` rendered by the engine.
- **Flagship variants:** `lessons/<id>-flagship/` are premium/alt builds and are
  **excluded** from the catalog and the Vite entry list.
- **Templates:** `lessons/_template/` (and any `_`-prefixed dir) is a scaffold,
  not a navigable page; the build and catalog skip `_`-prefixed dirs.
- **Math units:** `math/unit-1/` … `math/unit-10/` (classroom unit grouping,
  which differs from the lesson-launcher numbering for Units 7–9 — see
  `math/unit-map/`).
- **Brand:** Use **"Neft Teacher"** for new content. "EduWonderLab" only in
  legacy references.
- **Shared stylesheet path is load-bearing:** every page links
  `/assets/shared.css`. Keep that path stable.

---

## 4. Key systems

### Readiness / Get-Ready / Catch-Up

A layered "are you ready / let's catch you up" support system:

- **Per-lesson readiness** — `lessons/<id>/readiness/index.html`: a ~10-minute
  prerequisite check shown before a lesson, with a printable `practice.docx`.
  Copied into `dist/lessons/<id>/readiness/` by the Vite `closeBundle` hook.
- **Get Ready hub** — `math/get-ready/`: routes students into the right
  readiness pre-lesson.
- **Catch-Up & Bridge** — `math/catch-up/`: diagnostics + bridge lessons by
  strand (whole numbers, fractions, decimals, factors, pre-algebra).
- **My Math Path** — `math/my-path/`: self-rating per standard → routes to the
  right warm-up / bridge / lesson with a progress map.
- **Bridge to Grade 6** — `math/remediation/` and `bridge-to-grade-6/`: a
  foundations-first remediation track.

### Reusable Reveal Math tools

`reveal-evidence-studio/`, `math-lab-missions/`, `misconception-museum/`, and
`math/student-tracker/` work across all lessons (evidence, scenario missions,
misconception repair, growth analytics).

### Neft School Hub + its API

- **`neft-school-hub/`** — the student/teacher hub front-end (single large
  `index.html`).
- **API repo** — the hub talks to a **separate Cloudflare Worker API repo**
  (the NeftHub backend). It is **not** in this repo; this repo holds only the
  static front-end. Server-side bits that _do_ live here are under `functions/`
  and `workers/` (Cloudflare Pages Functions / Workers).

### Levels (differentiation)

Content uses **Level 0** (IEP / most-supported), **Level 1** (support), and
**Level 2** (enrichment). Never label content "ESOL" student-facing.

---

## 5. Build & deploy flow

1. **Vite build** (`npm run build`, config in `vite.config.js`):
   - Rollup entry points = root `index.html` + every `lessons/<id>/index.html`
     (non-`_` dirs) via `getLessonEntries()`. These are the engine-rendered
     lesson launchers.
   - `assetsInlineLimit` is high and `cssCodeSplit:false` so activities stay
     self-contained.
2. **`copyStandaloneHtml()` (a `closeBundle` plugin)** copies every other
   top-level dir's standalone HTML into `dist/` verbatim, **plus**:
   - root files (`_headers`, `_redirects`, `404.html`, `robots.txt`,
     `sitemap.xml`),
   - per-lesson `notes.html`, `homework.docx`, `downloads/`, and `readiness/`.
   - It **skips** `node_modules`, `dist`, `.git`, `.github`, `.claude`, `engine`,
     `lessons`, `scripts`, `docs`, and filters out `*.md` and nested
     `.claude/.git/node_modules` so dev artifacts never ship.
   - Net effect: `data/`, `directory/`, etc. are copied as-is →
     `dist/data/catalog.json` and `dist/directory/index.html` exist after build.
3. **Cloudflare Pages** deploys on **push to `main`** (framework preset `None`).

> Because `.md` is filtered, `REPO-MAP.md` is a maintainer doc and is **not**
> shipped — that's intentional.

---

## 6. "Where do I add X?" cheat-sheet

**A new lesson**

1. Create `lessons/<unit>-<lesson>/` with `config.json` (copy `lessons/_template/`
   shape: `title`, `standard`, `unit`, `lesson`, objectives, `turnAndTalk`) and
   an `index.html` that boots the engine.
2. Add a link in the right unit group of `math/index.html` (and root hub if
   desired).
3. Run `node scripts/generate-catalog.mjs` to pick it up in `/directory/`.

**A new readiness pre-lesson**

1. Add `lessons/<id>/readiness/index.html` (and optional `practice.docx`).
2. The Vite `closeBundle` hook copies it automatically.
3. Re-run the catalog generator; it auto-adds a `Readiness` entry.

**A new math tool / game / hub**

1. Create `math/<slug>/index.html` (link `/assets/shared.css`, use `<title>`).
2. Add a card in the relevant `math/index.html` section.
3. If it's a router page, add its slug to `MATH_HUBS` in
   `scripts/generate-catalog.mjs` so it's tagged `Hub`; otherwise it's a
   `Math Tool` automatically.
4. Re-run the catalog generator.

**A new top-level app**

1. Create `<slug>/index.html` at the repo root (link `/assets/shared.css`).
2. Add a curated `category`/`audience` entry for it in `TOP_META` in
   `scripts/generate-catalog.mjs` (defaults to `Tool` / `student`).
3. Add a link from the root hub or `math/index.html`.
4. Re-run the catalog generator and verify it appears in `/directory/`.

**Regenerating the catalog**

```bash
node scripts/generate-catalog.mjs   # writes data/catalog.json (idempotent)
npm run build                        # verify dist/ builds clean
```

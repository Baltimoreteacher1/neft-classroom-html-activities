# ESOL, Reading, Writing, and Math

`neft-classroom-html-activities` is a mostly static HTML collection for Mr. Neft's ESOL, reading, writing, and math classroom activities. It is designed for Cloudflare Pages. Most activities are standalone HTML folders, and the Reveal Math lesson launchers are built with Vite so Cloudflare can publish the complete `dist/` output.

Folder structure:

```text
/
  index.html
  README.md
  AGENTS.md
  source-repos.md
  assets/
    shared.css
    app.js
    vendor/
  geometry-prep/
    index.html
  surface-area-review/
    index.html
  unit-1/
    index.html
    ...activity-folders/
  unit-4/
    index.html
    ...activity-folders/
  unit-5/
    index.html
    ...activity-folders/
  unit-5-practice/
    index.html
  world-architect-math-project/
    index.html
  number-system/
    index.html
    ...activity-folders/
  ratios-proportions/
    index.html
    ...activity-folders/
  expressions-equations/
    index.html
    ...activity-folders/
  statistics-data/
    index.html
    ...activity-folders/
  esol-reading-writing/
    index.html
    ...activity-folders/
  mcap-review/
    index.html
    ...activity-folders/
  math/
    index.html
    unit-1/
      index.html
      projects/
        index.html        (unit projects hub)
        version-a/index.html  (Design & Build culminating project)
        version-b/index.html  (Real-World Investigation culminating project)
    ...unit-folders/
  lessons/
    1-1/
      index.html
      config.json
    ...lesson-folders/
```

## How This Repo Works

The root `index.html` is the polished launch dashboard. Each standalone activity lives in its own folder with its own `index.html`, so activity URLs use the folder path with a trailing slash.

Current launch activities:

- `geometry-prep/`
- `surface-area-review/`
- `unit-5-practice/`
- `world-architect-math-project/`

Organized unit and subject folders:

- `unit-1/`
- `unit-4/`
- `unit-5/`
- `statistics-data/`
- `expressions-equations/`
- `number-system/`
- `ratios-proportions/`
- `esol-reading-writing/`
- `mcap-review/`
- `math/`
- `lessons/`

Shared files:

- `assets/shared.css` provides the classroom design system.
- `assets/app.js` provides small shared behavior, currently the footer year.
- `source-repos.md` maps source repository names to their organized target folders.

## Culminating Projects

Each Grade 6 math unit (`math/unit-1` through `math/unit-10`) includes a
`projects/` folder with two creative, interactive end-of-unit projects:

- **Version A — Design & Build:** an open-ended maker challenge.
- **Version B — Real-World Investigation:** a data-and-decision challenge.

Both versions assess the same unit standards through different contexts, so
they double as choice-board options, differentiated assignments, or A/B class
sets. Each project is a self-contained HTML page with live calculators,
scaffolded hints, a progress bar, a written deliverable, a student checklist, a
3-point rubric, and a print button. Projects are linked from each unit's
`index.html` and from the math hub at `math/index.html`.

## Adding A New Activity

1. Create a folder using a short lowercase URL-safe name under the correct unit or subject folder.
2. Add the full standalone `index.html` inside that folder.
3. Link the activity from the matching collection page and, if it should be immediately visible to students, from the root dashboard.
4. Keep CSS local by linking to `/assets/shared.css`.
5. Avoid external dependencies unless they are explicitly requested and approved.

Every activity can have its own `index.html` inside its folder. Cloudflare Pages will serve that folder at a clean URL that follows the folder path.

## Local Development

Install dependencies once:

```sh
npm install
```

Build the Cloudflare Pages output:

```sh
npm run build
```

Preview the built site locally:

```sh
npm run preview
```

## Cloudflare Pages Setup

Use these settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leave blank unless deploying a subfolder
- Production branch: `main`

## Static Site Notes

This repository is intentionally lightweight. Standalone activity folders should stay classroom-safe, student-friendly, and Cloudflare Pages-compatible. For deployed changes, use the Vite build so generated lesson pages and copied static folders are published together.

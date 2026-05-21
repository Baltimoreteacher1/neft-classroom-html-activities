# neft-classroom-html-activities

Static site collection for Mr. Neft's math, ESOL, AI PD, and classroom HTML activities.

This repository is designed for Cloudflare Pages and uses plain HTML, CSS, and a tiny shared JavaScript file. There is no Vite, React, npm, or build system.

## Folder Structure

```text
/
  index.html
  README.md
  AGENTS.md
  assets/
    shared.css
    app.js
  geometry-prep/
    index.html
  surface-area-review/
    index.html
  unit-5-practice/
    index.html
  world-architect-math-project/
    index.html
```

The root `index.html` is the launch dashboard. Each activity lives in its own folder and has its own `index.html`.

Activity URLs use folder-style paths:

```text
/geometry-prep/
/surface-area-review/
/unit-5-practice/
/world-architect-math-project/
```

## Add a New Activity

1. Create a new folder with a short, lowercase, hyphenated name.
2. Add an `index.html` file inside that folder.
3. Link to the new folder from the root `index.html`.
4. Use `/assets/shared.css` for shared styling.
5. Check the new URL in the browser.

Example:

```text
fraction-lab/
  index.html
```

The public URL will be:

```text
/fraction-lab/
```

## Cloudflare Pages Setup

Use these settings:

- Framework preset: `None`
- Build command: leave blank, or use `exit 0` if Cloudflare requires a command
- Build output directory: `/`
- Root directory: leave blank unless deploying a subfolder

Because this is a static HTML repository, Cloudflare Pages can serve the files directly.

## Notes

- Every activity can have its own standalone `index.html`.
- Keep all shared styles in `assets/shared.css` unless an activity truly needs its own local styles.
- Keep shared JavaScript in `assets/app.js` small and optional.
- Do not add external dependencies unless explicitly requested.

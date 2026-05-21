# Mr. Neft's Classroom Activity Hub

`neft-classroom-html-activities` is a plain static HTML collection for Mr. Neft's math, ESOL, AI PD, and classroom activities. It is designed for Cloudflare Pages and does not use Vite, React, npm, or any build system.

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

Shared files:

- `assets/shared.css` provides the classroom design system.
- `assets/app.js` provides small shared behavior, currently the footer year.
- `source-repos.md` maps source repository names to their organized target folders.

## Adding A New Activity

1. Create a folder using a short lowercase URL-safe name under the correct unit or subject folder.
2. Add the full standalone `index.html` inside that folder.
3. Link the activity from the matching collection page and, if it should be immediately visible to students, from the root dashboard.
4. Keep CSS local by linking to `/assets/shared.css`.
5. Avoid external dependencies unless they are explicitly requested and approved.

Every activity can have its own `index.html` inside its folder. Cloudflare Pages will serve that folder at a clean URL that follows the folder path.

## Cloudflare Pages Setup

Use these settings:

- Framework preset: None
- Build command: leave blank or use `exit 0`
- Build output directory: `/`
- Root directory: leave blank unless deploying a subfolder
- Production branch: `main`

## Static Site Notes

This repository is intentionally lightweight. It should work by opening the HTML files directly or by serving the repository as a static site. Keep activities classroom-safe, student-friendly, and Cloudflare Pages-compatible.

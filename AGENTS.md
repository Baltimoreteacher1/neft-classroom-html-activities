# Repository Instructions For Future Codex Work

This is `neft-classroom-html-activities`, a plain static HTML repository for Mr. Neft's ESOL, Reading, Writing, and Math activity hub.

## Core Rules

- Keep this as a static HTML repo unless Mr. Neft explicitly asks for Vite, React, npm, or another build system.
- Add each new activity as its own folder with an `index.html` file.
- Activity folders may live at the top level or inside an organized unit folder such as `unit-5/activity-name/`.
- Preserve existing activities unless explicitly asked to replace them.
- Do not rename activity folders, unit folders, or category folders without updating dashboard links, collection links, `README.md`, and `source-repos.md`.
- Keep files classroom-safe, student-friendly, and Cloudflare Pages-compatible.
- Do not add external dependencies unless explicitly requested.

## Organization Rules

- Use the root `index.html` as the student-facing launch dashboard.
- Use unit/category folder `index.html` files as collection pages.
- Use `source-repos.md` to track where source repository names should be placed in the organized folder structure.
- When replacing a placeholder with a full activity, keep the URL path stable whenever possible.
- Preserve the shared stylesheet path: `/assets/shared.css`.

## Before Finishing

Verify:

- All internal links resolve to existing folders or files.
- Every activity folder has an `index.html`.
- Root dashboard links and collection links are current.
- Every HTML file links to `/assets/shared.css`.
- There are no unexpected external dependencies.
- The repo remains deployable to Cloudflare Pages with framework preset `None`, build command blank or `exit 0`, output directory `/`, and root directory blank.

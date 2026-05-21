# neft-classroom-html-activities Agent Instructions

This repository is a plain static HTML collection for Mr. Neft's classroom activities. Keep it Cloudflare Pages-compatible and easy to maintain.

## Core Rules

- Keep this as a static HTML repo unless Mr. Neft explicitly asks for Vite, React, npm, or another build system.
- Add each new activity as its own folder with its own `index.html`.
- Preserve existing activities unless explicitly asked to replace them.
- Do not rename activity folders without updating the root dashboard links.
- Keep files classroom-safe, student-friendly, and Cloudflare Pages-compatible.
- Do not add external dependencies unless explicitly requested.
- Use local shared assets from `assets/` for common styling or small shared behavior.

## Activity Structure

Each activity should follow this pattern:

```text
activity-folder/
  index.html
```

Public URLs should use folder-style paths:

```text
/activity-folder/
```

## Dashboard Rules

- Keep the root `index.html` as the launch dashboard.
- Add a clear card or link for each activity folder.
- Verify dashboard links whenever an activity is added, removed, or renamed.
- Keep the dashboard polished, accessible, and usable on Chromebooks and teacher laptops.

## Before Finishing

- Verify every activity folder has an `index.html`.
- Verify root `index.html` links to every activity folder.
- Verify internal asset paths are correct.
- Verify there are no broken local links introduced by the change.

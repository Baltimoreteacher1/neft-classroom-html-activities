# neft-classroom-html-activities Agent Instructions

## Repo Purpose

This repo powers Mr. Neft's EduWonderLab / Neft Teacher classroom activity collection: Grade 6 math, ESOL supports, WIDA scaffolds, TWR writing routines, MCAP review, interactive HTML activities, teacher tools, and curriculum launchers. It is mostly static HTML with a Vite build that packages standalone activity folders and generated lesson resources for Cloudflare Pages.

Preserve existing student-facing routes. This repo is live-classroom oriented: clarity, accessibility, deploy safety, and content accuracy matter more than cleverness.

## Folder Map

- `/index.html`: primary launch hub.
- `/assets/`: shared design system, browser helpers, vendor assets, and activity kit files.
- `/engine/`: reusable student activity components and core systems.
- `/lessons/`: generated Reveal Math lesson launchers, notes, handouts, slides, homework, and configs.
- `/math/`, `/unit-*`, `/number-system/`, `/ratios-proportions/`, `/expressions-equations/`, `/statistics-data/`: Grade 6 math hubs and activities.
- `/esol/`, `/esol-reading-writing/`, `/wida-access/`: language-development activities and supports.
- `/teacher-tools/`, `/teacher-data-dashboard/`, `/activity-studio/`, `/curriculum/`: teacher-facing tools and curriculum navigation.
- `/functions/`: Cloudflare Pages Functions.
- `/results-worker/`: separate Cloudflare Worker support package.
- `/tools/`: validation, CardForge, Apps Script, and generation utilities.
- `/scripts/`: curriculum generation, audit, QA, and asset-generation scripts.
- `/docs/`: plans, prompts, QA notes, setup docs, and Codex operating docs.
- `/.codex/`: repo-local Codex config, hooks, agents, and workflows.
- `/.githooks/`: optional Git hooks; do not enable automatically.

## Common Commands

- Install dependencies only when explicitly approved: `npm install`
- Dev server: `npm run dev`
- Preview build: `npm run preview`
- Validate static/curriculum checks: `npm run validate`
- Build: `npm run build`
- Codex preflight: `scripts/codex/codex-preflight.sh`
- Codex verification: `scripts/codex/codex-verify.sh`

## Build, Test, Lint, Typecheck, Deploy

- Package manager: npm with `package-lock.json` when present.
- Build command: `npm run build`
- Validation command: `npm run validate`
- Static validation: `npm run validate:static`
- Reveal Math validation: `npm run validate:reveal-math`
- Deploy command exists: `npm run deploy`
- Do not deploy unless Joel explicitly requests deployment in the current task.
- No top-level lint/typecheck/test scripts are currently defined; do not invent them.

## Default Workflow

1. Inspect relevant files, scripts, configs, generated outputs, and docs before editing.
2. Check `git status --short --branch`; preserve existing dirty work.
3. Identify whether the change belongs to standalone HTML, the Vite build, engine components, generated lesson assets, Cloudflare Functions, or Apps Script tools.
4. Make the smallest complete change in the primary codepath.
5. Avoid changing generated outputs unless the task is about generated artifacts or the repo's existing workflow requires it.
6. Run the narrowest relevant verification first, then `scripts/codex/codex-verify.sh` when feasible.
7. Review changed files before final response.

## Definition Of Done

- Requested behavior is implemented in the correct repo area.
- Existing activity routes, save/resume behavior, analytics-free assumptions, and shared assets are preserved unless explicitly targeted.
- Student-facing UI remains accessible and classroom-ready.
- Curriculum/math/ESOL content is accurate and scaffolded.
- Cloudflare/Vite build assumptions are respected.
- Verification commands run, or blockers are reported exactly.
- Final response includes `Changed`, `Verified`, and `Notes / Risks`.

## Accessibility Requirements

- Use semantic HTML, labels, ordered headings, visible focus states, and keyboard-friendly controls.
- Keep body text at least 16px; student directions and primary actions should usually be larger.
- Maintain high contrast in normal, hover, focus, disabled, and selected states.
- Avoid clipped text, horizontal scrolling, hover-only interactions, tiny controls, and hidden instructions.
- Test meaningful UI changes on Chromebook/tablet/mobile widths.
- Provide print/PDF-friendly alternatives when useful for students, families, or offline classroom recovery.

## Student Privacy Rules

- Collect only what the activity truly needs. Prefer first name, initials, or local-only identifiers.
- Do not add trackers, analytics, external forms, or network submission without explicit approval.
- Do not expose student responses, teacher-only data, answer keys, secrets, KV/D1 IDs beyond existing config, or environment values in student screens.
- Keep save/export local unless the task explicitly requires Cloudflare, Google Workspace, or another backend.

## ESOL, WIDA, And TWR Expectations

- Use clear grade-level language, chunked directions, and short task steps.
- Include WIDA-friendly supports when helpful: vocabulary previews, visuals, sentence frames, word banks, examples, and repeatable routines.
- Use Spanish vocabulary/cognates only when accurate and helpful; avoid large unreviewed translations.
- For TWR writing, include clear prompts, evidence/reasoning stems, and explain-your-thinking routines.
- For math, verify standards alignment, examples, units, answer logic, common misconceptions, and feedback.

## Student Activity Rules

- Student name entry only when relevant; no PIN by default.
- No teacher dashboard unless requested.
- Save/export/print controls must be real if displayed.
- Use retries, hints, feedback, and writing explanations where learning improves.
- Keep answer keys separate from student-facing screens unless Joel requests a teacher-only reveal flow.
- Preserve simple navigation: home/back/retry/reset/print paths should be obvious.

## Cloudflare, Vite, And Static HTML Rules

- Keep Cloudflare Pages output directory as `dist` unless explicitly changing deployment architecture.
- Preserve `_headers`, `_redirects`, `404.html`, `robots.txt`, and production route assumptions.
- Keep Vite copy rules aligned with standalone activity folders and lesson generated assets.
- Do not commit secrets or print environment values.
- Do not run `npm run deploy`, `wrangler deploy`, or `wrangler pages deploy` without explicit request.
- Do not add dependencies unless clearly justified and approved.

## QA Expectations

- Run `npm run validate` after changes that affect routes, activities, curriculum data, shared assets, or build behavior.
- Run `npm run build` before deployment-related handoff or when Vite/build behavior changes.
- Run `scripts/codex/codex-verify.sh` after Codex-system edits and most repo-wide changes.
- Verify no broken local links/assets, placeholder text in newly touched student pages, hidden answer keys, fake save/export features, or console-breaking scripts.
- For Apps Script, verify valid platform APIs and provide run/setup instructions; do not create triggers or deploy scripts without approval.

## When Unsure

Inspect first, choose the smallest safe change, preserve route stability, verify, and report exactly what changed. If a change crosses repo/project boundaries, identify the active root before editing.

## Do Not Do

- Do not delete, move, rename, or overwrite user work without explicit request and backups.
- Do not bypass approvals, configure `danger-full-access`, or change global Codex config.
- Do not deploy, install MCP servers, authenticate services, or install dependencies unless explicitly approved.
- Do not create cron jobs, launch agents, daemons, or background processes.
- Do not add fake features, unsupported APIs, placeholder student copy, dark text on dark backgrounds, tiny fonts, or cluttered navigation.
- Do not expose secrets, credentials, private files, production data, or answer keys in student-facing pages.
